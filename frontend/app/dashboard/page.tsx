"use client";

import { useAuth } from "../../context/auth-context";
import Link from 'next/link';

export default function DashboardPage() {
  const { userEmail } = useAuth();

  // Datos de ejemplo (Mock data)
  const stats = {
    salesToday: 4250.00,
    ordersToday: 8,
    visitorsToday: 142,
  };

  const pendingTasks = {
    toShip: 5,
    toConfirmPayment: 3,
    messages: 12,
    lowStock: 2
  };

  const recentActivity = [
    { id: 1, type: 'order', user: 'Ana G.', detail: 'Nueva orden #8241', time: 'hace 5 min' },
    { id: 2, type: 'message', user: 'Carlos L.', detail: 'Preguntó por stock de Zapatillas', time: 'hace 15 min' },
    { id: 3, type: 'customer', user: 'María R.', detail: 'Se registró como cliente', time: 'hace 1 hora' },
    { id: 4, type: 'order', user: 'Roberto V.', detail: 'Pago confirmado #8239', time: 'hace 2 horas' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  // Gráfico Semanal Nativo (SVG/CSS)
  const WeeklyTrend = () => (
    <div className="h-32 w-full flex items-end justify-between gap-1 pt-4">
        {[30, 45, 25, 60, 80, 55, 90].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-purple-50 rounded-t-lg relative h-24 overflow-hidden">
                    <div 
                        className="absolute bottom-0 w-full bg-purple-500 rounded-t-lg transition-all duration-700 group-hover:bg-purple-600"
                        style={{ height: `${h}%` }}
                    ></div>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </span>
            </div>
        ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* 1. Header & Saludo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Buenos días, {userEmail?.split('@')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Esto es lo que está pasando hoy en tu tienda.</p>
        </div>
        <div className="flex gap-3">
            <Link href="/dashboard/products/new" className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
                <span>+ Producto</span>
            </Link>
            <Link href="/dashboard/discounts/new" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all shadow-md flex items-center gap-2">
                <span>Crear Descuento</span>
            </Link>
        </div>
      </div>

      {/* 2. Resumen de Métricas Hoy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Ventas de hoy</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.salesToday)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Pedidos recibidos</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.ordersToday} <span className="text-sm font-normal text-gray-400">órdenes</span></h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Visitas a la tienda</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.visitorsToday} <span className="text-sm font-normal text-gray-400">usuarios</span></h3>
        </div>
      </div>

      {/* 3. Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda */}
        <div className="lg:col-span-2 space-y-8">
            {/* Pendientes */}
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    Acción Requerida
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/dashboard/orders" className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-purple-200 transition-all group">
                        <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold group-hover:bg-amber-100">📦</div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingTasks.toShip}</p>
                            <p className="text-sm text-gray-500">Pedidos por despachar</p>
                        </div>
                    </Link>
                    
                    <Link href="/dashboard/marketing" className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-purple-200 transition-all group">
                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-100">💬</div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingTasks.messages}</p>
                            <p className="text-sm text-gray-500">Mensajes sin responder</p>
                        </div>
                    </Link>

                    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 font-bold">💳</div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingTasks.toConfirmPayment}</p>
                            <p className="text-sm text-gray-500">Pagos pendientes</p>
                        </div>
                    </div>

                    <Link href="/dashboard/inventory" className="p-5 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4 hover:border-rose-200 transition-all group">
                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm font-bold group-hover:shadow-md transition-all">⚠️</div>
                        <div>
                            <p className="text-2xl font-bold text-rose-700">{pendingTasks.lowStock}</p>
                            <p className="text-sm text-rose-600">Alertas de Stock Bajo</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Gráfica Semanal (Agregada encima del banner) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Ventas de la semana</h2>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Tendencia: +15.4%</span>
                </div>
                <WeeklyTrend />
            </div>

            {/* Banner Informativo */}
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white overflow-hidden relative group">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold">¡Tu tienda está creciendo! 🚀</h3>
                    <p className="text-indigo-100 mt-2 max-w-md text-sm">
                        Has tenido un 20% más de visitas que la semana pasada. Considera crear un cupón de descuento.
                    </p>
                    <button className="mt-4 bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all">
                        Ver sugerencias
                    </button>
                </div>
                <div className="absolute -bottom-10 -right-10 text-9xl opacity-10 rotate-12 transition-transform duration-700">
                    📈
                </div>
            </div>
        </div>

        {/* Columna Derecha: Actividad Reciente */}
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">Actividad Reciente</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-2">
                    {recentActivity.map((act) => (
                        <div key={act.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm border ${
                                act.type === 'order' ? 'bg-green-50 text-green-600 border-green-100' :
                                act.type === 'message' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                'bg-purple-50 text-purple-600 border-purple-100'
                            }`}>
                                {act.type === 'order' ? '🛒' : act.type === 'message' ? '💬' : '👤'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{act.user}</p>
                                <p className="text-xs text-gray-500 truncate">{act.detail}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{act.time}</span>
                        </div>
                    ))}
                </div>
                <button className="w-full p-4 text-center text-xs font-bold text-purple-600 border-t border-gray-50 hover:bg-gray-50 transition-colors uppercase tracking-wider">
                    Ver todo el historial
                </button>
            </div>

            {/* Tip del día */}
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-xs font-bold text-amber-800 uppercase">Tip del día 💡</p>
                <p className="text-sm text-amber-900 mt-2">
                    Responder rápido aumenta tus ventas considerablemente.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}
