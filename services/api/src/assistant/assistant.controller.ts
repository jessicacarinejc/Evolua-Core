import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { AskAssistantDto } from './assistant.dto';
import { AssistantService } from './assistant.service';

@Controller('assistant')
@UseGuards(AuthGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('ask')
  ask(@Req() request: AuthenticatedRequest, @Body() input: AskAssistantDto) {
    return this.assistant.ask(request.auth.userId, input.message);
  }
}
