import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const GOAL_VALUES: string[] = [
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
];

export const WEEKDAY_VALUES = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
export const EXERCISE_TYPE_VALUES = [
  'pesos_livres',
  'peso_corporal_funcional',
  'maquinas',
  'cabos_polias',
  'aerobico',
  'mobilidade',
  'flexibilidade',
  'yoga',
  'calistenia',
  'circuito_hiit',
];

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

  @IsOptional()
  @IsIn(['academia', 'casa', 'misto'])
  trainingEnvironment?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsIn(WEEKDAY_VALUES, { each: true })
  availableDays?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsIn(WEEKDAY_VALUES, { each: true })
  aerobicDays?: string[];

  @IsOptional()
  @IsIn(['automatico', 'hibrido', 'manual'])
  trainingPlanMode?: string;

  @IsOptional()
  @IsIn(['automatico', 'manual'])
  scheduleManagement?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  intensityPreference?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  pastActivityLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  exerciseVariety?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  muscleFocus?: string[];

  @IsOptional()
  @IsIn(['equilibrado', 'foco_corpo_todo', 'somente_selecionados'])
  muscleFocusMode?: string;

  @IsOptional()
  @IsObject()
  exerciseTypePreferences?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsIn(EXERCISE_TYPE_VALUES, { each: true })
  excludedExerciseTypes?: string[];

  @IsOptional()
  @IsBoolean()
  musicEnabled?: boolean;

  @IsOptional()
  @IsIn(['gym_mix', 'eletronica', 'pop_treino', 'hip_hop', 'rock', 'sem_preferencia'])
  musicStyle?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  musicVolume?: number;

  @IsArray()
  @ArrayMaxSize(80)
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
