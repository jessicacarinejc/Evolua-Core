ALTER TABLE profiles
  ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

CREATE TABLE training_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  training_days_per_week INTEGER NOT NULL CHECK (training_days_per_week BETWEEN 1 AND 7),
  session_minutes INTEGER NOT NULL CHECK (session_minutes BETWEEN 15 AND 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_code TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, equipment_code)
);

CREATE TABLE pain_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_code TEXT NOT NULL,
  label TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_equipment_user ON user_equipment(user_id);
CREATE INDEX idx_pain_areas_user_active ON pain_areas(user_id, active);
