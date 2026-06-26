"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Check, Loader2, Image as ImageIcon, Type, LayoutTemplate, ShoppingBag,
  Menu as MenuIcon, Palette, Plus, Trash2, Monitor, Smartphone, Sparkles, ChevronDown, Tag, Eye, EyeOff,
  ChevronsLeft, ChevronsRight, GripVertical, PanelBottom, MoveVertical, MoveHorizontal
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { SmartNavbar, SmartHero, SmartProductGrid, SmartFooter, SmartContactForm, SmartProductDetail, SmartHeritageBlock, EditorPreviewNavProvider, EXTRA_ICON_OPTIONS } from '@/components/dashboard/studio/HighFidelityBlocks';
import { buildDefaultBodyElements } from '@/lib/default-page-schemas';

type TabKey = 'marca' | 'menu' | 'estilo-superior' | 'estilo' | 'banner' | 'productos' | 'footer' | 'estilo-final';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'marca', label: 'Marca y logo', icon: ImageIcon },
  { key: 'menu', label: 'Menú', icon: MenuIcon },
  { key: 'estilo-superior', label: 'Estilo del menú', icon: Palette },
  { key: 'estilo', label: 'Estilo visual', icon: Palette },
  { key: 'banner', label: 'Banners', icon: LayoutTemplate },
  { key: 'productos', label: 'Productos', icon: ShoppingBag },
  { key: 'footer', label: 'Pie de página', icon: PanelBottom },
  { key: 'estilo-final', label: 'Estilo del pie', icon: Palette },
];

