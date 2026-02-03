"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit3, Search, Tag, X, CheckCircle2, 
  DollarSign, Calendar, ChevronRight, LayoutGrid, 
  Filter, Download, Sparkles, Bot, Zap, TrendingUp, 
  Activity, Target, ArrowUpRight, ArrowDownRight,
  Clock, Briefcase, Users, ShieldCheck, AlertCircle, 
  FileText, CreditCard, Receipt, ShoppingBag, Info, Loader2
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface DebtRecord {
    id: string;
    entity_name: string; 
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue';
    type: 'payable' | 'receivable';
    invoice_num: string;
    category: string;
    description: string;
    created_at: string;
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

export default function CuentasCarteraPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'pagar' | 'cobrar' | 'bayt'>('pagar');
    const [records, setRecords] = useState<DebtRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [editingRecord, setEditingRecord] = useState<DebtRecord | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<DebtRecord | null>(null);

    const [formData, setFormData] = useState({
        entity_name: '',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        type: 'payable' as 'payable' | 'receivable',
        invoice_num: '',
        category: 'Insumos',
        description: ''
    });

    // --- PERSISTENCIA ---
    useEffect(() => {
        const saved = localStorage.getItem('bayup_debt_records');
        if (saved) {
            setRecords(JSON.parse(saved));
        } else {
            const initial: DebtRecord[] = [
                { id: '1', entity_name: 'Textiles del Norte', amount: 4500000, due_date: '2026-02-15', status: 'pending', type: 'payable', invoice_num: 'INV-8820', category: 'Materia Prima', description: 'Compra de lino primavera', created_at: '2026-01-20' },
                { id: '2', entity_name: 'Andrés VIP', amount: 1250000, due_date: '2026-02-05', status: 'overdue', type: 'receivable', invoice_num: 'FAC-9010', category: 'Venta Crédito', description: 'Venta de relojes', created_at: '2026-01-10' }
            ];
            setRecords(initial);
            localStorage.setItem('bayup_debt_records', JSON.stringify(initial));
        }
        setLoading(false);
    }, []);

    const saveRecords = (data: DebtRecord[]) => {
        setRecords(data);
        localStorage.setItem('bayup_debt_records', JSON.stringify(data));
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
        const payable = records.filter(r => r.type === 'payable' && r.status !== 'paid').reduce((acc, r) => acc + r.amount, 0);
        const receivable = records.filter(r => r.type === 'receivable' && r.status !== 'paid').reduce((acc, r) => acc + r.amount, 0);
        const overdueCount = records.filter(r => r.status === 'overdue').length;
        return { payable, receivable, overdueCount };
    }, [records]);

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = r.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || r.invoice_num.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = (activeTab === 'pagar' && r.type === 'payable') || (activeTab === 'cobrar' && r.type === 'receivable');
            let matchesFilter = true;
            if (filterStatus === 'overdue') matchesFilter = r.status === 'overdue';
            if (filterStatus === 'pending') matchesFilter = r.status === 'pending';
            return matchesSearch && matchesTab && matchesFilter;
        });
    }, [records, searchTerm, activeTab, filterStatus]);

    // --- HANDLERS ---
    const handleSaveRecord = (e: React.FormEvent) => {
        e.preventDefault();
        const amountNum = parseInt(formData.amount.replace(/\D/g, ''));
        if (!formData.entity_name || isNaN(amountNum)) {
            showToast("Completa los campos obligatorios", "error");
            return;
        }

        if (editingRecord) {
            const newData = records.map(r => r.id === editingRecord.id ? { ...r, ...formData, amount: amountNum } : r);
            saveRecords(newData);
            showToast("Registro actualizado", "success");
        } else {
            const newRec: DebtRecord = {
                id: Date.now().toString(),
                ...formData,
                amount: amountNum,
                status: 'pending',
                created_at: new Date().toLocaleDateString()
            };
            saveRecords([...records, newRec]);
            showToast("Obligación registrada", "success");
        }
        setIsModalOpen(false);
        setEditingRecord(null);
    };

    const handleLiquidar = (id: string) => {
        const newData = records.map(r => r.id === id ? { ...r, status: 'paid' as const } : r);
        saveRecords(newData);
        showToast("Saldo actualizado ✅", "success");
        setSelectedDetail(null);
    };

    const handleDelete = (id: string) => {
        if (!confirm("¿Eliminar este registro de cartera?")) return;
        saveRecords(records.filter(r => r.id !== id));
        showToast("Registro eliminado", "info");
    };

    const handleDownloadExcel = () => {
        const title = activeTab === 'pagar' ? 'REPORTE DE CUENTAS POR PAGAR' : 'REPORTE DE CARTERA POR COBRAR';
        const html = `
            <html><body>
                <h1 style="color: #004d4d;">${title}</h1>
                <p>Periodo: ${new Date().toLocaleDateString()}</p>
                <table border="1">
                    <tr style="background: #004d4d; color: white;"><th>Entidad</th><th>Factura</th><th>Monto</th><th>Estado</th><th>Vencimiento</th></tr>
                    ${filteredRecords.map(r => `<tr><td>${r.entity_name}</td><td>${r.invoice_num}</td><td>${formatCurrency(r.amount)}</td><td>${r.status}</td><td>${r.due_date}</td></tr>`).join('')}
                </table>
            </body></html>
        `;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bayup_Cartera_${activeTab}.xls`;
        a.click();
        showToast("Excel profesional generado 🚀", "success");
    };

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
                        <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        );
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase text-[#004d4d]/60 tracking-[0.2em]">Recuperación de Activos</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Cuentas <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">& Cartera</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control de obligaciones con proveedores y <span className="font-bold text-[#001A1A]">cobranza inteligente de clientes</span>.
                    </p>
                </div>
                <button onClick={() => { setEditingRecord(null); setFormData({ entity_name: '', amount: '', due_date: new Date().toISOString().split('T')[0], type: activeTab === 'pagar' ? 'payable' : 'receivable', invoice_num: '', category: 'General', description: '' }); setIsModalOpen(true); }} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                    <Zap size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Nueva Obligación
                </button>
            </div>

            {/* KPIs Platinum */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[
                    { label: 'Cuentas por Pagar', value: formatCurrency(totals.payable), icon: <CreditCard size={20}/>, color: 'text-rose-600', trend: 'Pasivo' },
                    { label: 'Cartera por Cobrar', value: formatCurrency(totals.receivable), icon: <Users size={20}/>, color: 'text-emerald-600', trend: 'Activo' },
                    { label: 'Balance Neto', value: formatCurrency(totals.receivable - totals.payable), icon: <Activity size={20}/>, color: 'text-[#004d4d]', trend: 'Equilibrio' },
                    { label: 'Vencimientos 7d', value: totals.overdueCount, icon: <Clock size={20}/>, color: 'text-amber-500', trend: 'Crítico' },
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

            {/* Tabs & Info Button */}
            <div className="flex items-center justify-center gap-4">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto">
                    {[
                        { id: 'pagar', label: 'Cuentas por Pagar', icon: <CreditCard size={14}/> },
                        { id: 'cobrar', label: 'Cartera de Clientes', icon: <Users size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004d4d] hover:bg-[#004d4d] hover:text-white transition-all group">
                    <Info size={20} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                    {activeTab !== 'bayt' ? (
                        <div className="space-y-8">
                            {/* Action Bar Expandable */}
                            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input type="text" placeholder="Buscar por entidad o factura..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" />
                                </div>
                                <div className="flex items-center gap-3 relative">
                                    <ExpandableButton icon={Filter} label="Filtrar" onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} />
                                    <AnimatePresence>
                                        {isFilterMenuOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-gray-100">
                                                <button onClick={() => { setFilterStatus('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Todos</button>
                                                <button onClick={() => { setFilterStatus('overdue'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50 text-rose-600">Vencidos</button>
                                                <button onClick={() => { setFilterStatus('pending'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50 text-amber-600">Pendientes</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <ExpandableButton icon={Download} label="Exportar" onClick={handleDownloadExcel} variant="black" />
                                </div>
                            </div>

                            {/* Record List */}
                            <div className="px-4 space-y-4">
                                {filteredRecords.map((r) => (
                                    <motion.div key={r.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black shadow-2xl ${r.type === 'payable' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {r.type === 'payable' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-xl font-black text-gray-900 tracking-tight">{r.entity_name}</h4>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${r.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : r.status === 'overdue' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{r.status}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Factura: {r.invoice_num}</p>
                                            </div>
                                        </div>
                                        <div className="flex-[1.5] grid grid-cols-3 gap-8 px-10 border-x border-gray-50">
                                            <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Categoría</p><p className="text-xs font-black text-gray-900 mt-1">{r.category}</p></div>
                                            <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Vencimiento</p><p className="text-xs font-black text-gray-900 mt-1">{r.due_date}</p></div>
                                            <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase">Monto</p><p className={`text-sm font-black mt-1 ${r.type === 'payable' ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(r.amount)}</p></div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setSelectedDetail(r)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><FileText size={20}/></button>
                                            <button onClick={() => { setEditingRecord(r); setFormData({ entity_name: r.entity_name, amount: r.amount.toString(), due_date: r.due_date, type: r.type, invoice_num: r.invoice_num, category: r.category, description: r.description }); setIsModalOpen(true); }} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><Edit3 size={20}/></button>
                                            <button onClick={() => handleDelete(r.id)} className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-all shadow-inner"><Trash2 size={20}/></button>
                                            {r.status !== 'paid' && <button onClick={() => handleLiquidar(r.id)} className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><CheckCircle2 size={20} className="text-[#00f2ff]"/></button>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="px-4">
                            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShieldCheck size={300} /></div>
                                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                                    <div className="flex-1 space-y-6">
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Debt Insight</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest">Optimización de Pago</p></div>
                                                <p className="text-sm font-medium italic leading-relaxed text-white/80">"Tu cartera por cobrar supera en un 40% a tus deudas. Sugerimos reinvertir el excedente en stock de alta rotación."</p>
                                            </div>
                                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3"><AlertCircle className="text-rose-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Riesgo de Vencimiento</p></div>
                                                <p className="text-sm font-medium italic leading-relaxed text-white/80">"3 facturas de clientes entran en mora mañana. ¿Deseas que Bayt redacte un mensaje de cobro persuasivo?"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL REGISTRO OBLIGACIÓN */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-10 relative z-10 border border-white">
                            <form onSubmit={handleSaveRecord} className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><Zap size={24}/></div>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic">Nueva Obligación</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" onClick={() => setFormData({...formData, type: 'payable'})} className={`py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.type === 'payable' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-100 text-gray-400'}`}>Por Pagar</button>
                                        <button type="button" onClick={() => setFormData({...formData, type: 'receivable'})} className={`py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.type === 'receivable' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-100 text-gray-400'}`}>Por Cobrar</button>
                                    </div>
                                    <input required placeholder="Nombre Entidad (Proveedor/Cliente)" value={formData.entity_name} onChange={e => setFormData({...formData, entity_name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <input required placeholder="Monto ($)" value={formatDots(formData.amount)} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-black shadow-inner" />
                                            <p className="text-[9px] font-black text-[#004d4d] ml-2">Total: {formatCurrency(parseInt(formData.amount || '0'))}</p>
                                        </div>
                                        <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    </div>
                                    <input placeholder="Nro Factura / Referencia" value={formData.invoice_num} onChange={e => setFormData({...formData, invoice_num: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all">Confirmar Registro</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE RE-DISEÑADA */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            
                            {/* COLUMNA IZQUIERDA: MENÚ TÁCTICO */}
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                                <div className="mb-10 px-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-pulse"></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60">Estrategia Financiera</h3>
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 leading-tight italic uppercase">Mastering<br/>Cartera & AP</h4>
                                </div>
                                
                                {[
                                    { id: 0, label: 'Activos Corrientes', icon: <TrendingUp size={14}/>, desc: 'Captura de flujo entrante' },
                                    { id: 1, label: 'Pasivos y Deuda', icon: <CreditCard size={14}/>, desc: 'Gestión de obligaciones' },
                                    { id: 2, label: 'Aging & Riesgo', icon: <ShieldCheck size={14}/>, desc: 'Análisis de vencimiento' },
                                    { id: 3, label: 'Conversión Cash', icon: <Zap size={14}/>, desc: 'Liquidación de capital' }
                                ].map((step) => (
                                    <button 
                                        key={step.id} 
                                        onClick={() => setActiveGuideStep(step.id)} 
                                        className={`group flex flex-col gap-1 p-5 rounded-[2rem] transition-all text-left border ${activeGuideStep === step.id ? 'bg-[#004d4d] border-transparent shadow-2xl shadow-[#004d4d]/30' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`transition-colors ${activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-400 group-hover:text-[#004d4d]'}`}>{step.icon}</div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeGuideStep === step.id ? 'text-white' : 'text-gray-500'}`}>{step.label}</span>
                                        </div>
                                        <p className={`text-[8px] font-bold uppercase tracking-tighter ml-6 opacity-60 ${activeGuideStep === step.id ? 'text-white' : 'text-gray-400'}`}>{step.desc}</p>
                                    </button>
                                ))}

                                <div className="mt-auto pt-8 border-t border-gray-200">
                                    <div className="p-6 bg-[#001a1a] rounded-[2rem] text-center">
                                        <p className="text-[8px] font-black text-[#00f2ff] uppercase tracking-[0.2em] mb-2 text-center">Bayup AI Health</p>
                                        <div className="text-xl font-black text-white italic">98.2%<span className="text-[8px] text-emerald-400 ml-1">Reliability</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: INSIGHTS DINÁMICOS */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-2xl bg-gray-900 flex items-center justify-center text-[#00f2ff] shadow-xl font-black text-xl italic">
                                            0{activeGuideStep + 1}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
                                                {[
                                                    'Recuperación de Activos (AR)',
                                                    'Optimización de Pasivos (AP)',
                                                    'Análisis de Morosidad (Aging)',
                                                    'Ciclo de Conversión de Efectivo'
                                                ][activeGuideStep]}
                                            </h2>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Indicadores de rendimiento empresarial</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsGuideOpen(false)} className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all shadow-inner"><X size={24}/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                                    {/* Sección de Definición */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                        <div className="lg:col-span-2 space-y-6">
                                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <div className="h-1 w-4 bg-[#004d4d] rounded-full" /> Visión Estratégica
                                            </h4>
                                            <p className="text-lg font-medium text-gray-700 leading-relaxed italic">
                                                {[
                                                    "La gestión de activos corrientes no es solo cobrar; es garantizar el flujo para la expansión. Registrar cada crédito permite reducir tu DSO (Days Sales Outstanding) hasta en un 22%.",
                                                    "Tus deudas con proveedores son una palanca de crecimiento. Centralizar el control de pagos permite negociar descuentos por prontopago y mejorar tu score de crédito empresarial.",
                                                    "El panel 360 utiliza algoritmos predictivos para alertarte sobre facturas en riesgo. Ignorar el aging report puede costar un 5.4% de utilidad anual por cartera castigada.",
                                                    "La liquidación es el cierre del ciclo de valor. Cada registro saldado libera capacidad de reinversión inmediata en stock de alta rotación, maximizando tu ROI operativo."
                                                ][activeGuideStep]}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 flex flex-col justify-center items-center text-center space-y-4">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Impacto en Liquidez</p>
                                            <div className="text-4xl font-black text-[#004d4d] italic">
                                                {[ "+15.4%", "-8.2%", "Critical", "MAX" ][activeGuideStep]}
                                            </div>
                                            <p className="text-[8px] font-bold text-gray-500 uppercase">Benchmark del Sector</p>
                                        </div>
                                    </div>

                                    {/* Grid de Métricas Técnicas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-10 bg-[#001a1a] rounded-[3.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Bot size={80} className="text-[#00f2ff]"/></div>
                                            <div className="flex items-center gap-3">
                                                <Activity size={20} className="text-[#00f2ff]"/>
                                                <h5 className="text-xs font-black uppercase tracking-[0.2em] text-[#00f2ff]">Análisis Bayt AI</h5>
                                            </div>
                                            <p className="text-sm text-white/70 leading-relaxed font-medium">
                                                {[
                                                    "Detecto que los clientes VIP tienen un ciclo de pago de 12 días. Sugiero mantener este nivel para evitar baches de liquidez.",
                                                    "Optimizar los pagos a 30 días liberaría un flujo de caja de $4.5M para la próxima colección.",
                                                    "El riesgo de impago en el sector 'Venta Crédito' ha subido un 2% a nivel global. Ajusta tus requisitos de garantía.",
                                                    "Felicidades: Tu balance neto actual indica una salud financiera superior al 85% de las empresas de tu nicho."
                                                ][activeGuideStep]}
                                            </p>
                                        </div>

                                        <div className="p-10 bg-white border border-gray-100 rounded-[3.5rem] space-y-6 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Target size={20} className="text-emerald-600"/>
                                                <h5 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Pasos de Ejecución</h5>
                                            </div>
                                            <ul className="space-y-4">
                                                {[
                                                    ["Ingresa el nombre fiscal", "Adjunta el nro de factura", "Define fecha límite"],
                                                    ["Clasifica por proveedor", "Valida el monto con IVA", "Confirma medio de pago"],
                                                    ["Revisa historial de abonos", "Analiza días de mora", "Contacta al responsable"],
                                                    ["Valida ingreso en banco", "Marca icono de Check", "Audita balance final"]
                                                ][activeGuideStep].map((step, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-xs font-bold text-gray-500">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                                        {step}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-4">
                                    <button onClick={() => setIsGuideOpen(false)} className="px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black hover:scale-[1.02] transition-all">
                                        Entendido, Finalizar Guía
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