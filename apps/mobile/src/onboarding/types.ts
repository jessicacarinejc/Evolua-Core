export type PrimaryGoal =
  | 'emagrecimento'
  | 'hipertrofia'
  | 'forca'
  | 'condicionamento'
  | 'manutencao'
  | 'recomposicao_corporal'
  | 'tonificacao'
  | 'resistencia_muscular'
  | 'potencia'
  | 'cross_training'
  | 'calistenia'
  | 'corrida'
  | 'triathlon'
  | 'mobilidade'
  | 'flexibilidade'
  | 'postura_core'
  | 'yoga'
  | 'pilates'
  | 'futebol'
  | 'basquete'
  | 'volei'
  | 'tenis'
  | 'artes_marciais'
  | 'prontidao_tatica'
  | 'saude_bem_estar'
  | 'longevidade'
  | 'recuperacao_ativa';

export type GoalCategory =
  | 'Composição corporal'
  | 'Força e performance'
  | 'Cardio e resistência'
  | 'Mobilidade e corpo-mente'
  | 'Esportes e modalidades'
  | 'Saúde e manutenção';

export const MAX_SELECTED_GOALS = 3;

export const goalOptions: Array<{ value: PrimaryGoal; label: string; category: GoalCategory }> = [
  { value: 'emagrecimento', label: 'Perder peso e reduzir gordura', category: 'Composição corporal' },
  { value: 'hipertrofia', label: 'Ganhar massa muscular', category: 'Composição corporal' },
  { value: 'recomposicao_corporal', label: 'Recomposição corporal', category: 'Composição corporal' },
  { value: 'tonificacao', label: 'Definição e tonificação', category: 'Composição corporal' },

  { value: 'forca', label: 'Aumentar força', category: 'Força e performance' },
  { value: 'potencia', label: 'Potência e explosão', category: 'Força e performance' },
  { value: 'resistencia_muscular', label: 'Resistência muscular', category: 'Força e performance' },
  { value: 'cross_training', label: 'Cross-training', category: 'Força e performance' },
  { value: 'calistenia', label: 'Calistenia', category: 'Força e performance' },
  { value: 'prontidao_tatica', label: 'Prontidão física tática', category: 'Força e performance' },

  { value: 'condicionamento', label: 'Condicionamento físico geral', category: 'Cardio e resistência' },
  { value: 'corrida', label: 'Melhorar desempenho na corrida', category: 'Cardio e resistência' },
  { value: 'triathlon', label: 'Preparação para triathlon', category: 'Cardio e resistência' },

  { value: 'mobilidade', label: 'Melhorar mobilidade', category: 'Mobilidade e corpo-mente' },
  { value: 'flexibilidade', label: 'Aumentar flexibilidade', category: 'Mobilidade e corpo-mente' },
  { value: 'postura_core', label: 'Postura, estabilidade e core', category: 'Mobilidade e corpo-mente' },
  { value: 'yoga', label: 'Yoga', category: 'Mobilidade e corpo-mente' },
  { value: 'pilates', label: 'Pilates', category: 'Mobilidade e corpo-mente' },

  { value: 'futebol', label: 'Preparação para futebol', category: 'Esportes e modalidades' },
  { value: 'basquete', label: 'Preparação para basquete', category: 'Esportes e modalidades' },
  { value: 'volei', label: 'Preparação para vôlei', category: 'Esportes e modalidades' },
  { value: 'tenis', label: 'Preparação para tênis', category: 'Esportes e modalidades' },
  { value: 'artes_marciais', label: 'Preparação para artes marciais', category: 'Esportes e modalidades' },

  { value: 'saude_bem_estar', label: 'Saúde e bem-estar', category: 'Saúde e manutenção' },
  { value: 'manutencao', label: 'Manter a forma física', category: 'Saúde e manutenção' },
  { value: 'longevidade', label: 'Longevidade e autonomia', category: 'Saúde e manutenção' },
  { value: 'recuperacao_ativa', label: 'Recuperação ativa', category: 'Saúde e manutenção' },
];

export type TrainingLevel = 'iniciante' | 'intermediario' | 'avancado';
export type TrainingEnvironment = 'academia' | 'casa' | 'misto';
export type TrainingPlanMode = 'automatico' | 'hibrido' | 'manual';
export type ScheduleManagement = 'automatico' | 'manual';
export type MuscleFocusMode = 'equilibrado' | 'foco_corpo_todo' | 'somente_selecionados';
export type ExercisePreferenceLevel = 'evitar' | 'neutro' | 'preferir' | 'adorar';
export type MusicStyle = 'gym_mix' | 'eletronica' | 'pop_treino' | 'hip_hop' | 'rock' | 'sem_preferencia';
export type WeekdayCode = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
export type ExerciseTypeKey =
  | 'pesos_livres'
  | 'peso_corporal_funcional'
  | 'maquinas'
  | 'cabos_polias'
  | 'aerobico'
  | 'mobilidade'
  | 'flexibilidade'
  | 'yoga'
  | 'calistenia'
  | 'circuito_hiit';

