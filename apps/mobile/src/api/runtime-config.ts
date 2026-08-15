import * as SecureStore from 'expo-secure-store';

const API_URL_KEY = 'evolua_core_api_base_url';
const BUILD_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/v1';
const PLACEHOLDER_HOSTS = new Set(['192.0.2.1', '10.0.2.2', 'localhost', '127.0.0.1', '::1']);

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('Informe o endereço completo da API de homologação.');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Endereço inválido. Use uma URL completa iniciando por http:// ou https://.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('A API deve usar http:// ou https://.');
  }

  return trimmed;
}

export function isPlaceholderApiUrl(value: string) {
  try {
    const parsed = new URL(normalizeApiUrl(value));
    return PLACEHOLDER_HOSTS.has(parsed.hostname);
  } catch {
    return true;
  }
}

export async function probeApiBaseUrl(value: string, timeoutMs = 6000) {
  const normalized = normalizeApiUrl(value);
  if (isPlaceholderApiUrl(normalized)) {
    return { ok: false, message: 'O aplicativo ainda está usando um endereço temporário de build.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${normalized}/health/ready`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.status !== 'ready') {
      return { ok: false, message: 'A API respondeu, mas o banco de homologação ainda não está pronto.' };
    }
    return { ok: true, message: 'API e banco de homologação conectados.' };
  } catch (cause) {
    const message = cause instanceof Error && cause.name === 'AbortError'
      ? 'A API de homologação não respondeu dentro do tempo esperado.'
      : 'Não foi possível conectar à API de homologação.';
    return { ok: false, message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getApiBaseUrl() {
  const saved = await SecureStore.getItemAsync(API_URL_KEY);
  return normalizeApiUrl(saved ?? BUILD_API_URL);
}

export async function setApiBaseUrl(value: string) {
  const normalized = normalizeApiUrl(value);
  await SecureStore.setItemAsync(API_URL_KEY, normalized);
  return normalized;
}

export async function clearApiBaseUrl() {
  await SecureStore.deleteItemAsync(API_URL_KEY);
}

export function getBuildApiUrl() {
  return normalizeApiUrl(BUILD_API_URL);
}
