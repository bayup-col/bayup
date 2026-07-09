"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Truck, Package, CheckCircle2, AlertCircle, MapPin,
  Clock, Download, RefreshCw, Plus, ChevronRight, ExternalLink,
  Phone, MessageCircle, ArrowUpRight, ArrowDownRight, Edit3,
  Loader2, Activity, Target, Zap, RotateCcw, Eye, Calendar,
  Hash, User, DollarSign, ShoppingBag, FileSpreadsheet, ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';

// ── TIPOS ──────────────────────────────────────────────────────────────────
type ShipStatus = 'pendiente' | 'guia_generada' | 'en_transito' | 'en_reparto' | 'entregado' | 'incidencia' | 'devuelto';

interface Shipment {
  id: string;
  order_id: string;
  order_number: string;
  tracking_number: string;
  carrier: string;
  status: ShipStatus;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  total_price: number;
  items_count: number;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
  notes?: string;
  history?: { status: ShipStatus; date: string; note: string }[];
}

// ── UTILS ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtN = (n: number) => n.toLocaleString('es-CO');
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── ESTADOS ────────────────────────────────────────────────────────────────
const STATUS: Record<ShipStatus, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ReactNode; step: number }> = {
  pendiente:     { label: 'Pendiente',       color: 'text-gray-500',   bg: 'bg-gray-100',    border: 'border-gray-200',   dot: 'bg-gray-400',   icon: <Clock size={12}/>,        step: 0 },
  guia_generada: { label: 'Guía generada',   color: 'text-blue-600',   bg: 'bg-blue-50',     border: 'border-blue-100',   dot: 'bg-blue-500',   icon: <Hash size={12}/>,         step: 1 },
  en_transito:   { label: 'En tránsito',     color: 'text-violet-600', bg: 'bg-violet-50',   border: 'border-violet-100', dot: 'bg-violet-500', icon: <Truck size={12}/>,        step: 2 },
  en_reparto:    { label: 'En reparto',       color: 'text-amber-600',  bg: 'bg-amber-50',    border: 'border-amber-100',  dot: 'bg-amber-500',  icon: <MapPin size={12}/>,       step: 3 },
  entregado:     { label: 'Entregado',        color: 'text-emerald-600',bg: 'bg-emerald-50',  border: 'border-emerald-100',dot: 'bg-emerald-500',icon: <CheckCircle2 size={12}/>, step: 4 },
  incidencia:    { label: 'Incidencia',       color: 'text-rose-600',   bg: 'bg-rose-50',     border: 'border-rose-100',   dot: 'bg-rose-500',   icon: <AlertCircle size={12}/>,  step: -1 },
  devuelto:      { label: 'Devuelto',         color: 'text-orange-600', bg: 'bg-orange-50',   border: 'border-orange-100', dot: 'bg-orange-500', icon: <RotateCcw size={12}/>,    step: -1 },
};

const PIPELINE: ShipStatus[] = ['pendiente', 'guia_generada', 'en_transito', 'en_reparto', 'entregado'];
const CARRIERS = ['Servientrega', 'Coordinadora', 'Envia', 'Deprisa', 'Fedex', 'DHL', 'TCC', 'Interrapidísimo', 'Otro'];


// ── KPI CARD ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, trend, trendUp, accent = '#004d4d' }: any) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-5 hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="h-9 w-9 rounded-2xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4"
          style={{ background: `${accent}18`, color: accent }}>{icon}</div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            {trendUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}{trend}
          </span>
        )}
      </div>
      <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-1">{label}</p>
      <h3 className="text-xl font-black tracking-tight text-gray-900 leading-none">{value}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
      <div className="mt-3 h-[3px] w-full rounded-full bg-gray-100">
        <div className="h-full w-3/5 rounded-full" style={{ background: `linear-gradient(90deg,${accent}99,transparent)` }}/>
      </div>
    </div>
  );
}

