import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SaveBodyMetricDto } from './progress.dto';

type MetricRow = {
  id: string;
  measured_at: string;
  weight_kg: string | null;
  body_fat_percent: string | null;
  waist_cm: string | null;
  hip_cm: string | null;
  chest_cm: string | null;
  notes: string | null;
};

@Injectable()
export class ProgressService {
  constructor(private readonly db: DatabaseService) {}

  async saveBodyMetric(userId: string, input: SaveBodyMetricDto) {
    const hasValue = [
      input.weightKg,
      input.bodyFatPercent,
      input.waistCm,
      input.hipCm,
      input.chestCm,
    ].some((value) => value != null);

    if (!hasValue) {
      throw new BadRequestException('Informe pelo menos uma medida corporal.');
    }

    const result = await this.db.query<MetricRow>(
      `INSERT INTO body_metrics (
         user_id, weight_kg, body_fat_percent, waist_cm, hip_cm, chest_cm, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, measured_at, weight_kg, body_fat_percent, waist_cm, hip_cm, chest_cm, notes`,
      [
        userId,
        input.weightKg ?? null,
        input.bodyFatPercent ?? null,
        input.waistCm ?? null,
        input.hipCm ?? null,
        input.chestCm ?? null,
        input.notes?.trim() || null,
      ],
    );

    return this.mapMetric(result.rows[0]);
  }

  async listBodyMetrics(userId: string) {
    const result = await this.db.query<MetricRow>(
      `SELECT id, measured_at, weight_kg, body_fat_percent, waist_cm, hip_cm, chest_cm, notes
       FROM body_metrics
       WHERE user_id = $1
       ORDER BY measured_at DESC
       LIMIT 60`,
      [userId],
    );
    return { metrics: result.rows.map((row) => this.mapMetric(row)) };
  }

  async listWorkouts(userId: string) {
    const result = await this.db.query<{
      id: string;
      completed_at: string;
      perceived_effort: number | null;
      feedback: string | null;
      goal: string;
      safety_snapshot: Record<string, unknown>;
      duration_minutes: string;
      completed_sets: string;
      volume_kg: string;
    }>(
      `SELECT
         ws.id,
         ws.completed_at,
         ws.perceived_effort,
         ws.feedback,
         wp.goal,
         wp.safety_snapshot,
         GREATEST(1, ROUND(EXTRACT(EPOCH FROM (ws.completed_at - ws.started_at)) / 60.0))::text AS duration_minutes,
         COUNT(wset.id) FILTER (WHERE wset.completed = true)::text AS completed_sets,
         COALESCE(SUM(COALESCE(wset.load_kg, 0) * COALESCE(wset.repetitions, 0)) FILTER (WHERE wset.completed = true), 0)::text AS volume_kg
       FROM workout_sessions ws
       JOIN workout_plans wp ON wp.id = ws.workout_plan_id
       LEFT JOIN workout_sets wset ON wset.workout_session_id = ws.id
       WHERE ws.user_id = $1 AND ws.completed_at IS NOT NULL
       GROUP BY ws.id, wp.goal, wp.safety_snapshot
       ORDER BY ws.completed_at DESC
       LIMIT 30`,
      [userId],
    );

    return {
      workouts: result.rows.map((row) => ({
        id: row.id,
        completedAt: row.completed_at,
        title: String(row.safety_snapshot?.split ?? row.safety_snapshot?.routine ?? 'Treino'),
        goal: row.goal,
        durationMinutes: Number(row.duration_minutes),
        completedSets: Number(row.completed_sets),
        volumeKg: Math.round(Number(row.volume_kg) * 100) / 100,
        perceivedEffort: row.perceived_effort,
        feedback: row.feedback,
      })),
    };
  }

  async overview(userId: string) {
    const [metrics, workouts] = await Promise.all([
      this.db.query<MetricRow>(
        `SELECT id, measured_at, weight_kg, body_fat_percent, waist_cm, hip_cm, chest_cm, notes
         FROM body_metrics WHERE user_id = $1 ORDER BY measured_at ASC`,
        [userId],
      ),
      this.db.query<{
        total: string;
        week_total: string;
        week_volume: string;
        average_rpe: string | null;
      }>(
        `SELECT
           COUNT(*) FILTER (WHERE ws.completed_at IS NOT NULL)::text AS total,
           COUNT(*) FILTER (
             WHERE ws.completed_at >= date_trunc('week', CURRENT_DATE)
           )::text AS week_total,
           COALESCE((
             SELECT SUM(COALESCE(s.load_kg, 0) * COALESCE(s.repetitions, 0))
             FROM workout_sets s
             JOIN workout_sessions sx ON sx.id = s.workout_session_id
             WHERE sx.user_id = $1
               AND sx.completed_at >= date_trunc('week', CURRENT_DATE)
               AND s.completed = true
           ), 0)::text AS week_volume,
           ROUND(AVG(ws.perceived_effort)::numeric, 1)::text AS average_rpe
         FROM workout_sessions ws
         WHERE ws.user_id = $1`,
        [userId],
      ),
    ]);

    const first = metrics.rows.find((row) => row.weight_kg != null) ?? null;
    const latest = [...metrics.rows].reverse().find((row) => row.weight_kg != null) ?? null;
    const firstWeight = first?.weight_kg == null ? null : Number(first.weight_kg);
    const latestWeight = latest?.weight_kg == null ? null : Number(latest.weight_kg);
    const workout = workouts.rows[0];

    return {
      weight: {
        currentKg: latestWeight,
        firstKg: firstWeight,
        changeKg: latestWeight != null && firstWeight != null
          ? Math.round((latestWeight - firstWeight) * 100) / 100
          : null,
        measuredAt: latest?.measured_at ?? null,
      },
      workouts: {
        completedTotal: Number(workout?.total ?? 0),
        completedThisWeek: Number(workout?.week_total ?? 0),
        volumeThisWeekKg: Math.round(Number(workout?.week_volume ?? 0) * 100) / 100,
        averageRpe: workout?.average_rpe == null ? null : Number(workout.average_rpe),
      },
      body: latest ? this.mapMetric(latest) : null,
    };
  }

  private mapMetric(row: MetricRow) {
    return {
      id: row.id,
      measuredAt: row.measured_at,
      weightKg: row.weight_kg == null ? null : Number(row.weight_kg),
      bodyFatPercent: row.body_fat_percent == null ? null : Number(row.body_fat_percent),
      waistCm: row.waist_cm == null ? null : Number(row.waist_cm),
      hipCm: row.hip_cm == null ? null : Number(row.hip_cm),
      chestCm: row.chest_cm == null ? null : Number(row.chest_cm),
      notes: row.notes,
    };
  }
}
