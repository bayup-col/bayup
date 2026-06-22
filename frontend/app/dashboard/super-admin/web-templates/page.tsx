"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/toast-context';
import { Layout, Plus, X, Star, Trash2, Eye, Search, ImagePlus, CheckCircle2 } from 'lucide-react';

interface Template {
  id:string; name:string; category:string; description:string;
  tags:string[]; uses:number; rating:number; isPremium:boolean; isActive:boolean; color:string;
}

const MOCK: Template[] = [
  { id:'1', name:'StorePro Dark',     category:'Tienda',      description:'Tienda oscura premium con diseño moderno y animaciones sutiles', tags:['dark','ecommerce','premium'],  uses:24, rating:4.8, isPremium:true,  isActive:true,  color:'#001a1a' },
  { id:'2', name:'Moda Minimal',      category:'Moda',        description:'Diseño limpio y elegante para marcas de moda y lifestyle',      tags:['fashion','minimal','clean'],   uses:18, rating:4.6, isPremium:false, isActive:true,  color:'#1a0a2e' },
  { id:'3', name:'RestaurantX',       category:'Restaurante', description:'Menú digital interactivo con sistema de reservas integrado',     tags:['food','menu','reservas'],      uses:31, rating:4.9, isPremium:true,  isActive:true,  color:'#1a0a00' },
  { id:'4', name:'TechCorp',          category:'Tecnología',  description:'Catálogo de productos tech con filtros y búsqueda avanzada',    tags:['tech','catalog','filters'],   uses:12, rating:4.3, isPremium:false, isActive:true,  color:'#001020' },
  { id:'5', name:'ServicePro',        category:'Servicios',   description:'Página de servicios con calendario de citas integrado',         tags:['services','booking','B2B'],   uses:9,  rating:4.1, isPremium:false, isActive:false, color:'#0a1a0a' },
  { id:'6', name:'Portfolio Creator', category:'Portfolio',   description:'Portafolio visual para creativos y freelancers',                tags:['portfolio','creative','art'],  uses:7,  rating:4.5, isPremium:true,  isActive:true,  color:'#1a001a' },
  { id:'7', name:'Fashion Luxe',      category:'Moda',        description:'Alta moda con animaciones premium y experiencia de lujo',       tags:['luxury','fashion','animate'], uses:15, rating:4.7, isPremium:true,  isActive:true,  color:'#1a0510' },
  { id:'8', name:'Blog Magazine',     category:'Blog',        description:'Blog estilo revista con artículos destacados y categorías',     tags:['blog','magazine','content'],  uses:5,  rating:3.9, isPremium:false, isActive:true,  color:'#0a0a1a' },
];

const CATS = ['Todos','Tienda','Moda','Restaurante','Tecnología','Servicios','Portfolio','Blog'];

function TemplateMock({ color, name }: { color:string; name:string }) {
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
  const { showToast } = useToast();
  const [templates,    setTemplates]    = useState<Template[]>(MOCK);
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('Todos');
  const [filterType,   setFilterType]   = useState<'todos'|'free'|'premium'>('todos');
  const [selected,     setSelected]     = useState<Template|null>(null);
  const [showNew,      setShowNew]      = useState(false);
  const [newForm,      setNewForm]      = useState({ name:'', category:'', description:'', tags:'' });

  const filtered = useMemo(() => templates.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      && (filterCat==='Todos' || t.category===filterCat)
      && (filterType==='todos' || (filterType==='premium' ? t.isPremium : !t.isPremium));
  }), [templates, search, filterCat, filterType]);

  const toggleActive = (t: Template) => {
    setTemplates(p => p.map(x => x.id===t.id ? {...x,isActive:!x.isActive} : x));
    setSelected(s => s?.id===t.id ? {...s,isActive:!s.isActive} : s);
    showToast(t.isActive ? 'Plantilla desactivada' : 'Plantilla activada','success');
  };

  const del = (t: Template) => {
    setTemplates(p => p.filter(x => x.id!==t.id));
    setSelected(null);
    showToast('Plantilla eliminada','success');
  };

  const create = () => {
    if (!newForm.name) return;
    const t: Template = { id:Date.now().toString(), name:newForm.name, category:newForm.category||'General', description:newForm.description, tags:newForm.tags.split(',').map(s=>s.trim()).filter(Boolean), uses:0, rating:0, isPremium:false, isActive:true, color:'#0f1a1a' };
    setTemplates(p => [t, ...p]);
    setShowNew(false);
    setNewForm({name:'',category:'',description:'',tags:''});
    showToast('Plantilla creada ✓','success');
  };

  return (
    <div className="space-y-6 pb-12">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Biblioteca · Templates</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Plantillas Web</h1>
        </div>
        <button onClick={() => setShowNew(true)}
          className="h-9 px-5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-bold text-[11px] flex items-center gap-2 transition-all">
          <Plus size={14}/> Nueva plantilla
        </button>
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
      <div className="grid grid-cols-4 gap-4">
        {filtered.map(t => (
          <motion.div key={t.id} whileHover={{ y:-3 }} transition={{ duration:0.15 }}
            className="rounded-2xl border border-white/6 bg-white/[0.02] hover:border-white/10 overflow-hidden group cursor-pointer transition-all"
            onClick={() => setSelected(t)}>
            <TemplateMock color={t.color} name={t.name}/>
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
                <TemplateMock color={selected.color} name={selected.name}/>

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
            <motion.div
              initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:16}}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-[#080c0c] border border-white/8 rounded-3xl shadow-2xl z-[9999] p-7 space-y-5">
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
