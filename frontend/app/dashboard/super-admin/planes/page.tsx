"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { CreditCard, X, Star, Loader2, RefreshCw, Percent, Layers } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  commission_rate: number;
  monthly_fee: number;
  modules: string[];
  is_default: boolean;
}

export default function PlanesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [form, setForm] = useState({ description: '', monthly_fee: '', commission_rate: '', modules: '', is_default: false });
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/plans`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setPlans(Array.isArray(d) ? d : []); }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (p: Plan) => {
    setSelected(p);
    setForm({
      description: p.description || '',
      monthly_fee: String(p.monthly_fee),
      commission_rate: String(Math.round(p.commission_rate * 1000) / 10),
      modules: (p.modules || []).join(', '),
      is_default: p.is_default,
    });
  };

  const save = async () => {
    if (!selected || !token) return;
    setIsSaving(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/plans/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description: form.description,
          monthly_fee: Number(form.monthly_fee) || 0,
          commission_rate: (Number(form.commission_rate) || 0) / 100,
          modules: form.modules.split(',').map(m => m.trim()).filter(Boolean),
          is_default: form.is_default,
        }),
      });
      if (res.ok) {
        showToast('Plan actualizado', 'success');
        setSelected(null);
        load();
      } else {
        showToast('No se pudo actualizar el plan', 'error');
      }
    } catch {
      showToast('No se pudo actualizar el plan', 'error');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Plataforma · Monetización</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Planes</h1>
        </div>
        <button onClick={load}
          className="h-9 w-9 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-white/20" size={28} /></div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] py-16 text-center text-[11px] text-white/20">
          No hay planes configurados todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map(p => (
            <div key={p.id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-7 flex flex-col gap-5 relative overflow-hidden">
              {p.is_default && (
                <span className="absolute top-5 right-5 text-[8px] font-black px-2 py-1 rounded-lg bg-[#00f2ff]/10 text-[#00f2ff] flex items-center gap-1">
                  <Star size={10} /> Predeterminado
                </span>
              )}
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00f2ff]">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{p.name}</h3>
                <p className="text-[11px] text-white/30 mt-1">{p.description}</p>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-white">${p.monthly_fee}</span>
                <span className="text-[10px] text-white/20 mb-1">/mes</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <Percent size={11} /> Comisión Bayup: {(p.commission_rate * 100).toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <Layers size={11} /> {p.modules.length} módulos incluidos
              </div>
              <button onClick={() => openEdit(p)}
                className="mt-auto h-9 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">
                Editar plan
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={() => setSelected(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[460px] bg-[#080c0c] border-l border-white/6 flex flex-col z-[9999]">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-sm font-black text-white">Editar {selected.name}</h2>
                <button onClick={() => setSelected(null)}
                  className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                <div>
                  <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Descripción</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full h-10 px-3.5 bg-white/5 border border-white/8 rounded-xl text-[12px] text-white/70 outline-none focus:border-white/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Mensualidad (USD)</label>
                    <input type="number" min="0" value={form.monthly_fee} onChange={e => setForm(f => ({ ...f, monthly_fee: e.target.value }))}
                      className="w-full h-10 px-3.5 bg-white/5 border border-white/8 rounded-xl text-[12px] text-white/70 outline-none focus:border-white/20" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Comisión (%)</label>
                    <input type="number" min="0" max="100" step="0.1" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))}
                      className="w-full h-10 px-3.5 bg-white/5 border border-white/8 rounded-xl text-[12px] text-white/70 outline-none focus:border-white/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Módulos incluidos (separados por coma)</label>
                  <textarea value={form.modules} onChange={e => setForm(f => ({ ...f, modules: e.target.value }))} rows={5}
                    className="w-full px-3.5 py-3 bg-white/5 border border-white/8 rounded-xl text-[11px] text-white/70 outline-none focus:border-white/20 resize-none" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                    className="h-4 w-4 accent-[#00f2ff]" />
                  <span className="text-[11px] text-white/50">Asignar este plan automáticamente a cuentas nuevas</span>
                </label>
              </div>
              <div className="px-6 py-4 border-t border-white/5 shrink-0">
                <button onClick={save} disabled={isSaving}
                  className="w-full h-11 rounded-xl bg-[#00f2ff]/10 hover:bg-[#00f2ff]/15 border border-[#00f2ff]/20 text-[#00f2ff] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Guardar cambios'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
