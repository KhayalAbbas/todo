const AUTH_KEY = 'todo_auth_credentials';

export interface AuthCredentials {
  username: string;
  password: string;
}

export const getAuthCredentials = (): AuthCredentials | null => {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get auth credentials:', error);
  }
  return null;
};

export const setAuthCredentials = (username: string, password: string): void => {
  try {
    const credentials: AuthCredentials = { username, password };
    localStorage.setItem(AUTH_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to set auth credentials:', error);
  }
};

export const clearAuthCredentials = (): void => {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error('Failed to clear auth credentials:', error);
  }
};

export const getAuthHeader = (): string | null => {
  const credentials = getAuthCredentials();
  if (!credentials) {
    return null;
  }
  const token = btoa(`${credentials.username}:${credentials.password}`);
  return `Basic ${token}`;
};

