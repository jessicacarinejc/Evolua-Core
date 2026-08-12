import { Injectable } from '@nestjs/common';
import { GenerateWorkoutDto } from './generate-workout.dto';

export type WorkoutSafetyResult = {
  allowedIntensity: 'leve' | 'moderada' | 'alta';
  blockedPatterns: string[];
  notes: string[];
};

@Injectable()
export class WorkoutSafetyService {
  evaluate(input: GenerateWorkoutDto): WorkoutSafetyResult {
    const blockedPatterns = new Set<string>();
    const notes: string[] = [];

    for (const pain of input.jointPain ?? []) {
      const normalized = pain.trim().toLowerCase();

      if (normalized.includes('joelho')) {
        blockedPatterns.add('impacto-alto');
        blockedPatterns.add('flexao-profunda-joelho');
        notes.push('Dor no joelho informada: exercícios de alto impacto e flexão profunda exigem substituição ou liberação profissional.');
      }

      if (normalized.includes('ombro')) {
        blockedPatterns.add('press-acima-cabeca');
        notes.push('Dor no ombro informada: movimentos acima da cabeça devem ser evitados até avaliação adequada.');
      }

      if (normalized.includes('lombar') || normalized.includes('coluna')) {
        blockedPatterns.add('carga-axial-alta');
        notes.push('Dor lombar/coluna informada: reduzir carga axial e priorizar exercícios com maior estabilidade.');
      }
    }

    let allowedIntensity: WorkoutSafetyResult['allowedIntensity'] = 'alta';

    if (input.recoveryScore < 45) {
      allowedIntensity = 'leve';
      notes.push('Recuperação baixa: priorizar sessão leve, mobilidade ou recuperação ativa.');
    } else if (input.recoveryScore < 70) {
      allowedIntensity = 'moderada';
      notes.push('Recuperação intermediária: evitar progressão agressiva de carga nesta sessão.');
    }

    return {
      allowedIntensity,
      blockedPatterns: [...blockedPatterns],
      notes,
    };
  }
}
