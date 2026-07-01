"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import {
  MessageSquare, Search, X, CheckCircle2, Clock,
  AlertTriangle, Send, Building2, User, Tag, RefreshCw
} from 'lucide-react';

const fmtDate = (d: string|null) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

interface Ticket {
  id:string; title:string; company:string; userEmail:string|null;
  priority:'Alta'|'Media'|'Baja'; status:'Abierto'|'En proceso'|'Resuelto';
  category:string; createdAt:string|null;
  messages: { sender:'usuario'|'soporte'; text:string; time:string }[];
}

const PR_COLOR: Record<string,string> = { Alta:'#ef4444', Media:'#f59e0b', Baja:'#6b7280' };
const ST_COLOR: Record<string,string> = { Abierto:'#00f2ff', 'En proceso':'#f59e0b', Resuelto:'#10b981' };
const ST_ICON:  Record<string,any>    = { Abierto:<AlertTriangle size={9}/>, 'En proceso':<Clock size={9}/>, Resuelto:<CheckCircle2 size={9}/> };

export default function SoportePage() {
  const { token }      = useAuth();
  const { showToast }  = useToast();
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [filterSt, setFilterSt] = useState('');
  const [selected, setSelected] = useState<Ticket|null>(null);
  const [reply,    setReply]    = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      const res = await fetch(`${base}/super-admin/support/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setTickets(Array.isArray(d) ? d : []); }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Activa el overlay raíz de dashboard/layout.tsx (cubre TODO el viewport real
  // y oculta sidebar/header) en vez de animar un backdrop oscuro local — evita
  // la doble capa desincronizada. Mismo patrón que customers/products/web-templates.
  useEffect(() => {
    if (selected) {
      document.body.classList.add('modal-open');
      return () => { document.body.classList.remove('modal-open'); };
    }
  }, [selected]);

  const filtered = useMemo(() => tickets.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.title.toLowerCase().includes(q) || t.company.toLowerCase().includes(q))
      && (!filterSt || t.status === filterSt);
  }), [tickets, search, filterSt]);

  const sendReply = async () => {
    if (!reply.trim() || !selected || !token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      const res = await fetch(`${base}/super-admin/support/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: reply }),
      });
      if (res.ok) {
        const upd = await res.json();
        setTickets(p => p.map(t => t.id===selected.id ? upd : t));
        setSelected(upd);
        setReply('');
        showToast('Respuesta enviada','success');
      } else {
        showToast('No se pudo enviar la respuesta','error');
      }
    } catch {
      showToast('No se pudo enviar la respuesta','error');
    }
  };

  const resolve = async () => {
    if (!selected || !token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      const res = await fetch(`${base}/super-admin/support/tickets/${selected.id}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const upd = await res.json();
        setTickets(p => p.map(t => t.id===selected.id ? upd : t));
        setSelected(upd);
        showToast('Ticket resuelto ✓','success');
      } else {
        showToast('No se pudo resolver el ticket','error');
      }
    } catch {
      showToast('No se pudo resolver el ticket','error');
    }
  };

  return (
    <div className="space-y-6 pb-12">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Centro de soporte · Multi-tenant</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Soporte</h1>
        </div>
        <button onClick={load}
          className="h-9 w-9 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Abiertos',       value: tickets.filter(t=>t.status==='Abierto').length,      color:'#00f2ff' },
          { label:'En proceso',     value: tickets.filter(t=>t.status==='En proceso').length,   color:'#f59e0b' },
          { label:'Resueltos',      value: tickets.filter(t=>t.status==='Resuelto').length,     color:'#10b981' },
          { label:'Alta prioridad', value: tickets.filter(t=>t.priority==='Alta').length,       color:'#ef4444' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1.5">{k.label}</p>
            <p className="text-2xl font-black" style={{ color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla tickets */}
      <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
          <div className="flex-1 flex items-center gap-2.5 h-9 bg-white/4 rounded-xl border border-white/6 px-3.5">
            <Search size={13} className="text-white/20 shrink-0"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tickets…"
              className="flex-1 bg-transparent outline-none text-[12px] text-white/60 placeholder:text-white/15"/>
          </div>
          <div className="flex gap-1.5">
            {[['','Todos'],['Abierto','Abiertos'],['En proceso','En proceso'],['Resuelto','Resueltos']].map(([v,l]) => (
              <button key={v} onClick={() => setFilterSt(v)}
                className={`h-8 px-3 rounded-lg text-[9px] font-bold transition-all ${filterSt===v ? 'bg-white/10 text-white border border-white/15' : 'text-white/25 hover:text-white/50'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
        <div className="grid grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 border-b border-white/[0.04] min-w-[760px]">
          {['ID','Asunto','Empresa','Prioridad','Estado','Fecha'].map((h,i) => (
            <p key={i} className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-white/[0.04] min-w-[760px]">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-[10px] text-white/20">
              {tickets.length === 0 ? 'Aún no hay tickets de soporte' : 'Sin resultados para el filtro aplicado'}
            </div>
          )}
          {filtered.map(t => (
            <div key={t.id}
              className="grid grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.025] transition-all cursor-pointer"
              onClick={() => setSelected(t)}>
              <span className="text-[9px] font-mono text-white/20">{t.id}</span>
              <div>
                <p className="text-[12px] font-semibold text-white/70 truncate">{t.title}</p>
                <p className="text-[9px] text-white/20">{t.category}</p>
              </div>
              <p className="text-[11px] text-white/30 truncate">{t.company}</p>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-lg w-fit"
                style={{ backgroundColor:`${PR_COLOR[t.priority]}12`, color:PR_COLOR[t.priority] }}>{t.priority}</span>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit"
                style={{ backgroundColor:`${ST_COLOR[t.status]}10`, color:ST_COLOR[t.status] }}>
                {ST_ICON[t.status]}{t.status}
              </span>
              <p className="text-[9px] text-white/20">{fmtDate(t.createdAt)}</p>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Drawer ticket */}
      <AnimatePresence>
        {selected && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setSelected(null)}/>
            <motion.div
              initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
              transition={{type:'spring',damping:30,stiffness:300}}
              className="fixed top-0 right-0 h-full w-[480px] bg-[#080c0c] border-l border-white/6 flex flex-col z-[9999]">

              <div className="px-6 py-5 border-b border-white/5 shrink-0">
                <div className="flex justify-between mb-4">
                  <button onClick={() => setSelected(null)}
                    className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white">
                    <X size={14}/>
                  </button>
                  <span className="text-[8px] font-black px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{ backgroundColor:`${ST_COLOR[selected.status]}10`, color:ST_COLOR[selected.status] }}>
                    {ST_ICON[selected.status]}{selected.status}
                  </span>
                </div>
                <p className="text-[8px] font-mono text-white/20 mb-1">{selected.id}</p>
                <h2 className="text-sm font-black text-white mb-3">{selected.title}</h2>
                <div className="flex items-center gap-3 text-[9px] text-white/25">
                  <span className="flex items-center gap-1"><Building2 size={9}/>{selected.company}</span>
                  <span className="flex items-center gap-1"><Tag size={9}/>{selected.category}</span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded"
                    style={{ backgroundColor:`${PR_COLOR[selected.priority]}12`, color:PR_COLOR[selected.priority] }}>
                    {selected.priority}
                  </span>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {selected.messages.map((msg,i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.sender==='soporte'?'justify-end':'justify-start'}`}>
                    {msg.sender!=='soporte' && (
                      <div className="h-7 w-7 rounded-xl bg-white/8 flex items-center justify-center shrink-0 mt-auto">
                        <User size={11} className="text-white/30"/>
                      </div>
                    )}
                    <div className={`max-w-[78%] flex flex-col gap-1 ${msg.sender==='soporte'?'items-end':'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-[12px] font-medium leading-relaxed ${
                        msg.sender==='soporte' ? 'bg-[#004d4d]/40 text-white/80 border border-[#004d4d]/30 rounded-br-sm' : 'bg-white/5 border border-white/6 text-white/50 rounded-bl-sm'
                      }`}>{msg.text}</div>
                      <span className="text-[8px] text-white/15 px-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-white/5 space-y-2.5 shrink-0">
                {selected.status !== 'Resuelto' ? (
                  <>
                    <div className="flex gap-2">
                      <input value={reply} onChange={e => setReply(e.target.value)}
                        onKeyDown={e => e.key==='Enter' && sendReply()}
                        placeholder="Escribir respuesta…"
                        className="flex-1 h-10 px-3.5 bg-white/5 border border-white/8 rounded-xl text-[12px] text-white/60 placeholder:text-white/20 outline-none focus:border-white/15 transition-all"/>
                      <button onClick={sendReply} disabled={!reply.trim()}
                        className="h-10 w-10 rounded-xl bg-[#004d4d]/50 hover:bg-[#004d4d] border border-[#004d4d]/30 flex items-center justify-center text-[#00f2ff]/60 hover:text-[#00f2ff] transition-all disabled:opacity-30">
                        <Send size={13}/>
                      </button>
                    </div>
                    <button onClick={resolve}
                      className="w-full h-9 rounded-xl bg-[#10b981]/8 hover:bg-[#10b981]/15 border border-[#10b981]/15 text-[#10b981]/60 hover:text-[#10b981] font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all">
                      <CheckCircle2 size={12}/> Marcar como resuelto
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <CheckCircle2 size={14} className="text-[#10b981]"/>
                    <p className="text-[11px] font-black text-[#10b981]/70">Ticket resuelto</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
