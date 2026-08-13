INSERT INTO exercises (
  slug, name, primary_muscle, secondary_muscles, movement_pattern, equipment,
  instructions, common_errors, safety_notes, active
) VALUES
  (
    'tai-chi-transferencia-equilibrio',
    'Tai Chi — Transferência de Peso e Equilíbrio',
    'pernas',
    ARRAY['glúteos','core','tornozelos'],
    'tai-chi-equilibrio',
    ARRAY['peso corporal'],
    'Em postura confortável, transfira o peso lentamente de uma perna para a outra. Antes de mover o pé livre, estabilize o corpo sobre a perna de apoio. Use apoio próximo se necessário.',
    'Transferir o peso com pressa, travar os joelhos, inclinar excessivamente o tronco ou insistir sem apoio quando houver insegurança.',
    'Mantenha leve flexão dos joelhos, nunca uma postura baixa dolorosa. Evite treino de equilíbrio sem apoio se houver tontura, instabilidade ou risco de queda.',
    true
  ),
  (
    'tai-chi-caminhada-frente',
    'Tai Chi Walking — Passos à Frente',
    'pernas',
    ARRAY['glúteos','core','panturrilhas'],
    'tai-chi-caminhada',
    ARRAY['peso corporal'],
    'Dê passos curtos e conscientes. Encoste primeiro o calcanhar, depois distribua o peso gradualmente pelo pé. Só avance o pé de trás quando o peso estiver estável na perna da frente.',
    'Dar passos longos demais, deixar o joelho cair para dentro, transferir o peso de uma vez ou prender a respiração.',
    'Use joelhos levemente flexionados para aumentar a participação muscular sem forçar a articulação. Em caso de dor no joelho, reduza a flexão e o comprimento do passo.',
    true
  ),
  (
    'tai-chi-caminhada-tras',
    'Tai Chi Walking — Passos para Trás',
    'pernas',
    ARRAY['glúteos','core','panturrilhas'],
    'tai-chi-caminhada-reversa',
    ARRAY['peso corporal'],
    'Com espaço livre e apoio estável por perto, leve um pé para trás e toque primeiro a ponta do pé. Transfira o peso de forma gradual e mantenha o olhar à frente.',
    'Dar passos grandes, olhar continuamente para os pés, cruzar as pernas ou caminhar para trás sem conferir o espaço.',
    'Faça perto de parede ou apoio firme. Se houver tontura, desequilíbrio, limitação visual importante ou insegurança, substitua por transferência de peso no lugar.',
    true
  ),
  (
    'tai-chi-chen-postura-arco',
    'Tai Chi Chen — Postura do Arco',
    'pernas',
    ARRAY['glúteos','core','panturrilhas'],
    'tai-chi-isometria',
    ARRAY['peso corporal'],
    'Dê um passo confortável à frente, flexione o joelho dianteiro dentro de uma amplitude segura e mantenha a perna de trás firme sem travar o joelho. Sustente a postura com respiração contínua e tronco organizado.',
    'Aprofundar a postura além do controle, deixar o joelho dianteiro colapsar para dentro, travar a perna de trás ou prender a respiração.',
    'Posturas mais baixas aumentam a exigência muscular, mas não devem ser usadas com dor articular. Com desconforto no joelho, use base mais curta e postura mais alta.',
    true
  ),
  (
    'tai-chi-chen-empurrar-arco',
    'Tai Chi Chen — Empurrar na Postura do Arco',
    'pernas',
    ARRAY['core','peitoral','ombros','tríceps'],
    'tai-chi-isometria-empurrar',
    ARRAY['peso corporal'],
    'Na Postura do Arco, alterne movimentos lentos de empurrar e recolher as mãos enquanto transfere pequenas parcelas do peso para frente e para trás. Mantenha o abdômen ativo e a respiração fluida.',
    'Transformar o gesto em impulso rápido, elevar os ombros, rodar o joelho ou sustentar uma base muito baixa quando a técnica já se perdeu.',
    'Priorize alinhamento e controle. Reduza a profundidade da base se a recuperação estiver baixa ou houver desconforto nos joelhos, quadris ou tornozelos.',
    true
  ),
  (
    'tai-chi-yang-aparar-cauda-passaro',
    'Tai Chi Yang — Aparar a Cauda do Pássaro',
    'core',
    ARRAY['pernas','costas','ombros','oblíquos'],
    'tai-chi-fluidez-rotacao',
    ARRAY['peso corporal'],
    'Execute a sequência em fluxo contínuo, combinando expansão e recolhimento dos braços, transferência gradual do peso e rotação suave do tronco. Mantenha a pelve estável e a respiração natural.',
    'Forçar a rotação lombar, acelerar para aumentar o esforço, travar os joelhos ou movimentar apenas os braços sem transferência de peso.',
    'A rotação controlada mobiliza o tronco e recruta a musculatura abdominal e estabilizadora; não há promessa de perda de gordura localizada nem de efeitos sobre órgãos internos. Reduza a amplitude se houver desconforto lombar.',
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

-- Referências visuais temporárias, com licença aberta e atribuição preservada.
-- Os vídeos são abertos externamente; o Evolua Core não os re-hospeda nesta fase.
INSERT INTO exercise_videos (exercise_id, url, provider, language, is_primary, source_url, license, attribution, usage_kind)
SELECT e.id,
       'https://commons.wikimedia.org/wiki/File:Tai_Chi_Arround_the_World_%28Cap_4%29_Funchal.webm',
       'wikimedia-commons',
       'multi',
       true,
       'https://commons.wikimedia.org/wiki/File:Tai_Chi_Arround_the_World_%28Cap_4%29_Funchal.webm',
       'CC BY 3.0',
       'Todo Tai Chi / Wikimedia Commons — referência geral de Tai Chi; não é tutorial específico do movimento',
       'reference'
FROM exercises e
WHERE e.slug IN (
  'tai-chi-transferencia-equilibrio',
  'tai-chi-caminhada-frente',
  'tai-chi-caminhada-tras',
  'tai-chi-yang-aparar-cauda-passaro'
)
AND NOT EXISTS (
  SELECT 1 FROM exercise_videos ev
  WHERE ev.exercise_id = e.id
    AND ev.url = 'https://commons.wikimedia.org/wiki/File:Tai_Chi_Arround_the_World_%28Cap_4%29_Funchal.webm'
);

INSERT INTO exercise_videos (exercise_id, url, provider, language, is_primary, source_url, license, attribution, usage_kind)
SELECT e.id,
       'https://commons.wikimedia.org/wiki/File:2020%E5%B9%B412%E6%9C%8820%E6%97%A5_%E6%8E%A2%E8%AE%BF%E5%A4%AA%E6%9E%81%E6%8B%B3%E5%8F%91%E6%BA%90%E5%9C%B0%E9%99%88%E5%AE%B6%E6%B2%9F%EF%BC%9A%E4%B9%A0%E5%A4%AA%E6%9E%81%E8%80%85%E2%80%9C%E4%B8%8A%E8%87%B3%E5%93%BC%E5%93%BC%E4%B8%8B%E8%87%B3%E8%83%BD%E8%83%BD%E2%80%9D.webm',
       'wikimedia-commons',
       'zh',
       true,
       'https://commons.wikimedia.org/wiki/File:2020%E5%B9%B412%E6%9C%8820%E6%97%A5_%E6%8E%A2%E8%AE%BF%E5%A4%AA%E6%9E%81%E6%8B%B3%E5%8F%91%E6%BA%90%E5%9C%B0%E9%99%88%E5%AE%B6%E6%B2%9F%EF%BC%9A%E4%B9%A0%E5%A4%AA%E6%9E%81%E8%80%85%E2%80%9C%E4%B8%8A%E8%87%B3%E5%93%BC%E5%93%BC%E4%B8%8B%E8%87%B3%E8%83%BD%E8%83%BD%E2%80%9D.webm',
       'CC BY 3.0',
       'China News Service / Wikimedia Commons — referência de prática em Chenjiagou; não é tutorial específico da Postura do Arco',
       'reference'
FROM exercises e
WHERE e.slug IN ('tai-chi-chen-postura-arco','tai-chi-chen-empurrar-arco')
AND NOT EXISTS (
  SELECT 1 FROM exercise_videos ev
  WHERE ev.exercise_id = e.id
    AND ev.url = 'https://commons.wikimedia.org/wiki/File:2020%E5%B9%B412%E6%9C%8820%E6%97%A5_%E6%8E%A2%E8%AE%BF%E5%A4%AA%E6%9E%81%E6%8B%B3%E5%8F%91%E6%BA%90%E5%9C%B0%E9%99%88%E5%AE%B6%E6%B2%9F%EF%BC%9A%E4%B9%A0%E5%A4%AA%E6%9E%81%E8%80%85%E2%80%9C%E4%B8%8A%E8%87%B3%E5%93%BC%E5%93%BC%E4%B8%8B%E8%87%B3%E8%83%BD%E8%83%BD%E2%80%9D.webm'
);