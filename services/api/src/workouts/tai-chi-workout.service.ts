import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

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
  instructions: string | null;
  safety_notes: string | null;
  video_url: string | null;
  video_license: string | null;
  video_attribution: string | null;
};

const taiChiSequence = [
  { slug: 'tai-chi-despertar-qi', durationSeconds: 180 },
  { slug: 'tai-chi-maos-como-nuvens', durationSeconds: 300 },
  { slug: 'tai-chi-repelir-macaco', durationSeconds: 240 },
  { slug: 'tai-chi-abracar-arvore', durationSeconds: 180 },
] as const;

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

@Injectable()
export class TaiChiWorkoutService {
  constructor(private readonly db: DatabaseService) {}

  async generate15Minute(userId: string) {
    const profileResult = await this.db.query<{ primary_goal: string | null }>(
      `SELECT primary_goal FROM profiles WHERE user_id = $1`,
      [userId],
    );
    const goal = profileResult.rows[0]?.primary_goal;
    if (!goal) {
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
      throw new BadRequestException('Faça o check-in de hoje antes de iniciar o Tai Chi.');
    }
    if (checkin.status === 'professional_review_required') {
      throw new BadRequestException('O check-in de hoje requer revisão profissional antes de iniciar treino automático.');
    }
    if (checkin.available_minutes < 15) {
      throw new BadRequestException('Reserve pelo menos 15 minutos para esta rotina de Tai Chi.');
    }

    const slugs = taiChiSequence.map((item) => item.slug);
    const catalogResult = await this.db.query<ExerciseRow>(
      `SELECT
         e.id, e.slug, e.name, e.primary_muscle, e.instructions, e.safety_notes,
         v.url AS video_url, v.license AS video_license, v.attribution AS video_attribution
       FROM exercises e
       LEFT JOIN LATERAL (
         SELECT ev.url, ev.license, ev.attribution
         FROM exercise_videos ev
         WHERE ev.exercise_id = e.id
         ORDER BY ev.is_primary DESC, ev.created_at ASC
         LIMIT 1
       ) v ON true
       WHERE e.slug = ANY($1::text[]) AND e.active = true`,
      [slugs],
    );

    if (catalogResult.rows.length !== taiChiSequence.length) {
      throw new BadRequestException('A rotina de Tai Chi ainda não está completamente cadastrada no catálogo.');
    }

    const catalog = new Map(catalogResult.rows.map((exercise) => [exercise.slug, exercise]));
    const pain = new Set((checkin.pain_areas ?? []).map(normalize));
    const hasKneePain = [...pain].some((item) => item.includes('joelho'));
    const hasLumbarPain = [...pain].some((item) => item.includes('lombar') || item.includes('coluna'));
    const isRecovery = checkin.status === 'recovery';

    const safetyNotes = [
      'Mantenha o abdômen levemente ativo e use movimentos contínuos, sem prender a respiração.',
      hasKneePain
        ? 'Dor no joelho informada: use postura mais alta e menor flexão dos joelhos; não force a posição de cavalgada.'
        : 'Para elevar o esforço, a postura pode ficar um pouco mais baixa apenas se houver conforto e bom alinhamento dos joelhos.',
      hasLumbarPain
        ? 'Desconforto lombar/coluna informado: reduza a amplitude de rotação do tronco no Repelir o Macaco.'
        : 'Mantenha a rotação do tronco suave e coordenada, sem movimentos bruscos.',
      isRecovery
        ? 'Recuperação baixa: execute em ritmo leve e postura mais alta, priorizando mobilidade e respiração.'
        : 'A proposta é aumentar o gasto energético com continuidade, controle postural e participação das pernas, sem prometer redução de gordura localizada.',
    ];

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
         ) VALUES ($1, 'draft', $2, CURRENT_DATE, 15, 'rules', $3::jsonb)
         RETURNING id`,
        [
          userId,
          goal,
          JSON.stringify({
            split: 'Tai Chi dinâmico · 15 min',
            routine: 'tai_chi_15',
            recoveryScore: checkin.recovery_score,
            allowedIntensity: isRecovery ? 'leve' : 'moderada',
            notes: safetyNotes,
          }),
        ],
      );
      const id = planResult.rows[0].id;

      for (let index = 0; index < taiChiSequence.length; index += 1) {
        const sequence = taiChiSequence[index];
        const exercise = catalog.get(sequence.slug)!;
        await client.query(
          `INSERT INTO workout_plan_exercises (
             workout_plan_id, exercise_id, sequence, sets, reps_min, reps_max,
             duration_seconds, rest_seconds, target_rir, notes
           ) VALUES ($1,$2,$3,1,NULL,NULL,$4,0,$5,$6)`,
          [
            id,
            exercise.id,
            index + 1,
            sequence.durationSeconds,
            isRecovery ? 5 : 3,
            safetyNotes[index] ?? exercise.safety_notes,
          ],
        );
      }

      return id;
    });

    return this.getPlan(userId, planId);
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
    if (!plan) throw new BadRequestException('Rotina de Tai Chi não encontrada.');

    const exerciseResult = await this.db.query<ExerciseRow & {
      sequence: number;
      sets: number;
      duration_seconds: number;
      rest_seconds: number;
      target_rir: number;
    }>(
      `SELECT
         e.id, e.slug, e.name, e.primary_muscle, e.instructions, e.safety_notes,
         v.url AS video_url, v.license AS video_license, v.attribution AS video_attribution,
         wpe.sequence, wpe.sets, wpe.duration_seconds, wpe.rest_seconds, wpe.target_rir
       FROM workout_plan_exercises wpe
       JOIN exercises e ON e.id = wpe.exercise_id
       LEFT JOIN LATERAL (
         SELECT ev.url, ev.license, ev.attribution
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
        videoLicense: exercise.video_license,
        videoAttribution: exercise.video_attribution,
        order: exercise.sequence,
        sets: exercise.sets,
        repsMin: null,
        repsMax: null,
        durationSeconds: exercise.duration_seconds,
        restSeconds: exercise.rest_seconds,
        targetRir: exercise.target_rir,
      })),
    };
  }
}
