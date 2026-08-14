# Homologação física local — Evolua Core

Este roteiro valida a instalação local no aparelho físico sem EAS, Play Store, TestFlight ou serviço externo de distribuição.

## Pré-requisitos

- Node.js 20.19 ou superior.
- Docker Desktop/Engine e Docker Compose.
- Android Studio com Android SDK, Platform-Tools e Build-Tools instalados.
- Java/JDK compatível com o Gradle do projeto.
- Celular Android e computador conectados à mesma rede local.
- Depuração USB habilitada apenas se a instalação for feita via `adb`.

## 1. Preparar ambiente

1. Copie `.env.homologation.example` para `.env.homologation`.
2. Descubra o IPv4 do computador na rede local.
3. Configure `EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3333/v1`.
4. Nunca use `localhost`, `127.0.0.1` ou `10.0.2.2` para aparelho físico.

## 2. Subir infraestrutura e API

```bash
npm run homologacao:infra
npm run homologacao:migrate
npm run api:build
npm run homologacao:api
```

A API escuta em `0.0.0.0`, portanto pode receber conexões da rede local quando a porta estiver liberada no firewall.

Em outro terminal execute:

```bash
npm run homologacao:rede
```

Resultado esperado: `API acessível pelo endereço de rede local: OK`.

No navegador do celular, abra a URL de readiness exibida pelo comando. O teste só deve seguir se essa URL responder no aparelho físico.

## 3. Gerar APK local instalável

```bash
npm run homologacao:android
```

O processo deve:

- gerar o projeto Android nativo com `expo prebuild --clean`;
- confirmar assinatura local de desenvolvimento para o build `release`;
- habilitar HTTP local no `AndroidManifest` somente quando a API usar `http://`;
- executar `assembleRelease`;
- validar assinatura e integridade com `apksigner`;
- gerar o APK em `dist/`;
- gerar manifesto JSON com versão, `versionCode`, URL da API, tamanho, SHA-256 do APK e SHA-256 do certificado local quando disponível.

A assinatura utilizada neste canal é somente para tornar o APK instalável durante a homologação local. Ela não é chave de publicação em loja.

## 4. Instalar no Android

Com USB/ADB:

```bash
adb devices
adb install -r dist/evolua-core-0.1.0-b1-homologacao.apk
```

Ou transfira o APK diretamente para o aparelho e permita temporariamente a instalação de aplicativos daquela origem.

## 5. Critérios de aceite no aparelho

- [ ] Aplicativo instala sem erro de assinatura.
- [ ] Aplicativo abre sem depender de Metro/Expo Go.
- [ ] Cadastro e login funcionam.
- [ ] Onboarding salva e retorna ao fluxo esperado.
- [ ] Check-in diário funciona.
- [ ] Planejamento semanal é carregado.
- [ ] Treino diário é gerado e uma sessão pode ser iniciada/retomada.
- [ ] Registro de séries, carga/RIR/RPE e descanso funciona.
- [ ] Dor/sintoma provoca comportamento seguro e substituição quando aplicável.
- [ ] Nutrição, diário alimentar e hidratação funcionam.
- [ ] Evolução/histórico carregam.
- [ ] Vídeos abrem no player integrado.
- [ ] Assistente bloqueia pedido de alteração de medicação/insulina.
- [ ] Portal/fluxos profissionais respeitam autorização.
- [ ] Desligar a API não apaga a sessão local e apresenta estado de indisponibilidade/retry.
- [ ] Reativar a API permite retomar os fluxos sem reinstalar o app.
- [ ] Nenhum token, senha ou conteúdo de saúde aparece nos logs HTTP estruturados.

## 6. Evidências da homologação

Registrar para cada build testado:

- versão e `versionCode`;
- SHA-256 do APK;
- SHA-256 do certificado local;
- modelo e versão do Android do aparelho;
- data/hora do teste;
- itens aprovados/reprovados;
- prints ou descrição objetiva de qualquer falha.

## 7. iOS após início da homologação Android

Em macOS com Xcode e CocoaPods:

```bash
npm run homologacao:ios
```

Esse comando valida o build local por Xcode sem TestFlight e sem serviço externo. A validação física em iPhone exige os mecanismos locais de assinatura/provisionamento impostos pela Apple; nenhum envio para loja faz parte deste fluxo.
