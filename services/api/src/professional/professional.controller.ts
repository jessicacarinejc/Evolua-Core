import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { AssignProfessionalDto, CreateProfessionalReviewDto, SetUserRoleDto } from './professional.dto';
import { ProfessionalService } from './professional.service';

@Controller('professional')
@UseGuards(AuthGuard)
export class ProfessionalController {
  constructor(private readonly service: ProfessionalService) {}

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.service.me(request.auth.userId);
  }

  @Get('clients')
  clients(@Req() request: AuthenticatedRequest) {
    return this.service.listClients(request.auth.userId);
  }

  @Get('clients/:clientUserId')
  client(@Req() request: AuthenticatedRequest, @Param('clientUserId') clientUserId: string) {
    return this.service.clientOverview(request.auth.userId, clientUserId);
  }

  @Post('reviews')
  review(@Req() request: AuthenticatedRequest, @Body() dto: CreateProfessionalReviewDto) {
    return this.service.createReview(request.auth.userId, dto);
  }

  @Get('admin/users')
  users(@Req() request: AuthenticatedRequest) {
    return this.service.listUsers(request.auth.userId);
  }

  @Post('admin/roles')
  setRole(@Req() request: AuthenticatedRequest, @Body() dto: SetUserRoleDto) {
    return this.service.setRole(request.auth.userId, dto);
  }

  @Post('admin/assignments')
  assign(@Req() request: AuthenticatedRequest, @Body() dto: AssignProfessionalDto) {
    return this.service.assignProfessional(request.auth.userId, dto);
  }
}
