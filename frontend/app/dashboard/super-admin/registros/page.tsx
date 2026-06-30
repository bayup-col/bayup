"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { useSuperAdminTheme } from "@/context/super-admin-theme-context";
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Search, X, RefreshCw, Mail, Phone, Calendar,
  CheckCircle2, ChevronRight, Loader2, Settings, Copy
} from 'lucide-react';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

interface Registration {
  id: string; full_name: string; email: string; phone?: string;
  category?: string; email_confirmed: boolean; reviewer_notes?: string | null;
  created_at: string;
}

const AVATAR_COLORS_DARK = ['#004d4d', '#1e1b4b', '#14532d', '#7c2d12', '#1e3a5f'];
const AVATAR_COLORS_LIGHT = ['#0d9488', '#4f46e5', '#16a34a', '#ea580c', '#2563eb'];

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const { saTheme } = useSuperAdminTheme();
  const colors = saTheme === 'light' ? AVATAR_COLORS_LIGHT : AVATAR_COLORS_DARK;
  const idx = (name || '?').charCodeAt(0) % colors.length;
  return (
    <div className={`h-${size} w-${size} rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm shadow-sm`}
      style={{ backgroundColor: colors[idx] }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function RegistrosPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Registration | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${base}/super-admin/registrations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setRegistrations(Array.isArray(d) ? d : []); }
    } catch {}
    setLoading(false);
  }, [token, base]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selected) {
      document.body.classList.add('modal-open');
      setNotesDraft(selected.reviewer_notes || '');
      return () => { document.body.classList.remove('modal-open'); };
    }
  }, [selected]);

  const filtered = useMemo(() => registrations.filter(r => {
    const q = search.toLowerCase();
    return !q || r.full_name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
  }), [registrations, search]);

  const confirmedCount = registrations.filter(r => r.email_confirmed).length;

  const saveNotes = async () => {
    if (!token || !selected) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`${base}/super-admin/registrations/${selected.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewer_notes: notesDraft || null }),
      });
      if (res.ok) {
        setRegistrations(p => p.map(x => x.id === selected.id ? { ...x, reviewer_notes: notesDraft } : x));
        setSelected(p => p ? { ...p, reviewer_notes: notesDraft } : p);
        showToast('Nota guardada', 'success');
      } else {
        showToast('No se pudo guardar la nota', 'error');
      }
    } catch {
      showToast('No se pudo guardar la nota', 'error');
    }
    setSavingNotes(false);
  };

  const goConfigure = (r: Registration) => {
    router.push(`/onboarding?targetUserId=${r.id}`);
  };

  return (
    <div className="space-y-6 pb-12">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Gestión · Aprobación manual</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Registros</h1>
        </div>
        <button onClick={load}
          className="h-9 w-9 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <p className="text-[11px] text-white/25 max-w-2xl leading-relaxed">
        Clientes que ya se registraron y confirmaron su correo, esperando que configures y apruebes su tienda. En cuanto la apruebes desde el wizard de onboarding, pasan al módulo "Empresas".
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Pendientes', value: registrations.length, color: '#00f2ff', icon: <UserPlus size={14} /> },
          { label: 'Correo confirmado', value: confirmedCount, color: '#10b981', icon: <CheckCircle2 size={14} /> },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${k.color}12`, color: k.color }}>{k.icon}</div>
            <div>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{k.label}</p>
              <p className="text-xl font-black text-white">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="flex-1 flex items-center gap-2.5 h-9 bg-white/4 rounded-xl border border-white/6 px-3.5">
            <Search size={13} className="text-white/20 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="flex-1 bg-transparent outline-none text-[12px] text-white/60 placeholder:text-white/15" />
            {search && <button onClick={() => setSearch('')}><X size={11} className="text-white/20" /></button>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_40px] gap-4 px-5 py-2.5 border-b border-white/[0.04] min-w-[700px]">
            {['Cliente', 'Contacto', 'Correo', 'Registro', ''].map((h, i) => (
              <p key={i} className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">{h}</p>
            ))}
          </div>

          <div className="divide-y divide-white/[0.04] min-w-[700px]">
            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center text-[10px] text-white/20">
                {registrations.length === 0 ? 'No hay registros pendientes de aprobación' : 'Sin resultados para el filtro aplicado'}
              </div>
            )}
            {filtered.map(r => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_40px] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.025] transition-all group cursor-pointer"
                onClick={() => setSelected(r)}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={r.full_name} size={8} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white/80 truncate">{r.full_name}</p>
                    {r.category && <p className="text-[9px] text-white/20">{r.category}</p>}
                  </div>
                </div>
                <p className="text-[11px] text-white/30 truncate">{r.email}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${r.email_confirmed ? 'bg-[#10b981]' : 'bg-amber-400'}`} />
                  <span className={`text-[9px] font-semibold ${r.email_confirmed ? 'text-[#10b981]/70' : 'text-amber-400/70'}`}>
                    {r.email_confirmed ? 'Confirmado' : 'Sin confirmar'}
                  </span>
                </div>
                <p className="text-[10px] text-white/20">{fmtDate(r.created_at)}</p>
                <button onClick={e => { e.stopPropagation(); setSelected(r); }}
                  className="h-8 w-8 rounded-lg bg-white/4 hover:bg-white/10 flex items-center justify-center text-white/20 hover:text-white/60 transition-all opacity-0 group-hover:opacity-100">
                  <ChevronRight size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.04]">
            <p className="text-[10px] text-white/15">{filtered.length} registro{filtered.length !== 1 ? 's' : ''} pendiente{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[440px] bg-[#080c0c] border-l border-white/6 shadow-2xl flex flex-col z-[9999]">

              <div className="px-6 py-6 border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setSelected(null)}
                    className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white transition-all">
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${selected.email_confirmed ? 'bg-[#10b981]' : 'bg-amber-400'}`} />
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{selected.email_confirmed ? 'Correo confirmado' : 'Correo sin confirmar'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar name={selected.full_name} size={14} />
                  <div>
                    <h2 className="text-lg font-black text-white">{selected.full_name}</h2>
                    <p className="text-[10px] text-white/30">{selected.category || 'Sin categoría'}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1.5">
                {[
                  { icon: <Mail size={12} />, label: 'Email', value: selected.email },
                  { icon: <Phone size={12} />, label: 'Teléfono', value: selected.phone || '—' },
                  { icon: <Calendar size={12} />, label: 'Registro', value: fmtDate(selected.created_at) },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]">
                    <span className="text-white/20 w-4 shrink-0">{row.icon}</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase w-16 shrink-0">{row.label}</span>
                    <span className="text-[11px] text-white/50 truncate flex-1">{row.value}</span>
                  </div>
                ))}

                <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mb-1.5">ID de usuario</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-mono text-white/25 flex-1 truncate">{selected.id}</p>
                    <button onClick={() => { navigator.clipboard.writeText(selected.id); showToast('Copiado', 'success'); }}>
                      <Copy size={11} className="text-white/20 hover:text-white/50" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Notas para el cliente</p>
                  <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={3}
                    placeholder="Ej. Aprobado para Tier 1 — visible mientras está pendiente"
                    className="w-full p-3 bg-white/[0.03] border border-white/8 rounded-xl text-[12px] text-white/70 outline-none focus:border-cyan-400/30 resize-none" />
                  <button onClick={saveNotes} disabled={savingNotes}
                    className="w-full h-9 rounded-xl bg-white/4 hover:bg-white/8 text-white/40 hover:text-white/70 text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {savingNotes ? <Loader2 size={12} className="animate-spin" /> : null} Guardar nota
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 space-y-2.5 border-t border-white/5 shrink-0">
                <button onClick={() => goConfigure(selected)}
                  className="w-full h-11 rounded-2xl bg-[#00f2ff]/12 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/25 text-[#00f2ff] font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <Settings size={13} /> Configurar y aprobar
                </button>
                <p className="text-[9px] text-white/20 text-center leading-relaxed px-2">
                  Te lleva al mismo wizard de plantilla/tienda/producto, ahora aplicado a la cuenta de este cliente. Al publicar, queda aprobado y pasa a "Empresas".
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
