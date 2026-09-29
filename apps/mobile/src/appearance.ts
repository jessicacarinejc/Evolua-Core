import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

export type AppearancePreference = 'system' | 'light' | 'dark';

const APPEARANCE_KEY = 'evolua_core_appearance_preference';
const VALID = new Set<AppearancePreference>(['system', 'light', 'dark']);

type SetColorScheme = (scheme: 'light' | 'dark' | null) => void;

export function applyAppearancePreference(preference: AppearancePreference) {
  try {
    const setColorScheme = Appearance.setColorScheme as SetColorScheme;
    setColorScheme(preference === 'system' ? null : preference);
  } catch {
    // A preferência visual nunca pode impedir o app de iniciar.
  }
}

export async function loadAppearancePreference(): Promise<AppearancePreference> {
  let preference: AppearancePreference = 'system';
  try {
    const saved = await SecureStore.getItemAsync(APPEARANCE_KEY);
    if (saved && VALID.has(saved as AppearancePreference)) {
      preference = saved as AppearancePreference;
    }
  } catch {
    preference = 'system';
  }
  applyAppearancePreference(preference);
  return preference;
}

export async function saveAppearancePreference(preference: AppearancePreference) {
  try {
    await SecureStore.setItemAsync(APPEARANCE_KEY, preference);
  } finally {
    applyAppearancePreference(preference);
  }
}
