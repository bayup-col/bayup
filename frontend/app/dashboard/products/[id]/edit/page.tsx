"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/validations';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { 
  ArrowLeft, 
  DollarSign, 
  Info, 
  Layers, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  Trash2,
  ChevronRight,
  X,
  Hash,
  Box,
  Star,
  ShoppingBag,
  ArrowUpRight,
  Image as ImageIcon
} from 'lucide-react';
import { InteractiveUP } from '@/components/landing/InteractiveUP';

export default function EditProductPage() {
  const { token, userEmail } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'financial'>('info');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const name = watch('name') || '';
  const description = watch('description') || '';
  const price = watch('price') || 0;
  const cost = watch('cost') || 0;
  const sku = watch('sku') || '';
  const stock = watch('stock') || 0;
  const addGatewayFee = watch('add_gateway_fee');
  const category = watch('category') || 'General';
  const status = watch('status') || 'active';

  const platformCommission = 2.5;
  const gatewayFee = addGatewayFee ? (price * 0.035) : 0;
  const platformFee = price * (platformCommission / 100);
  const profit = price - cost - platformFee - gatewayFee;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  const fetchProduct = useCallback(async () => {
    if (!token || !productId) return;
    try {
      const data = await apiRequest<any>(`/products/${productId}`, { token });
      reset({
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        stock: data.variants?.[0]?.stock || 0,
        category: data.category || 'General',
        status: data.status || 'active',
        sku: data.variants?.[0]?.sku || '',
        add_gateway_fee: !!data.add_gateway_fee,
        cost: data.cost || 0,
      });
    } catch (err) {
      setError("No se pudo cargar el producto.");
      showToast("Error al cargar datos", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, productId, reset, showToast]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/products/${productId}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          ...data,
          variants: [{ name: 'Estándar', sku: data.sku, stock: data.stock }]
        }),
      });
      showToast("Cambios guardados con éxito", "success");
      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
      showToast("Error al actualizar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="fixed inset-0 bg-white flex flex-col justify-center items-center z-[1100] gap-6">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#00F2FF]/20"></div>
        <div className="relative animate-spin rounded-full h-16 w-16 border-b-2 border-[#004D4D]"></div>
      </div>
      <span className="text-[11px] font-black text-[#004D4D]/40 uppercase tracking-[0.3em]">Sincronizando con base de datos...</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* Botón Cerrar */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.back()} 
        className="absolute top-8 right-8 z-[1010] h-12 w-12 flex items-center justify-center rounded-full bg-gray-900/10 backdrop-blur-md border border-white/20 text-gray-500 hover:text-rose-500 transition-all duration-500 shadow-lg"
      >
        <X size={20} />
      </motion.button>

      {/* Lado Izquierdo: Formulario */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-[55%] h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-12 lg:p-20 space-y-12"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Modo Edición Avanzada</span>
          </div>
          <h2 className="text-4xl font-black italic uppercase text-[#001A1A]">
            Editar <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Producto</span>
          </h2>
        </div>

        {/* Tabs de Configuración */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
            {(['info', 'financial'] as const).map((tab) => (
                <button 
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {tab === 'info' ? 'Información y Stock' : 'Precios y Rentabilidad'}
                </button>
            ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <AnimatePresence mode="wait">
            {activeTab === 'info' ? (
              <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Producto</label>
                      <input 
                        {...register('name')} 
                        className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner transition-all" 
                      />
                      {errors.name && <p className="text-[9px] text-rose-500 font-bold uppercase mt-1 ml-1">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock Actual</label>
                        <input 
                          type="number" 
                          {...register('stock', { valueAsNumber: true })} 
                          className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-black shadow-inner transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU Maestro</label>
                        <input 
                          {...register('sku')} 
                          className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold uppercase shadow-inner transition-all" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                      <textarea 
                        {...register('description')} 
                        rows={6}
                        className="w-full px-8 py-8 bg-gray-50 border border-transparent rounded-[3rem] outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-medium shadow-inner transition-all resize-none" 
                      />
                    </div>
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div key="financial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo Unitario</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">$</span>
                          <input type="number" {...register('cost', { valueAsNumber: true })} className="w-full pl-12 pr-6 py-5 bg-gray-50 rounded-2xl outline-none text-base font-black border border-transparent focus:border-[#004D4D]/20 focus:bg-white shadow-inner transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio de Venta</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004D4D] font-black">$</span>
                          <input type="number" {...register('price', { valueAsNumber: true })} className="w-full pl-12 pr-6 py-5 bg-[#004D4D]/5 rounded-2xl outline-none text-2xl font-black text-[#004D4D] border border-transparent focus:border-[#004D4D]/20 focus:bg-white shadow-inner transition-all" />
                        </div>
                      </div>
                      <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-[#00F2FF]/30 cursor-pointer transition-all group">
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" {...register('add_gateway_fee')} className="sr-only peer" />
                          <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#00F2FF] after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase text-[#004D4D]">Incluir pasarela de pagos</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Incremento del 3.5% sobre el total</p>
                        </div>
                      </label>
                    </div>

                    <div className="bg-[#004D4D] rounded-[3rem] p-10 text-white flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-[#00F2FF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-white/10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Tarifa Operativa (2.5%)</span>
                          <span className="text-rose-400 font-bold">-${platformFee.toFixed(2)}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-[#00F2FF] uppercase tracking-[0.2em]">Ganancia Estimada</p>
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
          </AnimatePresence>

          <div className="pt-10 flex items-center justify-between border-t border-gray-100 pb-20">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#004D4D] transition-colors"
            >
              Cerrar sin guardar
            </button>
            <div className="flex gap-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`px-16 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all ${isSubmitting ? 'bg-gray-200 text-gray-400' : 'bg-[#004D4D] text-white hover:bg-black shadow-[#004D4D]/20'}`}
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Lado Derecho: Vista Previa */}
      <motion.div 
        initial={{ y: 200, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="w-full lg:w-[45%] h-full bg-[#E5E7EB] p-12 lg:p-20 flex items-center justify-center relative"
      >
        <div className="w-full max-w-lg bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-160px)] overflow-hidden border border-white relative">
          <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 z-20">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Box size={24} className="text-[#004D4D]" />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase leading-none">Vista de Tienda</h4>
                <p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">Reflejo del Inventario</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white italic flex items-center opacity-20">
                <span>BAY</span><InteractiveUP />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10">
            <div className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center relative">
              <ImageIcon size={40} className="text-gray-200" />
              <div className="absolute top-6 right-6 h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg text-[#004D4D]"><Star size={18} fill="#004D4D" /></div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{category.toUpperCase()}</p>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">{name || 'Sin nombre'}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-300 uppercase">Precio</p>
                  <p className="text-2xl font-black text-[#004D4D] tracking-tighter">${price.toLocaleString('de-DE')}</p>
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                  {description || 'No hay descripción configurada...'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-300 uppercase">Referencia SKU</p>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={14} className="text-[#00F2FF]" /> {sku || 'S/N'}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[9px] font-black text-gray-300 uppercase">Unidades</p>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{stock} EN STOCK</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 pt-0 bg-white">
            <div className="bg-[#004D4D]/5 p-6 rounded-[2rem] border border-[#004D4D]/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#004D4D] rounded-xl flex items-center justify-center text-white shadow-lg"><ShoppingBag size={18} /></div>
                <span className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Ver en la tienda</span>
              </div>
              <ArrowUpRight size={18} className="text-[#004D4D]/30" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
