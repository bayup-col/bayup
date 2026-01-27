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
  ChevronDown
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
    const { showToast } = useToast();
    
    // UI State para Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [isActiveToggle, setIsActiveToggle] = useState(true);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
            reset({
                code: '',
                type: 'percentage',
                value: 0,
                min_purchase: 0,
                max_uses: null
            });
            setIsActiveToggle(true);
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: DiscountFormData) => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        if (editingDiscount) {
            setDiscounts(discounts.map(d => d.id === editingDiscount.id ? { 
                ...d, 
                ...data, 
                status: isActiveToggle ? 'active' : 'expired' 
            } : d));
            showToast("¡Perfecto! Los cambios se han guardado con éxito ✨", "success");
        } else {
            const newDiscount: Discount = {
                id: Math.random().toString(36).substr(2, 9),
                ...data,
                status: isActiveToggle ? 'active' : 'expired',
                used_count: 0,
                created_at: new Date().toISOString()
            };
            setDiscounts([newDiscount, ...discounts]);
            showToast("¡Excelente! Tu nuevo cupón ya está activo 🏷️", "success");
        }
        setIsSaving(false);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar este cupón permanentemente?")) {
            setDiscounts(discounts.filter(d => d.id !== id));
            showToast("Cupón eliminado correctamente", "success");
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        showToast("¡Código copiado!", "success");
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const formatNumberInput = (val: number) => {
        if (val === 0) return "0";
        if (!val) return "";
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const unformatNumberInput = (val: string) => {
        return parseFloat(val.replace(/\./g, '')) || 0;
    };

    // --- LÓGICA DE FILTRADO, ORDENAMIENTO Y PAGINACIÓN ---
    const { filteredDiscounts, totalPages } = useMemo(() => {
        const filtered = discounts
            .filter(d => d.code.toLowerCase().includes(searchTerm.toLowerCase()))
            // ORDENAMIENTO: El más nuevo arriba
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        const total = Math.ceil(filtered.length / itemsPerPage);
        const sliced = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return { filteredDiscounts: sliced, totalPages: total };
    }, [discounts, searchTerm, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Descuentos</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona tus campañas de marketing y fidelización.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-center"
                >
                    + Crear Cupón
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center px-6 group focus-within:border-purple-200 transition-all">
                <Search className="text-gray-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por código promocional..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 py-4 px-4 bg-transparent outline-none text-sm font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-medium"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código / Requisito</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Uso</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredDiscounts.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-1.5 rounded-xl font-mono font-black text-xs border ${d.status === 'active' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                            {d.code}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">Compra mín: {formatCurrency(d.min_purchase)}</p>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="max-w-[140px] mx-auto">
                                        <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 mb-1.5">
                                            <span>{d.used_count} usos</span>
                                            {d.max_uses && <span>meta: {d.max_uses}</span>}
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${d.status === 'active' ? 'bg-purple-600' : 'bg-gray-400'}`} 
                                                style={{ width: `${d.max_uses ? (d.used_count / d.max_uses) * 100 : 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <p className="text-base font-black text-gray-900">
                                        {d.type === 'percentage' ? `${d.value}% OFF` : d.type === 'free_shipping' ? 'Gratis' : formatCurrency(d.value)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{d.type === 'free_shipping' ? 'Envío' : 'Directo'}</p>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <button 
                                            onClick={() => copyCode(d.code)} 
                                            className="h-10 w-10 bg-white text-gray-400 rounded-xl flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-sm border border-gray-100"
                                            title="Copiar código"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleOpenModal(d)}
                                            className="h-10 w-10 bg-white text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-100"
                                            title="Editar cupón"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(d.id)} 
                                            className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                            title="Eliminar cupón"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Página {currentPage} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={14} className="inline mr-1" /> Anterior
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Siguiente <ChevronRight size={14} className="inline ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL FLOTANTE PREMIUM */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20"
                        >
                            <div className="bg-gray-900 p-8 text-white relative">
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-purple-500/20">
                                        <Tag size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">{editingDiscount ? 'Editar Cupón' : 'Nuevo Descuento'}</h2>
                                        <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Reglas de Fidelización</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-8">
                                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                    <div>
                                        <p className="text-sm font-black text-gray-900">Disponibilidad del Cupón</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            {isActiveToggle ? 'Cupón activo para clientes' : 'Cupón desactivado temporalmente'}
                                        </p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setIsActiveToggle(!isActiveToggle)}
                                        className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${isActiveToggle ? 'bg-purple-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`h-6 w-6 bg-white rounded-full shadow-md transition-all transform ${isActiveToggle ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código Promocional</label>
                                        <input 
                                            {...register('code')} 
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all shadow-inner" 
                                            placeholder="EJ: BAYUP2026" 
                                        />
                                        {errors.code && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.code.message}</p>}
                                    </div>
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Beneficio</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 border-2 border-transparent hover:border-purple-100 rounded-2xl outline-none text-sm font-bold transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-purple-600">
                                                    {typeOptions.find(o => o.id === selectedType)?.icon}
                                                </div>
                                                {typeOptions.find(o => o.id === selectedType)?.label}
                                            </div>
                                            <motion.div
                                                animate={{ rotate: isTypeDropdownOpen ? 180 : 0 }}
                                                className="text-gray-400"
                                            >
                                                <ChevronDown size={14} />
                                            </motion.div>
                                        </button>

                                        <AnimatePresence>
                                            {isTypeDropdownOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-[600] overflow-hidden"
                                                >
                                                    {typeOptions.map((option) => (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setValue('type', option.id as any);
                                                                setIsTypeDropdownOpen(false);
                                                            }}
                                                            className={`w-full px-6 py-4 text-left flex items-center gap-4 hover:bg-purple-50 transition-colors ${selectedType === option.id ? 'bg-purple-50/50' : ''}`}
                                                        >
                                                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${selectedType === option.id ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                                                {option.icon}
                                                            </div>
                                                            <div>
                                                                <p className={`text-xs font-black uppercase tracking-tight ${selectedType === option.id ? 'text-purple-700' : 'text-gray-600'}`}>
                                                                    {option.label}
                                                                </p>
                                                            </div>
                                                            {selectedType === option.id && (
                                                                <div className="ml-auto h-2 w-2 bg-purple-600 rounded-full" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                                    {selectedType !== 'free_shipping' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">
                                                    {selectedType === 'percentage' ? '%' : '$'}
                                                </span>
                                                <input 
                                                    type="text" 
                                                    value={formatNumberInput(watch('value'))}
                                                    onChange={(e) => setValue('value', unformatNumberInput(e.target.value))}
                                                    className="w-full pl-8 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all" 
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mín. Compra</label>
                                        <input 
                                            type="text" 
                                            value={formatNumberInput(watch('min_purchase'))}
                                            onChange={(e) => setValue('min_purchase', unformatNumberInput(e.target.value))}
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Límite Usos</label>
                                        <input 
                                            type="number" 
                                            {...register('max_uses', { valueAsNumber: true })} 
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all" 
                                            placeholder="Ilimitado" 
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="flex-[2] py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                {editingDiscount ? 'Guardar Cambios' : 'Activar Descuento'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}