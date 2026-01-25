"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/validations';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function NewProductPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'active',
      stock: 0,
      price: 0
    }
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Aquí conectamos con el endpoint real del backend
      await apiRequest('/products', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      });
      
      alert("¡Producto creado con éxito! ✨");
      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Nuevo Producto</h1>
          <p className="text-gray-500 mt-2 font-medium">Añade un nuevo artículo a tu inventario inteligente.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="px-6 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Producto</label>
              <input 
                {...register('name')}
                className={`w-full p-4 bg-gray-50 border ${errors.name ? 'border-red-300' : 'border-transparent'} focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all`}
                placeholder="Ej. Camiseta Minimalist White"
              />
              {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU / Código</label>
              <input 
                {...register('sku')}
                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all"
                placeholder="BAY-001"
              />
              {errors.sku && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción Detallada</label>
            <textarea 
              {...register('description')}
              rows={4}
              className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-medium transition-all resize-none"
              placeholder="Describe las características, materiales..."
            />
            {errors.description && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio de Venta</label>
              <input 
                type="number"
                {...register('price', { valueAsNumber: true })}
                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all"
              />
              {errors.price && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock Inicial</label>
              <input 
                type="number"
                {...register('stock', { valueAsNumber: true })}
                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all"
              />
              {errors.stock && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.stock.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría</label>
              <select 
                {...register('category')}
                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all appearance-none"
              >
                <option value="">Seleccionar...</option>
                <option value="ropa">Ropa</option>
                <option value="calzado">Calzado</option>
                <option value="accesorios">Accesorios</option>
              </select>
              {errors.category && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.category.message}</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-purple-100 transition-all active:scale-95 disabled:opacity-70"
          >
            {isSubmitting ? 'Guardando...' : 'Crear Producto ✨'}
          </button>
        </div>
      </form>
    </div>
  );
}