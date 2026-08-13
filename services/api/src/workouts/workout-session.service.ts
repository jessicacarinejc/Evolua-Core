import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CompleteWorkoutSessionDto, SaveWorkoutSetDto } from './workout-session.dto';

type SessionRow = {
  id: string;
  workout_plan_id: string;
  started_at: string;
  completed_at: string | null;
  perceived_effort: number | null;
  feedback: string | null;
};

type PlanRow = {
  id: string;
  goal: string;
  estimated_minutes: number | null;
  safety_snapshot: Record<string, unknown>;
};

type ExerciseRow = {
  id: string;
  name: string;
  primary_muscle: string;
  instructions: string | null;
  video_url: string | null;
  video_license: string | null;
  video_attribution: string | null;
  sequence: number;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
  rest_seconds: number;
  target_rir: number;
};

type SetRow = {
  id: string;
  exercise_id: string;
  set_number: number;
  repetitions: number | null;
  load_kg: string | null;
  duration_seconds: number | null;
  rir: string | null;
  completed: boolean;
  completed_at: string | null;
};

@Injectable()
export class WorkoutSessionService {
  constructor(private readonly db: DatabaseService) {}

  async start(userId: string, planId: string) {
    const planResult = await this.db.query<PlanRow & { status: string }>(
      `SELECT id, goal, estimated_minutes, safety_snapshot, status
       FROM workout_plans
       WHERE id = $1 AND user_id = $2`,
      [planId, userId],
    );
    const plan = planResult.rows[0];
    if (!plan) throw new NotFoundException('Treino não encontrado.');
    if (plan.status === 'completed' || plan.status === 'cancelled') {
      throw new BadRequestException('Este treino não pode mais ser iniciado.');
    }

    const existingResult = await this.db.query<{ id: string }>(
      `SELECT id FROM workout_sessions
       WHERE user_id = $1 AND workout_plan_id = $2 AND completed_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1`,
      [userId, planId],
    );
    if (existingResult.rows[0]) return this.getSession(userId, existingResult.rows[0].id);

    const sessionId = await this.db.transaction(async (client) => {
      const sessionResult = await client.query<{ id: string }>(
        `INSERT INTO workout_sessions (user_id, workout_plan_id, started_at)
         VALUES ($1, $2, now())
         RETURNING id`,
        [userId, planId],
      );
      const id = sessionResult.rows[0].id;

      await client.query(
        `UPDATE workout_plans SET status = 'active' WHERE id = $1 AND user_id = $2`,
        [planId, userId],
      );

      await client.query(
        `INSERT INTO workout_sets (workout_session_id, exercise_id, set_number, completed)
         SELECT $1, wpe.exercise_id, generated.set_number, false
         FROM workout_plan_exercises wpe
         CROSS JOIN LATERAL generate_series(1, wpe.sets) AS generated(set_number)
         WHERE wpe.workout_plan_id = $2
         ON CONFLICT (workout_session_id, exercise_id, set_number) DO NOTHING`,
        [id, planId],
      );

      return id;
    });

    return this.getSession(userId, sessionId);
  }

  async getActive(userId: string) {
    const result = await this.db.query<{ id: string }>(
      `SELECT id
       FROM workout_sessions
       WHERE user_id = $1 AND completed_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1`,
      [userId],
    );
    if (!result.rows[0]) return { session: null };
    return { session: await this.getSession(userId, result.rows[0].id) };
  }

  async saveSet(userId: string, sessionId: string, input: SaveWorkoutSetDto) {
    const context = await this.getSessionContext(userId, sessionId);
    if (context.session.completed_at) throw new BadRequestException('Este treino já foi finalizado.');

    const plannedResult = await this.db.query<{ sets: number }>(
      `SELECT wpe.sets
       FROM workout_plan_exercises wpe
       WHERE wpe.workout_plan_id = $1 AND wpe.exercise_id = $2`,
      [context.session.workout_plan_id, input.exerciseId],
    );
    const planned = plannedResult.rows[0];
    if (!planned) throw new BadRequestException('Exercício não pertence a este treino.');
    if (input.setNumber > planned.sets) throw new BadRequestException('Número da série acima do planejado.');

    const completed = input.completed ?? true;
    if (completed && input.repetitions == null && input.durationSeconds == null) {
      throw new BadRequestException('Informe repetições ou duração para concluir a série.');
    }

    await this.db.query(
      `INSERT INTO workout_sets (
         workout_session_id, exercise_id, set_number, repetitions, load_kg,
         duration_seconds, rir, completed, completed_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CASE WHEN $8 THEN now() ELSE NULL END)
       ON CONFLICT (workout_session_id, exercise_id, set_number)
       DO UPDATE SET
         repetitions = EXCLUDED.repetitions,
         load_kg = EXCLUDED.load_kg,
         duration_seconds = EXCLUDED.duration_seconds,
         rir = EXCLUDED.rir,
         completed = EXCLUDED.completed,
         completed_at = CASE WHEN EXCLUDED.completed THEN now() ELSE NULL END`,
      [
        sessionId,
        input.exerciseId,
        input.setNumber,
        input.repetitions ?? null,
        input.loadKg ?? null,
        input.durationSeconds ?? null,
        input.rir ?? null,
        completed,
      ],
    );

    return this.getSession(userId, sessionId);
  }

