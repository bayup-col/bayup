"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit3, Search, X, ChevronDown, Download, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, Package, AlertCircle, CheckCircle2, Clock, CreditCard,
  BarChart3, PieChart, Zap, ArrowUpRight, ArrowDownRight, Filter, Calendar,
  Briefcase, Receipt, Target, Activity, RotateCcw, FileText, Loader2,
  Building2, Wrench, Users, Wifi, ShieldCheck, Coffee, Truck, Star, FileSpreadsheet
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/context/toast-context';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { apiRequest } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// ── TIPOS ──────────────────────────────────────────────────────────────────
type ExpenseCategory =
  | 'arriendo' | 'nomina' | 'servicios' | 'marketing' | 'logistica'
  | 'tecnologia' | 'inventario' | 'impuestos' | 'bancario' | 'caja_menor' | 'otro';

type ExpenseStatus = 'pagado' | 'pendiente' | 'vencido';
type ExpenseType = 'fijo' | 'variable';

interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  type: ExpenseType;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: ExpenseStatus;
  payment_method: string;
  notes?: string;
  recurring: boolean;
  recurring_period?: 'mensual' | 'trimestral' | 'anual';
  created_at: string;
}

// ── UTILS ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtN = (n: number) => n.toLocaleString('es-CO');
const today = () => new Date().toISOString().split('T')[0];
const nowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CURRENT_MONTH = new Date().getMonth();
const CURRENT_YEAR = new Date().getFullYear();

const CATEGORIES: { id: ExpenseCategory; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'arriendo',    label: 'Arriendo / Local',  icon: <Building2 size={14}/>,  color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'nomina',      label: 'Nómina',             icon: <Users size={14}/>,      color: 'text-blue-600',   bg: 'bg-blue-50' },
  { id: 'servicios',   label: 'Servicios públicos', icon: <Wifi size={14}/>,       color: 'text-amber-600',  bg: 'bg-amber-50' },
  { id: 'marketing',   label: 'Marketing / Ads',    icon: <Zap size={14}/>,        color: 'text-pink-600',   bg: 'bg-pink-50' },
  { id: 'logistica',   label: 'Logística / Envíos', icon: <Truck size={14}/>,      color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'tecnologia',  label: 'Tecnología',         icon: <Wrench size={14}/>,     color: 'text-cyan-600',   bg: 'bg-cyan-50' },
  { id: 'inventario',  label: 'Inventario / Compras',icon:<Package size={14}/>,    color: 'text-emerald-600',bg: 'bg-emerald-50' },
  { id: 'impuestos',   label: 'Impuestos / IVA',    icon: <ShieldCheck size={14}/>,color: 'text-red-600',    bg: 'bg-red-50' },
  { id: 'bancario',    label: 'Comisiones banco',   icon: <CreditCard size={14}/>, color: 'text-gray-600',   bg: 'bg-gray-100' },
  { id: 'caja_menor',  label: 'Caja menor',         icon: <Coffee size={14}/>,     color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'otro',        label: 'Otro',               icon: <Receipt size={14}/>,    color: 'text-gray-500',   bg: 'bg-gray-100' },
];

const STATUS_MAP: Record<ExpenseStatus, { label: string; class: string }> = {
  pagado:   { label: 'Pagado',   class: 'bg-emerald-50 text-emerald-600' },
  pendiente:{ label: 'Pendiente',class: 'bg-amber-50 text-amber-600' },
  vencido:  { label: 'Vencido',  class: 'bg-rose-50 text-rose-600' },
};

const PAYMENT_METHODS = ['Transferencia', 'Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'PSE', 'Nequi / Daviplata', 'Cheque'];


// ── MINI TOOLTIP ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-2xl p-3 text-xs min-w-[150px]">
      <p className="font-semibold text-gray-400 mb-2 text-[10px]">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div style={{ background: p.color }} className="h-1.5 w-1.5 rounded-full"/>
          <span className="text-gray-400 text-[10px]">{p.name}:</span>
          <span className="font-bold text-gray-800 text-[10px]">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI CARD ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, trend, trendUp, accent = '#004d4d' }: any) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-5 hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="h-9 w-9 rounded-2xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4"
          style={{ background: `${accent}15`, color: accent }}>{icon}</div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            {trendUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}{trend}
          </span>
        )}
      </div>
      <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-1">{label}</p>
      <h3 className="text-xl font-black tracking-tight text-gray-900 leading-none">{value}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-1 leading-tight">{sub}</p>}
      <div className="mt-3 h-[3px] w-full rounded-full bg-gray-100">
        <div className="h-full w-3/5 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}99, transparent)` }}/>
      </div>
    </div>
  );
}

