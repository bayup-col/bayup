"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Package, 
  ArrowLeft, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Info, 
  DollarSign, 
  Upload,
  ShieldCheck,
  Zap,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Layers,
  BarChart3,
  ArrowUpRight,
  X,
  Hash,
  ShoppingBag,
  Box,
  Layout,
  Eye,
  CheckCircle2,
  Clock,
  User,
  Smartphone, 
  Star, 
  ChevronDown, 
  GripVertical,
  Volume2,
  VolumeX,
  Play,
  Bot,
  FileText,
  ShoppingCart,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';
import { InteractiveUP } from '@/components/landing/InteractiveUP';

export default function NewProductPage() {
    const { token, userEmail } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'variants'>('info');
    
    // Estados para Categorías y Guía
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    
    // Estados para Variantes Multinivel
    const [isNewVariantModalOpen, setIsNewVariantModalOpen] = useState(false);
    const [tempVariantName, setTempVariantName] = useState("");
    const [tempSubVariants, setTempSubVariants] = useState([{ id: '1', spec: '', stock: 0 }]);

    // Estados para Tooltips
    const [showWholesaleTip, setShowWholesaleTip] = useState(false);
    const [showRetailTip, setShowRetailTip] = useState(false);
    const [showGatewayTip, setShowGatewayTip] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        wholesale_price: 0,
        cost: 0,
        category: '',
        collection_id: null as string | null,
        sku: '',
        status: 'active' as 'active' | 'draft',
        add_gateway_fee: false
    });

    const [variants, setVariants] = useState<any[]>([]);

    const [media, setMedia] = useState<{file?: File, preview: string, type: 'image' | 'video', isMuted: boolean}[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

    const [isPriceAssistantOpen, setIsPriceAssistantOpen] = useState(false);
    const [isAnalyzingBayt, setIsAnalyzingBayt] = useState(false);
    const [assistantExpenses, setAssistantExpenses] = useState({ payroll: 0, rent: 0, utilities: 0, ops: 0 });
    const [calcQuantity, setCalcQuantity] = useState(1);
    const [calcMargin, setCalcMargin] = useState(30);
    const [calcWholesaleMargin, setCalcWholesaleMargin] = useState(15);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [isNoDataModalOpen, setIsNoDataModalOpen] = useState(false);
    const [platformCommission, setPlatformCommission] = useState(2.5);

    const handleBaytAnalysis = async () => {
        if (!token) return;
        setIsAnalyzingBayt(true);
        try {
            const [expenses, orders] = await Promise.all([
                apiRequest<any[]>('/expenses', { token }).catch(() => []),
                apiRequest<any[]>('/orders', { token }).catch(() => [])
            ]);
            const totals = { payroll: 0, rent: 0, utilities: 0, ops: 0 };
            const hasRealData = (expenses && expenses.length > 0) || (orders && orders.length > 0);
            if (!hasRealData) { setIsNoDataModalOpen(true); setIsAnalyzingBayt(false); return; }
            if (expenses) {
                expenses.forEach(exp => {
                    const desc = exp.description?.toLowerCase() || "";
                    const amount = exp.amount || 0;
                    if (desc.includes('nómina')) totals.payroll += amount;
                    else if (desc.includes('arriendo')) totals.rent += amount;
                    else if (desc.includes('servicio')) totals.utilities += amount;
                    else totals.ops += amount;
                });
            }
            setAssistantExpenses(totals);
            showToast("Auditoría de Bayt completada ✨", "success");
            setHasAnalyzed(true);
        } catch (err) { setIsNoDataModalOpen(true); } finally { setIsAnalyzingBayt(false); }
    };

    useEffect(() => {
        const fetchInitial = async () => {
            if (!token) return;
            try {
                const [cats, userData] = await Promise.all([
                    apiRequest<any[]>('/collections', { token }),
                    apiRequest<any>('/auth/me', { token })
                ]);
                if (cats) setCategoriesList(cats);
                if (userData?.plan) setPlatformCommission(userData.plan.commission_rate * 100);
            } catch (e) {}
        };
        fetchInitial();
    }, [token]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (media.length >= 5) {
            showToast("Límite de 5 imágenes alcanzado (Plan Básico)", "info");
            return;
        }
        const allowedFiles = files.slice(0, 5 - media.length);
        for (const file of allowedFiles) {
            setMedia(prev => [...prev, { 
                file, preview: URL.createObjectURL(file),
                type: file.type.startsWith('video') ? 'video' : 'image', isMuted: true
            }]);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return showToast("Nombre obligatorio", "error");
        setIsSubmitting(true);
        try {
            const finalImageUrls: string[] = [];
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            for (const item of media) {
                if (item.file) {
                    const fd = new FormData();
                    fd.append('file', item.file);
                    const res = await fetch(`${apiUrl}/admin/upload-image`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
                    });
                    if (res.ok) { const d = await res.json(); finalImageUrls.push(d.url); }
                }
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                price: formData.price,
                wholesale_price: formData.wholesale_price,
                cost: formData.cost,
                collection_id: formData.collection_id,
                sku: formData.sku,
                status: formData.status,
                add_gateway_fee: formData.add_gateway_fee,
                image_url: finalImageUrls,
                variants: variants.map(v => ({ 
                    name: v.name, 
                    sku: v.sku, 
                    stock: Number(v.stock) || 0, 
                    price_adjustment: 0 
                }))
            };

            await apiRequest('/products', { method: 'POST', token, body: JSON.stringify(payload) });
            showToast("¡Producto creado con éxito! ✨", "success");
            router.push('/dashboard/products');
        } catch (err) { showToast("Error al guardar", "error"); } finally { setIsSubmitting(false); }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || !token) return;
        try {
            const data = await apiRequest<any>('/collections', {
                method: 'POST', token,
                body: JSON.stringify({ title: newCategoryName.trim(), description: "Creada desde el editor", status: 'active' })
            });
            if (data) {
                setCategoriesList(prev => [...prev, data]);
                setFormData(prev => ({...prev, category: data.title, collection_id: data.id}));
                setNewCategoryName("");
                setIsNewCategoryModalOpen(false);
                setIsCategoryOpen(false);
                showToast("Categoría creada con éxito", "success");
            }
        } catch (err) { showToast("Error al crear categoría", "error"); }
    };

    const formatValue = (val: number | string) => {
        const num = String(val).replace(/\D/g, "");
        return new Intl.NumberFormat("de-DE").format(Number(num));
    };

    const handleAddTempSubVariant = () => {
        setTempSubVariants([...tempSubVariants, { id: Math.random().toString(36).substr(2, 9), spec: '', stock: 0 }]);
    };

    const handleSaveMatrixAttributes = () => {
        if (!tempVariantName.trim()) return showToast("Asigna un nombre al atributo", "error");
        
        const newCombs = tempSubVariants
            .filter(sv => sv.spec.trim() !== '')
            .map(sv => ({
                id: Math.random().toString(36).substr(2, 9),
                name: `${tempVariantName} / ${sv.spec}`,
                sku: '',
                stock: sv.stock
            }));

        if (newCombs.length === 0) return showToast("Añade al menos una especificación", "error");

        setVariants([...variants, ...newCombs]);
        setIsNewVariantModalOpen(false);
        setTempVariantName("");
        setTempSubVariants([{ id: '1', spec: '', stock: 0 }]);
        showToast("Atributos añadidos correctamente", "success");
    };

    // Cálculos Financieros
    const platformFeeRate = 0.025;
    const gatewayFeeRate = 0.035;
    const platformDeductionUser = formData.price * platformFeeRate;
    const gatewayDeductionUser = formData.add_gateway_fee ? 0 : (formData.price * gatewayFeeRate);
    const profitUser = formData.price - formData.cost - platformDeductionUser - gatewayDeductionUser;
    const marginUser = formData.price > 0 ? (profitUser / formData.price) * 100 : 0;

    const platformDeductionWholesale = formData.wholesale_price * platformFeeRate;
    const gatewayDeductionWholesale = formData.add_gateway_fee ? 0 : (formData.wholesale_price * gatewayFeeRate);
    const profitWholesale = formData.wholesale_price - formData.cost - platformDeductionWholesale - gatewayDeductionWholesale;
    const marginWholesale = formData.wholesale_price > 0 ? (profitWholesale / formData.wholesale_price) * 100 : 0;

    // Lógica de Cálculo Asistente
    const currentGatewayRate = 0.035;
    const totalFixedExpenses = assistantExpenses.payroll + assistantExpenses.rent + assistantExpenses.utilities + assistantExpenses.ops;
    const expensePerUnit = calcQuantity > 0 ? totalFixedExpenses / calcQuantity : 0;
    const totalUnitCost = formData.cost + expensePerUnit;
    const suggestedPrice = totalUnitCost / (1 - (calcMargin / 100) - (platformCommission / 100) - (formData.add_gateway_fee ? 0 : currentGatewayRate));
    const suggestedWholesale = totalUnitCost / (1 - (calcWholesaleMargin / 100) - (platformCommission / 100) - (formData.add_gateway_fee ? 0 : currentGatewayRate));

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden text-slate-900 font-sans">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => router.back()} className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md border border-white/20 text-gray-500 hover:text-rose-500 shadow-lg"><X size={20} /></motion.button>

            <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div><h2 className="text-4xl font-black italic uppercase text-[#001A1A] tracking-tighter leading-none">Crear <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Producto</span></h2></div>
                    <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-full shadow-lg">
                        {(['info', 'financial', 'variants'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400 hover:text-[#004D4D]'}`}>{tab === 'info' ? 'Información' : tab === 'financial' ? 'Finanzas' : 'Variantes'}</button>
                        ))}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TÍTULO DEL PRODUCTO</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Camiseta Urban o MacBook Pro" className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner" /></div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2 relative"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría</label><button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full px-6 py-5 bg-gray-50 rounded-2xl text-left text-sm font-bold shadow-inner flex items-center justify-between"><span className={formData.category ? "text-[#004D4D]" : "text-gray-300"}>{formData.category || "Seleccionar..."}</span><ChevronDown size={16} /></button>
                                            <AnimatePresence>
                                                {isCategoryOpen && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border z-[110] p-2">
                                                        <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                                                            {categoriesList.map(cat => (
                                                                <button key={cat.id} type="button" onClick={() => { setFormData({...formData, category: cat.title, collection_id: cat.id}); setIsCategoryOpen(false); }} className="w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50">{cat.title}</button>
                                                            ))}
                                                        </div>
                                                        <button type="button" onClick={() => setIsNewCategoryModalOpen(true)} className="w-full mt-2 py-3 bg-[#004D4D]/5 text-[#004D4D] rounded-xl text-[9px] font-black uppercase tracking-widest">+ Nueva Categoría</button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label><div className="flex bg-gray-50 p-1 rounded-2xl shadow-inner h-[60px]"><button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'active' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Activo</button><button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'draft' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Borrador</button></div></div>
                                    </div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={5} placeholder="Describe tu activo comercial..." className="w-full px-6 py-6 bg-gray-50 border border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-medium shadow-inner transition-all resize-none" /></div>
                                </div>
                            </section>
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between text-slate-900"><h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><ImageIcon size={18} /> Galería Multimedia</h3></div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4">
                                    {media.map((item, i) => (
                                        <Reorder.Item key={item.preview} value={item} className="group relative h-32 w-32 rounded-2xl overflow-hidden bg-gray-100 border shadow-sm cursor-grab active:cursor-grabbing">
                                            <img src={item.preview} className="w-full h-full object-cover pointer-events-none" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button type="button" onClick={() => setMedia(media.filter((_, idx) => idx !== i))} className="h-8 w-8 bg-rose-500 text-white rounded-xl flex items-center justify-center"><Trash2 size={14}/></button></div>
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (
                                        <label className="h-32 w-32 rounded-2xl border-2 border-dashed border-[#004D4D]/10 bg-gray-50/50 flex flex-col items-center justify-center gap-2 hover:border-[#00F2FF] cursor-pointer transition-all">
                                            <Plus size={20} className="text-gray-400"/>
                                            <span className="text-[8px] font-black text-gray-400 uppercase">Subir</span>
                                            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                        </label>
                                    )}
                                </Reorder.Group>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 pb-20">
                            <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3">
                                        <Layers size={18} /> Gestión de Atributos Maestro
                                    </h3>
                                    <div className="px-4 py-2 bg-purple-50 rounded-xl text-[9px] font-black text-purple-600 uppercase tracking-widest animate-pulse">
                                        Modo Multinivel Activo
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 font-medium leading-relaxed italic">
                                    Organiza tu inventario por grupos personalizados. Cada atributo puede tener múltiples sub-variantes con stock independiente.
                                </p>

                                <div className="space-y-6">
                                    {variants.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">No hay atributos configurados</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {variants.map((v, idx) => (
                                                <div key={v.id || idx} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-cyan/5 transition-all group relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setVariants(prev => prev.filter(item => item.id !== v.id))} className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D] font-black text-[10px]">{idx + 1}</div>
                                                            <h4 className="text-sm font-black text-[#004D4D] uppercase tracking-wider truncate">{v.name}</h4>
                                                        </div>
                                                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-100 inline-block">
                                                            Stock: <span className="text-[#004D4D] font-black">{v.stock} uds</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => setIsNewVariantModalOpen(true)}
                                        className="w-full py-8 border-2 border-dashed border-gray-100 rounded-[3rem] text-[10px] font-black text-gray-400 uppercase hover:text-[#004D4D] hover:bg-gray-50 transition-all flex items-center justify-center gap-4 shadow-sm group"
                                    >
                                        <div className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-all">
                                            <Plus size={20} className="text-[#004D4D]"/>
                                        </div>
                                        Añadir Nuevo Atributo / Variante
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 bg-[#004D4D] rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Package size={140} /></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Inventario Consolidado</h4>
                                        <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-[0.2em] opacity-80">Suma total de unidades físicas de todas las variantes</p>
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-md px-12 py-6 rounded-[2.5rem] border border-white/10 text-center min-w-[220px]">
                                        <span className="text-6xl font-black tracking-tighter">{variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)}</span>
                                        <p className="text-[11px] font-black uppercase mt-1 text-cyan-400 tracking-widest">Unidades en Stock</p>
                                    </div>
                                </div>
                            </div>

                            {/* MODAL FLOTANTE DE PERSONALIZACIÓN (DANIEL'S VERSION) */}
                            <AnimatePresence>
                                {isNewVariantModalOpen && (
                                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 md:p-20">
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewVariantModalOpen(false)} className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" />
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                            className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-3xl overflow-hidden border border-white flex flex-col"
                                        >
                                            <div className="bg-gray-50 p-12 border-b border-gray-100 flex justify-between items-center">
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-[#004D4D]">Personalizar Atributo</h3>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Crea combinaciones de talla, color y stock juntos</p>
                                                </div>
                                                <button onClick={() => setIsNewVariantModalOpen(false)} className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                                            </div>
                                            
                                            <div className="p-12 space-y-10 overflow-y-auto max-h-[50vh] custom-scrollbar">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em] ml-2">Nombre del Atributo Principal (Ej: Talla S o Config. Gamer)</label>
                                                    <input 
                                                        value={tempVariantName}
                                                        onChange={(e) => setTempVariantName(e.target.value)}
                                                        placeholder="Escribe el nombre principal..."
                                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#00F2FF]/30 rounded-3xl px-8 py-6 text-sm font-bold outline-none transition-all shadow-inner"
                                                    />
                                                </div>

                                                <div className="space-y-6">
                                                    <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em] ml-2">Detalles / Sub-variantes (Ej: Color Rojo, 16GB RAM...)</label>
                                                    <div className="space-y-4">
                                                        {tempSubVariants.map((sv, idx) => (
                                                            <div key={sv.id} className="flex gap-4 items-center animate-in slide-in-from-left-4 duration-300">
                                                                <div className="flex-1 relative flex items-center">
                                                                    {sv.spec.toLowerCase().includes('color') && (
                                                                        <div className="absolute left-4 z-10">
                                                                            <input 
                                                                                type="color" 
                                                                                value={resolveColor(sv.spec.split(' ').pop() || '')} 
                                                                                onChange={e => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, spec: `${sv.spec.split(' ').slice(0, -1).join(' ')} ${e.target.value}` } : item))} 
                                                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer bg-transparent" 
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <input 
                                                                        value={sv.spec}
                                                                        onChange={(e) => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, spec: e.target.value } : item))}
                                                                        placeholder="Especificación..." 
                                                                        className={`flex-1 bg-gray-50 rounded-2xl py-4 text-xs font-bold outline-none border border-transparent focus:border-gray-200 ${sv.spec.toLowerCase().includes('color') ? 'pl-14' : 'px-6'}`} 
                                                                    />
                                                                </div>
                                                                <input 
                                                                    type="number"
                                                                    value={sv.stock}
                                                                    onChange={(e) => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, stock: Number(e.target.value) } : item))}
                                                                    placeholder="0" 
                                                                    className="w-24 bg-[#004D4D]/5 rounded-2xl px-4 py-4 text-center text-xs font-black text-[#004D4D] outline-none" 
                                                                />
                                                                <button onClick={() => setTempSubVariants(prev => prev.filter(item => item.id !== sv.id))} className="text-gray-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button onClick={handleAddTempSubVariant} className="text-[9px] font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-2 hover:opacity-70"><Plus size={14}/> Añadir Especificación</button>
                                                </div>
                                            </div>

                                            <div className="p-12 bg-gray-50 flex gap-4 mt-auto">
                                                <button onClick={() => setIsNewVariantModalOpen(false)} className="flex-1 py-6 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                                                <button onClick={handleSaveMatrixAttributes} className="flex-[2] py-6 bg-[#004D4D] text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">Guardar Atributos</button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20">
                    <button onClick={() => router.back()} className="px-10 py-5 text-[10px] font-black uppercase text-gray-400">Descartar</button>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => { setFormData({...formData, status: 'draft'}); handleSave(); }} className="px-10 py-5 bg-white border border-gray-100 text-[#004D4D] rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg transition-all">Guardar Borrador</button>
                        {activeTab !== 'variants' ? (
                            <button onClick={() => setActiveTab(activeTab === 'info' ? 'financial' : 'variants')} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">Siguiente</button>
                        ) : (
                            <button onClick={handleSave} disabled={isSubmitting} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">
                                {isSubmitting ? 'Publicando...' : 'Publicar Catálogo'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* PREVISUALIZACIÓN DERECHA */}
            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-1 bg-gray-100 p-12 lg:p-20 flex items-center justify-center relative">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center"><Box size={24} className="text-[#004D4D]" /></div>
                            <div>
                                <h4 className="text-xl font-black uppercase leading-none">Previsualización</h4>
                                <p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">RÉPLICA DIGITAL DEL PRODUCTO</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10">
                        <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative">
                            {media.length > 0 ? <img src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-gray-200" />}
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.category || 'Categoría'}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3></div><div className="text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Precio</p><p className="text-2xl font-black text-[#004D4D] tracking-tighter">${formData.price.toLocaleString('de-DE')}</p></div></div>
                            {variants.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Variantes y Stock</p>
                                    <div className="flex flex-wrap gap-2">{variants.map((v, i) => (<div key={i} className="px-3 py-1.5 bg-gray-50 rounded-lg border text-[10px] font-bold text-gray-600">{v.name}: {v.stock}</div>))}</div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50"><div className="space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{formData.sku || 'PENDIENTE'}</p></div><div className="space-y-2 text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* MODALES EXTRAS */}
            <AnimatePresence>
                {isNewCategoryModalOpen && (
                    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-white text-slate-900">
                            <div className="flex items-center gap-4 mb-8 text-slate-900"><div className="h-12 w-12 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D]"><Layers size={24}/></div><div><h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Nueva Categoría</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Creación Rápida</p></div></div>
                            <div className="space-y-6 text-slate-900">
                                <div className="space-y-2 text-slate-900"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de la Familia</label><input autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Nueva Colección" className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all text-slate-900" /></div>
                                <div className="flex gap-3 pt-4 text-slate-900"><button type="button" onClick={() => setIsNewCategoryModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors text-slate-900">Cancelar</button><button type="button" disabled={!newCategoryName.trim()} onClick={handleCreateCategory} className="flex-[2] py-4 bg-[#004D4D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#004D4D]/20 disabled:opacity-50">Crear Categoría</button></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isNoDataModalOpen && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNoDataModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl p-12 text-center space-y-8 text-slate-900">
                            <div className="flex justify-center"><div className="h-24 w-24 rounded-[2.5rem] bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D] relative"><Bot size={48} className="animate-bounce" /><div className="absolute -top-2 -right-2 h-8 w-8 bg-rose-500 text-white rounded-full flex items-center justify-center border-4 border-white"><AlertCircle size={16} /></div></div></div>
                            <div className="space-y-3"><h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#001A1A]">Faltan <span className="text-rose-600">Datos Clave</span></h3><p className="text-sm font-medium text-slate-500 max-w-md mx-auto">Bayt necesita registros financieros para darte una estrategia infalible. Registra tus gastos y ventas para desbloquear el análisis profundo.</p></div>
                            <button onClick={() => setIsNoDataModalOpen(false)} className="w-full py-5 bg-[#004D4D] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl">Entendido</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
