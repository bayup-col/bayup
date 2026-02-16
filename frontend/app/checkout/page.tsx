"use client";

import React, { useState } from 'react';
import { useCart } from "@/context/cart-context";
import { ArrowLeft, CreditCard, Truck, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from 'next/link';
import { useToast } from "@/context/toast-context";
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      showToast("¡Pedido confirmado! Gracias por tu compra.", "success");
      clearCart();
      router.push("/");
    }, 2000);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-4">Tu carrito está vacío</h1>
        <Link href="/" className="px-8 py-3 bg-black text-white rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] min-h-screen">
        
        {/* IZQUIERDA: FORMULARIOS */}
        <div className="p-8 lg:p-16 space-y-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">
            <ArrowLeft size={16} /> Volver a la tienda
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs">1</span>
                Información de Envío
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="email" placeholder="Correo Electrónico" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium" />
                <input type="text" placeholder="Teléfono Móvil" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium" />
                <input type="text" placeholder="Nombre Completo" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium md:col-span-2" />
                <input type="text" placeholder="Dirección de Entrega" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium md:col-span-2" />
                <input type="text" placeholder="Ciudad" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium" />
                <input type="text" placeholder="Departamento" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs">2</span>
                Método de Pago
              </h2>
              <div className="space-y-3">
                <div className="p-4 border-2 border-black bg-gray-50 rounded-xl flex items-center gap-4 cursor-pointer relative">
                  <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-black rounded-full" />
                  </div>
                  <CreditCard size={20} />
                  <span className="font-bold text-sm uppercase tracking-wide">Tarjeta de Crédito / Débito</span>
                  <div className="absolute right-4 flex gap-2">
                    <div className="h-6 w-10 bg-white rounded shadow-sm border border-gray-200" />
                    <div className="h-6 w-10 bg-white rounded shadow-sm border border-gray-200" />
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl flex items-center gap-4 cursor-pointer hover:border-gray-400 transition-all opacity-60">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  <Truck size={20} />
                  <span className="font-bold text-sm uppercase tracking-wide">Pago Contra Entrega</span>
                </div>
              </div>
              
              <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                <input type="text" placeholder="Número de Tarjeta" className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM / YY" className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium" />
                  <input type="text" placeholder="CVC" className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium" />
                </div>
                <input type="text" placeholder="Nombre en la Tarjeta" className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium" />
              </div>
            </div>
          </div>
        </div>

        {/* DERECHA: RESUMEN */}
        <div className="bg-gray-50 p-8 lg:p-16 border-l border-gray-200 flex flex-col h-full sticky top-0">
          <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 mb-8">Resumen del Pedido</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-8 max-h-[50vh]">
            {items.map((item) => (
              <div key={`${item.id}-${item.variant}`} className="flex gap-4">
                <div className="h-20 w-20 bg-white rounded-xl border border-gray-200 overflow-hidden shrink-0 relative">
                  <img src={item.image} className="w-full h-full object-cover" />
                  <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-bl-lg">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-2">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.variant || 'Estándar'}</p>
                </div>
                <p className="font-bold text-sm text-gray-900">
                  ${(item.price * item.quantity).toLocaleString('es-CO')}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span>Subtotal</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span>Envío</span>
              <span>Gratis</span>
            </div>
            <div className="flex justify-between text-xl font-black text-gray-900 pt-4 border-t border-gray-200">
              <span>Total</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full mt-8 py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>Procesando <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
            ) : (
              <>Pagar Ahora <ShieldCheck size={18} /></>
            )}
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <CheckCircle2 size={14} className="text-green-500" />
            Pago 100% Seguro y Encriptado
          </div>
        </div>
      </div>
    </div>
  );
}
