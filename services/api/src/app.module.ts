import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { CalisthenicsWorkoutService } from './workouts/calisthenics-workout.service';
import { DailyCheckinController } from './checkins/daily-checkin.controller';
import { DailyCheckinService } from './checkins/daily-checkin.service';
import { DatabaseService } from './database/database.service';
import { ExercisesController } from './exercises/exercises.controller';
import { ExercisesService } from './exercises/exercises.service';
import { HealthController } from './health.controller';
import { OnboardingController } from './onboarding/onboarding.controller';
import { OnboardingSafetyService } from './onboarding/onboarding-safety.service';
import { OnboardingService } from './onboarding/onboarding.service';
import { TaiChiWorkoutService } from './workouts/tai-chi-workout.service';
import { WorkoutEngineService } from './workouts/workout-engine.service';
import { WorkoutsController } from './workouts/workouts.controller';
import { WorkoutSafetyService } from './workouts/workout-safety.service';
import { WorkoutSessionService } from './workouts/workout-session.service';

@Module({
  controllers: [
    HealthController,
    AuthController,
    OnboardingController,
    DailyCheckinController,
    ExercisesController,
    WorkoutsController,
  ],
  providers: [
    DatabaseService,
    AuthService,
    AuthGuard,
    OnboardingSafetyService,
    OnboardingService,
    DailyCheckinService,
    ExercisesService,
    WorkoutSafetyService,
    WorkoutEngineService,
    WorkoutSessionService,
    TaiChiWorkoutService,
    CalisthenicsWorkoutService,
  ],
})
export class AppModule {}
