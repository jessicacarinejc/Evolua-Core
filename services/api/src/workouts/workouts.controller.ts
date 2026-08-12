import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { WorkoutEngineService } from './workout-engine.service';

@Controller('workouts')
@UseGuards(AuthGuard)
export class WorkoutsController {
  constructor(private readonly engine: WorkoutEngineService) {}

  @Get('today')
  getToday(@Req() request: AuthenticatedRequest) {
    return this.engine.getToday(request.auth.userId);
  }

  @Post('today')
  generateToday(@Req() request: AuthenticatedRequest) {
    return this.engine.generateToday(request.auth.userId);
  }
}
