"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout, userEmail, userRole } = useAuth();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Si es super_admin, redirigir automáticamente a su dashboard
    if (userRole === 'super_admin') {
      router.push('/dashboard/super-admin');
    }
  }, [userRole, router]);

  // Si es super_admin, mostrar el layout de super_admin en lugar del normal
  if (userRole === 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100 flex">
        {/* Sidebar - Super Admin */}
        <aside className="w-64 m-4 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl flex flex-col hover:shadow-purple-500/20 transition-all duration-300">
          <div className="p-6 border-b border-white/10">
            <Link href="/dashboard/super-admin" className="text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              Super Admin
            </Link>
            <p className="text-xs text-slate-500 mt-1">Sistema Bayup</p>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              href="/dashboard/super-admin"
              className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/dashboard/super-admin/clientes"
              className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
            >
              👥 Clientes
            </Link>
            <Link
              href="/dashboard/super-admin/ventas"
              className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
            >
              💰 Ventas
            </Link>
            <Link
              href="/dashboard/super-admin/roles"
              className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
            >
              � Usuarios
            </Link>
            <Link
              href="/dashboard/super-admin/afiliados"
              className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
            >
              🤝 Afiliados
            </Link>
          </nav>

          {/* Settings Section */}
          <div className="border-t border-white/10 p-4 space-y-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40 text-left flex items-center justify-between"
            >
              <span>⚙️ Configuraciones</span>
              <span className={`transform transition-transform ${settingsOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {settingsOpen && (
              <div className="pl-4 space-y-2 bg-white/10 rounded-lg p-2 border border-white/20">
                <Link
                  href="/dashboard/super-admin/configuraciones/planes"
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200"
                >
                  📋 Planes
                </Link>
                <Link
                  href="/dashboard/super-admin/configuraciones/sistema"
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200"
                >
                  🔧 Sistema
                </Link>
                <Link
                  href="/dashboard/super-admin/configuraciones/comisiones"
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-white/30 hover:text-red-700 transition-all duration-200"
                >
                  💳 Comisiones
                </Link>
              </div>
            )}

            {/* User Section */}
            <div className="border-t border-white/10 pt-4 mt-4">
              {userEmail && (
                <div className="text-xs text-slate-600 mb-3 px-2 truncate">
                  {userEmail}
                </div>
              )}
              <button
                onClick={logout}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-500/70 to-pink-500/70 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 text-sm font-medium backdrop-blur-sm border border-white/20 hover:border-white/30"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 py-8 px-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Layout normal para admin_tienda
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100 flex">
      {/* Sidebar - Glass Morphism */}
      <aside className="w-64 m-4 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl flex flex-col hover:shadow-purple-500/20 transition-all duration-300">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Dashboard
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/dashboard/products"
            className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-purple-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
          >
            Productos
          </Link>
          <Link
            href="/dashboard/orders"
            className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-purple-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
          >
            Órdenes
          </Link>
          <Link
            href="/dashboard/pages"
            className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-purple-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
          >
            Páginas
          </Link>
          <Link
            href="/dashboard/settings/taxes"
            className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-purple-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
          >
            Impuestos
          </Link>
          <Link
            href="/dashboard/settings/shipping"
            className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-white/30 hover:text-purple-700 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-white/40"
          >
            Envíos
          </Link>
        </nav>

        {/* User Section */}
        <div className="border-t border-white/10 p-4">
          {userEmail && (
            <div className="text-xs text-slate-600 mb-3 px-2 truncate">
              {userEmail}
            </div>
          )}
          <button
            onClick={logout}
            className="w-full px-4 py-2 bg-gradient-to-r from-red-500/70 to-pink-500/70 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 text-sm font-medium backdrop-blur-sm border border-white/20 hover:border-white/30"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 py-8 px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
