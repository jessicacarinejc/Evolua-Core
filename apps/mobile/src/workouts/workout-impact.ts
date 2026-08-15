import type { WorkoutExercise, WorkoutSessionExercise } from '../api/client';
import { getExerciseGuidance } from './exercise-guidance';

export type WorkoutPhaseKey = 'warmup' | 'main' | 'cooldown';

export type MuscleImpact = {
  key: string;
  label: string;
  score: number;
  percent: number;
  level: 'principal' | 'moderado' | 'apoio';
  area: 'upper' | 'core' | 'lower';
};

type ExerciseLike = Pick<WorkoutExercise, 'name' | 'primaryMuscle'> & {
  sets?: number;
  plannedSets?: number;
  durationSeconds?: number | null;
};

const muscleAliases: Array<[RegExp, string, 'upper' | 'core' | 'lower']> = [
  [/peito|peitoral/i, 'Peitoral', 'upper'],
  [/ombro|delto/i, 'Ombros', 'upper'],
  [/costas|dorsal|lat/i, 'Costas', 'upper'],
  [/bíceps|biceps/i, 'Bíceps', 'upper'],
  [/tríceps|triceps/i, 'Tríceps', 'upper'],
  [/abd|core/i, 'Core', 'core'],
  [/glút|glut/i, 'Glúteos', 'lower'],
  [/quadr|coxa|perna/i, 'Quadríceps', 'lower'],
  [/posterior|isquio/i, 'Posteriores', 'lower'],
  [/panturr/i, 'Panturrilhas', 'lower'],
];

const poseMuscles: Record<string, Array<[string, number, 'upper' | 'core' | 'lower']>> = {
  squat: [['Quadríceps', 3, 'lower'], ['Glúteos', 3, 'lower'], ['Posteriores', 1, 'lower'], ['Core', 1, 'core']],
  press: [['Ombros', 3, 'upper'], ['Tríceps', 2, 'upper'], ['Peitoral', 1, 'upper'], ['Core', 1, 'core']],
  pull: [['Costas', 3, 'upper'], ['Bíceps', 2, 'upper'], ['Ombros', 1, 'upper'], ['Core', 1, 'core']],
  hinge: [['Glúteos', 3, 'lower'], ['Posteriores', 3, 'lower'], ['Core', 2, 'core']],
  curl: [['Bíceps', 3, 'upper'], ['Antebraços', 1, 'upper']],
  pushdown: [['Tríceps', 3, 'upper'], ['Ombros', 1, 'upper']],
  'core-supine': [['Core', 3, 'core'], ['Quadríceps', 1, 'lower']],
  quadruped: [['Core', 3, 'core'], ['Glúteos', 2, 'lower'], ['Ombros', 1, 'upper']],
  calf: [['Panturrilhas', 3, 'lower'], ['Core', 1, 'core']],
  bike: [['Quadríceps', 3, 'lower'], ['Glúteos', 2, 'lower'], ['Panturrilhas', 2, 'lower'], ['Posteriores', 1, 'lower']],
  pushup: [['Peitoral', 3, 'upper'], ['Tríceps', 2, 'upper'], ['Ombros', 2, 'upper'], ['Core', 2, 'core']],
  'jumping-jack': [['Quadríceps', 2, 'lower'], ['Panturrilhas', 2, 'lower'], ['Ombros', 2, 'upper'], ['Core', 1, 'core']],
  dip: [['Tríceps', 3, 'upper'], ['Peitoral', 2, 'upper'], ['Ombros', 2, 'upper']],
  'high-knees': [['Quadríceps', 3, 'lower'], ['Core', 2, 'core'], ['Panturrilhas', 1, 'lower']],
  'tai-chi': [['Quadríceps', 2, 'lower'], ['Glúteos', 2, 'lower'], ['Core', 2, 'core'], ['Ombros', 1, 'upper']],
  walk: [['Quadríceps', 2, 'lower'], ['Glúteos', 1, 'lower'], ['Panturrilhas', 2, 'lower'], ['Core', 1, 'core']],
  lunge: [['Quadríceps', 3, 'lower'], ['Glúteos', 3, 'lower'], ['Posteriores', 1, 'lower'], ['Core', 1, 'core']],
};

function normalizePrimary(primaryMuscle: string) {
  for (const [pattern, label, area] of muscleAliases) {
    if (pattern.test(primaryMuscle)) return { label, area };
  }
  return { label: primaryMuscle || 'Corpo inteiro', area: 'core' as const };
}

function exerciseWeight(exercise: ExerciseLike) {
  const blocks = Number(exercise.sets ?? exercise.plannedSets ?? 1);
  const timeFactor = exercise.durationSeconds ? Math.max(1, exercise.durationSeconds / 40) : 1;
  return Math.max(1, blocks) * timeFactor;
}

export function calculateMuscleImpact(exercises: ExerciseLike[]): MuscleImpact[] {
  const scores = new Map<string, { label: string; score: number; area: 'upper' | 'core' | 'lower' }>();

  for (const exercise of exercises) {
    const weight = exerciseWeight(exercise);
    const guidance = getExerciseGuidance(exercise.name);
    const modeled = poseMuscles[guidance.pose] ?? [];
    const primary = normalizePrimary(exercise.primaryMuscle);

    const add = (label: string, points: number, area: 'upper' | 'core' | 'lower') => {
      const key = label.toLocaleLowerCase('pt-BR');
      const current = scores.get(key);
      scores.set(key, { label, area, score: (current?.score ?? 0) + points * weight });
    };

    add(primary.label, 3.4, primary.area);
    modeled.forEach(([label, points, area]) => add(label, points, area));
  }

  const ordered = [...scores.values()].sort((a, b) => b.score - a.score).slice(0, 8);
  const max = ordered[0]?.score ?? 1;
  return ordered.map((item) => {
    const percent = Math.max(8, Math.round((item.score / max) * 100));
    return {
      key: item.label.toLocaleLowerCase('pt-BR'),
      label: item.label,
      score: item.score,
      percent,
      area: item.area,
      level: percent >= 72 ? 'principal' : percent >= 38 ? 'moderado' : 'apoio',
    };
  });
}

export function workoutPhaseForProgress(completedBlocks: number, totalBlocks: number): WorkoutPhaseKey {
  if (totalBlocks <= 0) return 'warmup';
  const ratio = completedBlocks / totalBlocks;
  if (ratio < 0.12) return 'warmup';
  if (ratio >= 0.88) return 'cooldown';
  return 'main';
}

export function phaseSummary(exercises: Array<WorkoutExercise | WorkoutSessionExercise>) {
  const totalBlocks = exercises.reduce((sum, item) => sum + Number('sets' in item ? item.sets : item.plannedSets), 0);
  return {
    warmupMinutes: Math.max(4, Math.min(8, Math.round(totalBlocks * 0.45))),
    mainMinutes: Math.max(12, Math.round(totalBlocks * 2.2)),
    cooldownMinutes: 5,
  };
}
