# Evolua Core — homologação local completa

## Objetivo
Entregar uma aplicação completa e funcional para homologação local no dispositivo da usuária, sem EAS, sem Expo Build, sem Play Store, sem TestFlight e sem envio do aplicativo para serviços externos de build ou distribuição.

O artefato Android deve ser gerado localmente a partir do repositório versionado. A aplicação só entra em homologação quando os fluxos funcionais obrigatórios estiverem concluídos e integrados.

## O que homologação significa neste projeto
- código completo para o escopo definido da aplicação
- versionamento de app e build controlado no repositório
- backend, banco e app executáveis em ambiente local de homologação
- APK Android gerado localmente
- instalação e teste em aparelho físico da usuária
- nenhuma dependência de EAS ou loja para compilar/distribuir o APK
- correções e melhorias feitas após os ciclos de homologação

## Observação sobre assinatura Android
O Android exige que todo APK instalado em aparelho seja assinado. Para homologação local será usada apenas a assinatura local/de desenvolvimento criada pelas ferramentas Android, sem certificado de loja e sem publicação externa. A assinatura definitiva de produção fica fora desta etapa.

## Fluxos funcionais obrigatórios antes da homologação
- [ ] autenticação, cadastro, sessão persistente e logout
- [ ] onboarding completo e perfil editável
- [ ] check-in diário com regras determinísticas de segurança
- [x] planejamento semanal concluído e integrado
- [ ] geração adaptativa de treino
- [ ] execução guiada com séries, repetições, carga, RIR/RPE e descanso
- [ ] retomada de sessão interrompida
- [ ] progressão conservadora de carga baseada em histórico
- [ ] registro de dor/sintomas e substituição segura de exercícios
- [ ] histórico de treinos, evolução corporal, recordes e volume semanal
- [ ] diário alimentar, hidratação, metas e restrições
- [ ] estados vazios e mensagens de erro adequadas
- [ ] comportamento seguro diante de perda de conexão ou API indisponível

## Ambiente local de homologação
- [ ] PostgreSQL local provisionado
- [ ] Redis, RabbitMQ e MinIO locais quando exigidos pelo fluxo
- [ ] API NestJS executando na máquina de homologação
- [ ] todas as migrações aplicadas
- [ ] API acessível pelo celular na rede local
- [ ] `EXPO_PUBLIC_API_URL` configurada com o IP da máquina na rede local, por exemplo `http://192.168.1.10:3333/v1`
- [ ] dados de teste separados dos dados reais
- [ ] healthcheck e smoke tests executáveis localmente

## Build Android local
Pré-requisitos da máquina de build:
- Node.js compatível com o projeto
- JDK/OpenJDK
- Android SDK/Android Studio
- dependências NPM instaladas

Fluxo esperado:
1. definir `EXPO_PUBLIC_API_URL` para a API local acessível pelo aparelho
2. executar `npx expo prebuild --platform android` dentro de `apps/mobile`
3. compilar o projeto Android em modo release local
4. gerar o APK
5. copiar o artefato para `dist/` com número de versão
6. instalar manualmente no aparelho para homologação

O script `scripts/build-android-homologation.mjs` automatiza o prebuild, a compilação Gradle e a cópia do APK para `dist/evolua-core-<versão>-homologacao.apk`.

## Versionamento
- versão funcional: `expo.version`
- Android: `android.versionCode`
- iOS: `ios.buildNumber`
- cada ciclo entregue para homologação deve incrementar o build quando houver novo artefato
- tags/releases do GitHub podem ser usadas posteriormente para registrar versões aprovadas, sem publicar em loja

## Teste ponta a ponta obrigatório
- [ ] criar conta
- [ ] concluir onboarding
- [ ] fechar e reabrir o app e confirmar sessão persistente
- [ ] realizar check-in
- [ ] visualizar planejamento semanal
- [ ] gerar treino
- [ ] iniciar, interromper e retomar treino
- [ ] registrar séries, carga, repetições e RIR
- [ ] validar descanso/cronômetro
- [ ] registrar dor/sintoma
- [ ] validar substituição de exercício
- [ ] concluir treino e conferir histórico/evolução
- [ ] registrar alimentação e hidratação
- [ ] editar perfil e conferir persistência
- [ ] testar API indisponível e retorno da conexão
- [ ] confirmar ausência de crashes bloqueantes

## Segurança, privacidade e auditoria
- [ ] regras determinísticas executadas antes de recomendações automáticas
- [ ] dados sensíveis não expostos em logs
- [ ] trilha de auditoria das operações sensíveis
- [ ] política de privacidade e termos disponíveis no app
- [ ] avisos de saúde disponíveis
- [ ] revisão das licenças e atribuições das mídias

## Critério de conclusão
O projeto não será chamado de MVP. A versão será considerada pronta para homologação quando o escopo funcional definido estiver concluído, integrado e validado, a API/banco locais estiverem operacionais, o build Android local for reproduzível e o APK puder ser instalado e testado no dispositivo físico da usuária sem depender de serviços externos de build ou distribuição.

## Fora desta etapa
- publicação na Play Store/App Store
- certificado definitivo de produção
- infraestrutura definitiva de produção
