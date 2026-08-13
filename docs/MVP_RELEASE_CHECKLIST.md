# Evolua Core — checklist de homologação completa

## Objetivo
Preparar uma aplicação completa e funcional para homologação em Android e iOS, conectada a infraestrutura real de homologação, sem dependência de serviços locais de desenvolvimento.

## Critérios funcionais obrigatórios
- [ ] autenticação, registro, sessão persistente e logout funcionando ponta a ponta
- [ ] onboarding completo e perfil editável persistidos no backend
- [ ] check-in diário com regras determinísticas de segurança
- [ ] planejamento semanal integrado ao mobile e à API
- [ ] geração adaptativa de treino respeitando objetivo, nível, equipamentos, dores, recuperação e sinais recentes
- [ ] execução guiada com séries, repetições, carga, RIR/RPE, descanso e retomada de sessão
- [ ] progressão conservadora de carga baseada em histórico real
- [ ] registro de dor/sintomas durante treino e substituição segura de exercício
- [ ] histórico de treinos, evolução corporal, recordes e volume semanal
- [ ] diário alimentar, hidratação, metas e restrições alimentares
- [ ] tratamento de estados vazios, erros de API e perda de conectividade sem travamento bloqueante

## Infraestrutura de homologação
- [ ] API NestJS publicada em HTTPS fora da rede local
- [ ] PostgreSQL de homologação provisionado
- [ ] todas as migrações aplicadas e verificadas no banco de homologação
- [ ] variáveis e segredos separados do desenvolvimento e da produção
- [ ] `EXPO_PUBLIC_API_URL` configurada no ambiente `preview` do EAS apontando para homologação
- [ ] dados e contas de teste controlados
- [ ] healthcheck e smoke tests do ambiente disponíveis

## Segurança, auditoria e privacidade
- [ ] validações determinísticas de segurança executadas antes de recomendações automáticas
- [ ] trilha de auditoria para operações sensíveis
- [ ] logs suficientes para diagnóstico de falhas em homologação, sem expor segredos ou dados sensíveis
- [ ] política de privacidade disponível
- [ ] termos de uso disponíveis
- [ ] avisos de saúde e limitação de responsabilidade disponíveis no app
- [ ] revisão de LGPD para dados pessoais e dados de saúde
- [ ] revisão das licenças/atribuições de vídeos e demais mídias

## Builds de homologação
- [ ] projeto mobile vinculado ao Expo/EAS
- [ ] package Android `br.com.evoluacore.app` confirmado
- [ ] bundle identifier iOS `br.com.evoluacore.app` confirmado
- [ ] ícone, splash e identidade visual validados
- [ ] build Android de distribuição interna gerado e instalado em aparelho físico
- [ ] build iOS de homologação gerado e instalado/TestFlight conforme credenciais disponíveis
- [ ] ambos os builds apontando exclusivamente para a API de homologação

## Testes ponta a ponta
- [ ] criar conta
- [ ] concluir onboarding
- [ ] fechar e reabrir o app e confirmar sessão persistente
- [ ] fazer check-in diário
- [ ] visualizar planejamento semanal
- [ ] gerar treino
- [ ] iniciar e retomar treino
- [ ] registrar séries, repetições, carga e RIR
- [ ] validar cronômetro/descanso
- [ ] registrar dor/sintoma e validar orientação de segurança
- [ ] testar substituição de exercício antes da primeira série
- [ ] finalizar treino e conferir resumo/histórico/evolução
- [ ] registrar alimentação e hidratação
- [ ] editar perfil e confirmar persistência
- [ ] testar rede lenta, perda de conexão e indisponibilidade temporária da API
- [ ] executar smoke tests da API e banco após deploy

## Qualidade e integração
- [ ] CI verde no HEAD atual
- [ ] typecheck do monorepo sem erros
- [ ] build da API sem erros
- [ ] nenhuma PR obrigatória para homologação pendente ou conflitante
- [ ] testes de fluxo críticos concluídos sem perda de dados, crash ou falha de autenticação
- [ ] checklist de aceite preenchido com evidências da homologação

## Critério de conclusão
A homologação só pode ser considerada pronta quando Android e iOS estiverem conectados ao ambiente real de homologação, os fluxos críticos acima estiverem funcionando ponta a ponta, os requisitos de segurança/privacidade estiverem presentes e todas as validações automatizadas e manuais obrigatórias estiverem concluídas.

## Fora deste marco
- publicação pública final nas lojas
- escala definitiva de produção
- otimizações de capacidade específicas de produção
