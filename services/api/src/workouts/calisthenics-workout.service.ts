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

const circuitSlugs = [
  'calistenia-flexao-braco',
  'calistenia-polichinelo',
  'calistenia-mergulho-banco',
  'calistenia-joelhos-altos',
  'calistenia-flexao-diamante-joelhos',
] as const;

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

@Injectable()
export class CalisthenicsWorkoutService {
  constructor(private readonly db: DatabaseService) {}

  async generateCircuit(userId: string) {
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
      throw new BadRequestException('Faça o check-in de hoje antes de iniciar o circuito de calistenia.');
    }
    if (checkin.status === 'professional_review_required') {
      throw new BadRequestException('O check-in de hoje requer revisão profissional antes de iniciar treino automático.');
    }
    if (checkin.available_minutes < 20) {
      throw new BadRequestException('Reserve pelo menos 20 minutos para o circuito de calistenia.');
    }

    const pain = new Set((checkin.pain_areas ?? []).map(normalize));
    const upperLimbPain = [...pain].some((item) =>
      item.includes('ombro') || item.includes('punho') || item.includes('cotovelo'),
    );
    if (upperLimbPain) {
      throw new BadRequestException(
        'Há dor informada em ombro, punho ou cotovelo. Como este circuito inclui flexões e mergulho, prefira o treino adaptativo do dia ou uma avaliação profissional.',
      );
    }

    const lowerLimbPain = [...pain].some((item) =>
      item.includes('joelho') || item.includes('quadril') || item.includes('tornozelo'),
    );
    const rounds = checkin.status === 'ready' && checkin.available_minutes >= 26 ? 4 : 3;
    const estimatedMinutes = rounds === 4 ? 26 : 19;
    const targetRir = checkin.status === 'recovery' ? 4 : 2;

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
      [circuitSlugs],
    );

    if (catalogResult.rows.length !== circuitSlugs.length) {
      throw new BadRequestException('O circuito de calistenia ainda não está completamente cadastrado no catálogo.');
    }

    const catalog = new Map(catalogResult.rows.map((exercise) => [exercise.slug, exercise]));
    const safetyNotes = [
      `Estrutura: ${rounds} rounds, 40 segundos de trabalho por exercício, 20 segundos de transição e 2 minutos entre rounds.`,
      'A meta é acumular repetições tecnicamente boas durante os 40 segundos, sem sacrificar postura nem buscar falha a qualquer custo.',
      lowerLimbPain
        ? 'Dor em membro inferior informada: faça Polichinelo sem salto e substitua a Corrida com Joelhos Altos por marcha rápida no lugar.'
        : 'Nos movimentos de cardio, use aterrissagem leve e reduza o impacto se a técnica começar a piorar.',
      checkin.status === 'recovery'
        ? 'Recuperação baixa: mantenha ritmo leve a moderado, use as adaptações iniciantes das flexões e complete apenas 3 rounds.'
        : 'Mantenha respiração contínua e interrompa diante de dor aguda, tontura ou falta de ar incomum.',
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
         ) VALUES ($1, 'draft', $2, CURRENT_DATE, $3, 'rules', $4::jsonb)
         RETURNING id`,
        [
          userId,
          goal,
          estimatedMinutes,
          JSON.stringify({
            split: `Circuito de Calistenia · ${rounds} rounds`,
            routine: 'calisthenics_circuit',
            recoveryScore: checkin.recovery_score,
            allowedIntensity: checkin.status === 'recovery' ? 'leve' : 'moderada',
            rounds,
            workSeconds: 40,
            transitionSeconds: 20,
            roundRestSeconds: 120,
            notes: safetyNotes,
          }),
        ],
      );
      const id = planResult.rows[0].id;

      for (let index = 0; index < circuitSlugs.length; index += 1) {
        const exercise = catalog.get(circuitSlugs[index])!;
        const lowerImpactNote = lowerLimbPain && exercise.slug === 'calistenia-polichinelo'
          ? 'Execute sem salto: abra uma perna de cada vez enquanto eleva os braços.'
          : lowerLimbPain && exercise.slug === 'calistenia-joelhos-altos'
            ? 'Substitua a corrida por marcha rápida, elevando os joelhos apenas até uma altura confortável.'
            : null;

        await client.query(
          `INSERT INTO workout_plan_exercises (
             workout_plan_id, exercise_id, sequence, sets, reps_min, reps_max,
             duration_seconds, rest_seconds, target_rir, notes
           ) VALUES ($1,$2,$3,$4,NULL,NULL,40,20,$5,$6)`,
          [
            id,
            exercise.id,
            index + 1,
            rounds,
            targetRir,
            lowerImpactNote ?? exercise.safety_notes,
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
    if (!plan) throw new BadRequestException('Circuito de calistenia não encontrado.');

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
