import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { TaiChiWorkoutService } from './tai-chi-workout.service';
import { CompleteWorkoutSessionDto, SaveWorkoutSetDto } from './workout-session.dto';
import { WorkoutSessionService } from './workout-session.service';
import { WorkoutEngineService } from './workout-engine.service';

@Controller('workouts')
@UseGuards(AuthGuard)
export class WorkoutsController {
  constructor(
    private readonly engine: WorkoutEngineService,
    private readonly sessions: WorkoutSessionService,
    private readonly taiChi: TaiChiWorkoutService,
  ) {}

  @Get('today')
  getToday(@Req() request: AuthenticatedRequest) {
    return this.engine.getToday(request.auth.userId);
  }

  @Post('today')
  generateToday(@Req() request: AuthenticatedRequest) {
    return this.engine.generateToday(request.auth.userId);
  }

  @Post('tai-chi/15-min')
  generateTaiChi15(@Req() request: AuthenticatedRequest) {
    return this.taiChi.generate15Minute(request.auth.userId);
  }

  @Post('tai-chi/walking')
  generateTaiChiWalking(@Req() request: AuthenticatedRequest) {
    return this.taiChi.generateWalking(request.auth.userId);
  }

  @Post('tai-chi/chen-20')
  generateTaiChiChen20(@Req() request: AuthenticatedRequest) {
    return this.taiChi.generateChen20(request.auth.userId);
  }

  @Post('tai-chi/yang-25-30')
  generateTaiChiYang(@Req() request: AuthenticatedRequest) {
    return this.taiChi.generateYang25To30(request.auth.userId);
  }

  @Get('sessions/active')
  getActiveSession(@Req() request: AuthenticatedRequest) {
    return this.sessions.getActive(request.auth.userId);
  }

  @Post('sessions/start/:planId')
  startSession(@Req() request: AuthenticatedRequest, @Param('planId') planId: string) {
    return this.sessions.start(request.auth.userId, planId);
  }

  @Get('sessions/:sessionId')
  getSession(@Req() request: AuthenticatedRequest, @Param('sessionId') sessionId: string) {
    return this.sessions.getSession(request.auth.userId, sessionId);
  }

  @Put('sessions/:sessionId/sets')
  saveSet(
    @Req() request: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Body() input: SaveWorkoutSetDto,
  ) {
    return this.sessions.saveSet(request.auth.userId, sessionId, input);
  }

  @Post('sessions/:sessionId/complete')
  completeSession(
    @Req() request: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Body() input: CompleteWorkoutSessionDto,
  ) {
    return this.sessions.complete(request.auth.userId, sessionId, input);
  }
}
