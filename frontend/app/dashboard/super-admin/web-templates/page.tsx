"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { Layout, Plus, X, Star, Trash2, Eye, Search, ImagePlus, CheckCircle2, RefreshCw } from 'lucide-react';

interface Template {
  id:string; name:string; category:string; description:string;
  tags:string[]; uses:number; rating:number; isPremium:boolean; isActive:boolean; color:string;
  preview_url?: string | null;
}

function TemplateMock({ color, name, previewUrl }: { color:string; name:string; previewUrl?: string | null }) {
  if (previewUrl) {
    return (
      <div className="relative h-40 rounded-xl overflow-hidden border border-white/[0.07]">
        <img src={previewUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"/>
      </div>
    );
  }
  return (
    <div className="relative h-40 rounded-xl overflow-hidden border border-white/[0.07]"
      style={{ background:`linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}>
      <div className="absolute inset-0 p-3 flex flex-col gap-1.5">
        <div className="h-1.5 w-12 rounded-full bg-white/20"/>
        <div className="flex gap-1 mt-0.5">
          {[1,2,3,4].map(i => <div key={i} className="h-1 flex-1 rounded-full bg-white/10"/>)}
        </div>
        <div className="flex-1 mt-2 rounded-lg bg-white/5 border border-white/[0.07] flex items-center justify-center">
          <Layout size={20} className="text-white/15"/>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[1,2,3].map(i => <div key={i} className="h-5 rounded-md bg-white/8"/>)}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
    </div>
  );
}

export default function WebTemplatesPage() {
  const { token }      = useAuth();
  const { showToast }  = useToast();
  const [templates,    setTemplates]    = useState<Template[]>([]);
  const [loading,       setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('Todos');
  const [filterType,   setFilterType]   = useState<'todos'|'free'|'premium'>('todos');
  const [selected,     setSelected]     = useState<Template|null>(null);
  const [showNew,      setShowNew]      = useState(false);
  const [newForm,      setNewForm]      = useState({ name:'', category:'', description:'', tags:'' });

  // Activa el overlay raíz de dashboard/layout.tsx (cubre TODO el viewport real,
  // sin las interferencias de overflow que sufre un overlay anidado dentro de
  // <main>) y oculta el header flotante + sidebar mientras hay un modal abierto.
  // Mismo patrón que customers/products/shipping/reports/gastos.
  useEffect(() => {
    if (selected || showNew) {
      document.body.classList.add('modal-open');
      return () => { document.body.classList.remove('modal-open'); };
    }
  }, [selected, showNew]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/web-templates`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setTemplates(Array.isArray(d) ? d : []); }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const CATS = useMemo(() => ['Todos', ...Array.from(new Set(templates.map(t => t.category).filter(Boolean))).sort()], [templates]);

  const filtered = useMemo(() => templates.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      && (filterCat==='Todos' || t.category===filterCat)
      && (filterType==='todos' || (filterType==='premium' ? t.isPremium : !t.isPremium));
  }), [templates, search, filterCat, filterType]);

  const toggleActive = async (t: Template) => {
    if (!token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/web-templates/${t.id}/toggle`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const upd = await res.json();
        setTemplates(p => p.map(x => x.id===t.id ? upd : x));
        setSelected(s => s?.id===t.id ? upd : s);
        showToast(upd.isActive ? 'Plantilla activada' : 'Plantilla desactivada','success');
      }
    } catch {
      showToast('No se pudo actualizar la plantilla','error');
    }
  };

  const del = async (t: Template) => {
    if (!token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/web-templates/${t.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTemplates(p => p.filter(x => x.id!==t.id));
        setSelected(null);
        showToast('Plantilla eliminada','success');
      }
    } catch {
      showToast('No se pudo eliminar la plantilla','error');
    }
  };

  const create = async () => {
    if (!newForm.name || !token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/web-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        const t = await res.json();
        setTemplates(p => [t, ...p]);
        setShowNew(false);
        setNewForm({name:'',category:'',description:'',tags:''});
        showToast('Plantilla creada ✓','success');
      } else {
        showToast('No se pudo crear la plantilla','error');
      }
    } catch {
      showToast('No se pudo crear la plantilla','error');
    }
  };

  return (
    <div className="space-y-6 pb-12">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Biblioteca · Templates</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Plantillas Web</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="h-9 w-9 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
          </button>
          <button onClick={() => setShowNew(true)}
            className="h-9 px-5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-bold text-[11px] flex items-center gap-2 transition-all">
            <Plus size={14}/> Nueva plantilla
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Total',   value:templates.length,                           color:'#00f2ff' },
          { label:'Premium', value:templates.filter(t=>t.isPremium).length,    color:'#f59e0b' },
          { label:'Activas', value:templates.filter(t=>t.isActive).length,     color:'#10b981' },
          { label:'Usos',    value:templates.reduce((a,t)=>a+t.uses,0),        color:'#7c3aed' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1.5">{k.label}</p>
            <p className="text-2xl font-black" style={{ color:k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 h-9 bg-white/[0.03] rounded-xl border border-white/6 px-3.5 min-w-[220px]">
          <Search size={13} className="text-white/20 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar plantillas…"
            className="flex-1 bg-transparent outline-none text-[12px] text-white/60 placeholder:text-white/15"/>
          {search && <button onClick={() => setSearch('')}><X size={11} className="text-white/20"/></button>}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATS.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`h-8 px-3 rounded-lg text-[9px] font-bold transition-all ${filterCat===c ? 'bg-white/10 text-white border border-white/15' : 'text-white/25 hover:text-white/50'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {([['todos','Todos'],['free','Free'],['premium','Premium']] as const).map(([v,l]) => (
            <button key={v} onClick={() => setFilterType(v)}
              className={`h-8 px-3 rounded-lg text-[9px] font-bold transition-all ${filterType===v ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20' : 'text-white/25 hover:text-white/50'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] py-14 text-center text-[10px] text-white/20">
          {templates.length === 0 ? 'Aún no hay plantillas creadas' : 'Sin resultados para el filtro aplicado'}
        </div>
      )}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map(t => (
          <motion.div key={t.id} whileHover={{ y:-3 }} transition={{ duration:0.15 }}
            className="rounded-2xl border border-white/6 bg-white/[0.02] hover:border-white/10 overflow-hidden group cursor-pointer transition-all"
            onClick={() => setSelected(t)}>
            <TemplateMock color={t.color} name={t.name} previewUrl={t.preview_url}/>
            <div className="p-4 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {t.isPremium && <span className="text-[7px] font-black px-1.5 py-0.5 bg-[#f59e0b]/12 text-[#f59e0b]/70 rounded-md uppercase">Premium</span>}
                    {!t.isActive && <span className="text-[7px] font-black px-1.5 py-0.5 bg-white/5 text-white/20 rounded-md uppercase">Inactiva</span>}
                  </div>
                  <p className="text-[12px] font-black text-white/80">{t.name}</p>
                  <p className="text-[9px] text-white/25">{t.category}</p>
                </div>
                {t.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={9} className="text-[#f59e0b]/60"/>
                    <span className="text-[9px] font-bold text-white/30">{t.rating}</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-white/25 leading-relaxed line-clamp-2">{t.description}</p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1">
                  {t.tags.slice(0,2).map(tag => (
                    <span key={tag} className="text-[7px] px-1.5 py-0.5 bg-white/4 border border-white/6 text-white/20 rounded-md">#{tag}</span>
                  ))}
                </div>
                <span className="text-[9px] text-white/15">{t.uses} usos</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Drawer detalle */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setSelected(null)}/>
            <motion.div
              initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
              transition={{type:'spring',damping:30,stiffness:300}}
              className="fixed top-0 right-0 h-full w-[440px] bg-[#080c0c] border-l border-white/6 flex flex-col z-[9999]">

              <div className="px-6 py-5 border-b border-white/5 shrink-0 flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-white">{selected.name}</p>
                  <p className="text-[10px] text-white/25">{selected.category}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white">
                  <X size={14}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <TemplateMock color={selected.color} name={selected.name} previewUrl={selected.preview_url}/>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:'Usos',   value:selected.uses,   color:'#00f2ff' },
                    { label:'Rating', value:selected.rating, color:'#f59e0b' },
                    { label:'Estado', value:selected.isActive?'Activa':'Inactiva', color:selected.isActive?'#10b981':'#6b7280' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.025] p-3 text-center">
                      <p className="text-[7px] font-bold text-white/20 uppercase mb-1.5">{s.label}</p>
                      <p className="text-sm font-black" style={{ color:s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2">Descripción</p>
                  <p className="text-[12px] text-white/40 leading-relaxed">{selected.description}</p>
                </div>

                <div>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2">Tags</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-2.5 py-1 bg-white/4 border border-white/6 text-white/30 rounded-lg">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {selected.isPremium && (
                    <span className="text-[8px] font-black px-3 py-1.5 bg-[#f59e0b]/8 border border-[#f59e0b]/15 text-[#f59e0b]/60 rounded-full flex items-center gap-1.5">
                      <Star size={9}/>Premium
                    </span>
                  )}
                  {selected.isActive && (
                    <span className="text-[8px] font-black px-3 py-1.5 bg-[#10b981]/8 border border-[#10b981]/15 text-[#10b981]/60 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 size={9}/>Activa
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 border-t border-white/5 space-y-2 shrink-0">
                <button onClick={() => showToast('Vista previa próximamente','success')}
                  className="w-full h-10 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/8 text-white/40 hover:text-white/70 font-bold text-[10px] flex items-center justify-center gap-2 transition-all">
                  <Eye size={12}/> Vista previa
                </button>
                <button onClick={() => toggleActive(selected)}
                  className={`w-full h-10 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${selected.isActive ? 'border-red-500/15 text-red-400/50 hover:bg-red-500/6 hover:text-red-400' : 'border-emerald-500/15 text-emerald-400/50 hover:bg-emerald-500/6 hover:text-emerald-400'}`}>
                  {selected.isActive ? 'Desactivar' : 'Activar plantilla'}
                </button>
                <button onClick={() => del(selected)}
                  className="w-full h-8 rounded-xl text-white/15 hover:text-red-400/50 text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all">
                  <Trash2 size={10}/> Eliminar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal nueva plantilla */}
      <AnimatePresence>
        {showNew && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
              onClick={() => setShowNew(false)}/>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:16}}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-[440px] my-auto bg-[#080c0c] border border-white/8 rounded-3xl shadow-2xl p-7 space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-black text-white">Nueva Plantilla</h2>
                  <button onClick={() => setShowNew(false)}
                    className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white">
                    <X size={14}/>
                  </button>
                </div>

                <div className="border-2 border-dashed border-white/8 rounded-2xl p-8 flex flex-col items-center gap-2.5 hover:border-white/15 transition-all cursor-pointer">
                  <ImagePlus size={22} className="text-white/15"/>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Subir imagen de preview</p>
                  <p className="text-[9px] text-white/15">PNG, JPG · máx 5MB</p>
                </div>

                <div className="space-y-3">
                  {[
                    { key:'name',        label:'Nombre',      ph:'ej. StorePro Dark' },
                    { key:'category',    label:'Categoría',   ph:'ej. Tienda, Moda, Restaurante' },
                    { key:'description', label:'Descripción', ph:'Descripción breve' },
                    { key:'tags',        label:'Tags',        ph:'dark, ecommerce, premium (comas)' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{f.label}</label>
                      <input value={(newForm as any)[f.key]} onChange={e => setNewForm(p => ({...p,[f.key]:e.target.value}))}
                        placeholder={f.ph}
                        className="w-full h-9 px-3.5 bg-white/4 border border-white/8 rounded-xl outline-none text-[12px] text-white/60 placeholder:text-white/15 focus:border-white/15 transition-all"/>
                    </div>
                  ))}
                </div>

                <button onClick={create} disabled={!newForm.name}
                  className="w-full h-10 rounded-2xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-bold text-[11px] flex items-center justify-center gap-2 transition-all disabled:opacity-30">
                  <Plus size={13}/> Crear plantilla
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
