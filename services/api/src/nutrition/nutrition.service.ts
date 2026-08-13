import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AddHydrationDto, AddMealEntryDto, SaveNutritionTargetDto } from './nutrition.dto';

type TargetRow = {
  id: string;
  calories_kcal: number | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fiber_g: string | null;
  water_ml: number | null;
  created_by: 'system' | 'nutritionist' | 'user';
};

type MealRow = {
  id: string;
  meal_type: string;
  consumed_at: string;
  notes: string | null;
  custom_name: string | null;
  food_name: string | null;
  quantity_g: string | null;
  calories_kcal: string | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fiber_g: string | null;
};

@Injectable()
export class NutritionService {
  constructor(private readonly db: DatabaseService) {}

  async today(userId: string) {
    const [targetResult, hydrationResult, mealsResult, restrictionResult] = await Promise.all([
      this.db.query<TargetRow>(
        `SELECT id, calories_kcal, protein_g, carbs_g, fat_g, fiber_g, water_ml, created_by
         FROM nutrition_targets
         WHERE user_id = $1
           AND valid_from <= CURRENT_DATE
           AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
         ORDER BY CASE created_by WHEN 'nutritionist' THEN 0 WHEN 'user' THEN 1 ELSE 2 END,
                  valid_from DESC
         LIMIT 1`,
        [userId],
      ),
      this.db.query<{ total_ml: string }>(
        `WITH context AS (
           SELECT COALESCE(p.timezone, 'America/Bahia') AS tz
           FROM users u
           LEFT JOIN profiles p ON p.user_id = u.id
           WHERE u.id = $1
         )
         SELECT COALESCE(SUM(h.amount_ml), 0)::text AS total_ml
         FROM hydration_logs h, context c
         WHERE h.user_id = $1
           AND (h.consumed_at AT TIME ZONE c.tz)::date = (now() AT TIME ZONE c.tz)::date`,
        [userId],
      ),
      this.db.query<MealRow>(
        `WITH context AS (
           SELECT COALESCE(p.timezone, 'America/Bahia') AS tz
           FROM users u
           LEFT JOIN profiles p ON p.user_id = u.id
           WHERE u.id = $1
         )
         SELECT
           ml.id,
           ml.meal_type,
           ml.consumed_at,
           ml.notes,
           mli.custom_name,
           f.name AS food_name,
           mli.quantity_g,
           COALESCE(
             mli.calories_kcal,
             CASE WHEN f.id IS NOT NULL THEN (mli.quantity_g / NULLIF(f.serving_g, 0)) * f.calories_kcal END
           )::text AS calories_kcal,
           COALESCE(
             mli.protein_g,
             CASE WHEN f.id IS NOT NULL THEN (mli.quantity_g / NULLIF(f.serving_g, 0)) * f.protein_g END
           )::text AS protein_g,
           COALESCE(
             mli.carbs_g,
             CASE WHEN f.id IS NOT NULL THEN (mli.quantity_g / NULLIF(f.serving_g, 0)) * f.carbs_g END
           )::text AS carbs_g,
           COALESCE(
             mli.fat_g,
             CASE WHEN f.id IS NOT NULL THEN (mli.quantity_g / NULLIF(f.serving_g, 0)) * f.fat_g END
           )::text AS fat_g,
           COALESCE(
             mli.fiber_g,
             CASE WHEN f.id IS NOT NULL THEN (mli.quantity_g / NULLIF(f.serving_g, 0)) * f.fiber_g END
           )::text AS fiber_g
         FROM meal_logs ml
         JOIN meal_log_items mli ON mli.meal_log_id = ml.id
         LEFT JOIN foods f ON f.id = mli.food_id
         CROSS JOIN context c
         WHERE ml.user_id = $1
           AND (ml.consumed_at AT TIME ZONE c.tz)::date = (now() AT TIME ZONE c.tz)::date
         ORDER BY ml.consumed_at DESC`,
        [userId],
      ),
      this.db.query<{ item: string; type: string; hard_block: boolean }>(
        `SELECT item, type, hard_block
         FROM food_restrictions
         WHERE user_id = $1
         ORDER BY hard_block DESC, type, item`,
        [userId],
      ),
    ]);

    const totals = mealsResult.rows.reduce(
      (sum, row) => ({
        caloriesKcal: sum.caloriesKcal + Number(row.calories_kcal ?? 0),
        proteinG: sum.proteinG + Number(row.protein_g ?? 0),
        carbsG: sum.carbsG + Number(row.carbs_g ?? 0),
        fatG: sum.fatG + Number(row.fat_g ?? 0),
        fiberG: sum.fiberG + Number(row.fiber_g ?? 0),
      }),
      { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );

    const target = targetResult.rows[0] ?? null;
    return {
      date: new Date().toISOString().slice(0, 10),
      targets: target ? {
        caloriesKcal: target.calories_kcal,
        proteinG: target.protein_g == null ? null : Number(target.protein_g),
        carbsG: target.carbs_g == null ? null : Number(target.carbs_g),
        fatG: target.fat_g == null ? null : Number(target.fat_g),
        fiberG: target.fiber_g == null ? null : Number(target.fiber_g),
        waterMl: target.water_ml,
        source: target.created_by,
      } : null,
      totals: {
        caloriesKcal: Math.round(totals.caloriesKcal * 10) / 10,
        proteinG: Math.round(totals.proteinG * 10) / 10,
        carbsG: Math.round(totals.carbsG * 10) / 10,
        fatG: Math.round(totals.fatG * 10) / 10,
        fiberG: Math.round(totals.fiberG * 10) / 10,
        waterMl: Number(hydrationResult.rows[0]?.total_ml ?? 0),
      },
      meals: mealsResult.rows.map((row) => ({
        id: row.id,
        mealType: row.meal_type,
        consumedAt: row.consumed_at,
        name: row.custom_name ?? row.food_name ?? 'Alimento',
        quantityG: row.quantity_g == null ? null : Number(row.quantity_g),
        caloriesKcal: Number(row.calories_kcal ?? 0),
        proteinG: Number(row.protein_g ?? 0),
        carbsG: Number(row.carbs_g ?? 0),
        fatG: Number(row.fat_g ?? 0),
        fiberG: Number(row.fiber_g ?? 0),
        notes: row.notes,
      })),
      restrictions: restrictionResult.rows.map((row) => ({
        item: row.item,
        type: row.type,
        hardBlock: row.hard_block,
      })),
    };
  }

  async addMeal(userId: string, input: AddMealEntryDto) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('Informe o alimento ou preparação.');

    const blocked = await this.db.query<{ item: string }>(
      `SELECT item
       FROM food_restrictions
       WHERE user_id = $1
         AND hard_block = true
         AND lower(trim(item)) = lower(trim($2))
       LIMIT 1`,
      [userId, name],
    );
    if (blocked.rows[0]) {
      throw new BadRequestException(`O item "${blocked.rows[0].item}" está marcado como bloqueio alimentar no seu perfil.`);
    }

    await this.db.transaction(async (client) => {
      const meal = await client.query<{ id: string }>(
        `INSERT INTO meal_logs (user_id, meal_type, notes)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, input.mealType, input.notes?.trim() || null],
      );
      await client.query(
        `INSERT INTO meal_log_items (
           meal_log_id, food_id, quantity_g, custom_name,
           calories_kcal, protein_g, carbs_g, fat_g, fiber_g
         ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8)`,
        [
          meal.rows[0].id,
          input.quantityG ?? 0,
          name,
          input.caloriesKcal ?? null,
          input.proteinG ?? null,
          input.carbsG ?? null,
          input.fatG ?? null,
          input.fiberG ?? null,
        ],
      );
    });

    return this.today(userId);
  }

  async addHydration(userId: string, input: AddHydrationDto) {
    await this.db.query(
      `INSERT INTO hydration_logs (user_id, amount_ml) VALUES ($1, $2)`,
      [userId, input.amountMl],
    );
    return this.today(userId);
  }

  async saveTargets(userId: string, input: SaveNutritionTargetDto) {
    const hasValue = [input.caloriesKcal, input.proteinG, input.carbsG, input.fatG, input.fiberG, input.waterMl]
      .some((value) => value != null);
    if (!hasValue) throw new BadRequestException('Informe pelo menos uma meta para acompanhamento.');

    await this.db.transaction(async (client) => {
      await client.query(
        `UPDATE nutrition_targets
         SET valid_to = CURRENT_DATE - 1
         WHERE user_id = $1
           AND created_by = 'user'
           AND valid_to IS NULL
           AND valid_from < CURRENT_DATE`,
        [userId],
      );

      const existing = await client.query<{ id: string }>(
        `SELECT id FROM nutrition_targets
         WHERE user_id = $1 AND created_by = 'user' AND valid_from = CURRENT_DATE
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );

      if (existing.rows[0]) {
        await client.query(
          `UPDATE nutrition_targets
           SET calories_kcal = $2, protein_g = $3, carbs_g = $4,
               fat_g = $5, fiber_g = $6, water_ml = $7, valid_to = NULL
           WHERE id = $1`,
          [
            existing.rows[0].id,
            input.caloriesKcal ?? null,
            input.proteinG ?? null,
            input.carbsG ?? null,
            input.fatG ?? null,
            input.fiberG ?? null,
            input.waterMl ?? null,
          ],
        );
      } else {
        await client.query(
          `INSERT INTO nutrition_targets (
             user_id, valid_from, calories_kcal, protein_g, carbs_g,
             fat_g, fiber_g, water_ml, created_by
           ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, 'user')`,
          [
            userId,
            input.caloriesKcal ?? null,
            input.proteinG ?? null,
            input.carbsG ?? null,
            input.fatG ?? null,
            input.fiberG ?? null,
            input.waterMl ?? null,
          ],
        );
      }
    });

    return this.today(userId);
  }
}
