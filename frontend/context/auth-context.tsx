"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to load token and email from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('userEmail');
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUserEmail(storedEmail);
    }
  }, []);

  const login = useCallback((newToken: string, email: string) => {
    setToken(newToken);
    setUserEmail(email);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
  }, []);

  const isAuthenticated = !!token;

  const contextValue = {
    token,
    userEmail,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
