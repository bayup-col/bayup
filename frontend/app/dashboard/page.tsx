"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth-context";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Search, Sparkles, Users } from 'lucide-react';

export default function DashboardPage() {
  const { userEmail } = useAuth();

  // Estado para actividad en tiempo real (Limitado a 4)
  const [activities, setActivities] = useState([
    { id: 1, type: 'order', user: 'Ana G.', detail: 'Nueva orden #8241', time: 'hace 5 min' },
    { id: 2, type: 'message', user: 'Carlos L.', detail: 'Preguntó por stock de Zapatillas', time: 'hace 15 min' },
    { id: 3, type: 'customer', user: 'María R.', detail: 'Se registró como cliente', time: 'hace 1 hora' },
    { id: 4, type: 'order', user: 'Roberto V.', detail: 'Pago confirmado #8239', time: 'hace 2 horas' },
  ]);

  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);

  const growthTips = [
    { module: 'Facturación', icon: '💳', tip: 'Ofrecer pagos en cuotas aumenta la tasa de conversión en un 35% en productos de alto valor.' },
    { module: 'Inventario', icon: '📦', tip: 'Mantener un stock de seguridad del 10% evita perder ventas por quiebres inesperados.' },
    { module: 'Marketing', icon: '🚀', tip: 'Los cupones de descuento personalizados para clientes inactivos recuperan hasta el 20% de usuarios perdidos.' },
    { module: 'Clientes', icon: '👤', tip: 'Llamar a tus clientes por su nombre (como hace Bayt) genera un vínculo de lealtad un 50% más fuerte.' },
    { module: 'Envíos', icon: '🚚', tip: 'El 60% de los carritos abandonados se debe a costos de envío inesperados. Intenta incluirlos en el precio base.' },
  ];

  // Simulación de llegada de nueva actividad cada 8 segundos (solo para demo visual)
  useEffect(() => {
    const types = ['order', 'message', 'customer'] as const;
    const names = ['Juan K.', 'Elena M.', 'Santi P.', 'Laura O.', 'Mateo D.'];
    const details = {
        order: 'Nueva venta generada',
        message: 'Mensaje nuevo en WhatsApp',
        customer: 'Cliente nuevo registrado'
    };

    const interval = setInterval(() => {
        const type = types[Math.floor(Math.random() * types.length)];
        const newAct = {
            id: Date.now(),
            type,
            user: names[Math.floor(Math.random() * names.length)],
            detail: details[type],
            time: 'Recién ahora'
        };
        
        setActivities(prev => [newAct, ...prev.slice(0, 3)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Datos de ejemplo
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
            <Link href="/dashboard/products" className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
                <span>+ Nuevo Producto</span>
            </Link>
            <Link href="/dashboard/discounts" className="px-5 py-2.5 bg-purple-600 text-white rounded-2xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center gap-2">
                <span>Crear Descuento</span>
            </Link>
        </div>
      </div>

      {/* 2. Resumen de Métricas Hoy */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Métrica Principal */}
        <div className="md:col-span-2 bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2rem] shadow-xl shadow-purple-100 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
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
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col justify-center hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-purple-500 transition-colors">Pedidos</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.ordersToday}</h3>
            <p className="text-xs font-medium text-emerald-500 mt-2">Recibidos hoy</p>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col justify-center hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-purple-500 transition-colors">Visitas</p>
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
                    <Link href="/dashboard/orders" className="p-6 bg-white rounded-3xl shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">📦</div>
                            <span className="text-2xl font-black text-gray-900">{pendingTasks.toShip}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-gray-900">Pedidos por despachar</p>
                            <p className="text-xs text-gray-500 mt-1">Tienes envíos pendientes de procesar.</p>
                            <div className="mt-4 inline-flex items-center text-xs font-black text-purple-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Despachar ahora <span className="text-sm">→</span>
                            </div>
                        </div>
                    </Link>
                    
                    <Link href="/dashboard/chats" className="p-6 bg-white rounded-3xl shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">💬</div>
                            <span className="text-2xl font-black text-gray-900">{pendingTasks.messages}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-gray-900">Mensajes de clientes</p>
                            <p className="text-xs text-gray-500 mt-1">Nuevas consultas en tus canales.</p>
                            <div className="mt-4 inline-flex items-center text-xs font-black text-purple-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Ir a mensajes <span className="text-sm">→</span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/inventory" className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">⚠️</div>
                            <span className="text-2xl font-black text-rose-700">{pendingTasks.lowStock}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-rose-900">Alertas de Stock</p>
                            <p className="text-xs text-rose-600/70 mt-1">Productos que están por agotarse.</p>
                            <div className="mt-4 inline-flex items-center text-xs font-black text-rose-700 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Revisar inventario <span className="text-sm">→</span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/orders" className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">💳</div>
                            <span className="text-2xl font-black text-emerald-700">{pendingTasks.toConfirmPayment}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-emerald-900">Pagos por confirmar</p>
                            <p className="text-xs text-emerald-600/70 mt-1">Transferencias pendientes de validación.</p>
                            <div className="mt-4 inline-flex items-center text-xs font-black text-emerald-700 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Validar pagos <span className="text-sm">→</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Tendencia Semanal */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 hover:scale-[1.01] transition-all duration-300">
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
                <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline">Ver Todo</button>
            </div>
            
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden hover:scale-[1.02] transition-all duration-300">
                <div className="p-4 flex flex-col min-h-[340px] relative">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {activities.map((act) => (
                            <motion.div 
                                key={act.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 40,
                                    opacity: { duration: 0.2 }
                                }}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group"
                            >
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
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Tip del día Premium */}
            <div className="p-8 bg-gray-900 rounded-[2rem] text-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Tip de Crecimiento</p>
                    <p className="text-sm font-bold mt-3 leading-relaxed">
                        "Las tiendas que responden en menos de 15 min. cierran un <span className="text-purple-400 font-black">40% más de ventas</span>."
                    </p>
                    <button 
                        onClick={() => setIsTipsModalOpen(true)}
                        className="mt-6 text-xs font-black text-white bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-all"
                    >
                        Saber más
                    </button>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:rotate-12 group-hover:scale-125 transition-transform duration-500">💡</div>
            </div>
        </div>

      </div>

      {/* MODAL: BIBLIOTECA DE CRECIMIENTO (Diseño Libro) */}
      <AnimatePresence>
        {isTipsModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                    className="bg-white w-full max-w-5xl h-[80vh] rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20"
                >
                    {/* Lado Izquierdo: Portada/Categorías */}
                    <div className="md:w-1/3 bg-gray-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="h-16 w-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-500/30">
                                <Activity size={32} />
                            </div>
                            <h2 className="text-3xl font-black leading-tight tracking-tighter">
                                Manual de <br />
                                <span className="text-purple-400">Crecimiento</span>
                            </h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">Estrategias por Módulo</p>
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                            <p className="text-xs text-gray-500 leading-relaxed font-medium italic">
                                "El éxito no es un accidente, es el resultado de pequeñas optimizaciones diarias."
                            </p>
                            <div className="h-px w-12 bg-purple-600"></div>
                        </div>

                        {/* Decoración tipo lomo de libro */}
                        <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent"></div>
                    </div>

                    {/* Lado Derecho: Contenido/Tips */}
                    <div className="flex-1 bg-[#FDFCFB] p-8 md:p-16 overflow-y-auto custom-scrollbar relative">
                        <button 
                            onClick={() => setIsTipsModalOpen(false)}
                            className="absolute top-8 right-8 h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                        >
                            <Search className="rotate-45" size={20} />
                        </button>

                        <div className="max-w-2xl mx-auto space-y-12">
                            {growthTips.map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                                            Módulo {item.module}
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-800 leading-relaxed group-hover:text-black transition-colors">
                                        {item.tip}
                                    </p>
                                    <div className="mt-6 h-px w-full bg-gray-100 group-last:hidden"></div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pie de página tipo libro */}
                        <div className="mt-20 flex justify-center">
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase text-gray-300 tracking-widest">
                                <span>Pág. 01</span>
                                <div className="h-1 w-1 rounded-full bg-gray-200"></div>
                                <span>Bayup Intelligence</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
