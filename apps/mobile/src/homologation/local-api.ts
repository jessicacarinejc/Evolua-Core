import { localHomologationStore, LocalHomologationState } from './local-store';
import type { OnboardingData } from '../onboarding/types';

const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const lower = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('pt-BR');

function parseBody(options: RequestInit) {
  if (!options.body || typeof options.body !== 'string') return {} as any;
  try { return JSON.parse(options.body); } catch { return {} as any; }
}

function passwordVerifier(email: string, password: string) {
  // Verificador local de homologação. O estado inteiro fica protegido pelo SecureStore do SO.
  let hash = 2166136261;
  const input = `${email.toLowerCase()}\u0000${password}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `local-v1-${(hash >>> 0).toString(16)}`;
}

function tokenFor(state: LocalHomologationState) {
  if (!state.user) throw new Error('Conta local não encontrada.');
  return `offline:${state.user.id}`;
}

function requireUser(state: LocalHomologationState, token?: string) {
  if (!state.user || !token || token !== tokenFor(state)) {
    throw new Error('Sessão local inválida. Entre novamente.');
  }
  return state.user;
}

function toProfile(payload: any): OnboardingData {
  return {
    displayName: String(payload.displayName ?? ''),
    birthDate: String(payload.birthDate ?? '').slice(0, 10),
    heightCm: String(payload.heightCm ?? ''),
    weightKg: String(payload.weightKg ?? ''),
    primaryGoal: payload.primaryGoal ?? '',
    trainingLevel: payload.trainingLevel ?? '',
    trainingDaysPerWeek: Number(payload.trainingDaysPerWeek ?? 3),
    sessionMinutes: Number(payload.sessionMinutes ?? 45),
    equipment: Array.isArray(payload.equipment) ? payload.equipment : [],
    healthConditions: Array.isArray(payload.healthConditions) ? payload.healthConditions : [],
    painAreas: Array.isArray(payload.painAreas) ? payload.painAreas : [],
    foodRestrictions: Array.isArray(payload.foodRestrictions) ? payload.foodRestrictions : [],
  };
}

function authUser(state: LocalHomologationState) {
  if (!state.user) throw new Error('Conta local não encontrada.');
  return {
    id: state.user.id,
    email: state.user.email,
    onboardingCompleted: Boolean(state.profile),
    profile: state.profile,
  };
}

function computeRecovery(input: any) {
  let score = 100;
  score -= Math.max(0, 5 - Number(input.sleepQuality ?? 3)) * 8;
  score -= Math.max(0, 5 - Number(input.energyLevel ?? 3)) * 8;
  score -= Math.max(0, Number(input.muscleSoreness ?? 0)) * 3;
  score -= Math.max(0, Number(input.jointPain ?? 0)) * 4;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const notes: string[] = [];
  let status: 'ready' | 'modified' | 'recovery' | 'professional_review_required' = 'ready';
  if (input.newSymptoms || Number(input.jointPain ?? 0) >= 7) {
    status = 'professional_review_required';
    notes.push('Sintoma novo ou dor articular importante: treino automático bloqueado para revisão profissional.');
  } else if (score < 45) {
    status = 'recovery';
    notes.push('Recuperação baixa: priorize mobilidade leve, descanso e reavaliação dos sintomas.');
  } else if (score < 70) {
    status = 'modified';
    notes.push('Treino adaptado para menor volume e intensidade hoje.');
  } else {
    notes.push('Recuperação compatível com o treino planejado, mantendo técnica e percepção de esforço.');
  }
  if (Array.isArray(input.painAreas) && input.painAreas.length) {
    notes.push(`Desconfortos considerados: ${input.painAreas.join(', ')}.`);
  }
  return { recoveryScore: score, status, notes };
}

const baseExercises = [
  { id: 'agachamento-cadeira', name: 'Agachamento para cadeira', primaryMuscle: 'Pernas', instructions: 'Desça de forma controlada até tocar a cadeira e retorne sem impulso.', safetyNotes: 'Reduza a amplitude se houver desconforto no joelho.', videoUrl: null, order: 1, sets: 3, repsMin: 8, repsMax: 12, durationSeconds: null, restSeconds: 75, targetRir: 3 },
  { id: 'remada-elastico', name: 'Remada com elástico', primaryMuscle: 'Costas', instructions: 'Mantenha o tronco estável e aproxime as escápulas sem elevar os ombros.', safetyNotes: null, videoUrl: null, order: 2, sets: 3, repsMin: 10, repsMax: 15, durationSeconds: null, restSeconds: 60, targetRir: 3 },
  { id: 'flexao-inclinada', name: 'Flexão inclinada', primaryMuscle: 'Peito', instructions: 'Use apoio elevado, corpo alinhado e movimento controlado.', safetyNotes: 'Interrompa se houver dor no ombro, cotovelo ou punho.', videoUrl: null, order: 3, sets: 3, repsMin: 6, repsMax: 12, durationSeconds: null, restSeconds: 75, targetRir: 3 },
  { id: 'ponte-gluteos', name: 'Ponte de glúteos', primaryMuscle: 'Glúteos', instructions: 'Eleve o quadril sem hiperestender a lombar e contraia os glúteos no topo.', safetyNotes: null, videoUrl: null, order: 4, sets: 3, repsMin: 10, repsMax: 15, durationSeconds: null, restSeconds: 60, targetRir: 3 },
  { id: 'dead-bug', name: 'Dead bug controlado', primaryMuscle: 'Core', instructions: 'Mantenha a lombar confortável e mova braços e pernas sem perder o controle do tronco.', safetyNotes: null, videoUrl: null, order: 5, sets: 3, repsMin: 6, repsMax: 10, durationSeconds: null, restSeconds: 45, targetRir: 4 },
];

function blockedPatterns(state: LocalHomologationState) {
  const areas = [
    ...(state.profile?.painAreas ?? []),
    ...((state.latestCheckin as any)?.painAreas ?? []),
  ].map(lower);
  const blocked: string[] = [];
  if (areas.some((item) => item.includes('joelho'))) blocked.push('impacto-alto', 'flexao-profunda-joelho');
  if (areas.some((item) => item.includes('ombro'))) blocked.push('press-acima-cabeca');
  if (areas.some((item) => item.includes('lomb') || item.includes('coluna'))) blocked.push('carga-axial-alta');
  return [...new Set(blocked)];
}

function makeStrengthPlan(state: LocalHomologationState) {
  const recovery = state.recovery as any;
  if (!state.latestCheckin || !recovery) throw new Error('Faça o check-in diário antes de gerar o treino.');
  if (recovery.status === 'professional_review_required') {
    throw new Error('O check-in de hoje exige revisão profissional antes de gerar treino automático.');
  }
  const pain = [
    ...(state.profile?.painAreas ?? []),
    ...((state.latestCheckin as any)?.painAreas ?? []),
  ].map(lower);
  let exercises = [...baseExercises];
  if (pain.some((item) => item.includes('joelho'))) exercises = exercises.filter((item) => item.id !== 'agachamento-cadeira');
  if (pain.some((item) => item.includes('ombro') || item.includes('punho') || item.includes('cotovelo'))) exercises = exercises.filter((item) => item.id !== 'flexao-inclinada');
  exercises = exercises.map((item, index) => ({ ...item, order: index + 1, sets: recovery.status === 'recovery' ? 2 : item.sets }));
  const minutes = Math.min(Number((state.latestCheckin as any).availableMinutes ?? state.profile?.sessionMinutes ?? 45), recovery.status === 'recovery' ? 30 : 60);
  return {
    id: id('plan'),
    goal: state.profile?.primaryGoal || 'condicionamento',
    estimatedMinutes: Math.max(20, minutes),
    safety: {
      split: recovery.status === 'recovery' ? 'Recuperação ativa' : 'Full body adaptativo',
      recoveryScore: recovery.recoveryScore,
      allowedIntensity: recovery.status === 'ready' ? 'alta' : recovery.status === 'modified' ? 'moderada' : 'leve',
      blockedPatterns: blockedPatterns(state),
      notes: recovery.notes,
    },
    exercises,
  };
}

function makeTaiChiPlan(state: LocalHomologationState, routine: string) {
  const recovery = state.recovery as any;
  if (!state.latestCheckin || !recovery) throw new Error('Faça o check-in diário antes de preparar o Tai Chi.');
  if (recovery.status === 'professional_review_required') throw new Error('O check-in indica revisão profissional antes do treino automático.');
  const configs: Record<string, { minutes: number; label: string; names: string[] }> = {
    '15-min': { minutes: 15, label: 'Tai Chi 15 min', names: ['Despertar do Qi', 'Mãos como Nuvens', 'Repelir o Macaco', 'Abraçar a Árvore'] },
    walking: { minutes: 12, label: 'Tai Chi Walking', names: ['Transferência de peso', 'Passos à frente', 'Passos para trás', 'Caminhada contínua'] },
    'chen-20': { minutes: 20, label: 'Chen · força isométrica', names: ['Postura do Arco', 'Empurrar controlado', 'Sustentação isométrica', 'Retorno consciente'] },
    'yang-25-30': { minutes: 28, label: 'Yang · fluidez', names: ['Aparar a Cauda do Pássaro', 'Mãos como Nuvens', 'Movimentos circulares', 'Fechamento'] },
  };
  const config = configs[routine] ?? configs['15-min'];
  return {
    id: id('tai-chi'), goal: 'mobilidade_e_equilibrio', estimatedMinutes: config.minutes,
    safety: { split: config.label, routine: `tai_chi_${routine}`, recoveryScore: recovery.recoveryScore, allowedIntensity: 'leve', blockedPatterns: blockedPatterns(state), notes: recovery.notes },
    exercises: config.names.map((name, index) => ({ id: `tai-${routine}-${index}`, name, primaryMuscle: 'Corpo inteiro', instructions: 'Execute devagar, respirando naturalmente e sem forçar amplitude.', safetyNotes: 'Use apoio próximo se houver insegurança no equilíbrio.', videoUrl: null, order: index + 1, sets: 1, repsMin: null, repsMax: null, durationSeconds: Math.round((config.minutes * 60) / config.names.length), restSeconds: 15, targetRir: 5 })),
  };
}

function makeCalisthenicsPlan(state: LocalHomologationState) {
  const recovery = state.recovery as any;
  if (!state.latestCheckin || !recovery) throw new Error('Faça o check-in diário antes de preparar o circuito.');
  if (recovery.status === 'professional_review_required') throw new Error('O check-in indica revisão profissional antes do treino automático.');
  const pain = [ ...(state.profile?.painAreas ?? []), ...((state.latestCheckin as any)?.painAreas ?? []) ].map(lower);
  if (pain.some((item) => item.includes('ombro') || item.includes('punho') || item.includes('cotovelo'))) {
    throw new Error('Dor em ombro, punho ou cotovelo bloqueia automaticamente este circuito de calistenia.');
  }
  const lowImpact = pain.some((item) => item.includes('joelho')) || recovery.status !== 'ready';
  const names = lowImpact
    ? ['Flexão inclinada', 'Polichinelo sem salto', 'Ponte de glúteos', 'Marcha com joelhos elevados', 'Prancha inclinada']
    : ['Flexão', 'Polichinelo', 'Mergulho no banco', 'Joelhos altos', 'Flexão diamante'];
  const rounds = recovery.recoveryScore >= 75 ? 4 : 3;
  return {
    id: id('calisthenics'), goal: 'condicionamento', estimatedMinutes: rounds * 7,
    safety: { split: 'Circuito calistênico', routine: 'calisthenics_circuit', recoveryScore: recovery.recoveryScore, allowedIntensity: recovery.status === 'ready' ? 'moderada' : 'leve', blockedPatterns: blockedPatterns(state), rounds, workSeconds: 40, transitionSeconds: 20, roundRestSeconds: 120, notes: recovery.notes },
    exercises: names.map((name, index) => ({ id: `cali-${index}`, name, primaryMuscle: 'Corpo inteiro', instructions: 'Execute com técnica controlada durante o tempo de trabalho.', safetyNotes: 'Pare se surgir dor articular ou sintoma incomum.', videoUrl: null, order: index + 1, sets: rounds, repsMin: null, repsMax: null, durationSeconds: 40, restSeconds: 20, targetRir: 3 })),
  };
}

function makeSession(plan: any) {
  return {
    id: id('session'), startedAt: nowIso(), completedAt: null, perceivedEffort: null, feedback: null,
    plan: { id: plan.id, goal: plan.goal, estimatedMinutes: plan.estimatedMinutes, safety: plan.safety },
    safetyEvents: [],
    exercises: plan.exercises.map((exercise: any) => ({
      id: exercise.id, name: exercise.name, primaryMuscle: exercise.primaryMuscle, instructions: exercise.instructions, videoUrl: exercise.videoUrl, videoLicense: exercise.videoLicense ?? null, videoAttribution: exercise.videoAttribution ?? null, order: exercise.order, plannedSets: exercise.sets, repsMin: exercise.repsMin, repsMax: exercise.repsMax, durationSeconds: exercise.durationSeconds, restSeconds: exercise.restSeconds, targetRir: exercise.targetRir,
      sets: Array.from({ length: exercise.sets }, (_, index) => ({ id: id('set'), setNumber: index + 1, repetitions: null, loadKg: null, durationSeconds: null, rir: null, completed: false, completedAt: null })),
    })),
  };
}

function nutritionDay(state: LocalHomologationState) {
  const today = new Date().toISOString().slice(0, 10);
  const meals = (state.nutrition.meals as any[]).filter((meal) => String(meal.consumedAt ?? '').slice(0, 10) === today);
  const sum = (key: string) => meals.reduce((total, meal) => total + Number(meal[key] ?? 0), 0);
  return {
    date: today,
    targets: state.nutrition.targets,
    totals: { caloriesKcal: sum('caloriesKcal'), proteinG: sum('proteinG'), carbsG: sum('carbsG'), fatG: sum('fatG'), fiberG: sum('fiberG'), waterMl: state.nutrition.hydrationMl },
    meals,
    restrictions: (state.profile?.foodRestrictions ?? []).map((item) => ({ item, type: 'restriction', hardBlock: true })),
  };
}

function personalizedMealPlan(state: LocalHomologationState) {
  const blocks = (state.profile?.foodRestrictions ?? []).map(lower).filter(Boolean);
  const hasBlocked = (ingredients: string[]) => ingredients.some((ingredient) => blocks.some((block) => lower(ingredient).includes(block)));
  const candidates = {
    cafe: [
      { title: 'Aveia com banana e sementes', ingredients: ['aveia', 'banana', 'chia'], tags: ['carboidrato complexo', 'fibras'] },
      { title: 'Ovos com fruta', ingredients: ['ovos', 'fruta'], tags: ['proteína', 'prático'] },
    ],
    almoco: [
      { title: 'Arroz, feijão, proteína e salada', ingredients: ['arroz', 'feijão', 'frango', 'salada'], tags: ['equilibrado', 'fibras'] },
      { title: 'Batata, peixe e legumes', ingredients: ['batata', 'peixe', 'legumes'], tags: ['proteína', 'legumes'] },
    ],
    jantar: [
      { title: 'Bowl de grãos, proteína e vegetais', ingredients: ['arroz', 'feijão', 'proteína', 'vegetais'], tags: ['completo', 'adaptável'] },
      { title: 'Omelete com legumes e acompanhamento', ingredients: ['ovos', 'legumes', 'batata'], tags: ['proteína', 'prático'] },
    ],
  } as const;
  const meal = (key: keyof typeof candidates, label: string) => {
    const safe = candidates[key].filter((candidate) => !hasBlocked([...candidate.ingredients]));
    return { key, label, selected: safe[0] ?? null, alternatives: safe.slice(1), unavailable: safe.length === 0 };
  };
  const conditions = (state.profile?.healthConditions ?? []).map((condition) => ({ code: lower(condition).replace(/\s+/g, '_'), label: condition }));
  return {
    goal: state.profile?.primaryGoal || 'saude',
    meals: [meal('cafe', 'Café da manhã'), meal('almoco', 'Almoço'), meal('jantar', 'Jantar')],
    safety: {
      hardBlocksApplied: state.profile?.foodRestrictions ?? [],
      clinicalReviewRecommended: conditions.length > 0,
      automaticPrescription: false,
      conditions,
      note: conditions.length > 0
        ? 'Condições clínicas exigem revisão profissional. As opções são apenas exemplos de organização alimentar e não alteram medicação ou insulina.'
        : 'Opções educativas para homologação; ajuste individual deve respeitar tolerância, preferências e orientação profissional.',
    },
  };
}

function progressOverview(state: LocalHomologationState) {
  const metrics = state.progress.bodyMetrics as any[];
  const first = metrics[0] ?? null;
  const current = metrics[metrics.length - 1] ?? null;
  const history = state.workout.history as any[];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = history.filter((item) => new Date(item.session?.completedAt ?? item.completedAt ?? 0).getTime() >= weekAgo);
  const rpes = history.map((item) => Number(item.session?.perceivedEffort ?? item.perceivedEffort)).filter(Number.isFinite);
  return {
    weight: { currentKg: current?.weightKg ?? null, firstKg: first?.weightKg ?? null, changeKg: current?.weightKg != null && first?.weightKg != null ? Number((current.weightKg - first.weightKg).toFixed(1)) : null, measuredAt: current?.measuredAt ?? null },
    workouts: { completedTotal: history.length, completedThisWeek: week.length, volumeThisWeekKg: week.reduce((sum, item) => sum + Number(item.summary?.totalVolumeKg ?? 0), 0), averageRpe: rpes.length ? Number((rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1)) : null },
    body: current,
  };
}

function weeklyPlan(state: LocalHomologationState) {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const preferred = Math.max(1, Math.min(7, Number(state.profile?.trainingDaysPerWeek ?? 3)));
  const order = [0, 2, 4, 6, 1, 3, 5].slice(0, preferred);
  const completedDates = new Set((state.workout.history as any[]).map((item) => String(item.session?.completedAt ?? '').slice(0, 10)));
  const recovery = state.recovery as any;
  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday); date.setDate(monday.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    const todayIso = today.toISOString().slice(0, 10);
    const scheduled = order.includes(index);
    let status = scheduled ? 'planejado' : 'descanso';
    if (completedDates.has(iso)) status = 'concluido';
    else if (iso < todayIso && scheduled) status = 'nao_realizado';
    else if (iso === todayIso && scheduled) {
      if (!state.latestCheckin) status = 'aguarda_checkin';
      else if (recovery?.status === 'ready') status = 'pronto';
      else if (recovery?.status === 'modified') status = 'adaptado';
      else if (recovery?.status === 'recovery') status = 'recuperacao';
      else status = 'revisao_profissional';
    }
    return { date: iso, weekday: weekdays[index], scheduled, split: scheduled ? 'Full body' : 'Descanso', status, estimatedMinutes: scheduled ? Number(state.profile?.sessionMinutes ?? 45) : null, isToday: iso === todayIso };
  });
  const weekEnd = new Date(monday); weekEnd.setDate(monday.getDate() + 6);
  return { weekStart: monday.toISOString().slice(0, 10), weekEnd: weekEnd.toISOString().slice(0, 10), preferredDaysPerWeek: preferred, sessionMinutes: Number(state.profile?.sessionMinutes ?? 45), days, policy: { checkinOverridesCalendar: true, note: 'O check-in diário prevalece sobre o calendário quando houver dor, sintomas ou recuperação insuficiente.' } };
}

function assistantReply(state: LocalHomologationState, message: string) {
  const text = lower(message);
  const medicationTerms = ['insulina', 'medicação', 'medicacao', 'remédio', 'remedio', 'dose', 'dosagem', 'suspender medicamento', 'aumentar medicamento'];
  const redFlags = ['dor no peito', 'desmaio', 'falta de ar intensa', 'falta de ar forte', 'tontura forte'];
  if (medicationTerms.some((term) => text.includes(term))) {
    return { answer: 'Não posso orientar alteração de dose, início, suspensão ou ajuste de medicação/insulina. Registre seus dados e procure o profissional responsável pelo tratamento.', safety: { blocked: true, reason: 'medication_change', requiresProfessionalReview: true, medicationChangesAllowed: false }, source: 'offline-deterministic-homologation' };
  }
  if (redFlags.some((term) => text.includes(term))) {
    return { answer: 'Esse relato contém um sinal de alerta. Interrompa recomendações automáticas de treino e procure avaliação profissional apropriada.', safety: { blocked: true, reason: 'red_flag', requiresProfessionalReview: true, medicationChangesAllowed: false }, source: 'offline-deterministic-homologation' };
  }
  const recovery = state.recovery as any;
  let answer = 'Posso ajudar a organizar seus registros durante a homologação offline.';
  if (text.includes('treino')) answer = recovery ? `Seu último check-in ficou em ${recovery.recoveryScore}% de recuperação, com status ${recovery.status}. O treino deve respeitar os bloqueios de dor e a percepção de esforço.` : 'Faça o check-in diário antes de gerar o treino para que as regras de segurança sejam aplicadas.';
  else if (text.includes('aliment') || text.includes('nutri') || text.includes('comer')) answer = 'Use o diário alimentar e o plano educativo respeitando todas as restrições cadastradas. Condições clínicas exigem revisão profissional e não geram alteração de medicação ou insulina.';
  else if (text.includes('dor')) answer = 'Registre a área e a intensidade da dor no check-in ou durante a sessão. Dor articular importante e sintomas novos bloqueiam automaticamente recomendações de treino.';
  return { answer, safety: { blocked: false, reason: null, requiresProfessionalReview: false, medicationChangesAllowed: false }, source: 'offline-deterministic-homologation' };
}

export async function localRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const method = String(options.method ?? 'GET').toUpperCase();
  const body = parseBody(options);
  let state = await localHomologationStore.load();
  const save = async () => localHomologationStore.save(state);

  if (path === '/auth/register' && method === 'POST') {
    const email = lower(body.email);
    if (!email.includes('@') || String(body.password ?? '').length < 8) throw new Error('Informe e-mail válido e senha com pelo menos 8 caracteres.');
    if (state.user) throw new Error('Já existe uma conta neste aparelho. Use “Já tenho conta” para entrar.');
    state.user = { id: id('user'), email, passwordVerifier: passwordVerifier(email, String(body.password)), createdAt: nowIso() };
    await save();
    return { token: tokenFor(state), user: authUser(state) } as T;
  }

  if (path === '/auth/login' && method === 'POST') {
    const email = lower(body.email);
    if (!state.user || state.user.email !== email || state.user.passwordVerifier !== passwordVerifier(email, String(body.password ?? ''))) throw new Error('E-mail ou senha inválidos para a conta local.');
    return { token: tokenFor(state), user: authUser(state) } as T;
  }

  if (path === '/auth/me') { requireUser(state, token); return authUser(state) as T; }
  if (path === '/auth/logout' && method === 'POST') { requireUser(state, token); return { saved: true } as T; }

  requireUser(state, token);

  if (path === '/onboarding' && method === 'POST') { state.profile = toProfile(body); await save(); return { saved: true, profile: state.profile } as T; }
  if (path === '/profile' && method === 'GET') return { profile: state.profile } as T;
  if (path === '/profile' && method === 'PUT') { state.profile = toProfile(body); await save(); return { saved: true, profile: state.profile, safety: { status: 'ok', notes: [] }, next: 'continue' } as T; }

  if (path === '/checkins/daily' && method === 'POST') {
    const evaluation = computeRecovery(body);
    state.latestCheckin = { ...body, savedAt: nowIso() };
    state.recovery = evaluation;
    await save();
    return { evaluation } as T;
  }

  if (path === '/workouts/today' && method === 'GET') return { plan: state.workout.currentPlan } as T;
  if (path === '/workouts/today' && method === 'POST') { const plan = makeStrengthPlan(state); state.workout.currentPlan = plan; await save(); return plan as T; }
  if (path.startsWith('/workouts/tai-chi/') && method === 'POST') { const routine = path.split('/').pop() || '15-min'; const plan = makeTaiChiPlan(state, routine); state.workout.currentPlan = plan; await save(); return plan as T; }
  if (path === '/workouts/calisthenics/circuit' && method === 'POST') { const plan = makeCalisthenicsPlan(state); state.workout.currentPlan = plan; await save(); return plan as T; }
  if (path === '/workouts/week' && method === 'GET') return weeklyPlan(state) as T;
  if (path === '/workouts/sessions/active' && method === 'GET') return { session: state.workout.activeSession } as T;

  const startMatch = path.match(/^\/workouts\/sessions\/start\/(.+)$/);
  if (startMatch && method === 'POST') {
    const plan = state.workout.currentPlan as any;
    if (!plan || plan.id !== startMatch[1]) throw new Error('Plano de treino local não encontrado. Gere o treino novamente.');
    const session = makeSession(plan);
    state.workout.activeSession = session;
    await save();
    return session as T;
  }

  const setsMatch = path.match(/^\/workouts\/sessions\/([^/]+)\/sets$/);
  if (setsMatch && method === 'PUT') {
    const session = state.workout.activeSession as any;
    if (!session || session.id !== setsMatch[1]) throw new Error('Sessão ativa não encontrada.');
    const exercise = session.exercises.find((item: any) => item.id === body.exerciseId);
    const set = exercise?.sets.find((item: any) => item.setNumber === Number(body.setNumber));
    if (!set) throw new Error('Série não encontrada.');
    Object.assign(set, { repetitions: body.repetitions ?? null, loadKg: body.loadKg ?? null, durationSeconds: body.durationSeconds ?? null, rir: body.rir ?? null, completed: body.completed ?? true, completedAt: body.completed === false ? null : nowIso() });
    await save();
    return session as T;
  }

  const eventMatch = path.match(/^\/workouts\/sessions\/([^/]+)\/events$/);
  if (eventMatch && method === 'POST') {
    const session = state.workout.activeSession as any;
    if (!session || session.id !== eventMatch[1]) throw new Error('Sessão ativa não encontrada.');
    const severeSymptom = ['dizziness', 'shortness_of_breath'].includes(body.type);
    const severePain = body.type === 'pain' && Number(body.severity ?? 0) >= 7;
    const event = { id: id('event'), exerciseId: body.exerciseId ?? null, type: body.type === 'pain' ? 'pain' : 'symptom', bodyArea: body.bodyArea ?? null, severity: Number(body.severity ?? 0), notes: body.notes ?? null, metadata: { sourceType: body.type }, createdAt: nowIso() };
    session.safetyEvents = [...(session.safetyEvents ?? []), event];
    state.workout.safetyEvents.push(event);
    await save();
    return { saved: true, stopRecommended: severeSymptom || severePain, professionalReviewRecommended: severeSymptom || severePain, substitutionRecommended: body.type === 'pain' && Number(body.severity ?? 0) >= 4 && !severePain, message: severeSymptom || severePain ? 'Interrompa a sessão e procure avaliação profissional.' : body.type === 'pain' ? 'A sessão foi ajustada. Considere substituir o exercício e reduza a intensidade.' : 'Evento registrado.', session } as T;
  }

  const substitutionsMatch = path.match(/^\/workouts\/sessions\/([^/]+)\/exercises\/([^/]+)\/substitutions$/);
  if (substitutionsMatch && method === 'GET') {
    const session = state.workout.activeSession as any;
    const current = session?.exercises.find((item: any) => item.id === substitutionsMatch[2]);
    if (!current) throw new Error('Exercício não encontrado na sessão.');
    const candidate = { id: `sub-${current.id}`, name: `${current.name} · versão adaptada`, primaryMuscle: current.primaryMuscle, movementPattern: 'adaptado', instructions: 'Use menor amplitude, apoio e carga confortável, sem reproduzir dor.', safetyNotes: 'Se a dor persistir, interrompa o exercício.', videoUrl: null, reason: 'Alternativa local com menor exigência articular.' };
    return { currentExercise: { id: current.id, name: current.name, primaryMuscle: current.primaryMuscle }, candidates: [candidate], safety: { blockedPatterns: blockedPatterns(state), painAreas: (state.latestCheckin as any)?.painAreas ?? [] } } as T;
  }

  const substituteMatch = path.match(/^\/workouts\/sessions\/([^/]+)\/substitute$/);
  if (substituteMatch && method === 'POST') {
    const session = state.workout.activeSession as any;
    if (!session || session.id !== substituteMatch[1]) throw new Error('Sessão ativa não encontrada.');
    const index = session.exercises.findIndex((item: any) => item.id === body.currentExerciseId);
    if (index < 0) throw new Error('Exercício não encontrado.');
    const current = session.exercises[index];
    session.exercises[index] = { ...current, id: body.replacementExerciseId, name: `${current.name} · versão adaptada`, instructions: 'Use menor amplitude, apoio e carga confortável, sem reproduzir dor.' };
    const event = { id: id('substitution'), exerciseId: current.id, type: 'substitution', bodyArea: null, severity: null, notes: body.reason ?? 'Substituição local', metadata: { replacementExerciseId: body.replacementExerciseId }, createdAt: nowIso() };
    session.safetyEvents = [...(session.safetyEvents ?? []), event];
    state.workout.safetyEvents.push(event);
    await save();
    return session as T;
  }

  const completeMatch = path.match(/^\/workouts\/sessions\/([^/]+)\/complete$/);
  if (completeMatch && method === 'POST') {
    const session = state.workout.activeSession as any;
    if (!session || session.id !== completeMatch[1]) throw new Error('Sessão ativa não encontrada.');
    session.completedAt = nowIso(); session.perceivedEffort = Number(body.perceivedEffort ?? 0) || null; session.feedback = body.feedback ?? null;
    const sets = session.exercises.flatMap((exercise: any) => exercise.sets).filter((set: any) => set.completed);
    const totalVolumeKg = sets.reduce((sum: number, set: any) => sum + Number(set.loadKg ?? 0) * Number(set.repetitions ?? 0), 0);
    const summary = { completedSets: sets.length, totalVolumeKg, durationMinutes: Math.max(1, Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)), perceivedEffort: session.perceivedEffort };
    state.workout.history.push({ session, summary });
    state.workout.activeSession = null; state.workout.currentPlan = null;
    await save();
    return { session, summary } as T;
  }

  if (path === '/progress/overview' && method === 'GET') return progressOverview(state) as T;
  if (path === '/progress/body-metrics' && method === 'GET') return { metrics: state.progress.bodyMetrics } as T;
  if (path === '/progress/body-metrics' && method === 'POST') {
    const metric = { id: id('metric'), measuredAt: nowIso(), weightKg: body.weightKg ?? null, bodyFatPercent: body.bodyFatPercent ?? null, waistCm: body.waistCm ?? null, hipCm: body.hipCm ?? null, chestCm: body.chestCm ?? null, notes: body.notes ?? null };
    state.progress.bodyMetrics.push(metric); await save(); return metric as T;
  }
  if (path === '/progress/workouts' && method === 'GET') {
    const workouts = (state.workout.history as any[]).map((item) => ({ id: item.session.id, completedAt: item.session.completedAt, title: item.session.plan.safety?.split ?? 'Treino concluído', goal: item.session.plan.goal, durationMinutes: item.summary.durationMinutes, completedSets: item.summary.completedSets, volumeKg: item.summary.totalVolumeKg, perceivedEffort: item.session.perceivedEffort, feedback: item.session.feedback }));
    return { workouts: workouts.reverse() } as T;
  }
  if (path === '/progress/strength' && method === 'GET') {
    return { exercises: [], policy: { automaticIncreasePercent: 2.5, requiresTwoConsecutiveSessions: true, neverForcesLoadChange: true, note: 'A progressão local nunca força aumento de carga e permanece subordinada aos sinais de dor e recuperação.' } } as T;
  }

  if (path === '/nutrition/today' && method === 'GET') return nutritionDay(state) as T;
  if (path === '/nutrition/meals' && method === 'POST') {
    const restrictions = (state.profile?.foodRestrictions ?? []).map(lower).filter(Boolean);
    if (restrictions.some((restriction) => lower(body.name).includes(restriction))) throw new Error('Este alimento corresponde a uma restrição cadastrada e foi bloqueado.');
    const meal = { id: id('meal'), mealType: body.mealType, consumedAt: nowIso(), name: body.name, quantityG: body.quantityG ?? null, caloriesKcal: Number(body.caloriesKcal ?? 0), proteinG: Number(body.proteinG ?? 0), carbsG: Number(body.carbsG ?? 0), fatG: Number(body.fatG ?? 0), fiberG: Number(body.fiberG ?? 0), notes: body.notes ?? null };
    state.nutrition.meals.push(meal); await save(); return nutritionDay(state) as T;
  }
  if (path === '/nutrition/hydration' && method === 'POST') { state.nutrition.hydrationMl += Math.max(0, Number(body.amountMl ?? 0)); await save(); return nutritionDay(state) as T; }
  if (path === '/nutrition/targets' && method === 'PUT') { state.nutrition.targets = { caloriesKcal: body.caloriesKcal ?? null, proteinG: body.proteinG ?? null, carbsG: body.carbsG ?? null, fatG: body.fatG ?? null, fiberG: body.fiberG ?? null, waterMl: body.waterMl ?? null, source: 'user' }; await save(); return nutritionDay(state) as T; }
  if (path === '/nutrition/plan' && method === 'GET') return personalizedMealPlan(state) as T;

  if (path === '/assistant/ask' && method === 'POST') return assistantReply(state, String(body.message ?? '')) as T;
  if (path === '/exercises' && method === 'GET') return { exercises: baseExercises } as T;

  throw new Error(`Fluxo local ainda não implementado: ${method} ${path}`);
}
