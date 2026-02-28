"use client";

import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import { 
  Search, Send, MoreVertical, Phone, Video, Image as ImageIcon, Paperclip, Smile,
  CheckCheck, ShieldCheck, Activity, MessageSquare, Bot, Globe, ChevronRight, X, Loader2,
  DollarSign, AlertCircle, TrendingUp, TrendingDown, UserCheck, Zap, Clock, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiRequest } from '@/lib/api';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import { generateChatsPDF } from '@/lib/chats-report';

const AnimatedNumber = memo(({ value, type = 'simple' }: { value: number, type?: 'currency' | 'simple' | 'percentage' | 'time' }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return Math.round(current) + "%";
        if (type === 'time') return Math.round(current) + " min";
        if (type === 'currency') return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
        return Math.round(current).toLocaleString();
    });
    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span>{display}</motion.span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

const PremiumCard = ({ children, className = "", border = true }: { children: React.ReactNode, className?: string, border?: boolean }) => (
    <div className={`rounded-[2.5rem] ${border ? 'border border-white/80' : ''} transition-all duration-500 relative overflow-hidden isolate ${className}`}>
        <div className="h-full relative z-[2]">{children}</div>
    </div>
);

const AuroraMetricCard = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
    <div className="relative group cursor-pointer h-full perspective-1000" onClick={onClick}>
        <div className="absolute inset-0 -m-[2px] rounded-[3rem] overflow-hidden pointer-events-none z-0">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ willChange: 'transform' }} className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,#00F2FF_20deg,#10B981_40deg,#9333EA_60deg,transparent_80deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-700 blur-[8px] transform-gpu" />
        </div>
        <div className="relative z-10 h-full transform-gpu">{children}</div>
    </div>
);

