"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/lib/api';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  userLogo: string | null;
  userNit: string | null;
  userAddress: string | null;
  userPermissions: Record<string, boolean> | null;
  userPlan: any | null;
  shopSlug: string | null;
  isGlobalStaff: boolean;
  login: (token: string, email: string, role: string, permissions?: any, plan?: any, isGlobal?: boolean, shopSlug?: string, name?: string, logo?: string, nit?: string, address?: string) => void;
  updateUser: (data: { name?: string, slug?: string, logo?: string, nit?: string, address?: string }) => void;
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
  const [userNit, setUserNit] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [userPlan, setUserPlan] = useState<any | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [isGlobalStaff, setIsGlobalStaff] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Función para cargar perfil desde el servidor y sincronizar
  const syncProfile = useCallback(async (authToken: string) => {
    try {
      const data = await userService.getMe(authToken);
      if (data) {
        if (data.logo_url) {
          setUserLogo(data.logo_url);
          localStorage.setItem('userLogo', data.logo_url);
        }
        if (data.full_name) {
          setUserName(data.full_name);
          localStorage.setItem('userName', data.full_name);
        }
        if (data.shop_slug) {
          setShopSlug(data.shop_slug);
          localStorage.setItem('shopSlug', data.shop_slug);
        }
        if (data.nit) {
          setUserNit(data.nit);
          localStorage.setItem('userNit', data.nit);
        }
        if (data.address) {
          setUserAddress(data.address);
          localStorage.setItem('userAddress', data.address);
        }
        // DEEP SYNC: Plan y Permisos
        if (data.plan) {
            setUserPlan(data.plan);
            localStorage.setItem('userPlan', JSON.stringify(data.plan));
        }
        if (data.permissions) {
            setUserPermissions(data.permissions);
            localStorage.setItem('userPermissions', JSON.stringify(data.permissions));
        }
        if (data.is_global_staff !== undefined) {
            setIsGlobalStaff(data.is_global_staff);
            localStorage.setItem('isGlobalStaff', String(data.is_global_staff));
        }
      }
      } catch (e) {
      // Sincronización fallida silenciosa: Mantenemos datos locales para estabilidad
      }
      }, []);

      useEffect(() => {
      const loadStorage = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedEmail = localStorage.getItem('userEmail');

        if (storedToken && storedEmail) {
          setToken(storedToken);
          setUserEmail(storedEmail);
          setUserName(localStorage.getItem('userName'));
          setUserRole(localStorage.getItem('userRole'));
          setUserLogo(localStorage.getItem('userLogo'));
          setUserNit(localStorage.getItem('userNit'));
          setUserAddress(localStorage.getItem('userAddress'));
          setShopSlug(localStorage.getItem('shopSlug'));

          const storedPerms = localStorage.getItem('userPermissions');
          const storedPlan = localStorage.getItem('userPlan');
          const storedIsGlobal = localStorage.getItem('isGlobalStaff');

          if (storedPerms) setUserPermissions(JSON.parse(storedPerms));
          if (storedPlan) setUserPlan(JSON.parse(storedPlan));
          if (storedIsGlobal) setIsGlobalStaff(storedIsGlobal === 'true');

          // Sincronización proactiva con el servidor (Fallo silencioso)
          syncProfile(storedToken);
        }
      } catch (e) {
        // Error de carga silencioso
      } finally {
        setIsLoading(false);
      }
      };    loadStorage();
  }, [syncProfile]);

  const login = useCallback((newToken: string, email: string, role: string, permissions: any = {}, plan: any = null, isGlobal: boolean = false, slug: string = "", name: string = "", logo: string = "", nit: string = "", address: string = "") => {
    setToken(newToken);
    setUserEmail(email);
    setUserName(name);
    setUserRole(role);
    setUserPermissions(permissions);
    setUserPlan(plan);
    setIsGlobalStaff(isGlobal);
    setShopSlug(slug);
    setUserNit(nit);
    setUserAddress(address);

    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    localStorage.setItem('isGlobalStaff', isGlobal ? 'true' : 'false');
    localStorage.setItem('shopSlug', slug);
    localStorage.setItem('userNit', nit);
    localStorage.setItem('userAddress', address);
    if (plan) localStorage.setItem('userPlan', JSON.stringify(plan));

    if (logo) {
      setUserLogo(logo);
      localStorage.setItem('userLogo', logo);
    }

    // Disparar sincronización inmediata post-login
    syncProfile(newToken);
  }, [syncProfile]);

  const updateUser = useCallback((data: { name?: string, slug?: string, logo?: string, nit?: string, address?: string }) => {
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
      if (data.logo) localStorage.setItem('userLogo', data.logo);
      else localStorage.removeItem('userLogo');
    }
    if (data.nit !== undefined) {
      setUserNit(data.nit || null);
      if (data.nit) localStorage.setItem('userNit', data.nit);
      else localStorage.removeItem('userNit');
    }
    if (data.address !== undefined) {
      setUserAddress(data.address || null);
      if (data.address) localStorage.setItem('userAddress', data.address);
      else localStorage.removeItem('userAddress');
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserEmail(null);
    setUserName(null);
    setUserRole(null);
    setUserLogo(null);
    setUserNit(null);
    setUserAddress(null);
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
    userNit,
    userAddress,
    userPermissions,
    userPlan,
    shopSlug,
    isGlobalStaff,
    login,
    updateUser,
    logout,
    isAuthenticated,
    isLoading
  }), [token, userEmail, userName, userRole, userLogo, userNit, userAddress, userPermissions, userPlan, shopSlug, isGlobalStaff, login, updateUser, logout, isAuthenticated, isLoading]);

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
