"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import {
  Users, Search, X, Eye, RefreshCw, Mail, Calendar,
  Building2, Ban, Play, Copy, Crown, ShieldCheck,
  UserCheck, User, ChevronRight
} from 'lucide-react';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'2-digit' }) : '—';

const ROLE_CFG: Record<string, { label: string; color: string }> = {
  'SUPER_ADMIN':  { label: 'Super Admin', color: '#00f2ff' },
  'admin_tienda': { label: 'Admin',       color: '#7c3aed' },
  'vendedor':     { label: 'Vendedor',    color: '#f59e0b' },
  'cliente':      { label: 'Cliente',     color: '#6b7280' },
};

interface AppUser { id:string; full_name:string; email:string; role:string; status:string; created_at:string; company?:string; }

export default function UsersPage() {
  const { token }     = useAuth();
  const { showToast } = useToast();
  const [users,      setUsers]     = useState<AppUser[]>([]);
  const [loading,    setLoading]   = useState(false);
  const [search,     setSearch]    = useState('');
  const [filterRole, setFilterRole]= useState('');
  const [selected,   setSelected]  = useState<AppUser|null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL||'https://api.bayup.com.co';
      const res  = await fetch(`${base}/super-admin/users`, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setUsers(Array.isArray(d) ? d : []); }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Activa el overlay raíz de dashboard/layout.tsx (cubre TODO el viewport real
  // y oculta sidebar/header) en vez de animar un backdrop oscuro local — evita
  // la doble capa desincronizada. Mismo patrón que customers/products/web-templates.
  useEffect(() => {
    if (selected) {
      document.body.classList.add('modal-open');
      return () => { document.body.classList.remove('modal-open'); };
    }
  }, [selected]);

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase();
    return (!q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      && (!filterRole || u.role === filterRole);
  }), [users, search, filterRole]);

  const toggle = (u: AppUser) => {
    const s = u.status==='Activo' ? 'Suspendido' : 'Activo';
    setUsers(p => p.map(x => x.id===u.id ? {...x,status:s} : x));
    setSelected(p => p?.id===u.id ? {...p,status:s} : p);
    showToast(s==='Activo' ? 'Usuario reactivado' : 'Usuario suspendido', s==='Activo'?'success':'error');
  };

  const ROLE_ICONS: Record<string,any> = {
    'SUPER_ADMIN': <Crown size={11}/>, 'admin_tienda': <ShieldCheck size={11}/>,
    'vendedor': <UserCheck size={11}/>, 'cliente': <User size={11}/>
  };

  return (
    <div className="space-y-6 pb-12">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Gestión global · Accesos</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Usuarios</h1>
        </div>
        <button onClick={load}
          className="h-9 w-9 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
          <RefreshCw size={13} className={loading?'animate-spin':''}/>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Total',        value: users.length,                                     color:'#00f2ff' },
          { label:'Admins',       value: users.filter(u=>u.role==='admin_tienda').length,  color:'#7c3aed' },
          { label:'Vendedores',   value: users.filter(u=>u.role==='vendedor').length,      color:'#f59e0b' },
          { label:'Suspendidos',  value: users.filter(u=>u.status!=='Activo').length,      color:'#ef4444' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1.5">{k.label}</p>
            <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
          <div className="flex-1 flex items-center gap-2.5 h-9 bg-white/4 rounded-xl border border-white/6 px-3.5">
            <Search size={13} className="text-white/20 shrink-0"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar usuario o empresa…"
              className="flex-1 bg-transparent outline-none text-[12px] text-white/60 placeholder:text-white/15"/>
            {search && <button onClick={() => setSearch('')}><X size={11} className="text-white/20"/></button>}
          </div>
          <div className="flex gap-1.5">
            {[['','Todos'],['admin_tienda','Admins'],['vendedor','Vendedores'],['cliente','Clientes']].map(([v,l]) => (
              <button key={v} onClick={() => setFilterRole(v)}
                className={`h-8 px-3 rounded-lg text-[9px] font-bold transition-all ${filterRole===v ? 'bg-white/10 text-white border border-white/15' : 'text-white/25 hover:text-white/50'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_40px] gap-4 px-5 py-2.5 border-b border-white/[0.04] min-w-[760px]">
          {['Usuario','Email','Rol','Estado','Registro',''].map((h,i) => (
            <p key={i} className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-white/[0.04] min-w-[760px]">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-[10px] text-white/20">
              {users.length === 0 ? 'Aún no hay usuarios registrados' : 'Sin resultados para el filtro aplicado'}
            </div>
          )}
          {filtered.map(u => {
            const rc = ROLE_CFG[u.role] || ROLE_CFG['cliente'];
            const isActive = u.status === 'Activo';
            return (
              <motion.div key={u.id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_40px] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.025] transition-all group cursor-pointer"
                onClick={() => setSelected(u)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-white/40 font-black text-sm">
                    {u.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white/70 truncate">{u.full_name}</p>
                    {u.company && <p className="text-[9px] text-white/20 truncate">{u.company}</p>}
                  </div>
                </div>
                <p className="text-[11px] text-white/30 truncate">{u.email}</p>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-lg w-fit flex items-center gap-1"
                  style={{ backgroundColor:`${rc.color}12`, color:rc.color }}>
                  {ROLE_ICONS[u.role]}{rc.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${isActive?'bg-[#10b981]':'bg-red-400'}`}/>
                  <span className={`text-[9px] font-semibold ${isActive?'text-[#10b981]/60':'text-red-400/60'}`}>{u.status}</span>
                </div>
                <p className="text-[10px] text-white/20">{fmtDate(u.created_at)}</p>
                <button onClick={e => { e.stopPropagation(); setSelected(u); }}
                  className="h-8 w-8 rounded-lg bg-white/4 hover:bg-white/10 flex items-center justify-center text-white/20 hover:text-white/60 transition-all opacity-0 group-hover:opacity-100">
                  <ChevronRight size={13}/>
                </button>
              </motion.div>
            );
          })}
        </div>
        </div>
        <div className="px-5 py-3 border-t border-white/[0.04]">
          <p className="text-[10px] text-white/15">{filtered.length} usuario{filtered.length!==1?'s':''}</p>
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setSelected(null)}/>
            <motion.div
              initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
              transition={{type:'spring',damping:30,stiffness:300}}
              className="fixed top-0 right-0 h-full w-[400px] bg-[#080c0c] border-l border-white/6 flex flex-col z-[9999]">

              <div className="px-6 py-6 border-b border-white/5 shrink-0">
                <div className="flex justify-between mb-5">
                  <button onClick={() => setSelected(null)}
                    className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white transition-all">
                    <X size={14}/>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${selected.status==='Activo'?'bg-[#10b981]':'bg-red-400'}`}/>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{selected.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-white/50 font-black text-2xl">
                    {selected.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-black text-white">{selected.full_name}</p>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-lg mt-1 inline-flex items-center gap-1"
                      style={{ backgroundColor:`${ROLE_CFG[selected.role]?.color||'#6b7280'}12`, color:ROLE_CFG[selected.role]?.color||'#6b7280' }}>
                      {ROLE_ICONS[selected.role]}{ROLE_CFG[selected.role]?.label||selected.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {[
                  { icon:<Mail size={12}/>,     label:'Email',   value:selected.email },
                  { icon:<Building2 size={12}/>, label:'Empresa', value:selected.company||'—' },
                  { icon:<Calendar size={12}/>,  label:'Registro',value:fmtDate(selected.created_at) },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]">
                    <span className="text-white/20 w-4 shrink-0">{row.icon}</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase w-16 shrink-0">{row.label}</span>
                    <span className="text-[11px] text-white/50 truncate flex-1">{row.value}</span>
                  </div>
                ))}
                <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mb-1.5">ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-mono text-white/25 flex-1 truncate">{selected.id}</p>
                    <button onClick={() => { navigator.clipboard.writeText(selected.id); showToast('Copiado','success'); }}>
                      <Copy size={11} className="text-white/20 hover:text-white/50"/>
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 border-t border-white/5 shrink-0">
                <button onClick={() => toggle(selected)}
                  className={`w-full h-10 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${
                    selected.status==='Activo' ? 'border-red-500/15 text-red-400/60 hover:bg-red-500/8 hover:text-red-400' : 'border-emerald-500/15 text-emerald-400/60 hover:bg-emerald-500/8 hover:text-emerald-400'
                  }`}>
                  {selected.status==='Activo' ? <><Ban size={12}/>Suspender</> : <><Play size={12}/>Reactivar</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
