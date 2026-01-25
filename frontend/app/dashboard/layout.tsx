"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardHeader } from '@/components/dashboard/Header';
import { SupportWidget } from '@/components/dashboard/SupportWidget';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout, userEmail, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [productsOpen, setProductsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessages] = useState([{ id: 1, text: "¡Hola! 👋 Soy el asistente de soporte de Bayup. ¿En qué puedo ayudarte hoy?", sender: 'bot' }]);

  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hidden_modules');
    if (saved) setHiddenModules(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (pathname.includes('/dashboard/products') || pathname.includes('/dashboard/collections') || pathname.includes('/dashboard/inventory') || pathname.includes('/dashboard/catalogs')) { setProductsOpen(true); }
    if (pathname.includes('/dashboard/settings')) { setSettingsOpen(true); }
    if (pathname.includes('/dashboard/reports')) { setReportsOpen(true); }
  }, [pathname]);

  const toggleModule = (id: string) => {
    const next = hiddenModules.includes(id) ? hiddenModules.filter(m => m !== id) : [...hiddenModules, id];
    setHiddenModules(next);
    localStorage.setItem('hidden_modules', JSON.stringify(next));
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const getLinkStyles = (path: string, type: 'admin' | 'super' = 'admin', isSubItem = false) => {
    const active = isActive(path);
    const baseClasses = `block rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${isSubItem ? 'px-4 py-2 text-sm ml-4' : 'px-4 py-2.5'} `;
    if (type === 'super') return baseClasses + (active ? 'bg-red-50 text-red-700 font-bold border border-red-100/50 shadow-sm' : 'text-slate-500 hover:bg-gray-50 hover:text-red-600 border border-transparent hover:shadow-sm');
    return baseClasses + (active ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100/50 shadow-sm' : 'text-slate-500 hover:bg-gray-50 hover:text-purple-600 border border-transparent hover:shadow-sm');
  };

  const MenuItem = ({ href, label, id, isSub = false }: { href: string, label: string, id: string, isSub?: boolean }) => {
    const isHidden = hiddenModules.includes(id);
    if (isHidden && !isEditingMenu) return null;

    return (
        <div className="relative group/item flex items-center">
            <Link href={href} className={`flex-1 ${getLinkStyles(href, 'admin', isSub)} ${isHidden ? 'opacity-30 grayscale' : ''}`}>
                {label}
            </Link>
            {isEditingMenu && (
                <button 
                    onClick={(e) => { e.preventDefault(); toggleModule(id); }}
                    className={`absolute right-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isHidden ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-200'}`}
                >
                    {isHidden && <span className="text-white text-[8px]">✕</span>}
                </button>
            )}
        </div>
    );
  };

  const renderSidebar = () => {
    if (userRole === 'super_admin') {
        return (
            <>
              <div className="p-6 border-b border-white/10"><Link href="/dashboard/super-admin" className="text-2xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Super Admin</Link></div>
              <nav className="flex-1 px-4 py-6 space-y-2">
                <Link href="/dashboard/super-admin" className={getLinkStyles('/dashboard/super-admin', 'super')}>📊 Dashboard</Link>
                <Link href="/dashboard/super-admin/comercial" className={getLinkStyles('/dashboard/super-admin/comercial', 'super')}>📊 Comercial</Link>
                <Link href="/dashboard/super-admin/clientes" className={getLinkStyles('/dashboard/super-admin/clientes', 'super')}>👥 Clientes</Link>
                <Link href="/dashboard/super-admin/ventas" className={getLinkStyles('/dashboard/super-admin/ventas', 'super')}>💰 Ventas</Link>
                <Link href="/dashboard/super-admin/afiliados" className={getLinkStyles('/dashboard/super-admin/afiliados', 'super')}>🤝 Afiliados</Link>
                <Link href="/dashboard/super-admin/roles" className={getLinkStyles('/dashboard/super-admin/roles', 'super')}>🔐 Usuarios</Link>
                <Link href="/dashboard/super-admin/reports" className={getLinkStyles('/dashboard/super-admin/reports', 'super')}>📈 Informes</Link>
              </nav>
            </>
        );
    }

    return (
        <>
            <div className="p-4 border-b border-white/10 relative">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-[2rem] border border-white/30 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                            <span className="text-xl font-bold">B</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 leading-tight">Mi Tienda</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">En línea</span>
                            </div>
                        </div>
                    </div>
                    <Link href="/dashboard/my-store" className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-purple-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm active:scale-95 group/store">
                        <span>Ver tienda online</span>
                        <svg className="w-3 h-3 group-hover/store:translate-x-0.5 group-hover/store:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Link>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                <div>
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Operación</p>
                    <div className="space-y-1">
                        <MenuItem href="/dashboard" label="🏠 Inicio" id="m_inicio" />
                        <MenuItem href="/dashboard/invoicing" label="🧾 Facturación" id="m_facturacion" />
                        <MenuItem href="/dashboard/orders" label="📦 Pedidos" id="m_pedidos" />
                        <MenuItem href="/dashboard/shipping" label="🚚 Envíos" id="m_envios" />
                        
                        {!hiddenModules.includes('m_productos') || isEditingMenu ? (
                            <div className={hiddenModules.includes('m_productos') ? 'opacity-30' : ''}>
                                <button onClick={() => setProductsOpen(!productsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/products')}`}>
                                    <span className="flex items-center gap-2 text-sm font-medium">🛍️ Productos</span>
                                    <div className="flex items-center gap-2">
                                        {isEditingMenu && <div onClick={(e) => { e.stopPropagation(); toggleModule('m_productos'); }} className={`h-4 w-4 rounded-full border-2 ${hiddenModules.includes('m_productos') ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-200'}`}></div>}
                                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${productsOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                    <div className="space-y-1">
                                        <MenuItem href="/dashboard/products" label="Todos los productos" id="s_products_all" isSub />
                                        <MenuItem href="/dashboard/collections" label="Colecciones" id="s_collections" isSub />
                                        <MenuItem href="/dashboard/inventory" label="Inventario" id="s_inventory" isSub />
                                        <MenuItem href="/dashboard/catalogs" label="Catálogos WhatsApp" id="s_catalogs" isSub />
                                        <MenuItem href="/dashboard/products/separados" label="Separados (IA)" id="s_separados" isSub />
                                        <MenuItem href="/dashboard/products/cotizaciones" label="Cotizaciones" id="s_cotizaciones" isSub />
                                        <MenuItem href="/dashboard/products/bodegas" label="Bodegas & Stock" id="s_bodegas" isSub />
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <MenuItem href="/dashboard/multiventa" label="🌐 Multiventa" id="m_multiventa" />
                        <MenuItem href="/dashboard/chats" label="💬 Mensajes" id="m_mensajes" />
                        <MenuItem href="/dashboard/links" label="🔗 Link de pago" id="m_links" />
                        <MenuItem href="/dashboard/customers" label="👥 Clientes" id="m_clientes" />
                        <MenuItem href="/dashboard/returns" label="🛡️ Garantías" id="m_garantias" />
                    </div>
                </div>

                <div>
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Crecimiento</p>
                    <div className="space-y-1">
                        <MenuItem href="/dashboard/marketing" label="📢 Marketing" id="m_marketing" />
                        <MenuItem href="/dashboard/loyalty" label="💎 Club de Puntos" id="m_loyalty" />
                        <MenuItem href="/dashboard/discounts" label="🏷️ Descuentos" id="m_discounts" />
                        <MenuItem href="/dashboard/automations" label="⚙️ Automatizaciones" id="m_automations" />
                    </div>
                </div>

                <div>
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Gestión</p>
                    <div className="space-y-1">
                        <MenuItem href="/dashboard/payroll" label="👥 Nómina" id="m_payroll" />
                        
                        {!hiddenModules.includes('m_informes') || isEditingMenu ? (
                            <div className={hiddenModules.includes('m_informes') ? 'opacity-30' : ''}>
                                <button onClick={() => setReportsOpen(!reportsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/reports')}`}>
                                    <span className="flex items-center gap-2 text-sm font-medium">📊 Informes</span>
                                    <div className="flex items-center gap-2">
                                        {isEditingMenu && <div onClick={(e) => { e.stopPropagation(); toggleModule('m_informes'); }} className={`h-4 w-4 rounded-full border-2 ${hiddenModules.includes('m_informes') ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-200'}`}></div>}
                                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${reportsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${reportsOpen ? 'max-h-80 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                    <div className="space-y-1">
                                        <MenuItem href="/dashboard/reports" label="Análisis General" id="s_reports_gen" isSub />
                                        <MenuItem href="/dashboard/reports/sucursales" label="Sucursales" id="s_sucursales" isSub />
                                        <MenuItem href="/dashboard/reports/vendedores" label="Vendedores" id="s_vendedores" isSub />
                                        <MenuItem href="/dashboard/reports/cuentas" label="Cuentas y Cartera" id="s_cuentas" isSub />
                                        <MenuItem href="/dashboard/reports/gastos" label="Control de Gastos" id="s_gastos" isSub />
                                        <MenuItem href="/dashboard/reports/comisiones" label="Liquidación de Comisiones" id="s_comisiones" isSub />
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div>
                            <button onClick={() => setSettingsOpen(!settingsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/settings')}`}>
                                <span className="flex items-center gap-2 text-sm font-medium">⚙️ Config. Tienda</span>
                                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${settingsOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-1">
                                    <Link href="/dashboard/settings/general" className={getLinkStyles('/dashboard/settings/general', 'admin', true)}>Info General</Link>
                                    <Link href="/dashboard/settings/plan" className={getLinkStyles('/dashboard/settings/plan', 'admin', true)}>Mi Plan</Link>
                                    <Link href="/dashboard/settings/billing" className={getLinkStyles('/dashboard/settings/billing', 'admin', true)}>Facturación</Link>
                                    <Link href="/dashboard/settings/users" className={getLinkStyles('/dashboard/settings/users', 'admin', true)}>Staff</Link>
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
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
      `}</style>
      
      <aside className="w-64 flex-shrink-0 m-4 rounded-[2.5rem] backdrop-blur-3xl bg-white/20 border border-white/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col overflow-y-auto custom-scrollbar z-20 transition-all duration-500 hover:bg-white/30">
        {renderSidebar()}
        <div className="p-6 mt-auto flex items-center justify-between border-t border-white/10 bg-transparent">
          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none block">Bayup Admin</span>
          <button 
            onClick={() => setIsEditingMenu(!isEditingMenu)} 
            className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all ${isEditingMenu ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:text-purple-600 opacity-50 hover:opacity-100'}`}
            title="Personalizar Menú"
          >
            ✎
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <DashboardHeader 
            pathname={pathname} 
            userEmail={userEmail} 
            userRole={userRole} 
            userMenuOpen={userMenuOpen} 
            setUserMenuOpen={setUserMenuOpen} 
            logout={logout} 
            setIsUserSettingsOpen={setIsUserSettingsOpen} 
        />
        <main className="flex-1 overflow-y-auto py-8 px-8 custom-scrollbar">{children}</main>
        <SupportWidget 
            isSupportOpen={isSupportOpen} 
            setIsSupportOpen={setIsSupportOpen} 
            supportMessages={supportMessages} 
        />
      </div>

      {isUserSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white relative">
                    <button onClick={() => setIsUserSettingsOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">✕</button>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl border border-white/10">👤</div>
                        <div><h2 className="text-xl font-black tracking-tight">Mi Cuenta</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ajustes Personales</p></div>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label><input type="text" defaultValue={userEmail?.split('@')[0]} className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" /></div>
                        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label><input type="email" value={userEmail || ''} disabled className="w-full mt-1 p-3 bg-gray-100 border border-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed italic" /></div>
                    </div>
                    <div className="p-8 pt-0"><button onClick={() => setIsUserSettingsOpen(false)} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Guardar Cambios</button></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}