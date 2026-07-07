"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, X, Save, Eye, EyeOff,
  Rocket, Clock, CalendarClock, Sparkles, Image, Upload, Users, Star,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface RoadmapItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  phase: string;
  tags: string[];
  gradient: string;
  accent_color: string;
  image_url: string | null;
  votes: number;
  sort_order: number;
  is_active: boolean;
}

const PHASE_OPTIONS = [
  { value: 'Q3 2026', label: 'Q3 2026 — Muy pronto', icon: <Rocket size={12} /> },
  { value: 'Q4 2026', label: 'Q4 2026 — Este año', icon: <Clock size={12} /> },
  { value: '2027',    label: '2027 — En camino', icon: <CalendarClock size={12} /> },
  { value: 'proximamente', label: 'Próximamente (sin fecha)', icon: <Sparkles size={12} /> },
];

const GRADIENTS = [
  { g: 'linear-gradient(145deg,#001a1a 0%,#004040 100%)', c: '#00c2c2', name: 'Teal' },
  { g: 'linear-gradient(145deg,#071a0d 0%,#1a6b35 100%)', c: '#34d367', name: 'Verde' },
  { g: 'linear-gradient(145deg,#07101f 0%,#153580 100%)', c: '#60a5fa', name: 'Azul' },
  { g: 'linear-gradient(145deg,#1a0f00 0%,#6b3800 100%)', c: '#f59e0b', name: 'Naranja' },
  { g: 'linear-gradient(145deg,#0d0720 0%,#3b1f80 100%)', c: '#a78bfa', name: 'Morado' },
  { g: 'linear-gradient(145deg,#00101a 0%,#003d66 100%)', c: '#38bdf8', name: 'Celeste' },
  { g: 'linear-gradient(145deg,#1a0010 0%,#6b004a 100%)', c: '#f472b6', name: 'Rosa' },
  { g: 'linear-gradient(145deg,#1a0800 0%,#6b2500 100%)', c: '#fb923c', name: 'Coral' },
];

const EMPTY: Omit<RoadmapItem, 'id' | 'votes'> = {
  title: '',
  tagline: '',
  description: '',
  phase: 'proximamente',
  tags: [],
  gradient: GRADIENTS[0].g,
  accent_color: GRADIENTS[0].c,
  image_url: null,
  sort_order: 0,
  is_active: true,
};

