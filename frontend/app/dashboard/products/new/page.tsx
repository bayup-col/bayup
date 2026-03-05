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

export default function NewProductPage() {
    const { token, userPlan } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'variants'>('info');
    
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
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
        add_gateway_fee: false
    });

    const [variants, setVariants] = useState<any[]>([]);
    const [media, setMedia] = useState<{file?: File, preview: string, type: 'image' | 'video'}[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

    const [fixedCosts, setFixedCosts] = useState({ payroll: 0, rent: 0, services: 0, others: 0 });

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

                    {activeTab === 'financial' && (() => {
                        const commissionRate = userPlan?.commission_rate || 0.035;
                        const [fixedCosts, setFixedCosts] = useState({ payroll: 0, rent: 0, services: 0, others: 0 });
                        const totalStock = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 1; // Avoid div by zero

                        const calculateProfit = (price: number) => {
                            if (!price || !formData.cost) return { net: 0, margin: 0 };
                            const fee = formData.add_gateway_fee ? 0 : (price * commissionRate); // If fee added to customer, merchant pays 0 (customer pays price + fee) - logic check
                            // Standard logic: If merchant absorbs fee: Net = Price - Cost - Fee. If customer pays fee: Net = Price - Cost.
                            // However, typically platforms charge the merchant on the total transaction. 
                            // Let's stick to simple: If merchant absorbs, fee is deducted. If passed to customer, price increases but merchant gets the base price.
                            // Simplified for UI:
                            const effectiveFee = formData.add_gateway_fee ? 0 : (price * commissionRate); 
                            const net = price - formData.cost - effectiveFee;
                            const margin = (net / price) * 100;
                            return { net, margin };
                        };

                        const recommendedPrice = () => {
                            const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
                            const costPerUnit = formData.cost + (totalFixed / totalStock);
                            return Math.ceil((costPerUnit * 1.3) / 100) * 100; // +30% margin approx, rounded
                        };

                        return (
                            <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-12 pb-20">
                                
                                {/* FILA 1: COSTO */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Package size={14} className="text-[#004D4D]"/> Costo Unitario del Producto</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                                            <input type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-xl font-black text-gray-900 shadow-inner transition-all" placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="bg-[#004D4D]/5 p-8 rounded-[2.5rem] border border-[#004D4D]/10 flex items-center gap-6">
                                        <div className="h-12 w-12 rounded-full bg-[#004D4D] flex items-center justify-center text-white shrink-0"><Info size={20}/></div>
                                        <div>
                                            <h4 className="text-sm font-black text-[#004D4D] uppercase mb-1">¿Qué es el Costo Base?</h4>
                                            <p className="text-xs font-medium text-gray-600 leading-relaxed">Es el valor exacto que te cuesta adquirir o fabricar cada unidad. No incluyas envíos ni publicidad aquí.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* FILA 2: PRECIO MAYORISTA */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Layers size={14} className="text-[#004D4D]"/> Precio Mayorista</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                                            <input type="number" value={formData.wholesale_price} onChange={e => setFormData({...formData, wholesale_price: Number(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-xl font-black text-gray-900 shadow-inner transition-all" placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp size={80}/></div>
                                        <div className="relative z-10 flex justify-between items-end">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Tu Ganancia Real (aprox)</p>
                                                <h4 className={`text-3xl font-black tracking-tighter ${calculateProfit(formData.wholesale_price).net > 0 ? 'text-[#004D4D]' : 'text-gray-300'}`}>${calculateProfit(formData.wholesale_price).net.toLocaleString('de-DE')}</h4>
                                                <p className="text-[9px] font-bold text-gray-400 mt-1">Descontando {formData.add_gateway_fee ? '0%' : '3.5%'} comisión</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl border ${calculateProfit(formData.wholesale_price).margin >= 30 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                <span className="text-xs font-black">{calculateProfit(formData.wholesale_price).margin.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FILA 3: PRECIO RETAIL */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><DollarSign size={14} className="text-[#004D4D]"/> Precio Retail (Unidad)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                                            <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-xl font-black text-gray-900 shadow-inner transition-all" placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp size={80}/></div>
                                        <div className="relative z-10 flex justify-between items-end">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Tu Ganancia Real (aprox)</p>
                                                <h4 className={`text-3xl font-black tracking-tighter ${calculateProfit(formData.price).net > 0 ? 'text-[#004D4D]' : 'text-gray-300'}`}>${calculateProfit(formData.price).net.toLocaleString('de-DE')}</h4>
                                                <p className="text-[9px] font-bold text-gray-400 mt-1">Descontando {formData.add_gateway_fee ? '0%' : '3.5%'} comisión</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl border ${calculateProfit(formData.price).margin >= 30 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                <span className="text-xs font-black">{calculateProfit(formData.price).margin.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FILA 4: INTERRUPTOR PASARELA */}
                                <div className="bg-gray-50 p-6 rounded-[2rem] flex items-center justify-between border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#004D4D]"><Zap size={18}/></div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Cobrar comisión al cliente</p>
                                            <p className="text-[9px] font-bold text-gray-400">Si activas esto, el precio final aumentará un 3.5% para el comprador.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setFormData({...formData, add_gateway_fee: !formData.add_gateway_fee})} className={`w-14 h-8 rounded-full transition-all relative ${formData.add_gateway_fee ? 'bg-[#004D4D]' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${formData.add_gateway_fee ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* FILA 5: ANÁLISIS BAYUP (COSTOS FIJOS) */}
                                <section className="pt-10 border-t border-gray-100 space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-[#00F2FF] flex items-center justify-center text-[#004D4D]"><Bot size={16}/></div>
                                        <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest">Análisis Inteligente de Precios</h3>
                                    </div>
                                    
                                    <div className="bg-[#004D4D] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                                            <div className="space-y-6">
                                                <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">Calculadora de Costos Fijos Mensuales</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1"><label className="text-[8px] font-bold uppercase opacity-70">Nómina</label><input type="number" value={fixedCosts.payroll} onChange={e => setFixedCosts({...fixedCosts, payroll: Number(e.target.value)})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white/20 transition-all" placeholder="$0" /></div>
                                                    <div className="space-y-1"><label className="text-[8px] font-bold uppercase opacity-70">Arriendo</label><input type="number" value={fixedCosts.rent} onChange={e => setFixedCosts({...fixedCosts, rent: Number(e.target.value)})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white/20 transition-all" placeholder="$0" /></div>
                                                    <div className="space-y-1"><label className="text-[8px] font-bold uppercase opacity-70">Servicios</label><input type="number" value={fixedCosts.services} onChange={e => setFixedCosts({...fixedCosts, services: Number(e.target.value)})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white/20 transition-all" placeholder="$0" /></div>
                                                    <div className="space-y-1"><label className="text-[8px] font-bold uppercase opacity-70">Otros</label><input type="number" value={fixedCosts.others} onChange={e => setFixedCosts({...fixedCosts, others: Number(e.target.value)})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white/20 transition-all" placeholder="$0" /></div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-center items-center text-center space-y-4 border-l border-white/10 pl-10">
                                                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Precio Sugerido (Min. +30%)</p>
                                                <h3 className="text-5xl font-black tracking-tighter text-[#00F2FF]">${recommendedPrice().toLocaleString('de-DE')}</h3>
                                                <p className="text-[9px] font-medium text-gray-400 max-w-[200px]">Basado en tus costos fijos distribuidos en el stock actual ({totalStock} uds) y margen saludable.</p>
                                                <button onClick={() => setFormData({...formData, price: recommendedPrice()})} className="px-6 py-2 bg-white text-[#004D4D] rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Aplicar Precio</button>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                            </motion.div>
                        );
                    })()}                    {activeTab === 'variants' && (
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
                                                            const hasColor = detail.includes(': #');
                                                            const colorHex = hasColor ? detail.split(': #')[1] : null;
                                                            const cleanDetail = hasColor ? detail.split(':')[0] : detail;
                                                            return (
                                                                <div key={sIdx} className="px-4 py-2 bg-gray-50 rounded-2xl text-[10px] font-bold border flex items-center gap-2">
                                                                    {hasColor && <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: `#${colorHex}` }} />}
                                                                    <span>{cleanDetail}: {s.stock} uds</span>
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

                            <div className="p-10 bg-[#004D4D] rounded-[3.5rem] text-white shadow-2xl flex items-center justify-between">
                                <div className="space-y-1"><h4 className="text-xl font-black italic uppercase tracking-tighter">Inventario Consolidado</h4><p className="text-[9px] font-bold text-cyan-300 uppercase tracking-widest opacity-80">Suma total de unidades físicas</p></div>
                                <div className="bg-black/20 backdrop-blur-md px-10 py-5 rounded-[2rem] text-center"><span className="text-5xl font-black">{variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)}</span><p className="text-[10px] font-black uppercase text-cyan-400">Total Stock</p></div>
                            </div>

                            <AnimatePresence>
                                {isNewVariantModalOpen && (
                                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewVariantModalOpen(false)} className="fixed inset-0 bg-gray-900/90 backdrop-blur-3xl" />
                                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col z-[10000]">
                                            <div className="bg-gray-50 p-12 border-b flex justify-between items-center"><div className="space-y-1"><h3 className="text-2xl font-black italic uppercase text-[#004D4D]">Personalizar Atributo</h3><p className="text-[9px] font-black text-gray-400 uppercase">Talla, color y stock juntos</p></div><button onClick={() => setIsNewVariantModalOpen(false)} className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={20}/></button></div>
                                            <div className="p-12 space-y-10 overflow-y-auto max-h-[50vh] custom-scrollbar">
                                                <div className="space-y-4"><label className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Nombre Atributo (Ej: Talla S)</label><input value={tempVariantName} onChange={e => setTempVariantName(e.target.value)} placeholder="Escribe el nombre maestro..." className="w-full bg-gray-50 border-2 border-transparent focus:border-cyan-400/30 rounded-3xl px-8 py-6 text-sm font-bold outline-none shadow-inner transition-all" /></div>
                                                <div className="space-y-6"><label className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Sub-variantes</label>
                                                    <div className="space-y-4">
                                                        {tempSubVariants.map(sv => (
                                                            <div key={sv.id} className="flex gap-4 items-center">
                                                                <div className="flex-1 relative flex items-center">
                                                                    {sv.spec.toLowerCase().includes('color') && (<div className="absolute left-4 z-10"><input type="color" value={resolveColor(sv.spec.split(':').pop() || '')} onChange={e => { const base = sv.spec.includes(':') ? sv.spec.split(':')[0] : sv.spec; setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, spec: `${base.trim()}: ${e.target.value}` } : item)); }} className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer bg-transparent" /></div>)}
                                                                    <input value={sv.spec.includes(': #') ? sv.spec.split(':')[0] : sv.spec} onChange={e => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, spec: e.target.value } : item))} placeholder="Especificación..." className={`flex-1 bg-gray-50 rounded-2xl py-4 text-xs font-bold outline-none ${sv.spec.toLowerCase().includes('color') ? 'pl-14' : 'px-6'}`} />
                                                                </div>
                                                                <input type="number" value={sv.stock} onChange={e => setTempSubVariants(prev => prev.map(item => item.id === sv.id ? { ...item, stock: Number(e.target.value) } : item))} className="w-24 bg-[#004D4D]/5 rounded-2xl px-4 py-4 text-center text-xs font-black text-[#004D4D]" />
                                                                <button onClick={() => setTempSubVariants(prev => prev.filter(item => item.id !== sv.id))} className="text-gray-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setTempSubVariants([...tempSubVariants, { id: Math.random().toString(36).substr(2, 9), spec: '', stock: 0 }])} className="text-[9px] font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Añadir Especificación</button>
                                                </div>
                                            </div>
                                            <div className="p-12 bg-gray-50 flex gap-4 mt-auto">
                                                <button onClick={() => setIsNewVariantModalOpen(false)} className="flex-1 py-6 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                                                <button onClick={handleSaveMatrixAttributes} className="flex-[2] py-6 bg-[#004D4D] text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Guardar Atributos</button>
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
                    <button onClick={handleSave} disabled={isSubmitting} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase shadow-2xl hover:bg-black transition-all">{isSubmitting ? 'Guardando...' : 'Publicar Catálogo'}</button>
                </div>
            </div>

            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-1 bg-gray-100 p-12 lg:p-20 flex items-center justify-center relative">
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
                            {variants.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-gray-50"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Variantes y Stock</p>
                                    <div className="flex flex-wrap gap-2">{variants.map((v, i) => {
                                        const hasColor = v.name.includes(': #');
                                        const colorHex = hasColor ? v.name.split(': #')[1] : null;
                                        const cleanName = hasColor ? v.name.split(':')[0] : v.name;
                                        return (<div key={i} className="px-3 py-1.5 bg-gray-50 rounded-lg border text-[10px] font-bold text-gray-600 flex items-center gap-2">{hasColor && <div className="w-2 h-2 rounded-full border border-white" style={{ backgroundColor: `#${colorHex}` }} />}{cleanName}: {v.stock}</div>);
                                    })}</div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50"><div className="space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{formData.sku || 'PENDIENTE'}</p></div><div className="space-y-2 text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
