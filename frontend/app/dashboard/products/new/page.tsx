"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Star
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
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        category: 'General',
        sku: '',
        status: 'active' as 'active' | 'draft',
        add_gateway_fee: false
    });

    const [variants, setVariants] = useState([
        { name: 'Estándar', sku: '', stock: 0, price_adjustment: 0 }
    ]);

    const [images, setImages] = useState<{file?: File, preview: string}[]>([]);

    // Cálculos (Coherentes con Facturación)
    const platformCommission = 2.5;
    const gatewayFee = formData.add_gateway_fee ? (formData.price * 0.035) : 0;
    const platformFee = formData.price * (platformCommission / 100);
    const profit = formData.price - formData.cost - platformFee - gatewayFee;
    const margin = formData.price > 0 ? (profit / formData.price) * 100 : 0;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 5) return showToast("Máximo 5 imágenes", "info");
        const newImgs = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
        setImages([...images, ...newImgs]);
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
                    image_url: images.length > 0 ? images[0].preview : null,
                    variants: variants.map(v => ({ ...v, sku: v.sku || formData.sku }))
                })
            });
            showToast("Producto creado con éxito", "success");
            router.push('/dashboard/products');
        } catch (err) {
            showToast("Error al crear el producto", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
            {/* --- BOTÓN CERRAR (Estilo POS) --- */}
            <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.back()} 
                className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md border border-white/20 text-gray-500 hover:text-rose-500 transition-all duration-500 shadow-lg"
            >
                <X size={20} />
            </motion.button>

            {/* --- LADO IZQUIERDO: FORMULARIO (Estilo POS) --- */}
            <motion.div 
                initial={{ x: -100, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00F2FF] animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Editor de Catálogo</span>
                    </div>
                    <h2 className="text-4xl font-black italic uppercase text-[#001A1A]">
                        Crear <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Producto</span>
                    </h2>
                </div>

                {/* Tabs de Configuración */}
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
                    {(['info', 'financial', 'variants'] as const).map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab === 'info' ? 'Información' : tab === 'financial' ? 'Finanzas' : 'Variantes'}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                        <input 
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Ej: Camiseta de Algodón Pima" 
                                            className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all" 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría</label>
                                            <select 
                                                value={formData.category}
                                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner appearance-none cursor-pointer"
                                            >
                                                <option value="General">General</option>
                                                <option value="Ropa">Ropa</option>
                                                <option value="Calzado">Calzado</option>
                                                <option value="Tecnología">Tecnología</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                                            <div className="flex bg-gray-50 p-1 rounded-2xl shadow-inner h-14">
                                                <button onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'active' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Activo</button>
                                                <button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase transition-all ${formData.status === 'draft' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Borrador</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                                        <textarea 
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            rows={5}
                                            placeholder="Describe tu producto..." 
                                            className="w-full px-6 py-6 bg-gray-50 border border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-medium shadow-inner transition-all resize-none" 
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3">
                                    <ImageIcon size={18} /> Galería Multimedia
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {images.map((img, i) => (
                                        <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-50 shadow-sm">
                                            <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 h-7 w-7 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg"><X size={14}/></button>
                                        </div>
                                    ))}
                                    {images.length < 5 && (
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-[#00F2FF]/30 hover:bg-[#00F2FF]/5 cursor-pointer transition-all group">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-300 group-hover:text-[#00F2FF] shadow-sm"><Plus size={20}/></div>
                                            <span className="text-[9px] font-black uppercase text-gray-300">Añadir</span>
                                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                                        </label>
                                    )}
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'financial' && (
                        <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo Unitario</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span>
                                                <input type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-gray-50 rounded-2xl outline-none text-base font-black border border-transparent focus:border-[#004D4D]/20 focus:bg-white shadow-inner transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio de Venta (PVP)</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004D4D] font-black">$</span>
                                                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full pl-12 pr-6 py-5 bg-[#004D4D]/5 rounded-2xl outline-none text-2xl font-black text-[#004D4D] border border-transparent focus:border-[#004D4D]/20 focus:bg-white shadow-inner transition-all" />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-[#00F2FF]/30 cursor-pointer transition-all group">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={formData.add_gateway_fee} onChange={e => setFormData({...formData, add_gateway_fee: e.target.checked})} className="sr-only peer" />
                                                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#00F2FF] after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase text-[#004D4D]">Sumar comisión pasarela</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Ajuste del 3.5% sobre PVP</p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Panel de Rentabilidad (Estilo Facturación) */}
                                    <div className="bg-[#004D4D] rounded-[3rem] p-10 text-white flex flex-col justify-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00F2FF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="relative z-10 space-y-6">
                                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Fee Plataforma ({platformCommission}%)</span>
                                                <span className="text-rose-400 font-bold">-${platformFee.toFixed(2)}</span>
                                            </div>
                                            {formData.add_gateway_fee && (
                                                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Impuesto Pasarela</span>
                                                    <span className="text-rose-400 font-bold">-${gatewayFee.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="pt-4 flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-[#00F2FF] uppercase tracking-[0.2em]">Utilidad Neta</p>
                                                    <span className={`text-4xl font-black ${profit > 0 ? 'text-[#4fffcb]' : 'text-rose-400'}`}>
                                                        ${profit.toLocaleString('de-DE')}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Margen</p>
                                                    <span className={`text-xl font-black ${margin > 30 ? 'text-[#4fffcb]' : 'text-amber-400'}`}>
                                                        {margin.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ShieldCheck size={140} className="absolute -right-6 -bottom-6 text-white/5" />
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                        <motion.div key="variants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                            <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                    <h3 className="text-sm font-black text-[#004D4D] uppercase tracking-widest flex items-center gap-3">
                                        <Layers size={18} /> Gestión de Variantes
                                    </h3>
                                    <button 
                                        onClick={() => setVariants([...variants, { name: '', sku: '', stock: 0, price_adjustment: 0 }])}
                                        className="bg-[#004D4D]/5 hover:bg-[#004D4D] hover:text-white text-[#004D4D] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <Plus size={14} /> Añadir Variante
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {variants.map((variant, index) => (
                                        <div key={index} className="p-8 bg-gray-50 rounded-[2.5rem] border border-transparent hover:border-[#004D4D]/10 transition-all flex flex-wrap md:flex-nowrap gap-6 items-end group relative">
                                            <div className="flex-1 min-w-[180px] space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre (Color/Talla)</label>
                                                <input 
                                                    value={variant.name}
                                                    onChange={e => {
                                                        const v = [...variants];
                                                        v[index].name = e.target.value;
                                                        setVariants(v);
                                                    }}
                                                    placeholder="Ej: Azul / XL"
                                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-bold transition-all focus:border-[#00F2FF]/30"
                                                />
                                            </div>
                                            <div className="w-40 space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU Específico</label>
                                                <input 
                                                    value={variant.sku}
                                                    onChange={e => {
                                                        const v = [...variants];
                                                        v[index].sku = e.target.value;
                                                        setVariants(v);
                                                    }}
                                                    placeholder="SKU-001"
                                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-bold transition-all focus:border-[#00F2FF]/30 uppercase"
                                                />
                                            </div>
                                            <div className="w-32 space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock</label>
                                                <input 
                                                    type="number"
                                                    value={variant.stock}
                                                    onChange={e => {
                                                        const v = [...variants];
                                                        v[index].stock = Number(e.target.value);
                                                        setVariants(v);
                                                    }}
                                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 outline-none text-xs font-black transition-all focus:border-[#00F2FF]/30"
                                                />
                                            </div>
                                            {variants.length > 1 && (
                                                <button 
                                                    onClick={() => setVariants(variants.filter((_, idx) => idx !== index))}
                                                    className="h-11 w-11 flex items-center justify-center bg-white border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- FOOTER DE ACCIÓN --- */}
                <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20">
                    <button 
                        onClick={() => router.back()}
                        className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#004D4D] transition-colors"
                    >
                        Descartar
                    </button>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => { setFormData({...formData, status: 'draft'}); handleSave(); }}
                            className="px-10 py-5 bg-white border border-gray-100 text-[#004D4D] rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg transition-all"
                        >
                            Guardar Borrador
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSubmitting || !formData.name}
                            className={`px-14 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all ${isSubmitting || !formData.name ? 'bg-gray-200 text-gray-400' : 'bg-[#004D4D] text-white hover:bg-black shadow-[#004D4D]/20'}`}
                        >
                            {isSubmitting ? 'Procesando...' : 'Publicar Catálogo'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* --- LADO DERECHO: VISTA PREVIA (Estilo "Recibo" de Facturación) --- */}
            <motion.div 
                initial={{ y: 200, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="w-full lg:w-[45%] h-full bg-[#E5E7EB] p-12 lg:p-20 flex items-center justify-center relative"
            >
                {/* Product Card "Digital Twin" */}
                <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white relative group">
                    {/* Header Card (Estilo Recibo) */}
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 z-20">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                <Box size={24} className="text-[#004D4D]" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase leading-none">Previsualización</h4>
                                <p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">Digital Twin del Producto</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-black text-white italic flex items-center opacity-20">
                                <span>BAY</span><InteractiveUP />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10">
                        {/* Imagen Principal */}
                        <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center relative group/img">
                            {images.length > 0 ? (
                                <img src={images[0].preview} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                            ) : (
                                <ImageIcon size={40} className="text-gray-200" />
                            )}
                            <div className="absolute top-6 right-6 flex flex-col gap-2">
                                <div className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg text-[#004D4D]"><Star size={18} fill="#004D4D" /></div>
                            </div>
                        </div>

                        {/* Detalles */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Catálogo {formData.category}</p>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{formData.name || 'Sin nombre'}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-300 uppercase">Precio PVP</p>
                                    <p className="text-2xl font-black text-[#004D4D] tracking-tighter">${formData.price.toLocaleString('de-DE')}</p>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                                <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                                    {formData.description || 'Sin descripción disponible...'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-gray-300 uppercase">SKU Maestro</p>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <Hash size={14} className="text-[#00F2FF]" /> {formData.sku || 'PENDIENTE'}
                                    </p>
                                </div>
                                <div className="space-y-2 text-right">
                                    <p className="text-[9px] font-black text-gray-300 uppercase">Stock Total</p>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                        {variants.reduce((acc, v) => acc + (v.stock || 0), 0)} UNIDADES
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Card "CTA Preview" */}
                    <div className="p-10 pt-0 bg-white">
                        <div className="bg-[#004D4D]/5 p-6 rounded-[2rem] border border-[#004D4D]/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-[#004D4D] rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <ShoppingBag size={18} />
                                </div>
                                <span className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Vista Tienda Online</span>
                            </div>
                            <ArrowUpRight size={18} className="text-[#004D4D]/30" />
                        </div>
                    </div>
                </div>

                {/* Badge Flotante "Live Preview" */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-xl border border-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Live Sync Preview</span>
                </div>
            </motion.div>
        </div>
    );
}