// ── MODAL REGISTRO ─────────────────────────────────────────────────────────
function ExpenseModal({ expense, onSave, onClose }: { expense?: Expense | null; onSave: (e: Expense) => void; onClose: () => void }) {
  const blank: Omit<Expense, 'id' | 'created_at'> = {
    description: '', category: 'otro', type: 'variable', amount: 0,
    due_date: today(), status: 'pendiente', payment_method: 'Transferencia',
    notes: '', recurring: false, recurring_period: 'mensual'
  };
  const [form, setForm] = useState<Omit<Expense, 'id' | 'created_at'>>(expense ? {
    description: expense.description, category: expense.category, type: expense.type,
    amount: expense.amount, due_date: expense.due_date, status: expense.status,
    payment_method: expense.payment_method, notes: expense.notes || '',
    recurring: expense.recurring, recurring_period: expense.recurring_period
  } : blank);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.description || !form.amount) return;
    onSave({ ...form, id: expense?.id || nowId(), created_at: expense?.created_at || today() } as Expense);
    onClose();
  };

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={onClose}/>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
          className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900">{expense ? 'Editar gasto' : 'Registrar gasto'}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Mantén tu control financiero actualizado</p>
            </div>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400"/></button>
          </div>

          <div className="px-7 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Descripción */}
            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Descripción *</label>
              <input value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Ej: Nómina junio, Pauta Instagram..."
                className="w-full h-10 px-4 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/50"/>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Categoría *</label>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => set('category', c.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[10px] font-semibold transition-all ${form.category === c.id ? 'border-[#004d4d] bg-[#004d4d]/5 text-[#004d4d]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                    <span className={`shrink-0 ${c.color}`}>{c.icon}</span>
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Tipo */}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Tipo</label>
                <div className="flex rounded-2xl border border-gray-200 overflow-hidden">
                  {(['fijo', 'variable'] as ExpenseType[]).map(t => (
                    <button key={t} onClick={() => set('type', t)}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${form.type === t ? 'bg-[#004d4d] text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monto */}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Monto (COP) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">$</span>
                  <input type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))}
                    placeholder="0"
                    className="w-full h-10 pl-7 pr-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/50"/>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Fecha vencimiento */}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Fecha vence</label>
                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                  className="w-full h-10 px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#004d4d]/50"/>
              </div>

              {/* Estado */}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Estado</label>
                <select value={form.status} onChange={e => set('status', e.target.value as ExpenseStatus)}
                  className="w-full h-10 px-4 rounded-2xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#004d4d]/50 bg-white appearance-none">
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
            </div>

            {/* Método de pago */}
            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Método de pago</label>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} onClick={() => set('payment_method', m)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${form.payment_method === m ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurrente */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-[11px] font-bold text-gray-700">Gasto recurrente</p>
                <p className="text-[10px] text-gray-400">Se repetirá automáticamente</p>
              </div>
              <div className="flex items-center gap-2">
                {form.recurring && (
                  <select value={form.recurring_period} onChange={e => set('recurring_period', e.target.value)}
                    className="h-7 px-2 rounded-xl border border-gray-200 text-[10px] text-gray-600 bg-white focus:outline-none">
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                )}
                <button onClick={() => set('recurring', !form.recurring)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${form.recurring ? 'bg-[#004d4d]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.recurring ? 'left-5' : 'left-0.5'}`}/>
                </button>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5 block">Notas (opcional)</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Detalles adicionales..."
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/50 resize-none"/>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-7 py-5 border-t border-gray-100">
            <button onClick={onClose} className="flex-1 h-10 rounded-2xl border border-gray-200 text-[11px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="flex-1 h-10 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[11px] font-bold uppercase tracking-widest transition-colors">
              {expense ? 'Guardar cambios' : 'Registrar gasto'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function GastosPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const dark = theme === 'dark';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'gastos' | 'ingresos' | 'rentabilidad'>('resumen');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<ExpenseCategory | 'todas'>('todas');
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'todas'>('todas');
  const [periodMonth, setPeriodMonth] = useState(CURRENT_MONTH);
  const [periodYear, setPeriodYear] = useState(CURRENT_YEAR);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Cargar gastos desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bayup_gastos');
      if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setExpenses(parsed); }
    } catch {}
  }, []);

  // Persistir gastos en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem('bayup_gastos', JSON.stringify(expenses));
  }, [expenses]);

  // Cargar órdenes reales
  useEffect(() => {
    if (!token) return;
    apiRequest<any[]>('/orders', { token })
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoadingOrders(false); })
      .catch(() => setLoadingOrders(false));
  }, [token]);

  // ── Ingresos desde órdenes ──
  const salesRevenue = useMemo(() => {
    return orders
      .filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === periodMonth && d.getFullYear() === periodYear;
      })
      .reduce((a, o) => a + (o.total_price || 0), 0);
  }, [orders, periodMonth, periodYear]);

  const totalOrders = useMemo(() =>
    orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === periodMonth && d.getFullYear() === periodYear;
    }).length
  , [orders, periodMonth, periodYear]);

  // ── Filtros de gastos ──
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.due_date);
      const inPeriod = d.getMonth() === periodMonth && d.getFullYear() === periodYear;
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'todas' || e.category === filterCat;
      const matchStatus = filterStatus === 'todas' || e.status === filterStatus;
      return inPeriod && matchSearch && matchCat && matchStatus;
    });
  }, [expenses, periodMonth, periodYear, search, filterCat, filterStatus]);

  const totalExpenses = useMemo(() => filteredExpenses.reduce((a, e) => a + e.amount, 0), [filteredExpenses]);
  const paidExpenses = useMemo(() => filteredExpenses.filter(e => e.status === 'pagado').reduce((a, e) => a + e.amount, 0), [filteredExpenses]);
  const pendingExpenses = useMemo(() => filteredExpenses.filter(e => e.status !== 'pagado').reduce((a, e) => a + e.amount, 0), [filteredExpenses]);
  const overdueExpenses = useMemo(() => filteredExpenses.filter(e => e.status === 'vencido').reduce((a, e) => a + e.amount, 0), [filteredExpenses]);
  const netProfit = salesRevenue - totalExpenses;
  const profitMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;

  // ── Por categoría ──
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map)
      .map(([cat, total]) => ({ cat: cat as ExpenseCategory, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  // ── Evolución últimos 6 meses ──
  const evolutionData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = (periodMonth - 5 + i + 12) % 12;
      const y = periodYear - (periodMonth - 5 + i < 0 ? 1 : 0);
      const gastos = expenses
        .filter(e => { const d = new Date(e.due_date); return d.getMonth() === m && d.getFullYear() === y; })
        .reduce((a, e) => a + e.amount, 0);
      const ingresos = orders
        .filter(o => { const d = new Date(o.created_at); return d.getMonth() === m && d.getFullYear() === y; })
        .reduce((a, o) => a + (o.total_price || 0), 0);
      return { mes: MONTHS[m], gastos, ingresos, utilidad: ingresos - gastos };
    });
  }, [expenses, orders, periodMonth, periodYear]);

  // ── Donut categorías ──
  const PIE_COLORS = ['#004d4d','#00b2bd','#10b981','#6366f1','#f59e0b','#ec4899','#ef4444','#8b5cf6','#64748b','#14b8a6','#f97316'];

  // ── CRUD ──
  const handleSave = (exp: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === exp.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = exp; return next; }
      return [exp, ...prev];
    });
    showToast(editingExpense ? 'Gasto actualizado' : 'Gasto registrado correctamente', 'success');
    setEditingExpense(null);
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Gasto eliminado', 'success');
  };

  const openEdit = (exp: Expense) => { setEditingExpense(exp); setIsModalOpen(true); };

  const handleExportCSV = () => {
    const monthName = MONTHS[periodMonth];
    const headers = ['Fecha venc.','Descripción','Categoría','Tipo','Monto (COP)','Estado','Método pago','Recurrente','Notas'];
    const summaryRows = [
      [`CONTROL DE GASTOS — ${monthName} ${periodYear}`],
      [`Exportado el ${new Date().toLocaleDateString('es-CO')}`],
      [],
      [`RESUMEN`],
      [`Total gastos`, totalExpenses],
      [`Gastos pagados`, paidExpenses],
      [`Por pagar`, pendingExpenses],
      [`Ingresos del mes`, salesRevenue],
      [`Utilidad neta`, netProfit],
      [`Margen`, `${profitMargin.toFixed(1)}%`],
      [],
      [`DETALLE DE GASTOS`],
      headers,
      ...filteredExpenses.map(e => [
        e.due_date,
        e.description,
        getCat(e.category).label,
        e.type === 'fijo' ? 'Fijo' : 'Variable',
        e.amount,
        e.status,
        e.payment_method,
        e.recurring ? 'Sí' : 'No',
        e.notes || '',
      ]),
    ];
    const csv = summaryRows.map(r => (Array.isArray(r) ? r : [r]).map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gastos_${monthName.toLowerCase()}_${periodYear}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showToast('CSV descargado ✓', 'success');
  };

  const handleExportExcel = async () => {
    const monthName = new Date(periodYear, periodMonth).toLocaleString('es-CO', { month: 'long' });
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Bayup';
    wb.created = new Date();

    // ── Hoja 1: Resumen ──
    const ws1 = wb.addWorksheet('Resumen');
    ws1.columns = [
      { key: 'label', width: 35 },
      { key: 'value', width: 25 },
    ];
    const titleRow = ws1.addRow([`CONTROL DE GASTOS — ${monthName.toUpperCase()} ${periodYear}`]);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFF' }, name: 'Arial' };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
    titleRow.height = 40;
    ws1.mergeCells('A1:B1');
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

    ws1.addRow([]);
    const summaryData = [
      ['Total gastos del período', filteredExpenses.reduce((a, e) => a + e.amount, 0)],
      ['Gastos pagados', filteredExpenses.filter(e => e.status === 'pagado').reduce((a, e) => a + e.amount, 0)],
      ['Gastos pendientes', filteredExpenses.filter(e => e.status === 'pendiente').reduce((a, e) => a + e.amount, 0)],
      ['Ingresos (pedidos del período)', salesRevenue],
      ['Ganancia neta estimada', salesRevenue - filteredExpenses.reduce((a, e) => a + e.amount, 0)],
      ['Total pedidos', totalOrders],
    ];
    summaryData.forEach(([label, value]) => {
      const row = ws1.addRow([label, value]);
      row.height = 28;
      row.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      row.getCell(2).numFmt = '"$"#,##0';
      row.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: '004D4D' } };
      row.getCell(2).alignment = { horizontal: 'right' };
    });

    // ── Hoja 2: Detalle de gastos ──
    const ws2 = wb.addWorksheet('Detalle de Gastos');
    ws2.columns = [
      { header: 'FECHA', key: 'fecha', width: 14 },
      { header: 'DESCRIPCIÓN', key: 'desc', width: 35 },
      { header: 'CATEGORÍA', key: 'cat', width: 20 },
      { header: 'TIPO', key: 'tipo', width: 12 },
      { header: 'MONTO', key: 'monto', width: 18 },
      { header: 'ESTADO', key: 'estado', width: 14 },
      { header: 'MÉTODO PAGO', key: 'metodo', width: 18 },
      { header: 'RECURRENTE', key: 'rec', width: 14 },
      { header: 'NOTAS', key: 'notas', width: 30 },
    ];
    const hdr2 = ws2.getRow(1);
    hdr2.height = 38;
    hdr2.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10, name: 'Arial' };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thick', color: { argb: '00F2FF' } } };
    });
    filteredExpenses.forEach((e, i) => {
      const row = ws2.addRow({
        fecha: e.due_date,
        desc: e.description,
        cat: getCat(e.category).label,
        tipo: e.type === 'fijo' ? 'Fijo' : 'Variable',
        monto: e.amount,
        estado: e.status === 'pagado' ? 'Pagado' : e.status === 'pendiente' ? 'Pendiente' : 'Vencido',
        metodo: e.payment_method || '—',
        rec: e.recurring ? 'Sí' : 'No',
        notas: e.notes || '',
      });
      row.height = 26;
      row.getCell(5).numFmt = '"$"#,##0';
      row.getCell(5).font = { bold: true, color: { argb: '004D4D' }, name: 'Arial', size: 10 };
      if (i % 2 === 0) {
        row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFA' } }; });
      }
      const estadoCell = row.getCell(6);
      if (e.status === 'pagado') estadoCell.font = { color: { argb: '166534' }, bold: true, name: 'Arial', size: 10 };
      else if (e.status === 'vencido') estadoCell.font = { color: { argb: 'B91C1C' }, bold: true, name: 'Arial', size: 10 };
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `gastos_${monthName.toLowerCase()}_${periodYear}.xlsx`);
    setShowExportMenu(false);
    showToast('Excel descargado ✓', 'success');
  };

  const handleExportPDF = () => {
    const monthName = new Date(periodYear, periodMonth).toLocaleString('es-CO', { month: 'long' });
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const Cdark:   [number,number,number] = [10,26,26];
    const Cteal:   [number,number,number] = [0,77,77];
    const CtealM:  [number,number,number] = [0,178,189];
    const CtealL:  [number,number,number] = [232,250,249];
    const Cwhite:  [number,number,number] = [255,255,255];
    const Cgray:   [number,number,number] = [248,250,250];
    const Cgray2:  [number,number,number] = [220,228,228];
    const Cgreen:  [number,number,number] = [22,163,74];
    const Cred:    [number,number,number] = [220,38,38];
    const Camber:  [number,number,number] = [146,64,14];
    const Cpurple: [number,number,number] = [109,40,217];
    const now = new Date();

    // ── Helpers ──────────────────────────────────────────────────────────
    const pageHeader = (pg: number, title: string, sub: string, accent: [number,number,number] = CtealM) => {
      doc.setFillColor(...Cdark);      doc.rect(0, 0, W, 50, 'F');
      doc.setFillColor(...accent);     doc.rect(0, 0, 4, 50, 'F');
      doc.setFillColor(...accent);     doc.rect(0, 48, W, 2, 'F');
      doc.setFillColor(...accent);     doc.roundedRect(W-28, 8, 20, 9, 2, 2, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...Cwhite);
      doc.text(`PÁG ${pg}`, W-18, 13.5, { align:'center' });
      doc.setFontSize(20); doc.setTextColor(...Cwhite);
      doc.text(title, 12, 21);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...accent);
      doc.text(sub, 12, 29);
      doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(170,205,205);
      doc.text(`${monthName.toUpperCase()} ${periodYear}  ·  BAYUP.CO`, 12, 38);
    };

    const secLabel = (label: string, yy: number) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...Cteal);
      doc.text(label, 14, yy);
      doc.setFillColor(...CtealM); doc.rect(14, yy+1.5, Math.min(label.length*1.65, W-28), 0.6, 'F');
    };

    const kpiBox = (x: number, yy: number, bw: number, bh: number, label: string, val: string, sub: string, hl: boolean) => {
      if (hl) { doc.setFillColor(...CtealL); doc.setDrawColor(...CtealM); doc.setLineWidth(0.5); }
      else     { doc.setFillColor(...Cgray);  doc.setDrawColor(...Cgray2); doc.setLineWidth(0.3); }
      doc.roundedRect(x, yy, bw, bh, 2.5, 2.5, 'FD');
      if (hl) { doc.setFillColor(...CtealM); doc.rect(x, yy, 3, bh, 'F'); }
      const tx = x + (hl ? 6 : 4);
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,135,135);
      doc.text(label.toUpperCase(), tx, yy+6);
      doc.setFont('helvetica','bold'); doc.setFontSize(10);
      if (hl) { doc.setTextColor(...Cteal); } else { doc.setTextColor(...Cdark); }
      doc.text(val, tx, yy+13);
      if (sub) { doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(150,160,160); doc.text(sub, tx, yy+18.5); }
    };

    const pageFooter = () => {
      doc.setFillColor(...Cdark); doc.rect(0, H-11, W, 11, 'F');
      doc.setFillColor(...CtealM); doc.rect(0, H-11, 3, 11, 'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(140,170,170);
      doc.text(`Generado por BayUP · bayup.com.co · ${now.toLocaleDateString('es-CO')}`, 8, H-4.5);
    };

    const fmtK = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : fmt(n);

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 1 — RESUMEN EJECUTIVO
    // ════════════════════════════════════════════════════════════════════════
    pageHeader(1, 'REPORTE FINANCIERO', `Resumen ejecutivo · ${now.toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'})}`);
    let y = 60;

    // KPIs — 6 cajas 2 filas x 3 cols
    secLabel('INDICADORES CLAVE DEL PERÍODO', y);
    y += 7;
    const kData = [
      { l:'Ingresos del mes',   v:fmt(salesRevenue),   s:`${totalOrders} ventas`,                      hl:true  },
      { l:'Gastos totales',     v:fmt(totalExpenses),  s:`${filteredExpenses.length} registros`,        hl:false },
      { l:'Utilidad neta',      v:fmt(netProfit),      s:`Margen: ${profitMargin.toFixed(1)}%`,         hl:netProfit>=0 },
      { l:'Gastos pagados',     v:fmt(paidExpenses),   s:`${filteredExpenses.filter(e=>e.status==='pagado').length} pagados`, hl:false },
      { l:'Por pagar',          v:fmt(pendingExpenses),s:'Pendientes + vencidos',                       hl:false },
      { l:'Vencidos',           v:fmt(overdueExpenses),s:'Requieren atención',                          hl:false },
    ];
    const kW = (W-28-4)/3; const kH = 23;
    kData.forEach((k,i) => {
      kpiBox(14 + (i%3)*(kW+2), y + Math.floor(i/3)*(kH+3), kW, kH, k.l, k.v, k.s, k.hl);
    });
    y += 2*(kH+3)+10;

    // Barras de estado
    secLabel('ESTADO DE GASTOS', y); y += 7;
    const estRows = [
      { l:'Pagado',    v:paidExpenses,                       cnt:filteredExpenses.filter(e=>e.status==='pagado').length,    col:[22,163,74]   as [number,number,number] },
      { l:'Pendiente', v:pendingExpenses - overdueExpenses,  cnt:filteredExpenses.filter(e=>e.status==='pendiente').length, col:[245,158,11]  as [number,number,number] },
      { l:'Vencido',   v:overdueExpenses,                    cnt:filteredExpenses.filter(e=>e.status==='vencido').length,   col:[220,38,38]   as [number,number,number] },
    ];
    const maxEst = Math.max(...estRows.map(r=>r.v), 1);
    const barZone = W-28-38-30;
    estRows.forEach((r,i) => {
      doc.setFillColor(...Cgray); doc.setDrawColor(...Cgray2); doc.setLineWidth(0.2);
      doc.roundedRect(14, y+i*12, W-28, 10, 1.5, 1.5, 'FD');
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...Cdark);
      doc.text(r.l, 18, y+i*12+6.5);
      const bx = 14+36; const bMaxW = barZone;
      doc.setFillColor(228,235,235); doc.roundedRect(bx, y+i*12+2.5, bMaxW, 5, 1,1,'F');
      if (r.v > 0) { doc.setFillColor(...r.col); doc.roundedRect(bx, y+i*12+2.5, Math.max((r.v/maxEst)*bMaxW, 2), 5, 1,1,'F'); }
      doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...Cteal);
      doc.text(fmt(r.v), W-14, y+i*12+6.5, { align:'right' });
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(160,170,170);
      doc.text(`${r.cnt} reg.`, bx+bMaxW+2, y+i*12+6.5);
    });
    y += estRows.length*12+10;

    // Top categorías
    secLabel('TOP CATEGORÍAS DE GASTO', y); y += 7;
    const topCats = byCategory.slice(0,6);
    if (topCats.length === 0) {
      doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(180,180,180);
      doc.text('Sin categorías en este período.', 14, y+5); y+=12;
    } else {
      const maxCat = topCats[0].total;
      topCats.forEach((b,i) => {
        const lbl = CATEGORIES.find(c=>c.id===b.cat)?.label || b.cat;
        const pct = totalExpenses>0 ? (b.total/totalExpenses)*100 : 0;
        const bx = 14+42; const bMaxW = W-28-42-30;
        if (i===0) { doc.setFillColor(...CtealL); } else { doc.setFillColor(...Cgray); }
        doc.setDrawColor(...Cgray2); doc.setLineWidth(0.2);
        doc.roundedRect(14, y+i*10, W-28, 9, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', i===0?'bold':'normal'); doc.setFontSize(7.5); doc.setTextColor(...Cdark);
        doc.text(lbl.length>20?lbl.slice(0,20)+'…':lbl, 18, y+i*10+5.8);
        doc.setFillColor(228,235,235); doc.roundedRect(bx, y+i*10+2, bMaxW, 5, 1,1,'F');
        const fill = Math.max((b.total/maxCat)*bMaxW, 2);
        if (i===0) { doc.setFillColor(...Cteal); } else { doc.setFillColor(...CtealM); }
        doc.roundedRect(bx, y+i*10+2, fill, 5, 1,1,'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...Cteal);
        doc.text(fmt(b.total), W-14, y+i*10+5.8, { align:'right' });
        doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(160,170,170);
        doc.text(`${pct.toFixed(1)}%`, bx+bMaxW+2, y+i*10+5.8);
      });
      y += topCats.length*10+8;
    }

    // Pill resultado
    const pillOk = netProfit >= 0;
    doc.setFillColor(pillOk?240:254, pillOk?253:242, pillOk?244:242);
    if (pillOk) { doc.setDrawColor(...Cgreen); } else { doc.setDrawColor(...Cred); }
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, W-28, 14, 3, 3, 'FD');
    if (pillOk) { doc.setFillColor(...Cgreen); } else { doc.setFillColor(...Cred); }
    doc.rect(14, y, 3, 14, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8);
    if (pillOk) { doc.setTextColor(...Cgreen); } else { doc.setTextColor(...Cred); }
    doc.text(pillOk?'✓  MES RENTABLE':'⚠  MES CON DÉFICIT', 21, y+5.5);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(80,100,100);
    doc.text(`Utilidad: ${fmt(netProfit)}  ·  Margen: ${profitMargin.toFixed(1)}%  ·  ${totalOrders} ventas`, 21, y+11);
    pageFooter();

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 2 — DETALLE DE GASTOS
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(2, 'DETALLE DE GASTOS', 'Registro completo · Ordenado por fecha', [245,158,11]);
    y = 60;

    // Mini stats
    const mW2 = (W-28-6)/4;
    const miniStats = [
      { l:'Total registros', v:String(filteredExpenses.length) },
      { l:'Suma total',      v:fmt(totalExpenses) },
      { l:'Gastos fijos',   v:String(filteredExpenses.filter(e=>e.type==='fijo').length) },
      { l:'Variables',       v:String(filteredExpenses.filter(e=>e.type==='variable').length) },
    ];
    miniStats.forEach((m,i) => {
      doc.setFillColor(...CtealL); doc.setDrawColor(...Cgray2); doc.setLineWidth(0.2);
      doc.roundedRect(14+i*(mW2+2), y, mW2, 15, 2, 2, 'FD');
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,135,135);
      doc.text(m.l.toUpperCase(), 17+i*(mW2+2), y+6);
      doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(...Cteal);
      doc.text(m.v, 17+i*(mW2+2), y+12.5);
    });
    y += 20;

    if (filteredExpenses.length === 0) {
      doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(180,180,180);
      doc.text('Sin gastos registrados en este período.', 14, y+8);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['FECHA','DESCRIPCIÓN','CATEGORÍA','TIPO','MÉTODO PAGO','MONTO (COP)','ESTADO']],
        body: [...filteredExpenses]
          .sort((a,b) => new Date(b.due_date).getTime()-new Date(a.due_date).getTime())
          .map(e => {
            const cat = CATEGORIES.find(c=>c.id===e.category)?.label || e.category;
            return [
              new Date(e.due_date).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'2-digit'}),
              e.description.length>28 ? e.description.slice(0,28)+'…' : e.description,
              cat,
              e.type==='fijo'?'Fijo':'Variable',
              e.payment_method||'—',
              fmt(e.amount),
              STATUS_MAP[e.status]?.label||e.status,
            ];
          }),
        styles: { fontSize:7.5, cellPadding:2.8 },
        headStyles: { fillColor:Cdark, textColor:Cwhite, fontStyle:'bold', fontSize:7, halign:'center' },
        alternateRowStyles: { fillColor:Cgray },
        columnStyles: {
          0: { cellWidth:22, halign:'center' },
          1: { cellWidth:46 },
          2: { cellWidth:28 },
          3: { cellWidth:15, halign:'center' },
          4: { cellWidth:22, halign:'center' },
          5: { cellWidth:28, halign:'right', fontStyle:'bold', textColor:Cteal },
          6: { cellWidth:18, halign:'center' },
        },
        didParseCell: (data) => {
          if (data.section==='body' && data.column.index===6) {
            const v = String(data.cell.raw);
            if (v==='Pagado')    { data.cell.styles.textColor=Cgreen; data.cell.styles.fontStyle='bold'; }
            else if (v==='Vencido') { data.cell.styles.textColor=Cred;   data.cell.styles.fontStyle='bold'; }
            else                 { data.cell.styles.textColor=Camber; }
          }
        },
        margin: { left:14, right:14 },
        tableLineColor: Cgray2, tableLineWidth:0.1,
      });

      const fy2 = (doc as any).lastAutoTable.finalY + 6;
      const fijos2 = filteredExpenses.filter(e=>e.type==='fijo').reduce((a,e)=>a+e.amount,0);
      const vars2  = filteredExpenses.filter(e=>e.type==='variable').reduce((a,e)=>a+e.amount,0);
      doc.setFillColor(...Cdark); doc.roundedRect(14, fy2, W-28, 12, 2, 2, 'F');
      doc.setFillColor(...CtealM); doc.rect(14, fy2, 3, 12, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...Cwhite);
      doc.text('TOTAL DEL PERÍODO', 21, fy2+7.5);
      doc.setTextColor(...CtealM);
      doc.text(fmt(totalExpenses), W-16, fy2+7.5, { align:'right' });
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(160,200,200);
      doc.text(`Fijos: ${fmt(fijos2)}   Variables: ${fmt(vars2)}`, W/2, fy2+7.5, { align:'center' });
    }
    pageFooter();

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 3 — INGRESOS
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(3, 'ANÁLISIS DE INGRESOS', 'Ingresos del período · Conectado con pedidos', Cgreen);
    y = 60;

    // KPIs ingresos
    const avgTkt = totalOrders>0 ? salesRevenue/totalOrders : 0;
    const ingKpis = [
      { l:'Ingresos totales',v:fmt(salesRevenue),         s:'Del período actual',      hl:true },
      { l:'Total pedidos',   v:String(totalOrders),       s:'Ventas registradas',      hl:false },
      { l:'Ticket promedio', v:fmt(avgTkt),               s:'Por pedido',              hl:false },
      { l:'Utilidad neta',   v:fmt(netProfit),            s:`Margen ${profitMargin.toFixed(1)}%`, hl:netProfit>=0 },
    ];
    const ikW = (W-28-6)/4;
    ingKpis.forEach((k,i) => { kpiBox(14+i*(ikW+2), y, ikW, 24, k.l, k.v, k.s, k.hl); });
    y += 30;

    // Gráfica barras Ingresos vs Gastos 6 meses
    secLabel('EVOLUCIÓN 6 MESES — INGRESOS VS GASTOS', y); y += 7;
    const evoH = 55;
    doc.setFillColor(...Cgray); doc.setDrawColor(...Cgray2); doc.setLineWidth(0.2);
    doc.roundedRect(14, y, W-28, evoH, 3, 3, 'FD');
    const cX=22; const cW=W-44; const cY=y+6; const cH=evoH-16;
    const maxEvo = Math.max(...evolutionData.map(d=>Math.max(d.ingresos,d.gastos)),1);
    const bGrpW = cW/evolutionData.length;
    evolutionData.forEach((d,i) => {
      const bx = cX+i*bGrpW+bGrpW*0.08; const bw = bGrpW*0.36;
      const ingH = (d.ingresos/maxEvo)*cH; const gasH = (d.gastos/maxEvo)*cH;
      doc.setFillColor(...CtealM); doc.roundedRect(bx, cY+cH-ingH, bw, Math.max(ingH,0.5), 0.5,0.5,'F');
      doc.setFillColor(239,100,100); doc.roundedRect(bx+bw+1, cY+cH-gasH, bw, Math.max(gasH,0.5), 0.5,0.5,'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,130,130);
      doc.text(d.mes, cX+i*bGrpW+bGrpW/2, cY+cH+6, { align:'center' });
    });
    doc.setDrawColor(...Cgray2); doc.setLineWidth(0.2); doc.line(cX,cY+cH,cX+cW,cY+cH);
    doc.setFillColor(...CtealM); doc.rect(W-60, y+evoH-9, 5, 3,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(100,110,110);
    doc.text('Ingresos', W-53, y+evoH-6.5);
    doc.setFillColor(239,100,100); doc.rect(W-36, y+evoH-9, 5, 3,'F');
    doc.text('Gastos', W-29, y+evoH-6.5);
    y += evoH+8;

    // Tabla mensual
    secLabel('RESUMEN MENSUAL — ÚLTIMOS 6 MESES', y); y += 5;
    autoTable(doc, {
      startY: y,
      head: [['MES','INGRESOS','GASTOS','UTILIDAD','MARGEN']],
      body: evolutionData.map(d => {
        const util = d.ingresos-d.gastos;
        const mg = d.ingresos>0 ? ((util/d.ingresos)*100).toFixed(1) : '0.0';
        return [d.mes, fmt(d.ingresos), fmt(d.gastos), fmt(util), `${mg}%`];
      }),
      styles: { fontSize:8.5, cellPadding:3.5 },
      headStyles: { fillColor:Cdark, textColor:Cwhite, fontStyle:'bold', fontSize:8, halign:'center' },
      alternateRowStyles: { fillColor:Cgray },
      columnStyles: {
        0: { cellWidth:18, halign:'center', fontStyle:'bold' },
        1: { halign:'right', fontStyle:'bold', textColor:Cteal },
        2: { halign:'right' },
        3: { halign:'right', fontStyle:'bold' },
        4: { cellWidth:22, halign:'center' },
      },
      didParseCell: (data) => {
        if (data.section==='body') {
          if (data.column.index===3) {
            const raw = String(data.cell.raw||'');
            data.cell.styles.textColor = raw.startsWith('-')||raw.includes('−') ? Cred : Cgreen;
          }
          if (data.column.index===4) {
            const pct = parseFloat(String(data.cell.raw||'0'));
            data.cell.styles.textColor = pct >= 0 ? Cgreen : Cred;
          }
        }
      },
      margin: { left:14, right:14 },
    });
    pageFooter();

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 4 — RENTABILIDAD
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(4, 'RENTABILIDAD', 'Comparativo histórico · Análisis de márgenes', Cpurple);
    y = 60;

    const bestM  = evolutionData.reduce((b,d)=>d.utilidad>b.utilidad?d:b, evolutionData[0]||{mes:'—',utilidad:0,ingresos:0,gastos:0});
    const worstM = evolutionData.reduce((b,d)=>d.utilidad<b.utilidad?d:b, evolutionData[0]||{mes:'—',utilidad:0,ingresos:0,gastos:0});
    const avgMg  = evolutionData.length>0 ? evolutionData.reduce((a,d)=>a+(d.ingresos>0?(d.utilidad/d.ingresos)*100:0),0)/evolutionData.length : 0;
    const tot6m  = evolutionData.reduce((a,d)=>a+d.utilidad,0);

    // KPIs rentabilidad
    const rentK = [
      { l:'Mejor mes',        v:bestM.mes,              s:fmt(bestM.utilidad),          hl:false },
      { l:'Utilidad 6 meses', v:fmtK(tot6m),            s:'Acumulado histórico',         hl:tot6m>=0 },
      { l:'Margen promedio',  v:`${avgMg.toFixed(1)}%`, s:'Últimos 6 meses',             hl:false },
      { l:'Mes actual',       v:fmt(netProfit),         s:`Margen ${profitMargin.toFixed(1)}%`, hl:netProfit>=0 },
    ];
    rentK.forEach((k,i) => { kpiBox(14+i*(ikW+2), y, ikW, 24, k.l, k.v, k.s, k.hl); });
    y += 30;

    // Gráfica línea de utilidad
    secLabel('CURVA DE RENTABILIDAD — ÚLTIMOS 6 MESES', y); y += 7;
    const rH = 62;
    doc.setFillColor(...Cgray); doc.setDrawColor(...Cgray2); doc.setLineWidth(0.2);
    doc.roundedRect(14, y, W-28, rH, 3, 3, 'FD');
    const rcX=24; const rcW=W-48; const rcY=y+8; const rcH=rH-20;
    const maxU = Math.max(...evolutionData.map(d=>Math.abs(d.utilidad)),1);
    const z0 = rcY+rcH/2;
    doc.setDrawColor(200,210,210); doc.setLineWidth(0.3); doc.setLineDashPattern([2,1],0);
    doc.line(rcX, z0, rcX+rcW, z0);
    doc.setLineDashPattern([],0);
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(180,180,180);
    doc.text('$0', rcX-2, z0+1.5, { align:'right' });
    const pts = evolutionData.map((d,i) => ({
      px: rcX+(evolutionData.length>1 ? (i/(evolutionData.length-1)) : 0)*rcW,
      py: z0-(d.utilidad/maxU)*(rcH/2),
      d,
    }));
    for (let i=0; i<pts.length-1; i++) {
      const col: [number,number,number] = pts[i].d.utilidad>=0 ? CtealM : [239,100,100];
      doc.setDrawColor(...col); doc.setLineWidth(1.2);
      doc.line(pts[i].px, pts[i].py, pts[i+1].px, pts[i+1].py);
    }
    pts.forEach(({px,py,d}) => {
      const col: [number,number,number] = d.utilidad>=0 ? Cteal : Cred;
      doc.setFillColor(...col); doc.circle(px, py, 1.8, 'F');
      doc.setFillColor(...Cwhite); doc.circle(px, py, 0.8, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...col);
      doc.text(fmtK(d.utilidad), px, py-3.5, { align:'center' });
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,130,130);
      doc.text(d.mes, px, rcY+rcH+6, { align:'center' });
    });
    y += rH+8;

    // Tabla comparativa
    secLabel('COMPARATIVO DETALLADO MES A MES', y); y += 5;
    autoTable(doc, {
      startY: y,
      head: [['MES','INGRESOS','GASTOS','UTILIDAD','MARGEN','RESULTADO']],
      body: evolutionData.map(d => {
        const util = d.ingresos-d.gastos;
        const mg   = d.ingresos>0 ? ((util/d.ingresos)*100).toFixed(1) : '—';
        const res  = util>0 ? '✓ Rentable' : util<0 ? '✗ Déficit' : '— Neutro';
        return [d.mes, fmt(d.ingresos), fmt(d.gastos), fmt(util), mg!=='—'?`${mg}%`:'—', res];
      }),
      styles: { fontSize:8.5, cellPadding:3.5 },
      headStyles: { fillColor:Cdark, textColor:Cwhite, fontStyle:'bold', fontSize:8, halign:'center' },
      alternateRowStyles: { fillColor:Cgray },
      columnStyles: {
        0: { cellWidth:18, halign:'center', fontStyle:'bold' },
        1: { halign:'right', fontStyle:'bold', textColor:Cteal },
        2: { halign:'right' },
        3: { halign:'right', fontStyle:'bold' },
        4: { cellWidth:20, halign:'center' },
        5: { cellWidth:28, halign:'center', fontStyle:'bold' },
      },
      didParseCell: (data) => {
        if (data.section==='body') {
          if (data.column.index===3) {
            const raw = String(data.cell.raw||'');
            data.cell.styles.textColor = raw.startsWith('-')||raw.includes('−') ? Cred : Cgreen;
          }
          if (data.column.index===5) {
            const v = String(data.cell.raw||'');
            if (v.startsWith('✓'))      data.cell.styles.textColor = Cgreen;
            else if (v.startsWith('✗')) data.cell.styles.textColor = Cred;
            else                        data.cell.styles.textColor = [100,100,100];
          }
        }
      },
      margin: { left:14, right:14 },
    });

    // Insight ejecutivo final
    const fy4 = (doc as any).lastAutoTable.finalY + 8;
    if (fy4 < H-30) {
      doc.setFillColor(...Cdark); doc.roundedRect(14, fy4, W-28, 20, 3, 3, 'F');
      doc.setFillColor(...CtealM); doc.rect(14, fy4, 3, 20, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...CtealM);
      doc.text('INSIGHT EJECUTIVO', 21, fy4+7);
      const topCatLbl = byCategory[0] ? CATEGORIES.find(c=>c.id===byCategory[0].cat)?.label||byCategory[0].cat : '';
      const insightTxt = avgMg>=20
        ? `Negocio con márgenes saludables (${avgMg.toFixed(1)}% promedio). Mejor mes: ${bestM.mes} con ${fmt(bestM.utilidad)} de utilidad.${topCatLbl?' Optimizar '+topCatLbl+' puede mejorar aún más el margen.':''}`
        : avgMg>=0
        ? `Márgenes ajustados (${avgMg.toFixed(1)}% promedio). Meta: superar ${(avgMg+5).toFixed(0)}%.${topCatLbl?' La categoría de mayor impacto es '+topCatLbl+'.':''}`
        : `Período con déficit. Revisa los gastos fijos y busca aumentar el volumen de ventas para cubrir costos operativos.`;
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(190,215,215);
      const iLines = doc.splitTextToSize(insightTxt, W-48);
      doc.text(iLines, 21, fy4+13.5);
    }

    // ── Footer todas las páginas ──────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i=1; i<=pageCount; i++) { doc.setPage(i); pageFooter(); }

    doc.save(`bayup-finanzas-${monthName.toLowerCase()}-${periodYear}.pdf`);
    setShowExportMenu(false);
    showToast('PDF financiero generado ✓', 'success');
  };
  const tabs = [
    { id: 'resumen',       label: 'Resumen' },
    { id: 'gastos',        label: 'Gastos' },
    { id: 'ingresos',      label: 'Ingresos' },
    { id: 'rentabilidad',  label: 'Rentabilidad' },
  ] as const;

  // ── Helper cat ──
  const getCat = (id: ExpenseCategory) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

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
                <BarChart3 size={12} className="text-[#00f2ff]"/>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f2ff]/70">Control de Gastos</p>
            </div>
            {/* Selector de mes */}
            <div className="flex items-center gap-1 h-7 px-2 rounded-xl bg-white/10 border border-white/15">
              <button onClick={() => {
                if (periodMonth === 0) { setPeriodMonth(11); setPeriodYear(y => y - 1); }
                else setPeriodMonth(m => m - 1);
              }} className="h-5 w-5 flex items-center justify-center rounded-lg text-white/50 active:bg-white/10">
                <ChevronDown size={10} className="rotate-90"/>
              </button>
              <span className="text-[9px] font-bold text-white/70 min-w-[60px] text-center">{MONTHS[periodMonth]} {periodYear}</span>
              <button onClick={() => {
                if (periodMonth === 11) { setPeriodMonth(0); setPeriodYear(y => y + 1); }
                else setPeriodMonth(m => m + 1);
              }} className="h-5 w-5 flex items-center justify-center rounded-lg text-white/50 active:bg-white/10">
                <ChevronDown size={10} className="-rotate-90"/>
              </button>
            </div>
          </div>

          <div className="mb-1">
            <p className="text-[11px] font-bold text-white/30">Utilidad neta</p>
            <p className={`text-[38px] font-black leading-none tracking-tight -mt-0.5 ${netProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {fmt(netProfit)}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-pulse"/>
              <p className="text-[9px] text-white/40">{fmt(salesRevenue)} ingresos</p>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              {overdueExpenses > 0 && (
                <span className="text-[8px] font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full">¡{fmt(overdueExpenses)} vencidos!</span>
              )}
              <button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
                className="h-6 px-3 rounded-xl text-[8px] font-black uppercase tracking-wide text-[#004d4d] bg-white/90 active:bg-white/70 transition-colors">
                + Gasto
              </button>
            </div>
          </div>
        </div>

        {/* 4 mini stats */}
        <div className="grid grid-cols-2 gap-2 mx-3">
          {[
            { label: 'Ingresos',  value: fmt(salesRevenue),   icon: <TrendingUp size={13} className="text-emerald-500"/>,  bg: 'bg-emerald-50' },
            { label: 'Gastos',    value: fmt(totalExpenses),  icon: <TrendingDown size={13} className="text-rose-500"/>,    bg: 'bg-rose-50' },
            { label: 'Pagados',   value: fmt(paidExpenses),   icon: <CheckCircle2 size={13} className="text-blue-500"/>,    bg: 'bg-blue-50' },
            { label: 'Por pagar', value: fmt(pendingExpenses),icon: <Clock size={13} className={overdueExpenses > 0 ? 'text-rose-500' : 'text-amber-500'}/>, bg: overdueExpenses > 0 ? 'bg-rose-50' : 'bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100/80 flex flex-col gap-1.5">
              <div className={`h-7 w-7 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
              <p className="text-[15px] font-black text-gray-900 leading-none truncate">{s.value}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Alerta vencidos mobile */}
        {overdueExpenses > 0 && (
          <div className="mx-3 flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-100">
            <AlertCircle size={14} className="text-rose-500 shrink-0"/>
            <p className="text-[10px] text-rose-700 font-medium flex-1">Gastos vencidos por <span className="font-black">{fmt(overdueExpenses)}</span></p>
            <button onClick={() => setFilterStatus('vencido')} className="text-[9px] font-black text-rose-600 underline shrink-0">Ver</button>
          </div>
        )}

        {/* Tabs */}
        <div className="mx-3 grid grid-cols-2 gap-1.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all ${
                activeTab === t.id ? 'bg-[#004d4d] text-white' : 'bg-white border border-gray-100 text-gray-400 shadow-sm'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Lista de gastos — todas las tabs */}
        <div className="mx-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-50">
            <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-xl bg-gray-50 border border-gray-100">
              <Search size={12} className="text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar gasto..." className="flex-1 bg-transparent text-[11px] text-gray-700 placeholder-gray-400 outline-none"/>
            </div>
            <span className="text-[10px] font-black text-[#004d4d] bg-[#004d4d]/8 px-2.5 py-1 rounded-full">{filteredExpenses.length}</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Receipt size={20} className="text-gray-200"/>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Sin gastos</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
              {filteredExpenses.map(e => {
                const cat = CATEGORIES.find(c => c.id === e.category);
                const st = STATUS_MAP[e.status];
                return (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => { setEditingExpense(e); setIsModalOpen(true); }}>
                    <div className={`h-9 w-9 rounded-xl ${cat?.bg ?? 'bg-gray-100'} flex items-center justify-center shrink-0`}>
                      {cat?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-800 truncate">{e.description}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{cat?.label} · {e.due_date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-[13px] font-black text-gray-900">{fmt(e.amount)}</p>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${st.class}`}>{st.label}</span>
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
          <p className={`flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] uppercase mb-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>
            Finanzas operativas
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">
            CONTROL DE GASTOS
          </h1>
          <p className={`text-sm mt-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            Gestión de costos, ingresos y rentabilidad real del negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Selector mes */}
          <div className="flex items-center gap-1 h-10 px-3 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <button onClick={() => {
              if (periodMonth === 0) { setPeriodMonth(11); setPeriodYear(y => y - 1); }
              else setPeriodMonth(m => m - 1);
            }} className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronDown size={12} className="rotate-90 text-gray-400"/>
            </button>
            <span className="text-[11px] font-bold text-gray-700 min-w-[80px] text-center">
              {MONTHS[periodMonth]} {periodYear}
            </span>
            <button onClick={() => {
              if (periodMonth === 11) { setPeriodMonth(0); setPeriodYear(y => y + 1); }
              else setPeriodMonth(m => m + 1);
            }} className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronDown size={12} className="-rotate-90 text-gray-400"/>
            </button>
          </div>
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(v => !v)}
              className="h-10 flex items-center gap-2 px-4 rounded-2xl border border-gray-200 bg-white text-[10px] font-semibold text-gray-600 hover:border-[#004d4d]/30 transition-all shadow-sm">
              <Download size={13}/> Exportar <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
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
                  <div className="h-px bg-gray-100 mx-3"/>
                  <button onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    <FileText size={14} className="text-rose-500"/> PDF (.pdf)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
            className="h-10 flex items-center gap-2 px-5 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm">
            <Plus size={14}/> Registrar gasto
          </button>
        </div>
      </div>

      {/* ── KPIs (solo desktop) ── */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Ingresos del mes" value={fmt(salesRevenue)} sub={`${totalOrders} ventas registradas`} icon={<TrendingUp/>} trend="+12%" trendUp accent="#004d4d"/>
        <KpiCard label="Gastos totales" value={fmt(totalExpenses)} sub={`${filteredExpenses.length} gastos`} icon={<TrendingDown/>} accent="#ef4444"/>
        <KpiCard label="Utilidad neta" value={fmt(netProfit)} sub={`Margen: ${profitMargin.toFixed(1)}%`} icon={<DollarSign/>} trend={profitMargin > 0 ? `${profitMargin.toFixed(0)}%` : undefined} trendUp={profitMargin > 0} accent={netProfit >= 0 ? '#10b981' : '#ef4444'}/>
        <KpiCard label="Gastos pagados" value={fmt(paidExpenses)} sub="Comprometido y pagado" icon={<CheckCircle2/>} accent="#10b981"/>
        <KpiCard label="Por pagar" value={fmt(pendingExpenses)} sub={overdueExpenses > 0 ? `${fmt(overdueExpenses)} vencidos` : 'Sin vencidos'} icon={<Clock/>} accent={overdueExpenses > 0 ? '#ef4444' : '#f59e0b'}/>
      </div>

      {/* Alerta vencidos (solo desktop) */}
      {overdueExpenses > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="hidden sm:flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100">
          <AlertCircle size={16} className="text-rose-500 shrink-0"/>
          <p className="text-[11px] text-rose-700 font-medium">
            Tienes gastos vencidos por <span className="font-black">{fmt(overdueExpenses)}</span> — revísalos y márcalos como pagados para mantener tu contabilidad al día.
          </p>
          <button onClick={() => setFilterStatus('vencido')} className="ml-auto text-[10px] font-bold text-rose-600 underline shrink-0">Ver vencidos</button>
        </motion.div>
      )}

      {/* ── TABS (solo desktop) ── */}
      <div className={`hidden sm:flex p-1 rounded-2xl gap-1 w-fit ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all duration-150 ${
              activeTab === t.id ? 'bg-[#004d4d] text-white shadow-sm' : dark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'
            }`}>{t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: RESUMEN (solo desktop) ══════════════════════════════════════ */}
      {activeTab === 'resumen' && (
        <div className="hidden sm:block space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Gráfico evolución */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[8px] font-bold tracking-widest uppercase text-gray-400">Últimos 6 meses</p>
                  <h3 className="text-sm font-black text-gray-900">Ingresos vs Gastos</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#004d4d]"/><span className="text-[9px] text-gray-400">Ingresos</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-rose-400"/><span className="text-[9px] text-gray-400">Gastos</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-400"/><span className="text-[9px] text-gray-400">Utilidad</span></div>
                </div>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#004d4d" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#004d4d" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#004d4d" strokeWidth={2.5} fill="url(#gI)" dot={false} activeDot={{ r: 4, fill: '#004d4d', stroke: 'white', strokeWidth: 2 }}/>
                    <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2} fill="url(#gG)" dot={false} activeDot={{ r: 3 }}/>
                    <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#10b981" strokeWidth={2} fill="url(#gU)" dot={false} activeDot={{ r: 3 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gastos por categoría donut */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <p className="text-[8px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">Distribución</p>
              <h3 className="text-sm font-black text-gray-900 mb-4">Gastos por área</h3>
              {byCategory.length > 0 ? (
                <>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie data={byCategory} dataKey="total" cx="50%" cy="50%" innerRadius={45} outerRadius={70} stroke="none">
                          {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                        </Pie>
                        <Tooltip formatter={(v: any) => [fmt(v), '']}/>
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {byCategory.slice(0, 5).map((c, i) => {
                      const cat = getCat(c.cat);
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                            <span className="text-[10px] text-gray-600">{cat.label}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-800">{fmt(c.total)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-300 text-[11px]">Sin gastos en este período</div>
              )}
            </div>
          </div>

          {/* Panel financiero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Resumen P&L */}
            <div className="bg-[#001a1a] rounded-3xl p-6 text-white">
              <p className="text-[8px] font-bold tracking-widest text-[#00f2ff]/60 mb-1">ESTADO DE RESULTADOS</p>
              <h3 className="text-sm font-black text-white mb-5">{MONTHS[periodMonth]} {periodYear}</h3>
              <div className="space-y-3">
                {[
                  { label: 'Ingresos por ventas', value: salesRevenue, color: 'text-emerald-400', sign: '+' },
                  { label: 'Costos fijos', value: filteredExpenses.filter(e=>e.type==='fijo').reduce((a,e)=>a+e.amount,0), color: 'text-rose-400', sign: '-' },
                  { label: 'Costos variables', value: filteredExpenses.filter(e=>e.type==='variable').reduce((a,e)=>a+e.amount,0), color: 'text-amber-400', sign: '-' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-[10px] text-white/50">{r.label}</span>
                    <span className={`text-[11px] font-black ${r.color}`}>{r.sign} {fmt(r.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-white">UTILIDAD NETA</span>
                  <span className={`text-base font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(netProfit)}</span>
                </div>
                <div className="mt-3 p-3 rounded-2xl bg-white/5 text-center">
                  <p className="text-[9px] text-white/40">Margen de ganancia</p>
                  <p className={`text-2xl font-black mt-0.5 ${profitMargin > 20 ? 'text-emerald-400' : profitMargin > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Gastos fijos vs variables */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <p className="text-[8px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">Análisis</p>
              <h3 className="text-sm font-black text-gray-900 mb-4">Fijos vs Variables</h3>
              {['fijo','variable'].map((t, i) => {
                const total = filteredExpenses.filter(e => e.type === t).reduce((a, e) => a + e.amount, 0);
                const pctV = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                return (
                  <div key={t} className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[11px] font-bold capitalize text-gray-700">{t === 'fijo' ? 'Costos fijos' : 'Costos variables'}</span>
                      <span className="text-[10px] text-gray-500">{fmt(total)} · {pctV.toFixed(0)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pctV}%` }} transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="h-full rounded-full" style={{ background: i === 0 ? '#004d4d' : '#00b2bd' }}/>
                    </div>
                  </div>
                );
              })}
              <div className="mt-4 space-y-2">
                {[
                  { label: 'Pagados', count: filteredExpenses.filter(e=>e.status==='pagado').length, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Pendientes', count: filteredExpenses.filter(e=>e.status==='pendiente').length, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Vencidos', count: filteredExpenses.filter(e=>e.status==='vencido').length, color: 'text-rose-600 bg-rose-50' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">{s.label}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.color}`}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <p className="text-[8px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">IA Financiera</p>
              <h3 className="text-sm font-black text-gray-900 mb-4">Bayup Insights</h3>
              <div className="space-y-3">
                {[
                  {
                    icon: <Target size={12}/>,
                    title: profitMargin > 20 ? '¡Margen saludable!' : profitMargin > 0 ? 'Margen ajustado' : 'Margen negativo',
                    text: profitMargin > 20 ? `Tu margen es ${profitMargin.toFixed(0)}%, estás por encima del promedio del sector.`
                      : profitMargin > 0 ? `Margen de ${profitMargin.toFixed(0)}%. Revisa tus costos variables.`
                      : 'Tus gastos superan los ingresos. Reduce costos urgentemente.',
                    color: profitMargin > 20 ? 'bg-emerald-50 border-emerald-100' : profitMargin > 0 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100',
                    icolor: profitMargin > 20 ? 'text-emerald-600' : profitMargin > 0 ? 'text-amber-600' : 'text-rose-600',
                  },
                  {
                    icon: <Zap size={12}/>,
                    title: 'Mayor gasto',
                    text: byCategory[0] ? `${getCat(byCategory[0].cat).label} representa el ${((byCategory[0].total / totalExpenses)*100).toFixed(0)}% de tus gastos totales.` : 'Sin gastos registrados aún.',
                    color: 'bg-blue-50 border-blue-100',
                    icolor: 'text-blue-600',
                  },
                  {
                    icon: <Activity size={12}/>,
                    title: 'Gastos recurrentes',
                    text: `${filteredExpenses.filter(e=>e.recurring).length} gastos fijos programados este mes por ${fmt(filteredExpenses.filter(e=>e.recurring).reduce((a,e)=>a+e.amount,0))}.`,
                    color: 'bg-purple-50 border-purple-100',
                    icolor: 'text-purple-600',
                  },
                ].map((ins, i) => (
                  <div key={i} className={`p-3 rounded-2xl border ${ins.color}`}>
                    <div className={`flex items-center gap-1.5 font-bold text-[10px] mb-1 ${ins.icolor}`}>
                      {ins.icon} {ins.title}
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">{ins.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: GASTOS (solo desktop) ══════════════════════════════════════ */}
      {activeTab === 'gastos' && (
        <div className="hidden sm:block space-y-4">
          {/* Barra filtros */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 h-10 bg-white rounded-2xl border border-gray-200 shadow-sm px-3">
              <Search size={14} className="text-gray-300 shrink-0"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar gasto..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
              {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-300"/></button>}
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value as any)}
              className="h-10 px-3 rounded-2xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 focus:outline-none shadow-sm min-w-[140px]">
              <option value="todas">Todas las categorías</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
              className="h-10 px-3 rounded-2xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 focus:outline-none shadow-sm">
              <option value="todas">Todos los estados</option>
              <option value="pagado">Pagados</option>
              <option value="pendiente">Pendientes</option>
              <option value="vencido">Vencidos</option>
            </select>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            <AnimatePresence>
              {filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <Receipt size={36} className="mb-3"/>
                  <p className="text-sm font-semibold">Sin gastos en este período</p>
                  <p className="text-[11px] mt-1">Registra tu primer gasto para empezar</p>
                  <button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
                    className="mt-4 h-9 px-5 rounded-2xl bg-[#004d4d] text-white text-[10px] font-bold uppercase tracking-widest">
                    + Registrar gasto
                  </button>
                </div>
              ) : filteredExpenses.map((exp, i) => {
                const cat = getCat(exp.category);
                const st = STATUS_MAP[exp.status];
                return (
                  <motion.div key={exp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-all group">
                    {/* Icono */}
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4 ${cat.bg} ${cat.color}`}>
                      {cat.icon}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[12px] font-black text-gray-900 truncate">{exp.description}</p>
                        {exp.recurring && (
                          <span className="text-[8px] font-bold tracking-widest bg-[#004d4d]/10 text-[#004d4d] px-1.5 py-0.5 rounded-full shrink-0 uppercase">{exp.recurring_period}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400">{cat.label}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{exp.payment_method}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">Vence: {exp.due_date}</span>
                      </div>
                    </div>
                    {/* Tipo */}
                    <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full uppercase shrink-0 ${exp.type === 'fijo' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-500'}`}>
                      {exp.type}
                    </span>
                    {/* Estado */}
                    <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full uppercase shrink-0 ${st.class}`}>{st.label}</span>
                    {/* Monto */}
                    <span className="text-base font-black text-gray-900 shrink-0">{fmt(exp.amount)}</span>
                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(exp)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                        <Edit3 size={13} className="text-gray-400"/>
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-rose-50 transition-colors">
                        <Trash2 size={13} className="text-rose-400"/>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Totales footer */}
          {filteredExpenses.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] font-bold text-gray-500">{filteredExpenses.length} gastos en {MONTHS[periodMonth]}</span>
              <span className="text-base font-black text-gray-900">Total: {fmt(totalExpenses)}</span>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: INGRESOS (solo desktop) ══════════════════════════════════ */}
      {activeTab === 'ingresos' && (
        <div className="hidden sm:block space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Órdenes del mes */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <p className="text-[8px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">Conectado con pedidos</p>
              <h3 className="text-sm font-black text-gray-900 mb-4">Ventas en {MONTHS[periodMonth]}</h3>
              {loadingOrders ? (
                <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-gray-300"/></div>
              ) : orders.filter(o => {
                const d = new Date(o.created_at);
                return d.getMonth() === periodMonth && d.getFullYear() === periodYear;
              }).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <ShoppingCart size={32} className="mb-2"/>
                  <p className="text-[11px]">Sin ventas en este período</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {orders.filter(o => {
                    const d = new Date(o.created_at);
                    return d.getMonth() === periodMonth && d.getFullYear() === periodYear;
                  }).slice(0,20).map((o, i) => (
                    <div key={o.id || i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <div>
                        <p className="text-[11px] font-bold text-gray-800">#{o.order_number || o.id?.slice(0,8) || i+1}</p>
                        <p className="text-[10px] text-gray-400">{o.customer_name || 'Cliente'} · {new Date(o.created_at).toLocaleDateString('es-CO')}</p>
                      </div>
                      <span className="text-[12px] font-black text-emerald-600">{fmt(o.total_price || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{totalOrders} ventas</span>
                <span className="text-base font-black text-gray-900">{fmt(salesRevenue)}</span>
              </div>
            </div>

            {/* Ticket promedio + rentabilidad por venta */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
                <p className="text-[8px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">Métricas clave</p>
                <h3 className="text-sm font-black text-gray-900 mb-4">Análisis de ingresos</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Ticket promedio', value: fmt(totalOrders > 0 ? salesRevenue / totalOrders : 0), color: 'text-[#004d4d]' },
                    { label: 'Ingreso diario prom.', value: fmt(salesRevenue / 30), color: 'text-blue-600' },
                    { label: 'Costo por venta', value: fmt(totalOrders > 0 ? totalExpenses / Math.max(totalOrders, 1) : 0), color: 'text-rose-500' },
                    { label: 'Utilidad por venta', value: fmt(totalOrders > 0 ? netProfit / Math.max(totalOrders, 1) : 0), color: netProfit >= 0 ? 'text-emerald-600' : 'text-rose-500' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-[11px] text-gray-500">{m.label}</span>
                      <span className={`text-[13px] font-black ${m.color}`}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Break even */}
              <div className="bg-[#001a1a] rounded-3xl p-5 text-white">
                <p className="text-[8px] font-bold tracking-widest text-[#00f2ff]/60 mb-1">PUNTO DE EQUILIBRIO</p>
                <h3 className="text-sm font-black text-white mb-3">¿Cuándo cubres gastos?</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50">Necesitas vender</span>
                    <span className="text-[11px] font-black text-amber-400">{fmt(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50">Ya vendiste</span>
                    <span className="text-[11px] font-black text-emerald-400">{fmt(salesRevenue)}</span>
                  </div>
                  <div className="mt-2 h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((salesRevenue / Math.max(totalExpenses, 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#00f2ff]"/>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1 text-right">
                    {totalExpenses > 0 ? `${Math.min((salesRevenue / totalExpenses * 100), 100).toFixed(0)}% cubierto` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: RENTABILIDAD (solo desktop) ══════════════════════════════ */}
      {activeTab === 'rentabilidad' && (
        <div className="hidden sm:block space-y-6">
          {/* Barras comparativas mensual */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <p className="text-[8px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">Histórico</p>
            <h3 className="text-sm font-black text-gray-900 mb-4">Rentabilidad últimos 6 meses</h3>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolutionData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="ingresos" name="Ingresos" fill="#004d4d" radius={[4,4,0,0]} maxBarSize={30}/>
                  <Bar dataKey="gastos" name="Gastos" fill="#fca5a5" radius={[4,4,0,0]} maxBarSize={30}/>
                  <Bar dataKey="utilidad" name="Utilidad" fill="#34d399" radius={[4,4,0,0]} maxBarSize={30}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {evolutionData.map((m, i) => {
              const margin = m.ingresos > 0 ? ((m.ingresos - m.gastos) / m.ingresos * 100) : 0;
              return (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-gray-700">{m.mes}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${margin > 20 ? 'bg-emerald-50 text-emerald-600' : margin > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500'}`}>
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400">Ingresos</span><span className="font-semibold text-gray-700">{fmt(m.ingresos)}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400">Gastos</span><span className="font-semibold text-gray-700">{fmt(m.gastos)}</span></div>
                    <div className="flex justify-between text-[10px] pt-1 border-t border-gray-100"><span className="font-bold text-gray-600">Utilidad</span><span className={`font-black ${m.utilidad >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fmt(m.utilidad)}</span></div>
                  </div>
                  <div className="mt-2.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.max(0, Math.min(margin, 100))}%`,
                      background: margin > 20 ? '#34d399' : margin > 0 ? '#fbbf24' : '#f87171'
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <ExpenseModal
            expense={editingExpense}
            onSave={handleSave}
            onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
