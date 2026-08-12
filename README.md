# Evolua Core

**Treino · Nutrição · Saúde · Evolução**

O Evolua Core é uma plataforma mobile-first para acompanhamento de treino, alimentação, evolução corporal e dados de saúde, com personalização por regras de negócio e apoio de IA.

## Produtos
- App Android e iOS
- API central
- Painel web administrativo/profissional (previsto)
- Motor adaptativo de treinos
- Nutrição e plano alimentar com restrições
- Biblioteca de exercícios e vídeos
- Evolução corporal e histórico de cargas

## Stack inicial
- Mobile: Expo SDK 56 + React Native + TypeScript
- API: NestJS 11 + TypeScript
- Dados: PostgreSQL
- Cache: Redis
- Mensageria: RabbitMQ
- Mídia: S3/MinIO
- Infraestrutura: Docker

## Estrutura
```text
apps/mobile/       aplicativo Android/iOS
services/api/      API e regras de negócio
infrastructure/    serviços locais via Docker
database/          modelo SQL inicial
docs/              arquitetura, segurança e decisões
```

## Princípios
1. IA não ignora regras de segurança.
2. Alergias e restrições críticas são bloqueios determinísticos.
3. Condições clínicas exigem tratamento conservador e avisos apropriados.
4. O aplicativo não substitui médico, nutricionista ou profissional de Educação Física.
5. Dados de saúde são tratados como dados sensíveis desde o desenho da solução.

## Desenvolvimento
```bash
npm install
npm run mobile
npm run api:dev
```

Para subir a infraestrutura local:
```bash
docker compose up -d
```

---
Projeto em desenvolvimento.
