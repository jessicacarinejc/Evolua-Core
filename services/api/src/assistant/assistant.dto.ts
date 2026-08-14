import { IsString, MaxLength, MinLength } from 'class-validator';

export class AssistantMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(600)
  message!: string;
}
