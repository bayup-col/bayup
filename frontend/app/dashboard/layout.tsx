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
  LayoutDashboard, FileText, Package, Store, Truck, MessageSquare, Settings, 
  LogOut, ChevronDown, Eye
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
  const [companyName, setCompanyName] = useState('Mi Tienda Bayup');
  const [shopSlug, setShopSlug] = useState('mi-tienda');

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
          if (data.shop_slug) setShopSlug(data.shop_slug);
        }
      } catch (e) {}
    };
    fetchProfile();
  }, [token]);

  if (isLoading || !isAuthenticated) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]">
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
      // Forzamos la visibilidad si el ID coincide con los aprobados del Plan Básico
      const isApproved = ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"].includes(id);
      if (!isApproved && !isGlobalStaff && !allowedModules.includes(id)) return null;
      
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
        className="relative m-4 rounded-[2.8rem] overflow-hidden flex-shrink-0 shadow-2xl bg-white border border-white"
      >
        <aside className="w-full h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
          {/* CABECERA PREMIUM RESTAURADA */}
          <div className="p-4 mb-6">
              <div className="backdrop-blur-md p-6 rounded-[2.2rem] border border-gray-100 bg-gray-50/30 flex flex-col items-center text-center">
                  {!isSidebarCollapsed && (
                      <>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Empresa</span>
                        <span className="text-base font-black italic text-[#004d4d] truncate max-w-full mb-4">{companyName}</span>
                        <button 
                            onClick={() => window.open(`${window.location.origin}/shop/${shopSlug}`, '_blank')}
                            className="group/btn relative w-full p-[1px] overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500"
                        >
                            <div className="relative bg-white py-2 px-4 rounded-[11px] flex items-center justify-center gap-2 transition-all group-hover/btn:bg-transparent">
                                <Eye size={14} className="text-[#004d4d] group-hover/btn:text-white" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-[#004d4d] group-hover/btn:text-white">Ver mi tienda</span>
                            </div>
                        </button>
                      </>
                  )}
                  {isSidebarCollapsed && (
                      <button onClick={() => setIsSidebarCollapsed(false)} className="p-2 hover:bg-gray-100 rounded-full">
                          <Store size={20} className="text-[#004d4d]" />
                      </button>
                  )}
              </div>
          </div>

          <nav className="flex-1 space-y-1">
            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-4">Operación Maestro</p>}
            
            {/* ORDEN EXACTO APROBADO */}
            <MenuItem href="/dashboard" label={<><LayoutDashboard size={18} /> Inicio</>} id="inicio" />
            <MenuItem href="/dashboard/invoicing" label={<><FileText size={18} /> Facturación POS</>} id="facturacion" />
            <MenuItem href="/dashboard/orders" label={<><Package size={18} /> Pedidos Web</>} id="pedidos" />
            <MenuItem href="/dashboard/products" label={<><Store size={18} /> Productos</>} id="productos" />
            <MenuItem href="/dashboard/shipping" label={<><Truck size={18} /> Envíos</>} id="envios" />
            <MenuItem href="/dashboard/chats" label={<><MessageSquare size={18} /> Mensajes Web</>} id="mensajes" />
            
            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Configuración</p>}
            <MenuItem href="/dashboard/settings/general" label={<><Settings size={18} /> Config Tienda</>} id="settings" />
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
            <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
      {isGlobalStaff && <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />}
    </div>
  );
}
