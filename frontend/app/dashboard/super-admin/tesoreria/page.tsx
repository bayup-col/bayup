"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight, TrendingUp, Download, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const fmtCOP = (n: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0)}`;

interface MonthlyPoint { month: string; rev: number; com: number; orders: number; }
interface CompanyRow { name: string; rev: number; orders: number; plan: string; pct: number; }
interface TxnRow { id: string; company: string; amount: number; date: string | null; }

const EMPTY_MONTHLY: MonthlyPoint[] = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  .map(month => ({ month, rev: 0, com: 0, orders: 0 }));

export default function TesoreriaPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState<'dia'|'semana'|'mes'|'año'>('mes');
  const [monthly, setMonthly] = useState<MonthlyPoint[]>(EMPTY_MONTHLY);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [transactions, setTransactions] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      const res = await fetch(`${base}/super-admin/treasury`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        if (d?.monthly?.length) setMonthly(d.monthly);
        setCompanies(d?.companies || []);
        setTransactions(d?.transactions || []);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const MONTHLY = monthly;
  const COMPANIES = companies;
  const TRANSACTIONS = transactions;

  const totalRev = MONTHLY.reduce((a,m) => a + m.rev, 0);
  const totalCom = MONTHLY.reduce((a,m) => a + m.com, 0);
  const cur = MONTHLY[MONTHLY.length-1];
  const prev= MONTHLY[MONTHLY.length-2];
  const growth = prev?.rev ? Math.round(((cur.rev - prev.rev)/prev.rev)*100) : 0;
  const maxRev = Math.max(...MONTHLY.map(m => m.rev), 1);

  const periodData: Record<string, any> = {
    dia:    { rev: cur.rev/30,   com: cur.com/30,   label: 'hoy' },
    semana: { rev: cur.rev/4,    com: cur.com/4,    label: 'esta semana' },
    mes:    { rev: cur.rev,      com: cur.com,      label: 'este mes' },
    año:    { rev: totalRev,     com: totalCom,     label: 'este año' },
  };
  const pd = periodData[period];

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Control financiero · Multi-tenant</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Tesorería</h1>
        </div>
        <div className="flex items-center gap-2">
          {(['dia','semana','mes','año'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`h-8 px-3.5 rounded-xl text-[9px] font-bold transition-all ${period===p ? 'bg-white/10 text-white border border-white/15' : 'text-white/25 hover:text-white/50'}`}>
              {p}
            </button>
          ))}
          <button className="h-8 w-8 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
            <Download size={13}/>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: `Ingresos ${pd.label}`,   value: fmtCOP(pd.rev),  delta: growth,  color: '#10b981' },
          { label: `Comisión ${pd.label}`,   value: fmtCOP(pd.com),  delta: growth,  color: '#00f2ff' },
          { label: 'Acumulado anual',         value: fmtCOP(totalRev),delta: growth,  color: '#7c3aed' },
          { label: 'Comisión anual',          value: fmtCOP(totalCom),delta: growth,  color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${k.color}12`, color: k.color }}>
                <DollarSign size={16}/>
              </div>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center gap-0.5">
                <ArrowUpRight size={9}/>{k.delta}%
              </span>
            </div>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-1.5">{k.label}</p>
            <p className="text-2xl font-black text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfica de barras */}
      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">Ingresos {new Date().getFullYear()}</p>
            <p className="text-2xl font-black text-white">{fmtCOP(totalRev)}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-[#00f2ff]/40"/><span className="text-[9px] text-white/20">Ingresos</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-[#10b981]/40"/><span className="text-[9px] text-white/20">Comisión</span></div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {MONTHLY.map((m, i) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
              <div className="w-full relative">
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#0f1a1a] border border-white/10 rounded-lg px-2.5 py-2 text-[9px] text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <p className="font-black text-white mb-0.5">{fmtCOP(m.rev)}</p>
                  <p className="text-[#10b981]">{fmtCOP(m.com)}</p>
                  <p className="text-white/30">{m.orders} pedidos</p>
                </div>
                <div className="flex flex-col-reverse gap-0.5">
                  <div className="w-full rounded-t-sm" style={{ height: `${(m.rev/maxRev)*100}px`, background: i===MONTHLY.length-1 ? 'rgba(0,242,255,0.5)' : `rgba(0,242,255,${0.15 + (i/MONTHLY.length)*0.2})` }}/>
                </div>
              </div>
              <p className="text-[7px] font-bold text-white/20 uppercase">{m.month}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5">

        {/* Por empresa */}
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Por empresa</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {COMPANIES.length === 0 && (
              <div className="px-5 py-8 text-center text-[10px] text-white/20">Aún no hay ventas registradas</div>
            )}
            {COMPANIES.map((c,i) => (
              <div key={c.name} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.025] transition-all">
                <span className="text-[11px] font-black text-white/15 w-5 shrink-0">#{i+1}</span>
                <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/6 flex items-center justify-center shrink-0 text-white/40 font-black text-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[11px] font-semibold text-white/60 truncate">{c.name}</p>
                    <p className="text-[11px] font-black text-[#10b981]/70 shrink-0 ml-2">{fmtCOP(c.rev)}</p>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff]/60"
                      style={{ width: `${c.pct}%` }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transacciones */}
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Últimas transacciones</p>
            <span className="text-[8px] font-black px-2 py-1 rounded-full bg-[#10b981]/8 border border-[#10b981]/15 text-[#10b981]/50 uppercase tracking-widest">Live</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {TRANSACTIONS.length === 0 && (
              <div className="px-5 py-8 text-center text-[10px] text-white/20">Aún no hay transacciones</div>
            )}
            {TRANSACTIONS.map(tx => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.025] transition-all">
                <div className="h-9 w-9 rounded-xl bg-[#10b981]/8 border border-[#10b981]/12 flex items-center justify-center shrink-0">
                  <TrendingUp size={14} className="text-[#10b981]/60"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/60 truncate">{tx.company}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-white/15">{tx.id}</span>
                    <span className="text-[9px] text-white/15">{tx.date ? new Date(tx.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                  </div>
                </div>
                <p className="text-[12px] font-black text-[#10b981]/70 shrink-0">+{fmtCOP(tx.amount)}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-white/[0.04]">
            <button className="w-full h-8 rounded-xl bg-white/[0.025] hover:bg-white/5 border border-white/6 text-[9px] font-bold text-white/20 hover:text-white/40 transition-all">
              Ver historial completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