export const weekdayOptions: Array<{ value: WeekdayCode; label: string }> = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
];

export const exerciseTypeOptions: Array<{ value: ExerciseTypeKey; label: string }> = [
  { value: 'pesos_livres', label: 'Pesos livres' },
  { value: 'peso_corporal_funcional', label: 'Peso corporal / funcional' },
  { value: 'maquinas', label: 'Máquinas' },
  { value: 'cabos_polias', label: 'Cabos e polias' },
  { value: 'aerobico', label: 'Aeróbicos' },
  { value: 'mobilidade', label: 'Mobilidade' },
  { value: 'flexibilidade', label: 'Flexibilidade' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'calistenia', label: 'Calistenia' },
  { value: 'circuito_hiit', label: 'Circuito / HIIT' },
];

export const equipmentGroups: Array<{ title: string; items: string[] }> = [
  {
    title: 'Pesos livres',
    items: ['Barra', 'Halteres', 'Kettlebell', 'Barra para agachamento', 'Bolas medicinais'],
  },
  {
    title: 'Bancos e racks',
    items: ['Banco plano', 'Banco inclinado', 'Banco declinado', 'Banco para glúteos', 'Rack', 'Máquina Smith', 'Landmine', 'Extensão de costas'],
  },
  {
    title: 'Peso corporal e funcional',
    items: ['Barra horizontal', 'Barras paralelas', 'Argolas', 'TRX', 'Elásticos', 'Roda abdominal', 'Bola de Pilates', 'Cordas de batalha', 'Step / plataforma'],
  },
  {
    title: 'Cabos e polias',
    items: ['Cabos / crossover', 'Polias', 'Corda sem fim'],
  },
  {
    title: 'Aeróbicos',
    items: ['Bicicleta', 'Bicicleta ergométrica', 'Esteira', 'Elíptico', 'Escada', 'Remo ergométrico', 'Piscina', 'Corda para pular'],
  },
  {
    title: 'Máquinas - parte superior',
    items: ['Supino em máquina', 'Puxada alta', 'Remada em máquina', 'Desenvolvimento em máquina', 'Rosca bíceps em máquina', 'Extensão de tríceps em máquina'],
  },
  {
    title: 'Máquinas - parte inferior',
    items: ['Leg press', 'Hack squat', 'Cadeira extensora', 'Mesa flexora', 'Cadeira adutora', 'Cadeira abdutora', 'Panturrilha em máquina', 'Glúteo em máquina'],
  },
  {
    title: 'Core',
    items: ['Máquina abdominal', 'Rotação de tronco', 'Estação de core'],
  },
];

export const muscleOptions = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraços',
  'Abdômen / core',
  'Lombar',
  'Glúteos',
  'Quadríceps',
  'Posteriores de coxa',
  'Panturrilhas',
];

export type AdvancedTrainingPreferences = {
  trainingEnvironment: TrainingEnvironment;
  availableDays: WeekdayCode[];
  aerobicDays: WeekdayCode[];
  trainingPlanMode: TrainingPlanMode;
  scheduleManagement: ScheduleManagement;
  intensityPreference: number;
  pastActivityLevel: number;
  exerciseVariety: number;
  muscleFocus: string[];
  muscleFocusMode: MuscleFocusMode;
  exerciseTypePreferences: Partial<Record<ExerciseTypeKey, ExercisePreferenceLevel>>;
  excludedExerciseTypes: ExerciseTypeKey[];
  musicEnabled: boolean;
  musicStyle: MusicStyle;
  musicVolume: number;
};

export type OnboardingData = {
  displayName: string;
  birthDate: string;
  heightCm: string;
  weightKg: string;
  primaryGoal: PrimaryGoal | '';
  goals?: PrimaryGoal[];
  trainingLevel: TrainingLevel | '';
  trainingDaysPerWeek: number;
  sessionMinutes: number;
  equipment: string[];
  healthConditions: string[];
  painAreas: string[];
  foodRestrictions: string[];
} & Partial<AdvancedTrainingPreferences>;

export type CompleteOnboardingData = OnboardingData & AdvancedTrainingPreferences;

export const initialOnboardingData: CompleteOnboardingData = {
  displayName: '',
  birthDate: '',
  heightCm: '',
  weightKg: '',
  primaryGoal: '',
  goals: [],
  trainingLevel: '',
  trainingDaysPerWeek: 3,
  sessionMinutes: 45,
  trainingEnvironment: 'misto',
  availableDays: ['seg', 'qua', 'sex'],
  aerobicDays: [],
  trainingPlanMode: 'automatico',
  scheduleManagement: 'automatico',
  intensityPreference: 3,
  pastActivityLevel: 2,
  exerciseVariety: 2,
  muscleFocus: [],
  muscleFocusMode: 'equilibrado',
  exerciseTypePreferences: {},
  excludedExerciseTypes: [],
  musicEnabled: true,
  musicStyle: 'gym_mix',
  musicVolume: 55,
  equipment: [],
  healthConditions: [],
  painAreas: [],
  foodRestrictions: [],
};
