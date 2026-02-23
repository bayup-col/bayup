"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { userService } from '@/lib/api';
import { DashboardHeader } from '@/components/dashboard/Header';
import { BaytAssistant } from '@/components/dashboard/BaytAssistant';
import { InteractiveUP } from '@/components/landing/InteractiveUP';
import { motion, AnimatePresence } from 'framer-motion';
import { getModulesByPlan } from '@/lib/plan-configs';
import { 
  LayoutDashboard, 
  Bot, 
  FileText, 
  Package, 
  Truck, 
  Globe, 
  MessageSquare, 
  Link2, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  Gem, 
  Tag, 
  Settings,
  Users2,
  BarChart3,
  Store,
  ChevronDown,
  Pencil,
  User,
  Lock,
  Bell,
  Globe2,
  Camera,
  X,
  Ghost,
  ExternalLink,
  LogOut,
  Eye,
  Sparkles
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userEmail: authEmail, userRole: authRole, token, logout, userPlan, isGlobalStaff } = useAuth();
  const { theme } = useTheme();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const planName = userPlan?.name || 'Básico';
  const allowedModules = getModulesByPlan(planName);
  
  const router = useRouter();
  const pathname = usePathname();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isBaytOpen, setIsBaytOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Mi Tienda Bayup');

  useEffect(() => {
    const savedData = localStorage.getItem('bayup_general_settings');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.identity?.name) setCompanyName(parsed.identity.name);
      } catch (e) {}
    }
    const handleNameUpdate = (e: any) => { if (e.detail) setCompanyName(e.detail); };
    window.addEventListener('bayup_name_update', handleNameUpdate);
    return () => window.removeEventListener('bayup_name_update', handleNameUpdate);
  }, []);

  const userEmail = authEmail || 'usuario@ejemplo.com';
  const userRole = authRole || 'admin';

  const getLinkStyles = (path: string, type: 'admin' | 'super' = 'admin', isSub = false) => {
      const isActive = pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
      const base = `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300  `;
      const subBase = `flex items-center gap-3 px-4 py-2 ml-9 rounded-xl text-xs font-bold transition-all duration-300  `;
      
      if (type === 'super') {
        return (isSub ? subBase : base) + (isActive 
          ? (theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF] shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'bg-[#f0f9f9] text-[#004d4d] shadow-sm')
          : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'));
      }
      
      return (isSub ? subBase : base) + (isActive 
        ? (theme === 'dark' 
            ? 'backdrop-blur-md bg-[#00F2FF]/10 border border-[#00F2FF]/20 text-[#00F2FF] shadow-[0_8px_32px_-4px_rgba(0,242,255,0.2)] scale-[1.02]'
            : 'backdrop-blur-md bg-white/20 border border-white/30 text-[#004d4d] shadow-[0_8px_16px_-4px_rgba(0,77,77,0.15)] scale-[1.02]')
        : (theme === 'dark'
            ? 'text-slate-400 hover:bg-white/5 hover:text-[#00F2FF]'
            : 'text-gray-500 hover:bg-[#004d4d]/5 hover:text-[#004d4d]'));
  };
  
  const MenuItem = ({ href, label, id, isSub = false }: { href: string, label: ReactNode, id: string, isSub?: boolean }) => {
      if (isGlobalStaff === true) return (
        <div className="relative group">
          <Link href={href} className={getLinkStyles(href, 'admin', isSub)}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                {label}
            </div>
          </Link>
        </div>
      );

      const moduleKey = id.replace('m_', '').replace('s_', '');
      const isAllowedByPlan = (allowedModules as any[]).includes(moduleKey);

      if (!isAllowedByPlan && !pathname?.includes('/super-admin')) return null;
      
      return (
        <div className="relative group">
          <Link href={href} className={getLinkStyles(href, 'admin', isSub)}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                {label}
            </div>
          </Link>
        </div>
      );
  };

  const hasVisibleModules = (moduleIds: string[]) => {
      if (isGlobalStaff) return true;
      return moduleIds.some(id => (allowedModules as any[]).includes(id.replace('m_', '').replace('s_', '')));
  };

  const renderSidebar = () => {
    if (isGlobalStaff === true) {
        return (
            <>
              <div className="p-6 border-b border-white/10">
                <Link href="/dashboard/super-admin" className="text-2xl font-black bg-gradient-to-r from-[#004d4d] to-[#008080] bg-clip-text text-transparent italic tracking-tighter">
                  Bayup <span className="text-[10px] uppercase tracking-[0.3em] font-black text-cyan">Master</span>
                </Link>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Administración</p>
                <MenuItem href="/dashboard/super-admin" label={<><LayoutDashboard size={16} /> Dashboard</>} id="m_inicio" />
                <MenuItem href="/dashboard/super-admin/empresas" label={<><Store size={16} /> Directorio Empresas</>} id="m_empresas" />
                <MenuItem href="/dashboard/super-admin/afiliados" label={<><Users2 size={16} /> Red Afiliados</>} id="m_afiliados" />
                <MenuItem href="/dashboard/super-admin/tesoreria" label={<><Gem size={16} /> Tesorería (3.5%)</>} id="m_tesoreria" />
                <div className="my-4 border-t border-white/5"></div>
                <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Creatividad & Equipo</p>
                <MenuItem href="/dashboard/super-admin/web-templates" label={<><Globe size={16} /> Fábrica de Diseño</>} id="m_web_templates" />
                <MenuItem href="/dashboard/super-admin/users" label={<><Users size={16} /> Equipo Bayup</>} id="m_staff" />
              </nav>
            </>
        );
    }

    return (
      <>
          <div className="p-4 border-b border-white/10 relative">
              <div className={`backdrop-blur-md p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center transition-all duration-500 ${theme === 'dark' ? 'bg-[#002626]/40 border-[#00F2FF]/10' : 'bg-white/10 border-white/30'}`}>
                  <div className="flex flex-col items-center">
                      <span className={`text-base font-black leading-tight tracking-tighter transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {companyName}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                          <span className={`text-[9px] font-black tracking-widest transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-[#004d4d]'}`}>En línea</span>
                      </div>
                  </div>
                  <button 
                      onClick={() => {
                        const origin = window.location.origin;
                        const savedSettings = localStorage.getItem('bayup_general_settings');
                        let slug = 'preview';
                        if (savedSettings) {
                            try {
                                const parsed = JSON.parse(savedSettings);
                                if (parsed.identity?.slug) slug = parsed.identity.slug;
                            } catch(e){}
                        }
                        window.open(`${origin}/shop/${slug}`, '_blank');
                      }}
                      className="mt-4 group/conic relative w-full p-[1.5px] overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                  >
                      <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#00F2FF_0deg,#004d4d_90deg,#9333EA_180deg,#004d4d_270deg,#00F2FF_360deg)] animate-[spin_4s_linear_infinite] opacity-100 group-hover/conic:animate-[spin_2s_linear_infinite]" />
                      <div className={`relative flex items-center justify-center w-full py-4 px-6 backdrop-blur-2xl rounded-[calc(1rem-1.5px)] transition-all duration-500 ${theme === 'dark' ? 'bg-[#001a1a]/90 group-hover/conic:bg-[#001a1a]' : 'bg-white/80 group-hover/conic:bg-white/95'}`}>
                          <span className={`relative z-10 text-[10px] font-black tracking-[0.1em] flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-[#004d4d]'}`}>
                              <Eye size={14} className="opacity-80" /> Ver tienda online
                          </span>
                      </div>
                  </button>
              </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                {/* SECCIÓN OPERACIÓN (Básico, Pro, Empresa) */}
                <div>
                    <p className="px-4 text-[11px] font-black text-gray-400 tracking-tight mb-3 uppercase">
                        {planName === 'Básico' ? 'Operación V1' : planName === 'Pro' ? 'Operación Plus' : 'Operación Maestro'}
                    </p>
                    <div className="space-y-1">
                        <MenuItem href="/dashboard" label={<><LayoutDashboard size={16} className="mr-2" /> Inicio</>} id="m_inicio" />
                        <MenuItem href="/dashboard/invoicing" label={<><FileText size={16} className="mr-2" /> Facturación (POS)</>} id="m_facturacion" />
                        <MenuItem href="/dashboard/orders" label={<><Package size={16} className="mr-2" /> Pedidos Web</>} id="m_pedidos" />
                        
                        {/* GESTIÓN DE PRODUCTOS DINÁMICA POR PLAN */}
                        {allowedModules.includes('productos') && (
                            <>
                                { (planName === 'Básico') ? (
                                    <MenuItem href="/dashboard/products" label={<><Store size={16} className="mr-2" /> Productos</>} id="m_productos" />
                                ) : (
                                    <>
                                        <button onClick={() => setProductsOpen(!productsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/products')}`}>
                                            <span className="flex items-center gap-2 text-sm font-medium"><Store size={16} /> Productos</span>
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${productsOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                            <div className="space-y-1">
                                                <MenuItem href="/dashboard/products" label="Todos los productos" id="s_products_all" isSub />
                                                <MenuItem href="/dashboard/inventory" label="Inventario Pro" id="s_inventory" isSub />
                                                <MenuItem href="/dashboard/catalogs" label="Catálogos WA" id="s_catalogs" isSub />
                                                <MenuItem href="/dashboard/products/separados" label="Separados (IA)" id="s_separados" isSub />
                                                <MenuItem href="/dashboard/products/cotizaciones" label="Cotizaciones" id="s_cotizaciones" isSub />
                                                <MenuItem href="/dashboard/products/bodegas" label="Bodegas & Stock" id="s_bodegas" isSub />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <MenuItem href="/dashboard/chats" label={<><MessageSquare size={16} className="mr-2" /> Mensajes Web</>} id="m_mensajes" />
                        <MenuItem href="/dashboard/shipping" label={<><Truck size={16} className="mr-2" /> Envíos</>} id="m_envios" />
                        <MenuItem href="/dashboard/customers" label={<><Users size={16} className="mr-2" /> Clientes</>} id="m_clientes" />
                        <MenuItem href="/dashboard/returns" label={<><ShieldCheck size={16} className="mr-2" /> Garantías</>} id="m_garantias" />
                    </div>
                </div>

                {/* SECCIÓN CRECIMIENTO (Pro & Empresa) */}
                {hasVisibleModules(['m_web_analytics', 'm_marketing', 'm_loyalty', 'm_discounts']) && (
                    <div>
                        <p className="px-4 text-[11px] font-black text-gray-400 tracking-tight mb-3 uppercase">Crecimiento</p>
                        <div className="space-y-1">
                            <MenuItem href="/dashboard/web-analytics" label={<><BarChart3 size={16} className="mr-2" /> ROI & Analytics</>} id="m_web_analytics" />
                            <MenuItem href="/dashboard/marketing" label={<><TrendingUp size={16} className="mr-2" /> Marketing</>} id="m_marketing" />
                            <MenuItem href="/dashboard/loyalty" label={<><Gem size={16} className="mr-2" /> Club de Puntos</>} id="m_loyalty" />
                            <MenuItem href="/dashboard/discounts" label={<><Tag size={16} className="mr-2" /> Descuentos</>} id="m_discounts" />
                        </div>
                    </div>
                )}

                {/* SECCIÓN INTELIGENCIA (Solo Empresa) */}
                {hasVisibleModules(['m_automations', 'm_ai_assistants', 'm_reports']) && (
                    <div>
                        <p className="px-4 text-[11px] font-black text-gray-400 tracking-tight mb-3 uppercase">Inteligencia</p>
                        <div className="space-y-1">
                            <MenuItem href="/dashboard/automations" label={<><Settings size={16} className="mr-2" /> Automatización</>} id="m_automations" />
                            <MenuItem href="/dashboard/ai-assistants" label={<><Bot size={16} className="mr-2" /> Asistentes AI</>} id="m_ai_assistants" />
                            <MenuItem href="/dashboard/multiventa" label={<><Globe size={16} className="mr-2" /> Multiventa Hub</>} id="m_multiventa" />
                            
                            {/* INFORMES AVANZADOS */}
                            {allowedModules.includes('reports') && (
                                <>
                                    <button onClick={() => setReportsOpen(!reportsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/reports')}`}>
                                        <span className="flex items-center gap-2 text-sm font-medium"><BarChart3 size={16} /> Informes Pro</span>
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${reportsOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${reportsOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                        <div className="space-y-1">
                                            <MenuItem href="/dashboard/reports" label="Análisis General" id="s_reports_gen" isSub />
                                            <MenuItem href="/dashboard/reports?tab=nomina" label="Gestión de Nómina" id="s_reports_payroll" isSub />
                                            <MenuItem href="/dashboard/reports/purchase-orders" label="Órdenes de Compra" id="s_purchase_orders" isSub />
                                            <MenuItem href="/dashboard/reports/vendedores" label="Vendedores" id="s_vendedores" isSub />
                                            <MenuItem href="/dashboard/reports/gastos" label="Gastos & Flujo" id="s_gastos" isSub />
                                            <MenuItem href="/dashboard/reports/comisiones" label="Liquidación 0.5%" id="s_comisiones" isSub />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* GESTIÓN DE CUENTA */}
                <div>
                    <p className="px-4 text-[11px] font-black text-gray-400 tracking-tight mb-3 uppercase">Gestión</p>
                    <div className="space-y-1">
                        <MenuItem href="/dashboard/settings/general" label={<><Settings size={16} className="mr-2" /> Perfil de Tienda</>} id="s_settings_general" />
                        <MenuItem href="/dashboard/settings/plan" label={<><ShieldCheck size={16} className="mr-2" /> Mi Plan Bayup</>} id="s_settings_plan" />
                        <MenuItem href="/dashboard/settings/users" label={<><Users size={16} className="mr-2" /> Mi Equipo Staff</>} id="s_settings_users" />
                    </div>
                </div>
          </nav>
      </>
    );
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#001212]' : 'bg-[#FAFAFA]'}`}>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? 'rgba(0, 242, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'dark' ? 'rgba(0, 242, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; }
      `}</style>
      
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`relative group m-4 p-[2px] rounded-[2.5rem] overflow-hidden isolate flex-shrink-0 shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'shadow-black/40 border border-white/5' : 'shadow-[0_20px_50px_rgba(0,77,77,0.05)]'}`}
      >
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden -z-10">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-[300%] aspect-square"
            style={{
              background: theme === 'dark' 
                ? `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #002626 360deg)`
                : `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
              x: "-50%",
              y: "-50%",
              willChange: 'transform'
            }}
          />
          <div className={`absolute inset-[1px] rounded-[2.45rem] backdrop-blur-3xl transition-colors duration-500 ${theme === 'dark' ? 'bg-[#001a1a]/90' : 'bg-white/90'}`} />
        </div>
        
        <aside className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar z-0 transition-all duration-500 ${theme === 'dark' ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-white/30 text-gray-600'}`}>
          <div className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>
            <div className="relative">
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute top-8 right-3 z-50 flex items-center justify-center text-gray-300 hover:text-[#004d4d] transition-all active:scale-90 group/btn">
                    <ChevronDown className="rotate-90 transition-transform group-hover/btn:scale-110" size={20}/>
                </button>
                {renderSidebar()}
            </div>
          </div>
          {isSidebarCollapsed && (
            <div className="flex-1 flex flex-col items-center py-6 space-y-8 overflow-y-auto no-scrollbar relative">
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="flex items-center justify-center text-gray-300 hover:text-[#004d4d] transition-all active:scale-90 mb-4 group/btn">
                    <ChevronDown className="-rotate-90 transition-transform group-hover/btn:scale-110" size={24}/>
                </button>
                <div className="space-y-4 w-full px-2">
                    <MenuItem href="/dashboard" label={<LayoutDashboard size={20} />} id="m_inicio" />
                    <MenuItem href="/dashboard/invoicing" label={<FileText size={20} />} id="m_facturacion" />
                    <MenuItem href="/dashboard/orders" label={<Package size={20} />} id="m_pedidos" />
                    <MenuItem href="/dashboard/products" label={<Store size={20} />} id="m_productos" />
                </div>
            </div>
          )}
          <div className={`p-6 mt-auto flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} border-t border-white/10 bg-transparent relative`}>
            <div onClick={() => {}} className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-2xl font-black italic tracking-tighter cursor-pointer w-fit relative group/logo transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-black'}`}>
              <span>BAY</span><InteractiveUP />
            </div>
          </div>
        </aside>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <DashboardHeader pathname={pathname} userEmail={userEmail} userRole={userRole} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} logout={logout} setIsUserSettingsOpen={setIsUserSettingsOpen} isBaytOpen={isBaytOpen} setIsBaytOpen={setIsBaytOpen} />
        <div className={`absolute inset-0 -z-10 transition-all duration-500 ${theme === 'dark' ? 'opacity-20' : 'opacity-5'}`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>
        <main className="flex-1 overflow-y-auto py-8 px-8 custom-scrollbar bg-transparent relative scroll-smooth">
            <div className="pt-4">{children}</div>
        </main>
        
        {(planName === 'Empresa' || isGlobalStaff) && (
          <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />
        )}
      </div>
    </div>
  );
}
