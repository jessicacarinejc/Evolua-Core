# Evolua Core — Revisão LGPD para Homologação Local

**Data da revisão:** 14/08/2026

## Classificação dos dados
O projeto trata dados pessoais comuns e dados pessoais sensíveis. Dados de saúde, dores, sintomas, condições clínicas e informações correlatas são classificados como sensíveis e devem receber proteção reforçada.

## Inventário de finalidades
| Grupo de dados | Finalidade | Observação de homologação |
|---|---|---|
| cadastro e autenticação | acesso e sessão | credenciais não devem aparecer em logs |
| perfil e preferências | personalização | limitar ao necessário |
| saúde, dores e sintomas | segurança determinística | dado sensível; acesso mínimo |
| treinos e evolução | histórico e progressão | isolado por usuário |
| alimentação e hidratação | acompanhamento | restrições críticas exigem bloqueio determinístico |
| auditoria | segurança e rastreabilidade | evitar conteúdo sensível desnecessário |
| portal profissional | acompanhamento/revisão | acesso somente por papel e vínculo |

## Controles já presentes no desenho
- autenticação e sessão persistente;
- isolamento lógico por usuário;
- regras determinísticas antes de IA/recomendações;
- proibição de alteração automática de medicamentos/insulina;
- autorização por papel e vínculo no portal profissional;
- `audit_logs` para operações sensíveis;
- homologação local sem dependência de serviços externos de build/distribuição;
- possibilidade de IA local sem envio obrigatório de dados a terceiros.

## Requisitos para homologação
- [x] política de privacidade específica da homologação;
- [x] termos de uso específicos da homologação;
- [x] avisos de saúde e limites de uso;
- [x] inventário inicial de dados e finalidades;
- [ ] revisar todos os logs para impedir exposição de dados sensíveis;
- [ ] validar contas/dados de teste controlados;
- [ ] revisar retenção e procedimento de limpeza do ambiente local;
- [ ] validar revisão final de licenças e atribuições de mídia.

## Requisitos antes de distribuição pública
Os itens abaixo não bloqueiam a homologação local com dados próprios/teste, mas bloqueiam distribuição a terceiros:
- identificação formal do controlador;
- canal de atendimento aos titulares;
- definição de encarregado quando aplicável;
- matriz definitiva de bases legais por finalidade;
- política de retenção definitiva;
- contratos e avaliação de operadores/fornecedores;
- avaliação de transferências internacionais, caso existam;
- processo formal para exercício dos direitos do titular;
- plano de resposta a incidentes e avaliação de comunicação à ANPD/titulares;
- revisão jurídica final da política e dos termos.

## Critério de segurança
Qualquer nova integração que envie dados de saúde para serviço externo deve passar por revisão de finalidade, necessidade, segurança, contrato e transparência antes de ser habilitada.
