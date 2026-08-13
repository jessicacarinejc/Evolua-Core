import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type ProfileRow = {
  primary_goal: string | null;
  training_level: string | null;
  training_days_per_week: number;
  session_minutes: number;
  timezone: string;
};

type CheckinRow = {
  status: 'ready' | 'modified' | 'recovery' | 'professional_review_required';
  recovery_score: number;
};

type SessionDayRow = {
  planned_date: string;
  completed: boolean;
};

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function trainingWeekdays(daysPerWeek: number) {
  if (daysPerWeek <= 1) return [2];
  if (daysPerWeek === 2) return [1, 4];
  if (daysPerWeek === 3) return [0, 2, 4];
  if (daysPerWeek === 4) return [0, 1, 3, 4];
  if (daysPerWeek === 5) return [0, 1, 2, 3, 4];
  if (daysPerWeek === 6) return [0, 1, 2, 3, 4, 5];
  return [0, 1, 2, 3, 4, 5, 6];
}

function splitForSession(daysPerWeek: number, sessionIndex: number) {
  if (daysPerWeek <= 3) return 'corpo inteiro';
  if (daysPerWeek === 4) return ['superior', 'inferior', 'superior', 'inferior'][sessionIndex % 4];
  if (daysPerWeek === 5) return ['empurrar', 'puxar', 'pernas', 'superior', 'inferior'][sessionIndex % 5];
  return ['empurrar', 'puxar', 'pernas', 'empurrar', 'puxar', 'pernas', 'recuperação ativa'][sessionIndex % 7];
}

@Injectable()
export class WeeklyWorkoutService {
  constructor(private readonly db: DatabaseService) {}

  async getWeek(userId: string) {
    const profileResult = await this.db.query<ProfileRow>(
      `SELECT
         p.primary_goal,
         p.training_level,
         COALESCE(tp.training_days_per_week, 3) AS training_days_per_week,
         COALESCE(tp.session_minutes, 45) AS session_minutes,
         COALESCE(p.timezone, 'America/Bahia') AS timezone
       FROM profiles p
       LEFT JOIN training_preferences tp ON tp.user_id = p.user_id
       WHERE p.user_id = $1`,
      [userId],
    );
    const profile = profileResult.rows[0];
    if (!profile?.primary_goal || !profile.training_level) {
      throw new BadRequestException('Conclua a configuração inicial antes de montar o planejamento semanal.');
    }

    const clockResult = await this.db.query<{ today: string; week_start: string }>(
      `SELECT
         ((now() AT TIME ZONE $1)::date)::text AS today,
         (date_trunc('week', now() AT TIME ZONE $1)::date)::text AS week_start`,
      [profile.timezone],
    );
    const today = clockResult.rows[0].today;
    const weekStart = clockResult.rows[0].week_start;
    const weekEnd = addDays(weekStart, 6);

    const checkinResult = await this.db.query<CheckinRow>(
      `SELECT status, recovery_score
       FROM daily_checkins
       WHERE user_id = $1 AND checkin_date = $2::date
       LIMIT 1`,
      [userId, today],
    );
    const checkin = checkinResult.rows[0] ?? null;

    const sessionResult = await this.db.query<SessionDayRow>(
      `SELECT
         wp.planned_date::text AS planned_date,
         bool_or(ws.completed_at IS NOT NULL) AS completed
       FROM workout_plans wp
       LEFT JOIN workout_sessions ws ON ws.workout_plan_id = wp.id AND ws.user_id = wp.user_id
       WHERE wp.user_id = $1
         AND wp.planned_date BETWEEN $2::date AND $3::date
       GROUP BY wp.planned_date
       ORDER BY wp.planned_date`,
      [userId, weekStart, weekEnd],
    );
    const completedByDate = new Map(sessionResult.rows.map((row) => [row.planned_date, row.completed]));

    const trainingDays = trainingWeekdays(Math.max(1, Math.min(7, profile.training_days_per_week)));
    let sessionIndex = 0;
    const days = weekdayLabels.map((weekday, index) => {
      const date = addDays(weekStart, index);
      const scheduled = trainingDays.includes(index);
      const completed = completedByDate.get(date) === true;
      const split = scheduled ? splitForSession(profile.training_days_per_week, sessionIndex++) : 'descanso';

      let status: 'concluido' | 'descanso' | 'nao_realizado' | 'planejado' | 'aguarda_checkin' | 'pronto' | 'adaptado' | 'recuperacao' | 'revisao_profissional';
      if (completed) status = 'concluido';
      else if (!scheduled) status = 'descanso';
      else if (date < today) status = 'nao_realizado';
      else if (date > today) status = 'planejado';
      else if (!checkin) status = 'aguarda_checkin';
      else if (checkin.status === 'professional_review_required') status = 'revisao_profissional';
      else if (checkin.status === 'recovery') status = 'recuperacao';
      else if (checkin.status === 'modified') status = 'adaptado';
      else status = 'pronto';

      return {
        date,
        weekday,
        scheduled,
        split,
        status,
        estimatedMinutes: scheduled ? profile.session_minutes : null,
        isToday: date === today,
      };
    });

    return {
      weekStart,
      weekEnd,
      goal: profile.primary_goal,
      preferredDaysPerWeek: profile.training_days_per_week,
      sessionMinutes: profile.session_minutes,
      todayCheckin: checkin ? { status: checkin.status, recoveryScore: checkin.recovery_score } : null,
      days,
      policy: {
        checkinOverridesCalendar: true,
        note: 'O calendário organiza a semana, mas o check-in do dia e os sinais recentes de segurança têm prioridade antes de gerar ou iniciar qualquer treino.',
      },
    };
  }
}
