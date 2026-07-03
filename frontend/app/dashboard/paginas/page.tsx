"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Info, Phone, LayoutTemplate, FileText,
  ArrowRight, Pencil, Eye, HelpCircle, Zap, Globe,
  CheckCircle2, Loader2, ExternalLink, Settings
} from 'lucide-react';

// ── Tipos de página ───────────────────────────────────────────────────────────
const PAGE_TYPES = [
  {
    key: 'home',
    label: 'Páginas de Inicio',
    desc: 'Tu página principal. La primera que ven tus clientes al visitar tu tienda.',
    longDesc: 'Una Página de Inicio es la vitrina principal de tu negocio. Aquí puedes mostrar tus productos destacados, banners promocionales, secciones de categorías y más.',
    icon: Home,
    color: '#6366f1',
    totalAllowed: 1,
    editorKey: 'home',
    note: null,
  },
  {
    key: 'nosotros',
    label: 'Nosotros',
    desc: 'Cuenta la historia de tu marca, tu equipo y los valores de tu negocio.',
    longDesc: 'Una página de Nosotros permite que los clientes conozcan a las personas detrás de tu marca, tu misión y los valores que te hacen único.',
    icon: Info,
    color: '#10b981',
    totalAllowed: 1,
    editorKey: 'nosotros',
    note: null,
  },
  {
    key: 'contacto',
    label: 'Contacto',
    desc: 'Un formulario de contacto directo para que tus clientes te escriban.',
    longDesc: 'La página de contacto es esencial para construir confianza. Incluye un formulario, tu email, teléfono y dirección.',
    icon: Phone,
    color: '#00b2bd',
    totalAllowed: 1,
    editorKey: 'contacto',
    note: null,
  },
  {
    key: 'catalogo',
    label: 'Catálogo',
    desc: 'Lista de todos tus productos y colecciones disponibles.',
    longDesc: 'Una página de catálogo muestra todos tus productos de forma organizada. Perfecta para que los clientes exploren lo que ofreces.',
    icon: LayoutTemplate,
    color: '#f59e0b',
    totalAllowed: 1,
    editorKey: 'catalogo',
    note: null,
  },
  {
    key: 'blog',
    label: 'Blog & Artículos',
    desc: 'Publica artículos y contenido para conectar con tu comunidad.',
    longDesc: 'El blog te permite compartir noticias, tutoriales, historias de clientes y más.',
    icon: FileText,
    color: '#ec4899',
    totalAllowed: 1,
    editorKey: 'blog',
    note: 'Próximamente disponible',
    comingSoon: true,
  },
] as const;

type PageKey = typeof PAGE_TYPES[number]['key'];

interface PageStatus {
  exists: boolean;
  is_published: boolean;
}

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8001'
  : (process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co');

// Miniaturas decorativas de páginas (simula el collage de Pagetify)
function PageThumbnail({ color, index }: { color: string; index: number }) {
  const layouts = [
    // Thumbnail 1: hero + nav
    <div key={0} className="w-full h-full flex flex-col gap-1 p-2">
      <div className="h-2 w-full rounded flex gap-1">
        <div className="h-full w-8 rounded" style={{ background: color + '60' }} />
        <div className="flex-1" />
        <div className="h-full w-4 rounded bg-white/10" />
        <div className="h-full w-4 rounded bg-white/10" />
        <div className="h-full w-4 rounded bg-white/10" />
      </div>
      <div className="flex-1 rounded-sm relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}30, ${color}15)` }}>
        <div className="absolute bottom-2 left-2 space-y-1">
          <div className="h-2 w-16 rounded-full bg-white/30" />
          <div className="h-1 w-10 rounded-full bg-white/20" />
          <div className="h-3 w-12 rounded-full mt-1" style={{ background: color }} />
        </div>
      </div>
    </div>,
    // Thumbnail 2: product grid
    <div key={1} className="w-full h-full flex flex-col gap-1 p-2">
      <div className="h-2 w-20 rounded bg-white/20 mb-1" />
      <div className="flex-1 grid grid-cols-2 gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className="rounded-sm flex flex-col gap-0.5 p-1" style={{ background: color + '20' }}>
            <div className="flex-1 rounded-sm" style={{ background: color + '30' }} />
            <div className="h-1 w-full rounded-full bg-white/20" />
          </div>
        ))}
      </div>
    </div>,
    // Thumbnail 3: landing page
    <div key={2} className="w-full h-full flex flex-col gap-1 p-2">
      <div className="h-5 w-full rounded relative overflow-hidden" style={{ background: color + '40' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1.5 w-10 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <div className="h-1 w-14 rounded-full bg-white/20" />
        <div className="h-1 w-10 rounded-full bg-white/15" />
        <div className="h-3 w-12 rounded-full mt-1" style={{ background: color + '60' }} />
      </div>
    </div>,
  ];
  return layouts[index % layouts.length];
}

