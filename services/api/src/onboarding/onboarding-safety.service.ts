import { Injectable } from '@nestjs/common';
import { OnboardingDto } from './onboarding.dto';

type SafetyStatus = 'ok' | 'caution' | 'professional_review_required';

@Injectable()
export class OnboardingSafetyService {
  evaluate(input: OnboardingDto) {
    const normalizedConditions = input.healthConditions.map((item) => item.trim().toLowerCase());
    const normalizedPain = input.painAreas.map((item) => item.trim().toLowerCase());
    const normalizedRestrictions = input.foodRestrictions.map((item) => item.trim().toLowerCase());

    const reviewConditions = ['cardiopatia', 'doença renal', 'doenca renal', 'gestação', 'gestacao'];
    const cautionConditions = ['diabetes', 'hipertensão', 'hipertensao'];

    const professionalReview = normalizedConditions.some((item) => reviewConditions.includes(item));
    const caution = normalizedConditions.some((item) => cautionConditions.includes(item)) || normalizedPain.length > 0;

    let status: SafetyStatus = 'ok';
    if (professionalReview) status = 'professional_review_required';
    else if (caution) status = 'caution';

    const alerts: string[] = [];
    if (professionalReview) alerts.push('Há condição informada que exige revisão profissional antes de recomendações avançadas.');
    if (normalizedPain.length > 0) alerts.push('Dor recorrente informada: exercícios devem passar por filtros de contraindicação e substituição.');
    if (normalizedConditions.some((item) => cautionConditions.includes(item))) alerts.push('Condição clínica informada: metas e sugestões devem respeitar protocolo específico e limites de segurança.');

    return {
      status,
      alerts,
      hardFoodBlocks: normalizedRestrictions,
      trainingGuardrails: {
        requiresPainAwareExerciseFilter: normalizedPain.length > 0,
        requiresClinicalNutritionGuardrails: normalizedConditions.length > 0,
        allowAutomaticAdvancedPlan: status === 'ok',
      },
    };
  }
}
