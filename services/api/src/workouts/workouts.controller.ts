import { Body, Controller, Post } from '@nestjs/common';
import { GenerateWorkoutDto } from './generate-workout.dto';
import { WorkoutSafetyService } from './workout-safety.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly safety: WorkoutSafetyService) {}

  @Post('generate')
  generate(@Body() input: GenerateWorkoutDto) {
    const safety = this.safety.evaluate(input);

    const exercisePool = [
      { id: 'leg-press', name: 'Leg Press 45°', pattern: 'flexao-profunda-joelho', equipment: 'leg press' },
      { id: 'hip-thrust', name: 'Hip Thrust', pattern: 'extensao-quadril', equipment: 'barra' },
      { id: 'seated-leg-curl', name: 'Mesa Flexora Sentada', pattern: 'flexao-joelho-controlada', equipment: 'mesa flexora' },
      { id: 'cable-abduction', name: 'Abdução de Quadril no Cabo', pattern: 'abducao-quadril', equipment: 'cabo' },
      { id: 'bike', name: 'Bicicleta Ergométrica', pattern: 'cardio-baixo-impacto', equipment: 'bicicleta' },
    ];

    const availableEquipment = new Set((input.availableEquipment ?? []).map((item) => item.toLowerCase()));
    const hasEquipmentFilter = availableEquipment.size > 0;

    const exercises = exercisePool
      .filter((exercise) => !safety.blockedPatterns.includes(exercise.pattern))
      .filter((exercise) => !hasEquipmentFilter || availableEquipment.has(exercise.equipment))
      .slice(0, input.availableMinutes <= 30 ? 4 : 5)
      .map((exercise, index) => ({
        ...exercise,
        order: index + 1,
        sets: safety.allowedIntensity === 'leve' ? 2 : 3,
        reps: exercise.id === 'bike' ? null : '10-12',
        durationMinutes: exercise.id === 'bike' ? 8 : null,
        restSeconds: safety.allowedIntensity === 'alta' ? 90 : 75,
      }));

    return {
      status: 'draft',
      goal: input.goal,
      availableMinutes: input.availableMinutes,
      safety,
      exercises,
      disclaimer: 'Plano demonstrativo. Regras clínicas, histórico completo e validação profissional serão aplicados antes de uso em produção.',
    };
  }
}
