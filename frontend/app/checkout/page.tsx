"use client";

import React, { useState } from 'react';
import { useCart } from "@/context/cart-context";
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight,
  User,
  MapPin,
  CreditCard as PaymentIcon,
  Tag,
  Info
} from "lucide-react";
import Link from 'next/link';
import { useToast } from "@/context/toast-context";
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Identificación, 2: Envío, 3: Pago

  // Mock de datos para el resumen visual solicitado
  const exampleProduct = {
    title: "Polo Verde Ícono Talla M",
    quantity: 1,
    price: 149000,
    image: "https://via.placeholder.com/150"
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      showToast("¡Pedido confirmado! Gracias por tu compra.", "success");
      clearCart();
      router.push("/");
    }, 2000);
  };

  if (items.length === 0 && !isProcessing) {
    // Si no hay items, mostraremos un estado de ejemplo para el dashboard o invitaremos a comprar
  }

  const currentItems = items.length > 0 ? items : [exampleProduct];
  const currentTotal = items.length > 0 ? total : 149000;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_450px] min-h-screen">
        
        {/* COLUMNA IZQUIERDA: FLUJO DE COMPRA */}
        <div className="p-6 md:p-12 lg:p-20 space-y-12 bg-white">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              <ArrowLeft size={14} /> Volver a la bolsa
            </Link>
            <div className="flex items-center gap-2">
                <div className="h-2 w-12 rounded-full bg-black"></div>
                <div className={`h-2 w-12 rounded-full ${step >= 2 ? 'bg-black' : 'bg-gray-100'}`}></div>
                <div className={`h-2 w-12 rounded-full ${step >= 3 ? 'bg-black' : 'bg-gray-100'}`}></div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-16">
            
            {/* SECCIÓN 1: IDENTIFICACIÓN */}
            <section className={`space-y-8 transition-all duration-500 ${step !== 1 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl">
                        <User size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">Identificación</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tus datos personales</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Correo Electrónico</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                placeholder="ejemplo@correo.com" 
                                className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                                defaultValue="pruebabayup18@yopmail.com"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                <Info size={12} /> Quizás quisiste decir: hotmail.com
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Nombre</label>
                        <input 
                            type="text" 
                            placeholder="Tu nombre" 
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                            defaultValue="Daniel"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Apellidos</label>
                        <input 
                            type="text" 
                            placeholder="Tus apellidos" 
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                            defaultValue="Quintero"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Teléfono / Móvil</label>
                        <input 
                            type="text" 
                            placeholder="300 000 0000" 
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                            defaultValue="313 890 3322"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Tipo de Documento</label>
                        <select className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none">
                            <option>Cédula de ciudadanía</option>
                            <option>Cédula de extranjería</option>
                            <option>Pasaporte</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Documento</label>
                        <input 
                            type="text" 
                            placeholder="Número de identidad" 
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                            defaultValue="1225089004"
                        />
                    </div>
                </div>

                {step === 1 && (
                    <button 
                        onClick={() => setStep(2)}
                        className="w-full h-16 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                        Ir para la Entrega <ChevronRight size={18} />
                    </button>
                )}
            </section>

            {/* SECCIÓN 2: ENVÍO */}
            <section className={`space-y-8 transition-all duration-500 ${step !== 2 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${step === 2 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <MapPin size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">Envío</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">¿Dónde entregamos tu pedido?</p>
                    </div>
                    {step > 2 && (
                        <button onClick={() => setStep(2)} className="ml-auto text-[10px] font-black uppercase tracking-widest text-[#00f2ff] hover:underline">Cambiar opciones</button>
                    )}
                </div>

                {step >= 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Departamento</label>
                            <select className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none">
                                <option>Valle del Cauca</option>
                                <option>Antioquia</option>
                                <option>Bogotá D.C.</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Municipio / Ciudad</label>
                            <select className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none">
                                <option>Cali</option>
                                <option>Palmira</option>
                                <option>Yumbo</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Dirección</label>
                            <input 
                                type="text" 
                                placeholder="Avenida, calle, carrera..." 
                                className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                                defaultValue="Avenida 12 # 45a - 12"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Información adicional</label>
                            <input 
                                type="text" 
                                placeholder="Apartamento, bloque, oficina..." 
                                className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Nombre de quien recibe</label>
                            <input 
                                type="text" 
                                placeholder="Nombre completo" 
                                className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                            />
                        </div>

                        {step === 2 && (
                            <button 
                                onClick={() => setStep(3)}
                                className="md:col-span-2 w-full h-16 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                            >
                                Continuar al Pago <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* SECCIÓN 3: PAGO */}
            <section className={`space-y-8 transition-all duration-500 ${step !== 3 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${step === 3 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <PaymentIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">Pago</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selecciona tu método de pago</p>
                    </div>
                </div>

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 border-2 border-black bg-white rounded-3xl flex flex-col gap-4 cursor-pointer relative shadow-xl">
                                <div className="flex justify-between items-center">
                                    <CreditCard size={24} />
                                    <div className="w-6 h-6 rounded-full border-4 border-black flex items-center justify-center">
                                        <div className="w-2 h-2 bg-black rounded-full" />
                                    </div>
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest">Tarjeta Débito / Crédito</span>
                            </div>
                            <div className="p-6 border-2 border-gray-100 bg-gray-50 rounded-3xl flex flex-col gap-4 cursor-pointer hover:border-gray-200 transition-all">
                                <div className="flex justify-between items-center text-gray-400">
                                    <Truck size={24} />
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest text-gray-400">Contra Entrega</span>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Número de Tarjeta</label>
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl focus:border-black outline-none transition-all font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Vencimiento</label>
                                    <input type="text" placeholder="MM / YY" className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl focus:border-black outline-none transition-all font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">CVC</label>
                                    <input type="text" placeholder="123" className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl focus:border-black outline-none transition-all font-bold" />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full h-20 bg-black text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-70"
                        >
                            {isProcessing ? (
                                <>Procesando <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                            ) : (
                                <>Finalizar Pedido <ShieldCheck size={20} /></>
                            )}
                        </button>
                    </div>
                )}
            </section>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN DE COMPRA (STIKY) */}
        <div className="bg-[#f8fafc] p-6 md:p-12 lg:p-12 border-l border-gray-100 flex flex-col h-full lg:sticky lg:top-0">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Resumen de Compra</h2>
            <span className="h-6 px-3 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black">
                {currentItems.length}
            </span>
          </div>
          
          <div className="flex-1 space-y-8">
            {currentItems.map((item, idx) => (
              <div key={idx} className="flex gap-6 group">
                <div className="h-24 w-24 bg-white rounded-3xl border border-gray-100 overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-all relative p-2">
                  <img src={item.image} className="w-full h-full object-cover rounded-2xl" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="font-black text-xs uppercase tracking-tight text-gray-900 leading-tight">{item.title}</h4>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Cantidad: {item.quantity}</p>
                  <p className="font-black text-sm text-gray-900 mt-2">
                    ${(item.price * item.quantity).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-6 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Código de Descuento</label>
                <div className="flex gap-2">
                    <input type="text" placeholder="Añadir código" className="flex-1 h-12 px-6 bg-gray-50 rounded-2xl outline-none font-bold text-xs uppercase tracking-widest focus:bg-white focus:border-gray-200 border border-transparent transition-all" />
                    <button className="h-12 px-6 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                        Aplicar
                    </button>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-gray-900">${currentTotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <span>Gastos de envío</span>
                    <span className="text-emerald-500">Gratis</span>
                </div>
                <div className="flex justify-between text-lg font-black italic tracking-tighter text-gray-900 pt-4 border-t-2 border-black">
                    <span>TOTAL</span>
                    <span className="text-2xl">${currentTotal.toLocaleString('es-CO')}</span>
                </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 py-2 px-6 bg-white rounded-full border border-gray-100 shadow-sm">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Pago 100% Seguro</span>
              </div>
              <p className="text-[9px] text-center font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                  Al finalizar tu compra aceptas nuestros <br/>
                  <span className="text-black underline cursor-pointer">términos y condiciones</span>
              </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
