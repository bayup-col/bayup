"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit3, Search, X, CheckCircle2, 
  DollarSign, Calendar, LayoutGrid, Filter, Download, 
  Sparkles, Bot, Zap, TrendingUp, Activity, Target, 
  ArrowUpRight, ArrowDownRight, Clock, Briefcase, Users, 
  ShieldCheck, AlertCircle, FileText, CreditCard, 
  ShoppingBag, Info, Loader2, ChevronRight, Hash, 
  Printer, Send, Save, QrCode, RotateCcw, BarChart3, TrendingDown, PieChart
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface InvoiceItem {
    id: string;
    description: string;
    unit: string;
    quantity: number;
    discount: number;
    tax_rate: number;
    unit_price: number;
}

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
    items?: InvoiceItem[];
}

// --- COMPONENTE TILT CARD ---
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

// --- HELPERS FINANCIEROS ---
const numberToLetters = (num: number) => {
    try { return `SON: ${num.toLocaleString('es-CO')} PESOS M/CTE`.toUpperCase(); } 
    catch (e) { return `SON: ${num} PESOS`.toUpperCase(); }
};

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

export default function CuentasCarteraPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    // --- ESTADOS DE NAVEGACIÓN Y FILTROS ---
    const [activeTab, setActiveTab] = useState<'pagar' | 'cobrar' | 'historial' | 'bayt'>('pagar');
    const [records, setRecords] = useState<DebtRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [advancedFilter, setAdvancedFilter] = useState('all'); // all, invoice, manual
    
    // --- UI STATES ---
    const [loading, setLoading] = useState(true);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [recordToDelete, setRecordToDelete] = useState<DebtRecord | null>(null);
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

    // --- ESTADO DEL CREADOR DE FACTURA ---
    const [invoiceHeader, setInvoiceHeader] = useState({
        type: 'receivable' as 'payable' | 'receivable',
        entity_name: '',
        entity_nit: '',
        address: '',
        invoice_num: `FA${Math.floor(Math.random() * 900000) + 100000}`,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        payment_terms: 'CONTADO'
    });

    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
        { id: '1', description: '', unit: 'UND', quantity: 1, discount: 0, tax_rate: 19, unit_price: 0 }
    ]);

    const [companyInfo, setCompanyInfo] = useState<any>(null);

    // --- CÁLCULOS ---
    const invoiceTotals = useMemo(() => {
        let subtotal = 0; let totalTax = 0; let totalDiscount = 0;
        invoiceItems.forEach(item => {
            const lineTotal = item.quantity * item.unit_price;
            const lineDisc = (lineTotal * item.discount) / 100;
            const lineTax = ((lineTotal - lineDisc) * item.tax_rate) / 100;
            subtotal += lineTotal; totalDiscount += lineDisc; totalTax += lineTax;
        });
        return { subtotal, totalTax, totalDiscount, netTotal: subtotal - totalDiscount + totalTax };
    }, [invoiceItems]);

    // --- CARGA Y PERSISTENCIA ---
    useEffect(() => {
        const saved = localStorage.getItem('bayup_debt_records_v2');
        const savedSettings = localStorage.getItem('bayup_general_settings');
        if (saved) { setRecords(JSON.parse(saved)); } 
        else {
            const initial: DebtRecord[] = [];
            setRecords(initial);
            localStorage.setItem('bayup_debt_records_v2', JSON.stringify(initial));
        }
        if (savedSettings) { setCompanyInfo(JSON.parse(savedSettings)); }
        setLoading(false);
    }, []);

    const saveRecords = (data: DebtRecord[]) => {
        setRecords(data);
        localStorage.setItem('bayup_debt_records_v2', JSON.stringify(data));
    };

    // --- HANDLERS ---
    const handleNewInvoice = () => {
        setInvoiceHeader({
            type: activeTab === 'pagar' ? 'payable' : 'receivable',
            entity_name: '', entity_nit: '', address: '',
            invoice_num: `FA${Math.floor(Math.random() * 900000) + 100000}`,
            date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            payment_terms: 'CONTADO'
        });
        setInvoiceItems([{ id: '1', description: '', unit: 'UND', quantity: 1, discount: 0, tax_rate: 19, unit_price: 0 }]);
        setIsInvoiceModalOpen(true);
    };

    const handleViewInvoice = (record: DebtRecord) => {
        setInvoiceHeader({
            type: record.type,
            entity_name: record.entity_name,
            entity_nit: '', address: '',
            invoice_num: record.invoice_num,
            date: record.created_at,
            due_date: record.due_date,
            payment_terms: 'CONTADO'
        });
        setInvoiceItems(record.items || [{ id: '1', description: record.description, unit: 'UND', quantity: 1, discount: 0, tax_rate: 19, unit_price: record.amount / 1.19 }]);
        setIsInvoiceModalOpen(true);
    };

    const handleFinalizeInvoice = () => {
        if (!invoiceHeader.entity_name) { showToast("Ingresa el nombre del cliente/proveedor", "error"); return; }
        const newRecord: DebtRecord = {
            id: Date.now().toString(),
            entity_name: invoiceHeader.entity_name,
            amount: invoiceTotals.netTotal,
            due_date: invoiceHeader.due_date,
            status: 'pending',
            type: invoiceHeader.type,
            invoice_num: invoiceHeader.invoice_num,
            category: invoiceHeader.type === 'receivable' ? 'Venta' : 'Compra',
            description: `Factura generada para ${invoiceHeader.entity_name}`,
            created_at: invoiceHeader.date,
            items: invoiceItems
        };
        saveRecords([...records, newRecord]);
        showToast("Factura registrada 🚀", "success");
        setIsInvoiceModalOpen(false);
    };

    const handleLiquidar = (id: string) => {
        saveRecords(records.map(r => r.id === id ? { ...r, status: 'paid' as const } : r));
        showToast("Obligación saldada ✅", "success");
    };

    const handleExport = () => {
        const title = `REPORTE MAESTRO DE CARTERA: ${new Date().toLocaleDateString()}`;
        const html = `
            <html><head><meta charset="utf-8"><style>
                .header { background: #001a1a; color: #00f2ff; padding: 30px; text-align: center; font-family: sans-serif; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
                th { background: #f8fafc; color: #64748b; padding: 12px; font-size: 11px; text-transform: uppercase; border: 1px solid #e2e8f0; }
                td { padding: 12px; font-size: 13px; border: 1px solid #e2e8f0; text-align: center; }
                .receivable { color: #10b981; font-weight: bold; }
                .payable { color: #ef4444; font-weight: bold; }
            </style></head><body>
                <div class="header">${title}<br><small>Auditoría de Activos Bayup</small></div>
                <table>
                    <thead>
                        <tr>
                            <th>Entidad</th>
                            <th>Nro Factura</th>
                            <th>Tipo</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Vencimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(r => `
                            <tr>
                                <td style="text-align: left;">${r.entity_name}</td>
                                <td>${r.invoice_num}</td>
                                <td class="${r.type}">${r.type === 'receivable' ? 'COBRAR' : 'PAGAR'}</td>
                                <td>${formatCurrency(r.amount)}</td>
                                <td>${r.status.toUpperCase()}</td>
                                <td>${r.due_date}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body></html>
        `;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Reporte_Cartera_${new Date().toISOString().split('T')[0]}.xls`;
        a.click();
        showToast("Reporte Platinum generado 📈", "success");
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const addItem = () => setInvoiceItems([...invoiceItems, { id: Date.now().toString(), description: '', unit: 'UND', quantity: 1, discount: 0, tax_rate: 19, unit_price: 0 }]);
    const removeItem = (id: string) => invoiceItems.length > 1 && setInvoiceItems(invoiceItems.filter(i => i.id !== id));
    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => setInvoiceItems(invoiceItems.map(i => i.id === id ? { ...i, [field]: value } : i));

    // --- FILTRADO FINAL ---
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = r.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || r.invoice_num.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesDate = true;
            if (dateRange.start && dateRange.end) {
                const recordDate = new Date(r.created_at).getTime();
                matchesDate = recordDate >= new Date(dateRange.start).getTime() && recordDate <= new Date(dateRange.end).getTime();
            }
            let matchesTab = false;
            if (activeTab === 'pagar') matchesTab = r.type === 'payable' && r.status !== 'paid';
            if (activeTab === 'cobrar') matchesTab = r.type === 'receivable' && r.status !== 'paid';
            if (activeTab === 'historial') matchesTab = r.status === 'paid';
            
            return matchesSearch && matchesDate && matchesTab;
        });
    }, [records, searchTerm, dateRange, activeTab]);

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase text-[#004d4d]/60 tracking-[0.2em]">Facturación & Cartera</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Cuentas <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">& Cartera</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Genera facturas profesionales y gestiona la recuperación de activos de tu marca.</p>
                </div>
                <button onClick={handleNewInvoice} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                    <Zap size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Nueva Obligación
                </button>
            </div>

            {/* KPIs INTERACTIVOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[
                    { id: 'cobrar', label: 'Cartera por Cobrar', value: records.filter(r=>r.type==='receivable'&&r.status!=='paid').reduce((a,b)=>a+b.amount,0), icon: <Users size={20}/>, color: 'text-emerald-600', trend: 'Activo' },
                    { id: 'pagar', label: 'Cuentas por Pagar', value: records.filter(r=>r.type==='payable'&&r.status!=='paid').reduce((a,b)=>a+b.amount,0), icon: <CreditCard size={20}/>, color: 'text-rose-600', trend: 'Pasivo' },
                    { id: 'balance', label: 'Balance Neto', value: records.filter(r=>r.type==='receivable').reduce((a,b)=>a+b.amount,0) - records.filter(r=>r.type==='payable').reduce((a,b)=>a+b.amount,0), icon: <Activity size={20}/>, color: 'text-[#004d4d]', trend: 'OK' },
                    { id: 'mora', label: 'Facturas en Mora', value: records.filter(r=>r.status==='overdue').length, icon: <AlertCircle size={20}/>, color: 'text-amber-500', trend: 'Revisar', isCount: true },
                ].map((kpi, i) => (
                    <div key={i} onClick={() => setSelectedKPI(kpi.id)} className="cursor-pointer h-full">
                        <TiltCard className="p-8">
                            <div className="flex justify-between items-start">
                                <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                                <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">Stats</span>
                            </div>
                            <div className="mt-6">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">
                                    {!kpi.isCount && "$ "}<AnimatedNumber value={kpi.value} />
                                </h3>
                                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{kpi.trend}</p>
                            </div>
                        </TiltCard>
                    </div>
                ))}
            </div>

            {/* Menu Tabs & Search Suite */}
            <div className="flex flex-col items-center gap-8 px-4">
                <div className="flex items-center gap-4">
                    <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto relative z-10">
                        {[
                            { id: 'pagar', label: 'Por Pagar', icon: <CreditCard size={14}/> },
                            { id: 'cobrar', label: 'Por Cobrar', icon: <Users size={14}/> },
                            { id: 'historial', label: 'Historial', icon: <Clock size={14}/> },
                            { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase transition-all z-10 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                                {activeTab === tab.id && <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}
                                <span className="flex items-center gap-2">{tab.icon} {tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all"><Info size={20}/></button>
                </div>
                
                <div className="w-full max-w-[1100px] flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:shadow-xl focus-within:border-[#004d4d]/20 relative z-20">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input type="text" placeholder="Buscar por cliente, NIT o número de factura..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" />
                    </div>
                    <div className="flex items-center gap-1">
                        {/* FILTROS MENU */}
                        <div className="relative">
                            <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}>
                                <Filter size={18}/> 
                                <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden">Filtros</motion.span>}</AnimatePresence>
                            </motion.button>
                            <AnimatePresence>
                                {isFilterMenuOpen && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50">
                                        <button onClick={() => { setAdvancedFilter('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 text-[10px] font-bold uppercase hover:bg-gray-50 rounded-xl">Todos los registros</button>
                                        <button onClick={() => { setAdvancedFilter('invoice'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 text-[10px] font-bold uppercase hover:bg-gray-50 rounded-xl">Solo Facturas</button>
                                        <button onClick={() => { setAdvancedFilter('manual'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 text-[10px] font-bold uppercase hover:bg-gray-50 rounded-xl">Solo Manuales</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* FECHAS MENU */}
                        <div className="relative group/date">
                            <motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${dateRange.start ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}>
                                <Calendar size={18}/> 
                                <AnimatePresence>{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden">Fechas</motion.span>}</AnimatePresence>
                            </motion.button>
                            <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 scale-95 pointer-events-none group-hover/date:opacity-100 group-hover/date:scale-100 group-hover/date:pointer-events-auto transition-all z-50 flex gap-2">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none border border-transparent focus:border-[#004d4d]" />
                                <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none border border-transparent focus:border-[#004d4d]" />
                                <button onClick={() => setDateRange({start:'', end:''})} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><RotateCcw size={14}/></button>
                            </div>
                        </div>

                        <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleExport} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 border border-transparent hover:bg-white hover:border-gray-100 text-gray-500 transition-all">
                            <Download size={18}/> 
                            <AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden">Exportar</motion.span>}</AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* LISTA DE REGISTROS / TABS CONTENT */}
            <div className="px-4">
                <AnimatePresence mode="wait">
                    {(activeTab === 'pagar' || activeTab === 'cobrar' || activeTab === 'historial') && (
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                            {filteredRecords.map((r) => (
                                <motion.div key={r.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black shadow-2xl ${r.status === 'paid' ? 'bg-gray-50 text-gray-400' : r.type === 'payable' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {r.status === 'paid' ? <CheckCircle2 size={24}/> : r.type === 'payable' ? <ArrowUpRight size={24}/> : <ArrowDownRight size={24}/>}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-gray-900 tracking-tight">{r.entity_name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                {r.status === 'paid' ? `Saldado el ${r.due_date}` : `Vence el ${r.due_date}`} · Factura: {r.invoice_num}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase">Monto Total</p>
                                            <p className={`text-xl font-black ${r.status === 'paid' ? 'text-gray-900' : r.type === 'payable' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(r.amount)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleViewInvoice(r)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center shadow-inner transition-all"><FileText size={20}/></button>
                                            {r.status !== 'paid' && <button onClick={() => handleLiquidar(r.id)} className="h-12 w-12 rounded-2xl bg-gray-900 text-[#00f2ff] flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><CheckCircle2 size={20}/></button>}
                                            <button onClick={() => setRecordToDelete(r)} className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-inner transition-all"><Trash2 size={20}/></button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'bayt' && (
                        <motion.div key="bayt" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            <TiltCard className="p-12 bg-gray-900 text-white">
                                <div className="space-y-8 h-full flex flex-col justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-[#00f2ff]/10 text-[#00f2ff] rounded-2xl border border-[#00f2ff]/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]"><Bot size={32}/></div>
                                        <div><h3 className="text-2xl font-black italic uppercase">Bayt Strategist</h3><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest mt-1">Análisis de Cartera & Flujo</p></div>
                                    </div>
                                    <p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Tu índice de cobro (DSO) se mantiene en <span className="text-[#00f2ff] font-black">12 días</span>. Tienes una salud de activos superior al promedio del nicho. Sugiero reinvertir el excedente en stock de alta rotación.&quot;</p>
                                    <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-6">
                                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-white/40">Índice Liquidez</p><p className="text-xl font-black text-[#00f2ff]">2.4x</p></div>
                                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-white/40">Riesgo Mora</p><p className="text-xl font-black text-rose-400">0.5%</p></div>
                                    </div>
                                </div>
                            </TiltCard>
                            <div className="space-y-8">
                                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3"><TrendingUp className="text-emerald-500" size={20}/><h4 className="text-sm font-black uppercase">Próximos Cobros</h4></div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-gray-400 italic text-center py-4">No hay cobros próximos registrados</p>
                                    </div>
                                </div>
                                <button onClick={handleExport} className="w-full py-6 bg-[#004D4D] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all group">
                                    <Download size={20} className="group-hover:translate-y-1 transition-transform"/> Descargar Reporte de Activos
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MODAL DETALLE KPI DINÁMICO */}
            <AnimatePresence>
                {selectedKPI && (
                    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedKPI(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-white">
                            <div className="p-10 bg-gradient-to-br from-gray-900 to-[#001a1a] text-white relative">
                                <button onClick={() => setSelectedKPI(null)} className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group">
                                    <X size={20} className="group-hover:rotate-90 transition-transform"/>
                                </button>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">
                                        {selectedKPI === 'cobrar' ? 'Cartera Activa' : 
                                         selectedKPI === 'pagar' ? 'Pasivos Corrientes' : 
                                         selectedKPI === 'balance' ? 'Salud Financiera' : 'Auditoría de Mora'}
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f2ff]">Bayup Financial Strategist</p>
                                </div>
                            </div>
                            <div className="p-10 space-y-8">
                                {selectedKPI === 'cobrar' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Proyección de Cobro</p><p className="text-xl font-black text-emerald-600">+15.4M Estimado</p></div>
                                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <p className="text-xs font-medium text-emerald-900 leading-relaxed italic">&quot;Bayt detectó: El 80% de tu cartera por cobrar tiene menos de 15 días de emitida. Tu ciclo de caja es saludable.&quot;</p>
                                        </div>
                                    </div>
                                )}
                                {selectedKPI === 'pagar' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Obligaciones Próximas</p><p className="text-xl font-black text-rose-600">3 Facturas</p></div>
                                        <div className="p-10 bg-gray-900 rounded-[2.5rem] relative overflow-hidden text-white shadow-xl">
                                            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={100}/></div>
                                            <p className="text-sm font-medium text-[#00f2ff] italic leading-relaxed">&quot;Sugiero liquidar los pasivos operativos hoy para aprovechar el descuento por pronto pago disponible con Textiles del Norte.&quot;</p>
                                        </div>
                                    </div>
                                )}
                                {selectedKPI === 'balance' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Liquidez Neta Real</p><p className="text-xl font-black text-[#004d4d]">Positiva</p></div>
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-medium text-gray-600 italic">&quot;Tu capital de trabajo está protegido. La relación activos/pasivos es de 2.4x, muy por encima del mínimo de seguridad.&quot;</p>
                                        </div>
                                    </div>
                                )}
                                {selectedKPI === 'mora' && (
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Monitor Crítico</p>
                                        <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-center">
                                            <p className="text-3xl font-black text-rose-600">{records.filter(r=>r.status==='overdue').length}</p>
                                            <p className="text-[10px] font-bold text-rose-800 uppercase mt-1">Facturas Vencidas</p>
                                        </div>
                                        <p className="text-[10px] font-medium text-gray-500 text-center italic">&quot;Protocolo Bayt: Activa recordatorios automáticos vía WhatsApp para las facturas en mora superior a 5 días.&quot;</p>
                                    </div>
                                )}
                                <button onClick={() => setSelectedKPI(null)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Cerrar Análisis</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL CREADOR DE FACTURA */}
            <AnimatePresence>
                {isInvoiceModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInvoiceModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-[1400px] h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col lg:flex-row">
                            <div className="w-full lg:w-[500px] bg-gray-50 border-r border-gray-100 p-10 overflow-y-auto custom-scrollbar flex flex-col space-y-8">
                                <div className="flex justify-between items-center"><div className="flex items-center gap-4"><div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff] shadow-lg"><FileText size={24}/></div><h3 className="text-xl font-black uppercase italic tracking-tight text-gray-900">Editor de Factura</h3></div></div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setInvoiceHeader({...invoiceHeader, type: 'receivable'})} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${invoiceHeader.type === 'receivable' ? 'bg-emerald-600 text-white border-transparent shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}>Ingreso (Cartera)</button>
                                        <button onClick={() => setInvoiceHeader({...invoiceHeader, type: 'payable'})} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${invoiceHeader.type === 'payable' ? 'bg-rose-600 text-white border-transparent shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}>Gasto (Deuda)</button>
                                    </div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Entidad Comercial</label><input value={invoiceHeader.entity_name} onChange={e => setInvoiceHeader({...invoiceHeader, entity_name: e.target.value})} placeholder="Nombre cliente / proveedor" className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#004d4d] text-sm font-bold shadow-sm" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Fecha</label><input type="date" value={invoiceHeader.date} onChange={e => setInvoiceHeader({...invoiceHeader, date: e.target.value})} className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none text-xs font-bold" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Vence</label><input type="date" value={invoiceHeader.due_date} onChange={e => setInvoiceHeader({...invoiceHeader, due_date: e.target.value})} className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none text-xs font-bold" /></div>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-gray-200 space-y-4">
                                    <div className="flex justify-between items-center"><h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ítems</h4><button onClick={addItem} className="h-8 w-8 bg-[#004d4d] text-white rounded-lg flex items-center justify-center"><Plus size={16}/></button></div>
                                    <div className="space-y-4">
                                        {invoiceItems.map((item) => (
                                            <div key={item.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3 relative group">
                                                <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 h-6 w-6 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                                <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Producto/Servicio" className="w-full text-[10px] font-bold outline-none" />
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div><label className="text-[8px] font-bold uppercase text-gray-400">Cant.</label><input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value)||0)} className="w-full text-[10px] font-black" /></div>
                                                    <div><label className="text-[8px] font-bold uppercase text-gray-400">IVA%</label><input type="number" value={item.tax_rate} onChange={e => updateItem(item.id, 'tax_rate', parseFloat(e.target.value)||0)} className="w-full text-[10px] font-black text-emerald-600" /></div>
                                                    <div><label className="text-[8px] font-bold uppercase text-gray-400">Precio</label><input value={formatDots(item.unit_price)} onChange={e => updateItem(item.id, 'unit_price', parseInt(e.target.value.replace(/\D/g,''))||0)} className="w-full text-[10px] font-black text-[#004d4d]" /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-auto pt-8 border-t border-gray-200"><button onClick={handleFinalizeInvoice} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase shadow-2xl flex items-center justify-center gap-3"><Save size={18} className="text-[#00f2ff]"/> Registrar en Cartera</button></div>
                            </div>
                            <div className="flex-1 bg-[#FAFAFA] p-16 overflow-y-auto custom-scrollbar relative flex justify-center">
                                <button onClick={() => setIsInvoiceModalOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-xl group z-[100]"><X size={24} className="group-hover:rotate-90 transition-transform"/></button>
                                <div className="w-[800px] bg-white shadow-2xl p-16 border border-gray-200 min-h-[1000px] relative text-slate-900">
                                    <div className="flex justify-between items-start mb-12">
                                        <div className="space-y-4 max-w-sm">
                                            <div className="flex items-center gap-3">{companyInfo?.identity?.logo ? <img src={companyInfo.identity.logo} className="h-14 w-14 rounded-xl object-cover" /> : <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] flex items-center justify-center rounded-xl font-black text-xl italic">B</div>}<h2 className="text-2xl font-black italic uppercase">{companyInfo?.identity?.name || 'BAYUP CORPORATE'}</h2></div>
                                            <div className="text-[9px] leading-relaxed text-gray-500 font-bold uppercase">NIT: {companyInfo?.contact?.nit || '900.355.222-7'}<br/>{companyInfo?.contact?.address || 'AV 5 AN 23DN 93 LC 7 C.C. del Norte'}</div>
                                        </div>
                                        <div className="w-64 border-2 border-gray-900 rounded-xl overflow-hidden">
                                            <div className="bg-gray-900 text-white text-[10px] font-black text-center py-2 uppercase tracking-widest">Factura de {invoiceHeader.type === 'receivable' ? 'Venta' : 'Compra'}</div>
                                            <div className="p-4 space-y-2 text-[10px] font-bold">
                                                <div className="flex justify-between"><span>Número:</span><span className="font-black">{invoiceHeader.invoice_num}</span></div>
                                                <div className="flex justify-between"><span>Fecha:</span><span>{invoiceHeader.date}</span></div>
                                                <div className="flex justify-between"><span>Vence:</span><span className="text-rose-600">{invoiceHeader.due_date}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 mb-12">
                                        <div className="p-6 border border-gray-200 rounded-xl space-y-3"><p className="text-[8px] font-black text-white bg-gray-900 px-2 py-0.5 inline-block rounded uppercase tracking-widest">Emisor:</p><p className="text-[10px] font-black uppercase italic">{companyInfo?.identity?.name || 'BAYUP INTERACTIVE SAS'}</p></div>
                                        <div className="p-6 border border-gray-200 rounded-xl space-y-3"><p className="text-[8px] font-black text-white bg-[#004d4d] px-2 py-0.5 inline-block rounded uppercase tracking-widest">Adquiriente:</p><p className="text-[10px] font-black uppercase italic">{invoiceHeader.entity_name || 'Nombre del Cliente'}</p></div>
                                    </div>
                                    <table className="w-full border-collapse mb-12">
                                        <thead><tr className="bg-gray-100 text-[9px] font-black uppercase text-gray-600 border-y border-gray-200"><th className="py-3 px-4 text-left">Descripción</th><th className="py-3 px-4 text-center">Cant</th><th className="py-3 px-4 text-right">Valor Unitario</th><th className="py-3 px-4 text-right">Total</th></tr></thead>
                                        <tbody>
                                            {invoiceItems.map(item => (
                                                <tr key={item.id} className="border-b border-gray-50 text-[10px] font-bold text-gray-700">
                                                    <td className="py-4 px-4 uppercase">{item.description || 'Nuevo concepto...'}</td>
                                                    <td className="py-4 px-4 text-center">{item.quantity}</td>
                                                    <td className="py-4 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                                                    <td className="py-4 px-4 text-right font-black">{formatCurrency((item.quantity * item.unit_price) * (1 + item.tax_rate/100))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-6 border border-gray-200 rounded-xl mb-12"><p className="text-[9px] font-black text-gray-900 leading-relaxed italic">{numberToLetters(invoiceTotals.netTotal)}</p></div>
                                    <div className="flex justify-end mb-12">
                                        <div className="w-72 space-y-3 text-[10px] font-bold">
                                            <div className="flex justify-between"><span>SUBTOTAL:</span><span>{formatCurrency(invoiceTotals.subtotal)}</span></div>
                                            <div className="flex justify-between text-emerald-600"><span>IVA (19%):</span><span>{formatCurrency(invoiceTotals.totalTax)}</span></div>
                                            <div className="flex justify-between pt-3 border-t-4 border-gray-900"><span className="text-sm font-black uppercase">Total Factura:</span><span className="text-xl font-black text-gray-900">{formatCurrency(invoiceTotals.netTotal)}</span></div>
                                        </div>
                                    </div>
                                    <div className="border-t-2 border-gray-100 pt-8 flex justify-between items-center opacity-40"><div className="space-y-1 text-[8px] font-bold"><p className="uppercase">CUFE: 1012777b4d3c60eddbbc7d98737cd971958b94772433abcd744b15d760495b163e5a9495073da5045a84509df04c7</p><p>Factura generada por software BAYUP MASTER-CORE v2.0</p></div><QrCode size={60} className="text-gray-900"/></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* GUIA ELITE REPARADA */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-white w-full max-w-5xl h-[80vh] rounded-[4rem] shadow-3xl flex overflow-hidden border border-white">
                            <div className="w-72 bg-gray-50 border-r border-gray-100 p-8 flex flex-col gap-3">
                                <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg"><Bot size={24}/></div>
                                {[
                                    { id: 0, label: 'Estrategia de Cartera', icon: <Target size={16}/> },
                                    { id: 1, label: 'Creador de Facturas', icon: <FileText size={16}/> },
                                    { id: 2, label: 'Historial & Auditoría', icon: <Clock size={16}/> },
                                    { id: 3, label: 'Métricas de Cobro', icon: <TrendingUp size={16}/> }
                                ].map(step => (
                                    <button key={step.id} onClick={() => setActiveGuideStep(step.id)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeGuideStep === step.id ? 'bg-[#004D4D] text-white shadow-xl' : 'text-gray-400 hover:bg-white hover:text-gray-900'}`}>
                                        {step.icon} <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 p-16 flex flex-col justify-between bg-white relative">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors"><X size={24}/></button>
                                <div className="space-y-8">
                                    {activeGuideStep === 0 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Estrategia de <span className="text-[#004D4D]">Activos</span></h2>
                                            <p className="text-gray-500 text-lg font-medium mt-6 leading-relaxed">&quot;La salud financiera de tu marca depende de la agilidad del cobro. Bayup clasifica tus facturas por vencimiento para priorizar la liquidez.&quot;</p>
                                            <div className="grid grid-cols-2 gap-6 mt-10">
                                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Objetivo Bayt</p><p className="text-sm font-bold text-emerald-900">Reducir el ciclo de caja (DSO) en un 15% mediante recordatorios automáticos.</p></div>
                                                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100"><p className="text-[10px] font-black text-rose-600 uppercase mb-2">Alerta Temprana</p><p className="text-sm font-bold text-rose-900">Identifica facturas con más de 30 días de mora para gestión legal inmediata.</p></div>
                                            </div>
                                        </div>
                                    )}
                                    {activeGuideStep === 1 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Facturación <span className="text-[#004D4D]">Platinum</span></h2>
                                            <p className="text-gray-500 text-lg font-medium mt-6 leading-relaxed">Crea documentos profesionales con validez comercial. El sistema calcula automáticamente el IVA, descuentos y convierte el monto a letras.</p>
                                            <div className="p-8 bg-gray-50 rounded-[2.5rem] mt-8 border border-gray-100"><p className="text-xs font-bold text-gray-600 leading-loose">Tip Operativo: &quot;Usa el botón Nueva Obligación para registrar ventas a crédito o compras a proveedores. Los datos del emisor se cargan desde tu Configuración General.&quot;</p></div>
                                        </div>
                                    )}
                                    {activeGuideStep === 2 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Archivo <span className="text-[#004D4D]">& Auditoría</span></h2>
                                            <p className="text-gray-500 text-lg font-medium mt-6 leading-relaxed">Cuando una obligación es liquidada, no desaparece; se traslada al Historial para mantener tu flujo de trabajo limpio pero auditable.</p>
                                            <div className="grid grid-cols-1 gap-4 mt-8">
                                                <div className="flex items-start gap-4 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                                                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><CheckCircle2 size={20}/></div>
                                                    <div><p className="text-xs font-black uppercase text-gray-900">Validación de Pago</p><p className="text-[11px] text-gray-500 mt-1 font-medium italic">Al marcar una factura como pagada, se registra la fecha exacta de cierre para reportes de rentabilidad real.</p></div>
                                                </div>
                                                <div className="flex items-start gap-4 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Search size={20}/></div>
                                                    <div><p className="text-xs font-black uppercase text-gray-900">Búsqueda Forense</p><p className="text-[11px] text-gray-500 mt-1 font-medium italic">Usa el buscador táctico para localizar facturas de años anteriores en milisegundos por NIT o número de folio.</p></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeGuideStep === 3 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Inteligencia <span className="text-[#004D4D]">Financiera</span></h2>
                                            <p className="text-gray-500 text-lg font-medium mt-6 leading-relaxed">Bayt analiza la relación entre lo que debes y lo que te deben para proyectar la salud de tu flujo de caja.</p>
                                            <div className="mt-8 space-y-4">
                                                <div className="p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={80}/></div>
                                                    <p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">Balance Neto</p>
                                                    <p className="text-xs mt-2 font-medium leading-relaxed italic">Si tu balance es negativo, Bayt te sugerirá pausar compras a proveedores hasta que la cartera por cobrar supere el 60% del pasivo actual.</p>
                                                </div>
                                                <div className="p-6 bg-[#004D4D]/5 border border-[#004D4D]/10 rounded-3xl">
                                                    <p className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Alerta de Mora</p>
                                                    <p className="text-xs mt-2 text-gray-600 font-bold italic">Un índice de mora superior al 15% requiere activar el protocolo de cobro persuasivo vía WhatsApp CRM.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setIsGuideOpen(false)} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl">Entendido, Continuar Operación</button>
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