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
  HelpCircle,
  Calculator
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';

export default function NewProductPage() {
    const { token, userPlan } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'variants'>('info');
    
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    
    const [isNewVariantModalOpen, setIsNewVariantModalOpen] = useState(false);
    const [tempVariantName, setTempVariantName] = useState("");
    const [tempSubVariants, setTempSubVariants] = useState([{ id: '1', spec: '', stock: 0 }]);

    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [fixedCosts, setFixedCosts] = useState({ payroll: 0, rent: 0, services: 0, others: 0 });

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
    const [media, setMedia] = useState<{file?: File, preview: string, type: 'image' | 'video'}[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

    const totalStock = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 1;
    const commissionRate = userPlan?.commission_rate || 0.035;

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
        const fetchInitial = async () => {
            if (!token) return;
            try {
                const cats = await apiRequest<any[]>('/collections', { token });
                if (cats) setCategoriesList(cats);
            } catch (e) {}
        };
        fetchInitial();
    }, [token]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (media.length >= 5) return showToast("Límite de 5 imágenes", "info");
        for (const file of files.slice(0, 5 - media.length)) {
            setMedia(prev => [...prev, { file, preview: URL.createObjectURL(file), type: 'image' }]);
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
                    const fd = new FormData(); fd.append('file', item.file);
                    const res = await fetch(`${apiUrl}/admin/upload-image`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
                    if (res.ok) { const d = await res.json(); finalImageUrls.push(d.url); }
                }
            }
            const payload = { ...formData, image_url: finalImageUrls, variants: variants.map(v => ({ name: v.name, sku: v.sku || '', stock: Number(v.stock) || 0 })) };
            await apiRequest('/products', { method: 'POST', token, body: JSON.stringify(payload) });
            window.dispatchEvent(new CustomEvent('bayup_product_update'));
            showToast("Producto creado ✨", "success");
            router.push('/dashboard/products');
        } catch (err) { showToast("Error al guardar", "error"); } finally { setIsSubmitting(false); }
    };

    const handleSaveMatrixAttributes = () => {
        if (!tempVariantName.trim()) return;
        const newCombs = tempSubVariants.filter(sv => sv.spec.trim() !== '').map(sv => ({
            id: Math.random().toString(36).substr(2, 9),
            name: `${tempVariantName} / ${sv.spec}`,
            sku: '',
            stock: sv.stock
        }));
        setVariants([...variants, ...newCombs]);
        setIsNewVariantModalOpen(false);
        setTempVariantName("");
        setTempSubVariants([{ id: '1', spec: '', stock: 0 }]);
    };

    const calculateProfit = (price: number) => {
        if (!price || !formData.cost) return { net: 0, margin: 0, fee: 0 };
        const fee = formData.add_gateway_fee ? 0 : (price * commissionRate);
        const net = price - formData.cost - fee;
        const margin = (net / price) * 100;
        return { net, margin, fee };
    };

    const recommendedRetail = () => {
        const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
        const costPerUnit = formData.cost + (totalFixed / totalStock);
        return Math.ceil((costPerUnit * 1.5) / 100) * 100; // 50% margin retail
    };

    const recommendedWholesale = () => {
        const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
        const costPerUnit = formData.cost + (totalFixed / totalStock);
        return Math.ceil((costPerUnit * 1.25) / 100) * 100; // 25% margin wholesale
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden text-slate-900 font-sans">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => router.back()} className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md text-gray-500 shadow-lg"><X size={20} /></motion.button>

            <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Crear <span className="text-[#004D4D]">Producto</span></h2>
                    <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-full shadow-lg">
                        {(['info', 'financial', 'variants'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#004D4D] text-white' : 'text-gray-400 hover:text-[#004D4D]'}`}>{tab === 'info' ? 'Información' : tab === 'financial' ? 'Finanzas' : 'Variantes'}</button>
                        ))}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TÍTULO</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" /></div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2 relative"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Categoría</label><button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full p-5 bg-gray-50 rounded-2xl text-left text-sm font-bold flex items-center justify-between"><span>{formData.category || "Seleccionar..."}</span><ChevronDown size={16} /></button>
                                        <AnimatePresence>{isCategoryOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border z-[110] p-2">
                                            <div className="max-h-[200px] overflow-y-auto no-scrollbar">{categoriesList.map(cat => (<button key={cat.id} onClick={() => { setFormData({...formData, category: cat.title, collection_id: cat.id}); setIsCategoryOpen(false); }} className="w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50">{cat.title}</button>))}</div>
                                        </motion.div>)}</AnimatePresence>
                                    </div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</label><div className="flex bg-gray-50 p-1 rounded-2xl h-[60px]"><button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase ${formData.status === 'active' ? 'bg-[#004D4D] text-white' : 'text-gray-400'}`}>Activo</button><button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase ${formData.status === 'draft' ? 'bg-[#004D4D] text-white' : 'text-gray-400'}`}>Borrador</button></div></div>
                                </div>
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Descripción</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={5} className="w-full p-6 bg-gray-50 rounded-[2.5rem] outline-none text-sm font-medium resize-none" /></div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1"><h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><ImageIcon size={18} /> Multimedia</h3><p className="text-[9px] font-bold text-gray-400 uppercase ml-8">Capacidad: <span className="text-[#004D4D]">{media.length} / 5</span> archivos</p></div>
                                </div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4">
                                    {media.map((item, i) => (
                                        <Reorder.Item key={item.preview} value={item} className="group relative h-32 w-32 rounded-3xl overflow-hidden border-2 border-white shadow-xl cursor-grab">
                                            <img src={item.preview} className="w-full h-full object-cover" />
                                            <button onClick={() => setMedia(media.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Trash2 size={16}/></button>
                                            {i === 0 && <div className="absolute top-2 left-2 px-2 py-1 bg-[#00F2FF] text-[#004D4D] text-[7px] font-black uppercase rounded-lg shadow-lg">Principal</div>}
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (
                                        <label className="h-32 w-32 rounded-3xl border-2 border-dashed border-[#004D4D]/10 bg-gray-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#00F2FF] group transition-all">
                                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-all"><Plus size={20} className="text-[#004D4D]"/></div>
                                            <div className="text-center"><span className="text-[8px] font-black text-gray-400 uppercase block">Subir</span><span className="text-[7px] font-bold text-gray-300 uppercase">Máx. 5 archivos</span></div>
                                            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                        </label>
                                    )}
                                </Reorder.Group>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'financial' && (
                        <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-12 pb-20">
                            
                            {/* FILA 1: COSTO */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">COSTO</label>
                                    <div className="relative">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full pl-14 pr-10 py-8 bg-gray-50 rounded-[2rem] outline-none font-black text-xl" placeholder="0" />
                                    </div>
                                </div>
                                <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100/50 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><ShieldCheck size={20}/></div>
                                    <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">Valor base de inversión real.</p>
                                </div>
                            </div>

                            {/* FILA 2: MAYORISTA */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">PRECIO MAYORISTA</label>
                                    <div className="relative">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input type="number" value={formData.wholesale_price} onChange={e => setFormData({...formData, wholesale_price: Number(e.target.value)})} className="w-full pl-14 pr-10 py-8 bg-gray-50 rounded-[2rem] outline-none font-black text-xl" placeholder="0" />
                                    </div>
                                </div>
                                <div className="bg-[#002D2D] p-10 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">UTILIDAD MAYORISTA</p>
                                        <h4 className="text-3xl font-black">${calculateProfit(formData.wholesale_price).net.toLocaleString('de-DE')}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Tarifas Bayup: -${calculateProfit(formData.wholesale_price).fee.toLocaleString('de-DE')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <span className="text-4xl font-black italic">{calculateProfit(formData.wholesale_price).margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={100}/></div>
                                </div>
                            </div>

                            {/* FILA 3: RETAIL */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">PRECIO RETAIL</label>
                                    <div className="relative">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full pl-14 pr-10 py-8 bg-gray-50 rounded-[2rem] outline-none font-black text-xl" placeholder="0" />
                                    </div>
                                </div>
                                <div className="bg-[#001515] p-10 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">UTILIDAD RETAIL</p>
                                        <h4 className="text-3xl font-black">${calculateProfit(formData.price).net.toLocaleString('de-DE')}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Tarifas Bayup: -${calculateProfit(formData.price).fee.toLocaleString('de-DE')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <span className="text-4xl font-black italic">{calculateProfit(formData.price).margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={100}/></div>
                                </div>
                            </div>

                            {/* FILA 4: OPCIONES */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <button onClick={() => setFormData({...formData, add_gateway_fee: !formData.add_gateway_fee})} className="flex items-center justify-between p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm group">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-6 w-6 rounded-md border-2 transition-all flex items-center justify-center ${formData.add_gateway_fee ? 'bg-[#004D4D] border-[#004D4D]' : 'border-gray-200'}`}>
                                            {formData.add_gateway_fee && <X size={14} className="text-white rotate-45" />}
                                        </div>
                                        <span className="text-[9px] font-black text-[#004D4D] uppercase tracking-widest">Comisión Pasarela</span>
                                    </div>
                                    <Info size={14} className="text-gray-300" />
                                </button>
                                <div className="flex items-center justify-between p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] shadow-sm">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Soporte Financiero</p>
                                        <p className="text-[10px] font-black text-[#004D4D]">FEE: 10%</p>
                                    </div>
                                    <ShieldCheck size={20} className="text-gray-200" />
                                </div>
                            </div>

                            {/* ASISTENTE BUTTON */}
                            <button onClick={() => setIsAssistantOpen(true)} className="w-full p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#00F2FF]/30 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-[#00F2FF]/10 flex items-center justify-center text-[#004D4D] group-hover:scale-110 transition-all"><Bot size={28}/></div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-[#004D4D] uppercase tracking-widest">¿Dudas con tus precios?</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Usa el asistente Bayt para calcular rentabilidad real</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300"/>
                            </button>

                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 pb-20">
                            <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><Layers size={18} /> Atributos Maestro</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {Array.from(new Set(variants.map(v => v.name.split('/')[0].trim()))).map((master, mIdx) => {
                                        const subs = variants.filter(v => v.name.startsWith(master));
                                        return (
                                            <div key={mIdx} className="p-10 bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl relative overflow-hidden group">
                                                <button onClick={() => setVariants(prev => prev.filter(v => !v.name.startsWith(master)))} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500"><Trash2 size={16}/></button>
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-2xl bg-[#004D4D] flex items-center justify-center text-white font-black text-xs">{mIdx + 1}</div>
                                                        <h4 className="text-lg font-black text-[#004D4D] italic uppercase tracking-tighter">{master}</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        {subs.map((s, sIdx) => {
                                                            const detail = s.name.includes('/') ? s.name.split('/')[1].trim() : s.name;
                                                            return (
                                                                <div key={sIdx} className="px-4 py-2 bg-gray-50 rounded-2xl text-[10px] font-bold border flex items-center gap-2">
                                                                    <span>{detail}: {s.stock} uds</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <button onClick={() => setIsNewVariantModalOpen(true)} className="w-full py-8 border-2 border-dashed border-gray-100 rounded-[3rem] text-[10px] font-black text-gray-400 uppercase hover:text-[#004D4D] hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-2">
                                        <Plus size={24}/><span className="tracking-widest">Añadir Atributo</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20">
                    <button onClick={() => router.back()} className="px-10 py-5 text-[10px] font-black uppercase text-gray-400">Descartar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase shadow-2xl hover:bg-black transition-all">{isSubmitting ? 'Guardando...' : 'Publicar Catálogo'}</button>
                </div>
            </div>

            {/* PREVIEW RIGHT SIDE */}
            <motion.div className="flex-1 bg-gray-100 p-12 lg:p-20 flex items-center justify-center relative">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0">
                        <div className="flex items-center gap-6"><div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center"><Box size={24} className="text-[#004D4D]" /></div><div><h4 className="text-xl font-black uppercase leading-none">Previsualización</h4><p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">RÉPLICA DIGITAL</p></div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10">
                        <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative">
                            {media.length > 0 ? <img src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-gray-200" />}
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.category || 'Categoría'}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3></div><div className="text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Precio</p><p className="text-2xl font-black text-[#004D4D] tracking-tighter">${formData.price.toLocaleString('de-DE')}</p></div></div>
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50"><div className="space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* MODAL ASISTENTE (RESTAURADO) */}
            <AnimatePresence>
                {isAssistantOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-12">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssistantOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col lg:flex-row h-[85vh]">
                            
                            {/* Lado Izquierdo: Gastos */}
                            <div className="w-full lg:w-[45%] bg-gray-50 p-16 space-y-12 border-r">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-[#004D4D] rounded-3xl flex items-center justify-center text-white"><Zap size={28}/></div>
                                    <div>
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter">Asistente <span className="text-[#004D4D]">Pricing Pro</span></h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Calculando el punto óptimo de venta</p>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <h4 className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.3em]">GASTOS MENSUALES</h4>
                                    <div className="space-y-6">
                                        {(['payroll', 'rent', 'services', 'others'] as const).map(key => (
                                            <div key={key} className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2">
                                                    {key === 'payroll' && <User size={10}/>} {key === 'rent' && <Layout size={10}/>} {key === 'services' && <Zap size={10}/>} {key === 'others' && <Plus size={10}/>} 
                                                    {key === 'payroll' ? 'NÓMINA' : key === 'rent' ? 'ARRIENDO' : key === 'services' ? 'SERVICIOS' : 'OTROS GASTOS'}
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span>
                                                    <input type="number" value={fixedCosts[key]} onChange={e => setFixedCosts({...fixedCosts, [key]: Number(e.target.value)})} className="w-full pl-10 pr-6 py-5 bg-white rounded-2xl outline-none font-bold text-sm border border-transparent focus:border-[#00F2FF]/20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full py-6 bg-[#004D4D] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                        <Bot size={18}/> Consultar a Bayt
                                    </button>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100"><p className="text-[8px] font-bold text-amber-700 uppercase text-center leading-relaxed">Recuerda que los precios no incluyen envíos ni pauta.</p></div>
                            </div>

                            {/* Lado Derecho: Simulación */}
                            <div className="flex-1 p-16 space-y-12 bg-white relative">
                                <button onClick={() => setIsAssistantOpen(false)} className="absolute top-10 right-10 h-10 w-10 flex items-center justify-center text-gray-300 hover:text-black"><X size={24}/></button>
                                
                                <div className="space-y-8">
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter">Simulación de <span className="text-cyan-400">Rentabilidad</span></h3>
                                    
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="bg-gray-50 p-8 rounded-[2rem] space-y-3">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">UNIDADES (VOLUMEN)</p>
                                            <div className="flex items-center gap-4 text-2xl font-black"><Box size={20} className="text-gray-300"/> <span>{totalStock}</span></div>
                                        </div>
                                        <div className="bg-gray-50 p-8 rounded-[2rem] space-y-3">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TICKET PROMEDIO</p>
                                            <div className="flex items-center gap-4 text-2xl font-black text-[#004D4D]"><Calculator size={20} className="text-gray-300"/> <span>${(formData.price || 0).toLocaleString('de-DE')}</span></div>
                                        </div>
                                    </div>

                                    {/* Sugerido Retail */}
                                    <div className="bg-[#002D2D] p-12 rounded-[3.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden group">
                                        <div className="flex justify-between items-start relative z-10">
                                            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em]">SUGERIDO RETAIL</p>
                                            <span className="text-4xl font-black italic">30%</span>
                                        </div>
                                        <h3 className="text-6xl font-black tracking-tighter text-cyan-400 relative z-10">${recommendedRetail().toLocaleString('de-DE')}</h3>
                                        <div className="pt-8 border-t border-white/5 space-y-2 relative z-10">
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '30%' }} className="h-full bg-cyan-400" /></div>
                                            <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest"><span>Margen Final</span> <span>Seguridad Retail: ${(recommendedRetail() * 0.3).toLocaleString('de-DE')} / Unidad</span></div>
                                        </div>
                                        <button onClick={() => { setFormData({...formData, price: recommendedRetail()}); setIsAssistantOpen(false); }} className="w-full py-4 bg-white text-[#004D4D] rounded-full font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-transform">APLICAR PRECIO</button>
                                    </div>

                                    {/* Sugerido Mayorista */}
                                    <div className="bg-[#004D4D]/10 p-10 rounded-[3rem] border border-[#004D4D]/10 flex justify-between items-center group cursor-pointer hover:bg-[#004D4D] hover:text-white transition-all">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-gray-400 group-hover:text-cyan-400 uppercase tracking-widest">SUGERIDO MAYORISTA</p>
                                            <h4 className="text-4xl font-black">${recommendedWholesale().toLocaleString('de-DE')}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black italic opacity-20 group-hover:opacity-100">15%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
