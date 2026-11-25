const EXERCISE_NAME_FIXES: Array<[RegExp, string]> = [
  [/\bSentda\b/gi, 'Sentada'],
  [/\bSentdo\b/gi, 'Sentado'],
  [/\brepetiçoes\b/gi, 'repetições'],
  [/\bPosiçao\b/gi, 'Posição'],
];

export function normalizeExerciseName(value: string) {
  return EXERCISE_NAME_FIXES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}
