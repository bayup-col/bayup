"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit3, Search, Tag, X, CheckCircle2, 
  DollarSign, Calendar, ChevronDown, LayoutGrid, 
  Filter, Download, Sparkles, Bot, Zap, TrendingUp, 
  Activity, Target, ArrowUpRight, Clock, Briefcase, 
  Users, ShieldCheck, AlertCircle, FileText, CreditCard, 
  Receipt, ShoppingBag, Loader2, Info, RotateCcw, TrendingDown, BarChart3
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface Expense {
    id: string;
    category: 'operativo_fijo' | 'operativo_diario';
    description: string;
    amount: number;
    due_date: string;
    status: 'paid' | 'pending' | 'overdue';
    payment_method: string;
}

// --- COMPONENTE NÚMEROS ANIMADOS ---
function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 1000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) { setDisplay(end); clearInterval(timer); }
            else { setDisplay(Math.floor(start)); }
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{display.toLocaleString('es-CO')}</span>;
}

// --- COMPONENTE TILT CARD PREMIUM ---
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        const rotateX = (y - centerY) / 7; 
        const rotateY = (centerX - x) / 7;
        setRotateX(rotateX);
        setRotateY(rotateY);
        setGlarePos({ x: (x/box.width)*100, y: (y/box.height)*100, opacity: 0.3 });
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlarePos(p => ({...p, opacity: 0})); }}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
            className={`bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-2xl flex flex-col justify-between group relative overflow-hidden h-full ${className}`}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ opacity: glarePos.opacity, background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.9) 0%, transparent 50%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(80px)", position: "relative", zIndex: 2 }} className="h-full flex flex-col justify-between">{children}</div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#00f2ff]/20 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default function GastosPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'resumen' | 'fijos' | 'diarios' | 'bayt'>('resumen');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [filterCategory, setFilterCategory] = useState("all");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState("Febrero 2026");
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        category: 'operativo_fijo' as 'operativo_fijo' | 'operativo_diario',
        payment_method: 'Transferencia'
    });

    // --- PERSISTENCIA ---
    useEffect(() => {
        const saved = localStorage.getItem('bayup_expenses_data');
        if (saved) { setExpenses(JSON.parse(saved)); } 
        else {
            const initial: Expense[] = [
                { id: '1', description: 'Arriendo Bodega', amount: 3500000, due_date: '2026-02-05', status: 'paid', category: 'operativo_fijo', payment_method: 'Transferencia' },
                { id: '2', description: 'Cintas de embalaje', amount: 45000, due_date: '2026-02-01', status: 'pending', category: 'operativo_diario', payment_method: 'Efectivo' }
            ];
            setExpenses(initial); localStorage.setItem('bayup_expenses_data', JSON.stringify(initial));
        }
        setLoading(false);
    }, []);

    const saveExpenses = (data: Expense[]) => { setExpenses(data); localStorage.setItem('bayup_expenses_data', JSON.stringify(data)); };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        if (!num) return ""; return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const totals = useMemo(() => {
        const fixed = expenses.filter(e => e.category === 'operativo_fijo').reduce((acc, e) => acc + e.amount, 0);
        const daily = expenses.filter(e => e.category === 'operativo_diario').reduce((acc, e) => acc + e.amount, 0);
        const pending = expenses.filter(e => e.status !== 'paid').reduce((acc, e) => acc + e.amount, 0);
        return { total: fixed + daily, fixed, daily, pending };
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'resumen' || (activeTab === 'fijos' && e.category === 'operativo_fijo') || (activeTab === 'diarios' && e.category === 'operativo_diario');
            const matchesFilter = filterCategory === 'all' || e.category === filterCategory;
            let matchesDate = true;
            if (dateRange.start && dateRange.end) {
                const recordDate = new Date(e.due_date).getTime();
                const start = new Date(dateRange.start).getTime();
                const end = new Date(dateRange.end).getTime();
                matchesDate = recordDate >= start && recordDate <= end;
            }
            return matchesSearch && matchesTab && matchesFilter && matchesDate;
        });
    }, [expenses, searchTerm, activeTab, filterCategory, dateRange]);

    const handleSaveExpense = (e: React.FormEvent) => {
        e.preventDefault();
        const amountNum = parseInt(formData.amount.replace(/\D/g, ''));
        if (!formData.description || isNaN(amountNum)) { showToast("Completa los campos", "error"); return; }
        if (editingExpense) {
            const newData = expenses.map(ex => ex.id === editingExpense.id ? { ...ex, ...formData, amount: amountNum } : ex);
            saveExpenses(newData); showToast("Gasto actualizado", "success");
        } else {
            const newEx: Expense = { id: Date.now().toString(), ...formData, amount: amountNum, status: 'pending' };
            saveExpenses([...expenses, newEx]); showToast("Gasto registrado", "success");
        }
        setIsModalOpen(false); setEditingExpense(null);
    };

    const handleDownloadReport = () => {
        const reportTitle = activeTab === 'resumen' ? 'REPORTE GENERAL DE EGRESOS' : 
                           activeTab === 'fijos' ? 'AUDITORÍA DE COSTOS FIJOS' : 'CONTROL DE CAJA MENOR';
        
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();

        const html = `
            <html><head><meta charset="utf-8"><style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .header { background: #001a1a; color: #00f2ff; text-align: center; padding: 40px; border-bottom: 5px solid #004d4d; }
                .header h1 { margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase; }
                .header p { margin: 5px 0 0; opacity: 0.7; font-size: 12px; }
                .info-section { padding: 30px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                .info-grid { display: table; width: 100%; }
                .info-item { display: table-cell; font-size: 13px; color: #64748b; }
                .info-item b { color: #0f172a; }
                table { width: 100%; border-collapse: collapse; margin-top: 0; }
                th { background: #f1f5f9; color: #475569; text-align: left; font-size: 11px; text-transform: uppercase; padding: 15px 12px; border-bottom: 2px solid #e2e8f0; }
                td { padding: 15px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; }
                .category-tag { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                .amount { font-weight: 900; color: #0f172a; text-align: right; }
                .status-paid { color: #10b981; font-weight: bold; }
                .status-pending { color: #f59e0b; font-weight: bold; }
                .footer { background: #001a1a; color: white; padding: 20px; }
                .total-row { background: #f0fdf4; }
                .total-label { text-align: right; font-weight: 900; color: #004d4d; text-transform: uppercase; font-size: 12px; }
            </style></head><body>
                <div class="header">
                    <h1>${reportTitle}</h1>
                    <p>Sistema de Gestión Financiera Bayup | Platinum v2.0</p>
                </div>
                <div class="info-section">
                    <div class="info-grid">
                        <div class="info-item"><b>Periodo:</b> ${selectedPeriod}</div>
                        <div class="info-item"><b>Fecha Emisión:</b> ${date}</div>
                        <div class="info-item"><b>Hora:</b> ${time}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Descripción del Concepto</th>
                            <th>Categoría</th>
                            <th>Método Pago</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                            <th style="text-align: right;">Monto (COP)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredExpenses.map(e => `
                            <tr>
                                <td>${e.description}</td>
                                <td><span class="category-tag">${e.category.replace('_', ' ')}</span></td>
                                <td>${e.payment_method}</td>
                                <td>${e.due_date}</td>
                                <td class="${e.status === 'paid' ? 'status-paid' : 'status-pending'}">
                                    ${e.status === 'paid' ? 'LIQUIDADO' : 'PENDIENTE'}
                                </td>
                                <td class="amount">${formatCurrency(e.amount)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="5" class="total-label">Balance Total Exportado:</td>
                            <td class="amount" style="color: #ef4444; font-size: 16px;">${formatCurrency(filteredExpenses.reduce((acc, e) => acc + e.amount, 0))}</td>
                        </tr>
                    </tbody>
                </table>
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 10px;">
                    © 2026 BAYUP INTERACTIVE UP. Documento generado por Bayt AI para fines de auditoría corporativa.
                </div>
            </body></html>
        `;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Reporte_${activeTab.toUpperCase()}_${selectedPeriod.replace(/\s+/g, '_')}.xls`;
        a.click();
        showToast("Reporte Platinum generado correctamente 📦", "success");
    };

    const renderActionBar = () => (
        <div className="w-full max-w-[1100px] mx-auto flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:shadow-xl focus-within:border-[#004d4d]/20 relative z-30">
            <div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input type="text" placeholder="Buscar gasto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" /></div>
            <div className="flex items-center gap-1">
                <div className="relative"><motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}><Filter size={18}/> <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Filtros</motion.span>}</AnimatePresence></motion.button></div>
                <div className="relative group/date"><motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${dateRange.start ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}><Calendar size={18}/> <AnimatePresence>{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Fechas</motion.span>}</AnimatePresence></motion.button><div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 scale-95 pointer-events-none group-hover/date:opacity-100 group-hover/date:scale-100 group-hover/date:pointer-events-auto transition-all z-50 flex gap-2"><input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px]"/><input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px]"/><button onClick={() => setDateRange({start:'', end:''})} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><RotateCcw size={14}/></button></div></div>
                <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleDownloadReport} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 border border-transparent hover:bg-white hover:border-gray-100 text-gray-500 transition-all"><Download size={18}/> <AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Reporte</motion.span>}</AnimatePresence></motion.button>
            </div>
        </div>
    );

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span><span className="text-[10px] font-black uppercase text-[#004d4d]/60 tracking-[0.2em]">Finanzas Operativas</span></div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Control de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Gastos</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Gestiona costos fijos y optimiza la <span className="font-bold text-[#001A1A]">salud financiera</span>.</p>
                </div>
                <button onClick={() => { setEditingExpense(null); setFormData({ description: '', amount: '', due_date: new Date().toISOString().split('T')[0], category: 'operativo_fijo', payment_method: 'Transferencia' }); setIsModalOpen(true); }} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group"><Zap size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Registrar Gasto</button>
            </div>

            {/* KPIs con TILT INTERACTIVOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[
                    { id: 'total', label: 'Total Gastos Mes', value: totals.total, icon: <Receipt size={20}/>, color: 'text-rose-600', trend: 'Pasivo' },
                    { id: 'fijos', label: 'Costos Fijos', value: totals.fixed, icon: <Briefcase size={20}/>, color: 'text-[#004d4d]', trend: 'Fijo' },
                    { id: 'diarios', label: 'Caja Menor', value: totals.daily, icon: <DollarSign size={20}/>, color: 'text-amber-500', trend: 'Variable' },
                    { id: 'pendientes', label: 'Pendiente Pago', value: totals.pending, icon: <Clock size={20}/>, color: 'text-rose-500', trend: 'Crítico' },
                ].map((kpi, i) => (
                    <div key={i} onClick={() => setSelectedKPI(kpi.id)} className="cursor-pointer h-full">
                        <TiltCard className="p-8">
                            <div className="flex justify-between items-start"><div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div><span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">Stats</span></div>
                            <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-2xl font-black text-gray-900 mt-1">$ <AnimatedNumber value={kpi.value} /></h3><p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{kpi.trend}</p></div>
                        </TiltCard>
                    </div>
                ))}
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center justify-center gap-4">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto relative z-10">
                    {[ { id: 'resumen', label: 'Todos los Gastos', icon: <LayoutGrid size={14}/> }, { id: 'fijos', label: 'Costos Fijos', icon: <Briefcase size={14}/> }, { id: 'diarios', label: 'Caja Menor', icon: <DollarSign size={14}/> }, { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> } ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{activeTab === tab.id && <motion.div layoutId="gastosTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}{tab.icon} {tab.label}</button>
                    ))}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004d4d] hover:bg-black hover:text-white transition-all group shrink-0"><Info size={20} className="group-hover:scale-110 transition-transform" /></button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {activeTab !== 'bayt' ? (
                        <div className="space-y-8">
                            {renderActionBar()}
                            <div className="px-4 space-y-4">
                                {filteredExpenses.map((e) => (
                                    <motion.div key={e.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                        <div className="flex items-center gap-6 flex-1"><div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black shadow-2xl ${e.category === 'operativo_fijo' ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-rose-50 text-rose-600'}`}>{e.category === 'operativo_fijo' ? <Briefcase size={24} /> : <ShoppingBag size={24} />}</div><div><div className="flex items-center gap-3"><h4 className="text-xl font-black text-gray-900 tracking-tight">{e.description}</h4><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${e.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{e.status === 'paid' ? 'Liquidado' : 'Pendiente'}</span></div><p className="text-[10px] text-gray-400 font-bold uppercase mt-1 italic">{e.category.replace('_', ' ')}</p></div></div>
                                        <div className="flex-[1.5] grid grid-cols-3 gap-8 px-10 border-x border-gray-50"><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Método</p><p className="text-xs font-black text-gray-900 mt-1">{e.payment_method}</p></div><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Fecha</p><p className="text-xs font-black text-gray-900 mt-1">{e.due_date}</p></div><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Monto</p><p className="text-sm font-black text-rose-600 mt-1">{formatCurrency(e.amount)}</p></div></div>
                                                                                <div className="flex items-center gap-4">
                                                                                    <button onClick={() => { setEditingExpense(e); setFormData({ description: e.description, amount: e.amount.toString(), due_date: e.due_date, category: e.category, payment_method: e.payment_method }); setIsModalOpen(true); }} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><Edit3 size={20}/></button>
                                                                                    <button onClick={() => setExpenseToDelete(e)} className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-all shadow-inner"><Trash2 size={20}/></button>
                                                                                </div>
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                        
                        <div className="px-4"><div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5"><div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><DollarSign size={300} /></div><div className="flex flex-col md:flex-row items-center gap-16 relative z-10"><div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div><div className="flex-1 space-y-6"><h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Expense Insight</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Tus gastos fijos representan el 65% de tu operación. Centralizar proveedores podría ahorrarte un 8% mensual."</p></div><div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Se detectó un pico de gastos en Caja Menor la semana pasada. Recomiendo revisar facturas de logística."</p></div></div></div></div></div></div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL DETALLE KPI DINÁMICO */}
            <AnimatePresence>
                {selectedKPI && (
                    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedKPI(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-white">
                            <div className="p-10 bg-gradient-to-br from-gray-900 to-[#001a1a] text-white relative">
                                <button onClick={() => setSelectedKPI(null)} className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"><X size={20} className="group-hover:rotate-90 transition-transform"/></button>
                                <div className="space-y-4"><h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedKPI === 'total' ? 'Egresos Mes' : selectedKPI === 'fijos' ? 'Costos Fijos' : selectedKPI === 'diarios' ? 'Caja Menor' : 'Pendientes'}</h3><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f2ff]">Financial Strategy Bayup</p></div>
                            </div>
                            <div className="p-10 space-y-8">
                                {selectedKPI === 'total' && (<div className="space-y-6"><div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Comparativa vs Enero</p><p className="text-xl font-black text-rose-500">+12.4% Gasto</p></div><div className="p-6 bg-gray-50 rounded-2xl"><p className="text-xs font-medium italic">"El incremento se debe a la inversión en bodega. Mantén el control de suministros."</p></div></div>)}
                                {selectedKPI === 'fijos' && (<div className="space-y-6"><div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Impacto Utilidad</p><p className="text-xl font-black text-[#004d4d]">35% del Ingreso</p></div><div className="p-10 bg-gray-900 rounded-[2.5rem] text-white text-center relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown size={100}/></div><p className="text-sm font-medium text-[#00f2ff] italic">"Costos estables. Renegociar logística liberaría un 3% de rentabilidad."</p></div></div>)}
                                {selectedKPI === 'diarios' && (<div className="space-y-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Picos de Caja Menor</p><div className="p-6 bg-amber-50 rounded-3xl"><p className="text-xs font-medium text-amber-800 italic">"Detecté 5 micro-compras de papelería. Centralizar pedidos ahorraría costos de envío."</p></div></div>)}
                                {selectedKPI === 'pendientes' && (<div className="space-y-6"><div className="grid grid-cols-2 gap-4"><div className="p-5 bg-rose-50 rounded-2xl text-center"><p className="text-[10px] font-black text-rose-600 uppercase mb-1">Por Pagar</p><p className="text-2xl font-black">{formatCurrency(totals.pending)}</p></div><div className="p-5 bg-emerald-50 rounded-2xl text-center"><p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Pagado</p><p className="text-2xl font-black">{formatCurrency(totals.total - totals.pending)}</p></div></div><p className="text-[10px] font-medium text-gray-500 text-center italic">"2 facturas vencen en 48 horas. Liquídalas para evitar recargos."</p></div>)}
                                <button onClick={() => setSelectedKPI(null)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black">Cerrar Análisis</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL REGISTRO/EDICION */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-10 relative z-10 border border-white overflow-hidden">
                            <form onSubmit={handleSaveExpense} className="space-y-8">
                                <div className="flex justify-between items-center"><div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner"><DollarSign size={24}/></div><button type="button" onClick={() => setIsModalOpen(false)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500"><X size={20}/></button></div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic">{editingExpense ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4"><button type="button" onClick={() => setFormData({...formData, category: 'operativo_fijo'})} className={`py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.category === 'operativo_fijo' ? 'border-[#004d4d] bg-[#004d4d] text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>Gasto Fijo</button><button type="button" onClick={() => setFormData({...formData, category: 'operativo_diario'})} className={`py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.category === 'operativo_diario' ? 'border-rose-500 bg-rose-500 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>Caja Menor</button></div>
                                    <input required placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-bold shadow-inner" />
                                    <input required placeholder="Monto" value={formatDots(formData.amount)} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-black shadow-inner" />
                                    <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-bold shadow-inner" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black flex items-center justify-center gap-3"><CheckCircle2 size={18} className="text-[#00f2ff]"/> {editingExpense ? 'Guardar' : 'Confirmar'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE PLATINUM */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            
                            {/* SIDEBAR TÁCTICO */}
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3">
                                <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"><Bot size={24}/></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004d4d] mb-4">Guía Maestro Gastos</h3>
                                
                                {[
                                    { id: 0, label: 'Todos los Gastos', icon: <LayoutGrid size={16}/> },
                                    { id: 1, label: 'Costos Fijos', icon: <Briefcase size={16}/> },
                                    { id: 2, label: 'Caja Menor', icon: <DollarSign size={16}/> },
                                    { id: 3, label: 'Bayt Insight', icon: <Sparkles size={16}/> }
                                ].map(step => (
                                    <button 
                                        key={step.id} 
                                        onClick={() => setActiveGuideStep(step.id)} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-xl shadow-[#004d4d]/20' : 'text-gray-500 hover:bg-white hover:shadow-sm'}`}
                                    >
                                        <div className={activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-300'}>{step.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                    </button>
                                ))}

                                <div className="mt-auto pt-8 border-t border-gray-100 px-2">
                                    <p className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em]">Bayup Finance Core v2.0</p>
                                </div>
                            </div>

                            {/* CONTENIDO ESTRATÉGICO VISUAL */}
                            <div className="flex-1 p-16 flex flex-col justify-between relative bg-white overflow-y-auto custom-scrollbar">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100]"><X size={24}/></button>
                                
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Terminal de <span className="text-[#004D4D]">Egresos</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">&quot;Esta pantalla centraliza cada salida de capital de tu marca para una auditoría impecable.&quot;</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] mb-6 shadow-sm"><Search size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Búsqueda & Suite</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Filtra gastos por concepto, fecha o categoría. Usa el botón de Reporte para exportar auditorías a Excel.</p>
                                                </div>
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#00f2ff] mb-6 shadow-sm"><Zap size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Acción Rápida</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Utiliza el botón 'Registrar Gasto' para capturar en segundos cualquier movimiento financiero.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 1 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Costos <span className="text-[#004D4D]">Fijos</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">La columna vertebral de tu operación. Arriendos, servicios y nómina base.</p>
                                            </div>
                                            <div className="relative p-10 bg-gray-900 rounded-[3.5rem] overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 p-4 opacity-10"><Briefcase size={120}/></div>
                                                <div className="space-y-6 relative z-10">
                                                    <p className="text-sm font-medium text-gray-300 italic leading-relaxed">&quot;Medimos los costos fijos para entender tu Punto de Equilibrio. Bayt te notificará si estos costos superan el 40% de tus ingresos brutos.&quot;</p>
                                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <ShieldCheck className="text-emerald-400" size={20}/>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Salud Estructural OK</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 2 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Caja <span className="text-[#004D4D]">Menor</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Gastos operativos diarios y micro-compras que suelen fugar utilidad.</p>
                                            </div>
                                            <div className="p-10 bg-gray-50 rounded-[3.5rem] border border-gray-100 flex items-center gap-10">
                                                <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center shadow-xl shrink-0"><DollarSign size={40}/></div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-black uppercase tracking-widest text-gray-900">Control de Fugas</p>
                                                    <p className="text-xs font-medium text-gray-500 italic leading-relaxed">&quot;El 15% de la utilidad se pierde en gastos hormiga. Registra cada cinta, cada envío y cada insumo pequeño aquí.&quot;</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 3 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Bayt <span className="text-[#004D4D]">Insight</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Análisis predictivo aplicado a la optimización de egresos.</p>
                                            </div>
                                            <div className="p-10 bg-[#001A1A] rounded-[3.5rem] relative overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/10 rounded-full blur-[80px]"></div>
                                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                                    <div className="h-20 w-20 bg-[#00f2ff]/10 text-[#00f2ff] rounded-[2rem] border border-[#00f2ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.2)] animate-pulse"><Bot size={48}/></div>
                                                    <div className="space-y-4">
                                                        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#00f2ff]">Supply-AI Strategist</p>
                                                        <p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Bayt detecta patrones de gasto. Te dirá cuándo centralizar compras para ahorrar costos de envío y qué días de la semana gastas más de lo proyectado.&quot;</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-12 pt-12 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-900 text-[#00f2ff] flex items-center justify-center font-black text-xs shadow-lg italic">B</div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bayup Expense Manager v2.0</p>
                                    </div>
                                    <button onClick={() => setIsGuideOpen(false)} className="px-12 py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl">Entendido, Continuar Operación</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL CONFIRMACIÓN ELIMINACIÓN GASTO */}
            <AnimatePresence>
                {expenseToDelete && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExpenseToDelete(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center relative z-10 border border-white">
                            <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100 animate-bounce">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic">¿Remover Registro?</h3>
                            <p className="text-gray-500 text-sm mt-4 font-medium italic leading-relaxed">
                                Estás por eliminar el concepto:<br/>
                                <span className="font-bold text-gray-900">&quot;{expenseToDelete.description}&quot;</span><br/>
                                Esta acción es irreversible.
                            </p>
                            <div className="flex flex-col gap-3 mt-10">
                                <button 
                                    onClick={() => {
                                        saveExpenses(expenses.filter(ex => ex.id !== expenseToDelete.id));
                                        setExpenseToDelete(null);
                                        showToast("Gasto eliminado correctamente 🗑️", "info");
                                    }} 
                                    className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all active:scale-95"
                                >
                                    Eliminar Definitivamente
                                </button>
                                <button 
                                    onClick={() => setExpenseToDelete(null)} 
                                    className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all"
                                >
                                    Cancelar
                                </button>
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
