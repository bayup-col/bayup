"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Settings, Plus, X, Gift, CheckCircle2, Trash2, 
  Coins, ArrowRight, TrendingUp, DollarSign, Activity, 
  Zap, Target, Users, Briefcase, Clock, LayoutGrid, 
  Filter, Search, Download, Calendar, Sparkles, Bot, 
  ArrowUpRight, Award, Medal, CreditCard, FileText, 
  Percent, Check, ShieldCheck, History as LucideHistory, 
  Scale, MessageSquare, ChevronDown, ShoppingBag
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface CommissionSettlement {
    id: string;
    seller_id: string;
    seller_name: string;
    avatar: string;
    total_sales: number; 
    total_profit: number; 
    status: 'pending' | 'paid';
    period: string;
    payment_date?: string;
}

const PERIODS = ['Enero 2026', 'Febrero 2026', 'Marzo 2026'];

export default function ComisionesPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    // --- ESTADOS DE CONTROL ---
    const [activeTab, setActiveTab] = useState<'liquidar' | 'reglas' | 'historial' | 'bayt'>('liquidar');
    const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[1]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'met' | 'pending'>('all');
    const [commissionModel, setCommissionModel] = useState<'revenue' | 'profit'>('revenue');
    
    // --- ESTADOS DE DATOS ---
    const [settlements, setSettlements] = useState<CommissionSettlement[]>([]);
    const [config, setConfig] = useState({
        target: 10000000,
        rate: 5.0
    });

    // Modales
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState<CommissionSettlement | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // --- CARGA Y PERSISTENCIA ---
    useEffect(() => {
        const savedSettlements = localStorage.getItem('bayup_commissions_data');
        const savedConfig = localStorage.getItem('bayup_commissions_config');
        
        if (savedConfig) setConfig(JSON.parse(savedConfig));
        
        if (savedSettlements) {
            setSettlements(JSON.parse(savedSettlements));
        } else {
            const initial = [
                { id: 'c1', seller_id: 's1', seller_name: 'Elena Rodriguez', avatar: 'ER', total_sales: 12500000, total_profit: 4500000, status: 'pending', period: 'Febrero 2026' },
                { id: 'c2', seller_id: 's2', seller_name: 'Carlos Ruiz', avatar: 'CR', total_sales: 8400000, total_profit: 2100000, status: 'pending', period: 'Febrero 2026' },
                { id: 'c3', seller_id: 's3', seller_name: 'Ana Beltrán', avatar: 'AB', total_sales: 15000000, total_profit: 6000000, status: 'paid', period: 'Enero 2026', payment_date: '30 Ene 2026' }
            ];
            setSettlements(initial as any);
            localStorage.setItem('bayup_commissions_data', JSON.stringify(initial));
        }
    }, []);

    const saveCommissions = (data: CommissionSettlement[]) => {
        setSettlements(data);
        localStorage.setItem('bayup_commissions_data', JSON.stringify(data));
    };

    const saveConfig = () => {
        localStorage.setItem('bayup_commissions_config', JSON.stringify(config));
        showToast("Modelo de comisiones guardado correctamente 🚀", "success");
    };

    // --- LÓGICA DE CÁLCULO ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        if (!num) return "";
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const processedData = useMemo(() => {
        return settlements.map(s => {
            const baseValue = commissionModel === 'revenue' ? s.total_sales : s.total_profit;
            const progress = Math.round((baseValue / config.target) * 100);
            const earned = baseValue >= config.target ? (baseValue * config.rate) / 100 : 0;
            return { ...s, progress, earned };
        });
    }, [settlements, commissionModel, config]);

    const filteredList = useMemo(() => {
        return processedData.filter(s => {
            const matchesSearch = s.seller_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPeriod = s.period === selectedPeriod;
            const matchesTab = activeTab === 'liquidar' ? s.status === 'pending' : activeTab === 'historial' ? s.status === 'paid' : true;
            
            let matchesFilter = true;
            if (filterStatus === 'met') matchesFilter = s.progress >= 100;
            if (filterStatus === 'pending') matchesFilter = s.progress < 100;

            return matchesSearch && matchesPeriod && matchesTab && matchesFilter;
        });
    }, [processedData, searchTerm, selectedPeriod, activeTab, filterStatus]);

    // --- ACCIONES ---
    const handleConfirmPayment = () => {
        if (!selectedSettlement) return;
        const newData = settlements.map(s => 
            s.id === selectedSettlement.id ? { ...s, status: 'paid' as const, payment_date: new Date().toLocaleDateString() } : s
        );
        saveCommissions(newData);
        setSelectedSettlement(null);
        showToast(`Pago confirmado para ${selectedSettlement.seller_name}`, "success");
    };

    const handleDownloadProfessionalReport = (type: string) => {
        const title = type === 'nomina' ? 'REPORTE DE NÓMINA Y COMISIONES' : 'AUDITORÍA INDIVIDUAL DE LIQUIDACIÓN';
        const date = new Date().toLocaleDateString();
        
        // Estilos integrados para Excel
        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <style>
                    .header { background-color: #001a1a; color: #00f2ff; font-family: 'Segoe UI', sans-serif; font-size: 18px; font-weight: bold; text-align: center; }
                    .sub-header { background-color: #004d4d; color: white; font-family: 'Segoe UI', sans-serif; font-size: 12px; font-weight: bold; }
                    .cell { font-family: 'Segoe UI', sans-serif; font-size: 11px; border: 0.5pt solid #e2e8f0; }
                    .money { mso-number-format: "\\$ #,##0"; }
                    .percentage { mso-number-format: "0%"; }
                    .footer { background-color: #f8fafc; font-weight: bold; }
                </style>
            </head>
            <body>
                <table>
                    <tr><td colspan="6" class="header">${title}</td></tr>
                    <tr><td colspan="6" style="text-align: center; font-family: sans-serif; font-size: 10px; color: #64748b;">Generado por Bayup Master-Config | ${selectedPeriod} | ${date}</td></tr>
                    <tr><td colspan="6"></td></tr>
                    <tr class="sub-header">
                        <td style="width: 200px;">ASESOR COMERCIAL</td>
                        <td style="width: 120px;">VENTA BRUTA</td>
                        <td style="width: 120px;">UTILIDAD NETA</td>
                        <td style="width: 100px;">CUMPLIMIENTO</td>
                        <td style="width: 120px;">COMISIÓN</td>
                        <td style="width: 100px;">ESTADO</td>
                    </tr>
                    ${filteredList.map(s => `
                        <tr>
                            <td class="cell">${s.seller_name}</td>
                            <td class="cell money">${s.total_sales}</td>
                            <td class="cell money">${s.total_profit}</td>
                            <td class="cell percentage" style="text-align: center;">${s.progress / 100}</td>
                            <td class="cell money" style="color: #059669; font-weight: bold;">${s.earned}</td>
                            <td class="cell" style="text-align: center; text-transform: uppercase;">${s.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}</td>
                        </tr>
                    `).join('')}
                    <tr class="footer">
                        <td class="cell">TOTALES DEL PERIODO</td>
                        <td class="cell money">${filteredList.reduce((acc, s) => acc + s.total_sales, 0)}</td>
                        <td class="cell money">${filteredList.reduce((acc, s) => acc + s.total_profit, 0)}</td>
                        <td class="cell" style="text-align: center;">${Math.round(filteredList.reduce((acc,s)=>acc+s.progress,0)/(filteredList.length || 1))}%</td>
                        <td class="cell money" style="color: #004d4d;">${filteredList.reduce((acc, s) => acc + s.earned, 0)}</td>
                        <td class="cell"></td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bayup_Reporte_${selectedPeriod.replace(' ', '_')}.xls`;
        a.click();
        showToast("Reporte profesional generado 🚀", "success");
    };

    // --- RENDERIZADO ---
    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Comisiones</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Liquidación <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">PRO</span>
                    </h1>
                </div>
                {/* BOTON PERIODO FUNCIONAL */}
                <div className="relative">
                    <button 
                        onClick={() => setIsPeriodModalOpen(!isPeriodModalOpen)}
                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 hover:border-[#004d4d] transition-all group"
                    >
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Periodo de Pago</p>
                            <p className="text-sm font-black text-gray-900">{selectedPeriod}</p>
                        </div>
                        <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Calendar size={18} className="text-[#00f2ff]"/></div>
                    </button>
                    <AnimatePresence>
                        {isPeriodModalOpen && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50">
                                {PERIODS.map(p => (
                                    <button key={p} onClick={() => { setSelectedPeriod(p); setIsPeriodModalOpen(false); }} className={`w-full text-left p-3 rounded-xl text-[10px] font-black uppercase ${p === selectedPeriod ? 'bg-[#004d4d] text-white' : 'hover:bg-gray-50 text-gray-500'}`}>{p}</button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[ 
                    { label: 'Por Liquidar', value: formatCurrency(filteredList.reduce((acc, s) => acc + s.earned, 0)), icon: <DollarSign size={20}/>, color: 'text-[#004d4d]' },
                    { label: 'Cumplimiento', value: `${Math.round(filteredList.reduce((acc,s)=>acc+s.progress,0)/(filteredList.length || 1))}%`, icon: <Target size={20}/>, color: 'text-[#00f2ff]' },
                    { label: 'Total Ventas', value: formatCurrency(filteredList.reduce((acc,s)=>acc+s.total_sales,0)), icon: <ShoppingBag size={20}/>, color: 'text-emerald-600' },
                    { label: 'Asesores', value: filteredList.length, icon: <Users size={20}/>, color: 'text-amber-500' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                        <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3></div>
                    </div>
                ))}
            </div>

            {/* Menu Tabs */}
            <div className="flex justify-center">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center">
                    {[ 
                        { id: 'liquidar', label: 'Liquidación', icon: <CreditCard size={14}/> },
                        { id: 'reglas', label: 'Reglas/Metas', icon: <Scale size={14}/> },
                        { id: 'historial', label: 'Historial', icon: <LucideHistory size={14}/> }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>{tab.icon} {tab.label}</button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab + selectedPeriod} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                    {(activeTab === 'liquidar' || activeTab === 'historial') && (
                        <div className="space-y-8">
                            {/* Action Bar FUNCIONAL */}
                            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 relative z-30">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input type="text" placeholder="Buscar asesor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" />
                                </div>
                                <div className="flex items-center gap-3 relative">
                                    <button 
                                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                        className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all"
                                    >
                                        <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Filtrar</span>
                                    </button>
                                    <AnimatePresence>
                                        {isFilterMenuOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl p-2 z-50">
                                                <button onClick={() => { setFilterStatus('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Todos</button>
                                                <button onClick={() => { setFilterStatus('met'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50 text-emerald-600">Meta Superada</button>
                                                <button onClick={() => { setFilterStatus('pending'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50 text-rose-600">Bajo Meta</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <button onClick={() => handleDownloadProfessionalReport('nomina')} className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                                        <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Nómina</span>
                                    </button>
                                </div>
                            </div>

                            {/* LISTA DE ASESORES */}
                            <div className="px-4 space-y-4">
                                {filteredList.length === 0 ? <div className="py-20 text-center text-gray-300 font-black uppercase text-xs">Sin registros para este periodo</div> : filteredList.map((s) => (
                                    <motion.div key={s.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-xl font-black shadow-2xl">{s.avatar}</div>
                                            <div><h4 className="text-xl font-black text-gray-900">{s.seller_name}</h4><p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{s.status === 'paid' ? `Pagado el ${s.payment_date}` : 'Pendiente de liquidación'}</p></div>
                                        </div>
                                        <div className="flex-[2] space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Progreso Meta</span><span>{s.progress}%</span></div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(s.progress, 100)}%` }} className="h-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff]" /></div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right"><p className="text-[9px] font-black text-gray-400 uppercase">Comisión</p><p className={`text-2xl font-black ${s.earned > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>{formatCurrency(s.earned)}</p></div>
                                            <button onClick={() => setSelectedSettlement(s)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><FileText size={20}/></button>
                                            {s.status === 'pending' && (
                                                <button onClick={() => { setSelectedSettlement(s); }} className="h-12 px-6 bg-gray-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-black">Liquidar</button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reglas' && (
                        <div className="px-4 space-y-10">
                            <div className="bg-white/40 p-10 rounded-[4rem] border border-white/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="space-y-4 max-w-xl">
                                    <div className="flex items-center gap-3"><Scale className="text-[#004d4d]" size={24}/><h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Modelo de Comisión</h3></div>
                                    <p className="text-sm font-medium text-gray-500 italic">"Define si premias el Volumen de Venta o la Utilidad Neta."</p>
                                </div>
                                <div className="p-2 bg-white rounded-3xl border border-gray-100 flex gap-2">
                                    <button onClick={() => setCommissionModel('revenue')} className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase ${commissionModel === 'revenue' ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-400'}`}>Venta Bruta</button>
                                    <button onClick={() => setCommissionModel('profit')} className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase ${commissionModel === 'profit' ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-400'}`}>Utilidad Neta</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-8">
                                    <h3 className="text-xl font-black uppercase">Umbral de Meta</h3>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner flex items-center gap-4">
                                            <span className="text-2xl font-black text-[#004d4d]">$</span>
                                            <input type="text" value={formatDots(config.target)} onChange={(e) => setConfig({...config, target: parseInt(e.target.value.replace(/\D/g, '') || '0')})} className="text-2xl font-black text-gray-900 bg-transparent outline-none w-full" />
                                        </div>
                                        <button onClick={saveConfig} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all">Guardar Modelo</button>
                                    </div>
                                </div>
                                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-8">
                                    <h3 className="text-xl font-black uppercase">Tasa de Comisión (%)</h3>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner flex items-center gap-4">
                                            <input type="number" value={config.rate} onChange={(e) => setConfig({...config, rate: parseFloat(e.target.value)})} className="text-2xl font-black text-gray-900 bg-transparent outline-none w-full text-center" />
                                            <span className="text-2xl font-black text-purple-600">%</span>
                                        </div>
                                        <button onClick={() => showToast("En desarrollo: Reglas granulares por asesor", "info")} className="w-full py-5 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase transition-all">Reglas por Asesor</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL DETALLE / AUDITORIA / PAGO */}
            <AnimatePresence>
                {selectedSettlement && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSettlement(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white">
                            <div className="w-full md:w-[350px] bg-gray-50 border-r border-gray-100 p-12 space-y-10">
                                <button onClick={() => setSelectedSettlement(null)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm"><X size={20}/></button>
                                <div className="text-center space-y-4">
                                    <div className="h-20 w-20 bg-[#004d4d] text-white rounded-[1.5rem] flex items-center justify-center text-3xl font-black mx-auto shadow-2xl">{selectedSettlement.avatar}</div>
                                    <h3 className="text-xl font-black text-gray-900">{selectedSettlement.seller_name}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase"><span>Comisión:</span><span className="text-sm text-[#004d4d]">{formatCurrency((processedData.find(p=>p.id===selectedSettlement.id)?.earned || 0))}</span></div>
                                </div>
                                <button onClick={() => handleDownloadProfessionalReport('auditoria')} className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3"><Download size={16} className="text-[#00f2ff]"/> Descargar Auditoría</button>
                            </div>
                            <div className="flex-1 flex flex-col bg-white overflow-hidden p-12 space-y-8">
                                <h2 className="text-3xl font-black uppercase italic">Análisis de Liquidación</h2>
                                <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                                    <p className="text-xs font-medium text-gray-600 leading-relaxed italic">"El asesor presenta un cumplimiento de meta del {(processedData.find(p=>p.id===selectedSettlement.id)?.progress || 0)}%. Se procede a liberar la comisión basada en el modelo vigente."</p>
                                </div>
                                {selectedSettlement.status === 'pending' && (
                                    <button onClick={handleConfirmPayment} className="w-full py-6 bg-[#004d4d] text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4"><Check size={20}/> Confirmar Pago del Periodo</button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}