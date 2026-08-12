# Arquitetura — Evolua Core

## Objetivo
Construir uma plataforma mobile-first para treino, nutrição, saúde e evolução, mantendo regras críticas fora do modelo de IA.

## Fluxo de decisão
```text
Dados do usuário
    ↓
Validação e consentimentos
    ↓
Motor determinístico de segurança
    ↓
Motor de treino / nutrição
    ↓
Camada de personalização por IA
    ↓
Validação final
    ↓
Plano apresentado ao usuário
```

## Contextos de domínio

### Identidade
Responsável por autenticação, sessão, recuperação de conta e perfis de acesso.

### Saúde
Condições declaradas, alergias, intolerâncias, dores, limitações e consentimentos. Esse contexto fornece bloqueios e alertas aos demais domínios.

### Treinamento
Biblioteca de exercícios, grupos musculares, equipamentos, contraindicações, planos, sessões, séries, cargas, RIR/RPE e recuperação.

### Nutrição
Metas, alimentos, nutrientes, restrições, refeições, diário alimentar e substituições. Alergias devem ser tratadas como bloqueios rígidos.

### Evolução
Peso, medidas, fotos, histórico de cargas, volume, aderência, recuperação e indicadores de progresso.

### Profissionais
Permissões explícitas para personal trainer e nutricionista visualizarem ou alterarem dados do usuário.

## Mobile
O aplicativo será desenvolvido em React Native/Expo, inicialmente com cinco áreas principais:
- Hoje
- Treino
- Nutrição
- Evolução
- Perfil

## API
A API NestJS concentra validação, autorização e regras de negócio. Nenhuma regra crítica de saúde deve existir apenas no cliente mobile.

## Dados
PostgreSQL será a fonte de verdade. Redis será usado para cache e dados efêmeros. RabbitMQ será adotado para trabalhos assíncronos. Vídeos e imagens serão armazenados em S3/MinIO.

## IA
A IA não recebe liberdade irrestrita para prescrever. Ela opera sobre um conjunto de opções previamente permitido por regras, preferências e dados do usuário.

## Segurança
- princípio do menor privilégio;
- criptografia em trânsito e em repouso;
- segregação lógica de dados sensíveis;
- trilha de auditoria;
- consentimento versionado;
- minimização de dados enviados a provedores externos;
- secrets apenas em variáveis de ambiente/secret manager;
- exclusão e exportação de dados previstas desde a arquitetura.
