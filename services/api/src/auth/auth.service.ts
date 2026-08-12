import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { DatabaseService } from '../database/database.service';

const scryptAsync = promisify(scrypt);

type UserRow = { id: string; email: string; password_hash: string; status: string };

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  async register(emailInput: string, password: string) {
    const email = emailInput.trim().toLowerCase();
    const passwordHash = await this.hashPassword(password);

    try {
      const result = await this.db.query<UserRow>(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, password_hash, status`,
        [email, passwordHash],
      );
      const user = result.rows[0];
      const token = await this.createSession(user.id);
      return { token, user: await this.me(user.id) };
    } catch (error: any) {
      if (error?.code === '23505') throw new ConflictException('Já existe uma conta com este e-mail.');
      throw error;
    }
  }

  async login(emailInput: string, password: string) {
    const email = emailInput.trim().toLowerCase();
    const result = await this.db.query<UserRow>(
      `SELECT id, email, password_hash, status FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    const user = result.rows[0];

    if (!user || user.status !== 'active' || !(await this.verifyPassword(password, user.password_hash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const token = await this.createSession(user.id);
    return { token, user: await this.me(user.id) };
  }

  async authenticateToken(token: string): Promise<{ userId: string; email: string } | null> {
    if (!token || token.length < 32) return null;
    const tokenHash = this.hashToken(token);
    const result = await this.db.query<{ user_id: string; email: string }>(
      `SELECT s.user_id, u.email
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > now()
         AND u.status = 'active'
       LIMIT 1`,
      [tokenHash],
    );
    const session = result.rows[0];
    if (!session) return null;

    await this.db.query(`UPDATE auth_sessions SET last_seen_at = now() WHERE token_hash = $1`, [tokenHash]);
    return { userId: session.user_id, email: session.email };
  }

  async logout(token: string) {
    await this.db.query(
      `UPDATE auth_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [this.hashToken(token)],
    );
    return { success: true };
  }

  async me(userId: string) {
    const userResult = await this.db.query<{ id: string; email: string; status: string }>(
      `SELECT id, email, status FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const user = userResult.rows[0];
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');

    const [profileResult, trainingResult, equipmentResult, healthResult, painResult, foodResult, weightResult] = await Promise.all([
      this.db.query<any>(`SELECT display_name, birth_date, height_cm, training_level, primary_goal, onboarding_completed_at FROM profiles WHERE user_id = $1`, [userId]),
      this.db.query<any>(`SELECT training_days_per_week, session_minutes FROM training_preferences WHERE user_id = $1`, [userId]),
      this.db.query<{ label: string }>(`SELECT label FROM user_equipment WHERE user_id = $1 ORDER BY label`, [userId]),
      this.db.query<{ label: string }>(`SELECT label FROM health_conditions WHERE user_id = $1 ORDER BY label`, [userId]),
      this.db.query<{ label: string }>(`SELECT label FROM pain_areas WHERE user_id = $1 AND active = true ORDER BY label`, [userId]),
      this.db.query<{ item: string }>(`SELECT item FROM food_restrictions WHERE user_id = $1 ORDER BY item`, [userId]),
      this.db.query<{ weight_kg: string | null }>(`SELECT weight_kg FROM body_metrics WHERE user_id = $1 AND weight_kg IS NOT NULL ORDER BY measured_at DESC LIMIT 1`, [userId]),
    ]);

    const profile = profileResult.rows[0] ?? null;
    const training = trainingResult.rows[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      onboardingCompleted: Boolean(profile?.onboarding_completed_at),
      profile: profile ? {
        displayName: profile.display_name ?? '',
        birthDate: profile.birth_date ?? '',
        heightCm: profile.height_cm ?? '',
        weightKg: weightResult.rows[0]?.weight_kg ?? '',
        primaryGoal: profile.primary_goal ?? '',
        trainingLevel: profile.training_level ?? '',
        trainingDaysPerWeek: training?.training_days_per_week ?? 3,
        sessionMinutes: training?.session_minutes ?? 45,
        equipment: equipmentResult.rows.map((row) => row.label),
        healthConditions: healthResult.rows.map((row) => row.label),
        painAreas: painResult.rows.map((row) => row.label),
        foodRestrictions: foodResult.rows.map((row) => row.item),
      } : null,
    };
  }

  private async createSession(userId: string) {
    const token = randomBytes(48).toString('base64url');
    const days = Math.max(1, Math.min(90, Number(process.env.SESSION_DAYS ?? 30)));
    await this.db.query(
      `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + ($3 * interval '1 day'))`,
      [userId, this.hashToken(token), days],
    );
    return token;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    return `scrypt$${salt}$${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, stored: string) {
    const [algorithm, salt, expectedHex] = stored.split('$');
    if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(expectedHex, 'hex');
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  }
}