const CHANNEL_CONFIG = {
  instagram: { label: 'Instagram', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', icon: <ImageIcon size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png' },
  facebook: { label: 'Facebook', color: 'bg-blue-600', icon: <Activity size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png' },
  whatsapp: { label: 'WhatsApp', color: 'bg-emerald-500', icon: <MessageSquare size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/2048px-WhatsApp.svg.png' },
  web: { label: 'Canal Web', color: 'bg-[#004d4d]', icon: <Globe size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Android_O_Preview_Icon.png' }
};

export default function MensajesPage() {
  const { token, userEmail } = useAuth();
  const { showToast } = useToast();
  
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChats = useCallback(async () => {
      if (!token) return;
      try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const res = await fetch(`${apiBase}/admin/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
              const data = await res.json();
              const mapped = data.map((m: any) => ({
                  id: m.id, name: m.customer_name, email: m.customer_email, phone: m.customer_phone,
                  lastMsg: m.message, time: new Date(m.created_at).toLocaleDateString(),
                  unread: m.status === 'unread' ? 1 : 0, channel: 'web'
              }));
              setChats(mapped);
          }
      } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
      const fetchConversation = async () => {
          if (!selectedChatId || !token) return;
          setIsMessagesLoading(true);
          try {
              const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
              const res = await fetch(`${apiBase}/admin/messages/${selectedChatId}`, { headers: { 'Authorization': `Bearer ${token}` } });
              if (res.ok) {
                  const data = await res.json();
                  setChatMessages(data.map((m: any) => ({
                      id: m.id, body: m.message, fromMe: m.sender_type === 'admin',
                      time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  })));
                  await fetch(`${apiBase}/admin/messages/${selectedChatId}?status=read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
                  setChats(prev => prev.map(c => c.id === selectedChatId ? {...c, unread: 0} : c));
              }
          } catch (e) { console.error(e); } finally { setIsMessagesLoading(false); }
      };
      fetchConversation();
  }, [selectedChatId, token]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatMessages]);

  const handleSendMessage = async () => {
      if (!selectedChatId || !message.trim()) return;
      const text = message;
      const tempId = Math.random().toString();
      setChatMessages(prev => [...prev, { id: tempId, body: text, fromMe: true, time: 'ahora' }]);
      setMessage("");
      try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const currentChat = chats.find(c => c.id === selectedChatId);
          await fetch(`${apiBaseBase || apiBase}/admin/messages`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  customer_name: currentChat?.name, customer_email: currentChat?.email,
                  customer_phone: currentChat?.phone, message: text, sender_type: 'admin', status: 'read'
              })
          });
      } catch (e) { showToast("Error al enviar", "error"); }
  };

  const kpis = [
    { label: "Consultas Web", value: chats.length, icon: <Activity size={24}/>, color: "text-[#004d4d]", bg: "bg-[#004d4d]/5", trend: "Buzón", details: [{ l: 'LEÍDOS', v: `${chats.filter(c => c.unread === 0).length}`, icon: <UserCheck size={10}/> }, { l: 'SIN LEER', v: `${chats.filter(c => c.unread > 0).length}`, icon: <Zap size={10}/> }, { l: 'CANAL', v: 'ACTIVO', icon: <Globe size={10}/> }], advice: 'Tus clientes web prefieren preguntar antes de comprar. Mantener el buzón en cero aumenta tu conversión un 25%.' },
    { label: "Tiempo respuesta", value: 12, icon: <Clock size={24}/>, color: "text-amber-600", bg: "bg-amber-50", trend: "V1.0", type: 'time', details: [{ l: 'BOGOTÁ', v: '8m', icon: <TrendingUp size={10}/> }, { l: 'MEDELLÍN', v: '15m', icon: <TrendingUp size={10}/> }, { l: 'META', v: '5m', icon: <Target size={10}/> }], advice: 'Responder en menos de 5 minutos multiplica por 3 las probabilidades de cerrar la venta.' },
    { label: "Conversión Web", value: 18, icon: <Target size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Good", type: 'percentage', details: [{ l: 'VENTAS', v: '12', icon: <ShoppingBag size={10}/> }, { l: 'VALOR', v: '$450k', icon: <DollarSign size={10}/> }, { l: 'ROI', v: '4.2x', icon: <TrendingUp size={10}/> }], advice: 'Tu tasa de conversión de chat es alta. Sugiero crear un cupón exclusivo para cerrar chats indecisos.' },
    { label: "Tickets hoy", value: chats.filter(c => c.unread > 0).length, icon: <Zap size={24}/>, color: "text-[#00f2ff]", bg: "bg-cyan-50", trend: "Pendientes", details: [{ l: 'URGENTE', v: '2', icon: <AlertCircle size={10}/> }, { l: 'SOPORTE', v: '1', icon: <MessageSquare size={10}/> }, { l: 'PREVENTA', v: `${chats.filter(c => c.unread > 0).length}`, icon: <Zap size={10}/> }], advice: 'Tienes mensajes pendientes. Un retraso largo se percibe como falta de seriedad en la marca.' }
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
            <div>
                <div className="flex items-center gap-3 mb-2"><div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" /><span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic uppercase">Mensajería Directa Web</span></div>
                <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-[1.4] text-[#001A1A] py-2 px-1 overflow-visible"><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d] inline-block pb-4 pr-10">Mensajes Web</span></h1>
                <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">Gestiona las consultas de tus clientes desde tu tienda online. 🌐</p>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {kpis.map((kpi, i) => (
                <div key={i}><AuroraMetricCard onClick={() => setSelectedMetric(kpi)}><PremiumCard border={false} className="p-8 h-full bg-white/80 backdrop-blur-2xl shadow-none"><div className="flex justify-between items-start mb-6"><div className={`h-14 w-14 rounded-2xl flex items-center justify-center border border-white/50 ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div><div className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black tracking-wider text-gray-400">{kpi.trend}</div></div><div><p className="text-[10px] font-black text-gray-400 tracking-[0.2em] mb-1.5">{kpi.label}</p><h3 className="text-3xl font-black text-gray-900 tracking-tighter italic"><AnimatedNumber value={kpi.value} type={kpi.type as any} /></h3></div></PremiumCard></AuroraMetricCard></div>
            ))}
        </div>

        <div className="h-[800px] px-4 shrink-0">
            <div className="h-full bg-white border border-gray-200 rounded-[3rem] shadow-2xl flex overflow-hidden isolate relative">
                <div className="w-[350px] border-r border-gray-100 flex flex-col bg-[#F0F2F5] shrink-0">
                    <div className="h-16 px-4 flex items-center justify-between shrink-0"><div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#004d4d] to-cyan flex items-center justify-center text-white font-black text-xs">{userEmail?.charAt(0).toUpperCase()}</div><div className="flex items-center gap-4 text-gray-500"><Activity size={20}/><MessageSquare size={20}/><MoreVertical size={20}/></div></div>
                    <div className="px-3 py-2 shrink-0"><div className="bg-white rounded-xl flex items-center px-4 gap-4 h-9 shadow-sm"><Search size={16} className="text-gray-400"/><input placeholder="Busca un chat..." className="flex-1 bg-transparent border-none text-[13px] outline-none text-gray-600 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        {chats.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (<div className="py-20 text-center space-y-4 px-10"><div className="h-20 w-20 bg-[#F0F2F5] rounded-full flex items-center justify-center mx-auto text-gray-300"><Bot size={40}/></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin conversaciones</p></div>) : (
                            chats.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((chat) => (
                                <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`h-[72px] px-4 flex items-center gap-4 cursor-pointer border-b border-gray-50 transition-colors ${selectedChatId === chat.id ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F6]'}`}>
                                    <div className="relative shrink-0"><div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-black text-gray-400 italic">{(chat.name || '?').charAt(0)}</div><div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-white p-0.5 shadow-md"><img src={CHANNEL_CONFIG.web.logo} alt="" className="h-full w-full object-contain rounded-full" /></div></div>
                                    <div className="flex-1 min-w-0 pr-2"><div className="flex justify-between items-baseline mb-1"><h5 className="text-[15px] font-bold text-gray-900 truncate">{chat.name}</h5><span className="text-[11px] text-gray-400 font-medium">{chat.time}</span></div><p className="text-[13px] text-gray-500 truncate font-medium">{chat.lastMsg}</p></div>
                                    {chat.unread > 0 && <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0">{chat.unread}</div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="flex-1 flex flex-col bg-[#EBE3D5] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                    {selectedChatId ? (
                        <>
                            <div className="h-16 px-4 bg-[#F0F2F5] border-b border-gray-200 flex items-center justify-between shrink-0 relative z-10">
                                <div className="flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center font-black text-sm text-gray-500 italic">{chats.find(c => c.id === selectedChatId)?.name?.charAt(0)}</div><h5 className="text-[15px] font-bold text-gray-900">{chats.find(c => c.id === selectedChatId)?.name}</h5></div>
                                <div className="flex items-center gap-6 text-gray-500 px-2"><Search size={20}/><MoreVertical size={20}/></div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-4 custom-scrollbar relative z-10" ref={scrollRef}>
                                {isMessagesLoading ? (<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#004d4d]" size={32} /></div>) : chatMessages.length > 0 ? (
                                    chatMessages.map((msg) => (
                                        <div key={msg.id} className={`flex flex-col gap-1 ${msg.fromMe ? 'items-end ml-auto' : 'items-start'} max-w-[70%]`}>
                                            <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium ${msg.fromMe ? 'bg-[#D9FDD3] rounded-tr-none text-gray-700' : 'bg-white rounded-tl-none text-gray-700'}`}>{msg.body}</div>
                                            <span className={`text-[10px] text-gray-400 font-bold ${msg.fromMe ? 'mr-2' : 'ml-2'}`}>{msg.time}</span>
                                        </div>
                                    ))
                                ) : (<div className="h-full flex items-center justify-center opacity-20"><p className="text-sm font-black uppercase tracking-widest">No hay mensajes recientes</p></div>)}
                            </div>
                            <div className="h-16 px-4 bg-[#F0F2F5] flex items-center gap-4 shrink-0 relative z-10">
                                <Smile size={24} className="text-gray-500" /><div className="flex-1 bg-white h-10 rounded-xl px-4 flex items-center shadow-sm"><input placeholder="Escribe un mensaje" className="w-full bg-transparent border-none text-[14px] outline-none text-gray-700 font-medium" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} /></div>
                                <button onClick={handleSendMessage} className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-[#004d4d] transition-colors">{message.trim() ? <Send size={24} className="text-[#004d4d]" /> : <Bot size={24} />}</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative z-10">
                            <div className="h-64 w-64 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl relative overflow-hidden group"><Bot size={120} className="text-[#004d4d]/40 group-hover:scale-110 transition-transform duration-700" /></div>
                            <div className="mt-12 space-y-4"><h3 className="text-3xl font-black text-gray-900 italic tracking-tighter">Terminal de Mensajes Web</h3><p className="text-gray-500 text-sm font-medium max-w-sm mx-auto italic leading-relaxed">Centraliza las consultas de tus clientes y responde de forma rápida y profesional.</p></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />
    </div>
  );
}
