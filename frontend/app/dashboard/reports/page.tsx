"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ReportsPage() {
    const { token } = useAuth();
    const [fromMonth, setFromMonth] = useState('Enero');
    const [toMonth, setToMonth] = useState('Enero');
    const [isExporting, setIsExporting] = useState(false);
    
    // --- ESTADO DE DATOS INTEGRADOS ---
    const [salesHistory, setSalesHistory] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);

    const loadData = useCallback(() => {
        const history = JSON.parse(localStorage.getItem('business_sales_history') || '[]');
        const exps = JSON.parse(localStorage.getItem('business_expenses') || '[]');
        const slls = JSON.parse(localStorage.getItem('business_sellers') || '[]');
        
        setSalesHistory(history);
        setExpenses(exps);
        setSellers(slls);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    // Cálculos Reales basados en la integración
    const totals = useMemo(() => {
        const totalIncome = salesHistory.reduce((acc, sale) => acc + sale.total, 0);
        const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
        const totalCommissions = sellers.reduce((acc, s) => acc + (s.sales_month * (s.rate / 100) || 0), 0);
        
        const netProfit = totalIncome - totalExpenses - totalCommissions;
        const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        return { totalIncome, totalExpenses: totalExpenses + totalCommissions, netProfit, margin };
    }, [salesHistory, expenses, sellers]);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Centro de Inteligencia</h1>
                    <p className="text-gray-500 mt-2 font-medium">Balance real integrado: Ventas + Gastos + Nómina + Comisiones.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button onClick={() => setIsExporting(true)} className="flex items-center gap-3 px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        {isExporting ? 'Generando Balance...' : 'Descargar Balance Integrado 📊'}
                    </button>
                </div>
            </div>

            {/* KPIs DINÁMICOS CONECTADOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ventas Reales</p>
                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(totals.totalIncome)}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-2">Sincronizado con Facturación</p>
                    <div className="absolute right-4 bottom-4 text-3xl opacity-5">💰</div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Salidas de Dinero</p>
                    <p className="text-2xl font-black text-rose-600">{formatCurrency(totals.totalExpenses)}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-2">Gastos + Comisiones</p>
                    <div className="absolute right-4 bottom-4 text-3xl opacity-5">💸</div>
                </div>
                <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Utilidad Neta Actual</p>
                    <p className="text-2xl font-black">{formatCurrency(totals.netProfit)}</p>
                    <p className="text-[9px] font-bold text-purple-300 mt-2 italic">Margen Real: {totals.margin.toFixed(1)}%</p>
                    <div className="absolute right-4 bottom-4 text-3xl opacity-20 animate-pulse">✨</div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Asesores Facturando</p>
                    <p className="text-2xl font-black text-gray-900">{sellers.length}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-2">Equipo comercial activo</p>
                    <div className="absolute right-4 bottom-4 text-3xl opacity-5">👥</div>
                </div>
            </div>

            {/* TABLA DE RENDIMIENTO POR ORIGEN (Datos Reales) */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Ventas por Canal</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Origen</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cant. Órdenes</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bruto</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Participación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {['pos', 'web', 'whatsapp', 'instagram'].map((canal) => {
                                const canalSales = salesHistory.filter(s => s.source === canal);
                                const canalTotal = canalSales.reduce((acc, s) => acc + s.total, 0);
                                const percent = totals.totalIncome > 0 ? (canalTotal / totals.totalIncome) * 100 : 0;
                                
                                return (
                                    <tr key={canal} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6 font-black text-sm text-gray-900 uppercase">{canal === 'pos' ? 'Tienda Física' : canal}</td>
                                        <td className="px-8 py-6 text-sm font-bold text-gray-600">{canalSales.length}</td>
                                        <td className="px-8 py-6 font-black text-sm text-gray-900">{formatCurrency(canalTotal)}</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden"><div className="bg-purple-600 h-full" style={{ width: `${percent}%` }}></div></div>
                                                <span className="text-[10px] font-black text-gray-400">{percent.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BANNER IA CONECTADO */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative z-10">💡</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight">Estado de Rentabilidad Real</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
                        Tu margen neto real tras descontar gastos operativos y comisiones de equipo es del <span className="text-purple-400 font-black">{totals.margin.toFixed(1)}%</span>. 
                        {totals.netProfit > 0 ? " Tu operación es saludable y genera flujo de caja positivo." : " Alerta: Tus gastos están superando tus ingresos actuales."}
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black">DATA</div>
            </div>
        </div>
    );
}
