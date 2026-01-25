"use client";

import { useAuth } from "@/context/auth-context";
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
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* 1. Header & Saludo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">¡Hola de nuevo! 👋</h1>
          <p className="text-gray-500 mt-2 font-medium">Esto es lo que está pasando en <span className="text-purple-600 font-bold">tu tienda</span> hoy.</p>
        </div>
        <div className="flex gap-3">
            <Link href="/dashboard/products/new" className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
                <span>+ Nuevo Producto</span>
            </Link>
            <Link href="/dashboard/discounts/new" className="px-5 py-2.5 bg-purple-600 text-white rounded-2xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center gap-2">
                <span>Crear Descuento</span>
            </Link>
        </div>
      </div>

      {/* 2. Resumen de Métricas Hoy */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Métrica Principal */}
        <div className="md:col-span-2 bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2rem] shadow-xl shadow-purple-100 relative overflow-hidden group">
            <div className="relative z-10">
                <p className="text-sm font-bold text-purple-100 uppercase tracking-widest">Ventas de hoy</p>
                <h3 className="text-4xl font-black text-white mt-2">{formatCurrency(stats.salesToday)}</h3>
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-bold bg-white/20 text-white px-2 py-1 rounded-lg backdrop-blur-md">↑ 12% vs ayer</span>
                </div>
            </div>
            {/* Decoración sutil */}
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700">💰</div>
        </div>
        
        {/* Métricas Secundarias */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pedidos</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.ordersToday}</h3>
            <p className="text-xs font-medium text-emerald-500 mt-2">Recibidos hoy</p>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visitas</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.visitorsToday}</h3>
            <p className="text-xs font-medium text-purple-500 mt-2">Usuarios activos</p>
        </div>
      </div>

      {/* 3. Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Columna Izquierda */}
        <div className="lg:col-span-2 space-y-10">
            {/* Acción Requerida */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                        Acción Requerida
                        <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
                    </h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{Object.values(pendingTasks).reduce((a, b) => a + b, 0)} Pendientes</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl shadow-sm">📦</div>
                            <span className="text-2xl font-black text-gray-900">{pendingTasks.toShip}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-gray-900">Pedidos por despachar</p>
                            <p className="text-xs text-gray-500 mt-1">Tienes envíos pendientes de procesar.</p>
                            <Link href="/dashboard/orders" className="mt-4 inline-flex items-center text-xs font-black text-purple-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Despachar ahora <span className="text-sm">→</span>
                            </Link>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl shadow-sm">💬</div>
                            <span className="text-2xl font-black text-gray-900">{pendingTasks.messages}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-gray-900">Mensajes de clientes</p>
                            <p className="text-xs text-gray-500 mt-1">Nuevas consultas en tus canales.</p>
                            <Link href="/dashboard/chats" className="mt-4 inline-flex items-center text-xs font-black text-purple-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Ir a mensajes <span className="text-sm">→</span>
                            </Link>
                        </div>
                    </div>

                    <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 flex flex-col justify-between group">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">⚠️</div>
                            <span className="text-2xl font-black text-rose-700">{pendingTasks.lowStock}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-rose-900">Alertas de Stock</p>
                            <p className="text-xs text-rose-600/70 mt-1">Productos que están por agotarse.</p>
                            <Link href="/dashboard/inventory" className="mt-4 inline-flex items-center text-xs font-black text-rose-700 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Revisar inventario <span className="text-sm">→</span>
                            </Link>
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex flex-col justify-between group">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">💳</div>
                            <span className="text-2xl font-black text-emerald-700">{pendingTasks.toConfirmPayment}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-emerald-900">Pagos por confirmar</p>
                            <p className="text-xs text-emerald-600/70 mt-1">Transferencias pendientes de validación.</p>
                            <Link href="/dashboard/orders" className="mt-4 inline-flex items-center text-xs font-black text-emerald-700 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Validar pagos <span className="text-sm">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tendencia Semanal */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Ventas de la semana</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Rendimiento en tiempo real</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">Tendencia: +15.4%</span>
                </div>
                <WeeklyTrend />
            </div>
        </div>

        {/* Columna Derecha: Actividad Reciente */}
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900">Actividad</h2>
                <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Ver Todo</button>
            </div>
            
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-4 space-y-1">
                    {recentActivity.map((act) => (
                        <div key={act.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-110 ${
                                act.type === 'order' ? 'bg-emerald-50 text-emerald-600' :
                                act.type === 'message' ? 'bg-blue-50 text-blue-600' :
                                'bg-purple-50 text-purple-600'
                            }`}>
                                {act.type === 'order' ? '🛒' : act.type === 'message' ? '💬' : '👤'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{act.user}</p>
                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{act.detail}</p>
                            </div>
                            <span className="text-[10px] font-bold text-gray-300 whitespace-nowrap">{act.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tip del día Premium */}
            <div className="p-8 bg-gray-900 rounded-[2rem] text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Tip de Crecimiento</p>
                    <p className="text-sm font-bold mt-3 leading-relaxed">
                        "Las tiendas que responden en menos de 15 min. cierran un <span className="text-purple-400 font-black">40% más de ventas</span>."
                    </p>
                    <button className="mt-6 text-xs font-black text-white bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-all">
                        Saber más
                    </button>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:rotate-12 transition-transform">💡</div>
            </div>
        </div>

      </div>
    </div>
  );
}
