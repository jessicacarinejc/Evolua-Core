import { getApiBaseUrl, isOfflineHomologation } from '../api/runtime-config';
import { localHomologationStore } from '../homologation/local-store';

export type WorkoutAbandonReason = 'switch_workout' | 'stop_without_completion';

export type WorkoutAbandonResult = {
  abandoned: boolean;
  reason: WorkoutAbandonReason;
  completedBlocks: number;
  totalBlocks: number;
};

function countBlocks(session: any) {
  const exercises = Array.isArray(session?.exercises) ? session.exercises : [];
  const sets = exercises.flatMap((exercise: any) => Array.isArray(exercise?.sets) ? exercise.sets : []);
  return {
    completedBlocks: sets.filter((set: any) => Boolean(set?.completed)).length,
    totalBlocks: sets.length,
  };
}

export async function abandonWorkoutSession(
  token: string,
  sessionId: string,
  reason: WorkoutAbandonReason,
): Promise<WorkoutAbandonResult> {
  if (isOfflineHomologation()) {
    const state = await localHomologationStore.load();
    const activeSession = state.workout.activeSession as any;
    if (!activeSession || activeSession.id !== sessionId) {
      return { abandoned: true, reason, completedBlocks: 0, totalBlocks: 0 };
    }

    const counts = countBlocks(activeSession);
    state.workout.safetyEvents.push({
      id: `abandonment-${Date.now()}`,
      type: 'abandonment',
      sessionId,
      planId: activeSession.plan?.id ?? null,
      reason,
      abandonedAt: new Date().toISOString(),
      ...counts,
    });
    state.workout.activeSession = null;
    await localHomologationStore.save(state);

    return { abandoned: true, reason, ...counts };
  }

  const apiUrl = await getApiBaseUrl();
  const response = await fetch(`${apiUrl}/workouts/sessions/${sessionId}/abandon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join('\n')
      : payload?.message ?? 'Não foi possível encerrar o treino atual.';
    throw new Error(message);
  }
  return payload as WorkoutAbandonResult;
}
