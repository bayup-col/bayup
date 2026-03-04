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
    
    // Estados para Variantes Multinivel
    const [isNewVariantModalOpen, setIsNewVariantModalOpen] = useState(false);
    const [tempVariantName, setTempVariantName] = useState("");
    const [tempSubVariants, setTempSubVariants] = useState([{ id: '1', spec: '', stock: 0 }]);

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

    // Carga de Datos Inicial
    useEffect(() => {
        const fetchAllData = async () => {
            if (!token || !productId) return;
            try {
                const [productData, categories, userData] = await Promise.all([
                    apiRequest<any>(`/products/${productId}?t=${Date.now()}`, { token }),
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
                        price: Number(productData.price) || 0,
                        wholesale_price: Number(productData.wholesale_price) || 0,
                        cost: Number(productData.cost) || 0,
                        category: productData.category || productData.collection?.title || '',
                        collection_id: productData.collection_id || null,
                        sku: productData.sku || '',
                        status: productData.status || 'active',
                        add_gateway_fee: !!productData.add_gateway_fee,
                        image_url: loadedImages
                    });

                    if (productData.variants) {
                        setVariants(productData.variants.map((v: any) => ({
                            id: v.id,
                            name: v.name,
                            sku: v.sku || '',
                            stock: Number(v.stock) || 0
                        })));
                    }

                    if (loadedImages.length > 0) {
                        setMedia(loadedImages.map((url: string) => ({ 
                            preview: url, 
                            type: 'image', 
                            isMuted: true 
                        })));
                    }
                }
                if (categories) setCategoriesList(categories);
            } catch (err) {
                console.error("Error al cargar:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [token, productId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (media.length >= 5) return showToast("Límite de 5 imágenes", "info");
        const allowedFiles = files.slice(0, 5 - media.length);
        for (const file of allowedFiles) {
            setMedia(prev => [...prev, { 
                file, preview: URL.createObjectURL(file),
                type: 'image', isMuted: true
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
                    ...formData, 
                    image_url: finalImageUrls, 
                    variants: variants.map(v => ({ name: v.name, sku: v.sku, stock: Number(v.stock) })) 
                })
            });

            window.dispatchEvent(new CustomEvent('bayup_product_update'));
            showToast("Producto actualizado con éxito ✨", "success");
            router.push('/dashboard/products');
        } catch (err) { showToast("Error al guardar", "error"); } finally { setIsSubmitting(false); }
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
        if (newCombs.length === 0) return showToast("Añade especificaciones", "error");
        setVariants([...variants, ...newCombs]);
        setIsNewVariantModalOpen(false);
        setTempVariantName("");
        setTempSubVariants([{ id: '1', spec: '', stock: 0 }]);
    };

    if (isLoading) return <div className="p-20 text-center font-black uppercase text-[#004D4D] animate-pulse">Sincronizando...</div>;

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden text-slate-900 font-sans">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => router.back()} className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md text-gray-500 hover:text-rose-500 shadow-lg"><X size={20} /></motion.button>

            <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Editar <span className="text-[#004D4D]">Producto</span></h2>
                    <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-full shadow-lg">
                        {(['info', 'financial', 'variants'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400 hover:text-[#004D4D]'}`}>{tab === 'info' ? 'Información' : tab === 'financial' ? 'Finanzas' : 'Variantes'}</button>
                        ))}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TÍTULO DEL PRODUCTO</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold shadow-inner" /></div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2 relative"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría</label><button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full p-5 bg-gray-50 rounded-2xl text-left text-sm font-bold shadow-inner flex items-center justify-between"><span>{formData.category || "Seleccionar..."}</span><ChevronDown size={16} /></button>
                                        <AnimatePresence>{isCategoryOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border z-[110] p-2">
                                            <div className="max-h-[200px] overflow-y-auto no-scrollbar">{categoriesList.map(cat => (<button key={cat.id} onClick={() => { setFormData({...formData, category: cat.title, collection_id: cat.id}); setIsCategoryOpen(false); }} className="w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50">{cat.title}</button>))}</div>
                                        </motion.div>)}</AnimatePresence>
                                    </div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label><div className="flex bg-gray-50 p-1 rounded-2xl h-[60px]"><button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'active' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Activo</button><button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'draft' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Borrador</button></div></div>
                                </div>
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={5} className="w-full p-6 bg-gray-50 rounded-[2.5rem] outline-none text-sm font-medium shadow-inner resize-none" /></div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between"><h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><ImageIcon size={18} /> Multimedia</h3></div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4">
                                    {media.map((item, i) => (
                                        <Reorder.Item key={item.preview} value={item} className="group relative h-32 w-32 rounded-2xl overflow-hidden bg-gray-100 border shadow-sm cursor-grab">
                                            <img src={item.preview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button type="button" onClick={() => setMedia(media.filter((_, idx) => idx !== i))} className="h-8 w-8 bg-rose-500 text-white rounded-xl flex items-center justify-center"><Trash2 size={14}/></button></div>
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (
                                        <label className="h-32 w-32 rounded-2xl border-2 border-dashed border-[#004D4D]/10 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#00F2FF]">
                                            <Plus size={20} className="text-gray-400"/>
                                            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                        </label>
                                    )}
                                </Reorder.Group>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 pb-20">
                            <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><Layers size={18} /> Atributos Maestro</h3>
                                </div>
                                <div className="space-y-6">
                                    {variants.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Sin atributos</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {variants.map((v, idx) => (
                                                <div key={v.id || idx} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl group relative">
                                                    <button onClick={() => setVariants(prev => prev.filter(item => item.id !== v.id))} className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-black text-[#004D4D] uppercase tracking-wider">{v.name}</h4>
                                                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-100 inline-block">Stock: {v.stock} uds</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={() => setIsNewVariantModalOpen(true)} className="w-full py-8 border-2 border-dashed border-gray-100 rounded-[3rem] text-[10px] font-black text-gray-400 uppercase hover:text-[#004D4D] hover:bg-gray-50 transition-all flex items-center justify-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center"><Plus size={20} className="text-[#004D4D]"/></div>
                                        Añadir Atributo / Variante
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 bg-[#004D4D] rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Package size={140} /></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="space-y-1">
                                        <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Inventario Consolidado</h4>
                                        <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-[0.3em] opacity-80">Suma total de unidades físicas</p>
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-md px-12 py-6 rounded-[2.5rem] border border-white/10 text-center min-w-[220px]">
                                        <span className="text-6xl font-black tracking-tighter">{variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)}</span>
                                        <p className="text-[11px] font-black uppercase mt-1 text-cyan-400 tracking-widest">Stock Total</p>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isNewVariantModalOpen && (
                                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 md:p-20">
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewVariantModalOpen(false)} className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" />
                                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col">
                                            <div className="bg-gray-50 p-12 border-b border-gray-100 flex justify-between items-center">
                                                <div className="space-y-1"><h3 className="text-2xl font-black italic tracking-tighter uppercase text-[#004D4D]">Personalizar Atributo</h3><p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Talla, color y stock juntos</p></div>
                                                <button onClick={() => setIsNewVariantModalOpen(false)}><X size={20}/></button>
                                            </div>
                                            <div className="p-12 space-y-10 overflow-y-auto max-h-[50vh] custom-scrollbar">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Nombre Atributo (Ej: Talla S)</label>
                                                    <input value={tempVariantName} onChange={(e) => setTempVariantName(e.target.value)} placeholder="Escribe el nombre..." className="w-full bg-gray-50 border-2 border-transparent focus:border-[#00F2FF]/30 rounded-3xl px-8 py-6 text-sm font-bold outline-none" />
                                                </div>
                                                <div className="space-y-6">
                                                    <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Especificaciones (Ej: Color Rojo...)</label>
                                                    <div className="space-y-4">
                                                        {tempSubVariants.map((sv) => (
                                                            <div key={sv.id} className="flex gap-4 items-center">
                                                                <input value={sv.spec} onChange={(e) => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, spec: e.target.value } : item))} placeholder="Especificación..." className="flex-1 bg-gray-50 rounded-2xl px-6 py-4 text-xs font-bold outline-none" />
                                                                <input type="number" value={sv.stock} onChange={(e) => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, stock: Number(e.target.value) } : item))} placeholder="0" className="w-24 bg-[#004D4D]/5 rounded-2xl px-4 py-4 text-center text-xs font-black text-[#004D4D]" />
                                                                <button onClick={() => setTempSubVariants(prev => prev.filter(item => item.id !== sv.id))}><Trash2 size={16}/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button onClick={handleAddTempSubVariant} className="text-[9px] font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Añadir Especificación</button>
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
                    <button onClick={handleSave} disabled={isSubmitting} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">{isSubmitting ? 'Guardando...' : 'Confirmar Cambios'}</button>
                </div>
            </div>

            {/* PREVISUALIZACIÓN DERECHA */}
            <div className="flex-1 bg-gray-100 p-12 lg:p-20 flex items-center justify-center relative">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center"><Box size={24} className="text-[#004D4D]" /></div>
                            <div>
                                <h4 className="text-xl font-black uppercase leading-none">Previsualización</h4>
                                <p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">RÉPLICA DIGITAL</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10">
                        <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                            {media.length > 0 ? <img src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-gray-200" />}
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.category || 'Categoría'}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3></div><div className="text-right"><p className="text-xl font-black text-[#004D4D]">${formData.price.toLocaleString('de-DE')}</p></div></div>
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50"><div className="space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{formData.sku || 'PENDIENTE'}</p></div><div className="space-y-2 text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
