import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { OnboardingDto } from './onboarding.dto';
import { OnboardingSafetyService } from './onboarding-safety.service';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly safety: OnboardingSafetyService,
    private readonly onboarding: OnboardingService,
  ) {}

  @Post('validate')
  validate(@Body() input: OnboardingDto) {
    const safety = this.safety.evaluate(input);
    return {
      accepted: true,
      safety,
      next: safety.status === 'professional_review_required' ? 'professional_review' : 'daily_checkin',
    };
  }

  @UseGuards(AuthGuard)
  @Post()
  async save(@Req() request: AuthenticatedRequest, @Body() input: OnboardingDto) {
    const safety = this.safety.evaluate(input);
    const result = await this.onboarding.save(request.auth.userId, input, safety);
    return {
      accepted: true,
      safety,
      ...result,
      next: safety.status === 'professional_review_required' ? 'professional_review' : 'daily_checkin',
    };
  }
}
