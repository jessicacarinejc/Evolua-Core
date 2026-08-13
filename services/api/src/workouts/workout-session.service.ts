import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CompleteWorkoutSessionDto,
  ReportWorkoutEventDto,
  SaveWorkoutSetDto,
  SubstituteWorkoutExerciseDto,
} from './workout-session.dto';
import { WorkoutSafetyService } from './workout-safety.service';

type Goal = 'emagrecimento' | 'hipertrofia' | 'forca' | 'condicionamento' | 'manutencao';

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
  goal: Goal;
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

type CatalogExerciseRow = {
  id: string;
  name: string;
  primary_muscle: string;
  movement_pattern: string;
  equipment: string[];
  instructions: string | null;
  safety_notes: string | null;
  video_url: string | null;
};

type PlannedExerciseContext = CatalogExerciseRow & {
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

type SafetyEventRow = {
  id: string;
  exercise_id: string | null;
  event_type: 'pain' | 'symptom' | 'substitution';
  body_area: string | null;
  severity: number | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

@Injectable()
export class WorkoutSessionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly safety: WorkoutSafetyService,
  ) {}

  private equipmentMatches(exercise: CatalogExerciseRow, equipment: string[]) {
    if (!exercise.equipment.length) return true;
    const normalized = new Set(equipment.map(normalize));
    if (normalized.has('academia completa')) return true;

    const aliases: Record<string, string[]> = {
      halteres: ['halteres'],
      barras: ['barras', 'barra'],
      maquinas: ['maquinas', 'maquina'],
      cabo: ['cabo', 'maquinas'],
      'peso corporal': ['peso corporal'],
      bicicleta: ['bicicleta', 'academia completa'],
      elasticos: ['elasticos'],
    };

    return exercise.equipment.some((item) => {
      const key = normalize(item);
      const accepted = aliases[key] ?? [key];
      return accepted.some((candidate) => normalized.has(candidate));
    });
  }

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
        `INSERT INTO workout_sets (workout_session_id, exercise_id, set_number, load_kg, completed)
         SELECT
           $1,
           wpe.exercise_id,
           generated.set_number,
           CASE WHEN wpe.duration_seconds IS NULL THEN wpe.suggested_load_kg ELSE NULL END,
           false
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

  async reportEvent(userId: string, sessionId: string, input: ReportWorkoutEventDto) {
    const context = await this.getSessionContext(userId, sessionId);
    if (context.session.completed_at) throw new BadRequestException('Este treino já foi finalizado.');
    if (input.type === 'pain' && !input.bodyArea?.trim()) {
      throw new BadRequestException('Informe a área do corpo onde surgiu a dor ou desconforto.');
    }

    if (input.exerciseId) {
      const exerciseResult = await this.db.query<{ id: string }>(
        `SELECT e.id
         FROM workout_plan_exercises wpe
         JOIN exercises e ON e.id = wpe.exercise_id
         WHERE wpe.workout_plan_id = $1 AND e.id = $2`,
        [context.session.workout_plan_id, input.exerciseId],
      );
      if (!exerciseResult.rows[0]) throw new BadRequestException('Exercício não pertence à sessão atual.');
    }

    const eventType = input.type === 'pain' ? 'pain' : 'symptom';
    await this.db.query(
      `INSERT INTO workout_session_events (
         workout_session_id, exercise_id, event_type, body_area, severity, notes, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [
        sessionId,
        input.exerciseId ?? null,
        eventType,
        input.bodyArea?.trim() || null,
        input.severity,
        input.notes?.trim() || null,
        JSON.stringify({ symptomType: input.type }),
      ],
    );

    const stopRecommended = input.severity >= 7 || input.type === 'dizziness' || input.type === 'shortness_of_breath';
    const professionalReviewRecommended = input.severity >= 5 || input.type !== 'pain';

    return {
      saved: true,
      stopRecommended,
      professionalReviewRecommended,
      substitutionRecommended: input.type === 'pain' && input.severity >= 3 && Boolean(input.exerciseId),
      message: stopRecommended
        ? 'Interrompa o treino e priorize sua segurança. Se o sintoma for intenso, incomum ou persistente, procure avaliação adequada.'
        : professionalReviewRecommended
          ? 'O registro foi salvo. Reduza a exigência e considere avaliação profissional antes de insistir no movimento.'
          : 'O registro foi salvo e será considerado nas próximas decisões de segurança do treino.',
      session: await this.getSession(userId, sessionId),
    };
  }

  async substitutionCandidates(userId: string, sessionId: string, exerciseId: string) {
    const { session, plan } = await this.getSessionContext(userId, sessionId);
    if (session.completed_at) throw new BadRequestException('Este treino já foi finalizado.');

    const currentResult = await this.db.query<PlannedExerciseContext>(
      `SELECT
         e.id, e.name, e.primary_muscle, e.movement_pattern, e.equipment,
         e.instructions, e.safety_notes, COALESCE(v.url, e.video_url) AS video_url,
         wpe.sets, wpe.reps_min, wpe.reps_max, wpe.duration_seconds,
         wpe.rest_seconds, wpe.target_rir
       FROM workout_plan_exercises wpe
       JOIN exercises e ON e.id = wpe.exercise_id
       LEFT JOIN LATERAL (
         SELECT ev.url FROM exercise_videos ev
         WHERE ev.exercise_id = e.id
         ORDER BY ev.is_primary DESC, ev.created_at ASC
         LIMIT 1
       ) v ON true
       WHERE wpe.workout_plan_id = $1 AND e.id = $2`,
      [session.workout_plan_id, exerciseId],
    );
    const current = currentResult.rows[0];
    if (!current) throw new BadRequestException('Exercício não pertence a este treino.');

    const equipmentResult = await this.db.query<{ label: string }>(
      `SELECT label FROM user_equipment WHERE user_id = $1 ORDER BY label`,
      [userId],
    );
    const painResult = await this.db.query<{ body_area: string }>(
      `SELECT DISTINCT body_area
       FROM workout_session_events
       WHERE workout_session_id = $1
         AND event_type = 'pain'
         AND severity >= 3
         AND body_area IS NOT NULL`,
      [sessionId],
    );

    const sessionSafety = this.safety.evaluate({
      goal: plan.goal,
      availableMinutes: plan.estimated_minutes ?? 45,
      recoveryScore: 100,
      jointPain: painResult.rows.map((row) => row.body_area),
      availableEquipment: equipmentResult.rows.map((row) => row.label),
    });
    const originalBlocked = Array.isArray(plan.safety_snapshot?.blockedPatterns)
      ? plan.safety_snapshot.blockedPatterns.filter((value): value is string => typeof value === 'string')
      : [];
    const blocked = new Set([...originalBlocked, ...sessionSafety.blockedPatterns]);

    const catalogResult = await this.db.query<CatalogExerciseRow>(
      `SELECT
         e.id, e.name, e.primary_muscle, e.movement_pattern, e.equipment,
         e.instructions, e.safety_notes, COALESCE(v.url, e.video_url) AS video_url
       FROM exercises e
       LEFT JOIN LATERAL (
         SELECT ev.url FROM exercise_videos ev
         WHERE ev.exercise_id = e.id
         ORDER BY ev.is_primary DESC, ev.created_at ASC
         LIMIT 1
       ) v ON true
       WHERE e.active = true
         AND e.id <> $1
         AND (e.primary_muscle = $2 OR e.movement_pattern = $3)
       ORDER BY
         CASE WHEN e.movement_pattern = $3 THEN 0 ELSE 1 END,
         CASE WHEN e.primary_muscle = $2 THEN 0 ELSE 1 END,
         e.name`,
      [current.id, current.primary_muscle, current.movement_pattern],
    );

    const equipment = equipmentResult.rows.map((row) => row.label);
    const candidates = catalogResult.rows
      .filter((exercise) => !blocked.has(exercise.movement_pattern))
      .filter((exercise) => this.equipmentMatches(exercise, equipment))
      .slice(0, 5)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primary_muscle,
        movementPattern: exercise.movement_pattern,
        instructions: exercise.instructions,
        safetyNotes: exercise.safety_notes,
        videoUrl: exercise.video_url,
        reason: exercise.movement_pattern === current.movement_pattern
          ? 'Mantém o padrão de movimento com uma alternativa de execução compatível.'
          : 'Mantém o grupo muscular usando um padrão diferente que não está bloqueado pela segurança atual.',
      }));

    return {
      currentExercise: { id: current.id, name: current.name, primaryMuscle: current.primary_muscle },
      candidates,
      safety: {
        blockedPatterns: [...blocked],
        painAreas: painResult.rows.map((row) => row.body_area),
      },
    };
  }

  async substituteExercise(userId: string, sessionId: string, input: SubstituteWorkoutExerciseDto) {
    const { session } = await this.getSessionContext(userId, sessionId);
    if (session.completed_at) throw new BadRequestException('Este treino já foi finalizado.');

    const completedResult = await this.db.query<{ total: string }>(
      `SELECT COUNT(*) FILTER (WHERE completed = true)::text AS total
       FROM workout_sets
       WHERE workout_session_id = $1 AND exercise_id = $2`,
      [sessionId, input.currentExerciseId],
    );
    if (Number(completedResult.rows[0]?.total ?? 0) > 0) {
      throw new BadRequestException('Por segurança, a troca automática é permitida antes da primeira série do exercício. Registre o desconforto e interrompa o movimento se ele já tiver sido iniciado.');
    }

    const candidates = await this.substitutionCandidates(userId, sessionId, input.currentExerciseId);
    const replacement = candidates.candidates.find((candidate) => candidate.id === input.replacementExerciseId);
    if (!replacement) {
      throw new BadRequestException('A substituição escolhida não é compatível com as regras de segurança atuais.');
    }

    const plannedResult = await this.db.query<{
      sets: number;
      reps_min: number | null;
      reps_max: number | null;
      duration_seconds: number | null;
      rest_seconds: number;
      target_rir: number;
    }>(
      `SELECT sets, reps_min, reps_max, duration_seconds, rest_seconds, target_rir
       FROM workout_plan_exercises
       WHERE workout_plan_id = $1 AND exercise_id = $2`,
      [session.workout_plan_id, input.currentExerciseId],
    );
    const planned = plannedResult.rows[0];
    if (!planned) throw new BadRequestException('Exercício original não pertence ao plano atual.');

    await this.db.transaction(async (client) => {
      await client.query(
        `UPDATE workout_plan_exercises
         SET exercise_id = $3, suggested_load_kg = NULL,
             notes = CASE
               WHEN $4::text IS NULL THEN notes
               ELSE CONCAT_WS(' | ', NULLIF(notes, ''), $4::text)
             END
         WHERE workout_plan_id = $1 AND exercise_id = $2`,
        [
          session.workout_plan_id,
          input.currentExerciseId,
          input.replacementExerciseId,
          input.reason?.trim() || 'Substituído durante a sessão por segurança/conforto.',
        ],
      );

      await client.query(
        `DELETE FROM workout_sets
         WHERE workout_session_id = $1 AND exercise_id = $2 AND completed = false`,
        [sessionId, input.currentExerciseId],
      );

      await client.query(
        `INSERT INTO workout_sets (workout_session_id, exercise_id, set_number, completed)
         SELECT $1, $2, generated.set_number, false
         FROM generate_series(1, $3::integer) AS generated(set_number)
         ON CONFLICT (workout_session_id, exercise_id, set_number) DO NOTHING`,
        [sessionId, input.replacementExerciseId, planned.sets],
      );

      await client.query(
        `INSERT INTO workout_session_events (
           workout_session_id, exercise_id, event_type, notes, metadata
         ) VALUES ($1,$2,'substitution',$3,$4::jsonb)`,
        [
          sessionId,
          input.replacementExerciseId,
          input.reason?.trim() || 'Substituição de exercício durante a sessão.',
          JSON.stringify({
            originalExerciseId: input.currentExerciseId,
            replacementExerciseId: input.replacementExerciseId,
          }),
        ],
      );
    });

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

    const eventResult = await this.db.query<SafetyEventRow>(
      `SELECT id, exercise_id, event_type, body_area, severity, notes, metadata, created_at
       FROM workout_session_events
       WHERE workout_session_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
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
      safetyEvents: eventResult.rows.map((event) => ({
        id: event.id,
        exerciseId: event.exercise_id,
        type: event.event_type,
        bodyArea: event.body_area,
        severity: event.severity,
        notes: event.notes,
        metadata: event.metadata,
        createdAt: event.created_at,
      })),
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
