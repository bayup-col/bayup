"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { Layout, Plus, X, Star, Trash2, Eye, Search, ImagePlus, CheckCircle2, RefreshCw, Code2, FileCode2, Upload } from 'lucide-react';

interface Template {
  id: string; name: string; category: string; description: string;
  tags: string[]; uses: number; rating: number; isPremium: boolean; isActive: boolean; color: string;
  preview_url?: string | null;
  template_type?: 'schema' | 'html';
  html_pages?: string[];
}

const HTML_PAGE_KEYS = [
  { key: 'home',     label: 'Home',        required: true  },
  { key: 'catalog',  label: 'Colecciones', required: false },
  { key: 'product',  label: 'Producto',    required: false },
  { key: 'cart',     label: 'Carrito',     required: false },
  { key: 'contact',  label: 'Contacto',    required: false },
  { key: 'privacy',  label: 'Privacidad',  required: false },
];

function TemplateMock({ color, name, previewUrl, templateType }: { color: string; name: string; previewUrl?: string | null; templateType?: string }) {
  if (previewUrl) {
    return (
      <div className="relative h-40 rounded-xl overflow-hidden border border-white/[0.07]">
        <img src={previewUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {templateType === 'html' && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#00f2ff]/15 border border-[#00f2ff]/25 rounded-md text-[7px] font-black text-[#00f2ff]/70 uppercase tracking-widest flex items-center gap-1">
            <Code2 size={8} /> HTML
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="relative h-40 rounded-xl overflow-hidden border border-white/[0.07]"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}>
      <div className="absolute inset-0 p-3 flex flex-col gap-1.5">
        <div className="h-1.5 w-12 rounded-full bg-white/20" />
        <div className="flex gap-1 mt-0.5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-1 flex-1 rounded-full bg-white/10" />)}
        </div>
        <div className="flex-1 mt-2 rounded-lg bg-white/5 border border-white/[0.07] flex items-center justify-center">
          {templateType === 'html' ? <Code2 size={20} className="text-white/15" /> : <Layout size={20} className="text-white/15" />}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3].map(i => <div key={i} className="h-5 rounded-md bg-white/8" />)}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      {templateType === 'html' && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#00f2ff]/15 border border-[#00f2ff]/25 rounded-md text-[7px] font-black text-[#00f2ff]/70 uppercase tracking-widest flex items-center gap-1">
          <Code2 size={8} /> HTML
        </div>
      )}
    </div>
  );
}

