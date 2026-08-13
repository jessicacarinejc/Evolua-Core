CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_session_completed
  ON workout_sets(exercise_id, workout_session_id)
  WHERE completed = true;
