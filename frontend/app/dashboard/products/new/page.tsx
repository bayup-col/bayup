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
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';
import { InteractiveUP } from '@/components/landing/InteractiveUP';

export default function NewProductPage() {
    const { token, userEmail, logout } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'variants'>('info');
    
    // Estados para Categorías y Guía
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    
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
        category: '',
        collection_id: null as string | null,
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
    const [platformCommission, setPlatformCommission] = useState(2.5);

    // Contenido Guía Operativa (Tutorial)
    const editorGuideContent = {
        basics: {
            title: 'Info Básica',
            icon: <FileText size={16}/>,
            color: 'text-blue-500',
            howItWorks: 'Define el ADN de tu producto. El nombre y la categoría son los pilares para que tus clientes encuentren lo que buscan.',
            example: 'Nombre: "Camiseta Aero-Tech", Categoría: "Deportes".',
            tip: 'Usa nombres cortos y descriptivos. Evita códigos internos que el cliente no entienda.'
        },
        pricing: {
            title: 'Estrategia Precios',
            icon: <DollarSign size={16}/>,
            color: 'text-emerald-500',
            howItWorks: 'Establece el valor de tu activo. Recuerda que Bayup te permite manejar precios Retail y Mayoristas.',
            example: 'Precio Retail: $120.000, Precio Mayorista: $85.000.',
            tip: 'Usa el Asistente de Rentabilidad de Bayt AI para calcular tu margen neto real después de gastos.'
        },
        media: {
            title: 'Contenido Visual',
            icon: <ImageIcon size={16}/>,
            color: 'text-purple-500',
            howItWorks: 'Sube fotos y videos de alta calidad. Es la única forma en que tu cliente puede "tocar" el producto.',
            example: 'Sube al menos 3 fotos: Frontal, Lateral y Detalle de textura.',
            tip: 'Los productos con video tienen una tasa de conversión un 30% mayor en WhatsApp.'
        },
        inventory: {
            title: 'Variantes & Stock',
            icon: <Layers size={16}/>,
            color: 'text-orange-500',
            howItWorks: 'Gestiona tallas, colores y existencias. Cada variante puede tener su propio SKU y ajuste de precio.',
            example: 'Talla M / Color Azul: 15 unidades.',
            tip: 'Mantén el stock actualizado para evitar cancelaciones. Bayup te avisará cuando queden pocas unidades.'
        }
    };

    const [activeEditorGuideTab, setActiveEditorGuideTab] = useState('basics');
    const [isEditorGuideOpen, setIsEditorGuideOpen] = useState(false);

    // Helpers de Formateo de Moneda
    const formatValue = (val: number | string) => {
        if (val === undefined || val === null || val === "") return "";
        const num = String(val).replace(/\D/g, "");
        return new Intl.NumberFormat("de-DE").format(Number(num));
    };

    const parseValue = (val: string) => {
        const cleaned = String(val).replace(/\./g, "");
        return cleaned === "" ? 0 : Number(cleaned);
    };

    // Lógica de Cálculo Asistente
    const currentGatewayRate = formData.add_gateway_fee ? 0.035 : 0;
    const totalFixedExpenses = assistantExpenses.payroll + assistantExpenses.rent + assistantExpenses.utilities + assistantExpenses.ops;
    const expensePerUnit = calcQuantity > 0 ? totalFixedExpenses / calcQuantity : 0;
    const totalUnitCost = formData.cost + expensePerUnit;
    const suggestedPrice = totalUnitCost / (1 - (calcMargin / 100) - (platformCommission / 100) - currentGatewayRate);
    const profitPerUnit = suggestedPrice - totalUnitCost - (suggestedPrice * (platformCommission / 100)) - (suggestedPrice * currentGatewayRate);
    const suggestedWholesale = totalUnitCost / (1 - (calcWholesaleMargin / 100) - (platformCommission / 100) - currentGatewayRate);
    const profitWholesalePerUnit = suggestedWholesale - totalUnitCost - (suggestedWholesale * (platformCommission / 100)) - (suggestedWholesale * currentGatewayRate);
    const marginPerUnit = suggestedPrice - formData.cost - (suggestedPrice * (platformCommission / 100)) - (suggestedPrice * currentGatewayRate);
    const breakEvenUnits = marginPerUnit > 0 ? Math.ceil(totalFixedExpenses / marginPerUnit) : 0;

    // Cálculos Pantalla Principal
    const activeExpenseDeduction = hasAnalyzed ? expensePerUnit : 0;
    const gatewayFeeUser = formData.add_gateway_fee ? (formData.price * 0.035) : 0;
    const platformFeeUser = formData.price * (platformCommission / 100);
    const profitUser = formData.price - formData.cost - activeExpenseDeduction - platformFeeUser - gatewayFeeUser;
    const marginUser = formData.price > 0 ? (profitUser / formData.price) * 100 : 0;
    const gatewayFeeWholesale = formData.add_gateway_fee ? (formData.wholesale_price * 0.035) : 0;
    const platformFeeWholesale = formData.wholesale_price * (platformCommission / 100);
    const profitWholesale = formData.wholesale_price - formData.cost - activeExpenseDeduction - platformFeeWholesale - gatewayFeeWholesale;
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

    useEffect(() => {
        let isMounted = true;
        if (!token) return;
        const fetchData = async () => {
            try {
                const [categories, userData] = await Promise.all([
                    apiRequest<any[]>('/collections', { token }),
                    apiRequest<any>('/auth/me', { token })
                ]);
                if (isMounted) {
                    if (categories) setCategoriesList(categories);
                    if (userData?.plan) setPlatformCommission(userData.plan.commission_rate * 100);
                }
            } catch (err) {}
        };
        fetchData();
        return () => { isMounted = false; };
    }, [token]);

            const handleSave = async () => {
                if (!formData.name.trim()) { showToast("Nombre obligatorio", "error"); setActiveTab('info'); return; }
                if (formData.cost <= 0) { showToast("Costo debe ser > 0", "error"); setActiveTab('financial'); return; }
        
                setIsSubmitting(true);
                try {
                    // Verificamos si hay algún blob atrapado que no se subió
                    const isStillUploading = media.some(m => m.preview.startsWith('blob:'));
                    if (isStillUploading) {
                        showToast("Sincronizando últimas imágenes...", "info");
                        // Damos 1 segundo extra de gracia por si la red es lenta
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    const finalImageUrl = media.length > 0 ? media[0].preview : null;
                    
                    if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
                        throw new Error("La imagen no se ha subido a la nube correctamente. Reintenta subirla.");
                    }

                    console.log("INTENTANDO GUARDAR EN DB...");
                    const payload = {
                        name: formData.name,
                        description: formData.description,
                        price: formData.price,
                        wholesale_price: formData.wholesale_price,
                        cost: formData.cost,
                        collection_id: formData.collection_id,
                        status: formData.status,
                        sku: formData.sku,
                        add_gateway_fee: formData.add_gateway_fee,
                        image_url: finalImageUrl,
                        variants: variants.map(v => ({ 
                            name: v.name || 'Estándar',
                            sku: v.sku,
                            stock: v.stock
                        }))
                    };

                    await apiRequest('/products', {
                        method: 'POST', token,
                        body: JSON.stringify(payload)
                    });
        
                    showToast("¡Producto creado con éxito!", "success");
                    router.push('/dashboard/products');
                } catch (err: any) { 
                    console.error("ERROR FINAL AL PUBLICAR:", err);
                    showToast(err.message || "Error al guardar. Revisa los datos.", "error"); 
                } finally { setIsSubmitting(false); }
            };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (media.length + files.length > 5) return showToast("Máximo 5 archivos", "info");
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
        
        for (const file of files) {
            // 1. Mostrar preview con marca unica
            const fileKey = `${file.name}-${Date.now()}`;
            setMedia(prev => [...prev, { 
                preview: URL.createObjectURL(file),
                type: file.type.startsWith('video') ? 'video' : 'image',
                isMuted: true,
                key: fileKey
            }]);

            // 2. Subida real al servidor
            try {
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);

                const res = await fetch(`${apiUrl}/admin/upload-image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formDataUpload
                });

                if (res.ok) {
                    const data = await res.json();
                    // Reemplazamos exactamente el que corresponde por su key única
                    setMedia(prev => prev.map(m => 
                        (m as any).key === fileKey ? { ...m, preview: data.url } : m
                    ));
                    showToast("Imagen sincronizada en la nube ☁️", "success");
                } else {
                    setMedia(prev => prev.filter(m => (m as any).key !== fileKey));
                    const errorMsg = await res.json().catch(() => ({ detail: 'Error' }));
                    showToast(`Error: ${errorMsg.detail}`, "error");
                }
            } catch (err) {
                setMedia(prev => prev.filter(m => (m as any).key !== fileKey));
                showToast("Error de conexión", "error");
            }
        }
    };

    const toggleMute = (index: number) => {
        const updatedMedia = [...media];
        updatedMedia[index].isMuted = !updatedMedia[index].isMuted;
        setMedia(updatedMedia);
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
                showToast("Categoría creada", "success");
            }
        } catch (err) { showToast("Error", "error"); }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden font-sans text-slate-900">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => router.back()} className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md border border-white/20 text-gray-500 hover:text-rose-500 shadow-lg"><X size={20} /></motion.button>

            <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-8 text-slate-900">
                    <div><h2 className="text-4xl font-black italic uppercase text-[#001A1A] tracking-tighter">Crear <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Producto</span></h2></div>
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
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TITULO DEL PRODUCTO</label><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Camiseta de Algodón Pima" className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all text-slate-900" /></div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2 relative"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría</label><button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl text-left text-sm font-bold shadow-inner flex items-center justify-between hover:bg-white hover:border-[#004D4D]/20 transition-all text-slate-900"><span className={formData.category ? "text-[#004D4D]" : "text-gray-300"}>{formData.category || "Seleccionar..."}</span><ChevronDown size={16} /></button>
                                            <AnimatePresence>{isCategoryOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[110] overflow-hidden flex flex-col p-2 text-slate-900"><div className="max-h-[200px] overflow-y-auto custom-scrollbar">{categoriesList.map(cat => (<button key={cat.id} onClick={() => { setFormData({...formData, category: cat.title, collection_id: cat.id}); setIsCategoryOpen(false); }} className="w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50 transition-all">{cat.title}</button>))}</div><button onClick={() => setIsNewCategoryModalOpen(true)} className="mt-2 py-3 bg-gray-50 text-[9px] font-black uppercase text-[#004D4D] rounded-xl hover:bg-[#004D4D] hover:text-white transition-all">+ Nueva Categoría</button></motion.div>)}</AnimatePresence>
                                        </div>
                                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label><div className="flex bg-gray-50 p-1 rounded-2xl shadow-inner h-14"><button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'active' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Activo</button><button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'draft' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Borrador</button></div></div>
                                    </div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={5} placeholder="Describe tu producto..." className="w-full px-6 py-6 bg-gray-50 border border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-medium shadow-inner transition-all resize-none text-slate-900" /></div>
                                </div>
                            </section>

                            {/* MULTIMEDIA */}
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 text-slate-900">
                                <div className="flex items-center justify-between"><h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><ImageIcon size={18} /> Galería Multimedia</h3><span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg">Arrastra para ordenar</span></div>
                                <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex flex-wrap gap-4">
                                    {media.map((item, i) => (
                                        <Reorder.Item 
                                            key={item.preview} 
                                            value={item} 
                                            whileDrag={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                                            className="group relative h-32 w-32 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing transition-shadow"
                                        >
                                            {item.type === 'video' ? (
                                                <video src={item.preview} className="w-full h-full object-cover pointer-events-none" muted loop autoPlay playsInline />
                                            ) : (
                                                <img src={item.preview} alt="Preview" className="w-full h-full object-cover pointer-events-none" />
                                            )}
                                            
                                            {i === 0 && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#4fffcb] text-[#004D4D] text-[7px] font-black uppercase rounded-md shadow-sm z-10">Principal</div>
                                            )}

                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                                                {item.type === 'video' && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleMute(i); }} className="h-8 w-8 bg-white/20 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-[#00F2FF] hover:text-[#004D4D] transition-all">
                                                        {item.isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                                                    </button>
                                                )}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setMedia(media.filter((_, idx) => idx !== i)); }} className="h-8 w-8 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 right-2 h-6 w-6 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white/60 opacity-0 group-hover:opacity-100 transition-opacity"><GripVertical size={12} /></div>
                                        </Reorder.Item>
                                    ))}
                                    {media.length < 5 && (
                                        <label className="h-32 w-32 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-[#00F2FF]/30 hover:bg-[#00F2FF]/5 cursor-pointer transition-all group">
                                            <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center text-gray-300 group-hover:text-[#00F2FF] shadow-sm"><Plus size={16}/></div>
                                            <span className="text-[8px] font-black uppercase text-gray-300">Añadir</span>
                                            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                        </label>
                                    )}
                                </Reorder.Group>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'financial' && (
                        <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 text-slate-900">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span><input type="text" value={formatValue(formData.cost)} onChange={e => setFormData({...formData, cost: parseValue(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-gray-50 rounded-2xl outline-none text-base font-black border border-transparent focus:border-[#004D4D]/20 focus:bg-white text-slate-900" /></div></div>
                                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4 text-emerald-800 text-[9px] font-medium leading-tight h-[110px] mt-6"><ShieldCheck size={16}/> Valor base de inversión real.</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Mayorista</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-600 font-black">$</span><input type="text" value={formatValue(formData.wholesale_price)} onChange={e => setFormData({...formData, wholesale_price: parseValue(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-cyan-50/30 rounded-2xl outline-none text-xl font-black text-cyan-700 border border-transparent focus:border-cyan-200 text-slate-900" /></div></div>
                                    <motion.div layout className="bg-[#004D4D] rounded-[2.5rem] p-8 text-white relative overflow-hidden h-[110px] mt-6 flex flex-col justify-center border border-white/5 shadow-lg"><div className="absolute top-6 right-8"><span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{marginWholesale.toFixed(1)}%</span></div><p className="text-[7px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">Utilidad Mayorista</p><span className="text-2xl font-black italic">${Math.round(profitWholesale).toLocaleString('de-DE')}</span><div className="mt-2 flex items-center gap-2 text-white"><div className="h-1 w-1 rounded-full bg-[#00F2FF] animate-pulse"></div><span className="text-[8px] font-bold text-cyan-300 uppercase tracking-widest">Tarifas Bayup: -${Math.round(platformFeeWholesale + gatewayFeeWholesale).toLocaleString()}</span></div></motion.div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Retail</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004D4D] font-black">$</span><input type="text" value={formatValue(formData.price)} onChange={e => setFormData({...formData, price: parseValue(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-[#004D4D]/5 rounded-2xl outline-none text-2xl font-black text-[#004D4D] border border-transparent focus:border-[#004D4D]/20 text-slate-900" /></div></div>
                                    <motion.div layout className="bg-[#001A1A] rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-white/5 shadow-2xl h-[110px] mt-6 flex flex-col justify-center text-white"><div className="absolute top-6 right-8"><span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{marginUser.toFixed(1)}%</span></div><p className="text-[7px] font-black text-[#00F2FF] uppercase tracking-[0.2em] mb-1">Utilidad Retail</p><span className="text-2xl font-black italic">${Math.round(profitUser).toLocaleString('de-DE')}</span><div className="mt-2 flex items-center gap-2 text-white"><div className="h-1 w-1 rounded-full bg-[#00F2FF]"></div><span className="text-[8px] font-bold text-[#00F2FF] uppercase tracking-widest text-white">Tarifas Bayup: -${Math.round(platformFeeUser + gatewayFeeUser).toLocaleString()}</span></div></motion.div>
                                </div>
                                <div className="pt-8 border-t border-gray-100 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-slate-900">
                                        <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl cursor-pointer transition-all group relative">
                                            <input type="checkbox" checked={formData.add_gateway_fee} onChange={e => setFormData({...formData, add_gateway_fee: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-[#004D4D] focus:ring-[#004D4D]" />
                                            <div className="flex items-center gap-2"><p className="text-[9px] font-black uppercase text-[#004D4D]">Comisión Pasarela</p><Info size={10} className="text-slate-300"/></div>
                                        </label>
                                        <div className="flex items-center justify-between px-6 py-4 bg-[#004D4D]/5 rounded-2xl border border-[#004D4D]/10"><div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Soporte Financiero</span><span className="text-[10px] font-black text-[#004D4D] uppercase">Fee: {platformCommission}%</span></div><ShieldCheck size={18} className="text-[#004D4D]/20" /></div>
                                    </div>
                                    <div className="p-10 bg-[#004D4D]/5 rounded-[3rem] border border-dashed border-[#004D4D]/20 flex justify-between items-center text-slate-900">
                                        <div className="space-y-1"><p className="text-sm font-black text-[#004D4D] uppercase">¿Necesitas ayuda con el precio?</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Te damos el valor perfecto según tus estadísticas.</p></div>
                                        <button onClick={() => setIsPriceAssistantOpen(true)} className="px-10 py-4 bg-[#004D4D] text-[#4fffcb] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Encontrar mi precio</button>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10 text-slate-900">
                            {Array.from(new Set(variants.map(v => v.name || 'Sin Atributo'))).map((groupName, groupIdx) => {
                                const groupVariants = variants.filter(v => (v.name || 'Sin Atributo') === groupName);
                                return (
                                        <div key={`family-${groupIdx}`} className="p-10 bg-gray-50 rounded-[3rem] border border-transparent hover:border-[#004D4D]/10 transition-all">
                                            <div className="flex gap-6 mb-4 px-2">
                                                <div className="flex-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Atributo</label></div>
                                                <div className="flex-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Especificación</label></div>
                                                <div className="w-32 text-center"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock</label></div>
                                                <div className="w-11"></div>
                                            </div>
                                            <div className="space-y-4">
                                                {groupVariants.map((variant) => (
                                                    <div key={variant.id} className="flex gap-6 items-center group/row animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="flex-1">
                                                            <input 
                                                                value={variant.name} 
                                                                onChange={e => {
                                                                    const newName = e.target.value;
                                                                    const idsInFamily = groupVariants.map(gv => gv.id);
                                                                    setVariants(prev => prev.map(v => idsInFamily.includes(v.id) ? { ...v, name: newName } : v));
                                                                }} 
                                                                placeholder="Ej: Talla o Color" 
                                                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-bold text-slate-900 shadow-sm focus:border-[#00F2FF]/30" 
                                                            />
                                                        </div>
                                                        <div className="flex-1 relative flex items-center">
                                                            {variant.name.toLowerCase().includes('color') && (
                                                                <div className="absolute left-3">
                                                                    <input 
                                                                        type="color" 
                                                                        value={resolveColor(variant.sku)} 
                                                                        onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, sku: e.target.value } : v))} 
                                                                        className="w-5 h-5 rounded-full border-none cursor-pointer bg-transparent" 
                                                                    />
                                                                </div>
                                                            )}
                                                            <input 
                                                                value={variant.sku} 
                                                                onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, sku: e.target.value } : v))} 
                                                                placeholder={variant.name.toLowerCase().includes('color') ? "Ej: Rojo o #Hex" : "Ej: S, XL, Cuero..."}
                                                                className={`w-full bg-white border border-gray-100 rounded-xl py-3 outline-none text-xs font-bold text-slate-900 focus:border-[#00F2FF]/30 shadow-sm ${variant.name.toLowerCase().includes('color') ? 'pl-10' : 'px-4'}`} 
                                                            />
                                                        </div>
                                                    <div className="w-32"><input type="text" value={formatValue(variant.stock)} onChange={e => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, stock: parseValue(e.target.value) } : v))} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-black text-center text-slate-900 shadow-sm" /></div>
                                                    <button onClick={() => setVariants(prev => prev.filter(v => v.id !== variant.id))} className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/row:opacity-100"><X size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => addSequentialVariant(variants.indexOf(groupVariants[groupVariants.length - 1]))} className="mt-6 text-[10px] font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3"><Plus size={14} /> Agregar otra {groupName}</button>
                                    </div>
                                );
                            })}
                            <button onClick={() => setVariants([...variants, { id: Math.random().toString(36).substr(2, 9), name: '', sku: '', stock: 0, price_adjustment: 0 }])} className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[3rem] text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-[#004D4D]/20 hover:text-[#004D4D] transition-all flex items-center justify-center gap-3 shadow-sm"><Plus size={16} /> Nueva Familia</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20 text-slate-900">
                    <button onClick={() => router.back()} className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 hover:text-[#004D4D] transition-colors">Descartar</button>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => { setFormData({...formData, status: 'draft'}); handleSave(); }} className="px-10 py-5 bg-white border border-gray-100 text-[#004D4D] rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg transition-all">Guardar Borrador</button>
                        {activeTab !== 'variants' ? (<button onClick={() => setActiveTab(activeTab === 'info' ? 'financial' : 'variants')} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">Siguiente</button>) : (<button onClick={handleSave} disabled={isSubmitting} className="px-14 py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">{isSubmitting ? 'Publicando...' : 'Publicar Catálogo'}</button>)}
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full lg:w-[45%] h-full bg-[#E5E7EB] p-12 lg:p-20 flex items-center justify-center relative text-slate-900">
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white relative group">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 z-20">
                        <div className="flex items-center gap-6"><div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg"><Box size={24} className="text-[#004D4D]" /></div><div><h4 className="text-xl font-black uppercase leading-none">Previsualización</h4><p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">Digital Twin del Producto</p></div></div>
                        <div className="text-right text-white"><div className="text-xl font-black italic opacity-20"><span>BAY</span><InteractiveUP /></div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10 text-slate-900">
                        <div className="space-y-6">
                            <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center relative group/img">
                                <AnimatePresence mode="popLayout">
                                    {media.length > 0 ? (
                                        media[selectedPreviewIndex]?.type === 'video' ? (
                                            <motion.video 
                                                key={media[selectedPreviewIndex]?.preview}
                                                src={media[selectedPreviewIndex]?.preview} 
                                                className="w-full h-full object-cover" 
                                                autoPlay muted loop playsInline 
                                                initial={{ opacity: 0, scale: 0.8 }} 
                                                animate={{ opacity: 1, scale: 1 }} 
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                            />
                                        ) : (
                                            <motion.img 
                                                key={media[selectedPreviewIndex]?.preview}
                                                src={media[selectedPreviewIndex]?.preview} 
                                                className="w-full h-full object-cover" 
                                                alt="Preview" 
                                                initial={{ opacity: 0, scale: 0.8 }} 
                                                animate={{ opacity: 1, scale: 1 }} 
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                            />
                                        )
                                    ) : (
                                        <ImageIcon size={40} className="text-gray-200" />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Fila de Miniaturas en Digital Twin */}
                            {media.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                    {media.map((item, i) => (
                                        <button 
                                            key={item.preview}
                                            onClick={() => setSelectedPreviewPreviewIndex(i)}
                                            className={`h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedPreviewIndex === i ? 'border-[#004D4D] scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            {item.type === 'video' ? (
                                                <div className="relative w-full h-full">
                                                    <video src={item.preview} className="w-full h-full object-cover" muted />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                                                        <Play size={12} fill="currentColor" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <img src={item.preview} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-6 text-slate-900">
                            <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{formData.category}</p><h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3></div><div className="text-right"><p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Precio</p><p className="text-2xl font-black text-[#004D4D] tracking-tighter">${formData.price.toLocaleString('de-DE')}</p></div></div>
                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 text-slate-900"><p className="text-xs text-gray-500 font-medium leading-relaxed italic">{formData.description || 'Sin descripción disponible...'}</p></div>
                            
                            {/* PREVISUALIZACIÓN DE VARIANTES */}
                            {variants.some(v => v.name && v.sku) && (
                                <div className="space-y-4 pt-4 border-t border-gray-50 text-slate-900">
                                    {Array.from(new Set(variants.filter(v => v.name && v.sku).map(v => v.name))).map(groupName => (
                                        <div key={groupName} className="space-y-2">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{groupName}</p>
                                            <div className="flex flex-wrap gap-2 text-slate-900">
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

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50 text-slate-900"><div className="space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><Hash size={14} className="text-[#00F2FF]" /> {formData.sku || 'PENDIENTE'}</p></div><div className="space-y-2 text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p><p className="text-sm font-black text-gray-900 uppercase tracking-widest">{variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES</p></div></div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* MODAL NO DATA */}
            <AnimatePresence>{isNoDataModalOpen && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNoDataModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl p-12 text-center space-y-8 text-slate-900">
                        <div className="flex justify-center"><div className="h-24 w-24 rounded-[2.5rem] bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D] relative"><Bot size={48} className="animate-bounce" /><div className="absolute -top-2 -right-2 h-8 w-8 bg-rose-500 text-white rounded-full flex items-center justify-center border-4 border-white"><AlertCircle size={16} /></div></div></div>
                        <div className="space-y-3"><h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#001A1A]">Faltan <span className="text-rose-600">Datos Clave</span></h3><p className="text-sm font-medium text-slate-500 max-w-md mx-auto">Bayt necesita registros financieros para darte una estrategia infalible. Registra tus gastos y ventas para desbloquear el análisis profundo.</p></div>
                        <button onClick={() => setIsNoDataModalOpen(false)} className="w-full py-5 bg-[#004D4D] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl">Entendido</button>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            {/* ASISTENTE DE PRECIOS */}
            <AnimatePresence>{isPriceAssistantOpen && (
                <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 md:p-10 text-slate-900">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPriceAssistantOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl text-slate-900" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row text-slate-900">
                        <div className="w-full md:w-96 bg-gray-50/50 border-r border-gray-100 p-10 overflow-y-auto custom-scrollbar text-slate-900">
                            <div className="space-y-10 text-slate-900">
                                <div className="flex items-center gap-4 text-slate-900 text-slate-900"><div className="h-12 w-12 rounded-2xl bg-[#004D4D] flex items-center justify-center text-white shadow-lg"><Zap size={24} /></div><div className="text-slate-900"><h3 className="text-xl font-black text-slate-900 uppercase italic">Asistente</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pricing Pro</p></div></div>
                                <div className="space-y-6 text-slate-900">
                                    <div className="border-b border-gray-100 pb-2 text-slate-900"><h4 className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Gastos Mensuales</h4></div>
                                    <div className="grid grid-cols-1 gap-4 text-slate-900">
                                        {[{ label: 'Nómina', key: 'payroll', icon: <User size={14}/> }, { label: 'Arriendo', key: 'rent', icon: <Box size={14}/> }, { label: 'Servicios', key: 'utilities', icon: <Zap size={14}/> }, { label: 'Otros Gastos', key: 'ops', icon: <Smartphone size={14}/> }].map((field) => (
                                            <div key={field.key} className="space-y-1.5 text-slate-900"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">{field.icon} {field.label}</label><div className="relative text-slate-900"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs">$</span><input type="text" value={formatValue(assistantExpenses[field.key as keyof typeof assistantExpenses])} onChange={(e) => setAssistantExpenses({...assistantExpenses, [field.key]: parseValue(e.target.value)})} className="w-full pl-8 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold focus:border-[#004D4D]/20 outline-none transition-all text-slate-900 shadow-sm" /></div></div>
                                        ))}
                                    </div>
                                    <button onClick={handleBaytAnalysis} disabled={isAnalyzingBayt} className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 transition-all relative overflow-hidden border-2 ${isAnalyzingBayt ? 'bg-slate-100' : 'bg-gradient-to-r from-[#001A1A] to-[#004D4D] text-white border-white/5 shadow-2xl'}`}><AnimatePresence mode="wait">{!isAnalyzingBayt ? (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4 text-white"><Bot size={24} /><div className="flex flex-col items-start"><span className="text-[10px] font-black uppercase">Consultar a Bayt</span><span className="text-[7px] font-bold text-white/40 uppercase">Análisis Multimétrica</span></div></motion.div>) : (<motion.div animate={{ y: [-2, -20, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-[#004D4D]"><Bot size={32} /></motion.div>)}</AnimatePresence></button>
                                    <AnimatePresence>{hasAnalyzed && (<motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setIsReportOpen(true)} className="w-full py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-[#004D4D] shadow-xl"><BarChart3 size={16} /><span className="text-[9px] font-black uppercase tracking-[0.1em]">Ver Sustentación</span></motion.button>)}</AnimatePresence>
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-[7px] font-bold uppercase leading-normal tracking-wider">Recuerda que los precios no incluyen envíos dinámicos.</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-12 bg-white flex flex-col justify-between overflow-y-auto custom-scrollbar text-slate-900">
                            <div className="space-y-10 text-slate-900">
                                <div className="flex justify-between items-start text-slate-900"><div className="space-y-6"><div className="text-slate-900 text-slate-900"><h2 className="text-3xl font-black italic uppercase text-[#001A1A] tracking-tighter">Simulación de <span className="text-[#004D4D]">Rentabilidad</span></h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Calculando el punto óptimo de venta</p></div><div className="flex flex-wrap items-center gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 text-slate-900"><div className="space-y-1.5 min-w-[200px] text-slate-900"><label className="text-[8px] font-black text-[#004D4D] uppercase tracking-widest ml-1">Unidades (Volumen)</label><div className="relative text-slate-900"><Box size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D4D]/30" /><input type="text" value={formatValue(calcQuantity)} onChange={(e) => setCalcQuantity(parseValue(e.target.value))} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-[#004D4D]/20 outline-none transition-all text-slate-900 shadow-sm" /></div></div><div className="h-12 w-px bg-slate-200 mx-2 hidden md:block"></div><div className="space-y-1.5 min-w-[180px] relative group/info text-slate-900 text-slate-900"><div className="flex items-center gap-2 ml-1 text-slate-900"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ticket Promedio</label><Info size={10} className="text-slate-300" /></div><div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-900"><ShoppingBag size={12} className="text-emerald-600" /><span className="text-sm font-black text-slate-900">${avgTicket.toLocaleString('de-DE')}</span></div></div></div></div><button onClick={() => setIsPriceAssistantOpen(false)} className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#004D4D] shadow-sm"><X size={20}/></button></div>
                                <div className="space-y-4 text-slate-900 text-slate-900">
                                    <div className="bg-[#001A1A] rounded-[3.5rem] p-8 text-white relative overflow-hidden group shadow-2xl flex flex-col justify-between min-h-[220px]"><div className="relative z-10 flex justify-between items-start"><div className="space-y-0.5 text-white"><p className="text-[8px] font-black text-[#00F2FF] uppercase tracking-[0.3em]">Sugerido Retail</p><h5 className="text-4xl font-black italic tracking-tighter text-[#4fffcb]">${Math.round(suggestedPrice).toLocaleString('de-DE')}</h5></div><div className="text-right text-white"><span className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">{calcMargin}%</span></div></div><div className="relative z-10 space-y-3 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 mt-4 text-white"><div className="flex justify-between items-center text-white text-white"><span className="text-[7px] font-black uppercase text-slate-400">Margen Final</span><button onClick={() => setCalcMargin(30)} className="text-[7px] font-black text-[#4fffcb] uppercase hover:underline">Recomendación (30%)</button></div><input type="range" min="5" max="80" value={calcMargin} onChange={(e) => setCalcMargin(Number(e.target.value))} className="w-full h-1 bg-white/10 appearance-none accent-[#4fffcb] cursor-pointer" /><div className="flex justify-center items-center gap-3 text-white"><span className="text-[8px] font-black text-white/40 uppercase">Utilidad Neta:</span><span className="text-sm font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] text-white">${Math.round(profitPerUnit).toLocaleString()} / Unidad</span></div></div></div>
                                    <div className="bg-[#004D4D] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-lg flex flex-col justify-between min-h-[220px] text-white"><div className="relative z-10 flex justify-between items-start text-white text-white"><div className="space-y-0.5 text-white"><p className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.3em]">Sugerido Mayorista</p><h5 className="text-4xl font-black italic tracking-tighter text-white">${Math.round(suggestedWholesale).toLocaleString('de-DE')}</h5></div><div className="text-right text-white"><span className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{calcWholesaleMargin}%</span></div></div><div className="relative z-10 space-y-3 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 mt-4 text-white text-white text-white text-white"><div className="flex justify-between items-center text-white"><span className="text-[7px] font-black uppercase text-white/40">Distribución</span><button onClick={() => setCalcWholesaleMargin(15)} className="text-[7px] font-black text-white/60 uppercase hover:underline">Recomendación (15%)</button></div><input type="range" min="5" max="50" value={calcWholesaleMargin} onChange={(e) => setCalcWholesaleMargin(Number(e.target.value))} className="w-full h-1 bg-white/10 appearance-none accent-cyan-400 cursor-pointer" /><div className="flex justify-center items-center gap-3 text-white"><span className="text-[8px] font-black text-white/40 uppercase">Utilidad Neta:</span><span className="text-sm font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] text-white">${Math.round(profitWholesalePerUnit).toLocaleString()} / Unidad</span></div></div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 text-slate-900 text-slate-900"><div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-slate-900"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Punto de Equilibrio</p><h5 className="text-xl font-black text-slate-900">{breakEvenUnits} <span className="text-[10px]">Unidades</span></h5></div><div className={`p-6 rounded-2xl border flex items-center gap-4 ${suggestedPrice > avgTicket * 1.3 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}`}><div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${suggestedPrice > avgTicket * 1.3 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>{suggestedPrice > avgTicket * 1.3 ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}</div><p className="text-[9px] font-bold uppercase leading-tight">{suggestedPrice > avgTicket * 1.3 ? "Precio elevado vs mercado" : "Precio Competitivo"}</p></div></div>
                                <div className="p-8 bg-[#004D4D]/5 rounded-[2.5rem] border border-[#004D4D]/10 flex gap-6 items-start text-slate-900"><div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-[#004D4D] shadow-sm shrink-0"><ShieldCheck size={24} /></div><div className="space-y-2 text-slate-900"><h4 className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">¿Por qué este precio es tu mejor opción?</h4><p className="text-[11px] text-slate-600 leading-relaxed font-medium text-slate-900">Análisis de <span className="text-[#004D4D] font-bold">Prorrateo Operativo</span>. Cubre costo de compra y asegura aporte a <span className="font-bold">Gastos Fijos</span>. Proteges tu utilidad y aseguras escalabilidad.</p></div></div>
                            </div>
                            <div className="flex gap-4 pt-10 text-slate-900">
                                <button onClick={() => setIsPriceAssistantOpen(false)} className="flex-1 py-5 rounded-[1.8rem] bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                                <div className="flex-[2] relative group/apply"><button onClick={() => { if (totalFixedExpenses <= 0) return; setFormData({...formData, price: Math.round(suggestedPrice), wholesale_price: Math.round(suggestedWholesale)}); setIsPriceAssistantOpen(false); showToast("Estrategia aplicada", "success"); }} className={`w-full py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#004D4D]/20 hover:bg-black transition-all ${totalFixedExpenses > 0 ? 'bg-[#004D4D] text-white' : 'bg-gray-200 text-gray-400'}`}>{totalFixedExpenses > 0 ? 'Aplicar Estrategia Dual' : 'Estrategia Bloqueada'}</button></div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            <AnimatePresence>
                {isBaytReportOpen && (
                    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 md:p-12 text-slate-900">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReportOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl text-slate-900" />
                        <motion.div initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} transition={{ duration: 0.4 }} className="relative bg-white/90 w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-2xl overflow-hidden border border-white flex flex-col text-slate-900">
                            <div className="p-10 bg-[#001A1A] text-white flex justify-between items-center shrink-0"><div className="flex items-center gap-6"><div className="h-16 w-16 rounded-3xl bg-[#4fffcb] flex items-center justify-center text-[#001A1A] shadow-[0_0_20px_rgba(79,255,203,0.4)]"><BarChart3 size={32} /></div><div><h3 className="text-3xl font-black italic uppercase tracking-tighter">Sustentación <span className="text-[#4fffcb]">Estratégica</span></h3><p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Análisis Multi-Métrica Bayt AI</p></div></div><button onClick={() => setIsReportOpen(false)} className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"><X size={24} /></button></div>
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-white/50 backdrop-blur-md text-slate-900">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-slate-900">
                                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> Auditoría de Gastos</h4><div className="space-y-4"><p className="text-sm font-medium text-slate-600 leading-relaxed">Bayt ha detectado un gasto operativo mensual de <span className="font-bold text-[#004D4D]">${totalFixedExpenses.toLocaleString()}</span>.</p><div className="h-2 bg-slate-100 rounded-full overflow-hidden flex"><div className="h-full bg-[#004D4D]" style={{ width: '60%' }} /><div className="h-full bg-cyan-400" style={{ width: '25%' }} /><div className="h-full bg-slate-200" style={{ width: '15%' }} /></div><p className="text-[9px] text-slate-400 font-bold uppercase text-slate-900">Distribución: 60% Nómina | 25% Infraestructura</p></div></div>
                                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-cyan-500"/> Predicción de Demanda</h4><div className="space-y-4"><div className="flex justify-between items-end"><div><span className="text-4xl font-black text-slate-900">82%</span><p className="text-[9px] font-bold text-emerald-500 uppercase">Probabilidad de Éxito</p></div><div className="text-right text-slate-900"><span className="text-xl font-black text-slate-400">High</span></div></div><p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">"Este mes la categoría presenta un pico histórico de búsquedas del 15% vs el año anterior."</p></div></div>
                                    <div className="bg-[#004D4D] p-8 rounded-[3rem] text-white space-y-6 relative overflow-hidden"><Zap size={100} className="absolute -right-4 -bottom-4 text-white/5" /><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Objetivo de Venta</h4><div className="space-y-2 text-white"><span className="text-5xl font-black italic">{breakEvenUnits}</span><p className="text-xs font-bold uppercase tracking-widest opacity-60 leading-tight">Unidades para cubrir el 100% de tus costos fijos mensuales.</p></div></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-slate-900">
                                    <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8"><div className="flex items-center gap-4 text-slate-900"><div className="h-10 w-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-sm"><Smartphone size={20} /></div><h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Estrategia de Lanzamiento</h4></div><div className="space-y-6"><div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-[#004D4D] text-slate-900"><p className="text-[11px] font-bold text-slate-700 leading-relaxed">"Recomendamos lanzar este producto bajo la categoría <span className="text-[#004D4D]">Lanzamientos VIP</span> durante las primeras 48h."</p></div><div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-cyan-400 text-slate-900"><p className="text-[11px] font-bold text-slate-700 leading-relaxed text-slate-900">"Ejecutar campaña de WhatsApp Marketing a clientes con búsquedas similares."</p></div></div></section>
                                    <section className="bg-[#001A1A] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group text-white"><div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700"><ShoppingBag size={140} className="text-[#4fffcb]" /></div><div className="relative z-10 space-y-8 text-white"><div className="flex items-center gap-4 text-white"><div className="h-10 w-10 rounded-2xl bg-[#4fffcb] flex items-center justify-center text-[#001A1A] shadow-lg"><Star size={20} /></div><h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#4fffcb]">Consejo Premium Bayt</h4></div><p className="text-sm font-medium text-white/80 leading-relaxed italic text-white">"Tu margen retail del <span className="text-[#4fffcb] font-bold">{calcMargin}%</span> es competitivo. Sugerimos un <span className="text-[#4fffcb] font-bold">Bundle Pack</span> para subir el ticket promedio."</p><div className="flex gap-3 text-white"><button className="px-6 py-3 bg-[#4fffcb] text-[#001A1A] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Activar Campaña</button></div></div></section>
                                </div>
                            </div>
                            <div className="p-10 border-t border-slate-100 bg-white/80 flex justify-between items-center shrink-0 text-slate-900"><div className="flex items-center gap-4 text-slate-900"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis Generado en tiempo real</p></div><button onClick={() => setIsReportOpen(false)} className="px-12 py-4 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#004D4D]/20 hover:bg-black transition-all">Cerrar y Aplicar Estrategia</button></div>
                        </motion.div>
                    </div>
                )}</AnimatePresence>

            <AnimatePresence>
                {isNewCategoryModalOpen && (
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-white text-slate-900">
                            <div className="flex items-center gap-4 mb-8 text-slate-900"><div className="h-12 w-12 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D]"><Layers size={24}/></div><div><h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Nueva Categoría</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Organiza tu inventario</p></div></div>
                            <div className="space-y-6 text-slate-900">
                                <div className="space-y-2 text-slate-900"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de la Familia</label><input autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Accesorios Premium" className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all text-slate-900" /></div>
                                <div className="flex gap-3 pt-4 text-slate-900"><button type="button" onClick={() => setIsNewCategoryModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors text-slate-900">Cancelar</button><button type="button" disabled={!newCategoryName.trim()} onClick={handleCreateCategory} className="flex-[2] py-4 bg-[#004D4D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#004D4D]/20 disabled:opacity-50">Crear Categoría</button></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditorGuideOpen && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditorGuideOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row text-slate-900">
                            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto"><div className="mb-6 text-slate-900"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Guía de Creación</h3><p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Maestría de Catálogo</p></div>{Object.entries(editorGuideContent).map(([key, item]) => (<button key={key} type="button" onClick={() => setActiveEditorGuideTab(key)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeEditorGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}><div className={`${activeEditorGuideTab === key ? 'text-white' : item.color}`}>{item.icon}</div><span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span></button>))}</div>
                            <div className="flex-1 flex flex-col overflow-hidden bg-white text-slate-900"><div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0"><div className="flex items-center gap-4 text-slate-900"><div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].color}`}>{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].icon}</div><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].title}</h2></div><button type="button" onClick={() => setIsEditorGuideOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar text-slate-900 text-slate-900"><section><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo configurar esto?</h4><p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].howItWorks}</p></section><div className="grid md:grid-cols-2 gap-8 text-slate-900 text-slate-900"><section className="space-y-4 text-slate-900"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Box size={14} className="text-blue-500"/> Recomendación</h4><div className="p-6 bg-blue-50/30 border border-blue-100 rounded-[2rem]"><p className="text-xs font-medium text-blue-900 leading-relaxed italic">"{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].example}"</p></div></section><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Bayup Pro-Tip</h4><div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem] text-slate-900"><p className="text-xs font-bold text-amber-900 leading-relaxed">{editorGuideContent[activeEditorGuideTab as keyof typeof editorGuideContent].tip}</p></div></section></div></div><div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30 text-slate-900"><button type="button" onClick={() => setIsEditorGuideOpen(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all">Entendido, continuar</button></div></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}