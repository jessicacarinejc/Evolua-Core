import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type SafetyCategory = 'allowed' | 'medication_blocked' | 'urgent_review' | 'professional_review';

@Injectable()
export class AssistantService {
  constructor(private readonly db: DatabaseService) {}

  async answer(userId: string, rawMessage: string) {
    const message = rawMessage.trim();
    const safety = this.classify(message);

    let answer: string;
    let provider: 'deterministic' | 'local_ai' = 'deterministic';

    if (safety.category === 'medication_blocked') {
      answer = 'Não posso orientar ajuste de medicação, dose, insulina ou suspensão de tratamento. Mantenha a prescrição vigente e procure o profissional responsável pela sua conduta clínica.';
    } else if (safety.category === 'urgent_review') {
      answer = 'Os sinais descritos podem exigir avaliação imediata. Interrompa atividade física e procure atendimento de urgência, especialmente se houver dor no peito, falta de ar importante, desmaio, confusão ou piora rápida.';
    } else if (safety.category === 'professional_review') {
      answer = 'Essa pergunta envolve diagnóstico ou decisão clínica individual. Posso ajudar a organizar informações e hábitos, mas a definição diagnóstica ou terapêutica deve ser feita por um profissional habilitado.';
    } else {
      const local = await this.tryLocalAi(message);
      if (local) {
        answer = local;
        provider = 'local_ai';
      } else {
        answer = this.fallback(message);
      }
    }

    await this.db.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
       VALUES ($1,'assistant.message','assistant',$1,$2::jsonb)`,
      [userId, JSON.stringify({ category: safety.category, provider, messageLength: message.length })],
    );

    return {
      answer,
      safety: {
        category: safety.category,
        blocked: safety.category !== 'allowed',
        note: safety.note,
        medicationChangesAllowed: false,
      },
      provider,
    };
  }

  private classify(message: string): { category: SafetyCategory; note: string } {
    const text = this.normalize(message);
    if (/\b(insulina|medicamento|remedio|dose|dosagem|mg|ml|comprimido|inje[cç][aã]o)\b/.test(text) && /\b(aument|reduz|diminu|parar|suspender|trocar|ajust|quanto|tomar|aplicar)\w*/.test(text)) {
      return { category: 'medication_blocked', note: 'Ajustes de medicação e insulina são sempre bloqueados antes da IA.' };
    }
    if (/dor no peito|falta de ar intensa|desmaio|perdi a consciencia|confusao|fraqueza subita|sangramento intenso/.test(text)) {
      return { category: 'urgent_review', note: 'Sinais de alerta são tratados sem consulta à IA.' };
    }
    if (/\b(diagnostico|diagnosticar|tenho .*doenca|qual doenca|tratamento para|prescrev)\w*/.test(text)) {
      return { category: 'professional_review', note: 'Diagnóstico e prescrição exigem avaliação profissional.' };
    }
    return { category: 'allowed', note: 'Pergunta liberada para orientação educativa e comportamental.' };
  }

  private async tryLocalAi(message: string): Promise<string | null> {
    const rawUrl = process.env.LOCAL_AI_URL?.trim();
    const model = process.env.LOCAL_AI_MODEL?.trim();
    if (!rawUrl || !model) return null;

    try {
      const url = new URL(rawUrl);
      if (!this.isPrivateHost(url.hostname)) return null;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: 'system',
              content: 'Você é o assistente educativo do Evolua Core. Nunca altere medicação, insulina ou dose; não diagnostique doenças; não substitua médico, nutricionista ou profissional de Educação Física. Seja conservador, prático e priorize segurança.',
            },
            { role: 'user', content: message },
          ],
        }),
      });
      if (!response.ok) return null;
      const payload = await response.json() as any;
      const text = payload?.message?.content ?? payload?.response;
      return typeof text === 'string' && text.trim() ? text.trim() : null;
    } catch {
      return null;
    }
  }

  private isPrivateHost(host: string) {
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
    if (/^10\./.test(host) || /^192\.168\./.test(host)) return true;
    const match = host.match(/^172\.(\d+)\./);
    return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
  }

  private fallback(message: string) {
    const text = this.normalize(message);
    if (/proteina|aliment|refeicao|carboidr|gordura/.test(text)) {
      return 'Posso ajudar a organizar sua alimentação de forma educativa. Priorize refeições compatíveis com suas restrições cadastradas, inclua fonte de proteína nas refeições principais e ajuste carboidratos ao seu nível de atividade. Para metas clínicas ou prescrição individual, use orientação profissional.';
    }
    if (/treino|exercicio|carga|serie|repet/.test(text)) {
      return 'Para treino, priorize técnica, recuperação e o check-in do dia. Aumentos de carga só devem ocorrer quando as sessões anteriores estiverem confortáveis e sem sinais de dor relevante. Se houver desconforto, reduza a exigência e use as substituições seguras do aplicativo.';
    }
    return 'Posso ajudar com organização de treino, alimentação, hidratação, recuperação e hábitos. Minhas orientações são educativas e sempre respeitam as regras de segurança do seu perfil.';
  }

  private normalize(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
