"use client";

import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  CreditCard as PaymentIcon, 
  ChevronRight, 
  ShieldCheck, 
  Info, 
  ArrowLeft,
  Settings2,
  Trash2,
  Edit3,
  CreditCard,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CheckoutStudio = ({ props, updateProps, isPreview = false }: any) => {
  const [activeStep, setActiveStep] = useState(1);
  const { 
    showIdentification = true, 
    showShipping = true, 
    showPayment = true, 
    showSummary = true,
    themeColor = "#000000",
    accentColor = "#00f2ff",
    borderRadius = 32,
    fontFamily = "font-black"
  } = props;

  // Mock de producto para visualización
  const exampleProduct = {
    title: "Polo Verde Ícono Talla M",
    quantity: 1,
    price: 149000,
    image: "https://via.placeholder.com/150"
  };

  const SectionHeader = ({ icon: Icon, title, subtitle, step, active }: any) => (
    <div className={cn(
        "flex items-center gap-4 transition-all duration-500",
        !active && "opacity-40 grayscale blur-[0.5px]"
    )}>
      <div 
        className="h-12 w-12 flex items-center justify-center shadow-xl transition-all"
        style={{ 
            backgroundColor: active ? themeColor : '#f3f4f6', 
            color: active ? '#ffffff' : '#9ca3af',
            borderRadius: borderRadius / 2 
        }}
      >
        <Icon size={20} />
      </div>
      <div>
        <h2 className={cn("text-2xl uppercase italic tracking-tighter text-gray-900", fontFamily)}>{title}</h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{subtitle}</p>
      </div>
      {!isPreview && (
        <button className="ml-auto p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all">
            <Settings2 size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px]">
        
        {/* COLUMNA IZQUIERDA: FORMULARIOS */}
        <div className="p-8 md:p-12 space-y-12 bg-white">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-300">
              <ArrowLeft size={12} /> Volver a la bolsa
            </div>
            <div className="flex gap-1.5">
                {[1, 2, 3].map(s => (
                    <div 
                        key={s} 
                        className="h-1.5 w-8 rounded-full transition-all duration-500"
                        style={{ backgroundColor: activeStep >= s ? themeColor : '#f3f4f6' }}
                    />
                ))}
            </div>
          </div>

          <div className="space-y-16 max-w-xl mx-auto">
            
            {/* IDENTIFICACIÓN */}
            {showIdentification && (
                <div className="space-y-8">
                    <SectionHeader 
                        icon={User} 
                        title="Identificación" 
                        subtitle="Tus datos personales" 
                        step={1} 
                        active={activeStep === 1}
                    />
                    
                    {activeStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="md:col-span-2 space-y-2">
                                <div className="h-14 w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] flex items-center px-6 text-gray-400 text-xs font-bold italic">
                                    pruebabayup18@yopmail.com
                                    <div className="ml-auto flex items-center gap-2 text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                        <Info size={10} /> Quizás quisiste decir: hotmail.com
                                    </div>
                                </div>
                            </div>
                            <div className="h-14 bg-gray-50 rounded-[1.5rem] px-6 flex items-center text-xs font-bold text-gray-900">Daniel</div>
                            <div className="h-14 bg-gray-50 rounded-[1.5rem] px-6 flex items-center text-xs font-bold text-gray-900">Quintero</div>
                            <div className="h-14 bg-gray-50 rounded-[1.5rem] px-6 flex items-center text-xs font-bold text-gray-900">313 890 3322</div>
                            <div className="h-14 bg-gray-50 rounded-[1.5rem] px-6 flex items-center text-xs font-bold text-gray-900">Cédula de ciudadanía</div>
                            <div className="md:col-span-2 h-14 bg-gray-50 rounded-[1.5rem] px-6 flex items-center text-xs font-bold text-gray-900">1225089004</div>
                            
                            <button 
                                onClick={() => setActiveStep(2)}
                                className="md:col-span-2 h-14 w-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02]"
                                style={{ backgroundColor: themeColor, borderRadius: borderRadius / 2 }}
                            >
                                Ir para la Entrega <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ENVÍO */}
            {showShipping && (
                <div className="space-y-8">
                    <SectionHeader 
                        icon={MapPin} 
                        title="Envío" 
                        subtitle="¿A dónde enviamos?" 
                        step={2} 
                        active={activeStep === 2}
                    />
                    
                    {activeStep === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="h-14 bg-gray-50 rounded-[1.5rem] px-6 flex items-center text-xs font-bold text-gray-900 italic">Valle del Cauca</div>
                            <div className="h-14 bg-gray-50 rounded-[1.5rem] px-6 flex items-center text-xs font-bold text-gray-900 italic">Cali</div>
                            <div className="md:col-span-2 h-14 bg-gray-50 rounded-[1.5rem] px-6 flex items-center text-xs font-bold text-gray-900 italic">Avenida 12 # 45a - 12</div>
                            
                            <button 
                                onClick={() => setActiveStep(3)}
                                className="md:col-span-2 h-14 w-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-black/10 transition-all hover:scale-[1.02]"
                                style={{ backgroundColor: themeColor, borderRadius: borderRadius / 2 }}
                            >
                                Continuar al Pago <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* PAGO */}
            {showPayment && (
                <div className="space-y-8">
                    <SectionHeader 
                        icon={PaymentIcon} 
                        title="Pago" 
                        subtitle="Método de pago" 
                        step={3} 
                        active={activeStep === 3}
                    />

                    {activeStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border-2 border-black rounded-2xl flex flex-col gap-2">
                                    <CreditCard size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Tarjeta</span>
                                </div>
                                <div className="p-4 border-2 border-gray-100 rounded-2xl flex flex-col gap-2 text-gray-300">
                                    <Truck size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Entrega</span>
                                </div>
                             </div>
                             
                             <button 
                                className="h-16 w-full flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all hover:scale-[1.02]"
                                style={{ backgroundColor: themeColor, borderRadius: borderRadius / 1.5 }}
                            >
                                Finalizar Compra <ShieldCheck size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN */}
        {showSummary && (
            <div className="bg-gray-50/50 p-8 border-l border-gray-100 flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                    <h2 className={cn("text-xl uppercase italic tracking-tighter text-gray-900", fontFamily)}>Resumen</h2>
                    <span className="h-5 px-2 bg-black text-white rounded-full flex items-center justify-center text-[8px] font-black">1</span>
                </div>

                <div className="flex-1 space-y-6">
                    <div className="flex gap-4">
                        <div className="h-16 w-16 bg-white rounded-2xl border border-gray-100 p-1 shrink-0 shadow-sm">
                            <div className="w-full h-full bg-gray-100 rounded-xl" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <h4 className="text-[9px] font-black uppercase tracking-tight text-gray-900">{exampleProduct.title}</h4>
                            <p className="text-[10px] font-black text-gray-900 mt-1">$149.000</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
                        <span>Subtotal</span>
                        <span className="text-gray-900">$149.000</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
                        <span>Envío</span>
                        <span className="text-emerald-500">Gratis</span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t-2 border-black">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Total</span>
                        <span className="text-2xl font-black italic tracking-tighter text-gray-900">$149.000</span>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 py-1.5 px-4 bg-white rounded-full border border-gray-100 shadow-sm">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Pago Seguro</span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
