"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Search, X, Eye, RefreshCw, Globe,
  DollarSign, Phone, Mail, MapPin, Store, Copy,
  Ban, Play, Calendar, TrendingUp, ChevronRight,
  Filter, Users, ShoppingCart, Trash2, AlertTriangle, Loader2
} from 'lucide-react';

const fmtCOP  = (n: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const PLAN_COLORS: Record<string, string> = {
  'Free': '#6b7280', 'Básico': '#6b7280', 'Pro': '#0ea5e9', 'Empresa': '#00f2ff'
};

interface Company {
  id: string; full_name: string; email: string;
  status: string; created_at: string; phone?: string; city?: string;
  shop_slug?: string; plan?: { name: string; price?: number };
  stats?: { total_sales: number; total_products: number; total_orders: number };
}

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const colors = ['#004d4d','#1e1b4b','#14532d','#7c2d12','#1e3a5f'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`h-${size} w-${size} rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm`}
      style={{ backgroundColor: colors[idx] }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function EmpresasPage() {
  const { token }     = useAuth();
  const { showToast } = useToast();
  const [companies,  setCompanies]  = useState<Company[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [selected,   setSelected]   = useState<Company | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res  = await fetch(`${base}/super-admin/companies`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setCompanies(Array.isArray(d) ? d : []); }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => companies.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      && (!filterPlan || c.plan?.name === filterPlan);
  }), [companies, search, filterPlan]);

  const totalRev  = useMemo(() => companies.reduce((a,c) => a + (c.stats?.total_sales||0), 0), [companies]);
  const activeCount = companies.filter(c => c.status === 'Activo').length;

  const toggle = async (c: Company) => {
    if (!token || isToggling) return;
    setIsToggling(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/companies/${c.id}/suspend`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { status } = await res.json();
        setCompanies(p => p.map(x => x.id === c.id ? { ...x, status } : x));
        setSelected(p => p?.id === c.id ? { ...p, status } : p);
        showToast(status === 'Activo' ? 'Empresa reactivada' : 'Empresa suspendida — su tienda pública ya no es accesible', status === 'Activo' ? 'success' : 'info');
      } else {
        showToast('No se pudo cambiar el estado', 'error');
      }
    } catch {
      showToast('No se pudo cambiar el estado', 'error');
    }
    setIsToggling(false);
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/companies/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCompanies(p => p.filter(x => x.id !== deleteTarget.id));
        showToast('Empresa eliminada permanentemente', 'success');
        setDeleteTarget(null);
        setDeleteConfirmText('');
        setSelected(null);
      } else {
        showToast('No se pudo eliminar la empresa', 'error');
      }
    } catch {
      showToast('No se pudo eliminar la empresa', 'error');
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Gestión · Multi-tenant</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Empresas</h1>
        </div>
        <button onClick={load}
          className="h-9 w-9 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Registradas',   value: companies.length, color: '#00f2ff', icon: <Building2 size={14}/> },
          { label: 'Activas',       value: activeCount,       color: '#10b981', icon: <TrendingUp size={14}/> },
          { label: 'Facturación',   value: fmtCOP(totalRev),  color: '#f59e0b', icon: <DollarSign size={14}/> },
          { label: 'Comisiones',    value: fmtCOP(totalRev*0.03), color: '#7c3aed', icon: <DollarSign size={14}/> },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${k.color}12`, color: k.color }}>{k.icon}</div>
            <div>
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{k.label}</p>
              <p className="text-xl font-black text-white">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="flex-1 flex items-center gap-2.5 h-9 bg-white/4 rounded-xl border border-white/6 px-3.5">
            <Search size={13} className="text-white/20 shrink-0"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empresa o email…"
              className="flex-1 bg-transparent outline-none text-[12px] text-white/60 placeholder:text-white/15"/>
            {search && <button onClick={() => setSearch('')}><X size={11} className="text-white/20"/></button>}
          </div>
          {/* Plan filter pills */}
          <div className="flex items-center gap-1.5">
            {['','Free','Pro','Empresa'].map(p => (
              <button key={p} onClick={() => setFilterPlan(p)}
                className={`h-8 px-3 rounded-lg text-[9px] font-bold transition-all ${filterPlan===p ? 'bg-white/10 text-white border border-white/15' : 'text-white/25 hover:text-white/50'}`}>
                {p || 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {/* Cabeceras */}
        <div className="overflow-x-auto">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-2.5 border-b border-white/[0.04] min-w-[820px]">
          {['Empresa','Contacto','Plan','Ventas','Estado','Registro',''].map((h,i) => (
            <p key={i} className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">{h}</p>
          ))}
        </div>

        {/* Filas */}
        <div className="divide-y divide-white/[0.04] min-w-[820px]">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-[10px] text-white/20">
              {companies.length === 0 ? 'Aún no hay empresas registradas' : 'Sin resultados para el filtro aplicado'}
            </div>
          )}
          {filtered.map(c => {
            const planColor = PLAN_COLORS[c.plan?.name||'Free']||'#6b7280';
            const isActive  = c.status === 'Activo';
            return (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_40px] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.025] transition-all group cursor-pointer"
                onClick={() => setSelected(c)}>

                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={c.full_name} size={8}/>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white/80 truncate">{c.full_name}</p>
                    {c.shop_slug && <p className="text-[9px] text-white/20">/{c.shop_slug}</p>}
                  </div>
                </div>

                <p className="text-[11px] text-white/30 truncate">{c.email}</p>

                <span className="text-[9px] font-black px-2.5 py-1 rounded-lg w-fit"
                  style={{ backgroundColor: `${planColor}15`, color: planColor }}>
                  {c.plan?.name || 'Free'}
                </span>

                <p className="text-[11px] font-semibold text-white/50">{fmtCOP(c.stats?.total_sales||0)}</p>

                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#10b981]' : 'bg-red-400'}`}/>
                  <span className={`text-[9px] font-semibold ${isActive ? 'text-[#10b981]/70' : 'text-red-400/70'}`}>
                    {c.status}
                  </span>
                </div>

                <p className="text-[10px] text-white/20">{fmtDate(c.created_at)}</p>

                <button onClick={e => { e.stopPropagation(); setSelected(c); }}
                  className="h-8 w-8 rounded-lg bg-white/4 hover:bg-white/10 flex items-center justify-center text-white/20 hover:text-white/60 transition-all opacity-0 group-hover:opacity-100">
                  <ChevronRight size={13}/>
                </button>
              </motion.div>
            );
          })}
        </div>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.04] flex justify-between">
            <p className="text-[10px] text-white/15">{filtered.length} empresa{filtered.length !== 1 ? 's' : ''}</p>
            <p className="text-[10px] text-white/15">Total · <span className="text-[#00f2ff]/50 font-bold">{fmtCOP(totalRev)}</span></p>
          </div>
        )}
      </div>

      {/* ── Drawer ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setSelected(null)}/>
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[460px] bg-[#080c0c] border-l border-white/6 shadow-2xl flex flex-col z-[9999]">

              {/* Header drawer */}
              <div className="px-6 py-6 border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setSelected(null)}
                    className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white transition-all">
                    <X size={14}/>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${selected.status==='Activo' ? 'bg-[#10b981]' : 'bg-red-400'}`}/>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{selected.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar name={selected.full_name} size={14}/>
                  <div>
                    <h2 className="text-lg font-black text-white">{selected.full_name}</h2>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-lg mt-1 inline-block"
                      style={{ backgroundColor: `${PLAN_COLORS[selected.plan?.name||'Free']}15`, color: PLAN_COLORS[selected.plan?.name||'Free'] }}>
                      {selected.plan?.name || 'Free'} {selected.plan?.price ? `· ${fmtCOP(selected.plan.price)}/mes` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats 3-col */}
              <div className="grid grid-cols-3 gap-3 px-6 py-5 border-b border-white/5 shrink-0">
                {[
                  { label: 'Ventas',    value: fmtCOP(selected.stats?.total_sales||0),  color: '#10b981' },
                  { label: 'Productos', value: selected.stats?.total_products||0,         color: '#00f2ff' },
                  { label: 'Pedidos',   value: selected.stats?.total_orders||0,           color: '#7c3aed' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.025] p-3 text-center">
                    <p className="text-[8px] font-bold text-white/20 uppercase mb-1.5">{s.label}</p>
                    <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1.5">
                {[
                  { icon: <Mail size={12}/>,     label: 'Email',    value: selected.email },
                  { icon: <Phone size={12}/>,    label: 'Teléfono', value: selected.phone || '—' },
                  { icon: <MapPin size={12}/>,   label: 'Ciudad',   value: selected.city  || '—' },
                  { icon: <Store size={12}/>,    label: 'Slug',     value: selected.shop_slug ? `/${selected.shop_slug}` : '—' },
                  { icon: <Calendar size={12}/>, label: 'Registro', value: fmtDate(selected.created_at) },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]">
                    <span className="text-white/20 w-4 shrink-0">{row.icon}</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase w-16 shrink-0">{row.label}</span>
                    <span className="text-[11px] text-white/50 truncate flex-1">{row.value}</span>
                  </div>
                ))}

                {/* ID */}
                <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mb-1.5">Tenant ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-mono text-white/25 flex-1 truncate">{selected.id}</p>
                    <button onClick={() => { navigator.clipboard.writeText(selected.id); showToast('Copiado','success'); }}>
                      <Copy size={11} className="text-white/20 hover:text-white/50"/>
                    </button>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="px-6 pb-6 pt-4 space-y-2.5 border-t border-white/5 shrink-0">
                <button onClick={() => { showToast(`Accediendo como ${selected.full_name}`, 'success'); window.open('/dashboard','_blank'); }}
                  className="w-full h-11 rounded-2xl bg-[#00f2ff]/8 hover:bg-[#00f2ff]/15 border border-[#00f2ff]/15 hover:border-[#00f2ff]/30 text-[#00f2ff]/70 hover:text-[#00f2ff] font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <Eye size={13}/> Acceder como empresa
                </button>
                {selected.shop_slug && (
                  <button onClick={() => window.open(`/shop/${selected.shop_slug}`,'_blank')}
                    className="w-full h-10 rounded-2xl bg-white/3 hover:bg-white/6 border border-white/6 text-white/30 hover:text-white/60 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <Globe size={12}/> Ver tienda pública
                  </button>
                )}
                <button onClick={() => toggle(selected)} disabled={isToggling}
                  className={`w-full h-10 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border disabled:opacity-50 ${
                    selected.status === 'Activo'
                      ? 'border-red-500/15 text-red-400/60 hover:bg-red-500/8 hover:text-red-400'
                      : 'border-emerald-500/15 text-emerald-400/60 hover:bg-emerald-500/8 hover:text-emerald-400'
                  }`}>
                  {isToggling ? <Loader2 size={12} className="animate-spin"/> : selected.status === 'Activo' ? <><Ban size={12}/>Suspender</> : <><Play size={12}/>Reactivar</>}
                </button>
                <button onClick={() => { setDeleteTarget(selected); setDeleteConfirmText(''); }}
                  className="w-full h-10 rounded-2xl border border-red-500/10 text-red-500/40 hover:bg-red-500/8 hover:text-red-500 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <Trash2 size={12}/> Eliminar permanentemente
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal confirmación de borrado permanente ── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteTarget(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#0a0f0f] border border-red-500/20 rounded-3xl w-full max-w-md p-7 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Eliminar permanentemente</h3>
                  <p className="text-[10px] text-white/30 mt-0.5">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p className="text-[12px] text-white/50 leading-relaxed">
                Se borrará <span className="text-white font-bold">{deleteTarget.full_name}</span> y todos sus datos: productos, pedidos, páginas publicadas, tickets de soporte, envíos, gastos y cuentas de su equipo. No hay forma de recuperarlo.
              </p>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  Escribe <span className="text-red-400">ELIMINAR</span> para confirmar
                </label>
                <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-xl text-[12px] text-white outline-none focus:border-red-500/40" />
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => setDeleteTarget(null)} disabled={isDeleting}
                  className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={confirmDelete} disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                  className="flex-1 h-10 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-30">
                  {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
