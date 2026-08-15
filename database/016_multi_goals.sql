-- Evolua Core: objetivos múltiplos e catálogo expansível.
-- Mantém primary_goal para compatibilidade e adiciona goals para até 3 objetivos.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goals TEXT[] NOT NULL DEFAULT '{}'::text[];

UPDATE profiles
SET goals = ARRAY[primary_goal]
WHERE cardinality(goals) = 0
  AND primary_goal IS NOT NULL
  AND trim(primary_goal) <> '';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_primary_goal_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_primary_goal_not_blank
  CHECK (primary_goal IS NULL OR length(trim(primary_goal)) BETWEEN 1 AND 80);

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_goals_max_three;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_goals_max_three
  CHECK (cardinality(goals) <= 3);
