import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { WorkoutsController } from './workouts/workouts.controller';
import { WorkoutSafetyService } from './workouts/workout-safety.service';

@Module({
  controllers: [HealthController, WorkoutsController],
  providers: [WorkoutSafetyService],
})
export class AppModule {}
