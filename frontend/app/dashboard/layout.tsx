"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { DashboardHeader } from '@/components/dashboard/Header';
import UserSettingsModal from '@/components/dashboard/UserSettingsModal';
import { BaytAssistant } from '@/components/dashboard/BaytAssistant';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Bot, FileText, Package, Truck, MessageSquare, Users, 
  TrendingUp, Gem, Tag, Settings, Users2, BarChart3, Store, ChevronDown, LogOut, Sparkles
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userEmail: authEmail, userRole: authRole, token, logout, userPlan, isGlobalStaff, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isBaytOpen, setIsBaytOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Cargando...');

  useEffect(() => {
      if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://exciting-optimism-production-4624.up.railway.app';
        const res = await fetch(`${apiUrl}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.full_name) setCompanyName(data.full_name);
        }
      } catch (e) {}
    };
    fetchProfile();
  }, [token]);

  if (isLoading || !isAuthenticated) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
            <div className="text-3xl font-black italic tracking-tighter text-[#004d4d] animate-pulse">BAYUP</div>
        </div>
      );
  }

  const allowedModules = userPlan?.modules || [];

  const getLinkStyles = (path: string) => {
      const isActive = pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
      return isActive 
        ? (theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' : 'bg-[#f0f9f9] text-[#004d4d]')
        : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:bg-gray-50');
  };

  const MenuItem = ({ href, label, id }: { href: string, label: any, id: string }) => {
      const moduleKey = id.replace('m_', '');
      if (!allowedModules.includes(moduleKey) && !isGlobalStaff) return null;
      return (
        <Link href={href} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-2xl font-bold transition-all ${getLinkStyles(href)}`}>
            {label}
        </Link>
      );
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden ${theme === 'dark' ? 'bg-[#001212]' : 'bg-[#FAFAFA]'}`}>
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 85 : 280 }}
        className="relative m-4 rounded-[2.5rem] overflow-hidden flex-shrink-0 shadow-2xl bg-white border border-white"
      >
        <aside className="w-full h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
          <div className="p-4 mb-8 flex items-center justify-between border-b border-gray-50">
            {!isSidebarCollapsed && (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Empresa</span>
                    <span className="text-base font-black italic text-[#004d4d] truncate max-w-[150px]">{companyName}</span>
                </div>
            )}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded-xl">
                <ChevronDown className={isSidebarCollapsed ? '-rotate-90' : 'rotate-90'} size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-8">
            <div className="space-y-1">
                {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Operación</p>}
                <MenuItem href="/dashboard" label={<><LayoutDashboard size={18} /> Inicio</>} id="m_inicio" />
                <MenuItem href="/dashboard/products" label={<><Store size={18} /> Productos</>} id="m_productos" />
                <MenuItem href="/dashboard/orders" label={<><Package size={18} /> Pedidos Web</>} id="m_pedidos" />
                <MenuItem href="/dashboard/invoicing" label={<><FileText size={18} /> Facturación POS</>} id="m_invoicing" />
                <MenuItem href="/dashboard/shipping" label={<><Truck size={18} /> Envíos</>} id="m_shipping" />
            </div>

            <div className="space-y-1">
                {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Crecimiento</p>}
                <MenuItem href="/dashboard/marketing" label={<><TrendingUp size={18} /> Marketing & ROI</>} id="m_marketing" />
                <MenuItem href="/dashboard/loyalty" label={<><Gem size={18} /> Club de Puntos</>} id="m_loyalty" />
                <MenuItem href="/dashboard/discounts" label={<><Tag size={18} /> Descuentos</>} id="m_discounts" />
            </div>

            <div className="space-y-1">
                {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Inteligencia</p>}
                <MenuItem href="/dashboard/ai-assistants" label={<><Bot size={18} /> Asistentes AI</>} id="m_ai_assistants" />
                <MenuItem href="/dashboard/automations" label={<><Sparkles size={18} /> Automatización</>} id="m_automations" />
            </div>

            <div className="space-y-1">
                {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Gestión</p>}
                <MenuItem href="/dashboard/settings/general" label={<><Settings size={18} /> Mi Tienda</>} id="m_settings" />
                <MenuItem href="/dashboard/settings/users" label={<><Users2 size={18} /> Equipo Staff</>} id="m_staff" />
            </div>
          </nav>

          <button onClick={logout} className="mt-8 flex items-center gap-3 px-4 py-4 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all">
            <LogOut size={18} /> {!isSidebarCollapsed && "Cerrar Sesión"}
          </button>
        </aside>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <DashboardHeader pathname={pathname} userEmail={authEmail} userRole={authRole} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} logout={logout} setIsUserSettingsOpen={setIsUserSettingsOpen} isBaytOpen={isBaytOpen} setIsBaytOpen={setIsBaytOpen} />
        <main className="flex-1 overflow-y-auto p-8 relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>
            {children}
        </main>
      </div>

      <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
      {isGlobalStaff && <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />}
    </div>
  );
}
