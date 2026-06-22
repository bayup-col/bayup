"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight, TrendingUp, Download, ChevronRight } from 'lucide-react';

const fmtCOP = (n: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0)}`;

const MONTHLY = [
  { month: 'Ene', rev: 12500000, com: 375000,  orders: 180 },
  { month: 'Feb', rev: 14800000, com: 444000,  orders: 210 },
  { month: 'Mar', rev: 18200000, com: 546000,  orders: 265 },
  { month: 'Abr', rev: 16400000, com: 492000,  orders: 240 },
  { month: 'May', rev: 22100000, com: 663000,  orders: 310 },
  { month: 'Jun', rev: 28700000, com: 861000,  orders: 398 },
  { month: 'Jul', rev: 31200000, com: 936000,  orders: 430 },
  { month: 'Ago', rev: 29800000, com: 894000,  orders: 415 },
  { month: 'Sep', rev: 34500000, com: 1035000, orders: 480 },
  { month: 'Oct', rev: 38900000, com: 1167000, orders: 530 },
  { month: 'Nov', rev: 45200000, com: 1356000, orders: 610 },
  { month: 'Dic', rev: 52800000, com: 1584000, orders: 720 },
];

const COMPANIES = [
  { name: 'Electrónicos Futuro', rev: 74000000, orders: 1240, plan: 'Empresa', pct: 38 },
  { name: 'TechStore Colombia',  rev: 52000000, orders: 890,  plan: 'Empresa', pct: 27 },
  { name: 'Distribuidora Omega', rev: 31000000, orders: 520,  plan: 'Empresa', pct: 16 },
  { name: 'Moda Express SAS',    rev: 18500000, orders: 340,  plan: 'Pro',     pct: 10 },
  { name: 'Boutique Eleganza',   rev: 9800000,  orders: 210,  plan: 'Pro',     pct:  5 },
  { name: 'Papelería Creativa',  rev: 7300000,  orders: 142,  plan: 'Pro',     pct:  4 },
];

const TRANSACTIONS = [
  { id:'TXN-8821', company:'Electrónicos Futuro', amount:2800000, date:'Hoy 14:32' },
  { id:'TXN-8820', company:'TechStore Colombia',  amount:1450000, date:'Hoy 12:10' },
  { id:'TXN-8819', company:'Moda Express SAS',    amount:380000,  date:'Ayer 18:45' },
  { id:'TXN-8818', company:'Distribuidora Omega', amount:5200000, date:'Ayer 11:20' },
  { id:'TXN-8817', company:'Papelería Creativa',  amount:125000,  date:'Jun 18'    },
];

export default function TesoreriaPage() {
  const [period, setPeriod] = useState<'dia'|'semana'|'mes'|'año'>('mes');

  const totalRev = MONTHLY.reduce((a,m) => a + m.rev, 0);
  const totalCom = MONTHLY.reduce((a,m) => a + m.com, 0);
  const cur = MONTHLY[MONTHLY.length-1];
  const prev= MONTHLY[MONTHLY.length-2];
  const growth = Math.round(((cur.rev - prev.rev)/prev.rev)*100);
  const maxRev = Math.max(...MONTHLY.map(m => m.rev));

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
          { label: 'Acumulado anual',         value: fmtCOP(totalRev),delta: 34,      color: '#7c3aed' },
          { label: 'Comisión anual',          value: fmtCOP(totalCom),delta: 34,      color: '#f59e0b' },
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
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">Ingresos 2025</p>
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
      <div className="grid grid-cols-[1fr_1.1fr] gap-5">

        {/* Por empresa */}
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Por empresa</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
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
            {TRANSACTIONS.map(tx => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.025] transition-all">
                <div className="h-9 w-9 rounded-xl bg-[#10b981]/8 border border-[#10b981]/12 flex items-center justify-center shrink-0">
                  <TrendingUp size={14} className="text-[#10b981]/60"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/60 truncate">{tx.company}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-white/15">{tx.id}</span>
                    <span className="text-[9px] text-white/15">{tx.date}</span>
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
