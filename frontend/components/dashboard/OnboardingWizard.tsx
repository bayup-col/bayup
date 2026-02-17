"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Rocket, 
    CheckCircle2, 
    ArrowRight, 
    Store, 
    MessageCircle, 
    Package, 
    Sparkles,
    ShieldCheck,
    Bot,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingWizardProps {
    isOpen: boolean;
    onComplete: () => void;
}

export default function OnboardingWizard({ isOpen, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const steps = [
        {
            id: 1,
            title: "Identidad de Marca",
            desc: "Dinos el nombre de tu empresa y sube tu logo para personalizar tu tienda.",
            icon: <Store className="text-cyan" size={32} />,
            action: () => router.push('/dashboard/settings/general'),
            btnText: "Configurar Identidad"
        },
        {
            id: 2,
            title: "Conexión Vital",
            desc: "Vincula tu WhatsApp para automatizar tus ventas y pedidos reales.",
            icon: <MessageCircle className="text-emerald-400" size={32} />,
            action: () => router.push('/dashboard/chats'),
            btnText: "Vincular WhatsApp"
        },
        {
            id: 3,
            title: "Tu Primer Activo",
            desc: "Crea tu primer producto para que el mundo pueda empezar a comprarte.",
            icon: <Package className="text-amber-400" size={32} />,
            action: () => router.push('/dashboard/products/new'),
            btnText: "Crear Producto"
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-10">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-[#001A1A]/95 backdrop-blur-2xl" 
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-3xl border border-white/20 overflow-hidden flex flex-col md:flex-row"
            >
                {/* LADO IZQUIERDO: STATUS AI */}
                <div className="w-full md:w-96 bg-[#004D4D] p-12 text-white flex flex-col justify-between shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#00f2ff] rounded-full blur-[80px]" />
                    </div>
                    
                    <div className="relative z-10 space-y-12">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 text-cyan shadow-xl">
                                <Bot size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tighter leading-none">Bayt <span className="text-cyan">Onboarding</span></h3>
                                <p className="text-cyan/60 text-[9px] font-black tracking-[0.2em] mt-2 uppercase">Asistente de lanzamiento</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {steps.map((s) => (
                                <div key={s.id} className={`flex items-center gap-4 transition-all duration-500 ${step >= s.id ? 'opacity-100' : 'opacity-30'}`}>
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-xs border-2 ${step > s.id ? 'bg-cyan border-cyan text-[#004D4D]' : 'border-white/20'}`}>
                                        {step > s.id ? <CheckCircle2 size={18} /> : s.id}
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-widest">{s.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                        <p className="text-[9px] font-black text-cyan tracking-[0.2em] mb-2 uppercase text-center">Progreso Global</p>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                                animate={{ width: `${(step / steps.length) * 100}%` }}
                                className="h-full bg-cyan shadow-[0_0_10px_#00f2ff]" 
                            />
                        </div>
                    </div>
                </div>

                {/* LADO DERECHO: ACCIÓN DINÁMICA */}
                <div className="flex-1 p-12 md:p-20 bg-white relative flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-10"
                        >
                            <div className="space-y-6">
                                <div className="h-20 w-20 rounded-[2rem] bg-gray-50 flex items-center justify-center shadow-inner">
                                    {steps[step-1].icon}
                                </div>
                                <h2 className="text-5xl font-black text-[#001A1A] tracking-tighter italic uppercase leading-tight">
                                    {steps[step-1].title}
                                </h2>
                                <p className="text-xl font-medium text-gray-500 leading-relaxed italic max-w-lg">
                                    &quot;{steps[step-1].desc}&quot;
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button 
                                    onClick={() => {
                                        steps[step-1].action();
                                        if (step < 3) setStep(step + 1);
                                        else onComplete();
                                    }}
                                    className="flex-1 py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 group"
                                >
                                    {steps[step-1].btnText} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform text-cyan" />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (step < 3) setStep(step + 1);
                                        else onComplete();
                                    }}
                                    className="px-10 py-6 bg-gray-50 text-gray-400 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-gray-100 transition-all"
                                >
                                    Omitir por ahora
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center opacity-40">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-[#004D4D]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Protocolo Bayup Start v2.0</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">InteractiveUP Intel</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
