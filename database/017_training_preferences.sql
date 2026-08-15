ALTER TABLE training_preferences
  ADD COLUMN IF NOT EXISTS training_environment TEXT NOT NULL DEFAULT 'misto'
    CHECK (training_environment IN ('academia','casa','misto')),
  ADD COLUMN IF NOT EXISTS available_days TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS aerobic_days TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS training_plan_mode TEXT NOT NULL DEFAULT 'automatico'
    CHECK (training_plan_mode IN ('automatico','hibrido','manual')),
  ADD COLUMN IF NOT EXISTS schedule_management TEXT NOT NULL DEFAULT 'automatico'
    CHECK (schedule_management IN ('automatico','manual')),
  ADD COLUMN IF NOT EXISTS intensity_preference SMALLINT NOT NULL DEFAULT 3
    CHECK (intensity_preference BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS past_activity_level SMALLINT NOT NULL DEFAULT 2
    CHECK (past_activity_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS exercise_variety SMALLINT NOT NULL DEFAULT 2
    CHECK (exercise_variety BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS muscle_focus TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS muscle_focus_mode TEXT NOT NULL DEFAULT 'equilibrado'
    CHECK (muscle_focus_mode IN ('equilibrado','foco_corpo_todo','somente_selecionados')),
  ADD COLUMN IF NOT EXISTS exercise_type_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS excluded_exercise_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS music_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS music_style TEXT NOT NULL DEFAULT 'gym_mix'
    CHECK (music_style IN ('gym_mix','eletronica','pop_treino','hip_hop','rock','sem_preferencia')),
  ADD COLUMN IF NOT EXISTS music_volume SMALLINT NOT NULL DEFAULT 55
    CHECK (music_volume BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_training_preferences_environment
  ON training_preferences(training_environment);
