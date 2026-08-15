import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { GOAL_VALUES } from '../onboarding/onboarding.dto';

export class GenerateWorkoutDto {
  @IsIn(GOAL_VALUES)
  goal!: string;

  @IsInt()
  @Min(15)
  @Max(180)
  availableMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  recoveryScore!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  jointPain?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  availableEquipment?: string[];
}
