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
  Bot
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
    
    const [isEditorGuideOpen, setIsEditorGuideOpen] = useState(false);
    const [activeEditorGuideTab, setActiveEditorGuideTab] = useState('info');

    // Mapeo de colores para reconocimiento automático
    const colorMap: { [key: string]: string } = {
        'rojo': '#FF0000', 'red': '#FF0000',
        'azul': '#0000FF', 'blue': '#0000FF',
        'verde': '#008000', 'green': '#008000',
        'negro': '#000000', 'black': '#000000',
        'blanco': '#FFFFFF', 'white': '#FFFFFF',
        'amarillo': '#FFFF00', 'yellow': '#FFFFFF',
        'gris': '#808080', 'gray': '#808080',
        'naranja': '#FFA500', 'orange': '#FFA500',
        'morado': '#800080', 'purple': '#800080',
        'rosa': '#FFC0CB', 'pink': '#FFC0CB',
        'cian': '#00FFFF', 'cyan': '#00F2FF'
    };

    const resolveColor = (val: string) => {
        const lower = val.toLowerCase().trim();
        if (colorMap[lower]) return colorMap[lower];
        if (/^#[0-9A-F]{6}$/i.test(lower)) return lower;
        return '#000000'; // Default
    };

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        wholesale_price: 0,
        cost: 0,
        category: 'General',
        sku: '',
        status: 'active' as 'active' | 'draft',
        add_gateway_fee: false
    });

    const [variants, setVariants] = useState([
        { id: Math.random().toString(36).substr(2, 9), name: 'Estándar', sku: '', stock: 0, price_adjustment: 0 }
    ]);

    const [media, setMedia] = useState<{file?: File, preview: string, type: 'image' | 'video', isMuted: boolean}[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewPreviewIndex] = useState(0);

    // Helpers de Secuencia de Variantes
    const getNextVariantValue = (currentValue: string) => {
        const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        const currentSize = currentValue.toUpperCase();
        const sizeIndex = sizes.indexOf(currentSize);
        
        if (sizeIndex !== -1 && sizeIndex < sizes.length - 1) return sizes[sizeIndex + 1];
        const num = parseInt(currentValue);
        if (!isNaN(num)) return String(num + 1);
        return "";
    };

    const addSequentialVariant = (index: number) => {
        const source = variants[index];
        const nextValue = getNextVariantValue(source.sku);
        const newVariant = {
            id: Math.random().toString(36).substr(2, 9),
            name: source.name,
            sku: nextValue,
            stock: 0,
            price_adjustment: 0
        };
        
        const newVariants = [...variants];
        newVariants.splice(index + 1, 0, newVariant);
        setVariants(newVariants);
    };

    // Estados Asistente de Precios
    const [isPriceAssistantOpen, setIsPriceAssistantOpen] = useState(false);
    const [isAnalyzingBayt, setIsAnalyzingBayt] = useState(false);
    const [isBaytReportOpen, setIsReportOpen] = useState(false);
    const [assistantExpenses, setAssistantExpenses] = useState({ payroll: 0, rent: 0, utilities: 0, ops: 0 });
    const [calcQuantity, setCalcQuantity] = useState(1);
    const [calcMargin, setCalcMargin] = useState(30);
    const [calcWholesaleMargin, setCalcWholesaleMargin] = useState(15);
    const [costError, setCostError] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [isNoDataModalOpen, setIsNoDataModalOpen] = useState(false);
    const [avgTicket, setAvgTicket] = useState(125000);

    // Helpers de Formateo de Moneda
    const formatValue = (val: number | string) => {
        if (val === undefined || val === null || val === "") return "";
        const num = String(val).replace(/\D/g, "");
        return new Intl.NumberFormat("de-DE").format(Number(num));
    };

    const parseValue = (val: string) => {
        const cleaned = val.replace(/\./g, "");
        return cleaned === "" ? 0 : Number(cleaned);
    };

    const platformCommission = 2.5;

    // Lógica de Cálculo Asistente
    const totalFixedExpenses = assistantExpenses.payroll + assistantExpenses.rent + assistantExpenses.utilities + assistantExpenses.ops;
    const expensePerUnit = calcQuantity > 0 ? totalFixedExpenses / calcQuantity : 0;
    const totalUnitCost = formData.cost + expensePerUnit;
    
    const suggestedPrice = totalUnitCost / (1 - (calcMargin / 100));
    const profitPerUnit = suggestedPrice - totalUnitCost - (suggestedPrice * (platformCommission / 100));
    const suggestedWholesale = totalUnitCost / (1 - (calcWholesaleMargin / 100));
    const profitWholesalePerUnit = suggestedWholesale - totalUnitCost - (suggestedWholesale * (platformCommission / 100));

    const marginPerUnit = suggestedPrice - formData.cost - (suggestedPrice * (platformCommission / 100));
    const breakEvenUnits = marginPerUnit > 0 ? Math.ceil(totalFixedExpenses / marginPerUnit) : 0;

    // Cálculos Pantalla Principal
    const gatewayFeeUser = formData.add_gateway_fee ? (formData.price * 0.035) : 0;
    const platformFeeUser = formData.price * (platformCommission / 100);
    const profitUser = formData.price - formData.cost - platformFeeUser - gatewayFeeUser;
    const marginUser = formData.price > 0 ? (profitUser / formData.price) * 100 : 0;

    const gatewayFeeWholesale = formData.add_gateway_fee ? (formData.wholesale_price * 0.035) : 0;
    const platformFeeWholesale = formData.wholesale_price * (platformCommission / 100);
    const profitWholesale = formData.wholesale_price - formData.cost - platformFeeWholesale - gatewayFeeWholesale;
    const marginWholesale = formData.wholesale_price > 0 ? (profitWholesale / formData.wholesale_price) * 100 : 0;

    const handleBaytAnalysis = async () => {
        if (!token) return;
        setIsAnalyzingBayt(true);
        showToast("Bayt AI auditando finanzas reales...", "info");
        
        try {
            const [expenses, orders] = await Promise.all([
                apiRequest<any[]>('/expenses', { token }).catch(() => []),
                apiRequest<any[]>('/orders', { token }).catch(() => [])
            ]);

            const totals = { payroll: 0, rent: 0, utilities: 0, ops: 0 };
            const hasRealData = (expenses && Array.isArray(expenses) && expenses.length > 0) || 
                               (orders && Array.isArray(orders) && orders.length > 0);

            if (!hasRealData) {
                setIsNoDataModalOpen(true);
                setIsAnalyzingBayt(false);
                return;
            }

            if (expenses && Array.isArray(expenses)) {
                expenses.forEach(exp => {
                    const desc = exp.description?.toLowerCase() || "";
                    const amount = exp.amount || 0;
                    if (desc.includes('nómina') || desc.includes('sueldo') || desc.includes('pago')) totals.payroll += amount;
                    else if (desc.includes('arriendo') || desc.includes('alquiler')) totals.rent += amount;
                    else if (desc.includes('servicio') || desc.includes('luz') || desc.includes('agua') || desc.includes('internet')) totals.utilities += amount;
                    else totals.ops += amount;
                });
            }

            // 2. Calcular Ticket Promedio Real
            if (orders && Array.isArray(orders) && orders.length > 0) {
                const totalSales = orders.reduce((acc, order) => acc + (order.total_price || 0), 0);
                setAvgTicket(totalSales / orders.length);
            }

            setAssistantExpenses(totals);
            showToast("Auditoría completada con datos de tu empresa.", "success");
            setHasAnalyzed(true);
        } catch (err) {
            // Ante cualquier error de estructura, asumimos que faltan datos para el análisis
            setIsNoDataModalOpen(true);
        } finally {
            setIsAnalyzingBayt(false);
        }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            if (!token) return;
            try {
                const data = await apiRequest<any[]>('/collections', { token });
                if (data) setCategoriesList(data);
            } catch (err) { console.error(err); }
        };
        fetchCategories();
    }, [token]);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || !token) return;
        try {
            const data = await apiRequest<any>('/collections', {
                method: 'POST', token,
                body: JSON.stringify({ title: newCategoryName.trim(), description: "Creada desde el editor", status: 'active' })
            });
            if (data) {
                setCategoriesList([...categoriesList, data]);
                setFormData({...formData, category: data.title});
                setNewCategoryName("");
                setIsNewCategoryModalOpen(false);
                showToast("Categoría creada", "success");
            }
        } catch (err) { showToast("Error", "error"); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (media.length + files.length > 5) return showToast("Máximo 5 archivos", "info");
        const newMedia = files.map(f => ({ 
            file: f, preview: URL.createObjectURL(f),
            type: f.type.startsWith('video') ? 'video' as const : 'image' as const,
            isMuted: true
        }));
        setMedia([...media, ...newMedia]);
    };

    const toggleMute = (index: number) => {
        const updatedMedia = [...media];
        updatedMedia[index].isMuted = !updatedMedia[index].isMuted;
        setMedia(updatedMedia);
    };

    const handleSave = async () => {
        if (!formData.name) return showToast("El nombre es obligatorio", "info");
        setIsSubmitting(true);
        try {
            await apiRequest('/products', {
                method: 'POST', token,
                body: JSON.stringify({
                    ...formData,
                    image_url: media.length > 0 ? media[0].preview : null,
                    variants: variants.map(v => ({ ...v, sku: v.sku || formData.sku }))
                })
            });
            showToast("Producto creado", "success");
            router.push('/dashboard/products');
        } catch (err) { showToast("Error", "error"); } finally { setIsSubmitting(false); }
    };

    const editorGuideContent = {
        info: { title: 'Información General', icon: <Info size={20}/>, color: 'text-blue-500', howItWorks: 'Define identidad visual y textual.', example: 'Título: "Zapatillas".', tip: 'Usa palabras clave SEO.' },
        financial: { title: 'Finanzas y PVP', icon: <DollarSign size={20}/>, color: 'text-emerald-600', howItWorks: 'Calcula utilidad automáticamente.', example: 'Costo $100, Venta $200.', tip: 'Activa pasarela para fee.' },
        variants: { title: 'Variantes y Stock', icon: <Layers size={20}/>, color: 'text-cyan-600', howItWorks: 'Gestiona tallas y SKUs.', example: 'Variante "Azul / L".', tip: 'Asigna SKU único.' }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden font-sans text-slate-900">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => router.back()} className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md border border-white/20 text-gray-500 hover:text-rose-500 shadow-lg">
                <X size={20} />
            </motion.button>

            <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8 text-slate-900 text-slate-900">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FF] animate-pulse"></span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Editor de Catálogo</span>
                        </div>
                        <h2 className="text-4xl font-black italic uppercase text-[#001A1A] tracking-tighter text-slate-900">
                            Crear <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Producto</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-1 bg-white border border-[#0a3d42]/5 rounded-full shadow-lg flex items-center relative z-10">
                            {(['info', 'financial', 'variants'] as const).map((tab) => {
                                const isActive = activeTab === tab;
                                return (
                                    <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`relative px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-[#004D4D]'}`}>
                                        {isActive && <motion.div layoutId="activeEditorTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                                        {tab === 'info' ? 'Información' : tab === 'financial' ? 'Finanzas' : 'Variantes'}
                                    </button>
                                );
                            })}
                        </div>
                        <motion.button whileHover={{ scale: 1.1, backgroundColor: "#004D4D", color: "#fff" }} whileTap={{ scale: 0.9 }} onClick={() => setIsEditorGuideOpen(true)} className="h-10 w-10 rounded-full bg-white border border-[#0a3d42]/10 flex items-center justify-center text-[#004D4D] shadow-md group"><Info size={18} className="group-hover:animate-pulse" /></motion.button>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TITULO DEL PRODUCTO</label>
                                        <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Camiseta de Algodón Pima" className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all text-slate-900" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2 relative">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría</label>
                                            <button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl text-left text-sm font-bold shadow-inner flex items-center justify-between hover:bg-white hover:border-[#004D4D]/20 transition-all text-slate-900">
                                                <span className={formData.category ? "text-[#004D4D]" : "text-gray-300"}>{formData.category || "Seleccionar..."}</span>
                                                <ChevronDown size={16} className={`transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {isCategoryOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[100]" onClick={() => setIsCategoryOpen(false)} />
                                                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[110] overflow-hidden flex flex-col text-slate-900">
                                                            <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-2">
                                                                {categoriesList.length === 0 ? (<div className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin categorías</div>) : (
                                                                    categoriesList.map((cat) => (
                                                                        <button key={cat.id || cat.title} type="button" onClick={() => { setFormData({...formData, category: cat.title}); setIsCategoryOpen(false); }} className={`w-full text-left px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.category === cat.title ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>{cat.title}</button>
                                                                    ))
                                                                )}
                                                            </div>
                                                            <div className="p-2 bg-slate-50 border-t border-slate-100"><button type="button" onClick={() => { setIsNewCategoryModalOpen(true); setIsCategoryOpen(false); }} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all shadow-sm text-slate-900"><Plus size={14}/> Crear Nueva</button></div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de Publicación</label>
                                            <div className="flex bg-gray-50 p-1 rounded-2xl shadow-inner h-14">
                                                <button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'active' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Activo</button>
                                                <button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'draft' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Borrador</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={5} placeholder="Describe tu producto..." className="w-full px-6 py-6 bg-gray-50 border border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-medium shadow-inner transition-all resize-none text-slate-900" />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><ImageIcon size={18} /> Galería Multimedia</h3>
                                    <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg text-slate-900">Arrastra para ordenar</span>
                                </div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4">
                                    {media.map((item, i) => (
                                        <Reorder.Item key={item.preview} value={item} whileDrag={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }} className="group relative h-32 w-32 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing text-slate-900">
                                            {item.type === 'video' ? (<video src={item.preview} className="w-full h-full object-cover pointer-events-none text-slate-900" muted loop autoPlay playsInline />) : (<img src={item.preview} alt="Preview" className="w-full h-full object-cover pointer-events-none" />)}
                                            {i === 0 && (<div className="absolute top-2 left-2 px-2 py-0.5 bg-[#4fffcb] text-[#004D4D] text-[7px] font-black uppercase rounded-md shadow-sm z-10">Principal</div>)}
                                            {item.type === 'video' && item.isMuted && (<div className="absolute top-2 right-2 h-5 w-5 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center text-white z-10"><VolumeX size={10} /></div>)}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                                                {item.type === 'video' && (<button type="button" onClick={(e) => { e.stopPropagation(); toggleMute(i); }} className="h-8 w-8 bg-white/20 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-[#00F2FF] hover:text-[#004D4D] transition-all text-white">{item.isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}</button>)}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setMedia(media.filter((_, idx) => idx !== i)); }} className="h-8 w-8 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors text-white"><Trash2 size={14}/></button>
                                            </div>
                                            <div className="absolute bottom-2 right-2 h-6 w-6 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white/60 opacity-0 group-hover:opacity-100 transition-opacity text-white"><GripVertical size={12} /></div>
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (<label className="h-32 w-32 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-[#00F2FF]/30 hover:bg-[#00F2FF]/5 cursor-pointer transition-all group text-slate-900"><div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center text-gray-300 group-hover:text-[#00F2FF] shadow-sm"><Plus size={16}/></div><span className="text-[8px] font-black uppercase text-gray-300">Añadir</span><input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} /></label>)}
                                </Reorder.Group>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'financial' && (
                        <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6 text-slate-900">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo del Producto</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span>
                                            <input type="text" id="product-cost-input" value={formatValue(formData.cost)} onChange={e => setFormData({...formData, cost: parseValue(e.target.value)})} placeholder="0" className={`w-full pl-12 pr-6 py-5 bg-gray-50 rounded-2xl outline-none text-base font-black border transition-all ${costError ? 'border-rose-500 ring-4 ring-rose-500/10 focus:bg-white' : 'border-transparent focus:border-[#004D4D]/20 focus:bg-white shadow-inner'} text-slate-900`} />
                                        </div>
                                        {costError && (<motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[8px] font-bold text-rose-600 uppercase tracking-widest ml-1">Campo requerido para continuar</motion.p>)}
                                    </div>
                                    <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4 h-[110px] mt-6"><div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><ShieldCheck size={16} /></div><p className="text-[9px] font-medium text-emerald-800 leading-tight">Valor base de inversión para cálculo de márgenes y utilidad neta.</p></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-slate-900">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-slate-900">Precio Mayorista</label>
                                        <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-600 font-black">$</span><input type="text" value={formatValue(formData.wholesale_price)} onChange={e => setFormData({...formData, wholesale_price: parseValue(e.target.value)})} placeholder="0" className="w-full pl-12 pr-6 py-5 bg-cyan-50/30 rounded-2xl outline-none text-xl font-black text-cyan-700 border border-transparent focus:border-cyan-200 focus:bg-white shadow-inner transition-all text-slate-900" /></div>
                                    </div>
                                    <motion.div layout className="bg-[#004D4D] rounded-[2.5rem] p-8 text-white relative overflow-hidden h-[110px] mt-6 flex flex-col justify-center border border-white/5">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="absolute top-6 right-8"><span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{marginWholesale.toFixed(1)}%</span></div>
                                        <div className="relative z-10">
                                            <p className="text-[7px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1 text-white">Utilidad Mayorista</p>
                                            <span className={`text-2xl font-black italic leading-none ${profitWholesale > 0 ? 'text-[#4fffcb]' : 'text-rose-400'}`}>${profitWholesale.toLocaleString('de-DE')}</span>
                                            <div className="mt-2 flex items-center gap-2 text-white">
                                                <div className="h-1 w-1 rounded-full bg-[#00F2FF] animate-pulse shadow-[0_0_8px_#00F2FF]"></div>
                                                <span className="text-[8px] font-bold text-cyan-300 uppercase tracking-widest text-white">Retención: -${(platformFeeWholesale + gatewayFeeWholesale).toFixed(0)}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-slate-900">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-slate-900">Precio Usuario Final</label>
                                        <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004D4D] font-black">$</span><input type="text" value={formatValue(formData.price)} onChange={e => setFormData({...formData, price: parseValue(e.target.value)})} placeholder="0" className="w-full pl-12 pr-6 py-5 bg-[#004D4D]/5 rounded-2xl outline-none text-2xl font-black text-[#004D4D] border border-transparent focus:border-[#004D4D]/20 focus:bg-white shadow-inner transition-all text-slate-900" /></div>
                                    </div>
                                    <motion.div layout className="bg-[#001A1A] rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-white/5 shadow-2xl h-[110px] mt-6 flex flex-col justify-center text-white"><div className="absolute top-0 right-0 w-32 h-32 bg-[#00F2FF]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div><div className="absolute top-6 right-8"><span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] text-white">{marginUser.toFixed(1)}%</span></div><div className="relative z-10"><p className="text-[7px] font-black text-[#00F2FF] uppercase tracking-[0.2em] mb-1 text-white">Utilidad Retail</p><span className={`text-2xl font-black italic leading-none ${profitUser > 0 ? 'text-[#4fffcb]' : 'text-rose-400'}`}>${profitUser.toLocaleString('de-DE')}</span><div className="mt-2 flex items-center gap-2 text-white"><div className="h-1 w-1 rounded-full bg-[#00F2FF]"></div><span className="text-[8px] font-bold text-[#00F2FF] uppercase tracking-widest text-white">Retención: -${(platformFeeUser + gatewayFeeUser).toFixed(0)}</span></div></div></motion.div>
                                </div>

                                <div className="pt-8 border-t border-gray-100 space-y-8 text-slate-900">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-slate-900">
                                        <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-[#00F2FF]/30 cursor-pointer transition-all group text-slate-900 relative">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={formData.add_gateway_fee} onChange={e => setFormData({...formData, add_gateway_fee: e.target.checked})} className="sr-only peer" />
                                                <div className="w-8 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#00F2FF] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-3"></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[9px] font-black uppercase text-[#004D4D]">Comisión Pasarela de Pago</p>
                                                <div className="relative group/gate">
                                                    <Info size={10} className="text-slate-300 hover:text-[#004D4D] transition-colors" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-[#001A1A] text-white rounded-xl text-[8px] leading-relaxed font-bold uppercase tracking-widest opacity-0 group-hover/gate:opacity-100 pointer-events-none transition-all shadow-2xl z-50">
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#001A1A]"></div>
                                                        Las pasarelas de pago cobran un porcentaje por procesar tarjetas de crédito/débito de forma segura, cubrir redes bancarias y prevenir fraudes digitales.
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                        <div className="flex items-center justify-between px-6 py-4 bg-[#004D4D]/5 rounded-2xl border border-[#004D4D]/10 text-slate-900"><div className="flex flex-col text-slate-900"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-slate-900">Soporte Financiero</span><span className="text-[10px] font-black text-[#004D4D] uppercase">Bayup Fee Incluído</span></div><div className="flex items-center gap-3 text-slate-900"><span className="text-sm font-black text-[#004D4D]">2.5%</span><ShieldCheck size={18} className="text-[#004D4D]/20 text-slate-900" /></div></div>
                                    </div>

                                    <div className="p-10 bg-[#004D4D]/5 rounded-[3rem] border border-dashed border-[#004D4D]/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none text-slate-900"></div>
                                        <div className="space-y-2 relative z-10 text-center md:text-left text-slate-900"><p className="text-sm font-black text-[#004D4D] uppercase tracking-tight leading-tight max-w-md text-slate-900">¿Necesitas ayuda para encontrar el precio perfecto para tus productos?</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide text-slate-900">Te damos el precio definitivo para tus productos según tus estadísticas.</p></div>
                                        <div className="relative z-10 w-full md:w-auto">
                                            <motion.button type="button" animate={costError ? { x: [-4, 4, -4, 4, 0], backgroundColor: "#e11d48" } : {}} onClick={() => { if (formData.cost <= 0) { setCostError(true); const el = document.getElementById('product-cost-input'); if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } setTimeout(() => setCostError(false), 3000); return; } setIsPriceAssistantOpen(true); }} className={`w-full md:w-auto px-12 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl ${costError ? 'bg-rose-600 text-white' : 'bg-[#004D4D] text-[#4fffcb] hover:bg-black hover:text-white shadow-[#004D4D]/20'}`}>{costError ? "Costo Requerido" : "Encontrar mi precio"}</motion.button>
                                            <AnimatePresence>{costError && (<motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full mt-3 left-0 right-0 text-[8px] font-bold text-rose-600 uppercase tracking-widest text-center">Debes seleccionar el costo del producto para continuar</motion.p>)}</AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10 text-slate-900">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 text-slate-900">
                                <div className="flex items-center justify-between border-b border-gray-50 pb-6 text-slate-900">
                                    <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><Layers size={18} /> Gestión de Variantes</h3>
                                    <button type="button" onClick={() => setVariants([...variants, { name: '', sku: '', stock: 0, price_adjustment: 0 }])} className="bg-[#004D4D]/5 hover:bg-[#004D4D] hover:text-white text-[#004D4D] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm text-slate-900">
                                        <Plus size={14} /> Añadir Variante
                                    </button>
                                </div>
                                <div className="space-y-10 text-slate-900">
                                    {/* AGRUPACIÓN POR FAMILIA DE ATRIBUTO */}
                                    {Array.from(new Set(variants.map(v => v.name))).map((groupName, groupIdx) => {
                                        const groupVariants = variants.filter(v => v.name === groupName);
                                        const isColorType = groupName.toLowerCase().includes('color');

                                        return (
                                            <div key={`group-${groupIdx}`} className="p-10 bg-gray-50 rounded-[3rem] border border-transparent hover:border-[#004D4D]/10 transition-all text-slate-900">
                                                {/* ENCABEZADOS DE LA FAMILIA */}
                                                <div className="flex gap-6 mb-4 px-2 text-slate-900">
                                                    <div className="flex-1 min-w-[180px]"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Atributo</label></div>
                                                    <div className="flex-1 min-w-[180px]"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Especificación</label></div>
                                                    <div className="w-32"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">Stock</label></div>
                                                    <div className="w-11"></div>
                                                </div>

                                                <div className="space-y-4">
                                                    {groupVariants.map((variant) => (
                                                        <div key={variant.id} className="flex gap-6 items-center group/row animate-in fade-in slide-in-from-top-2 duration-300">
                                                            {/* Atributo */}
                                                            <div className="flex-1 min-w-[180px]">
                                                                <input 
                                                                    value={variant.name} 
                                                                    onChange={e => {
                                                                        const newName = e.target.value;
                                                                        setVariants(prev => prev.map(v => v.name === groupName ? { ...v, name: newName } : v));
                                                                    }}
                                                                    placeholder="Ej: Talla" 
                                                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-bold focus:border-[#00F2FF]/30 text-slate-900 shadow-sm"
                                                                />
                                                            </div>

                                                            {/* Especificación */}
                                                            <div className="flex-1 min-w-[180px]">
                                                                <div className="relative flex items-center">
                                                                    {isColorType && (
                                                                        <div className="absolute left-3 flex items-center">
                                                                            <input 
                                                                                type="color" 
                                                                                value={resolveColor(variant.sku)}
                                                                                className="w-5 h-5 rounded-full border-none cursor-pointer bg-transparent shadow-sm"
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value;
                                                                                    setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, sku: val } : v));
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <input 
                                                                        value={variant.sku} 
                                                                        onChange={e => {
                                                                            const val = e.target.value;
                                                                            setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, sku: val } : v));
                                                                        }}
                                                                        placeholder={isColorType ? "Nombre o Hex" : "Ej: S, M, L..."} 
                                                                        className={`w-full bg-white border border-gray-100 rounded-xl py-3 outline-none text-xs font-bold focus:border-[#00F2FF]/30 text-slate-900 shadow-sm ${isColorType ? 'pl-10' : 'px-4'}`} 
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Stock */}
                                                            <div className="w-32">
                                                                <input 
                                                                    type="text" 
                                                                    value={formatValue(variant.stock)} 
                                                                    onChange={e => {
                                                                        const val = parseValue(e.target.value);
                                                                        setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, stock: val } : v));
                                                                    }} 
                                                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-black text-center focus:border-[#00F2FF]/30 text-slate-900 shadow-sm" 
                                                                />
                                                            </div>

                                                            {/* Eliminar Fila */}
                                                            <div className="w-11">
                                                                {variants.length > 1 && (
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setVariants(prev => prev.filter(v => v.id !== variant.id))}
                                                                        className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/row:opacity-100"
                                                                    >
                                                                        <X size={18} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* BOTÓN AGREGAR OTRA */}
                                                {groupName && (
                                                    <div className="mt-6 pt-6 border-t border-gray-200/50">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => addSequentialVariant(variants.indexOf(groupVariants[groupVariants.length - 1]))}
                                                            className="text-[10px] font-black text-[#004D4D] hover:text-black uppercase tracking-widest flex items-center gap-3 transition-all group/btn"
                                                        >
                                                            <div className="h-7 w-7 rounded-xl bg-[#004D4D] text-white flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
                                                                <Plus size={14} />
                                                            </div>
                                                            Agregar otra {groupName} {getNextVariantValue(groupVariants[groupVariants.length - 1].sku) ? `(${getNextVariantValue(groupVariants[groupVariants.length - 1].sku)})` : ''}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => setVariants([...variants, { id: Math.random().toString(36).substr(2, 9), name: '', sku: '', stock: 0, price_adjustment: 0 }])}
                                        className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[3rem] text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-[#004D4D]/20 hover:text-[#004D4D] transition-all flex items-center justify-center gap-3"
                                    >
                                        <Plus size={16} /> Nueva Familia de Atributos
                                    </button>
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20 text-slate-900">
                    <button type="button" onClick={() => router.back()} className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#004D4D] transition-colors text-slate-900">Descartar</button>
                    <div className="flex gap-4 text-slate-900">
                        <button type="button" onClick={() => { setFormData({...formData, status: 'draft'}); handleSave(); }} className="px-10 py-5 bg-white border border-gray-100 text-[#004D4D] rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg transition-all text-slate-900">Guardar Borrador</button>
                        {activeTab !== 'variants' ? (
                            <button type="button" onClick={() => setActiveTab(activeTab === 'info' ? 'financial' : 'variants')} disabled={!formData.name} className={`px-14 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all ${!formData.name ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#004D4D] text-white hover:bg-black shadow-[#004D4D]/20'}`}>Siguiente</button>
                        ) : (
                            <button type="button" onClick={handleSave} disabled={isSubmitting || !formData.name} className={`px-14 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all ${isSubmitting || !formData.name ? 'bg-gray-200 text-gray-400' : 'bg-[#004D4D] text-white hover:bg-black shadow-[#004D4D]/20'}`}>{isSubmitting ? 'Procesando...' : 'Publicar Catálogo'}</button>
                        )}
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full lg:w-[45%] h-full bg-[#E5E7EB] p-12 lg:p-20 flex items-center justify-center relative text-slate-900">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white relative group text-slate-900">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 z-20 text-white">
                        <div className="flex items-center gap-6 text-white"><div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg"><Box size={24} className="text-[#004D4D]" /></div><div><h4 className="text-xl font-black uppercase leading-none text-white">Previsualización</h4><p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1 text-white text-white">Digital Twin del Producto</p></div></div>
                        <div className="text-right text-white"><div className="text-xl font-black text-white italic flex items-center opacity-20"><span>BAY</span><InteractiveUP /></div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10 text-slate-900">
                        <div className="space-y-6 text-slate-900">
                            <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center relative group/img text-slate-900 text-slate-900">
                                <AnimatePresence mode="popLayout text-slate-900">
                                    {media.length > 0 ? (
                                        media[selectedPreviewIndex]?.type === 'video' ? (<motion.video key={media[selectedPreviewIndex]?.preview} layoutId={`media-${media[selectedPreviewIndex]?.preview}`} src={media[selectedPreviewIndex]?.preview} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} className="w-full h-full object-cover" autoPlay muted loop playsInline />) : (<motion.img key={media[selectedPreviewIndex]?.preview} layoutId={`media-${media[selectedPreviewIndex]?.preview}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" alt="Preview" />)
                                    ) : (<ImageIcon size={40} className="text-gray-200 text-slate-900" />)}
                                </AnimatePresence>
                                <div className="absolute top-6 right-6 h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg text-[#004D4D]"><Star size={18} fill="#004D4D" /></div>
                            </div>
                            {media.length > 1 && (<motion.div layout className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar text-slate-900"><AnimatePresence mode="popLayout text-slate-900">{media.map((item, i) => { if (i === selectedPreviewIndex) return null; return (<motion.button key={item.preview} layoutId={`media-${item.preview}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={() => setSelectedPreviewPreviewIndex(i)} className="h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm opacity-60 hover:opacity-100 transition-opacity relative group/thumb">{item.type === 'video' ? (<><video src={item.preview} className="w-full h-full object-cover" muted loop autoPlay playsInline /><div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white shadow-inner"><Play size={12} fill="white" /></div></>) : (<img src={item.preview} className="w-full h-full object-cover" alt={`Thumb ${i}`} />)}</motion.button>); })}</AnimatePresence></motion.div>)}
                        </div>
                        <div className="space-y-6 text-slate-900">
                            <div className="flex justify-between items-start text-slate-900"><div className="space-y-1 text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-slate-900 text-slate-900">{formData.category}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight text-slate-900">{formData.name || 'Sin nombre'}</h3></div><div className="text-right text-slate-900 text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase text-slate-900">Precio PVP</p><p className="text-2xl font-black text-[#004D4D] tracking-tighter text-slate-900">${formData.price.toLocaleString('de-DE')}</p></div></div>
                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 text-slate-900 text-slate-900"><p className="text-xs text-gray-500 font-medium leading-relaxed italic text-slate-900">{formData.description || 'Sin descripción disponible...'}</p></div>
                            <div className="grid grid-cols-2 gap-6 text-slate-900"><div className="space-y-2 text-slate-900 text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase text-slate-900">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 text-slate-900 text-slate-900"><Hash size={14} className="text-[#00F2FF]" /> {formData.sku || 'PENDIENTE'}</p></div><div className="space-y-2 text-right text-slate-900 text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase text-slate-900">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest text-slate-900 text-slate-900">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                    <div className="p-10 pt-0 bg-white text-slate-900"><div className="bg-[#004D4D]/5 p-6 rounded-[2rem] border border-[#004D4D]/10 flex items-center justify-between text-slate-900"><div className="flex items-center gap-4 text-slate-900 text-slate-900"><div className="h-10 w-10 bg-[#004D4D] rounded-xl flex items-center justify-center text-white shadow-lg text-white"><ShoppingBag size={18} /></div><span className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest text-slate-900 text-slate-900">Vista Tienda Online</span></div><ArrowUpRight size={18} className="text-[#004D4D]/30 text-slate-900" /></div></div>
                </div>
            </motion.div>

            {/* --- ASISTENTE DE PRECIOS INTELIGENTE --- */}
            <AnimatePresence>
                {isPriceAssistantOpen && (
                    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 md:p-10 text-slate-900">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsPriceAssistantOpen(false)} 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl text-slate-900" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: -10 }} 
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20, rotateX: 5 }} 
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row text-slate-900"
                        >
                            <div className="w-full md:w-96 bg-gray-50/50 border-r border-gray-100 p-10 overflow-y-auto custom-scrollbar text-slate-900">
                                <div className="space-y-10 text-slate-900">
                                    <div className="flex items-center gap-4 text-slate-900 text-slate-900"><div className="h-12 w-12 rounded-2xl bg-[#004D4D] flex items-center justify-center text-white"><Zap size={24} /></div><div><h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter text-slate-900">Asistente</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-slate-900">Pricing Estratégico</p></div></div>
                                                                        <div className="space-y-6 text-slate-900">
                                                                            <div className="border-b border-gray-100 pb-2 text-slate-900"><h4 className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Gastos Mensuales</h4></div>
                                                                            <div className="grid grid-cols-1 gap-4 text-slate-900">
                                                                                {[{ label: 'Nómina', key: 'payroll', icon: <User size={14}/> }, { label: 'Arriendo', key: 'rent', icon: <Box size={14}/> }, { label: 'Servicios', key: 'utilities', icon: <Zap size={14}/> }, { label: 'Otros Gastos', key: 'ops', icon: <Smartphone size={14}/> }].map((field) => (
                                                                                    <div key={field.key} className="space-y-1.5 text-slate-900">
                                                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 text-slate-900">{field.icon} {field.label}</label>
                                                                                        <div className="relative text-slate-900"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs text-slate-900">$</span><input type="text" value={formatValue(assistantExpenses[field.key as keyof typeof assistantExpenses])} onChange={(e) => setAssistantExpenses({...assistantExpenses, [field.key]: parseValue(e.target.value)})} className="w-full pl-8 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold focus:border-[#004D4D]/20 outline-none transition-all text-slate-900 text-slate-900" /></div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                    
                                                                                                                                                            {/* Botón Consultar a Bayt */}
                                                                                                                                                            <button 
                                                                                                                                                                onClick={handleBaytAnalysis} 
                                                                                                                                                                disabled={isAnalyzingBayt} 
                                                                                                                                                                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 transition-all relative overflow-hidden border-2 ${isAnalyzingBayt ? 'bg-slate-100' : 'bg-gradient-to-r from-[#001A1A] to-[#004D4D] text-white border-white/5 shadow-2xl'}`}
                                                                                                                                                            >
                                                                                                                                                                <AnimatePresence mode="wait">
                                                                                                                                                                    {!isAnalyzingBayt ? (
                                                                                                                                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4 text-white">
                                                                                                                                                                            <Bot size={24} />
                                                                                                                                                                            <div className="flex flex-col items-start">
                                                                                                                                                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Consultar a Bayt</span>
                                                                                                                                                                                <span className="text-[7px] font-bold text-white/40 uppercase mt-1 tracking-widest">Análisis Multimétrica</span>
                                                                                                                                                                            </div>
                                                                                                                                                                        </motion.div>
                                                                                                                                                                    ) : (
                                                                                                                                                                        <motion.div className="flex items-center justify-center">
                                                                                                                                                                            <motion.div animate={{ y: [-2, -20, 0], scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-[#004D4D]">
                                                                                                                                                                                <Bot size={32} />
                                                                                                                                                                            </motion.div>
                                                                                                                                                                        </motion.div>
                                                                                                                                                                    )}
                                                                                                                                                                </AnimatePresence>
                                                                                                                                                            </button>                                                                                                                                                                    {/* Botón de Sustentación encima de la nota */}
                                                                                                                                                                    <AnimatePresence>
                                                                                                                                                                        {hasAnalyzed && (
                                                                                                                                                                            <motion.button 
                                                                                                                                                                                initial={{ opacity: 0, y: 10 }}
                                                                                                                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                                                                                                                whileHover={{ scale: 1.02 }}
                                                                                                                                                                                onClick={() => setIsReportOpen(true)}
                                                                                                                                                                                className="w-full py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-[#004D4D] shadow-xl transition-all group"
                                                                                                                                                                            >
                                                                                                                                                                                <div className="h-8 w-8 rounded-lg bg-[#004D4D]/5 flex items-center justify-center group-hover:bg-[#004D4D] group-hover:text-white transition-colors">
                                                                                                                                                                                    <BarChart3 size={16} />
                                                                                                                                                                                </div>
                                                                                                                                                                                <div className="flex flex-col items-start text-left">
                                                                                                                                                                                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">Ver Sustentación</span>
                                                                                                                                                                                    <span className="text-[7px] font-bold text-slate-400 uppercase">Argumentos de la IA</span>
                                                                                                                                                                                </div>
                                                                                                                                                                            </motion.button>
                                                                                                                                                                        )}
                                                                                                                                                                    </AnimatePresence>
                                                                                                                            
                                                                                                                                                                    {/* Nota sobre Costos de Envío al final */}
                                                                                                                                                                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex gap-3">
                                                                                                                                                                        <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                                                                                                                                                        <p className="text-[7px] font-bold text-amber-800 uppercase leading-normal tracking-wider">
                                                                                                                                                                            Recuerda que los precios generados en este módulo no tienen en cuenta los costos de envío ya que estos son dinámicos. Bayt prioriza el cálculo sobre costos fijos reales.
                                                                                                                                                                        </p>
                                                                                                                                                                    </div>
                                                                                                                                                                </div>                                </div>
                            </div>
                            <div className="flex-1 p-12 bg-white flex flex-col justify-between overflow-y-auto custom-scrollbar text-slate-900 text-slate-900">
                                <div className="space-y-10 text-slate-900 text-slate-900">
                                    <div className="flex justify-between items-start text-slate-900 text-slate-900">
                                        <div className="space-y-6 text-slate-900 text-slate-900"><div className="text-slate-900 text-slate-900"><h2 className="text-3xl font-black italic uppercase text-[#001A1A] tracking-tighter text-slate-900 text-slate-900">Simulación de <span className="text-[#004D4D] text-slate-900">Rentabilidad</span></h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 text-slate-900">Calculando el punto óptimo de venta</p></div>
                                            <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 text-slate-900 text-slate-900"><div className="space-y-1.5 min-w-[200px] text-slate-900 text-slate-900 text-slate-900"><label className="text-[8px] font-black text-[#004D4D] uppercase tracking-widest ml-1 text-slate-900 text-slate-900 text-slate-900">Unidades a la venta (Volumen)</label><div className="relative text-slate-900 text-slate-900 text-slate-900"><Box size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D4D]/30 text-slate-900" /><input type="text" value={formatValue(calcQuantity)} onChange={(e) => setCalcQuantity(parseValue(e.target.value))} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-[#004D4D]/20 outline-none transition-all text-slate-900 text-slate-900 shadow-sm text-slate-900" /></div></div><div className="h-12 w-px bg-slate-200 mx-2 hidden md:block text-slate-900"></div><div className="space-y-1.5 min-w-[180px] relative group/info text-slate-900"><div className="flex items-center gap-2 ml-1 text-slate-900"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-slate-900">Ticket Promedio Tienda</label><div className="relative cursor-help text-slate-900"><Info size={10} className="text-slate-300 hover:text-[#004D4D] text-slate-900" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[#001A1A] text-white rounded-xl text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover/info:opacity-100 transition-all text-white">Valor medio de compra. Vital para competitividad.</div></div></div><div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-900 text-slate-900"><ShoppingBag size={12} className="text-emerald-600 text-slate-900" /><span className="text-sm font-black text-slate-900 text-slate-900">${avgTicket.toLocaleString('de-DE')}</span></div></div></div>
                                        </div>
                                        <button onClick={() => setIsPriceAssistantOpen(false)} className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#004D4D] transition-colors text-slate-900"><X size={20}/></button>
                                    </div>
                                    <div className="space-y-4 text-slate-900 text-slate-900">
                                        <div className="bg-[#001A1A] rounded-[3.5rem] p-8 text-white relative overflow-hidden group border border-white/5 shadow-2xl flex flex-col justify-between min-h-[220px] text-white"><div className="absolute top-0 right-0 w-48 h-48 bg-[#00F2FF]/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 text-white"></div><div className="relative z-10 flex justify-between items-start text-white text-white"><div className="space-y-0.5 text-white"><p className="text-[8px] font-black text-[#00F2FF] uppercase tracking-[0.3em] text-white">Sugerido Retail</p><h5 className="text-4xl font-black italic tracking-tighter text-[#4fffcb] text-white">${Math.round(suggestedPrice).toLocaleString('de-DE')}</h5></div><div className="text-right text-white text-white"><span className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] text-white text-white text-white">{calcMargin}%</span></div></div><div className="relative z-10 space-y-3 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 mt-4 text-white text-white text-white text-white"><div className="flex justify-between items-center text-white"><span className="text-[7px] font-black uppercase text-slate-400">Margen Final</span><button onClick={() => setCalcMargin(30)} className="text-[7px] font-black text-[#4fffcb] uppercase hover:underline">Recomendación (30%)</button></div><input type="range" min="5" max="80" value={calcMargin} onChange={(e) => setCalcMargin(Number(e.target.value))} className="w-full h-1 bg-white/10 appearance-none accent-[#4fffcb]" /><div className="flex justify-center items-center gap-3 text-white text-white"><span className="text-[8px] font-black text-white/40 uppercase">Utilidad Neta:</span><span className="text-sm font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] text-white">${Math.round(profitPerUnit).toLocaleString()} / Unidad</span></div></div></div>
                                        <div className="bg-[#004D4D] rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-white/5 shadow-lg flex flex-col justify-between min-h-[220px] text-white"><div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 text-white"></div><div className="relative z-10 flex justify-between items-start text-white text-white"><div className="space-y-0.5 text-white"><p className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.3em] text-white">Sugerido Mayorista</p><h5 className="text-4xl font-black italic tracking-tighter text-white text-white">${Math.round(suggestedWholesale).toLocaleString('de-DE')}</h5></div><div className="text-right text-white text-white text-white text-white"><span className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] text-white text-white">{calcWholesaleMargin}%</span></div></div><div className="relative z-10 space-y-3 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 mt-4 text-white text-white text-white text-white text-white"><div className="flex justify-between items-center text-white"><span className="text-[7px] font-black uppercase text-white/40">Distribución</span><button onClick={() => setCalcWholesaleMargin(15)} className="text-[7px] font-black text-white/60 uppercase hover:underline">Recomendación (15%)</button></div><input type="range" min="5" max="50" value={calcWholesaleMargin} onChange={(e) => setCalcWholesaleMargin(Number(e.target.value))} className="w-full h-1 bg-white/10 appearance-none accent-cyan-400" /><div className="flex justify-center items-center gap-3 text-white text-white text-white"><span className="text-[8px] font-black text-white/40 uppercase">Utilidad Neta:</span><span className="text-sm font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] text-white text-white text-white text-white">${Math.round(profitWholesalePerUnit).toLocaleString()} / Unidad</span></div></div></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 text-slate-900 text-slate-900"><div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-slate-900 text-slate-900 text-slate-900"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-slate-900">Punto de Equilibrio</p><h5 className="text-xl font-black text-slate-900 text-slate-900 text-slate-900 text-slate-900">{breakEvenUnits} <span className="text-[10px]">Unidades</span></h5></div><div className={`p-6 rounded-2xl border flex items-center gap-4 ${suggestedPrice > avgTicket * 1.3 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}`}><div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${suggestedPrice > avgTicket * 1.3 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>{suggestedPrice > avgTicket * 1.3 ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}</div><p className="text-[9px] font-bold uppercase leading-tight">{suggestedPrice > avgTicket * 1.3 ? "Precio elevado vs mercado" : "Precio Competitivo"}</p></div></div>
                                    <div className="p-8 bg-[#004D4D]/5 rounded-[2.5rem] border border-[#004D4D]/10 flex gap-6 items-start text-slate-900 text-slate-900 text-slate-900"><div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-[#004D4D] shadow-sm shrink-0 text-slate-900"><ShieldCheck size={24} /></div><div className="space-y-2 text-slate-900"><h4 className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">¿Por qué este precio es tu mejor opción?</h4><p className="text-[11px] text-slate-600 leading-relaxed font-medium text-slate-900">Análisis de <span className="text-[#004D4D] font-bold text-slate-900">Prorrateo Operativo</span>. Cubre costo de compra y asegura aporte proporcional a <span className="font-bold text-slate-900">Nómina, Arriendo y Servicios</span>. Proteges tu utilidad y aseguras escalabilidad sin perder competitividad.</p></div></div>
                                </div>
                                <div className="flex gap-4 pt-10 text-slate-900"><button onClick={() => setIsPriceAssistantOpen(false)} className="flex-1 py-5 rounded-[1.8rem] bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all text-slate-900 text-slate-900">Cancelar</button><button onClick={() => { setFormData({...formData, price: Math.round(suggestedPrice), wholesale_price: Math.round(suggestedWholesale)}); setIsPriceAssistantOpen(false); showToast("Estrategia aplicada", "success"); }} className="flex-[2] py-5 rounded-[1.8rem] bg-[#004D4D] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#004D4D]/20 hover:bg-black transition-all">Aplicar Estrategia Dual</button></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isBaytReportOpen && (
                    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 md:p-12 text-slate-900">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsReportOpen(false)} 
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl text-slate-900" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }} 
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} 
                            transition={{ duration: 0.4 }}
                            className="relative bg-white/90 w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-2xl overflow-hidden border border-white flex flex-col text-slate-900"
                        >
                            <div className="p-10 bg-[#001A1A] text-white flex justify-between items-center shrink-0 text-white"><div className="flex items-center gap-6 text-white"><div className="h-16 w-16 rounded-3xl bg-[#4fffcb] flex items-center justify-center text-[#001A1A] shadow-[0_0_20px_rgba(79,255,203,0.4)]"><BarChart3 size={32} /></div><div><h3 className="text-3xl font-black italic uppercase tracking-tighter text-white text-white text-white">Sustentación <span className="text-[#4fffcb]">Estratégica</span></h3><p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1 text-white">Análisis Multi-Métrica Bayt AI</p></div></div><button onClick={() => setIsReportOpen(false)} className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors text-white"><X size={24} /></button></div>
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-white/50 backdrop-blur-md text-slate-900 text-slate-900 text-slate-900">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-slate-900 text-slate-900 text-slate-900">
                                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 text-slate-900 text-slate-900"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">🛡️ Auditoría de Gastos</h4><div className="space-y-4 text-slate-900 text-slate-900"><p className="text-sm font-medium text-slate-600 leading-relaxed text-slate-900">Bayt ha detectado un gasto operativo mensual de <span className="font-bold text-[#004D4D]">${totalFixedExpenses.toLocaleString()}</span>.</p><div className="h-2 bg-slate-100 rounded-full overflow-hidden flex"><div className="h-full bg-[#004D4D]" style={{ width: '60%' }} /><div className="h-full bg-cyan-400" style={{ width: '25%' }} /><div className="h-full bg-slate-200" style={{ width: '15%' }} /></div><p className="text-[9px] text-slate-400 font-bold uppercase">Distribución: 60% Nómina | 25% Infraestructura</p></div></div>
                                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 text-slate-900 text-slate-900"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">📈 Predicción de Demanda</h4><div className="space-y-4 text-slate-900 text-slate-900 text-slate-900"><div className="flex justify-between items-end text-slate-900 text-slate-900"><div className="text-slate-900"><span className="text-4xl font-black text-slate-900 text-slate-900">82%</span><p className="text-[9px] font-bold text-emerald-500 uppercase">Probabilidad de Éxito</p></div><div className="text-right text-slate-900"><span className="text-xl font-black text-slate-400">High</span></div></div><p className="text-[10px] text-slate-500 leading-relaxed font-medium italic text-slate-900">"Este mes la categoría <span className="font-bold">{formData.category}</span> presenta un pico histórico de búsquedas del 15% vs el año anterior."</p></div></div>
                                    <div className="bg-[#004D4D] p-8 rounded-[3rem] text-white space-y-6 relative overflow-hidden text-white"><Zap size={100} className="absolute -right-4 -bottom-4 text-white/5 text-white" /><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest text-white">Objetivo de Venta</h4><div className="space-y-2 text-white"><span className="text-5xl font-black italic text-white">{breakEvenUnits}</span><p className="text-xs font-bold uppercase tracking-widest opacity-60 leading-tight text-white">Unidades para cubrir el 100% de tus costos fijos mensuales.</p></div></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-slate-900 text-slate-900">
                                    <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><div className="flex items-center gap-4 text-slate-900"><div className="h-10 w-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 text-slate-900"><Smartphone size={20} /></div><h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 text-slate-900">Estrategia de Lanzamiento</h4></div><div className="space-y-6 text-slate-900"><div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-[#004D4D] text-slate-900"><p className="text-[11px] font-bold text-slate-700 leading-relaxed text-slate-900">"Recomendamos lanzar este producto bajo la categoría <span className="text-[#004D4D]">Lanzamientos VIP</span> durante las primeras 48h para aprovechar el tráfico actual."</p></div><div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-cyan-400 text-slate-900"><p className="text-[11px] font-bold text-slate-700 leading-relaxed text-slate-900 text-slate-900">"Ejecutar una campaña de WhatsApp Marketing a los <span className="text-cyan-600">452 clientes</span> que han buscado artículos similares."</p></div></div></section>
                                    <section className="bg-[#001A1A] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group text-white text-white"><div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700 text-white"><ShoppingBag size={140} className="text-[#4fffcb]" /></div><div className="relative z-10 space-y-8 text-white"><div className="flex items-center gap-4 text-white"><div className="h-10 w-10 rounded-2xl bg-[#4fffcb] flex items-center justify-center text-[#001A1A] text-white text-white text-white"><Star size={20} /></div><h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#4fffcb] text-white">Consejo Premium Bayt</h4></div><p className="text-sm font-medium text-white/80 leading-relaxed italic text-white text-white">"Tu margen retail del <span className="text-[#4fffcb] font-bold">{calcMargin}%</span> es competitivo. Sugerimos un <span className="text-[#4fffcb] font-bold">Bundle Pack</span> para subir el ticket promedio a $180.000."</p><div className="flex gap-3 text-white text-white"><button className="px-6 py-3 bg-[#4fffcb] text-[#001A1A] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all text-white text-white">Activar Campaña</button></div></div></section>
                                </div>
                            </div>
                            <div className="p-10 border-t border-slate-100 bg-white/80 flex justify-between items-center shrink-0 text-slate-900 text-slate-900"><div className="flex items-center gap-4 text-slate-900"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse text-slate-900 text-slate-900"></div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-900">Análisis Generado en tiempo real</p></div><button onClick={() => setIsReportOpen(false)} className="px-12 py-4 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#004D4D]/20 hover:bg-black transition-all">Cerrar y Aplicar Estrategia</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditorGuideOpen && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditorGuideOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row text-slate-900">
                            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto"><div className="mb-6"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Guía de Creación</h3><p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Maestría de Catálogo</p></div>{Object.entries(editorGuideContent).map(([key, item]) => (<button key={key} type="button" onClick={() => setActiveEditorGuideTab(key)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeEditorGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}><div className={`${activeEditorGuideTab === key ? 'text-white' : item.color}`}>{item.icon}</div><span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span></button>))}</div>
                            <div className="flex-1 flex flex-col overflow-hidden bg-white text-slate-900"><div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0"><div className="flex items-center gap-4"><div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].color}`}>{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].icon}</div><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].title}</h2></div><button type="button" onClick={() => setIsEditorGuideOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar text-slate-900"><section><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-900"><div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo configurar esto?</h4><p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].howItWorks}</p></section><div className="grid md:grid-cols-2 gap-8"><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Box size={14} className="text-blue-500"/> Recomendación</h4><div className="p-6 bg-blue-50/30 border border-blue-100 rounded-[2rem] text-slate-900"><p className="text-xs font-medium text-blue-900 leading-relaxed italic">"{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].example}"</p></div></section><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Bayup Pro-Tip</h4><div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem] text-slate-900"><p className="text-xs font-bold text-amber-900 leading-relaxed">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].tip}</p></div></section></div></div><div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30 text-slate-900"><button type="button" onClick={() => setIsEditorGuideOpen(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all">Entendido, continuar</button></div></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isNewCategoryModalOpen && (
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-white text-slate-900">
                            <div className="flex items-center gap-4 mb-8 text-slate-900 text-slate-900"><div className="h-12 w-12 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D]"><Layers size={24}/></div><div><h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Nueva Categoría</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Organiza tu inventario</p></div></div>
                            <div className="space-y-6 text-slate-900">
                                <div className="space-y-2 text-slate-900 text-slate-900"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-slate-900">Nombre de la Familia</label><input autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Accesorios Premium" className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all text-slate-900" /></div>
                                <div className="flex gap-3 pt-4 text-slate-900 text-slate-900"><button type="button" onClick={() => setIsNewCategoryModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button><button type="button" disabled={!newCategoryName.trim()} onClick={handleCreateCategory} className="flex-[2] py-4 bg-[#004D4D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#004D4D]/20 disabled:opacity-50">Crear Categoría</button></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL: DATOS INSUFICIENTES (MENTORÍA BAYT) --- */}
            <AnimatePresence>
                {isNoDataModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNoDataModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                            className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden border border-white flex flex-col text-slate-900"
                        >
                            <div className="p-12 text-center space-y-8">
                                <div className="flex justify-center">
                                    <div className="h-24 w-24 rounded-[2.5rem] bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D] relative">
                                        <Bot size={48} className="animate-bounce" />
                                        <div className="absolute -top-2 -right-2 h-8 w-8 bg-rose-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                            <AlertCircle size={16} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#001A1A]">Faltan <span className="text-rose-600">Datos Clave</span></h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-md mx-auto">
                                        Bayt necesita conocer el pulso real de tu empresa para darte una estrategia de precios infalible. Actualmente no encontramos registros financieros suficientes.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 text-left">
                                    {[
                                        { title: "Registra tus Gastos", desc: "Sube tu nómina, arriendo y servicios en el módulo de Tesorería.", icon: <ShieldCheck size={18}/> },
                                        { title: "Genera Movimientos", desc: "Realiza tus primeras ventas a través del módulo de Facturación.", icon: <ShoppingBag size={18}/> },
                                        { title: "Precisión de Costos", desc: "Asegúrate de que cada producto tenga su costo base de compra real.", icon: <DollarSign size={18}/> }
                                    ].map((step, i) => (
                                        <div key={i} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-5 group hover:bg-[#004D4D] transition-all duration-500">
                                            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-[#004D4D] shadow-sm group-hover:scale-110 transition-transform">
                                                {step.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#001A1A] group-hover:text-[#4fffcb] transition-colors">{step.title}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 group-hover:text-white/70 transition-colors uppercase mt-0.5">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 flex flex-col gap-4">
                                    <button 
                                        onClick={() => setIsNoDataModalOpen(false)}
                                        className="w-full py-5 bg-[#004D4D] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-[#004D4D]/20 hover:bg-black transition-all"
                                    >
                                        Entendido, voy a alimentar mis datos
                                    </button>
                                    <button 
                                        onClick={() => setIsNoDataModalOpen(false)}
                                        className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#001A1A] transition-colors"
                                    >
                                        Cerrar Advertencia
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
