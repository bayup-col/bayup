"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Headphones, Loader2, ChevronDown, MessageSquare } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'support';
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    sender: 'support',
    text: '¡Hola! 👋 Soy parte del equipo de soporte de Bayup. ¿En qué te puedo ayudar hoy?',
    time: '',
  },
];

const QUICK_REPLIES = [
  '¿Cómo creo un producto?',
  'Tengo un problema con pedidos',
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
  supportMessages?: any[];
}) => {
  const [messages, setMessages]   = useState<Message[]>(() =>
    INITIAL_MESSAGES.map(m => ({ ...m, time: nowTime() }))
  );
  const [input, setInput]         = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isSupportOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isSupportOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const myMsg: Message = { id: Date.now(), text: text.trim(), sender: 'me', time: nowTime() };
    setMessages(prev => [...prev, myMsg]);
    setInput('');
    setIsTyping(true);

    // Simulated auto-reply
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        'Entendido, déjame revisar eso para ti 🔍',
        'Gracias por contactarnos. Un agente se unirá en breve.',
        'Recibido ✅ Estamos trabajando en tu solicitud.',
        'Claro, con gusto te ayudo. ¿Puedes darme más detalles?',
      ];
      const reply: Message = {
        id: Date.now() + 1,
        sender: 'support',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: nowTime(),
      };
      setMessages(prev => [...prev, reply]);
    }, 1400 + Math.random() * 600);
  };

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
                      <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">En línea ahora</span>
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
              {/* Info badge */}
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/80">Tiempo de respuesta promedio</p>
                  <p className="text-[11px] font-black text-[#00f2ff]">Menos de 2 minutos</p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto bg-[#f4f5f7] px-5 py-5 space-y-4" style={{ minHeight: 280 }}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'support' && (
                    <div className="h-8 w-8 rounded-xl bg-[#004d4d] flex items-center justify-center shrink-0 mt-auto shadow-sm">
                      <Headphones size={13} className="text-[#00f2ff]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] flex flex-col gap-1 ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm ${
                      msg.sender === 'me'
                        ? 'bg-[#004d4d] text-white rounded-br-sm'
                        : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-400 px-1 font-medium">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="h-8 w-8 rounded-xl bg-[#004d4d] flex items-center justify-center shrink-0 shadow-sm">
                      <Headphones size={13} className="text-[#00f2ff]" />
                    </div>
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-5 py-3.5 flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} className="h-2 w-2 rounded-full bg-gray-300"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Respuestas rápidas */}
            <div className="bg-white border-t border-gray-100 px-5 py-3 flex gap-2 overflow-x-auto shrink-0">
              {QUICK_REPLIES.map(r => (
                <button key={r} onClick={() => sendMessage(r)}
                  className="shrink-0 h-8 px-3.5 rounded-full bg-gray-50 border border-gray-200 text-[9px] font-black text-gray-500 hover:border-[#004d4d]/40 hover:text-[#004d4d] hover:bg-[#004d4d]/5 transition-all whitespace-nowrap">
                  {r}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="bg-white px-5 py-4 flex items-center gap-3 shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder="Escribe tu mensaje…"
                className="flex-1 h-11 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-[12px] font-medium text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#004d4d]/50 focus:bg-white transition-all"
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim()}
                className="h-11 w-11 rounded-2xl bg-[#004d4d] hover:bg-[#003838] flex items-center justify-center text-white transition-all shadow-md disabled:opacity-30 shrink-0">
                <Send size={15} />
              </button>
            </div>

            {/* Footer */}
            <div className="bg-white px-5 pb-4 flex items-center justify-center">
              <p className="text-[9px] font-bold text-gray-300 tracking-widest uppercase">
                Bayup Support · Cifrado de extremo a extremo
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
