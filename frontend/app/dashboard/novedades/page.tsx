"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Bot, GitBranch, ShoppingBag, Users,
  BarChart3, Smartphone, FileText, Star, X,
  Zap, Sparkles, Rocket, Clock, CalendarClock,
  ChevronLeft, ChevronRight, ArrowRight, Send, Lightbulb,
} from 'lucide-react';

type Phase = 'Q3 2026' | 'Q4 2026' | '2027';

interface Feature {
  id: string; title: string; tagline: string; description: string;
  phase: Phase; icon: React.ReactNode; tags: string[];
  votes: number; gradient: string; accentColor: string;
}

const FEATURES: Feature[] = [
  { id:'agente-ia',              title:'Agente IA',                 tagline:'Tu vendedor que nunca duerme',      description:'Un agente con la voz de tu marca. Responde preguntas, cierra ventas y aprende de cada conversación. Disponible 24/7.', phase:'Q3 2026', icon:<Bot          size={40} strokeWidth={1.4}/>, tags:['IA','Ventas'],          votes:412, gradient:'linear-gradient(145deg,#001a1a 0%,#004040 100%)', accentColor:'#00c2c2' },
  { id:'whatsapp-billing',       title:'Cobros por WhatsApp',       tagline:'Vende sin salir del chat',          description:'Genera links de pago y cobra directamente desde WhatsApp. Tus clientes pagan en segundos.',                           phase:'Q3 2026', icon:<MessageSquare size={40} strokeWidth={1.4}/>, tags:['Pagos','WhatsApp'],     votes:284, gradient:'linear-gradient(145deg,#071a0d 0%,#1a6b35 100%)', accentColor:'#34d367' },
  { id:'facturacion-electronica',title:'Facturación Electrónica',   tagline:'DIAN integrada, sin dolores',       description:'Emite facturas válidas ante la DIAN desde Bayup. Sin software externo, sin XML manuales.',                            phase:'Q3 2026', icon:<FileText     size={40} strokeWidth={1.4}/>, tags:['DIAN','Finanzas'],      votes:231, gradient:'linear-gradient(145deg,#07101f 0%,#153580 100%)', accentColor:'#60a5fa' },
  { id:'automatizaciones',       title:'Automatizaciones',          tagline:'Tu negocio en piloto automático',   description:'Flujos visuales: cuando X pasa, hacer Y. Emails de abandono y notificaciones automáticas.',                          phase:'Q4 2026', icon:<GitBranch    size={40} strokeWidth={1.4}/>, tags:['Flujos','Productividad'],votes:198, gradient:'linear-gradient(145deg,#1a0f00 0%,#6b3800 100%)', accentColor:'#f59e0b' },
  { id:'marketplace',            title:'Marketplace Multicanal',    tagline:'Un panel para todos tus canales',   description:'Sincroniza inventario con Mercado Libre, Rappi e Instagram Shopping desde Bayup.',                                   phase:'Q4 2026', icon:<ShoppingBag  size={40} strokeWidth={1.4}/>, tags:['Multicanal','Inventario'],votes:176, gradient:'linear-gradient(145deg,#0d0720 0%,#3b1f80 100%)', accentColor:'#a78bfa' },
  { id:'crm',                    title:'CRM Comercial',             tagline:'Cada cliente, una oportunidad',     description:'Kanban de oportunidades, historial completo de clientes y seguimiento automático.',                                   phase:'Q4 2026', icon:<Users        size={40} strokeWidth={1.4}/>, tags:['CRM','Ventas'],         votes:154, gradient:'linear-gradient(145deg,#00101a 0%,#003d66 100%)', accentColor:'#38bdf8' },
  { id:'marketing-ia',           title:'Marketing IA',              tagline:'Campañas que se optimizan solas',  description:'IA que analiza tu audiencia, crea copies y mide ROI en tiempo real. Email, WhatsApp y SMS.',                         phase:'2027',    icon:<BarChart3    size={40} strokeWidth={1.4}/>, tags:['Marketing','IA'],       votes:203, gradient:'linear-gradient(145deg,#1a0010 0%,#6b004a 100%)', accentColor:'#f472b6' },
  { id:'app-movil',              title:'App Móvil',                 tagline:'Tu negocio en el bolsillo',        description:'Gestiona pedidos, revisa métricas y procesa pagos desde tu celular. Notificaciones en tiempo real.',                 phase:'2027',    icon:<Smartphone   size={40} strokeWidth={1.4}/>, tags:['App','Móvil'],          votes:341, gradient:'linear-gradient(145deg,#1a0800 0%,#6b2500 100%)', accentColor:'#fb923c' },
];

