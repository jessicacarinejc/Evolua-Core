# Evolua Core — Referência de experiência e biblioteca alimentar ampliada

## Referência visual analisada (vídeo enviado em 09/11/2026)
A pessoa usuária apresentou um app com:
- Plano pessoal: alimentação, água, treinos, caminhada e outros atalhos;
- Treinos em cartões por objetivo/modalidade/duração;
- Vídeo de pessoa real em destaque durante o exercício, com contagem regressiva,
  progresso, controles de anterior/próximo, prévia da próxima execução;
- Registro alimentar por refeição, pesquisa e acréscimo rápido com busca extensa de
  variações como ovo frito, cozido, mexido, pochê, omelete etc.

Diretrizes: aproveitar padrões funcionais de UX, não copiar identidade, textos,
vídeos ou quaisquer ativos protegidos do aplicativo de referência.

## Mudanças implementadas nesta branch
- Catálogo de alimentos de 16 para 98 entradas, com ovos, variações de preparo,
  cuscuz, banana-da-terra, frango, leguminosas, frutas, verduras e pratos prontos;
- Filtros por categoria, busca tolerante a acentos, paginação por Mostrar mais;
- Porções rápidas 1 ou 2 unidades e cálculo em gramas;
- Origem de referência, advertências sobre preparação e óleo, alerta de alérgenos;
- Exibição de mídia humana aprovada e licenciada como padrão em treinos;
- Removidas animações procedurais e boneco da UI do exercício quando falta vídeo
  humano, mantendo passo a passo, respiração e segurança;
- Mapa muscular usa ilustração anatômica humana (Wikimedia Commons, CC BY 4.0)
  com atribuição, dependente de conexão; barras por grupo ainda são estimativas;
- Vídeo priorizado no início do card de execução, orientações técnicas recolhíveis.

## Restrições que ainda precisam de trabalho
- Somente parte dos exercícios tem filmagem humana offline. A pipeline antiga
  ainda produz fallbacks animados, mas a interface desta branch não os mostra;
- Atlas remoto precisa de versão local otimizada e destaque anatômico por músculo;
- Fotos do cardápio precisam ser específicas por receita e ingredientes;
- 98 alimentos é um catálogo inicial, não base alimentar completa.
  Somente entradas explicitamente marcadas TBCA ou TACO têm fonte específica
  verificada; demais nutrientes são estimativas iniciais e precisam ser
  reconciliados com tabelas oficiais e preparo antes de produção;
- Pratos compostos precisam de receitas com pesos dos ingredientes para macros
  personalizados, e não somente valor médio por 100 g;
- A UI de vídeos ao estilo do exemplo requer uma biblioteca completa de clipes
  próprios ou licenciados, com audiovisual otimizado para Android e técnicas
  revisadas por profissional;
- Alergias: confirmação de ingrediente/rótulo continua obrigatória.

## Fontes para registros técnicos e mídia anatômica
- TBCA/USP, ovo frito em óleo de soja, código BRC0015J:
  https://www.tbca.net.br/base-dados/int_composicao_alimentos.php?n0REd3kv7e86D%2BViXWYUnQ%3D%3D=qgT16r1%2F4TZFqy4M2Wy3ZA%3D%3D
- TACO/UNICAMP, Tabela Brasileira de Composição de Alimentos (4ª ed., 2011).
- Anatomia ilustrativa: OpenStax, Tomáš Kebert e umimeto.org,
  https://commons.wikimedia.org/wiki/File:Muscles_front_and_back-es.png
  (CC BY 4.0; página da imagem inclui termos e atribuição).
