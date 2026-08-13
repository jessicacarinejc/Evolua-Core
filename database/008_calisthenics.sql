INSERT INTO exercises (
  slug, name, primary_muscle, secondary_muscles, movement_pattern, equipment,
  instructions, common_errors, safety_notes, active
) VALUES
  (
    'calistenia-flexao-braco',
    'Flexão de Braço',
    'peitoral',
    ARRAY['tríceps','ombros','core'],
    'empurrar-horizontal-peso-corporal',
    ARRAY['peso corporal'],
    'Apoie as mãos aproximadamente na largura dos ombros, mantenha o corpo alinhado e desça com controle. Para reduzir a dificuldade, use os joelhos apoiados ou faça a flexão inclinada em parede ou banco firme.',
    'Abrir excessivamente os cotovelos, perder o alinhamento do tronco, prender a respiração ou acelerar a descida.',
    'Pare diante de dor em ombros, punhos, cotovelos ou peito. Escolha a versão inclinada quando a técnica da versão no chão não estiver estável.',
    true
  ),
  (
    'calistenia-polichinelo',
    'Polichinelo',
    'cardiorrespiratório',
    ARRAY['pernas','ombros','core'],
    'cardio-impacto',
    ARRAY['peso corporal'],
    'Abra e feche pernas e braços de forma coordenada por 40 segundos. Mantenha um ritmo que permita boa postura e respiração contínua. Se impacto não for confortável, faça a versão sem salto, alternando um passo lateral de cada vez.',
    'Aterrissar com impacto excessivo, deixar os joelhos colapsarem para dentro ou acelerar a ponto de perder coordenação.',
    'Use a versão sem salto diante de desconforto em joelhos, quadril ou tornozelos. Interrompa diante de tontura, falta de ar incomum ou dor.',
    true
  ),
  (
    'calistenia-mergulho-banco',
    'Mergulho no Banco',
    'tríceps',
    ARRAY['ombros','peitoral'],
    'empurrar-vertical-banco',
    ARRAY['banco','peso corporal'],
    'Use apenas um banco ou cadeira muito firme, sem rodas e apoiado contra uma superfície estável. Mantenha os ombros longe das orelhas, flexione os cotovelos de forma confortável e empurre o corpo para cima sem forçar amplitude.',
    'Usar apoio instável, descer além da amplitude confortável, elevar os ombros ou deixar o corpo afastar demais do banco.',
    'Não execute com dor em ombro, cotovelo ou punho. Uma amplitude menor e joelhos flexionados reduzem a exigência.',
    true
  ),
  (
    'calistenia-joelhos-altos',
    'Corrida Estacionária com Joelhos Altos',
    'cardiorrespiratório',
    ARRAY['core','quadríceps','flexores do quadril'],
    'cardio-corrida-estacionaria',
    ARRAY['peso corporal'],
    'Corra parado elevando os joelhos até uma altura confortável, mantendo o tronco estável e o abdômen ativo. Se o impacto não for adequado, substitua por marcha rápida elevando alternadamente os joelhos.',
    'Inclinar demais o tronco, bater os pés com impacto excessivo ou elevar os joelhos além do controle disponível.',
    'Use marcha sem salto diante de dor em joelhos, quadril ou tornozelos. A altura do joelho deve respeitar mobilidade e equilíbrio.',
    true
  ),
  (
    'calistenia-flexao-diamante-joelhos',
    'Flexão Diamante com Joelhos Apoiados',
    'tríceps',
    ARRAY['peitoral','ombros','core'],
    'empurrar-horizontal-fechado',
    ARRAY['peso corporal'],
    'Com os joelhos apoiados, aproxime as mãos sob o peito formando um triângulo confortável com polegares e indicadores. Desça somente até a amplitude em que punhos, cotovelos e ombros permaneçam confortáveis.',
    'Colocar as mãos muito à frente, abrir os cotovelos abruptamente, perder o alinhamento do tronco ou forçar a amplitude.',
    'É uma variação exigente para tríceps e articulações do membro superior. Substitua pela flexão inclinada ou convencional se houver desconforto.',
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

-- Referências visuais externas com licença aberta. O Evolua Core não re-hospeda estes arquivos.
INSERT INTO exercise_videos (exercise_id, url, provider, language, is_primary, source_url, license, attribution, usage_kind)
SELECT e.id,
       'https://commons.wikimedia.org/wiki/File:Navy-seal-buds-training-push-ups.ogv',
       'wikimedia-commons', 'en', true,
       'https://commons.wikimedia.org/wiki/File:Navy-seal-buds-training-push-ups.ogv',
       'Public Domain Mark 1.0',
       'United States Navy SEALs / Wikimedia Commons',
       'reference'
FROM exercises e
WHERE e.slug IN ('calistenia-flexao-braco','calistenia-flexao-diamante-joelhos')
  AND NOT EXISTS (
    SELECT 1 FROM exercise_videos ev
    WHERE ev.exercise_id = e.id
      AND ev.url = 'https://commons.wikimedia.org/wiki/File:Navy-seal-buds-training-push-ups.ogv'
  );

INSERT INTO exercise_videos (exercise_id, url, provider, language, is_primary, source_url, license, attribution, usage_kind)
SELECT e.id,
       'https://commons.wikimedia.org/wiki/File:Jumping_jack_movimiento.ogg',
       'wikimedia-commons', 'es', true,
       'https://commons.wikimedia.org/wiki/File:Jumping_jack_movimiento.ogg',
       'CC BY-SA 3.0',
       'Albaparejadelrio / Wikimedia Commons',
       'reference'
FROM exercises e
WHERE e.slug = 'calistenia-polichinelo'
  AND NOT EXISTS (
    SELECT 1 FROM exercise_videos ev
    WHERE ev.exercise_id = e.id
      AND ev.url = 'https://commons.wikimedia.org/wiki/File:Jumping_jack_movimiento.ogg'
  );

INSERT INTO exercise_videos (exercise_id, url, provider, language, is_primary, source_url, license, attribution, usage_kind)
SELECT e.id,
       'https://commons.wikimedia.org/wiki/File:Tricep-dips-1.gif',
       'wikimedia-commons', 'en', true,
       'https://commons.wikimedia.org/wiki/File:Tricep-dips-1.gif',
       'CC BY-SA 3.0',
       'Everkinetic / Wikimedia Commons',
       'reference'
FROM exercises e
WHERE e.slug = 'calistenia-mergulho-banco'
  AND NOT EXISTS (
    SELECT 1 FROM exercise_videos ev
    WHERE ev.exercise_id = e.id
      AND ev.url = 'https://commons.wikimedia.org/wiki/File:Tricep-dips-1.gif'
  );

INSERT INTO exercise_videos (exercise_id, url, provider, language, is_primary, source_url, license, attribution, usage_kind)
SELECT e.id,
       'https://commons.wikimedia.org/wiki/File:High_knees.gif',
       'wikimedia-commons', 'en', true,
       'https://commons.wikimedia.org/wiki/File:High_knees.gif',
       'CC BY-SA 4.0',
       'Wensceslao / Wikimedia Commons',
       'reference'
FROM exercises e
WHERE e.slug = 'calistenia-joelhos-altos'
  AND NOT EXISTS (
    SELECT 1 FROM exercise_videos ev
    WHERE ev.exercise_id = e.id
      AND ev.url = 'https://commons.wikimedia.org/wiki/File:High_knees.gif'
  );
