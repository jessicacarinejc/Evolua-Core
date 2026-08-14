import * as SecureStore from 'expo-secure-store';

const API_URL_KEY = 'evolua_core_api_base_url';
const BUILD_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/v1';

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
