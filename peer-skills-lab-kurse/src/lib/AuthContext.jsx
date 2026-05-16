import React, { createContext, useState, useContext, useEffect } from 'react';
import { peerskillslab, clearToken } from '@/api/peerskillslabClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // Kept for API compatibility with consumers that read isLoadingPublicSettings
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
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
  };

  const loginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const logout = (shouldRedirect = true) => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    // Navigation to /login is handled via <Navigate> in App.jsx
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      loginSuccess,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
