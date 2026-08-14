const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/v1';

export type MealPlanCandidate = {
  title: string;
  ingredients: string[];
  tags: string[];
};

export type PersonalizedMealPlan = {
  goal: string;
  meals: Array<{
    key: string;
    label: string;
    selected: MealPlanCandidate | null;
    alternatives: MealPlanCandidate[];
    unavailable: boolean;
  }>;
  safety: {
    hardBlocksApplied: string[];
    clinicalReviewRecommended: boolean;
    automaticPrescription: boolean;
    conditions: Array<{ code: string; label: string }>;
    note: string;
  };
};

export async function loadPersonalizedMealPlan(token: string): Promise<PersonalizedMealPlan> {
  const response = await fetch(`${API_URL}/nutrition/plan`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join('\n')
      : payload?.message ?? 'Não foi possível carregar o planejamento alimentar.';
    throw new Error(message);
  }
  return payload as PersonalizedMealPlan;
}
