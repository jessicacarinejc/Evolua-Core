import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WorkoutSafetyService } from './workout-safety.service';

type ProfileRow = {
  primary_goal: 'emagrecimento' | 'hipertrofia' | 'forca' | 'condicionamento' | 'manutencao';
  training_level: 'iniciante' | 'intermediario' | 'avancado';
  training_days_per_week: number;
  session_minutes: number;
};

type CheckinRow = {
  available_minutes: number;
  recovery_score: number;
  status: 'ready' | 'modified' | 'recovery' | 'professional_review_required';
  pain_areas: string[];
};

type ExerciseRow = {
  id: string;
  slug: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  movement_pattern: string;
  equipment: string[];
  instructions: string | null;
  safety_notes: string | null;
  video_url: string | null;
};

type PlannedExercise = ExerciseRow & {
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  durationSeconds: number | null;
  restSeconds: number;
  targetRir: number;
  suggestedLoadKg: number | null;
};

type HistorySetRow = {
  session_id: string;
  completed_at: string;
  repetitions: number;
  load_kg: string;
  rir: string | null;
  reps_max: number | null;
  target_rir: string | null;
};

type RecentSafetyEventRow = {
  event_type: 'pain' | 'symptom' | 'substitution';
  body_area: string | null;
  severity: number | null;
  symptom_type: string | null;
  created_at: string;
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

const splitMuscles: Record<string, string[]> = {
  'corpo inteiro': ['quadriceps', 'gluteos', 'posteriores', 'peitoral', 'costas', 'ombros', 'core'],
  superior: ['peitoral', 'costas', 'ombros', 'biceps', 'triceps', 'core'],
  inferior: ['quadriceps', 'gluteos', 'posteriores', 'panturrilhas', 'core'],
  empurrar: ['peitoral', 'ombros', 'triceps'],
  puxar: ['costas', 'biceps'],
  pernas: ['quadriceps', 'gluteos', 'posteriores', 'panturrilhas'],
  recuperacao: ['cardiorrespiratorio', 'core'],
};

@Injectable()
export class WorkoutEngineService {
  constructor(
    private readonly db: DatabaseService,
    private readonly safety: WorkoutSafetyService,
  ) {}

  private async loadContext(userId: string) {
    const profileResult = await this.db.query<ProfileRow>(
      `SELECT
         p.primary_goal,
         p.training_level,
         COALESCE(tp.training_days_per_week, 3) AS training_days_per_week,
         COALESCE(tp.session_minutes, 45) AS session_minutes
       FROM profiles p
       LEFT JOIN training_preferences tp ON tp.user_id = p.user_id
       WHERE p.user_id = $1`,
      [userId],
    );

    if (!profileResult.rows[0]?.primary_goal || !profileResult.rows[0]?.training_level) {
      throw new BadRequestException('Conclua a configuração inicial antes de gerar o treino.');
    }

    const checkinResult = await this.db.query<CheckinRow>(
      `SELECT available_minutes, recovery_score, status, pain_areas
       FROM daily_checkins
       WHERE user_id = $1 AND checkin_date = CURRENT_DATE
       LIMIT 1`,
      [userId],
    );

    const checkin = checkinResult.rows[0];
    if (!checkin) {
      throw new BadRequestException('Faça o check-in de hoje antes de gerar o treino.');
    }
    if (checkin.status === 'professional_review_required') {
      throw new BadRequestException('O check-in de hoje requer revisão profissional antes de gerar treino automático.');
    }

    const equipmentResult = await this.db.query<{ label: string }>(
      `SELECT label FROM user_equipment WHERE user_id = $1 ORDER BY label`,
      [userId],
    );

    const sessionsResult = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM workout_sessions
       WHERE user_id = $1 AND completed_at IS NOT NULL`,
      [userId],
    );

    const recentSafetyResult = await this.db.query<RecentSafetyEventRow>(
      `SELECT
         wse.event_type,
         wse.body_area,
         wse.severity,
         wse.metadata->>'symptomType' AS symptom_type,
         wse.created_at
       FROM workout_session_events wse
       JOIN workout_sessions ws ON ws.id = wse.workout_session_id
       WHERE ws.user_id = $1
         AND wse.created_at >= now() - interval '7 days'
         AND wse.event_type IN ('pain','symptom')
       ORDER BY wse.created_at DESC
       LIMIT 30`,
      [userId],
    );

    const recentPainAreas = [...new Set(
      recentSafetyResult.rows
        .filter((event) => event.event_type === 'pain' && (event.severity ?? 0) >= 3 && event.body_area)
        .map((event) => event.body_area as string),
    )];
    const now = Date.now();
    const recentCriticalSymptom = recentSafetyResult.rows.find((event) => {
      if (event.event_type !== 'symptom' || (event.severity ?? 0) < 5) return false;
      if (!['dizziness', 'shortness_of_breath'].includes(event.symptom_type ?? '')) return false;
      return now - new Date(event.created_at).getTime() <= 48 * 60 * 60 * 1000;
    });
    const recentModerateSignal = recentSafetyResult.rows.some((event) => (event.severity ?? 0) >= 5);

    return {
      profile: profileResult.rows[0],
      checkin,
      equipment: equipmentResult.rows.map((row) => row.label),
      completedSessions: Number(sessionsResult.rows[0]?.total ?? 0),
      recentSafety: {
        painAreas: recentPainAreas,
        moderateSignal: recentModerateSignal,
        criticalSymptom: recentCriticalSymptom ?? null,
      },
    };
  }

  private chooseSplit(daysPerWeek: number, completedSessions: number, recovery: CheckinRow['status']) {
    if (recovery === 'recovery') return 'recuperacao';
    if (daysPerWeek <= 3) return 'corpo inteiro';
    if (daysPerWeek === 4) return completedSessions % 2 === 0 ? 'superior' : 'inferior';
    const cycle = ['empurrar', 'puxar', 'pernas', 'superior', 'inferior'];
    return cycle[completedSessions % cycle.length];
  }

  private equipmentMatches(exercise: ExerciseRow, equipment: string[]) {
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

  private prescription(goal: ProfileRow['primary_goal'], level: ProfileRow['training_level'], intensity: 'leve' | 'moderada' | 'alta', isCardio: boolean) {
    if (isCardio) {
      return { sets: 1, repsMin: null, repsMax: null, durationSeconds: intensity === 'leve' ? 600 : 480, restSeconds: 60, targetRir: 4 };
    }

    const sets = intensity === 'leve' ? 2 : level === 'avancado' && intensity === 'alta' ? 4 : 3;
    const ranges = goal === 'forca'
      ? [5, 8]
      : goal === 'hipertrofia'
        ? [8, 12]
        : goal === 'condicionamento' || goal === 'emagrecimento'
          ? [10, 15]
          : [8, 12];

    return {
      sets,
      repsMin: ranges[0],
      repsMax: ranges[1],
      durationSeconds: null,
      restSeconds: goal === 'forca' ? 120 : intensity === 'alta' ? 90 : 75,
      targetRir: intensity === 'leve' ? 4 : intensity === 'moderada' ? 3 : 2,
    };
  }

  private async catalog() {
    const result = await this.db.query<ExerciseRow>(
      `SELECT
         e.id, e.slug, e.name, e.primary_muscle, e.secondary_muscles,
         e.movement_pattern, e.equipment, e.instructions, e.safety_notes,
         COALESCE(v.url, e.video_url) AS video_url
       FROM exercises e
       LEFT JOIN LATERAL (
         SELECT ev.url
         FROM exercise_videos ev
         WHERE ev.exercise_id = e.id
         ORDER BY ev.is_primary DESC, ev.created_at ASC
         LIMIT 1
       ) v ON true
       WHERE e.active = true
       ORDER BY e.name`,
    );
    return result.rows;
  }

  private async suggestedLoad(userId: string, exerciseId: string) {
    const history = await this.db.query<HistorySetRow>(
      `SELECT
         ws.id AS session_id,
         ws.completed_at,
         wset.repetitions,
         wset.load_kg,
         wset.rir,
         wpe.reps_max,
         wpe.target_rir
       FROM workout_sets wset
       JOIN workout_sessions ws ON ws.id = wset.workout_session_id
       JOIN workout_plans wp ON wp.id = ws.workout_plan_id
       JOIN workout_plan_exercises wpe
         ON wpe.workout_plan_id = wp.id AND wpe.exercise_id = wset.exercise_id
       WHERE ws.user_id = $1
         AND wset.exercise_id = $2
         AND ws.completed_at IS NOT NULL
         AND wset.completed = true
         AND wset.load_kg IS NOT NULL
         AND wset.load_kg > 0
         AND wset.repetitions IS NOT NULL
         AND wset.repetitions > 0
       ORDER BY ws.completed_at DESC, wset.set_number
       LIMIT 40`,
      [userId, exerciseId],
    );

    const sessions = new Map<string, HistorySetRow[]>();
    for (const row of history.rows) {
      const rows = sessions.get(row.session_id) ?? [];
      rows.push(row);
      sessions.set(row.session_id, rows);
      if (sessions.size > 2) break;
    }

    const recent = [...sessions.values()].slice(0, 2);
    if (!recent[0]?.length) return null;

    const currentLoad = Math.max(...recent[0].map((row) => Number(row.load_kg)));
    const qualifies = recent.length >= 2 && recent.every((sets) => sets.every((set) => {
      const reachedTop = set.reps_max == null || set.repetitions >= set.reps_max;
      const actualRir = set.rir == null ? null : Number(set.rir);
      const targetRir = set.target_rir == null ? null : Number(set.target_rir);
      const effortOk = targetRir == null || (actualRir != null && actualRir >= targetRir);
      return reachedTop && effortOk;
    }));

    return qualifies
      ? Math.round((currentLoad * 1.025) * 2) / 2
      : Math.round(currentLoad * 2) / 2;
  }

  async generateToday(userId: string) {
    const { profile, checkin, equipment, completedSessions, recentSafety } = await this.loadContext(userId);
    if (recentSafety.criticalSymptom) {
      throw new BadRequestException('Um sintoma relevante foi registrado nas últimas 48 horas. Atualize o check-in e procure avaliação adequada antes de gerar um novo treino automático.');
    }

    const effectiveRecoveryScore = recentSafety.moderateSignal
      ? Math.min(checkin.recovery_score, 69)
      : checkin.recovery_score;
    const combinedPainAreas = [...new Set([...checkin.pain_areas, ...recentSafety.painAreas])];
    const split = this.chooseSplit(profile.training_days_per_week, completedSessions, checkin.status);
    const safety = this.safety.evaluate({
      goal: profile.primary_goal,
      availableMinutes: checkin.available_minutes,
      recoveryScore: effectiveRecoveryScore,
      jointPain: combinedPainAreas,
      availableEquipment: equipment,
    });

    if (recentSafety.moderateSignal) {
      safety.notes.push('Ocorrência recente de dor/sintoma durante treino: a intensidade automática foi limitada e o sinal foi incorporado às regras de segurança.');
    }

    const all = await this.catalog();
    const targetMuscles = new Set(splitMuscles[split] ?? splitMuscles['corpo inteiro']);
    const safe = all
      .filter((exercise) => !safety.blockedPatterns.includes(exercise.movement_pattern))
      .filter((exercise) => this.equipmentMatches(exercise, equipment));

    const prioritized = [
      ...safe.filter((exercise) => targetMuscles.has(normalize(exercise.primary_muscle))),
      ...safe.filter((exercise) => !targetMuscles.has(normalize(exercise.primary_muscle))),
    ].filter((exercise, index, list) => list.findIndex((item) => item.id === exercise.id) === index);

    const limit = checkin.available_minutes <= 30 ? 4 : checkin.available_minutes <= 45 ? 5 : checkin.available_minutes <= 60 ? 6 : 7;
    const selected = prioritized.slice(0, limit);

    if (selected.length < 3) {
      throw new BadRequestException('Não há exercícios compatíveis suficientes para gerar um treino seguro com os dados atuais.');
    }

    const planned: PlannedExercise[] = await Promise.all(selected.map(async (exercise) => {
      const prescription = this.prescription(
        profile.primary_goal,
        profile.training_level,
        safety.allowedIntensity,
        exercise.movement_pattern === 'cardio-baixo-impacto',
      );
      const mayUseHistory = !prescription.durationSeconds && safety.allowedIntensity !== 'leve' && checkin.status !== 'recovery';
      return {
        ...exercise,
        ...prescription,
        suggestedLoadKg: mayUseHistory ? await this.suggestedLoad(userId, exercise.id) : null,
      };
    }));

    const planId = await this.db.transaction(async (client) => {
      await client.query(
        `UPDATE workout_plans
         SET status = 'cancelled'
         WHERE user_id = $1 AND planned_date = CURRENT_DATE AND status = 'draft'`,
        [userId],
      );

      const planResult = await client.query<{ id: string }>(
        `INSERT INTO workout_plans (
           user_id, status, goal, planned_date, estimated_minutes, generation_source, safety_snapshot
         ) VALUES ($1, 'draft', $2, CURRENT_DATE, $3, 'rules', $4::jsonb)
         RETURNING id`,
        [
          userId,
          profile.primary_goal,
          checkin.available_minutes,
          JSON.stringify({
            split,
            recoveryScore: effectiveRecoveryScore,
            recentSessionSignals: {
              painAreas: recentSafety.painAreas,
              intensityLimited: recentSafety.moderateSignal,
            },
            ...safety,
          }),
        ],
      );
      const id = planResult.rows[0].id;

      for (let index = 0; index < planned.length; index += 1) {
        const exercise = planned[index];
        await client.query(
          `INSERT INTO workout_plan_exercises (
             workout_plan_id, exercise_id, sequence, sets, reps_min, reps_max,
             duration_seconds, rest_seconds, target_rir, notes, suggested_load_kg
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            id,
            exercise.id,
            index + 1,
            exercise.sets,
            exercise.repsMin,
            exercise.repsMax,
            exercise.durationSeconds,
            exercise.restSeconds,
            exercise.targetRir,
            exercise.safety_notes,
            exercise.suggestedLoadKg,
          ],
        );
      }

      return id;
    });

    return this.getPlan(userId, planId);
  }

  async getToday(userId: string) {
    const result = await this.db.query<{ id: string }>(
      `SELECT id
       FROM workout_plans
       WHERE user_id = $1 AND planned_date = CURRENT_DATE AND status IN ('draft','active')
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );
    if (!result.rows[0]) return { plan: null };
    return { plan: await this.getPlan(userId, result.rows[0].id) };
  }

  private async getPlan(userId: string, planId: string) {
    const planResult = await this.db.query<{
      id: string;
      goal: string;
      estimated_minutes: number;
      safety_snapshot: Record<string, unknown>;
    }>(
      `SELECT id, goal, estimated_minutes, safety_snapshot
       FROM workout_plans
       WHERE id = $1 AND user_id = $2`,
      [planId, userId],
    );
    const plan = planResult.rows[0];
    if (!plan) throw new NotFoundException('Treino não encontrado.');

    const exerciseResult = await this.db.query<{
      id: string;
      name: string;
      primary_muscle: string;
      instructions: string | null;
      safety_notes: string | null;
      video_url: string | null;
      sequence: number;
      sets: number;
      reps_min: number | null;
      reps_max: number | null;
      duration_seconds: number | null;
      rest_seconds: number;
      target_rir: number;
      suggested_load_kg: string | null;
    }>(
      `SELECT
         e.id, e.name, e.primary_muscle, e.instructions, e.safety_notes,
         COALESCE(v.url, e.video_url) AS video_url,
         wpe.sequence, wpe.sets, wpe.reps_min, wpe.reps_max,
         wpe.duration_seconds, wpe.rest_seconds, wpe.target_rir,
         wpe.suggested_load_kg
       FROM workout_plan_exercises wpe
       JOIN exercises e ON e.id = wpe.exercise_id
       LEFT JOIN LATERAL (
         SELECT ev.url
         FROM exercise_videos ev
         WHERE ev.exercise_id = e.id
         ORDER BY ev.is_primary DESC, ev.created_at ASC
         LIMIT 1
       ) v ON true
       WHERE wpe.workout_plan_id = $1
       ORDER BY wpe.sequence`,
      [planId],
    );

    return {
      id: plan.id,
      goal: plan.goal,
      estimatedMinutes: plan.estimated_minutes,
      safety: plan.safety_snapshot,
      exercises: exerciseResult.rows.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primary_muscle,
        instructions: exercise.instructions,
        safetyNotes: exercise.safety_notes,
        videoUrl: exercise.video_url,
        order: exercise.sequence,
        sets: exercise.sets,
        repsMin: exercise.reps_min,
        repsMax: exercise.reps_max,
        durationSeconds: exercise.duration_seconds,
        restSeconds: exercise.rest_seconds,
        targetRir: exercise.target_rir,
        suggestedLoadKg: exercise.suggested_load_kg == null ? null : Number(exercise.suggested_load_kg),
      })),
    };
  }
}
