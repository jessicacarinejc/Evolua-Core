export type PrimaryGoal =
  | 'emagrecimento'
  | 'hipertrofia'
  | 'forca'
  | 'condicionamento'
  | 'manutencao';

export type TrainingLevel = 'iniciante' | 'intermediario' | 'avancado';

export type OnboardingData = {
  displayName: string;
  birthDate: string;
  heightCm: string;
  weightKg: string;
  primaryGoal: PrimaryGoal | '';
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
  trainingLevel: '',
  trainingDaysPerWeek: 3,
  sessionMinutes: 45,
  equipment: [],
  healthConditions: [],
  painAreas: [],
  foodRestrictions: [],
};
