ALTER TABLE workout_plan_exercises
  ADD COLUMN IF NOT EXISTS suggested_load_kg NUMERIC(7,2);
