"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout, userEmail, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Estado para el nombre de la empresa (Dinámico)
  const [storeName, setStoreName] = useState("Mi Empresa");

  // Estados para submenús y modales
  const [productsOpen, setProductsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

  // Simulación de carga de nombre de empresa (esto vendría de una API o Contexto)
  useEffect(() => {
    // Por ahora lo tomamos de la primera parte del email o un valor guardado
    const savedName = localStorage.getItem('storeName');
    if (savedName) {
        setStoreName(savedName);
    } else {
        setStoreName(userEmail?.split('@')[0] || "Mi Empresa");
    }
  }, [userEmail]);

  // Auto-expandir menús según la ruta
  useEffect(() => {
    if (pathname.includes('/dashboard/products') || pathname.includes('/dashboard/collections') || pathname.includes('/dashboard/inventory') || pathname.includes('/dashboard/catalogs')) {
      setProductsOpen(true);
    }
    if (pathname.includes('/dashboard/settings')) {
      setSettingsOpen(true);
    }
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const getLinkStyles = (path: string, type: 'admin' | 'super' = 'admin', isSubItem = false) => {
    const active = isActive(path);
    const baseClasses = `block rounded-xl transition-all duration-200 backdrop-blur-sm border transform ${isSubItem ? 'px-4 py-2 text-sm ml-4' : 'px-4 py-3'} `;
    
    if (type === 'super') {
      return baseClasses + (active 
        ? 'bg-red-50 text-red-700 border-red-100 scale-[1.02] shadow-sm font-semibold' 
        : 'text-slate-700 hover:bg-white/30 hover:text-red-700 border-transparent hover:border-white/40 hover:scale-[1.02]');
    }

    return baseClasses + (active 
      ? 'bg-purple-100/80 text-purple-800 border-purple-200/50 scale-[1.02] shadow-sm font-semibold' 
      : 'text-slate-700 hover:bg-white/30 hover:text-purple-700 border-transparent hover:border-white/40 hover:scale-[1.02]');
  };

  // --- MODAL: CONFIGURACIÓN DE USUARIO ---
  const UserSettingsModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white relative">
                <button onClick={() => setIsUserSettingsOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">✕</button>
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl border border-white/10">👤</div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">Mi Cuenta</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ajustes Personales</p>
                    </div>
                </div>
            </div>
            <div className="p-8 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                        <input type="text" defaultValue={userEmail?.split('@')[0]} className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                        <input type="email" value={userEmail || ''} disabled className="w-full mt-1 p-3 bg-gray-100 border border-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed" />
                    </div>
                </div>
                <div className="p-8 pt-0">
                    <button onClick={() => setIsUserSettingsOpen(false)} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Guardar Cambios</button>
                </div>
            </div>
        </div>
    </div>
  );

  // --- COMPONENTE: HEADER ---
  const DashboardHeader = () => (
    <header className="h-16 flex-shrink-0 bg-white/70 backdrop-blur-lg border-b border-white/20 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{storeName}</span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-gray-600 capitalize">{pathname.split('/').pop()?.replace('-', ' ')}</span>
        </div>
        <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-purple-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-3 pl-4 border-l border-gray-100 group">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-gray-900 leading-none">{userEmail?.split('@')[0]}</p>
                        <p className="text-[10px] font-bold text-purple-500 mt-1 uppercase tracking-tighter italic">{userRole === 'super_admin' ? 'Super Admin' : 'Plan Pro'}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg group-hover:scale-105 transition-transform">
                        {userEmail?.charAt(0).toUpperCase()}
                    </div>
                </button>
                {userMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <button onClick={() => { setUserMenuOpen(false); setIsUserSettingsOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors font-bold text-left"><span className="text-lg">👤</span> Usuario</button>
                            <div className="h-px bg-gray-50 my-1 mx-2"></div>
                            <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-bold text-left"><span className="text-lg">🚪</span> Cerrar Sesión</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    </header>
  );

  // --- CONTENEDOR MAESTRO ---
  const MainLayout = ({ sidebar }: { sidebar: ReactNode }) => (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden">
      <aside className="w-64 flex-shrink-0 m-4 rounded-2xl backdrop-blur-md bg-white border border-gray-200/50 shadow-2xl flex flex-col overflow-y-auto custom-scrollbar z-20">{sidebar}</aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto py-8 px-8 custom-scrollbar">{children}</main>
      </div>
      {isUserSettingsOpen && <UserSettingsModal />}
    </div>
  );

  // --- VISTA SUPER ADMIN ---
  if (userRole === 'super_admin') {
    return (
      <MainLayout sidebar={
        <>
          <div className="p-6 border-b border-white/10"><Link href="/dashboard/super-admin" className="text-2xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Super Admin</Link></div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link href="/dashboard/super-admin" className={getLinkStyles('/dashboard/super-admin', 'super')}>📊 Dashboard</Link>
            <Link href="/dashboard/super-admin/clientes" className={getLinkStyles('/dashboard/super-admin/clientes', 'super')}>👥 Clientes</Link>
            <Link href="/dashboard/super-admin/ventas" className={getLinkStyles('/dashboard/super-admin/ventas', 'super')}>💰 Ventas</Link>
            <Link href="/dashboard/super-admin/roles" className={getLinkStyles('/dashboard/super-admin/roles', 'super')}>Usuarios</Link>
          </nav>
          <div className="p-4 mt-auto text-center"><span className="text-[10px] text-gray-400 font-bold uppercase">Bayup Admin v1.0</span></div>
        </>
      } />
    );
  }

  // --- VISTA ADMIN TIENDA ---
  return (
    <MainLayout sidebar={
      <>
        <div className="p-6 border-b border-gray-100">
          <Link href="/dashboard" className="text-2xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent truncate block">
            {storeName}
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="pb-4 mb-2 border-b border-gray-100">
            <Link href="/dashboard/my-store" className={`block px-4 py-3 rounded-xl transition-all duration-200 border flex items-center justify-between group transform hover:scale-[1.05] ${pathname === '/dashboard/my-store' ? 'bg-purple-600 text-white border-purple-500 shadow-lg scale-[1.05]' : 'bg-purple-100/50 text-purple-900 border-purple-200/30 hover:bg-purple-200/50'}`}><span className="font-bold text-sm">🏪 Mi Tienda</span><span className={`text-lg transition-opacity ${pathname === '/dashboard/my-store' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>↗</span></Link>
          </div>
          <Link href="/dashboard" className={getLinkStyles('/dashboard')}>🏠 Inicio</Link>
          <Link href="/dashboard/orders" className={getLinkStyles('/dashboard/orders')}>📦 Pedidos</Link>
          <div>
              <button onClick={() => setProductsOpen(!productsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/products')}`}>
                  <span className="flex items-center gap-2 text-sm">🛍️ Productos</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${productsOpen ? 'max-h-56 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}><div className="space-y-1"><Link href="/dashboard/products" className={getLinkStyles('/dashboard/products', 'admin', true)}>🏷️ Todos los productos</Link><Link href="/dashboard/collections" className={getLinkStyles('/dashboard/collections', 'admin', true)}>📂 Colecciones</Link><Link href="/dashboard/inventory" className={getLinkStyles('/dashboard/inventory', 'admin', true)}>📋 Inventario</Link><Link href="/dashboard/catalogs" className={getLinkStyles('/dashboard/catalogs', 'admin', true)}>📱 Catálogos WhatsApp</Link></div></div>
          </div>
          <Link href="/dashboard/chats" className={getLinkStyles('/dashboard/chats')}>💬 Mensajes</Link>
          <Link href="/dashboard/customers" className={getLinkStyles('/dashboard/customers')}>👥 Clientes</Link>
          <Link href="/dashboard/marketing" className={getLinkStyles('/dashboard/marketing')}>📢 Marketing</Link>
          <Link href="/dashboard/discounts" className={getLinkStyles('/dashboard/discounts')}>🏷️ Descuentos</Link>
          <Link href="/dashboard/reports" className={getLinkStyles('/dashboard/reports')}>📊 Informes</Link>
          <div>
              <button onClick={() => setSettingsOpen(!settingsOpen)} className={`w-full flex items-center justify-between text-left ${getLinkStyles('/dashboard/settings')}`}>
                  <span className="flex items-center gap-2 text-sm">⚙️ Config. Tienda</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${settingsOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}><div className="space-y-1"><Link href="/dashboard/settings/general" className={getLinkStyles('/dashboard/settings/general', 'admin', true)}>ℹ️ Info General</Link><Link href="/dashboard/settings/plan" className={getLinkStyles('/dashboard/settings/plan', 'admin', true)}>💎 Mi Plan</Link><Link href="/dashboard/settings/billing" className={getLinkStyles('/dashboard/settings/billing', 'admin', true)}>💳 Facturación</Link><Link href="/dashboard/settings/users" className={getLinkStyles('/dashboard/settings/users', 'admin', true)}>👥 Usuarios / Staff</Link></div></div>
          </div>
        </nav>
        <div className="p-4 mt-auto text-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none block">{storeName}</span><span className="text-[8px] text-gray-300 font-medium">Powered by Bayup</span></div>
      </>
    } />
  );
}