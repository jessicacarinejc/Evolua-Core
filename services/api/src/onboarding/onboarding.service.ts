import { BadRequestException, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { OnboardingDto } from './onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly db: DatabaseService) {}

  async save(userId: string, input: OnboardingDto, safety: unknown) {
    const birthDate = this.normalizeDate(input.birthDate);

    await this.db.transaction(async (client) => {
      await client.query(
        `INSERT INTO profiles (user_id, display_name, birth_date, height_cm, training_level, primary_goal, onboarding_completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,now())
         ON CONFLICT (user_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           birth_date = EXCLUDED.birth_date,
           height_cm = EXCLUDED.height_cm,
           training_level = EXCLUDED.training_level,
           primary_goal = EXCLUDED.primary_goal,
           onboarding_completed_at = now(),
           updated_at = now()`,
        [userId, input.displayName.trim(), birthDate, input.heightCm, input.trainingLevel, input.primaryGoal],
      );

      await client.query(
        `INSERT INTO training_preferences (user_id, training_days_per_week, session_minutes)
         VALUES ($1,$2,$3)
         ON CONFLICT (user_id) DO UPDATE SET
           training_days_per_week = EXCLUDED.training_days_per_week,
           session_minutes = EXCLUDED.session_minutes,
           updated_at = now()`,
        [userId, input.trainingDaysPerWeek, input.sessionMinutes],
      );

      await client.query(`INSERT INTO body_metrics (user_id, weight_kg) VALUES ($1,$2)`, [userId, input.weightKg]);

      await this.replaceEquipment(client, userId, input.equipment);

      await client.query(`DELETE FROM health_conditions WHERE user_id = $1`, [userId]);
      for (const label of input.healthConditions.filter((value) => !value.toLowerCase().startsWith('nenhuma'))) {
        await client.query(
          `INSERT INTO health_conditions (user_id, code, label, severity) VALUES ($1,$2,$3,$4)`,
          [userId, this.slug(label), label, this.conditionSeverity(label)],
        );
      }

      await client.query(`DELETE FROM pain_areas WHERE user_id = $1`, [userId]);
      for (const label of input.painAreas) {
        await client.query(`INSERT INTO pain_areas (user_id, area_code, label) VALUES ($1,$2,$3)`, [userId, this.slug(label), label]);
      }

      await client.query(`DELETE FROM food_restrictions WHERE user_id = $1`, [userId]);
      for (const item of input.foodRestrictions) {
        const classification = this.classifyRestriction(item);
        await client.query(
          `INSERT INTO food_restrictions (user_id, type, item, hard_block) VALUES ($1,$2,$3,$4)`,
          [userId, classification.type, item, classification.hardBlock],
        );
      }

      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
         VALUES ($1,'onboarding.completed','profile',$1,$2::jsonb)`,
        [userId, JSON.stringify({ safety })],
      );
    });

    return { saved: true, onboardingCompleted: true };
  }

  private async replaceEquipment(client: PoolClient, userId: string, labels: string[]) {
    await client.query(`DELETE FROM user_equipment WHERE user_id = $1`, [userId]);
    for (const label of labels) {
      await client.query(`INSERT INTO user_equipment (user_id, equipment_code, label) VALUES ($1,$2,$3)`, [userId, this.slug(label), label]);
    }
  }

  private normalizeDate(value: string) {
    const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    throw new BadRequestException('Data de nascimento inválida. Use DD/MM/AAAA.');
  }

  private slug(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private conditionSeverity(label: string) {
    const normalized = this.slug(label);
    return ['cardiopatia', 'gestacao', 'doenca-renal'].includes(normalized) ? 'critica' : 'atencao';
  }

  private classifyRestriction(item: string): { type: string; hardBlock: boolean } {
    const normalized = this.slug(item);
    if (['vegetariano', 'vegano'].includes(normalized)) return { type: 'preferencia', hardBlock: true };
    if (['amendoim', 'frutos-do-mar', 'ovos'].includes(normalized)) return { type: 'alergia', hardBlock: true };
    if (['lactose', 'gluten'].includes(normalized)) return { type: 'intolerancia', hardBlock: true };
    return { type: 'preferencia', hardBlock: false };
  }
}
