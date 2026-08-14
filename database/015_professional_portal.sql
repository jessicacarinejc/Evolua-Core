ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user','professional','admin'));

CREATE TABLE IF NOT EXISTS professional_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  UNIQUE(professional_user_id, client_user_id)
);

CREATE TABLE IF NOT EXISTS professional_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN ('geral','treino','nutricao','seguranca')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_professional_assignments_professional
  ON professional_assignments(professional_user_id, active);
CREATE INDEX IF NOT EXISTS idx_professional_assignments_client
  ON professional_assignments(client_user_id, active);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_client
  ON professional_reviews(client_user_id, status, created_at DESC);
