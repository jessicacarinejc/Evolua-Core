import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { AssistantMessageDto } from './assistant.dto';
import { AssistantService } from './assistant.service';

@Controller('assistant')
@UseGuards(AuthGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('message')
  message(@Req() request: AuthenticatedRequest, @Body() input: AssistantMessageDto) {
    return this.assistant.answer(request.auth.userId, input.message);
  }
}
