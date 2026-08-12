import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DailyCheckinDto } from './daily-checkin.dto';

export type CheckinStatus = 'ready' | 'modified' | 'recovery' | 'professional_review_required';

@Injectable()
export class DailyCheckinService {
  constructor(private readonly db: DatabaseService) {}

  evaluate(input: DailyCheckinDto) {
    const sleep = ((input.sleepQuality - 1) / 4) * 100;
    const energy = ((input.energyLevel - 1) / 4) * 100;
    const soreness = 100 - input.muscleSoreness * 10;
    const joint = 100 - input.jointPain * 10;
    const recoveryScore = Math.max(0, Math.min(100, Math.round(sleep * 0.3 + energy * 0.3 + soreness * 0.2 + joint * 0.2)));
    let status: CheckinStatus = 'ready';
    const notes: string[] = [];

    if (input.newSymptoms || input.jointPain >= 7) {
      status = 'professional_review_required';
      notes.push('Revisão profissional recomendada antes da geração automática do treino.');
    } else if (recoveryScore < 45) {
      status = 'recovery';
      notes.push('Recuperação baixa: gerar apenas opções leves de recuperação.');
    } else if (recoveryScore < 70 || input.jointPain >= 5 || input.muscleSoreness >= 7) {
      status = 'modified';
      notes.push('Gerar treino adaptado com menor volume ou intensidade.');
    }

    if (input.availableMinutes < 30) notes.push('Usar sessão compacta devido ao tempo disponível.');
    return { recoveryScore, status, notes };
  }

  async save(userId: string, input: DailyCheckinDto) {
    const evaluation = this.evaluate(input);
    const result = await this.db.query<any>(
      `INSERT INTO daily_checkins (
         user_id, checkin_date, sleep_quality, energy_level, muscle_soreness, joint_pain,
         available_minutes, pain_areas, new_symptoms, notes, recovery_score, status, evaluation
       ) VALUES ($1,CURRENT_DATE,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
       ON CONFLICT (user_id, checkin_date) DO UPDATE SET
         sleep_quality=EXCLUDED.sleep_quality, energy_level=EXCLUDED.energy_level,
         muscle_soreness=EXCLUDED.muscle_soreness, joint_pain=EXCLUDED.joint_pain,
         available_minutes=EXCLUDED.available_minutes, pain_areas=EXCLUDED.pain_areas,
         new_symptoms=EXCLUDED.new_symptoms, notes=EXCLUDED.notes,
         recovery_score=EXCLUDED.recovery_score, status=EXCLUDED.status,
         evaluation=EXCLUDED.evaluation, updated_at=now()
       RETURNING *`,
      [userId, input.sleepQuality, input.energyLevel, input.muscleSoreness, input.jointPain,
       input.availableMinutes, input.painAreas, input.newSymptoms, input.notes ?? null,
       evaluation.recoveryScore, evaluation.status, JSON.stringify(evaluation)],
    );
    return { checkin: result.rows[0], evaluation };
  }

  async today(userId: string) {
    const result = await this.db.query<any>(
      `SELECT * FROM daily_checkins WHERE user_id=$1 AND checkin_date=CURRENT_DATE LIMIT 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }
}
