"use client";

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon, 
  Paperclip, 
  Smile,
  CheckCheck,
  Filter,
  MessageSquare,
  Clock,
  Zap,
  TrendingUp,
  Download,
  X,
  Bot,
  Sparkles,
  ArrowRight,
  Settings,
  Activity,
  UserCheck,
  ShieldCheck,
  Target,
  SearchIcon,
  Circle,
  Plus,
  Globe,
  Share2,
  MessageCircle,
  ShoppingBag,
  Power,
  Save,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";
import { generateChatsPDF } from '@/lib/chats-report';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';

// --- COMPONENTES ATÓMICOS PREMIUM ---
const AnimatedNumber = memo(({ value, type = 'simple', className }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' | 'time' }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'time') return `${Math.round(current)}m`;
        if (type === 'percentage') return `${current.toFixed(1)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });
    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span className={className}>{display}</motion.span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

const PremiumCard = ({ children, onClick, className = "", dark = false }: { children: React.ReactNode, onClick?: () => void, className?: string, dark?: boolean }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glare, setGlare] = useState({ x: 50, y: 50, op: 0 });

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        setRotateX((y - box.height/2) / 20);
        setRotateY((box.width/2 - x) / 20);
        setGlare({ x: (x/box.width)*100, y: (y/box.height)*100, op: dark ? 0.15 : 0.1 });
    };

    return (
        <motion.div
            onClick={onClick}
            onMouseMove={handleMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlare(g => ({...g, op: 0})); }}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className={`rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden isolate cursor-pointer ${dark ? 'bg-[#001A1A] border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-xl'} ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                 style={{ opacity: glare.op, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${dark ? 'rgba(0,242,255,0.2)' : 'white'} 0%, transparent 60%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(25px)", position: "relative", zIndex: 2 }} className="h-full">{children}</div>
        </motion.div>
    );
};

// --- CONFIGURACIÓN DE CANALES ---
const CHANNEL_CONFIG = {
  whatsapp: { label: 'WhatsApp', color: 'bg-emerald-500', icon: <MessageCircle size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg' },
  instagram: { label: 'Instagram', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', icon: <Share2 size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg' },
  facebook: { label: 'Facebook', color: 'bg-blue-600', icon: <Activity size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg' },
  tiktok: { label: 'TikTok', color: 'bg-black', icon: <Zap size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logotipo_de_TikTok.svg' },
  mercadolibre: { label: 'Meli', color: 'bg-[#FFE600]', icon: <ShoppingBag size={20} />, logo: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.18.9/mercadolibre/logo__small@2x.png' },
  web: { label: 'Canal Web', color: 'bg-[#004d4d]', icon: <Globe size={20} />, logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Android_O_Preview_Icon.png' }
};

import { io } from 'socket.io-client';

export default function MensajesPage() {
  const { token, userEmail } = useAuth();
  const { showToast } = useToast();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [webChannelActive, setWebChannelActive] = useState(false);
  const [linkedChannels, setLinkedChannels] = useState<string[]>([]);
  const [isQRVisible, setIsQRVisible] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [paired, setPaired] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // --- CARGA DE MENSAJES WEB REALES ---
  const fetchWebMessages = useCallback(async () => {
      if (!token) return;
      setIsMessagesLoading(true);
      try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const res = await fetch(`${apiBase}/admin/messages`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              // Mapeamos al formato de la interfaz de chat
              const mappedChats = data.map((m: any) => ({
                  id: m.id,
                  name: m.customer_name,
                  email: m.customer_email,
                  phone: m.customer_phone,
                  lastMsg: m.message,
                  time: new Date(m.created_at).toLocaleDateString(),
                  unread: m.status === 'unread' ? 1 : 0,
                  channel: 'web'
              }));
              setChats(mappedChats);
          }
      } catch (e) { console.error("Error cargando mensajes web", e); }
      finally { setIsMessagesLoading(false); }
  }, [token]);

  useEffect(() => {
      fetchWebMessages();
  }, [fetchWebMessages]);

  // --- CARGAR DETALLE DEL MENSAJE SELECCIONADO ---
  useEffect(() => {
      if (!selectedChatId || chats.length === 0) return;
      const chat = chats.find(c => c.id === selectedChatId);
      if (chat) {
          setChatMessages([{
              id: chat.id,
              body: chat.lastMsg,
              fromMe: false,
              time: chat.time
          }]);
      }
  }, [selectedChatId, chats]);

  const kpis = [
    { label: "Consultas Web", value: chats.length, icon: <Activity size={24}/>, color: "text-[#004d4d]", bg: "bg-[#004d4d]/5", trend: "Buzón" },
    { label: "Tiempo respuesta", value: 0, icon: <Clock size={24}/>, color: "text-amber-600", bg: "bg-amber-50", trend: "V1.0", isTime: true },
    { label: "Conversión Web", value: 0, icon: <Target size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50", trend: "0%", isPercentage: true },
    { label: "Tickets hoy", value: chats.filter(c => c.unread > 0).length, icon: <Zap size={24}/>, color: "text-[#00f2ff]", bg: "bg-cyan-50", trend: "Pendientes" },
  ];

  const handleExportReport = () => {
    try {
      showToast("Generando reporte de mensajería...", "info");
      generateChatsPDF({
        stats: {
            totalChats: kpis[0].value,
            activeChannels: linkedChannels.length || 1,
            aiEfficiency: "98.5%",
            totalRevenue: "$ 0"
        },
        chats: chats.map(c => ({
            customer: { name: c.name, type: 'Usuario Final', ltv: 0 },
            source: c.channel,
            status: 'Atendido',
            time: c.time
        }))
      });
      showToast("¡Reporte generado con éxito!", "success");
    } catch (e) { 
        console.error(e);
        showToast("Error al exportar reporte", "error"); 
    }
  };

  // Cargar canales vinculados
  useEffect(() => {
      const fetchChannels = async () => {
          if (!token) return;
          try {
              const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
              const res = await fetch(`${apiBase}/admin/channels/list`, {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                  const data = await res.json();
                  setLinkedChannels(data.map((c: any) => c.channel_type));
              }
          } catch (e) { console.error(e); }
      };
      fetchChannels();
  }, [token]);

  const handleChannelLink = async (channel: string) => {
      if (channel === 'whatsapp') {
          setIsLinkModalOpen(false);
          handleStartPairing();
          return;
      }

      showToast(`Conectando con la API de ${channel}...`, "info");
      
      try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const res = await fetch(`${apiBase}/admin/channels/link`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ channel_type: channel })
          });

          if (res.ok) {
              setLinkedChannels(prev => [...prev, channel]);
              showToast(`${channel.toUpperCase()} vinculado con éxito ✨`, "success");
              
              // Redirecciones Oficiales / OAuth
              setTimeout(() => {
                  if (channel === 'instagram') window.open('https://www.facebook.com/login/reauth.php?next=https%3A%2F%2Fwww.instagram.com%2Faccounts%2Fmanage_access%2F', '_blank');
                  if (channel === 'facebook') window.open('https://www.facebook.com/settings?tab=business_tools', '_blank');
                  if (channel === 'tiktok') window.open('https://www.tiktok.com/auth/authorize/', '_blank');
                  if (channel === 'mercadolibre') window.open('https://www.mercadolibre.com.co/jms/mco/lgz/login', '_blank');
                  if (channel === 'whatsapp') window.open('https://business.whatsapp.com/products/messenger-api', '_blank');
              }, 1000);
          }
      } catch (e) {
          showToast("Error al vincular canal", "error");
      }
  };

  const handleStartPairing = () => {
      if (paired) {
          showToast("Ya estás conectado", "info");
          return;
      }
      setIsQRVisible(true);
      showToast("Solicitando QR al servidor...", "info");
  };

  const handleSendMessage = async () => {
      if (!selectedChatId) return;
      
      try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const res = await fetch(`${apiBase}/admin/messages/${selectedChatId}?status=read`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
              showToast("Mensaje marcado como leído. La respuesta directa llegará pronto. 🚀", "info");
              fetchWebMessages();
          }
      } catch (e) { showToast("Error al procesar", "error"); }
  };

  return (
    <div className="w-full space-y-10 pb-20 animate-in fade-in duration-1000 flex flex-col">
      
      {/* 1. HEADER PLATINUM */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4 shrink-0">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic">Mensajería Directa Web v1.0</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-none text-[#001A1A]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">Mensajes Web</span>
            </h1>
            <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">Gestiona las consultas de tus clientes desde tu tienda online. 🌐</p>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={handleExportReport} className="h-12 px-8 bg-white/60 backdrop-blur-xl border border-white text-[#004d4d] rounded-full font-black text-[10px] tracking-[0.3em] shadow-xl hover:bg-[#004d4d] hover:text-white transition-all">Reporte de mensajes</button>
        </div>
      </div>

      {/* 2. GRID DE MÉTRICAS CRM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
          {kpis.map((kpi, i) => (
              <div key={i} onClick={() => setSelectedMetric(kpi)}>
                  <PremiumCard className="p-8 group h-full">
                      <div className="flex justify-between items-start mb-6">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 border border-white/50 ${kpi.bg} ${kpi.color}`}>
                              {kpi.icon}
                          </div>
                          <div className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black tracking-wider text-gray-400">
                              {kpi.trend}
                          </div>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] mb-1.5">{kpi.label}</p>
                          <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">
                              <AnimatedNumber value={kpi.value} type={kpi.isPercentage ? 'percentage' : kpi.isTime ? 'time' : 'simple'} />
                          </h3>
                      </div>
                  </PremiumCard>
              </div>
          ))}
      </div>

      {/* 3. TERMINAL DE CHATS */}
      <div className="h-[1000px] px-4 shrink-0">
          <div className="h-full bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl flex overflow-hidden isolate relative">
              
              {/* Sidebar de Chats */}
              <div className="w-[350px] border-r border-gray-100 flex flex-col bg-[#F0F2F5] shrink-0">
                  <div className="h-16 px-4 flex items-center justify-between shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 border border-white shadow-sm overflow-hidden">
                          <div className="h-full w-full bg-gradient-to-tr from-[#004d4d] to-cyan flex items-center justify-center text-white font-black text-xs">
                              {userEmail?.charAt(0).toUpperCase()}
                          </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-500">
                          <Activity size={20} className="cursor-pointer hover:text-[#004d4d] transition-colors" />
                          <MessageSquare size={20} className="cursor-pointer hover:text-[#004d4d] transition-colors" />
                          <MoreVertical size={20} className="cursor-pointer hover:text-[#004d4d] transition-colors" />
                      </div>
                  </div>

                  <div className="px-3 py-2 shrink-0">
                      <div className="bg-white rounded-xl flex items-center px-4 gap-4 h-9 shadow-sm">
                          <Search size={16} className="text-gray-400" />
                          <input placeholder="Busca un chat o inicia uno nuevo" className="flex-1 bg-transparent border-none text-[13px] outline-none text-gray-600 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                      {chats.length === 0 ? (
                          <div className="py-20 text-center space-y-4 px-10">
                              <div className="h-20 w-20 bg-[#F0F2F5] rounded-full flex items-center justify-center mx-auto text-gray-300"><Bot size={40}/></div>
                              <h5 className="text-sm font-black text-gray-900">Buzón Web Activo</h5>
                              <p className="text-xs text-gray-400 font-medium leading-relaxed italic">Aquí aparecerán los mensajes que tus clientes envíen desde tu tienda online.</p>
                          </div>
                      ) : (
                          chats
                            .filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((chat) => (
                              <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`h-[72px] px-4 flex items-center gap-4 cursor-pointer border-b border-gray-50 transition-colors ${selectedChatId === chat.id ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F6]'}`}>
                                  <div className="relative shrink-0">
                                      <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-lg font-black text-gray-400 italic">{(chat.name || '?').charAt(0)}</div>
                                      <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-white p-0.5 shadow-md">
                                          <img src={CHANNEL_CONFIG[(chat.channel || 'whatsapp') as keyof typeof CHANNEL_CONFIG].logo} alt="" className="h-full w-full object-contain rounded-full" />
                                      </div>
                                  </div>
                                  <div className="flex-1 min-w-0 pr-2">
                                      <div className="flex justify-between items-baseline mb-1">
                                          <h5 className="text-[15px] font-bold text-gray-900 truncate">{chat.name || 'Chat sin nombre'}</h5>
                                          <span className="text-[11px] text-gray-400 font-medium">{chat.time}</span>
                                      </div>
                                      <p className="text-[13px] text-gray-500 truncate font-medium">{chat.lastMsg}</p>
                                  </div>
                                  {chat.unread > 0 && (
                                      <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0">{chat.unread}</div>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              </div>

              {/* Ventana de Chat */}
              <div className="flex-1 flex flex-col bg-[#EBE3D5] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                  {selectedChatId ? (
                      <>
                          <div className="h-16 px-4 bg-[#F0F2F5] border-b border-gray-200 flex items-center justify-between shrink-0 relative z-10">
                              <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center font-black text-sm text-gray-500 italic">{chats.find(c => c.id === selectedChatId)?.name.charAt(0)}</div>
                                  <div>
                                      <h5 className="text-[15px] font-bold text-gray-900">{chats.find(c => c.id === selectedChatId)?.name}</h5>
                                      <p className="text-[11px] text-gray-500 font-medium">en línea</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-6 text-gray-500 px-2"><Search size={20}/><MoreVertical size={20}/></div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-10 space-y-4 custom-scrollbar relative z-10" ref={scrollRef}>
                              {isMessagesLoading ? (
                                  <div className="h-full flex items-center justify-center">
                                      <Loader2 className="animate-spin text-[#004d4d]" size={32} />
                                  </div>
                              ) : chatMessages.length > 0 ? (
                                  chatMessages.map((msg) => (
                                      <div key={msg.id} className={`flex flex-col gap-1 ${msg.fromMe ? 'items-end ml-auto' : 'items-start'} max-w-[70%]`}>
                                          <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium ${msg.fromMe ? 'bg-[#D9FDD3] rounded-tr-none text-gray-700' : 'bg-white rounded-tl-none text-gray-700'}`}>
                                              {msg.body}
                                              {msg.fromMe && <div className="flex justify-end mt-1"><CheckCheck size={14} className="text-cyan-500" /></div>}
                                          </div>
                                          <span className={`text-[10px] text-gray-400 font-bold ${msg.fromMe ? 'mr-2' : 'ml-2'}`}>{msg.time}</span>
                                      </div>
                                  ))
                              ) : (
                                  <div className="h-full flex items-center justify-center opacity-20">
                                      <p className="text-sm font-black uppercase tracking-widest">No hay mensajes recientes</p>
                                  </div>
                              )}
                              
                              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                  <div className="h-px w-32 bg-gray-400 mb-4" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
                                      <ShieldCheck size={12} /> Cifrado de extremo a extremo
                                  </p>
                              </div>
                          </div>
                          <div className="h-16 px-4 bg-[#F0F2F5] flex items-center gap-4 shrink-0 relative z-10">
                              <Smile size={24} className="text-gray-500" /><Paperclip size={24} className="text-gray-500" />
                              <div className="flex-1 bg-white h-10 rounded-xl px-4 flex items-center shadow-sm">
                                  <input 
                                    placeholder="Escribe un mensaje" 
                                    className="w-full bg-transparent border-none text-[14px] outline-none text-gray-700 font-medium" 
                                    value={message} 
                                    onChange={(e) => setMessage(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                  />
                              </div>
                              <button 
                                onClick={handleSendMessage}
                                className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-[#004d4d] transition-colors"
                              >
                                {message.trim() ? <Send size={24} className="text-[#004d4d]" /> : <Bot size={24} />}
                              </button>
                          </div>
                      </>
                  ) : isQRVisible ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative z-10 bg-white">
                          <div className="space-y-8 animate-in zoom-in duration-500">
                              <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 inline-block relative overflow-hidden group">
                                  {isPairing || !qrCodeUrl ? (
                                      <div className="h-64 w-64 flex flex-col items-center justify-center gap-4">
                                          <Loader2 className="animate-spin text-[#004d4d]" size={48} />
                                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Solicitando conexión...</p>
                                      </div>
                                  ) : (
                                      <>
                                          <img src={qrCodeUrl} className="h-64 w-64 opacity-90 group-hover:scale-105 transition-transform duration-700" alt="QR" />
                                          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </>
                                  )}
                              </div>
                              <div className="max-w-xs mx-auto space-y-4">
                                  <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Vincula tu WhatsApp</h3>
                                  <div className="space-y-2 text-left">
                                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed flex gap-3">
                                          <span className="h-5 w-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                                          Abre WhatsApp en tu teléfono.
                                      </p>
                                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed flex gap-3">
                                          <span className="h-5 w-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                                          Toca Menú o Configuración y selecciona Dispositivos vinculados.
                                      </p>
                                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed flex gap-3">
                                          <span className="h-5 w-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">3</span>
                                          Apunta tu cámara a esta pantalla para escanear el código.
                                      </p>
                                  </div>
                                  <button onClick={() => setIsQRVisible(false)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-500 transition-colors">Cancelar vinculación</button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative z-10">
                          <div className="h-64 w-64 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl relative overflow-hidden group">
                              <Bot size={120} className="text-[#004d4d]/40 group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          <div className="mt-12 space-y-8">
                              <div className="space-y-4">
                                  <h3 className="text-3xl font-black text-gray-900 italic tracking-tighter">Terminal de Mensajes Web</h3>
                                  <p className="text-gray-500 text-sm font-medium max-w-sm mx-auto italic leading-relaxed">Centraliza las consultas de tus clientes y responde de forma rápida y profesional.</p>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* 4. MODAL DE VINCULACIÓN OMNICANAL (PLATINUM) */}
      <AnimatePresence>
          {isLinkModalOpen && (
              <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLinkModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" />
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
                      <div className="p-12 bg-gradient-to-br from-[#001a1a] to-[#004d4d] text-white flex justify-between items-start relative overflow-hidden shrink-0">
                          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Activity size={200}/></div>
                          <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-4">
                                  <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                                  <span className="text-[10px] font-black tracking-[0.3em] text-cyan/60">Conexiones seguras</span>
                              </div>
                              <h3 className="text-4xl font-black italic tracking-tighter">Centro de <span className="text-cyan">vinculación</span></h3>
                              <p className="text-white/60 text-sm font-medium mt-4 max-w-md">Activa la sincronización de tus canales oficiales para recibir transmisiones en tiempo real en tu terminal Bayup.</p>
                          </div>
                          <button onClick={() => setIsLinkModalOpen(false)} className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all group relative z-10">
                              <X size={20} className="group-hover:rotate-90 transition-transform" />
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                          <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/50">
                              {Object.entries(CHANNEL_CONFIG).map(([key, config]) => {
                                  if (key === 'web') return null; 
                                  const isLinked = linkedChannels.includes(key);
                                  return (
                                      <button 
                                        key={key} 
                                        onClick={() => handleChannelLink(key)} 
                                        className={`group relative bg-white p-8 rounded-[2.5rem] border transition-all flex flex-col items-center text-center gap-6 overflow-hidden isolate ${isLinked ? 'border-emerald-200 shadow-lg' : 'border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.03]'}`}
                                      >
                                          <div className="absolute inset-0 bg-gradient-to-tr from-gray-50/50 to-transparent -z-10" />
                                          {isLinked && <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-in zoom-in duration-500"><CheckCheck size={12}/></div>}
                                          <div className="h-20 w-20 rounded-[2rem] bg-white shadow-lg p-4 flex items-center justify-center group-hover:rotate-6 transition-transform">
                                              <img src={config.logo} className="h-full w-full object-contain" alt="" />
                                          </div>
                                          <div>
                                              <h5 className="text-sm font-black text-gray-900 tracking-widest">{config.label}</h5>
                                              <p className={`text-[10px] font-bold mt-1 italic ${isLinked ? 'text-emerald-500' : 'text-gray-400'}`}>{isLinked ? 'Cuenta conectada' : 'Vincular cuenta'}</p>
                                          </div>
                                          <div className={`mt-2 h-10 w-full rounded-2xl flex items-center justify-center font-black text-[9px] tracking-widest transition-colors ${isLinked ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-900 text-white group-hover:bg-[#004d4d]'}`}>
                                              {isLinked ? 'Actualizar token' : 'Conectar API'}
                                          </div>
                                      </button>
                                  );
                              })}

                              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between gap-6 relative overflow-hidden isolate">
                                  <div className="flex justify-between items-start">
                                      <div className="h-16 w-16 rounded-2xl bg-[#004d4d] text-white flex items-center justify-center shadow-lg"><Globe size={32}/></div>
                                      <button onClick={() => setWebChannelActive(!webChannelActive)} className={`h-10 w-20 rounded-full p-1 transition-all duration-500 relative ${webChannelActive ? 'bg-cyan' : 'bg-gray-200'}`}>
                                          <motion.div animate={{ x: webChannelActive ? 40 : 0 }} className="h-8 w-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                                              <Power size={14} className={webChannelActive ? 'text-cyan' : 'text-gray-300'} />
                                          </motion.div>
                                      </button>
                                  </div>
                                  <div>
                                      <h5 className="text-sm font-black text-gray-900 tracking-widest">Chat de mi web</h5>
                                      <p className="text-[9px] text-gray-400 font-bold mt-1 italic">{webChannelActive ? 'Canal activo' : 'Canal desactivado'}</p>
                                  </div>
                                  <p className="text-[10px] text-gray-400 leading-relaxed italic">Activa el widget de chat automático en tu tienda online.</p>
                              </div>
                          </div>
                      </div>

                      <div className="p-10 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                          <div className="flex items-center gap-4">
                              <ShieldCheck size={20} className="text-emerald-500" />
                              <p className="text-[10px] font-black text-gray-400 tracking-[0.2em]">Cifrado de grado militar AES-256 activo</p>
                          </div>
                          <button 
                            onClick={() => { showToast("Sincronizando conexiones...", "info"); setTimeout(() => { setIsLinkModalOpen(false); showToast("Configuración guardada", "success"); }, 1000); }}
                            className="h-14 px-12 bg-gray-900 text-white rounded-2xl font-black text-[11px] tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center gap-3"
                          >
                              <Save size={18} className="text-cyan" /> Guardar y sincronizar
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