// La página se edita en 3 bloques que reflejan dónde aparece cada cosa en
// la tienda publicada: arriba del todo (navbar), el cuerpo (todo lo demás)
// y el cierre (footer). Cada bloque tiene su PROPIO color/tipografía/tamaño,
// independiente de los otros dos — así el menú puede ser negro y el pie azul.
const TAB_GROUPS: { group: string; desc: string; keys: TabKey[] }[] = [
  { group: 'Superior', desc: 'El menú de navegación', keys: ['marca', 'menu', 'estilo-superior'] },
  { group: 'Centro', desc: 'Estilo, banners y productos', keys: ['estilo', 'banner', 'productos'] },
  { group: 'Final', desc: 'El pie de página', keys: ['footer', 'estilo-final'] },
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

// El tamaño de tipografía ya no es chico/mediano/grande fijo: es un
// porcentaje continuo (100 = tamaño original de la plantilla) que se
// multiplica contra el tamaño base de cada texto en HighFidelityBlocks.
const FONT_SIZE_MIN = 60;
const FONT_SIZE_MAX = 160;
const FONT_SIZE_DEFAULT = 100;

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

// Editor de colores/tipografía/tamaño reutilizado en Superior, Centro y
// Final: cada sección de la página guarda su propio estilo (independiente
// de las otras), pero el control visual es el mismo en los 3 lugares.
const STYLE_COLOR_ROWS = [
  { key: 'principal', label: 'Color principal', desc: 'Títulos y textos destacados', colorKey: 'primary' as const },
  { key: 'secundario', label: 'Color secundario', desc: 'Etiquetas y detalles sutiles', colorKey: 'secondary' as const },
  { key: 'boton', label: 'Color de botones', desc: 'Botones de compra y llamados a la acción', colorKey: 'button' as const },
  { key: 'texto-color', label: 'Color de texto', desc: 'Subtítulos y textos normales', colorKey: 'text' as const },
];

const StyleEditorPanel = ({
  prefix, colors, fontFamily, fontSize, updateColor, setFontFamily, setFontSize, openSection, toggleSection,
  onlyPrimaryColor = false, position, setPosition, navSize, setNavSize, horizontalPosition, setHorizontalPosition,
  hideTypography = false,
}: {
  prefix: string;
  colors: { primary: string; secondary: string; button: string; text: string };
  fontFamily?: string;
  fontSize: number;
  updateColor: (key: 'primary' | 'secondary' | 'button' | 'text', value: string) => void;
  setFontFamily: (value: string) => void;
  setFontSize: (value: number) => void;
  openSection: string | null;
  toggleSection: (key: string) => void;
  onlyPrimaryColor?: boolean;
  navSize?: number;
  setNavSize?: (value: number) => void;
  position?: number;
  setPosition?: (value: number) => void;
  horizontalPosition?: number;
  setHorizontalPosition?: (value: number) => void;
  hideTypography?: boolean;
}) => (
  <div className="space-y-2.5">
    {(onlyPrimaryColor ? STYLE_COLOR_ROWS.filter(r => r.colorKey === 'primary') : STYLE_COLOR_ROWS).map(row => (
      <AccordionRow
        key={row.key}
        isOpen={openSection === `${prefix}-${row.key}`}
        onToggle={() => toggleSection(`${prefix}-${row.key}`)}
        label={row.label}
        desc={row.desc}
        preview={<span className="h-7 w-7 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: colors[row.colorKey] }} />}
      >
        <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-transparent focus-within:border-cyan/40 transition-all">
          <input type="color" value={colors[row.colorKey]} onChange={e => updateColor(row.colorKey, e.target.value)} className="h-10 w-10 rounded-full cursor-pointer border-none bg-transparent shrink-0 color-swatch-round" />
          <input value={colors[row.colorKey]} onChange={e => updateColor(row.colorKey, e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-medium uppercase tracking-wide text-gray-700" />
        </div>
      </AccordionRow>
    ))}

    {!hideTypography && (
      <AccordionRow
        isOpen={openSection === `${prefix}-tipografia`}
        onToggle={() => toggleSection(`${prefix}-tipografia`)}
        label="Tipografía"
        desc={FONT_OPTIONS.find(f => f.value === fontFamily)?.label || 'Inter'}
        preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><Type size={14} /></span>}
      >
        <div className="space-y-2">
          {FONT_OPTIONS.map(f => (
            <button
              key={f.value}
              onClick={() => setFontFamily(f.value)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                fontFamily === f.value ? 'border-cyan/60 bg-cyan/5 ring-1 ring-cyan/20' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span>
                <p className="text-base text-gray-900" style={{ fontFamily: f.value }}>{f.label}</p>
                <p className="text-[11px] text-gray-400 font-light">{f.desc}</p>
              </span>
              {fontFamily === f.value && <Check size={16} className="text-petroleum shrink-0" />}
            </button>
          ))}
        </div>
      </AccordionRow>
    )}

    {!hideTypography && (
      <AccordionRow
        isOpen={openSection === `${prefix}-tamano`}
        onToggle={() => toggleSection(`${prefix}-tamano`)}
        label="Tamaño de tipografía"
        desc={`${fontSize}%`}
        preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400 font-black text-[11px]">Aa</span>}
      >
        <div className="flex items-center gap-4 px-1">
          <span className="text-xs font-black text-gray-400 shrink-0" style={{ fontSize: '11px' }}>Aa</span>
          <input
            type="range"
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full bg-gray-200 accent-cyan cursor-pointer"
          />
          <span className="text-2xl font-black text-gray-700 shrink-0" style={{ fontSize: '26px' }}>Aa</span>
        </div>
        <p className="text-center text-xs font-medium text-gray-500 mt-3">{fontSize}%</p>
      </AccordionRow>
    )}

    {setHorizontalPosition && (
      <AccordionRow
        isOpen={openSection === `${prefix}-posicion-h`}
        onToggle={() => toggleSection(`${prefix}-posicion-h`)}
        label="Posición horizontal"
        desc="Mueve el texto a la izquierda o derecha"
        preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><MoveHorizontal size={14} /></span>}
      >
        <div className="flex items-center gap-4 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Izquierda</span>
          <input
            type="range"
            min={-60}
            max={60}
            value={horizontalPosition ?? 0}
            onChange={e => setHorizontalPosition(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full bg-gray-200 accent-cyan cursor-pointer"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Derecha</span>
        </div>
      </AccordionRow>
    )}

    {setPosition && (
      <AccordionRow
        isOpen={openSection === `${prefix}-posicion`}
        onToggle={() => toggleSection(`${prefix}-posicion`)}
        label="Posición"
        desc="Sube o baja toda la sección"
        preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><MoveVertical size={14} /></span>}
      >
        <div className="flex items-center gap-4 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Abajo</span>
          <input
            type="range"
            min={-30}
            max={30}
            value={position ?? 0}
            onChange={e => setPosition(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full bg-gray-200 accent-cyan cursor-pointer"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Arriba</span>
        </div>
      </AccordionRow>
    )}

    {setNavSize && (
      <AccordionRow
        isOpen={openSection === `${prefix}-navsize`}
        onToggle={() => toggleSection(`${prefix}-navsize`)}
        label="Tamaño del navbar"
        desc={`${navSize ?? 100}%`}
        preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><LayoutTemplate size={14} /></span>}
      >
        <div className="flex items-center gap-4 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Chico</span>
          <input
            type="range"
            min={40}
            max={160}
            value={navSize ?? 100}
            onChange={e => setNavSize(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full bg-gray-200 accent-cyan cursor-pointer"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Grande</span>
        </div>
        <p className="text-center text-xs font-medium text-gray-500 mt-3">{navSize ?? 100}%</p>
      </AccordionRow>
    )}
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

  // La tienda todavía no está publicada (no hay slug real), así que el menú
  // no puede navegar a una URL — en su lugar cambia esta vista previa local
  // entre las 4 páginas que el onboarding ya publica al terminar, usando el
  // mismo contenido por defecto (buildDefaultBodyElements) que se instala
  // de verdad en catálogo/nosotros/producto.
  const [previewView, setPreviewView] = useState<'home' | 'catalog' | 'about' | 'product'>('home');
  const previewScrollRef = useRef<HTMLDivElement>(null);
  // Si el comerciante estaba scrolleado hacia abajo en una página y cambia
  // de vista desde el menú, sin esto el contenido nuevo cambia pero la
  // posición de scroll queda igual — da la sensación de que "no pasó nada".
  useEffect(() => { previewScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [previewView]);

  useEffect(() => {
    if (!token || !templateId) return;
    fetch(`${apiBase}/web-templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then((list: any[]) => {
        const tpl = (list || []).find(t => t.id === templateId);
        if (!tpl) { setLoading(false); return; }
        setTemplateName(tpl.name);
        const overrideRaw = sessionStorage.getItem(`bayup_ob_schema_override_${templateId}`);
        const schema = JSON.parse(JSON.stringify(overrideRaw ? JSON.parse(overrideRaw) : tpl.schema_data));
        // Sin override guardado todavía: normalizamos el menú a los items
        // estándar de e-commerce (igual que en app/onboarding/page.tsx), para
        // que lo que se edita aquí coincida con lo que finalmente se publica.
        if (!overrideRaw) {
          const navbarEl = (schema?.header?.elements || []).find((el: any) => el.type === 'navbar');
          if (navbarEl) navbarEl.props = { ...navbarEl.props, menuItems: ['Inicio', 'Colecciones', 'Productos', 'Nosotros'] };
        }
        setDraft(schema);
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

  const updateElProps = (section: 'header' | 'body' | 'footer', elId: string, patch: Record<string, any>) => {
    setDraft((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        elements: prev[section].elements.map((el: any) => el.id === elId ? { ...el, props: { ...el.props, ...patch } } : el),
      },
    }));
  };

  // Cada zona de la página (Superior=navbar, Centro=hero/banners/productos,
  // Final=footer) guarda su propio color/tipografía/tamaño en el elemento
  // que la representa, totalmente independiente de las otras dos zonas.
  const buildStyleControls = (section: 'header' | 'body' | 'footer', el: any) => {
    const colors = { ...DEFAULT_COLORS, ...(el?.props?.colors || {}) };
    const fontFamily: string | undefined = el?.props?.fontFamily;
    const fontSize: number = typeof el?.props?.fontSize === 'number' ? el.props.fontSize : FONT_SIZE_DEFAULT;
    const updateColor = (key: 'primary' | 'secondary' | 'button' | 'text', value: string) => {
      if (el) updateElProps(section, el.id, { colors: { ...colors, [key]: value } });
    };
    const setFontFamily = (value: string) => { if (el) updateElProps(section, el.id, { fontFamily: value }); };
    const setFontSize = (value: number) => { if (el) updateElProps(section, el.id, { fontSize: value }); };
    return { colors, fontFamily, fontSize, updateColor, setFontFamily, setFontSize };
  };

  const navStyle = buildStyleControls('header', navbarEl);
  const centroStyle = buildStyleControls('body', heroEl);
  const footerStyle = buildStyleControls('footer', footerEl);

  // Posición vertical del menú: a la derecha se desplaza hacia arriba
  // (translateY negativo), a la izquierda hacia abajo (translateY positivo).
  const navPosition: number = typeof navbarEl?.props?.position === 'number' ? navbarEl.props.position : 0;
  const setNavPosition = (value: number) => navbarEl && updateElProps('header', navbarEl.id, { position: value });

  // Tamaño del navbar: porcentaje sobre su alto base (96px), a la derecha
  // crece, a la izquierda se achica.
  const navSize: number = typeof navbarEl?.props?.navSize === 'number' ? navbarEl.props.navSize : 100;
  const setNavSize = (value: number) => navbarEl && updateElProps('header', navbarEl.id, { navSize: value });

  // Posición horizontal del texto del logo: a la derecha se mueve a la
  // derecha, a la izquierda se mueve a la izquierda.
  const navHorizontalPosition: number = typeof navbarEl?.props?.horizontalPosition === 'number' ? navbarEl.props.horizontalPosition : 0;
  const setNavHorizontalPosition = (value: number) => navbarEl && updateElProps('header', navbarEl.id, { horizontalPosition: value });

  // Tamaño y posición de la imagen del logo (independiente del texto del
  // nombre de la tienda): tamaño en %, y desplazamiento vertical/horizontal
  // en px para poder subirlo/bajarlo o moverlo a la izquierda/derecha.
  const logoSize: number = typeof navbarEl?.props?.logoSize === 'number' ? navbarEl.props.logoSize : 100;
  const setLogoSize = (value: number) => navbarEl && updateElProps('header', navbarEl.id, { logoSize: value });
  const logoOffsetY: number = typeof navbarEl?.props?.logoOffsetY === 'number' ? navbarEl.props.logoOffsetY : 0;
  const setLogoOffsetY = (value: number) => navbarEl && updateElProps('header', navbarEl.id, { logoOffsetY: value });
  const logoOffsetX: number = typeof navbarEl?.props?.logoOffsetX === 'number' ? navbarEl.props.logoOffsetX : 0;
  const setLogoOffsetX = (value: number) => navbarEl && updateElProps('header', navbarEl.id, { logoOffsetX: value });

  // Estilo de los ÍTEMS del menú (Mujer/Hombre/...), totalmente separado del
  // logo: se guarda en sus propias claves (itemsColors/itemsFontFamily/...)
  // para que cambiarlo desde la pestaña "Menú" no toque el logo ni el resto
  // del navbar, y viceversa desde "Estilo del menú".
  const itemsColors = { ...DEFAULT_COLORS, ...(navbarEl?.props?.itemsColors || {}) };
  const updateItemsColor = (key: 'primary' | 'secondary' | 'button' | 'text', value: string) => {
    if (navbarEl) updateElProps('header', navbarEl.id, { itemsColors: { ...itemsColors, [key]: value } });
  };
  const itemsFontFamily: string | undefined = navbarEl?.props?.itemsFontFamily;
  const setItemsFontFamily = (value: string) => { if (navbarEl) updateElProps('header', navbarEl.id, { itemsFontFamily: value }); };
  const itemsFontSize: number = typeof navbarEl?.props?.itemsFontSize === 'number' ? navbarEl.props.itemsFontSize : FONT_SIZE_DEFAULT;
  const setItemsFontSize = (value: number) => { if (navbarEl) updateElProps('header', navbarEl.id, { itemsFontSize: value }); };
  const itemsHorizontalPosition: number = typeof navbarEl?.props?.itemsHorizontalPosition === 'number' ? navbarEl.props.itemsHorizontalPosition : 0;
  const setItemsHorizontalPosition = (value: number) => { if (navbarEl) updateElProps('header', navbarEl.id, { itemsHorizontalPosition: value }); };
  const itemsVerticalPosition: number = typeof navbarEl?.props?.itemsVerticalPosition === 'number' ? navbarEl.props.itemsVerticalPosition : 0;
  const setItemsVerticalPosition = (value: number) => { if (navbarEl) updateElProps('header', navbarEl.id, { itemsVerticalPosition: value }); };

  // Color de fondo de la barra completa del navbar (distinto del color de
  // texto/logo) y los íconos que aparecen a la derecha (carrito, cuenta, y
  // hasta 3 íconos extra elegibles de una lista corta).
  const barColor: string = navbarEl?.props?.barColor || '#FFFFFF';
  const setBarColor = (value: string) => navbarEl && updateElProps('header', navbarEl.id, { barColor: value });
  const showCartIcon: boolean = navbarEl?.props?.showCartIcon !== false;
  const showAccountIcon: boolean = navbarEl?.props?.showAccountIcon !== false;
  const extraIcons: string[] = navbarEl?.props?.extraIcons || [];
  const toggleCartIcon = () => navbarEl && updateElProps('header', navbarEl.id, { showCartIcon: !showCartIcon });
  const toggleAccountIcon = () => navbarEl && updateElProps('header', navbarEl.id, { showAccountIcon: !showAccountIcon });
  const toggleExtraIcon = (key: string) => {
    if (!navbarEl) return;
    const next = extraIcons.includes(key) ? extraIcons.filter(k => k !== key) : [...extraIcons, key];
    updateElProps('header', navbarEl.id, { extraIcons: next });
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

  // Sin nombre de tienda todavía no mostramos el de muestra de la plantilla
  // (ej. "Footwear Collection") — vacío de verdad hasta que el comerciante
  // escriba el suyo, para no confundirlo pensando que ya quedó guardado.
  const previewNavbarProps = { ...navbarEl?.props, logoText: storeName.trim(), logoUrl: logoPreview || undefined };

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
        {/* RAIL DE PESTAÑAS, agrupado por la zona real de la página que edita */}
        <div className="w-[240px] bg-white border-r border-gray-100 shrink-0 p-3 space-y-5 overflow-y-auto">
          {TAB_GROUPS.map(g => (
            <div key={g.group} className="space-y-1">
              <div className="px-4 pt-1 pb-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">{g.group}</p>
                <p className="text-[10px] text-gray-300 font-light">{g.desc}</p>
              </div>
              {g.keys.map(key => {
                const t = TABS.find(tb => tb.key === key)!;
                return (
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
                );
              })}
            </div>
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

              <div className="space-y-2.5 pt-2">
                <AccordionRow
                  isOpen={openSection === 'logo-tamano'}
                  onToggle={() => toggleSection('logo-tamano')}
                  label="Tamaño del logo"
                  desc={`${logoSize}%`}
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><ImageIcon size={13} /></span>}
                >
                  <div className="flex items-center gap-4 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Chico</span>
                    <input type="range" min={50} max={200} value={logoSize} onChange={e => setLogoSize(Number(e.target.value))} className="flex-1 h-1.5 rounded-full bg-gray-200 accent-cyan cursor-pointer" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Grande</span>
                  </div>
                  <p className="text-center text-xs font-medium text-gray-500 mt-3">{logoSize}%</p>
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'logo-posicion-v'}
                  onToggle={() => toggleSection('logo-posicion-v')}
                  label="Posición vertical"
                  desc="Sube o baja el logo"
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><MoveVertical size={13} /></span>}
                >
                  <div className="flex items-center gap-4 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Abajo</span>
                    <input type="range" min={-30} max={30} value={logoOffsetY} onChange={e => setLogoOffsetY(Number(e.target.value))} className="flex-1 h-1.5 rounded-full bg-gray-200 accent-cyan cursor-pointer" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Arriba</span>
                  </div>
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'logo-posicion-h'}
                  onToggle={() => toggleSection('logo-posicion-h')}
                  label="Posición horizontal"
                  desc="Mueve el logo a la izquierda o derecha"
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><MoveHorizontal size={13} /></span>}
                >
                  <div className="flex items-center gap-4 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Izquierda</span>
                    <input type="range" min={-30} max={30} value={logoOffsetX} onChange={e => setLogoOffsetX(Number(e.target.value))} className="flex-1 h-1.5 rounded-full bg-gray-200 accent-cyan cursor-pointer" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Derecha</span>
                  </div>
                </AccordionRow>
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

              <div className="space-y-1 pt-3">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Estilo de estos ítems</p>
                <p className="text-[11px] text-gray-400 font-light ml-1">Solo afecta Mujer/Hombre/Niños/Ofertas — no toca el logo ni el resto del navbar.</p>
              </div>
              <StyleEditorPanel
                prefix="superior-menu"
                colors={itemsColors}
                fontFamily={itemsFontFamily}
                fontSize={itemsFontSize}
                updateColor={updateItemsColor}
                setFontFamily={setItemsFontFamily}
                setFontSize={setItemsFontSize}
                openSection={openSection}
                toggleSection={toggleSection}
                onlyPrimaryColor
                horizontalPosition={itemsHorizontalPosition}
                setHorizontalPosition={setItemsHorizontalPosition}
                position={itemsVerticalPosition}
                setPosition={setItemsVerticalPosition}
              />
            </div>
          )}

          {tab === 'estilo-superior' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Estilo del menú</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">Color y tipografía solo del menú de navegación, independiente del resto de la página.</p>
              </div>
              <StyleEditorPanel
                prefix="superior"
                colors={navStyle.colors}
                fontFamily={navStyle.fontFamily}
                fontSize={navStyle.fontSize}
                updateColor={navStyle.updateColor}
                setFontFamily={navStyle.setFontFamily}
                setFontSize={navStyle.setFontSize}
                openSection={openSection}
                toggleSection={toggleSection}
                onlyPrimaryColor
                hideTypography
                position={navPosition}
                setPosition={setNavPosition}
                navSize={navSize}
                setNavSize={setNavSize}
              />

              <div className="space-y-2.5">
                <AccordionRow
                  isOpen={openSection === 'superior-bar-color'}
                  onToggle={() => toggleSection('superior-bar-color')}
                  label="Color de la barra"
                  desc="Fondo completo del navbar"
                  preview={<span className="h-7 w-7 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: barColor }} />}
                >
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-transparent focus-within:border-cyan/40 transition-all">
                    <input type="color" value={barColor} onChange={e => setBarColor(e.target.value)} className="h-10 w-10 rounded-full cursor-pointer border-none bg-transparent shrink-0 color-swatch-round" />
                    <input value={barColor} onChange={e => setBarColor(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-medium uppercase tracking-wide text-gray-700" />
                  </div>
                </AccordionRow>

                <AccordionRow
                  isOpen={openSection === 'superior-iconos'}
                  onToggle={() => toggleSection('superior-iconos')}
                  label="Íconos de la barra"
                  desc="Carrito, cuenta y otros íconos"
                  preview={<span className="h-7 w-7 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center text-gray-400"><ShoppingBag size={13} /></span>}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <button onClick={toggleCartIcon} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-colors">
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          {showCartIcon ? <Eye size={15} className="text-petroleum" /> : <EyeOff size={15} className="text-gray-400" />} Carrito
                        </span>
                        <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${showCartIcon ? 'bg-cyan' : 'bg-gray-200'}`}>
                          <span className={`h-4 w-4 rounded-full bg-white block transition-transform ${showCartIcon ? 'translate-x-4' : ''}`} />
                        </span>
                      </button>
                      <button onClick={toggleAccountIcon} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-colors">
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          {showAccountIcon ? <Eye size={15} className="text-petroleum" /> : <EyeOff size={15} className="text-gray-400" />} Cuenta de cliente
                        </span>
                        <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${showAccountIcon ? 'bg-cyan' : 'bg-gray-200'}`}>
                          <span className={`h-4 w-4 rounded-full bg-white block transition-transform ${showAccountIcon ? 'translate-x-4' : ''}`} />
                        </span>
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Agregar ícono</label>
                      <div className="grid grid-cols-3 gap-2">
                        {EXTRA_ICON_OPTIONS.map(opt => {
                          const active = extraIcons.includes(opt.key);
                          return (
                            <button
                              key={opt.key}
                              onClick={() => toggleExtraIcon(opt.key)}
                              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${active ? 'border-cyan/60 bg-cyan/5 ring-1 ring-cyan/20' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                              <opt.Icon size={16} className={active ? 'text-petroleum' : 'text-gray-400'} />
                              <span className="text-[10px] font-medium text-gray-600">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </AccordionRow>
              </div>
            </div>
          )}

          {tab === 'estilo' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Estilo visual</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">Color y tipografía del banner principal, los banners adicionales y la grilla de productos — independiente del menú y del pie de página.</p>
              </div>
              <StyleEditorPanel
                prefix="centro"
                colors={centroStyle.colors}
                fontFamily={centroStyle.fontFamily}
                fontSize={centroStyle.fontSize}
                updateColor={centroStyle.updateColor}
                setFontFamily={centroStyle.setFontFamily}
                setFontSize={centroStyle.setFontSize}
                openSection={openSection}
                toggleSection={toggleSection}
              />
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

          {tab === 'footer' && footerEl && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Pie de página</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">El cierre de tu página: descripción de la tienda y ubicación. El nombre se toma automáticamente de "Marca y logo".</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Descripción corta</label>
                <textarea rows={3} value={footerEl.props.description || ''} onChange={e => updateElProps('footer', footerEl.id, { description: e.target.value })}
                  className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Ubicación</label>
                <input value={footerEl.props.location || ''} onChange={e => updateElProps('footer', footerEl.id, { location: e.target.value })}
                  placeholder="Bogotá, Colombia"
                  className="w-full p-3.5 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white" />
              </div>
            </div>
          )}

          {tab === 'estilo-final' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#0A1A1A]">Estilo del pie</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">Color y tipografía solo del pie de página, independiente del resto de la tienda.</p>
              </div>
              <StyleEditorPanel
                prefix="final"
                colors={footerStyle.colors}
                fontFamily={footerStyle.fontFamily}
                fontSize={footerStyle.fontSize}
                updateColor={footerStyle.updateColor}
                setFontFamily={footerStyle.setFontFamily}
                setFontSize={footerStyle.setFontSize}
                openSection={openSection}
                toggleSection={toggleSection}
              />
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
        <div ref={previewScrollRef} className="flex-1 bg-gray-100/60 overflow-y-auto flex justify-center p-8">
          <div className={`bg-white rounded-[1.25rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.15)] overflow-hidden shrink-0 h-fit transition-all ${device === 'desktop' ? 'w-full max-w-[1100px]' : 'w-[400px]'}`}>
            <div className="h-10 bg-gray-50 flex items-center gap-2 px-4 border-b border-gray-200">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </div>
            <div className="relative">
              <EditorPreviewNavProvider value={setPreviewView}>
                {navbarEl && (
                  <div style={navPosition ? { transform: `translateY(${-navPosition}px)`, position: 'relative', zIndex: 50 } : undefined}>
                    <SmartNavbar props={previewNavbarProps} />
                  </div>
                )}

                {previewView !== 'home' && (
                  <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 text-center">
                    <p className="text-[11px] font-medium text-amber-700">
                      Vista previa de <strong>{previewView === 'catalog' ? 'Colecciones' : previewView === 'about' ? 'Nosotros' : 'Producto'}</strong> — así se ve esta página por defecto. Volvé a "Inicio" para seguir editando el banner principal.
                    </p>
                  </div>
                )}

                {previewView === 'home' && (draft.body?.elements || []).map((el: any) => {
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
                        <SmartHero props={{ ...el.props, variant: el.props.variant || storeVariant, colors: centroStyle.colors, fontFamily: centroStyle.fontFamily, fontSize: centroStyle.fontSize }} />
                      </div>
                    );
                  }
                  if (el.type === 'product-grid') {
                    return (
                      <div key={el.id}>
                        <SmartProductGrid props={{ ...el.props, variant: el.props.variant || storeVariant, colors: centroStyle.colors, fontFamily: centroStyle.fontFamily, fontSize: centroStyle.fontSize }} />
                      </div>
                    );
                  }
                  return null;
                })}

                {previewView !== 'home' && buildDefaultBodyElements(previewView).map((el: any) => {
                  const sharedProps = { ...el.props, variant: storeVariant, colors: centroStyle.colors, fontFamily: centroStyle.fontFamily, fontSize: centroStyle.fontSize };
                  if (el.type === 'hero-banner') return <SmartHero key={el.id} props={{ ...sharedProps, imageUrl: heroEl?.props?.imageUrl }} />;
                  if (el.type === 'product-grid') return <SmartProductGrid key={el.id} props={{ ...sharedProps, products: productGridEl?.props?.products || [] }} />;
                  if (el.type === 'text-block-premium') return <SmartHeritageBlock key={el.id} props={sharedProps} />;
                  if (el.type === 'contact-form') return <SmartContactForm key={el.id} props={sharedProps} />;
                  if (el.type === 'product-detail') return <SmartProductDetail key={el.id} product={productGridEl?.props?.products?.[0]} variant={storeVariant as any} />;
                  return null;
                })}

                {footerEl && <SmartFooter props={{ ...footerEl.props, logoText: storeName.trim() || footerEl.props.logoText, variant: footerEl.props.variant || storeVariant }} />}
              </EditorPreviewNavProvider>
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
