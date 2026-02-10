"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditProductPage() {
    const { token, userEmail, logout } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const params = useParams();
    const productId = params.id;
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'variants'>('info');
    
    // Estados del Formulario
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
        add_gateway_fee: false,
        image_url: ''
    });

    const [variants, setVariants] = useState<any[]>([]);
    const [media, setMedia] = useState<{file?: File, preview: string, type: 'image' | 'video', isMuted: boolean}[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewPreviewIndex] = useState(0);
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

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
    const [platformCommission, setPlatformCommission] = useState(2.5);

    // Mapeo de colores
    const colorMap: { [key: string]: string } = {
        'rojo': '#FF0000', 'red': '#FF0000', 'azul': '#0000FF', 'blue': '#0000FF',
        'verde': '#008000', 'green': '#008000', 'negro': '#000000', 'black': '#000000',
        'blanco': '#FFFFFF', 'white': '#FFFFFF', 'amarillo': '#FFFF00', 'yellow': '#FFFFFF',
        'gris': '#808080', 'gray': '#808080', 'naranja': '#FFA500', 'orange': '#FFA500',
        'morado': '#800080', 'purple': '#800080', 'rosa': '#FFC0CB', 'pink': '#FFC0CB',
        'cian': '#00FFFF', 'cyan': '#00F2FF'
    };

    const resolveColor = (val: string) => {
        const lower = val?.toLowerCase().trim() || "";
        if (colorMap[lower]) return colorMap[lower];
        if (/^#[0-9A-F]{6}$/i.test(lower)) return lower;
        return '#000000';
    };

    // Carga de Datos Inicial
    useEffect(() => {
        const fetchAllData = async () => {
            if (!token || !productId) return;
            try {
                const [productData, categories, userData] = await Promise.all([
                    apiRequest<any>(`/products/${productId}`, { token }),
                    apiRequest<any[]>('/collections', { token }),
                    apiRequest<any>('/auth/me', { token })
                ]);

                if (productData) {
                    setFormData({
                        name: productData.name || '',
                        description: productData.description || '',
                        price: productData.price || 0,
                        wholesale_price: productData.wholesale_price || 0,
                        cost: productData.cost || 0,
                        category: productData.collection?.title || '',
                        collection_id: productData.collection_id || null,
                        sku: productData.sku || '',
                        status: productData.status || 'active',
                        add_gateway_fee: !!productData.add_gateway_fee,
                        image_url: productData.image_url || ''
                    });

                    if (productData.variants && productData.variants.length > 0) {
                        setVariants(productData.variants.map((v: any) => ({
                            id: v.id || Math.random().toString(36).substr(2, 9),
                            name: v.name,
                            sku: v.sku,
                            stock: v.stock,
                            price_adjustment: v.price_adjustment || 0
                        })));
                    } else {
                        setVariants([{ id: Math.random().toString(36).substr(2, 9), name: 'Estándar', sku: '', stock: 0 }]);
                    }

                    // Blindaje Multimedia: Solo cargar si es una URL real
                    if (productData.image_url && productData.image_url.startsWith('http')) {
                        setMedia([{ preview: productData.image_url, type: 'image', isMuted: true }]);
                    }
                }

                if (categories) setCategoriesList(categories);
                if (userData?.plan) setPlatformCommission(userData.plan.commission_rate * 100);

            } catch (err: any) {
                console.error("Error al cargar producto:", err);
                if (err.message.includes('404')) {
                    showToast("El producto solicitado ya no existe.", "error");
                    router.push('/dashboard/products');
                } else {
                    showToast("Error al sincronizar datos.", "error");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [token, productId]);

    // Helpers
    const formatValue = (val: number | string) => {
        if (val === undefined || val === null || val === "") return "";
        const num = String(val).replace(/\D/g, "");
        return new Intl.NumberFormat("de-DE").format(Number(num));
    };

    const parseValue = (val: string) => {
        const cleaned = String(val).replace(/\./g, "");
        return cleaned === "" ? 0 : Number(cleaned);
    };

    const getNextVariantValue = (currentValue: string) => {
        const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        const currentSize = currentValue?.toUpperCase() || "";
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

    // Lógica Financiera
    const currentGatewayRate = formData.add_gateway_fee ? 0.035 : 0;
    const totalFixedExpenses = assistantExpenses.payroll + assistantExpenses.rent + assistantExpenses.utilities + assistantExpenses.ops;
    const expensePerUnit = calcQuantity > 0 ? totalFixedExpenses / calcQuantity : 0;
    const totalUnitCost = formData.cost + expensePerUnit;
    const suggestedPrice = totalUnitCost / (1 - (calcMargin / 100) - (platformCommission / 100) - currentGatewayRate);
    const profitPerUnit = suggestedPrice - totalUnitCost - (suggestedPrice * (platformCommission / 100)) - (suggestedPrice * currentGatewayRate);
    
    const activeExpenseDeduction = hasAnalyzed ? expensePerUnit : 0;
    const profitUser = formData.price - formData.cost - activeExpenseDeduction - (formData.price * (platformCommission / 100)) - (formData.add_gateway_fee ? formData.price * 0.035 : 0);
    const marginUser = formData.price > 0 ? (profitUser / formData.price) * 100 : 0;
    const profitWholesale = formData.wholesale_price - formData.cost - activeExpenseDeduction - (formData.wholesale_price * (platformCommission / 100)) - (formData.add_gateway_fee ? formData.wholesale_price * 0.035 : 0);
    const marginWholesale = formData.wholesale_price > 0 ? (profitWholesale / formData.wholesale_price) * 100 : 0;

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
            if (orders && orders.length > 0) {
                const totalSales = orders.reduce((acc, order) => acc + (order.total_price || 0), 0);
                setAvgTicket(totalSales / orders.length);
            }
            setAssistantExpenses(totals);
            showToast("Auditoría completada", "success");
            setHasAnalyzed(true);
        } catch (err) { setIsNoDataModalOpen(true); } finally { setIsAnalyzingBayt(false); }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return showToast("Nombre obligatorio", "error");
        if (formData.cost <= 0) return showToast("Costo debe ser > 0", "error");
        
        setIsSubmitting(true);
        try {
            let finalImageUrl = formData.image_url;

            if (media.length > 0 && media[0].file) {
                try {
                    const file = media[0].file;
                    const uploadData = await apiRequest<any>(`/products/upload-url?file_type=${file.type}`, { method: 'POST', token });
                    if (uploadData && uploadData.upload_url) {
                        await fetch(uploadData.upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
                        finalImageUrl = uploadData.file_url;
                    }
                } catch (uErr) { console.warn("Fallo subida imagen", uErr); }
            }

            await apiRequest(`/products/${productId}`, {
                method: 'PUT', token,
                body: JSON.stringify({ 
                    ...formData, 
                    image_url: finalImageUrl,
                    variants: variants.map(v => ({ name: v.name, sku: v.sku, stock: v.stock })) 
                })
            });
            showToast("Cambios guardados con éxito", "success");
            router.push('/dashboard/products');
        } catch (err) { showToast("Error al guardar", "error"); } finally { setIsSubmitting(false); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (media.length + files.length > 5) return showToast("Máximo 5 archivos", "info");
        const newMedia = files.map(f => ({ 
            file: f, preview: URL.createObjectURL(f),
            type: f.type.startsWith('video') ? 'video' as const : 'image' as const, isMuted: true
        }));
        setMedia([...media, ...newMedia]);
    };

    if (isLoading) return (
        <div className="fixed inset-0 bg-white flex flex-col justify-center items-center z-[1100] gap-6 text-slate-900">
            <div className="relative h-16 w-16">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#00F2FF]/20"></div>
                <div className="relative animate-spin rounded-full h-16 w-16 border-b-2 border-[#004D4D]"></div>
            </div>
            <span className="text-[11px] font-black text-[#004D4D]/40 uppercase tracking-[0.3em]">Sincronizando con base de datos...</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden font-sans text-slate-900">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => router.back()} className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md border border-white/20 text-gray-500 hover:text-rose-500 shadow-lg"><X size={20} /></motion.button>

            <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div><h2 className="text-4xl font-black italic uppercase text-[#001A1A] tracking-tighter">Editar <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Producto</span></h2></div>
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
                                <div className="space-y-6 text-slate-900">
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TITULO</label><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all text-slate-900" /></div>
                                    <div className="grid grid-cols-2 gap-8 text-slate-900 text-slate-900">
                                        <div className="space-y-2 relative text-slate-900"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría</label><button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl text-left text-sm font-bold shadow-inner flex items-center justify-between hover:bg-white hover:border-[#004D4D]/20 transition-all text-slate-900"><span className={formData.category ? "text-[#004D4D]" : "text-gray-300"}>{formData.category || "Seleccionar..."}</span><ChevronDown size={16} /></button>
                                            <AnimatePresence>{isCategoryOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[110] p-2 text-slate-900"><div className="max-h-[200px] overflow-y-auto custom-scrollbar">{categoriesList.map(cat => (<button key={cat.id} onClick={() => { setFormData({...formData, category: cat.title, collection_id: cat.id}); setIsCategoryOpen(false); }} className="w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50 transition-all">{cat.title}</button>))}</div></motion.div>)}</AnimatePresence>
                                        </div>
                                        <div className="space-y-2 text-slate-900"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label><div className="flex bg-gray-50 p-1 rounded-2xl shadow-inner h-14"><button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'active' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Activo</button><button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'draft' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Borrador</button></div></div>
                                    </div>
                                    <div className="space-y-2 text-slate-900 text-slate-900"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-slate-900">Descripción</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={5} className="w-full px-6 py-6 bg-gray-50 border border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-medium shadow-inner transition-all resize-none text-slate-900" /></div>
                                </div>
                            </section>
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 text-slate-900">
                                <div className="flex items-center justify-between text-slate-900"><h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><ImageIcon size={18} /> Galería Multimedia</h3></div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4 text-slate-900">
                                    {media.map((item, i) => (
                                        <Reorder.Item key={item.preview} value={item} className="group relative h-32 w-32 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing text-slate-900 text-slate-900 text-slate-900">
                                            {item.type === 'video' ? (<video src={item.preview} className="w-full h-full object-cover" muted loop autoPlay playsInline />) : (<img src={item.preview} alt="Preview" className="w-full h-full object-cover text-slate-900" />)}
                                            <button onClick={() => setMedia(media.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 h-8 w-8 bg-rose-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Trash2 size={14}/></button>
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (<label className="h-32 w-32 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-[#00F2FF]/30 cursor-pointer transition-all text-slate-900"><Plus size={16} className="text-gray-300"/><input type="file" className="hidden" multiple onChange={handleFileUpload} /></label>)}
                                </Reorder.Group>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'financial' && (
                        <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 text-slate-900">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 text-slate-900">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-slate-900">
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-slate-900">Costo</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span><input type="text" value={formatValue(formData.cost)} onChange={e => setFormData({...formData, cost: parseValue(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-gray-50 rounded-2xl outline-none text-base font-black border border-transparent focus:border-[#004D4D]/20 focus:bg-white text-slate-900" /></div></div>
                                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4 text-emerald-800 text-[9px] font-medium leading-tight h-[110px] mt-6 text-slate-900"><ShieldCheck size={16}/> Base de inversión real.</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-slate-900">
                                    <div className="space-y-2 text-slate-900"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-slate-900">Precio Mayorista</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-600 font-black">$</span><input type="text" value={formatValue(formData.wholesale_price)} onChange={e => setFormData({...formData, wholesale_price: parseValue(e.target.value)})} placeholder="0" className="w-full pl-12 pr-6 py-5 bg-cyan-50/30 rounded-2xl outline-none text-xl font-black text-cyan-700 border border-transparent focus:border-cyan-200 text-slate-900" /></div></div>
                                    <motion.div layout className="bg-[#004D4D] rounded-[2.5rem] p-8 text-white relative overflow-hidden h-[110px] mt-6 flex flex-col justify-center border border-white/5 shadow-lg"><div className="absolute top-6 right-8"><span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{marginWholesale.toFixed(1)}%</span></div><p className="text-[7px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">Utilidad Mayorista</p><span className="text-2xl font-black italic leading-none">${Math.round(profitWholesale).toLocaleString('de-DE')}</span><div className="mt-2 flex items-center gap-2 text-white"><div className="h-1 w-1 rounded-full bg-[#00F2FF] animate-pulse"></div><span className="text-[8px] font-bold text-cyan-300 uppercase tracking-widest text-white">Tarifas Bayup: -${Math.round(profitWholesale * (platformCommission/100)).toLocaleString()}</span></div></motion.div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-slate-900 text-slate-900">
                                    <div className="space-y-2 text-slate-900"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-slate-900">Precio Retail</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004D4D] font-black">$</span><input type="text" value={formatValue(formData.price)} onChange={e => setFormData({...formData, price: parseValue(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-[#004D4D]/5 rounded-2xl outline-none text-2xl font-black text-[#004D4D] border border-transparent focus:border-[#004D4D]/20 text-slate-900" /></div></div>
                                    <motion.div layout className="bg-[#001A1A] rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-white/5 shadow-2xl h-[110px] mt-6 flex flex-col justify-center text-white"><div className="absolute top-0 right-0 w-32 h-32 bg-[#00F2FF]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div><div className="absolute top-6 right-8"><span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{marginUser.toFixed(1)}%</span></div><div className="relative z-10 text-white"><p className="text-[7px] font-black text-[#00F2FF] uppercase tracking-[0.2em] mb-1">Utilidad Retail</p><span className={`text-2xl font-black italic leading-none ${profitUser > 0 ? 'text-[#4fffcb]' : 'text-rose-400'}`}>${Math.round(profitUser).toLocaleString('de-DE')}</span><div className="mt-2 flex items-center gap-2 text-white"><div className="h-1 w-1 rounded-full bg-[#00F2FF]"></div><span className="text-[8px] font-bold text-[#00F2FF] uppercase tracking-widest text-white">Tarifas Bayup: -${Math.round(profitUser * (platformCommission/100)).toLocaleString()}</span></div></div></motion.div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10 text-slate-900 text-slate-900">
                            {Array.from(new Set(variants.map(v => v.name || 'Sin Atributo'))).map((groupName, groupIdx) => {
                                const groupVariants = variants.filter(v => (v.name || 'Sin Atributo') === groupName);
                                return (
                                    <div key={`family-${groupIdx}`} className="p-10 bg-gray-50 rounded-[3rem] border border-transparent hover:border-[#004D4D]/10 transition-all text-slate-900">
                                        <div className="flex gap-6 mb-4 px-2 text-slate-900"><div className="flex-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Atributo</label></div><div className="flex-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Especificación</label></div><div className="w-32 text-center"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock</label></div><div className="w-11"></div></div>
                                        <div className="space-y-4 text-slate-900 text-slate-900">
                                            {groupVariants.map((variant) => (
                                                <div key={variant.id} className="flex gap-6 items-center group/row animate-in fade-in slide-in-from-top-2 duration-300 text-slate-900 text-slate-900">
                                                    <div className="flex-1"><input value={variant.name} onChange={e => { const newName = e.target.value; const ids = groupVariants.map(gv => gv.id); setVariants(prev => prev.map(v => ids.includes(v.id) ? { ...v, name: newName } : v)); }} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-bold text-slate-900 shadow-sm focus:border-[#00F2FF]/30" /></div>
                                                    <div className="flex-1 relative flex items-center">
                                                        {variant.name.toLowerCase().includes('color') && (<div className="absolute left-3"><input type="color" value={resolveColor(variant.sku)} onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, sku: e.target.value } : v))} className="w-5 h-5 rounded-full border-none cursor-pointer bg-transparent" /></div>)}
                                                        <input value={variant.sku} onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, sku: e.target.value } : v))} className={`w-full bg-white border border-gray-100 rounded-xl py-3 outline-none text-xs font-bold text-slate-900 ${variant.name.toLowerCase().includes('color') ? 'pl-10' : 'px-4'}`} />
                                                    </div>
                                                    <div className="w-32"><input type="text" value={formatValue(variant.stock)} onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, stock: parseValue(e.target.value) } : v))} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-black text-center text-slate-900 shadow-sm" /></div>
                                                    <button onClick={() => setVariants(prev => prev.filter(v => v.id !== variant.id))} className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-rose-500 opacity-0 group-hover/row:opacity-100"><X size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => addSequentialVariant(variants.indexOf(groupVariants[groupVariants.length - 1]))} className="mt-6 text-[10px] font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3 transition-all text-slate-900"><Plus size={14} /> Agregar otra {groupName}</button>
                                    </div>
                                );
                            })}
                            <button onClick={() => setVariants([...variants, { id: Math.random().toString(36).substr(2, 9), name: '', sku: '', stock: 0, price_adjustment: 0 }])} className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[3rem] text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-[#004D4D]/20 hover:text-[#004D4D] transition-all flex items-center justify-center gap-3 shadow-sm text-slate-900"><Plus size={16} /> Nueva Familia</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20 text-slate-900 text-slate-900">
                    <button onClick={() => router.back()} className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 hover:text-[#004D4D] transition-colors text-slate-900">Descartar</button>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => { setFormData({...formData, status: 'draft'}); handleSave(); }} className="px-10 py-5 bg-white border border-gray-100 text-[#004D4D] rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg transition-all">Guardar Borrador</button>
                        {activeTab !== 'variants' ? (<button onClick={() => setActiveTab(activeTab === 'info' ? 'financial' : 'variants')} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">Siguiente</button>) : (<button onClick={handleSave} disabled={isSubmitting} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">{isSubmitting ? 'Confirmando...' : 'Confirmar Cambios'}</button>)}
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full lg:w-[45%] h-full bg-[#E5E7EB] p-12 lg:p-20 flex items-center justify-center relative text-slate-900 text-slate-900">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white relative group text-slate-900">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 z-20">
                        <div className="flex items-center gap-6"><div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-slate-900"><Box size={24} className="text-[#004D4D]" /></div><div><h4 className="text-xl font-black uppercase leading-none">Previsualización</h4><p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">Digital Twin del Producto</p></div></div>
                        <div className="text-right text-white"><div className="text-xl font-black italic opacity-20 text-white"><span>BAY</span><InteractiveUP /></div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10 text-slate-900">
                        <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center relative group/img text-slate-900">
                            <AnimatePresence mode="popLayout">
                                {media.length > 0 ? (media[selectedPreviewIndex]?.type === 'video' ? (<motion.video key={media[selectedPreviewIndex]?.preview} src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" autoPlay muted loop playsInline initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} />) : (<motion.img key={media[selectedPreviewIndex]?.preview} src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" alt="Preview" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} />)) : (<ImageIcon size={40} className="text-gray-200" />)}
                            </AnimatePresence>
                        </div>
                        <div className="space-y-6 text-slate-900 text-slate-900">
                            <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.category}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3></div><div className="text-right text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase">Precio</p><p className="text-2xl font-black text-[#004D4D] tracking-tighter">${formData.price.toLocaleString('de-DE')}</p></div></div>
                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 text-slate-900"><p className="text-xs text-gray-500 font-medium leading-relaxed italic">{formData.description || 'Sin descripción disponible...'}</p></div>
                            {variants.some(v => v.name && v.sku) && (
                                <div className="space-y-4 pt-4 border-t border-gray-50 text-slate-900 text-slate-900">
                                    {Array.from(new Set(variants.filter(v => v.name && v.sku).map(v => v.name))).map(groupName => (
                                        <div key={groupName} className="space-y-2">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{groupName}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {variants.filter(v => v.name === groupName).map((v, i) => (
                                                    <div key={i} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 ${groupName.toLowerCase().includes('color') ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-transparent text-gray-600'}`}>
                                                        {groupName.toLowerCase().includes('color') && <div className="w-3 h-3 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: resolveColor(v.sku) }} />}
                                                        {v.sku}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50 text-slate-900 text-slate-900 text-slate-900"><div className="space-y-2 text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 text-slate-900"><Hash size={14} className="text-[#00F2FF]" /> {formData.sku || 'PENDIENTE'}</p></div><div className="space-y-2 text-right text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
