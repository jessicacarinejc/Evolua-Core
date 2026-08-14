import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const MEDICATION_TERMS = [
  'insulina', 'insulin', 'medicação', 'medicacao', 'remédio', 'remedio',
  'metformina', 'antidepressivo', 'ansiolítico', 'ansiolitico', 'antibiótico', 'antibiotico',
];
const MEDICATION_CHANGE_TERMS = [
  'aumente a dose', 'reduza a dose', 'diminua a dose', 'tome ', 'pare de tomar', 'suspenda',
  'interrompa o medicamento', 'aplique insulina', 'unidades de insulina', 'ajuste a insulina',
];
const RED_FLAG_TERMS = [
  'dor no peito', 'desmaio', 'desmaiei', 'falta de ar intensa', 'falta de ar forte',
  'tontura intensa', 'sangramento', 'paralisia', 'convulsão', 'convulsao',
];
const DIAGNOSIS_TERMS = ['diagnóstico', 'diagnostico', 'tenho doença', 'tenho doenca', 'qual doença', 'qual doenca'];

function normalize(text: string) {
  return text.toLocaleLowerCase('pt-BR');
}

function includesAny(text: string, terms: string[]) {
  const normalized = normalize(text);
  return terms.some((term) => normalized.includes(term));
}

type AssistantContext = {
  goal: string | null;
  trainingLevel: string | null;
  painAreas: string[];
  checkin: { status: string; recovery_score: number } | null;
};

@Injectable()
export class AssistantService {
  constructor(private readonly db: DatabaseService) {}

  async ask(userId: string, message: string) {
    const clean = message.trim();
    const decision = this.preflight(clean);

    await this.audit(userId, decision.kind, clean.length);

    if (decision.kind !== 'allowed') {
      return this.blocked(decision.kind, decision.answer);
    }

    const context = await this.loadContext(userId);
    const localAiAnswer = await this.askLocalAi(clean, context);
    const candidate = localAiAnswer ?? this.buildGroundedFallback(clean, context);
    const postflight = this.postflight(candidate);

    if (!postflight.allowed) {
      await this.audit(userId, 'model_output_blocked', clean.length);
      return this.blocked(
        'model_output_blocked',
        'A resposta automática foi bloqueada pelas regras de segurança. Não posso orientar alteração de medicação, insulina ou tratamento. Posso ajudar a organizar perguntas para um profissional de saúde.',
      );
    }

    return {
      answer: candidate,
      safety: {
        blocked: false,
        reason: null,
        requiresProfessionalReview: false,
        medicationChangesAllowed: false,
      },
      source: localAiAnswer ? 'local_ai_after_deterministic_safety' : 'grounded_local_fallback',
    };
  }

