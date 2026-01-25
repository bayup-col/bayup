"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../context/auth-context';

interface MonthData {
    month: string;
    amount: number;
}

interface Seller {
    id: string;
    name: string;
    role: string;
    branch: string;
    total_sales: number;
    sales_today: number;
    sales_month: number;
    last_month_sales: number;
    channels: {
        web: boolean;
        social: boolean;
        separados: boolean;
        in_store: boolean;
    };
    history: MonthData[];
    avatar: string;
}

const MONTHS_LIST = ['Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero'];

const INITIAL_SELLERS: Seller[] = [
    {
        id: 's1', name: 'Lorena Gómez', role: 'Líder de Ventas', branch: 'Tienda Principal',
        total_sales: 45800000, sales_today: 1250000, sales_month: 8500000, last_month_sales: 7200000,
        channels: { web: true, social: true, separados: true, in_store: true },
        history: [
            { month: 'Agosto', amount: 4500000 },
            { month: 'Septiembre', amount: 6000000 },
            { month: 'Octubre', amount: 8500000 },
            { month: 'Noviembre', amount: 7000000 },
            { month: 'Diciembre', amount: 12000000 },
            { month: 'Enero', amount: 8500000 }
        ],
        avatar: 'LG'
    },
    {
        id: 's2', name: 'Andrés Felipe', role: 'Asesor Junior', branch: 'Tienda Principal',
        total_sales: 12400000, sales_today: 450000, sales_month: 3200000, last_month_sales: 3500000,
        channels: { web: false, social: true, separados: true, in_store: true },
        history: [
            { month: 'Agosto', amount: 2100000 },
            { month: 'Septiembre', amount: 3000000 },
            { month: 'Octubre', amount: 2800000 },
            { month: 'Noviembre', amount: 4500000 },
            { month: 'Diciembre', amount: 5200000 },
            { month: 'Enero', amount: 3200000 }
        ],
        avatar: 'AF'
    }
];

