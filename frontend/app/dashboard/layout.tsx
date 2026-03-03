"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { DashboardHeader } from '@/components/dashboard/Header';
import UserSettingsModal from '@/components/dashboard/UserSettingsModal';
import { BaytAssistant } from '@/components/dashboard/BaytAssistant';
import { InteractiveUP } from '@/components/landing/InteractiveUP';
import { motion, AnimatePresence } from 'framer-motion';
import { getModulesByPlan } from '@/lib/plan-configs';
import { 
  LayoutDashboard, FileText, Package, Store, MessageSquare, Truck, Users, 
  ShieldCheck, BarChart3, TrendingUp, Gem, Tag, Settings, Users2, ChevronDown, Eye, LogOut
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userEmail: authEmail, userRole: authRole, token, logout, userPlan, isGlobalStaff, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // 1. ESTADOS (Hooks siempre al principio y en el mismo orden)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [isBaytOpen, setIsBaytOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Mi Tienda Bayup');

  // 2. PROTECCIÓN DE RUTA
  useEffect(() => {
      if (!isLoading && !isAuthenticated) {
          router.replace('/login');
      }
  }, [isAuthenticated, isLoading, router]);

  // 3. CARGA DE DATOS
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

  // 4. LÓGICA DE RENDERIZADO
  if (isLoading || !isAuthenticated) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
            <div className="text-2xl font-black italic tracking-tighter text-[#004d4d] animate-pulse mb-4">BAYUP</div>
            <div className="text-xs font-bold text-gray-400 tracking-widest uppercase">Sincronizando...</div>
        </div>
      );
  }

  const rawPlanName = userPlan?.name || 'Básico';
  const allowedModules = getModulesByPlan(rawPlanName);

  const getLinkStyles = (path: string) => {
      const isActive = pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
      return isActive 
        ? (theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF] border border-[#00F2FF]/20' : 'bg-[#f0f9f9] text-[#004d4d] border border-[#004d4d]/10')
        : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50');
  };

  const MenuItem = ({ href, label, id, isSub = false }: { href: string, label: any, id: string, isSub?: boolean }) => {
      const moduleKey = id.replace('m_', '').replace('s_', '');
      if (!allowedModules.includes(moduleKey) && !isGlobalStaff) return null;
      
      return (
        <Link href={href} className={`flex items-center gap-3 ${isSub ? 'ml-9 py-2 text-xs' : 'px-4 py-3 text-sm'} rounded-2xl font-bold transition-all ${getLinkStyles(href)}`}>
            {label}
        </Link>
      );
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden ${theme === 'dark' ? 'bg-[#001212]' : 'bg-[#FAFAFA]'}`}>
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 80 : 260 }}
        className={`relative m-4 rounded-[2.5rem] overflow-hidden flex-shrink-0 shadow-2xl transition-all ${theme === 'dark' ? 'bg-[#001a1a] border border-white/5' : 'bg-white'}`}
      >
        <aside className="w-full h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
          <div className="p-4 mb-6 border-b border-gray-100 flex items-center justify-between">
            {!isSidebarCollapsed && <span className="text-lg font-black italic text-[#004d4d] truncate">{companyName}</span>}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ChevronDown className={isSidebarCollapsed ? '-rotate-90' : 'rotate-90'} size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-6">
            <div>
                {!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Operación</p>}
                <div className="space-y-1">
                    <MenuItem href="/dashboard" label={<><LayoutDashboard size={18} /> Inicio</>} id="m_inicio" />
                    <MenuItem href="/dashboard/products" label={<><Store size={18} /> Productos</>} id="m_productos" />
                    <MenuItem href="/dashboard/orders" label={<><Package size={18} /> Pedidos</>} id="m_pedidos" />
                    <MenuItem href="/dashboard/invoicing" label={<><FileText size={18} /> Facturación</>} id="m_facturacion" />
                </div>
            </div>

            <div>
                {!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Gestión</p>}
                <div className="space-y-1">
                    <MenuItem href="/dashboard/settings/general" label={<><Settings size={18} /> Perfil</>} id="m_settings" />
                    <MenuItem href="/dashboard/settings/users" label={<><Users size={18} /> Staff</>} id="m_staff" />
                </div>
            </div>
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all">
                <LogOut size={18} /> {!isSidebarCollapsed && "Cerrar Sesión"}
            </button>
          </div>
        </aside>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader pathname={pathname} userEmail={authEmail} userRole={authRole} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} logout={logout} setIsUserSettingsOpen={setIsUserSettingsOpen} isBaytOpen={isBaytOpen} setIsBaytOpen={setIsBaytOpen} />
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
            {children}
        </main>
      </div>

      <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
      {isGlobalStaff && <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />}
    </div>
  );
}
