import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { AbandonWorkoutSessionDto } from './workout-abandonment.dto';
import { WorkoutAbandonmentService } from './workout-abandonment.service';

@Controller('workouts/sessions')
@UseGuards(AuthGuard)
export class WorkoutAbandonmentController {
  constructor(private readonly abandonment: WorkoutAbandonmentService) {}

  @Post(':sessionId/abandon')
  abandon(
    @Req() request: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Body() input: AbandonWorkoutSessionDto,
  ) {
    return this.abandonment.abandon(request.auth.userId, sessionId, input);
  }
}
