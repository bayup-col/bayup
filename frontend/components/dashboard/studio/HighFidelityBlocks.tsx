"use client";

import React from 'react';
import { 
  ShoppingBag, User, Search, Terminal, Grid, ArrowRight, PlayCircle, 
  ChevronLeft, ChevronRight, ChevronDown, ShoppingCart, Verified, Truck, Headset,
  Facebook, Instagram, Twitter, Languages, Mail, Share2, ShieldCheck,
  LayoutGrid, Heart, Camera, Send, Ruler, MapPin, Globe, CheckCheck, Loader2, X, Plus, Minus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';

/**
 * COMPONENTES DE ALTA FIDELIDAD - ESPECIALIZADOS POR MARCA
 */

// --- Sistema de variantes visuales ---
// Cada plantilla de tienda declara `variant` en los props de su navbar/hero
// (architecture.json) y ese valor se propaga a los demas bloques via
// `useVariant()`. Con 9 variantes conocidas un mapa de estilos por variante
// es suficiente: no se necesita un motor de theming generico.
export type StoreVariant =
  | "luxury"      // joyeria, ropa elegante: serif italica, acento ambar, outline fino
  | "intimate"    // lenceria: serif suave, acento violeta/rose, formas redondeadas
  | "streetwear"  // tenis: display condensada en mayusculas, alto contraste, CTA solido en bloque
  | "flash"       // pocket: display condensada urgente, acento rojo, CTA tipo sticker
  | "tech"        // tecnologia, computadora: geometrica, bordes rectos, acento cyan/azul
  | "playful"     // jugueteria: redondeada, colorida, formas burbuja
  | "editorial"   // hogar, papeleria: serif calido editorial, acento tierra
  | "glow"        // maquillaje: display suave, acento rosa/fucsia, botones pill con gradiente
  | "family";     // zapatos: sans robusta, acento terracota, formas amigables

// Íconos extra que el comerciante puede agregar a la derecha del navbar
// (favoritos, buscar, idioma, etc.), elegidos a mano en el editor. Se
// exporta la misma lista para que el editor de onboarding use exactamente
// estos mismos íconos/etiquetas en su selector, sin duplicar imports.
export const EXTRA_ICON_OPTIONS: { key: string; label: string; Icon: any }[] = [
  { key: 'heart', label: 'Favoritos', Icon: Heart },
  { key: 'search', label: 'Buscar', Icon: Search },
  { key: 'globe', label: 'Idioma', Icon: Globe },
  { key: 'mail', label: 'Correo', Icon: Mail },
  { key: 'share2', label: 'Compartir', Icon: Share2 },
];

const VariantContext = React.createContext<StoreVariant>("luxury");
const useVariant = () => React.useContext(VariantContext);

interface VariantStyle {
  // tipografia
  display: string;        // clase de fuente para titulares
  displayWeight: string;  // peso/transform del titular (uppercase, italic, etc.)
  body: string;           // clase de fuente para parrafos/labels
  // color de acento (texto, bordes, detalles)
  accentText: string;
  accentTextHover: string; // clase hover: completa (Tailwind JIT no detecta interpolacion de strings)
  accentBorder: string;
  accentBg: string;
  accentBgSoft: string;
  // botones primarios (hero, CTAs principales)
  btnPrimary: string;
  // botones secundarios (ver detalles, outline)
  btnSecondary: string;
  // badge superior del hero
  badge: string;
  // radios de tarjetas/imagenes
  radiusLg: string;
  radiusMd: string;
  radiusSm: string;
  // fondo de superficies oscuras (newsletter, footer si aplica)
  darkSurface: string;
}

const VARIANT_STYLES: Record<StoreVariant, VariantStyle> = {
  luxury: {
    display: "font-display-luxury italic",
    displayWeight: "font-light tracking-tighter",
    body: "font-display-luxury italic font-light",
    accentText: "text-amber-700",
    accentTextHover: "hover:text-amber-700",
    accentBorder: "border-amber-500/30",
    accentBg: "bg-amber-700",
    accentBgSoft: "bg-amber-500/10",
    btnPrimary: "border border-white text-white rounded-none hover:bg-white hover:text-black",
    btnSecondary: "border border-slate-300 text-slate-900 rounded-none hover:bg-slate-900 hover:text-white",
    badge: "rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-600",
    radiusLg: "rounded-[2.5rem]",
    radiusMd: "rounded-2xl",
    radiusSm: "rounded-full",
    darkSurface: "bg-slate-900",
  },
  intimate: {
    display: "font-display-luxury italic",
    displayWeight: "font-light tracking-tight",
    body: "font-sans font-light",
    accentText: "text-violet-700",
    accentTextHover: "hover:text-violet-700",
    accentBorder: "border-violet-300/40",
    accentBg: "bg-violet-800",
    accentBgSoft: "bg-violet-100",
    btnPrimary: "bg-violet-900 text-white rounded-full hover:bg-violet-800 shadow-lg shadow-violet-900/20",
    btnSecondary: "border border-violet-300 text-violet-900 rounded-full hover:bg-violet-900 hover:text-white",
    badge: "rounded-full border border-violet-300/40 bg-violet-100 text-violet-800",
    radiusLg: "rounded-[3rem]",
    radiusMd: "rounded-[1.75rem]",
    radiusSm: "rounded-full",
    darkSurface: "bg-violet-950",
  },
  streetwear: {
    display: "font-display-impact uppercase",
    displayWeight: "font-bold tracking-tight",
    body: "font-sans font-bold uppercase",
    accentText: "text-yellow-600",
    accentTextHover: "hover:text-yellow-600",
    accentBorder: "border-black",
    accentBg: "bg-black",
    accentBgSoft: "bg-yellow-400",
    btnPrimary: "bg-yellow-400 text-black rounded-none hover:bg-white font-display-impact uppercase tracking-wide skew-x-[-4deg]",
    btnSecondary: "border-2 border-black text-black rounded-none hover:bg-black hover:text-white font-display-impact uppercase",
    badge: "rounded-none border-2 border-black bg-yellow-400 text-black -skew-x-6",
    radiusLg: "rounded-md",
    radiusMd: "rounded-sm",
    radiusSm: "rounded-none",
    darkSurface: "bg-black",
  },
  flash: {
    display: "font-display-impact uppercase",
    displayWeight: "font-bold tracking-tight",
    body: "font-sans font-extrabold uppercase",
    accentText: "text-red-600",
    accentTextHover: "hover:text-red-600",
    accentBorder: "border-red-600",
    accentBg: "bg-red-600",
    accentBgSoft: "bg-red-50",
    btnPrimary: "bg-red-600 text-white rounded-full hover:bg-red-700 shadow-xl shadow-red-600/30 font-display-impact uppercase tracking-wide",
    btnSecondary: "border-2 border-red-600 text-red-600 rounded-full hover:bg-red-600 hover:text-white font-display-impact uppercase",
    badge: "rounded-full bg-red-600 text-white animate-pulse-slow",
    radiusLg: "rounded-[1.75rem]",
    radiusMd: "rounded-2xl",
    radiusSm: "rounded-full",
    darkSurface: "bg-red-950",
  },
  tech: {
    display: "font-display-tech",
    displayWeight: "font-medium tracking-tight",
    body: "font-display-tech",
    accentText: "text-cyan-400",
    accentTextHover: "hover:text-cyan-300",
    accentBorder: "border-cyan-400/30",
    accentBg: "bg-cyan-500",
    accentBgSoft: "bg-cyan-500/10",
    btnPrimary: "bg-cyan-400 text-slate-950 rounded-md hover:bg-cyan-300 shadow-lg shadow-cyan-500/30 font-display-tech",
    btnSecondary: "border border-cyan-400/40 text-cyan-300 rounded-md hover:bg-cyan-400/10 font-display-tech",
    badge: "rounded-md border border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    radiusLg: "rounded-xl",
    radiusMd: "rounded-lg",
    radiusSm: "rounded-md",
    darkSurface: "bg-slate-950",
  },
  playful: {
    display: "font-display-playful",
    displayWeight: "font-extrabold tracking-tight",
    body: "font-sans font-semibold",
    accentText: "text-pink-600",
    accentTextHover: "hover:text-pink-600",
    accentBorder: "border-pink-300",
    accentBg: "bg-pink-500",
    accentBgSoft: "bg-pink-100",
    btnPrimary: "bg-pink-500 text-white rounded-full hover:bg-pink-600 shadow-lg shadow-pink-500/30 font-display-playful",
    btnSecondary: "border-2 border-pink-400 text-pink-600 rounded-full hover:bg-pink-500 hover:text-white font-display-playful",
    badge: "rounded-full bg-yellow-300 text-pink-700 font-display-playful",
    radiusLg: "rounded-[2.5rem]",
    radiusMd: "rounded-[2rem]",
    radiusSm: "rounded-full",
    darkSurface: "bg-indigo-950",
  },
  editorial: {
    display: "font-display-editorial",
    displayWeight: "font-medium tracking-tight",
    body: "font-display-editorial font-light",
    accentText: "text-emerald-800",
    accentTextHover: "hover:text-emerald-800",
    accentBorder: "border-stone-300",
    accentBg: "bg-stone-900",
    accentBgSoft: "bg-stone-100",
    btnPrimary: "bg-stone-900 text-white rounded-md hover:bg-emerald-900 font-sans",
    btnSecondary: "border border-stone-300 text-stone-800 rounded-md hover:border-stone-900 font-sans",
    badge: "rounded-sm border border-stone-300 bg-stone-100 text-stone-700",
    radiusLg: "rounded-2xl",
    radiusMd: "rounded-xl",
    radiusSm: "rounded-md",
    darkSurface: "bg-stone-900",
  },
  glow: {
    display: "font-display-playful",
    displayWeight: "font-semibold tracking-tight",
    body: "font-sans font-medium",
    accentText: "text-rose-600",
    accentTextHover: "hover:text-rose-600",
    accentBorder: "border-rose-200",
    accentBg: "bg-rose-500",
    accentBgSoft: "bg-rose-100",
    btnPrimary: "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white rounded-full hover:from-rose-600 hover:to-fuchsia-600 shadow-lg shadow-rose-500/30 font-sans font-semibold",
    btnSecondary: "border border-rose-300 text-rose-600 rounded-full hover:bg-rose-500 hover:text-white font-sans font-semibold",
    badge: "rounded-full bg-rose-100 text-rose-600",
    radiusLg: "rounded-[2.5rem]",
    radiusMd: "rounded-[1.75rem]",
    radiusSm: "rounded-full",
    darkSurface: "bg-rose-950",
  },
  family: {
    display: "font-sans",
    displayWeight: "font-black tracking-tight",
    body: "font-sans font-medium",
    accentText: "text-orange-700",
    accentTextHover: "hover:text-orange-700",
    accentBorder: "border-orange-300",
    accentBg: "bg-orange-700",
    accentBgSoft: "bg-orange-100",
    btnPrimary: "bg-orange-700 text-white rounded-xl hover:bg-orange-800 shadow-lg shadow-orange-700/20 font-sans font-bold",
    btnSecondary: "border border-orange-300 text-orange-800 rounded-xl hover:bg-orange-700 hover:text-white font-sans font-bold",
    badge: "rounded-full bg-orange-100 text-orange-800",
    radiusLg: "rounded-[2rem]",
    radiusMd: "rounded-2xl",
    radiusSm: "rounded-xl",
    darkSurface: "bg-stone-900",
  },
};

const getVariantStyle = (v: StoreVariant): VariantStyle => VARIANT_STYLES[v] || VARIANT_STYLES.luxury;

// Texto blanco o negro segun el brillo del color de fondo elegido a mano,
// para que un boton con color personalizado siga siendo legible.
const getReadableTextColor = (hex?: string): string => {
  if (!hex) return '#ffffff';
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0A1A1A' : '#ffffff';
};

// Tamaño de tipografía elegido a mano en el editor: un porcentaje continuo
// (barra deslizante, 100 = tamaño original de la plantilla) que se multiplica
// contra el tamaño base de cada texto. Como las clases de Tailwind ya fijan
// el tamaño por breakpoint, un valor inline es la única forma de que el
// control tenga efecto real.
const scaledRem = (baseRem: number, fontSizePct?: number) => `${baseRem * ((fontSizePct ?? 100) / 100)}rem`;
const LOGO_TEXT_BASE_REM = 1.5;
const HERO_TITLE_BASE_REM = 4.5;
const SECTION_TITLE_BASE_REM = 2.5;

// --- Filtro de catalogo simulado ---
// El navbar y las tarjetas de categoria disparan un filtro (p.ej. "Conjuntos",
// "Pijamas", "Basketball"); la grilla de productos lo lee y muestra solo lo
// que corresponde a esa categoria, para que cada seccion del menu muestre
// contenido distinto y real en vez de siempre el mismo listado completo.
interface SimNavState { activeFilter: string | null; setActiveFilter: (f: string | null) => void; }
const SimNavContext = React.createContext<SimNavState>({ activeFilter: null, setActiveFilter: () => {} });
export const SimulatedStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  return <SimNavContext.Provider value={{ activeFilter, setActiveFilter }}>{children}</SimNavContext.Provider>;
};
const useSimNav = () => React.useContext(SimNavContext);

