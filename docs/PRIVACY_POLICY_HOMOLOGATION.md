# Evolua Core — Política de Privacidade para Homologação Local

**Versão:** 0.1.0-homologação  
**Data:** 14/08/2026

## 1. Escopo
Esta política descreve o tratamento de dados no Evolua Core durante a homologação local. A aplicação é executada em ambiente controlado pela responsável pelo projeto, sem publicação em lojas e sem uso obrigatório de serviços externos de build ou distribuição.

Antes de qualquer distribuição pública ou tratamento de dados de terceiros, a identificação formal do controlador, canal de atendimento ao titular e, quando aplicável, encarregado de dados deverão ser definidos e publicados.

## 2. Dados tratados
O Evolua Core pode tratar, conforme os recursos utilizados:
- dados de cadastro e autenticação;
- nome, data de nascimento, altura e peso;
- objetivos, preferências e disponibilidade para treino;
- histórico de treinos, cargas, repetições, RIR/RPE e evolução corporal;
- alimentação, hidratação e restrições alimentares;
- dores, sintomas, condições de saúde e informações relacionadas a segurança do treino;
- registros técnicos de sessão, auditoria e eventos de segurança.

Dados referentes à saúde são tratados como dados pessoais sensíveis e exigem proteção reforçada.

## 3. Finalidades
Os dados são tratados para:
- autenticar e manter a sessão do usuário;
- personalizar treinos, planejamento alimentar educativo e acompanhamento;
- aplicar regras determinísticas de segurança antes de recomendações automáticas;
- registrar evolução e histórico;
- permitir revisão profissional quando configurada;
- investigar falhas, manter segurança e registrar operações sensíveis;
- executar testes de homologação.

O aplicativo não deve utilizar dados de saúde para publicidade comportamental durante a homologação.

## 4. Decisões automatizadas e IA
Recomendações automáticas são subordinadas a regras determinísticas de segurança. O assistente não tem permissão para diagnosticar, iniciar, suspender ou alterar dose de medicamentos ou insulina.

Quando uma camada de IA local estiver habilitada, ela continua subordinada às mesmas regras antes e depois da geração da resposta. O modo padrão de homologação não exige envio de dados de saúde a provedores externos de IA.

## 5. Armazenamento e ambiente local
Na homologação local, banco de dados, API e serviços auxiliares podem ser executados na máquina da própria usuária, acessíveis pelo dispositivo na rede local.

Credenciais, segredos e dados de homologação não devem ser versionados no GitHub. Logs devem evitar conteúdo sensível desnecessário.

## 6. Compartilhamento
O projeto não depende de compartilhamento com Play Store, TestFlight, EAS ou serviços externos de distribuição para a homologação local.

O acesso profissional, quando habilitado, deve ocorrer somente por vínculo explícito e autorização por papel. Operações sensíveis devem permanecer auditáveis.

## 7. Retenção e eliminação
Dados de homologação devem ser mantidos apenas pelo período necessário aos testes, correções, segurança e obrigações aplicáveis. Dados de teste podem ser apagados ao reinicializar o ambiente local, observadas necessidades legítimas de auditoria ou conservação legal.

## 8. Direitos do titular
O titular poderá, conforme aplicável, solicitar confirmação do tratamento, acesso, correção, informação sobre uso/compartilhamento, bloqueio, anonimização ou eliminação de dados tratados em desconformidade, além de outros direitos previstos na LGPD.

Durante a homologação local, esses direitos devem ser exercidos diretamente perante a responsável pelo ambiente. Antes de distribuição a terceiros, um canal formal de atendimento deverá ser definido.

## 9. Segurança
O projeto adota como requisitos:
- autenticação e isolamento por usuário;
- armazenamento seguro de sessão no dispositivo;
- regras determinísticas de segurança;
- autorização por papel e vínculo no portal profissional;
- trilha de auditoria para operações sensíveis;
- separação entre dados de homologação e produção;
- revisão para impedir exposição de dados sensíveis em logs.

## 10. Incidentes
Durante a homologação, qualquer exposição indevida, acesso não autorizado ou perda relevante de dados deve ser registrada, investigada e corrigida antes de ampliar o uso do sistema. A necessidade de comunicação a titulares e à ANPD deverá ser avaliada conforme a legislação aplicável e o risco do incidente.

## 11. Pendências antes de distribuição pública
Antes de disponibilizar o Evolua Core a terceiros, é obrigatório:
- identificar formalmente o controlador;
- publicar canal de atendimento ao titular;
- definir encarregado quando aplicável;
- revisar bases legais por finalidade;
- definir prazos de retenção definitivos;
- revisar fornecedores e transferências de dados;
- revisar segurança, termos, política e consentimentos necessários.
