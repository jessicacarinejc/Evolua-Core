const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/v1';

export type AssistantResponse = {
  answer: string;
  safety: {
    category: 'allowed' | 'medication_blocked' | 'urgent_review' | 'professional_review';
    blocked: boolean;
    note: string;
    medicationChangesAllowed: false;
  };
  provider: 'deterministic' | 'local_ai';
};

export async function askAssistant(token: string, message: string): Promise<AssistantResponse> {
  const response = await fetch(`${API_URL}/assistant/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const text = Array.isArray(payload?.message) ? payload.message.join('\n') : payload?.message;
    throw new Error(text || 'Não foi possível obter resposta do assistente.');
  }
  return payload as AssistantResponse;
}
