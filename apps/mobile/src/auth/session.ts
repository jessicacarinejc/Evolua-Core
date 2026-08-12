import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'evolua_core_session_token';

export const sessionStore = {
  get: () => SecureStore.getItemAsync(SESSION_KEY),
  save: (token: string) => SecureStore.setItemAsync(SESSION_KEY, token),
  clear: () => SecureStore.deleteItemAsync(SESSION_KEY),
};
