# Segurança e privacidade — Evolua Core

## Classificação de dados
Dados de saúde, condições clínicas, medidas corporais, alergias, intolerâncias e histórico relacionado devem receber tratamento reforçado.

## Regras mínimas
- nunca armazenar senha em texto puro;
- autenticação e autorização centralizadas na API;
- tokens de acesso curtos e renovação segura;
- logs sem conteúdo sensível desnecessário;
- consentimentos versionados e revogáveis;
- trilha de auditoria para operações críticas;
- segregação de permissões entre usuário, personal, nutricionista e administrador;
- dados sensíveis não devem ser enviados a provedores de IA quando não forem necessários;
- nenhum segredo real deve ser versionado no GitHub.

## IA e saúde
A IA não pode substituir bloqueios determinísticos. Situações clínicas, alergias e contraindicações são avaliadas por regras antes da personalização textual ou da seleção final do plano.

## Plano de segurança por etapas
1. autenticação e RBAC;
2. criptografia e secret manager;
3. consentimentos e auditoria;
4. política de retenção, exportação e exclusão;
5. testes de autorização e abuso;
6. revisão de segurança antes de produção.