export default function PaginasPage() {
  const { token, shopSlug } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [selected, setSelected] = useState<PageKey>('home');
  const [statuses, setStatuses] = useState<Record<string, PageStatus | 'loading'>>({});

  useEffect(() => {
    if (!token) return;
    PAGE_TYPES.filter(p => !p.comingSoon).forEach(async (p) => {
      setStatuses(prev => ({ ...prev, [p.key]: 'loading' }));
      try {
        const res = await fetch(`${API}/shop-pages/${p.key}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStatuses(prev => ({
            ...prev,
            [p.key]: { exists: !!data.schema_data, is_published: data.is_published || false },
          }));
        } else {
          setStatuses(prev => ({ ...prev, [p.key]: { exists: false, is_published: false } }));
        }
      } catch {
        setStatuses(prev => ({ ...prev, [p.key]: { exists: false, is_published: false } }));
      }
    });
  }, [token]);

  const selectedType = PAGE_TYPES.find(p => p.key === selected)!;
  const selectedStatus = statuses[selected];
  const pageExists = selectedStatus !== 'loading' && selectedStatus && (selectedStatus as PageStatus).exists;
  const isPublished = pageExists && (selectedStatus as PageStatus).is_published;

  const handleEdit = () => {
    if (selectedType.comingSoon) { showToast('Esta sección estará disponible pronto', 'info'); return; }
    router.push(`/onboarding/editor?returnTo=/dashboard/paginas&pageKey=${selectedType.editorKey}`);
  };

  const handleView = () => {
    if (!shopSlug) { showToast('Tu tienda no tiene URL configurada', 'error'); return; }
    const path = selected === 'home' ? '' : `/${selected}`;
    window.open(`/shop/${shopSlug}${path}`, '_blank');
  };

  return (
    <div className="flex h-[calc(100vh-88px)] rounded-2xl overflow-hidden" style={{ background: '#111827' }}>

      {/* ── SIDEBAR ── */}
      <div className="w-[230px] shrink-0 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0f172a' }}>

        {/* Logo / branding */}
        <div className="px-5 py-5 border-b flex items-center gap-2.5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Globe size={13} className="text-white" />
          </div>
          <span className="text-[13px] font-black text-white tracking-tight">Bayup Pages</span>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/20 px-3 mb-3">Páginas</p>
          {PAGE_TYPES.map((p) => {
            const st = statuses[p.key];
            const count = !st || st === 'loading' ? 0 : (st as PageStatus).exists ? 1 : 0;
            const isActive = selected === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setSelected(p.key)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <p.icon size={14} style={{ color: isActive ? p.color : undefined }} />
                  <span className="text-[12px] font-medium truncate">{p.label}</span>
                </div>
                {!p.comingSoon ? (
                  <span className={`text-[9px] font-bold shrink-0 px-1.5 py-0.5 rounded border ${
                    isActive
                      ? 'border-white/20 text-white/50'
                      : 'border-white/10 text-white/20'
                  }`} style={{ borderStyle: 'dashed' }}>
                    {count}/{p.totalAllowed}
                  </span>
                ) : (
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-white/20 border border-white/10 shrink-0" style={{ borderStyle: 'dashed' }}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom links */}
        <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/20 px-3 mb-2">Cuenta</p>
          {shopSlug && (
            <button onClick={() => window.open(`/shop/${shopSlug}`, '_blank')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/5 text-[11px] transition-all">
              <ExternalLink size={13} /> Ver tienda
            </button>
          )}
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/5 text-[11px] transition-all">
            <HelpCircle size={13} /> Centro de ayuda
          </button>
          <button onClick={() => router.push('/dashboard/settings/general')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/5 text-[11px] transition-all">
            <Settings size={13} /> Configuración
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-8 h-full flex flex-col"
          >
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-[22px] font-black text-white mb-1">{selectedType.label}</h1>
              <p className="text-[13px] text-white/40 font-light">{selectedType.desc}</p>
            </div>

            {/* ESTADO VACÍO / Coming soon */}
            {(!pageExists || selectedType.comingSoon) && (
              <div className="rounded-2xl flex overflow-hidden" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)', minHeight: 360 }}>
                {/* Left: thumbnails collage */}
                <div className="w-[260px] shrink-0 relative overflow-hidden p-4 flex items-center justify-center gap-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="relative flex gap-2 items-end">
                    {[0,1,2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-xl overflow-hidden shrink-0"
                        style={{
                          width: i === 1 ? 80 : 68,
                          height: i === 1 ? 110 : 90,
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          transform: `rotate(${(i - 1) * 4}deg) translateY(${i === 1 ? -12 : 4}px)`,
                          boxShadow: i === 1 ? `0 8px 32px ${selectedType.color}44` : '0 4px 16px rgba(0,0,0,0.4)',
                        }}
                      >
                        <PageThumbnail color={selectedType.color} index={i} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right: description + CTA */}
                <div className="flex-1 p-8 flex flex-col justify-center">
                  {selectedType.comingSoon ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white/40" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          Próximamente
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-white mb-2">Esta sección llega pronto</h2>
                      <p className="text-[13px] text-white/40 leading-relaxed mb-6">
                        Estamos trabajando en el editor de {selectedType.label.toLowerCase()} para Bayup. Mientras tanto, sigue construyendo las demás páginas de tu tienda.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-black text-white mb-2">Crea tu primera página</h2>
                      <p className="text-[13px] text-white/40 leading-relaxed mb-2">
                        {selectedType.longDesc}
                      </p>
                      <p className="text-[12px] text-white/25 leading-relaxed mb-5">
                        Después de crear y publicar, tus clientes podrán verla en:
                        {' '}<span className="text-white/40 font-mono">
                          {shopSlug ? `bayup.com/shop/${shopSlug}${selected === 'home' ? '' : `/${selected}`}` : 'tu-tienda.bayup.com'}
                        </span>
                      </p>
                      <div>
                        <button
                          onClick={handleEdit}
                          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-white text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                          style={{
                            background: `linear-gradient(135deg, ${selectedType.color}, ${selectedType.color}bb)`,
                            boxShadow: `0 8px 24px ${selectedType.color}44`,
                          }}
                        >
                          Crear desde plantilla o desde cero <ArrowRight size={15} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* PÁGINA EXISTENTE */}
            {pageExists && !selectedType.comingSoon && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Tarjeta de la página */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Preview área */}
                  <div className="h-44 relative overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${selectedType.color}18, transparent)` }}>
                    <div className="flex gap-3 items-end">
                      {[0,1,2].map((i) => (
                        <div key={i} className="rounded-xl overflow-hidden"
                          style={{
                            width: i === 1 ? 90 : 70,
                            height: i === 1 ? 100 : 78,
                            background: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transform: `rotate(${(i-1)*3}deg) translateY(${i===1?-8:4}px)`,
                            opacity: 0.8,
                          }}>
                          <PageThumbnail color={selectedType.color} index={i} />
                        </div>
                      ))}
                    </div>
                    {/* Published badge */}
                    {isPublished && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black" style={{ background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' }}>
                        <CheckCircle2 size={9} /> En vivo
                      </div>
                    )}
                  </div>

                  {/* Info row */}
                  <div className="px-5 py-4 flex items-center justify-between border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="text-[13px] font-bold text-white">{selectedType.label}</p>
                      <p className="text-[10px] text-white/30 mt-0.5 font-mono">
                        {shopSlug ? `/shop/${shopSlug}${selected === 'home' ? '' : `/${selected}`}` : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPublished && shopSlug && (
                        <button onClick={handleView}
                          className="h-9 px-4 rounded-xl text-white/50 hover:text-white text-[11px] font-bold flex items-center gap-2 transition-all hover:bg-white/8"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <Eye size={13} /> Ver
                        </button>
                      )}
                      <button onClick={handleEdit}
                        className="h-9 px-4 rounded-xl text-white text-[11px] font-bold flex items-center gap-2 transition-all hover:opacity-90"
                        style={{ background: selectedType.color }}>
                        <Pencil size={12} /> Editar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status info */}
                <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: isPublished ? '#10b98110' : '#f59e0b10', border: `1px solid ${isPublished ? '#10b98130' : '#f59e0b30'}` }}>
                  {isPublished
                    ? <CheckCircle2 size={14} className="shrink-0" style={{ color: '#10b981' }} />
                    : <Zap size={14} className="shrink-0" style={{ color: '#f59e0b' }} />
                  }
                  <p className="text-[11px]" style={{ color: isPublished ? '#10b981' : '#f59e0b' }}>
                    {isPublished
                      ? 'Esta página está publicada y visible para tus clientes.'
                      : 'Esta página es un borrador. Entra al editor y publícala cuando esté lista.'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Loading */}
            {selectedStatus === 'loading' && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-white/20" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
