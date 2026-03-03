"use client";

import { ReactNode, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { DashboardHeader } from '@/components/dashboard/Header';
import UserSettingsModal from '@/components/dashboard/UserSettingsModal';
import { BaytAssistant } from '@/components/dashboard/BaytAssistant';
import { InteractiveUP } from '@/components/landing/InteractiveUP';
import { motion } from 'framer-motion';
import { getModulesByPlan } from '@/lib/plan-configs';
import { 
  LayoutDashboard, FileText, Package, Store, MessageSquare, Truck, Users, 
  ShieldCheck, BarChart3, TrendingUp, Gem, Tag, Settings, Users2, ChevronDown, Eye
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userEmail: authEmail, userRole: authRole, token, logout, userPlan, isGlobalStaff, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // DEFINICION DE TODOS LOS HOOKS (DEBEN IR AL PRINCIPIO)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [isBaytOpen, setIsBaytOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Mi Tienda Bayup');

  // Proteccion de ruta
  useEffect(() => {
      if (!isLoading && !isAuthenticated) {
          router.replace('/login');
      }
  }, [isAuthenticated, isLoading, router]);

  // Carga de datos iniciales
  useEffect(() => {
    if (!token) return;
    const fetchCompanyName = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://exciting-optimism-production-4624.up.railway.app';
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.full_name) setCompanyName(data.full_name);
        }
      } catch (e) { console.error("Error al cargar perfil", e); }
    };
    fetchCompanyName();
  }, [token]);

  // Normalizacion de modulos
  const rawPlanName = userPlan?.name || 'Básico';
  const planNameNormalized = rawPlanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const allowedModules = getModulesByPlan(rawPlanName);

  // VALIDACION DE RENDERIZADO (DESPUES DE LOS HOOKS)
  if (isLoading || !isAuthenticated) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
            <div className="text-2xl font-black italic tracking-tighter text-[#004d4d] animate-pulse mb-4">BAYUP</div>
            <div className="text-xs font-bold text-gray-400 tracking-widest uppercase">Verificando acceso...</div>
        </div>
      );
  }

  // ESTILOS Y HELPERS
  const getLinkStyles = (path: string) => {
      const isActive = pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
      return isActive 
        ? (theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' : 'bg-[#f0f9f9] text-[#004d4d]')
        : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900');
  };

  const MenuItem = ({ href, label, id }: { href: string, label: any, id: string }) => {
      const moduleKey = id.replace('m_', '');
      if (!allowedModules.includes(moduleKey) && !isGlobalStaff) return null;
      return (
        <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${getLinkStyles(href)}`}>
            {label}
        </Link>
      );
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden ${theme === 'dark' ? 'bg-[#001212]' : 'bg-[#FAFAFA]'}`}>
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        className="relative m-4 p-[2px] rounded-[2.5rem] overflow-hidden flex-shrink-0 shadow-2xl bg-white/90"
      >
        <aside className="w-full h-full flex flex-col p-4 overflow-y-auto">
          <div className="mb-8 text-center">
            <span className="text-xl font-black italic text-[#004d4d]">{companyName}</span>
          </div>
          <nav className="space-y-2">
            <MenuItem href="/dashboard" label={<><LayoutDashboard size={18} /> Inicio</>} id="m_inicio" />
            <MenuItem href="/dashboard/products" label={<><Store size={18} /> Productos</>} id="m_productos" />
            <MenuItem href="/dashboard/orders" label={<><Package size={18} /> Pedidos</>} id="m_pedidos" />
            <MenuItem href="/dashboard/settings/general" label={<><Settings size={18} /> Perfil</>} id="m_settings" />
          </nav>
          <button onClick={logout} className="mt-auto flex items-center gap-2 p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl">
            Cerrar Sesión
          </button>
        </aside>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <DashboardHeader pathname={pathname} userEmail={authEmail} userRole={authRole} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} logout={logout} setIsUserSettingsOpen={setIsUserSettingsOpen} isBaytOpen={isBaytOpen} setIsBaytOpen={setIsBaytOpen} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
