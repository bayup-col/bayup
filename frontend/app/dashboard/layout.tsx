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
  const { userEmail: authEmail, userRole: authRole, token, logout, userPlan, isGlobalStaff, userPermissions } = useAuth();
  const { theme } = useTheme();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // 1. Aislamiento Total: Cada plan tiene su propia lista independiente en lib/plan-configs.ts
  const planName = userPlan?.name || 'Básico';
  const allowedModules = getModulesByPlan(planName);
  
  const router = useRouter();
  const pathname = usePathname();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  const [isBaytOpen, setIsBaytOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'prefs'>('profile');
  const [showGhost, setShowGhost] = useState(false);
  const [companyName, setCompanyName] = useState('Mi Tienda Bayup');

  useEffect(() => {
    // Inicializar nombre desde localStorage
    const savedData = localStorage.getItem('bayup_general_settings');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.identity?.name) setCompanyName(parsed.identity.name);
      } catch (e) { console.error(e); }
    }

    // Escuchar actualizaciones en tiempo real
    const handleNameUpdate = (e: any) => {
      if (e.detail) setCompanyName(e.detail);
    };
    window.addEventListener('bayup_name_update', handleNameUpdate);
    return () => window.removeEventListener('bayup_name_update', handleNameUpdate);
  }, []);

  const userEmail = authEmail || 'usuario@ejemplo.com';
  const userRole = authRole || 'admin';

  // Cargar Permisos Reales del Usuario
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPerms = async () => {
        if (!token || userRole === 'admin' || userRole === 'super_admin') return;
        try {
            const rolesData = await userService.getRoles(token);
            const myRole = rolesData.find((r: any) => r.name === authRole || r.id === authRole);
            if (myRole?.permissions) setPermissions(myRole.permissions);
        } catch (e) {
            // Error silencioso en carga inicial
        }
    };
    fetchPerms();
  }, [authRole, token, userRole]);

  const handleLogoClick = () => {
    setShowGhost(true);
    setTimeout(() => setShowGhost(false), 1500);
  };

  const toggleModule = (id: string) => {
    setHiddenModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

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
      // 1. SI ES STAFF GLOBAL (Dani o equipo), ve todo lo del Super Admin
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
      if (hiddenModules.includes(id) && !isEditingMenu) return null;
      
      return (
        <div className="relative group">
          <Link 
            href={href} 
            className={`${getLinkStyles(href, 'admin', isSub)} ${hiddenModules.includes(id) ? 'opacity-40' : ''}`}
          >
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                {label}
            </div>
          </Link>
          {isEditingMenu && !isSidebarCollapsed && (
            <button 
              onClick={(e) => { e.preventDefault(); toggleModule(id); }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${hiddenModules.includes(id) ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-transparent'}`}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
            </button>
          )}
        </div>
      );
    };

    // Helper para saber si una sección entera debe mostrarse
    const hasVisibleModules = (moduleIds: string[]) => {
        if (isGlobalStaff) return true;
        return moduleIds.some(id => (allowedModules as any[]).includes(id.replace('m_', '').replace('s_', '')));
    };
  
  const [isRedirectingStore, setIsRedirectingStore] = useState(false);

  const handleStoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRedirectingStore(true);
    setTimeout(() => {
      router.push('/dashboard/my-store');
      setTimeout(() => setIsRedirectingStore(false), 500); // Reset after navigation starts
    }, 800);
  };

  const renderSidebar = () => {
    // Si el usuario es Staff Global (Dani o invitados), ve el menú de Bayup
    // BLOQUEO ABSOLUTO: Solo si isGlobalStaff es explícitamente TRUE
    if (isGlobalStaff === true) {
        return (
            <>
              <div className="p-6 border-b border-white/10">
                <Link href="/dashboard/super-admin" className="text-2xl font-black bg-gradient-to-r from-[#004d4d] to-[#008080] bg-clip-text text-transparent">
                  Super Admin
                </Link>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                <MenuItem href="/dashboard/super-admin" label={<><LayoutDashboard size={16} /> Dashboard</>} id="m_inicio" />
                <MenuItem href="/dashboard/super-admin/empresas" label={<><Store size={16} /> Empresas</>} id="m_empresas" />
                <MenuItem href="/dashboard/super-admin/afiliados" label={<><Users2 size={16} /> Afiliados</>} id="m_afiliados" />
                <MenuItem href="/dashboard/super-admin/tesoreria" label={<><Gem size={16} /> Tesorería</>} id="m_tesoreria" />
                
                <div className="my-2 border-t border-gray-100/10"></div>
                
                <MenuItem href="/dashboard/super-admin/web-analytics" label={<><BarChart3 size={16} /> Estadísticas Web</>} id="m_web_analytics" />
                <MenuItem href="/dashboard/super-admin/web-templates" label={<><Globe size={16} /> Plantillas Web</>} id="m_web_templates" />
                <MenuItem href="/dashboard/super-admin/marketing" label={<><TrendingUp size={16} /> Marketing</>} id="m_marketing" />
                <MenuItem href="/dashboard/super-admin/soporte" label={<><MessageSquare size={16} /> Soporte</>} id="m_soporte" />
                
                <div className="my-2 border-t border-gray-100/10"></div>
                
                <MenuItem href="/dashboard/super-admin/apis" label={<><Link2 size={16} /> APIs & Integraciones</>} id="m_apis" />
                <MenuItem href="/dashboard/super-admin/feature-flags" label={<><Tag size={16} /> Feature Flags</>} id="m_feature_flags" />
                <MenuItem href="/dashboard/super-admin/risk" label={<><ShieldCheck size={16} /> Riesgos & Fraude</>} id="m_riesgos" />
                <MenuItem href="/dashboard/super-admin/legal" label={<><FileText size={16} /> Legal & Fiscal</>} id="m_legal" />
                <MenuItem href="/dashboard/super-admin/docs" label={<><FileText size={16} /> Documentación</>} id="m_docs" />
                <MenuItem href="/dashboard/super-admin/observability" label={<><Camera size={16} /> Observabilidad</>} id="m_observabilidad" />
                
                <div className="my-2 border-t border-gray-100/10"></div>
                
                <MenuItem href="/dashboard/super-admin/settings" label={<><Settings size={16} /> Configuración</>} id="m_settings" />
                <MenuItem href="/dashboard/super-admin/users" label={<><Users size={16} /> Usuarios & Roles</>} id="m_staff" />
              </nav>
            </>
        );
    }

  return (
      <>
          <div className="p-4 border-b border-white/10 relative">
              <div className={`backdrop-blur-md p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center transition-all duration-500 ${theme === 'dark' ? 'bg-[#002626]/40 border-[#00F2FF]/10' : 'bg-white/10 border-white/30'}`}>
                  <div className="flex flex-col items-center">
                      <span className={`text-base font-black leading-tight  tracking-tighter transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {companyName}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                          <span className={`text-[9px] font-black  tracking-widest transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-[#004d4d]'}`}>En línea</span>
                      </div>
                  </div>
                  
                  <button 
                      onClick={handleStoreClick}
                      className="mt-4 group/conic relative w-full p-[1.5px] overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                  >
                      {/* Rotating Conic Gradient Border */}
                      <div 
                          className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#00F2FF_0deg,#004d4d_90deg,#9333EA_180deg,#004d4d_270deg,#00F2FF_360deg)] animate-[spin_4s_linear_infinite] opacity-100 group-hover/conic:animate-[spin_2s_linear_infinite]"
                      />

                      {/* Inner Body */}
                      <div className={`relative flex items-center justify-center w-full py-4 px-6 backdrop-blur-2xl rounded-[calc(1rem-1.5px)] transition-all duration-500 ${theme === 'dark' ? 'bg-[#001a1a]/90 group-hover/conic:bg-[#001a1a]' : 'bg-white/80 group-hover/conic:bg-white/95'}`}>
                          <span className={`relative z-10 text-[10px] font-black  tracking-[0.1em] flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-[#004d4d]'}`}>
                              <Eye size={14} className="opacity-80" />
                              Ver tienda online
                          </span>
                      </div>

                      {/* Subtle Outer Glow */}
                      <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
                  </button>
              </div>
          </div>

            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                {hasVisibleModules(['m_inicio', 'm_facturacion', 'm_pedidos', 'm_envios', 'm_productos']) && (
                    <div>
                        <p className="px-4 text-[11px] font-black text-gray-400  tracking-tight mb-3">Operación</p>
                        <div className="space-y-1">
                            <MenuItem href="/dashboard" label={<><LayoutDashboard size={16} className="mr-2" /> Inicio</>} id="m_inicio" />
                            <MenuItem href="/dashboard/invoicing" label={<><FileText size={16} className="mr-2" /> Facturación</>} id="m_facturacion" />
                            <MenuItem href="/dashboard/orders" label={<><Package size={16} className="mr-2" /> Pedidos</>} id="m_pedidos" />
                            <MenuItem href="/dashboard/shipping" label={<><Truck size={16} className="mr-2" /> Envíos</>} id="m_envios" />
                            
                            {/* BLINDAJE PRODUCTOS */}
                            {allowedModules.includes('productos') && (
                                <div className={hiddenModules.includes('m_productos') ? 'opacity-30' : ''}>
                                    { (planName === 'Básico' || planName === 'Free') ? (
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
                                                    <MenuItem href="/dashboard/inventory" label="Inventario" id="s_inventory" isSub />
                                                    <MenuItem href="/dashboard/catalogs" label="Catálogos WhatsApp" id="s_catalogs" isSub />
                                                    <MenuItem href="/dashboard/products/separados" label="Separados (IA)" id="s_separados" isSub />
                                                    <MenuItem href="/dashboard/products/cotizaciones" label="Cotizaciones" id="s_cotizaciones" isSub />
                                                    <MenuItem href="/dashboard/products/bodegas" label="Bodegas & Stock" id="s_bodegas" isSub />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <MenuItem href="/dashboard/multiventa" label={<><Globe size={16} className="mr-2" /> Multiventa</>} id="m_multiventa" />
                            <MenuItem href="/dashboard/chats" label={<><MessageSquare size={16} className="mr-2" /> Mensajes</>} id="m_mensajes" />
                            <MenuItem href="/dashboard/customers" label={<><Users size={16} className="mr-2" /> Clientes</>} id="m_clientes" />
                            <MenuItem href="/dashboard/returns" label={<><ShieldCheck size={16} className="mr-2" /> Garantías</>} id="m_garantias" />

                            {/* BLINDAJE INFORMES - POSICIÓN CORREGIDA BAJO CLIENTES */}
                            {allowedModules.includes('reports') && (
                                <div className={hiddenModules.includes('m_reports') ? 'opacity-30' : ''}>
                                    { (planName === 'Básico' || planName === 'Free') ? (
                                        <MenuItem href="/dashboard/reports" label={<><BarChart3 size={16} className="mr-2" /> Informes</>} id="m_reports" />
                                    ) : (
                                        <>
                                            <button onClick={() => setReportsOpen(!reportsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/reports')}`}>
                                                <span className="flex items-center gap-2 text-sm font-medium"><BarChart3 size={16} /> Informes</span>
                                                <ChevronDown size={14} className={`transition-transform duration-200 ${reportsOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${reportsOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                                <div className="space-y-1">
                                                    <MenuItem href="/dashboard/reports" label="Análisis General" id="s_reports_gen" isSub />
                                                    <MenuItem href="/dashboard/reports?tab=nomina" label="Gestión de Nómina" id="s_reports_payroll" isSub />
                                                    <MenuItem href="/dashboard/reports/purchase-orders" label="Órdenes de Compra" id="s_purchase_orders" isSub />
                                                    <MenuItem href="/dashboard/reports/sucursales" label="Sucursales" id="s_sucursales" isSub />
                                                    <MenuItem href="/dashboard/reports/vendedores" label="Vendedores" id="s_vendedores" isSub />
                                                    <MenuItem href="/dashboard/reports/cuentas" label="Cuentas y Cartera" id="s_cuentas" isSub />
                                                    <MenuItem href="/dashboard/reports/gastos" label="Control de Gastos" id="s_gastos" isSub />
                                                    <MenuItem href="/dashboard/reports/comisiones" label="Liquidación de Comisiones" id="s_comisiones" isSub />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {hasVisibleModules(['m_web_analytics', 'm_marketing', 'm_loyalty', 'm_discounts', 'm_automations', 'm_ai_assistants']) && (
                    <div>
                        <p className="px-4 text-[11px] font-black text-gray-400  tracking-tight mb-3">Crecimiento</p>
                        <div className="space-y-1">
                            <MenuItem href="/dashboard/web-analytics" label={<><BarChart3 size={16} className="mr-2" /> Estadísticas Web</>} id="m_web_analytics" />
                            <MenuItem href="/dashboard/marketing" label={<><TrendingUp size={16} className="mr-2" /> Marketing</>} id="m_marketing" />
                            <MenuItem href="/dashboard/loyalty" label={<><Gem size={16} className="mr-2" /> Club de Puntos</>} id="m_loyalty" />
                            <MenuItem href="/dashboard/discounts" label={<><Tag size={16} className="mr-2" /> Descuentos</>} id="m_discounts" />
                            <MenuItem href="/dashboard/automations" label={<><Settings size={16} className="mr-2" /> Automatizaciones</>} id="m_automations" />
                            <MenuItem href="/dashboard/ai-assistants" label={<><Bot size={16} className="mr-2" /> Asistentes IA</>} id="m_ai_assistants" />
                        </div>
                    </div>
                )}

                <div>
                    <p className="px-4 text-[11px] font-black text-gray-400  tracking-tight mb-3">Diseño & Tienda</p>
                    <div className="space-y-1">
                        <MenuItem href="/dashboard/my-store/templates" label={<><LayoutDashboard size={16} className="mr-2" /> Galería de Plantillas</>} id="m_templates" />
                        <MenuItem href="/dashboard/pages" label={<><Pencil size={16} className="mr-2" /> Editor de Páginas</>} id="m_pages" />
                    </div>
                </div>

                <div>
                    <p className="px-4 text-[11px] font-black text-gray-400  tracking-tight mb-3">Gestión</p>
                    <div className="space-y-1">
                        
                        {/* BLINDAJE CONFIGURACIÓN */}
                        <div>
                            <button onClick={() => setSettingsOpen(!settingsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/settings')}`}>
                                <span className="flex items-center gap-2 text-sm font-medium"><Settings size={16} /> Config. Tienda</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${settingsOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-1">
                                    <MenuItem href="/dashboard/settings/general" label="Info General" id="s_settings_general" isSub />
                                    <MenuItem href="/dashboard/settings/plan" label="Mi Plan" id="s_settings_plan" isSub />
                                    <MenuItem href="/dashboard/settings/users" label="Staff" id="s_settings_users" isSub />
                                </div>
                            </div>
                        </div>
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
      
      {/* Sidebar con efecto Aurora */}
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
                {/* Botón Colapsar Barra (Icono minimalista flotante) */}
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute top-8 right-3 z-50 flex items-center justify-center text-gray-300 hover:text-[#004d4d] transition-all active:scale-90 group/btn"
                >
                    <ChevronDown className="rotate-90 transition-transform group-hover/btn:scale-110" size={20}/>
                </button>
                {renderSidebar()}
            </div>
          </div>

          {/* Versión Colapsada del Sidebar (Solo Iconos) */}
          {isSidebarCollapsed && (
            <div className="flex-1 flex flex-col items-center py-6 space-y-8 overflow-y-auto no-scrollbar relative">
                {/* Botón Expandir (Icono minimalista flotante) */}
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="flex items-center justify-center text-gray-300 hover:text-[#004d4d] transition-all active:scale-90 mb-4 group/btn"
                >
                    <ChevronDown className="-rotate-90 transition-transform group-hover/btn:scale-110" size={24}/>
                </button>
                
                <div className="space-y-4 w-full px-2">
                    <MenuItem href="/dashboard" label={<LayoutDashboard size={20} />} id="m_inicio" />
                    <MenuItem href="/dashboard/invoicing" label={<FileText size={20} />} id="m_facturacion" />
                    <MenuItem href="/dashboard/orders" label={<Package size={20} />} id="m_pedidos" />
                    <MenuItem href="/dashboard/products" label={<Store size={20} />} id="m_productos" />
                    <MenuItem href="/dashboard/customers" label={<Users size={20} />} id="m_clientes" />
                    <MenuItem href="/dashboard/reports" label={<BarChart3 size={20} />} id="m_reports" />
                </div>
                <div className="my-4 w-10 h-px bg-gray-100/10" />
                <div className="space-y-4 w-full px-2">
                    <MenuItem href="/dashboard/settings/general" label={<Settings size={20} />} id="s_settings_general" />
                </div>
            </div>
          )}

          <div className={`p-6 mt-auto flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} border-t border-white/10 bg-transparent relative`}>
            <div 
              onClick={handleLogoClick}
              className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-2xl font-black italic tracking-tighter cursor-pointer w-fit relative group/logo transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-black'}`}
            >
              <span>BAY</span><InteractiveUP />
            </div>
            
            {!isSidebarCollapsed && (
                <button 
                onClick={() => setIsEditingMenu(!isEditingMenu)} 
                className={`h-8 w-8 flex items-center justify-center rounded-xl transition-all ${isEditingMenu ? 'bg-[#004d4d] text-white shadow-lg shadow-[#004d4d]/20' : 'text-gray-300 hover:text-[#004d4d] opacity-50 hover:opacity-100 hover:bg-white/50'}`}
                title="Personalizar Menú"
                >
                <Pencil size={14} />
                </button>
            )}
          </div>
        </aside>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <DashboardHeader 
            pathname={pathname} 
            userEmail={userEmail} 
            userRole={userRole} 
            userMenuOpen={userMenuOpen} 
            setUserMenuOpen={setUserMenuOpen} 
            logout={logout} 
            setIsUserSettingsOpen={setIsUserSettingsOpen}
            isBaytOpen={isBaytOpen}
            setIsBaytOpen={setIsBaytOpen}
        />

        {/* Fondo Atmosférico Unificado */}
        <div className={`absolute inset-0 -z-10 transition-all duration-500 ${theme === 'dark' ? 'opacity-20' : 'opacity-5'}`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>
        
        <main className="flex-1 overflow-y-auto py-8 px-8 custom-scrollbar bg-transparent relative scroll-smooth">
            <div className="pt-4"> 
                {children}
            </div>
        </main>
        
        {(planName === 'Empresa' || isGlobalStaff) && (
          <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />
        )}
      </div>

      {isUserSettingsOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`w-full max-w-4xl rounded-[3rem] shadow-2xl border overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[800px] transition-all duration-500 ${
                    theme === 'dark' ? 'bg-[#001a1a]/95 border-[#00F2FF]/20 shadow-[#00F2FF]/5' : 'bg-white/95 border-white shadow-gray-200'
                }`}
            >
                {/* Sidebar del Modal */}
                <div className={`w-full md:w-64 p-8 flex flex-col border-b md:border-b-0 md:border-r transition-all duration-500 ${
                    theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50/50 border-gray-100'
                }`}>
                    <div className="mb-10 flex flex-col items-center md:items-start">
                        <div className="relative group">
                            <div className={`h-20 w-20 rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-2xl border-4 transition-all duration-500 ${
                                theme === 'dark' ? 'bg-gradient-to-tr from-[#00F2FF]/20 to-[#004d4d]/40 border-[#00F2FF]/10 text-[#00F2FF]' : 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-white text-white'
                            }`}>
                                {userEmail?.charAt(0).toUpperCase()}
                            </div>
                            <button className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95 ${
                                theme === 'dark' ? 'bg-[#00F2FF] text-[#001a1a]' : 'bg-white text-gray-900'
                            }`}>
                                <Camera size={14} />
                            </button>
                        </div>
                        <div className="mt-4 text-center md:text-left">
                            <h3 className={`text-lg font-black tracking-tight truncate w-48 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{userEmail?.split('@')[0]}</h3>
                            <p className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-purple-600'}`}>{userRole?.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {[
                            { id: 'profile', label: 'Mi Perfil', icon: <User size={16}/> },
                            { id: 'security', label: 'Seguridad', icon: <Lock size={16}/> },
                            { id: 'prefs', label: 'Preferencias', icon: <Globe2 size={16}/> }
                        ].map((tab) => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black tracking-widest transition-all relative group ${
                                    activeTab === tab.id 
                                        ? (theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' : 'bg-purple-600 text-white')
                                        : (theme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100')
                                }`}
                            >
                                <span className="group-hover:scale-110 transition-transform">{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && <motion.div layoutId="tab-active" className={`absolute left-0 w-1 h-6 rounded-full ${theme === 'dark' ? 'bg-[#00F2FF]' : 'bg-white'}`} />}
                            </button>
                        ))}
                    </nav>

                    <div className={`mt-auto p-4 rounded-[2rem] border backdrop-blur-sm transition-all duration-500 ${
                        theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={12} className={theme === 'dark' ? 'text-[#00F2FF]' : 'text-purple-600'} />
                            <span className={`text-[9px] font-black tracking-widest uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Bayt Advisor</span>
                        </div>
                        <p className={`text-[10px] leading-relaxed italic ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                            {activeTab === 'security' 
                                ? "Te sugiero usar una contraseña de al menos 12 caracteres para máxima seguridad." 
                                : "Tu perfil es tu carta de presentación ante tu equipo y clientes."}
                        </p>
                    </div>
                </div>

                {/* Contenido Principal */}
                <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                    <div className="p-8 md:p-12 flex items-center justify-between">
                        <div>
                            <h2 className={`text-2xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {activeTab === 'profile' ? 'Configurar Perfil' : activeTab === 'security' ? 'Seguridad de Cuenta' : 'Preferencias Globales'}
                            </h2>
                            <p className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Gestiona tus datos personales y ajustes de seguridad.</p>
                        </div>
                        <button onClick={() => setIsUserSettingsOpen(false)} className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                            theme === 'dark' ? 'text-white/30 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                        }`}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-12 custom-scrollbar">
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-purple-600'}`}>Nombre Público</label>
                                        <input type="text" defaultValue={userEmail?.split('@')[0]} className={`w-full p-4 rounded-2xl outline-none text-sm font-bold transition-all border ${
                                            theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#00F2FF]/50' : 'bg-gray-50 border-transparent focus:bg-white focus:border-purple-200 text-gray-900'
                                        }`} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-purple-600'}`}>WhatsApp de Contacto</label>
                                        <input type="text" placeholder="+57 300 000 0000" className={`w-full p-4 rounded-2xl outline-none text-sm font-bold transition-all border ${
                                            theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#00F2FF]/50' : 'bg-gray-50 border-transparent focus:bg-white focus:border-purple-200 text-gray-900'
                                        }`} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-purple-600'}`}>Biografía Estratégica</label>
                                    <textarea rows={4} placeholder="Describe tu rol en la empresa..." className={`w-full p-4 rounded-2xl outline-none text-sm font-medium transition-all resize-none border ${
                                        theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#00F2FF]/50' : 'bg-gray-50 border-transparent focus:bg-white focus:border-purple-200 text-gray-900'
                                    }`} />
                                </div>
                                <div className={`p-6 rounded-[2rem] border flex items-center gap-4 transition-all duration-500 ${
                                    theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-[#f0f9f9] border-[#004d4d]/10'
                                }`}>
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-[#00F2FF]/20 text-[#00F2FF]' : 'bg-[#004d4d]/10 text-[#004d4d]'}`}>
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className={`text-[11px] font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Verificación de Identidad</p>
                                        <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tu cuenta está protegida por encriptación de grado militar.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-purple-600'}`}>Contraseña Actual</label>
                                        <input type="password" placeholder="••••••••" className={`w-full p-4 rounded-2xl outline-none text-sm font-bold transition-all border ${
                                            theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#00F2FF]/50' : 'bg-gray-50 border-transparent focus:bg-white focus:border-purple-200 text-gray-900'
                                        }`} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-purple-600'}`}>Nueva Contraseña</label>
                                            <input type="password" placeholder="••••••••" className={`w-full p-4 rounded-2xl outline-none text-sm font-bold transition-all border ${
                                                theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#00F2FF]/50' : 'bg-gray-50 border-transparent focus:bg-white focus:border-purple-200 text-gray-900'
                                            }`} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-purple-600'}`}>Confirmar Nueva</label>
                                            <input type="password" placeholder="••••••••" className={`w-full p-4 rounded-2xl outline-none text-sm font-bold transition-all border ${
                                                theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#00F2FF]/50' : 'bg-gray-50 border-transparent focus:bg-white focus:border-purple-200 text-gray-900'
                                            }`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'prefs' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[
                                    { icon: <Bell size={18}/>, title: 'Notificaciones Email', desc: 'Recibe alertas de ventas y stock bajo.', color: 'text-purple-500' },
                                    { icon: <MessageSquare size={18}/>, title: 'Alertas WhatsApp', desc: 'Notificaciones críticas en tiempo real.', color: 'text-emerald-500' },
                                    { icon: <Truck size={18}/>, title: 'Tracking Logístico', desc: 'Informar automáticamente cambios en envíos.', color: 'text-blue-500' }
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 ${
                                        theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md'
                                    }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                                                theme === 'dark' ? 'bg-white/5 ' + item.color : 'bg-white shadow-sm ' + item.color
                                            }`}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                                                <p className={`text-[10px] mt-0.5 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className={`h-6 w-12 rounded-full relative flex items-center px-1 cursor-pointer transition-colors ${i === 0 ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                            <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${i === 0 ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`p-8 border-t flex justify-between items-center transition-all duration-500 ${
                        theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50/50 border-gray-100'
                    }`}>
                        <button onClick={() => setIsUserSettingsOpen(false)} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                            theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                        }`}>Descartar</button>
                        
                        <button 
                            onClick={() => {
                                // Aquí llamaremos a userService.updateDetails en el futuro
                                setIsUserSettingsOpen(false);
                            }}
                            className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all ${
                                theme === 'dark' 
                                    ? 'bg-[#00F2FF] text-[#001a1a] shadow-[#00F2FF]/10 hover:bg-[#00f2ff]/80' 
                                    : 'bg-purple-600 text-white shadow-purple-100 hover:bg-purple-700'
                            }`}
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
}

