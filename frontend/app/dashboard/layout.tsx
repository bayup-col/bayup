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
  LogOut, ChevronDown, Eye, ShieldCheck
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { 
    userEmail: authEmail, 
    userRole: authRole, 
    userName: authName,
    shopSlug: authSlug,
    token, 
    logout, 
    userPlan, 
    isGlobalStaff, 
    isAuthenticated, 
    isLoading 
  } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isBaytOpen, setIsBaytOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

  // Sincronización total con el contexto global
  useEffect(() => {
      if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

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
                        <span className="text-base font-black italic text-[#004d4d] truncate max-w-full mb-4">{authName || 'Bayup'}</span>

                        {/* BOTÓN GRADIENT FRAMER PREMIUM */}
                        <motion.button 
                            onClick={() => window.open(`${window.location.origin}/shop/${authSlug || 'mi-tienda'}`, '_blank')}
                            whileHover="hover"
                            whileTap={{ scale: 0.98 }}
                            className="relative w-full h-12 flex items-center justify-center p-[2px] overflow-hidden rounded-[1.2rem] group"
                        >
                            {/* GRADIENTE ANIMADO DE FONDO (BORDE) */}
                            <motion.div 
                                variants={{
                                    hover: { 
                                        rotate: [0, 360],
                                        scale: 1.5
                                    }
                                }}
                                transition={{ 
                                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 0.4 }
                                }}
                                className="absolute inset-0 bg-[conic-gradient(from_0deg,rgb(170,185,207)_0%,rgb(0,255,135)_35%,rgb(0,97,255)_92%,rgb(170,185,207)_100%)] opacity-80"
                            />

                            {/* CONTENEDOR INTERIOR */}
                            <div className="relative w-full h-full bg-[#000F26] rounded-[1.1rem] flex items-center justify-center gap-2 px-4 transition-colors group-hover:bg-[#001529]">
                                <Eye size={14} className="text-[#00FF87] group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                    Ver mi tienda
                                </span>
                            </div>

                            {/* EFECTO DE RESPLANDOR AL HOVER */}
                            <motion.div 
                                variants={{
                                    hover: { opacity: 1, scale: 1.1 }
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-[#00FF87]/20 to-[#0061FF]/20 blur-xl opacity-0 transition-opacity pointer-events-none"
                            />
                        </motion.button>
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
            <MenuItem href="/dashboard/invoicing" label={<><FileText size={18} /> Facturación</>} id="facturacion" />
            <MenuItem href="/dashboard/orders" label={<><Package size={18} /> Pedidos Web</>} id="pedidos" />
            <MenuItem href="/dashboard/products" label={<><Store size={18} /> Productos</>} id="productos" />
            <MenuItem href="/dashboard/envios" label={<><Truck size={18} /> Envíos</>} id="envios" />
            <MenuItem href="/dashboard/chats" label={<><MessageSquare size={18} /> Mensajes Web</>} id="mensajes" />

            {(authRole === 'SUPER_ADMIN' || isGlobalStaff) && (
              <div className="pt-4 border-t border-gray-100 mt-4">
                <MenuItem href="/dashboard/super-admin" label={<><ShieldCheck size={18} className="text-cyan" /> Panel Admin</>} id="super-admin" />
              </div>
            )}

            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Configuración</p>}
            <MenuItem href="/dashboard/settings/general" label={<><Settings size={18} /> Config Tienda</>} id="settings" />
          </nav>

          {/* LOGOTIPO BAYUP OFICIAL CON FANTASMA SALTADOR DINÁMICO */}
          <div className="mt-auto pt-10 pb-4 flex flex-col items-center">
              <motion.div 
                whileHover="hover"
                className="relative group cursor-pointer"
              >
                  {/* EL FANTASMA QUE BRINCA SOBRE EL LOGO */}
                  <motion.div 
                    variants={{
                        hover: {
                            x: [-40, 0, 40],
                            y: [0, -35, 0],
                            opacity: [0, 1, 0],
                            scale: [0.8, 1.2, 0.8],
                            rotate: [0, 45, 90]
                        }
                    }}
                    transition={{ 
                        duration: 1.2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 m-auto w-8 h-8 bg-[#00f2ff]/20 blur-md rounded-lg -z-10 pointer-events-none"
                  />

                  {/* BLOQUE DE COLOR DEL FANTASMA (EL QUE SE VE EN LA IMAGEN) */}
                  <motion.div 
                    variants={{
                        hover: {
                            y: [0, -45, 0],
                            x: [-10, 0, 10],
                            scaleY: [1, 0.8, 1.2, 1],
                            opacity: [0, 1, 1, 0]
                        }
                    }}
                    transition={{ 
                        duration: 1, 
                        repeat: Infinity,
                        ease: "anticipate"
                    }}
                    className="absolute right-4 top-0 w-10 h-10 bg-indigo-500/30 rounded-lg -z-10 pointer-events-none"
                  />
                  
                  <div className="flex flex-col items-center relative">
                      <div className="text-3xl font-black italic tracking-tighter flex items-baseline relative z-10">
                          <span className="text-black">BAY</span>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-[#00b2bd] to-[#00f2ff]">UP.</span>
                      </div>
                      <div className="h-[2px] w-0 bg-[#00f2ff] group-hover:w-full transition-all duration-500 mt-1" />
                  </div>
              </motion.div>
              <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] mt-4">Core Engine v4.2</p>
          </div>
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
