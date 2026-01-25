"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const discountSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres").toUpperCase(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().min(0),
  min_purchase: z.number().min(0),
  max_uses: z.number().int().min(1).nullable(),
  end_date: z.string().nullable(),
});

type DiscountFormData = z.infer<typeof discountSchema>;

export default function NewDiscountPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      type: 'percentage',
      value: 0,
      min_purchase: 0,
      max_uses: null
    }
  });

  const selectedType = watch('type');

  const onSubmit = async (data: DiscountFormData) => {
    setIsSubmitting(true);
    try {
      // Aquí iría la llamada real a apiRequest('/discounts', ...)
      console.log("Creando descuento:", data);
      alert("¡Cupón creado exitosamente! 🏷️");
      router.push('/dashboard/discounts');
    } catch (err) {
      alert("Error al crear el descuento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Nuevo Descuento</h1>
          <p className="text-gray-500 mt-2 font-medium">Configura cupones y reglas de precios para tus clientes.</p>
        </div>
        <button onClick={() => router.back()} className="px-6 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Volver</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código del Cupón</label>
              <input {...register('code')} className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all" placeholder="EJ: BIENVENIDA20" />
              {errors.code && <p className="text-[10px] text-red-500 font-bold">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Descuento</label>
              <select {...register('type')} className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all appearance-none">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed_amount">Monto Fijo ($)</option>
                <option value="free_shipping">Envío Gratis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
            {selectedType !== 'free_shipping' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor</label>
                <input type="number" {...register('value', { valueAsNumber: true })} className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Compra Mínima</label>
              <input type="number" {...register('min_purchase', { valueAsNumber: true })} className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Usos Máximos</label>
              <input type="number" {...register('max_uses', { valueAsNumber: true })} className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all" placeholder="Ilimitado" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-purple-100 transition-all active:scale-95">
            {isSubmitting ? 'Procesando...' : 'Activar Descuento 🏷️'}
          </button>
        </div>
      </form>
    </div>
  );
}
