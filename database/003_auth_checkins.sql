CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_sessions_user_active
  ON auth_sessions(user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5),
  energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  muscle_soreness INTEGER NOT NULL CHECK (muscle_soreness BETWEEN 0 AND 10),
  joint_pain INTEGER NOT NULL CHECK (joint_pain BETWEEN 0 AND 10),
  available_minutes INTEGER NOT NULL CHECK (available_minutes BETWEEN 15 AND 180),
  pain_areas TEXT[] NOT NULL DEFAULT '{}',
  new_symptoms BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  recovery_score INTEGER NOT NULL CHECK (recovery_score BETWEEN 0 AND 100),
  status TEXT NOT NULL CHECK (status IN ('ready','modified','recovery','professional_review_required')),
  evaluation JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

CREATE INDEX idx_daily_checkins_user_date
  ON daily_checkins(user_id, checkin_date DESC);
