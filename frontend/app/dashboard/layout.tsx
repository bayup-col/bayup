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
  ExternalLink
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userEmail: authEmail, userRole: authRole, token, logout } = useAuth();
  const { theme } = useTheme();
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
      const base = `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 `;
      const subBase = `flex items-center gap-3 px-4 py-2 ml-9 rounded-xl text-xs font-bold transition-all duration-300 `;
      
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
      // BLOQUEO REAL: Si el permiso está en false, no renderizamos el componente
      const permissionKey = id.replace('m_', ''); // convertimos m_facturacion a facturacion
      if (permissions[permissionKey] === false && !isEditingMenu) return null;
      
      if (hiddenModules.includes(id) && !isEditingMenu) return null;
      
      return (
        <div className="relative group">
          <Link 
            href={href} 
            className={`${getLinkStyles(href, 'admin', isSub)} ${hiddenModules.includes(id) ? 'opacity-40' : ''}`}
          >
            {label}
          </Link>
          {isEditingMenu && (
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
  
    const renderSidebar = () => {
      if (userRole === 'super_admin') {
          return (
              <>
                <div className="p-6 border-b border-white/10">
                  <Link href="/dashboard/super-admin" className="text-2xl font-black bg-gradient-to-r from-[#004d4d] to-[#008080] bg-clip-text text-transparent">
                    Super Admin
                  </Link>
                </div>              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                <Link href="/dashboard/super-admin" className={getLinkStyles('/dashboard/super-admin', 'super')}><LayoutDashboard size={16} /> Dashboard</Link>
                <Link href="/dashboard/super-admin/empresas" className={getLinkStyles('/dashboard/super-admin/empresas', 'super')}><Store size={16} /> Empresas</Link>
                <Link href="/dashboard/super-admin/afiliados" className={getLinkStyles('/dashboard/super-admin/afiliados', 'super')}><Users2 size={16} /> Afiliados</Link>
                <Link href="/dashboard/super-admin/tesoreria" className={getLinkStyles('/dashboard/super-admin/tesoreria', 'super')}><Gem size={16} /> Tesorería</Link>
                <div className="my-2 border-t border-gray-100/10"></div>
                <Link href="/dashboard/super-admin/web-analytics" className={getLinkStyles('/dashboard/super-admin/web-analytics', 'super')}><BarChart3 size={16} /> Estadísticas Web</Link>
                <Link href="/dashboard/super-admin/marketing" className={getLinkStyles('/dashboard/super-admin/marketing', 'super')}><TrendingUp size={16} /> Marketing</Link>
                <Link href="/dashboard/super-admin/soporte" className={getLinkStyles('/dashboard/super-admin/soporte', 'super')}><MessageSquare size={16} /> Soporte</Link>
                <div className="my-2 border-t border-gray-100/10"></div>
                <Link href="/dashboard/super-admin/apis" className={getLinkStyles('/dashboard/super-admin/apis', 'super')}><Link2 size={16} /> APIs & Integraciones</Link>
                <Link href="/dashboard/super-admin/feature-flags" className={getLinkStyles('/dashboard/super-admin/feature-flags', 'super')}><Tag size={16} /> Feature Flags</Link>
                <Link href="/dashboard/super-admin/risk" className={getLinkStyles('/dashboard/super-admin/risk', 'super')}><ShieldCheck size={16} /> Riesgos & Fraude</Link>
                <div className="my-2 border-t border-gray-100/10"></div>
                <Link href="/dashboard/super-admin/legal" className={getLinkStyles('/dashboard/super-admin/legal', 'super')}><FileText size={16} /> Legal & Fiscal</Link>
                <Link href="/dashboard/super-admin/docs" className={getLinkStyles('/dashboard/super-admin/docs', 'super')}><FileText size={16} /> Documentación</Link>
                <Link href="/dashboard/super-admin/observability" className={getLinkStyles('/dashboard/super-admin/observability', 'super')}><Camera size={16} /> Observabilidad</Link>
                <Link href="/dashboard/super-admin/users" className={getLinkStyles('/dashboard/super-admin/users', 'super')}><Users size={16} /> Usuarios & Roles</Link>
                <Link href="/dashboard/super-admin/settings" className={getLinkStyles('/dashboard/super-admin/settings', 'super')}><Settings size={16} /> Configuración</Link>
              </nav>
            </>
        );
    }

    const [isRedirectingStore, setIsRedirectingStore] = useState(false);

    const handleStoreClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsRedirectingStore(true);
      setTimeout(() => {
        router.push('/dashboard/my-store');
        setTimeout(() => setIsRedirectingStore(false), 500); // Reset after navigation starts
      }, 800);
    };

    return (
        <>
            <div className="p-4 border-b border-white/10 relative">
                <div className={`backdrop-blur-md p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center transition-all duration-500 ${theme === 'dark' ? 'bg-[#002626]/40 border-[#00F2FF]/10' : 'bg-white/10 border-white/30'}`}>
                    <div className="flex flex-col items-center">
                        <span className={`text-base font-black leading-tight uppercase tracking-tighter transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {companyName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-[#004d4d]'}`}>En línea</span>
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
                            <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-[#004d4d]'}`}>
                                <ExternalLink size={14} className="opacity-80" />
                                Ver tienda online
                            </span>
                        </div>

                        {/* Subtle Outer Glow */}
                        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
                    </button>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                <div>
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Operación</p>
                    <div className="space-y-1">
                        <MenuItem href="/dashboard" label={<><LayoutDashboard size={16} className="mr-2" /> Inicio</>} id="m_inicio" />
                        <MenuItem href="/dashboard/invoicing" label={<><FileText size={16} className="mr-2" /> Facturación</>} id="m_facturacion" />
                        <MenuItem href="/dashboard/orders" label={<><Package size={16} className="mr-2" /> Pedidos</>} id="m_pedidos" />
                        <MenuItem href="/dashboard/shipping" label={<><Truck size={16} className="mr-2" /> Envíos</>} id="m_envios" />
                        
                        {(!hiddenModules.includes('m_productos') || isEditingMenu) && (
                            <div className={hiddenModules.includes('m_productos') ? 'opacity-30' : ''}>
                                <button onClick={() => setProductsOpen(!productsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/products')}`}>
                                    <span className="flex items-center gap-2 text-sm font-medium"><Store size={16} /> Productos</span>
                                    <div className="flex items-center gap-2">
                                        {isEditingMenu && <div onClick={(e) => { e.stopPropagation(); toggleModule('m_productos'); }} className={`h-4 w-4 rounded-full border-2 ${hiddenModules.includes('m_productos') ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-200'}`}></div>}
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
                                    </div>
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
                            </div>
                        )}

                        <MenuItem href="/dashboard/multiventa" label={<><Globe size={16} className="mr-2" /> Multiventa</>} id="m_multiventa" />
                        <MenuItem href="/dashboard/chats" label={<><MessageSquare size={16} className="mr-2" /> Mensajes</>} id="m_mensajes" />
                        <MenuItem href="/dashboard/customers" label={<><Users size={16} className="mr-2" /> Clientes</>} id="m_clientes" />
                        <MenuItem href="/dashboard/returns" label={<><ShieldCheck size={16} className="mr-2" /> Garantías</>} id="m_garantias" />
                    </div>
                </div>

                <div>
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Crecimiento</p>
                    <div className="space-y-1">
                        <MenuItem href="/dashboard/web-analytics" label={<><BarChart3 size={16} className="mr-2" /> Estadísticas Web</>} id="m_web_analytics" />
                        <MenuItem href="/dashboard/marketing" label={<><TrendingUp size={16} className="mr-2" /> Marketing</>} id="m_marketing" />
                        <MenuItem href="/dashboard/loyalty" label={<><Gem size={16} className="mr-2" /> Club de Puntos</>} id="m_loyalty" />
                        <MenuItem href="/dashboard/discounts" label={<><Tag size={16} className="mr-2" /> Descuentos</>} id="m_discounts" />
                        <MenuItem href="/dashboard/automations" label={<><Settings size={16} className="mr-2" /> Automatizaciones</>} id="m_automations" />
                        <MenuItem href="/dashboard/ai-assistants" label={<><Bot size={16} className="mr-2" /> Asistentes IA</>} id="m_ai_assistants" />
                    </div>
                </div>

                <div>
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Gestión</p>
                    <div className="space-y-1">
                        
                        {(!hiddenModules.includes('m_informes') || isEditingMenu) && (
                            <div className={hiddenModules.includes('m_informes') ? 'opacity-30' : ''}>
                                <button onClick={() => setReportsOpen(!reportsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/reports')}`}>
                                    <span className="flex items-center gap-2 text-sm font-medium"><BarChart3 size={16} /> Informes</span>
                                    <div className="flex items-center gap-2">
                                        {isEditingMenu && <div onClick={(e) => { e.stopPropagation(); toggleModule('m_informes'); }} className={`h-4 w-4 rounded-full border-2 ${hiddenModules.includes('m_informes') ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-200'}`}></div>}
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${reportsOpen ? 'rotate-180' : ''}`} />
                                    </div>
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
                            </div>
                        )}

                        <div>
                            <button onClick={() => setSettingsOpen(!settingsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/settings')}`}>
                                <span className="flex items-center gap-2 text-sm font-medium"><Settings size={16} /> Config. Tienda</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${settingsOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-1">
                                                                    <Link href="/dashboard/settings/general" className={getLinkStyles('/dashboard/settings/general', 'admin', true)}>Info General</Link>
                                                                    <Link href="/dashboard/settings/plan" className={getLinkStyles('/dashboard/settings/plan', 'admin', true)}>Mi Plan</Link>
                                                                    <Link href="/dashboard/settings/users" className={getLinkStyles('/dashboard/settings/users', 'admin', true)}>Staff</Link>                                </div>
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
      <div className={`relative group m-4 p-[2px] rounded-[2.5rem] overflow-hidden isolate flex-shrink-0 w-64 shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'shadow-black/40 border border-white/5' : 'shadow-[0_20px_50px_rgba(0,77,77,0.05)]'}`}>
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
          {renderSidebar()}
          <div className="p-6 mt-auto flex items-center justify-between border-t border-white/10 bg-transparent relative">
            <div 
              onClick={handleLogoClick}
              className={`text-2xl font-black italic tracking-tighter cursor-pointer w-fit relative group/logo transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-black'}`}
            >
              <span>BAY</span><InteractiveUP />
              
              <AnimatePresence>
                {showGhost && (
                  <motion.div
                    key="ghost-jump"
                    initial={{ y: 0, opacity: 0, scale: 0.5 }}
                    animate={{ 
                      y: [0, -80, 0], 
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1.5, 1.5, 1],
                      rotate: [0, 15, -15, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 1.2,
                      times: [0, 0.4, 0.8, 1],
                      ease: "easeInOut"
                    }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 pointer-events-none text-[#004d4d] drop-shadow-[0_0_15px_rgba(0,77,77,0.3)]"
                  >
                    <Ghost size={32} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => setIsEditingMenu(!isEditingMenu)} 
              className={`h-8 w-8 flex items-center justify-center rounded-xl transition-all ${isEditingMenu ? 'bg-[#004d4d] text-white shadow-lg shadow-[#004d4d]/20' : 'text-gray-300 hover:text-[#004d4d] opacity-50 hover:opacity-100 hover:bg-white/50'}`}
              title="Personalizar Menú"
            >
              <Pencil size={14} />
            </button>
          </div>
        </aside>
      </div>

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
        
        <BaytAssistant isOpen={isBaytOpen} setIsOpen={setIsBaytOpen} />
      </div>

      {isUserSettingsOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                <div className="bg-gray-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                        <User size={150} />
                    </div>
                    <button onClick={() => setIsUserSettingsOpen(false)} className="absolute top-8 right-8 h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-10">
                        <X size={20} />
                    </button>
                    
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/10">
                                {userEmail?.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-white text-gray-900 rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
                                <Camera size={18} />
                            </button>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">{userEmail?.split('@')[0]}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-purple-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{userRole?.replace('_', ' ')}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{userEmail}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex px-10 bg-gray-50 border-b border-gray-100">
                    {[
                        { id: 'profile', label: 'Mi Perfil', icon: <User size={14}/> },
                        { id: 'security', label: 'Seguridad', icon: <Lock size={14}/> },
                        { id: 'prefs', label: 'Preferencias', icon: <Globe2 size={14}/> }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t-full"></div>}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Público</label>
                                    <input type="text" defaultValue={userEmail?.split('@')[0]} className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo / Rol</label>
                                    <input type="text" value={userRole === 'admin' ? 'Administrador de Tienda' : 'Super Administrador'} disabled className="w-full p-4 bg-gray-100 border border-gray-100 text-gray-400 rounded-2xl outline-none text-sm font-bold italic" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Biografía Breve</label>
                                <textarea rows={3} placeholder="Cuéntanos un poco sobre ti..." className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-medium transition-all resize-none" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña Actual</label>
                                    <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'prefs' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Bell size={18} className="text-purple-600" />
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Notificaciones Email</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Alertas de ventas y stock</p>
                                        </div>
                                    </div>
                                    <div className="h-6 w-11 bg-purple-600 rounded-full relative flex items-center px-1 cursor-pointer">
                                        <div className="h-4 w-4 bg-white rounded-full shadow-sm translate-x-5"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare size={18} className="text-emerald-600" />
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Alertas WhatsApp</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Notificaciones en tiempo real</p>
                                        </div>
                                    </div>
                                    <div className="h-6 w-11 bg-gray-200 rounded-full relative flex items-center px-1 cursor-pointer">
                                        <div className="h-4 w-4 bg-white rounded-full shadow-sm translate-x-0"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <button onClick={() => setIsUserSettingsOpen(false)} className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 tracking-[0.2em] transition-colors">Descartar</button>
                    <button onClick={() => setIsUserSettingsOpen(false)} className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-100 active:scale-95 transition-all">Guardar Ajustes</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}