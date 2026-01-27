"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/context/toast-context";

const discountSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres").toUpperCase(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().min(0),
  min_purchase: z.number().min(0),
  max_uses: z.number().int().min(1).nullable(),
  status: z.enum(['active', 'expired']),
});

type DiscountFormData = z.infer<typeof discountSchema>;

export default function EditDiscountPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
  });

  const selectedType = watch('type');

  useEffect(() => {
    // Simulación de carga de datos (en producción sería un fetch)
    const mockData: Record<string, any> = {
        "d1": { code: "VERANO20", type: 'percentage', value: 20, status: 'active', min_purchase: 0, max_uses: 500 },
        "d2": { code: "BIENVENIDA", type: 'fixed_amount', value: 15000, status: 'active', min_purchase: 50000, max_uses: null },
        "d3": { code: "FREE_SHIP", type: 'free_shipping', value: 0, status: 'active', min_purchase: 100000, max_uses: 100 }
    };

    const data = mockData[params.id as string];
    if (data) {
        setValue('code', data.code);
        setValue('type', data.type);
        setValue('value', data.value);
        setValue('min_purchase', data.min_purchase);
        setValue('max_uses', data.max_uses);
        setValue('status', data.status);
        setIsActive(data.status === 'active');
    }
  }, [params.id, setValue]);

  const onSubmit = async (data: DiscountFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Actualizando descuento:", { ...data, status: isActive ? 'active' : 'expired' });
      showToast("¡Cupón actualizado correctamente! 🏷️", "success");
      router.push('/dashboard/discounts');
    } catch (err) {
      showToast("Error al actualizar el descuento.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Editar Descuento</h1>
          <p className="text-gray-500 mt-2 font-medium">Modifica las reglas y el estado de tu cupón.</p>
        </div>
        <button onClick={() => router.back()} className="px-6 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Volver</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-10">
          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <div>
              <p className="text-sm font-black text-gray-900">Estado del Cupón</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {isActive ? 'Actualmente activo y canjeable' : 'Cupón desactivado (No se puede usar)'}
              </p>
            </div>
            <button 
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${isActive ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
                <div className={`h-6 w-6 bg-white rounded-full shadow-md transition-all transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código del Cupón</label>
              <input {...register('code')} className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all" />
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

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => router.back()} className="px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95">
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios 💾'}
          </button>
        </div>
      </form>
    </div>
  );
}
