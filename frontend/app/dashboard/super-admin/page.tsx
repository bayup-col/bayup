"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import {
  Building2, Users, DollarSign, TrendingUp, ArrowUpRight,
  ArrowDownRight, RefreshCw, ChevronRight, Wallet, Layout,
  Headset, BarChart3, Settings, Activity, Zap
} from 'lucide-react';
import Link from 'next/link';

const fmtCOP = (n: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0)}`;
const fmtK   = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n || 0);

const FADE_UP = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const companies  = stats?.total_companies  ?? 8;
  const activeC    = stats?.active_companies ?? 7;
  const mrr        = stats?.total_revenue    ?? 193800000;
  const totalUsers = stats?.total_users      ?? 10;
  const totalOrders= stats?.total_orders     ?? 2609;

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8 pb-12">

      {/* ── Hero Header ── */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}
        className="flex items-end justify-between pt-2">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-pulse"/>
            <span className="text-[9px] font-bold text-white/25 uppercase tracking-[0.25em]">Sistema activo</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight leading-none">
            Control<br/>
            <span className="text-[#00f2ff]">Center</span>
          </h1>
          <p className="text-white/25 text-sm mt-3 capitalize">{dateStr}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button onClick={load}
            className="h-9 w-9 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
          </button>
          {/* Pulse live */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse"/>
            <span className="text-[9px] font-black text-[#10b981]/70 uppercase tracking-widest">Todos los sistemas</span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Grid ── */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Empresas',
            value: companies,
            sub: `${activeC} activas`,
            delta: 12,
            icon: <Building2 size={16}/>,
            color: '#00f2ff',
            href: '/dashboard/super-admin/empresas',
          },
          {
            label: 'Facturación',
            value: fmtCOP(mrr),
            sub: 'Histórico total',
            delta: 18,
            icon: <DollarSign size={16}/>,
            color: '#10b981',
            href: '/dashboard/super-admin/tesoreria',
          },
          {
            label: 'Usuarios',
            value: fmtK(totalUsers),
            sub: 'En la plataforma',
            delta: 8,
            icon: <Users size={16}/>,
            color: '#7c3aed',
            href: '/dashboard/super-admin/users',
          },
          {
            label: 'Pedidos',
            value: fmtK(totalOrders),
            sub: 'Procesados',
            delta: 22,
            icon: <TrendingUp size={16}/>,
            color: '#f59e0b',
            href: '/dashboard/super-admin/reports',
          },
        ].map((k, i) => (
          <Link key={k.label} href={k.href}>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
              className="group relative rounded-2xl border border-white/6 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04] p-6 cursor-pointer overflow-hidden transition-all duration-200">
              {/* Fondo accent muy sutil */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at 80% 20%, ${k.color}08 0%, transparent 60%)` }}/>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${k.color}12`, color: k.color }}>
                    {k.icon}
                  </div>
                  <div className={`flex items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-full ${k.delta >= 0 ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-red-500/10 text-red-400'}`}>
                    {k.delta >= 0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                    {Math.abs(k.delta)}%
                  </div>
                </div>
                <p className="text-3xl font-black text-white leading-none mb-2">{k.value}</p>
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">{k.label}</p>
                <p className="text-[10px] text-white/20 mt-0.5">{k.sub}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* ── Dos columnas: módulos + estado ── */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">

        {/* Módulos */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em]">Módulos</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard/super-admin/empresas',      label: 'Empresas',       desc: 'Gestión de tenants',        icon: <Building2 size={18}/>,  color: '#00f2ff',  stat: `${companies} activas` },
              { href: '/dashboard/super-admin/tesoreria',     label: 'Tesorería',      desc: 'Ingresos y comisiones',     icon: <Wallet size={18}/>,     color: '#10b981',  stat: fmtCOP(mrr) },
              { href: '/dashboard/super-admin/users',         label: 'Usuarios',       desc: 'Control de accesos',        icon: <Users size={18}/>,      color: '#7c3aed',  stat: `${totalUsers} total` },
              { href: '/dashboard/super-admin/web-templates', label: 'Plantillas',     desc: 'Biblioteca de templates',   icon: <Layout size={18}/>,     color: '#f59e0b',  stat: '8 activas' },
              { href: '/dashboard/super-admin/soporte',       label: 'Soporte',        desc: 'Tickets de clientes',       icon: <Headset size={18}/>,    color: '#ec4899',  stat: '5 abiertos' },
              { href: '/dashboard/super-admin/reports',       label: 'Reportes',       desc: 'Analítica global',          icon: <BarChart3 size={18}/>,  color: '#0ea5e9',  stat: 'Ver métricas' },
            ].map(m => (
              <Link key={m.href} href={m.href}>
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
                  className="group relative rounded-2xl border border-white/6 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] p-4 cursor-pointer overflow-hidden transition-all duration-200 h-full">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: `radial-gradient(circle at 90% 10%, ${m.color}08 0%, transparent 50%)` }}/>
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${m.color}12`, color: m.color }}>
                        {m.icon}
                      </div>
                      <ChevronRight size={12} className="text-white/15 group-hover:text-white/40 transition-colors"/>
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-white/80 mb-0.5">{m.label}</p>
                      <p className="text-[10px] text-white/25 leading-snug">{m.desc}</p>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: `${m.color}99` }}>{m.stat}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Panel lateral: estado + actividad */}
        <div className="space-y-4">

          {/* Estado del sistema */}
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em]">Estado del sistema</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse"/>
                <span className="text-[8px] font-bold text-[#10b981]/60 uppercase">Operativo</span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'API Backend',   ok: true,  latency: '42ms'  },
                { label: 'Base de datos', ok: true,  latency: '12ms'  },
                { label: 'Storage',       ok: true,  latency: '8ms'   },
                { label: 'Email service', ok: false, latency: '—'     },
                { label: 'WebSocket',     ok: true,  latency: '3ms'   },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${s.ok ? 'bg-[#10b981]' : 'bg-red-400 animate-pulse'}`}/>
                    <span className="text-[11px] text-white/40">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-white/20">{s.latency}</span>
                    <span className={`text-[8px] font-black uppercase ${s.ok ? 'text-[#10b981]/50' : 'text-red-400/70'}`}>
                      {s.ok ? 'OK' : 'Error'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5 flex-1">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-4">Actividad reciente</p>
            <div className="space-y-3.5">
              {[
                { text: 'Nueva empresa registrada',   time: '2 min',  color: '#00f2ff', icon: <Building2 size={10}/> },
                { text: 'Pago procesado · $2.8M',     time: '8 min',  color: '#10b981', icon: <DollarSign size={10}/> },
                { text: 'Usuario creó su tienda',      time: '15 min', color: '#7c3aed', icon: <Zap size={10}/> },
                { text: 'Ticket de soporte abierto',   time: '31 min', color: '#f59e0b', icon: <Headset size={10}/> },
                { text: 'Backup diario completado',    time: '1h',     color: '#6b7280', icon: <Activity size={10}/> },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${a.color}12`, color: a.color }}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/50 leading-tight">{a.text}</p>
                    <p className="text-[9px] text-white/15 mt-0.5">hace {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Métricas rápidas ── */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-4 gap-4">
        {[
          { label: 'Comisiones totales',    value: fmtCOP(mrr * 0.03), sub: '3% sobre facturación',  color: '#00f2ff' },
          { label: 'Ticket promedio',       value: fmtCOP(mrr / Math.max(totalOrders,1)), sub: 'Por pedido',            color: '#10b981' },
          { label: 'Uptime del sistema',    value: '99.97%',             sub: 'Últimos 30 días',       color: '#7c3aed' },
          { label: 'Empresas con plan Pro+',value: '6',                  sub: 'Pro y Empresa',         color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-2">{m.label}</p>
            <p className="text-2xl font-black leading-none" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[9px] text-white/20 mt-1">{m.sub}</p>
          </div>
        ))}
      </motion.div>

    </div>
  );
}
