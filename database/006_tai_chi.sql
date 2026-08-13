ALTER TABLE exercise_videos
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS license TEXT,
  ADD COLUMN IF NOT EXISTS attribution TEXT,
  ADD COLUMN IF NOT EXISTS usage_kind TEXT NOT NULL DEFAULT 'production';

INSERT INTO exercises (
  slug, name, primary_muscle, secondary_muscles, movement_pattern, equipment,
  instructions, common_errors, safety_notes, active
) VALUES
  (
    'tai-chi-despertar-qi',
    'Tai Chi — Despertar do Qi',
    'cardiorrespiratório',
    ARRAY['core','pernas','ombros'],
    'tai-chi-mobilidade',
    ARRAY['peso corporal'],
    'Fique em pé com os pés na largura dos ombros. Inspire elevando os braços até a altura do peito e expire ao descer lentamente. Flexione os joelhos apenas dentro de uma amplitude confortável e mantenha o abdômen levemente ativo.',
    'Prender a respiração, elevar os ombros, acelerar o movimento e aprofundar demais a flexão dos joelhos.',
    'Use postura mais alta se houver desconforto nos joelhos, quadril, tornozelos ou tontura. Interrompa diante de sintomas novos.',
    true
  ),
  (
    'tai-chi-maos-como-nuvens',
    'Tai Chi — Mover as Mãos como Nuvens',
    'pernas',
    ARRAY['glúteos','core','ombros'],
    'tai-chi-transferencia-peso',
    ARRAY['peso corporal'],
    'Afaste os pés um pouco além da largura dos ombros e transfira o peso de um lado para o outro, coordenando as mãos em movimentos circulares à frente do corpo. Para aumentar o esforço, use uma postura um pouco mais baixa somente se estiver sem dor e com bom controle.',
    'Deixar os joelhos colapsarem para dentro, transferir o peso com pressa, torcer os joelhos ou manter a postura baixa apesar de dor.',
    'A postura baixa aumenta a exigência muscular das pernas, mas não deve ser usada com dor no joelho. Priorize alinhamento e controle.',
    true
  ),
  (
    'tai-chi-repelir-macaco',
    'Tai Chi — Repelir o Macaco',
    'core',
    ARRAY['pernas','ombros','costas'],
    'tai-chi-passos-rotacao',
    ARRAY['peso corporal'],
    'Dê um passo curto para trás enquanto uma mão empurra suavemente à frente e a outra recolhe. Alterne os lados de forma contínua e controlada, mantendo a rotação do tronco confortável e os joelhos alinhados.',
    'Girar a lombar de forma brusca, dar passos longos demais, perder o equilíbrio ou acelerar a sequência sem controle.',
    'A rotação do tronco trabalha coordenação e musculatura do core e contribui para o gasto energético do bloco; ela não reduz gordura localizada. Reduza a rotação se houver desconforto lombar.',
    true
  ),
  (
    'tai-chi-abracar-arvore',
    'Tai Chi — Abraçar a Árvore',
    'core',
    ARRAY['pernas','ombros','postura'],
    'tai-chi-postura',
    ARRAY['peso corporal'],
    'Volte a uma postura estável com os joelhos levemente flexionados. Forme um círculo confortável com os braços à frente do peito, respire de forma lenta e deixe a frequência cardíaca desacelerar gradualmente.',
    'Enrijecer os ombros, prender a respiração, flexionar demais os joelhos ou sustentar tensão desnecessária nas mãos.',
    'Mantenha postura confortável e estável. Se sentir tontura, falta de ar incomum ou dor, interrompa e faça uma recuperação segura.',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  primary_muscle = EXCLUDED.primary_muscle,
  secondary_muscles = EXCLUDED.secondary_muscles,
  movement_pattern = EXCLUDED.movement_pattern,
  equipment = EXCLUDED.equipment,
  instructions = EXCLUDED.instructions,
  common_errors = EXCLUDED.common_errors,
  safety_notes = EXCLUDED.safety_notes,
  active = EXCLUDED.active;

-- Vídeos externos de referência com licença aberta. Não são re-hospedados pelo Evolua Core.
-- Cloud Hands é específico para o movimento "Mãos como Nuvens".
INSERT INTO exercise_videos (exercise_id, url, provider, language, is_primary, source_url, license, attribution, usage_kind)
SELECT e.id,
       'https://commons.wikimedia.org/wiki/File:Cloud_Hands.ogv',
       'wikimedia-commons',
       'en',
       true,
       'https://commons.wikimedia.org/wiki/File:Cloud_Hands.ogv',
       'CC BY-SA 3.0',
       'Markblohm / Wikimedia Commons',
       'reference'
FROM exercises e
WHERE e.slug = 'tai-chi-maos-como-nuvens'
  AND NOT EXISTS (
    SELECT 1 FROM exercise_videos ev
    WHERE ev.exercise_id = e.id AND ev.url = 'https://commons.wikimedia.org/wiki/File:Cloud_Hands.ogv'
  );

-- Vídeo geral de Tai Chi usado como referência visual temporária para os demais movimentos.
INSERT INTO exercise_videos (exercise_id, url, provider, language, is_primary, source_url, license, attribution, usage_kind)
SELECT e.id,
       'https://commons.wikimedia.org/wiki/File:Tai_Chi_Arround_the_World_%28Cap_4%29_Funchal.webm',
       'wikimedia-commons',
       'multi',
       true,
       'https://commons.wikimedia.org/wiki/File:Tai_Chi_Arround_the_World_%28Cap_4%29_Funchal.webm',
       'CC BY 3.0',
       'Todo Tai Chi / Wikimedia Commons',
       'reference'
FROM exercises e
WHERE e.slug IN ('tai-chi-despertar-qi','tai-chi-repelir-macaco','tai-chi-abracar-arvore')
  AND NOT EXISTS (
    SELECT 1 FROM exercise_videos ev
    WHERE ev.exercise_id = e.id
      AND ev.url = 'https://commons.wikimedia.org/wiki/File:Tai_Chi_Arround_the_World_%28Cap_4%29_Funchal.webm'
  );