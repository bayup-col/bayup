"use client";

import { useState, useMemo, useEffect } from 'react';
import { 
  Copy, 
  Trash2, 
  Edit3, 
  Search, 
  Tag, 
  X, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  Truck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Filter,
  Download,
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  Activity,
  Target,
  Plus,
  ArrowUpRight,
  Clock,
  Info,
  Loader2
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TiltCard from '@/components/dashboard/TiltCard';
import DiscountsInfoModal from '@/components/dashboard/DiscountsInfoModal';
import DiscountsMetricModal from '@/components/dashboard/DiscountsMetricModal';

interface Discount {
    id: string;
    code: string;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    value: number;
    status: 'active' | 'expired';
    used_count: number;
    max_uses: number | null;
    min_purchase: number;
    created_at?: string;
}

const INITIAL_DISCOUNTS: Discount[] = [
    { id: "d1", code: "VERANO20", type: 'percentage', value: 20, status: 'active', used_count: 145, max_uses: 500, min_purchase: 0, created_at: '2024-01-01T10:00:00Z' },
    { id: "d2", code: "BIENVENIDA", type: 'fixed_amount', value: 15000, status: 'active', used_count: 89, max_uses: null, min_purchase: 50000, created_at: '2024-01-02T11:00:00Z' },
    { id: "d3", code: "FREE_SHIP", type: 'free_shipping', value: 0, status: 'active', used_count: 23, max_uses: 100, min_purchase: 100000, created_at: '2024-01-03T12:00:00Z' },
];

const discountSchema = z.object({
  code: z.string().min(3, "Mínimo 3 caracteres").toUpperCase(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().min(0),
  min_purchase: z.number().min(0),
  max_uses: z.number().nullable(),
});

type DiscountFormData = z.infer<typeof discountSchema>;

export default function DiscountsPage() {
    const [discounts, setDiscounts] = useState<Discount[]>(INITIAL_DISCOUNTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'todos' | 'cupones' | 'automaticos' | 'bayt'>('todos');
    const { showToast } = useToast();
    
    // UI State para Modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState<any>(null);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [isActiveToggle, setIsActiveToggle] = useState(true);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Estados para Action Bar Premium
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [filterType, setFilterType] = useState('all');

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<DiscountFormData>({
        resolver: zodResolver(discountSchema),
    });

    const selectedType = watch('type');

    const typeOptions = [
        { id: 'percentage', label: 'Porcentaje (%)', icon: <Percent size={14} /> },
        { id: 'fixed_amount', label: 'Monto Fijo ($)', icon: <DollarSign size={14} /> },
        { id: 'free_shipping', label: 'Envío Gratis', icon: <Truck size={14} /> }
    ];

    const handleOpenModal = (discount?: Discount) => {
        setIsTypeDropdownOpen(false);
        setIsSaving(false);
        if (discount) {
            setEditingDiscount(discount);
            setValue('code', discount.code);
            setValue('type', discount.type);
            setValue('value', discount.value);
            setValue('min_purchase', discount.min_purchase);
            setValue('max_uses', discount.max_uses);
            setIsActiveToggle(discount.status === 'active');
        } else {
            setEditingDiscount(null);
            reset({ code: '', type: 'percentage', value: 0, min_purchase: 0, max_uses: null });
            setIsActiveToggle(true);
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: DiscountFormData) => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        if (editingDiscount) {
            setDiscounts(discounts.map(d => d.id === editingDiscount.id ? { ...d, ...data, status: isActiveToggle ? 'active' : 'expired' } : d));
            showToast("Cambios guardados con éxito ✨", "success");
        } else {
            const newDiscount: Discount = { id: Math.random().toString(36).substr(2, 9), ...data, status: isActiveToggle ? 'active' : 'expired', used_count: 0, created_at: new Date().toISOString() };
            setDiscounts([newDiscount, ...discounts]);
            showToast("¡Nuevo cupón activo! 🏷️", "success");
        }
        setIsSaving(false);
        setIsModalOpen(false);
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        showToast(`Código ${code} copiado 📋`, "success");
    };

    const handleExport = () => {
        showToast("Generando reporte de campañas...", "info");
        setTimeout(() => showToast("Reporte descargado correctamente", "success"), 1500);
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    const formatNumberInput = (val: number) => val === 0 ? "0" : val?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "";
    const unformatNumberInput = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const filteredDiscounts = useMemo(() => {
        return discounts
            .filter(d => {
                const matchesSearch = d.code.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = filterType === 'all' || d.type === filterType;
                return matchesSearch && matchesType;
            })
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }, [discounts, searchTerm, filterType]);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Cupones Emitidos', value: '42', sub: 'Total histórico', icon: <Tag size={20}/>, trend: '+5%', color: 'text-[#004d4d]' },
                { label: 'Campañas Activas', value: '08', sub: 'Corriendo ahora', icon: <Target size={20}/>, trend: 'OK', color: 'text-amber-500' },
                { label: 'Tasa Redención', value: '24.5%', sub: 'Efectividad', icon: <TrendingUp size={20}/>, trend: '+3%', color: 'text-emerald-600' },
                { label: 'Ahorro Generado', value: '$ 4.2M', sub: 'Ventas con descuento', icon: <DollarSign size={20}/>, trend: '+12%', color: 'text-[#00f2ff]' },
            ].map((kpi, i) => (
                <TiltCard key={i} onClick={() => setSelectedKPI(kpi)} className="h-full">
                    <div className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">{kpi.trend}</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                        </div>
                    </div>
                </TiltCard>
            ))}
        </div>
    );

    const renderActionBar = () => (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-2 rounded-[2rem] border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar por código promocional..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none" />
            </div>
            
            <div className="flex items-center gap-2 pr-2">
                {/* Botón Filtro */}
                <div className="relative">
                    <motion.button 
                        layout
                        onMouseEnter={() => setIsFilterHovered(true)}
                        onMouseLeave={() => setIsFilterHovered(false)}
                        onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsDateMenuOpen(false); }}
                        className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}
                    >
                        <motion.div layout><Filter size={18}/></motion.div>
                        <AnimatePresence mode="popLayout">
                            {(isFilterHovered || isFilterMenuOpen) && (
                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                                    {filterType === 'all' ? 'Tipo' : filterType}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                        {isFilterMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                            >
                                {['all', 'percentage', 'fixed_amount', 'free_shipping'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => { setFilterType(type); setIsFilterMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {type === 'all' ? 'Todos' : type.replace('_', ' ')}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Botón Fecha */}
                <div className="relative">
                    <motion.button 
                        layout
                        onMouseEnter={() => setIsDateHovered(true)}
                        onMouseLeave={() => setIsDateHovered(false)}
                        onClick={() => { setIsDateMenuOpen(!isDateMenuOpen); setIsFilterMenuOpen(false); }}
                        className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004d4d] text-white' : 'bg-white text-slate-500 border border-gray-100 shadow-sm'}`}
                    >
                        <motion.div layout><Calendar size={18}/></motion.div>
                        <AnimatePresence mode="popLayout">
                            {(isDateHovered || isDateMenuOpen) && (
                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Período</motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                        {isDateMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                            >
                                {['Hoy', 'Últimos 7 días', 'Este Mes', 'Histórico'].map((p) => (
                                    <button key={p} onClick={() => setIsDateMenuOpen(false)} className="w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50">{p}</button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Botón Exportar */}
                <motion.button 
                    layout
                    onMouseEnter={() => setIsExportHovered(true)}
                    onMouseLeave={() => setIsExportHovered(false)}
                    onClick={handleExport}
                    className="h-12 flex items-center gap-2 px-4 bg-white border border-gray-100 rounded-2xl text-slate-500 hover:text-emerald-600 transition-all shadow-sm"
                >
                    <motion.div layout><Download size={18}/></motion.div>
                    <AnimatePresence mode="popLayout">
                        {isExportHovered && (
                            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar</motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );

    const renderDiscounts = () => (
        <div className="px-4 space-y-4">
            {filteredDiscounts.map((d) => (
                <motion.div key={d.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-6 flex-1">
                        <div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center text-2xl font-black shadow-2xl ${d.status === 'active' ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {d.type === 'percentage' ? <Percent size={28}/> : d.type === 'fixed_amount' ? <DollarSign size={28}/> : <Truck size={28}/>}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h4 className="text-xl font-black text-gray-900 tracking-tight uppercase font-mono">{d.code}</h4>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${d.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                                    {d.status === 'active' ? 'Activo' : 'Expirado'}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Mínimo compra: {formatCurrency(d.min_purchase)}</p>
                        </div>
                    </div>
                    <div className="flex-[1.5] space-y-3">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta de redenciones</p>
                            <p className="text-sm font-black text-[#004d4d]">{d.used_count} / {d.max_uses || '∞'} USOS</p>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${d.max_uses ? (d.used_count / d.max_uses) * 100 : 100}%` }} className={`h-full rounded-full shadow-[0_0_10px_rgba(0,242,255,0.3)] ${d.status === 'active' ? 'bg-gradient-to-r from-[#004d4d] to-[#00f2ff]' : 'bg-gray-300'}`}></motion.div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right mr-4">
                            <p className="text-2xl font-black text-gray-900">{d.type === 'percentage' ? `${d.value}%` : d.type === 'fixed_amount' ? formatCurrency(d.value) : 'GRATIS'}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Descuento</p>
                        </div>
                        <button onClick={() => handleOpenModal(d)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner hover:scale-105 active:scale-95"><Edit3 size={20}/></button>
                        <button onClick={() => copyCode(d.code)} className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"><Copy size={20} /></button>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000 relative">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Marketing & Conversión</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Reglas de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Descuento</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Gestiona tus campañas de marketing y fidelización con precisión <span className="font-bold text-[#001A1A]">estratégica</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleOpenModal()} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group"><Plus size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Crear Nueva Oferta</button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'todos', label: 'Todos', icon: <LayoutGrid size={14}/> },
                        { id: 'cupones', label: 'Cupones', icon: <Tag size={14}/> },
                        { id: 'automaticos', label: 'Automáticos', icon: <Zap size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="activeDiscountTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Botón de Información Satélite */}
                <button
                    onClick={() => setShowInfoModal(true)}
                    className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 hover:bg-[#004d4d] hover:text-white transition-all shadow-xl active:scale-95 group"
                >
                    <Info size={20} />
                </button>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {(activeTab === 'todos' || activeTab === 'cupones' || activeTab === 'automaticos') && (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderDiscounts()}
                        </div>
                    )}
                    {activeTab === 'bayt' && (
                        <div className="px-4">
                            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Percent size={300} /></div>
                                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                                    <div className="flex-1 space-y-6">
                                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Estrategia de Conversión</span>
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Optimiza tus ofertas en tiempo real</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"El cupón **VERANO20** está cerca de su meta de usos. Sugerencia: Extender meta un 20% ya que el ROAS es de 5.2x."</p></div>
                                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Detectado abandono de carrito en pedidos de +$100k. Crear un descuento automático de **Envío Gratis** para este segmento."</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODALES */}
            <DiscountsInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
            
            <DiscountsMetricModal 
                isOpen={!!selectedKPI} 
                onClose={() => setSelectedKPI(null)} 
                metric={selectedKPI} 
            />

            {/* MODAL: CREAR/EDITAR */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                            <div className="bg-[#004d4d] p-10 text-white flex items-center gap-6">
                                <div className="h-16 w-16 bg-[#00f2ff] text-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg"><Percent size={32} /></div>
                                <div><h2 className="text-2xl font-black uppercase tracking-tight">{editingDiscount ? 'Editar Oferta' : 'Nueva Oferta'}</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">Configuración de Descuento</p></div>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-8 bg-white">
                                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner">
                                    <div><p className="text-sm font-black text-gray-900">Estado de la Oferta</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{isActiveToggle ? 'Habilitado para el público' : 'Desactivado temporalmente'}</p></div>
                                    <button type="button" onClick={() => setIsActiveToggle(!isActiveToggle)} className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${isActiveToggle ? 'bg-[#004d4d] shadow-[0_0_10px_rgba(0,77,77,0.3)]' : 'bg-gray-300'}`}><div className={`h-6 w-6 bg-white rounded-full shadow-md transition-all transform ${isActiveToggle ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Código Promocional</label><input {...register('code')} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="EJ: BAYUP20" /></div>
                                    <div className="space-y-2 relative"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tipo de Beneficio</label>
                                        <button type="button" onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className="w-full flex items-center justify-between p-5 bg-gray-50 border-2 border-transparent hover:border-[#004d4d]/20 rounded-2xl text-sm font-bold transition-all"><div className="flex items-center gap-3"><div className="text-[#004d4d]">{typeOptions.find(o => o.id === selectedType)?.icon}</div>{typeOptions.find(o => o.id === selectedType)?.label}</div><ChevronDown size={14} /></button>
                                        <AnimatePresence>{isTypeDropdownOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-[600] overflow-hidden">
                                                {typeOptions.map((option) => (
                                                    <button key={option.id} type="button" onClick={() => { setValue('type', option.id as any); setIsTypeDropdownOpen(false); }} className={`w-full px-6 py-4 text-left flex items-center gap-4 hover:bg-gray-50 transition-colors ${selectedType === option.id ? 'bg-[#004d4d]/5' : ''}`}><div className={`h-8 w-8 rounded-xl flex items-center justify-center ${selectedType === option.id ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-400'}`}>{option.icon}</div><p className="text-xs font-black uppercase tracking-tight text-gray-600">{option.label}</p></button>
                                                ))}
                                            </motion.div>
                                        )}</AnimatePresence>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                                    {selectedType !== 'free_shipping' && (
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Valor</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">{selectedType === 'percentage' ? '%' : '$'}</span><input type="text" value={formatNumberInput(watch('value'))} onChange={(e) => setValue('value', unformatNumberInput(e.target.value))} className="w-full pl-8 pr-4 py-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" /></div></div>
                                    )}
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mín. Compra</label><input type="text" value={formatNumberInput(watch('min_purchase'))} onChange={(e) => setValue('min_purchase', unformatNumberInput(e.target.value))} className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Límite Usos</label><input type="number" {...register('max_uses', { valueAsNumber: true })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" placeholder="∞" /></div>
                                </div>
                                <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-gray-400">Cancelar</button><button type="submit" disabled={isSaving} className="flex-[2] py-5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center justify-center gap-3">{isSaving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={18}/>} {editingDiscount ? 'Guardar Cambios' : 'Lanzar Oferta'}</button></div>
                            </form>
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
