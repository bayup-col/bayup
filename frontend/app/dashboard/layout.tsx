"use client";

import { ReactNode, useEffect, useState, memo, Fragment, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useSuperAdminTheme } from '@/context/super-admin-theme-context';
import { DashboardHeader } from '@/components/dashboard/Header';
import UserSettingsModal from '@/components/dashboard/UserSettingsModal';
import { BaytAssistant } from '@/components/dashboard/BaytAssistant';
import { SupportWidget } from '@/components/dashboard/SupportWidget';
import {
  LayoutDashboard, FileText, Package, Store, Truck, Settings,
  LogOut, Eye, ShieldCheck, Building2, UserPlus, Users, Wallet, Headset,
  Layout, BarChart3, Code, Activity,
  ChevronLeft, ChevronRight,
  UserCheck, Coins, HelpCircle, Lock, Menu, X, CreditCard, Send, Sparkles, Globe,
  ArrowLeftCircle
} from 'lucide-react';

// Componente externo memoizado — evita re-mount en cada render del layout
const MenuItem = memo(({ href, label, icon, collapsed, linkClass }: {
  href: string; label: string; icon: React.ReactNode; collapsed: boolean; linkClass: string;
}) => (
  <Link href={href} title={collapsed ? label : ""} className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors duration-150 ${linkClass}`}>
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </Link>
));
MenuItem.displayName = 'MenuItem';

// Ítem de menú bloqueado por plan — visual only, no navegable
const LockedMenuItem = memo(({ label, icon, collapsed }: {
  label: string; icon: React.ReactNode; collapsed: boolean;
}) => (
  <div
    title={collapsed ? `${label} — Requiere plan Pro` : 'Requiere plan Pro'}
    className="relative flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-white/20 cursor-not-allowed select-none"
  >
    <span className="shrink-0 opacity-40">{icon}</span>
    {!collapsed && (
      <>
        <span className="truncate flex-1 opacity-40">{label}</span>
        <span className="shrink-0 flex items-center gap-1 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5" title="Requiere plan Pro">
          <Lock size={9} className="text-[#00f2ff]/50" />
          <span className="text-[7px] font-semibold text-[#00f2ff]/50 tracking-wide">Pro</span>
        </span>
      </>
    )}
    {collapsed && (
      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#001e1e] border border-white/10 flex items-center justify-center">
        <Lock size={7} className="text-[#00f2ff]/50" />
      </span>
    )}
  </div>
));
LockedMenuItem.displayName = 'LockedMenuItem';

// Badge de plan del usuario
const PlanBadge = ({ planName, userPlan }: { planName: string; userPlan: any }) => {
  const isTrial = userPlan?.is_trial;
  const trialDays = userPlan?.trial_days_remaining;

  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    'Básico':  { bg: 'bg-white/5',           text: 'text-white/40',       border: 'border-white/10',      label: 'Básico' },
    'Pro':     { bg: 'bg-blue-500/10',        text: 'text-blue-300',       border: 'border-blue-500/20',   label: 'Pro' },
    'Empresa': { bg: 'bg-teal-500/10',        text: 'text-teal-300',       border: 'border-teal-500/20',   label: 'Empresa' },
  };
  const style = config[planName] || config['Básico'];

  return (
    <Link href="/dashboard/settings/plan" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${style.bg} ${style.border} hover:brightness-125 transition-all duration-150 group`}>
      <span className={`text-[9px] font-black tracking-widest uppercase ${style.text}`}>{style.label}</span>
      {isTrial && trialDays != null && (
        <span className="text-[8px] font-semibold text-amber-400/80 ml-auto">{trialDays}d</span>
      )}
    </Link>
  );
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const {
    userEmail: authEmail,
    userRole: authRole,
    userName: authName,
    shopSlug: authSlug,
    token,
    logout,
    login,
    userPlan,
    isGlobalStaff,
    onboardingCompleted,
    userStatus,
    isAuthenticated,
    isLoading
  } = useAuth();
  const { theme } = useTheme();
  const { saTheme } = useSuperAdminTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isBaytOpen, setIsBaytOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [impersonatingAs, setImpersonatingAs] = useState<string | null>(null);

  // Cierra el drawer móvil al navegar
  useEffect(() => { setIsMobileSidebarOpen(false); }, [pathname]);

  // Monitor de modales abiertos (solo MutationObserver, sin polling)
  // modal-open   → oculta sidebar + muestra overlay oscuro (modales flotantes)
  // sidebar-hide → oculta sidebar sin overlay (POS, pantallas fullscreen inline)
  useEffect(() => {
    const checkModals = () => {
      const hasModal = document.body.classList.contains('modal-open') ||
                       document.body.style.overflow === 'hidden' ||
                       !!document.querySelector('[data-modal-active="true"]');
      const hideSidebar = document.body.classList.contains('sidebar-hide');
      setIsAnyModalOpen(hasModal);
      setIsSidebarHidden(hideSidebar || hasModal);
    };
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

  const isSuperAdminZone = pathname?.startsWith('/dashboard/super-admin');

  // Sincronización total con el contexto global
  useEffect(() => {
      if (!isLoading && !isAuthenticated) router.replace(isSuperAdminZone ? '/bayup-family' : '/login');
  }, [isAuthenticated, isLoading, router, isSuperAdminZone]);

  // Onboarding obligatorio: si el vendedor (no staff) aun no publico su tienda,
  // lo primero que ve es el asistente de plantilla + datos, no el panel.
  const isStaffAccount = isGlobalStaff || authRole?.toUpperCase() === 'SUPER_ADMIN';
  const needsOnboarding = !isStaffAccount && !onboardingCompleted && !isSuperAdminZone;
  // Registro recién creado: esperando que el equipo Bayup le configure y
  // apruebe su tienda (módulo "Registros" del super admin) — no puede ver
  // ninguna pantalla del dashboard ni el wizard de onboarding todavía.
  const isPendingApproval = !isStaffAccount && userStatus === 'Pendiente';
  useEffect(() => {
      if (!isLoading && isAuthenticated && isPendingApproval) router.replace('/registro-pendiente');
  }, [isLoading, isAuthenticated, isPendingApproval, router]);
  useEffect(() => {
      if (!isLoading && isAuthenticated && !isPendingApproval && needsOnboarding) router.replace('/onboarding');
  }, [isLoading, isAuthenticated, isPendingApproval, needsOnboarding, router]);

  // Bloquea el editor visual (Studio) para vendedores normales; la galería de plantillas sí está permitida.
  const isStudioRoute = pathname?.startsWith('/dashboard/pages') || (pathname?.startsWith('/dashboard/my-store') && pathname !== '/dashboard/my-store/templates');
  useEffect(() => {
      if (!isLoading && isAuthenticated && !isStaffAccount && isStudioRoute) router.replace('/dashboard');
  }, [isLoading, isAuthenticated, isStaffAccount, isStudioRoute, router]);

  // CRIT-006 / ALTA-005: Guard de rutas super-admin en cliente.
  // Un usuario autenticado pero sin is_global_staff no debe ver el panel global.
  useEffect(() => {
      if (!isLoading && isAuthenticated && isSuperAdminZone && !isStaffAccount) {
          router.replace('/dashboard');
      }
  }, [isLoading, isAuthenticated, isSuperAdminZone, isStaffAccount, router]);

  // Guard inverso: staff que llega a /dashboard (sin super-admin) se redirige a su zona.
  useEffect(() => {
      if (!isLoading && isAuthenticated && !isSuperAdminZone && isStaffAccount) {
          router.replace('/dashboard/super-admin');
      }
  }, [isLoading, isAuthenticated, isSuperAdminZone, isStaffAccount, router]);

  // Detectar sesión de impersonación activa
  useEffect(() => {
    setImpersonatingAs(sessionStorage.getItem('impersonating_as'));
  }, [pathname]);

  const handleReturnSession = useCallback(() => {
    const raw = sessionStorage.getItem('original_admin_session');
    if (!raw) return;
    try {
      const orig = JSON.parse(raw);
      login(orig.token, orig.email, orig.role, orig.permissions, orig.plan,
        true, orig.shopSlug, orig.name, orig.logo, orig.nit, orig.address,
        orig.onboardingCompleted, orig.status);
      sessionStorage.removeItem('impersonating_as');
      sessionStorage.removeItem('original_admin_session');
      router.push('/dashboard/super-admin/empresas');
    } catch {
      sessionStorage.removeItem('impersonating_as');
      sessionStorage.removeItem('original_admin_session');
      router.push('/login');
    }
  }, [login, router]);

  const isStaffMisrouted = isAuthenticated && !isSuperAdminZone && isStaffAccount;
  if (isLoading || !isAuthenticated || isPendingApproval || needsOnboarding || (!isStaffAccount && isStudioRoute) || isStaffMisrouted) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]">
            <div className="text-2xl font-bold tracking-[0.15em] text-[#004d4d] animate-pulse uppercase">BAYUP</div>
        </div>
      );
  }

  // LOGICA DE SEGURIDAD POR PLAN (ESTRICTA)
  const planName = userPlan?.name || "Básico";
  const isEnterprise = planName === "Empresa";
  const isPro = planName === "Pro";
  const showExtraModules = isEnterprise || isPro || isGlobalStaff || authRole === 'SUPER_ADMIN';

  const getLinkClass = (path: string) => {
      const isActive = pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
      return isActive
        ? 'bg-[#00F2FF]/10 text-[#00F2FF] font-semibold'
        : 'text-white/50 hover:text-white hover:bg-white/5 font-normal';
  };

  return (
    <div
      data-sa-theme={isSuperAdminZone ? saTheme : undefined}
      className={`h-screen w-full flex overflow-hidden ${isSuperAdminZone ? (saTheme === 'light' ? 'bg-[#F4F6F7]' : 'bg-[#001212]') : theme === 'dark' ? 'bg-[#001212]' : 'bg-[#F0F2F5]'}`}>

      {/* Botón hamburguesa — solo móvil */}
      {!isMobileSidebarOpen && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed top-5 left-5 z-[60] h-10 w-10 rounded-2xl bg-[#001e1e] border border-white/10 shadow-lg flex items-center justify-center text-white/70"
          title="Abrir menú"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Overlay — solo móvil, cierra el drawer al tocar fuera */}
      {isMobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/55 backdrop-blur-sm z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR — drawer en móvil, fijo en escritorio ── */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-30 transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
      <div
        style={{
          width: isSidebarCollapsed ? 64 : 256,
          transition: 'width 240ms ease, opacity 200ms ease, transform 200ms ease',
          opacity: isSidebarHidden ? 0 : 1,
          transform: isSidebarHidden ? 'translateX(-16px)' : 'translateX(0)',
          pointerEvents: isSidebarHidden ? 'none' : 'auto',
        }}
        className="relative h-full flex-shrink-0 bg-[#001e1e] flex flex-col shadow-xl"
      >
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white z-10"
          title="Cerrar menú"
        >
          <X size={14} />
        </button>
        {/* ── LOGO TOP ── */}
        <div className={`flex items-center h-16 px-5 shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="font-bold tracking-[0.18em] text-xl select-none">
                <span className="text-white">BAY</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b2bd] to-[#00f2ff]">UP.</span>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all duration-150"
                title="Ocultar menú"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-[#00f2ff]/10 flex items-center justify-center text-white/40 hover:text-[#00f2ff] transition-all duration-150"
              title="Expandir menú"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* ── PLANTILLA DE TIENDA ── oculta temporalmente */}

        {/* ── TIENDA PILL (vista previa) ── */}
        {!isSuperAdminZone && !isGlobalStaff && authSlug && (
          <div className="px-3 mb-2 shrink-0">
            {!isSidebarCollapsed ? (
              <button
                onClick={() => window.open(`${window.location.origin}/shop/${authSlug || 'mi-tienda'}`, '_blank')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors duration-150 group"
              >
                <div className="h-7 w-7 rounded-lg bg-[#004d4d] flex items-center justify-center shrink-0">
                  <Store size={13} className="text-[#00f2ff]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[8px] font-semibold text-white/30 uppercase tracking-widest">Mi Tienda</p>
                  <p className="text-[11px] font-semibold text-white/70 truncate">{authName || 'Empresario'}</p>
                </div>
                <Eye size={12} className="text-white/20 group-hover:text-[#00f2ff] transition-colors shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => window.open(`${window.location.origin}/shop/${authSlug || 'mi-tienda'}`, '_blank')}
                className="w-full h-9 rounded-xl bg-[#004d4d]/40 hover:bg-[#004d4d]/70 flex items-center justify-center transition-colors duration-150"
                title="Ver Tienda"
              >
                <Store size={15} className="text-[#00f2ff]" />
              </button>
            )}
          </div>
        )}

        {/* Separador */}
        <div className="mx-3 mb-2 h-px bg-white/5 shrink-0" />

        {/* ── NAV ── */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto no-scrollbar py-1">
          {!isSidebarCollapsed && (
            <p className="px-3 text-[8px] font-semibold text-white/20 uppercase tracking-[0.3em] mb-2 mt-1">
              {isSuperAdminZone ? 'Gestión Global' : 'Operación'}
            </p>
          )}

          {isSuperAdminZone ? (
            <>
              <MenuItem href="/dashboard/super-admin" label="Overview" icon={<LayoutDashboard size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin')} />
              {!isSidebarCollapsed && <p className="px-3 text-[8px] font-bold text-white/15 uppercase tracking-[0.3em] mt-4 mb-1.5">Gestión</p>}
              <MenuItem href="/dashboard/super-admin/registros" label="Registros" icon={<UserPlus size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/registros')} />
              <MenuItem href="/dashboard/super-admin/empresas" label="Empresas" icon={<Building2 size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/empresas')} />
              <MenuItem href="/dashboard/super-admin/tesoreria" label="Tesorería" icon={<Wallet size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/tesoreria')} />
              <MenuItem href="/dashboard/super-admin/liquidaciones" label="Liquidaciones" icon={<Send size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/liquidaciones')} />
              <MenuItem href="/dashboard/super-admin/novedades" label="Novedades" icon={<Sparkles size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/novedades')} />
              <MenuItem href="/dashboard/super-admin/users" label="Usuarios" icon={<Users size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/users')} />
              {!isSidebarCollapsed && <p className="px-3 text-[8px] font-bold text-white/15 uppercase tracking-[0.3em] mt-4 mb-1.5">Plataforma</p>}
              <MenuItem href="/dashboard/super-admin/web-templates" label="Plantillas Web" icon={<Layout size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/web-templates')} />
              <MenuItem href="/dashboard/super-admin/planes" label="Planes" icon={<CreditCard size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/planes')} />
              <MenuItem href="/dashboard/super-admin/soporte" label="Soporte" icon={<Headset size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/soporte')} />
              <MenuItem href="/dashboard/super-admin/reports" label="Reportes" icon={<BarChart3 size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/reports')} />
              {!isSidebarCollapsed && <p className="px-3 text-[8px] font-bold text-white/15 uppercase tracking-[0.3em] mt-4 mb-1.5">Sistema</p>}
              <MenuItem href="/dashboard/super-admin/settings" label="Configuración" icon={<Settings size={16} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/super-admin/settings')} />
            </>
          ) : (
            <>
              <MenuItem href="/dashboard" label="Inicio" icon={<LayoutDashboard size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard')} />
              <MenuItem href="/dashboard/invoicing" label="Facturación" icon={<FileText size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/invoicing')} />
              <MenuItem href="/dashboard/orders" label="Pedidos Web" icon={<Package size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/orders')} />
              <MenuItem href="/dashboard/products" label="Productos" icon={<Store size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/products')} />
              <MenuItem href="/dashboard/shipping" label="Envíos" icon={<Truck size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/shipping')} />
              <MenuItem href="/dashboard/customers" label="Clientes" icon={<UserCheck size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/customers')} />
              {/* <MenuItem href="/dashboard/paginas" label="Páginas Web" icon={<Globe size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/paginas')} /> */}
              <MenuItem href="/dashboard/web-analytics" label="Estadísticas" icon={<BarChart3 size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/web-analytics')} />
              <MenuItem href="/dashboard/reports/gastos" label="Gastos" icon={<Coins size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/reports/gastos')} />
              <MenuItem href="/dashboard/liquidacion" label="Liquidación" icon={<Wallet size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/liquidacion')} />
              <MenuItem href="/dashboard/settings/general" label="Config Tienda" icon={<Settings size={17} />} collapsed={isSidebarCollapsed} linkClass={getLinkClass('/dashboard/settings/general')} />
            </>
          )}
        </nav>

        {/* ── BOTTOM: Ayuda + Cerrar Sesión ── */}
        <div className="px-2 pb-4 pt-2 shrink-0 space-y-0.5">
          <div className="mx-2 mb-2 h-px bg-white/5" />
          {!isSuperAdminZone && <Link
            href="/dashboard/novedades"
            title={isSidebarCollapsed ? 'Novedades' : ''}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-colors duration-150 group"
          >
            <span className="shrink-0 relative">
              <Sparkles size={17} className="group-hover:text-[#00f2ff] transition-colors"/>
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"/>
            </span>
            {!isSidebarCollapsed && <span className="truncate font-semibold">Novedades</span>}
          </Link>}
          <button
            onClick={() => setIsSupportOpen(true)}
            title={isSidebarCollapsed ? 'Ayuda' : ''}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-colors duration-150"
          >
            <span className="shrink-0"><HelpCircle size={17} /></span>
            {!isSidebarCollapsed && <span className="truncate">Ayuda</span>}
          </button>
          <button
            onClick={logout}
            title={isSidebarCollapsed ? 'Cerrar Sesión' : ''}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-500/5 transition-colors duration-150"
          >
            <span className="shrink-0"><LogOut size={17} /></span>
            {!isSidebarCollapsed && <span className="truncate">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <DashboardHeader pathname={pathname} userEmail={authEmail} userRole={authRole} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} logout={logout} setIsUserSettingsOpen={setIsUserSettingsOpen} isBaytOpen={isBaytOpen} setIsBaytOpen={setIsBaytOpen} />
        <main className={`flex-1 overflow-y-auto overflow-x-hidden pt-20 sm:pt-24 px-3 sm:px-6 pb-6 relative ${isSuperAdminZone ? (saTheme === 'light' ? 'bg-[#F4F6F7]' : 'bg-[#001212]') : ''}`}>
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
      {/* Oculto temporalmente para el MVP — no es necesario aún, se retoma después. No borrar. */}
      {false && isGlobalStaff && !isSuperAdminZone && <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />}
      <SupportWidget isSupportOpen={isSupportOpen} setIsSupportOpen={setIsSupportOpen} />

      {/* Banner de impersonación — visible cuando el super admin está viendo como empresa */}
      {impersonatingAs && (
        <div className="fixed bottom-0 left-0 right-0 z-[9990] flex justify-center pb-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border border-[#00f2ff]/30"
            style={{ background: 'linear-gradient(135deg,#001a1a,#004d4d)', backdropFilter: 'blur(12px)' }}>
            <div className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse" />
            <span className="text-[11px] font-bold text-white/70">
              Viendo como: <span className="text-[#00f2ff]">{impersonatingAs}</span>
            </span>
            <button onClick={handleReturnSession}
              className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-xl bg-[#00f2ff]/15 hover:bg-[#00f2ff]/25 text-[#00f2ff] text-[10px] font-black uppercase tracking-widest transition-all">
              <ArrowLeftCircle size={12} /> Volver a mi sesión
            </button>
          </div>
        </div>
      )}

      {/* Overlay raíz — cubre TODO el viewport sin interferencias de overflow/transform */}
      <AnimatePresence>
        {isAnyModalOpen && (
          <motion.div
            key="root-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9980, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
