CREATE INDEX IF NOT EXISTS idx_body_metrics_user_measured
  ON body_metrics(user_id, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_completed
  ON workout_sessions(user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_sets_session_completed
  ON workout_sets(workout_session_id, completed)
  WHERE completed = true;
