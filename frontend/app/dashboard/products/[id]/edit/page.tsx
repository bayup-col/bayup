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
  Bot,
  FileText,
  ShoppingCart,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';
import { InteractiveUP } from '@/components/landing/InteractiveUP';

export default function EditProductPage() {
    const { token, userEmail } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const params = useParams();
    const productId = params.id;
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'variants'>('info');
    
    // Estados para Categorías y Guía
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    
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
        add_gateway_fee: false,
        image_url: [] as string[]
    });

    const [variants, setVariants] = useState<any[]>([]);
    const [media, setMedia] = useState<{file?: File, preview: string, type: 'image' | 'video', isMuted: boolean}[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

    // Estados Asistente de Precios
    const [isPriceAssistantOpen, setIsPriceAssistantOpen] = useState(false);
    const [isAnalyzingBayt, setIsAnalyzingBayt] = useState(false);
    const [assistantExpenses, setAssistantExpenses] = useState({ payroll: 0, rent: 0, utilities: 0, ops: 0 });
    const [calcQuantity, setCalcQuantity] = useState(1);
    const [calcMargin, setCalcMargin] = useState(30);
    const [calcWholesaleMargin, setCalcWholesaleMargin] = useState(15);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [platformCommission, setPlatformCommission] = useState(2.5);

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
                    const loadedImages = Array.isArray(productData.image_url) 
                        ? productData.image_url 
                        : (productData.image_url ? [productData.image_url] : []);

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
                        image_url: loadedImages
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

                    if (loadedImages.length > 0) {
                        setMedia(loadedImages.map((url: string) => ({ 
                            preview: url, 
                            type: url.toLowerCase().includes('.mp4') ? 'video' : 'image', 
                            isMuted: true 
                        })));
                    }
                }

                if (categories) setCategoriesList(categories);
                if (userData?.plan) setPlatformCommission(userData.plan.commission_rate * 100);

            } catch (err) {
                console.error("Error al cargar producto:", err);
                showToast("Error al sincronizar datos.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [token, productId, showToast]);

    // Helpers
    const formatValue = (val: number | string) => {
        const num = String(val).replace(/\D/g, "");
        return new Intl.NumberFormat("de-DE").format(Number(num));
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalAfterAdding = media.length + files.length;

        if (media.length >= 5) {
            showToast("Límite de 5 imágenes alcanzado (Plan Básico)", "info");
            return;
        }

        if (totalAfterAdding > 5) {
            showToast("Solo se añadirán las primeras 5 imágenes permitidas", "info");
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
                } else {
                    finalImageUrls.push(item.preview);
                }
            }

            await apiRequest(`/products/${productId}`, {
                method: 'PUT', token,
                body: JSON.stringify({ 
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
                        name: v.name || 'Estándar', 
                        sku: v.sku, 
                        stock: Number(v.stock) || 0, 
                        price_adjustment: Number(v.price_adjustment) || 0 
                    })) 
                })
            });
            showToast("Producto actualizado con éxito ✨", "success");
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
                showToast("Categoría creada", "success");
            }
        } catch (err) { showToast("Error", "error"); }
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

    if (isLoading) return <div className="p-20 text-center font-black uppercase text-[#004D4D] animate-pulse">Sincronizando Activo...</div>;

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden text-slate-900">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => router.back()} className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md border border-white/20 text-gray-500 hover:text-rose-500 shadow-lg"><X size={20} /></motion.button>

            <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Editar <span className="text-[#004D4D]">Producto</span></h2>
                    <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-full shadow-lg">
                        {(['info', 'financial', 'variants'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>{tab === 'info' ? 'Información' : tab === 'financial' ? 'Finanzas' : 'Variantes'}</button>
                        ))}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TÍTULO DEL PRODUCTO</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold shadow-inner" /></div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2 relative"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría</label><button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full p-5 bg-gray-50 rounded-2xl text-left text-sm font-bold shadow-inner flex items-center justify-between"><span className={formData.category ? "text-[#004D4D]" : "text-gray-300"}>{formData.category || "Seleccionar..."}</span><ChevronDown size={16} /></button>
                                        <AnimatePresence>{isCategoryOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border z-[110] p-2 text-slate-900">
                                            <div className="max-h-[200px] overflow-y-auto no-scrollbar">{categoriesList.map(cat => (<button key={cat.id} onClick={() => { setFormData({...formData, category: cat.title, collection_id: cat.id}); setIsCategoryOpen(false); }} className="w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50">{cat.title}</button>))}</div>
                                            <button type="button" onClick={() => setIsNewCategoryModalOpen(true)} className="w-full mt-2 py-3 bg-[#004D4D]/5 text-[#004D4D] rounded-xl text-[9px] font-black uppercase tracking-widest">+ Nueva Categoría</button>
                                        </motion.div>)}</AnimatePresence>
                                    </div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label><div className="flex bg-gray-50 p-1 rounded-2xl shadow-inner h-[60px]"><button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'active' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Activo</button><button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'draft' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Borrador</button></div></div>
                                </div>
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={5} className="w-full p-6 bg-gray-50 border border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-medium shadow-inner transition-all resize-none" /></div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between text-slate-900"><h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><ImageIcon size={18} /> Galería Multimedia</h3><span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg">Arrastra para ordenar</span></div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4 text-slate-900">
                                    {media.map((item, i) => (
                                        <Reorder.Item key={item.preview} value={item} whileDrag={{ scale: 1.05 }} className="group relative h-32 w-32 rounded-2xl overflow-hidden bg-gray-100 border shadow-sm cursor-grab active:cursor-grabbing">
                                            <img src={item.preview} className="w-full h-full object-cover pointer-events-none" alt="Preview" />
                                            {i === 0 && <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#4fffcb] text-[#004D4D] text-[7px] font-black uppercase rounded-md shadow-sm z-10">Principal</div>}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"><button type="button" onClick={() => setMedia(media.filter((_, idx) => idx !== i))} className="h-8 w-8 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg"><Trash2 size={14}/></button></div>
                                            <div className="absolute bottom-2 right-2 h-6 w-6 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white/60"><GripVertical size={12} /></div>
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (<label className="h-32 w-32 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-[#00F2FF]/30 cursor-pointer transition-all"><Plus size={16} className="text-gray-300"/><input type="file" className="hidden" multiple onChange={handleFileUpload} /></label>)}
                                </Reorder.Group>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'financial' && (
                        <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span><input type="text" value={formatValue(formData.cost)} onChange={e => setFormData({...formData, cost: Number(e.target.value.replace(/\D/g, ''))})} className="w-full pl-12 pr-6 py-5 bg-gray-50 rounded-2xl outline-none text-base font-black border border-transparent focus:border-[#004D4D]/20 focus:bg-white" /></div></div>
                                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4 text-emerald-800 text-[9px] font-medium leading-tight h-[110px] mt-6"><ShieldCheck size={16}/> ¿Cuánto te cuesta a ti el producto?</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Mayorista</label>
                                            <HelpCircle size={14} className="text-gray-300 cursor-help hover:text-[#004D4D]" onMouseEnter={() => setShowWholesaleTip(true)} onMouseLeave={() => setShowWholesaleTip(false)}/>
                                            {showWholesaleTip && <div className="absolute bg-gray-900 text-white text-[8px] p-2 rounded-lg z-50">¿En cuánto se lo venderás a un mayorista?</div>}
                                        </div>
                                        <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-600 font-black">$</span><input type="text" value={formatValue(formData.wholesale_price)} onChange={e => setFormData({...formData, wholesale_price: Number(e.target.value.replace(/\D/g, ''))})} className="w-full pl-12 pr-6 py-5 bg-cyan-50/30 rounded-2xl outline-none text-xl font-black text-cyan-700 border border-transparent" /></div>
                                    </div>
                                    <motion.div layout className="bg-[#004D4D] rounded-[2.5rem] p-8 text-white relative overflow-hidden h-[110px] mt-6 flex flex-col justify-center shadow-lg"><div className="absolute top-6 right-8 text-xl font-black">{marginWholesale.toFixed(1)}%</div><p className="text-[7px] font-black text-cyan-400 uppercase mb-1">Utilidad Mayorista</p><span className="text-2xl font-black leading-none">${Math.round(profitWholesale).toLocaleString('de-DE')}</span><div className="mt-2 text-[8px] font-bold text-cyan-300 uppercase">Comisión Bayup: -${Math.round(platformDeductionWholesale).toLocaleString()}</div></motion.div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Usuario Final</label>
                                            <HelpCircle size={14} className="text-gray-300 cursor-help hover:text-[#004D4D]" onMouseEnter={() => setShowRetailTip(true)} onMouseLeave={() => setShowRetailTip(false)}/>
                                            {showRetailTip && <div className="absolute bg-gray-900 text-white text-[8px] p-2 rounded-lg z-50">¿En cuánto se lo venderás a tus clientes en general?</div>}
                                        </div>
                                        <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004D4D] font-black">$</span><input type="text" value={formatValue(formData.price)} onChange={e => setFormData({...formData, price: Number(e.target.value.replace(/\D/g, ''))})} className="w-full pl-12 pr-6 py-5 bg-[#004D4D]/5 rounded-2xl outline-none text-2xl font-black text-[#004D4D]" /></div>
                                    </div>
                                    <motion.div layout className="bg-[#001A1A] rounded-[2.5rem] p-8 text-white relative overflow-hidden h-[110px] mt-6 flex flex-col justify-center shadow-2xl"><div className="absolute top-6 right-8 text-xl font-black">{marginUser.toFixed(1)}%</div><p className="text-[7px] font-black text-[#00F2FF] uppercase mb-1">Utilidad Final</p><span className="text-2xl font-black leading-none">${Math.round(profitUser).toLocaleString('de-DE')}</span><div className="mt-2 text-[8px] font-bold text-[#00F2FF] uppercase">Comisión Bayup: -${Math.round(platformDeductionUser).toLocaleString()}</div></motion.div>
                                </div>
                                <div className="pt-8 border-t border-gray-100 space-y-8">
                                    <label className="flex items-center gap-4 p-6 bg-gray-50 rounded-[2rem] cursor-pointer group relative isolate border border-transparent hover:border-[#004D4D]/10">
                                        <div className={`relative h-6 w-11 rounded-full flex items-center px-1 transition-colors ${formData.add_gateway_fee ? 'bg-[#004D4D]' : 'bg-gray-200'}`}><input type="checkbox" checked={formData.add_gateway_fee} onChange={e => setFormData({...formData, add_gateway_fee: e.target.checked})} className="hidden" /><motion.div animate={{ x: formData.add_gateway_fee ? 20 : 0 }} className="h-4 w-4 bg-white rounded-full shadow-sm" /></div>
                                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-[#004D4D]">Sumar costo de recaudo digital</span><span className="text-[8px] font-bold text-gray-400">Traslada el costo financiero al cliente</span></div>
                                        <HelpCircle size={14} className="text-gray-300 ml-auto cursor-help" onMouseEnter={() => setShowGatewayTip(true)} onMouseLeave={() => setShowGatewayTip(false)}/>
                                        {showGatewayTip && <div className="absolute right-0 bottom-full bg-gray-900 text-white text-[8px] p-3 rounded-lg z-50 w-64 uppercase leading-relaxed text-right mb-2">3.5% + $900 cobran los bancos. Si lo activas, el cliente lo paga.</div>}
                                    </label>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                            {Array.from(new Set(variants.map(v => v.name || 'Sin Atributo'))).map((groupName, groupIdx) => {
                                const groupVariants = variants.filter(v => (v.name || 'Sin Atributo') === groupName);
                                return (
                                    <div key={`family-${groupIdx}`} className="p-10 bg-gray-50 rounded-[3rem] border border-transparent hover:border-[#004D4D]/10 transition-all">
                                        <div className="flex gap-6 mb-4 px-2 text-slate-900"><div className="flex-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Atributo</label></div><div className="flex-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Especificación</label></div><div className="w-32 text-center"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock</label></div><div className="w-11"></div></div>
                                        <div className="space-y-4">
                                            {groupVariants.map((variant) => (
                                                <div key={variant.id} className="flex gap-6 items-center group/row animate-in fade-in slide-in-from-top-2 duration-300 text-slate-900">
                                                    <div className="flex-1"><input value={variant.name} onChange={e => { const newName = e.target.value; const ids = groupVariants.map(gv => gv.id); setVariants(prev => prev.map(v => ids.includes(v.id) ? { ...v, name: newName } : v)); }} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-bold focus:border-[#00F2FF]/30 shadow-sm" /></div>
                                                    <div className="flex-1 relative flex items-center">
                                                        {variant.name.toLowerCase().includes('color') && (<div className="absolute left-3"><input type="color" value={resolveColor(variant.sku)} onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, sku: e.target.value } : v))} className="w-5 h-5 rounded-full border-none cursor-pointer bg-transparent" /></div>)}
                                                        <input value={variant.sku} onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, sku: e.target.value } : v))} className={`w-full bg-white border border-gray-100 rounded-xl py-3 outline-none text-xs font-bold ${variant.name.toLowerCase().includes('color') ? 'pl-10' : 'px-4'}`} />
                                                    </div>
                                                    <div className="w-32"><input type="number" value={variant.stock} onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, stock: Number(e.target.value) } : v))} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-black text-center shadow-sm" /></div>
                                                    <button onClick={() => setVariants(prev => prev.filter(v => v.id !== variant.id))} className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-rose-500 opacity-0 group-hover/row:opacity-100"><X size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => addSequentialVariant(variants.indexOf(groupVariants[groupVariants.length - 1]))} className="mt-6 text-[10px] font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3 transition-all"><Plus size={14} /> Agregar otra {groupName}</button>
                                    </div>
                                );
                            })}
                            <button onClick={() => setVariants([...variants, { id: Math.random().toString(36).substr(2, 9), name: '', sku: '', stock: 0, price_adjustment: 0 }])} className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[3rem] text-[10px] font-black text-gray-400 uppercase hover:text-[#004D4D] transition-all flex items-center justify-center gap-3 shadow-sm"><Plus size={16} /> Nueva Familia de Atributos</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20">
                    <button onClick={() => router.back()} className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 hover:text-[#004D4D]">Descartar</button>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => { setFormData({...formData, status: 'draft'}); handleSave(); }} className="px-10 py-5 bg-white border border-gray-100 text-[#004D4D] rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg transition-all">Guardar Borrador</button>
                        {activeTab !== 'variants' ? (
                            <button onClick={() => setActiveTab(activeTab === 'info' ? 'financial' : 'variants')} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">Siguiente</button>
                        ) : (
                            <button onClick={handleSave} disabled={isSubmitting} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">{isSubmitting ? 'Guardando...' : 'Confirmar Cambios'}</button>
                        )}
                    </div>
                </div>
            </div>

            {/* DERECHA: DIGITAL TWIN (SINCRONIZADO) */}
            <div className="flex-1 bg-gray-100 p-12 lg:p-20 flex items-center justify-center relative">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white relative group">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 z-20">
                        <div className="flex items-center gap-6"><div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg"><Box size={24} className="text-[#004D4D]" /></div><div><h4 className="text-xl font-black uppercase leading-none">Previsualización</h4><p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">Digital Twin del Producto</p></div></div>
                        <div className="text-right text-white"><InteractiveUP /></div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10 text-slate-900">
                        <div className="space-y-6">
                            <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center relative group/img">
                                {media.length > 0 ? <img src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" alt="Preview" /> : <ImageIcon size={40} className="text-gray-200" />}
                            </div>
                            {media.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                    {media.map((item, i) => (
                                        <button key={i} onClick={() => setSelectedPreviewIndex(i)} className={`h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedPreviewIndex === i ? 'border-[#004D4D]' : 'border-transparent opacity-60'}`}>
                                            <img src={item.preview} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-6 text-slate-900">
                            <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.category || 'Categoría'}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3></div><div className="text-right text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase">Precio</p><p className="text-2xl font-black text-[#004D4D] tracking-tighter">${formData.price.toLocaleString('de-DE')}</p></div></div>
                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 text-slate-900"><p className="text-xs text-gray-500 font-medium leading-relaxed italic">{formData.description || 'Sin descripción disponible...'}</p></div>
                            {variants.some(v => v.name && v.sku) && (
                                <div className="space-y-4 pt-4 border-t border-gray-50 text-slate-900 text-slate-900">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Variantes Configuradas</p>
                                    <div className="flex flex-wrap gap-2">{variants.filter(v => v.name && v.sku).map((v, i) => (<div key={i} className="px-3 py-1.5 bg-gray-50 rounded-lg border text-[10px] font-bold text-gray-600">{v.name}: {v.sku}</div>))}</div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50 text-slate-900"><div className="space-y-2 text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{formData.sku || 'PENDIENTE'}</p></div><div className="space-y-2 text-right text-slate-900"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
