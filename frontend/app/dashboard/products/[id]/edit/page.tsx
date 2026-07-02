"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Package, Image as ImageIcon, Plus, Trash2, DollarSign,
  ShieldCheck, Zap, AlertCircle, TrendingUp, ChevronRight, Layers,
  BarChart3, X, ShoppingBag, Box, Eye, CheckCircle2, User, Layout,
  ChevronDown, Bot, FileText, HelpCircle, Calculator, Loader2, Tag,
  Info, ArrowLeft, Check, ListChecks,
  Scissors, Cpu, Home, Wrench, Coffee, SlidersHorizontal, Ruler, Watch, Circle
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';

// ── HELPERS ────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('de-DE').format(n);
const fmtCOP = (n: number) => `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n)}`;

// ── ATRIBUTOS POR NICHO ───────────────────────────────────────────────────
const NICHO_GRUPOS = [
  {
    id: 'moda', label: 'Moda & Ropa', icon: '👔',
    attrs: [
      { id: 'talla_ropa',   label: 'Talla',    icon: '📏', isColor: false, presets: ['XS','S','M','L','XL','XXL','3XL','Única'] },
      { id: 'color',        label: 'Color',    icon: '🎨', isColor: true,  presets: ['Negro','Blanco','Rojo','Azul','Verde','Amarillo','Naranja','Rosa','Gris','Café','Beige','Morado'], colorMap: {'Negro':'#111827','Blanco':'#F9FAFB','Rojo':'#EF4444','Azul':'#3B82F6','Verde':'#22C55E','Amarillo':'#EAB308','Naranja':'#F97316','Rosa':'#EC4899','Gris':'#9CA3AF','Café':'#92400E','Beige':'#D4B896','Morado':'#A855F7'} },
      { id: 'material_ropa',label: 'Material', icon: '🧵', isColor: false, presets: ['Algodón','Lino','Poliéster','Seda','Cuero','Denim','Lana','Rayón','Lycra','Nylon'] },
      { id: 'estilo',       label: 'Estilo',   icon: '✨', isColor: false, presets: ['Casual','Formal','Deportivo','Vintage','Oversize','Regular','Slim'] },
      { id: 'genero',       label: 'Género',   icon: '👤', isColor: false, presets: ['Hombre','Mujer','Unisex','Niño','Niña'] },
    ],
  },
  {
    id: 'calzado', label: 'Calzado', icon: '👟',
    attrs: [
      { id: 'talla_zapato',     label: 'Talla (número)', icon: '🔢', isColor: false, presets: ['34','35','36','37','38','39','40','41','42','43','44','45'] },
      { id: 'color',            label: 'Color',          icon: '🎨', isColor: true,  presets: ['Negro','Blanco','Café','Gris','Azul','Rojo','Beige'], colorMap: {'Negro':'#111827','Blanco':'#F9FAFB','Café':'#92400E','Gris':'#9CA3AF','Azul':'#3B82F6','Rojo':'#EF4444','Beige':'#D4B896'} },
      { id: 'material_calzado', label: 'Material',       icon: '🧵', isColor: false, presets: ['Cuero','Cuero sintético','Tela','Canvas','Goma','Gamuza'] },
    ],
  },
  {
    id: 'tech', label: 'Tecnología', icon: '💻',
    attrs: [
      { id: 'almacenamiento', label: 'Almacenamiento', icon: '💾', isColor: false, presets: ['64 GB','128 GB','256 GB','512 GB','1 TB','2 TB'] },
      { id: 'ram',            label: 'RAM',            icon: '⚡', isColor: false, presets: ['4 GB','8 GB','16 GB','32 GB','64 GB'] },
      { id: 'color_tech',     label: 'Color',          icon: '🎨', isColor: true,  presets: ['Negro','Blanco','Plata','Gris','Azul','Rosa','Dorado'], colorMap: {'Negro':'#111827','Blanco':'#F9FAFB','Plata':'#C0C0C0','Gris':'#9CA3AF','Azul':'#3B82F6','Rosa':'#EC4899','Dorado':'#D4AF37'} },
      { id: 'conectividad',   label: 'Conectividad',   icon: '📡', isColor: false, presets: ['WiFi','WiFi + 4G','WiFi + 5G','Bluetooth','USB-C','HDMI'] },
      { id: 'voltaje',        label: 'Voltaje',        icon: '🔌', isColor: false, presets: ['110V','220V','110-220V'] },
    ],
  },
  {
    id: 'accesorios', label: 'Accesorios & Bolsos', icon: '👜',
    attrs: [
      { id: 'color_acc',    label: 'Color',    icon: '🎨', isColor: true,  presets: ['Negro','Café','Beige','Blanco','Rosado','Azul','Verde','Gris','Rojo','Mostaza'], colorMap: {'Negro':'#111827','Café':'#92400E','Beige':'#D4B896','Blanco':'#F9FAFB','Rosado':'#FBCFE8','Azul':'#3B82F6','Verde':'#22C55E','Gris':'#9CA3AF','Rojo':'#EF4444','Mostaza':'#CA8A04'} },
      { id: 'material_acc', label: 'Material', icon: '🧵', isColor: false, presets: ['Cuero genuino','Cuero sintético','Lona','Nylon','Paja','Terciopelo'] },
      { id: 'tamano_bolso', label: 'Tamaño',   icon: '📐', isColor: false, presets: ['Mini','Pequeño','Mediano','Grande','XL'] },
      { id: 'tipo_bolso',   label: 'Tipo',     icon: '🏷️', isColor: false, presets: ['Tote','Crossbody','Clutch','Mochila','Morral','Riñonera','Maletín'] },
    ],
  },
  {
    id: 'gorras', label: 'Gorras & Sombreros', icon: '🧢',
    attrs: [
      { id: 'talla_gorra',  label: 'Talla',  icon: '📏', isColor: false, presets: ['S','M','L','XL','Ajustable','Única'] },
      { id: 'color_gorra',  label: 'Color',  icon: '🎨', isColor: true,  presets: ['Negro','Blanco','Azul navy','Rojo','Gris','Verde oliva','Café','Camuflaje'], colorMap: {'Negro':'#111827','Blanco':'#F9FAFB','Azul navy':'#1E3A5F','Rojo':'#EF4444','Gris':'#9CA3AF','Verde oliva':'#4A5E23','Café':'#92400E','Camuflaje':'#78866B'} },
      { id: 'estilo_gorra', label: 'Estilo', icon: '✨', isColor: false, presets: ['Visera curva','Visera plana','Snapback','Trucker','Bucket','Beanie'] },
    ],
  },
  {
    id: 'relojes', label: 'Relojes & Joyería', icon: '⌚',
    attrs: [
      { id: 'material_correa',  label: 'Material correa', icon: '🔗', isColor: false, presets: ['Cuero','Acero inoxidable','Silicona','Nylon','Caucho','Malla milanesa'] },
      { id: 'color_reloj',      label: 'Color esfera',    icon: '🎨', isColor: true,  presets: ['Negro','Blanco','Azul','Gris','Dorado','Rosado'], colorMap: {'Negro':'#111827','Blanco':'#F9FAFB','Azul':'#3B82F6','Gris':'#9CA3AF','Dorado':'#D4AF37','Rosado':'#FBCFE8'} },
      { id: 'tipo_movimiento',  label: 'Movimiento',      icon: '⚙️', isColor: false, presets: ['Cuarzo','Automático','Digital','Solar','Cinético'] },
      { id: 'metal_joya',       label: 'Metal',           icon: '💍', isColor: false, presets: ['Oro amarillo','Oro blanco','Oro rosa','Plata','Acero inoxidable','Titanio'] },
      { id: 'talla_anillo',     label: 'Talla anillo',    icon: '💎', isColor: false, presets: ['5','6','7','8','9','10','11','12'] },
    ],
  },
  {
    id: 'muebles', label: 'Muebles & Hogar', icon: '🛋️',
    attrs: [
      { id: 'color_mueble',    label: 'Color/Acabado', icon: '🎨', isColor: true,  presets: ['Roble natural','Wengué','Blanco','Negro','Gris','Verde','Azul petróleo'], colorMap: {'Roble natural':'#C69E6A','Wengué':'#3B2314','Blanco':'#F9FAFB','Negro':'#111827','Gris':'#9CA3AF','Verde':'#16A34A','Azul petróleo':'#0E4D5E'} },
      { id: 'material_mueble', label: 'Material',      icon: '🪵', isColor: false, presets: ['Madera sólida','MDF','Melamina','Metal','Vidrio','Ratán','Bambú'] },
      { id: 'dimensiones',     label: 'Dimensiones',   icon: '📐', isColor: false, presets: ['Pequeño','Mediano','Grande','1 plaza','1.5 plazas','2 plazas','3 plazas'] },
      { id: 'estilo_mueble',   label: 'Estilo',        icon: '✨', isColor: false, presets: ['Moderno','Clásico','Industrial','Escandinavo','Rústico','Minimalista'] },
    ],
  },
  {
    id: 'repuestos', label: 'Repuestos & Autos', icon: '🔧',
    attrs: [
      { id: 'marca_compatible', label: 'Marca compatible', icon: '🏷️', isColor: false, presets: ['Toyota','Chevrolet','Mazda','Ford','Nissan','Renault','Kia','Hyundai','Honda','Yamaha','Suzuki','AKT'] },
      { id: 'posicion',         label: 'Posición',          icon: '📍', isColor: false, presets: ['Delantera izquierda','Delantera derecha','Trasera izquierda','Trasera derecha','Universal'] },
      { id: 'año_vehiculo',     label: 'Año',               icon: '📅', isColor: false, presets: ['2015-2018','2018-2020','2020-2022','2022-2024','Universal'] },
      { id: 'tipo_repuesto',    label: 'Tipo',              icon: '⚙️', isColor: false, presets: ['Original','Genérico','Remanufacturado','OEM'] },
    ],
  },
  {
    id: 'alimentos', label: 'Alimentos & Bebidas', icon: '🍽️',
    attrs: [
      { id: 'sabor',        label: 'Sabor',        icon: '😋', isColor: false, presets: ['Natural','Vainilla','Chocolate','Fresa','Mango','Limón','Mora','Maracuyá'] },
      { id: 'peso',         label: 'Peso/Tamaño',  icon: '⚖️', isColor: false, presets: ['50 g','100 g','250 g','500 g','1 kg','2 kg','5 kg'] },
      { id: 'presentacion', label: 'Presentación', icon: '📦', isColor: false, presets: ['Bolsa','Caja','Frasco','Lata','Tarro','Paquete','Granel'] },
      { id: 'unidades_pack',label: 'Pack',         icon: '🛍️', isColor: false, presets: ['Unidad','Pack x2','Pack x3','Pack x6','Pack x12','Docena','Mayoreo'] },
    ],
  },
  {
    id: 'custom_group', label: 'Personalizado', icon: '✏️',
    attrs: [
      { id: 'custom', label: 'Atributo personalizado', icon: '✏️', isColor: false, presets: [] },
    ],
  },
] as const;

