ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS abandon_reason TEXT;

ALTER TABLE workout_sessions
  DROP CONSTRAINT IF EXISTS workout_sessions_abandon_reason_check;

ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_abandon_reason_check
  CHECK (abandon_reason IS NULL OR abandon_reason IN ('switch_workout','stop_without_completion'));

DROP INDEX IF EXISTS idx_workout_sessions_user_open;
CREATE INDEX idx_workout_sessions_user_open
  ON workout_sessions(user_id, started_at DESC)
  WHERE completed_at IS NULL AND abandoned_at IS NULL;
