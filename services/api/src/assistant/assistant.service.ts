import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const MEDICATION_TERMS = [
  'insulina', 'insulin', 'medicação', 'medicacao', 'remédio', 'remedio', 'dose', 'dosagem',
  'metformina', 'antidepressivo', 'ansiolítico', 'ansiolitico', 'antibiótico', 'antibiotico',
];
const RED_FLAG_TERMS = [
  'dor no peito', 'desmaio', 'desmaiei', 'falta de ar intensa', 'falta de ar forte',
  'tontura intensa', 'sangramento', 'paralisia', 'convulsão', 'convulsao',
];
const DIAGNOSIS_TERMS = ['diagnóstico', 'diagnostico', 'tenho doença', 'tenho doenca', 'qual doença', 'qual doenca'];

function includesAny(text: string, terms: string[]) {
  const normalized = text.toLocaleLowerCase('pt-BR');
  return terms.some((term) => normalized.includes(term));
}

@Injectable()
export class AssistantService {
  constructor(private readonly db: DatabaseService) {}

  async ask(userId: string, message: string) {
    const clean = message.trim();
    const decision = this.preflight(clean);

    await this.db.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, metadata)
       VALUES ($1, 'assistant.ask', 'assistant_message', $2::jsonb)`,
      [userId, JSON.stringify({ decision: decision.kind, messageLength: clean.length })],
    );

    if (decision.kind !== 'allowed') {
      return {
        answer: decision.answer,
        safety: {
          blocked: true,
          reason: decision.kind,
          requiresProfessionalReview: decision.kind === 'red_flag' || decision.kind === 'diagnosis',
          medicationChangesAllowed: false,
        },
        source: 'deterministic_safety_layer',
      };
    }

    const context = await this.loadContext(userId);
    const answer = this.buildGroundedAnswer(clean, context);

    return {
      answer,
      safety: {
        blocked: false,
        reason: null,
        requiresProfessionalReview: false,
        medicationChangesAllowed: false,
      },
      source: 'grounded_local_assistant',
    };
  }

  private preflight(message: string) {
    if (includesAny(message, MEDICATION_TERMS)) {
      return {
        kind: 'medication' as const,
        answer: 'Não posso orientar ajuste, início, suspensão ou dose de medicamentos ou insulina. Posso ajudar a organizar perguntas para levar ao seu médico ou explicar informações gerais sem alterar tratamento.',
      };
    }
    if (includesAny(message, RED_FLAG_TERMS)) {
      return {
        kind: 'red_flag' as const,
        answer: 'Os sinais descritos podem exigir avaliação profissional imediata. O assistente não deve recomendar treino, dieta ou automanejo diante desses sintomas. Procure atendimento adequado e não use o app para substituir essa avaliação.',
      };
    }
    if (includesAny(message, DIAGNOSIS_TERMS)) {
      return {
        kind: 'diagnosis' as const,
        answer: 'Não posso diagnosticar doenças. Posso explicar informações gerais, organizar seus registros e ajudar a preparar perguntas para um profissional de saúde.',
      };
    }
    return { kind: 'allowed' as const, answer: '' };
  }

  private async loadContext(userId: string) {
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

  private buildGroundedAnswer(message: string, context: {
    goal: string | null;
    trainingLevel: string | null;
    painAreas: string[];
    checkin: { status: string; recovery_score: number } | null;
  }) {
    const text = message.toLocaleLowerCase('pt-BR');
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
