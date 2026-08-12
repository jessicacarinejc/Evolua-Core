ALTER TABLE workout_sessions
  ALTER COLUMN started_at SET DEFAULT now();

ALTER TABLE workout_sets
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_workout_sets_session_exercise_set
  ON workout_sets(workout_session_id, exercise_id, set_number);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_open
  ON workout_sessions(user_id, started_at DESC)
  WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_workout_sets_session_completed
  ON workout_sets(workout_session_id, completed, set_number);
