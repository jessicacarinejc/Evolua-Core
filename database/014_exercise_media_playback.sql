-- Converte páginas de descrição do Wikimedia Commons em URLs que redirecionam
-- para o arquivo de mídia, permitindo reprodução/renderização dentro do app.
-- source_url permanece apontando para a página de origem/licença.

UPDATE exercise_videos
SET url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cloud_Hands.ogv'
WHERE url = 'https://commons.wikimedia.org/wiki/File:Cloud_Hands.ogv';

UPDATE exercise_videos
SET url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tai_Chi_Arround_the_World_%28Cap_4%29_Funchal.webm'
WHERE url = 'https://commons.wikimedia.org/wiki/File:Tai_Chi_Arround_the_World_%28Cap_4%29_Funchal.webm';

UPDATE exercise_videos
SET url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Navy-seal-buds-training-push-ups.ogv'
WHERE url = 'https://commons.wikimedia.org/wiki/File:Navy-seal-buds-training-push-ups.ogv';

UPDATE exercise_videos
SET url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Jumping_jack_movimiento.ogg'
WHERE url = 'https://commons.wikimedia.org/wiki/File:Jumping_jack_movimiento.ogg';

UPDATE exercise_videos
SET url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tricep-dips-1.gif'
WHERE url = 'https://commons.wikimedia.org/wiki/File:Tricep-dips-1.gif';

UPDATE exercise_videos
SET url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/High_knees.gif'
WHERE url = 'https://commons.wikimedia.org/wiki/File:High_knees.gif';
