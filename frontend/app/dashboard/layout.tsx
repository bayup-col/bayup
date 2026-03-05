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
  ChevronLeft, Zap, Box, ShoppingBag, ClipboardList, Database, Share2, 
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

  const allowedModules = userPlan?.modules || [];
  const planName = userPlan?.name || "Básico";

  const getLinkStyles = (path: string) => {
      const isActive = pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
      return isActive 
        ? (theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' : 'bg-[#f0f9f9] text-[#004d4d]')
        : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:bg-gray-50');
  };

  const MenuItem = ({ href, label, id }: { href: string, label: any, id: string }) => {
      if (isSuperAdminZone) {
          return (
            <Link href={href} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-2xl font-bold transition-all ${getLinkStyles(href)}`}>
                {label}
            </Link>
          );
      }

      // Lógica de visibilidad por Plan
      const basicModules = ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"];
      const isApproved = basicModules.includes(id);
      
      // Si es Básico, solo ve los aprobados. Si es Pro/Empresa/GlobalStaff, ve lo que el plan permita o todo.
      if (planName === "Básico" && !isApproved && !isGlobalStaff) return null;
      if (planName !== "Básico" && !isApproved && !allowedModules.includes(id) && !isGlobalStaff && id !== "super-admin") {
          // Si el módulo no está en el JSON de módulos del plan, no se muestra (a menos que sea staff global)
          // Pero para el Plan Empresa habilitaremos visualmente todos los que el usuario pidió
          const enterpriseModules = [
            "inventario", "catalogos", "separados", "cotizaciones", "bodegas", "multiventa",
            "clientes", "garantias", "estadisticas", "marketing", "loyalty", "discounts", "automations",
            "asistente-ia", "payroll", "reports-gen", "compras", "sucursales", "vendedores", "cuentas", "gastos",
            "info-gen", "mi-plan", "staff"
          ];
          if (planName === "Empresa" && enterpriseModules.includes(id)) {
              // Permitir
          } else if (!isGlobalStaff) {
              return null;
          }
      }
      
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
        className={`relative m-4 rounded-[2.8rem] overflow-hidden flex-shrink-0 shadow-2xl border ${isSuperAdminZone ? 'bg-[#001A1A] border-white/5' : 'bg-white border-white'}`}
      >
        <aside className="w-full h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
          <div className="p-4 mb-6">
              <div className={`backdrop-blur-md p-6 rounded-[2.2rem] border border-gray-100 flex flex-col items-center text-center ${isSuperAdminZone ? 'bg-[#004D4D] text-white' : 'bg-gray-50/30'}`}>
                  {!isSidebarCollapsed && (
                      <>
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSuperAdminZone ? 'text-cyan' : 'text-gray-400'}`}>
                            {isSuperAdminZone ? 'Torre de Control' : 'Empresa'}
                        </span>
                        <span className={`text-base font-black italic truncate max-w-full mb-4 ${isSuperAdminZone ? 'text-white' : 'text-[#004d4d]'}`}>
                            {isSuperAdminZone ? 'Global Master' : (authName || 'Bayup')}
                        </span>

                        {isSuperAdminZone ? (
                            <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"><ChevronLeft size={12} /> Volver a mi tienda</button>
                        ) : (
                            <motion.button onClick={() => window.open(`${window.location.origin}/shop/${authSlug || 'mi-tienda'}`, '_blank')} whileHover="hover" whileTap={{ scale: 0.98 }} className="relative w-full h-12 flex items-center justify-center p-[2px] overflow-hidden rounded-[1.2rem] group">
                                <motion.div variants={{ hover: { rotate: [0, 360], scale: 1.5 } }} transition={{ rotate: { duration: 3, repeat: Infinity, ease: "linear" }, scale: { duration: 0.4 } }} className="absolute inset-0 bg-[conic-gradient(from_0deg,rgb(170,185,207)_0%,rgb(0,255,135)_35%,rgb(0,97,255)_92%,rgb(170,185,207)_100%)] opacity-80" />
                                <div className="relative w-full h-full bg-[#000F26] rounded-[1.1rem] flex items-center justify-center gap-2 px-4 transition-colors group-hover:bg-[#001529]">
                                    <Eye size={14} className="text-[#00FF87] group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Ver mi tienda</span>
                                </div>
                            </motion.button>
                        )}
                      </>
                  )}
                  {isSidebarCollapsed && (
                      <button onClick={() => setIsSidebarCollapsed(false)} className="p-2 hover:bg-gray-100 rounded-full">
                          {isSuperAdminZone ? <ShieldCheck size={20} className="text-white" /> : <Store size={20} className="text-[#004d4d]" />}
                      </button>
                  )}
              </div>
          </div>

          <nav className="flex-1 space-y-1 pb-10">
            {isSuperAdminZone ? (
                <>
                    {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-4">Gestión Global</p>}
                    <MenuItem href="/dashboard/super-admin" label={<><LayoutDashboard size={18} /> Dashboard</>} id="sa-dash" />
                    <MenuItem href="/dashboard/super-admin/empresas" label={<><Building2 size={18} /> Empresas</>} id="sa-stores" />
                    <MenuItem href="/dashboard/super-admin/users" label={<><Users size={18} /> Usuarios</>} id="sa-users" />
                    <MenuItem href="/dashboard/super-admin/tesoreria" label={<><Wallet size={18} /> Tesorería</>} id="sa-money" />
                    <MenuItem href="/dashboard/super-admin/soporte" label={<><Headset size={18} /> Soporte</>} id="sa-support" />
                    <MenuItem href="/dashboard/super-admin/web-templates" label={<><Layout size={18} /> Plantillas Web</>} id="sa-tpl" />
                    {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Infraestructura</p>}
                    <MenuItem href="/dashboard/super-admin/apis" label={<><Code size={18} /> APIs & Core</>} id="sa-api" />
                    <MenuItem href="/dashboard/super-admin/observability" label={<><Activity size={18} /> Sistemas</>} id="sa-sys" />
                    <MenuItem href="/dashboard/super-admin/reports" label={<><BarChart3 size={18} /> Reportes</>} id="sa-rep" />
                    <MenuItem href="/dashboard/super-admin/settings" label={<><Settings size={18} /> Config Global</>} id="sa-conf" />
                </>
            ) : (
                <>
                    {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-4">Operación Maestro</p>}
                    <MenuItem href="/dashboard" label={<><LayoutDashboard size={18} /> Inicio</>} id="inicio" />
                    <MenuItem href="/dashboard/invoicing" label={<><FileText size={18} /> Facturación</>} id="facturacion" />
                    <MenuItem href="/dashboard/orders" label={<><Package size={18} /> Pedidos Web</>} id="pedidos" />
                    <MenuItem href="/dashboard/products" label={<><Store size={18} /> Productos</>} id="productos" />
                    <MenuItem href="/dashboard/shipping" label={<><Truck size={18} /> Envíos</>} id="envios" />
                    <MenuItem href="/dashboard/chats" label={<><MessageSquare size={18} /> Mensajes Web</>} id="mensajes" />

                    {planName !== "Básico" && (
                        <>
                            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Inventario & Ventas</p>}
                            <MenuItem href="/dashboard/inventory" label={<><Box size={18} /> Inventario</>} id="inventario" />
                            <MenuItem href="/dashboard/catalogs" label={<><Share2 size={18} /> Catálogo WhatsApp</>} id="catalogos" />
                            <MenuItem href="/dashboard/inventory/separados" label={<><Bot size={18} /> Separados IA</>} id="separados" />
                            <MenuItem href="/dashboard/products/cotizaciones" label={<><ClipboardList size={18} /> Cotizaciones</>} id="cotizaciones" />
                            <MenuItem href="/dashboard/products/bodegas" label={<><Database size={18} /> Bodega y Stock</>} id="bodegas" />
                            <MenuItem href="/dashboard/multiventa" label={<><Zap size={18} /> Multiventa</>} id="multiventa" />

                            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Marketing & Lealtad</p>}
                            <MenuItem href="/dashboard/customers" label={<><UserCheck size={18} /> Clientes</>} id="clientes" />
                            <MenuItem href="/dashboard/returns" label={<><ShieldCheck size={18} /> Garantías</>} id="garantias" />
                            <MenuItem href="/dashboard/web-analytics" label={<><BarChart3 size={18} /> Estadísticas Web</>} id="estadisticas" />
                            <MenuItem href="/dashboard/marketing" label={<><Target size={18} /> Marketing</>} id="marketing" />
                            <MenuItem href="/dashboard/loyalty" label={<><Heart size={18} /> Club de Puntos</>} id="loyalty" />
                            <MenuItem href="/dashboard/discounts" label={<><Sparkles size={18} /> Descuentos</>} id="discounts" />
                            <MenuItem href="/dashboard/automations" label={<><Zap size={18} /> Automatizaciones</>} id="automations" />

                            {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Administración & Finanzas</p>}
                            <MenuItem href="/dashboard/ai-assistants" label={<><Bot size={18} /> Asistente IA</>} id="asistente-ia" />
                            <MenuItem href="/dashboard/payroll" label={<><Receipt size={18} /> Nómina</>} id="payroll" />
                            <MenuItem href="/dashboard/reports" label={<><PieChart size={18} /> Análisis General</>} id="reports-gen" />
                            <MenuItem href="/dashboard/inventory/purchase-orders" label={<><ShoppingCart size={18} /> Órdenes Compra</>} id="compras" />
                            <MenuItem href="/dashboard/settings/branches" label={<><MapPin size={18} /> Sucursales</>} id="sucursales" />
                            <MenuItem href="/dashboard/reports/vendedores" label={<><Users size={18} /> Vendedores</>} id="vendedores" />
                            <MenuItem href="/dashboard/invoicing/cuentas-cobro" label={<><FileText size={18} /> Cuentas de Cobro</>} id="cuentas" />
                            <MenuItem href="/dashboard/payroll/gastos" label={<><Coins size={18} /> Control Gastos</>} id="gastos" />
                        </>
                    )}

                    {(authRole === 'SUPER_ADMIN' || isGlobalStaff) && (
                      <div className="pt-4 border-t border-gray-100 mt-4">
                        <MenuItem href="/dashboard/super-admin" label={<><ShieldCheck size={18} className="text-cyan" /> Panel Admin</>} id="super-admin" />
                      </div>
                    )}

                    {!isSidebarCollapsed && <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-8">Configuración</p>}
                    <MenuItem href="/dashboard/settings/general" label={<><Settings size={18} /> Config Tienda</>} id="settings" />
                    {planName !== "Básico" && (
                        <>
                            <MenuItem href="/dashboard/settings/info" label={<><InfoIcon size={18} /> Info General</>} id="info-gen" />
                            <MenuItem href="/dashboard/settings/plan" label={<><CreditCard size={18} /> Mi Plan</>} id="mi-plan" />
                            <MenuItem href="/dashboard/settings/users" label={<><Users2 size={18} /> Staff</>} id="staff" />
                        </>
                    )}
                </>
            )}
          </nav>

          <div className="mt-auto pt-10 pb-4 flex flex-col items-center">
              <div className="flex flex-col items-center relative group">
                  <div className="text-3xl font-black italic tracking-tighter flex items-baseline relative z-10">
                      <span className={`${isSuperAdminZone ? 'text-white' : 'text-black'}`}>BAY</span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-[#00b2bd] to-[#00f2ff]">UP.</span>
                  </div>
                  <div className="h-[2px] w-0 bg-[#00f2ff] group-hover:w-full transition-all duration-500 mt-1" />
              </div>
              <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] mt-4">Core Engine v4.2</p>
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
