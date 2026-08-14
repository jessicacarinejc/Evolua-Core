import process from 'node:process';

const API_URL = (process.env.API_URL ?? 'http://127.0.0.1:3333/v1').replace(/\/$/, '');
const email = `homologacao-smoke-${Date.now()}@evolua.local`;
const password = 'EvoluaSmoke#2026!';

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log(`[smoke] API: ${API_URL}`);

const health = await request('/health');
assert(health.response.ok && health.payload?.status === 'ok', 'Healthcheck da API falhou.');
console.log('[smoke] healthcheck: ok');

const register = await request('/auth/register', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
assert(register.response.ok, `Cadastro falhou (${register.response.status}).`);
assert(typeof register.payload?.token === 'string' && register.payload.token.length >= 32, 'Cadastro não retornou token válido.');
const token = register.payload.token;
console.log('[smoke] cadastro e sessão: ok');

const me = await request('/auth/me', {
  headers: { authorization: `Bearer ${token}` },
});
assert(me.response.ok && me.payload?.email === email, 'Sessão autenticada não retornou a conta criada.');
console.log('[smoke] autenticação: ok');

const professional = await request('/professional/me', {
  headers: { authorization: `Bearer ${token}` },
});
assert(
  professional.response.status === 403,
  `Conta comum deveria ser bloqueada no portal profissional; status recebido: ${professional.response.status}.`,
);
console.log('[smoke] autorização profissional: ok');

const logout = await request('/auth/logout', {
  method: 'POST',
  headers: { authorization: `Bearer ${token}` },
  body: '{}',
});
assert(logout.response.ok && logout.payload?.success === true, 'Logout falhou.');

const revoked = await request('/auth/me', {
  headers: { authorization: `Bearer ${token}` },
});
assert(revoked.response.status === 401, 'Token revogado continuou aceito após logout.');
console.log('[smoke] revogação de sessão: ok');

console.log('\n[smoke] Homologação local básica aprovada.');
