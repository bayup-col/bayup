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
    const [simulationUnits, setSimulationUnits] = useState(1);
    const [simulationRetailMargin, setSimulationRetailMargin] = useState(30);
    const [simulationWholesaleMargin, setSimulationWholesaleMargin] = useState(15);

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
    const bayupRate = 0.035; // 3.5% fija
    const wompiRate = 0.0285; // 2.85% Wompi

    const formatNumber = (val: number) => {
        if (!val && val !== 0) return "";
        return new Intl.NumberFormat('de-DE').format(val);
    };

    const handleNumberChange = (val: string, field: string, isFixedCost: boolean = false) => {
        const rawValue = val.replace(/\./g, '').replace(/[^0-9]/g, '');
        const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10);
        
        if (isFixedCost) {
            setFixedCosts(prev => ({ ...prev, [field]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [field]: numValue }));
        }
    };

    const calculateProfit = (price: number) => {
        if (!price) return { net: 0, margin: 0, bayupFee: 0, wompiFee: 0 };
        const bayupFee = price * bayupRate;
        const wompiFee = price * wompiRate;
        
        // Calcular el impacto de los gastos fijos por unidad
        const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
        const distributedFixed = totalFixed / (simulationUnits || 1);
        
        // Utilidad Neta = Precio - Costo Producto - Gastos Fijos por Unidad - Comisiones
        const net = price - (formData.cost || 0) - distributedFixed - bayupFee - (formData.add_gateway_fee ? 0 : wompiFee);
        const margin = price > 0 ? (net / price) * 100 : 0;
        
        return { 
            net: Math.round(net), 
            margin, 
            bayupFee: Math.round(bayupFee), 
            wompiFee: Math.round(formData.add_gateway_fee ? 0 : wompiFee) 
        };
    };

    const recommendedRetail = () => {
        const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
        const units = simulationUnits || 1;
        const costPerUnit = (formData.cost || 0) + (totalFixed / units);
        
        const marginDecimal = simulationRetailMargin / 100;
        const gatewayDecimal = formData.add_gateway_fee ? 0 : wompiRate;
        const divisor = 1 - marginDecimal - bayupRate - gatewayDecimal;
        
        if (divisor <= 0) return 0;
        return Math.ceil((costPerUnit / divisor) / 100) * 100;
    };

    const recommendedWholesale = () => {
        const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
        const units = simulationUnits || 1;
        const costPerUnit = (formData.cost || 0) + (totalFixed / units);
        
        const marginDecimal = simulationWholesaleMargin / 100;
        const gatewayDecimal = formData.add_gateway_fee ? 0 : wompiRate;
        const divisor = 1 - marginDecimal - bayupRate - gatewayDecimal;
        
        if (divisor <= 0) return 0;
        return Math.ceil((costPerUnit / divisor) / 100) * 100;
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
        const fetchInitial = async () => {
            if (!token) return;
            try {
                const cats = await apiRequest<any[]>('/collections', { token });
                if (cats) setCategoriesList(cats);
            } catch (e) {}
        };
        fetchInitial();
    }, [token]);

    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await apiRequest<any>('/collections', {
                method: 'POST',
                token,
                body: JSON.stringify({ title: newCategoryName, description: 'Creada desde producto' })
            });
            if (res) {
                setCategoriesList(prev => [...prev, res]);
                setFormData({ ...formData, category: res.title, collection_id: res.id });
                setIsNewCategoryModalOpen(false);
                setNewCategoryName("");
                setIsCategoryOpen(false);
                showToast("Categoría creada", "success");
            }
        } catch (e) {
            showToast("Error al crear categoría", "error");
        }
    };

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

    const [editingMasterName, setEditingMasterName] = useState<string | null>(null);

    const handleEditAttribute = (masterName: string) => {
        setEditingMasterName(masterName);
        const masterVariants = variants.filter(v => v.name.startsWith(masterName));
        setTempVariantName(masterName);
        setTempSubVariants(masterVariants.map(v => ({
            id: v.id || Math.random().toString(36).substr(2, 9),
            spec: v.name.split('/')[1]?.trim() || v.name,
            stock: v.stock
        })));
        setIsNewVariantModalOpen(true);
    };

    const handleSaveMatrixAttributes = () => {
        if (!tempVariantName.trim()) return;
        
        // Si estábamos editando, removemos los antiguos primero
        let newVariants = editingMasterName 
            ? variants.filter(v => !v.name.startsWith(editingMasterName))
            : [...variants];

        const newCombs = tempSubVariants.filter(sv => sv.spec.trim() !== '').map(sv => ({
            id: sv.id,
            name: `${tempVariantName} / ${sv.spec}`,
            sku: '',
            stock: sv.stock
        }));

        setVariants([...newVariants, ...newCombs]);
        setIsNewVariantModalOpen(false);
        setTempVariantName("");
        setTempSubVariants([{ id: '1', spec: '', stock: 0 }]);
        setEditingMasterName(null);
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
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TÍTULO</label>
                                    <input 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold placeholder:text-gray-300 transition-all focus:bg-white" 
                                        placeholder="Ej: Camiseta Oversize de Algodón Premium"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2 relative"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Categoría</label><button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full p-5 bg-gray-50 rounded-2xl text-left text-sm font-bold flex items-center justify-between"><span>{formData.category || "Seleccionar..."}</span><ChevronDown size={16} /></button>
                                        <AnimatePresence>
                                            {isCategoryOpen && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border z-[110] p-2 overflow-hidden">
                                                    <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                                                        {categoriesList.map(cat => (
                                                            <button key={cat.id} onClick={() => { setFormData({...formData, category: cat.title, collection_id: cat.id}); setIsCategoryOpen(false); }} className="w-full text-left px-5 py-3 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50 hover:text-[#004D4D] transition-colors">
                                                                {cat.title}
                                                            </button>
                                                        ))}
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setIsNewCategoryModalOpen(true); setIsCategoryOpen(false); }}
                                                            className="w-full text-left px-5 py-4 mt-2 rounded-xl text-[9px] font-black uppercase bg-[#004D4D]/5 text-[#004D4D] border border-dashed border-[#004D4D]/20 hover:bg-[#004D4D] hover:text-white transition-all flex items-center gap-2"
                                                        >
                                                            <Plus size={12}/> Crear nueva categoría
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</label><div className="flex bg-gray-50 p-1 rounded-2xl h-[60px]"><button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase ${formData.status === 'active' ? 'bg-[#004D4D] text-white' : 'text-gray-400'}`}>Activo</button><button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase ${formData.status === 'draft' ? 'bg-[#004D4D] text-white' : 'text-gray-400'}`}>Borrador</button></div></div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Descripción</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={e => setFormData({...formData, description: e.target.value})} 
                                        rows={5} 
                                        className="w-full p-6 bg-gray-50 rounded-[2.5rem] outline-none text-sm font-medium resize-none placeholder:text-gray-300 transition-all focus:bg-white" 
                                        placeholder="Describe los materiales, la talla que usa el modelo y los detalles que hacen único a este producto..."
                                    />
                                </div>
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
                                        <label className="h-32 w-32 rounded-3xl border-2 border-dashed border-[#00F2FF]/40 bg-[#00F2FF]/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#00F2FF] hover:bg-[#00F2FF]/10 group transition-all">
                                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-all"><Plus size={20} className="text-[#004D4D]"/></div>
                                            <div className="text-center">
                                                <span className="text-[8px] font-black text-[#004D4D] uppercase block">Subir</span>
                                                <span className="text-[7px] font-bold text-[#004D4D]/40 uppercase">Máx. 5 archivos</span>
                                            </div>
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">COSTO</label>
                                    <div className="relative h-[110px]">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                                        <input 
                                            type="text" 
                                            value={formatNumber(formData.cost)} 
                                            onChange={e => handleNumberChange(e.target.value, 'cost')} 
                                            onFocus={() => { if(formData.cost === 0) setFormData({...formData, cost: '' as any}) }}
                                            onBlur={() => { if(!formData.cost) setFormData({...formData, cost: 0}) }}
                                            className="w-full h-full pl-14 pr-10 bg-gray-50 border-2 border-gray-200 rounded-[2rem] focus:bg-white focus:border-[#004D4D]/20 outline-none font-black text-xl transition-all" 
                                            placeholder="0" 
                                        />
                                    </div>
                                </div>
                                <div className="relative group/cost">
                                    <div className="bg-emerald-50/50 h-[110px] p-8 rounded-[2rem] border-2 border-emerald-100/50 flex items-center gap-4 transition-all hover:bg-emerald-100/30">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <ShieldCheck size={20}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">Valor base de inversión real.</p>
                                            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors cursor-help">
                                                <HelpCircle size={10} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tooltip Costo */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-gray-900 text-white text-[10px] rounded-2xl opacity-0 group-hover/cost:opacity-100 pointer-events-none transition-opacity shadow-2xl z-[100]">
                                        <p className="font-bold text-emerald-400 mb-1 uppercase tracking-widest">¿Qué es el Costo?</p>
                                        <p className="text-gray-300 leading-relaxed">Es el monto neto que te cuesta adquirir o fabricar una unidad. Es la base para calcular cuánto debes cobrar para tener ganancias.</p>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                                    </div>
                                </div>
                            </div>

                            {/* FILA 2: MAYORISTA */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">PRECIO MAYORISTA</label>
                                    <div className="relative h-[110px]">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                                        <input 
                                            type="text" 
                                            value={formatNumber(formData.wholesale_price)} 
                                            onChange={e => handleNumberChange(e.target.value, 'wholesale_price')} 
                                            onFocus={() => { if(formData.wholesale_price === 0) setFormData({...formData, wholesale_price: '' as any}) }}
                                            onBlur={() => { if(!formData.wholesale_price) setFormData({...formData, wholesale_price: 0}) }}
                                            className="w-full h-full pl-14 pr-10 bg-gray-50 border-2 border-gray-200 rounded-[2rem] focus:bg-white focus:border-[#004D4D]/20 outline-none font-black text-xl transition-all" 
                                            placeholder="0" 
                                        />
                                    </div>
                                </div>
                                <div className="bg-[#002D2D] h-[110px] px-10 rounded-[2rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">UTILIDAD MAYORISTA</p>
                                        <h4 className="text-4xl font-black leading-none">${calculateProfit(formData.wholesale_price).net.toLocaleString('de-DE')}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1 w-1 rounded-full bg-cyan-400" />
                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Bayup: -${calculateProfit(formData.wholesale_price).bayupFee.toLocaleString('de-DE')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <span className="text-xl font-black italic opacity-80">{calculateProfit(formData.wholesale_price).margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={80}/></div>
                                </div>
                            </div>

                            {/* FILA 3: FINAL */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">PRECIO FINAL (UNIDAD)</label>
                                    <div className="relative h-[110px]">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                                        <input 
                                            type="text" 
                                            value={formatNumber(formData.price)} 
                                            onChange={e => handleNumberChange(e.target.value, 'price')} 
                                            onFocus={() => { if(formData.price === 0) setFormData({...formData, price: '' as any}) }}
                                            onBlur={() => { if(!formData.price) setFormData({...formData, price: 0}) }}
                                            className="w-full h-full pl-14 pr-10 bg-gray-50 border-2 border-gray-200 rounded-[2rem] focus:bg-white focus:border-[#004D4D]/20 outline-none font-black text-xl transition-all" 
                                            placeholder="0" 
                                        />
                                    </div>
                                </div>
                                <div className="bg-[#001515] h-[110px] px-10 rounded-[2rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">UTILIDAD FINAL</p>
                                        <h4 className="text-4xl font-black leading-none">${calculateProfit(formData.price).net.toLocaleString('de-DE')}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1 w-1 rounded-full bg-cyan-400" />
                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Bayup: -${calculateProfit(formData.price).bayupFee.toLocaleString('de-DE')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <span className="text-xl font-black italic opacity-80">{calculateProfit(formData.price).margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={80}/></div>
                                </div>
                            </div>

                            {/* FILA 4: OPCIONES */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="relative group/wompi">
                                    <button onClick={() => setFormData({...formData, add_gateway_fee: !formData.add_gateway_fee})} className="w-full flex items-center justify-between p-8 bg-white border-2 border-gray-200 rounded-[2rem] shadow-sm hover:border-[#004D4D]/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center ${formData.add_gateway_fee ? 'bg-[#004D4D] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Zap size={20} />
                                            </div>
                                            <div className="text-left">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-[9px] font-black text-[#004D4D] uppercase tracking-widest leading-none">Pasarela Wompi</p>
                                                    <div className="p-1 rounded-full bg-gray-100 text-gray-400 hover:bg-[#004D4D] hover:text-white transition-colors cursor-help">
                                                        <HelpCircle size={10} />
                                                    </div>
                                                </div>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase">¿Quién asume el costo?</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase transition-all ${formData.add_gateway_fee ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {formData.add_gateway_fee ? 'Cliente' : 'Empresa'}
                                        </div>
                                    </button>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-gray-900 text-white text-[10px] rounded-2xl opacity-0 group-hover/wompi:opacity-100 pointer-events-none transition-opacity shadow-2xl z-[100]">
                                        <p className="font-bold text-cyan-400 mb-1 uppercase tracking-widest">Información de Pasarela</p>
                                        <p className="text-gray-300 leading-relaxed">Wompi cobra una comisión por cada transacción exitosa. Aquí puedes elegir si ese costo lo descuentas de tu ganancia o se le suma al precio final del cliente.</p>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                                    </div>
                                </div>
                                <div className="relative group/roi">
                                    <div className="flex items-center justify-between p-8 bg-[#00F2FF]/5 border-2 border-[#00F2FF]/20 rounded-[2rem] shadow-sm transition-all hover:bg-[#00F2FF]/10">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[8px] font-black text-[#004D4D] uppercase tracking-widest">Retorno de Inversión (ROI)</p>
                                                <div className="p-1 rounded-full bg-[#004D4D]/5 text-gray-400 hover:bg-[#004D4D] hover:text-white transition-colors cursor-help">
                                                    <HelpCircle size={10} />
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black text-[#004D4D]">
                                                {(() => {
                                                    const profit = calculateProfit(formData.price);
                                                    const cost = formData.cost || 1;
                                                    const roi = (profit.net / cost) * 100;
                                                    return roi > 0 ? roi.toFixed(1) : 0;
                                                })()}%
                                            </h4>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-cyan-500 shadow-sm">
                                            <TrendingUp size={20} />
                                        </div>
                                    </div>

                                    {/* Tooltip ROI */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-gray-900 text-white text-[10px] rounded-2xl opacity-0 group-hover/roi:opacity-100 pointer-events-none transition-opacity shadow-2xl z-[100]">
                                        <p className="font-bold text-[#00F2FF] mb-1 uppercase tracking-widest">¿Qué es el ROI?</p>
                                        <p className="text-gray-300 leading-relaxed">Indica cuánto ganas por cada peso que invertiste en comprar el producto. Un ROI del 100% significa que ganaste el doble de lo que te costó.</p>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                                    </div>
                                </div>
                            </div>

                            {/* ASISTENTE BUTTON */}
                            <button onClick={() => setIsAssistantOpen(true)} className="w-full p-10 bg-white rounded-[3rem] border-2 border-gray-200 shadow-sm flex items-center justify-between group hover:border-[#00F2FF]/30 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-[#00F2FF]/10 flex items-center justify-center text-[#004D4D] group-hover:scale-110 transition-all"><Bot size={28}/></div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-[#004D4D] uppercase tracking-widest">¿Dudas con tus precios?</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Usa el asistente Bayt para calcular rentabilidad y punto de equilibrio</p>
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
                                                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditAttribute(master)} className="p-2 rounded-full bg-gray-50 text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all shadow-sm">
                                                        <Zap size={14}/>
                                                    </button>
                                                    <button onClick={() => setVariants(prev => prev.filter(v => !v.name.startsWith(master)))} className="p-2 rounded-full bg-gray-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-2xl bg-[#004D4D] flex items-center justify-center text-white font-black text-xs">{mIdx + 1}</div>
                                                        <h4 className="text-lg font-black text-[#004D4D] italic uppercase tracking-tighter">{master}</h4>
                                                    </div>
                                                    <div className="flex wrap gap-3">
                                                        {subs.map((s, sIdx) => {
                                                            const detail = s.name.includes('/') ? s.name.split('/')[1].trim() : s.name;
                                                            const hasColor = detail.includes(': #');
                                                            const colorHex = hasColor ? detail.split(': #')[1] : null;
                                                            const cleanDetail = hasColor ? detail.split(':')[0] : detail;
                                                            return (
                                                                <div key={sIdx} className="px-4 py-2 bg-gray-50 rounded-2xl text-[10px] font-bold border flex items-center gap-2">
                                                                    {hasColor && <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: `#${colorHex}` }} />}
                                                                    <span>{cleanDetail}: {s.stock} uds</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <button onClick={() => { setEditingMasterName(null); setTempVariantName(""); setTempSubVariants([{ id: '1', spec: '', stock: 0 }]); setIsNewVariantModalOpen(true); }} className="w-full py-12 border-2 border-dashed border-[#00F2FF]/40 bg-[#00F2FF]/5 rounded-[3rem] text-[10px] font-black text-[#004D4D] uppercase hover:bg-[#00F2FF]/10 hover:border-[#00F2FF] transition-all flex flex-col items-center justify-center gap-4 group">
                                        <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-all">
                                            <Plus size={24} className="text-[#004D4D]"/>
                                        </div>
                                        <div className="text-center">
                                            <span className="tracking-[0.2em] block">Añadir Atributo</span>
                                            <span className="text-[8px] font-bold opacity-40">Talla, color o material</span>
                                        </div>
                                    </button>
                                </div>
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
                    <button onClick={() => router.back()} className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 hover:text-rose-500 transition-colors">Descartar</button>
                    <button 
                        onClick={() => {
                            if (activeTab === 'info') setActiveTab('financial');
                            else if (activeTab === 'financial') setActiveTab('variants');
                            else handleSave();
                        }} 
                        disabled={isSubmitting} 
                        className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase shadow-2xl hover:bg-black transition-all"
                    >
                        {isSubmitting ? 'Guardando...' : (activeTab === 'variants' ? 'Publicar Catálogo' : 'Siguiente')}
                    </button>
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
                            
                            {formData.description && (
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed border-t border-gray-50 pt-4 line-clamp-3">
                                    {formData.description}
                                </p>
                            )}

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
                                                    {hasColor && <div className="w-2 h-2 rounded-full border border-white shadow-sm" style={{ backgroundColor: `#${colorHex}` }} />}
                                                    <span>{cleanName}: {v.stock}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-[85vh]">
                            
                            {/* Lado Izquierdo: Gastos */}
                            <div className="w-full lg:w-[45%] bg-gray-50 p-10 lg:p-16 space-y-12 border-r overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-[#004D4D] rounded-3xl flex items-center justify-center text-white shrink-0"><Zap size={28}/></div>
                                    <div>
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Asistente <span className="text-[#004D4D]">Pricing Pro</span></h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Calculando el punto óptimo de venta</p>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[#004D4D] uppercase ml-2 flex items-center gap-2">
                                                <Package size={10}/> COSTO UNITARIO DEL PRODUCTO
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span>
                                                <input 
                                                    type="text" 
                                                    value={formatNumber(formData.cost)} 
                                                    onChange={e => handleNumberChange(e.target.value, 'cost')} 
                                                    onFocus={() => { if(formData.cost === 0) setFormData({...formData, cost: '' as any}) }}
                                                    onBlur={() => { if(!formData.cost) setFormData({...formData, cost: 0}) }}
                                                    className="w-full pl-10 pr-6 py-5 bg-white border-2 border-[#004D4D]/20 rounded-2xl outline-none font-bold text-sm focus:border-[#00F2FF]/40 transition-all shadow-sm" 
                                                    placeholder="0" 
                                                />
                                            </div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase ml-2">Este es el valor base de tu inversión.</p>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <h4 className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.3em] mb-6">GASTOS OPERATIVOS (MENSUALES)</h4>
                                            <div className="space-y-6">
                                                {(['payroll', 'rent', 'services', 'others'] as const).map(key => (
                                                    <div key={key} className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2">
                                                            {key === 'payroll' && <User size={10}/>} {key === 'rent' && <Layout size={10}/>} {key === 'services' && <Zap size={10}/>} {key === 'others' && <Plus size={10}/>} 
                                                            {key === 'payroll' ? 'NÓMINA' : key === 'rent' ? 'ARRIENDO' : key === 'services' ? 'SERVICIOS' : 'OTROS GASTOS'}
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span>
                                                            <input 
                                                                type="text" 
                                                                value={formatNumber(fixedCosts[key])} 
                                                                onChange={e => handleNumberChange(e.target.value, key, true)} 
                                                                onFocus={() => { if(fixedCosts[key] === 0) setFixedCosts({...fixedCosts, [key]: '' as any}) }}
                                                                onBlur={() => { if(!fixedCosts[key]) setFixedCosts({...fixedCosts, [key]: 0}) }}
                                                                className="w-full pl-10 pr-6 py-5 bg-white border-2 border-gray-200 rounded-2xl outline-none font-bold text-sm focus:border-[#00F2FF]/20 transition-all" 
                                                                placeholder="0" 
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full py-6 bg-[#004D4D] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                        <Bot size={18}/> Consultar a Bayt
                                    </button>
                                </div>
                                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100"><p className="text-[8px] font-bold text-amber-700 uppercase text-center leading-relaxed">Recuerda que los precios no incluyen envíos ni pauta publicitaria.</p></div>
                            </div>

                            {/* Lado Derecho: Simulación */}
                            <div className="flex-1 p-10 lg:p-16 space-y-12 bg-white relative overflow-y-auto custom-scrollbar">
                                <button onClick={() => setIsAssistantOpen(false)} className="absolute top-10 right-10 h-10 w-10 flex items-center justify-center text-gray-300 hover:text-black z-20"><X size={24}/></button>
                                
                                <div className="space-y-8">
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Simulación de <span className="text-cyan-400">Rentabilidad</span></h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="bg-gray-50 p-8 rounded-[2rem] space-y-3 border-2 border-transparent focus-within:border-[#00F2FF]/20 transition-all">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">UNIDADES (VOLUMEN)</p>
                                            <div className="flex items-center gap-4">
                                                <Box size={20} className="text-gray-300"/> 
                                                <input 
                                                    type="text" 
                                                    value={formatNumber(simulationUnits)} 
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                                        setSimulationUnits(val === '' ? 0 : parseInt(val, 10));
                                                    }}
                                                    onFocus={() => { if(simulationUnits === 0) setSimulationUnits('' as any) }}
                                                    onBlur={() => { if(!simulationUnits) setSimulationUnits(1) }}
                                                    className="bg-transparent border-none outline-none text-2xl font-black w-full"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-8 rounded-[2rem] space-y-3 border-2 border-transparent">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">UNIDADES EQUILIBRIO</p>
                                            <div className="flex items-center gap-4">
                                                <BarChart3 size={20} className="text-cyan-400"/> 
                                                <span className="text-2xl font-black text-slate-900">
                                                    {(() => {
                                                        const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
                                                        // Usar el precio retail sugerido para el equilibrio si el precio actual es 0
                                                        const price = formData.price || recommendedRetail() || 1;
                                                        const gatewayFee = formData.add_gateway_fee ? 0 : (price * wompiRate);
                                                        const unitContribution = price - (formData.cost || 0) - (price * bayupRate) - gatewayFee;
                                                        
                                                        if (unitContribution <= 0) return "—";
                                                        return Math.ceil(totalFixed / unitContribution);
                                                    })()} <span className="text-[10px] text-gray-400 uppercase">Uds</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-8 rounded-[2rem] space-y-3">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TICKET PROMEDIO ACTUAL</p>
                                        <div className="flex items-center gap-4 text-2xl font-black text-[#004D4D]"><Calculator size={20} className="text-gray-300"/> <span>${(formData.price || 0).toLocaleString('de-DE')}</span></div>
                                    </div>

                                    {/* Sugerido Retail */}
                                    <div className="bg-[#002D2D] p-10 lg:p-12 rounded-[3.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden group">
                                        <div className="flex justify-between items-start relative z-10">
                                            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em]">SUGERIDO RETAIL</p>
                                            <div className="flex items-center gap-1">
                                                <input 
                                                    type="text"
                                                    value={simulationRetailMargin}
                                                    onChange={e => setSimulationRetailMargin(Number(e.target.value.replace(/[^0-9]/g, '')))}
                                                    className="bg-white/10 border-none outline-none text-4xl font-black italic w-20 text-right rounded-lg px-2"
                                                />
                                                <span className="text-4xl font-black italic">%</span>
                                            </div>
                                        </div>
                                        <h3 className="text-5xl lg:text-6xl font-black tracking-tighter text-cyan-400 relative z-10">${recommendedRetail().toLocaleString('de-DE')}</h3>
                                        <div className="pt-8 border-t border-white/5 space-y-2 relative z-10">
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${simulationRetailMargin}%` }} className="h-full bg-cyan-400" /></div>
                                            <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest"><span>Margen Final</span> <span>Seguridad Retail: ${(recommendedRetail() - (formData.cost + (fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others)/(simulationUnits || 1))).toLocaleString('de-DE')} / Unidad</span></div>
                                        </div>
                                        <button onClick={() => { setFormData({...formData, price: recommendedRetail()}); setIsAssistantOpen(false); }} className="w-full py-5 bg-white text-[#004D4D] rounded-full font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-transform relative z-10">APLICAR PRECIO</button>
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={120}/></div>
                                    </div>

                                    {/* Sugerido Mayorista */}
                                    <div className="bg-[#004D4D]/10 p-10 rounded-[3rem] border-2 border-gray-200 flex justify-between items-center group relative overflow-hidden transition-all">
                                        <div className="space-y-1 relative z-10">
                                            <p className="text-[8px] font-black text-gray-400 group-hover:text-cyan-400 uppercase tracking-widest transition-colors">SUGERIDO MAYORISTA</p>
                                            <h4 className="text-4xl font-black group-hover:text-white transition-colors">${recommendedWholesale().toLocaleString('de-DE')}</h4>
                                            <button onClick={() => { setFormData({...formData, wholesale_price: recommendedWholesale()}); setIsAssistantOpen(false); }} className="mt-4 px-6 py-2 bg-[#004D4D] text-white rounded-full text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:scale-105">Aplicar Mayorista</button>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <div className="flex items-center gap-1">
                                                <input 
                                                    type="text"
                                                    value={simulationWholesaleMargin}
                                                    onChange={e => setSimulationWholesaleMargin(Number(e.target.value.replace(/[^0-9]/g, '')))}
                                                    className="bg-black/5 group-hover:bg-white/10 border-none outline-none text-3xl font-black italic w-16 text-right rounded-lg px-2 group-hover:text-white transition-all"
                                                />
                                                <span className="text-3xl font-black italic opacity-20 group-hover:opacity-100 group-hover:text-white transition-all">%</span>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-[#004D4D] translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL CREAR CATEGORÍA (RESTAURADO) */}
            <AnimatePresence>
                {isNewCategoryModalOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-md bg-white rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/20 z-[10001] p-12 space-y-10">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black italic uppercase text-[#004D4D]">Nueva Categoría</h3>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Organiza tu inventario</p>
                                </div>
                                <button onClick={() => setIsNewCategoryModalOpen(false)} className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={18}/></button>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest ml-2">Nombre de la Categoría</label>
                                <input 
                                    value={newCategoryName} 
                                    onChange={e => setNewCategoryName(e.target.value)} 
                                    placeholder="Ej: Accesorios, Colección Invierno..." 
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-[#00F2FF]/20 rounded-3xl px-8 py-6 text-sm font-bold outline-none shadow-inner transition-all" 
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setIsNewCategoryModalOpen(false)} className="flex-1 py-5 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                                <button onClick={handleCreateCategory} className="flex-[2] py-5 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Guardar Categoría</button>
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
