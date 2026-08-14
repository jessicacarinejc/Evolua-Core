import { BadRequestException, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { AuthService } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { OnboardingDto } from '../onboarding/onboarding.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
  ) {}

  async get(userId: string) {
    const user = await this.auth.me(userId);
    return { profile: user.profile };
  }

  async update(userId: string, input: OnboardingDto, safety: unknown) {
    const birthDate = this.normalizeDate(input.birthDate);
    const currentWeight = await this.db.query<{ weight_kg: string | null }>(
      `SELECT weight_kg FROM body_metrics
       WHERE user_id = $1 AND weight_kg IS NOT NULL
       ORDER BY measured_at DESC LIMIT 1`,
      [userId],
    );
    const previousWeight = currentWeight.rows[0]?.weight_kg == null ? null : Number(currentWeight.rows[0].weight_kg);

    await this.db.transaction(async (client) => {
      await client.query(
        `INSERT INTO profiles (user_id, display_name, birth_date, height_cm, training_level, primary_goal, onboarding_completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,now())
         ON CONFLICT (user_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           birth_date = EXCLUDED.birth_date,
           height_cm = EXCLUDED.height_cm,
           training_level = EXCLUDED.training_level,
           primary_goal = EXCLUDED.primary_goal,
           updated_at = now()`,
        [userId, input.displayName.trim(), birthDate, input.heightCm, input.trainingLevel, input.primaryGoal],
      );

      await client.query(
        `INSERT INTO training_preferences (user_id, training_days_per_week, session_minutes)
         VALUES ($1,$2,$3)
         ON CONFLICT (user_id) DO UPDATE SET
           training_days_per_week = EXCLUDED.training_days_per_week,
           session_minutes = EXCLUDED.session_minutes,
           updated_at = now()`,
        [userId, input.trainingDaysPerWeek, input.sessionMinutes],
      );

      if (previousWeight == null || Math.abs(previousWeight - input.weightKg) >= 0.05) {
        await client.query(`INSERT INTO body_metrics (user_id, weight_kg) VALUES ($1,$2)`, [userId, input.weightKg]);
      }

      await this.replaceEquipment(client, userId, input.equipment);
      await this.replaceUserHealthConditions(client, userId, input.healthConditions);
      await this.replacePainAreas(client, userId, input.painAreas);
      await this.replaceFoodRestrictions(client, userId, input.foodRestrictions);

      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
         VALUES ($1::uuid,'profile.updated','profile',$2::text,$3::jsonb)`,
        [userId, userId, JSON.stringify({ safety })],
      );
    });

    const user = await this.auth.me(userId);
    return { saved: true, profile: user.profile };
  }

  private async replaceEquipment(client: PoolClient, userId: string, labels: string[]) {
    await client.query(`DELETE FROM user_equipment WHERE user_id = $1`, [userId]);
    for (const rawLabel of labels) {
      const label = rawLabel.trim();
      if (!label) continue;
      await client.query(
        `INSERT INTO user_equipment (user_id, equipment_code, label)
         VALUES ($1,$2,$3)
         ON CONFLICT (user_id, equipment_code) DO UPDATE SET label = EXCLUDED.label`,
        [userId, this.slug(label), label],
      );
    }
  }

  private async replaceUserHealthConditions(client: PoolClient, userId: string, labels: string[]) {
    await client.query(
      `DELETE FROM health_conditions
       WHERE user_id = $1 AND confirmed_by_professional = false`,
      [userId],
    );
    for (const rawLabel of labels.filter((value) => !value.toLowerCase().startsWith('nenhuma'))) {
      const label = rawLabel.trim();
      if (!label) continue;
      await client.query(
        `INSERT INTO health_conditions (user_id, code, label, severity, confirmed_by_professional)
         SELECT $1,$2,$3,$4,false
         WHERE NOT EXISTS (
           SELECT 1 FROM health_conditions
           WHERE user_id = $1 AND lower(trim(label)) = lower(trim($3))
         )`,
        [userId, this.slug(label), label, this.conditionSeverity(label)],
      );
    }
  }

  private async replacePainAreas(client: PoolClient, userId: string, labels: string[]) {
    await client.query(`DELETE FROM pain_areas WHERE user_id = $1`, [userId]);
    for (const rawLabel of labels) {
      const label = rawLabel.trim();
      if (!label) continue;
      await client.query(
        `INSERT INTO pain_areas (user_id, area_code, label) VALUES ($1,$2,$3)`,
        [userId, this.slug(label), label],
      );
    }
  }

  private async replaceFoodRestrictions(client: PoolClient, userId: string, labels: string[]) {
    const existingHard = await client.query<{ item: string }>(
      `SELECT item FROM food_restrictions WHERE user_id = $1 AND hard_block = true`,
      [userId],
    );
    const merged = new Map<string, string>();
    for (const item of [...existingHard.rows.map((row) => row.item), ...labels]) {
      const clean = item.trim();
      if (clean) merged.set(this.slug(clean), clean);
    }

    await client.query(`DELETE FROM food_restrictions WHERE user_id = $1`, [userId]);
    for (const item of merged.values()) {
      const classification = this.classifyRestriction(item);
      await client.query(
        `INSERT INTO food_restrictions (user_id, type, item, hard_block) VALUES ($1,$2,$3,$4)`,
        [userId, classification.type, item, classification.hardBlock],
      );
    }
  }

  private normalizeDate(value: string) {
    const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    throw new BadRequestException('Data de nascimento inválida. Use DD/MM/AAAA.');
  }

  private slug(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private conditionSeverity(label: string) {
    const normalized = this.slug(label);
    return ['cardiopatia', 'gestacao', 'doenca-renal'].includes(normalized) ? 'critica' : 'atencao';
  }

  private classifyRestriction(item: string): { type: string; hardBlock: boolean } {
    const normalized = this.slug(item);
    if (['vegetariano', 'vegano'].includes(normalized)) return { type: 'preferencia', hardBlock: true };
    if (['amendoim', 'frutos-do-mar', 'ovos'].includes(normalized)) return { type: 'alergia', hardBlock: true };
    if (['lactose', 'gluten'].includes(normalized)) return { type: 'intolerancia', hardBlock: true };
    return { type: 'preferencia', hardBlock: false };
  }
}
