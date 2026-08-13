import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

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

export class ReportWorkoutEventDto {
  @IsIn(['pain', 'dizziness', 'shortness_of_breath', 'other'])
  type!: 'pain' | 'dizziness' | 'shortness_of_breath' | 'other';

  @IsOptional()
  @IsUUID()
  exerciseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  bodyArea?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  severity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class SubstituteWorkoutExerciseDto {
  @IsUUID()
  currentExerciseId!: string;

  @IsUUID()
  replacementExerciseId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
