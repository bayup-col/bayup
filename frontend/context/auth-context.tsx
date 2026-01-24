"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  userRole: string | null;
  login: (token: string, email: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Attempt to load token and email from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole');
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUserEmail(storedEmail);
      setUserRole(storedRole);
    }
  }, []);

  const login = useCallback((newToken: string, email: string, role: string) => {
    setToken(newToken);
    setUserEmail(email);
    setUserRole(role);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserEmail(null);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    router.push('/login');
  }, [router]);

  const isAuthenticated = !!token;

  const contextValue = {
    token,
    userEmail,
    userRole,
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
