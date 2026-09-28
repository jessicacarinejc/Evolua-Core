import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

export type AppearancePreference = 'system' | 'light' | 'dark';

const APPEARANCE_KEY = 'evolua_core_appearance_preference';
const VALID = new Set<AppearancePreference>(['system', 'light', 'dark']);

type SetColorScheme = (scheme: 'light' | 'dark' | null) => void;

export function applyAppearancePreference(preference: AppearancePreference) {
  const setColorScheme = Appearance.setColorScheme as SetColorScheme;
  setColorScheme(preference === 'system' ? null : preference);
}

export async function loadAppearancePreference(): Promise<AppearancePreference> {
  const saved = await SecureStore.getItemAsync(APPEARANCE_KEY);
  const preference = saved && VALID.has(saved as AppearancePreference)
    ? saved as AppearancePreference
    : 'system';
  applyAppearancePreference(preference);
  return preference;
}

export async function saveAppearancePreference(preference: AppearancePreference) {
  await SecureStore.setItemAsync(APPEARANCE_KEY, preference);
  applyAppearancePreference(preference);
}
