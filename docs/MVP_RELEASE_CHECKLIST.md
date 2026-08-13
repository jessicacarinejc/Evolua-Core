# Evolua Core — checklist do primeiro MVP instalável

## Objetivo
Gerar primeiro um APK Android de distribuição interna para teste em aparelho físico. Depois dos testes e correções, preparar iOS/TestFlight e publicação nas lojas.

## Escopo congelado do MVP
- autenticação e sessão
- onboarding e perfil
- check-in diário
- geração e execução de treino
- séries, carga, RIR/RPE e descanso
- progressão conservadora de carga
- dor/sintomas e substituição segura de exercício
- diário alimentar e hidratação
- evolução corporal e histórico

Funcionalidades novas que não bloqueiam o fluxo acima ficam para uma versão posterior.

## Antes do build Android
- [ ] API NestJS acessível por HTTPS fora da rede local
- [ ] PostgreSQL de teste com migrações aplicadas
- [ ] configurar `EXPO_PUBLIC_API_URL` no ambiente `preview` do EAS
- [ ] vincular `apps/mobile` a um projeto Expo/EAS
- [ ] confirmar package Android `br.com.evoluacore.app`
- [ ] confirmar ícone e splash
- [ ] executar typecheck e build da API

## Build de teste
A partir de `apps/mobile`, executar o perfil `preview` do EAS para gerar APK de distribuição interna.

O perfil `preview` deve gerar APK instalável diretamente em aparelho Android. O perfil `production` fica reservado para builds destinados às lojas.

## Teste de ponta a ponta
- [ ] instalar APK em aparelho físico
- [ ] criar conta
- [ ] concluir onboarding
- [ ] fechar e reabrir o app e confirmar sessão persistente
- [ ] fazer check-in diário
- [ ] gerar treino
- [ ] iniciar treino
- [ ] registrar séries, repetições, carga e RIR
- [ ] testar cronômetro/descanso
- [ ] registrar dor/sintoma e validar orientação de segurança
- [ ] testar substituição de exercício antes da primeira série
- [ ] finalizar treino e conferir resumo
- [ ] conferir evolução/histórico
- [ ] registrar alimentação e hidratação
- [ ] editar perfil e confirmar persistência
- [ ] testar rede lenta/sem conexão e mensagens de erro

## Critério para avançar ao iOS
Todos os fluxos críticos acima devem estar funcionais no Android sem perda de dados, travamentos bloqueantes ou falhas de autenticação.

## Depois do MVP testado
- iOS/TestFlight
- política de privacidade e termos
- revisão final de LGPD e dados de saúde
- mídia própria/licenciada para exercícios
- screenshots e textos de loja
- publicação Play Store/App Store