// ── BADGE ESTADO ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ShipStatus }) {
  const s = STATUS[status] ?? STATUS['pendiente'];
  return (
    <span className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.color} ${s.border}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${s.dot}`}/>
      {s.label}
    </span>
  );
}

// ── TIMELINE DE SEGUIMIENTO ────────────────────────────────────────────────
function ShipmentTimeline({ shipment }: { shipment: Shipment }) {
  const currentStep = STATUS[shipment.status]?.step ?? 0;
  const isProblematic = shipment.status === 'incidencia' || shipment.status === 'devuelto';

  return (
    <div className="relative">
      {/* Línea base */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 z-0"/>
      {/* Línea progreso */}
      {!isProblematic && (
        <motion.div className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-[#004d4d] to-[#00b2bd] z-0"
          initial={{ width: 0 }}
          animate={{ width: currentStep > 0 ? `${(currentStep / (PIPELINE.length - 1)) * (100 - 8)}%` : '0%' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}/>
      )}
      <div className="relative z-10 flex items-start justify-between px-0">
        {PIPELINE.map((st, i) => {
          const done    = !isProblematic && i <= currentStep;
          const active  = !isProblematic && i === currentStep;
          const s = STATUS[st];
          return (
            <div key={st} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 [&_svg]:w-3.5 [&_svg]:h-3.5
                ${active  ? 'bg-[#004d4d] border-[#004d4d] text-white shadow-lg shadow-[#004d4d]/30 scale-110' :
                  done    ? 'bg-[#00b2bd] border-[#00b2bd] text-white' :
                            'bg-white border-gray-200 text-gray-300'}`}>
                {s.icon}
              </div>
              <p className={`text-[8px] font-bold text-center leading-tight max-w-[52px] ${active ? 'text-[#004d4d]' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
      {isProblematic && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-100">
          <AlertCircle size={12} className="text-rose-500 shrink-0"/>
          <p className="text-[10px] text-rose-600 font-medium">Estado: <strong>{STATUS[shipment.status].label}</strong> — requiere acción</p>
        </div>
      )}
    </div>
  );
}

// ── DRAWER DETALLE ENVÍO ───────────────────────────────────────────────────
function ShipmentDrawer({ shipment, onClose, onUpdateStatus }: {
  shipment: Shipment;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ShipStatus, carrier: string, tracking: string, note?: string) => void;
}) {
  const [newStatus, setNewStatus] = useState<ShipStatus>(shipment.status);
  const [carrier,   setCarrier]   = useState(shipment.carrier || '');
  const [tracking,  setTracking]  = useState(shipment.tracking_number || '');
  const [note,      setNote]      = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await onUpdateStatus(shipment.id, newStatus, carrier, tracking, note || undefined);
    setSaving(false);
    onClose();
  };

  const inputCls = "w-full h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/50 transition-colors";

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose}/>
      <div className="fixed inset-0 flex items-center justify-end p-4" style={{ zIndex: 9999 }}>
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative bg-white w-full max-w-md h-full max-h-[calc(100vh-2rem)] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Header oscuro */}
          <div className="bg-[#001a1a] p-5 shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[9px] font-bold tracking-widest text-[#00f2ff]/50 uppercase">Envío #{shipment.order_number}</p>
                <h2 className="text-base font-black text-white mt-0.5">{shipment.customer_name}</h2>
              </div>
              <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <X size={14} className="text-white/60"/>
              </button>
            </div>
            <StatusBadge status={shipment.status}/>
          </div>

          {/* Scroll */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Timeline */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-4">Progreso del envío</p>
              <ShipmentTimeline shipment={shipment}/>
            </div>

            {/* Info del pedido */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
              <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1">Detalles del pedido</p>
              {[
                { icon: <User size={12}/>,       label: 'Cliente',    value: shipment.customer_name },
                { icon: <Phone size={12}/>,      label: 'Teléfono',   value: shipment.customer_phone || '—' },
                { icon: <MapPin size={12}/>,     label: 'Dirección',  value: shipment.customer_address || shipment.customer_city || '—' },
                { icon: <DollarSign size={12}/>, label: 'Total',      value: fmt(shipment.total_price || 0) },
                { icon: <ShoppingBag size={12}/>,label: 'Artículos',  value: `${shipment.items_count || 0} producto(s)` },
                { icon: <Calendar size={12}/>,   label: 'Pedido',     value: fmtDate(shipment.created_at) },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">{r.icon}</div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 shrink-0">{r.label}:</span>
                    <span className="text-[11px] font-semibold text-gray-800 truncate">{r.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actualizar estado */}
            <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Actualizar estado</p>

              {/* Transportadora */}
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-semibold">Transportadora</label>
                <select value={carrier} onChange={e => setCarrier(e.target.value)}
                  className={inputCls + " appearance-none bg-white"}>
                  <option value="">Sin asignar</option>
                  {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Guía */}
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-semibold">Número de guía</label>
                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Ej: SRV-123456789" className={inputCls}/>
              </div>

              {/* Nuevo estado */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 font-semibold">Estado del envío</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.entries(STATUS) as [ShipStatus, any][]).map(([key, s]) => (
                    <button key={key} onClick={() => setNewStatus(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-semibold transition-all ${newStatus === key ? 'border-[#004d4d] bg-[#004d4d]/5 text-[#004d4d]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`}/>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nota */}
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-semibold">Nota interna (opcional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Ej: Cliente confirmó recepción..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/50 resize-none"/>
              </div>
            </div>
          </div>

          {/* Footer acciones */}
          <div className="p-4 border-t border-gray-100 space-y-2 shrink-0">
            <button onClick={handleSave} disabled={saving}
              className="w-full h-10 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle2 size={13}/>}
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {shipment.customer_phone && (
              <a href={`https://wa.me/57${shipment.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                className="w-full h-9 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                <MessageCircle size={12}/> Notificar por WhatsApp
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function ShippingPage() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filterStatus, setFilterStatus] = useState<ShipStatus | 'todos'>('todos');
  const [filterCarrier, setFilterCarrier] = useState('todos');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');
  const [showFilters,   setShowFilters]   = useState(false);
  const [drawerShipment, setDrawerShipment] = useState<Shipment | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // ── CARGA DIRECTA DESDE /shipments ──
  const fetchShipments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiRequest<Shipment[]>('/shipments', { token });
      if (data) setShipments(data);
    } catch { showToast('Error al cargar envíos', 'error'); }
    finally { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  // ── ACTUALIZAR ENVÍO ──
  const handleUpdateStatus = async (shipmentId: string, newStatus: ShipStatus, carrier: string, tracking: string, note?: string) => {
    try {
      await apiRequest(`/shipments/${shipmentId}`, {
        method: 'PUT', token,
        body: JSON.stringify({ status: newStatus, carrier, tracking_number: tracking, notes: note }),
      });
      showToast('Envío actualizado ✓', 'success');
      fetchShipments();
    } catch { showToast('Error al actualizar', 'error'); }
  };

  // ── KPIs ──
  const stats = useMemo(() => ({
    total:     shipments.length,
    activos:   shipments.filter(s => ['guia_generada','en_transito','en_reparto'].includes(s.status)).length,
    entregados:shipments.filter(s => s.status === 'entregado').length,
    alertas:   shipments.filter(s => ['incidencia','devuelto'].includes(s.status)).length,
    pendientes:shipments.filter(s => s.status === 'pendiente').length,
  }), [shipments]);

  // ── FILTROS ──
  const availableCarriers = useMemo(() => Array.from(new Set(shipments.map(s => s.carrier).filter(Boolean))), [shipments]);

  const filtered = useMemo(() => {
    let list = [...shipments];
    if (filterStatus !== 'todos') list = list.filter(s => s.status === filterStatus);
    if (filterCarrier !== 'todos') list = list.filter(s => s.carrier === filterCarrier);
    if (filterDateFrom) list = list.filter(s => new Date(s.created_at) >= new Date(filterDateFrom));
    if (filterDateTo)   list = list.filter(s => new Date(s.created_at) <= new Date(filterDateTo + 'T23:59:59'));
    if (search) list = list.filter(s =>
      s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      s.order_number.toLowerCase().includes(search.toLowerCase()) ||
      s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_city.toLowerCase().includes(search.toLowerCase())
    );
    return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [shipments, filterStatus, filterCarrier, filterDateFrom, filterDateTo, search]);

  const activeFiltersCount = [filterCarrier !== 'todos', filterDateFrom, filterDateTo].filter(Boolean).length;

  const clearAllFilters = () => { setFilterCarrier('todos'); setFilterDateFrom(''); setFilterDateTo(''); setFilterStatus('todos'); setSearch(''); };

  // ── PIPELINE COUNTS ──
  const pipelineCounts = useMemo(() => {
    const map: Record<string, number> = {};
    shipments.forEach(s => { map[s.status] = (map[s.status] || 0) + 1; });
    return map;
  }, [shipments]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-[#004d4d]" size={32}/>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">

      {/* ══════════ MOBILE VIEW (solo < sm) ══════════ */}
      <div className="block sm:hidden -mx-3 space-y-3 pt-2">

        {/* Hero card */}
        <div className="mx-3 rounded-3xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg,#001a1a 0%,#003333 50%,#005252 100%)' }}>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(0,242,255,0.12),transparent 70%)' }}/>
          <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(0,178,189,0.08),transparent 70%)' }}/>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-[#00f2ff]/15 flex items-center justify-center">
                <Truck size={12} className="text-[#00f2ff]"/>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f2ff]/70">Logística</p>
            </div>
            <button onClick={fetchShipments} className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-white/50 active:bg-white/20 transition-colors">
              <RefreshCw size={12}/>
            </button>
          </div>

          <div className="mb-1">
            <p className="text-[11px] font-bold text-white/30">Total</p>
            <p className="text-[42px] font-black text-white leading-none tracking-tight -mt-1">
              {stats.total}
              <span className="text-[18px] text-white/25 ml-2 font-bold">envíos</span>
            </p>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"/>
              <p className="text-[9px] text-white/40">{stats.activos} en ruta</p>
            </div>
            {stats.alertas > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[9px] font-black text-rose-400 bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 rounded-full">
                <AlertCircle size={8}/> {stats.alertas} alertas
              </span>
            )}
          </div>
        </div>

        {/* 4 mini stats */}
        <div className="grid grid-cols-2 gap-2.5 mx-3">
          {[
            { label: 'En ruta',      value: stats.activos,    sub: 'Guía + tránsito', icon: <Truck size={13} className="text-blue-500"/>,        bg: 'bg-blue-50' },
            { label: 'Entregados',   value: stats.entregados, sub: `${stats.total > 0 ? ((stats.entregados/stats.total)*100).toFixed(0) : 0}% éxito`, icon: <CheckCircle2 size={13} className="text-emerald-500"/>, bg: 'bg-emerald-50' },
            { label: 'Pendientes',   value: stats.pendientes, sub: 'Sin guía',         icon: <Clock size={13} className="text-amber-500"/>,         bg: 'bg-amber-50' },
            { label: 'Alertas',      value: stats.alertas,    sub: 'Requieren atención', icon: <AlertCircle size={13} className="text-rose-500"/>, bg: 'bg-rose-50', badge: stats.alertas > 0 },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className={`h-7 w-7 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                {(s as any).badge && <span className="text-[7px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full uppercase">¡Atención!</span>}
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{s.label}</p>
              <p className="text-[22px] font-black text-gray-900 leading-none">{s.value}</p>
              <p className="text-[9px] text-gray-400 mt-1.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Pipeline compacto */}
        <div className="mx-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Pipeline de envíos</p>
          <div className="grid grid-cols-5 gap-1">
            {PIPELINE.map(st => {
              const s = STATUS[st];
              const count = pipelineCounts[st] || 0;
              const isActive = filterStatus === st;
              const barColor = st === 'pendiente' ? '#9ca3af' : st === 'guia_generada' ? '#60a5fa' : st === 'en_transito' ? '#a78bfa' : st === 'en_reparto' ? '#fbbf24' : '#34d399';
              return (
                <button key={st} onClick={() => setFilterStatus(isActive ? 'todos' : st)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? `${s.bg} ring-1 ring-gray-200` : 'hover:bg-gray-50'}`}>
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center [&_svg]:w-3 [&_svg]:h-3 ${s.bg} ${s.color}`}>{s.icon}</div>
                  <p className={`text-[13px] font-black ${isActive ? s.color : 'text-gray-700'}`}>{count}</p>
                  <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: stats.total > 0 ? `${(count/stats.total)*100}%` : '0%', backgroundColor: barColor }}/>
                  </div>
                  <p className="text-[6px] font-black text-gray-400 uppercase tracking-wide text-center leading-tight">{s.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de envíos */}
        <div className="mx-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
            <div>
              <p className="text-[13px] font-black text-gray-900">Envíos</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Toca un envío para ver el detalle</p>
            </div>
            <span className="text-[10px] font-black text-[#004d4d] bg-[#004d4d]/8 px-2.5 py-1 rounded-full">
              {filtered.length}
            </span>
          </div>

          {/* Búsqueda */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 h-9 bg-gray-50 rounded-xl border border-gray-100 px-3">
              <Search size={13} className="text-gray-300 shrink-0"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar envío…"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
              {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-300"/></button>}
            </div>
          </div>

          {/* Filtros de estado: grid */}
          <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
            {([['todos','Todos'], ['pendiente','Pendiente'], ['guia_generada','Con guía'], ['en_transito','En tránsito'], ['en_reparto','En reparto'], ['entregado','Entregado']] as [string,string][]).map(([key, label]) => {
              const isActive = filterStatus === key;
              return (
                <button key={key} onClick={() => setFilterStatus(isActive ? 'todos' : key as ShipStatus)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all ${
                    isActive ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-400'
                  }`}>
                  <span className="truncate">{label}</span>
                  <span className={`shrink-0 text-[7px] min-w-[16px] text-center px-1 py-0.5 rounded-full font-black ${isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {key === 'todos' ? shipments.length : pipelineCounts[key] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Truck size={18} className="text-gray-300"/>
              </div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin envíos</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50/80 max-h-[420px] overflow-y-auto">
              {filtered.map(s => {
                const st = STATUS[s.status];
                const diffH = Math.floor((Date.now() - new Date(s.updated_at).getTime()) / 3600000);
                const dateLabel = diffH < 24 ? `Hoy · ${new Date(s.updated_at).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}` : diffH < 48 ? 'Ayer' : fmtDate(s.updated_at);
                return (
                  <div key={s.id} onClick={() => setSelected(s)}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`h-9 w-9 rounded-xl ${st.bg} flex items-center justify-center shrink-0 ${st.color}`}>
                      {st.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-800 truncate">{s.customer_name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.customer_city || '—'} · {dateLabel}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-black text-gray-900">{fmt(s.total_price)}</p>
                      <span className={`text-[8px] font-black uppercase tracking-wide ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4"/>
      </div>
      {/* ══════════ FIN MOBILE VIEW ══════════ */}

      {/* ── HEADER (solo desktop) ── */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] uppercase mb-1 text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>
            Logística global
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">
            ENVÍOS
          </h1>
          <p className="text-sm mt-1 text-gray-400">Seguimiento y control de despachos en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchShipments}
            className="h-10 w-10 flex items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-400 hover:text-[#004d4d] hover:border-[#004d4d]/30 transition-all shadow-sm">
            <RefreshCw size={14}/>
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(v => !v)}
              className="h-10 flex items-center gap-2 px-4 rounded-2xl border border-gray-200 bg-white text-[10px] font-semibold text-gray-600 hover:border-[#004d4d]/30 transition-all shadow-sm">
              <Download size={13}/> Exportar <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                  <button onClick={async () => {
                    const wb = new ExcelJS.Workbook(); wb.creator = 'Bayup';
                    const ws = wb.addWorksheet('Envíos');
                    ws.columns = [
                      { key: 'pedido', width: 14 }, { key: 'cliente', width: 28 }, { key: 'telefono', width: 16 },
                      { key: 'ciudad', width: 18 }, { key: 'operadora', width: 14 }, { key: 'guia', width: 20 },
                      { key: 'estado', width: 16 }, { key: 'total', width: 16 }, { key: 'fecha', width: 14 },
                    ];
                    const hdr = ws.getRow(1);
                    ['PEDIDO','CLIENTE','TELÉFONO','CIUDAD','OPERADORA','GUÍA','ESTADO','TOTAL','FECHA'].forEach((h, i) => {
                      const cell = hdr.getCell(i + 1); cell.value = h;
                      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
                      cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10, name: 'Arial' };
                      cell.alignment = { vertical: 'middle', horizontal: 'center' };
                      cell.border = { bottom: { style: 'thick', color: { argb: '00F2FF' } } };
                    });
                    hdr.height = 36;
                    shipments.forEach((s, i) => {
                      const row = ws.addRow({
                        pedido: s.order_number, cliente: s.customer_name, telefono: s.customer_phone || '—',
                        ciudad: s.customer_city || '—', operadora: s.carrier || '—', guia: s.tracking_number || '—',
                        estado: STATUS[s.status]?.label || s.status, total: s.total_price,
                        fecha: s.created_at ? new Date(s.created_at).toLocaleDateString('es-CO') : '—',
                      });
                      row.height = 26;
                      row.getCell(8).numFmt = '"$"#,##0';
                      row.getCell(8).font = { bold: true, color: { argb: '004D4D' }, name: 'Arial', size: 10 };
                      if (i % 2 === 0) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFA' } }; });
                    });
                    const buffer = await wb.xlsx.writeBuffer();
                    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    saveAs(blob, `envios_${new Date().toISOString().slice(0,10)}.xlsx`);
                    setShowExportMenu(false); showToast('Excel descargado ✓', 'success');
                  }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-[#004d4d]/5 transition-colors text-left">
                    <FileSpreadsheet size={14} className="text-[#004d4d]"/> Excel (.xlsx)
                    <span className="ml-auto text-[9px] text-[#004d4d] font-bold uppercase tracking-wide">Recomendado</span>
                  </button>
                  <div className="h-px bg-gray-100 mx-3"/>
                  <button onClick={() => {
                    const headers = ['PEDIDO','CLIENTE','TELÉFONO','CIUDAD','OPERADORA','GUÍA','ESTADO','TOTAL','FECHA'];
                    const rows = shipments.map(s => [
                      s.order_number, s.customer_name, s.customer_phone || '', s.customer_city || '',
                      s.carrier || '', s.tracking_number || '', STATUS[s.status]?.label || s.status,
                      s.total_price, s.created_at ? new Date(s.created_at).toLocaleDateString('es-CO') : '',
                    ]);
                    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `envios_${new Date().toISOString().slice(0,10)}.csv`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    URL.revokeObjectURL(url); setShowExportMenu(false); showToast('CSV descargado ✓', 'success');
                  }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    <Download size={14} className="text-gray-400"/> CSV (.csv)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── KPIs (solo desktop) ── */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total envíos"   value={fmtN(stats.total)}      sub="Este período"          icon={<Package/>}       accent="#004d4d"/>
        <KpiCard label="En ruta"        value={fmtN(stats.activos)}    sub="Guía + tránsito + reparto" icon={<Truck/>}     trendUp trend={stats.activos > 0 ? 'Live' : null} accent="#3b82f6"/>
        <KpiCard label="Entregados"     value={fmtN(stats.entregados)} sub={`${stats.total > 0 ? ((stats.entregados/stats.total)*100).toFixed(0) : 0}% éxito`} icon={<CheckCircle2/>} trendUp accent="#10b981"/>
        <KpiCard label="Pendientes"     value={fmtN(stats.pendientes)} sub="Sin guía asignada"     icon={<Clock/>}         accent="#f59e0b"/>
        <KpiCard label="Alertas"        value={fmtN(stats.alertas)}    sub="Requieren atención"    icon={<AlertCircle/>}   trendUp={false} trend={stats.alertas > 0 ? `${stats.alertas}` : null} accent="#ef4444"/>
      </div>

      {/* ── PIPELINE VISUAL (solo desktop) ── */}
      <div className="hidden sm:block bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-5">
        <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-4">Pipeline de envíos</p>
        <div className="flex items-stretch gap-2">
          {PIPELINE.map((st, i) => {
            const s = STATUS[st];
            const count = pipelineCounts[st] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <button key={st} onClick={() => setFilterStatus(filterStatus === st ? 'todos' : st)}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                  filterStatus === st ? `${s.bg} ${s.border} shadow-sm` : 'border-transparent hover:bg-gray-50'
                }`}>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center [&_svg]:w-3.5 [&_svg]:h-3.5 ${s.bg} ${s.color}`}>{s.icon}</div>
                <p className={`text-[8px] font-bold uppercase tracking-widest ${filterStatus === st ? s.color : 'text-gray-400'}`}>{s.label}</p>
                <span className={`text-lg font-black ${filterStatus === st ? s.color : 'text-gray-700'}`}>{count}</span>
                {/* Barra proporcional */}
                <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: s.dot.includes('emerald') ? '#34d399' : s.dot.includes('blue') ? '#60a5fa' : s.dot.includes('violet') ? '#a78bfa' : s.dot.includes('amber') ? '#fbbf24' : '#9ca3af' }}
                  />
                </div>
              </button>
            );
          })}
          {/* Alertas como columna especial */}
          {['incidencia','devuelto'].map(st => {
            const s = STATUS[st as ShipStatus];
            const count = pipelineCounts[st] || 0;
            return (
              <button key={st} onClick={() => setFilterStatus(filterStatus === st ? 'todos' : st as ShipStatus)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all min-w-[80px] ${
                  filterStatus === st ? `${s.bg} ${s.border} shadow-sm` : 'border-transparent hover:bg-gray-50'
                } ${count > 0 ? '' : 'opacity-40'}`}>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center [&_svg]:w-3.5 [&_svg]:h-3.5 ${s.bg} ${s.color}`}>{s.icon}</div>
                <p className={`text-[8px] font-bold uppercase tracking-widest ${s.color}`}>{s.label}</p>
                <span className={`text-lg font-black ${count > 0 ? s.color : 'text-gray-300'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BARRA BÚSQUEDA + FILTROS (solo desktop) ── */}
      <div className="hidden sm:block space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 h-10 bg-white rounded-2xl border border-gray-200 shadow-sm px-3">
            <Search size={14} className="text-gray-300 shrink-0"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente, nº pedido, guía o ciudad…"
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
            {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-300"/></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`h-10 flex items-center gap-2 px-4 rounded-2xl border text-[10px] font-bold transition-all shadow-sm relative ${
              showFilters || activeFiltersCount > 0
                ? 'bg-[#004d4d] border-[#004d4d] text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-[#004d4d]/30'
            }`}>
            <SlidersHorizontal size={13}/>
            Filtros
            {activeFiltersCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-white text-[#004d4d] text-[8px] font-black flex items-center justify-center ml-0.5">{activeFiltersCount}</span>
            )}
          </button>
          {(activeFiltersCount > 0 || filterStatus !== 'todos') && (
            <button onClick={clearAllFilters}
              className="h-10 flex items-center gap-2 px-3 rounded-2xl border border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-500 hover:bg-rose-100 transition-colors">
              <X size={11}/> Limpiar
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Operadora */}
                <div>
                  <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Operadora</label>
                  <select value={filterCarrier} onChange={e => setFilterCarrier(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#004d4d]/50">
                    <option value="todos">Todas las operadoras</option>
                    {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    {availableCarriers.filter(c => !CARRIERS.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Desde */}
                <div>
                  <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Desde</label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#004d4d]/50"/>
                </div>
                {/* Hasta */}
                <div>
                  <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Hasta</label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#004d4d]/50"/>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TABLA (solo desktop) ── */}
      <div className="hidden sm:block bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-[#004d4d]"/>
            <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Envíos</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#004d4d]/10 text-[#004d4d]">{filtered.length}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <Truck size={40} className="mb-3"/>
            <p className="text-sm font-semibold">{search ? 'Sin resultados' : 'Sin envíos registrados'}</p>
            <p className="text-[11px] mt-1">{search ? 'Intenta con otro término' : 'Los pedidos web confirmados aparecerán aquí automáticamente'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Pedido','Cliente','Ciudad','Transportadora','Guía','Estado','Última actualización',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((s, i) => (
                    <motion.tr key={s.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setDrawerShipment(s)}>

                      {/* Pedido */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[11px] font-black text-gray-900">#{s.order_number}</p>
                          <p className="text-[9px] text-gray-400">{fmtDate(s.created_at)}</p>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[11px] font-bold text-gray-800">{s.customer_name}</p>
                          {s.customer_phone && <p className="text-[9px] text-gray-400 flex items-center gap-1"><Phone size={9} className="text-gray-300"/>{s.customer_phone}</p>}
                        </div>
                      </td>

                      {/* Ciudad */}
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                          <MapPin size={9} className="text-gray-300"/>{s.customer_city || '—'}
                        </span>
                      </td>

                      {/* Transportadora */}
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold ${s.carrier ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                          {s.carrier || 'Sin asignar'}
                        </span>
                      </td>

                      {/* Guía */}
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono font-bold ${s.tracking_number === 'PENDIENTE' ? 'text-gray-300' : 'text-[#004d4d]'}`}>
                          {s.tracking_number}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status}/>
                      </td>

                      {/* Fecha update */}
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-gray-400">{fmtDate(s.updated_at)}</span>
                      </td>

                      {/* Acción */}
                      <td className="px-4 py-3">
                        <button className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-xl bg-[#004d4d]/10 text-[#004d4d] hover:bg-[#004d4d]/20 transition-all"
                          onClick={e => { e.stopPropagation(); setDrawerShipment(s); }}>
                          <Edit3 size={12}/>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-[10px] text-gray-400">{filtered.length} envíos · {stats.entregados} completados · {stats.alertas} con alerta</span>
            {stats.alertas > 0 && (
              <button onClick={() => setFilterStatus('incidencia')}
                className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline">
                <AlertCircle size={11}/> Ver {stats.alertas} incidencia{stats.alertas > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── DRAWER ── */}
      <AnimatePresence>
        {drawerShipment && (
          <ShipmentDrawer
            shipment={drawerShipment}
            onClose={() => setDrawerShipment(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
