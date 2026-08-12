import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class OnboardingDto {
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsString()
  @IsNotEmpty()
  birthDate!: string;

  @IsNumber()
  @Min(100)
  @Max(230)
  heightCm!: number;

  @IsNumber()
  @Min(30)
  @Max(350)
  weightKg!: number;

  @IsIn(['emagrecimento', 'hipertrofia', 'forca', 'condicionamento', 'manutencao'])
  primaryGoal!: string;

  @IsIn(['iniciante', 'intermediario', 'avancado'])
  trainingLevel!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek!: number;

  @IsInt()
  @Min(15)
  @Max(180)
  sessionMinutes!: number;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  equipment!: string[];

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  healthConditions!: string[];

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  painAreas!: string[];

  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  foodRestrictions!: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
