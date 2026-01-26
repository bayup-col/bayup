"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  ArrowLeft, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Info, 
  DollarSign, 
  HelpCircle,
  Upload,
  Percent,
  ShieldCheck,
  Zap
} from 'lucide-react';import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

export default function NewProductPage() {
    const { token } = useAuth();
    const router = useRouter();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [platformCommission] = useState(10); // 10% de ejemplo
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        category: '',
        sku: '',
        stock: 0,
        add_gateway_fee: false
    });

    const [variants, setVariants] = useState([
        { name: 'Estándar', sku: '', stock: 0, price_adjustment: 0 }
    ]);

    // Cálculos
    const gatewayFee = formData.add_gateway_fee ? (formData.price * 0.05) : 0;
    const finalPrice = formData.price + gatewayFee;
    const platformFee = finalPrice * (platformCommission / 100);
    const profit = formData.price - formData.cost - platformFee;
    const margin = formData.price > 0 ? (profit / formData.price) * 100 : 0;

    const handleAddVariant = () => {
        setVariants([...variants, { name: '', sku: '', stock: 0, price_adjustment: 0 }]);
    };

    const handleRemoveVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: string, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setIsSubmitting(true);

        try {
            await apiRequest('/products', {
                method: 'POST',
                token,
                body: JSON.stringify({
                    ...formData,
                    variants: variants.map(v => ({
                        name: v.name,
                        sku: v.sku,
                        stock: v.stock,
                        price_adjustment: v.price_adjustment
                    }))
                })
            });
            alert("¡Producto creado con éxito! 🚀");
            router.push('/dashboard/products');
        } catch (err) {
            alert("Error al crear el producto");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Nuevo Producto</h1>
                        <p className="text-gray-500 font-medium">Configura los detalles, precios y variantes de tu producto.</p>
                    </div>
                </div>
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.name}
                    className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-50 transition-all"
                >
                    {isSubmitting ? 'Guardando...' : 'Publicar Producto'}
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Información y Precios */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Información Básica */}
                    <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
                            <Info size={20} className="text-purple-600" />
                            Información General
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Producto</label>
                                <input 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ej: Camiseta de Algodón Pima" 
                                    className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold border border-transparent focus:border-purple-200 focus:bg-white transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={4}
                                    placeholder="Describe las características principales..." 
                                    className="w-full p-4 bg-gray-50 rounded-[2rem] outline-none text-sm font-medium border border-transparent focus:border-purple-200 focus:bg-white transition-all resize-none" 
                                />
                            </div>
                        </div>
                    </section>

                    {/* Precios y Rentabilidad */}
                    <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
                            <DollarSign size={20} className="text-emerald-600" />
                            Precios y Rentabilidad
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo unitario</label>
                                    <input 
                                        type="number"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-black border border-transparent focus:border-emerald-200 focus:bg-white transition-all" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio de venta</label>
                                    <input 
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                                        className="w-full p-4 bg-purple-50 rounded-2xl outline-none text-lg font-black border border-transparent focus:border-purple-200 focus:bg-white transition-all text-purple-700" 
                                    />
                                </div>
                                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-purple-200 cursor-pointer transition-all group">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.add_gateway_fee}
                                        onChange={(e) => setFormData({...formData, add_gateway_fee: e.target.checked})}
                                        className="h-5 w-5 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase text-gray-700">Sumar comisión de pasarela</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Aumenta automáticamente un 5% al precio</p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-center relative overflow-hidden">
                                <div className="relative z-10 space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Comisión Plataforma ({platformCommission}%)</span>
                                        <span className="text-rose-400 font-bold">-${platformFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Impuesto Pasarela</span>
                                        <span className="text-rose-400 font-bold">-${gatewayFee.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Utilidad Neta</p>
                                            <span className={`text-2xl font-black ${profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                ${profit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Margen</p>
                                            <span className={`text-xl font-black ${margin > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {margin.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ShieldCheck size={120} className="absolute -right-4 -bottom-4 text-white/5" />
                            </div>
                        </div>
                    </section>

                    {/* Variantes */}
                    <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
                                <Zap size={20} className="text-amber-500" />
                                Variantes del Producto
                            </h2>
                            <button 
                                type="button" 
                                onClick={handleAddVariant}
                                className="text-[10px] font-black uppercase text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                                <Plus size={14} /> Añadir Variante
                            </button>
                        </div>
                        <div className="space-y-4">
                            {variants.map((variant, index) => (
                                <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all flex flex-wrap md:flex-nowrap gap-4 items-end group">
                                    <div className="flex-1 min-w-[150px] space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase">Nombre</label>
                                        <input 
                                            value={variant.name}
                                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                            placeholder="Ej: Rojo / L"
                                            className="w-full bg-transparent border-b border-gray-200 outline-none text-xs font-bold py-1"
                                        />
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase">SKU</label>
                                        <input 
                                            value={variant.sku}
                                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                            placeholder="SKU-001"
                                            className="w-full bg-transparent border-b border-gray-200 outline-none text-xs font-bold py-1"
                                        />
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase">Stock</label>
                                        <input 
                                            type="number"
                                            value={variant.stock}
                                            onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                                            className="w-full bg-transparent border-b border-gray-200 outline-none text-xs font-bold py-1"
                                        />
                                    </div>
                                    {variants.length > 1 && (
                                        <button 
                                            onClick={() => handleRemoveVariant(index)}
                                            className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Columna Derecha: Imágenes y Categoría */}
                <div className="space-y-8">
                    {/* Imágenes */}
                    <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
                            <ImageIcon size={20} className="text-blue-500" />
                            Imágenes
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {images.map((img, i) => (
                                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-50">
                                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => setImages(images.filter((_, index) => index !== i))}
                                        className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-purple-200 hover:bg-purple-50/30 cursor-pointer transition-all">
                                <Plus size={24} className="text-gray-400" />
                                <span className="text-[10px] font-black uppercase text-gray-400">Añadir</span>
                                <input type="file" className="hidden" accept="image/*" />
                            </label>
                        </div>
                    </section>

                    {/* Categoría y Tags */}
                    <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
                            <Package size={20} className="text-orange-500" />
                            Categoría
                        </h2>
                        <div className="space-y-4">
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                className="w-full p-4 bg-gray-50 rounded-xl outline-none text-xs font-bold border border-transparent focus:border-purple-200 transition-all appearance-none"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="ropa">Ropa</option>
                                <option value="calzado">Calzado</option>
                                <option value="accesorios">Accesorios</option>
                                <option value="tecnologia">Tecnología</option>
                            </select>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
