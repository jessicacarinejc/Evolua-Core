import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class SaveWorkoutSetDto {
  @IsUUID()
  exerciseId!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  setNumber!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  repetitions?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(2000)
  loadKg?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7200)
  durationSeconds?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  rir?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class CompleteWorkoutSessionDto {
  @IsInt()
  @Min(1)
  @Max(10)
  perceivedEffort!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}
