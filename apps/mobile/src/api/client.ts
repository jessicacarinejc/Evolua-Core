import { OnboardingData } from '../onboarding/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/v1';

export type AuthUser = {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  profile: OnboardingData | null;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type DailyCheckinInput = {
  sleepQuality: number;
  energyLevel: number;
  muscleSoreness: number;
  jointPain: number;
  availableMinutes: number;
  painAreas: string[];
  newSymptoms: boolean;
  notes?: string;
};

export type DailyCheckinResult = {
  evaluation: {
    recoveryScore: number;
    status: 'ready' | 'modified' | 'recovery' | 'professional_review_required';
    notes: string[];
  };
};

class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join('\n')
      : payload?.message ?? 'Não foi possível concluir a solicitação.';
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

function normalizeProfile(profile: any): OnboardingData | null {
  if (!profile) return null;
  const birth = typeof profile.birthDate === 'string' ? profile.birthDate.slice(0, 10) : '';
  return {
    displayName: String(profile.displayName ?? ''),
    birthDate: birth,
    heightCm: String(profile.heightCm ?? ''),
    weightKg: String(profile.weightKg ?? ''),
    primaryGoal: profile.primaryGoal ?? '',
    trainingLevel: profile.trainingLevel ?? '',
    trainingDaysPerWeek: Number(profile.trainingDaysPerWeek ?? 3),
    sessionMinutes: Number(profile.sessionMinutes ?? 45),
    equipment: profile.equipment ?? [],
    healthConditions: profile.healthConditions ?? [],
    painAreas: profile.painAreas ?? [],
    foodRestrictions: profile.foodRestrictions ?? [],
  };
}

function normalizeUser(user: any): AuthUser {
  return { ...user, profile: normalizeProfile(user?.profile) };
}

export const api = {
  async authenticate(mode: 'login' | 'register', email: string, password: string): Promise<AuthResponse> {
    const response = await request<any>(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return { token: response.token, user: normalizeUser(response.user) };
  },

  async me(token: string): Promise<AuthUser> {
    return normalizeUser(await request<any>('/auth/me', {}, token));
  },

  async saveOnboarding(token: string, data: OnboardingData) {
    return request('/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        heightCm: Number(data.heightCm.replace(',', '.')),
        weightKg: Number(data.weightKg.replace(',', '.')),
      }),
    }, token);
  },

  async saveDailyCheckin(token: string, input: DailyCheckinInput): Promise<DailyCheckinResult> {
    return request('/checkins/daily', {
      method: 'POST',
      body: JSON.stringify(input),
    }, token);
  },

  async logout(token: string) {
    return request('/auth/logout', { method: 'POST' }, token);
  },
};