  private async audit(userId: string, decision: string, messageLength: number) {
    await this.db.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, metadata)
       VALUES ($1, 'assistant.ask', 'assistant_message', $2::jsonb)`,
      [userId, JSON.stringify({ decision, messageLength })],
    );
  }

  private blocked(reason: string, answer: string) {
    return {
      answer,
      safety: {
        blocked: true,
        reason,
        requiresProfessionalReview: ['red_flag', 'diagnosis', 'model_output_blocked'].includes(reason),
        medicationChangesAllowed: false,
      },
      source: 'deterministic_safety_layer',
    };
  }

  private preflight(message: string) {
    const normalized = normalize(message);
    if (includesAny(normalized, RED_FLAG_TERMS)) {
      return {
        kind: 'red_flag' as const,
        answer: 'Os sinais descritos podem exigir avaliação profissional imediata. O assistente não deve recomendar treino, dieta ou automanejo diante desses sintomas. Procure atendimento adequado e não use o app para substituir essa avaliação.',
      };
    }
    if (includesAny(normalized, DIAGNOSIS_TERMS)) {
      return {
        kind: 'diagnosis' as const,
        answer: 'Não posso diagnosticar doenças. Posso explicar informações gerais, organizar seus registros e ajudar a preparar perguntas para um profissional de saúde.',
      };
    }
    if (includesAny(normalized, MEDICATION_TERMS) && this.requestsTreatmentChange(normalized)) {
      return {
        kind: 'medication' as const,
        answer: 'Não posso orientar ajuste, início, suspensão ou dose de medicamentos ou insulina. Posso ajudar a organizar perguntas para levar ao seu médico ou explicar informações gerais sem alterar tratamento.',
      };
    }
    return { kind: 'allowed' as const, answer: '' };
  }

  private requestsTreatmentChange(message: string) {
    const actionTerms = ['aument', 'reduz', 'diminu', 'dose', 'dosagem', 'parar', 'suspender', 'trocar', 'substituir', 'tomar', 'aplicar', 'unidades'];
    return actionTerms.some((term) => message.includes(term));
  }

  private postflight(answer: string) {
    return { allowed: !includesAny(answer, MEDICATION_CHANGE_TERMS) };
  }

  private async loadContext(userId: string): Promise<AssistantContext> {
    const profile = await this.db.query<{
      primary_goal: string | null;
      training_level: string | null;
      pain_areas: string[] | null;
    }>(
      `SELECT p.primary_goal, p.training_level,
              COALESCE(array_agg(DISTINCT pa.body_area) FILTER (WHERE pa.body_area IS NOT NULL), '{}') AS pain_areas
       FROM profiles p
       LEFT JOIN pain_areas pa ON pa.user_id = p.user_id
       WHERE p.user_id = $1
       GROUP BY p.primary_goal, p.training_level`,
      [userId],
    ).catch(() => ({ rows: [] } as any));

    const checkin = await this.db.query<{ status: string; recovery_score: number }>(
      `SELECT status, recovery_score
       FROM daily_checkins
       WHERE user_id = $1
       ORDER BY checkin_date DESC
       LIMIT 1`,
      [userId],
    ).catch(() => ({ rows: [] } as any));

    return {
      goal: profile.rows[0]?.primary_goal ?? null,
      trainingLevel: profile.rows[0]?.training_level ?? null,
      painAreas: profile.rows[0]?.pain_areas ?? [],
      checkin: checkin.rows[0] ?? null,
    };
  }

  private async askLocalAi(message: string, context: AssistantContext): Promise<string | null> {
    const endpoint = process.env.LOCAL_AI_URL?.trim();
    const model = process.env.LOCAL_AI_MODEL?.trim();
    if (!endpoint || !model) return null;

    const system = [
      'Você é o Evolua Assist, um assistente de bem-estar e organização do Evolua Core.',
      'Responda em português do Brasil, com linguagem clara, curta e conservadora.',
      'Nunca diagnostique doenças. Nunca recomende iniciar, suspender, trocar ou ajustar dose de medicamento ou insulina.',
      'Nunca substitua médico, nutricionista ou profissional de Educação Física.',
      'Use apenas o contexto fornecido; não invente exames, condições, metas ou histórico.',
      'Diante de dor nova, sintomas relevantes ou dúvida clínica, recomende registro no app e avaliação profissional apropriada.',
    ].join(' ');

    const userContext = {
      objetivo: context.goal,
      nivelTreino: context.trainingLevel,
      areasDorRegistradas: context.painAreas,
      checkinMaisRecente: context.checkin,
    };

    try {
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: `Contexto do usuário: ${JSON.stringify(userContext)}\n\nPergunta: ${message}` },
          ],
          options: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) return null;
      const payload = await response.json() as { message?: { content?: string } };
      const answer = payload.message?.content?.trim();
      return answer || null;
    } catch {
      return null;
    }
  }

  private buildGroundedFallback(message: string, context: AssistantContext) {
    const text = normalize(message);
    const recovery = context.checkin
      ? `Seu check-in mais recente está como ${context.checkin.status}, com recuperação ${context.checkin.recovery_score}%. `
      : 'Você ainda não tem um check-in recente disponível. ';

    if (text.includes('treino') || text.includes('exercício') || text.includes('exercicio')) {
      const pain = context.painAreas.length
        ? `Considere também as áreas de dor registradas: ${context.painAreas.join(', ')}. `
        : '';
      return `${recovery}${pain}Use o treino gerado pelo Evolua Core porque ele aplica suas regras de segurança antes de selecionar exercícios. Se aparecer dor nova, tontura ou falta de ar, registre o sintoma no treino para que o próximo plano seja reavaliado.`;
    }

    if (text.includes('comer') || text.includes('aliment') || text.includes('proteína') || text.includes('proteina')) {
      return 'Posso orientar a organização alimentar com base no plano já cadastrado, respeitando restrições e bloqueios. Para metas clínicas, calorias ou macronutrientes terapêuticos, mantenha revisão de nutricionista. Confira sempre ingredientes e rótulos em caso de alergia ou intolerância.';
    }

    if (text.includes('progres') || text.includes('carga')) {
      return `${recovery}A progressão do app só aumenta carga quando o histórico recente atende aos critérios de repetições e esforço. Técnica, recuperação, dor e orientação profissional têm prioridade sobre qualquer aumento sugerido.`;
    }

    return 'Posso ajudar com treino, alimentação, recuperação, uso do aplicativo e interpretação dos seus próprios registros. Minhas respostas passam primeiro por regras de segurança e não substituem médico, nutricionista ou profissional de Educação Física.';
  }
}
