"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const fmtCOP = (n: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0)}`;

const DATA: Record<string, any> = {
  dia:    { rev: 2800000,   orders:38,   users:4,   companies:1,  delta:12 },
  semana: { rev: 18500000,  orders:260,  users:22,  companies:3,  delta:8  },
  mes:    { rev: 52800000,  orders:720,  users:89,  companies:8,  delta:16 },
  año:    { rev: 344000000, orders:4968, users:580, companies:48, delta:34 },
};

const TOP = [
  { name:'Electrónicos Futuro', rev:130000000, pct:38, plan:'Empresa' },
  { name:'TechStore Colombia',  rev:90000000,  pct:26, plan:'Empresa' },
  { name:'Distribuidora Omega', rev:62000000,  pct:18, plan:'Empresa' },
  { name:'Moda Express SAS',    rev:35000000,  pct:10, plan:'Pro'     },
  { name:'Boutique Eleganza',   rev:18000000,  pct:5,  plan:'Pro'     },
  { name:'Otros',               rev:9000000,   pct:3,  plan:'—'       },
];

const SECTORS = [
  { label:'Tecnología',   pct:42, color:'#00f2ff' },
  { label:'Moda',         pct:24, color:'#7c3aed' },
  { label:'Distribución', pct:18, color:'#10b981' },
  { label:'Moda/Lujo',   pct:10, color:'#f59e0b'  },
  { label:'Otros',        pct:6,  color:'#6b7280'  },
];

const ACTIVITY = Array.from({length:24}, (_,h) => ({
  h,
  v: h>=8&&h<=12 ? 0.5+Math.random()*0.5
   : h>=14&&h<=19 ? 0.6+Math.random()*0.4
   : h>=20&&h<=22 ? 0.2+Math.random()*0.3
   : 0.03+Math.random()*0.12
}));

export default function ReportsPage() {
  const [period, setPeriod] = useState<'dia'|'semana'|'mes'|'año'>('mes');
  const d = DATA[period];

  return (
    <div className="space-y-6 pb-12">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Analítica global · Bayup</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Reportes</h1>
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
          { label:'Ingresos',       value:fmtCOP(d.rev),          color:'#10b981' },
          { label:'Pedidos',        value:d.orders.toLocaleString('es-CO'), color:'#00f2ff' },
          { label:'Nuevos usuarios',value:d.users,                 color:'#7c3aed' },
          { label:'Nuevas empresas',value:d.companies,             color:'#f59e0b' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: k.color }}/>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center gap-0.5">
                <ArrowUpRight size={9}/>{d.delta}%
              </span>
            </div>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-1.5">{k.label}</p>
            <p className="text-2xl font-black text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Dos columnas */}
      <div className="grid grid-cols-[1.3fr_1fr] gap-5">

        {/* Top empresas */}
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Top empresas · {period}</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {TOP.map((c,i) => (
              <div key={c.name} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.025] transition-all">
                <span className="text-[10px] font-black text-white/15 w-5 shrink-0">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1.5">
                    <p className="text-[11px] font-semibold text-white/60 truncate">{c.name}</p>
                    <p className="text-[11px] font-black text-[#10b981]/60 ml-2">{fmtCOP(c.rev)}</p>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${c.pct}%` }}
                      transition={{ duration:0.8, ease:'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff]/50"/>
                  </div>
                </div>
                <span className="text-[9px] font-black text-white/20 w-8 text-right shrink-0">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Sectores */}
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Por sector</p>
            <div className="space-y-3">
              {SECTORS.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between mb-1.5">
                    <p className="text-[10px] text-white/40">{s.label}</p>
                    <p className="text-[10px] font-black" style={{ color:s.color }}>{s.pct}%</p>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${s.pct}%` }}
                      transition={{ duration:0.8, delay:0.1 }}
                      className="h-full rounded-full" style={{ backgroundColor:s.color }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comisión */}
          <div className="rounded-2xl border border-[#00f2ff]/10 bg-[#00f2ff]/[0.03] p-5">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-3">Comisión Bayup (3%)</p>
            <p className="text-3xl font-black text-[#00f2ff]/80">{fmtCOP(d.rev*0.03)}</p>
            <p className="text-[10px] text-white/20 mt-1.5">sobre {fmtCOP(d.rev)} facturados · {period}</p>
          </div>
        </div>
      </div>

      {/* Mapa de calor por hora */}
      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Actividad por hora (promedio)</p>
        <div className="flex items-end gap-1 h-14">
          {ACTIVITY.map(({ h, v }) => (
            <div key={h} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full rounded-t-sm relative"
                style={{ height:`${v*100}%`, backgroundColor:`rgba(0,242,255,${0.12 + v*0.45})` }}>
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#0f1a1a] border border-white/8 rounded px-1.5 py-0.5 text-[7px] text-white/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {h}:00
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {['00:00','06:00','12:00','18:00','23:00'].map(t => (
            <span key={t} className="text-[7px] text-white/15">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
