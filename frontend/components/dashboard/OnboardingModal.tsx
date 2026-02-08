"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Rocket, 
    ChevronRight, 
    CheckCircle2, 
    Store, 
    Package, 
    MessageSquare, 
    Zap,
    X,
    Bot,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnboardingModal({ isOpen, onClose, onComplete }: { isOpen: boolean, onClose: () => void, onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const router = useRouter();

    const steps = [
        {
            id: 1,
            title: "Bienvenido a la Elite",
            description: "Has iniciado tu camino hacia la digitalización masiva. Bayt AI te guiará para configurar tu ecosistema en menos de 2 minutos.",
            icon: <Bot size={48} className="text-[#00f2ff]" />,
            button: "Siguiente Paso",
            action: () => setStep(2)
        },
        {
            id: 2,
            title: "Identidad de Marca",
            description: "Define el nombre y el link único de tu tienda. Este será el acceso directo para tus clientes en Instagram y WhatsApp.",
            icon: <Store size={48} className="text-[#00f2ff]" />,
            button: "Configurar Link",
            action: () => {
                onClose();
                router.push('/dashboard/settings/general');
            }
        },
        {
            id: 3,
            title: "Tu Primer Activo",
            description: "Sube tu primer producto con fotos reales. Un catálogo vacío no vende; dale vida a tu escaparate digital.",
            icon: <Package size={48} className="text-[#00f2ff]" />,
            button: "Subir Producto",
            action: () => {
                onClose();
                router.push('/dashboard/products/new');
            }
        }
    ];

    const currentData = steps[step - 1];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl"
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 40 }}
                    className="relative bg-white w-full max-w-2xl rounded-[4rem] shadow-[0_0_100px_rgba(0,242,255,0.1)] overflow-hidden border border-white/20"
                >
                    {/* Header con Progreso */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / steps.length) * 100}%` }}
                            className="h-full bg-[#004d4d]"
                        />
                    </div>

                    <button onClick={onClose} className="absolute top-10 right-10 text-gray-300 hover:text-gray-900 transition-colors">
                        <X size={24} />
                    </button>

                    <div className="p-16 md:p-20 text-center space-y-10">
                        <div className="flex justify-center">
                            <motion.div 
                                key={step}
                                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                className="h-32 w-32 rounded-[3rem] bg-[#004d4d] flex items-center justify-center text-white shadow-2xl shadow-[#004d4d]/20 relative"
                            >
                                {currentData.icon}
                                <div className="absolute -top-2 -right-2 h-8 w-8 bg-[#00f2ff] rounded-full flex items-center justify-center border-4 border-white">
                                    <Sparkles size={14} className="text-[#004d4d]" />
                                </div>
                            </motion.div>
                        </div>

                        <div className="space-y-4">
                            <motion.h2 
                                key={`title-${step}`}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]"
                            >
                                {currentData.title}
                            </motion.h2>
                            <motion.p 
                                key={`desc-${step}`}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-gray-500 text-lg font-medium leading-relaxed italic"
                            >
                                &quot;{currentData.description}&quot;
                            </motion.p>
                        </div>

                        <div className="pt-8">
                            <button 
                                onClick={currentData.action}
                                className="w-full py-6 bg-gray-900 text-[#00f2ff] rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-4 group"
                            >
                                {currentData.button}
                                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                            <p className="mt-6 text-[9px] font-black text-gray-300 uppercase tracking-widest">Protocolo de Activación Bayup v1.0</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
