import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { peerskillslab, clearToken } from '@/api/peerskillslabClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await peerskillslab.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      if (error.data?.type === 'user_not_registered') {
        setAuthError({ type: 'user_not_registered', message: 'Nutzer nicht registriert' });
      } else {
        // 401, Netzwerkfehler, kein Token — alles → Login
        setAuthError({ type: 'auth_required', message: 'Bitte einloggen' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const loginSuccess = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
  }, []);

  const logout = useCallback((shouldRedirect = true) => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  }, []);

  // Ohne Memoisierung erhielte jeder useAuth()-Konsument bei jedem Provider-
  // Render ein neues Objekt — u.a. würde der Inaktivitäts-Timer in App.jsx
  // (dep: [logout]) laufend neu aufgesetzt.
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoadingAuth,
    authError,
    logout,
    loginSuccess,
    checkAppState: checkUserAuth,
  }), [user, isAuthenticated, isLoadingAuth, authError, logout, loginSuccess, checkUserAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
