import { BadRequestException, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { OnboardingDto } from './onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly db: DatabaseService) {}

  async save(userId: string, input: OnboardingDto, safety: unknown) {
    const birthDate = this.normalizeDate(input.birthDate);
    const goals = this.normalizeGoals(input);

    await this.db.transaction(async (client) => {
      await client.query(
        `INSERT INTO profiles (user_id, display_name, birth_date, height_cm, training_level, primary_goal, goals, onboarding_completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,now())
         ON CONFLICT (user_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           birth_date = EXCLUDED.birth_date,
           height_cm = EXCLUDED.height_cm,
           training_level = EXCLUDED.training_level,
           primary_goal = EXCLUDED.primary_goal,
           goals = EXCLUDED.goals,
           onboarding_completed_at = now(),
           updated_at = now()`,
        [userId, input.displayName.trim(), birthDate, input.heightCm, input.trainingLevel, input.primaryGoal, goals],
      );

      await this.upsertTrainingPreferences(client, userId, input);
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
         VALUES ($1::uuid,'onboarding.completed','profile',$2::text,$3::jsonb)`,
        [
          userId,
          userId,
          JSON.stringify({
            safety,
            goals,
            trainingEnvironment: input.trainingEnvironment ?? 'misto',
            availableDays: input.availableDays ?? [],
            intensityPreference: input.intensityPreference ?? 3,
            musicEnabled: input.musicEnabled ?? true,
          }),
        ],
      );
    });

    return { saved: true, onboardingCompleted: true };
  }

  private async upsertTrainingPreferences(client: PoolClient, userId: string, input: OnboardingDto) {
    const availableDays = input.availableDays ?? [];
    const aerobicDays = input.aerobicDays ?? [];
    const muscleFocus = input.muscleFocus ?? [];
    const excludedExerciseTypes = input.excludedExerciseTypes ?? [];
    const exerciseTypePreferences = input.exerciseTypePreferences ?? {};

    await client.query(
      `INSERT INTO training_preferences (
         user_id, training_days_per_week, session_minutes, training_environment,
         available_days, aerobic_days, training_plan_mode, schedule_management,
         intensity_preference, past_activity_level, exercise_variety, muscle_focus,
         muscle_focus_mode, exercise_type_preferences, excluded_exercise_types,
         music_enabled, music_style, music_volume
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17,$18
       )
       ON CONFLICT (user_id) DO UPDATE SET
         training_days_per_week = EXCLUDED.training_days_per_week,
         session_minutes = EXCLUDED.session_minutes,
         training_environment = EXCLUDED.training_environment,
         available_days = EXCLUDED.available_days,
         aerobic_days = EXCLUDED.aerobic_days,
         training_plan_mode = EXCLUDED.training_plan_mode,
         schedule_management = EXCLUDED.schedule_management,
         intensity_preference = EXCLUDED.intensity_preference,
         past_activity_level = EXCLUDED.past_activity_level,
         exercise_variety = EXCLUDED.exercise_variety,
         muscle_focus = EXCLUDED.muscle_focus,
         muscle_focus_mode = EXCLUDED.muscle_focus_mode,
         exercise_type_preferences = EXCLUDED.exercise_type_preferences,
         excluded_exercise_types = EXCLUDED.excluded_exercise_types,
         music_enabled = EXCLUDED.music_enabled,
         music_style = EXCLUDED.music_style,
         music_volume = EXCLUDED.music_volume,
         updated_at = now()`,
      [
        userId,
        input.trainingDaysPerWeek,
        input.sessionMinutes,
        input.trainingEnvironment ?? 'misto',
        availableDays,
        aerobicDays,
        input.trainingPlanMode ?? 'automatico',
        input.scheduleManagement ?? 'automatico',
        input.intensityPreference ?? 3,
        input.pastActivityLevel ?? 2,
        input.exerciseVariety ?? 2,
        muscleFocus,
        input.muscleFocusMode ?? 'equilibrado',
        JSON.stringify(exerciseTypePreferences),
        excludedExerciseTypes,
        input.musicEnabled ?? true,
        input.musicStyle ?? 'gym_mix',
        input.musicVolume ?? 55,
      ],
    );
  }

  private normalizeGoals(input: OnboardingDto) {
    const requested = input.goals?.length ? input.goals : [input.primaryGoal];
    const unique = [...new Set(requested.filter(Boolean))];
    const withPrimary = unique.includes(input.primaryGoal)
      ? unique
      : [input.primaryGoal, ...unique];
    return withPrimary.slice(0, 3);
  }

  private async replaceEquipment(client: PoolClient, userId: string, labels: string[]) {
    await client.query(`DELETE FROM user_equipment WHERE user_id = $1`, [userId]);
    for (const rawLabel of labels) {
      const label = rawLabel.trim();
      if (!label) continue;
      await client.query(
        `INSERT INTO user_equipment (user_id, equipment_code, label)
         VALUES ($1,$2,$3)
         ON CONFLICT (user_id, equipment_code) DO UPDATE SET label = EXCLUDED.label`,
        [userId, this.slug(label), label],
      );
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
