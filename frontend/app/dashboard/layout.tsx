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
  LogOut, ChevronDown, Eye, ShieldCheck, Building2, Users, Wallet, Headset, 
  Layout, BarChart3, Code, Activity, Globe, Link as LinkIcon, Scale, AlertTriangle, 
  ChevronLeft, ChevronRight, Zap, Box, ShoppingBag, ClipboardList, Database, Share2, 
  UserCheck, Heart, Target, Sparkles, Bot, Receipt, BarChart, ShoppingCart, 
  MapPin, UserPlus, Coins, PieChart, Info as InfoIcon, CreditCard, Users2
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

  const isSuperAdminZone = pathname?.startsWith('/dashboard/super-admin');

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

  // LOGICA DE SEGURIDAD POR PLAN (ESTRICTA)
  const planName = userPlan?.name || "Básico";
  const isEnterprise = authEmail === 'dntonline13@gmail.com' || planName === "Empresa";
  const isPro = planName === "Pro";
  const showExtraModules = isEnterprise || isPro || isGlobalStaff || authRole === 'SUPER_ADMIN';

  const getLinkStyles = (path: string) => {
      const isActive = pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
      return isActive 
        ? (theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' : 'bg-[#f0f9f9] text-[#004d4d]')
        : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:bg-gray-50');
  };

  const MenuItem = ({ href, label, id, icon }: { href: string, label: string, id: string, icon: any }) => {
      if (isSuperAdminZone) {
          return (
            <Link href={href} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-2xl font-bold transition-all ${getLinkStyles(href)}`}>
                <div className="shrink-0">{icon}</div>
                {!isSidebarCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
      }

      const basicModules = ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"];
      const isApproved = basicModules.includes(id);
      
      if (!showExtraModules && !isApproved) return null;
      
      return (
        <Link href={href} title={isSidebarCollapsed ? label : ""} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-2xl font-bold transition-all ${getLinkStyles(href)}`}>
            <div className="shrink-0">{icon}</div>
            {!isSidebarCollapsed && <span className="truncate">{label}</span>}
        </Link>
      );
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden ${theme === 'dark' ? 'bg-[#001212]' : 'bg-[#FAFAFA]'}`}>
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 100 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`relative m-4 rounded-[2.8rem] overflow-hidden flex-shrink-0 shadow-2xl border transition-colors ${isSuperAdminZone ? 'bg-[#001A1A] border-white/5' : 'bg-white border-white'}`}
      >
        <aside className="w-full h-full flex flex-col p-4 no-scrollbar relative overflow-x-hidden">
          
          <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`absolute top-10 right-4 z-50 h-8 w-8 rounded-full border shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90 opacity-40 hover:opacity-100 ${
                  isSuperAdminZone ? 'bg-white/10 text-cyan border-white/10' : 'bg-[#004D4D]/10 text-[#004D4D] border-[#004D4D]/10'
              }`}
          >
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className="p-2 mb-6">
              <div className={`backdrop-blur-md p-4 rounded-[2.2rem] border border-gray-100 flex flex-col items-center text-center transition-all ${isSuperAdminZone ? 'bg-[#004D4D] text-white' : 'bg-gray-50/30'} ${isSidebarCollapsed ? 'aspect-square justify-center' : ''}`}>
                  {!isSidebarCollapsed ? (
                      <>
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSuperAdminZone ? 'text-cyan' : 'text-gray-400'}`}>
                            {isSuperAdminZone ? 'Torre de Control' : 'Empresa'}
                        </span>
                        <span className="text-base font-black italic truncate max-w-full mb-4">{isSuperAdminZone ? 'Global Master' : (authName || 'Bayup')}</span>
                        {isSuperAdminZone ? (
                            <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"><ChevronLeft size={12} /> Volver</button>
                        ) : (
                            <motion.button onClick={() => window.open(`${window.location.origin}/shop/${authSlug || 'mi-tienda'}`, '_blank')} whileHover="hover" whileTap={{ scale: 0.98 }} className="relative w-full h-12 flex items-center justify-center p-[2px] overflow-hidden rounded-[1.2rem] group">
                                <motion.div variants={{ hover: { rotate: [0, 360], scale: 1.5 } }} transition={{ rotate: { duration: 3, repeat: Infinity, ease: "linear" }, scale: { duration: 0.4 } }} className="absolute inset-0 bg-[conic-gradient(from_0deg,rgb(170,185,207)_0%,rgb(0,255,135)_35%,rgb(0,97,255)_92%,rgb(170,185,207)_100%)] opacity-80" />
                                <div className="relative w-full h-full bg-[#000F26] rounded-[1.1rem] flex items-center justify-center gap-2 px-4 transition-colors group-hover:bg-[#001529]">
                                    <Eye size={14} className="text-[#00FF87] group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Tienda</span>
                                </div>
                            </motion.button>
                        )}
                      </>
                  ) : (
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center shadow-inner">
                          {isSuperAdminZone ? <ShieldCheck size={20} className="text-white" /> : <Store size={20} className="text-[#004d4d]" />}
                      </div>
                  )}
              </div>
          </div>

          <nav className="flex-1 space-y-2 pb-10">
            {isSuperAdminZone ? (
                <>
                    {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-4">Gestión Global</p>}
                    <MenuItem href="/dashboard/super-admin" label="Dashboard" id="sa-dash" icon={<LayoutDashboard size={18} />} />
                    <MenuItem href="/dashboard/super-admin/empresas" label="Empresas" id="sa-stores" icon={<Building2 size={18} />} />
                    <MenuItem href="/dashboard/super-admin/users" label="Usuarios" id="sa-users" icon={<Users size={18} />} />
                    <MenuItem href="/dashboard/super-admin/tesoreria" label="Tesorería" id="sa-money" icon={<Wallet size={18} />} />
                    <MenuItem href="/dashboard/super-admin/soporte" label="Soporte" id="sa-support" icon={<Headset size={18} />} />
                    <MenuItem href="/dashboard/super-admin/web-templates" label="Plantillas Web" id="sa-tpl" icon={<Layout size={18} />} />
                    {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Infraestructura</p>}
                    <MenuItem href="/dashboard/super-admin/apis" label="APIs & Core" id="sa-api" icon={<Code size={18} />} />
                    <MenuItem href="/dashboard/super-admin/observability" label="Sistemas" id="sa-sys" icon={<Activity size={18} />} />
                    <MenuItem href="/dashboard/super-admin/reports" label="Reportes" id="sa-rep" icon={<BarChart3 size={18} />} />
                    <MenuItem href="/dashboard/super-admin/settings" label="Config Global" id="sa-conf" icon={<Settings size={18} />} />
                </>
            ) : (
                <>
                    {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-4">Operación Maestro</p>}
                    <MenuItem href="/dashboard" label="Inicio" id="inicio" icon={<LayoutDashboard size={18} />} />
                    <MenuItem href="/dashboard/invoicing" label="Facturación" id="facturacion" icon={<FileText size={18} />} />
                    <MenuItem href="/dashboard/orders" label="Pedidos Web" id="pedidos" icon={<Package size={18} />} />
                    <MenuItem href="/dashboard/products" label="Productos" id="productos" icon={<Store size={18} />} />
                    <MenuItem href="/dashboard/shipping" label="Envíos" id="envios" icon={<Truck size={18} />} />
                    <MenuItem href="/dashboard/chats" label="Mensajes Web" id="mensajes" icon={<MessageSquare size={18} />} />

                    {showExtraModules && (
                        <>
                            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Inventario & Ventas</p>}
                            <MenuItem href="/dashboard/inventory" label="Inventario" id="inventario" icon={<Box size={18} />} />
                            <MenuItem href="/dashboard/catalogs" label="Catálogo WA" id="catalogos" icon={<Share2 size={18} />} />
                            <MenuItem href="/dashboard/inventory/separados" label="Separados IA" id="separados" icon={<Bot size={18} />} />
                            <MenuItem href="/dashboard/products/cotizaciones" label="Cotizaciones" id="cotizaciones" icon={<ClipboardList size={18} />} />
                            <MenuItem href="/dashboard/products/bodegas" label="Bodega y Stock" id="bodegas" icon={<Database size={18} />} />
                            <MenuItem href="/dashboard/multiventa" label="Multiventa" id="multiventa" icon={<Zap size={18} />} />

                            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Marketing & Lealtad</p>}
                            <MenuItem href="/dashboard/customers" label="Clientes" id="clientes" icon={<UserCheck size={18} />} />
                            <MenuItem href="/dashboard/returns" label="Garantías" id="garantias" icon={<ShieldCheck size={18} />} />
                            <MenuItem href="/dashboard/web-analytics" label="Estadísticas" id="estadisticas" icon={<BarChart3 size={18} />} />
                            <MenuItem href="/dashboard/marketing" label="Marketing" id="marketing" icon={<Target size={18} />} />
                            <MenuItem href="/dashboard/loyalty" label="Club de Puntos" id="loyalty" icon={<Heart size={18} />} />
                            <MenuItem href="/dashboard/discounts" label="Descuentos" id="discounts" icon={<Sparkles size={18} />} />
                            <MenuItem href="/dashboard/automations" label="Automatizaciones" id="automations" icon={<Zap size={18} />} />

                            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Finanzas</p>}
                            <MenuItem href="/dashboard/ai-assistants" label="Asistente IA" id="asistente-ia" icon={<Bot size={18} />} />
                            <MenuItem href="/dashboard/payroll" label="Nómina" id="payroll" icon={<Receipt size={18} />} />
                            <MenuItem href="/dashboard/reports" label="Análisis General" id="reports-gen" icon={<PieChart size={18} />} />
                            <MenuItem href="/dashboard/inventory/purchase-orders" label="Compras" id="compras" icon={<ShoppingCart size={18} />} />
                            <MenuItem href="/dashboard/settings/branches" label="Sucursales" id="sucursales" icon={<MapPin size={18} />} />
                            <MenuItem href="/dashboard/reports/vendedores" label="Vendedores" id="vendedores" icon={<Users size={18} />} />
                            <MenuItem href="/dashboard/invoicing/cuentas-cobro" label="Cuentas" id="cuentas" icon={<FileText size={18} />} />
                            <MenuItem href="/dashboard/payroll/gastos" label="Gastos" id="gastos" icon={<Coins size={18} />} />
                        </>
                    )}

                    {(authRole === 'SUPER_ADMIN' || isGlobalStaff) && (
                      <div className="pt-4 border-t border-gray-100 mt-4">
                        <MenuItem href="/dashboard/super-admin" label="Panel Admin" id="super-admin" icon={<ShieldCheck size={18} className="text-cyan" />} />
                      </div>
                    )}

                    {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Configuración</p>}
                    <MenuItem href="/dashboard/settings/general" label="Config Tienda" id="settings" icon={<Settings size={18} />} />
                    {showExtraModules && (
                        <>
                            <MenuItem href="/dashboard/settings/info" label="Info General" id="info-gen" icon={<InfoIcon size={18} />} />
                            <MenuItem href="/dashboard/settings/plan" label="Mi Plan" id="mi-plan" icon={<CreditCard size={18} />} />
                            <MenuItem href="/dashboard/settings/users" label="Staff" id="staff" icon={<Users2 size={18} />} />
                        </>
                    )}
                </>
            )}
          </nav>

          <div className={`mt-auto pt-10 pb-4 flex flex-col items-center transition-all ${isSidebarCollapsed ? 'scale-75 origin-bottom' : ''}`}>
              <div className="flex flex-col items-center relative group">
                  <div className="text-3xl font-black italic tracking-tighter flex items-baseline relative z-10">
                      <span className={`${isSuperAdminZone ? 'text-white' : 'text-black'}`}>BAY</span>
                      {!isSidebarCollapsed && <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-[#00b2bd] to-[#00f2ff]">UP.</span>}
                  </div>
                  <div className="h-[2px] w-0 bg-[#00f2ff] group-hover:w-full transition-all duration-500 mt-1" />
              </div>
          </div>
        </aside>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <DashboardHeader pathname={pathname} userEmail={authEmail} userRole={authRole} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} logout={logout} setIsUserSettingsOpen={setIsUserSettingsOpen} isBaytOpen={isBaytOpen} setIsBaytOpen={setIsBaytOpen} />
        <main className={`flex-1 overflow-y-auto p-8 relative ${isSuperAdminZone ? 'bg-[#001212]' : ''}`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>
            <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
      {isGlobalStaff && !isSuperAdminZone && <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />}
    </div>
  );
}
