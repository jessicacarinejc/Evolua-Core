import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { SaveBodyMetricDto } from './progress.dto';
import { ProgressService } from './progress.service';

@Controller('progress')
@UseGuards(AuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('overview')
  overview(@Req() request: AuthenticatedRequest) {
    return this.progress.overview(request.auth.userId);
  }

  @Get('body-metrics')
  bodyMetrics(@Req() request: AuthenticatedRequest) {
    return this.progress.listBodyMetrics(request.auth.userId);
  }

  @Post('body-metrics')
  saveBodyMetric(
    @Req() request: AuthenticatedRequest,
    @Body() input: SaveBodyMetricDto,
  ) {
    return this.progress.saveBodyMetric(request.auth.userId, input);
  }

  @Get('workouts')
  workouts(@Req() request: AuthenticatedRequest) {
    return this.progress.listWorkouts(request.auth.userId);
  }
}
