"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Check, Loader2, Image as ImageIcon, Type, LayoutTemplate, ShoppingBag,
  Menu as MenuIcon, Palette, Plus, Trash2, Monitor, Smartphone, Sparkles, ChevronDown, Tag, Eye, EyeOff,
  ChevronsLeft, ChevronsRight, GripVertical
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { SmartNavbar, SmartHero, SmartProductGrid } from '@/components/dashboard/studio/HighFidelityBlocks';

type TabKey = 'marca' | 'menu' | 'estilo' | 'banner' | 'productos';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'marca', label: 'Marca y logo', icon: ImageIcon },
  { key: 'menu', label: 'Menú', icon: MenuIcon },
  { key: 'estilo', label: 'Estilo visual', icon: Palette },
  { key: 'banner', label: 'Banners', icon: LayoutTemplate },
  { key: 'productos', label: 'Productos', icon: ShoppingBag },
];

// Tipografías reales ya cargadas en toda la app (next/font, ver app/layout.tsx)
// — referenciarlas por su variable CSS hace que el cambio se vea de verdad,
// a diferencia de un selector decorativo sin efecto.
const FONT_OPTIONS = [
  { value: 'var(--font-sans)', label: 'Inter', desc: 'Moderna y neutra' },
  { value: 'var(--font-display-luxury)', label: 'Playfair Display', desc: 'Elegante, serif itálica' },
  { value: 'var(--font-display-editorial)', label: 'Fraunces', desc: 'Cálida, tipo revista' },
  { value: 'var(--font-display-playful)', label: 'Baloo 2', desc: 'Redondeada y amigable' },
  { value: 'var(--font-display-impact)', label: 'Oswald', desc: 'Condensada, alto impacto' },
  { value: 'var(--font-display-tech)', label: 'Space Grotesk', desc: 'Geométrica, futurista' },
];

const DEFAULT_COLORS = { primary: '#0A1A1A', secondary: '#00B2BD', button: '#00F2FF', text: '#6B7280' };

const CARD_SHAPES = [
  { key: 'square', label: 'Cuadradas', radius: '0.25rem' },
  { key: 'soft', label: 'Suaves', radius: '0.75rem' },
  { key: 'round', label: 'Redondeadas', radius: '1.5rem' },
];

const findEl = (section: any, type: string) => (section?.elements || []).find((el: any) => el.type === type);

