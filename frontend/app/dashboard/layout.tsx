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
  LayoutDashboard, Bot, FileText, Package, Truck, Globe, MessageSquare, 
  Users, ShieldCheck, TrendingUp, Gem, Tag, Settings, Users2, BarChart3, 
  Store, ChevronDown, Eye, LogOut, Activity, Target, Sparkles
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userEmail: authEmail, userRole: authRole, token, logout, userPlan, isGlobalStaff, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // --- ESTADOS DE UI (Mantenemos Hooks al inicio) ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [isBaytOpen, setIsBaytOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Mi Tienda Bayup');

  // --- PROTECCIÓN DE RUTA ---
  useEffect(() => {
      if (!isLoading && !isAuthenticated) {
          router.replace('/login');
      }
  }, [isAuthenticated, isLoading, router]);

  // --- CARGA DE PERFIL ---
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

  // --- PANTALLA DE CARGA (Arreglo tecnico de bucle) ---
  if (isLoading || !isAuthenticated) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
            <div className="text-3xl font-black italic tracking-tighter text-[#004d4d] animate-pulse mb-4">BAYUP</div>
            <div className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase">Iniciando Sistema...</div>
        </div>
      );
  }

  const rawPlanName = userPlan?.name || 'Básico';
  const allowedModules = getModulesByPlan(rawPlanName);

  const getLinkStyles = (path: string) => {
      const isActive = pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
      return isActive 
        ? (theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF] border-[#00F2FF]/20 shadow-[0_0_20px_rgba(0,242,255,0.1)]' : 'bg-white text-[#004d4d] shadow-lg border-white/50 scale-[1.02]')
        : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50');
  };

  const MenuItem = ({ href, label, id, isSub = false }: { href: string, label: any, id: string, isSub?: boolean }) => {
      const moduleKey = id.replace('m_', '').replace('s_', '');
      if (!allowedModules.includes(moduleKey) && !isGlobalStaff) return null;
      return (
        <Link href={href} className={`flex items-center gap-3 ${isSub ? 'ml-9 py-2 text-xs' : 'px-4 py-3.5 text-sm'} rounded-[1.2rem] font-bold transition-all duration-300 ${getLinkStyles(href)}`}>
            {label}
        </Link>
      );
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#001212]' : 'bg-[#F8FAFB]'}`}>
      {/* SIDEBAR PREMIUM RESTAURADO */}
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 85 : 280 }}
        className={`relative m-4 p-[1.5px] rounded-[2.8rem] overflow-hidden isolate flex-shrink-0 shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80 border border-white'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        <aside className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar relative z-10 p-4">
          <div className="p-4 mb-8 flex items-center justify-between border-b border-gray-100/50">
            {!isSidebarCollapsed && (
                <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Empresa</span>
                    <span className="text-base font-black italic text-[#004d4d] truncate max-w-[150px]">{companyName}</span>
                </div>
            )}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all active:scale-90">
                <ChevronDown className={isSidebarCollapsed ? '-rotate-90' : 'rotate-90'} size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-8">
            {/* SECCIÓN OPERACIÓN */}
            <div className="space-y-1">
                {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Operación Maestro</p>}
                <MenuItem href="/dashboard" label={<><LayoutDashboard size={18} /> Inicio</>} id="m_inicio" />
                <MenuItem href="/dashboard/products" label={<><Store size={18} /> Productos</>} id="m_productos" />
                <MenuItem href="/dashboard/orders" label={<><Package size={18} /> Pedidos Web</>} id="m_pedidos" />
                <MenuItem href="/dashboard/invoicing" label={<><FileText size={18} /> Facturación POS</>} id="m_facturacion" />
                <MenuItem href="/dashboard/shipping" label={<><Truck size={18} /> Envíos</>} id="m_envios" />
            </div>

            {/* SECCIÓN CRECIMIENTO (RESTAURADA) */}
            <div className="space-y-1">
                {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Crecimiento</p>}
                <MenuItem href="/dashboard/marketing" label={<><TrendingUp size={18} /> Marketing & ROI</>} id="m_marketing" />
                <MenuItem href="/dashboard/loyalty" label={<><Gem size={18} /> Club de Puntos</>} id="m_loyalty" />
                <MenuItem href="/dashboard/discounts" label={<><Tag size={18} /> Descuentos</>} id="m_discounts" />
            </div>

            {/* SECCIÓN INTELIGENCIA (RESTAURADA) */}
            <div className="space-y-1">
                {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Inteligencia</p>}
                <MenuItem href="/dashboard/ai-assistants" label={<><Bot size={18} /> Asistentes AI</>} id="m_ai_assistants" />
                <MenuItem href="/dashboard/automations" label={<><Sparkles size={18} /> Automatización</>} id="m_automations" />
            </div>

            {/* SECCIÓN GESTIÓN */}
            <div className="space-y-1">
                {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Configuración</p>}
                <MenuItem href="/dashboard/settings/general" label={<><Settings size={18} /> Mi Tienda</>} id="m_settings" />
                <MenuItem href="/dashboard/settings/users" label={<><Users2 size={18} /> Equipo Staff</>} id="m_staff" />
            </div>
          </nav>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-4 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-[1.5rem] transition-all">
                <LogOut size={18} /> {!isSidebarCollapsed && "Cerrar Sesión"}
            </button>
          </div>
        </aside>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader pathname={pathname} userEmail={authEmail} userRole={authRole} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} logout={logout} setIsUserSettingsOpen={setIsUserSettingsOpen} isBaytOpen={isBaytOpen} setIsBaytOpen={setIsBaytOpen} />
        <main className="flex-1 overflow-y-auto p-8 relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>
            <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
      {isGlobalStaff && <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />}
    </div>
  );
}
