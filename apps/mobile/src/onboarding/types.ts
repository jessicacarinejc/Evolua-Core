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
};

export const initialOnboardingData: OnboardingData = {
  displayName: '',
  birthDate: '',
  heightCm: '',
  weightKg: '',
  primaryGoal: '',
  goals: [],
  trainingLevel: '',
  trainingDaysPerWeek: 3,
  sessionMinutes: 45,
  equipment: [],
  healthConditions: [],
  painAreas: [],
  foodRestrictions: [],
};
