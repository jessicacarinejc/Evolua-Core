import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingDto } from './onboarding.dto';
import { OnboardingSafetyService } from './onboarding-safety.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly safety: OnboardingSafetyService) {}

  @Post('validate')
  validate(@Body() input: OnboardingDto) {
    const safety = this.safety.evaluate(input);

    return {
      accepted: true,
      safety,
      normalizedProfile: {
        displayName: input.displayName.trim(),
        birthDate: input.birthDate,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        primaryGoal: input.primaryGoal,
        trainingLevel: input.trainingLevel,
        trainingDaysPerWeek: input.trainingDaysPerWeek,
        sessionMinutes: input.sessionMinutes,
        equipment: input.equipment,
      },
      next: safety.status === 'professional_review_required'
        ? 'professional_review'
        : 'daily_checkin',
    };
  }
}