const NICHO_ICON_MAP: Record<string, React.ReactNode> = {
  moda: <Scissors size={11}/>, calzado: <Ruler size={11}/>, tech: <Cpu size={11}/>,
  accesorios: <ShoppingBag size={11}/>, gorras: <Circle size={11}/>, relojes: <Watch size={11}/>,
  muebles: <Home size={11}/>, repuestos: <Wrench size={11}/>, alimentos: <Coffee size={11}/>,
  custom_group: <SlidersHorizontal size={11}/>,
};

type AttrItem = {
  id: string; label: string; icon: string; isColor: boolean;
  presets: readonly string[]; colorMap?: Record<string, string>; nichoId: string; nichoLabel: string;
};
const ALL_ATTRS: AttrItem[] = NICHO_GRUPOS.flatMap(g =>
  g.attrs.map(a => ({ ...a, nichoId: g.id, nichoLabel: g.label, presets: [...a.presets] as string[], colorMap: (a as any).colorMap }))
);

// ── VARIANT MODAL ─────────────────────────────────────────────────────────
function VariantModal({ tempVariantName, setTempVariantName, tempSubVariants, setTempSubVariants, editingMasterName, onClose, onSave }: {
  tempVariantName: string; setTempVariantName: (v: string) => void;
  tempSubVariants: { id: string; spec: string; stock: number }[];
  setTempSubVariants: (v: any) => void;
  editingMasterName: string | null; onClose: () => void; onSave: () => void;
}) {
  const [step, setStep] = useState<'type' | 'options'>(editingMasterName ? 'options' : 'type');
  const [selectedAttr, setSelectedAttr] = useState<AttrItem | null>(editingMasterName ? ALL_ATTRS.find(a => a.id === 'custom') ?? null : null);
  const [activeNicho, setActiveNicho] = useState<string>(NICHO_GRUPOS[0].id);
  const [searchQ, setSearchQ] = useState('');
  const [globalStock, setGlobalStock] = useState(0);
  const [useGlobal, setUseGlobal] = useState(false);
  const genId = () => Math.random().toString(36).substr(2, 9);
  const isColorAttr = selectedAttr?.isColor ?? false;

  const searchResults = searchQ.trim().length > 0
    ? ALL_ATTRS.filter(a => a.label.toLowerCase().includes(searchQ.toLowerCase()) || a.presets.some(p => p.toLowerCase().includes(searchQ.toLowerCase())) || a.nichoLabel.toLowerCase().includes(searchQ.toLowerCase()))
    : null;

  const handleSelectAttr = (attr: AttrItem) => {
    setSelectedAttr(attr);
    setTempVariantName(attr.id === 'custom' ? '' : attr.label);
    setTempSubVariants([{ id: genId(), spec: '', stock: 0 }]);
    setStep('options');
    setSearchQ('');
  };

  const activePresets = tempSubVariants.filter(sv => sv.spec.trim() !== '').map(sv => sv.spec.includes(':') ? sv.spec.split(':')[0].trim() : sv.spec);

  const togglePreset = (val: string) => {
    const exists = activePresets.includes(val);
    if (exists) {
      setTempSubVariants((p: any[]) => p.filter(sv => { const base = sv.spec.includes(':') ? sv.spec.split(':')[0].trim() : sv.spec; return base !== val; }));
    } else {
      const colorHex = selectedAttr?.colorMap?.[val];
      setTempSubVariants((p: any[]) => [...p.filter(sv => sv.spec.trim() !== ''), { id: genId(), spec: colorHex ? `${val}: ${colorHex}` : val, stock: useGlobal ? globalStock : 0 }]);
    }
  };

  const inputBase = "w-full h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/40 transition-colors";

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" style={{ zIndex: 9998 }} onClick={onClose}/>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
          className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="bg-[#001a1a] px-6 pt-5 pb-0 shrink-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[9px] font-bold tracking-widest text-[#00f2ff]/40 uppercase">{editingMasterName ? `Editando: ${editingMasterName}` : 'Nuevo atributo'}</p>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {step === 'type' ? 'Selecciona un atributo' : selectedAttr?.id === 'custom' ? 'Atributo personalizado' : tempVariantName || 'Configura las opciones'}
                </h3>
                {step === 'options' && selectedAttr && selectedAttr.id !== 'custom' && (
                  <p className="text-[10px] text-[#00f2ff]/40 mt-0.5 uppercase tracking-widest font-bold">{selectedAttr.nichoLabel}</p>
                )}
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-all mt-1"><X size={14}/></button>
            </div>
            <div className="flex">
              {(['type', 'options'] as const).map((s, i) => (
                <button key={s} onClick={() => !editingMasterName && s === 'type' && setStep('type')} disabled={s === 'type' && !!editingMasterName}
                  className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${step === s ? 'border-[#00f2ff] text-[#00f2ff]' : 'border-transparent text-white/25 hover:text-white/40'} disabled:cursor-default`}>
                  {i + 1}. {s === 'type' ? 'Tipo de atributo' : 'Opciones y stock'}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {step === 'type' && (
                <motion.div key="type" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-5 pt-4 pb-2 shrink-0">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      </div>
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar atributo: talla, sabor, voltaje, marca…"
                        className="w-full h-10 pl-9 pr-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/40 focus:bg-white transition-all"/>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden flex">
                    {searchResults ? (
                      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1.5 pt-1">
                        {searchResults.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            </div>
                            <p className="text-[11px] font-bold text-gray-400">Sin resultados para "{searchQ}"</p>
                            <button onClick={() => handleSelectAttr(ALL_ATTRS.find(a => a.id === 'custom')!)}
                              className="mt-3 text-[10px] font-bold text-[#004d4d] hover:underline">Crear atributo personalizado</button>
                          </div>
                        ) : searchResults.map(attr => (
                          <button key={attr.id + attr.nichoId} onClick={() => handleSelectAttr(attr)}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-left">
                            <span className="text-lg">{attr.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800">{attr.label}</p>
                              <p className="text-[9px] text-gray-400 truncate">{attr.nichoLabel} · {attr.presets.slice(0,4).join(', ')}{attr.presets.length > 4 ? '…' : ''}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar nichos */}
                        <div className="w-36 border-r border-gray-100 overflow-y-auto py-2 shrink-0">
                          {NICHO_GRUPOS.map(g => (
                            <button key={g.id} onClick={() => setActiveNicho(g.id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-all ${activeNicho === g.id ? 'bg-[#004d4d]/8 text-[#004d4d]' : 'text-gray-500 hover:bg-gray-50'}`}>
                              <span className="shrink-0">{NICHO_ICON_MAP[g.id]}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wide truncate">{g.label}</span>
                            </button>
                          ))}
                        </div>
                        {/* Attrs del nicho activo */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                          {NICHO_GRUPOS.find(g => g.id === activeNicho)?.attrs.map(attr => (
                            <button key={attr.id} onClick={() => handleSelectAttr({ ...attr, nichoId: activeNicho, nichoLabel: NICHO_GRUPOS.find(g => g.id === activeNicho)?.label || '', presets: [...attr.presets] as string[], colorMap: (attr as any).colorMap })}
                              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#004d4d]/5 border border-transparent hover:border-[#004d4d]/10 transition-all text-left group">
                              <div className="h-9 w-9 rounded-xl bg-gray-100 group-hover:bg-[#004d4d]/10 flex items-center justify-center text-base shrink-0 transition-colors">{attr.icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800 group-hover:text-[#004d4d] transition-colors">{attr.label}</p>
                                <p className="text-[9px] text-gray-400 truncate">{(attr.presets as readonly string[]).slice(0,4).join(' · ')}{attr.presets.length > 4 ? '…' : ''}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 'options' && (
                <motion.div key="options" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex flex-col flex-1 overflow-hidden">
                  {/* Nombre del atributo (custom) */}
                  {selectedAttr?.id === 'custom' && (
                    <div className="px-5 pt-4 pb-0 shrink-0">
                      <input value={tempVariantName} onChange={e => setTempVariantName(e.target.value)} placeholder="Nombre del atributo (ej: Material, Talla, Sabor…)" className={inputBase + " h-10"}/>
                    </div>
                  )}

                  {/* Presets de color o texto */}
                  {isColorAttr && selectedAttr?.presets && selectedAttr.presets.length > 0 && (
                    <div className="px-5 pt-4 pb-2 shrink-0">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Colores rápidos</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAttr.presets.map(val => {
                          const hex = selectedAttr.colorMap?.[val];
                          const isActive = activePresets.includes(val);
                          return (
                            <button key={val} onClick={() => togglePreset(val)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-bold transition-all ${isActive ? 'border-[#004d4d] bg-[#004d4d]/8 text-[#004d4d]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {hex && <div className="h-3 w-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: hex }}/>}
                              {val}
                              {isActive && <Check size={9} className="text-[#004d4d]"/>}
                            </button>
                          );
                        })}
                        {/* Color personalizado */}
                        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-gray-300 text-[9px] font-bold text-gray-500 hover:border-[#004d4d]/40 cursor-pointer transition-all relative overflow-hidden">
                          <div className="h-3 w-3 rounded-full border border-gray-300 bg-gradient-to-br from-pink-400 via-yellow-300 to-blue-400 shrink-0"/>
                          Personalizar
                          <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={e => {
                              const hex = e.target.value;
                              const label = `Color: ${hex}`;
                              if (!activePresets.includes(label)) {
                                setTempSubVariants((p: any[]) => [...p.filter(sv => sv.spec.trim() !== ''), { id: genId(), spec: `${label}`, stock: useGlobal ? globalStock : 0 }]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {!isColorAttr && selectedAttr?.presets && selectedAttr.presets.length > 0 && (
                    <div className="px-5 pt-4 pb-2 shrink-0">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Opciones rápidas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAttr.presets.map(val => {
                          const isActive = activePresets.includes(val);
                          return (
                            <button key={val} onClick={() => togglePreset(val)}
                              className={`px-2.5 py-1 rounded-xl border text-[9px] font-bold transition-all ${isActive ? 'border-[#004d4d] bg-[#004d4d] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {val}{isActive && ' ✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stock global */}
                  <div className="px-5 pt-3 pb-2 shrink-0">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <input type="checkbox" id="useGlobal" checked={useGlobal} onChange={e => setUseGlobal(e.target.checked)} className="rounded"/>
                      <label htmlFor="useGlobal" className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Stock global para todas</label>
                      {useGlobal && (
                        <input type="number" value={globalStock} min={0} onChange={e => { const v = Number(e.target.value); setGlobalStock(v); setTempSubVariants((p: any[]) => p.map(sv => ({ ...sv, stock: v }))); }}
                          className="ml-auto h-7 w-20 rounded-lg border border-gray-200 text-center text-sm font-black text-[#004d4d] focus:outline-none"/>
                      )}
                    </div>
                  </div>

                  {/* Lista de opciones */}
                  <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2 pt-1">
                    {tempSubVariants.map((sv, idx) => {
                      const hasHex = sv.spec.includes(': ') && sv.spec.split(': ')[1]?.startsWith('#');
                      const colorHex = hasHex ? sv.spec.split(': ')[1] : null;
                      const labelVal = hasHex ? sv.spec.split(': ')[0] : sv.spec;
                      return (
                        <motion.div key={sv.id} layout className={`grid gap-2 items-center ${isColorAttr ? 'grid-cols-[32px_1fr_80px_32px]' : 'grid-cols-[1fr_80px_32px]'}`}>
                          {isColorAttr && (
                            <label className="relative h-8 w-8 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer shrink-0">
                              <div className="absolute inset-0 rounded-[10px]" style={{ backgroundColor: colorHex || '#6B7280' }}/>
                              <input type="color" value={colorHex || '#6B7280'}
                                onChange={e => setTempSubVariants((p: any[]) => p.map(i => i.id === sv.id ? { ...i, spec: `${labelVal || 'Color'}: ${e.target.value}` } : i))}
                                className="opacity-0 w-full h-full cursor-pointer"/>
                            </label>
                          )}
                          <input value={labelVal}
                            onChange={e => { const nl = e.target.value; setTempSubVariants((p: any[]) => p.map(i => i.id === sv.id ? { ...i, spec: isColorAttr && colorHex ? `${nl}: ${colorHex}` : nl } : i)); }}
                            placeholder={selectedAttr?.presets[0] ? `Ej: ${selectedAttr.presets[0]}` : 'Escribe una opción…'}
                            className={inputBase}/>
                          <input type="number" value={sv.stock} min={0}
                            onChange={e => setTempSubVariants((p: any[]) => p.map(i => i.id === sv.id ? { ...i, stock: Number(e.target.value) } : i))}
                            placeholder="0"
                            className="h-9 w-full rounded-xl border border-gray-200 text-center text-sm font-black text-[#004d4d] focus:outline-none focus:border-[#004d4d]/40 bg-[#004d4d]/5 transition-colors"/>
                          <button onClick={() => setTempSubVariants((p: any[]) => p.filter(i => i.id !== sv.id))}
                            className="h-9 w-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-rose-400 hover:bg-rose-50 transition-all">
                            <Trash2 size={13}/>
                          </button>
                        </motion.div>
                      );
                    })}
                    <button onClick={() => setTempSubVariants((p: any[]) => [...p, { id: genId(), spec: '', stock: useGlobal ? globalStock : 0 }])}
                      className="flex items-center gap-2 h-9 rounded-xl border border-dashed border-[#004d4d]/20 text-[9px] font-black text-[#004d4d] uppercase tracking-widest hover:border-[#004d4d]/40 hover:bg-[#004d4d]/5 transition-all w-full justify-center">
                      <Plus size={11}/> Añadir opción
                    </button>
                  </div>

                  {tempSubVariants.filter(sv => sv.spec.trim()).length > 0 && (
                    <div className="px-5 pb-3 shrink-0">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-3 border border-gray-200/60">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vista previa</p>
                          <p className="text-[9px] font-black text-[#004d4d]">{tempSubVariants.reduce((a, sv) => a + (sv.stock || 0), 0)} uds total</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tempSubVariants.filter(sv => sv.spec.trim()).map((sv, i) => {
                            const hasHex = sv.spec.includes(': ') && sv.spec.split(': ')[1]?.startsWith('#');
                            const hex = hasHex ? sv.spec.split(': ')[1] : null;
                            const label = hasHex ? sv.spec.split(': ')[0] : sv.spec;
                            return (
                              <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl border border-gray-200 shadow-sm text-[9px] font-bold text-gray-700">
                                {hex && <div className="h-3 w-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: hex }}/>}
                                {label} <span className="text-[#004d4d]">{sv.stock}u</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-5 py-4 bg-gray-50 border-t border-gray-100 shrink-0">
            {step === 'options' && !editingMasterName && (
              <button onClick={() => setStep('type')} className="h-10 px-4 rounded-2xl border border-gray-200 text-[9px] font-bold text-gray-500 hover:border-gray-300 hover:bg-white transition-all flex items-center gap-1.5 shrink-0">
                <ArrowLeft size={11}/> Cambiar
              </button>
            )}
            <button onClick={onClose} className="h-10 px-4 rounded-2xl text-[9px] font-bold text-gray-400 hover:text-gray-600 transition-colors shrink-0">Cancelar</button>
            <button onClick={onSave}
              disabled={step !== 'options' || !tempVariantName.trim() || tempSubVariants.filter(sv => sv.spec.trim()).length === 0}
              className="flex-1 h-10 rounded-2xl bg-gradient-to-r from-[#004d4d] to-[#00706e] hover:from-[#003838] hover:to-[#005856] text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-sm">
              <Check size={12}/>
              {step === 'type' ? 'Selecciona un tipo primero' : `Guardar ${tempSubVariants.filter(sv => sv.spec.trim()).length} opción${tempSubVariants.filter(sv => sv.spec.trim()).length !== 1 ? 'es' : ''}`}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────
export default function EditProductPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'variants'>('info');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [isNewVariantModalOpen, setIsNewVariantModalOpen] = useState(false);
  const [tempVariantName, setTempVariantName] = useState('');
  const [tempSubVariants, setTempSubVariants] = useState([{ id: '1', spec: '', stock: 0 }]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [editingMasterName, setEditingMasterName] = useState<string | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

  const [fixedCosts, setFixedCosts] = useState({ payroll: 0, rent: 0, services: 0, others: 0 });
  const [simulationUnits, setSimulationUnits] = useState(1);
  const [simulationRetailMargin, setSimulationRetailMargin] = useState(30);
  const [simulationWholesaleMargin, setSimulationWholesaleMargin] = useState(15);

  const [formData, setFormData] = useState({
    name: '', description: '', price: 0, wholesale_price: 0, cost: 0,
    category: '', collection_id: null as string | null, sku: '',
    status: 'active' as 'active' | 'draft', add_gateway_fee: false,
    tags: [] as string[], warranty: '', features: '', important_info: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [variants, setVariants] = useState<any[]>([]);
  const [media, setMedia] = useState<{ file?: File; preview: string; type: 'image' | 'video'; isExisting?: boolean }[]>([]);

  const bayupRate = 0.035;
  const prixRate = 0.025;

  const completeness = Math.min(100, (
    (formData.name ? 25 : 0) + (formData.description ? 15 : 0) +
    (media.length > 0 ? 20 : 0) + (formData.price > 0 ? 20 : 0) + (variants.length > 0 ? 20 : 0)
  ));

  const formatNumber = (val: number) => { if (!val && val !== 0) return ''; return new Intl.NumberFormat('de-DE').format(val); };

  const handleNumberChange = (val: string, field: string, isFixedCost = false) => {
    const raw = val.replace(/\./g, '').replace(/[^0-9]/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    if (isFixedCost) setFixedCosts(p => ({ ...p, [field]: num }));
    else setFormData(p => ({ ...p, [field]: num }));
  };

  const calculateProfit = (price: number) => {
    if (!price) return { net: 0, margin: 0, bayupFee: 0 };
    const bayupFee = price * bayupRate;
    const wompiFee = price * prixRate;
    const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
    const net = price - (formData.cost || 0) - (totalFixed / (simulationUnits || 1)) - bayupFee - wompiFee;
    return { net: Math.round(net), margin: price > 0 ? (net / price) * 100 : 0, bayupFee: Math.round(bayupFee) };
  };

  const recommendedRetail = () => {
    const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
    const costPerUnit = (formData.cost || 0) + (totalFixed / (simulationUnits || 1));
    const divisor = 1 - simulationRetailMargin / 100 - bayupRate - prixRate;
    if (divisor <= 0) return 0;
    return Math.ceil((costPerUnit / divisor) / 100) * 100;
  };

  const recommendedWholesale = () => {
    const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
    const costPerUnit = (formData.cost || 0) + (totalFixed / (simulationUnits || 1));
    const divisor = 1 - simulationWholesaleMargin / 100 - bayupRate - prixRate;
    if (divisor <= 0) return 0;
    return Math.ceil((costPerUnit / divisor) / 100) * 100;
  };

  // Cargar producto y categorías
  useEffect(() => {
    if (!token || !productId) return;
    const init = async () => {
      setIsLoading(true);
      try {
        const [cats, prod] = await Promise.all([
          apiRequest<any[]>('/collections', { token }).catch(() => null),
          apiRequest<any>(`/products/${productId}`, { token }).catch(() => null),
        ]);
        if (cats) setCategoriesList(cats);
        if (prod) {
          setFormData({
            name: prod.name || '',
            description: prod.description || '',
            price: prod.price || 0,
            wholesale_price: prod.wholesale_price || 0,
            cost: prod.cost || 0,
            category: prod.category || '',
            collection_id: prod.collection_id || null,
            sku: prod.sku || '',
            status: prod.status || 'active',
            add_gateway_fee: prod.add_gateway_fee || false,
            tags: Array.isArray(prod.tags) ? prod.tags : [],
            warranty: prod.warranty || '',
            features: prod.features || '',
            important_info: prod.important_info || '',
          });
          setVariants(prod.variants || []);

          const extractUrls = (raw: any): string[] => {
            if (!raw) return [];
            try {
              let v = raw;
              if (typeof v === 'string' && v.startsWith('[')) { try { v = JSON.parse(v); } catch { return [v]; } }
              if (Array.isArray(v)) return v.filter(x => typeof x === 'string' && x.length > 5);
              if (typeof v === 'string' && v.length > 5) return [v];
            } catch { return []; }
            return [];
          };
          const urls = extractUrls(prod.image_url);
          if (urls.length > 0) {
            setMedia(urls.map(url => ({ preview: url, type: url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? 'video' : 'image', isExisting: true })));
          }
        }
      } catch (e) { showToast('Error al cargar el producto', 'error'); }
      finally { setIsLoading(false); }
    };
    init();
  }, [token, productId]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await apiRequest<any>('/collections', { method: 'POST', token, body: JSON.stringify({ title: newCategoryName, description: 'Creada desde producto', status: 'active' }) });
      if (res) {
        setCategoriesList(p => [...p, res]);
        setFormData(f => ({ ...f, category: res.title, collection_id: res.id }));
        setIsNewCategoryModalOpen(false);
        setNewCategoryName('');
        setIsCategoryOpen(false);
        showToast('Categoría creada ✨', 'success');
      }
    } catch { showToast('Error al crear categoría', 'error'); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (media.length >= 5) return showToast('Límite de 5 archivos', 'info');
    for (const file of files.slice(0, 5 - media.length)) {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setMedia(p => [...p, { file, preview: URL.createObjectURL(file), type }]);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return showToast('El nombre es obligatorio', 'error');
    setIsSubmitting(true);
    try {
      const uploadPromises = media.map(async item => {
        if (!item.file) return item.preview; // ya existente
        const fd = new FormData(); fd.append('file', item.file);
        try {
          const res = await apiRequest<{ url: string }>('/admin/upload-image', { method: 'POST', token, body: fd });
          return res.url;
        } catch { return null; }
      });
      const finalUrls = (await Promise.all(uploadPromises)).filter((u): u is string => !!u);
      const payload = {
        ...formData,
        image_url: finalUrls,
        variants: variants.map(v => ({ name: v.name, sku: v.sku || '', stock: Number(v.stock) || 0 }))
      };
      await apiRequest(`/products/${productId}`, { method: 'PUT', token, body: JSON.stringify(payload) });
      window.dispatchEvent(new CustomEvent('bayup_product_update'));
      showToast('Producto actualizado ✨', 'success');
      router.push('/dashboard/products');
    } catch (err: any) {
      console.error('handleSave error:', err);
      showToast(err?.message || 'Error al guardar', 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleEditAttribute = (masterName: string) => {
    setEditingMasterName(masterName);
    const masterVariants = variants.filter(v => v.name.startsWith(masterName));
    setTempVariantName(masterName);
    setTempSubVariants(masterVariants.map(v => ({ id: v.id || Math.random().toString(36).substr(2, 9), spec: v.name.split('/')[1]?.trim() || v.name, stock: v.stock })));
    setIsNewVariantModalOpen(true);
  };

  const handleSaveMatrixAttributes = () => {
    if (!tempVariantName.trim()) return;
    const newVariants = editingMasterName ? variants.filter(v => !v.name.startsWith(editingMasterName)) : [...variants];
    const newCombs = tempSubVariants.filter(sv => sv.spec.trim()).map(sv => ({ id: sv.id, name: `${tempVariantName} / ${sv.spec}`, sku: '', stock: sv.stock }));
    setVariants([...newVariants, ...newCombs]);
    setIsNewVariantModalOpen(false); setTempVariantName(''); setTempSubVariants([{ id: '1', spec: '', stock: 0 }]); setEditingMasterName(null);
  };

  const TABS = [
    { key: 'info',      label: 'Información', step: 1 },
    { key: 'financial', label: 'Finanzas',    step: 2 },
    { key: 'variants',  label: 'Variantes',   step: 3 },
  ] as const;

  const inputCls = "w-full h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/40 transition-colors";

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#004d4d]"/>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando producto…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-[#f8f9fa] flex flex-col lg:flex-row overflow-hidden text-slate-900">

      {/* Botón cerrar */}
      <button onClick={() => router.push('/dashboard/products')}
        className="absolute top-5 right-5 z-[5000] h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-700 shadow-sm transition-all">
        <X size={15}/>
      </button>

      {/* ══ PANEL IZQUIERDO ══ */}
      <div className="w-full lg:w-[55%] h-full flex flex-col bg-white border-r border-gray-100 overflow-hidden">

        {/* Header fijo */}
        <div className="px-8 pt-7 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-gray-400 flex items-center gap-1.5 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>Editando producto
              </p>
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">
                EDITAR PRODUCTO
              </h1>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-gray-400 mb-1">{completeness}% completo</p>
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${completeness}%` }} transition={{ duration: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#004d4d] to-[#00b2bd]"/>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-1 mb-0">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-t-2xl border-b-2 transition-all text-left ${activeTab === tab.key ? 'border-[#004d4d] bg-gray-50' : 'border-transparent hover:bg-gray-50/60'}`}>
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 transition-all ${activeTab === tab.key ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-400'}`}>{tab.step}</div>
                <p className={`text-[10px] font-black truncate ${activeTab === tab.key ? 'text-[#004d4d]' : 'text-gray-400'}`}>{tab.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* ── TAB INFO ── */}
            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-[#004d4d] flex items-center gap-1.5"><FileText size={10}/> Información básica</p>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nombre del producto *</label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className={inputCls + " h-11 text-base"} placeholder="Ej: Camiseta Oversize de Algodón Premium"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 relative">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Categoría</label>
                      <button onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-left flex items-center justify-between hover:border-[#004d4d]/40 transition-colors">
                        <span className={formData.category ? 'text-gray-800' : 'text-gray-300'}>{formData.category || 'Seleccionar…'}</span>
                        <ChevronDown size={13} className="text-gray-400 shrink-0"/>
                      </button>
                      <AnimatePresence>
                        {isCategoryOpen && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-1.5 max-h-48 overflow-y-auto">
                            {categoriesList.map(cat => (
                              <button key={cat.id} onClick={() => { setFormData({...formData, category: cat.title, collection_id: cat.id}); setIsCategoryOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-xl text-[10px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#004d4d] transition-colors">
                                {cat.title}
                              </button>
                            ))}
                            <button onClick={() => { setIsNewCategoryModalOpen(true); setIsCategoryOpen(false); }}
                              className="w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold text-[#004d4d] bg-[#004d4d]/5 border border-dashed border-[#004d4d]/20 hover:bg-[#004d4d] hover:text-white transition-all flex items-center gap-1.5 mt-1">
                              <Plus size={10}/> Nueva categoría
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Estado</label>
                      <div className="flex h-10 bg-gray-100 p-0.5 rounded-xl">
                        <button onClick={() => setFormData({...formData, status: 'active'})}
                          className={`flex-1 rounded-[10px] text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${formData.status === 'active' ? 'bg-[#004d4d] text-white shadow-sm' : 'text-gray-400'}`}>
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>Activo
                        </button>
                        <button onClick={() => setFormData({...formData, status: 'draft'})}
                          className={`flex-1 rounded-[10px] text-[9px] font-black uppercase transition-all ${formData.status === 'draft' ? 'bg-[#004d4d] text-white shadow-sm' : 'text-gray-400'}`}>
                          Borrador
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Descripción</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3}
                      placeholder="Describe los materiales, tallas y detalles únicos de este producto…"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/40 transition-colors resize-none"/>
                  </div>
                </div>

                {/* Multimedia */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold tracking-widest uppercase text-[#004d4d] flex items-center gap-1.5"><ImageIcon size={10}/> Imágenes del producto</p>
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{media.length}/5</span>
                  </div>
                  <Reorder.Group axis="x" values={media} onReorder={setMedia} className="flex gap-3 flex-wrap">
                    {media.map((item, i) => (
                      <Reorder.Item key={item.preview} value={item} className="group relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-white shadow-md cursor-grab shrink-0">
                        {item.type === 'video'
                          ? <video src={item.preview} className="w-full h-full object-cover pointer-events-none" autoPlay muted loop playsInline/>
                          : <img src={item.preview} className="w-full h-full object-cover pointer-events-none" onError={e => { (e.target as any).style.opacity = '0.3'; }}/>
                        }
                        <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setMedia(media.filter((_,idx) => idx !== i)); }}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white hover:bg-red-500 z-10">
                          <X size={12}/>
                        </button>
                        {i === 0 && <div className="absolute top-1.5 left-1.5 text-[7px] font-black bg-[#004d4d] text-white px-1.5 py-0.5 rounded-md">Principal</div>}
                      </Reorder.Item>
                    ))}
                    {media.length < 5 && (
                      <label className="h-24 w-24 rounded-2xl border-2 border-dashed border-[#004d4d]/20 bg-[#004d4d]/5 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#004d4d]/40 transition-all shrink-0">
                        <Plus size={18} className="text-[#004d4d]"/>
                        <span className="text-[8px] font-black text-[#004d4d] uppercase">Subir</span>
                        <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFileUpload}/>
                      </label>
                    )}
                  </Reorder.Group>
                  <p className="text-[9px] text-gray-400">Arrastra para reordenar · La primera imagen será la principal</p>
                </div>
              </motion.div>
            )}

            {/* ── TAB FINANZAS ── */}
            {activeTab === 'financial' && (
              <motion.div key="financial" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4 pb-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-[#004d4d] flex items-center gap-1.5"><DollarSign size={10}/> Precios</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Costo de adquisición', field: 'cost',            color: 'text-gray-600' },
                      { label: 'Precio mayorista',      field: 'wholesale_price', color: 'text-violet-600' },
                      { label: 'Precio de venta *',     field: 'price',           color: 'text-[#004d4d]' },
                    ].map(({ label, field, color }) => (
                      <div key={field} className="space-y-1.5">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                          <input type="text"
                            value={formatNumber((formData as any)[field])}
                            onChange={e => handleNumberChange(e.target.value, field)}
                            onFocus={() => { if ((formData as any)[field] === 0) setFormData({...formData, [field]: '' as any}); }}
                            onBlur={() => { if (!(formData as any)[field]) setFormData({...formData, [field]: 0}); }}
                            className={`w-full h-12 pl-8 pr-3 rounded-xl border-2 border-gray-200 bg-gray-50 font-black focus:outline-none focus:bg-white focus:border-[#004d4d]/30 transition-all text-sm ${color}`}
                            placeholder="0"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cards de ganancia */}
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const pw = calculateProfit(formData.wholesale_price);
                    const hasPrice = (formData.wholesale_price || 0) > 0;
                    return (
                      <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-[0.04]"><TrendingUp size={56}/></div>
                        <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mb-1">Ganancia mayorista</p>
                        <p className={`text-2xl font-black ${!hasPrice ? 'text-gray-200' : pw.net < 0 ? 'text-rose-500' : 'text-[#004d4d]'}`}>{hasPrice ? fmtCOP(pw.net) : '—'}</p>
                        <p className={`text-[9px] mt-1 ${!hasPrice ? 'text-gray-200' : 'text-gray-400'}`}>Margen: {hasPrice ? `${pw.margin.toFixed(1)}%` : '—'}</p>
                        <p className={`text-[8px] mt-0.5 ${!hasPrice ? 'text-gray-200' : 'text-gray-300'}`}>Bayup: -{hasPrice ? fmtCOP(pw.bayupFee) : '$0'}</p>
                      </div>
                    );
                  })()}
                  {(() => {
                    const pr = calculateProfit(formData.price);
                    const hasPrice = (formData.price || 0) > 0;
                    return (
                      <div className="bg-[#001a1a] rounded-2xl p-4 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5"><TrendingUp size={56}/></div>
                        <p className="text-[8px] font-bold tracking-widest text-[#00f2ff]/50 uppercase mb-1">Ganancia precio final</p>
                        <p className={`text-2xl font-black ${!hasPrice ? 'text-white/20' : pr.net < 0 ? 'text-rose-400' : 'text-[#00f2ff]'}`}>{hasPrice ? fmtCOP(pr.net) : '—'}</p>
                        <p className={`text-[9px] mt-1 ${!hasPrice ? 'text-white/20' : 'text-white/40'}`}>Margen: {hasPrice ? `${pr.margin.toFixed(1)}%` : '—'}</p>
                        <p className={`text-[8px] mt-0.5 ${!hasPrice ? 'text-white/10' : 'text-white/25'}`}>Bayup: -{hasPrice ? fmtCOP(pr.bayupFee) : '$0'}</p>
                      </div>
                    );
                  })()}
                </div>

                <button onClick={() => setIsAssistantOpen(true)}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-[#004d4d] to-[#006666] rounded-2xl text-white hover:opacity-90 transition-all shadow-md">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Bot size={18}/></div>
                  <div className="text-left flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">Asistente de precios Bayt</p>
                    <p className="text-[9px] text-white/60 mt-0.5">Calcula rentabilidad y punto de equilibrio automáticamente</p>
                  </div>
                  <ChevronRight size={14} className="text-white/40 shrink-0"/>
                </button>
              </motion.div>
            )}

            {/* ── TAB VARIANTES ── */}
            {activeTab === 'variants' && (
              <motion.div key="variants" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4 pb-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold tracking-widest uppercase text-[#004d4d] flex items-center gap-1.5"><Layers size={10}/> Variantes y atributos</p>
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{variants.reduce((a, v) => a + (v.stock || 0), 0)} uds totales</span>
                  </div>

                  {Array.from(new Set(variants.map(v => v.name.split('/')[0].trim()))).length > 0 && (
                    <div className="space-y-2">
                      {Array.from(new Set(variants.map(v => v.name.split('/')[0].trim()))).map((master, mIdx) => {
                        const subs = variants.filter(v => v.name.startsWith(master));
                        return (
                          <div key={mIdx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                            <div className="h-7 w-7 rounded-xl bg-[#004d4d] flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5">{mIdx+1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{master}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {subs.map((s, sIdx) => {
                                  const detail = s.name.includes('/') ? s.name.split('/')[1].trim() : s.name;
                                  const hasColor = detail.includes(': #');
                                  const colorHex = hasColor ? detail.split(': #')[1] : null;
                                  const cleanDetail = hasColor ? detail.split(':')[0] : detail;
                                  return (
                                    <span key={sIdx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-[9px] font-bold text-gray-600">
                                      {hasColor && <div className="w-2.5 h-2.5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: `#${colorHex}` }}/>}
                                      {cleanDetail}: <span className="text-[#004d4d]">{s.stock}u</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => handleEditAttribute(master)} className="h-7 w-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#004d4d] hover:bg-[#004d4d] hover:text-white hover:border-[#004d4d] transition-all"><Zap size={11}/></button>
                              <button onClick={() => setVariants(p => p.filter(v => !v.name.startsWith(master)))} className="h-7 w-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"><Trash2 size={11}/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={() => { setEditingMasterName(null); setTempVariantName(''); setTempSubVariants([{ id: '1', spec: '', stock: 0 }]); setIsNewVariantModalOpen(true); }}
                    className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-[#004d4d]/20 bg-[#004d4d]/3 rounded-2xl text-[#004d4d] hover:border-[#004d4d]/40 hover:bg-[#004d4d]/6 transition-all">
                    <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0"><Plus size={16}/></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest">Añadir atributo</p>
                      <p className="text-[9px] text-[#004d4d]/50">Talla, color, material o cualquier variante</p>
                    </div>
                  </button>
                </div>

                <AnimatePresence>
                  {isNewVariantModalOpen && (
                    <VariantModal tempVariantName={tempVariantName} setTempVariantName={setTempVariantName}
                      tempSubVariants={tempSubVariants} setTempSubVariants={setTempSubVariants}
                      editingMasterName={editingMasterName} onClose={() => setIsNewVariantModalOpen(false)} onSave={handleSaveMatrixAttributes}/>
                  )}
                </AnimatePresence>

                {/* Etiquetas */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-violet-50 flex items-center justify-center"><Tag size={12} className="text-violet-500"/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Etiquetas</p>
                        <p className="text-[9px] text-gray-400">Agrupa productos con etiquetas para recomendarlos juntos al comprar</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex gap-2">
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) { e.preventDefault(); const t = tagInput.trim().toLowerCase().replace(/,/g,''); if (t && !formData.tags.includes(t)) setFormData(f => ({...f, tags: [...f.tags, t]})); setTagInput(''); } }}
                        placeholder="Escribe una etiqueta y presiona Enter…"
                        className="flex-1 h-9 rounded-xl border border-gray-200 px-3 text-[10px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]"/>
                      <button onClick={() => { const t = tagInput.trim().toLowerCase().replace(/,/g,''); if (t && !formData.tags.includes(t)) setFormData(f => ({...f, tags: [...f.tags, t]})); setTagInput(''); }}
                        className="h-9 px-3 rounded-xl bg-[#004d4d] text-white text-[9px] font-bold">+</button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[9px] font-bold">
                            #{tag}
                            <button onClick={() => setFormData(f => ({...f, tags: f.tags.filter(t => t !== tag)}))} className="hover:text-violet-900"><X size={9}/></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Garantías */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center"><ShieldCheck size={12} className="text-emerald-500"/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Garantías</p>
                        <p className="text-[9px] text-gray-400">Describe la garantía del producto</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <textarea value={formData.warranty} onChange={e => setFormData(f => ({...f, warranty: e.target.value}))} rows={3}
                      placeholder="Ej: 6 meses de garantía contra defectos de fabricación…"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[10px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d] resize-none"/>
                  </div>
                </div>

                {/* Características */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-sky-50 flex items-center justify-center"><ListChecks size={12} className="text-sky-500"/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Características</p>
                        <p className="text-[9px] text-gray-400">Especificaciones técnicas, materiales y detalles del producto</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <textarea value={formData.features} onChange={e => setFormData(f => ({...f, features: e.target.value}))} rows={4}
                      placeholder={"Ej: Material: cuero 100% genuino\nDimensiones: 30×20×10 cm\nPeso: 450g"}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[10px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d] resize-none"/>
                  </div>
                </div>

                {/* Información importante */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-2">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-amber-50 flex items-center justify-center"><Info size={12} className="text-amber-500"/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Información importante</p>
                        <p className="text-[9px] text-gray-400">Se mostrará en la página del producto como sección desplegable</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <textarea value={formData.important_info} onChange={e => setFormData(f => ({...f, important_info: e.target.value}))} rows={4}
                      placeholder={"Ej: Cuidados: lavar a mano con agua fría\nNo usar secadora\nGuardar en bolsa antihumedad"}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[10px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d] resize-none"/>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer fijo */}
        <div className="px-8 py-4 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
          <button onClick={() => router.push('/dashboard/products')} className="text-[9px] font-bold text-gray-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Descartar</button>
          <div className="flex items-center gap-2">
            {activeTab !== 'info' && (
              <button onClick={() => setActiveTab(activeTab === 'variants' ? 'financial' : 'info')}
                className="h-10 px-4 rounded-2xl border border-gray-200 text-[9px] font-bold text-gray-500 hover:border-gray-300 transition-all">
                ← Anterior
              </button>
            )}
            <button onClick={() => { if (activeTab === 'info') setActiveTab('financial'); else if (activeTab === 'financial') setActiveTab('variants'); else handleSave(); }}
              disabled={isSubmitting}
              className="h-10 px-6 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-60">
              {isSubmitting ? <><Loader2 size={12} className="animate-spin"/>Guardando…</> :
               activeTab === 'variants' ? <><Check size={12}/> Actualizar producto</> : <>Siguiente →</>}
            </button>
          </div>
        </div>
      </div>

      {/* ══ PANEL DERECHO — PREVIEW ══ */}
      <div className="flex-1 bg-[#f0f2f5] flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #004d4d20 0%, transparent 50%), radial-gradient(circle at 70% 70%, #00b2bd15 0%, transparent 50%)' }}/>
        <div className="relative w-full max-w-[380px]">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-200/50 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="bg-[#004d4d] px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center"><Box size={18} className="text-[#004d4d]"/></div>
              <div>
                <p className="text-white text-xs font-black uppercase tracking-widest">Mi Tienda</p>
                <p className="text-[#00f2ff]/60 text-[10px] font-bold">Vista del cliente</p>
              </div>
              <div className="ml-auto flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-white/30"/> <div className="h-2 w-2 rounded-full bg-white/30"/> <div className="h-2 w-2 rounded-full bg-white/30"/>
              </div>
            </div>

            <div className="relative bg-gray-50 shrink-0" style={{ height: 260 }}>
              {media.length > 0 ? (
                media[selectedPreviewIndex]?.type === 'video'
                  ? <video key={media[selectedPreviewIndex]?.preview} src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" autoPlay muted loop playsInline/>
                  : <img src={media[selectedPreviewIndex]?.preview} className="w-full h-full object-cover" alt="preview" onError={e => { (e.target as any).src = ''; }}/>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-gray-200 gap-2">
                  <ImageIcon size={44}/><p className="text-xs font-bold text-gray-300">Sin imagen</p>
                </div>
              )}
              {media.length > 1 && (
                <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 justify-center">
                  {media.map((_, i) => (
                    <button key={i} onClick={() => setSelectedPreviewIndex(i)} className={`h-1.5 rounded-full transition-all ${i === selectedPreviewIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}/>
                  ))}
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${formData.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
                  {formData.status === 'active' ? 'Activo' : 'Borrador'}
                </span>
              </div>
            </div>

            {media.length > 1 && (
              <div className="flex gap-2 px-4 py-3 border-b border-gray-100 justify-center bg-gray-50/60 shrink-0">
                {media.map((item, i) => (
                  <button key={i} onClick={() => setSelectedPreviewIndex(i)}
                    className={`relative h-12 w-12 rounded-xl overflow-hidden border-2 transition-all ${i === selectedPreviewIndex ? 'border-[#004d4d] scale-110' : 'border-gray-200 opacity-60 hover:opacity-90'}`}>
                    {item.type === 'video'
                      ? <video src={item.preview} className="h-full w-full object-cover pointer-events-none" muted playsInline/>
                      : <img src={item.preview} className="h-full w-full object-cover" alt="" onError={e => { (e.target as any).style.opacity = '0'; }}/>
                    }
                  </button>
                ))}
              </div>
            )}

            <div className="p-5 space-y-3 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formData.category || 'Categoría'}</p>
                <h3 className="text-base font-black text-gray-900 leading-snug mt-1">{formData.name || <span className="text-gray-300">Nombre del producto</span>}</h3>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xl font-black text-[#004d4d]">{formData.price > 0 ? fmtCOP(formData.price) : <span className="text-gray-300 text-base">$0</span>}</p>
                {formData.price > 0 && calculateProfit(formData.price).margin > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">{calculateProfit(formData.price).margin.toFixed(0)}% margen</span>
                )}
              </div>
              {formData.description && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{formData.description}</p>}
              {variants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Variantes disponibles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variants.slice(0, 6).map((v, i) => {
                      const detail = v.name.includes('/') ? v.name.split('/')[1].trim() : v.name;
                      const hasColor = detail.includes(': #');
                      const colorHex = hasColor ? detail.split(': #')[1] : null;
                      const cleanDetail = hasColor ? detail.split(':')[0] : detail;
                      return (
                        <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-600">
                          {hasColor && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `#${colorHex}` }}/>}
                          {cleanDetail}
                        </span>
                      );
                    })}
                    {variants.length > 6 && <span className="text-[10px] text-gray-400 font-bold">+{variants.length - 6}</span>}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold">Stock total</p>
                <p className="text-xs font-black text-gray-700">{variants.reduce((a, v) => a + (v.stock || 0), 0)} uds</p>
              </div>
              <button className="w-full h-11 rounded-xl bg-[#004d4d] text-white text-xs font-black uppercase tracking-widest">Agregar al carrito</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL ASISTENTE ── */}
      <AnimatePresence>
        {isAssistantOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssistantOpen(false)} className="fixed inset-0 bg-[#001a1a]/80 backdrop-blur-xl"/>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="w-full lg:w-[45%] bg-gray-50 p-8 space-y-5 border-r overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#004d4d] rounded-2xl flex items-center justify-center text-white"><Zap size={18}/></div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">Asistente de precios</h3>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Calcular punto óptimo de venta</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Costo unitario</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                    <input type="text" value={formatNumber(formData.cost)} onChange={e => handleNumberChange(e.target.value, 'cost')}
                      onFocus={() => { if (formData.cost === 0) setFormData({...formData, cost: '' as any}); }}
                      onBlur={() => { if (!formData.cost) setFormData({...formData, cost: 0}); }}
                      className={inputCls + " pl-8"} placeholder="0"/>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-200 pt-3">Gastos operativos mensuales</p>
                  {(['payroll','rent','services','others'] as const).map(key => (
                    <div key={key} className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {key === 'payroll' ? 'Nómina' : key === 'rent' ? 'Arriendo' : key === 'services' ? 'Servicios' : 'Otros'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-sm">$</span>
                        <input type="text" value={formatNumber(fixedCosts[key])} onChange={e => handleNumberChange(e.target.value, key, true)}
                          onFocus={() => { if (fixedCosts[key] === 0) setFixedCosts({...fixedCosts, [key]: '' as any}); }}
                          onBlur={() => { if (!fixedCosts[key]) setFixedCosts({...fixedCosts, [key]: 0}); }}
                          className={inputCls + " pl-8 bg-gray-50"} placeholder="0"/>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-[9px] text-amber-700 font-medium leading-relaxed">Los precios calculados no incluyen envíos ni pauta publicitaria.</p>
                </div>
              </div>
              <div className="flex-1 p-8 space-y-5 overflow-y-auto custom-scrollbar relative">
                <button onClick={() => setIsAssistantOpen(false)} className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><X size={14}/></button>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Simulación de rentabilidad</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Ajusta el margen y aplica el precio sugerido</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">Unidades a vender</p>
                    <input type="number" value={simulationUnits} onChange={e => setSimulationUnits(Number(e.target.value) || 1)}
                      className="w-full bg-transparent text-xl font-black text-gray-900 outline-none border-none"/>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">Punto de equilibrio</p>
                    <p className="text-xl font-black text-gray-900">
                      {(() => {
                        const totalFixed = fixedCosts.payroll + fixedCosts.rent + fixedCosts.services + fixedCosts.others;
                        const price = formData.price || recommendedRetail() || 1;
                        const contribution = price - (formData.cost || 0) - price * bayupRate - price * prixRate;
                        if (contribution <= 0) return '—';
                        return Math.ceil(totalFixed / contribution);
                      })()} <span className="text-[10px] text-gray-400 font-normal">uds</span>
                    </p>
                  </div>
                </div>
                <div className="bg-[#002D2D] p-6 rounded-[1.5rem] text-white space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em]">Sugerido retail</p>
                    <div className="flex items-center gap-1">
                      <input type="text" value={simulationRetailMargin} onChange={e => setSimulationRetailMargin(Number(e.target.value.replace(/[^0-9]/g,'')))}
                        className="bg-white/10 border-none outline-none text-2xl font-black italic w-16 text-right rounded-lg px-2"/>
                      <span className="text-2xl font-black italic">%</span>
                    </div>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter text-cyan-400">{fmtCOP(recommendedRetail())}</h3>
                  <button onClick={() => { setFormData({...formData, price: recommendedRetail()}); setIsAssistantOpen(false); }}
                    className="w-full py-3 bg-white text-[#004d4d] rounded-full font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-transform">
                    Aplicar precio retail
                  </button>
                </div>
                <div className="bg-[#004d4d]/10 p-5 rounded-2xl border-2 border-gray-200 flex justify-between items-center group relative overflow-hidden transition-all hover:border-[#004d4d]/40">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sugerido mayorista</p>
                    <h4 className="text-2xl font-black text-gray-900">{fmtCOP(recommendedWholesale())}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <input type="text" value={simulationWholesaleMargin} onChange={e => setSimulationWholesaleMargin(Number(e.target.value.replace(/[^0-9]/g,'')))}
                        className="bg-white/80 border border-gray-200 outline-none text-sm font-black italic w-14 text-right rounded-lg px-2 py-1"/>
                      <span className="text-sm font-black italic text-gray-500">%</span>
                    </div>
                  </div>
                  <button onClick={() => { setFormData({...formData, wholesale_price: recommendedWholesale()}); setIsAssistantOpen(false); }}
                    className="h-9 px-4 rounded-xl bg-[#004d4d] text-white text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">
                    Aplicar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL NUEVA CATEGORÍA ── */}
      <AnimatePresence>
        {isNewCategoryModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 space-y-6 shadow-2xl z-10" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900">Nueva Categoría</h3>
                <button onClick={() => setIsNewCategoryModalOpen(false)} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><X size={14}/></button>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nombre</label>
                <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej: Accesorios, Colección Invierno…" className={inputCls}/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsNewCategoryModalOpen(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-[9px] font-bold text-gray-500">Cancelar</button>
                <button onClick={handleCreateCategory} className="flex-[2] h-10 rounded-xl bg-[#004d4d] text-white text-[9px] font-black uppercase tracking-widest">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
