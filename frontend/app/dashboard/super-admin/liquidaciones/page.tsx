"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, CheckCircle2, Calendar, RefreshCw, X,
  Building2, ChevronDown, Loader2, Send, Plus, Eye, DollarSign,
  AlertCircle, BadgeCheck, Clock, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

const fmtCOP  = (n: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0)}`;
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_CFG: Record<string, { label: string; dot: string; text: string }> = {
  pending:    { label: 'Pendiente',  dot: 'bg-amber-400',   text: 'text-amber-700'  },
  scheduled:  { label: 'Programado', dot: 'bg-blue-400',    text: 'text-blue-700'   },
  processing: { label: 'Procesando', dot: 'bg-violet-400',  text: 'text-violet-700' },
  paid:       { label: 'Pagado',     dot: 'bg-emerald-400', text: 'text-emerald-700'},
  cancelled:  { label: 'Cancelado',  dot: 'bg-rose-400',    text: 'text-rose-700'   },
};

function Dot({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}/>
      {cfg.label}
    </span>
  );
}

export default function SuperAdminLiquidacionesPage() {
  const { token } = useAuth();
  const [tab, setTab]               = useState<'pending' | 'history'>('pending');
  const [loading, setLoading]       = useState(true);
  const [balances, setBalances]     = useState<any[]>([]);
  const [allLiqs, setAllLiqs]       = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPay, setShowPay]       = useState<any | null>(null);
  const [saving, setSaving]         = useState(false);

  // Form crear liquidación
  const [form, setForm] = useState({
    tenant_id: '', scheduled_date: '', notes: '', override_gross: '',
  });
  // Form marcar como pagado
  const [payForm, setPayForm] = useState({ transfer_reference: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [bal, hist] = await Promise.all([
        apiRequest<any[]>('/super-admin/liquidations/pending-balances', { token }),
        apiRequest<any[]>('/super-admin/liquidations', { token }),
      ]);
      setBalances(bal || []);
      setAllLiqs(hist || []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const totalPending = balances.reduce((a, b) => a + b.net, 0);
  const totalGross   = balances.reduce((a, b) => a + b.gross, 0);
  const countPaid    = allLiqs.filter(l => l.status === 'paid').length;
  const totalPaidNet = allLiqs.filter(l => l.status === 'paid').reduce((a, l) => a + l.net_amount, 0);

  const handleCreate = async () => {
    if (!form.tenant_id) return;
    setSaving(true);
    try {
      const bal = balances.find(b => b.tenant_id === form.tenant_id);
      const gross = form.override_gross ? parseFloat(form.override_gross.replace(/\./g,'').replace(',','.')) : (bal?.gross || 0);
      await apiRequest('/super-admin/liquidations', {
        method: 'POST', token,
        body: JSON.stringify({
          tenant_id:      form.tenant_id,
          gross_amount:   gross,
          order_count:    bal?.order_count || 0,
          scheduled_date: form.scheduled_date || undefined,
          status:         'scheduled',
          notes:          form.notes || undefined,
        }),
      });
      setShowCreate(false);
      setForm({ tenant_id: '', scheduled_date: '', notes: '', override_gross: '' });
      await load();
    } catch { /* silencioso */ }
    finally { setSaving(false); }
  };

  const handlePay = async () => {
    if (!showPay) return;
    setSaving(true);
    try {
      await apiRequest(`/super-admin/liquidations/${showPay.id}/pay`, {
        method: 'PUT', token,
        body: JSON.stringify(payForm),
      });
      setShowPay(null);
      setPayForm({ transfer_reference: '', notes: '' });
      await load();
    } catch { /* silencioso */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta liquidación?')) return;
    await apiRequest(`/super-admin/liquidations/${id}`, { method: 'DELETE', token });
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Liquidaciones</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona los pagos a empresas desde la pasarela Prix</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-500 hover:border-gray-300 transition-all">
            <RefreshCw size={12}/> Actualizar
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#004d4d] hover:bg-[#003838] text-[#ffffff] text-[10px] font-black uppercase tracking-widest transition-all">
            <Plus size={12}/> Nueva liquidación
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Por pagar (neto)',  value: fmtCOP(totalPending), sub: `${balances.length} empresas`, color: 'text-[#004d4d]', icon: <Wallet size={18}/>, bg: 'bg-[#004d4d]/5' },
          { label: 'Ventas brutas pendientes', value: fmtCOP(totalGross), sub: 'total acumulado', color: 'text-violet-600', icon: <TrendingUp size={18}/>, bg: 'bg-violet-50' },
          { label: 'Pagos realizados', value: countPaid.toString(), sub: 'historial total', color: 'text-blue-600', icon: <BadgeCheck size={18}/>, bg: 'bg-blue-50' },
          { label: 'Total transferido', value: fmtCOP(totalPaidNet), sub: 'a empresas', color: 'text-emerald-600', icon: <CheckCircle2 size={18}/>, bg: 'bg-emerald-50' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className={`h-10 w-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ${c.color}`}>{c.icon}</div>
            <div>
              <p className="text-xl font-black text-gray-900">{c.value}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{c.label}</p>
              <p className="text-[9px] text-gray-300 mt-0.5">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        {([['pending', 'Saldos pendientes'], ['history', 'Historial']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === k ? 'bg-white shadow-sm text-[#004d4d]' : 'text-gray-400 hover:text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-[#004d4d]"/></div>
      ) : tab === 'pending' ? (

        /* ── Saldos pendientes ── */
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 size={32} className="text-emerald-300 mb-2"/>
              <p className="font-bold text-gray-400">Todas las empresas están al día</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 px-5 py-3 bg-gray-50 border-b border-gray-100">
                {['Empresa','Órdenes','Venta bruta','Comisión Bayup','Neto a pagar','Acción'].map(h => (
                  <p key={h} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {balances.map((b: any) => (
                  <div key={b.tenant_id} className="grid grid-cols-6 px-5 py-4 hover:bg-gray-50 transition-colors items-center">
                    <div>
                      <p className="text-[11px] font-bold text-gray-800 truncate">{b.tenant_name}</p>
                      <p className="text-[9px] text-gray-400 truncate">{b.tenant_email}</p>
                      {b.bank_accounts?.length > 0 && (
                        <p className="text-[9px] text-[#004d4d] mt-0.5">🏦 {b.bank_accounts[0].bank} ···{String(b.bank_accounts[0].account || '').slice(-4)}</p>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-gray-600">{b.order_count}</p>
                    <p className="text-[11px] font-bold text-gray-700">{fmtCOP(b.gross)}</p>
                    <p className="text-[11px] font-bold text-rose-500">-{fmtCOP(b.bayup_fee)}</p>
                    <p className="text-[13px] font-black text-emerald-600">{fmtCOP(b.net)}</p>
                    <button
                      onClick={() => { setForm(f => ({ ...f, tenant_id: b.tenant_id })); setShowCreate(true); }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#004d4d] hover:bg-[#003838] text-[#ffffff] text-[9px] font-black uppercase tracking-widest transition-all w-fit">
                      <Send size={10}/> Liquidar
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      ) : (

        /* ── Historial ── */
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {allLiqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Wallet size={32} className="text-gray-200 mb-2"/>
              <p className="font-bold text-gray-400">Sin liquidaciones registradas</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 px-5 py-3 bg-gray-50 border-b border-gray-100">
                {['Empresa','Fecha','Ventas brutas','Neto pagado','Estado','Acciones'].map(h => (
                  <p key={h} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {allLiqs.map((l: any) => (
                  <div key={l.id} className="grid grid-cols-6 px-5 py-3.5 hover:bg-gray-50 transition-colors items-center">
                    <div>
                      <p className="text-[11px] font-bold text-gray-800 truncate">{l.tenant_name}</p>
                      <p className="text-[9px] text-gray-400 truncate">{l.tenant_email}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-600">{fmtDate(l.paid_date || l.scheduled_date || l.created_at)}</p>
                      {l.transfer_reference && <p className="text-[9px] text-[#004d4d]">Ref: {l.transfer_reference}</p>}
                    </div>
                    <p className="text-[11px] font-bold text-gray-700">{fmtCOP(l.gross_amount)}</p>
                    <p className="text-[13px] font-black text-emerald-600">{fmtCOP(l.net_amount)}</p>
                    <Dot status={l.status}/>
                    <div className="flex items-center gap-1.5">
                      {l.status !== 'paid' && (
                        <button onClick={() => { setShowPay(l); setPayForm({ transfer_reference: '', notes: '' }); }}
                          className="h-7 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#ffffff] text-[9px] font-black transition-all flex items-center gap-1">
                          <CheckCircle2 size={10}/> Pagar
                        </button>
                      )}
                      {l.status !== 'paid' && (
                        <button onClick={() => handleDelete(l.id)}
                          className="h-7 w-7 rounded-lg bg-rose-50 hover:bg-rose-500 text-rose-400 hover:text-white text-[9px] transition-all flex items-center justify-center">
                          <X size={11}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modal crear liquidación ── */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm"/>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] p-8 space-y-5 shadow-2xl z-10" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900">Nueva Liquidación</h3>
                <button onClick={() => setShowCreate(false)} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><X size={14}/></button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Empresa *</label>
                  <select value={form.tenant_id} onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#004d4d]/40">
                    <option value="">Seleccionar empresa…</option>
                    {balances.map(b => (
                      <option key={b.tenant_id} value={b.tenant_id}>{b.tenant_name} — {fmtCOP(b.net)} pendiente</option>
                    ))}
                  </select>
                </div>

                {form.tenant_id && (() => {
                  const b = balances.find(x => x.tenant_id === form.tenant_id);
                  if (!b) return null;
                  return (
                    <div className="p-3 bg-[#004d4d]/5 border border-[#004d4d]/15 rounded-xl space-y-1">
                      <p className="text-[9px] font-bold text-[#004d4d] uppercase tracking-widest">Resumen automático</p>
                      <p className="text-[10px] text-gray-600">{b.order_count} órdenes · Bruto: {fmtCOP(b.gross)} · <strong className="text-emerald-600">Neto: {fmtCOP(b.net)}</strong></p>
                      {b.bank_accounts?.length > 0 && <p className="text-[10px] text-gray-500">🏦 {b.bank_accounts[0].bank} · {b.bank_accounts[0].account}</p>}
                    </div>
                  );
                })()}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Fecha programada de pago</label>
                  <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#004d4d]/40"/>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Notas internas (opcional)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    placeholder="Ej: Pago martes 08-jul, transferencia BCOLOMBIA"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/40 resize-none"/>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-[9px] font-bold text-gray-500">Cancelar</button>
                <button onClick={handleCreate} disabled={!form.tenant_id || saving}
                  className="flex-[2] h-10 rounded-xl bg-[#004d4d] hover:bg-[#003838] text-[#ffffff] text-[9px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                  {saving ? 'Guardando…' : 'Crear liquidación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal marcar pagado ── */}
      <AnimatePresence>
        {showPay && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPay(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm"/>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 space-y-5 shadow-2xl z-10" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900">Confirmar Pago</h3>
                <button onClick={() => setShowPay(null)} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><X size={14}/></button>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mb-1">{showPay.tenant_name}</p>
                <p className="text-2xl font-black text-emerald-700">{fmtCOP(showPay.net_amount)}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">{showPay.order_count} órdenes · {fmtDate(showPay.scheduled_date)}</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Referencia bancaria *</label>
                  <input value={payForm.transfer_reference} onChange={e => setPayForm(f => ({ ...f, transfer_reference: e.target.value }))}
                    placeholder="Ej: TXN20260701-BCOLOMBIA"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/40"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Notas (opcional)</label>
                  <textarea value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#004d4d]/40 resize-none"/>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowPay(null)} className="flex-1 h-10 rounded-xl border border-gray-200 text-[9px] font-bold text-gray-500">Cancelar</button>
                <button onClick={handlePay} disabled={!payForm.transfer_reference || saving}
                  className="flex-[2] h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[#ffffff] text-[9px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle2 size={13}/>}
                  {saving ? 'Procesando…' : 'Marcar como pagado'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