  async complete(userId: string, sessionId: string, input: CompleteWorkoutSessionDto) {
    const context = await this.getSessionContext(userId, sessionId);
    if (context.session.completed_at) return this.summary(userId, sessionId);

    const progressResult = await this.db.query<{ total: string; completed: string }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE completed = true)::text AS completed
       FROM workout_sets
       WHERE workout_session_id = $1`,
      [sessionId],
    );
    const total = Number(progressResult.rows[0]?.total ?? 0);
    const completed = Number(progressResult.rows[0]?.completed ?? 0);
    if (total === 0 || completed < total) {
      throw new BadRequestException(`Conclua as séries planejadas antes de finalizar o treino (${completed}/${total}).`);
    }

    await this.db.transaction(async (client) => {
      await client.query(
        `UPDATE workout_sessions
         SET completed_at = now(), perceived_effort = $3, feedback = $4
         WHERE id = $1 AND user_id = $2`,
        [sessionId, userId, input.perceivedEffort, input.feedback?.trim() || null],
      );
      await client.query(
        `UPDATE workout_plans SET status = 'completed'
         WHERE id = $1 AND user_id = $2`,
        [context.session.workout_plan_id, userId],
      );
    });

    return this.summary(userId, sessionId);
  }

  async getSession(userId: string, sessionId: string) {
    const { session, plan } = await this.getSessionContext(userId, sessionId);

    const exerciseResult = await this.db.query<ExerciseRow>(
      `SELECT
         e.id, e.name, e.primary_muscle, e.instructions,
         COALESCE(v.url, e.video_url) AS video_url,
         v.license AS video_license,
         v.attribution AS video_attribution,
         wpe.sequence, wpe.sets, wpe.reps_min, wpe.reps_max,
         wpe.duration_seconds, wpe.rest_seconds, wpe.target_rir
       FROM workout_plan_exercises wpe
       JOIN exercises e ON e.id = wpe.exercise_id
       LEFT JOIN LATERAL (
         SELECT ev.url, ev.license, ev.attribution FROM exercise_videos ev
         WHERE ev.exercise_id = e.id
         ORDER BY ev.is_primary DESC, ev.created_at ASC
         LIMIT 1
       ) v ON true
       WHERE wpe.workout_plan_id = $1
       ORDER BY wpe.sequence`,
      [session.workout_plan_id],
    );

    const setResult = await this.db.query<SetRow>(
      `SELECT id, exercise_id, set_number, repetitions, load_kg,
              duration_seconds, rir, completed, completed_at
       FROM workout_sets
       WHERE workout_session_id = $1
       ORDER BY exercise_id, set_number`,
      [sessionId],
    );

    return {
      id: session.id,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      perceivedEffort: session.perceived_effort,
      feedback: session.feedback,
      plan: {
        id: plan.id,
        goal: plan.goal,
        estimatedMinutes: plan.estimated_minutes,
        safety: plan.safety_snapshot,
      },
      exercises: exerciseResult.rows.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primary_muscle,
        instructions: exercise.instructions,
        videoUrl: exercise.video_url,
        videoLicense: exercise.video_license,
        videoAttribution: exercise.video_attribution,
        order: exercise.sequence,
        plannedSets: exercise.sets,
        repsMin: exercise.reps_min,
        repsMax: exercise.reps_max,
        durationSeconds: exercise.duration_seconds,
        restSeconds: exercise.rest_seconds,
        targetRir: exercise.target_rir,
        sets: setResult.rows
          .filter((set) => set.exercise_id === exercise.id)
          .map((set) => ({
            id: set.id,
            setNumber: set.set_number,
            repetitions: set.repetitions,
            loadKg: set.load_kg == null ? null : Number(set.load_kg),
            durationSeconds: set.duration_seconds,
            rir: set.rir == null ? null : Number(set.rir),
            completed: set.completed,
            completedAt: set.completed_at,
          })),
      })),
    };
  }

  private async getSessionContext(userId: string, sessionId: string) {
    const sessionResult = await this.db.query<SessionRow>(
      `SELECT id, workout_plan_id, started_at, completed_at, perceived_effort, feedback
       FROM workout_sessions
       WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    );
    const session = sessionResult.rows[0];
    if (!session) throw new NotFoundException('Sessão de treino não encontrada.');

    const planResult = await this.db.query<PlanRow>(
      `SELECT id, goal, estimated_minutes, safety_snapshot
       FROM workout_plans
       WHERE id = $1 AND user_id = $2`,
      [session.workout_plan_id, userId],
    );
    const plan = planResult.rows[0];
    if (!plan) throw new NotFoundException('Plano do treino não encontrado.');
    return { session, plan };
  }

  private async summary(userId: string, sessionId: string) {
    const session = await this.getSession(userId, sessionId);
    const sets = session.exercises.flatMap((exercise) => exercise.sets);
    const totalVolumeKg = sets.reduce((total, set) => total + ((set.loadKg ?? 0) * (set.repetitions ?? 0)), 0);
    const completedSets = sets.filter((set) => set.completed).length;
    const started = new Date(session.startedAt).getTime();
    const ended = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();

    return {
      session,
      summary: {
        completedSets,
        totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
        durationMinutes: Math.max(1, Math.round((ended - started) / 60000)),
        perceivedEffort: session.perceivedEffort,
      },
    };
  }
}
