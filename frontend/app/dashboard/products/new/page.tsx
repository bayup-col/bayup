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
  ChevronRight,
  Layers,
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
  Play
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
    
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    
    const [isEditorGuideOpen, setIsEditorGuideOpen] = useState(false);
    const [activeEditorGuideTab, setActiveEditorGuideTab] = useState('info');

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
        { name: 'Estándar', sku: '', stock: 0, price_adjustment: 0 }
    ]);

    const [media, setMedia] = useState<{file?: File, preview: string, type: 'image' | 'video', isMuted: boolean}[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewPreviewIndex] = useState(0);

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

    // Cálculos Duales
    const platformCommission = 2.5;
    
    // Usuario Final
    const gatewayFeeUser = formData.add_gateway_fee ? (formData.price * 0.035) : 0;
    const platformFeeUser = formData.price * (platformCommission / 100);
    const profitUser = formData.price - formData.cost - platformFeeUser - gatewayFeeUser;
    const marginUser = formData.price > 0 ? (profitUser / formData.price) * 100 : 0;

    // Mayorista
    const gatewayFeeWholesale = formData.add_gateway_fee ? (formData.wholesale_price * 0.035) : 0;
    const platformFeeWholesale = formData.wholesale_price * (platformCommission / 100);
    const profitWholesale = formData.wholesale_price - formData.cost - platformFeeWholesale - gatewayFeeWholesale;
    const marginWholesale = formData.wholesale_price > 0 ? (profitWholesale / formData.wholesale_price) * 100 : 0;

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
                method: 'POST',
                token,
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
                method: 'POST',
                token,
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
        info: { title: 'Información General', icon: <Info size={20}/>, color: 'text-blue-500', howItWorks: 'Define identidad visual y textual.', example: 'Título: "Zapatillas Urbanas".', tip: 'Usa palabras clave SEO.' },
        financial: { title: 'Finanzas y PVP', icon: <DollarSign size={20}/>, color: 'text-emerald-600', howItWorks: 'Calcula utilidad real automáticamente.', example: 'Costo $100, Venta $200.', tip: 'Activa pasarela para fee extra.' },
        variants: { title: 'Variantes y Stock', icon: <Layers size={20}/>, color: 'text-cyan-600', howItWorks: 'Gestiona tallas, colores y SKUs.', example: 'Variante "Azul / L".', tip: 'Asigna SKU único siempre.' }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden font-sans text-slate-900">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => router.back()} className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md border border-white/20 text-gray-500 hover:text-rose-500 shadow-lg">
                <X size={20} />
            </motion.button>

            <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8 text-slate-900">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FF] animate-pulse"></span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Editor de Catálogo</span>
                        </div>
                        <h2 className="text-4xl font-black italic uppercase text-[#001A1A] tracking-tighter">
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
                                <div className="space-y-6 text-slate-900">
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
                                                            <div className="p-2 bg-slate-50 border-t border-slate-100"><button type="button" onClick={() => { setIsNewCategoryModalOpen(true); setIsCategoryOpen(false); }} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all shadow-sm"><Plus size={14}/> Crear Nueva</button></div>
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
                                    <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg">Arrastra para ordenar</span>
                                </div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4">
                                    {media.map((item, i) => (
                                        <Reorder.Item key={item.preview} value={item} whileDrag={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }} className="group relative h-32 w-32 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing">
                                            {item.type === 'video' ? (<video src={item.preview} className="w-full h-full object-cover pointer-events-none" muted loop autoPlay playsInline />) : (<img src={item.preview} alt="Preview" className="w-full h-full object-cover pointer-events-none" />)}
                                            {i === 0 && (<div className="absolute top-2 left-2 px-2 py-0.5 bg-[#4fffcb] text-[#004D4D] text-[7px] font-black uppercase rounded-md shadow-sm z-10">Principal</div>)}
                                            {item.type === 'video' && item.isMuted && (<div className="absolute top-2 right-2 h-5 w-5 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center text-white z-10"><VolumeX size={10} /></div>)}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                                                {item.type === 'video' && (<button type="button" onClick={(e) => { e.stopPropagation(); toggleMute(i); }} className="h-8 w-8 bg-white/20 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-[#00F2FF] hover:text-[#004D4D] transition-all">{item.isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}</button>)}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setMedia(media.filter((_, idx) => idx !== i)); }} className="h-8 w-8 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"><Trash2 size={14}/></button>
                                            </div>
                                            <div className="absolute bottom-2 right-2 h-6 w-6 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white/60 opacity-0 group-hover:opacity-100 transition-opacity"><GripVertical size={12} /></div>
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (<label className="h-32 w-32 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-[#00F2FF]/30 hover:bg-[#00F2FF]/5 cursor-pointer transition-all group"><div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center text-gray-300 group-hover:text-[#00F2FF] shadow-sm"><Plus size={16}/></div><span className="text-[8px] font-black uppercase text-gray-300">Añadir</span><input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} /></label>)}
                                </Reorder.Group>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'financial' && (
                        <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                {/* BLOQUE 1: COSTO BASE */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo del Producto</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span>
                                            <input type="text" value={formatValue(formData.cost)} onChange={e => setFormData({...formData, cost: parseValue(e.target.value)})} placeholder="0" className="w-full pl-12 pr-6 py-5 bg-gray-50 rounded-2xl outline-none text-base font-black border border-transparent focus:border-[#004D4D]/20 focus:bg-white shadow-inner transition-all text-slate-900" />
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4 h-[110px] mt-6">
                                        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><ShieldCheck size={16} /></div>
                                        <p className="text-[9px] font-medium text-emerald-800 leading-tight">Valor base de inversión para cálculo de márgenes y utilidad neta.</p>
                                    </div>
                                </div>

                                {/* BLOQUE 2: MAYORISTA */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Mayorista</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-600 font-black">$</span>
                                            <input type="text" value={formatValue(formData.wholesale_price)} onChange={e => setFormData({...formData, wholesale_price: parseValue(e.target.value)})} placeholder="0" className="w-full pl-12 pr-6 py-5 bg-cyan-50/30 rounded-2xl outline-none text-xl font-black text-cyan-700 border border-transparent focus:border-cyan-200 focus:bg-white shadow-inner transition-all" />
                                        </div>
                                    </div>
                                    <motion.div layout className="bg-[#004D4D] rounded-[2.5rem] p-8 text-white relative overflow-hidden group h-[110px] mt-6 flex flex-col justify-center border border-white/5">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="absolute top-6 right-8"><span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{marginWholesale.toFixed(1)}%</span></div>
                                        <div className="relative z-10">
                                            <p className="text-[7px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">Utilidad Mayorista</p>
                                            <div className="flex flex-col">
                                                <span className={`text-2xl font-black italic leading-none ${profitWholesale > 0 ? 'text-[#4fffcb]' : 'text-rose-400'}`}>${profitWholesale.toLocaleString('de-DE')}</span>
                                                <div className="mt-2 flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-cyan-400"></div><span className="text-[8px] font-bold text-cyan-300 uppercase tracking-widest">Retención: -${(platformFeeWholesale + gatewayFeeWholesale).toFixed(0)}</span></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* BLOQUE 3: USUARIO FINAL */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Usuario Final</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004D4D] font-black">$</span>
                                            <input type="text" value={formatValue(formData.price)} onChange={e => setFormData({...formData, price: parseValue(e.target.value)})} placeholder="0" className="w-full pl-12 pr-6 py-5 bg-[#004D4D]/5 rounded-2xl outline-none text-2xl font-black text-[#004D4D] border border-transparent focus:border-[#004D4D]/20 focus:bg-white shadow-inner transition-all text-slate-900" />
                                        </div>
                                    </div>
                                    <motion.div layout className="bg-[#001A1A] rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-white/5 shadow-2xl h-[110px] mt-6 flex flex-col justify-center">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F2FF]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="absolute top-6 right-8"><span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{marginUser.toFixed(1)}%</span></div>
                                        <div className="relative z-10">
                                            <p className="text-[7px] font-black text-[#00F2FF] uppercase tracking-[0.2em] mb-1">Utilidad Retail</p>
                                            <div className="flex flex-col">
                                                <span className={`text-2xl font-black italic leading-none ${profitUser > 0 ? 'text-[#4fffcb]' : 'text-rose-400'}`}>${profitUser.toLocaleString('de-DE')}</span>
                                                <div className="mt-2 flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-[#00F2FF]"></div><span className="text-[8px] font-bold text-[#00F2FF] uppercase tracking-widest">Retención: -${(platformFeeUser + gatewayFeeUser).toFixed(0)}</span></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#00F2FF]/30 cursor-pointer transition-all group">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={formData.add_gateway_fee} onChange={e => setFormData({...formData, add_gateway_fee: e.target.checked})} className="sr-only peer" />
                                                <div className="w-8 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#00F2FF] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-3"></div>
                                            </div>
                                            <p className="text-[9px] font-black uppercase text-[#004D4D]">Comisión Pasarela (3.5%)</p>
                                        </label>
                                        <div className="p-6 bg-[#004D4D]/5 rounded-[2rem] border border-dashed border-[#004D4D]/20 flex items-center justify-between gap-4">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-[#004D4D] uppercase tracking-wide">¿No sabes en cuánto vender?</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase">Te ayudamos a calcularlo.</p>
                                            </div>
                                            <button type="button" onClick={() => showToast("Calculador inteligente", "info")} className="px-6 py-3 bg-[#004D4D] text-[#4fffcb] rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-md text-slate-900">Calcular Valor</button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center px-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest"><span>Bayup Fee</span><span>2.5%</span></div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-[#004D4D] uppercase border-t border-slate-100 pt-3"><span>Soporte Financiero</span><ShieldCheck size={16} className="text-emerald-500 opacity-20" /></div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 text-slate-900">
                                <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                    <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><Layers size={18} /> Gestión de Variantes</h3>
                                    <button type="button" onClick={() => setVariants([...variants, { name: '', sku: '', stock: 0, price_adjustment: 0 }])} className="bg-[#004D4D]/5 hover:bg-[#004D4D] hover:text-white text-[#004D4D] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
                                        <Plus size={14} /> Añadir Variante
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {variants.map((variant, index) => (
                                        <div key={index} className="p-8 bg-gray-50 rounded-[2.5rem] border border-transparent hover:border-[#004D4D]/10 transition-all flex flex-wrap md:flex-nowrap gap-6 items-end group relative text-slate-900">
                                            <div className="flex-1 min-w-[180px] space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre (Color/Talla)</label>
                                                <input value={variant.name} onChange={e => { const v = [...variants]; v[index].name = e.target.value; setVariants(v); }} placeholder="Ej: Azul / XL" className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-bold transition-all focus:border-[#00F2FF]/30 text-slate-900" />
                                            </div>
                                            <div className="w-40 space-y-2 text-slate-900">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU Específico</label>
                                                <input value={variant.sku} onChange={e => { const v = [...variants]; v[index].sku = e.target.value; setVariants(v); }} placeholder="SKU-001" className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-bold transition-all focus:border-[#00F2FF]/30 uppercase text-slate-900" />
                                            </div>
                                            <div className="w-32 space-y-2 text-slate-900">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock</label>
                                                <input type="number" value={variant.stock} onChange={e => { const v = [...variants]; v[index].stock = Number(e.target.value); setVariants(v); }} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-black transition-all focus:border-[#00F2FF]/30 text-slate-900" />
                                            </div>
                                            {variants.length > 1 && (<button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== index))} className="h-11 w-11 flex items-center justify-center bg-white border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>)}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20">
                    <button type="button" onClick={() => router.back()} className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#004D4D] transition-colors">Descartar</button>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => { setFormData({...formData, status: 'draft'}); handleSave(); }} className="px-10 py-5 bg-white border border-gray-100 text-[#004D4D] rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg transition-all">Guardar Borrador</button>
                        {activeTab !== 'variants' ? (
                            <button type="button" onClick={() => setActiveTab(activeTab === 'info' ? 'financial' : 'variants')} disabled={!formData.name} className={`px-14 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all ${!formData.name ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#004D4D] text-white hover:bg-black shadow-[#004D4D]/20'}`}>Siguiente</button>
                        ) : (
                            <button type="button" onClick={handleSave} disabled={isSubmitting || !formData.name} className={`px-14 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all ${isSubmitting || !formData.name ? 'bg-gray-200 text-gray-400' : 'bg-[#004D4D] text-white hover:bg-black shadow-[#004D4D]/20'}`}>{isSubmitting ? 'Procesando...' : 'Publicar Catálogo'}</button>
                        )}
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full lg:w-[45%] h-full bg-[#E5E7EB] p-12 lg:p-20 flex items-center justify-center relative">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white relative group text-slate-900">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 z-20">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg"><Box size={24} className="text-[#004D4D]" /></div>
                            <div><h4 className="text-xl font-black uppercase leading-none text-white">Previsualización</h4><p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">Digital Twin del Producto</p></div>
                        </div>
                        <div className="text-right"><div className="text-xl font-black text-white italic flex items-center opacity-20"><span>BAY</span><InteractiveUP /></div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10">
                        <div className="space-y-6">
                            <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center relative group/img">
                                <AnimatePresence mode="popLayout">
                                    {media.length > 0 ? (
                                        media[selectedPreviewIndex]?.type === 'video' ? (<motion.video key={media[selectedPreviewIndex]?.preview} layoutId={`media-${media[selectedPreviewIndex]?.preview}`} src={media[selectedPreviewIndex]?.preview} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} className="w-full h-full object-cover" autoPlay muted loop playsInline />) : (<motion.img key={media[selectedPreviewIndex]?.preview} layoutId={`media-${media[selectedPreviewIndex]?.preview}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" alt="Preview" />)
                                    ) : (<ImageIcon size={40} className="text-gray-200" />)}
                                </AnimatePresence>
                                <div className="absolute top-6 right-6 h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg text-[#004D4D]"><Star size={18} fill="#004D4D" /></div>
                            </div>
                            {media.length > 1 && (
                                <motion.div layout className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                    <AnimatePresence mode="popLayout">
                                        {media.map((item, i) => {
                                            if (i === selectedPreviewIndex) return null;
                                            return (
                                                <motion.button key={item.preview} layoutId={`media-${item.preview}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={() => setSelectedPreviewPreviewIndex(i)} className="h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm opacity-60 hover:opacity-100 transition-opacity relative group/thumb">
                                                    {item.type === 'video' ? (<><video src={item.preview} className="w-full h-full object-cover" muted loop autoPlay playsInline /><div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white shadow-inner"><Play size={12} fill="white" /></div></>) : (<img src={item.preview} className="w-full h-full object-cover" alt={`Thumb ${i}`} />)}
                                                </motion.button>
                                            );
                                        })}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>
                        <div className="space-y-6 text-slate-900">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.category}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3></div>
                                <div className="text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Precio PVP</p><p className="text-2xl font-black text-[#004D4D] tracking-tighter">${formData.price.toLocaleString('de-DE')}</p></div>
                            </div>
                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100"><p className="text-xs text-gray-500 font-medium leading-relaxed italic">{formData.description || 'Sin descripción disponible...'}</p></div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><Hash size={14} className="text-[#00F2FF]" /> {formData.sku || 'PENDIENTE'}</p></div>
                                <div className="space-y-2 text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="p-10 pt-0 bg-white"><div className="bg-[#004D4D]/5 p-6 rounded-[2rem] border border-[#004D4D]/10 flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-10 w-10 bg-[#004D4D] rounded-xl flex items-center justify-center text-white shadow-lg"><ShoppingBag size={18} /></div><span className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Vista Tienda Online</span></div><ArrowUpRight size={18} className="text-[#004D4D]/30" /></div></div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isEditorGuideOpen && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditorGuideOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row text-slate-900">
                            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto"><div className="mb-6"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Guía de Creación</h3><p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Maestría de Catálogo</p></div>{Object.entries(editorGuideContent).map(([key, item]) => (<button key={key} type="button" onClick={() => setActiveEditorGuideTab(key)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeEditorGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}><div className={`${activeEditorGuideTab === key ? 'text-white' : item.color}`}>{item.icon}</div><span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span></button>))}</div>
                            <div className="flex-1 flex flex-col overflow-hidden bg-white"><div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0"><div className="flex items-center gap-4"><div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].color}`}>{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].icon}</div><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].title}</h2></div><button type="button" onClick={() => setIsEditorGuideOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar"><section><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-900"><div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo configurar esto?</h4><p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].howItWorks}</p></section><div className="grid md:grid-cols-2 gap-8"><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Box size={14} className="text-blue-500"/> Recomendación</h4><div className="p-6 bg-blue-50/30 border border-blue-100 rounded-[2rem]"><p className="text-xs font-medium text-blue-900 leading-relaxed italic">"{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].example}"</p></div></section><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Bayup Pro-Tip</h4><div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]"><p className="text-xs font-bold text-amber-900 leading-relaxed">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].tip}</p></div></section></div></div><div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30"><button type="button" onClick={() => setIsEditorGuideOpen(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all">Entendido, continuar</button></div></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isNewCategoryModalOpen && (
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-white text-slate-900">
                            <div className="flex items-center gap-4 mb-8 text-slate-900"><div className="h-12 w-12 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D]"><Layers size={24}/></div><div><h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Nueva Categoría</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Organiza tu inventario</p></div></div>
                            <div className="space-y-6">
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de la Familia</label><input autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Accesorios Premium" className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all text-slate-900" /></div>
                                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsNewCategoryModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button><button type="button" disabled={!newCategoryName.trim()} onClick={handleCreateCategory} className="flex-[2] py-4 bg-[#004D4D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#004D4D]/20 disabled:opacity-50">Crear Categoría</button></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
