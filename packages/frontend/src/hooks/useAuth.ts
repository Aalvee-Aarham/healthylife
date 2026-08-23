import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { api, setAuthToken, getAuthToken } from '../services/api';

export type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: UserProfile }
  | { status: 'error'; message: string }
  | { status: 'unauthenticated' };

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'idle' });

  // On mount: try to restore session from stored token
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthState({ status: 'unauthenticated' });
      return;
    }

    setAuthState({ status: 'loading' });
    api.me()
      .then((user) => setAuthState({ status: 'authenticated', user }))
      .catch(() => {
        setAuthToken(null);
        setAuthState({ status: 'unauthenticated' });
      });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserProfile> => {
    setAuthState({ status: 'loading' });
    try {
      const { user, token } = await api.login(email, password);
      setAuthToken(token);
      setAuthState({ status: 'authenticated', user });
      return user;
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Check your credentials.';
      setAuthState({ status: 'error', message: msg });
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // swallow — still clear locally
    }
    setAuthToken(null);
    setAuthState({ status: 'unauthenticated' });
  }, []);

  const isLoggedIn = authState.status === 'authenticated';
  const user = authState.status === 'authenticated' ? authState.user : null;
  const isLoading = authState.status === 'loading' || authState.status === 'idle';

  return { authState, isLoggedIn, user, isLoading, login, logout };
}
