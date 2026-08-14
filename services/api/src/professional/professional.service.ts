import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AssignProfessionalDto, CreateProfessionalReviewDto, SetUserRoleDto } from './professional.dto';

type Role = 'user' | 'professional' | 'admin';

type Actor = { id: string; email: string; role: Role };

@Injectable()
export class ProfessionalService {
  constructor(private readonly db: DatabaseService) {}

  async me(userId: string) {
    const actor = await this.actor(userId);
    return { id: actor.id, email: actor.email, role: actor.role };
  }

  async listClients(userId: string) {
    const actor = await this.requireStaff(userId);
    const params: unknown[] = [];
    const assignmentFilter = actor.role === 'admin'
      ? ''
      : `AND EXISTS (
           SELECT 1 FROM professional_assignments pa
           WHERE pa.professional_user_id = $1
             AND pa.client_user_id = u.id
             AND pa.active = true
         )`;
    if (actor.role !== 'admin') params.push(actor.id);

    const result = await this.db.query<any>(
      `SELECT
         u.id,
         u.email,
         p.display_name,
         p.primary_goal,
         p.training_level,
         p.onboarding_completed_at,
         (SELECT dc.status FROM daily_checkins dc WHERE dc.user_id = u.id ORDER BY dc.checkin_date DESC LIMIT 1) AS latest_checkin_status,
         (SELECT dc.checkin_date::text FROM daily_checkins dc WHERE dc.user_id = u.id ORDER BY dc.checkin_date DESC LIMIT 1) AS latest_checkin_date,
         (SELECT count(*)::int FROM professional_reviews pr WHERE pr.client_user_id = u.id AND pr.status = 'open') AS open_reviews
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.status = 'active' AND u.role = 'user'
       ${assignmentFilter}
       ORDER BY COALESCE(p.display_name, u.email)`,
      params,
    );

    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name ?? '',
      primaryGoal: row.primary_goal ?? '',
      trainingLevel: row.training_level ?? '',
      onboardingCompleted: Boolean(row.onboarding_completed_at),
      latestCheckinStatus: row.latest_checkin_status ?? null,
      latestCheckinDate: row.latest_checkin_date ?? null,
      openReviews: Number(row.open_reviews ?? 0),
    }));
  }

  async clientOverview(userId: string, clientUserId: string) {
    const actor = await this.requireStaff(userId);
    await this.assertClientAccess(actor, clientUserId);

    const [profileResult, metricsResult, workoutResult, nutritionResult, safetyResult, reviewResult] = await Promise.all([
      this.db.query<any>(
        `SELECT u.id, u.email, p.display_name, p.birth_date, p.primary_goal, p.training_level,
                tp.training_days_per_week, tp.session_minutes
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         LEFT JOIN training_preferences tp ON tp.user_id = u.id
         WHERE u.id = $1 AND u.status = 'active'`,
        [clientUserId],
      ),
      this.db.query<any>(
        `SELECT measured_at, weight_kg, body_fat_percent, waist_cm
         FROM body_metrics WHERE user_id = $1
         ORDER BY measured_at DESC LIMIT 12`,
        [clientUserId],
      ),
      this.db.query<any>(
        `SELECT ws.id, ws.started_at, ws.completed_at, ws.perceived_effort, wp.goal, wp.planned_date
         FROM workout_sessions ws
         LEFT JOIN workout_plans wp ON wp.id = ws.workout_plan_id
         WHERE ws.user_id = $1
         ORDER BY COALESCE(ws.completed_at, ws.started_at) DESC NULLS LAST LIMIT 12`,
        [clientUserId],
      ),
      this.db.query<any>(
        `SELECT
           COALESCE((SELECT sum(h.amount_ml)::int FROM hydration_logs h WHERE h.user_id = $1 AND h.logged_at::date = CURRENT_DATE), 0) AS water_ml,
           (SELECT count(*)::int FROM meal_logs ml WHERE ml.user_id = $1 AND ml.consumed_at::date = CURRENT_DATE) AS meals_today`,
        [clientUserId],
      ),
      this.db.query<any>(
        `SELECT event_type, severity, body_region, created_at
         FROM workout_session_events
         WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 12`,
        [clientUserId],
      ),
      this.db.query<any>(
        `SELECT pr.id, pr.review_type, pr.status, pr.note, pr.created_at, pr.resolved_at,
                u.email AS professional_email
         FROM professional_reviews pr
         JOIN users u ON u.id = pr.professional_user_id
         WHERE pr.client_user_id = $1
         ORDER BY pr.created_at DESC LIMIT 20`,
        [clientUserId],
      ),
    ]);

    const profile = profileResult.rows[0];
    if (!profile) throw new NotFoundException('Usuário não encontrado.');

    await this.audit(actor.id, 'professional.client_view', 'user', clientUserId, { role: actor.role });

    return {
      profile: {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name ?? '',
        birthDate: profile.birth_date ?? null,
        primaryGoal: profile.primary_goal ?? '',
        trainingLevel: profile.training_level ?? '',
        trainingDaysPerWeek: profile.training_days_per_week ?? null,
        sessionMinutes: profile.session_minutes ?? null,
      },
      bodyMetrics: metricsResult.rows,
      recentWorkouts: workoutResult.rows,
      nutritionToday: nutritionResult.rows[0] ?? { water_ml: 0, meals_today: 0 },
      recentSafetyEvents: safetyResult.rows,
      reviews: reviewResult.rows,
    };
  }

  async createReview(userId: string, dto: CreateProfessionalReviewDto) {
    const actor = await this.requireStaff(userId);
    await this.assertClientAccess(actor, dto.clientUserId);
    const result = await this.db.query<any>(
      `INSERT INTO professional_reviews (professional_user_id, client_user_id, review_type, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, review_type, status, note, created_at`,
      [actor.id, dto.clientUserId, dto.reviewType, dto.note.trim()],
    );
    await this.audit(actor.id, 'professional.review_created', 'user', dto.clientUserId, { reviewType: dto.reviewType });
    return result.rows[0];
  }

  async listUsers(userId: string) {
    const actor = await this.requireAdmin(userId);
    const result = await this.db.query<any>(
      `SELECT u.id, u.email, u.role, u.status, u.created_at, p.display_name
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       ORDER BY u.created_at DESC`,
    );
    await this.audit(actor.id, 'admin.users_list', 'user', null, {});
    return result.rows.map((row) => ({ ...row, displayName: row.display_name ?? '' }));
  }

  async setRole(userId: string, dto: SetUserRoleDto) {
    const actor = await this.requireAdmin(userId);
    const result = await this.db.query<any>(
      `UPDATE users SET role = $1, updated_at = now()
       WHERE email = lower($2) AND status = 'active'
       RETURNING id, email, role`,
      [dto.role, dto.email.trim().toLowerCase()],
    );
    const target = result.rows[0];
    if (!target) throw new NotFoundException('Conta ativa não encontrada.');
    await this.audit(actor.id, 'admin.role_changed', 'user', target.id, { role: dto.role });
    return target;
  }

  async assignProfessional(userId: string, dto: AssignProfessionalDto) {
    const actor = await this.requireAdmin(userId);
    const professional = await this.db.query<{ role: Role }>(`SELECT role FROM users WHERE id = $1 AND status = 'active'`, [dto.professionalUserId]);
    if (!['professional', 'admin'].includes(professional.rows[0]?.role ?? 'user')) {
      throw new ForbiddenException('A conta selecionada não possui papel profissional.');
    }
    const client = await this.db.query<{ role: Role }>(`SELECT role FROM users WHERE id = $1 AND status = 'active'`, [dto.clientUserId]);
    if (client.rows[0]?.role !== 'user') throw new ForbiddenException('O cliente precisa ser uma conta de usuário.');

    const result = await this.db.query<any>(
      `INSERT INTO professional_assignments (professional_user_id, client_user_id, created_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (professional_user_id, client_user_id)
       DO UPDATE SET active = true, ended_at = NULL, created_by = EXCLUDED.created_by
       RETURNING id, professional_user_id, client_user_id, active, created_at`,
      [dto.professionalUserId, dto.clientUserId, actor.id],
    );
    await this.audit(actor.id, 'admin.professional_assigned', 'user', dto.clientUserId, { professionalUserId: dto.professionalUserId });
    return result.rows[0];
  }

  private async actor(userId: string): Promise<Actor> {
    const result = await this.db.query<Actor>(`SELECT id, email, role FROM users WHERE id = $1 AND status = 'active'`, [userId]);
    const actor = result.rows[0];
    if (!actor) throw new ForbiddenException('Conta sem acesso.');
    return actor;
  }

  private async requireStaff(userId: string) {
    const actor = await this.actor(userId);
    if (!['professional', 'admin'].includes(actor.role)) throw new ForbiddenException('Acesso restrito ao portal profissional.');
    return actor;
  }

  private async requireAdmin(userId: string) {
    const actor = await this.actor(userId);
    if (actor.role !== 'admin') throw new ForbiddenException('Acesso administrativo necessário.');
    return actor;
  }

  private async assertClientAccess(actor: Actor, clientUserId: string) {
    if (actor.role === 'admin') return;
    const result = await this.db.query(
      `SELECT 1 FROM professional_assignments
       WHERE professional_user_id = $1 AND client_user_id = $2 AND active = true LIMIT 1`,
      [actor.id, clientUserId],
    );
    if (!result.rowCount) throw new ForbiddenException('Usuário não vinculado a este profissional.');
  }

  private async audit(actorUserId: string, action: string, resourceType: string, resourceId: string | null, metadata: Record<string, unknown>) {
    await this.db.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [actorUserId, action, resourceType, resourceId, JSON.stringify(metadata)],
    );
  }
}
