"use client";

import { useState } from 'react';

interface Transaction {
    id: string;
    store_name: string;
    total_sale: number;
    commission_2_5: number;
    timestamp: string;
    status: 'completado' | 'pendiente';
}

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: "T-9284", store_name: "Tech Nova Store", total_sale: 150000, commission_2_5: 3750, timestamp: "hace 2 min", status: "completado" },
    { id: "T-9283", store_name: "Vogue Boutique", total_sale: 45000, commission_2_5: 1125, timestamp: "hace 15 min", status: "completado" },
    { id: "T-9282", store_name: "Ferretería Central", total_sale: 12500, commission_2_5: 312.5, timestamp: "hace 45 min", status: "pendiente" },
    { id: "T-9281", store_name: "Distribuidora J&K", total_sale: 280000, commission_2_5: 7000, timestamp: "hace 1 hora", status: "completado" },
    { id: "T-9280", store_name: "Electro Express", total_sale: 8500, commission_2_5: 212.5, timestamp: "hace 2 horas", status: "completado" },
];

export default function SuperAdminSales() {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            
            {/* 1. Header de Ingresos */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Centro de Comisiones</h1>
                    <p className="text-gray-500 mt-1 font-medium">Monitoreo del 2.5% sobre el volumen transaccional de la red.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasa de Comisión:</span>
                    <span className="text-lg font-black text-purple-600">2.5%</span>
                </div>
            </div>

            {/* 2. KPIs Financieros (Enfoque en Ganancia Neta) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-purple-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-purple-200 relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">Nuestra Ganancia Hoy</p>
                    <h3 className="text-3xl font-black mt-1">{formatCurrency(12450.50)}</h3>
                    <p className="text-xs text-purple-300 mt-2 font-bold">↑ 8.4% vs ayer</p>
                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">💰</div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GMV Red (Volumen Total)</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{formatCurrency(498020.00)}</h3>
                    <p className="text-xs text-gray-400 mt-2 font-medium italic">Vendido por todos los clientes</p>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Proyección Cierre Mes</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{formatCurrency(385000.00)}</h3>
                    <p className="text-xs text-green-600 mt-2 font-bold italic">Meta alcanzada al 75%</p>
                </div>

                <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white shadow-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Socio Estratégico (MVP)</p>
                    <h3 className="text-xl font-black text-purple-400 mt-1">Tech Nova Store</h3>
                    <p className="text-xs text-gray-400 mt-2 font-medium leading-none">Aporta el 18% de comisiones</p>
                </div>
            </div>

            {/* 3. Tabla de Transacciones en Vivo */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Live Transaction Feed</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Comisiones generadas en tiempo real</p>
                    </div>
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600"></span>
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Transacción</th>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tienda Origen</th>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Venta Total</th>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50/50">Nuestra Comisión (2.5%)</th>
                                <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {MOCK_TRANSACTIONS.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <p className="text-sm font-black text-gray-900 tracking-tight">#{t.id}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{t.timestamp}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-bold text-gray-700 group-hover:text-purple-600 transition-colors">{t.store_name}</p>
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <p className="text-sm font-medium text-gray-500">{formatCurrency(t.total_sale)}</p>
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap bg-purple-50/20">
                                        <p className="text-lg font-black text-purple-700 tracking-tighter">{formatCurrency(t.commission_2_5)}</p>
                                    </td>
                                    <td className="px-10 py-6 text-right whitespace-nowrap">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl ${
                                            t.status === 'completado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button className="w-full py-6 bg-gray-50 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:bg-gray-100 transition-all border-t border-gray-100">Cargar más transacciones</button>
            </div>

            {/* 4. Pie de Página - Resumen de Operación */}
            <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center text-3xl border border-white/10">📈</div>
                    <div>
                        <h4 className="text-xl font-black italic">Tu infraestructura es rentable.</h4>
                        <p className="text-gray-400 text-sm mt-1">El volumen de ventas ha crecido un 12% este mes. Mantén el soporte activo para los MVP.</p>
                    </div>
                </div>
                <button className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all shadow-xl">Auditar Todas las Tiendas</button>
            </div>

        </div>
    );
}
