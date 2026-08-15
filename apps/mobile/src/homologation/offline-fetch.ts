import { localRequest } from './local-api';

const OFFLINE_BASE_URL = 'http://offline.evolua.local/v1';
const INSTALL_KEY = '__evoluaOfflineFetchInstalled';

type GlobalWithOfflineFlag = typeof globalThis & { [INSTALL_KEY]?: boolean };

function response(status: number, payload: unknown): Response {
  const body = JSON.stringify(payload);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Offline Error',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    url: OFFLINE_BASE_URL,
    redirected: false,
    type: 'basic',
    body: null,
    bodyUsed: false,
    clone() { return response(status, payload); },
    async json() { return payload; },
    async text() { return body; },
    async arrayBuffer() { return new TextEncoder().encode(body).buffer; },
    async blob() { return new Blob([body], { type: 'application/json' }); },
    async formData() { throw new Error('formData não suportado no modo offline.'); },
    bytes: async () => new TextEncoder().encode(body),
  } as Response;
}

function extractToken(headers?: HeadersInit) {
  if (!headers) return undefined;
  const normalized = new Headers(headers);
  const authorization = normalized.get('Authorization') ?? normalized.get('authorization');
  return authorization?.replace(/^Bearer\s+/i, '') || undefined;
}

export function installOfflineFetchInterceptor() {
  const root = globalThis as GlobalWithOfflineFlag;
  if (root[INSTALL_KEY]) return;
  const originalFetch = globalThis.fetch.bind(globalThis);
  root[INSTALL_KEY] = true;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    if (!url.startsWith(OFFLINE_BASE_URL)) {
      return originalFetch(input, init);
    }

    const suffix = url.slice(OFFLINE_BASE_URL.length);
    const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
    const requestInit: RequestInit = {
      ...(typeof input === 'object' && 'method' in input ? { method: input.method } : {}),
      ...init,
    };
    const token = extractToken(init?.headers ?? (typeof input === 'object' && 'headers' in input ? input.headers : undefined));
    try {
      const payload = await localRequest(path || '/', requestInit, token);
      return response(200, payload);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível concluir a operação local.';
      return response(400, { message });
    }
  }) as typeof fetch;
}

export { OFFLINE_BASE_URL };