const PHASE_ORDER: Phase[] = ['Q3 2026', 'Q4 2026', '2027'];

const PHASE_LABEL: Record<Phase, { label: string; icon: React.ReactNode }> = {
  'Q3 2026': { label: 'Muy pronto', icon: <Rocket       size={9}/> },
  'Q4 2026': { label: 'Este año',   icon: <Clock        size={9}/> },
  '2027':    { label: 'En camino',  icon: <CalendarClock size={9}/> },
};

// ── MODAL ──────────────────────────────────────────────────────────────────────
function Modal({ feature, onClose, voted, onVote }: {
  feature: Feature; onClose: () => void; voted: boolean; onVote: () => void;
}) {
  const total = feature.votes + (voted ? 1 : 0);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <motion.div
        initial={{ scale: 0.93, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.93, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Visual header */}
        <div className="relative flex flex-col items-center justify-center pt-12 pb-9"
          style={{ background: feature.gradient }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 65%, ${feature.accentColor}40 0%, transparent 60%)` }} />
          <div className="absolute rounded-full border border-white/10"
            style={{ width: 190, height: 190, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div className="relative z-10 mb-3" style={{ color: feature.accentColor }}>
            {feature.icon}
          </div>
          <span
            className="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7.5px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: feature.accentColor, backdropFilter: 'blur(8px)' }}
          >
            {PHASE_LABEL[feature.phase].icon} {PHASE_LABEL[feature.phase].label} · {feature.phase}
          </span>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
          >
            <X size={13} />
          </button>
          <div className="absolute bottom-0 inset-x-0 h-10 pointer-events-none"
            style={{ background: 'linear-gradient(to top, white 0%, transparent 100%)' }} />
        </div>

        {/* Content */}
        <div className="bg-white px-7 pb-7 pt-3">
          <h2 className="text-[20px] font-black text-gray-900 mb-0.5">{feature.title}</h2>
          <p className="text-[11px] font-semibold mb-4" style={{ color: feature.accentColor }}>{feature.tagline}</p>
          <p className="text-[12.5px] text-gray-500 leading-relaxed mb-5">{feature.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {feature.tags.map(t => (
              <span key={t} className="text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-400">{t}</span>
            ))}
          </div>
          <div className="p-4 rounded-2xl mb-4 bg-gray-50 border border-gray-100">
            <div className="flex justify-between items-center mb-2.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Interés comunidad</p>
              <p className="text-[13px] font-black" style={{ color: feature.accentColor }}>{total.toLocaleString('es-CO')}</p>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (total / 500) * 100)}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${feature.accentColor}88, ${feature.accentColor})` }}
              />
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onVote}
            className="w-full h-11 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all"
            style={voted
              ? { background: `${feature.accentColor}15`, color: feature.accentColor, border: `1.5px solid ${feature.accentColor}30` }
              : { background: feature.accentColor, color: '#fff' }}
          >
            <Star size={13} fill={voted ? feature.accentColor : '#fff'} strokeWidth={0} />
            {voted ? 'Ya marcaste interés' : 'Me interesa esta función'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── IDEA MODAL ────────────────────────────────────────────────────────────────
function IdeaModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ titulo: '', descripcion: '', categoria: '', impacto: '' });
  const [sent, setSent] = useState(false);

  const categorias = ['Pagos y cobros', 'Marketing', 'Inventario', 'Automatización', 'Reportes', 'Integraciones', 'Otro'];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descripcion.trim()) return;
    setSent(true);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.93, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.93, y: 24, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-7 pt-7 pb-5" style={{ background: 'linear-gradient(135deg,#001a1a 0%,#004d4d 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(0,194,194,0.25) 0%, transparent 60%)' }} />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,194,194,0.15)', border: '1px solid rgba(0,194,194,0.25)' }}>
                <Lightbulb size={18} className="text-[#00c2c2]" />
              </div>
              <div>
                <h2 className="text-[16px] font-black text-white leading-tight">Comparte tu idea</h2>
                <p className="text-[10px] text-white/40 mt-0.5">Tu opinión construye el futuro de Bayup</p>
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-6 gap-4">
                <div className="h-16 w-16 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(0,77,77,0.08)', border: '1.5px solid rgba(0,77,77,0.12)' }}>
                  <Sparkles size={28} className="text-[#004d4d]" />
                </div>
                <div>
                  <p className="text-[18px] font-black text-gray-900 mb-1">¡Gracias por tu idea!</p>
                  <p className="text-[12px] text-gray-400 leading-relaxed max-w-xs">La revisaremos y si la añadimos al roadmap te lo haremos saber. Tu aporte hace a Bayup mejor.</p>
                </div>
                <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-white transition-colors" style={{ background: '#004d4d' }}>
                  Cerrar
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Nombre de la idea *</label>
                  <input
                    type="text" required maxLength={80}
                    placeholder="ej. Integración con Mercado Pago"
                    value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] text-gray-900 placeholder-gray-300 outline-none transition-all"
                    style={{ background: '#f9fafb', border: '1.5px solid #f3f4f6' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#004d4d'}
                    onBlur={e => e.currentTarget.style.borderColor = '#f3f4f6'}
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Categoría</label>
                  <div className="flex flex-wrap gap-1.5">
                    {categorias.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, categoria: c }))}
                        className="px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all"
                        style={form.categoria === c
                          ? { background: '#004d4d', color: '#fff' }
                          : { background: '#f3f4f6', color: '#9ca3af' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">¿Cómo mejoraría tu negocio? *</label>
                  <textarea
                    required rows={3} maxLength={400}
                    placeholder="Describe el problema que resuelve y cómo lo usarías…"
                    value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] text-gray-900 placeholder-gray-300 outline-none resize-none transition-all"
                    style={{ background: '#f9fafb', border: '1.5px solid #f3f4f6' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#004d4d'}
                    onBlur={e => e.currentTarget.style.borderColor = '#f3f4f6'}
                  />
                  <p className="text-[8px] text-gray-300 text-right mt-1">{form.descripcion.length}/400</p>
                </div>

                {/* Impacto */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">¿Cuánto impacto tendría para ti?</label>
                  <div className="flex gap-2">
                    {[['🔥', 'Alto'], ['⚡', 'Medio'], ['💡', 'Bajo']].map(([emoji, label]) => (
                      <button key={label} type="button" onClick={() => setForm(f => ({ ...f, impacto: label }))}
                        className="flex-1 py-2 rounded-xl text-[9px] font-black transition-all"
                        style={form.impacto === label
                          ? { background: 'rgba(0,77,77,0.08)', color: '#004d4d', border: '1.5px solid rgba(0,77,77,0.2)' }
                          : { background: '#f9fafb', color: '#9ca3af', border: '1.5px solid #f3f4f6' }}>
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button whileTap={{ scale: 0.98 }} type="submit"
                  className="w-full h-11 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 text-white transition-all mt-2"
                  style={{ background: '#004d4d', boxShadow: '0 4px 20px rgba(0,77,77,0.3)' }}>
                  <Send size={13} /> Enviar mi idea
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PAGE ───────────────────────────────────────────────────────────────────────
const IMG_H  = 300;
const INFO_H = 130;
const CARD_W = 220;
const GAP    = 14;

export default function NovedadesPage() {
  const [activeIdx, setActiveIdx]     = useState(0);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [votes, setVotes]             = useState<Record<string, boolean>>({});
  const [activePhase, setActivePhase] = useState<Phase | 'all'>('all');
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const filtered        = activePhase === 'all' ? FEATURES : FEATURES.filter(f => f.phase === activePhase);
  const safeIdx         = Math.min(activeIdx, filtered.length - 1);
  const totalVotes      = Object.values(votes).filter(Boolean).length;
  const toggleVote      = (id: string) => setVotes(v => ({ ...v, [id]: !v[id] }));
  const selectedFeature = FEATURES.find(f => f.id === selectedId);

  const prev = () => setActiveIdx(i => Math.max(0, i - 1));
  const next = () => setActiveIdx(i => Math.min(filtered.length - 1, i + 1));
  const handlePhase = (p: Phase | 'all') => { setActivePhase(p); setActiveIdx(0); };

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8 relative">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,178,189,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,77,77,0.06) 0%, transparent 70%)', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:900, height:500, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(0,194,194,0.04) 0%, transparent 65%)', filter:'blur(30px)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(0,77,77,0.12) 1px, transparent 1px)', backgroundSize:'32px 32px', opacity:0.5 }} />
      </div>

      {/* HERO */}
      <div
        className="relative rounded-3xl overflow-hidden px-10 py-11 text-center"
        style={{
          background: 'linear-gradient(160deg,#001010 0%,#001a1a 60%,#002a2a 100%)',
          boxShadow: '0 32px 80px -16px rgba(0,77,77,0.5), 0 8px 24px -4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,178,189,0.15)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:'absolute', top:'-25%', left:'25%', width:'50%', height:'100%', borderRadius:'50%', background:'radial-gradient(circle,#004d4d 0%,transparent 70%)', filter:'blur(70px)', opacity:0.3 }} />
          <div style={{ position:'absolute', bottom:'-25%', right:'25%', width:'50%', height:'100%', borderRadius:'50%', background:'radial-gradient(circle,#00b2bd 0%,transparent 70%)', filter:'blur(90px)', opacity:0.2 }} />
        </div>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage:'linear-gradient(rgba(0,178,189,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,178,189,0.05) 1px,transparent 1px)', backgroundSize:'56px 56px' }} />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(0,178,189,0.12)', border: '1px solid rgba(0,178,189,0.25)' }}
          >
            <Sparkles size={10} className="text-[#00b2bd]" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#00b2bd]">Roadmap Bayup · {new Date().getFullYear()}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            className="font-black text-white tracking-tight mb-3"
            style={{ fontSize: 'clamp(32px,4.5vw,56px)', lineHeight: 0.94 }}
          >
            LO QUE VIENE<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#00f2ff,#00b2bd)' }}>
              PARA BAYUP
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}
            className="text-[12px] text-white/40 max-w-xs mx-auto mb-5 leading-relaxed"
          >
            Funciones en construcción para llevar tu negocio al siguiente nivel. Vota las que más te interesan.
          </motion.p>
          <AnimatePresence>
            {totalVotes > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(0,178,189,0.1)', border: '1px solid rgba(0,242,255,0.2)' }}
              >
                <Star size={11} fill="#00f2ff" style={{ color: '#00f2ff' }} />
                <span className="text-[10px] font-black text-[#00f2ff]">
                  {totalVotes} función{totalVotes !== 1 ? 'es' : ''} marcada{totalVotes !== 1 ? 's' : ''}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', ...PHASE_ORDER] as const).map(p => (
          <button
            key={p}
            onClick={() => handlePhase(p as Phase | 'all')}
            className="px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-200"
            style={activePhase === p
              ? { background: '#001a1a', color: '#00b2bd', border: '1px solid rgba(0,77,77,0.4)' }
              : { background: '#fff', color: '#9ca3af', border: '1px solid #f3f4f6' }}
          >
            {p === 'all' ? 'Todas' : p === 'Q3 2026' ? 'Muy pronto · Q3 2026' : p === 'Q4 2026' ? 'Este año · Q4 2026' : 'En camino · 2027'}
          </button>
        ))}
      </div>

      {/* CAROUSEL */}
      <div className="relative">
        {/* Arrow left */}
        <button
          onClick={prev} disabled={safeIdx === 0}
          className="absolute -left-5 top-1/2 -translate-y-6 z-20 h-10 w-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Track */}
        <div style={{ padding: '24px 0 28px', overflow: 'visible' }}>
          <motion.div
            ref={trackRef}
            className="flex items-end"
            style={{ gap: GAP }}
            animate={{ x: `calc(50% - ${CARD_W / 2}px - ${safeIdx * (CARD_W + GAP)}px)` }}
            transition={{ type: 'spring', damping: 36, stiffness: 280 }}
          >
            {filtered.map((f, i) => {
              const isActive = i === safeIdx;
              return (
                <motion.div
                  key={f.id}
                  onClick={() => { if (isActive) setSelectedId(f.id); else setActiveIdx(i); }}
                  animate={{ opacity: isActive ? 1 : 0.6, scale: isActive ? 1 : 0.93, y: isActive ? 0 : 18 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 260 }}
                  className="flex-shrink-0 cursor-pointer"
                  style={{ width: CARD_W }}
                >
                  {/* Image area */}
                  <div
                    className="relative flex items-center justify-center rounded-3xl overflow-hidden"
                    style={{
                      height: IMG_H,
                      background: f.gradient,
                      boxShadow: isActive
                        ? `0 32px 64px -12px ${f.accentColor}55, 0 16px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`
                        : `0 12px 32px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`,
                      transition: 'box-shadow 0.4s ease',
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 55%, ${f.accentColor}45 0%, transparent 60%)` }} />
                    <div className="absolute rounded-full border border-white/10" style={{ width: 160, height: 160 }} />
                    <div className="absolute rounded-full border border-white/6"  style={{ width: 220, height: 220 }} />
                    {isActive && (
                      <div className="absolute rounded-full"
                        style={{ width: 130, height: 130, border: `1.5px solid ${f.accentColor}40`, boxShadow: `0 0 24px 4px ${f.accentColor}25` }} />
                    )}
                    <motion.div
                      className="relative z-10"
                      style={{ color: f.accentColor }}
                      animate={{ scale: isActive ? 1.1 : 1, filter: isActive ? `drop-shadow(0 0 14px ${f.accentColor}88)` : 'none' }}
                      transition={{ duration: 0.35 }}
                    >
                      {f.icon}
                    </motion.div>
                    <div className="absolute top-4 left-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7.5px] font-black uppercase tracking-widest"
                        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', color: f.accentColor, backdropFilter: 'blur(8px)' }}
                      >
                        {PHASE_LABEL[f.phase].icon} {PHASE_LABEL[f.phase].label}
                      </span>
                    </div>
                  </div>

                  {/* Info panel — active card only */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: INFO_H, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                        className="overflow-hidden bg-white rounded-b-3xl"
                        style={{ boxShadow: `0 20px 48px -8px ${f.accentColor}30, 0 8px 24px rgba(0,0,0,0.10)` }}
                      >
                        {/* Accent line */}
                        <div className="h-[2px] w-full"
                          style={{ background: `linear-gradient(90deg, ${f.accentColor}, ${f.accentColor}44)` }} />
                        <div className="px-5 pt-3.5 pb-4">
                          {/* Title + button row */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <h3 className="text-[14px] font-black text-gray-900 leading-tight truncate">{f.title}</h3>
                              <p className="text-[9px] font-semibold mt-0.5 truncate" style={{ color: f.accentColor }}>{f.tagline}</p>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={e => { e.stopPropagation(); toggleVote(f.id); }}
                              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[8px] font-black transition-all"
                              style={votes[f.id]
                                ? { background: `${f.accentColor}15`, color: f.accentColor, border: `1px solid ${f.accentColor}30` }
                                : { background: f.accentColor, color: '#fff', boxShadow: `0 4px 14px ${f.accentColor}55` }}
                            >
                              <Star size={8} fill={votes[f.id] ? f.accentColor : '#fff'} strokeWidth={0} />
                              {votes[f.id] ? (f.votes + 1).toLocaleString('es-CO') : 'Me interesa'}
                            </motion.button>
                          </div>
                          {/* Tags */}
                          <div className="flex items-center gap-1.5">
                            {f.tags.map(t => (
                              <span
                                key={t}
                                className="text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ background: `${f.accentColor}10`, color: f.accentColor, border: `1px solid ${f.accentColor}20` }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Arrow right */}
        <button
          onClick={next} disabled={safeIdx === filtered.length - 1}
          className="absolute -right-5 top-1/2 -translate-y-6 z-20 h-10 w-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-5">
          {filtered.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === safeIdx ? 22 : 6, height: 6, background: i === safeIdx ? '#004d4d' : '#e5e7eb' }}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex justify-center pt-2"
      >
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-8 py-6 flex flex-col items-center gap-3 text-center max-w-xs">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,77,77,0.08)', color: '#004d4d' }}>
            <Zap size={17} />
          </div>
          <div>
            <p className="text-[14px] font-black text-gray-900 mb-0.5">¿Tienes una idea?</p>
            <p className="text-[11px] text-gray-400">Cuéntanos qué herramienta cambiaría tu negocio</p>
          </div>
          <button
            onClick={() => setShowIdeaModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] text-white transition-colors hover:opacity-90"
            style={{ background: '#004d4d' }}
          >
            Enviar idea <ArrowRight size={11} />
          </button>
        </div>
      </motion.div>

      {/* IDEA MODAL */}
      <AnimatePresence>
        {showIdeaModal && <IdeaModal onClose={() => setShowIdeaModal(false)} />}
      </AnimatePresence>

      {/* MODAL */}
      <AnimatePresence>
        {selectedFeature && (
          <Modal
            feature={selectedFeature}
            onClose={() => setSelectedId(null)}
            voted={!!votes[selectedFeature.id]}
            onVote={() => toggleVote(selectedFeature.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
