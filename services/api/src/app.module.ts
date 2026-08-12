import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OnboardingController } from './onboarding/onboarding.controller';
import { OnboardingSafetyService } from './onboarding/onboarding-safety.service';
import { WorkoutsController } from './workouts/workouts.controller';
import { WorkoutSafetyService } from './workouts/workout-safety.service';

@Module({
  controllers: [HealthController, OnboardingController, WorkoutsController],
  providers: [OnboardingSafetyService, WorkoutSafetyService],
})
export class AppModule {}
