# Evolua Core — Nutrição visual v2

## Proposta implementada nesta branch
- Cabeçalho e resumo diário com identidade navy/verde-lima;
- Cardápio visual com cartão por refeição e troca interativa entre opções válidas;
- Catálogo inicial regional (cuscuz, inhame, banana-da-terra, abóbora, aipim e outras opções);
- Calculadora por gramas para kcal, proteína, carboidratos e gorduras;
- Registro pelo catálogo persistido no diário alimentar existente;
- Cadastro manual de rótulo preservado, porém recolhido por padrão;
- Hidratação e metas preservadas;
- Versão offline recebe opções regionais no plano.

## Precisão e segurança
- Os dados do catálogo são valores **estimados por 100 g** e deverão ser reconciliados e versionados com TBCA/USP, TACO e rótulos reais antes de ampliar o catálogo;
- Não usar imagens como prova de composição nutricional. Fotografias são **ilustrativas**, podem precisar de rede e possuem fallback textual (emoji) no modo offline;
- A primeira integração mantém a API existente para registrar as refeições e verificar restrições de usuários; as restrições locais são apenas uma camada adicional, não substituem a verificação de ingredientes/alérgenos e regras clínicas;
- O módulo não faz prescrição nutricional clínica, diagnóstico ou ajuste de medicamentos.

## Próximos incrementos (não implementados nesta branch)
1. Fotos locais licenciadas ou originais específicas de cada prato, com otimização de tamanho e atribuições;
2. Catalogação oficial validada com versão da tabela, forma de preparo, marca e ingredientes;
3. Receitas com pesos dos ingredientes e cálculo da porção por rendimento;
4. Edição/remoção do diário e seleção de data;
5. Redesign de Treino, Evolução, Perfil e fluxos multiusuário.
