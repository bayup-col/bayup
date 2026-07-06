"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search, Filter, Download, Package, AlertCircle, ShoppingBag, Layers,
  X, TrendingUp, Globe, MessageSquare, CheckCircle2, Truck, Clock,
  FilterX, Target, Zap, User, Smartphone, Activity, FileText,
  ChevronRight, Loader2, MapPin, CreditCard, Check, ArrowRight,
  RefreshCw, Eye, MoreHorizontal, Inbox, BadgeCheck, XCircle, FileSpreadsheet, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiRequest } from '@/lib/api';

// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmtCOP = (n: number) =>
  `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n)}`;

// ── STATUS CONFIG ─────────────────────────────────────────────────────────────
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

const STATUS: Record<OrderStatus, {
  label: string; color: string; bg: string; border: string;
  dot: string; icon: React.ReactNode; step: number;
}> = {
  pending:    { label: 'Pendiente',   color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-400',   icon: <Clock size={11}/>,       step: 0 },
  processing: { label: 'En proceso',  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',  dot: 'bg-blue-400',    icon: <Zap size={11}/>,         step: 1 },
  completed:  { label: 'Completado',  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',dot:'bg-emerald-400', icon: <CheckCircle2 size={11}/>, step: 2 },
  cancelled:  { label: 'Cancelado',   color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',  dot: 'bg-rose-400',    icon: <XCircle size={11}/>,     step: -1 },
};

const TABS = [
  { key: 'all',        label: 'Todos',       icon: <Inbox size={11}/> },
  { key: 'pending',    label: 'Pendientes',  icon: <Clock size={11}/> },
  { key: 'processing', label: 'En proceso',  icon: <Zap size={11}/> },
  { key: 'completed',  label: 'Completados', icon: <CheckCircle2 size={11}/> },
  { key: 'cancelled',  label: 'Cancelados',  icon: <XCircle size={11}/> },
];

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent, progress }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; accent: string; progress?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4"
          style={{ backgroundColor: `${accent}15`, color: accent }}>
          {icon}
        </div>
        {sub && (
          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${accent}12`, color: accent }}>
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      </div>
      {progress !== undefined && (
        <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: accent }}/>
        </div>
      )}
    </div>
  );
}

// ── STATUS BADGE ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as OrderStatus] ?? STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border ${s.bg} ${s.color} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`}/>
      {s.label}
    </span>
  );
}

// ── SOURCE BADGE ──────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  const src = (source || '').toLowerCase();
  const cfg =
    src === 'pos' || src === 'tienda física' ? { label: 'Tienda física', color: '#7c3aed', bg: '#7c3aed15' } :
    src === 'whatsapp'                       ? { label: 'WhatsApp',       color: '#16a34a', bg: '#16a34a15' } :
    src === 'instagram'                      ? { label: 'Instagram',      color: '#db2777', bg: '#db277715' } :
    src === 'social' || src === 'redes sociales' ? { label: 'Redes Sociales', color: '#f59e0b', bg: '#f59e0b15' } :
                                               { label: 'Web',             color: '#0891b2', bg: '#0891b215' };
  return (
    <span className="text-[8px] font-black px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [orders,       setOrders]       = useState<any[]>([]);
  const [products,     setProducts]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [activeTab,    setActiveTab]    = useState('all');
  const [drawerOrder,  setDrawerOrder]  = useState<any>(null);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [dateRange,    setDateRange]    = useState({ start: '', end: '' });
  const [srcFilter,    setSrcFilter]    = useState('Todos');
  const [updatingId,   setUpdatingId]   = useState<string | null>(null);

  // ── Fetch ──
  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ord, prod] = await Promise.all([
        apiRequest<any[]>('/orders',   { token }),
        apiRequest<any[]>('/products', { token }),
      ]);
      if (ord)  setOrders(ord);
      if (prod) setProducts(prod);
    } catch { showToast('Error al cargar datos', 'error'); }
    finally   { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const total    = orders.length;
    const pending  = orders.filter(o => o.status === 'pending').length;
    const avgTicket = total > 0 ? orders.reduce((a, o) => a + (o.total_price || 0), 0) / total : 0;
    const lowStock = products.filter(p => (p.variants?.reduce((a: any, v: any) => a + (v.stock || 0), 0) || 0) <= 5).length;
    return [
      { icon: <ShoppingBag/>, label: 'Total pedidos',   value: String(total),       sub: 'Hoy',       accent: '#0891b2', progress: Math.min((total / 20) * 100, 100) },
      { icon: <Clock/>,        label: 'Por facturar',    value: String(pending),     sub: 'Urgente',   accent: '#d97706', progress: total > 0 ? (pending / total) * 100 : 0 },
      { icon: <AlertCircle/>,  label: 'Stock crítico',   value: String(lowStock),    sub: 'Atención',  accent: '#e11d48', progress: Math.min((lowStock / 10) * 100, 100) },
      { icon: <Target/>,       label: 'Ticket promedio', value: fmtCOP(avgTicket),   sub: 'Promedio',  accent: '#004d4d', progress: 68 },
    ];
  }, [orders, products]);

  // ── Counts por tab ──
  const counts = useMemo(() => ({
    all:        orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed:  orders.filter(o => o.status === 'completed').length,
    cancelled:  orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  // ── Filtered ──
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || o.customer_name?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
      const matchTab    = activeTab === 'all' || o.status === activeTab;
      const matchSrc    = srcFilter === 'Todos' || (o.source || '').toLowerCase() === srcFilter.toLowerCase();
      const d = new Date(o.created_at);
      const matchStart  = !dateRange.start || d >= new Date(dateRange.start);
      const matchEnd    = !dateRange.end   || d <= new Date(dateRange.end);
      return matchSearch && matchTab && matchSrc && matchStart && matchEnd;
    });
  }, [orders, searchTerm, activeTab, srcFilter, dateRange]);

  // ── Update status ──
  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await apiRequest(`/orders/${orderId}`, {
        method: 'PUT', token,
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`Estado actualizado: ${STATUS[newStatus as OrderStatus]?.label ?? newStatus}`, 'success');
      await fetchAll();
      setDrawerOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
    } catch { showToast('Error al actualizar', 'error'); }
    finally   { setUpdatingId(null); }
  };

  const handleExportExcel = async () => {
    showToast('Generando Excel…', 'info');
    const { exportOrdersToExcel } = await import('@/lib/orders-export');
    exportOrdersToExcel(filtered, 'Pedidos_Web');
    setShowExportMenu(false);
    showToast('Excel descargado ✓', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['ID','CLIENTE','EMAIL','TELÉFONO','CIUDAD','TOTAL','ESTADO','MÉTODO PAGO','FECHA'];
    const rows = filtered.map((o: any) => [
      o.order_number || o.id, o.customer_name || o.customer || '—',
      o.customer_email || '', o.customer_phone || '',
      o.shipping_address?.city || o.city || '',
      o.total_price || 0, o.status || '',
      o.payment_method || '', o.created_at ? new Date(o.created_at).toLocaleDateString('es-CO') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pedidos_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showToast('CSV descargado ✓', 'success');
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-20 space-y-6">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-black tracking-[0.22em] uppercase text-gray-400 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>
            Monitor de órdenes
          </p>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d] leading-none">
            PEDIDOS WEB
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">Gestión de pedidos en tiempo real desde tu tienda online</p>
        </div>
        <button onClick={fetchAll}
          className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#004d4d] hover:border-[#004d4d]/30 transition-all shadow-sm">
          <RefreshCw size={14}/>
        </button>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KpiCard key={i} {...k}/>)}
      </div>

      {/* ── PIPELINE VISUAL ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-1">
          {(['pending','processing','completed'] as OrderStatus[]).map((st, i) => {
            const s   = STATUS[st];
            const cnt = counts[st];
            const pct = orders.length > 0 ? (cnt / orders.length) * 100 : 0;
            return (
              <React.Fragment key={st}>
                <button onClick={() => setActiveTab(st)}
                  className={`flex-1 flex flex-col gap-2 p-3 rounded-xl transition-all ${activeTab === st ? 'bg-gray-50 ring-1 ring-gray-200' : 'hover:bg-gray-50/60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`}/>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{s.label}</p>
                    </div>
                    <p className="text-sm font-black text-gray-900">{cnt}</p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: st === 'pending' ? '#f59e0b' : st === 'processing' ? '#3b82f6' : '#10b981' }}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.1 }}/>
                  </div>
                </button>
                {i < 2 && <ChevronRight size={14} className="text-gray-200 shrink-0"/>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── TABLA PRINCIPAL ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100 overflow-x-auto shrink-0">
            {TABS.map(tab => {
              const cnt = counts[tab.key as keyof typeof counts];
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide whitespace-nowrap transition-all z-0 ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {isActive && (
                    <motion.div layoutId="orderTab"
                      className="absolute inset-0 rounded-lg bg-[#004d4d]"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}/>
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.icon}{tab.label}
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {cnt}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center gap-2 h-9 bg-gray-50 rounded-xl border border-gray-100 px-3">
            <Search size={13} className="text-gray-300 shrink-0"/>
            <input
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID o cliente…"
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-300 hover:text-gray-500">
                <X size={12}/>
              </button>
            )}
          </div>

          {/* Acciones */}
          <button onClick={() => setFilterOpen(!filterOpen)}
            className={`h-9 flex items-center gap-1.5 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wide transition-all ${
              filterOpen ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'bg-white border-gray-200 text-gray-400 hover:border-[#004d4d]/30'
            }`}>
            {filterOpen ? <FilterX size={12}/> : <Filter size={12}/>} Filtros
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(v => !v)}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-[#004d4d] hover:bg-[#003838] text-white text-[9px] font-black uppercase tracking-wide transition-all">
              <Download size={12}/> Exportar <ChevronDown size={10} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                  <button onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-[#004d4d]/5 transition-colors text-left">
                    <FileSpreadsheet size={14} className="text-[#004d4d]"/> Excel (.xlsx)
                    <span className="ml-auto text-[9px] text-[#004d4d] font-bold uppercase tracking-wide">Recomendado</span>
                  </button>
                  <div className="h-px bg-gray-100 mx-3"/>
                  <button onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    <Download size={14} className="text-gray-400"/> CSV (.csv)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Panel de filtros */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-gray-100">
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Desde</label>
                  <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#004d4d]/40"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hasta</label>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#004d4d]/40"/>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Canal</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Todos', 'web', 'WhatsApp', 'Instagram', 'pos'].map(s => (
                      <button key={s} onClick={() => setSrcFilter(s)}
                        className={`h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all ${
                          srcFilter === s ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}>
                        {s === 'pos' ? 'Tienda' : s}
                      </button>
                    ))}
                    <button onClick={() => { setDateRange({ start:'', end:'' }); setSrcFilter('Todos'); }}
                      className="h-8 px-3 rounded-xl text-[9px] font-black text-rose-400 hover:text-rose-500 uppercase tracking-wide transition-all">
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-[#004d4d]"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Inbox size={22} className="text-gray-300"/>
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin pedidos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5">
              {['Pedido', 'Cliente', 'Canal', 'Estado', 'Total', ''].map((h, i) => (
                <p key={i} className="text-[8px] font-black uppercase tracking-widest text-gray-400">{h}</p>
              ))}
            </div>

            {/* Filas */}
            {filtered.map(o => {
              const st = STATUS[o.status as OrderStatus] ?? STATUS.pending;
              const date = new Date(o.created_at);
              const isUpdating = updatingId === o.id;
              return (
                <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setDrawerOrder(o)}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/70 cursor-pointer transition-all group">

                  {/* Pedido */}
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${st.bg}`}>
                      <span className={st.color}>{st.icon}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-gray-900">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[9px] text-gray-400">
                        {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-800 truncate">{o.customer_name}</p>
                    <p className="text-[9px] text-gray-400">{o.customer_phone || '—'}</p>
                  </div>

                  {/* Canal */}
                  <div><SourceBadge source={o.source}/></div>

                  {/* Estado */}
                  <div><StatusBadge status={o.status}/></div>

                  {/* Total */}
                  <p className="text-sm font-black text-[#004d4d]">{fmtCOP(o.total_price || 0)}</p>

                  {/* Acción */}
                  <button
                    onClick={e => { e.stopPropagation(); setDrawerOrder(o); }}
                    className="h-8 w-8 rounded-xl bg-white border border-gray-100 text-gray-300 hover:text-[#004d4d] hover:border-[#004d4d]/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                    {isUpdating ? <Loader2 size={13} className="animate-spin"/> : <Eye size={13}/>}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[9px] font-bold text-gray-400">
              Mostrando <span className="font-black text-gray-600">{filtered.length}</span> de {orders.length} pedidos
            </p>
            <p className="text-[9px] font-bold text-gray-400">
              Total: <span className="font-black text-[#004d4d]">
                {fmtCOP(filtered.reduce((a, o) => a + (o.total_price || 0), 0))}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ── DRAWER DETALLE ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 backdrop-blur-sm"
              style={{ zIndex: 9998 }} onClick={() => setDrawerOrder(null)}/>

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
              style={{ zIndex: 9999 }}>

              {/* Header */}
              <div className="bg-[#001a1a] px-6 pt-6 pb-0 shrink-0">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[9px] font-black text-[#00f2ff]/40 uppercase tracking-widest mb-1">
                      Detalle del pedido
                    </p>
                    <h2 className="text-xl font-black text-white">
                      #{drawerOrder.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {new Date(drawerOrder.created_at).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <button onClick={() => setDrawerOrder(null)}
                    className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-all">
                    <X size={14}/>
                  </button>
                </div>

                {/* Pipeline mini */}
                <div className="flex items-center gap-0 pb-0">
                  {(['pending','processing','completed'] as OrderStatus[]).map((st, i) => {
                    const s = STATUS[st];
                    const isDone    = STATUS[drawerOrder.status as OrderStatus]?.step > s.step;
                    const isCurrent = drawerOrder.status === st;
                    return (
                      <React.Fragment key={st}>
                        <div className={`flex-1 py-2.5 flex items-center justify-center gap-1 border-b-2 transition-all ${
                          isCurrent ? 'border-[#00f2ff]' : isDone ? 'border-[#00f2ff]/40' : 'border-transparent'
                        }`}>
                          <span className={`text-[8px] font-black uppercase tracking-wide ${isCurrent ? 'text-[#00f2ff]' : isDone ? 'text-white/40' : 'text-white/20'}`}>
                            {s.label}
                          </span>
                          {isDone && <Check size={9} className="text-[#00f2ff]/60"/>}
                        </div>
                        {i < 2 && <div className="w-3 h-px bg-white/10 shrink-0"/>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">

                {/* Info cliente */}
                <div className="p-5 space-y-3">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                  <div className="space-y-2">
                    {[
                      { icon: <User size={13}/>, value: drawerOrder.customer_name },
                      { icon: <Smartphone size={13}/>, value: drawerOrder.customer_phone || 'Sin teléfono' },
                      { icon: <MapPin size={13}/>, value: drawerOrder.customer_city || 'Sin ciudad' },
                      { icon: <CreditCard size={13}/>, value: drawerOrder.payment_method || 'WhatsApp' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-[#004d4d]/8 flex items-center justify-center text-[#004d4d] shrink-0">
                          {row.icon}
                        </div>
                        <p className="text-[11px] font-semibold text-gray-700">{row.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Productos */}
                <div className="p-5 space-y-3">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Productos ({drawerOrder.items?.length ?? 0})
                  </p>
                  <div className="space-y-2">
                    {drawerOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="h-9 w-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#004d4d] shrink-0 shadow-sm">
                          <Package size={15}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-gray-900 truncate">
                            {item.product_variant?.product?.name || 'Producto'}
                          </p>
                          <p className="text-[9px] text-gray-400">SKU: {item.product_variant?.sku || 'N/A'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-black text-[#004d4d]">x{item.quantity}</p>
                          <p className="text-[9px] text-gray-400">{fmtCOP((item.price_at_purchase || 0) * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                    <p className="text-lg font-black text-[#004d4d]">{fmtCOP(drawerOrder.total_price || 0)}</p>
                  </div>
                </div>

                {/* Notas */}
                {drawerOrder.notes && (
                  <div className="p-5 space-y-2">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Nota del cliente</p>
                    <p className="text-[11px] text-gray-600 bg-amber-50 rounded-xl p-3 border border-amber-100">
                      {drawerOrder.notes}
                    </p>
                  </div>
                )}

                {/* Cambiar estado */}
                <div className="p-5 space-y-3">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cambiar estado</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['pending','processing','completed','cancelled'] as OrderStatus[]).map(st => {
                      const s = STATUS[st];
                      const isCurrent = drawerOrder.status === st;
                      return (
                        <button key={st} onClick={() => updateStatus(drawerOrder.id, st)}
                          disabled={isCurrent || updatingId === drawerOrder.id}
                          className={`flex items-center gap-2 h-9 px-3 rounded-xl text-[9px] font-black border transition-all ${
                            isCurrent
                              ? `${s.bg} ${s.color} ${s.border} cursor-default`
                              : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                          } disabled:opacity-50`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`}/>
                          {s.label}
                          {isCurrent && <Check size={9} className="ml-auto shrink-0"/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer CTAs */}
              <div className="p-5 border-t border-gray-100 space-y-2 shrink-0 bg-gray-50/50">

                {/* Comprobante: disponible en proceso y completado */}
                {(drawerOrder.status === 'processing' || drawerOrder.status === 'completed') && (
                  <button
                    onClick={async () => {
                      const companyData = (() => { try { const c = localStorage.getItem('bayup_company_profile'); return c ? JSON.parse(c) : null; } catch { return null; } })();
                      const { generateInvoicePDF } = await import('@/lib/report-generator');
                      await generateInvoicePDF({
                        company: companyData,
                        order: drawerOrder,
                        customer: { name: drawerOrder.customer_name, email: drawerOrder.customer_email, phone: drawerOrder.customer_phone, city: drawerOrder.customer_city },
                      });
                    }}
                    className="w-full h-11 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <Download size={13}/> Generar comprobante
                  </button>
                )}

                {/* CTA principal: Aceptar y facturar */}
                {drawerOrder.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(drawerOrder.id, 'processing')}
                    disabled={updatingId === drawerOrder.id}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#004d4d] to-[#00706e] hover:from-[#003838] hover:to-[#005856] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50">
                    {updatingId === drawerOrder.id
                      ? <Loader2 size={14} className="animate-spin"/>
                      : <><BadgeCheck size={15}/> Confirmar pedido</>}
                  </button>
                )}

                {/* CTA: Enviar a envíos */}
                {drawerOrder.status === 'processing' && (
                  <button
                    onClick={() => updateStatus(drawerOrder.id, 'completed')}
                    disabled={updatingId === drawerOrder.id}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50">
                    {updatingId === drawerOrder.id
                      ? <Loader2 size={14} className="animate-spin"/>
                      : <><Truck size={15}/> Marcar como completado</>}
                  </button>
                )}

                {/* WhatsApp */}
                <button
                  onClick={() => window.open(`https://wa.me/57${drawerOrder.customer_phone?.replace(/\D/g, '')}`, '_blank')}
                  className="w-full h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <MessageSquare size={13}/> Contactar por WhatsApp
                </button>

                {/* Cerrar */}
                <button onClick={() => setDrawerOrder(null)}
                  className="w-full h-9 rounded-2xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 font-black text-[9px] uppercase tracking-widest transition-all">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
