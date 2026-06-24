"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Headphones, Loader2, MessageSquare, CheckCircle2, Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface TicketMessage {
  sender: 'usuario' | 'soporte';
  text: string;
  time: string;
}

interface Ticket {
  id: string;
  title: string;
  status: 'Abierto' | 'En proceso' | 'Resuelto';
  messages: TicketMessage[];
}

const QUICK_REPLIES = [
  '¿Cómo creo un producto?',
  'Tengo un problema con un pedido',
  '¿Cómo configuro mi tienda?',
  'Quiero cancelar mi plan',
];

function nowTime() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export const SupportWidget = ({
  isSupportOpen,
  setIsSupportOpen,
}: {
  isSupportOpen: boolean;
  setIsSupportOpen: (v: boolean) => void;
}) => {
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const loadTickets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/support/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const open = Array.isArray(data) ? data.find((t: Ticket) => t.status !== 'Resuelto') : null;
        setTicket(open || null);
      }
    } catch {}
  }, [token, apiBase]);

  useEffect(() => {
    if (isSupportOpen) {
      setIsLoading(true);
      loadTickets().finally(() => setIsLoading(false));
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isSupportOpen, loadTickets]);

  // Refresca por si soporte respondió, mientras el panel esté abierto
  useEffect(() => {
    if (!isSupportOpen || !ticket || ticket.status === 'Resuelto') return;
    const interval = setInterval(loadTickets, 15000);
    return () => clearInterval(interval);
  }, [isSupportOpen, ticket, loadTickets]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !token || isSending) return;
    setIsSending(true);
    setInput('');
    try {
      if (!ticket) {
        const res = await fetch(`${apiBase}/support/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: text.trim().slice(0, 80), text: text.trim() }),
        });
        if (res.ok) setTicket(await res.json());
      } else {
        const res = await fetch(`${apiBase}/support/tickets/${ticket.id}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: text.trim() }),
        });
        if (res.ok) setTicket(await res.json());
      }
    } catch {}
    setIsSending(false);
  };

  const startNewConversation = () => setTicket(null);

  return (
    <AnimatePresence>
      {isSupportOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9990]"
            onClick={() => setIsSupportOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-6 right-6 z-[9999] w-[440px] flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
          >
            {/* Header */}
            <div className="bg-[#001a1a] px-6 py-5 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#004d4d] to-[#00706e] flex items-center justify-center shadow-lg shadow-[#004d4d]/30">
                    <Headphones size={20} className="text-[#00f2ff]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-white tracking-wide">Soporte Bayup</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">
                        {ticket ? ticket.status : 'Nueva conversación'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsSupportOpen(false)}
                  className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/80">{ticket ? ticket.title : 'Cuéntanos en qué te ayudamos'}</p>
                  <p className="text-[11px] font-black text-[#00f2ff]">Un agente real revisará tu mensaje</p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto bg-[#f4f5f7] px-5 py-5 space-y-4" style={{ minHeight: 280 }}>
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-gray-300" />
                </div>
              ) : !ticket ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#004d4d]/10 flex items-center justify-center">
                    <Headphones size={20} className="text-[#004d4d]" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-500">¡Hola! Escribe tu mensaje y un asesor de Bayup te responderá por aquí.</p>
                </div>
              ) : (
                ticket.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.sender === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'soporte' && (
                      <div className="h-8 w-8 rounded-xl bg-[#004d4d] flex items-center justify-center shrink-0 mt-auto shadow-sm">
                        <Headphones size={13} className="text-[#00f2ff]" />
                      </div>
                    )}
                    <div className={`max-w-[80%] flex flex-col gap-1 ${msg.sender === 'usuario' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm ${
                        msg.sender === 'usuario'
                          ? 'bg-[#004d4d] text-white rounded-br-sm'
                          : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-400 px-1 font-medium">{msg.time}</span>
                    </div>
                  </div>
                ))
              )}

              {ticket?.status === 'Resuelto' && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ticket resuelto</span>
                  </div>
                  <button onClick={startNewConversation}
                    className="flex items-center gap-2 h-9 px-4 rounded-full bg-[#004d4d]/5 border border-[#004d4d]/15 text-[10px] font-black text-[#004d4d] hover:bg-[#004d4d]/10 transition-all">
                    <Plus size={13} /> Iniciar nueva conversación
                  </button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Respuestas rápidas (solo antes de crear el ticket) */}
            {!ticket && (
              <div className="bg-white border-t border-gray-100 px-5 py-3 flex gap-2 overflow-x-auto shrink-0">
                {QUICK_REPLIES.map(r => (
                  <button key={r} onClick={() => sendMessage(r)} disabled={isSending}
                    className="shrink-0 h-8 px-3.5 rounded-full bg-gray-50 border border-gray-200 text-[9px] font-black text-gray-500 hover:border-[#004d4d]/40 hover:text-[#004d4d] hover:bg-[#004d4d]/5 transition-all whitespace-nowrap disabled:opacity-50">
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            {ticket?.status !== 'Resuelto' && (
              <div className="bg-white px-5 py-4 flex items-center gap-3 shrink-0">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder="Escribe tu mensaje…"
                  disabled={isSending}
                  className="flex-1 h-11 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-[12px] font-medium text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#004d4d]/50 focus:bg-white transition-all disabled:opacity-50"
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || isSending}
                  className="h-11 w-11 rounded-2xl bg-[#004d4d] hover:bg-[#003838] flex items-center justify-center text-white transition-all shadow-md disabled:opacity-30 shrink-0">
                  {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="bg-white px-5 pb-4 flex items-center justify-center">
              <p className="text-[9px] font-bold text-gray-300 tracking-widest uppercase">
                Bayup Support
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
