import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { OnboardingDto } from '../onboarding/onboarding.dto';
import { OnboardingSafetyService } from '../onboarding/onboarding-safety.service';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private readonly profile: ProfileService,
    private readonly safety: OnboardingSafetyService,
  ) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.profile.get(request.auth.userId);
  }

  @Put()
  async update(
    @Req() request: AuthenticatedRequest,
    @Body() input: OnboardingDto,
  ) {
    const safety = this.safety.evaluate(input);
    const result = await this.profile.update(request.auth.userId, input, safety);
    return {
      ...result,
      safety,
      next: safety.status === 'professional_review_required' ? 'professional_review' : 'continue',
    };
  }
}
