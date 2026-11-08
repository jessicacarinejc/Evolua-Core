-- Remover limite histórico de três objetivos sem apagar seleções existentes.
-- Todos os objetivos permanecem validados pelo catálogo no backend.
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_goals_max_three;
