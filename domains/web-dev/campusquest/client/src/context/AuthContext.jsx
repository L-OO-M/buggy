import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/index.js';
import { TOKEN_KEY } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      return null;
    }
    const { user: fresh } = await authApi.me();
    setUser(fresh);
    return fresh;
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    authApi
      .me()
      .then(({ user: fresh }) => {
        if (!active) return;
        setUser(fresh);
      })
      .catch(() => {
        if (!active) return;
        clearSession();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, clearSession]);

  useEffect(() => {
    const handler = () => clearSession();
    window.addEventListener('campusquest:auth-expired', handler);
    return () => window.removeEventListener('campusquest:auth-expired', handler);
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await authApi.register(payload);
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Stateless sessions: local cleanup is what matters.
    }
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback((next) => {
    setUser((previous) => (typeof next === 'function' ? next(previous) : next));
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, refreshUser, updateUser, isAuthenticated: Boolean(user) }),
    [token, user, loading, login, register, logout, refreshUser, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
