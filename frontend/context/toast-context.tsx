"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container - REUBICADO AL TOP RIGHT BAJO EL HEADER */}
            <div className="fixed top-24 right-10 z-[10000] flex flex-col gap-4 pointer-events-none items-end w-full max-w-sm">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 100, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: 50 }}
                            className="pointer-events-auto w-full"
                        >
                            <div className={`
                                flex items-center gap-4 px-6 py-5 rounded-[2.2rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border-2 backdrop-blur-2xl
                                ${toast.type === 'success' ? 'bg-white/95 border-emerald-500/10' : 
                                  toast.type === 'error' ? 'bg-white/95 border-rose-500/10' : 
                                  'bg-white/95 border-[#00f2ff]/10'}
                            `}>
                                <div className={`
                                    h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                                    ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 
                                      toast.type === 'error' ? 'bg-rose-500 text-white' : 
                                      'bg-blue-500 text-white'}
                                `}>
                                    {toast.type === 'success' && <CheckCircle2 size={24} />}
                                    {toast.type === 'error' && <AlertCircle size={24} />}
                                    {toast.type === 'info' && <Info size={24} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-gray-900 leading-tight">
                                        {toast.type === 'success' ? '¡Hecho!' : 
                                         toast.type === 'error' ? 'Atención' : 
                                         'Notificación'}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 mt-1">
                                        {toast.message}
                                    </p>
                                </div>
                                <button onClick={() => removeToast(toast.id)} className="p-2 text-gray-300 hover:text-gray-900 transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};