function CardPreview({ item }: { item: Partial<RoadmapItem> }) {
  const accent = item.accent_color || '#00c2c2';
  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{ width: 220, height: 115, flexShrink: 0, background: item.gradient || GRADIENTS[0].g }}
    >
      {/* Imagen de fondo completa */}
      {item.image_url && (
        <img
          src={item.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Overlay con radial cuando no hay imagen */}
      {!item.image_url && (
        <>
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 55%, ${accent}45 0%, transparent 60%)` }} />
          <div className="absolute rounded-full border border-white/10" style={{ width: 130, height: 130, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div className="absolute flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-60%)', background: `${accent}22`, border: `1.5px solid ${accent}44` }}>
            <Image size={24} style={{ color: accent }} />
          </div>
        </>
      )}
      {/* Overlay oscuro sobre imagen para legibilidad */}
      {item.image_url && <div className="absolute inset-0 bg-black/30" />}
      {/* Badge fase */}
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: item.image_url ? '#fff' : accent, backdropFilter: 'blur(4px)' }}>
          {PHASE_OPTIONS.find(p => p.value === item.phase)?.icon}
          {item.phase === 'proximamente' ? 'Próx.' : item.phase}
        </span>
      </div>
      {/* Título */}
      <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-8 z-10"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>
        <p className="text-white text-[11px] font-black leading-tight truncate">{item.title || 'Título'}</p>
        <p className="text-white/60 text-[8px] leading-tight truncate">{item.tagline || 'Subtítulo'}</p>
      </div>
    </div>
  );
}

function ItemModal({
  item, onClose, onSave, token,
}: { item: Partial<RoadmapItem> | null; onClose: () => void; onSave: () => void; token: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  const [form, setForm] = useState<Omit<RoadmapItem, 'id' | 'votes'>>({
    ...EMPTY,
    ...(item ? {
      title: item.title || '',
      tagline: item.tagline || '',
      description: item.description || '',
      phase: item.phase || 'proximamente',
      tags: item.tags || [],
      gradient: item.gradient || GRADIENTS[0].g,
      accent_color: item.accent_color || GRADIENTS[0].c,
      image_url: item.image_url || null,
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
    } : {}),
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const isEdit = !!(item && (item as RoadmapItem).id);

  function setGradient(g: typeof GRADIENTS[0]) {
    setForm(f => ({ ...f, gradient: g.g, accent_color: g.c }));
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim();
      if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setTagInput('');
    }
  }

  function removeTag(t: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/admin/upload-image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      setForm(f => ({ ...f, image_url: data.url || data.image_url || data.file_url }));
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) { showToast('El título es obligatorio', 'error'); return; }
    setSaving(true);
    try {
      const url = isEdit
        ? `${API}/super-admin/roadmap/${(item as RoadmapItem).id}`
        : `${API}/super-admin/roadmap`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al guardar');
      showToast(isEdit ? 'Card actualizada' : 'Card creada', 'success');
      onSave();
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const modalContent = (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ padding: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.96, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        className="relative w-full bg-white shadow-2xl z-10 flex flex-col"
        style={{ maxWidth: 660, maxHeight: 'calc(100vh - 100px)', borderRadius: 28, margin: '50px 16px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header premium */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#001a1a,#004d4d)' }}>
              {isEdit ? <Edit2 size={14} color="#00c2c2" /> : <Plus size={16} color="#00c2c2" />}
            </div>
            <div>
              <h2 className="text-[16px] font-black text-gray-900 leading-none">{isEdit ? 'Editar card' : 'Nueva card'}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Novedades / Roadmap</p>
            </div>
          </div>
          <button onClick={onClose}
            className="h-9 w-9 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <div className="flex gap-6">
            {/* Preview + imagen */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <CardPreview item={form} />
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-600 border border-gray-200 hover:border-[#004d4d]/40 hover:text-[#004d4d] hover:bg-[#004d4d]/5 transition-all w-full justify-center">
                <Upload size={11} /> {uploading ? 'Subiendo...' : 'Subir imagen'}
              </button>
              {form.image_url && (
                <button onClick={() => setForm(f => ({ ...f, image_url: null }))}
                  className="text-[9px] text-red-400 hover:text-red-600 transition-colors">Quitar imagen</button>
              )}
            </div>

            {/* Campos */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="ej. Agente IA"
                  className="w-full px-4 py-2.5 rounded-xl text-[13px] text-gray-900 outline-none border border-gray-200 focus:border-[#004d4d] bg-gray-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Subtítulo</label>
                <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="ej. Tu vendedor que nunca duerme"
                  className="w-full px-4 py-2.5 rounded-xl text-[13px] text-gray-900 outline-none border border-gray-200 focus:border-[#004d4d] bg-gray-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Descripción</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe la funcionalidad…"
                  className="w-full px-4 py-2.5 rounded-xl text-[13px] text-gray-900 outline-none border border-gray-200 focus:border-[#004d4d] bg-gray-50 focus:bg-white transition-all resize-none" />
              </div>
            </div>
          </div>

          {/* Phase */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Tiempo de lanzamiento</label>
            <div className="grid grid-cols-2 gap-2">
              {PHASE_OPTIONS.map(p => (
                <button key={p.value} type="button" onClick={() => setForm(f => ({ ...f, phase: p.value }))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all text-left"
                  style={form.phase === p.value
                    ? { background: '#001a1a', color: '#00c2c2', border: '1.5px solid rgba(0,194,194,0.3)' }
                    : { background: '#f9fafb', color: '#6b7280', border: '1.5px solid #f3f4f6' }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Color de la card</label>
            <div className="flex flex-wrap gap-2">
              {GRADIENTS.map((g, i) => (
                <button key={i} type="button" onClick={() => setGradient(g)} title={g.name}
                  className="h-10 w-10 rounded-xl border-2 transition-all hover:scale-110"
                  style={{ background: g.g, borderColor: form.gradient === g.g ? g.c : 'transparent', boxShadow: form.gradient === g.g ? `0 0 0 2px ${g.c}55` : 'none' }} />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Etiquetas (Enter para agregar)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#004d4d]/10 text-[#004d4d]">
                  {t}<button onClick={() => removeTag(t)}><X size={9} /></button>
                </span>
              ))}
            </div>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              placeholder="ej. IA, Ventas…"
              className="w-full px-4 py-2.5 rounded-xl text-[13px] text-gray-900 outline-none border border-gray-200 focus:border-[#004d4d] bg-gray-50 focus:bg-white transition-all" />
          </div>

          {/* Toggle visible */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-[12px] font-bold text-gray-800">Visible para clientes</p>
              <p className="text-[10px] text-gray-400">Si está desactivado, la card no aparece en la página de Novedades</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: form.is_active ? '#004d4d' : '#e5e7eb' }}>
              <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ left: form.is_active ? 'calc(100% - 22px)' : '2px' }} />
            </button>
          </div>
        </div>

        {/* Footer premium */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 flex-shrink-0"
          style={{ background: 'linear-gradient(to right, #f9fafb, #f3f8f8)' }}>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[12px] font-semibold text-gray-500 hover:bg-gray-200/70 hover:text-gray-700 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="relative flex items-center gap-2.5 px-7 py-3 rounded-2xl text-[13px] font-black text-white transition-all disabled:opacity-50 overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #001a1a 0%, #004d4d 50%, #007a7a 100%)', boxShadow: '0 4px 20px rgba(0,77,77,0.4)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #002a2a 0%, #006060 50%, #009090 100%)' }} />
            <Save size={15} className="relative z-10" />
            <span className="relative z-10">{saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear card'}</span>
            {saving && (
              <div className="relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}

interface Voter {
  id: string;
  voted_at: string;
  user_name: string | null;
  user_email: string | null;
  session_key: string | null;
}

function VotersModal({ item, token, onClose }: { item: RoadmapItem; token: string; onClose: () => void }) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/super-admin/roadmap/${item.id}/voters`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setVoters)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item.id, token]);

  const accent = item.accent_color || '#00c2c2';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between" style={{ background: item.gradient }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">Votantes</p>
            <h2 className="text-[16px] font-black text-white">{item.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: accent }}>{item.votes}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider">votos</p>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
          ) : voters.length === 0 ? (
            <div className="text-center py-10">
              <Star size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">Nadie ha votado aún</p>
            </div>
          ) : (
            voters.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                  style={{ background: accent }}>
                  {v.user_name ? v.user_name[0].toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-gray-800 truncate">
                    {v.user_name || v.user_email || 'Usuario anónimo'}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {v.user_email || (v.session_key ? `Sesión: ${v.session_key.slice(0, 8)}…` : 'Anónimo')}
                  </p>
                </div>
                <p className="text-[9px] text-gray-300 flex-shrink-0">
                  {new Date(v.voted_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SuperAdminNovedadesPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RoadmapItem | null | 'new'>(null);
  const [viewingVoters, setViewingVoters] = useState<RoadmapItem | null>(null);
  const { token } = useAuth();
  const { showToast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/super-admin/roadmap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      showToast('Error al cargar items', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) load(); }, [token]);

  async function toggleActive(item: RoadmapItem) {
    try {
      await fetch(`${API}/super-admin/roadmap/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...item, is_active: !item.is_active }),
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch {
      showToast('Error al actualizar', 'error');
    }
  }

  async function deleteItem(item: RoadmapItem) {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;
    try {
      await fetch(`${API}/super-admin/roadmap/${item.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast('Card eliminada', 'success');
    } catch {
      showToast('Error al eliminar', 'error');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Novedades / Roadmap</h1>
          <p className="text-sm text-gray-400 mt-0.5">Cards que se muestran en el módulo de Novedades de los clientes</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="relative flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[12px] font-black text-white overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #001a1a 0%, #004d4d 50%, #007a7a 100%)', boxShadow: '0 4px 18px rgba(0,77,77,0.45)' }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #002a2a 0%, #006060 50%, #009090 100%)' }} />
          <div className="relative z-10 h-5 w-5 rounded-lg bg-white/15 flex items-center justify-center">
            <Plus size={13} />
          </div>
          <span className="relative z-10 tracking-wide" style={{ color: '#ffffff' }}>Nueva card</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map(item => {
            const accent = item.accent_color || '#00c2c2';
            const phase = PHASE_OPTIONS.find(p => p.value === item.phase);
            return (
              <motion.div
                key={item.id}
                layout
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
                style={{ opacity: item.is_active ? 1 : 0.5 }}
              >
                {/* Mini preview */}
                <div
                  className="flex-shrink-0 h-14 w-14 rounded-2xl overflow-hidden relative"
                  style={{ background: item.gradient || GRADIENTS[0].g }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-6 w-6 rounded-lg" style={{ background: `${accent}33`, border: `1px solid ${accent}55` }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[14px] font-black text-gray-900 truncate">{item.title}</h3>
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
                      style={{ background: `${accent}15`, color: accent }}>
                      {phase?.icon} {phase?.label || item.phase}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{item.tagline}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {item.tags.slice(0, 4).map(t => (
                      <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Votes */}
                <button
                  onClick={() => setViewingVoters(item)}
                  className="flex-shrink-0 text-center group px-3 py-2 rounded-2xl hover:bg-gray-50 transition-all"
                  title="Ver votantes"
                >
                  <p className="text-[18px] font-black" style={{ color: accent }}>{item.votes.toLocaleString('es-CO')}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Users size={9} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <p className="text-[8px] text-gray-400 group-hover:text-gray-600 uppercase tracking-wider transition-colors">votos</p>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(item)}
                    title={item.is_active ? 'Ocultar' : 'Mostrar'}
                    className="h-8 w-8 rounded-xl flex items-center justify-center border transition-all"
                    style={item.is_active
                      ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }
                      : { background: '#f9fafb', color: '#9ca3af', borderColor: '#f3f4f6' }}>
                    {item.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    onClick={() => setEditing(item)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all">
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteItem(item)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {items.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No hay cards aún. Crea la primera.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal edición */}
      <AnimatePresence>
        {editing !== null && token && (
          <ItemModal
            key={editing === 'new' ? 'new' : (editing as RoadmapItem).id}
            item={editing === 'new' ? null : editing as RoadmapItem}
            onClose={() => setEditing(null)}
            onSave={load}
            token={token}
          />
        )}
      </AnimatePresence>

      {/* Modal votantes */}
      <AnimatePresence>
        {viewingVoters && token && (
          <VotersModal
            key={viewingVoters.id}
            item={viewingVoters}
            token={token}
            onClose={() => setViewingVoters(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
