import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { MealPlanService } from './meal-plan.service';
import { AddHydrationDto, AddMealEntryDto, SaveNutritionTargetDto } from './nutrition.dto';
import { NutritionService } from './nutrition.service';

@Controller('nutrition')
@UseGuards(AuthGuard)
export class NutritionController {
  constructor(
    private readonly nutrition: NutritionService,
    private readonly mealPlan: MealPlanService,
  ) {}

  @Get('today')
  today(@Req() request: AuthenticatedRequest) {
    return this.nutrition.today(request.auth.userId);
  }

  @Get('plan')
  plan(@Req() request: AuthenticatedRequest) {
    return this.mealPlan.getPlan(request.auth.userId);
  }

  @Post('meals')
  addMeal(
    @Req() request: AuthenticatedRequest,
    @Body() input: AddMealEntryDto,
  ) {
    return this.nutrition.addMeal(request.auth.userId, input);
  }

  @Post('hydration')
  addHydration(
    @Req() request: AuthenticatedRequest,
    @Body() input: AddHydrationDto,
  ) {
    return this.nutrition.addHydration(request.auth.userId, input);
  }

  @Put('targets')
  saveTargets(
    @Req() request: AuthenticatedRequest,
    @Body() input: SaveNutritionTargetDto,
  ) {
    return this.nutrition.saveTargets(request.auth.userId, input);
  }
}
