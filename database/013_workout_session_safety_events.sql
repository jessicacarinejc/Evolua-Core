CREATE TABLE workout_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pain','symptom','substitution')),
  body_area TEXT,
  severity INTEGER CHECK (severity BETWEEN 1 AND 10),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_session_events_session
  ON workout_session_events(workout_session_id, created_at DESC);

CREATE INDEX idx_workout_session_events_exercise
  ON workout_session_events(exercise_id, created_at DESC)
  WHERE exercise_id IS NOT NULL;
