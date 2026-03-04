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

export default function EditProductPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const params = useParams();
    const productId = params.id;
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'variants'>('info');
    
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    
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
    const [media, setMedia] = useState<{file?: File, preview: string, type: 'image' | 'video'}[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

    const formatValue = (val: number | string) => {
        const num = String(val).replace(/\D/g, "");
        return new Intl.NumberFormat("de-DE").format(Number(num));
    };

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

    useEffect(() => {
        const fetchAllData = async () => {
            if (!token || !productId) return;
            try {
                const [productData, categories] = await Promise.all([
                    apiRequest<any>(`/products/${productId}?t=${Date.now()}`, { token }),
                    apiRequest<any[]>('/collections', { token })
                ]);

                if (productData) {
                    setFormData({
                        ...productData,
                        image_url: Array.isArray(productData.image_url) ? productData.image_url : [productData.image_url]
                    });
                    if (productData.variants) {
                        setVariants(productData.variants.map((v: any) => ({
                            id: v.id,
                            name: v.name,
                            sku: v.sku || '',
                            stock: Number(v.stock) || 0
                        })));
                    }
                    if (productData.image_url) {
                        const urls = Array.isArray(productData.image_url) ? productData.image_url : [productData.image_url];
                        setMedia(urls.map(url => ({ preview: url, type: 'image' })));
                    }
                }
                if (categories) setCategoriesList(categories);
            } catch (err) {} finally { setIsLoading(false); }
        };
        fetchAllData();
    }, [token, productId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (media.length >= 5) return showToast("Límite de 5 imágenes", "info");
        for (const file of files.slice(0, 5 - media.length)) {
            setMedia(prev => [...prev, { file, preview: URL.createObjectURL(file), type: 'image' }]);
        }
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const finalImageUrls: string[] = [];
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            for (const item of media) {
                if (item.file) {
                    const fd = new FormData(); fd.append('file', item.file);
                    const res = await fetch(`${apiUrl}/admin/upload-image`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
                    if (res.ok) { const d = await res.json(); finalImageUrls.push(d.url); }
                } else { finalImageUrls.push(item.preview); }
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
            showToast("Producto actualizado ✨", "success");
            router.push('/dashboard/products');
        } catch (err) {} finally { setIsSubmitting(false); }
    };

    const handleSaveMatrixAttributes = () => {
        if (!tempVariantName.trim()) return;
        const newCombs = tempSubVariants.filter(sv => sv.spec.trim() !== '').map(sv => ({ id: Math.random().toString(36).substr(2, 9), name: `${tempVariantName} / ${sv.spec}`, sku: '', stock: sv.stock }));
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
                <header className="flex flex-col md:flex-row items-center justify-between gap-8 text-slate-900">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Editar <span className="text-[#004D4D]">Producto</span></h2>
                    <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-full shadow-lg">
                        {(['info', 'financial', 'variants'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400 hover:text-[#004D4D]'}`}>{tab === 'info' ? 'Información' : tab === 'financial' ? 'Finanzas' : 'Variantes'}</button>
                        ))}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
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
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><ImageIcon size={18} /> Multimedia</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-8">Capacidad: <span className="text-[#004D4D]">{media.length} / 5</span> archivos</p>
                                    </div>
                                    <div className="px-4 py-2 bg-cyan-50 rounded-xl flex items-center gap-2"><Info size={12} className="text-cyan-600"/><span className="text-[8px] font-black text-cyan-700 uppercase tracking-widest">Plan Básico</span></div>
                                </div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4">
                                    {media.map((item, i) => (
                                        <Reorder.Item key={item.preview} value={item} className="group relative h-32 w-32 rounded-3xl overflow-hidden border-2 border-white shadow-xl cursor-grab">
                                            <img src={item.preview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button type="button" onClick={() => setMedia(media.filter((_, idx) => idx !== i))} className="h-8 w-8 bg-rose-500 text-white rounded-xl flex items-center justify-center"><Trash2 size={14}/></button></div>
                                            {i === 0 && <div className="absolute top-2 left-2 px-2 py-1 bg-[#00F2FF] text-[#004D4D] text-[7px] font-black uppercase rounded-lg shadow-lg">Principal</div>}
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (
                                        <label className="h-32 w-32 rounded-3xl border-2 border-dashed border-[#004D4D]/10 bg-gray-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#00F2FF] group transition-all">
                                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-all"><Plus size={20} className="text-[#004D4D]"/></div>
                                            <div className="text-center"><span className="text-[8px] font-black text-gray-400 uppercase block leading-none">Subir</span><span className="text-[7px] font-bold text-gray-300 uppercase mt-1">Máx. 5 archivos</span></div>
                                            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                        </label>
                                    )}
                                </Reorder.Group>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'financial' && (
                        <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><DollarSign size={18} /> Estructura de Precios</h3>
                                    <div className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-cyan-100"><Bot size={14}/> Análisis Bayt Activo</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">PRECIO RETAIL</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full pl-10 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-black shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">PRECIO MAYORISTA</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input type="number" value={formData.wholesale_price} onChange={e => setFormData({...formData, wholesale_price: Number(e.target.value)})} className="w-full pl-10 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-black shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">COSTO UNITARIO</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full pl-10 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-black shadow-inner" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-[#FAFAFA] rounded-3xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D]"><Zap size={18}/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Incluir comisión de pasarela</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Suma automáticamente el 3.5% + $900 al precio final</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setFormData({...formData, add_gateway_fee: !formData.add_gateway_fee})} className={`w-14 h-7 rounded-full transition-all relative ${formData.add_gateway_fee ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.add_gateway_fee ? 'left-8' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between text-slate-900"><p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Utilidad Retail Bruta</p></div>
                                    <div className="flex items-baseline gap-2"><span className="text-4xl font-black text-gray-900 tracking-tighter">${(formData.price - formData.cost).toLocaleString('de-DE')}</span><span className="text-[10px] font-black text-gray-400 uppercase">Bruto / UND</span></div>
                                </div>
                                <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between text-slate-900"><p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Utilidad Mayorista Bruta</p></div>
                                    <div className="flex items-baseline gap-2"><span className="text-4xl font-black text-gray-900 tracking-tighter">${(formData.wholesale_price - formData.cost).toLocaleString('de-DE')}</span><span className="text-[10px] font-black text-gray-400 uppercase">Bruto / UND</span></div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 pb-20">
                            <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-8 text-slate-900">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><Layers size={18} /> Atributos Maestro</h3>
                                    <div className="px-4 py-2 bg-purple-50 rounded-xl text-[9px] font-black text-purple-600 uppercase tracking-widest animate-pulse">Multinivel</div>
                                </div>
                                <div className="space-y-6">
                                    {variants.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Sin atributos</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-900">
                                            {Array.from(new Set(variants.map(v => v.name.split('/')[0].trim()))).map((masterName, mIdx) => {
                                                const groupVariants = variants.filter(v => v.name.startsWith(masterName));
                                                return (
                                                    <div key={mIdx} className="p-10 bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl group relative overflow-hidden flex flex-col text-slate-900">
                                                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setVariants(prev => prev.filter(v => !v.name.startsWith(masterName)))} className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button></div>
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-4 text-slate-900">
                                                                <div className="h-12 w-12 rounded-[1.2rem] bg-[#004D4D] flex items-center justify-center text-white font-black text-xs shadow-lg">{mIdx + 1}</div>
                                                                <h4 className="text-lg font-black text-[#004D4D] italic uppercase tracking-tighter">{masterName}</h4>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Especificaciones:</p>
                                                                <div className="flex flex-wrap gap-3">
                                                                    {groupVariants.map((gv, gIdx) => {
                                                                        const detail = gv.name.includes('/') ? gv.name.split('/')[1].trim() : gv.name;
                                                                        const hasColor = detail.includes(': #');
                                                                        const colorHex = hasColor ? detail.split(': #')[1] : null;
                                                                        const cleanDetail = hasColor ? detail.split(':')[0] : detail;
                                                                        return (
                                                                            <div key={gIdx} className="px-4 py-2 bg-gray-50 rounded-2xl text-[10px] font-bold text-gray-600 border border-gray-100 flex items-center gap-2 shadow-sm">
                                                                                {hasColor && <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: `#${colorHex}` }} />}
                                                                                <span>{cleanDetail}</span>
                                                                                <span className="mx-1 opacity-20">|</span>
                                                                                <span className="text-[#004D4D] font-black">{gv.stock} uds</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <button onClick={() => setIsNewVariantModalOpen(true)} className="w-full py-8 border-2 border-dashed border-gray-100 rounded-[3rem] text-[10px] font-black text-gray-400 uppercase hover:text-[#004D4D] hover:bg-gray-50 transition-all flex items-center justify-center gap-4 shadow-sm group">
                                        <div className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-all"><Plus size={20} className="text-[#004D4D]"/></div>
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
                                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 md:p-20">
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewVariantModalOpen(false)} className="fixed inset-0 bg-gray-900/90 backdrop-blur-3xl" />
                                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col z-[10000]">
                                            <div className="bg-gray-50 p-12 border-b border-gray-100 flex justify-between items-center w-full">
                                                <div className="space-y-1"><h3 className="text-2xl font-black italic tracking-tighter uppercase text-[#004D4D]">Personalizar Atributo</h3><p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Talla, color y stock juntos</p></div>
                                                <button onClick={() => setIsNewVariantModalOpen(false)} className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                                            </div>
                                            <div className="p-12 space-y-10 overflow-y-auto max-h-[50vh] custom-scrollbar text-slate-900">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em] ml-2">Nombre Atributo Principal (Ej: Talla S)</label>
                                                    <input value={tempVariantName} onChange={(e) => setTempVariantName(e.target.value)} placeholder="Escribe el nombre principal..." className="w-full bg-gray-50 border-2 border-transparent focus:border-[#00F2FF]/30 rounded-3xl px-8 py-6 text-sm font-bold outline-none transition-all shadow-inner text-slate-900" />
                                                </div>
                                                <div className="space-y-6">
                                                    <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em] ml-2">Sub-variantes (Ej: Color Rojo, 16GB RAM...)</label>
                                                    <div className="space-y-4">
                                                        {tempSubVariants.map((sv) => (
                                                            <div key={sv.id} className="flex gap-4 items-center">
                                                                <div className="flex-1 relative flex items-center">
                                                                    {sv.spec.toLowerCase().includes('color') && (
                                                                        <div className="absolute left-4 z-10"><input type="color" value={resolveColor(sv.spec.split(':').pop() || '')} onChange={e => { const baseName = sv.spec.includes(':') ? sv.spec.split(':')[0] : sv.spec; setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, spec: `${baseName.trim()}: ${e.target.value}` } : item)); }} className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer bg-transparent" /></div>
                                                                    )}
                                                                    <input value={sv.spec.includes(': #') ? sv.spec.split(':')[0] : sv.spec} onChange={(e) => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, spec: e.target.value } : item))} placeholder="Especificación..." className={`flex-1 bg-gray-50 rounded-2xl py-4 text-xs font-bold outline-none border border-transparent focus:border-gray-200 text-slate-900 ${sv.spec.toLowerCase().includes('color') ? 'pl-14' : 'px-6'}`} />
                                                                </div>
                                                                <input type="number" value={sv.stock} onChange={(e) => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, stock: Number(e.target.value) } : item))} className="w-24 bg-[#004D4D]/5 rounded-2xl px-4 py-4 text-center text-xs font-black text-[#004D4D] shadow-inner" />
                                                                <button onClick={() => setTempSubVariants(prev => prev.filter(item => item.id !== sv.id))} className="text-gray-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setTempSubVariants([...tempSubVariants, { id: Math.random().toString(36).substr(2, 9), spec: '', stock: 0 }])} className="text-[9px] font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-2 hover:opacity-70"><Plus size={14}/> Añadir Especificación</button>
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

            <div className="flex-1 bg-gray-100 p-12 lg:p-20 flex items-center justify-center relative">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white">
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
                        <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative">
                            {media.length > 0 ? <img src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-gray-200" />}
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.category || 'Categoría'}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3></div><div className="text-right"><p className="text-xl font-black text-[#004D4D]">${formData.price.toLocaleString('de-DE')}</p></div></div>
                            {variants.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Variantes y Stock</p>
                                    <div className="flex flex-wrap gap-2">
                                        {variants.map((v, i) => {
                                            const hasColor = v.name.includes(': #');
                                            const colorHex = hasColor ? v.name.split(': #')[1] : null;
                                            const cleanName = hasColor ? v.name.split(':')[0] : v.name;
                                            return (
                                                <div key={i} className="px-3 py-1.5 bg-gray-50 rounded-lg border text-[10px] font-bold text-gray-600 flex items-center gap-2">
                                                    {hasColor && <div className="w-2 h-2 rounded-full border border-white" style={{ backgroundColor: `#${colorHex}` }} />}
                                                    {cleanName}: {v.stock}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50"><div className="space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{formData.sku || 'PENDIENTE'}</p></div><div className="space-y-2 text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
