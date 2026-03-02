"use client";

import React, { useState, useEffect } from 'react';
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
  Info,
  Lock
} from "lucide-react";
import Link from 'next/link';
import { useToast } from "@/context/toast-context";
import { useRouter } from 'next/navigation';

// Declaración para el objeto Wompi global que inyecta el script
declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Identificación, 2: Envío, 3: Pago
  
  // Estados de formulario (MVP)
  const [customerData, setCustomerData] = useState({
    email: "pruebabayup18@yopmail.com",
    name: "Daniel",
    lastName: "Quintero",
    phone: "313 890 3322",
    docType: "CC",
    docNumber: "1225089004"
  });

  // Cargar el script de Wompi al montar
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleWompiPayment = async () => {
    setIsProcessing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const currentTotal = items.length > 0 ? total : 149000;
      
      // 1. Obtener configuración y firma desde nuestro Backend
      const res = await fetch(`${apiUrl}/admin/payments/wompi-config?amount=${currentTotal}`);
      if (!res.ok) throw new Error("No se pudo obtener la configuración de pago");
      
      const config = await res.json();

      // 2. Configurar y abrir el Widget de Wompi
      const checkout = new window.WidgetCheckout({
        currency: config.currency,
        amountInCents: config.amount_in_cents,
        reference: config.reference,
        publicKey: config.public_key,
        signature: { integrity: config.signature },
        redirectUrl: config.redirect_url,
        customerData: {
          email: customerData.email,
          fullName: `${customerData.name} ${customerData.lastName}`,
          phoneNumber: customerData.phone.replace(/\s/g, ''),
          phoneNumberPrefix: '+57'
        }
      });

      checkout.open(async (result: any) => {
        const transaction = result.transaction;
        if (transaction.status === 'APPROVED') {
          // 3. Registrar la orden oficialmente en nuestro Backend (Público)
          try {
            // Extraer el owner_id de la tienda (esto lo obtenemos del contexto o de la URL del shop)
            // Para el MVP, si no viene en el carrito, intentamos obtenerlo de los metadatos o config.
            const tenant_id = items[0]?.owner_id || items[0]?.tenant_id || "79523a4a-4aad-4c95-a7eb-674af0271f34";
            
            await fetch(`${apiUrl}/public/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenant_id: tenant_id,
                customer_name: `${customerData.name} ${customerData.lastName}`,
                customer_email: customerData.email,
                customer_phone: customerData.phone,
                items: items.map(i => ({
                  product_id: i.id,
                  quantity: i.quantity,
                  price: i.price,
                  variant_info: i.variant || ""
                })),
                payment_status: "paid",
                payment_method: "wompi"
              })
            });
            
            showToast("¡Pago aprobado! Tu pedido está en camino.", "success");
            clearCart();
            router.push("/dashboard/orders");
          } catch (orderErr) {
            console.error("Error al registrar orden:", orderErr);
            showToast("Pago aprobado, pero hubo un error al registrar el pedido. Contacta a soporte.", "error");
          }
        } else {
          showToast(`Estado del pago: ${transaction.status}`, "info");
        }
        setIsProcessing(false);
      });

    } catch (error) {
      console.error("Wompi Error:", error);
      showToast("Error al iniciar el proceso de pago", "error");
      setIsProcessing(false);
    }
  };

  const currentItems = items.length > 0 ? items : [];
  const currentTotal = items.length > 0 ? total : 0;

  if (items.length === 0 && !isProcessing) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
              <div className="h-20 w-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6">
                  <Tag size={40} />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic mb-2 text-gray-900">Tu bolsa está vacía</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 text-center max-w-xs">
                  Agrega algunos productos premium para continuar con el pago seguro.
              </p>
              <Link href="/" className="px-10 py-5 bg-black text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                  Explorar Tienda
              </Link>
          </div>
      );
  }

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
                                value={customerData.email}
                                onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                                placeholder="ejemplo@correo.com" 
                                className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Nombre</label>
                        <input 
                            type="text" 
                            value={customerData.name}
                            onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                            placeholder="Tu nombre" 
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Apellidos</label>
                        <input 
                            type="text" 
                            value={customerData.lastName}
                            onChange={(e) => setCustomerData({...customerData, lastName: e.target.value})}
                            placeholder="Tus apellidos" 
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Teléfono / Móvil</label>
                        <input 
                            type="text" 
                            value={customerData.phone}
                            onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                            placeholder="300 000 0000" 
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Tipo de Documento</label>
                        <select 
                            value={customerData.docType}
                            onChange={(e) => setCustomerData({...customerData, docType: e.target.value})}
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none"
                        >
                            <option value="CC">Cédula de ciudadanía</option>
                            <option value="CE">Cédula de extranjería</option>
                            <option value="PP">Pasaporte</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Documento</label>
                        <input 
                            type="text" 
                            value={customerData.docNumber}
                            onChange={(e) => setCustomerData({...customerData, docNumber: e.target.value})}
                            placeholder="Número de identidad" 
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-[2rem] outline-none transition-all font-bold text-gray-900"
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
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">Pago Seguro</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Respaldo total por Wompi Bancolombia</p>
                    </div>
                </div>

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-8 bg-[#004d4d]/5 rounded-[2.5rem] border-2 border-dashed border-[#004d4d]/20 flex flex-col items-center text-center gap-6">
                            <div className="h-20 w-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-[#004d4d]">
                                <ShieldCheck size={40} />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 uppercase italic tracking-tighter">Pasarela Wompi</h4>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    Aceptamos Tarjetas, PSE, Nequi y Corresponsal Bancolombia
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleWompiPayment}
                            disabled={isProcessing}
                            className="w-full h-20 bg-black text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-70"
                        >
                            {isProcessing ? (
                                <>Cargando Pasarela <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                            ) : (
                                <>Pagar ${currentTotal.toLocaleString('es-CO')} <Lock size={20} /></>
                            )}
                        </button>
                    </div>
                )}
            </section>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN DE COMPRA */}
        <div className="bg-[#f8fafc] p-6 md:p-12 lg:p-12 border-l border-gray-100 flex flex-col h-full lg:sticky lg:top-0">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Resumen</h2>
            <span className="h-6 px-3 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black">
                {currentItems.length}
            </span>
          </div>
          
          <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
            {currentItems.map((item: any, idx) => (
              <div key={idx} className="flex gap-6 group">
                <div className="h-24 w-24 bg-white rounded-3xl border border-gray-100 overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-all relative p-2">
                  <img src={item.image || item.image_url?.[0]} className="w-full h-full object-cover rounded-2xl" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="font-black text-xs uppercase tracking-tight text-gray-900 leading-tight">{item.name || item.title}</h4>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Cantidad: {item.quantity}</p>
                  <p className="font-black text-sm text-gray-900 mt-2">
                    ${(item.price * item.quantity).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-4 pt-6 border-t-2 border-black">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-gray-900">${currentTotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-lg font-black italic tracking-tighter text-gray-900 pt-2">
                    <span>TOTAL</span>
                    <span className="text-2xl">${currentTotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex items-center gap-3 py-2 px-6 bg-white rounded-full border border-gray-100 shadow-sm mt-4">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Cifrado Bancario SSL</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
