import * as SecureStore from 'expo-secure-store';
import { isOfflineHomologation } from '../api/runtime-config';

const SESSION_KEY = 'evolua_core_session_token';

export const sessionStore = {
  async get() {
    const token = await SecureStore.getItemAsync(SESSION_KEY);
    if (token && isOfflineHomologation() && !token.startsWith('offline:')) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
    return token;
  },
  save: (token: string) => SecureStore.setItemAsync(SESSION_KEY, token),
  clear: () => SecureStore.deleteItemAsync(SESSION_KEY),
};
