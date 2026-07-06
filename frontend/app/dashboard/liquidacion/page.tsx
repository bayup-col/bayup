"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle, Calendar,
  ChevronDown, ChevronRight, RefreshCw, Package, DollarSign,
  ArrowUpRight, Building2, Info, X, ShieldCheck, Loader2, BadgeCheck, Store
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

const fmtCOP = (n: number) =>
  `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0)}`;

const fmtDate = (s: string | null) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pendiente',   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   icon: <Clock size={11}/> },
  scheduled:  { label: 'Programado',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     icon: <Calendar size={11}/> },
  processing: { label: 'Procesando',  color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', icon: <RefreshCw size={11}/> },
  paid:       { label: 'Pagado',      color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200',icon: <CheckCircle2 size={11}/> },
  cancelled:  { label: 'Cancelado',   color: 'text-rose-600',   bg: 'bg-rose-50 border-rose-200',      icon: <X size={11}/> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function LiquidacionPage() {
  const { token } = useAuth();
  const [loading, setLoading]     = useState(true);
  const [summary, setSummary]     = useState<any>(null);
  const [history, setHistory]     = useState<any[]>([]);
  const [posHistory, setPosHistory] = useState<any[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [showPosHistory, setShowPosHistory] = useState(false);
  const [activeHistId, setActiveHistId] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [sum, hist, posHist] = await Promise.all([
        apiRequest<any>('/admin/liquidations/summary', { token }),
        apiRequest<any[]>('/admin/liquidations', { token }),
        apiRequest<any[]>('/admin/pos-commissions', { token }),
      ]);
      setSummary(sum);
      setHistory(hist || []);
      setPosHistory(posHist || []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#004d4d]"/>
    </div>
  );

  const pending     = summary?.pending || {};
  const hist        = summary?.history || {};
  const nextDates   = summary?.next_payment_dates || [];
  const scheduled   = summary?.scheduled_liquidation;
  const orders      = summary?.pending_orders || [];


  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Liquidación</h1>
          <p className="text-sm text-gray-400 mt-0.5">Seguimiento de tus ventas y pagos de Bayup</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-500 hover:border-[#004d4d]/30 hover:text-[#004d4d] transition-all">
          <RefreshCw size={12}/> Actualizar
        </button>
      </div>

      {/* ── Aviso de cómo funciona ── */}
      <div className="flex items-start gap-3 p-4 bg-[#004d4d]/5 border border-[#004d4d]/15 rounded-2xl">
        <Info size={15} className="text-[#004d4d] mt-0.5 shrink-0"/>
        <p className="text-[11px] text-[#004d4d]/80 leading-relaxed">
          Bayup aplica una comisión del <strong>2.5%</strong> sobre todas tus ventas.
          Las ventas <strong>web</strong> se dispersan martes y viernes (neto = venta − comisión).
          Las ventas <strong>POS</strong> ya las cobraste tú — Bayup descuenta su comisión de la próxima dispersión web.
        </p>
      </div>

      {/* ── Cards principales ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Saldo pendiente */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#001a1a] via-[#002626] to-[#003333] rounded-2xl p-7 text-white relative overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-[#00f2ff]/5 blur-2xl pointer-events-none"/>
          <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[#004d4d]/60 blur-2xl pointer-events-none"/>
          <div className="absolute top-4 right-4 opacity-[0.04]"><Wallet size={110}/></div>

          {/* Badge estado */}
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-white/50 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-pulse"/>
              Próxima transferencia
            </span>
          </div>

          {/* Monto principal */}
          <h2 className="text-5xl font-black tracking-tight text-[#00f2ff] leading-none">{fmtCOP(Math.max(0, pending.net))}</h2>
          <p className="text-[10px] text-white/25 mt-1.5 mb-5">
            {pending.net >= 0
              ? 'Lo que Bayup te transferirá (ventas web neto − comisión POS)'
              : 'Comisión POS acumulada — se cobrará en la próxima dispersión'}
          </p>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-5"/>

          {/* Stats desglosados */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Ventas web pendientes</p>
              <p className="text-base font-black text-white/80">{fmtCOP(pending.web_gross || 0)}</p>
              <p className="text-[9px] text-white/20">{pending.web_count || 0} pedidos · neto {fmtCOP(pending.web_net || 0)}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-[8px] text-amber-300/60 uppercase tracking-widest mb-1">Comisión POS por cobrar</p>
              <p className="text-base font-black text-amber-300">{fmtCOP(pending.pos_commission || 0)}</p>
              <p className="text-[9px] text-amber-300/30">{pending.pos_count || 0} ventas · bruto {fmtCOP(pending.pos_gross || 0)}</p>
            </div>
          </div>
          <div className="bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[8px] text-[#00f2ff]/50 uppercase tracking-widest mb-0.5">Te transferimos</p>
              <p className="text-[9px] text-white/30">Web neto − comisión POS</p>
            </div>
            <p className="text-xl font-black text-[#00f2ff]">{fmtCOP(Math.max(0, pending.net))}</p>
          </div>
        </div>

        {/* Próximo pago */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 flex items-center gap-1.5 mb-3">
              <Calendar size={10}/> Próximos pagos
            </p>
            {scheduled ? (
              <div className="space-y-2">
                <StatusBadge status={scheduled.status}/>
                <p className="text-2xl font-black text-[#004d4d] mt-2">{fmtCOP(scheduled.net_amount)}</p>
                <p className="text-[10px] text-gray-400">Programado para <strong className="text-gray-700">{fmtDate(scheduled.scheduled_date)}</strong></p>
              </div>
            ) : (
              <div className="space-y-2 mt-1">
                <p className="text-[11px] text-gray-500">Fechas estimadas de transferencia:</p>
                {nextDates.map((d: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="h-6 w-6 rounded-lg bg-[#004d4d]/10 flex items-center justify-center shrink-0">
                      <Calendar size={11} className="text-[#004d4d]"/>
                    </div>
                    <p className="text-[11px] font-bold text-gray-700">{fmtDate(d)}</p>
                    {i === 0 && <span className="ml-auto text-[8px] font-black text-[#004d4d] bg-[#004d4d]/10 px-1.5 py-0.5 rounded-md">Próximo</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-[9px] text-gray-300 mt-4">Pagos los martes y viernes</p>
        </div>
      </div>

      {/* ── Stats históricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total recibido', value: fmtCOP(hist.total_paid_net),  icon: <TrendingUp size={14}/>, color: 'text-emerald-600' },
          { label: 'Pagos realizados',value: `${hist.payment_count || 0}`, icon: <BadgeCheck size={14}/>, color: 'text-blue-600' },
          { label: 'Ventas totales', value: fmtCOP(hist.total_paid_gross), icon: <DollarSign size={14}/>, color: 'text-violet-600' },
          { label: 'Comisión Bayup', value: fmtCOP(hist.total_bayup_earned), icon: <Building2 size={14}/>, color: 'text-gray-500' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className={`${color} mb-2`}>{icon}</div>
            <p className="text-xl font-black text-gray-900">{value}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Órdenes pendientes de liquidar ── */}
      {orders.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowOrders(!showOrders)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-[#004d4d]"/>
              <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Ventas pendientes de cobro</p>
              <span className="text-[9px] font-black text-[#004d4d] bg-[#004d4d]/10 px-2 py-0.5 rounded-full">{orders.length}</span>
            </div>
            {showOrders ? <ChevronDown size={14} className="text-gray-400"/> : <ChevronRight size={14} className="text-gray-400"/>}
          </button>
          <AnimatePresence>
            {showOrders && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="border-t border-gray-100">
                  <div className="grid grid-cols-5 px-5 py-2 bg-gray-50 border-b border-gray-100">
                    {['Cliente', 'Canal', 'Fecha', 'Venta bruta', 'Efecto'].map(h => (
                      <p key={h} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{h}</p>
                    ))}
                  </div>
                  <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                    {orders.map((o: any) => {
                      const isPos = (o.source || '').toLowerCase() === 'pos';
                      return (
                        <div key={o.id} className="grid grid-cols-5 px-5 py-3 hover:bg-gray-50 transition-colors">
                          <p className="text-[11px] font-semibold text-gray-700 truncate">{o.customer_name || '—'}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full self-center w-fit ${isPos ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isPos ? 'POS' : 'Web'}
                          </span>
                          <p className="text-[11px] text-gray-400">{fmtDate(o.created_at)}</p>
                          <p className="text-[11px] font-bold text-gray-700">{fmtCOP(o.total_price)}</p>
                          {isPos ? (
                            <div>
                              <p className="text-[10px] font-black text-amber-600">−{fmtCOP(o.commission)}</p>
                              <p className="text-[8px] text-gray-300">comisión Bayup</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[10px] font-black text-emerald-600">+{fmtCOP(o.net)}</p>
                              <p className="text-[8px] text-gray-300">recibes este neto</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                    <p className="text-[10px] font-bold text-gray-500">Próxima transferencia neta</p>
                    <p className="text-[10px] font-black text-[#004d4d]">{fmtCOP(Math.max(0, pending.net))}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Historial de liquidaciones ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ShieldCheck size={15} className="text-[#004d4d]"/>
          <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Historial de pagos</p>
          <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{history.length}</span>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3"><Wallet size={22} className="text-gray-300"/></div>
            <p className="text-sm font-bold text-gray-400">Aún no has recibido pagos</p>
            <p className="text-[11px] text-gray-300 mt-1">Aquí aparecerán tus liquidaciones una vez que Bayup procese tus ventas</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 px-5 py-2 bg-gray-50 border-b border-gray-100">
              {['Período', 'Ventas', 'Descuentos', 'Neto recibido', 'Estado'].map(h => (
                <p key={h} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {history.map((l: any) => (
                <div key={l.id}>
                  <button
                    onClick={() => setActiveHistId(activeHistId === l.id ? null : l.id)}
                    className="w-full grid grid-cols-5 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-700">{l.period_start ? fmtDate(l.period_start) : fmtDate(l.created_at)}</p>
                      <p className="text-[9px] text-gray-400">{l.order_count} órdenes</p>
                    </div>
                    <p className="text-[11px] font-bold text-gray-700 self-center">{fmtCOP(l.gross_amount)}</p>
                    <div className="self-center">
                      <p className="text-[10px] text-rose-500">-{fmtCOP(l.bayup_commission + l.prix_fee)}</p>
                      <p className="text-[9px] text-gray-300">Comisión Bayup</p>
                    </div>
                    <p className="text-[13px] font-black text-emerald-600 self-center">{fmtCOP(l.net_amount)}</p>
                    <div className="self-center"><StatusBadge status={l.status}/></div>
                  </button>
                  <AnimatePresence>
                    {activeHistId === l.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4 pt-2 bg-gray-50 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Fecha de pago</p>
                            <p className="text-[11px] font-bold text-gray-700 mt-0.5">{fmtDate(l.paid_date)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Referencia</p>
                            <p className="text-[11px] font-bold text-gray-700 mt-0.5">{l.transfer_reference || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Comisión Bayup</p>
                            <p className="text-[11px] font-bold text-rose-500 mt-0.5">-{fmtCOP(l.bayup_commission + l.prix_fee)}</p>
                          </div>
                          {l.notes && (
                            <div className="col-span-full">
                              <p className="text-[9px] text-gray-400 uppercase tracking-widest">Notas</p>
                              <p className="text-[11px] text-gray-600 mt-0.5">{l.notes}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Historial de comisiones POS cobradas ── */}
      {(posHistory.length > 0 || pending.pos_count > 0) && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowPosHistory(!showPosHistory)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <Store size={15} className="text-amber-500"/>
              <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Comisión POS</p>
              {pending.pos_count > 0 && (
                <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {pending.pos_count} ventas sin cobrar · {fmtCOP(pending.pos_commission)}
                </span>
              )}
            </div>
            {showPosHistory ? <ChevronDown size={14} className="text-gray-400"/> : <ChevronRight size={14} className="text-gray-400"/>}
          </button>
          <AnimatePresence>
            {showPosHistory && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="border-t border-gray-100">
                  {pending.pos_count > 0 && (
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                      <Store size={12} className="text-amber-600"/>
                      <p className="text-[10px] text-amber-700">
                        Tienes <strong>{pending.pos_count}</strong> ventas POS con comisión pendiente de cobro por Bayup ({fmtCOP(pending.pos_commission)}).
                        Bayup la cobrará directamente o la descontará de tu próxima dispersión web.
                      </p>
                    </div>
                  )}
                  {posHistory.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-[11px] text-gray-300">
                      Sin cobros de comisión POS registrados aún
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 px-5 py-2 bg-gray-50 border-b border-gray-100">
                        {['Fecha cobro', 'Ventas POS', 'Pedidos', 'Comisión cobrada'].map(h => (
                          <p key={h} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{h}</p>
                        ))}
                      </div>
                      <div className="divide-y divide-gray-50">
                        {posHistory.map((r: any) => (
                          <div key={r.id} className="grid grid-cols-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                            <p className="text-[11px] text-gray-600">{fmtDate(r.paid_date)}</p>
                            <p className="text-[11px] font-bold text-gray-700">{fmtCOP(r.gross_amount)}</p>
                            <p className="text-[11px] text-gray-500">{r.order_count}</p>
                            <p className="text-[11px] font-black text-amber-600">{fmtCOP(r.bayup_commission)}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
