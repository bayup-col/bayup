"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Search, Download, TrendingUp, DollarSign, Heart,
  Mail, Phone, MapPin, ShoppingBag, Star, X, Plus, Loader2,
  ChevronDown, Globe, MessageCircle, Store, Filter, ArrowUpRight,
  ArrowDownRight, MoreHorizontal, Edit3, Trash2, Eye, Calendar,
  Activity, Target, Zap, CheckCircle2, AlertCircle, Clock, Hash,
  UserCheck, RefreshCw, Send, FileSpreadsheet
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';

// ── TIPOS ──────────────────────────────────────────────────────────────────
interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  status: 'active' | 'blocked' | 'Activo' | 'Bloqueado';
  customer_type: 'final' | 'mayorista';
  acquisition_channel: 'web' | 'redes' | 'tienda' | 'whatsapp';
  total_spent: number;
  created_at?: string;
  orders_count?: number;
  last_purchase?: string;
  notes?: string;
}

// ── UTILS ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtN = (n: number) => n.toLocaleString('es-CO');
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const avatarColor = (name: string) => {
  const colors = ['bg-[#004d4d]','bg-blue-600','bg-violet-600','bg-rose-500','bg-amber-500','bg-emerald-600','bg-cyan-600','bg-pink-600'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};

const CHANNELS: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  web:       { label: 'Web',       icon: <Globe size={11}/>,          color: 'text-blue-600',   bg: 'bg-blue-50' },
  redes:     { label: 'Redes',     icon: <Star size={11}/>,           color: 'text-pink-600',   bg: 'bg-pink-50' },
  tienda:    { label: 'Tienda',    icon: <Store size={11}/>,          color: 'text-amber-600',  bg: 'bg-amber-50' },
  whatsapp:  { label: 'WhatsApp',  icon: <MessageCircle size={11}/>,  color: 'text-emerald-600',bg: 'bg-emerald-50' },
};

