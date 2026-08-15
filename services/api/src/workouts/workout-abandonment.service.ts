import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AbandonWorkoutSessionDto } from './workout-abandonment.dto';

@Injectable()
export class WorkoutAbandonmentService {
  constructor(private readonly db: DatabaseService) {}

  async abandon(userId: string, sessionId: string, input: AbandonWorkoutSessionDto) {
    const sessionResult = await this.db.query<{
      id: string;
      workout_plan_id: string | null;
      completed_at: string | null;
      abandoned_at: string | null;
    }>(
      `SELECT id, workout_plan_id, completed_at, abandoned_at
       FROM workout_sessions
       WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    );
    const session = sessionResult.rows[0];
    if (!session) throw new NotFoundException('Sessão de treino não encontrada.');
    if (session.completed_at) throw new BadRequestException('Este treino já foi concluído e não pode ser abandonado.');

    const countResult = await this.db.query<{ total: string; completed: string }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE completed = true)::text AS completed
       FROM workout_sets
       WHERE workout_session_id = $1`,
      [sessionId],
    );
    const totalBlocks = Number(countResult.rows[0]?.total ?? 0);
    const completedBlocks = Number(countResult.rows[0]?.completed ?? 0);

    if (!session.abandoned_at) {
      await this.db.transaction(async (client) => {
        await client.query(
          `UPDATE workout_sessions
           SET abandoned_at = now(), abandon_reason = $3
           WHERE id = $1 AND user_id = $2 AND completed_at IS NULL AND abandoned_at IS NULL`,
          [sessionId, userId, input.reason],
        );

        if (session.workout_plan_id) {
          await client.query(
            `UPDATE workout_plans
             SET status = 'cancelled'
             WHERE id = $1 AND user_id = $2 AND status <> 'completed'`,
            [session.workout_plan_id, userId],
          );
        }

        await client.query(
          `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
           VALUES ($1, 'workout_session_abandoned', 'workout_session', $2, $3::jsonb)`,
          [
            userId,
            sessionId,
            JSON.stringify({
              reason: input.reason,
              workoutPlanId: session.workout_plan_id,
              completedBlocks,
              totalBlocks,
            }),
          ],
        );
      });
    }

    return {
      abandoned: true,
      reason: input.reason,
      completedBlocks,
      totalBlocks,
    };
  }
}
