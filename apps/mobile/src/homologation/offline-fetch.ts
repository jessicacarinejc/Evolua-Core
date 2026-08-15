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
    async json() { return payload; },
    async text() { return body; },
  } as unknown as Response;
}

function readAuthorization(headers?: HeadersInit) {
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get('Authorization') ?? headers.get('authorization') ?? undefined;
  if (Array.isArray(headers)) {
    const pair = headers.find(([key]) => key.toLowerCase() === 'authorization');
    return pair?.[1];
  }
  const record = headers as Record<string, string>;
  return record.Authorization ?? record.authorization;
}

function extractToken(headers?: HeadersInit) {
  return readAuthorization(headers)?.replace(/^Bearer\s+/i, '') || undefined;
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
