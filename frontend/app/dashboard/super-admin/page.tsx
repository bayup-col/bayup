"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/auth-context';

export default function SuperAdminDashboard() {
    const { token, isAuthenticated } = useAuth();
    
    // Mock Data Financiera
    const financialStats = {
        totalDeposits: 854200.00,
        totalWithdrawals: 320150.00,
        netBalance: 534050.00,
        revenueToday: 12450.00,
        activeCompanies: 42,
        trends: {
            deposits: +12.5,
            withdrawals: -2.1,
            balance: +8.4,
            revenue: +15.2,
            companies: +3
        }
    };

    const recentMovements = [
        { id: '1', shop: 'Nike Store', type: 'deposito', amount: 4500, time: 'hace 5 min', status: 'completado' },
        { id: '2', shop: 'Tech Hub', type: 'retiro', amount: 12000, time: 'hace 24 min', status: 'pendiente' },
        { id: '3', shop: 'Boutique Maria', type: 'deposito', amount: 850, time: 'hace 1 hora', status: 'completado' },
        { id: '4', shop: 'Electro Express', type: 'deposito', amount: 3200, time: 'hace 2 horas', status: 'completado' },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const StatCard = ({ title, value, trend, isCurrency = true }: any) => (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-4 left-4">
                {trend > 0 ? (
                    <span className="text-green-500 flex items-center text-[10px] font-bold bg-green-50 px-1.5 py-0.5 rounded-md">
                        ↑ {Math.abs(trend)}%
                    </span>
                ) : (
                    <span className="text-rose-500 flex items-center text-[10px] font-bold bg-rose-50 px-1.5 py-0.5 rounded-md">
                        ↓ {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div className="mt-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
                <h3 className={`text-xl font-black ${title.includes('Retiros') ? 'text-rose-600' : 'text-gray-900'}`}>
                    {isCurrency ? formatCurrency(value) : value}
                </h3>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50 group-hover:bg-purple-500 transition-all duration-500"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            
            {/* 1. Header Logístico */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Global Logistics Control</h1>
                    <p className="text-gray-500 mt-1 font-medium">Resumen financiero y operativo de toda la red Bayup.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-gray-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl">Auditoría Completa</button>
                </div>
            </div>

            {/* 2. Grid de Cards Financieras (Top) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Depósitos Mes" value={financialStats.totalDeposits} trend={financialStats.trends.deposits} />
                <StatCard title="Retiros Mes" value={financialStats.totalWithdrawals} trend={financialStats.trends.withdrawals} />
                <StatCard title="Saldo Neto" value={financialStats.netBalance} trend={financialStats.trends.balance} />
                <StatCard title="Ingreso Hoy" value={financialStats.revenueToday} trend={financialStats.trends.revenue} />
                <StatCard title="Empresas Activas" value={financialStats.activeCompanies} trend={financialStats.trends.companies} isCurrency={false} />
            </div>

            {/* 3. Panel de Control Secundario */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Columna Izquierda: Movimientos en Tiempo Real */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h2 className="text-lg font-bold text-gray-800">Flujo de Caja en Vivo</h2>
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentMovements.map((move) => (
                                <div key={move.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${move.type === 'deposito' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {move.type === 'deposito' ? '📥' : '📤'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{move.shop}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{move.time} • {move.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${move.type === 'deposito' ? 'text-green-600' : 'text-rose-600'}`}>
                                            {move.type === 'deposito' ? '+' : '-'}{formatCurrency(move.amount)}
                                        </p>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${move.status === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {move.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 hover:bg-purple-100 transition-all">Ver todas las transacciones →</button>
                    </div>
                </div>

                {/* Columna Derecha: Alertas y Salud del Sistema */}
                <div className="space-y-8">
                    
                    {/* Sección de Aprobaciones */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Pendiente de Aprobación</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-amber-800">Solicitud de Retiro</span>
                                    <span className="text-[10px] font-black text-amber-600">ID #9284</span>
                                </div>
                                <p className="text-lg font-black text-gray-900">$15,400.00</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 bg-white text-gray-900 py-2 rounded-xl text-[10px] font-black uppercase border border-amber-200">Revisar</button>
                                    <button className="flex-1 bg-gray-900 text-white py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Aprobar</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Salud del Sistema */}
                    <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl">
                        <h2 className="text-xs font-black text-purple-400 uppercase tracking-[0.2em]">Estado de Infraestructura</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400">Servidores API</span>
                                <span className="text-[10px] font-black text-green-400 uppercase">Óptimo (99.9%)</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-400 h-full w-[99%]"></div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-bold text-gray-400">Procesamiento Pagos</span>
                                <span className="text-[10px] font-black text-green-400 uppercase">Activo</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-bold text-gray-400">Amazon S3 (Imágenes)</span>
                                <span className="text-[10px] font-black text-green-400 uppercase">Conectado</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
