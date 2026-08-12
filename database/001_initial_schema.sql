CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  birth_date DATE,
  sex_at_birth TEXT,
  height_cm NUMERIC(5,2),
  timezone TEXT NOT NULL DEFAULT 'America/Bahia',
  training_level TEXT CHECK (training_level IN ('iniciante','intermediario','avancado')),
  primary_goal TEXT CHECK (primary_goal IN ('emagrecimento','hipertrofia','forca','condicionamento','manutencao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE health_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  details TEXT,
  severity TEXT CHECK (severity IN ('informativa','atencao','critica')),
  confirmed_by_professional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE food_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('alergia','intolerancia','preferencia','religiosa','clinica')),
  item TEXT NOT NULL,
  hard_block BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight_kg NUMERIC(6,2),
  body_fat_percent NUMERIC(5,2),
  waist_cm NUMERIC(6,2),
  hip_cm NUMERIC(6,2),
  chest_cm NUMERIC(6,2),
  notes TEXT
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] NOT NULL DEFAULT '{}',
  movement_pattern TEXT NOT NULL,
  equipment TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT,
  common_errors TEXT,
  safety_notes TEXT,
  video_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exercise_contraindications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  condition_code TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('block','caution','requires_professional_review')),
  rationale TEXT NOT NULL
);

CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','cancelled')),
  goal TEXT NOT NULL,
  planned_date DATE NOT NULL,
  estimated_minutes INTEGER,
  generation_source TEXT NOT NULL DEFAULT 'rules' CHECK (generation_source IN ('rules','professional','hybrid_ai')),
  safety_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workout_plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  sequence INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps_min INTEGER,
  reps_max INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  target_rir NUMERIC(3,1),
  notes TEXT,
  UNIQUE(workout_plan_id, sequence)
);

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
  pain_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  feedback TEXT
);

CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  repetitions INTEGER,
  load_kg NUMERIC(7,2),
  duration_seconds INTEGER,
  rir NUMERIC(3,1),
  completed BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE nutrition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  valid_from DATE NOT NULL,
  valid_to DATE,
  calories_kcal INTEGER,
  protein_g NUMERIC(7,2),
  carbs_g NUMERIC(7,2),
  fat_g NUMERIC(7,2),
  fiber_g NUMERIC(7,2),
  water_ml INTEGER,
  created_by TEXT NOT NULL DEFAULT 'system' CHECK (created_by IN ('system','nutritionist')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  serving_g NUMERIC(8,2) NOT NULL DEFAULT 100,
  calories_kcal NUMERIC(8,2),
  protein_g NUMERIC(8,2),
  carbs_g NUMERIC(8,2),
  fat_g NUMERIC(8,2),
  fiber_g NUMERIC(8,2),
  sodium_mg NUMERIC(10,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe','lanche_manha','almoco','lanche_tarde','jantar','ceia','outro')),
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE TABLE meal_log_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id),
  quantity_g NUMERIC(8,2) NOT NULL
);

CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  document_version TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_health_conditions_user ON health_conditions(user_id);
CREATE INDEX idx_food_restrictions_user ON food_restrictions(user_id);
CREATE INDEX idx_body_metrics_user_date ON body_metrics(user_id, measured_at DESC);
CREATE INDEX idx_workout_plans_user_date ON workout_plans(user_id, planned_date DESC);
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, consumed_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
