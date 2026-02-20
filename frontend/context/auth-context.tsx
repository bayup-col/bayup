"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  userRole: string | null;
  userPermissions: Record<string, boolean> | null;
  userPlan: any | null;
  shopSlug: string | null;
  isGlobalStaff: boolean;
  login: (token: string, email: string, role: string, permissions?: any, plan?: any, isGlobal?: boolean, shopSlug?: string) => void;
  clerkLogin: (clerkToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [userPlan, setUserPlan] = useState<any | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [isGlobalStaff, setIsGlobalStaff] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Attempt to load token and email from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole');
    const storedPerms = localStorage.getItem('userPermissions');
    const storedPlan = localStorage.getItem('userPlan');
    const storedSlug = localStorage.getItem('shopSlug');
    const storedIsGlobal = localStorage.getItem('isGlobalStaff');

    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUserEmail(storedEmail);
      setUserRole(storedRole);
      setShopSlug(storedSlug);
      if (storedPerms) setUserPermissions(JSON.parse(storedPerms));
      if (storedPlan) setUserPlan(JSON.parse(storedPlan));
      if (storedIsGlobal) setIsGlobalStaff(storedIsGlobal === 'true');
    }
  }, []);

  const login = useCallback((newToken: string, email: string, role: string, permissions: any = {}, plan: any = null, isGlobal: boolean = false, slug: string = "") => {
    setToken(newToken);
    setUserEmail(email);
    setUserRole(role);
    setUserPermissions(permissions);
    setUserPlan(plan);
    setIsGlobalStaff(isGlobal);
    setShopSlug(slug);

    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    localStorage.setItem('isGlobalStaff', isGlobal ? 'true' : 'false');
    localStorage.setItem('shopSlug', slug);
    if (plan) localStorage.setItem('userPlan', JSON.stringify(plan));
  }, []);

  const clerkLogin = useCallback(async (clerkToken: string) => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const targetUrl = `${apiUrl}/auth/clerk-login`;
        console.log("Intentando Clerk Login en:", targetUrl);
        
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clerk_token: clerkToken }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Clerk login failed on backend');
        }

        const data = await response.json();
        // Usar la función login existente para guardar todo
        login(
            data.access_token, 
            data.user.email, 
            data.user.role, 
            data.user.permissions || {}, 
            data.user.plan,
            false,
            data.user.shop_slug
        );
        router.push('/dashboard');
    } catch (error) {
        console.error("Clerk Login Sync Error:", error);
        throw error;
    }
  }, [login, router]);

  const logout = useCallback(() => {
    setToken(null);
    setUserEmail(null);
    setUserRole(null);
    setUserPermissions(null);
    setUserPlan(null);
    setShopSlug(null);
    setIsGlobalStaff(false);
    localStorage.clear();
    router.push('/login');
  }, [router]);

  const isAuthenticated = !!token;

  const contextValue = {
    token,
    userEmail,
    userRole,
    userPermissions,
    userPlan,
    shopSlug,
    isGlobalStaff,
    login,
    clerkLogin,
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
