"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, DollarSign, CheckCircle2 } from "lucide-react";

interface LiquidationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  amount: string;
}

export default function LiquidationConfirmModal({ isOpen, onClose, onConfirm, memberName, amount }: LiquidationConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-8 text-center space-y-6">
                <div className="h-20 w-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                    <AlertCircle size={40} />
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Confirmar Liquidación</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        ¿Estás seguro de que deseas procesar el pago para <span className="text-[#004D4D] font-bold">{memberName}</span> por valor de <span className="text-emerald-600 font-bold">{amount}</span>?
                    </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 text-left">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500">
                        <CheckCircle2 size={20}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Acción Irreversible</p>
                        <p className="text-[11px] font-bold text-slate-600">Se generará el registro de pago inmediato.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <button 
                        onClick={onClose}
                        className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className="py-4 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#004d4d]/20 hover:bg-black transition-all"
                    >
                        Confirmar Pago
                    </button>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
