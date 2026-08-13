ALTER TABLE meal_log_items
  ALTER COLUMN food_id DROP NOT NULL;

ALTER TABLE meal_log_items
  ADD COLUMN IF NOT EXISTS custom_name TEXT,
  ADD COLUMN IF NOT EXISTS calories_kcal NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS protein_g NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS carbs_g NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS fat_g NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS fiber_g NUMERIC(8,2);

ALTER TABLE meal_log_items
  DROP CONSTRAINT IF EXISTS meal_log_items_food_or_custom_check;

ALTER TABLE meal_log_items
  ADD CONSTRAINT meal_log_items_food_or_custom_check
  CHECK (food_id IS NOT NULL OR (custom_name IS NOT NULL AND length(trim(custom_name)) > 0));

CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml BETWEEN 50 AND 5000),
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nutrition_targets
  DROP CONSTRAINT IF EXISTS nutrition_targets_created_by_check;

ALTER TABLE nutrition_targets
  ADD CONSTRAINT nutrition_targets_created_by_check
  CHECK (created_by IN ('system','nutritionist','user'));

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_consumed
  ON meal_logs(user_id, consumed_at DESC);

CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_consumed
  ON hydration_logs(user_id, consumed_at DESC);

CREATE INDEX IF NOT EXISTS idx_nutrition_targets_user_validity
  ON nutrition_targets(user_id, valid_from DESC, valid_to);
