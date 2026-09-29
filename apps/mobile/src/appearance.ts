import * as SecureStore from 'expo-secure-store';

export type AppearancePreference = 'system' | 'light' | 'dark';

const APPEARANCE_KEY = 'evolua_core_appearance_preference';
const VALID = new Set<AppearancePreference>(['system', 'light', 'dark']);

export function applyAppearancePreference(_preference: AppearancePreference) {
  // Build de recuperação Android: a troca nativa de esquema fica temporariamente desativada.
  // A preferência continua salva para ser reaplicada quando o tema dinâmico voltar de forma isolada.
}

export async function loadAppearancePreference(): Promise<AppearancePreference> {
  try {
    const saved = await SecureStore.getItemAsync(APPEARANCE_KEY);
    if (saved && VALID.has(saved as AppearancePreference)) {
      return saved as AppearancePreference;
    }
  } catch {
    // Falha no armazenamento de preferência visual nunca pode impedir o app de abrir.
  }
  return 'light';
}

export async function saveAppearancePreference(preference: AppearancePreference) {
  try {
    await SecureStore.setItemAsync(APPEARANCE_KEY, preference);
  } catch {
    // A preferência visual é opcional no build de recuperação.
  }
}
