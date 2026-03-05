"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  userLogo: string | null;
  userPermissions: Record<string, boolean> | null;
  userPlan: any | null;
  shopSlug: string | null;
  isGlobalStaff: boolean;
  login: (token: string, email: string, role: string, permissions?: any, plan?: any, isGlobal?: boolean, shopSlug?: string, name?: string, logo?: string) => void;
  updateUser: (data: { name?: string, slug?: string, logo?: string }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userLogo, setUserLogo] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [userPlan, setUserPlan] = useState<any | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [isGlobalStaff, setIsGlobalStaff] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const loadStorage = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedEmail = localStorage.getItem('userEmail');
        
        if (storedToken && storedEmail) {
          setToken(storedToken);
          setUserEmail(storedEmail);
          setUserName(localStorage.getItem('userName'));
          setUserRole(localStorage.getItem('userRole'));
          setUserLogo(localStorage.getItem('userLogo'));
          setShopSlug(localStorage.getItem('shopSlug'));
          
          const storedPerms = localStorage.getItem('userPermissions');
          const storedPlan = localStorage.getItem('userPlan');
          const storedIsGlobal = localStorage.getItem('isGlobalStaff');

          if (storedPerms) setUserPermissions(JSON.parse(storedPerms));
          if (storedPlan) setUserPlan(JSON.parse(storedPlan));
          if (storedIsGlobal) setIsGlobalStaff(storedIsGlobal === 'true');
        }
      } catch (e) {
        console.error("Error loading auth storage", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorage();
  }, []);

  const login = useCallback((newToken: string, email: string, role: string, permissions: any = {}, plan: any = null, isGlobal: boolean = false, slug: string = "", name: string = "", logo: string = "") => {
    setToken(newToken);
    setUserEmail(email);
    setUserName(name);
    setUserRole(role);
    setUserLogo(logo);
    setUserPermissions(permissions);
    setUserPlan(plan);
    setIsGlobalStaff(isGlobal);
    setShopSlug(slug);

    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userLogo', logo);
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    localStorage.setItem('isGlobalStaff', isGlobal ? 'true' : 'false');
    localStorage.setItem('shopSlug', slug);
    if (plan) localStorage.setItem('userPlan', JSON.stringify(plan));
  }, []);

  const updateUser = useCallback((data: { name?: string, slug?: string, logo?: string }) => {
    if (data.name) {
      setUserName(data.name);
      localStorage.setItem('userName', data.name);
    }
    if (data.slug) {
      setShopSlug(data.slug);
      localStorage.setItem('shopSlug', data.slug);
    }
    if (data.logo !== undefined) {
      setUserLogo(data.logo);
      if (data.logo) {
          localStorage.setItem('userLogo', data.logo);
      } else {
          localStorage.removeItem('userLogo');
      }
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserEmail(null);
    setUserName(null);
    setUserRole(null);
    setUserLogo(null);
    setUserPermissions(null);
    setUserPlan(null);
    setShopSlug(null);
    setIsGlobalStaff(false);
    localStorage.clear();
    router.push('/login');
  }, [router]);

  const isAuthenticated = !!token;

  const contextValue = useMemo(() => ({
    token,
    userEmail,
    userName,
    userRole,
    userLogo,
    userPermissions,
    userPlan,
    shopSlug,
    isGlobalStaff,
    login,
    updateUser,
    logout,
    isAuthenticated,
    isLoading
  }), [token, userEmail, userName, userRole, userLogo, userPermissions, userPlan, shopSlug, isGlobalStaff, login, updateUser, logout, isAuthenticated, isLoading]);

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