const STATUS_MAP: Record<string, { label: string; dot: string; cls: string }> = {
  active:    { label: 'Activo',   dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  Activo:    { label: 'Activo',   dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  blocked:   { label: 'Bloqueado',dot: 'bg-rose-400',    cls: 'bg-rose-50 text-rose-600 border-rose-100' },
  Bloqueado: { label: 'Bloqueado',dot: 'bg-rose-400',    cls: 'bg-rose-50 text-rose-600 border-rose-100' },
};

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

// ── MODAL NUEVO / EDITAR CLIENTE ───────────────────────────────────────────
function CustomerModal({ customer, onSave, onClose }: { customer?: Customer | null; onSave: () => void; onClose: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    email:     customer?.email     || '',
    phone:     customer?.phone     || '',
    city:      customer?.city      || '',
    customer_type:       (customer?.customer_type || 'final') as 'final' | 'mayorista',
    acquisition_channel: (customer?.acquisition_channel || 'web') as 'web' | 'redes' | 'tienda' | 'whatsapp',
    notes: customer?.notes || '',
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setFormError('');
    if (!form.full_name || !form.email) { setFormError('Nombre y email son obligatorios'); return; }
    setSaving(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      const res = await fetch(`${apiBase}/admin/users${customer ? `/${customer.id}` : ''}`, {
        method: customer ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email, full_name: form.full_name, phone: form.phone,
          city: form.city, status: 'Activo', role: 'cliente',
          password: customer ? undefined : Math.random().toString(36).slice(-10),
          nickname: form.full_name.split(' ')[0],
          customer_type: form.customer_type,
          acquisition_channel: form.acquisition_channel,
          notes: form.notes,
        })
      });
      if (res.ok) {
        showToast(customer ? 'Cliente actualizado ✓' : 'Cliente registrado ✨', 'success');
        onSave(); onClose();
      } else {
        const err = await res.json();
        setFormError(err.detail || 'Error al guardar');
      }
    } catch { setFormError('Error de conexión. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  const inputCls = "w-full h-10 px-4 rounded-2xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/50 transition-colors";

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose}/>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
          className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-[#004d4d]/10 flex items-center justify-center">
                {customer ? <Edit3 size={15} className="text-[#004d4d]"/> : <UserPlus size={15} className="text-[#004d4d]"/>}
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900">{customer ? 'Editar cliente' : 'Nuevo cliente'}</h2>
                <p className="text-[10px] text-gray-400">{customer ? 'Actualiza la información del cliente' : 'Agrega un nuevo comprador a tu base'}</p>
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"><X size={15} className="text-gray-400"/></button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Nombre + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Nombre completo *</label>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Juan Pérez" className={inputCls}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" className={inputCls}/>
              </div>
            </div>

            {/* Teléfono + Ciudad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Teléfono</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="3001234567" className={inputCls}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Ciudad</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Bogotá" className={inputCls}/>
              </div>
            </div>

            {/* Tipo de cliente */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Tipo de cliente</label>
              <div className="flex rounded-2xl border border-gray-200 overflow-hidden">
                {(['final', 'mayorista'] as const).map(t => (
                  <button key={t} onClick={() => set('customer_type', t)}
                    className={`flex-1 py-2.5 text-[10px] font-bold capitalize tracking-widest transition-colors ${form.customer_type === t ? 'bg-[#004d4d] text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                    {t === 'final' ? '👤 Cliente final' : '🏪 Mayorista'}
                  </button>
                ))}
              </div>
            </div>

            {/* Canal de adquisición */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">¿Cómo llegó?</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(CHANNELS) as any).map(([key, ch]: any) => (
                  <button key={key} onClick={() => set('acquisition_channel', key)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-[9px] font-bold transition-all ${form.acquisition_channel === key ? 'border-[#004d4d] bg-[#004d4d]/5 text-[#004d4d]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                    <span className={form.acquisition_channel === key ? 'text-[#004d4d]' : 'text-gray-300'}>{ch.icon}</span>
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Notas internas</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Observaciones sobre este cliente..."
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/50 resize-none"/>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="flex-1 h-10 rounded-2xl border border-gray-200 text-[11px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 h-10 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin"/> : null}
              {saving ? 'Guardando…' : customer ? 'Guardar cambios' : 'Registrar cliente'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── DRAWER DETALLE CLIENTE ─────────────────────────────────────────────────
function CustomerDrawer({ customer, onClose, onEdit }: { customer: Customer; onClose: () => void; onEdit: () => void }) {
  const ch = CHANNELS[customer.acquisition_channel] || CHANNELS.web;
  const st = STATUS_MAP[customer.status] || STATUS_MAP.active;

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose}/>
      <div className="fixed inset-0 flex items-center justify-end p-4" style={{ zIndex: 9999 }}>
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative bg-white w-full max-w-sm h-full max-h-[calc(100vh-2rem)] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Avatar header */}
          <div className="bg-[#001a1a] p-6 shrink-0">
            <div className="flex items-start justify-between mb-4">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white text-lg font-black ${avatarColor(customer.full_name)}`}>
                {initials(customer.full_name)}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onEdit} className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <Edit3 size={13} className="text-white/60"/>
                </button>
                <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <X size={13} className="text-white/60"/>
                </button>
              </div>
            </div>
            <h2 className="text-lg font-black text-white leading-tight">{customer.full_name}</h2>
            <p className="text-[11px] text-white/40 mt-0.5">{customer.email}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60 capitalize">{customer.customer_type}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${ch.bg} ${ch.color}`}>{ch.icon}{ch.label}</span>
            </div>
          </div>

          {/* Scroll content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* KPIs del cliente */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total gastado', value: fmt(customer.total_spent || 0), icon: <DollarSign size={13}/>, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Pedidos', value: fmtN(customer.orders_count || 0), icon: <ShoppingBag size={13}/>, color: 'text-blue-600 bg-blue-50' },
              ].map((k, i) => (
                <div key={i} className={`p-3 rounded-2xl flex items-center gap-2 ${k.color.split(' ')[1]}`}>
                  <div className={`shrink-0 ${k.color.split(' ')[0]}`}>{k.icon}</div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">{k.label}</p>
                    <p className="text-[13px] font-black text-gray-900">{k.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Datos de contacto */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Contacto</p>
              {[
                { icon: <Mail size={12}/>, label: 'Email', value: customer.email },
                { icon: <Phone size={12}/>, label: 'Teléfono', value: customer.phone || '—' },
                { icon: <MapPin size={12}/>, label: 'Ciudad', value: customer.city || '—' },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">{r.icon}</div>
                  <div>
                    <p className="text-[9px] text-gray-400">{r.label}</p>
                    <p className="text-[11px] font-semibold text-gray-800">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fechas */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Historial</p>
              {[
                { icon: <Calendar size={12}/>, label: 'Cliente desde', value: customer.created_at ? new Date(customer.created_at).toLocaleDateString('es-CO') : '—' },
                { icon: <Clock size={12}/>, label: 'Última compra', value: customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString('es-CO') : 'Sin compras' },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">{r.icon}</div>
                  <div>
                    <p className="text-[9px] text-gray-400">{r.label}</p>
                    <p className="text-[11px] font-semibold text-gray-800">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Notas */}
            {customer.notes && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <p className="text-[9px] font-bold tracking-widest uppercase text-amber-600 mb-1">Notas</p>
                <p className="text-[11px] text-gray-700 leading-relaxed">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="p-4 border-t border-gray-100 grid grid-cols-2 gap-2 shrink-0">
            <a href={`mailto:${customer.email}`}
              className="h-10 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              <Mail size={13}/> Email
            </a>
            {customer.phone ? (
              <a href={`https://wa.me/57${customer.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                className="h-10 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                <MessageCircle size={13}/> WhatsApp
              </a>
            ) : (
              <button disabled className="h-10 flex items-center justify-center gap-2 rounded-2xl bg-gray-50 text-[10px] font-bold text-gray-300 cursor-not-allowed">
                <Phone size={13}/> Sin tel.
              </button>
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
export default function CustomersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterType,    setFilterType]    = useState<'todos' | 'final' | 'mayorista'>('todos');
  const [filterChannel, setFilterChannel] = useState<string>('todos');
  const [filterStatus,  setFilterStatus]  = useState<'todos' | 'active' | 'blocked'>('todos');
  const [sortBy, setSortBy] = useState<'name' | 'spent' | 'date'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editCustomer,  setEditCustomer]  = useState<Customer | null>(null);
  const [drawerCustomer, setDrawerCustomer] = useState<Customer | null>(null);

  // ── CARGA ──
  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      const res = await fetch(`${apiBase}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // ── KPIs ──
  const stats = useMemo(() => {
    const total   = customers.length;
    const ltv     = customers.reduce((a, c) => a + (c.total_spent || 0), 0);
    const active  = customers.filter(c => c.status === 'active' || c.status === 'Activo').length;
    const mayoristas = customers.filter(c => c.customer_type === 'mayorista').length;
    const avgTicket  = total > 0 ? ltv / total : 0;
    return { total, ltv, active, mayoristas, avgTicket };
  }, [customers]);

  // ── FILTROS ──
  const filtered = useMemo(() => {
    let list = [...customers];
    if (search) list = list.filter(c =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
    );
    if (filterType    !== 'todos') list = list.filter(c => c.customer_type === filterType);
    if (filterChannel !== 'todos') list = list.filter(c => c.acquisition_channel === filterChannel);
    if (filterStatus  !== 'todos') list = list.filter(c => {
      const isActive = c.status === 'active' || c.status === 'Activo';
      return filterStatus === 'active' ? isActive : !isActive;
    });
    if (sortBy === 'spent') list.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
    else if (sortBy === 'date') list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    return list;
  }, [customers, search, filterType, filterChannel, filterStatus, sortBy]);

  // ── EXPORT ──
  const handleExportExcel = async () => {
    try {
      showToast('Generando Excel…', 'info');
      const { exportCustomersToExcel } = await import('@/lib/customers-export');
      await exportCustomersToExcel(customers, 'Bayup_Clientes');
      setShowExportMenu(false);
      showToast('Excel descargado ✓', 'success');
    } catch { showToast('Error al generar el archivo', 'error'); }
  };

  const handleExportCSV = () => {
    const headers = ['NOMBRE', 'EMAIL', 'TELÉFONO', 'CIUDAD', 'TIPO', 'CANAL', 'TOTAL INVERTIDO', 'ESTADO'];
    const rows = customers.map(c => [
      c.full_name, c.email, c.phone || '', c.city || '',
      c.customer_type === 'mayorista' ? 'Mayorista' : 'Cliente Final',
      c.acquisition_channel || '',
      c.total_spent || 0,
      c.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `clientes_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showToast('CSV descargado ✓', 'success');
  };

  // ── TOP COMPRADORES ──
  const topBuyers = useMemo(() =>
    [...customers].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 5)
  , [customers]);

  // ── CANALES ──
  const channelStats = useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach(c => { map[c.acquisition_channel] = (map[c.acquisition_channel] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [customers]);

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
                <Users size={12} className="text-[#00f2ff]"/>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f2ff]/70">Clientes</p>
            </div>
            <button onClick={() => { setEditCustomer(null); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#00f2ff]/15 border border-[#00f2ff]/20 text-[#00f2ff] text-[9px] font-black uppercase tracking-wide">
              <Plus size={11} strokeWidth={3}/> Nuevo
            </button>
          </div>

          <div className="mb-1">
            <p className="text-[11px] font-bold text-white/30">Total</p>
            <p className="text-[42px] font-black text-white leading-none tracking-tight -mt-1">
              {stats.total}
              <span className="text-[18px] text-white/25 ml-2 font-bold">clientes</span>
            </p>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>
              <p className="text-[9px] text-white/40">{stats.active} activos</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-[9px] text-white/35 font-bold">
              <Store size={9}/> {stats.mayoristas} mayoristas
            </div>
          </div>
        </div>

        {/* 4 mini stats */}
        <div className="grid grid-cols-2 gap-2.5 mx-3">
          {[
            { label: 'Activos',         value: fmtN(stats.active),    sub: `${stats.total > 0 ? ((stats.active/stats.total)*100).toFixed(0) : 0}% del total`, icon: <UserCheck size={13} className="text-emerald-500"/>, bg: 'bg-emerald-50' },
            { label: 'Valor cartera',   value: fmt(stats.ltv),        sub: 'Total acumulado', icon: <DollarSign size={13} className="text-blue-500"/>,    bg: 'bg-blue-50' },
            { label: 'Ticket promedio', value: fmt(stats.avgTicket),  sub: 'Por cliente',     icon: <Target size={13} className="text-violet-500"/>,     bg: 'bg-violet-50' },
            { label: 'Mayoristas',      value: fmtN(stats.mayoristas),sub: 'Cuentas B2B',     icon: <Store size={13} className="text-amber-500"/>,       bg: 'bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className={`h-7 w-7 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{s.label}</p>
              <p className="text-[18px] font-black text-gray-900 leading-none truncate">{s.value}</p>
              <p className="text-[9px] text-gray-400 mt-1.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Lista de clientes */}
        <div className="mx-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
            <div>
              <p className="text-[13px] font-black text-gray-900">Directorio</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Toca un cliente para ver el detalle</p>
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
                placeholder="Buscar cliente…"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
              {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-300"/></button>}
            </div>
          </div>

          {/* Filtros tipo: grid 3 cols */}
          <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
            {[
              { key: 'todos',      label: 'Todos',    count: customers.length },
              { key: 'final',      label: 'Final',    count: customers.filter(c => c.customer_type === 'final').length },
              { key: 'mayorista',  label: 'Mayorista',count: stats.mayoristas },
            ].map(t => (
              <button key={t.key} onClick={() => setFilterType(t.key as any)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all ${
                  filterType === t.key ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-400'
                }`}>
                <span className="truncate">{t.label}</span>
                <span className={`shrink-0 text-[7px] min-w-[16px] text-center px-1 py-0.5 rounded-full font-black ${filterType === t.key ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Users size={18} className="text-gray-300"/>
              </div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                {search ? 'Sin resultados' : 'Sin clientes'}
              </p>
              {!search && (
                <button onClick={() => setIsModalOpen(true)}
                  className="mt-1 h-8 px-4 bg-[#004d4d] text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                  + Nuevo cliente
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50/80 max-h-[420px] overflow-y-auto">
              {filtered.map(c => {
                const isActive = c.status === 'active' || c.status === 'Activo';
                const ch = CHANNELS[c.acquisition_channel] || CHANNELS.web;
                return (
                  <div key={c.id} onClick={() => setSelectedCustomer(c)}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`h-10 w-10 rounded-xl ${avatarColor(c.full_name)} flex items-center justify-center shrink-0`}>
                      <span className="text-white font-black text-[13px]">{initials(c.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12px] font-bold text-gray-800 truncate">{c.full_name}</p>
                        {c.customer_type === 'mayorista' && (
                          <span className="shrink-0 text-[7px] font-black text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full uppercase">B2B</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[8px] font-bold ${ch.color}`}>{ch.label}</span>
                        {c.city && <span className="text-[8px] text-gray-400">· {c.city}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-black text-gray-900">{fmt(c.total_spent || 0)}</p>
                      <span className={`text-[8px] font-black uppercase tracking-wide ${isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {isActive ? '● Activo' : '○ Inactivo'}
                      </span>
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
            Customer Intelligence
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">
            CLIENTES
          </h1>
          <p className="text-sm mt-1 text-gray-400">Centro de mando de tu base de compradores</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(v => !v)}
              className="h-10 flex items-center gap-2 px-4 rounded-2xl border border-gray-200 bg-white text-[10px] font-semibold text-gray-600 hover:border-[#004d4d]/30 transition-all shadow-sm">
              <Download size={13}/> Exportar base <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
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
          <button onClick={() => { setEditCustomer(null); setIsModalOpen(true); }}
            className="h-10 flex items-center gap-2 px-5 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm">
            <Plus size={13}/> Nuevo cliente
          </button>
        </div>
      </div>

      {/* ── KPIs (solo desktop) ── */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total clientes"   value={fmtN(stats.total)}       sub="En tu base de datos"   icon={<Users/>}     trend="+0%"   trendUp accent="#004d4d"/>
        <KpiCard label="Clientes activos" value={fmtN(stats.active)}      sub={`${stats.total > 0 ? ((stats.active/stats.total)*100).toFixed(0) : 0}% del total`} icon={<UserCheck/>}  trendUp accent="#10b981"/>
        <KpiCard label="Valor de cartera" value={fmt(stats.ltv)}          sub="Total acumulado"       icon={<DollarSign/>} trendUp accent="#3b82f6"/>
        <KpiCard label="Ticket promedio"  value={fmt(stats.avgTicket)}    sub="Por cliente"           icon={<Target/>}     trendUp accent="#8b5cf6"/>
        <KpiCard label="Mayoristas"       value={fmtN(stats.mayoristas)}  sub="Cuentas B2B"          icon={<Store/>}      accent="#f59e0b"/>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS (solo desktop) ── */}
      <div className="hidden sm:flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="flex-1 flex items-center gap-2 h-10 bg-white rounded-2xl border border-gray-200 shadow-sm px-3">
          <Search size={14} className="text-gray-300 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, ciudad o teléfono…"
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-300"/></button>}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
            className="h-10 px-3 rounded-2xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 focus:outline-none shadow-sm">
            <option value="todos">Todos los tipos</option>
            <option value="final">Cliente final</option>
            <option value="mayorista">Mayorista</option>
          </select>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
            className="h-10 px-3 rounded-2xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 focus:outline-none shadow-sm">
            <option value="todos">Todos los canales</option>
            <option value="web">Web</option>
            <option value="redes">Redes sociales</option>
            <option value="tienda">Tienda física</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="h-10 px-3 rounded-2xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 focus:outline-none shadow-sm">
            <option value="name">A → Z</option>
            <option value="spent">Mayor compra</option>
            <option value="date">Más recientes</option>
          </select>
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── TABLA PRINCIPAL ── */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Cabecera tabla */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#004d4d]"/>
              <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Directorio</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#004d4d]/10 text-[#004d4d]">{filtered.length}</span>
            </div>
            <button onClick={fetchCustomers} className="h-7 w-7 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <RefreshCw size={12} className="text-gray-400"/>
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Users size={36} className="mb-3"/>
              <p className="text-sm font-semibold">{search ? 'Sin resultados' : 'Sin clientes registrados'}</p>
              <p className="text-[11px] mt-1">{search ? 'Intenta con otro término' : 'Agrega tu primer cliente'}</p>
              {!search && (
                <button onClick={() => setIsModalOpen(true)}
                  className="mt-4 h-9 px-5 rounded-2xl bg-[#004d4d] text-white text-[10px] font-bold uppercase tracking-widest">
                  + Nuevo cliente
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Cliente','Contacto','Ciudad','Canal','Tipo','Total gastado','Estado',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((c, i) => {
                      const st  = STATUS_MAP[c.status] || STATUS_MAP.active;
                      const ch  = CHANNELS[c.acquisition_channel] || CHANNELS.web;
                      return (
                        <motion.tr key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          onClick={() => setDrawerCustomer(c)}>
                          {/* Cliente */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-white text-[11px] font-black shrink-0 ${avatarColor(c.full_name)}`}>
                                {initials(c.full_name)}
                              </div>
                              <div>
                                <p className="text-[12px] font-black text-gray-900 leading-tight">{c.full_name}</p>
                                <p className="text-[10px] text-gray-400 truncate max-w-[130px]">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          {/* Contacto */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              {c.phone && <p className="text-[10px] text-gray-600 flex items-center gap-1"><Phone size={9} className="text-gray-300"/>{c.phone}</p>}
                              <p className="text-[10px] text-gray-400 flex items-center gap-1"><Mail size={9} className="text-gray-300"/>email</p>
                            </div>
                          </td>
                          {/* Ciudad */}
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
                              <MapPin size={10} className="text-gray-300"/>{c.city || '—'}
                            </span>
                          </td>
                          {/* Canal */}
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full ${ch.bg} ${ch.color}`}>
                              {ch.icon} {ch.label}
                            </span>
                          </td>
                          {/* Tipo */}
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${c.customer_type === 'mayorista' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                              {c.customer_type === 'mayorista' ? 'B2B' : 'Final'}
                            </span>
                          </td>
                          {/* Total */}
                          <td className="px-4 py-3">
                            <span className="text-[12px] font-black text-gray-900">{fmt(c.total_spent || 0)}</span>
                          </td>
                          {/* Estado */}
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-full border ${st.cls}`}>
                              <div className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>
                              {st.label}
                            </span>
                          </td>
                          {/* Acciones */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setEditCustomer(c); setIsModalOpen(true); }}
                                className="h-7 w-7 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                                <Edit3 size={12} className="text-gray-400"/>
                              </button>
                              <button onClick={() => setDrawerCustomer(c)}
                                className="h-7 w-7 flex items-center justify-center rounded-xl hover:bg-[#004d4d]/10 transition-colors">
                                <Eye size={12} className="text-[#004d4d]"/>
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400">{filtered.length} clientes · cartera total {fmt(filtered.reduce((a,c) => a+(c.total_spent||0),0))}</span>
            </div>
          )}
        </div>

        {/* ── SIDEBAR DERECHO ── */}
        <div className="space-y-4">

          {/* Top compradores */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={13} className="text-amber-500"/>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Top compradores</p>
            </div>
            {topBuyers.length === 0 ? (
              <p className="text-[10px] text-gray-300 text-center py-4">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {topBuyers.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-2xl p-1.5 -m-1.5 transition-colors" onClick={() => setDrawerCustomer(c)}>
                    <span className={`text-[9px] font-black w-4 shrink-0 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-300'}`}>#{i+1}</span>
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0 ${avatarColor(c.full_name)}`}>
                      {initials(c.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-gray-900 truncate">{c.full_name}</p>
                      <p className="text-[9px] text-gray-400">{c.city || 'Sin ciudad'}</p>
                    </div>
                    <span className="text-[10px] font-black text-[#004d4d] shrink-0">{fmt(c.total_spent || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Canales de adquisición */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={13} className="text-[#004d4d]"/>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Por canal</p>
            </div>
            {channelStats.length === 0 ? (
              <p className="text-[10px] text-gray-300 text-center py-4">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {channelStats.map(([key, count]) => {
                  const ch = CHANNELS[key] || CHANNELS.web;
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`flex items-center gap-1.5 text-[10px] font-semibold ${ch.color}`}>{ch.icon}{ch.label}</span>
                        <span className="text-[10px] text-gray-400">{count} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${ch.color.replace('text-','bg-').replace('-600','-400').replace('-500','-400')}`}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Insight rápido */}
          <div className="bg-[#001a1a] rounded-3xl p-5">
            <p className="text-[8px] font-bold tracking-widest text-[#00f2ff]/60 mb-1">BAYUP INSIGHT</p>
            <p className="text-[11px] text-white/70 leading-relaxed">
              {stats.mayoristas > 0
                ? <>Tienes <span className="text-white font-bold">{stats.mayoristas} mayoristas</span> que representan un canal B2B clave. Ofréceles precios especiales para fidelizarlos.</>
                : <>Aún no tienes clientes mayoristas. <span className="text-[#00f2ff] font-bold">Considera crear una línea B2B</span> para aumentar el volumen de ventas.</>
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── MODALES ── */}
      <AnimatePresence>
        {isModalOpen && (
          <CustomerModal
            customer={editCustomer}
            onSave={fetchCustomers}
            onClose={() => { setIsModalOpen(false); setEditCustomer(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerCustomer && (
          <CustomerDrawer
            customer={drawerCustomer}
            onClose={() => setDrawerCustomer(null)}
            onEdit={() => { setEditCustomer(drawerCustomer); setDrawerCustomer(null); setIsModalOpen(true); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
