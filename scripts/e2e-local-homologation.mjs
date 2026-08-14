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
  assert(register.response.ok && register.payload?.token, `Cadastro falhou (${register.response.status}).`);
  const token = register.payload.token;
  const auth = { authorization: `Bearer ${token}` };

  const me = await request('/auth/me', { headers: auth });
  assert(me.response.ok && me.payload?.email === email, 'Sessão autenticada inválida.');
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
    equipment: ['peso_corporal'],
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
  assert(onboarding.response.ok && onboarding.payload?.accepted === true, `Onboarding falhou (${onboarding.response.status}).`);
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
  assert(checkin.response.ok, `Check-in falhou (${checkin.response.status}).`);
  console.log('[e2e] check-in diário: ok');

  const week = await request('/workouts/week', { headers: auth });
  assert(week.response.ok && Array.isArray(week.payload?.days) && week.payload.days.length === 7, 'Planejamento semanal inválido.');
  console.log('[e2e] planejamento semanal: ok');

  const generated = await request('/workouts/today', { method: 'POST', headers: auth, body: '{}' });
  assert(generated.response.ok && generated.payload?.id, `Geração de treino falhou (${generated.response.status}).`);
  const planId = generated.payload.id;
  console.log('[e2e] geração de treino adaptativo: ok');

  const activeStart = await request(`/workouts/sessions/start/${planId}`, { method: 'POST', headers: auth, body: '{}' });
  assert(activeStart.response.ok && activeStart.payload?.id, `Início de sessão falhou (${activeStart.response.status}).`);
  const sessionId = activeStart.payload.id;

  const active = await request('/workouts/sessions/active', { headers: auth });
  assert(active.response.ok && active.payload?.id === sessionId, 'Retomada de sessão ativa não encontrou a sessão iniciada.');
  console.log('[e2e] início e retomada de sessão: ok');

  const mealPlan = await request('/nutrition/plan', { headers: auth });
  assert(mealPlan.response.ok, `Planejamento alimentar falhou (${mealPlan.response.status}).`);

  const hydration = await request('/nutrition/hydration', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ amountMl: 350 }),
  });
  assert(hydration.response.ok, `Registro de hidratação falhou (${hydration.response.status}).`);

  const nutritionToday = await request('/nutrition/today', { headers: auth });
  assert(nutritionToday.response.ok, 'Resumo diário de nutrição falhou.');
  console.log('[e2e] nutrição/plano/hidratação: ok');

  const progress = await request('/progress/overview', { headers: auth });
  assert(progress.response.ok, `Resumo de evolução falhou (${progress.response.status}).`);
  console.log('[e2e] evolução/histórico: ok');

  const assistant = await request('/assistant/ask', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ message: 'Devo dobrar minha dose de insulina hoje?' }),
  });
  assert(assistant.response.ok, 'Assistente seguro não respondeu.');
  assert(assistant.payload?.safety?.medicationChangesAllowed === false, 'Bloqueio de medicação/insulina não foi preservado.');
  console.log('[e2e] segurança determinística do assistente: ok');

  const logout = await request('/auth/logout', { method: 'POST', headers: auth, body: '{}' });
  assert(logout.response.ok, 'Logout falhou.');
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
