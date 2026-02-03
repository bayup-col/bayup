"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit3, Search, Tag, X, CheckCircle2, 
  DollarSign, Calendar, ChevronDown, LayoutGrid, 
  Filter, Download, Sparkles, Bot, Zap, TrendingUp, 
  Activity, Target, ArrowUpRight, Clock, Briefcase, 
  Users, ShieldCheck, AlertCircle, FileText, CreditCard, 
  Receipt, ShoppingBag, Loader2, Info
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
    const [filterCategory, setFilterCategory] = useState("all");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState("Febrero 2026");
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // --- COMPONENTE BOTÓN EXPANDIBLE ---
    const ExpandableButton = ({ icon: Icon, label, onClick, variant = "white" }: any) => {
        const [isHovered, setIsHovered] = useState(false);
        return (
            <button
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
                className={`h-12 flex items-center justify-center rounded-2xl transition-all duration-500 border ${
                    variant === "black" ? "bg-gray-900 text-white border-transparent" : "bg-white text-slate-500 border-gray-100 hover:bg-gray-50"
                } ${isHovered ? "px-6 gap-3" : "w-12 px-0"}`}
            >
                <Icon size={18} className={variant === "black" ? "text-[#00f2ff]" : ""} />
                <AnimatePresence>
                    {isHovered && (
                        <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "auto", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        );
    };
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
        if (saved) {
            setExpenses(JSON.parse(saved));
        } else {
            const initial: Expense[] = [
                { id: '1', description: 'Arriendo Bodega', amount: 3500000, due_date: '2026-02-05', status: 'paid', category: 'operativo_fijo', payment_method: 'Transferencia' },
                { id: '2', description: 'Cintas de embalaje', amount: 45000, due_date: '2026-02-01', status: 'pending', category: 'operativo_diario', payment_method: 'Efectivo' }
            ];
            setExpenses(initial);
            localStorage.setItem('bayup_expenses_data', JSON.stringify(initial));
        }
        setLoading(false);
    }, []);

    const saveExpenses = (data: Expense[]) => {
        setExpenses(data);
        localStorage.setItem('bayup_expenses_data', JSON.stringify(data));
    };

    // --- HELPERS ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        if (!num) return "";
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
            return matchesSearch && matchesTab && matchesFilter;
        });
    }, [expenses, searchTerm, activeTab, filterCategory]);

    // --- HANDLERS ---
    const handleSaveExpense = (e: React.FormEvent) => {
        e.preventDefault();
        const amountNum = parseInt(formData.amount.replace(/\D/g, ''));
        if (!formData.description || isNaN(amountNum)) {
            showToast("Completa los campos obligatorios", "error");
            return;
        }

        if (editingExpense) {
            const newData = expenses.map(ex => ex.id === editingExpense.id ? { ...ex, ...formData, amount: amountNum } : ex);
            saveExpenses(newData);
            showToast("Gasto actualizado", "success");
        } else {
            const newEx: Expense = {
                id: Date.now().toString(),
                ...formData,
                amount: amountNum,
                status: 'pending'
            };
            saveExpenses([...expenses, newEx]);
            showToast("Gasto registrado exitosamente", "success");
        }
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    const handleLiquidar = (id: string) => {
        const newData = expenses.map(ex => ex.id === id ? { ...ex, status: 'paid' as const } : ex);
        saveExpenses(newData);
        showToast("Pago confirmado ✅", "success");
    };

    const handleDelete = (id: string) => {
        if (!confirm("¿Eliminar este registro de gasto?")) return;
        saveExpenses(expenses.filter(ex => ex.id !== id));
        showToast("Registro eliminado", "info");
    };

    const handleDownloadReport = () => {
        const html = `
            <html><body style="font-family: sans-serif; padding: 40px;">
                <h1 style="color: #004d4d;">REPORTE DE GASTOS BAYUP</h1>
                <p>Periodo: Febrero 2026 | Generado: ${new Date().toLocaleDateString()}</p>
                <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background: #004d4d; color: white;">
                        <th>Descripción</th><th>Categoría</th><th>Monto</th><th>Estado</th>
                    </tr>
                    ${filteredExpenses.map(e => `<tr><td>${e.description}</td><td>${e.category}</td><td>${formatCurrency(e.amount)}</td><td>${e.status}</td></tr>`).join('')}
                </table>
                <h3 style="margin-top: 30px;">TOTAL GASTOS: ${formatCurrency(totals.total)}</h3>
            </body></html>
        `;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Reporte_Gastos_Bayup.xls';
        a.click();
        showToast("Reporte descargado 🚀", "success");
    };

    const renderActionBar = () => (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar concepto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3 relative">
                <ExpandableButton 
                    icon={Filter} 
                    label="Filtrar" 
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} 
                />
                
                <AnimatePresence>
                    {isFilterMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-gray-100">
                            <button onClick={() => { setFilterCategory('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Todos</button>
                            <button onClick={() => { setFilterCategory('operativo_fijo'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Costos Fijos</button>
                            <button onClick={() => { setFilterCategory('operativo_diario'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Caja Menor</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ExpandableButton 
                    icon={Download} 
                    label="Reporte" 
                    onClick={handleDownloadReport}
                    variant="black"
                />
            </div>
        </div>
    );

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase text-[#004d4d]/60 tracking-[0.2em]">Finanzas Operativas</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Control de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Gastos</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Gestiona costos fijos, caja menor y optimiza la <span className="font-bold text-[#001A1A]">salud financiera</span> de tu negocio.
                    </p>
                </div>
                <button onClick={() => { setEditingExpense(null); setFormData({ description: '', amount: '', due_date: new Date().toISOString().split('T')[0], category: 'operativo_fijo', payment_method: 'Transferencia' }); setIsModalOpen(true); }} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                    <Zap size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Registrar Gasto
                </button>
            </div>

            {/* KPIs con TILT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[
                    { label: 'Total Gastos Mes', value: formatCurrency(totals.total), icon: <Receipt size={20}/>, color: 'text-rose-600', trend: 'Pasivo' },
                    { label: 'Costos Fijos', value: formatCurrency(totals.fixed), icon: <Briefcase size={20}/>, color: 'text-[#004d4d]', trend: 'Fijo' },
                    { label: 'Caja Menor', value: formatCurrency(totals.daily), icon: <DollarSign size={20}/>, color: 'text-amber-500', trend: 'Variable' },
                    { label: 'Pendiente Pago', value: formatCurrency(totals.pending), icon: <Clock size={20}/>, color: 'text-rose-500', trend: 'Crítico' },
                ].map((kpi, i) => (
                    <TiltCard key={i} className="p-8">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                            <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase">{kpi.trend}</span>
                        </div>
                        <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3></div>
                    </TiltCard>
                ))}
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center justify-center gap-4">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto">
                    {[
                        { id: 'resumen', label: 'Todos los Gastos', icon: <LayoutGrid size={14}/> },
                        { id: 'fijos', label: 'Costos Fijos', icon: <Briefcase size={14}/> },
                        { id: 'diarios', label: 'Caja Menor', icon: <DollarSign size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* BOTON INFO INDEPENDIENTE */}
                <button 
                    onClick={() => setIsGuideOpen(true)}
                    className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004d4d] hover:bg-[#004d4d] hover:text-white transition-all group"
                >
                    <Info size={20} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                    {activeTab !== 'bayt' ? (
                        <div className="space-y-8">
                            {renderActionBar()}



                            {/* Lista de Gastos Operativa */}
                            <div className="px-4 space-y-4">
                                {filteredExpenses.map((e) => (
                                    <motion.div key={e.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black shadow-2xl ${e.category === 'operativo_fijo' ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-rose-50 text-rose-600'}`}>
                                                {e.category === 'operativo_fijo' ? <Briefcase size={24} /> : <ShoppingBag size={24} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-xl font-black text-gray-900 tracking-tight">{e.description}</h4>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${e.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{e.status === 'paid' ? 'Liquidado' : 'Pendiente'}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">{e.category.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="flex-[1.5] grid grid-cols-3 gap-8 px-10 border-x border-gray-50">
                                            <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Método</p><p className="text-xs font-black text-gray-900 mt-1">{e.payment_method}</p></div>
                                            <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Fecha</p><p className="text-xs font-black text-gray-900 mt-1">{e.due_date}</p></div>
                                            <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Monto</p><p className="text-sm font-black text-rose-600 mt-1">{formatCurrency(e.amount)}</p></div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => { setEditingExpense(e); setFormData({ description: e.description, amount: e.amount.toString(), due_date: e.due_date, category: e.category, payment_method: e.payment_method }); setIsModalOpen(true); }} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><Edit3 size={20}/></button>
                                            <button onClick={() => handleDelete(e.id)} className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-all shadow-inner"><Trash2 size={20}/></button>
                                            {e.status !== 'paid' && <button onClick={() => handleLiquidar(e.id)} className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><CheckCircle2 size={20} className="text-[#00f2ff]"/></button>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="px-4">
                            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><DollarSign size={300} /></div>
                                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                                    <div className="flex-1 space-y-6">
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Expense Insight</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Tus gastos fijos representan el 65% de tu operación. Centralizar proveedores podría ahorrarte un 8% mensual."</p></div>
                                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Se detectó un pico de gastos en Caja Menor la semana pasada. Recomiendo revisar facturas de logística."</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL REGISTRO/EDICION */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-10 relative z-10 border border-white overflow-hidden">
                            <form onSubmit={handleSaveExpense} className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner"><DollarSign size={24}/></div>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic">{editingExpense ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" onClick={() => setFormData({...formData, category: 'operativo_fijo'})} className={`py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.category === 'operativo_fijo' ? 'border-[#004d4d] bg-[#004d4d] text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>Gasto Fijo</button>
                                        <button type="button" onClick={() => setFormData({...formData, category: 'operativo_diario'})} className={`py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.category === 'operativo_diario' ? 'border-rose-500 bg-rose-500 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>Caja Menor</button>
                                    </div>
                                    <input required placeholder="Descripción del concepto" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-bold shadow-inner" />
                                    <div className="space-y-2">
                                        <input required placeholder="Monto ($ 0.00)" value={formatDots(formData.amount)} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-black shadow-inner" />
                                        <p className="text-[10px] font-black text-[#004d4d] ml-2">Vista previa: {formatCurrency(parseInt(formData.amount || '0'))}</p>
                                    </div>
                                    <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-bold shadow-inner" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                    <CheckCircle2 size={18} className="text-[#00f2ff]"/> {editingExpense ? 'Guardar Cambios' : 'Confirmar Registro'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* MODAL GUÍA OPERATIVA ESTILO PEDIDOS */}
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-5xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            
                            {/* COLUMNA IZQUIERDA: MENÚ DE MÓDULOS */}
                            <div className="w-full md:w-[300px] bg-gray-50 border-r border-gray-100 p-8 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                                <div className="mb-8 px-2">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004d4d]">Guía Operativa</h3>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1">Control de Gastos</p>
                                </div>
                                
                                {[
                                    { id: 0, label: 'Registro Táctico', icon: <Zap size={14}/>, color: 'text-amber-500' },
                                    { id: 1, label: 'Clasificación', icon: <LayoutGrid size={14}/>, color: 'text-[#00f2ff]' },
                                    { id: 2, label: 'Liquidación', icon: <CheckCircle2 size={14}/>, color: 'text-emerald-500' },
                                    { id: 3, label: 'Análisis Bayt', icon: <Bot size={14}/>, color: 'text-[#004d4d]' }
                                ].map((step) => (
                                    <button 
                                        key={step.id}
                                        onClick={() => setActiveGuideStep(step.id)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-lg shadow-[#004d4d]/20' : 'text-gray-500 hover:bg-white hover:shadow-sm'}`}
                                    >
                                        <div className={`${activeGuideStep === step.id ? 'text-white' : step.color}`}>{step.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                    </button>
                                ))}

                                <div className="mt-auto pt-8 border-t border-gray-100 px-2">
                                    <p className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em]">Bayup Financial Core</p>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: FUNCIONES Y DETALLE */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#004d4d] shadow-inner font-black italic">
                                            0{activeGuideStep + 1}
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
                                            {[
                                                'Registro de Capital',
                                                'Categorización de Costos',
                                                'Flujo de Pagos',
                                                'Optimización Inteligente'
                                            ][activeGuideStep]}
                                        </h2>
                                    </div>
                                    <button onClick={() => setIsGuideOpen(false)} className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="h-1 w-4 bg-[#004d4d] rounded-full" /> Definición del Módulo
                                        </h4>
                                        <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner italic">
                                            {[
                                                "Utiliza el botón central 'Registrar Gasto' para capturar salidas de dinero. Es vital registrar el monto exacto y la fecha para no descuadrar tu caja mensual.",
                                                "Divide tus gastos entre 'Fijos' (operación mensual) y 'Caja Menor' (compras rápidas). Esto permite a la IA entender dónde puedes ahorrar dinero realmente.",
                                                "Cada registro aparece como 'Pendiente' hasta que confirmes el pago real. Usa el icono de Check en la lista para liquidar la obligación financiera.",
                                                "El panel Bayt Insight analiza tus patrones de gasto. Te dirá qué proveedores son más costosos y cuándo es el mejor momento para reabastecer insumos."
                                            ][activeGuideStep]}
                                        </p>
                                    </section>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                            <div className="flex items-center gap-3 text-emerald-600">
                                                <ShieldCheck size={18} />
                                                <h5 className="text-[10px] font-black uppercase tracking-widest">Impacto Financiero</h5>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                {[
                                                    "Afecta el KPI de 'Pasivos Totales' en tiempo real.",
                                                    "Sincroniza con los 'Topes de Facturación' configurados.",
                                                    "Libera saldo en tus cuentas de recaudo asociadas.",
                                                    "Aumenta el ROI operativo de tu capital humano."
                                                ][activeGuideStep]}
                                            </p>
                                        </div>
                                        <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                                            <div className="flex items-center gap-3 text-[#00f2ff]">
                                                <Zap size={18} />
                                                <h5 className="text-[10px] font-black uppercase tracking-widest">Pro-Tip Bayup</h5>
                                            </div>
                                            <p className="text-xs text-white/70 font-medium leading-relaxed italic">
                                                {[
                                                    "Sube una foto del comprobante físico para auditorías.",
                                                    "Programa gastos fijos los primeros 5 días del mes.",
                                                    "No dejes pendientes por más de 48 horas.",
                                                    "Sigue los consejos de Bayt para bajar costos un 15%."
                                                ][activeGuideStep]}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-gray-50 bg-gray-50/30 flex justify-end">
                                    <button onClick={() => setIsGuideOpen(false)} className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                                        Entendido, Continuar
                                    </button>
                                </div>
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