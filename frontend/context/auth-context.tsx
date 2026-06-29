"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
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
  onboardingCompleted: boolean;
  setOnboardingCompleted: (done: boolean) => void;
  // "Pendiente" = registro recién creado, esperando que el equipo Bayup le
  // configure y apruebe su tienda desde el módulo "Registros" del super
  // admin (ver app/registro-pendiente/page.tsx). "Activo" = operando normal.
  userStatus: string | null;
  reviewerNotes: string | null;
  login: (token: string, email: string, role: string, permissions?: any, plan?: any, isGlobal?: boolean, shopSlug?: string, name?: string, logo?: string, nit?: string, address?: string, onboardingCompleted?: boolean, status?: string) => void;
  updateUser: (data: { name?: string, slug?: string, logo?: string, nit?: string, address?: string }) => void;
  refreshToken: (newToken: string, newEmail?: string) => void;
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
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  // Nonce para descartar respuestas de syncProfile obsoletas. Cada llamada a
  // login() incrementa el nonce; cualquier syncProfile en vuelo con nonce viejo
  // ignora sus resultados (evita race condition loadStorage vs login).
  const profileEpochRef = useRef(0);

  // Función para cargar perfil desde el servidor y sincronizar
  const syncProfile = useCallback(async (authToken?: string | null) => {
    const epoch = profileEpochRef.current;
    try {
      const data = await userService.getMe(authToken);
      // Si login() se llamó mientras esta petición estaba en vuelo, descartamos
      // los datos obsoletos para evitar sobrescribir isGlobalStaff.
      if (profileEpochRef.current !== epoch) return;
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
            // isGlobalStaff solo en memoria React — no en localStorage (dato privilegiado).
            // Sí se restaura en sessionStorage para que logout() pueda redirigir a /bayup-family
            // incluso si el staff abrió el dashboard en una pestaña nueva (sessionStorage es por-pestaña).
            if (data.is_global_staff) sessionStorage.setItem('isSuperAdminSession', 'true');
        }
        if (data.onboarding_completed !== undefined) {
            setOnboardingCompleted(!!data.onboarding_completed);
            localStorage.setItem('onboardingCompleted', String(!!data.onboarding_completed));
        }
        if (data.status !== undefined) {
            setUserStatus(data.status);
            localStorage.setItem('userStatus', data.status || '');
        }
        if (data.reviewer_notes !== undefined) {
            setReviewerNotes(data.reviewer_notes);
            if (data.reviewer_notes) localStorage.setItem('reviewerNotes', data.reviewer_notes);
            else localStorage.removeItem('reviewerNotes');
        }
      }
      } catch (e: any) {
      // La cuenta fue eliminada/desactivada por un administrador: el backend
      // rechaza el token (401) porque el usuario ya no existe. A diferencia de
      // un fallo de red transitorio, esto debe cerrar la sesion de inmediato.
      if (e?.message === 'Could not validate credentials') {
        // Solo cerrar sesión si este es aún el token activo.
        // Si login() ya reemplazó el token (p.ej. tras Google OAuth), ignorar.
        const currentToken = localStorage.getItem('token');
        if (currentToken && currentToken !== authToken) return;
        sessionStorage.setItem('bayup_logout_reason', 'account_removed');
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
        setOnboardingCompleted(false);
        setUserStatus(null);
        setReviewerNotes(null);
        localStorage.clear();
        router.push('/login');
      }
      // Cualquier otro error (red, timeout) se ignora: mantenemos datos locales para estabilidad
      }
      }, [router]);

      useEffect(() => {
      const loadStorage = async () => {
      try {
        const storedEmail = localStorage.getItem('userEmail');

        if (storedEmail) {
          // Cargar datos no-sensibles inmediatamente (UI rápida)
          setUserEmail(storedEmail);
          setUserName(localStorage.getItem('userName'));
          setUserRole(localStorage.getItem('userRole'));
          setUserLogo(localStorage.getItem('userLogo'));
          setUserNit(localStorage.getItem('userNit'));
          setUserAddress(localStorage.getItem('userAddress'));
          setShopSlug(localStorage.getItem('shopSlug'));

          const storedPerms = localStorage.getItem('userPermissions');
          const storedPlan = localStorage.getItem('userPlan');
          const storedOnboarding = localStorage.getItem('onboardingCompleted');
          const storedStatus = localStorage.getItem('userStatus');
          const storedReviewerNotes = localStorage.getItem('reviewerNotes');

          if (storedPerms) setUserPermissions(JSON.parse(storedPerms));
          if (storedPlan) setUserPlan(JSON.parse(storedPlan));
          if (storedOnboarding) setOnboardingCompleted(storedOnboarding === 'true');
          if (storedStatus) setUserStatus(storedStatus);
          if (storedReviewerNotes) setReviewerNotes(storedReviewerNotes);

          // Restaurar sesión vía cookie httpOnly (token nunca viaja en localStorage)
          try {
            const isLocal = typeof window !== 'undefined' &&
              (window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('192.168.'));
            const apiBase = isLocal
              ? 'http://localhost:8000'
              : (process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co');
            const refreshRes = await fetch(`${apiBase}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
            });
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              setToken(data.access_token); // solo en memoria, nunca en localStorage
              // Se espera (await) antes de terminar de cargar. Sin esto,
              // `isLoading` pasaba a false antes de que llegara la respuesta
              // de /auth/me, y cualquier guard que dependa de `userStatus`
              // (ej. el de "Pendiente" en /onboarding) se evaluaba con el
              // valor viejo guardado en localStorage.
              await syncProfile(data.access_token);
            } else {
              // Cookie caducada: limpiar estado local
              localStorage.clear();
              setUserEmail(null); setUserName(null); setUserRole(null);
              setUserLogo(null); setUserNit(null); setUserAddress(null);
              setUserPermissions(null); setUserPlan(null); setShopSlug(null);
            }
          } catch {
            // Error de red transitorio: mantener datos de UI pero sin token activo
          }
        }
      } catch (e) {
        // Error de carga silencioso
      } finally {
        setIsLoading(false);
      }
      };    loadStorage();
  }, [syncProfile]);

  const login = useCallback((newToken: string, email: string, role: string, permissions: any = {}, plan: any = null, isGlobal: boolean = false, slug: string = "", name: string = "", logo: string = "", nit: string = "", address: string = "", onboardingDone: boolean = false, status: string = "Activo") => {
    // Invalidar cualquier syncProfile en vuelo (ej. loadStorage con sesión anterior)
    profileEpochRef.current += 1;
    setToken(newToken);
    setUserEmail(email);
    setUserName(name);
    setUserRole(role);
    setUserPermissions(permissions);
    setUserPlan(plan);
    const safeSlug = slug || '';
    setIsGlobalStaff(isGlobal);
    setShopSlug(safeSlug);
    setUserNit(nit);
    setUserAddress(address);
    setOnboardingCompleted(onboardingDone);
    setUserStatus(status);

    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    // isGlobalStaff se mantiene solo en memoria (React state) — no en localStorage.
    localStorage.setItem('shopSlug', safeSlug);
    localStorage.setItem('userNit', nit);
    localStorage.setItem('userAddress', address);
    localStorage.setItem('onboardingCompleted', onboardingDone ? 'true' : 'false');
    localStorage.setItem('userStatus', status);
    if (plan) localStorage.setItem('userPlan', JSON.stringify(plan));
    // sessionStorage no se borra con localStorage.clear() — bandera segura para logout
    if (isGlobal) sessionStorage.setItem('isSuperAdminSession', 'true');
    else sessionStorage.removeItem('isSuperAdminSession');

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

  // El token de sesion se firma con el email como identificador (sub); si el
  // usuario corrige su email (ej. desde onboarding), el token viejo deja de
  // resolver a ningun usuario y el backend emite uno nuevo en la misma
  // respuesta. Esto lo guarda sin forzar un logout/relogin completo.
  const refreshToken = useCallback((newToken: string, newEmail?: string) => {
    setToken(newToken); // solo en memoria
    if (newEmail) {
      setUserEmail(newEmail);
      localStorage.setItem('userEmail', newEmail);
    }
  }, []);

  const logout = useCallback(() => {
    const wasStaff = sessionStorage.getItem('isSuperAdminSession') === 'true';
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
    setOnboardingCompleted(false);
    setUserStatus(null);
    setReviewerNotes(null);
    sessionStorage.removeItem('isSuperAdminSession');
    localStorage.clear();
    // Limpiar cookies httpOnly en el servidor (fire-and-forget, no bloqueante)
    const apiBase = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:8000'
      : (process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co');
    fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    // Hard redirect: evita race condition con DashboardLayout useEffect (isAuthenticated → /login)
    window.location.href = wasStaff ? '/bayup-family' : '/login';
  }, []);

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
    onboardingCompleted,
    setOnboardingCompleted,
    userStatus,
    reviewerNotes,
    login,
    updateUser,
    refreshToken,
    logout,
    isAuthenticated,
    isLoading
  }), [token, userEmail, userName, userRole, userLogo, userNit, userAddress, userPermissions, userPlan, shopSlug, isGlobalStaff, onboardingCompleted, userStatus, reviewerNotes, login, updateUser, refreshToken, logout, isAuthenticated, isLoading]);

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