// Fila de acordeón reutilizable: encabezado siempre visible (con una vista
// previa del valor actual) que despliega el control real al hacer click.
// Así "Estilo visual" y "Productos" quedan compactos en vez de una lista
// larga con todo expandido de una vez.
const AccordionRow = ({
  isOpen, onToggle, label, desc, preview, children,
}: { isOpen: boolean; onToggle: () => void; label: string; desc: string; preview?: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-100 overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-3.5 bg-gray-50/60 hover:bg-gray-50 transition-colors text-left">
      <div className="flex items-center gap-3 min-w-0">
        {preview}
        <span className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-[11px] text-gray-400 font-light truncate">{desc}</p>
        </span>
      </div>
      <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="p-4 pt-3 bg-white">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const { token } = useAuth();
  const { showToast } = useToast();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [draft, setDraft] = useState<any>(null);
  const [tab, setTab] = useState<TabKey>('marca');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [openSection, setOpenSection] = useState<string | null>('principal');
  const toggleSection = (key: string) => setOpenSection(prev => (prev === key ? null : key));
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState(() => sessionStorage.getItem('bayup_ob_store_name') || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(() => sessionStorage.getItem('bayup_ob_logo_preview'));
  const [logoUrl, setLogoUrl] = useState<string | null>(() => sessionStorage.getItem('bayup_ob_logo_url'));
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingProduct, setUploadingProduct] = useState<number | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const productFileRef = useRef<HTMLInputElement>(null);
  const [productFileTarget, setProductFileTarget] = useState<number | null>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [extraFileTarget, setExtraFileTarget] = useState<string | null>(null);
  const [uploadingExtraId, setUploadingExtraId] = useState<string | null>(null);
  const [draggedBannerId, setDraggedBannerId] = useState<string | null>(null);
  const [draggedProductIndex, setDraggedProductIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!token || !templateId) return;
    fetch(`${apiBase}/web-templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then((list: any[]) => {
        const tpl = (list || []).find(t => t.id === templateId);
        if (!tpl) { setLoading(false); return; }
        setTemplateName(tpl.name);
        const overrideRaw = sessionStorage.getItem(`bayup_ob_schema_override_${templateId}`);
        const schema = overrideRaw ? JSON.parse(overrideRaw) : tpl.schema_data;
        setDraft(JSON.parse(JSON.stringify(schema)));
      })
      .finally(() => setLoading(false));
  }, [token, templateId, apiBase]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${apiBase}/admin/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  };

  const handleLogoPick = async (file: File) => {
    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      setLogoUrl(url);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading || !draft) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 size={28} className="animate-spin text-petroleum" />
      </div>
    );
  }

  const navbarEl = findEl(draft.header, 'navbar');
  const heroEl = (draft.body?.elements || []).find((el: any) => el.type === 'hero-banner' && !el.props?.isExtra);
  const productGridEl = findEl(draft.body, 'product-grid');
  const footerEl = findEl(draft.footer, 'footer-premium');
  const extraBanners: any[] = (draft.body?.elements || []).filter((el: any) => el.type === 'hero-banner' && el.props?.isExtra);
  const storeVariant: string | undefined = navbarEl?.props?.variant;
  // Colores y tipografía elegidos a mano se guardan en el navbar (que actúa
  // como la "fuente de verdad" del estilo de toda la tienda) y desde ahí se
  // propagan al banner y la grilla de productos en la vista previa, igual
  // que ya hacíamos con el `variant` de las plantillas.
  const storeColors = { ...DEFAULT_COLORS, ...(navbarEl?.props?.colors || {}) };
  const storeFontFamily: string | undefined = navbarEl?.props?.fontFamily;

  const updateElProps = (section: 'header' | 'body' | 'footer', elId: string, patch: Record<string, any>) => {
    setDraft((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        elements: prev[section].elements.map((el: any) => el.id === elId ? { ...el, props: { ...el.props, ...patch } } : el),
      },
    }));
  };

  const updateColor = (key: 'primary' | 'secondary' | 'button' | 'text', value: string) => {
    if (!navbarEl) return;
    updateElProps('header', navbarEl.id, { colors: { ...storeColors, [key]: value } });
  };
  const setFontFamily = (fontFamily: string) => {
    if (navbarEl) updateElProps('header', navbarEl.id, { fontFamily });
  };

  const updateMenuItem = (index: number, value: string) => {
    if (!navbarEl) return;
    const items = [...(navbarEl.props.menuItems || [])];
    items[index] = value;
    updateElProps('header', navbarEl.id, { menuItems: items });
  };
  const addMenuItem = () => navbarEl && updateElProps('header', navbarEl.id, { menuItems: [...(navbarEl.props.menuItems || []), 'Nuevo ítem'] });
  const removeMenuItem = (index: number) => {
    if (!navbarEl) return;
    const items = [...(navbarEl.props.menuItems || [])];
    items.splice(index, 1);
    updateElProps('header', navbarEl.id, { menuItems: items });
  };

  const updateProduct = (index: number, patch: Record<string, any>) => {
    if (!productGridEl) return;
    const products = [...(productGridEl.props.products || [])];
    products[index] = { ...products[index], ...patch };
    updateElProps('body', productGridEl.id, { products });
  };

  const handleHeroImagePick = async (file: File) => {
    setUploadingHero(true);
    const url = await uploadImage(file);
    setUploadingHero(false);
    if (url && heroEl) updateElProps('body', heroEl.id, { imageUrl: url });
  };
  const handleProductImagePick = async (file: File, index: number) => {
    setUploadingProduct(index);
    const url = await uploadImage(file);
    setUploadingProduct(null);
    if (url) updateProduct(index, { image: url });
  };
  const handleExtraBannerImagePick = async (file: File, id: string) => {
    setUploadingExtraId(id);
    const url = await uploadImage(file);
    setUploadingExtraId(null);
    if (url) updateElProps('body', id, { imageUrl: url });
  };

  // Banners adicionales: secciones completas (mismo ancho que el banner
  // principal) que el cliente puede reordenar arrastrándolas verticalmente
  // entre las demás secciones de la página, en vez de flotar sueltas.
  const addExtraBanner = () => {
    const id = `banner-extra-${Date.now()}`;
    const newBanner = {
      id,
      type: 'hero-banner',
      props: {
        title: 'Nuevo banner', subtitle: 'Edita este texto', badge: 'Promoción', primaryBtnText: 'Ver más',
        imageUrl: heroEl?.props?.imageUrl || '',
        isExtra: true,
      },
    };
    setDraft((prev: any) => {
      const elements = [...(prev.body.elements || [])];
      const heroIndex = elements.findIndex((el: any) => el.type === 'hero-banner' && !el.props?.isExtra);
      const insertAt = heroIndex !== -1 ? heroIndex + 1 : elements.length;
      elements.splice(insertAt, 0, newBanner);
      return { ...prev, body: { ...prev.body, elements } };
    });
    setOpenSection(id);
  };
  const removeExtraBanner = (id: string) => {
    setDraft((prev: any) => ({ ...prev, body: { ...prev.body, elements: (prev.body.elements || []).filter((el: any) => el.id !== id) } }));
  };
  // Arrastre continuo: en cada movimiento del mouse se recalcula el índice
  // según la posición vertical del cursor frente a las demás secciones, así
  // el banner se puede soltar en cualquier punto de la página, no solo en
  // un par de posiciones fijas.
  const handleBannerGripPointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedBannerId(id);
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch {}

    // Las secciones (banner, productos) ocupan casi toda la altura de la
    // pantalla, así que comparar contra el punto medio real de cada una
    // requeriría arrastrar cientos de píxeles sin dar ninguna señal. En vez
    // de medir el DOM, contamos la distancia arrastrada: cada "paso" de
    // movimiento intercambia el banner con el vecino inmediato, sea cual
    // sea su altura real.
    const STEP_PX = 70;
    let lastY = e.clientY;
    let accumulated = 0;

    const onMove = (ev: PointerEvent) => {
      accumulated += ev.clientY - lastY;
      lastY = ev.clientY;
      while (Math.abs(accumulated) >= STEP_PX) {
        const dir = accumulated > 0 ? 1 : -1;
        accumulated -= dir * STEP_PX;
        setDraft((prev: any) => {
          const elements = [...(prev.body.elements || [])];
          const idx = elements.findIndex((el: any) => el.id === id);
          const newIdx = idx + dir;
          if (idx === -1 || newIdx < 0 || newIdx >= elements.length) return prev;
          [elements[idx], elements[newIdx]] = [elements[newIdx], elements[idx]];
          return { ...prev, body: { ...prev.body, elements } };
        });
      }
    };
    const onUp = () => {
      setDraggedBannerId(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Mismo patrón de "pasos por distancia arrastrada" que los banners, pero
  // con un umbral menor porque las filas de la lista de productos son
  // pequeñas y de altura pareja.
  const handleProductGripPointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productGridEl) return;
    setDraggedProductIndex(index);
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch {}

    const STEP_PX = 56;
    let lastY = e.clientY;
    let accumulated = 0;
    let currentIndex = index;

    const onMove = (ev: PointerEvent) => {
      accumulated += ev.clientY - lastY;
      lastY = ev.clientY;
      while (Math.abs(accumulated) >= STEP_PX) {
        const dir = accumulated > 0 ? 1 : -1;
        accumulated -= dir * STEP_PX;
        const newIndex = currentIndex + dir;
        const products = [...(productGridEl.props.products || [])];
        if (newIndex < 0 || newIndex >= products.length) continue;
        [products[currentIndex], products[newIndex]] = [products[newIndex], products[currentIndex]];
        updateElProps('body', productGridEl.id, { products });
        currentIndex = newIndex;
        setDraggedProductIndex(currentIndex);
      }
    };
    const onUp = () => {
      setDraggedProductIndex(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleSave = () => {
    setSaving(true);
    sessionStorage.setItem(`bayup_ob_schema_override_${templateId}`, JSON.stringify(draft));
    sessionStorage.setItem('bayup_ob_store_name', storeName);
    if (logoPreview) sessionStorage.setItem('bayup_ob_logo_preview', logoPreview);
    if (logoUrl) sessionStorage.setItem('bayup_ob_logo_url', logoUrl);
    showToast('Cambios guardados en tu plantilla', 'success');
    router.push('/onboarding');
  };

  const previewNavbarProps = { ...navbarEl?.props, logoText: storeName.trim() || navbarEl?.props?.logoText, logoUrl: logoPreview || undefined };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAFAFA] overflow-hidden">
      {/* TOP BAR */}
      <header className="h-[72px] flex items-center justify-between px-6 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/onboarding')} className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={17} />
          </button>
          <div>
            <p className="text-base font-medium text-[#0A1A1A]">Editor de plantilla</p>
            <p className="text-xs text-gray-400 font-light -mt-0.5">{templateName || 'Personaliza tu diseño antes de publicar'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-gray-50 rounded-xl p-1">
            <button onClick={() => setDevice('desktop')} className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${device === 'desktop' ? 'bg-white shadow-sm text-petroleum' : 'text-gray-400 hover:text-gray-600'}`}>
              <Monitor size={16} />
            </button>
            <button onClick={() => setDevice('mobile')} className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${device === 'mobile' ? 'bg-white shadow-sm text-petroleum' : 'text-gray-400 hover:text-gray-600'}`}>
              <Smartphone size={16} />
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-cyan text-[#0A1A1A] rounded-full font-medium text-sm tracking-wide shadow-[0_15px_35px_-10px_rgba(0,242,255,0.4)] hover:bg-[#1AF5FF] transition-all disabled:opacity-50"
          >
            <Check size={16} /> Guardar y volver
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* RAIL DE PESTAÑAS */}
        <div className="w-[240px] bg-white border-r border-gray-100 shrink-0 p-3 space-y-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === t.key ? 'bg-gray-50 text-petroleum ring-1 ring-cyan/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/60'
              }`}
            >
              <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${tab === t.key ? 'bg-cyan/10 text-petroleum' : 'bg-gray-100 text-gray-400'}`}>
                <t.icon size={15} />
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {/* PANEL DE OPCIONES */}
        {!panelCollapsed && (
        <div className="relative w-[420px] bg-white border-r border-gray-100 overflow-y-auto shrink-0 p-7 space-y-6">
          <button
            onClick={() => setPanelCollapsed(true)}
            title="Ocultar panel"
            className="absolute top-5 right-5 h-8 w-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors z-10"
          >
            <ChevronsLeft size={15} />
          </button>
          {tab === 'marca' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Marca y logo</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">Tu nombre y logo aparecerán automáticamente en el menú y el pie de página de tu tienda publicada.</p>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/60">
                <button onClick={() => logoFileRef.current?.click()} className="h-16 w-16 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 overflow-hidden shrink-0 hover:border-cyan/40 transition-all">
                  {uploadingLogo ? <Loader2 size={18} className="animate-spin" /> : logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" /> : <ImageIcon size={20} />}
                </button>
                <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoPick(f); }} />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">Logo</p>
                  <p className="text-xs text-gray-400 font-light mt-1">Click para subir una imagen</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Nombre de tu tienda</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Ej. Tech Hub Colombia"
                  className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
              </div>
            </div>
          )}

          {tab === 'menu' && navbarEl && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Menú de navegación</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">Edita las opciones del menú de tu tienda.</p>
              </div>
              <div className="space-y-2.5">
                {(navbarEl.props.menuItems || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={typeof item === 'string' ? item : item.label} onChange={e => updateMenuItem(i, e.target.value)}
                      className="flex-1 p-3 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                    <button onClick={() => removeMenuItem(i)} className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addMenuItem} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-cyan/40 hover:text-petroleum transition-all">
                <Plus size={14} /> Agregar ítem
              </button>
            </div>
          )}

          {tab === 'estilo' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Estilo visual</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">Elige a mano los colores y la tipografía de toda tu tienda.</p>
              </div>

              <div className="space-y-2.5">
                <AccordionRow
                  isOpen={openSection === 'principal'}
                  onToggle={() => toggleSection('principal')}
                  label="Color principal"
                  desc="Títulos y textos destacados"
                  preview={<span className="h-7 w-7 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: storeColors.primary }} />}
                >
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-transparent focus-within:border-cyan/40 transition-all">
                    <input type="color" value={storeColors.primary} onChange={e => updateColor('primary', e.target.value)} className="h-10 w-10 rounded-full cursor-pointer border-none bg-transparent shrink-0 color-swatch-round" />
                    <input value={storeColors.primary} onChange={e => updateColor('primary', e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-medium uppercase tracking-wide text-gray-700" />
                  </div>
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'secundario'}
                  onToggle={() => toggleSection('secundario')}
                  label="Color secundario"
                  desc="Etiquetas y detalles sutiles"
                  preview={<span className="h-7 w-7 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: storeColors.secondary }} />}
                >
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-transparent focus-within:border-cyan/40 transition-all">
                    <input type="color" value={storeColors.secondary} onChange={e => updateColor('secondary', e.target.value)} className="h-10 w-10 rounded-full cursor-pointer border-none bg-transparent shrink-0 color-swatch-round" />
                    <input value={storeColors.secondary} onChange={e => updateColor('secondary', e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-medium uppercase tracking-wide text-gray-700" />
                  </div>
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'boton'}
                  onToggle={() => toggleSection('boton')}
                  label="Color de botones"
                  desc="Botones de compra y llamados a la acción"
                  preview={<span className="h-7 w-7 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: storeColors.button }} />}
                >
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-transparent focus-within:border-cyan/40 transition-all">
                    <input type="color" value={storeColors.button} onChange={e => updateColor('button', e.target.value)} className="h-10 w-10 rounded-full cursor-pointer border-none bg-transparent shrink-0 color-swatch-round" />
                    <input value={storeColors.button} onChange={e => updateColor('button', e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-medium uppercase tracking-wide text-gray-700" />
                  </div>
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'texto-color'}
                  onToggle={() => toggleSection('texto-color')}
                  label="Color de texto"
                  desc="Subtítulos y textos normales"
                  preview={<span className="h-7 w-7 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: storeColors.text }} />}
                >
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-transparent focus-within:border-cyan/40 transition-all">
                    <input type="color" value={storeColors.text} onChange={e => updateColor('text', e.target.value)} className="h-10 w-10 rounded-full cursor-pointer border-none bg-transparent shrink-0 color-swatch-round" />
                    <input value={storeColors.text} onChange={e => updateColor('text', e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-medium uppercase tracking-wide text-gray-700" />
                  </div>
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'tipografia'}
                  onToggle={() => toggleSection('tipografia')}
                  label="Tipografía"
                  desc={FONT_OPTIONS.find(f => f.value === storeFontFamily)?.label || 'Inter'}
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><Type size={14} /></span>}
                >
                  <div className="space-y-2">
                    {FONT_OPTIONS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setFontFamily(f.value)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          storeFontFamily === f.value ? 'border-cyan/60 bg-cyan/5 ring-1 ring-cyan/20' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span>
                          <p className="text-base text-gray-900" style={{ fontFamily: f.value }}>{f.label}</p>
                          <p className="text-[11px] text-gray-400 font-light">{f.desc}</p>
                        </span>
                        {storeFontFamily === f.value && <Check size={16} className="text-petroleum shrink-0" />}
                      </button>
                    ))}
                  </div>
                </AccordionRow>
              </div>
            </div>
          )}

          {tab === 'banner' && heroEl && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Banners</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">Edita tu banner principal o crea banners adicionales: cada uno ocupa el ancho completo de la página y puedes arrastrarlo en la vista previa para fijarlo arriba, abajo o entre los productos.</p>
              </div>

              <div className="space-y-2.5">
                <AccordionRow
                  isOpen={openSection === 'banner-principal'}
                  onToggle={() => toggleSection('banner-principal')}
                  label="Banner principal"
                  desc="La primera impresión de tu tienda"
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400">{heroEl.props.imageUrl ? <img src={heroEl.props.imageUrl} className="w-full h-full object-cover" /> : <LayoutTemplate size={13} />}</span>}
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Imagen del banner</label>
                      <button onClick={() => heroFileRef.current?.click()} disabled={uploadingHero}
                        className="w-full h-36 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 overflow-hidden relative hover:border-cyan/40 transition-all">
                        {uploadingHero ? <Loader2 size={20} className="animate-spin text-petroleum" /> : heroEl.props.imageUrl ? <img src={heroEl.props.imageUrl} className="w-full h-full object-cover" alt="Banner" /> : <ImageIcon size={22} />}
                      </button>
                      <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroImagePick(f); }} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Etiqueta superior</label>
                      <input value={heroEl.props.badge || ''} onChange={e => updateElProps('body', heroEl.id, { badge: e.target.value })}
                        className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Título</label>
                      <input value={heroEl.props.title || ''} onChange={e => updateElProps('body', heroEl.id, { title: e.target.value })}
                        className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Subtítulo</label>
                      <textarea rows={3} value={heroEl.props.subtitle || ''} onChange={e => updateElProps('body', heroEl.id, { subtitle: e.target.value })}
                        className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Texto del botón</label>
                      <input value={heroEl.props.primaryBtnText || ''} onChange={e => updateElProps('body', heroEl.id, { primaryBtnText: e.target.value })}
                        className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                    </div>
                  </div>
                </AccordionRow>

                <div className="pt-2 space-y-1">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Banners adicionales</p>
                  <p className="text-[11px] text-gray-400 font-light ml-1">Cada banner ocupa todo el ancho de la página. Arrástralo desde el ícono <span className="inline-block align-middle">⠿</span> en la vista previa para fijarlo donde quieras.</p>
                </div>

                {extraBanners.map((b, i) => (
                  <AccordionRow
                    key={b.id}
                    isOpen={openSection === b.id}
                    onToggle={() => toggleSection(b.id)}
                    label={`Banner adicional ${i + 1}`}
                    desc={b.props.title || 'Sin título'}
                    preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400">{b.props.imageUrl ? <img src={b.props.imageUrl} className="w-full h-full object-cover" /> : <LayoutTemplate size={13} />}</span>}
                  >
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Imagen del banner</label>
                        <button onClick={() => { setExtraFileTarget(b.id); extraFileRef.current?.click(); }} disabled={uploadingExtraId === b.id}
                          className="w-full h-28 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 overflow-hidden relative hover:border-cyan/40 transition-all">
                          {uploadingExtraId === b.id ? <Loader2 size={20} className="animate-spin text-petroleum" /> : b.props.imageUrl ? <img src={b.props.imageUrl} className="w-full h-full object-cover" alt="Banner" /> : <ImageIcon size={22} />}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Etiqueta superior</label>
                        <input value={b.props.badge || ''} onChange={e => updateElProps('body', b.id, { badge: e.target.value })}
                          className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Título</label>
                        <input value={b.props.title || ''} onChange={e => updateElProps('body', b.id, { title: e.target.value })}
                          className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Subtítulo</label>
                        <textarea rows={2} value={b.props.subtitle || ''} onChange={e => updateElProps('body', b.id, { subtitle: e.target.value })}
                          className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Texto del botón</label>
                        <input value={b.props.primaryBtnText || ''} onChange={e => updateElProps('body', b.id, { primaryBtnText: e.target.value })}
                          className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                      </div>
                      <button onClick={() => removeExtraBanner(b.id)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-rose-200 text-xs font-medium text-rose-400 hover:bg-rose-50 transition-all">
                        <Trash2 size={13} /> Eliminar banner
                      </button>
                    </div>
                  </AccordionRow>
                ))}

                <input ref={extraFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f && extraFileTarget) handleExtraBannerImagePick(f, extraFileTarget); }} />

                <button onClick={addExtraBanner} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-cyan/40 hover:text-petroleum transition-all">
                  <Plus size={14} /> Nuevo banner
                </button>
              </div>
            </div>
          )}

          {tab === 'productos' && productGridEl && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Productos</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">Estos son productos de muestra. Cuando agregues los tuyos en el siguiente paso, reemplazarán automáticamente esta vista.</p>
              </div>

              <div className="space-y-2.5">
                <AccordionRow
                  isOpen={openSection === 'diseno-tarjetas'}
                  onToggle={() => toggleSection('diseno-tarjetas')}
                  label="Diseño de las tarjetas"
                  desc="Forma, etiqueta y categoría"
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><Tag size={13} /></span>}
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Forma de las tarjetas</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CARD_SHAPES.map(shape => (
                          <button
                            key={shape.key}
                            onClick={() => updateElProps('body', productGridEl.id, { cardShape: shape.key })}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                              (productGridEl.props.cardShape || 'soft') === shape.key ? 'border-cyan/60 bg-cyan/5 ring-1 ring-cyan/20' : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <span className="h-7 w-9 bg-gray-300" style={{ borderRadius: shape.radius }} />
                            <span className="text-[10px] font-medium text-gray-600">{shape.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Texto de la etiqueta</label>
                      <input value={productGridEl.props.badgeText || ''} onChange={e => updateElProps('body', productGridEl.id, { badgeText: e.target.value })}
                        placeholder="Destacado" className="w-full p-3 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                    </div>
                    <button
                      onClick={() => updateElProps('body', productGridEl.id, { showCategory: productGridEl.props.showCategory === false })}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        {productGridEl.props.showCategory === false ? <EyeOff size={15} className="text-gray-400" /> : <Eye size={15} className="text-petroleum" />}
                        Mostrar categoría
                      </span>
                      <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${productGridEl.props.showCategory === false ? 'bg-gray-200' : 'bg-cyan'}`}>
                        <span className={`h-4 w-4 rounded-full bg-white block transition-transform ${productGridEl.props.showCategory === false ? '' : 'translate-x-4'}`} />
                      </span>
                    </button>
                  </div>
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'seccion'}
                  onToggle={() => toggleSection('seccion')}
                  label="Título de la sección"
                  desc={productGridEl.props.title || 'Novedades'}
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><Type size={13} /></span>}
                >
                  <input value={productGridEl.props.title || ''} onChange={e => updateElProps('body', productGridEl.id, { title: e.target.value })}
                    className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'productos-individuales'}
                  onToggle={() => toggleSection('productos-individuales')}
                  label="Productos individuales"
                  desc={`${(productGridEl.props.products || []).length} productos de muestra`}
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><ShoppingBag size={13} /></span>}
                >
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-400 font-light ml-1">Arrastra desde el ícono <GripVertical size={11} className="inline -mt-0.5" /> para cambiar el orden en que aparecen.</p>
                    {(productGridEl.props.products || []).slice(0, 4).map((p: any, i: number) => (
                      <div key={i} className={`flex items-center gap-2 p-3 rounded-xl bg-gray-50/60 transition-opacity ${draggedProductIndex === i ? 'opacity-40' : ''}`}>
                        <span
                          onPointerDown={e => handleProductGripPointerDown(e, i)}
                          style={{ touchAction: 'none' }}
                          className="h-8 w-6 shrink-0 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical size={14} />
                        </span>
                        <button onClick={() => { setProductFileTarget(i); productFileRef.current?.click(); }}
                          className="h-12 w-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-300 overflow-hidden shrink-0">
                          {uploadingProduct === i ? <Loader2 size={14} className="animate-spin" /> : p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ImageIcon size={14} />}
                        </button>
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <input value={p.name || ''} onChange={e => updateProduct(i, { name: e.target.value })}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs font-medium focus:border-cyan/40 transition-all" placeholder="Nombre" />
                          <input value={p.price || ''} onChange={e => updateProduct(i, { price: e.target.value })}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs font-medium focus:border-cyan/40 transition-all" placeholder="Precio" />
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionRow>
              </div>

              <input ref={productFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f && productFileTarget !== null) handleProductImagePick(f, productFileTarget);
              }} />
            </div>
          )}
        </div>
        )}

        {panelCollapsed && (
          <button
            onClick={() => setPanelCollapsed(false)}
            title="Mostrar panel"
            className="self-start mt-5 h-9 w-9 rounded-r-xl bg-white border border-l-0 border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-petroleum hover:bg-gray-50 transition-colors shrink-0"
          >
            <ChevronsRight size={15} />
          </button>
        )}

        {/* VISTA PREVIA */}
        <div className="flex-1 bg-gray-100/60 overflow-y-auto flex justify-center p-8">
          <div className={`bg-white rounded-[1.25rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.15)] overflow-hidden shrink-0 h-fit transition-all ${device === 'desktop' ? 'w-full max-w-[1100px]' : 'w-[400px]'}`}>
            <div className="h-10 bg-gray-50 flex items-center gap-2 px-4 border-b border-gray-200">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </div>
            <div className="relative">
              {navbarEl && <SmartNavbar props={previewNavbarProps} />}

              {(draft.body?.elements || []).map((el: any) => {
                if (el.type === 'hero-banner') {
                  const isExtra = !!el.props?.isExtra;
                  return (
                    <div
                      key={el.id}
                      className={`relative transition-opacity ${draggedBannerId === el.id ? 'opacity-40' : ''}`}
                    >
                      {isExtra && (
                        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                          <span
                            onPointerDown={e => handleBannerGripPointerDown(e, el.id)}
                            title="Arrastra para mover este banner"
                            className="h-8 w-8 rounded-full bg-black/45 backdrop-blur flex items-center justify-center text-white cursor-grab active:cursor-grabbing touch-none"
                            style={{ touchAction: 'none' }}
                          >
                            <GripVertical size={14} />
                          </span>
                          <button onClick={() => removeExtraBanner(el.id)} className="h-8 w-8 rounded-full bg-black/45 backdrop-blur hover:bg-rose-500 flex items-center justify-center text-white transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                      <SmartHero props={{ ...el.props, variant: el.props.variant || storeVariant, colors: storeColors, fontFamily: storeFontFamily }} />
                    </div>
                  );
                }
                if (el.type === 'product-grid') {
                  return (
                    <div key={el.id}>
                      <SmartProductGrid props={{ ...el.props, variant: el.props.variant || storeVariant, colors: storeColors, fontFamily: storeFontFamily }} />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* El <input type="color"> nativo no redondea su swatch interno solo
          con border-radius en el elemento: hay que apuntarle directamente a
          los pseudo-elementos del navegador. */}
      <style jsx global>{`
        input.color-swatch-round::-webkit-color-swatch-wrapper {
          padding: 0;
          border-radius: 9999px;
          overflow: hidden;
        }
        input.color-swatch-round::-webkit-color-swatch {
          border: none;
          border-radius: 9999px;
        }
        input.color-swatch-round::-moz-color-swatch {
          border: none;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}

export default function TemplateEditorPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]"><Loader2 size={28} className="animate-spin text-petroleum" /></div>}>
      <EditorContent />
    </Suspense>
  );
}
