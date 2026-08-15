import * as SecureStore from 'expo-secure-store';
import { OnboardingData } from '../onboarding/types';

const LOCAL_STATE_KEY = 'evolua_core_homologation_local_state_v1';

export type LocalHomologationState = {
  version: 1;
  user: null | {
    id: string;
    email: string;
    passwordVerifier: string;
    createdAt: string;
  };
  profile: OnboardingData | null;
  latestCheckin: Record<string, unknown> | null;
  recovery: Record<string, unknown> | null;
  workout: {
    currentPlan: Record<string, unknown> | null;
    activeSession: Record<string, unknown> | null;
    history: Array<Record<string, unknown>>;
    safetyEvents: Array<Record<string, unknown>>;
  };
  nutrition: {
    meals: Array<Record<string, unknown>>;
    hydrationMl: number;
    targets: Record<string, unknown> | null;
  };
  progress: {
    bodyMetrics: Array<Record<string, unknown>>;
  };
};

const emptyState = (): LocalHomologationState => ({
  version: 1,
  user: null,
  profile: null,
  latestCheckin: null,
  recovery: null,
  workout: {
    currentPlan: null,
    activeSession: null,
    history: [],
    safetyEvents: [],
  },
  nutrition: {
    meals: [],
    hydrationMl: 0,
    targets: null,
  },
  progress: {
    bodyMetrics: [],
  },
});

export const localHomologationStore = {
  async load(): Promise<LocalHomologationState> {
    const raw = await SecureStore.getItemAsync(LOCAL_STATE_KEY);
    if (!raw) return emptyState();
    try {
      const parsed = JSON.parse(raw) as LocalHomologationState;
      return parsed?.version === 1 ? parsed : emptyState();
    } catch {
      return emptyState();
    }
  },

  async save(state: LocalHomologationState) {
    await SecureStore.setItemAsync(LOCAL_STATE_KEY, JSON.stringify(state));
  },

  async update(mutator: (state: LocalHomologationState) => LocalHomologationState | void) {
    const state = await this.load();
    const next = mutator(state) ?? state;
    await this.save(next);
    return next;
  },

  async clear() {
    await SecureStore.deleteItemAsync(LOCAL_STATE_KEY);
  },

  empty: emptyState,
};