const normalizeLabel = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Navegacion simulada: como estas plantillas son de una sola pagina (sin
// rutas reales aun), el menu y los botones de "Ver Coleccion"/"Ver Drops"
// desplazan a la seccion mas relevante dentro de la misma vista, ademas de
// aplicar el filtro de categoria correspondiente, para que todo se sienta
// clickeable e interactivo en la vista previa.
const goToSimulatedSection = (label: string, setFilter: (f: string | null) => void) => {
  const l = normalizeLabel(label);
  if (/(contact|contacto)/.test(l)) {
    setFilter(null);
    const el = document.getElementById('bayup-contact') || document.getElementById('bayup-footer');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (/(nosotr|about|historia|marca|empresa)/.test(l)) {
    setFilter(null);
    const el = document.getElementById('bayup-about') || document.getElementById('bayup-footer');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (/(inicio|home)$/.test(l)) {
    setFilter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  // Cualquier otra etiqueta (Novedades, Conjuntos, Pijamas, Ofertas, Colecciones,
  // Drops, una marca puntual, etc.) se usa como filtro real del catalogo.
  setFilter(/novedad/.test(l) ? null : label);
  setTimeout(() => {
    const el = document.getElementById('bayup-products') || document.getElementById('bayup-categories') || document.getElementById('bayup-footer');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
};

// Permite que el editor de onboarding (que NO tiene un `slug` real todavia,
// porque la tienda no esta publicada) "intercepte" la navegacion del menu y
// cambie su propia vista previa local (home/catalog/about/product) en vez
// de navegar a una URL real. Si no hay ningun Provider de esto en el arbol
// (caso normal: tienda publicada, o Studio del dashboard sin esta funcion),
// el valor es `null` y todo sigue funcionando como antes.
const EditorPreviewNavContext = React.createContext<((pageKey: 'home' | 'catalog' | 'about' | 'product') => void) | null>(null);
export const EditorPreviewNavProvider = EditorPreviewNavContext.Provider;

const labelToPageKey = (label: string): 'home' | 'catalog' | 'about' | 'product' => {
  const l = normalizeLabel(label);
  if (/(contact|contacto|nosotr|about|historia|marca|empresa)/.test(l)) return 'about';
  if (/(inicio|home)$/.test(l)) return 'home';
  // "Productos" lleva a la ficha de un producto puntual (distinto de
  // "Colecciones", que muestra la grilla completa) para que ambos items se
  // vean realmente diferentes.
  if (/producto/.test(l)) return 'product';
  return 'catalog';
};

// Navegacion real: la tienda publicada vive en /shop/[slug] y ya tiene 4
// paginas reales (home/catalog/about/product) publicadas desde el
// onboarding (ver app/onboarding/page.tsx -> handlePublish). Si detectamos
// ese `slug` en la ruta navegamos de verdad entre ellas; si no hay slug
// (editor de onboarding, Studio del dashboard) no existe una pagina real a
// donde ir, asi que mantenemos la simulacion de scroll/filtro de siempre —
// salvo que el editor de onboarding haya puesto un EditorPreviewNavContext.
const useSmartNavigation = (setFilter: (f: string | null) => void) => {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : undefined;
  const editorNav = React.useContext(EditorPreviewNavContext);

  // `url` es la URL real que el comerciante eligió a mano para este ítem
  // (editor "Menú" → campo de URL). Una externa (http/https) abre en pestaña
  // nueva tal cual. Una interna todavía no puede crear una página nueva de
  // verdad (la tienda solo tiene 4 páginas reales: home/catalog/about/
  // product), así que se interpreta su texto para mandar a la más parecida
  // en vez de dar un 404 — sigue siendo mejor que ignorarla por completo.
  return (label: string, url?: string) => {
    if (url && /^https?:\/\//.test(url)) { window.open(url, '_blank'); return; }
    if (editorNav) {
      editorNav(labelToPageKey(url || label));
      return;
    }
    if (!slug) {
      goToSimulatedSection(label, setFilter);
      return;
    }
    const pageKey = labelToPageKey(url || label);
    router.push(pageKey === 'home' ? `/shop/${slug}` : `/shop/${slug}?view=${pageKey}`);
  };
};

// Navega a la ficha de un producto especifico (tarjeta de producto en la
// grilla). Sin `slug` real ni EditorPreviewNavContext no hay una pagina de
// producto a donde ir, asi que en el editor/preview simplemente no hace
// nada nuevo.
const useProductNavigation = () => {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : undefined;
  const editorNav = React.useContext(EditorPreviewNavContext);
  return (productId: string) => {
    if (editorNav) { editorNav('product'); return; }
    if (!slug) return;
    router.push(`/shop/${slug}?view=product&id=${productId}`);
  };
};

// 1. NAVBAR PREMIUM (FUNCIONAL CON CARRITO)
// El navbar es el primer elemento del header en todas las plantillas, asi que
// es quien declara `props.variant` y lo expone via VariantContext para que el
// resto de bloques (hero, grids, footer, etc.) lean el mismo estilo sin que
// cada architecture.json tenga que repetir la prop en todos sus elementos.
export const SmartNavbar = ({ props }: { props: any }) => {
  const { items: cart, setIsCartOpen: setIsOpen } = useCart();
  const { showToast } = useToast();
  const { activeFilter, setActiveFilter } = useSimNav();
  const goTo = useSmartNavigation(setActiveFilter);
  const variant: StoreVariant = props.variant || "luxury";
  const s = getVariantStyle(variant);

  // Colores y tipografía elegidos a mano por el comerciante (editor de
  // plantilla). Si no los definió, se usan los del preset de variante de
  // siempre — esto es 100% opcional y nunca rompe el resto de las tiendas
  // que no pasan estas props (Canvas/CanvasElements no las envía hoy).
  const primaryColor: string | undefined = props.colors?.primary;
  const fontFamily: string | undefined = props.fontFamily;
  const logoStyle = {
    ...(primaryColor ? { color: primaryColor } : {}),
    ...(fontFamily ? { fontFamily } : {}),
    ...(props.fontSize ? { fontSize: scaledRem(LOGO_TEXT_BASE_REM, props.fontSize) } : {}),
    ...(props.horizontalPosition ? { transform: `translateX(${props.horizontalPosition}px)` } : {}),
  };

  const isStreetwearLike = variant === "streetwear" || variant === "flash" || variant === "tech";

  // Alto del navbar elegido a mano (porcentaje sobre 96px = h-24). Igual que
  // el resto de los controles de tamaño, un valor inline es la única forma
  // de que el slider tenga efecto real sobre la clase Tailwind fija.
  const navHeightStyle = props.navSize ? { height: `${96 * (props.navSize / 100)}px` } : undefined;

  // Los ÍTEMS del menú (Mujer/Hombre/...) tienen su propio color, tipografía,
  // tamaño y posición horizontal — totalmente separados del logo, así editar
  // uno no afecta al otro.
  const itemsPrimaryColor: string | undefined = props.itemsColors?.primary;
  const itemsFontFamily: string | undefined = props.itemsFontFamily;
  const ITEM_TEXT_BASE_REM = 0.625;
  const menuItemStyle = {
    ...(itemsFontFamily ? { fontFamily: itemsFontFamily } : {}),
    ...(props.itemsFontSize ? { fontSize: scaledRem(ITEM_TEXT_BASE_REM, props.itemsFontSize) } : {}),
    ...((props.itemsHorizontalPosition || props.itemsVerticalPosition) ? { transform: `translate(${props.itemsHorizontalPosition || 0}px, ${-(props.itemsVerticalPosition || 0)}px)` } : {}),
  };

  // Color de fondo de la barra, elegido a mano en el editor. Sobrescribe el
  // fondo translúcido del preset de variante con un color sólido.
  const barStyle = props.barColor ? { backgroundColor: props.barColor } : undefined;

  return (
    <VariantContext.Provider value={variant}>
      <header
        className={cn(
          "w-full border-b sticky top-0 z-[200] transition-all duration-500",
          !props.barColor && "backdrop-blur-xl",
          !props.barColor && (variant === "tech" ? "bg-slate-950/90 border-cyan-400/10" :
          variant === "streetwear" ? "bg-white/95 border-black" :
          variant === "flash" ? "bg-white/90 border-red-100" :
          "bg-white/70 border-white/10")
        )}
        style={barStyle}
      >
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-8" style={navHeightStyle}>
          <div className="flex items-center gap-3 shrink-0">
            {props.logoUrl ? (
              <img
                src={props.logoUrl}
                alt={props.logoText || 'Logo'}
                className="rounded-xl object-cover shrink-0"
                style={{
                  height: `${40 * ((props.logoSize ?? 100) / 100)}px`,
                  width: `${40 * ((props.logoSize ?? 100) / 100)}px`,
                  transform: (props.logoOffsetX || props.logoOffsetY) ? `translate(${props.logoOffsetX || 0}px, ${-(props.logoOffsetY || 0)}px)` : undefined,
                }}
              />
            ) : null}
            {props.logoText && (
              <h1
                className={cn(
                  "text-2xl tracking-tighter uppercase",
                  s.display, s.displayWeight,
                  !primaryColor && (variant === "tech" ? "text-cyan-300" : "text-gray-900")
                )}
                style={logoStyle}
              >
                {props.logoText}
              </h1>
            )}
          </div>
          <nav className="hidden lg:flex items-center gap-10">
            {(props.menuItems || ["Novedades", "Colecciones", "Nosotros", "Contacto"]).map((item: any, i: number) => {
              const label = typeof item === 'string' ? item : item.label;
              const itemUrl = typeof item === 'string' ? undefined : item.url;
              const isActive = activeFilter?.toLowerCase() === label.toLowerCase();
              return (
                <span
                  key={i}
                  onClick={() => goTo(label, itemUrl)}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all",
                    !itemsPrimaryColor && (isActive ? s.accentText : "text-gray-500"),
                    !isActive && !itemsPrimaryColor && s.accentTextHover,
                    isStreetwearLike && "font-display-impact"
                  )}
                  style={{ ...(itemsPrimaryColor ? { color: isActive ? itemsPrimaryColor : `${itemsPrimaryColor}99` } : {}), ...menuItemStyle }}
                >
                  {label}
                </span>
              );
            })}
          </nav>
          <div className="flex items-center gap-6 flex-1 justify-end">
            <div className={cn("flex items-center gap-6", !primaryColor && (variant === "tech" ? "text-cyan-300" : "text-gray-900"))} style={primaryColor ? { color: primaryColor } : undefined}>
              {props.showCartIcon !== false && (
                <div
                  className={cn(
                    "relative p-3 cursor-pointer hover:scale-110 transition-transform",
                    variant === "tech" ? "bg-cyan-400/10" : variant === "streetwear" ? "bg-black text-white" : "bg-gray-100",
                    s.radiusMd
                  )}
                  onClick={() => setIsOpen(true)}
                >
                  <ShoppingBag size={20} />
                  {cart.length > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-1 text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-in zoom-in",
                      s.accentBg, variant === "tech" ? "text-slate-950" : "text-white"
                    )}>
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                  )}
                </div>
              )}
              {props.showAccountIcon !== false && (
                <button
                  type="button"
                  aria-label="Cuenta de cliente"
                  onClick={() => showToast('El inicio de sesión de clientes estará disponible en tu tienda publicada', 'info')}
                  className={cn("p-3 -m-3 cursor-pointer transition-colors", s.accentTextHover)}
                >
                  <User size={20} />
                </button>
              )}
              {(props.extraIcons || []).map((iconKey: string) => {
                const opt = EXTRA_ICON_OPTIONS.find(o => o.key === iconKey);
                if (!opt) return null;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    aria-label={opt.label}
                    onClick={() => showToast(`${opt.label}: disponible cuando publiques tu tienda`, 'info')}
                    className={cn("p-3 -m-3 cursor-pointer transition-colors", s.accentTextHover)}
                  >
                    <opt.Icon size={20} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>
    </VariantContext.Provider>
  );
};

// 2. HERO
// El hero tambien puede declarar `props.variant` (por si en algun layout no
// hay navbar antes, p.ej. ficha de producto embebida); si no lo declara, hereda
// el de VariantContext que ya puso el navbar.
export const SmartHero = ({ props }: { props: any }) => {
  const { setActiveFilter } = useSimNav();
  const goTo = useSmartNavigation(setActiveFilter);
  const inherited = useVariant();
  const variant: StoreVariant = props.variant || inherited;
  const s = getVariantStyle(variant);

  const isCentered = variant !== "streetwear" && variant !== "tech";
  const heroFont = cn(s.display, s.displayWeight);

  const colors = props.colors as { primary?: string; secondary?: string; button?: string; text?: string } | undefined;
  const fontFamily: string | undefined = props.fontFamily;
  const fontFamilyStyle = fontFamily ? { fontFamily } : undefined;
  const titleStyle = {
    ...(fontFamily ? { fontFamily } : {}),
    ...(props.fontSize ? { fontSize: scaledRem(HERO_TITLE_BASE_REM, props.fontSize) } : {}),
  };
  const subtitleStyle = { ...(colors?.text ? { color: colors.text } : {}), ...(fontFamily ? { fontFamily } : {}) };
  const badgeStyle = colors?.secondary ? { backgroundColor: `${colors.secondary}1a`, borderColor: `${colors.secondary}66`, color: colors.secondary } : undefined;
  const btnStyle = colors?.button ? { backgroundColor: colors.button, color: getReadableTextColor(colors.button) } : undefined;

  return (
    <VariantContext.Provider value={variant}>
      <section className={cn(
        "relative w-full h-[80vh] overflow-hidden flex items-center",
        isCentered ? "justify-center" : "justify-start",
        variant === "tech" ? "bg-slate-950" : variant === "streetwear" ? "bg-black" : "bg-slate-900"
      )}>
        <img className={cn("absolute inset-0 w-full h-full object-cover", variant === "streetwear" || variant === "tech" ? "opacity-50" : "opacity-60")} src={props.imageUrl} alt="Hero" />
        <div className={cn(
          "absolute inset-0",
          variant === "tech" ? "bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" :
          variant === "streetwear" ? "bg-gradient-to-t from-black via-black/30 to-black/10" :
          "bg-gradient-to-b from-black/20 via-transparent to-black/60"
        )} />
        <div className={cn(
          "relative z-10 px-6 max-w-4xl",
          isCentered ? "text-center mx-auto" : "text-left ml-6 md:ml-16 max-w-2xl"
        )}>
          {props.badge && (
            <span className={cn("inline-block py-1.5 px-4 text-[10px] font-bold tracking-[0.4em] uppercase mb-8 border", !colors?.secondary && s.badge, colors?.secondary && "border")} style={badgeStyle}>
              {props.badge}
            </span>
          )}
          {props.title && (
            <h2 className={cn(
              "text-6xl md:text-8xl text-white mb-8 leading-none",
              heroFont,
              variant === "streetwear" && "drop-shadow-[4px_4px_0px_rgba(250,204,21,1)]"
            )} style={titleStyle}>
              {props.title}
            </h2>
          )}
          {props.subtitle && (
            <p className={cn("text-lg md:text-xl mb-12 leading-relaxed", !colors?.text && "text-slate-200", isCentered ? "max-w-2xl mx-auto" : "max-w-xl", s.body)} style={subtitleStyle}>
              {props.subtitle}
            </p>
          )}
          {props.primaryBtnText && (
            <button onClick={() => goTo('Novedades')} className={cn("px-12 py-5 font-bold text-xs uppercase tracking-[0.3em] transition-all", !colors?.button && s.btnPrimary, colors?.button && "rounded-full")} style={{ ...btnStyle, ...fontFamilyStyle }}>
              {props.primaryBtnText}
            </button>
          )}
        </div>
      </section>
    </VariantContext.Provider>
  );
};

// 3. HERENCIA / NOSOTROS
export const SmartHeritageBlock = ({ props }: { props: any }) => {
  const inherited = useVariant();
  const variant: StoreVariant = props.variant || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";

  return (
    <section id="bayup-about" className={cn("py-32 text-center px-6", variant === "tech" ? "bg-slate-950" : "bg-white")}>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-3">
          <h4 className={cn("font-bold uppercase tracking-[0.4em] text-[10px]", s.accentText)}>{props.title || 'NUESTRA HERENCIA'}</h4>
          <h3 className={cn(
            "text-4xl md:text-5xl",
            s.display, s.displayWeight,
            variant === "tech" ? "text-white" : "text-slate-900",
            isAngular && "uppercase"
          )}>
            {props.subtitle || 'Maestros artesanos desde 1924'}
          </h3>
        </div>
        <p className={cn("text-lg leading-relaxed max-w-3xl mx-auto", variant === "tech" ? "text-slate-400" : "text-slate-500", s.body)}>
          {props.content}
        </p>
        <div className={cn("w-24 mx-auto mt-12 border-t", s.accentBorder)}></div>
      </div>
    </section>
  );
};

// 4. GRID DE PRODUCTOS (FUNCIONAL)
export const SmartProductGrid = ({ props }: { props: any }) => {
  const { addItem: addToCart } = useCart();
  const { activeFilter } = useSimNav();
  const goToProduct = useProductNavigation();
  const inherited = useVariant();
  const variant: StoreVariant = props.variant || inherited;
  const s = getVariantStyle(variant);

  const allProducts: any[] = props.products || [];
  const filterNorm = activeFilter ? normalizeLabel(activeFilter) : null;
  const isOfertas = filterNorm ? /oferta|descuento|sale|rebaja/.test(filterNorm) : false;

  let displayProducts = allProducts;
  let displayTitle = props.title || 'Novedades';

  if (filterNorm) {
    displayTitle = activeFilter as string;
    if (!isOfertas) {
      const matched = allProducts.filter((p) => {
        const cat = normalizeLabel(p.category || '');
        return cat.includes(filterNorm) || filterNorm.includes(cat) || cat.split(/[\s·,/-]+/).some((w) => w && (w === filterNorm || filterNorm.includes(w)));
      });
      if (matched.length > 0) displayProducts = matched;
    }
  }

  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";
  const titleCase = isAngular ? "uppercase" : "";
  const isLuxuryLike = variant === "luxury" || variant === "intimate";

  const colors = props.colors as { primary?: string; secondary?: string; button?: string; text?: string } | undefined;
  const fontFamily: string | undefined = props.fontFamily;
  const titleStyle = {
    ...(colors?.primary ? { color: colors.primary } : {}),
    ...(fontFamily ? { fontFamily } : {}),
    ...(props.fontSize ? { fontSize: scaledRem(SECTION_TITLE_BASE_REM, props.fontSize) } : {}),
  };
  const priceStyle = { ...(colors?.primary ? { color: colors.primary } : {}), ...(fontFamily ? { fontFamily } : {}) };
  const badgeStyle = colors?.secondary ? { backgroundColor: `${colors.secondary}1a`, color: colors.secondary } : undefined;
  const nameStyle = fontFamily ? { fontFamily } : undefined;
  const categoryStyle = colors?.text ? { color: colors.text } : undefined;

  // Forma de las tarjetas de producto, elegida a mano en el editor. Si no se
  // define, se usa el radio del preset de variante de siempre.
  const cardShape: 'square' | 'soft' | 'round' | undefined = props.cardShape;
  const cardRadiusPx = cardShape === 'square' ? '0.5rem' : cardShape === 'round' ? '3rem' : cardShape === 'soft' ? '1.5rem' : undefined;
  const badgeText: string | undefined = props.badgeText;
  const showCategory = props.showCategory !== false;

  return (
    <section id="bayup-products" className={cn("py-32", variant === "tech" ? "bg-slate-950" : "bg-white")}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div>
            <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] mb-4 block", !colors?.primary && s.accentText)} style={colors?.primary ? { color: colors.primary } : undefined}>Tendencias</span>
            <h3 className={cn(
              "text-5xl tracking-tighter",
              s.display, s.displayWeight, titleCase,
              !colors?.primary && (variant === "tech" ? "text-white" : "text-gray-900"),
              isLuxuryLike && "italic font-black"
            )} style={titleStyle}>
              {displayTitle}
            </h3>
          </div>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all border-b pb-2",
            variant === "tech" ? "text-slate-500 border-slate-700" : "text-gray-400 border-gray-100",
            s.accentTextHover
          )}>
            Explorar todo el catálogo
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {displayProducts.length === 0 ? (
            <p className={cn("col-span-full text-center font-bold uppercase text-sm tracking-widest py-12", variant === "tech" ? "text-slate-500" : "text-gray-400")}>Próximamente nuevos productos en esta sección</p>
          ) : displayProducts.map((p: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col"
            >
              <div
                onClick={() => goToProduct(p.id)}
                className={cn(
                  "relative w-full aspect-[3/4] overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700 cursor-pointer",
                  !cardRadiusPx && s.radiusLg,
                  variant === "tech" ? "bg-slate-900" : "bg-gray-50"
                )}
                style={cardRadiusPx ? { borderRadius: cardRadiusPx } : undefined}
              >
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" src={p.image} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                {/* BOTÓN RÁPIDO DE COMPRA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart({
                      id: p.id,
                      title: p.name,
                      price: p.price,
                      image: p.image,
                      quantity: 1
                    });
                  }}
                  className={cn(
                    "absolute bottom-8 right-8 h-16 w-16 shadow-2xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center justify-center active:scale-95",
                    isAngular ? "rounded-md" : "rounded-full",
                    !colors?.button && s.accentBg, !colors?.button && "text-white", "hover:scale-110"
                  )}
                  style={colors?.button ? { backgroundColor: colors.button, color: getReadableTextColor(colors.button) } : undefined}
                  aria-label="Añadir al carrito"
                >
                  <Plus size={24} />
                </button>

                {/* ETIQUETA DE NUEVO / PLAN */}
                <div className={cn("absolute top-8 left-8 px-4 py-1.5 text-[8px] font-black uppercase tracking-widest", !badgeStyle && s.badge)} style={badgeStyle}>
                  {badgeText || (p.isNew ? "Nuevo" : "Destacado")}
                </div>
              </div>
              <div className="px-2 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className={cn(
                    "text-lg tracking-tighter leading-tight max-w-[70%]",
                    isAngular ? "uppercase font-black" : "font-bold",
                    !colors?.primary && (variant === "tech" ? "text-white" : "text-gray-900")
                  )} style={{ ...(colors?.primary ? { color: colors.primary } : {}), ...nameStyle }}>
                    {p.name}
                  </h4>
                  <p className={cn("text-xl font-black tracking-tighter", !colors?.primary && s.accentText, isLuxuryLike && "italic")} style={priceStyle}>
                    $ {p.price.toLocaleString()}
                  </p>
                </div>
                {showCategory && (
                  <p className={cn("text-[10px] font-bold uppercase tracking-[0.1em]", !categoryStyle && (variant === "tech" ? "text-slate-500" : "text-gray-400"))} style={categoryStyle}>
                    {p.category || 'Colección 2026'}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 5. GRID DE CATEGORIAS / COLECCIONES
export const SmartCategoriesGrid = ({ props }: { props: any }) => {
  const { setActiveFilter } = useSimNav();
  const inherited = useVariant();
  const variant: StoreVariant = props.variant || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";
  const isLuxuryLike = variant === "luxury" || variant === "intimate";

  return (
    <section id="bayup-categories" className={cn("py-32", variant === "tech" ? "bg-slate-950" : "bg-white")}>
      <div className="max-w-7xl mx-auto px-6">
        <h3 className={cn("text-center text-[10px] font-bold uppercase tracking-[0.5em] mb-4", s.accentText)}>Descubra</h3>
        <h2 className={cn(
          "text-center text-4xl mb-20",
          s.display, s.displayWeight,
          isAngular && "uppercase",
          variant === "tech" ? "text-white" : "text-slate-900"
        )}>
          {props.title || 'Nuestras Colecciones'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {(props.items || []).map((item: any, i: number) => (
            <div key={i} className={cn("group relative aspect-[3/4] overflow-hidden shadow-xl", isAngular ? "rounded-md" : "rounded-xl", variant === "tech" ? "bg-slate-900" : "bg-slate-900")}>
              <img className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-110 transition-all duration-[3000ms]" src={item.image} />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center space-y-6">
                <h5 className={cn(
                  "text-white text-3xl tracking-tight",
                  s.display, s.displayWeight,
                  isAngular && "uppercase",
                  isLuxuryLike && "italic"
                )}>
                  {item.label}
                </h5>
                <button
                  onClick={() => goToSimulatedSection(item.label, setActiveFilter)}
                  className={cn(
                    "px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border border-white/40 text-white hover:bg-white hover:text-black",
                    isAngular ? "rounded-none" : "rounded-full"
                  )}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 6. NEWSLETTER
export const SmartNewsletter = ({ props }: { props?: any } = {}) => {
  const inherited = useVariant();
  const variant: StoreVariant = props?.variant || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";
  const isLuxuryLike = variant === "luxury" || variant === "intimate";

  const copy: Partial<Record<StoreVariant, { title: string; subtitle: string; cta: string }>> = {
    streetwear: { title: "No te pierdas el próximo drop", subtitle: "Entérate primero de lanzamientos limitados y restocks antes que nadie.", cta: "Quiero el drop" },
    flash: { title: "Ofertas antes que se agoten", subtitle: "Recibe alertas de precios flash directo a tu correo.", cta: "Avísame" },
    tech: { title: "Mantente a la vanguardia", subtitle: "Novedades de producto, lanzamientos y ofertas exclusivas para early adopters.", cta: "Suscribirme" },
    playful: { title: "Únete a la diversión", subtitle: "Sé el primero en conocer nuevos juguetes y promociones especiales para tu familia.", cta: "¡Sí, quiero!" },
  };
  const c = copy[variant] || { title: "Reciba nuestras novedades", subtitle: "Únase a nuestro círculo exclusivo para recibir invitaciones a eventos y colecciones privadas.", cta: "Suscribirse" };

  return (
    <section className={cn("py-32 text-white text-center px-6", s.darkSurface)}>
      <div className="max-w-2xl mx-auto space-y-8">
        <h3 className={cn("text-3xl tracking-tight", s.display, s.displayWeight, isAngular && "uppercase", isLuxuryLike && "italic")}>
          {c.title}
        </h3>
        <p className={cn("text-sm leading-relaxed", s.body, "text-white/60")}>{c.subtitle}</p>
        <div className="flex flex-col md:flex-row gap-4 mt-10">
          <input
            className={cn(
              "flex-1 bg-white/5 border border-white/10 px-6 py-4 outline-none transition-colors text-sm text-white placeholder:text-white/40",
              isAngular ? "rounded-none" : "rounded-full",
              variant === "tech" ? "focus:border-cyan-400" : "focus:border-white/40"
            )}
            placeholder="Correo electrónico"
          />
          <button className={cn("px-10 py-4 font-bold text-xs uppercase tracking-widest transition-all", s.btnPrimary)}>
            {c.cta}
          </button>
        </div>
      </div>
    </section>
  );
};

// Textos legales genéricos pero reales, parametrizados con el nombre de la tienda.
// No varían por nicho (a diferencia de "Nosotros"/"Contacto") porque el contenido
// legal base es el mismo sin importar si la tienda vende tenis o joyas.
type LegalDocType = 'privacy' | 'terms' | 'cookies';

const getLegalContent = (type: LegalDocType, storeName: string) => {
  const docs: Record<LegalDocType, { title: string; paragraphs: string[] }> = {
    privacy: {
      title: 'Política de Privacidad',
      paragraphs: [
        `${storeName} recopila únicamente los datos necesarios para procesar tu compra: nombre, correo electrónico, teléfono y dirección de envío. Los datos de pago son procesados directamente por la pasarela de pagos y nunca se almacenan en nuestros servidores.`,
        'Utilizamos tu información exclusivamente para gestionar tu pedido, comunicarnos contigo sobre el estado de tu compra y mejorar nuestro servicio. No vendemos ni compartimos tus datos con terceros para fines publicitarios.',
        'Puedes solicitar acceder, corregir o eliminar tus datos personales en cualquier momento escribiéndonos a través de la sección de Contacto.',
      ],
    },
    terms: {
      title: 'Términos y Condiciones',
      paragraphs: [
        `Al realizar una compra en ${storeName} aceptas estos términos. Los precios y la disponibilidad de los productos están sujetos a cambios sin previo aviso.`,
        'El pedido se confirma una vez recibido el pago. Los tiempos de envío son estimados y pueden variar según la ubicación de entrega y el transportador.',
        'Las devoluciones y cambios se rigen por la política descrita en la sección "Garantía" y "Envíos y Devoluciones". El uso de este sitio se rige por las leyes de la República de Colombia.',
      ],
    },
    cookies: {
      title: 'Política de Cookies',
      paragraphs: [
        `${storeName} utiliza cookies esenciales para que el carrito de compras y tu sesión funcionen correctamente mientras navegas el sitio.`,
        'También podemos usar cookies analíticas para entender cómo se usa la tienda y mejorar la experiencia de compra. No usamos cookies de terceros con fines publicitarios.',
        'Puedes desactivar las cookies desde la configuración de tu navegador, aunque esto podría afectar el funcionamiento del carrito y el inicio de sesión.',
      ],
    },
  };
  return docs[type];
};

const LegalModal = ({ type, storeName, onClose }: { type: LegalDocType; storeName: string; onClose: () => void }) => {
  const { title, paragraphs } = getLegalContent(type, storeName);
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative bg-white max-w-xl w-full rounded-[2rem] shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all"><X size={18} /></button>
        </div>
        <div className="p-8 space-y-5">
          {paragraphs.map((p, i) => <p key={i} className="text-sm text-slate-600 leading-relaxed">{p}</p>)}
        </div>
      </motion.div>
    </div>
  );
};

// 7. FOOTER
export const SmartFooter = ({ props }: { props: any }) => {
  const { showToast } = useToast();
  const { setActiveFilter } = useSimNav();
  const goTo = useSmartNavigation(setActiveFilter);
  const [legalModal, setLegalModal] = React.useState<LegalDocType | null>(null);
  const inherited = useVariant();
  const variant: StoreVariant = props.variant || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";
  const isLuxuryLike = variant === "luxury" || variant === "intimate";

  const goAbout = () => goTo('Nosotros');
  const goContact = () => goTo('Contacto');
  const simulate = () => showToast('Esta sección estará disponible cuando publiques tu tienda', 'info');
  const openMap = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.location || 'Bogotá, Colombia')}`, '_blank');

  const empresaLinks: Record<string, () => void> = { "Nuestra Historia": goAbout };
  const servicioLinks: Record<string, () => void> = { "Contacto": goContact, "Envíos y Devoluciones": simulate, "Garantía": simulate, "FAQ": simulate };

  const isDarkFooter = variant === "tech" || variant === "streetwear";

  const colors = props.colors as { primary?: string; secondary?: string; button?: string; text?: string } | undefined;
  const fontFamily: string | undefined = props.fontFamily;
  const logoStyle = {
    ...(colors?.primary ? { color: colors.primary } : {}),
    ...(fontFamily ? { fontFamily } : {}),
    ...(props.fontSize ? { fontSize: scaledRem(SECTION_TITLE_BASE_REM, props.fontSize) } : {}),
  };
  const descriptionStyle = { ...(colors?.text ? { color: colors.text } : {}), ...(fontFamily ? { fontFamily } : {}) };

  return (
    <footer id="bayup-footer" className={cn(
      "py-32 px-10 border-t",
      isDarkFooter ? cn(s.darkSurface, "text-white border-white/10") : "bg-white text-slate-900 border-slate-100"
    )}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
        <div className="space-y-8">
          <h4 className={cn(
            "text-2xl tracking-tighter",
            s.display, s.displayWeight,
            !colors?.primary && (isAngular ? "uppercase" : "font-extrabold"),
            !colors?.primary && isLuxuryLike && "italic uppercase"
          )} style={logoStyle}>
            {props.logoText || 'Tu Tienda'}
          </h4>
          <p className={cn("text-sm leading-relaxed font-medium", s.body, !colors?.text && (isDarkFooter ? "text-white/60" : "text-slate-500"))} style={descriptionStyle}>
            {props.description || 'Gracias por visitarnos. Contáctanos para conocer más sobre nuestros productos.'}
          </p>
          <div className={cn("flex gap-6", isDarkFooter ? "text-white/40" : "text-slate-400")}>
            <Globe size={20} aria-label="Sitio web" className={cn("cursor-pointer", isDarkFooter ? "hover:text-white" : "hover:text-black")} onClick={simulate}/>
            <Camera size={20} aria-label="Instagram" className={cn("cursor-pointer", isDarkFooter ? "hover:text-white" : "hover:text-black")} onClick={simulate}/>
            <Mail size={20} aria-label="Correo de contacto" className={cn("cursor-pointer", isDarkFooter ? "hover:text-white" : "hover:text-black")} onClick={goContact}/>
          </div>
        </div>
        <div>
          <h6 className={cn("font-bold text-[10px] uppercase tracking-[0.3em] mb-10", s.accentText)}>Sobre Nosotros</h6>
          <ul className={cn("space-y-5 text-xs font-medium", isDarkFooter ? "text-white/60" : "text-slate-500")}>
            {Object.entries(empresaLinks).map(([l, fn]) => <li key={l} onClick={fn} className={cn("cursor-pointer transition-colors", isDarkFooter ? "hover:text-white" : "hover:text-black")}>{l}</li>)}
          </ul>
        </div>
        <div>
          <h6 className={cn("font-bold text-[10px] uppercase tracking-[0.3em] mb-10", s.accentText)}>Servicio al Cliente</h6>
          <ul className={cn("space-y-5 text-xs font-medium", isDarkFooter ? "text-white/60" : "text-slate-500")}>
            {Object.entries(servicioLinks).map(([l, fn]) => <li key={l} onClick={fn} className={cn("cursor-pointer transition-colors", isDarkFooter ? "hover:text-white" : "hover:text-black")}>{l}</li>)}
          </ul>
        </div>
        <div className="space-y-8">
          <h6 className={cn("font-bold text-[10px] uppercase tracking-[0.3em] mb-10", s.accentText)}>Ubicación</h6>
          <div className="space-y-4">
            <div className={cn("flex items-start gap-3", isDarkFooter ? "text-white/60" : "text-slate-500")}>
              <MapPin size={18} className={cn("shrink-0", s.accentText)} />
              <p className="text-sm leading-snug">{props.location || 'Bogotá, Colombia'}</p>
            </div>
            <button onClick={openMap} className={cn("text-[10px] font-bold uppercase tracking-widest underline underline-offset-8 transition-all", s.accentText)}>
              Ver en el mapa
            </button>
          </div>
        </div>
      </div>
      <div className={cn(
        "max-w-7xl mx-auto mt-32 pt-10 border-t flex flex-col md:flex-row justify-between gap-6 text-[9px] font-bold uppercase tracking-[0.2em]",
        isDarkFooter ? "border-white/10 text-white/40" : "border-slate-100 text-slate-400"
      )}>
        <p>© 2024 {props.logoText}. Todos los derechos reservados.</p>
        <div className="flex gap-8">
          <span onClick={() => setLegalModal('privacy')} className={cn("cursor-pointer", isDarkFooter ? "hover:text-white" : "hover:text-black")}>Privacidad</span>
          <span onClick={() => setLegalModal('terms')} className={cn("cursor-pointer", isDarkFooter ? "hover:text-white" : "hover:text-black")}>Términos</span>
          <span onClick={() => setLegalModal('cookies')} className={cn("cursor-pointer", isDarkFooter ? "hover:text-white" : "hover:text-black")}>Cookies</span>
        </div>
      </div>
      <AnimatePresence>
        {legalModal && <LegalModal type={legalModal} storeName={props.logoText || 'Tu Tienda'} onClose={() => setLegalModal(null)} />}
      </AnimatePresence>
    </footer>
  );
};

// 9. FORMULARIO DE CONTACTO
export const SmartContactForm = ({ props, tenantId }: { props: any, tenantId?: string }) => {
  const [formData, setFormData] = React.useState({ name: '', email: '', phone: '', message: '' });
  const [isSending, setIsSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const inherited = useVariant();
  const variant: StoreVariant = props.variant || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";
  const isLuxuryLike = variant === "luxury" || variant === "intimate";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setIsSending(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/public/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          message: formData.message
        })
      });
      if (res.ok) {
        setSent(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const inputClass = cn(
    "w-full px-6 py-4 bg-white border border-transparent outline-none transition-all text-sm font-medium shadow-inner",
    s.radiusMd,
    variant === "tech" ? "focus:border-cyan-400" : variant === "streetwear" || variant === "flash" ? "focus:border-black" : "focus:border-amber-500"
  );

  return (
    <section id="bayup-contact" className={cn("py-32 px-6", variant === "tech" ? "bg-slate-950" : "bg-white")}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-[0.5em]", s.accentText)}>{props.badge || 'CONTACTO'}</h3>
          <h2 className={cn(
            "text-4xl md:text-5xl",
            s.display, s.displayWeight,
            isAngular && "uppercase",
            isLuxuryLike && "italic",
            variant === "tech" ? "text-white" : "text-slate-900"
          )}>
            {props.title || 'Hablemos de su próxima joya'}
          </h2>
        </div>

        {sent ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("bg-emerald-50 border border-emerald-100 p-12 text-center space-y-6", s.radiusLg)}>
            <div className="h-20 w-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg"><CheckCheck size={40}/></div>
            <h4 className="text-2xl font-bold text-emerald-900">¡Mensaje recibido!</h4>
            <p className={cn("text-emerald-700/70 font-medium", isLuxuryLike && "italic")}>Gracias por escribirnos. Un asesor se pondrá en contacto con usted en breve.</p>
            <button onClick={() => setSent(false)} className="text-xs font-black uppercase tracking-widest text-emerald-600 hover:underline">Enviar otro mensaje</button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 p-12 border shadow-sm", s.radiusLg, variant === "tech" ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100")}>
            <div className="space-y-2">
              <label className={cn("text-[9px] font-black uppercase tracking-widest ml-2", variant === "tech" ? "text-slate-500" : "text-slate-400")}>Nombre completo</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="Ej: Julian Garcia" />
            </div>
            <div className="space-y-2">
              <label className={cn("text-[9px] font-black uppercase tracking-widest ml-2", variant === "tech" ? "text-slate-500" : "text-slate-400")}>Correo electrónico</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="email@ejemplo.com" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className={cn("text-[9px] font-black uppercase tracking-widest ml-2", variant === "tech" ? "text-slate-500" : "text-slate-400")}>WhatsApp (Opcional)</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="+57 300 000 0000" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className={cn("text-[9px] font-black uppercase tracking-widest ml-2", variant === "tech" ? "text-slate-500" : "text-slate-400")}>Su mensaje</label>
              <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className={cn(inputClass, "resize-none")} placeholder="¿En qué podemos ayudarle?" />
            </div>
            <button disabled={isSending} type="submit" className={cn("md:col-span-2 w-full py-5 font-bold text-xs uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-4", s.btnPrimary)}>
              {isSending ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Enviar mensaje</>}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

// Acordeon simple usado en la ficha de producto (Material y cuidado /
// Envios y devoluciones) — colapsado por defecto, igual que en cualquier
// e-commerce de referencia.
const ProductDetailAccordion = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("border-t", isDark ? "border-slate-800" : "border-gray-100")}>
      <button onClick={() => setOpen(o => !o)} className={cn("w-full flex items-center justify-between py-5 text-left text-xs font-bold uppercase tracking-widest transition-colors", isDark ? "text-white" : "text-gray-900")}>
        {title}
        <ChevronDown size={15} className={cn("shrink-0 transition-transform", isDark ? "text-slate-500" : "text-gray-400", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className={cn("pb-5 text-sm leading-relaxed", isDark ? "text-slate-400" : "text-gray-500")}>{children}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 10. FICHA DE PRODUCTO (BREADCRUMB + GALERÍA + INFO + ACORDEONES + RELACIONADOS)
export const SmartProductDetail = ({ product, relatedProducts = [], variant: variantProp }: { product?: any, relatedProducts?: any[], variant?: StoreVariant }) => {
  const { addItem: addToCart } = useCart();
  const goTo = useSmartNavigation(() => {});
  const goToProduct = useProductNavigation();
  const [qty, setQty] = React.useState(1);
  const [activeImg, setActiveImg] = React.useState(0);
  const [activeColor, setActiveColor] = React.useState(0);
  const inherited = useVariant();
  const variant: StoreVariant = variantProp || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";
  const isDark = variant === "tech";

  if (!product) {
    return (
      <section className="py-32 text-center font-sans bg-white">
        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Esta ficha mostrará tus productos reales una vez tengas inventario cargado.</p>
      </section>
    );
  }

  const images: string[] = (Array.isArray(product.image_url) ? product.image_url : [product.image_url || product.image]).filter(Boolean);
  const colors: string[] | undefined = product.colors;

  return (
    <section className={cn("py-16", isDark ? "bg-slate-950" : "bg-white")}>
      <div className="max-w-6xl mx-auto px-6">
        {/* BREADCRUMB */}
        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-10", isDark ? "text-slate-500" : "text-gray-400")}>
          <span onClick={() => goTo('Inicio')} className={cn("cursor-pointer transition-colors", isDark ? "hover:text-white" : "hover:text-gray-900")}>Inicio</span>
          <ChevronRight size={10} />
          <span onClick={() => goTo('Colecciones')} className={cn("cursor-pointer transition-colors", isDark ? "hover:text-white" : "hover:text-gray-900")}>{product.category || 'Colección'}</span>
          <ChevronRight size={10} />
          <span className={cn(isDark ? "text-slate-300" : "text-gray-600", "truncate max-w-[160px]")}>{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Galería */}
          <div className="space-y-4">
            <div className={cn("aspect-square overflow-hidden", s.radiusLg, isDark ? "bg-slate-900" : "bg-gray-50")}>
              {images[activeImg] && <img src={images[activeImg]} className="w-full h-full object-cover" alt={product.name} />}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={cn("h-20 w-20 overflow-hidden border-2 transition-colors shrink-0", s.radiusMd, activeImg === i ? s.accentBorder : "border-transparent")}>
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={cn("inline-block py-1.5 px-3.5 text-[9px] font-black uppercase tracking-[0.25em] border", s.badge)}>
                {product.badge || 'Edición Limitada'}
              </span>
              {(product.stock ?? 1) > 0 ? (
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">En stock</span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Agotado</span>
              )}
            </div>

            <h1 className={cn(
              "text-4xl tracking-tighter",
              s.display, s.displayWeight,
              isAngular && "uppercase",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {product.name}
            </h1>
            <p className={cn("text-3xl font-black", s.accentText)}>$ {Number(product.price || 0).toLocaleString()}</p>
            {product.description && <p className={cn("leading-relaxed", isDark ? "text-slate-400" : "text-gray-500")}>{product.description}</p>}

            {colors && colors.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-500" : "text-gray-400")}>Color</p>
                <div className="flex items-center gap-2.5">
                  {colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveColor(i)}
                      aria-label={`Color ${i + 1}`}
                      className={cn("h-8 w-8 rounded-full border-2 transition-all", activeColor === i ? s.accentBorder : "border-transparent")}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <div className={cn("flex items-center border shrink-0", s.radiusMd, isDark ? "border-slate-700" : "border-gray-200")}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className={cn("h-12 w-12 flex items-center justify-center hover:text-gray-900", isDark ? "text-slate-500 hover:text-white" : "text-gray-400")} aria-label="Reducir cantidad"><Minus size={16} /></button>
                <span className={cn("w-10 text-center font-bold text-sm", isDark && "text-white")}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className={cn("h-12 w-12 flex items-center justify-center hover:text-gray-900", isDark ? "text-slate-500 hover:text-white" : "text-gray-400")} aria-label="Aumentar cantidad"><Plus size={16} /></button>
              </div>
              <button
                onClick={() => addToCart({ id: product.id, title: product.name, price: product.price, image: images[0], quantity: qty })}
                className={cn("flex-1 h-12 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2", s.radiusMd, s.btnPrimary)}
              >
                <ShoppingBag size={15} /> Añadir al carrito
              </button>
            </div>

            <div className="pt-2">
              <ProductDetailAccordion title="Material y cuidado" isDark={isDark}>
                {product.materialInfo || 'Elaborado con materiales seleccionados por su durabilidad y calidad. Para conservarlo en buen estado, evita la exposición prolongada al sol y la humedad, y guárdalo en un lugar seco.'}
              </ProductDetailAccordion>
              <ProductDetailAccordion title="Envíos y devoluciones" isDark={isDark}>
                {product.shippingInfo || 'Envíos a todo el país en 2-5 días hábiles. Si no quedas conforme, tienes 30 días desde la entrega para solicitar un cambio o devolución sin costo adicional.'}
              </ProductDetailAccordion>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="flex items-end justify-between mb-8">
              <h3 className={cn("text-2xl tracking-tighter", s.display, s.displayWeight, isAngular && "uppercase", isDark ? "text-white" : "text-gray-900")}>
                Completa el look
              </h3>
              <span onClick={() => goTo('Colecciones')} className={cn("text-[10px] font-black uppercase tracking-widest cursor-pointer border-b pb-1 transition-colors", isDark ? "text-slate-500 border-slate-700 hover:text-white" : "text-gray-400 border-gray-200 hover:text-gray-900")}>
                Ver todo
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((p: any) => (
                <div key={p.id} onClick={() => goToProduct(p.id)} className="space-y-3 cursor-pointer group">
                  <div className={cn("aspect-square overflow-hidden", s.radiusMd, isDark ? "bg-slate-900" : "bg-gray-50")}>
                    <img src={Array.isArray(p.image_url) ? p.image_url[0] : p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                  </div>
                  <p className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{p.name}</p>
                  <p className={cn("text-sm font-black", s.accentText)}>$ {Number(p.price || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// 10.5 BOTÓN PERSONALIZADO — creado a mano en el editor, con su propio
// color, tipografía, tamaño, forma, posición y una URL de destino real
// (interna -> navega dentro de la tienda; externa -> abre en pestaña nueva).
const CUSTOM_BUTTON_RADIUS: Record<string, string> = { square: '0.375rem', soft: '0.75rem', round: '9999px' };
// `onDragHandlePointerDown` solo lo pasa el editor de onboarding (para poder
// arrastrar el botón con el mouse sobre el resto de la página); en la
// tienda publicada nunca se pasa, así que el botón queda fijo donde se dejó
// y nunca es "arrastrable" para un visitante real.
export const SmartCustomButton = ({ props, onDragHandlePointerDown, onRemove }: { props: any; onDragHandlePointerDown?: (e: React.PointerEvent) => void; onRemove?: () => void }) => {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : undefined;

  const handleClick = () => {
    if (onDragHandlePointerDown) return; // en el editor el clic no navega, solo se arrastra
    const url: string | undefined = props.url;
    if (!url) return;
    if (/^https?:\/\//.test(url)) { window.open(url, '_blank'); return; }
    if (slug) router.push(url.startsWith('/') ? url : `/shop/${slug}/${url}`);
  };

  const style: React.CSSProperties = {
    backgroundColor: props.bgColor || '#0A1A1A',
    color: props.textColor || '#FFFFFF',
    borderRadius: CUSTOM_BUTTON_RADIUS[props.shape] || CUSTOM_BUTTON_RADIUS.soft,
    ...(props.fontFamily ? { fontFamily: props.fontFamily } : {}),
    ...(props.fontSize ? { fontSize: scaledRem(0.8, props.fontSize) } : {}),
  };

  // Posición libre: se guarda en px relativos a la sección donde vive el
  // botón (header/body/footer, el primer ancestro con `position: relative`).
  // Sin posición guardada todavía, arranca centrado.
  const hasPos = typeof props.posX === 'number' && typeof props.posY === 'number';
  const wrapperStyle: React.CSSProperties = hasPos
    ? { position: 'absolute', left: props.posX, top: props.posY, zIndex: 30 }
    : { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 30 };

  return (
    <div
      style={wrapperStyle}
      onPointerDown={onDragHandlePointerDown}
      className={cn("group/btn", onDragHandlePointerDown && "cursor-grab active:cursor-grabbing touch-none")}
    >
      {onRemove && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onRemove}
          className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-black/60 hover:bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity z-10"
        >
          <X size={11} />
        </button>
      )}
      <button onClick={handleClick} style={style} className="px-9 py-4 font-bold uppercase tracking-widest shadow-md hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
        {props.text || 'Nuevo botón'}
      </button>
    </div>
  );
};

// 10.6 IMAGEN/VIDEO PERSONALIZADO — misma idea que el botón: posición libre
// (arrastrable en el editor) y tamaño a mano, para poder superponerlo sobre
// cualquier otra parte de la página.
export const SmartCustomMedia = ({ props, onDragHandlePointerDown, onRemove }: { props: any; onDragHandlePointerDown?: (e: React.PointerEvent) => void; onRemove?: () => void }) => {
  const hasPos = typeof props.posX === 'number' && typeof props.posY === 'number';
  const size = props.size || 240;
  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${size}px`,
    zIndex: 25,
    ...(hasPos ? { left: props.posX, top: props.posY } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }),
  };
  const mediaRadius = CUSTOM_BUTTON_RADIUS[props.shape] || CUSTOM_BUTTON_RADIUS.soft;

  return (
    <div
      style={wrapperStyle}
      onPointerDown={onDragHandlePointerDown}
      className={cn("group/media", onDragHandlePointerDown && "cursor-grab active:cursor-grabbing touch-none")}
    >
      {onRemove && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onRemove}
          className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-black/60 hover:bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity z-10"
        >
          <X size={11} />
        </button>
      )}
      {props.mediaUrl ? (
        props.mediaType === 'video' ? (
          <video
            src={props.mediaUrl}
            controls={!onDragHandlePointerDown}
            muted
            playsInline
            className="w-full h-auto shadow-md object-cover pointer-events-auto"
            style={{ borderRadius: mediaRadius }}
          />
        ) : (
          <img src={props.mediaUrl} alt="" className="w-full h-auto shadow-md object-cover" style={{ borderRadius: mediaRadius }} />
        )
      ) : (
        <div className="w-full aspect-[4/3] bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase tracking-widest" style={{ borderRadius: mediaRadius }}>
          Sin imagen
        </div>
      )}
    </div>
  );
};

// 11. TRUST BANNER — franja de confianza (garantia, envios, soporte, pago seguro)
// Usado hoy por la plantilla Tecnologia (computadora) para reforzar credibilidad
// antes del formulario de contacto. Los textos son genericos pero reales (no
// dependen de inventario), por eso no toman props de producto.
export const SmartTrustBanner = ({ props }: { props?: any } = {}) => {
  const inherited = useVariant();
  const variant: StoreVariant = props?.variant || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";

  const items = props?.items || [
    { icon: ShieldCheck, label: "Garantía oficial", sub: "En todos los productos" },
    { icon: Truck, label: "Envío a todo el país", sub: "Rápido y rastreable" },
    { icon: Headset, label: "Soporte real", sub: "Antes y después de tu compra" },
    { icon: Verified, label: "Pago seguro", sub: "Tus datos siempre protegidos" },
  ];

  return (
    <section className={cn("py-16 border-y", variant === "tech" ? "bg-slate-900 border-cyan-400/10" : "bg-slate-50 border-slate-100")}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
        {items.map((item: any, i: number) => {
          const Icon = item.icon || ShieldCheck;
          return (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <div className={cn("h-14 w-14 flex items-center justify-center", isAngular ? "rounded-md" : "rounded-full", s.accentBgSoft, s.accentText)}>
                <Icon size={24} />
              </div>
              <p className={cn("text-xs font-black uppercase tracking-wide", variant === "tech" ? "text-white" : "text-slate-900")}>{item.label}</p>
              <p className={cn("text-[11px]", variant === "tech" ? "text-slate-500" : "text-slate-400")}>{item.sub}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// 12. BENTO GRID — collage editorial de inspiracion (usado por Hogar para
// mostrar ambientes/espacios en un layout asimetrico tipo revista).
export const SmartBentoGrid = ({ props }: { props?: any } = {}) => {
  const inherited = useVariant();
  const variant: StoreVariant = props?.variant || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";

  const items: any[] = props?.items || [];
  if (items.length === 0) return null;

  return (
    <section className={cn("py-32 px-6", variant === "tech" ? "bg-slate-950" : "bg-white")}>
      <div className="max-w-7xl mx-auto">
        <h2 className={cn(
          "text-center text-4xl mb-16",
          s.display, s.displayWeight,
          isAngular && "uppercase",
          variant === "tech" ? "text-white" : "text-slate-900"
        )}>
          {props?.title || 'Inspiración'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-6 h-[600px]">
          {items.slice(0, 5).map((item: any, i: number) => (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden group",
                s.radiusLg,
                i === 0 && "col-span-2 row-span-2",
                i !== 0 && "col-span-1 row-span-1"
              )}
            >
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={item.image} alt={item.label || ''} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
              {item.label && (
                <p className="absolute bottom-4 left-4 text-white text-sm font-bold uppercase tracking-wide">{item.label}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 13. SERVICES BLOCK — franja de servicios/beneficios propios del negocio
// (usado por Hogar: diseno a medida, instalacion, asesoria, etc.)
export const SmartServices = ({ props }: { props?: any } = {}) => {
  const inherited = useVariant();
  const variant: StoreVariant = props?.variant || inherited;
  const s = getVariantStyle(variant);
  const isAngular = variant === "streetwear" || variant === "flash" || variant === "tech";
  const isLuxuryLike = variant === "luxury" || variant === "intimate";

  const services = props?.items || [
    { icon: Ruler, label: "Asesoría a la medida", sub: "Te ayudamos a elegir lo que mejor se adapta a ti" },
    { icon: Truck, label: "Entrega coordinada", sub: "Coordinamos contigo la fecha y el lugar de entrega" },
    { icon: Headset, label: "Atención postventa", sub: "Resolvemos cualquier duda después de tu compra" },
  ];

  return (
    <section className={cn("py-28 px-6", variant === "tech" ? "bg-slate-900" : "bg-slate-50")}>
      <div className="max-w-6xl mx-auto">
        <h2 className={cn(
          "text-center text-3xl md:text-4xl mb-16",
          s.display, s.displayWeight,
          isAngular && "uppercase",
          isLuxuryLike && "italic",
          variant === "tech" ? "text-white" : "text-slate-900"
        )}>
          {props?.title || 'Nuestros Servicios'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {services.map((item: any, i: number) => {
            const Icon = item.icon || Ruler;
            return (
              <div key={i} className={cn("p-8 text-center space-y-4", s.radiusLg, variant === "tech" ? "bg-slate-950" : "bg-white", "shadow-sm")}>
                <div className={cn("h-16 w-16 flex items-center justify-center mx-auto", isAngular ? "rounded-md" : "rounded-full", s.accentBgSoft, s.accentText)}>
                  <Icon size={28} />
                </div>
                <h4 className={cn("text-sm font-black uppercase tracking-wide", variant === "tech" ? "text-white" : "text-slate-900")}>{item.label}</h4>
                <p className={cn("text-sm leading-relaxed", variant === "tech" ? "text-slate-400" : "text-slate-500")}>{item.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
