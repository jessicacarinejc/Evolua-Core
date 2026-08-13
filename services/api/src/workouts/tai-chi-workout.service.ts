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

export type TaiChiRoutineKey = 'tai_chi_15' | 'tai_chi_walking' | 'tai_chi_chen_20' | 'tai_chi_yang_25_30';

type RoutineStep = {
  slug: string;
  durationSeconds: number;
};

type RoutineSpec = {
  key: TaiChiRoutineKey;
  title: string;
  minMinutes: number;
  estimatedMinutes: number;
  sequence: RoutineStep[];
};

const taiChi15Sequence: RoutineStep[] = [
  { slug: 'tai-chi-despertar-qi', durationSeconds: 180 },
  { slug: 'tai-chi-maos-como-nuvens', durationSeconds: 300 },
  { slug: 'tai-chi-repelir-macaco', durationSeconds: 240 },
  { slug: 'tai-chi-abracar-arvore', durationSeconds: 180 },
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

@Injectable()
export class TaiChiWorkoutService {
  constructor(private readonly db: DatabaseService) {}

  generate15Minute(userId: string) {
    return this.generateRoutine(userId, 'tai_chi_15');
  }

  generateWalking(userId: string) {
    return this.generateRoutine(userId, 'tai_chi_walking');
  }

  generateChen20(userId: string) {
    return this.generateRoutine(userId, 'tai_chi_chen_20');
  }

  generateYang25To30(userId: string) {
    return this.generateRoutine(userId, 'tai_chi_yang_25_30');
  }

  private resolveRoutine(key: TaiChiRoutineKey, availableMinutes: number): RoutineSpec {
    if (key === 'tai_chi_15') {
      return {
        key,
        title: 'Tai Chi dinâmico · 15 min',
        minMinutes: 15,
        estimatedMinutes: 15,
        sequence: taiChi15Sequence,
      };
    }

    if (key === 'tai_chi_walking') {
      const estimatedMinutes = clamp(availableMinutes, 10, 15);
      const totalSeconds = estimatedMinutes * 60;
      const fixedSeconds = 240;
      const walkingSeconds = totalSeconds - fixedSeconds;
      const forwardSeconds = Math.round(walkingSeconds * 0.6);
      const backwardSeconds = walkingSeconds - forwardSeconds;

      return {
        key,
        title: `Caminhada Tai Chi · ${estimatedMinutes} min`,
        minMinutes: 10,
        estimatedMinutes,
        sequence: [
          { slug: 'tai-chi-transferencia-equilibrio', durationSeconds: 120 },
          { slug: 'tai-chi-caminhada-frente', durationSeconds: forwardSeconds },
          { slug: 'tai-chi-caminhada-tras', durationSeconds: backwardSeconds },
          { slug: 'tai-chi-abracar-arvore', durationSeconds: 120 },
        ],
      };
    }

    if (key === 'tai_chi_chen_20') {
      return {
        key,
        title: 'Tai Chi Chen · Força isométrica · 20 min',
        minMinutes: 20,
        estimatedMinutes: 20,
        sequence: [
          { slug: 'tai-chi-despertar-qi', durationSeconds: 180 },
          { slug: 'tai-chi-chen-postura-arco', durationSeconds: 360 },
          { slug: 'tai-chi-chen-empurrar-arco', durationSeconds: 480 },
          { slug: 'tai-chi-abracar-arvore', durationSeconds: 180 },
        ],
      };
    }

    const estimatedMinutes = clamp(availableMinutes, 25, 30);
    const mainSequenceSeconds = (estimatedMinutes - 11) * 60;
    return {
      key,
      title: `Tai Chi Yang · Fluidez e cintura · ${estimatedMinutes} min`,
      minMinutes: 25,
      estimatedMinutes,
      sequence: [
        { slug: 'tai-chi-despertar-qi', durationSeconds: 180 },
        { slug: 'tai-chi-yang-aparar-cauda-passaro', durationSeconds: mainSequenceSeconds },
        { slug: 'tai-chi-maos-como-nuvens', durationSeconds: 300 },
        { slug: 'tai-chi-abracar-arvore', durationSeconds: 180 },
      ],
    };
  }

  private buildSafetyNotes(routine: TaiChiRoutineKey, checkin: CheckinRow) {
    const pain = new Set((checkin.pain_areas ?? []).map(normalize));
    const hasKneePain = [...pain].some((item) => item.includes('joelho'));
    const hasLumbarPain = [...pain].some((item) => item.includes('lombar') || item.includes('coluna'));
    const hasHipOrAnklePain = [...pain].some((item) => item.includes('quadril') || item.includes('tornozelo'));
    const isRecovery = checkin.status === 'recovery';

    const notes = [
      'Mantenha a respiração fluida e os movimentos controlados. A intensidade deve vir da continuidade e do controle postural, não de movimentos bruscos.',
    ];

    if (routine === 'tai_chi_walking') {
      notes.push(
        hasKneePain
          ? 'Dor no joelho informada: use flexão mínima, passos mais curtos e evite sustentar postura baixa.'
          : 'Mantenha leve flexão dos joelhos durante os passos para aumentar a participação muscular das pernas sem comprometer o alinhamento.',
      );
      notes.push(
        hasHipOrAnklePain
          ? 'Desconforto em quadril/tornozelo informado: reduza o comprimento dos passos e priorize transferência de peso no lugar.'
          : 'Nos passos para trás, use espaço livre e apoio firme por perto; toque a ponta do pé antes de transferir o peso.',
      );
    } else if (routine === 'tai_chi_chen_20') {
      notes.push(
        hasKneePain
          ? 'Dor no joelho informada: a Postura do Arco deve ser mais alta, com base curta e sem aprofundar a flexão.'
          : 'A Postura do Arco pode ficar moderadamente mais baixa somente enquanto alinhamento, respiração e conforto forem mantidos.',
      );
      notes.push('O foco é aumentar a demanda muscular das pernas por tempo sob tensão, sem transformar a sequência em exercício explosivo.');
    } else if (routine === 'tai_chi_yang_25_30') {
      notes.push(
        hasLumbarPain
          ? 'Desconforto lombar/coluna informado: reduza a amplitude de rotação e faça a transferência de peso com o tronco mais neutro.'
          : 'Use rotação suave do tronco e transferência contínua de peso para recrutar core e oblíquos sem forçar a lombar.',
      );
      notes.push('A rotação da cintura não é apresentada como forma de reduzir gordura localizada nem como massagem de órgãos internos.');
    } else {
      notes.push(
        hasKneePain
          ? 'Dor no joelho informada: use postura mais alta e menor flexão dos joelhos; não force a posição de cavalgada.'
          : 'Para elevar o esforço, a postura pode ficar um pouco mais baixa apenas se houver conforto e bom alinhamento dos joelhos.',
      );
      notes.push(
        hasLumbarPain
          ? 'Desconforto lombar/coluna informado: reduza a amplitude de rotação do tronco no Repelir o Macaco.'
          : 'Mantenha a rotação do tronco suave e coordenada, sem movimentos bruscos.',
      );
    }

    if (isRecovery) {
      notes.push('Recuperação baixa: execute em ritmo leve, com postura mais alta e menor amplitude, priorizando controle e respiração.');
    } else {
      notes.push('A proposta é elevar o gasto energético pela continuidade do movimento e pelo trabalho muscular, sem prometer uma quantidade específica de calorias.');
    }

    return {
      notes,
      isRecovery,
      hasKneePain,
      hasLumbarPain,
    };
  }

  private async generateRoutine(userId: string, routineKey: TaiChiRoutineKey) {
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

    const routine = this.resolveRoutine(routineKey, checkin.available_minutes);
    if (checkin.available_minutes < routine.minMinutes) {
      throw new BadRequestException(`Reserve pelo menos ${routine.minMinutes} minutos para esta rotina de Tai Chi.`);
    }

    const slugs = routine.sequence.map((item) => item.slug);
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

    if (catalogResult.rows.length !== new Set(slugs).size) {
      throw new BadRequestException('A rotina de Tai Chi ainda não está completamente cadastrada no catálogo.');
    }

    const catalog = new Map(catalogResult.rows.map((exercise) => [exercise.slug, exercise]));
    const safety = this.buildSafetyNotes(routineKey, checkin);

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
          routine.estimatedMinutes,
          JSON.stringify({
            split: routine.title,
            routine: routine.key,
            recoveryScore: checkin.recovery_score,
            allowedIntensity: safety.isRecovery ? 'leve' : routineKey === 'tai_chi_chen_20' ? 'moderada' : 'moderada',
            notes: safety.notes,
          }),
        ],
      );
      const id = planResult.rows[0].id;

      for (let index = 0; index < routine.sequence.length; index += 1) {
        const sequence = routine.sequence[index];
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
            safety.isRecovery ? 5 : routineKey === 'tai_chi_chen_20' ? 3 : 4,
            exercise.safety_notes,
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