export default function VendedoresPage() {
    const { token } = useAuth();
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [filterMonth, setFilterMonth] = useState('Enero');

    // Cargar y sincronizar vendedores
    useEffect(() => {
        const saved = localStorage.getItem('business_sellers');
        if (saved) {
            try {
                const parsedSellers = JSON.parse(saved).map((s: any) => ({
                    ...s,
                    history: s.history || MONTHS_LIST.map(m => ({ month: m, amount: 0 })) // Asegurar historial
                }));
                setSellers(parsedSellers);
            } catch (e) {
                setSellers(INITIAL_SELLERS);
            }
        } else {
            setSellers(INITIAL_SELLERS);
            localStorage.setItem('business_sellers', JSON.stringify(INITIAL_SELLERS));
        }
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const handleCreate = () => {
        if (!formData.name) return alert("Escribe el nombre del asesor.");
        const newSeller: Seller = {
            id: `s_${Math.random().toString(36).substr(2, 9)}`,
            name: formData.name,
            role: formData.role,
            branch: formData.branch,
            total_sales: 0, 
            sales_today: 0, 
            sales_month: 0, 
            last_month_sales: 0,
            channels: { 
                web: formData.web, 
                social: formData.social, 
                separados: formData.separados, 
                in_store: formData.in_store 
            },
            history: MONTHS_LIST.map(m => ({ month: m, amount: 0 })),
            avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2)
        };
        const updated = [newSeller, ...sellers];
        setSellers(updated);
        localStorage.setItem('business_sellers', JSON.stringify(updated));
        setIsCreateModalOpen(false);
        setFormData({ name: '', role: 'Asesor de Ventas', branch: 'Tienda Principal', web: false, social: true, separados: true, in_store: true });
    };

    const TrendIndicator = ({ current, previous }: { current: number, previous: number }) => {
        if (previous === 0) return null;
        const diff = current - previous;
        const percent = (diff / previous) * 100;
        const isUp = diff >= 0;
        return (
            <div className={`flex items-center gap-1 text-[9px] font-black uppercase mt-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? '↑' : '↓'} {formatCurrency(Math.abs(diff))} ({Math.abs(percent).toFixed(1)}%)
            </div>
        );
    };

    const selectedMonthSales = useMemo(() => {
        if (!selectedSeller || !selectedSeller.history) return 0;
        const data = selectedSeller.history.find(h => h.month === filterMonth);
        return data ? data.amount : 0;
    }, [selectedSeller, filterMonth]);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Equipo de Ventas</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona tus asesores y analiza su crecimiento comercial.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">+ Registrar Asesor</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sellers.map((seller) => (
                    <div key={seller.id} onClick={() => setSelectedSeller(seller)} className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="h-20 w-20 bg-purple-50 rounded-3xl flex items-center justify-center text-2xl font-black text-purple-600 mb-4 shadow-inner">{seller.avatar}</div>
                            <h3 className="text-xl font-black text-gray-900">{seller.name}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{seller.role}</p>
                            <div className="w-full mt-8 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                                <div className="text-left"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Este Mes</p><p className="text-sm font-black text-gray-900">{formatCurrency(seller.sales_month)}</p><TrendIndicator current={seller.sales_month} previous={seller.last_month_sales} /></div>
                                <div className="text-right flex flex-col items-end"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hoy</p><p className="text-sm font-black text-purple-600">{formatCurrency(seller.sales_today)}</p></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Comparativa Brutal (Ranking) */}
            <div className="bg-white p-12 rounded-[3rem] border border-gray-50 shadow-sm space-y-10">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Comparativa de Desempeño</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Ranking de Facturación Mensual</p>
                </div>
                <div className="space-y-6">
                    {sellers.sort((a,b) => b.sales_month - a.sales_month).map((s, i) => {
                        const max = Math.max(...sellers.map(x => x.sales_month)) || 1;
                        const width = (s.sales_month / max) * 100;
                        return (
                            <div key={s.id} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-gray-400">0{i+1}</span>
                                        <p className="text-sm font-black text-gray-900">{s.name}</p>
                                    </div>
                                    <p className="text-xs font-black text-purple-600">{formatCurrency(s.sales_month)} <span className="text-gray-400 font-bold ml-1">este mes</span></p>
                                </div>
                                <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden flex">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${width}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DETALLE PROFUNDO */}
            {selectedSeller && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-purple-600 text-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-lg">{selectedSeller.avatar}</div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedSeller.name}</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{selectedSeller.role} · {selectedSeller.branch}</p>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedSeller(null); setFilterMonth('Enero'); }} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-gray-50/20 custom-scrollbar">
                            {/* KPIs Rápidos y Filtro de Mes */}
                            <div className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Consulta Mensual Detallada</h3>
                                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                                        <span className="text-[9px] font-black text-gray-400 uppercase ml-3">Ver mes:</span>
                                        <select 
                                            value={filterMonth}
                                            onChange={(e) => setFilterMonth(e.target.value)}
                                            className="bg-transparent text-xs font-black text-purple-600 outline-none px-3 py-1 cursor-pointer"
                                        >
                                            {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-center relative overflow-hidden group">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Ventas en {filterMonth}</p>
                                        <p className="text-3xl font-black text-purple-600 relative z-10">{formatCurrency(selectedMonthSales)}</p>
                                        <div className="absolute right-0 bottom-0 p-4 opacity-5 text-5xl group-hover:scale-110 transition-transform">📊</div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Promedio Diario ({filterMonth})</p>
                                        <p className="text-3xl font-black text-gray-900">{formatCurrency(selectedMonthSales / 30)}</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Histórico</p>
                                        <p className="text-3xl font-black text-gray-900">{formatCurrency(selectedSeller.total_sales)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Gráfica de Barras con Montos Reales */}
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-8 flex flex-col">
                                <div className="flex justify-between items-start">
                                    <div><h3 className="text-xl font-black text-gray-900 tracking-tight">Historial de Facturación</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Comparativa de los últimos 6 meses</p></div>
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">Tendencia Positiva</span>
                                </div>
                                <div className="flex-1 flex items-end justify-between gap-4 px-4 min-h-[200px]">
                                    {(selectedSeller?.history || []).map((h, i) => {
                                        const max = Math.max(...(selectedSeller?.history || []).map(x => x.amount)) || 1;
                                        const height = (h.amount / max) * 100;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                                <div className="w-full relative h-40 flex items-end justify-center">
                                                    <div 
                                                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-1000 ${h.month === filterMonth ? 'bg-purple-600 shadow-lg shadow-purple-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}
                                                        style={{ height: `${height}%` }}
                                                    ></div>
                                                    {/* Tooltip de monto real */}
                                                    <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{formatCurrency(h.amount)}</div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase ${h.month === filterMonth ? 'text-purple-600' : 'text-gray-400'}`}>{h.month.substr(0, 3)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Canales y Reconocimiento */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Canales Operativos</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'web', label: 'Venta Web', icon: '🌐', active: selectedSeller.channels.web },
                                            { id: 'social', label: 'Redes', icon: '📱', active: selectedSeller.channels.social },
                                            { id: 'separados', label: 'Separados', icon: '✨', active: selectedSeller.channels.separados },
                                            { id: 'in_store', label: 'Sala', icon: '🏪', active: selectedSeller.channels.in_store }
                                        ].map(c => (
                                            <div key={c.id} className={`flex items-center gap-3 p-4 rounded-2xl border ${c.active ? 'bg-purple-50 border-purple-100 text-purple-700' : 'bg-gray-50 border-transparent text-gray-400 opacity-50'}`}>
                                                <span className="text-base">{c.icon}</span><span className="text-[10px] font-black uppercase">{c.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-10 rounded-[3rem] text-white flex flex-col justify-center shadow-xl relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="text-3xl mb-4">🏆</div>
                                        <h4 className="text-xl font-black tracking-tight">Status: Top Performer</h4>
                                        <p className="text-gray-400 text-sm mt-2 font-medium leading-relaxed">Lorena ha mantenido una facturación superior a los <span className="text-purple-400 font-bold">$7.000.000</span> mensuales de forma consistente durante el último trimestre.</p>
                                    </div>
                                    <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-5 rotate-12">✨</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
