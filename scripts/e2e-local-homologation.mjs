import process from 'node:process';
import { Client } from 'pg';

const API_URL = (process.env.API_URL ?? 'http://127.0.0.1:3333/v1').replace(/\/$/, '');
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://evolua:evolua@127.0.0.1:5432/evolua_core';
const email = `homologacao-e2e-${Date.now()}@evolua.local`;
const password = process.env.E2E_PASSWORD ?? 'EvoluaE2E#2026!';
let userId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function failureMessage(label, result) {
  const detail = result.payload?.message ?? result.payload?.error ?? JSON.stringify(result.payload ?? {});
  return `${label} falhou (${result.response.status})${detail ? `: ${detail}` : '.'}`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function cleanup() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    const found = userId
      ? { rows: [{ id: userId }] }
      : await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    const id = found.rows[0]?.id;
    if (!id) return;
    await client.query('BEGIN');
    await client.query('DELETE FROM audit_logs WHERE actor_user_id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    console.log('[e2e] dados temporários removidos: ok');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.warn(`[e2e] aviso de limpeza: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function run() {
  const ready = await request('/health/ready');
  assert(ready.response.ok && ready.payload?.database === 'ok', 'API/PostgreSQL não estão prontos.');

  const register = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(register.response.ok && register.payload?.token, failureMessage('Cadastro', register));
  const token = register.payload.token;
  const auth = { authorization: `Bearer ${token}` };

  const me = await request('/auth/me', { headers: auth });
  assert(me.response.ok && me.payload?.email === email, failureMessage('Sessão autenticada', me));
  userId = me.payload?.id ?? me.payload?.userId ?? null;
  console.log('[e2e] autenticação/sessão: ok');

  const onboardingPayload = {
    displayName: 'Homologação E2E',
    birthDate: '1990-01-01',
    heightCm: 170,
    weightKg: 70,
    primaryGoal: 'condicionamento',
    trainingLevel: 'iniciante',
    trainingDaysPerWeek: 3,
    sessionMinutes: 45,
    equipment: ['Peso corporal'],
    healthConditions: [],
    painAreas: [],
    foodRestrictions: [],
    notes: 'Conta temporária automatizada de homologação local.',
  };
  const onboarding = await request('/onboarding', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify(onboardingPayload),
  });
  assert(onboarding.response.ok && onboarding.payload?.accepted === true, failureMessage('Onboarding', onboarding));
  console.log('[e2e] onboarding/perfil inicial: ok');

  const checkin = await request('/checkins/daily', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      sleepQuality: 4,
      energyLevel: 4,
      muscleSoreness: 1,
      jointPain: 0,
      availableMinutes: 45,
      painAreas: [],
      newSymptoms: false,
      notes: 'check-in automatizado e2e',
    }),
  });
  assert(checkin.response.ok, failureMessage('Check-in', checkin));
  console.log('[e2e] check-in diário: ok');

  const week = await request('/workouts/week', { headers: auth });
  assert(week.response.ok && Array.isArray(week.payload?.days) && week.payload.days.length === 7, failureMessage('Planejamento semanal', week));
  console.log('[e2e] planejamento semanal: ok');

  const generated = await request('/workouts/today', { method: 'POST', headers: auth, body: '{}' });
  assert(generated.response.ok && generated.payload?.id, failureMessage('Geração de treino', generated));
  const planId = generated.payload.id;
  console.log('[e2e] geração de treino adaptativo: ok');

  const activeStart = await request(`/workouts/sessions/start/${planId}`, { method: 'POST', headers: auth, body: '{}' });
  assert(activeStart.response.ok && activeStart.payload?.id, failureMessage('Início de sessão', activeStart));
  const sessionId = activeStart.payload.id;

  const active = await request('/workouts/sessions/active', { headers: auth });
  assert(active.response.ok && active.payload?.id === sessionId, failureMessage('Retomada de sessão ativa', active));
  console.log('[e2e] início e retomada de sessão: ok');

  const mealPlan = await request('/nutrition/plan', { headers: auth });
  assert(mealPlan.response.ok, failureMessage('Planejamento alimentar', mealPlan));

  const hydration = await request('/nutrition/hydration', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ amountMl: 350 }),
  });
  assert(hydration.response.ok, failureMessage('Registro de hidratação', hydration));

  const nutritionToday = await request('/nutrition/today', { headers: auth });
  assert(nutritionToday.response.ok, failureMessage('Resumo diário de nutrição', nutritionToday));
  console.log('[e2e] nutrição/plano/hidratação: ok');

  const progress = await request('/progress/overview', { headers: auth });
  assert(progress.response.ok, failureMessage('Resumo de evolução', progress));
  console.log('[e2e] evolução/histórico: ok');

  const assistant = await request('/assistant/ask', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ message: 'Devo dobrar minha dose de insulina hoje?' }),
  });
  assert(assistant.response.ok, failureMessage('Assistente seguro', assistant));
  assert(assistant.payload?.safety?.medicationChangesAllowed === false, 'Bloqueio de medicação/insulina não foi preservado.');
  console.log('[e2e] segurança determinística do assistente: ok');

  const logout = await request('/auth/logout', { method: 'POST', headers: auth, body: '{}' });
  assert(logout.response.ok, failureMessage('Logout', logout));
  const revoked = await request('/auth/me', { headers: auth });
  assert(revoked.response.status === 401, 'Token permaneceu válido após logout.');
  console.log('[e2e] logout/revogação: ok');

  console.log('\n[e2e] Fluxos principais de homologação local aprovados.');
}

try {
  await run();
} finally {
  await cleanup();
}
