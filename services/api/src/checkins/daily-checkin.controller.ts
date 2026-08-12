import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { DailyCheckinDto } from './daily-checkin.dto';
import { DailyCheckinService } from './daily-checkin.service';

@UseGuards(AuthGuard)
@Controller('checkins')
export class DailyCheckinController {
  constructor(private readonly checkins: DailyCheckinService) {}

  @Post('daily')
  save(@Req() request: AuthenticatedRequest, @Body() input: DailyCheckinDto) {
    return this.checkins.save(request.auth.userId, input);
  }

  @Get('today')
  today(@Req() request: AuthenticatedRequest) {
    return this.checkins.today(request.auth.userId);
  }
}
