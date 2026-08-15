import {
  ArrayMaxSize,
  ArrayMinSize,
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

export const GOAL_VALUES = [
  'emagrecimento',
  'hipertrofia',
  'forca',
  'condicionamento',
  'manutencao',
  'recomposicao_corporal',
  'tonificacao',
  'resistencia_muscular',
  'potencia',
  'cross_training',
  'calistenia',
  'corrida',
  'triathlon',
  'mobilidade',
  'flexibilidade',
  'postura_core',
  'yoga',
  'pilates',
  'futebol',
  'basquete',
  'volei',
  'tenis',
  'artes_marciais',
  'prontidao_tatica',
  'saude_bem_estar',
  'longevidade',
  'recuperacao_ativa',
] as const;

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

  @IsIn(GOAL_VALUES)
  primaryGoal!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsIn(GOAL_VALUES, { each: true })
  goals?: string[];

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
