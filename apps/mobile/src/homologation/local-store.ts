import * as SecureStore from 'expo-secure-store';
import { OnboardingData } from '../onboarding/types';

const LEGACY_STATE_KEY = 'evolua_core_homologation_local_state_v1';
const STATE_META_KEY = 'evolua_core_homologation_state_meta_v1';
const STATE_CHUNK_PREFIX = 'evolua_core_homologation_state_chunk_v1_';
const CHUNK_SIZE = 1800;

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

function parseState(raw: string | null): LocalHomologationState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocalHomologationState;
    return parsed?.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

async function readChunkCount() {
  const raw = await SecureStore.getItemAsync(STATE_META_KEY);
  const parsed = Number(raw ?? 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export const localHomologationStore = {
  async load(): Promise<LocalHomologationState> {
    const chunkCount = await readChunkCount();
    if (chunkCount > 0) {
      const chunks = await Promise.all(
        Array.from({ length: chunkCount }, (_, index) => SecureStore.getItemAsync(`${STATE_CHUNK_PREFIX}${index}`)),
      );
      if (chunks.every((chunk): chunk is string => typeof chunk === 'string')) {
        const parsed = parseState(chunks.join(''));
        if (parsed) return parsed;
      }
    }

    const legacy = parseState(await SecureStore.getItemAsync(LEGACY_STATE_KEY));
    return legacy ?? emptyState();
  },

  async save(state: LocalHomologationState) {
    const raw = JSON.stringify(state);
    const chunks = Array.from({ length: Math.ceil(raw.length / CHUNK_SIZE) }, (_, index) =>
      raw.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
    );
    const previousCount = await readChunkCount();

    for (let index = 0; index < chunks.length; index += 1) {
      await SecureStore.setItemAsync(`${STATE_CHUNK_PREFIX}${index}`, chunks[index]);
    }
    for (let index = chunks.length; index < previousCount; index += 1) {
      await SecureStore.deleteItemAsync(`${STATE_CHUNK_PREFIX}${index}`);
    }
    await SecureStore.setItemAsync(STATE_META_KEY, String(chunks.length));
    await SecureStore.deleteItemAsync(LEGACY_STATE_KEY);
  },

  async update(mutator: (state: LocalHomologationState) => LocalHomologationState | void) {
    const state = await this.load();
    const next = mutator(state) ?? state;
    await this.save(next);
    return next;
  },

  async clear() {
    const chunkCount = await readChunkCount();
    await Promise.all([
      SecureStore.deleteItemAsync(STATE_META_KEY),
      SecureStore.deleteItemAsync(LEGACY_STATE_KEY),
      ...Array.from({ length: chunkCount }, (_, index) => SecureStore.deleteItemAsync(`${STATE_CHUNK_PREFIX}${index}`)),
    ]);
  },

  empty: emptyState,
};
