import { IsIn } from 'class-validator';

export class AbandonWorkoutSessionDto {
  @IsIn(['switch_workout', 'stop_without_completion'])
  reason!: 'switch_workout' | 'stop_without_completion';
}