export default function WebTemplatesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Todos');
  const [filterType, setFilterType] = useState<'todos' | 'free' | 'premium'>('todos');
  const [selected, setSelected] = useState<Template | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Formulario nueva plantilla
  const [newForm, setNewForm] = useState({ name: '', category: '', description: '', tags: '' });
  const [templateMode, setTemplateMode] = useState<'schema' | 'html'>('schema');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewPreview, setPreviewPreview] = useState<string | null>(null);
  const [htmlFiles, setHtmlFiles] = useState<Record<string, string>>({});
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
    } catch { }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const CATS = useMemo(() => ['Todos', ...Array.from(new Set(templates.map(t => t.category).filter(Boolean))).sort()], [templates]);

  const filtered = useMemo(() => templates.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      && (filterCat === 'Todos' || t.category === filterCat)
      && (filterType === 'todos' || (filterType === 'premium' ? t.isPremium : !t.isPremium));
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
        setTemplates(p => p.map(x => x.id === t.id ? upd : x));
        setSelected(s => s?.id === t.id ? upd : s);
        showToast(upd.isActive ? 'Plantilla activada' : 'Plantilla desactivada', 'success');
      }
    } catch { showToast('No se pudo actualizar la plantilla', 'error'); }
  };

  const del = async (t: Template) => {
    if (!token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/super-admin/web-templates/${t.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setTemplates(p => p.filter(x => x.id !== t.id)); setSelected(null); showToast('Plantilla eliminada', 'success'); }
    } catch { showToast('No se pudo eliminar la plantilla', 'error'); }
  };

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsText(file, 'utf-8'); });

  const uploadPreviewImage = async (): Promise<string | null> => {
    if (!previewFile || !token) return null;
    const fd = new FormData();
    fd.append('file', previewFile);
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${base}/admin/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) return null;
      const d = await res.json();
      return d.url || null;
    } catch { return null; }
  };

  const create = async () => {
    if (!newForm.name || !token) return;
    if (templateMode === 'html' && !htmlFiles['home']) {
      showToast('Debes subir al menos la página Home (code.html)', 'error');
      return;
    }
    setCreating(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const previewUrl = await uploadPreviewImage();
      const tags = newForm.tags;
      const body: any = {
        name: newForm.name,
        category: newForm.category || 'General',
        description: newForm.description,
        tags,
        template_type: templateMode,
        ...(previewUrl ? { preview_url: previewUrl } : {}),
      };
      if (templateMode === 'html') body.html_pages = htmlFiles;

      const res = await fetch(`${base}/super-admin/web-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const t = await res.json();
        setTemplates(p => [t, ...p]);
        setShowNew(false);
        setNewForm({ name: '', category: '', description: '', tags: '' });
        setTemplateMode('schema');
        setPreviewFile(null); setPreviewPreview(null);
        setHtmlFiles({});
        if (previewBlobUrl) { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }
        showToast('Plantilla creada ✓', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'No se pudo crear la plantilla', 'error');
      }
    } catch { showToast('No se pudo crear la plantilla', 'error'); }
    finally { setCreating(false); }
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
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowNew(true)}
            className="h-9 px-5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-bold text-[11px] flex items-center gap-2 transition-all">
            <Plus size={14} /> Nueva plantilla
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: templates.length,                        color: '#00f2ff' },
          { label: 'Premium', value: templates.filter(t => t.isPremium).length, color: '#f59e0b' },
          { label: 'HTML',    value: templates.filter(t => t.template_type === 'html').length, color: '#7c3aed' },
          { label: 'Usos',    value: templates.reduce((a, t) => a + t.uses, 0), color: '#10b981' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1.5">{k.label}</p>
            <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 h-9 bg-white/[0.03] rounded-xl border border-white/6 px-3.5 min-w-[220px]">
          <Search size={13} className="text-white/20 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plantillas…"
            className="flex-1 bg-transparent outline-none text-[12px] text-white/60 placeholder:text-white/15" />
          {search && <button onClick={() => setSearch('')}><X size={11} className="text-white/20" /></button>}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATS.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`h-8 px-3 rounded-lg text-[9px] font-bold transition-all ${filterCat === c ? 'bg-white/10 text-white border border-white/15' : 'text-white/25 hover:text-white/50'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {([['todos', 'Todos'], ['free', 'Free'], ['premium', 'Premium']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilterType(v)}
              className={`h-8 px-3 rounded-lg text-[9px] font-bold transition-all ${filterType === v ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20' : 'text-white/25 hover:text-white/50'}`}>
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
          <motion.div key={t.id} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}
            className="rounded-2xl border border-white/6 bg-white/[0.02] hover:border-white/10 overflow-hidden group cursor-pointer transition-all"
            onClick={() => setSelected(t)}>
            <TemplateMock color={t.color} name={t.name} previewUrl={t.preview_url} templateType={t.template_type} />
            <div className="p-4 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {t.isPremium && <span className="text-[7px] font-black px-1.5 py-0.5 bg-[#f59e0b]/12 text-[#f59e0b]/70 rounded-md uppercase">Premium</span>}
                    {t.template_type === 'html' && <span className="text-[7px] font-black px-1.5 py-0.5 bg-[#7c3aed]/12 text-[#7c3aed]/70 rounded-md uppercase flex items-center gap-0.5"><Code2 size={7} />HTML</span>}
                    {!t.isActive && <span className="text-[7px] font-black px-1.5 py-0.5 bg-white/5 text-white/20 rounded-md uppercase">Inactiva</span>}
                  </div>
                  <p className="text-[12px] font-black text-white/80">{t.name}</p>
                  <p className="text-[9px] text-white/25">{t.category}</p>
                </div>
              </div>
              <p className="text-[10px] text-white/25 leading-relaxed line-clamp-2">{t.description}</p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1">
                  {(t.template_type === 'html' ? (t.html_pages || []) : t.tags.slice(0, 2)).map((tag: string) => (
                    <span key={tag} className="text-[7px] px-1.5 py-0.5 bg-white/4 border border-white/6 text-white/20 rounded-md">
                      {t.template_type === 'html' ? `/${tag}` : `#${tag}`}
                    </span>
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
            <div className="fixed inset-0 z-[9998]" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[440px] bg-[#080c0c] border-l border-white/6 flex flex-col z-[9999]">
              <div className="px-6 py-5 border-b border-white/5 shrink-0 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black text-white">{selected.name}</p>
                    {selected.template_type === 'html' && (
                      <span className="text-[7px] font-black px-2 py-0.5 bg-[#7c3aed]/15 border border-[#7c3aed]/25 text-[#7c3aed]/70 rounded-full uppercase flex items-center gap-1"><Code2 size={7} />HTML</span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/25">{selected.category}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <TemplateMock color={selected.color} name={selected.name} previewUrl={selected.preview_url} templateType={selected.template_type} />

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Usos', value: selected.uses, color: '#00f2ff' },
                    { label: 'Tipo', value: selected.template_type === 'html' ? 'HTML' : 'Schema', color: selected.template_type === 'html' ? '#7c3aed' : '#00f2ff' },
                    { label: 'Estado', value: selected.isActive ? 'Activa' : 'Inactiva', color: selected.isActive ? '#10b981' : '#6b7280' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.025] p-3 text-center">
                      <p className="text-[7px] font-bold text-white/20 uppercase mb-1.5">{s.label}</p>
                      <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2">Descripción</p>
                  <p className="text-[12px] text-white/40 leading-relaxed">{selected.description}</p>
                </div>

                {selected.template_type === 'html' && selected.html_pages && selected.html_pages.length > 0 && (
                  <div>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2">Páginas HTML cargadas</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {selected.html_pages.map(p => (
                        <span key={p} className="text-[9px] px-2.5 py-1 bg-[#7c3aed]/8 border border-[#7c3aed]/15 text-[#7c3aed]/50 rounded-lg flex items-center gap-1">
                          <FileCode2 size={9} />{p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.template_type !== 'html' && (
                  <div>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2">Tags</p>
                    <div className="flex gap-2 flex-wrap">
                      {selected.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-2.5 py-1 bg-white/4 border border-white/6 text-white/30 rounded-lg">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 pt-4 border-t border-white/5 space-y-2 shrink-0">
                <button onClick={() => toggleActive(selected)}
                  className={`w-full h-10 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${selected.isActive ? 'border-red-500/15 text-red-400/50 hover:bg-red-500/6 hover:text-red-400' : 'border-emerald-500/15 text-emerald-400/50 hover:bg-emerald-500/6 hover:text-emerald-400'}`}>
                  {selected.isActive ? 'Desactivar' : 'Activar plantilla'}
                </button>
                <button onClick={() => del(selected)}
                  className="w-full h-8 rounded-xl text-white/15 hover:text-red-400/50 text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all">
                  <Trash2 size={10} /> Eliminar
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
            <div className="fixed inset-0 z-[9998]" onClick={() => {
              setShowNew(false);
              if (previewBlobUrl) { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }
            }} />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-[480px] my-auto bg-[#080c0c] border border-white/8 rounded-3xl shadow-2xl p-7 space-y-5">

                <div className="flex justify-between items-center">
                  <h2 className="text-base font-black text-white">Nueva Plantilla</h2>
                  <button onClick={() => { setShowNew(false); if (previewBlobUrl) { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); } }}
                    className="h-8 w-8 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/30 hover:text-white">
                    <X size={14} />
                  </button>
                </div>

                {/* Toggle Schema / HTML */}
                <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/6">
                  {(['schema', 'html'] as const).map(mode => (
                    <button key={mode} onClick={() => setTemplateMode(mode)}
                      className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${templateMode === mode ? 'bg-white/10 text-white border border-white/12' : 'text-white/25 hover:text-white/50'}`}>
                      {mode === 'schema' ? <Layout size={12} /> : <Code2 size={12} />}
                      {mode === 'schema' ? 'Builder (Schema)' : 'HTML Nativo'}
                    </button>
                  ))}
                </div>

                {/* Preview image / iframe auto-preview */}
                <input ref={previewInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setPreviewFile(f); setPreviewPreview(URL.createObjectURL(f)); }
                }} />
                {templateMode === 'html' && previewBlobUrl && !previewPreview ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-[#7c3aed]/20 bg-black cursor-pointer group"
                    onClick={() => previewInputRef.current?.click()}>
                    <iframe
                      src={previewBlobUrl}
                      title="preview"
                      sandbox="allow-scripts allow-same-origin"
                      className="absolute top-0 left-0 border-none pointer-events-none"
                      style={{ width: '1280px', height: '800px', transform: 'scale(0.31)', transformOrigin: 'top left' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                        <ImagePlus size={10} /> Reemplazar con imagen
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 text-[7px] font-bold text-white/40 bg-black/50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                      Vista previa auto
                    </div>
                  </div>
                ) : (
                  <button onClick={() => previewInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all">
                    {previewPreview
                      ? <img src={previewPreview} alt="preview" className="w-full h-40 object-cover" />
                      : <div className="p-8 flex flex-col items-center gap-2.5">
                          <ImagePlus size={22} className="text-white/15" />
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Subir imagen de preview</p>
                          <p className="text-[9px] text-white/15">PNG, JPG · máx 5MB{templateMode === 'html' ? ' · o sube Home primero' : ''}</p>
                        </div>
                    }
                  </button>
                )}

                {/* Campos base */}
                <div className="space-y-3">
                  {[
                    { key: 'name', label: 'Nombre', ph: 'ej. Stitch Luxe' },
                    { key: 'category', label: 'Categoría', ph: 'ej. Moda, Hogar, Tecnología' },
                    { key: 'description', label: 'Descripción', ph: 'Descripción breve' },
                    { key: 'tags', label: 'Tags', ph: 'dark, ecommerce, premium (comas)' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{f.label}</label>
                      <input value={(newForm as any)[f.key]} onChange={e => setNewForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.ph}
                        className="w-full h-9 px-3.5 bg-white/4 border border-white/8 rounded-xl outline-none text-[12px] text-white/60 placeholder:text-white/15 focus:border-white/15 transition-all" />
                    </div>
                  ))}
                </div>

                {/* Páginas HTML */}
                {templateMode === 'html' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[8px] font-bold text-[#7c3aed]/70 uppercase tracking-widest">Páginas HTML</p>
                      <div className="flex-1 h-px bg-[#7c3aed]/10" />
                    </div>
                    <p className="text-[9px] text-white/25">Sube el <span className="text-white/40 font-bold">code.html</span> de cada página. Home es obligatorio.</p>
                    <div className="space-y-2">
                      {HTML_PAGE_KEYS.map(({ key, label, required }) => (
                        <div key={key}>
                          <input
                            type="file" accept=".html,text/html" className="hidden"
                            ref={el => { htmlInputRefs.current[key] = el; }}
                            onChange={async e => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const text = await readFileAsText(f);
                              setHtmlFiles(p => ({ ...p, [key]: text }));
                              if (key === 'home') {
                                if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
                                const blob = new Blob([text], { type: 'text/html' });
                                setPreviewBlobUrl(URL.createObjectURL(blob));
                              }
                            }}
                          />
                          <button
                            onClick={() => htmlInputRefs.current[key]?.click()}
                            className={`w-full flex items-center gap-3 h-10 px-4 rounded-xl border transition-all text-left ${htmlFiles[key] ? 'border-[#7c3aed]/30 bg-[#7c3aed]/8' : 'border-white/6 bg-white/[0.02] hover:border-white/12'}`}>
                            {htmlFiles[key]
                              ? <CheckCircle2 size={12} className="text-[#7c3aed]/60 shrink-0" />
                              : <Upload size={12} className="text-white/20 shrink-0" />}
                            <span className={`text-[11px] font-bold flex-1 ${htmlFiles[key] ? 'text-[#7c3aed]/70' : 'text-white/25'}`}>
                              {label} {required && <span className="text-rose-400/60">*</span>}
                            </span>
                            {htmlFiles[key]
                              ? <span className="text-[9px] text-white/20">✓ Cargado</span>
                              : <span className="text-[9px] text-white/15">Subir code.html</span>}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={create}
                  disabled={!newForm.name || creating || (templateMode === 'html' && !htmlFiles['home'])}
                  className="w-full h-10 rounded-2xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-bold text-[11px] flex items-center justify-center gap-2 transition-all disabled:opacity-30">
                  {creating
                    ? <><RefreshCw size={12} className="animate-spin" /> Creando…</>
                    : <><Plus size={13} /> Crear plantilla</>}
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
