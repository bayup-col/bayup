"use client";

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  Plus, Search, Filter, Download, Package, AlertCircle, ShoppingBag,
  Layers, Edit3, Trash2, Info, ArrowUpRight, Eye, Zap, BarChart3, X,
  ImageIcon, TrendingUp, Globe, CheckCheck, Loader2, FilterX, Target,
  Sparkles, Bot, Rocket, LayoutGrid, Activity, ShieldCheck, CheckCircle2,
  DollarSign, ArrowDownRight, Box, Hash, Warehouse, RefreshCcw, History,
  AlertTriangle, Minus, Tag, MoreHorizontal, FileSpreadsheet, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiRequest } from '@/lib/api';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';

// ── ANIMATED NUMBER ────────────────────────────────────────────────────────
const AnimatedNumber = memo(({ value, type = 'currency' }: { value: number, type?: 'currency' | 'simple' }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current: number) => {
    if (type === 'simple') return Math.round(current).toLocaleString();
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
  });
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span>{display}</motion.span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

// ── HELPERS ────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const extractImageUrl = (raw: any): string | null => {
  if (!raw) return null;
  if (typeof raw === 'string' && raw.startsWith('http')) return raw;
  if (Array.isArray(raw) && raw.length > 0) return raw[0];
  try {
    let value = raw;
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try { value = JSON.parse(value); } catch { return null; }
    }
    if (Array.isArray(value) && value.length > 0) return value[0];
    if (typeof value === 'object' && value !== null) return value.url || value.uri || null;
    if (typeof value === 'string' && value.length > 5) return value;
  } catch { return null; }
  return null;
};

const getProductImage = (p: any): string | null => {
  let img = extractImageUrl(p.image_url);
  if (!img && p.variants?.length > 0) {
    for (const v of p.variants) {
      const vi = extractImageUrl(v.image_url);
      if (vi) { img = vi; break; }
    }
  }
  return img;
};

const isVideo = (url: string | null) => !!url && /\.(mp4|webm|mov|ogg)$/i.test(url);

const ProductMedia = ({ src, className, alt }: { src: string | null; className?: string; alt?: string }) => {
  if (!src) return null;
  if (isVideo(src))
    return <video src={src} className={className} autoPlay muted loop playsInline style={{ objectFit: 'cover' }}/>;
  return <img src={src} className={className} alt={alt || ''} onError={e => { (e.target as any).style.display = 'none'; }}/>;
};

// ── KPI CARD ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, trend, trendUp, accent = '#004d4d', isSimple = false }: any) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-5 hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="h-9 w-9 rounded-2xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4"
          style={{ background: `${accent}18`, color: accent }}>{icon}</div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full ${trendUp === false ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-1">{label}</p>
      <h3 className="text-2xl font-black tracking-tight text-gray-900 leading-none">
        <AnimatedNumber value={value} type={isSimple ? 'simple' : 'currency'} />
      </h3>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
      <div className="mt-3 h-[3px] w-full rounded-full bg-gray-100">
        <div className="h-full w-3/5 rounded-full" style={{ background: `linear-gradient(90deg,${accent}99,transparent)` }}/>
      </div>
    </div>
  );
}

// ── STATUS BADGE ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return status === 'active'
    ? <span className="flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>Activo</span>
    : <span className="flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200"><div className="h-1.5 w-1.5 rounded-full bg-gray-300"/>Borrador</span>;
}

// ── STOCK BADGE ────────────────────────────────────────────────────────────
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100">Agotado</span>;
  if (stock <= 5)  return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Crítico</span>;
  return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">OK</span>;
}

// ── GUIDE CONTENT (estático, fuera del componente para no recrearse en cada render) ──
const GUIDE_CONTENT = {
  overview: { title: 'Vista general', icon: <LayoutGrid size={20}/>, color: 'text-slate-600', description: 'Central de mando unificada. Aquí visualizas el 100% de tus activos comerciales.', whyImportant: 'Tener una visión global permite detectar redundancias en el catálogo.', kpi: { label: 'Diversidad de catálogo', val: '100%' }, baytTip: 'Usa la barra de búsqueda rápida con SKU para encontrar productos en menos de 2 segundos.' },
  active:   { title: 'Activos',       icon: <Zap size={20}/>,        color: 'text-emerald-500', description: 'Solo los productos aquí listados son visibles para tus clientes.',             whyImportant: 'Mantener esta lista depurada garantiza que no vendas sin stock.',           kpi: { label: 'Disponibilidad web',    val: '98.2%' }, baytTip: 'Si un producto tiene alta rotación pero poco margen, prioriza otros más rentables.' },
  draft:    { title: 'Borradores',    icon: <Edit3 size={20}/>,      color: 'text-amber-500',   description: 'Espacio de preparación para pulir fotos, descripciones y precios.',            whyImportant: 'Un producto bien preparado tiene un 40% más de conversión.',                kpi: { label: 'Calidad de carga',      val: 'Elite' }, baytTip: 'No publiques nada sin al menos 3 fotos de alta calidad.' },
  categories:{ title: 'Categorías',  icon: <Layers size={20}/>,     color: 'text-cyan-500',    description: 'Segmentación estratégica. Organiza tus productos por familias lógicas.',        whyImportant: 'Las categorías mejoran la navegación del usuario en un 35%.',               kpi: { label: 'User experience',       val: 'A+' },    baytTip: 'Crea categorías por "Ocasión de Uso" para vender más.' },
  new:      { title: 'Nuevo producto',icon: <Rocket size={20}/>,    color: 'text-purple-500',  description: 'Tu herramienta de expansión. Inyecta nuevos activos al flujo de caja.',         whyImportant: 'La innovación constante mantiene a tus clientes regresando.',               kpi: { label: 'Innovación mensual',    val: '+5 items'}, baytTip: 'Asigna siempre el precio mayorista para activar Dropshipping en el futuro.' },
};

// ── TAB LABELS (estático) ──
const TABS = [
  { key: 'all',        label: 'Todos',       icon: null },
  { key: 'active',     label: 'Activos',     icon: null },
  { key: 'draft',      label: 'Borradores',  icon: null },
  { key: 'categories', label: 'Categorías',  icon: <Layers size={11}/> },
  { key: 'inventory',  label: 'Inventario',  icon: <Warehouse size={11}/> },
] as const;

// ══════════════════════════════════════════════════════════════════════════
export default function ProductsPage() {
  const { token, userPlan } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [products,    setProducts]    = useState<any[]>([]);
  const [categories,  setCategories]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [activeTab,   setActiveTab]   = useState<'all'|'active'|'draft'|'categories'|'inventory'>('all');
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  const [isLimitModalOpen,     setIsLimitModalOpen]     = useState(false);
  const [isImportModalOpen,    setIsImportModalOpen]    = useState(false);
  const [isImporting,          setIsImporting]          = useState(false);
  const [importFile,           setImportFile]           = useState<File | null>(null);
  const [limitType,            setLimitType]            = useState<'warning'|'blocked'>('warning');
  const isBasicPlan = userPlan?.name === 'Básico' || !userPlan;
  const [limitBannerDismissed, setLimitBannerDismissed] = useState<'near'|'critical'|null>(null);

  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryData,        setNewCategoryData]        = useState({ name: '', description: '' });
  const [isCreatingCategory,     setIsCreatingCategory]     = useState(false);
  const [newCatImgFile,          setNewCatImgFile]          = useState<File|null>(null);
  const [newCatImgPreview,       setNewCatImgPreview]       = useState<string|null>(null);
  const [editingCategory,        setEditingCategory]        = useState<any>(null);
  const [editCatData,            setEditCatData]            = useState({ name: '', description: '' });
  const [editCatImgFile,         setEditCatImgFile]         = useState<File|null>(null);
  const [editCatImgPreview,      setEditCatImgPreview]      = useState<string|null>(null);
  const [isSavingCategory,       setIsSavingCategory]       = useState(false);
  const [selectedCategory,       setSelectedCategory]       = useState<any>(null);
  const [categoryView,           setCategoryView]           = useState<'intel'|'list'>('intel');
  const [selectedProduct,        setSelectedProduct]        = useState<any>(null);
  const [productToDelete,        setProductToDelete]        = useState<any>(null);
  const [isDeletingProduct,      setIsDeletingProduct]      = useState(false);

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isGuideOpen,       setIsGuideOpen]        = useState(false);
  const [activeGuideTab,    setActiveGuideTab]      = useState('overview');
  const [filterConfig, setFilterConfig] = useState({ minPrice: '', maxPrice: '', minStock: '', selectedCategory: 'all' });

  // ── FETCH ──
  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const isProduction = window.location.hostname.includes('railway.app') || window.location.hostname.includes('bayup.com');
    const [productsResult, categoriesResult] = await Promise.allSettled([
      apiRequest<any[]>('/products', { token }),
      isProduction ? Promise.resolve([]) : apiRequest<any[]>('/collections', { token }),
    ]);
    if (productsResult.status === 'fulfilled') {
      setProducts(Array.isArray(productsResult.value) ? productsResult.value : []);
    } else {
      showToast('Error al cargar productos', 'error');
    }
    setCategories(categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value) ? categoriesResult.value : []);
    setLoading(false);
  }, [token, showToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    if (isGuideOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isGuideOpen]);
  useEffect(() => {
    const handleRefresh = () => setTimeout(() => fetchProducts(), 500);
    window.addEventListener('bayup_product_update', handleRefresh);
    return () => window.removeEventListener('bayup_product_update', handleRefresh);
  }, [fetchProducts]);

  // ── HANDLERS ──
  const handleNewProductClick = () => {
    if (isBasicPlan) {
      if (products.length >= 30) { setLimitType('blocked'); setIsLimitModalOpen(true); return; }
      if (products.length >= 20) {
        const warned = sessionStorage.getItem('bayup_limit_warned');
        if (!warned) { setLimitType('warning'); setIsLimitModalOpen(true); sessionStorage.setItem('bayup_limit_warned', 'true'); return; }
      }
    }
    router.push('/dashboard/products/new');
  };

  const handleDeleteProduct = async () => {
    if (!token || !productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await apiRequest(`/products/${productToDelete.id}`, { method: 'DELETE', token });
      showToast('Producto eliminado ✓', 'success');
      setProductToDelete(null);
      fetchProducts();
    } catch { showToast('Error al eliminar', 'error'); }
    finally { setIsDeletingProduct(false); }
  };

  const handleSaveCategory = async () => {
    if (!token || !editCatData.name.trim() || !editingCategory) return;
    setIsSavingCategory(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      let imageUrl: string | null = editingCategory.image_url || null;
      if (editCatImgFile) {
        const fd = new FormData(); fd.append('file', editCatImgFile);
        const r = await fetch(`${apiUrl}/admin/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (r.ok) imageUrl = (await r.json()).url;
      }
      await apiRequest(`/collections/${editingCategory.id}`, { method: 'PUT', token, body: JSON.stringify({ title: editCatData.name, description: editCatData.description || undefined, image_url: imageUrl || undefined, status: 'active' }) });
      showToast('Categoría actualizada ✨', 'success');
      setEditingCategory(null);
      setEditCatImgFile(null); setEditCatImgPreview(null);
      fetchProducts();
    } catch { showToast('Error al actualizar categoría', 'error'); }
    finally { setIsSavingCategory(false); }
  };

  const handleCreateCategory = async () => {
    if (!token || !newCategoryData.name.trim()) return;
    setIsCreatingCategory(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      let imageUrl: string | null = null;
      if (newCatImgFile) {
        const fd = new FormData(); fd.append('file', newCatImgFile);
        const r = await fetch(`${apiUrl}/admin/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (r.ok) imageUrl = (await r.json()).url;
      }
      await apiRequest('/collections', { method: 'POST', token, body: JSON.stringify({ title: newCategoryData.name, description: newCategoryData.description || undefined, image_url: imageUrl || undefined, status: 'active' }) });
      showToast('Categoría creada ✨', 'success');
      setIsNewCategoryModalOpen(false);
      setNewCategoryData({ name: '', description: '' });
      setNewCatImgFile(null); setNewCatImgPreview(null);
      fetchProducts();
    } catch { showToast('Error al crear', 'error'); }
    finally { setIsCreatingCategory(false); }
  };

  const handleExportExcel = async () => {
    try {
      showToast('Generando Excel…', 'info');
      const { exportProductsToExcel } = await import('@/lib/products-export');
      await exportProductsToExcel(products, 'Bayup_Tienda');
      setShowExportMenu(false);
      showToast('Excel descargado ✓', 'success');
    }
    catch { showToast('Error al generar el archivo', 'error'); }
  };

  const handleExportCSV = () => {
    const headers = ['NOMBRE','SKU','CATEGORÍA','PRECIO','PRECIO MAYORISTA','STOCK','ESTADO'];
    const rows = products.map((p: any) => [
      p.name, p.sku || '', p.category || '',
      p.price || 0, p.wholesale_price || '',
      p.stock ?? '', p.is_active ? 'Activo' : 'Inactivo',
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `productos_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showToast('CSV descargado ✓', 'success');
  };

  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Productos');
      worksheet.columns = [
        { header: 'Nombre', key: 'name', width: 30 }, { header: 'Descripcion', key: 'description', width: 40 },
        { header: 'Precio', key: 'price', width: 15 }, { header: 'Categoria', key: 'category', width: 20 },
        { header: 'Talla', key: 'size', width: 10 }, { header: 'Color', key: 'color', width: 10 },
        { header: 'Stock', key: 'stock', width: 10 }, { header: 'SKU', key: 'sku', width: 15 },
      ];
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004D4D' } };
      worksheet.addRow({ name: 'Camisa Premium Lino', description: 'Camisa de alta calidad.', price: 120000, category: 'Ropa', size: 'M', color: 'Blanco', stock: 15, sku: 'CAM-001' });
      worksheet.addRow({ name: 'Pantalón Chino Slim', description: 'Corte moderno, tela stretch.', price: 150000, category: 'Ropa', size: '32', color: 'Beige', stock: 10, sku: 'PAN-002' });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Formato_Importacion_Bayup.xlsx';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      showToast('Plantilla generada ✓', 'success');
    } catch { showToast('No se pudo generar el formato', 'error'); }
  };

  const handleImportSubmit = async () => {
    if (!importFile || !token) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
      const res = await fetch(`${apiBase}/products/import-excel`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, data.skipped > 0 ? 'info' : 'success');
        setIsImportModalOpen(false); setImportFile(null); fetchProducts();
      } else { showToast(data.detail || 'Error al importar', 'error'); }
    } catch { showToast('Error de conexión', 'error'); }
    finally { setIsImporting(false); }
  };

  // ── KPIs ──
  const kpis = useMemo(() => {
    const total  = products.length;
    const active = products.filter(p => p.status === 'active').length;
    const lowStock = products.filter(p => (p.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) || 0) <= 5).length;
    const avgPrice = total > 0 ? products.reduce((acc, p) => acc + (p.price || 0), 0) / total : 0;
    return [
      { label: 'Total productos', value: total,    sub: `${active} activos · ${total - active} borradores`, icon: <Package/>,      accent: '#004d4d', isSimple: true, trend: 'Catálogo' },
      { label: 'Activos en web',  value: active,   sub: 'Visibles para clientes',                          icon: <Zap/>,          accent: '#10b981', isSimple: true, trend: 'En línea' },
      { label: 'Stock crítico',   value: lowStock, sub: 'Con 5 o menos unidades',                          icon: <AlertCircle/>,  accent: '#ef4444', isSimple: true, trend: lowStock > 0 ? '¡Revisar!' : 'OK', trendUp: lowStock > 0 ? false : undefined },
      { label: 'Precio promedio', value: avgPrice, sub: 'Promedio del catálogo',                           icon: <DollarSign/>,   accent: '#3b82f6', isSimple: false, trend: 'Mercado' },
    ];
  }, [products]);

  // ── FILTROS ──
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variants?.some((v: any) => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTab = activeTab === 'all' || activeTab === 'categories' || activeTab === 'inventory' || p.status === activeTab;
      const matchesCategory = filterConfig.selectedCategory === 'all' || p.collection_id === filterConfig.selectedCategory;
      const matchesMinPrice = !filterConfig.minPrice || p.price >= Number(filterConfig.minPrice);
      const matchesMaxPrice = !filterConfig.maxPrice || p.price <= Number(filterConfig.maxPrice);
      const totalStock = p.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) || 0;
      const matchesMinStock = !filterConfig.minStock || totalStock >= Number(filterConfig.minStock);
      return matchesSearch && matchesTab && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesMinStock;
    });
  }, [products, searchTerm, activeTab, filterConfig]);

  const handleClearFilters = () => { setFilterConfig({ minPrice: '', maxPrice: '', minStock: '', selectedCategory: 'all' }); setSearchTerm(''); };

  const guideContent = GUIDE_CONTENT;

  // ── CONTEO DE PRODUCTOS POR CATEGORÍA (evita filter() repetido por cada card) ──
  const productCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (!p.collection_id) continue;
      counts.set(p.collection_id, (counts.get(p.collection_id) || 0) + 1);
    }
    return counts;
  }, [products]);

  // ── PRODUCTOS DE LA CATEGORÍA SELECCIONADA (modal) ──
  const selectedCategoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(p => p.collection_id === selectedCategory.id);
  }, [products, selectedCategory]);

  // ── INVENTORY STATE ──
  const [invFilter,    setInvFilter]    = useState<'all'|'critical'|'ok'|'out'>('all');
  const [invEdits,     setInvEdits]     = useState<Record<string, Record<string, number>>>({});  // {productId: {variantId: newStock}}
  const [savingStock,  setSavingStock]  = useState<string|null>(null);

  const handleStockChange = (productId: string, variantId: string, val: number) => {
    setInvEdits(prev => ({ ...prev, [productId]: { ...(prev[productId] || {}), [variantId]: val } }));
  };

  const handleSaveStock = async (product: any) => {
    const edits = invEdits[product.id];
    if (!edits) return;
    setSavingStock(product.id);
    try {
      const updatedVariants = product.variants.map((v: any) => ({
        ...v, stock: edits[v.id] !== undefined ? edits[v.id] : v.stock,
      }));
      await apiRequest(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify({ ...product, variants: updatedVariants }) });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, variants: updatedVariants } : p));
      setInvEdits(prev => { const n = { ...prev }; delete n[product.id]; return n; });
      showToast('Stock actualizado', 'success');
    } catch { showToast('Error al guardar', 'error'); }
    finally { setSavingStock(null); }
  };

  const invStats = useMemo(() => {
    const rows: { product: any; variant: any; stock: number }[] = [];
    for (const p of products) {
      if (!p.variants || p.variants.length === 0) {
        rows.push({ product: p, variant: null, stock: 0 });
      } else {
        for (const v of p.variants) rows.push({ product: p, variant: v, stock: v.stock || 0 });
      }
    }
    const out      = rows.filter(r => r.stock === 0).length;
    const critical = rows.filter(r => r.stock > 0 && r.stock <= 5).length;
    const ok       = rows.filter(r => r.stock > 5).length;
    const totalUnitsAll = rows.reduce((a, r) => a + r.stock, 0);
    const totalCostValue = products.reduce((a, p) => a + (p.cost || 0) * (p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) || 0), 0);
    const totalSaleValue = products.reduce((a, p) => a + (p.price || 0) * (p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) || 0), 0);
    return { rows, out, critical, ok, totalUnitsAll, totalCostValue, totalSaleValue };
  }, [products]);

  const invRows = useMemo(() => {
    return invStats.rows.filter(r => {
      const matchSearch = !searchTerm || r.product.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      if (invFilter === 'out')      return matchSearch && r.stock === 0;
      if (invFilter === 'critical') return matchSearch && r.stock > 0 && r.stock <= 5;
      if (invFilter === 'ok')       return matchSearch && r.stock > 5;
      return matchSearch;
    });
  }, [invStats.rows, invFilter, searchTerm]);

  // ── QUICK STATS (sidebar) ──
  const quickStats = useMemo(() => {
    const totalUnits = products.reduce((acc, p) => acc + (p.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) || 0), 0);
    const totalValue = products.reduce((acc, p) => acc + (p.price || 0), 0);
    const withImages = products.filter(p => getProductImage(p)).length;
    const byStatus   = {
      active:  products.filter(p => p.status === 'active').length,
      draft:   products.filter(p => p.status === 'draft').length,
    };
    return { totalUnits, totalValue, withImages, byStatus };
  }, [products]);

  return (
    <div className="space-y-6 pb-20">

      {/* ══════════ MOBILE VIEW (solo < sm) ══════════ */}
      <div className="block sm:hidden -mx-3 space-y-3 pt-2">

        {/* Hero card */}
        <div className="mx-3 rounded-3xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg,#001a1a 0%,#003333 50%,#005252 100%)' }}>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(0,242,255,0.12),transparent 70%)' }}/>
          <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(0,178,189,0.08),transparent 70%)' }}/>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-[#00f2ff]/15 flex items-center justify-center">
                <Package size={12} className="text-[#00f2ff]"/>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f2ff]/70">Catálogo</p>
            </div>
            <button onClick={handleNewProductClick}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#00f2ff]/15 border border-[#00f2ff]/20 text-[#00f2ff] text-[9px] font-black uppercase tracking-wide active:bg-[#00f2ff]/25 transition-colors">
              <Plus size={11} strokeWidth={3}/> Nuevo
            </button>
          </div>

          <div className="mb-1">
            <p className="text-[11px] font-bold text-white/30">Total</p>
            <p className="text-[42px] font-black text-white leading-none tracking-tight -mt-1">
              {products.length}
              <span className="text-[18px] text-white/25 ml-2 font-bold">productos</span>
            </p>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>
              <p className="text-[9px] text-white/40">{kpis[1].value} activos</p>
            </div>
            {(kpis[2].value as number) > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[9px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <AlertCircle size={8}/> {kpis[2].value} stock crítico
              </span>
            )}
          </div>
        </div>

        {/* 4 mini stats */}
        <div className="grid grid-cols-2 gap-2.5 mx-3">
          {[
            { label: 'Total productos', value: products.length, sub: `${kpis[0].value as number} en catálogo`, icon: <Package size={13} className="text-[#004d4d]"/>, bg: 'bg-[#004d4d]/8', badge: null },
            { label: 'Activos en web',  value: kpis[1].value,  sub: 'Visibles en tienda',                    icon: <Zap size={13} className="text-emerald-500"/>,  bg: 'bg-emerald-50',    badge: null },
            { label: 'Stock crítico',   value: kpis[2].value,  sub: 'Con ≤ 5 unidades',                      icon: <AlertCircle size={13} className="text-rose-500"/>, bg: 'bg-rose-50', badge: (kpis[2].value as number) > 0 ? '¡Revisar!' : null },
            { label: 'Precio promedio', value: fmt(kpis[3].value as number), sub: 'Del catálogo',             icon: <DollarSign size={13} className="text-blue-500"/>, bg: 'bg-blue-50',  badge: null },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className={`h-7 w-7 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                {s.badge && <span className="text-[7px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">{s.badge}</span>}
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{s.label}</p>
              <p className="text-[20px] font-black text-gray-900 leading-none truncate">{typeof s.value === 'number' ? s.value : s.value}</p>
              <p className="text-[9px] text-gray-400 mt-1.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Plan banner (si aplica) */}
        {isBasicPlan && (
          <div className="mx-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3">
            <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${products.length >= 25 ? 'bg-amber-50 text-amber-500' : 'bg-[#004d4d]/10 text-[#004d4d]'}`}>
              <Package size={13}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-gray-700">{products.length}/30 productos</p>
                <button onClick={() => router.push('/planes')} className="text-[8px] font-black text-[#004d4d] tracking-widest uppercase">Subir →</button>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${products.length >= 25 ? 'bg-amber-400' : 'bg-gradient-to-r from-[#004d4d] to-[#00b2bd]'}`}
                  style={{ width: `${(products.length / 30) * 100}%` }}/>
              </div>
            </div>
          </div>
        )}

        {/* Lista de productos */}
        <div className="mx-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
            <div>
              <p className="text-[13px] font-black text-gray-900">Catálogo</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Toca un producto para editarlo</p>
            </div>
            <span className="text-[10px] font-black text-[#004d4d] bg-[#004d4d]/8 px-2.5 py-1 rounded-full">
              {filteredProducts.length}
            </span>
          </div>

          {/* Búsqueda mobile */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 h-9 bg-gray-50 rounded-xl border border-gray-100 px-3">
              <Search size={13} className="text-gray-300 shrink-0"/>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar producto…"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
              {searchTerm && <button onClick={() => setSearchTerm('')}><X size={12} className="text-gray-300"/></button>}
            </div>
          </div>

          {/* Tabs: Todos / Activos / Borradores */}
          <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
            {[
              { key: 'all',    label: 'Todos',      count: products.length },
              { key: 'active', label: 'Activos',    count: quickStats.byStatus.active },
              { key: 'draft',  label: 'Borradores', count: quickStats.byStatus.draft },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all ${
                  activeTab === t.key ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-400'
                }`}>
                <span className="truncate">{t.label}</span>
                <span className={`shrink-0 text-[7px] min-w-[16px] text-center px-1 py-0.5 rounded-full font-black ${activeTab === t.key ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[#004d4d]"/>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Package size={18} className="text-gray-300"/>
              </div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin productos</p>
              <button onClick={handleNewProductClick}
                className="mt-1 h-8 px-4 bg-[#004d4d] text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                + Crear producto
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50/80 max-h-[480px] overflow-y-auto">
              {filteredProducts.map((p: any) => {
                const img = getProductImage(p);
                const totalStock = p.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) || 0;
                const isActive = p.status === 'active';
                const isLowStock = totalStock <= 5;
                return (
                  <div key={p.id} onClick={() => router.push(`/dashboard/products/${p.id}`)}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors cursor-pointer">
                    <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {img
                        ? <ProductMedia src={img} className="h-full w-full object-cover"/>
                        : <Package size={16} className="text-gray-300"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{p.sku || 'Sin SKU'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-black text-gray-900">{fmt(p.price || 0)}</p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className={`text-[8px] font-black uppercase tracking-wide ${isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {isActive ? '● Activo' : '○ Borrador'}
                        </span>
                        {isLowStock && <span className="text-[8px] font-black text-amber-500">· {totalStock}u</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4"/>
      </div>
      {/* ══════════ FIN MOBILE VIEW ══════════ */}

      {/* ── HEADER (solo desktop) ── */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] uppercase mb-1 text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>
            Catálogo maestro
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">
            PRODUCTOS
          </h1>
          <p className="text-sm mt-1 text-gray-400">Administra el catálogo completo de tu tienda</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsGuideOpen(true)}
            className="h-10 w-10 flex items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-400 hover:text-[#004d4d] hover:border-[#004d4d]/30 transition-all shadow-sm">
            <Info size={14}/>
          </button>
          <button onClick={() => setIsImportModalOpen(true)}
            className="h-10 flex items-center gap-2 px-4 rounded-2xl border border-gray-200 bg-white text-[10px] font-semibold text-gray-600 hover:border-[#004d4d]/30 hover:text-[#004d4d] transition-all shadow-sm">
            <Download size={13}/> Importar Excel
          </button>
          <button onClick={handleNewProductClick}
            className="h-10 flex items-center gap-2 px-5 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
            <Plus size={14} className="group-hover:rotate-90 transition-transform"/> Nuevo producto
          </button>
        </div>
      </div>

      {/* ── PLAN BANNER (solo desktop) ── */}
      {isBasicPlan && (
        <div className="hidden sm:flex bg-white rounded-2xl border border-gray-100 shadow-sm p-4 items-center gap-4">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${products.length >= 25 ? 'bg-amber-50 text-amber-500' : 'bg-[#004d4d]/10 text-[#004d4d]'}`}>
            <Package size={14}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold text-gray-700">Plan Básico — {products.length}/30 productos</p>
              <button onClick={() => router.push('/planes')} className="text-[9px] font-black text-[#004d4d] hover:underline tracking-widest uppercase">Subir de nivel →</button>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(products.length / 30) * 100}%` }}
                className={`h-full rounded-full ${products.length >= 25 ? 'bg-amber-400' : 'bg-gradient-to-r from-[#004d4d] to-[#00b2bd]'}`}/>
            </div>
          </div>
        </div>
      )}

      {/* ── ALERTAS LÍMITE ── */}
      {isBasicPlan && !loading && limitBannerDismissed !== 'critical' && products.length > 25 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={13} className="text-amber-500 shrink-0"/>
          <p className="text-[10px] text-amber-700 flex-1 font-medium">Te quedan <strong>{30 - products.length} espacios</strong> en tu plan Básico. <button onClick={() => router.push('/planes')} className="underline font-bold">Ver planes</button></p>
          <button onClick={() => setLimitBannerDismissed('critical')}><X size={12} className="text-amber-400"/></button>
        </div>
      )}

      {/* ── KPIs (solo desktop) ── */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={i} label={k.label} value={k.value} sub={k.sub} icon={k.icon} accent={k.accent} isSimple={k.isSimple} trend={k.trend} trendUp={(k as any).trendUp}/>
        ))}
      </div>

      {/* ── CUERPO PRINCIPAL ── */}
      <div className="flex gap-5">

        {/* ── TABLA IZQUIERDA ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap z-0 ${
                    activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="prodTab"
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: '#004d4d', zIndex: -1 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.icon}{tab.label}
                    {tab.key !== 'categories' && tab.key !== 'inventory' && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${
                        activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {tab.key === 'all' ? products.length : tab.key === 'active' ? quickStats.byStatus.active : quickStats.byStatus.draft}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search + filtros */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 h-10 bg-white rounded-2xl border border-gray-200 shadow-sm px-3">
              <Search size={14} className="text-gray-300 shrink-0"/>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, SKU o categoría…"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
              {searchTerm && <button onClick={() => setSearchTerm('')}><X size={12} className="text-gray-300"/></button>}
            </div>
            <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`h-10 flex items-center gap-2 px-4 rounded-2xl border text-[10px] font-semibold transition-all ${isFilterPanelOpen ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'bg-white border-gray-200 text-gray-400 hover:border-[#004d4d]/30 shadow-sm'}`}>
              <Filter size={13}/> Filtros
            </button>
            <div className="relative" ref={exportMenuRef}>
              <button onClick={() => setShowExportMenu(v => !v)}
                className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white border border-gray-200 text-[10px] font-semibold text-gray-600 hover:border-[#004d4d]/30 transition-all shadow-sm">
                <Download size={13}/> Exportar <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                    <button onClick={handleExportExcel}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-[#004d4d]/5 transition-colors text-left">
                      <FileSpreadsheet size={14} className="text-[#004d4d]"/> Excel (.xlsx)
                      <span className="ml-auto text-[9px] text-[#004d4d] font-bold uppercase tracking-wide">Recomendado</span>
                    </button>
                    <div className="h-px bg-gray-100 mx-3"/>
                    <button onClick={handleExportCSV}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <Download size={14} className="text-gray-400"/> CSV (.csv)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Panel filtros avanzados */}
          <AnimatePresence>
            {isFilterPanelOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Precio mínimo', key: 'minPrice', placeholder: '0' },
                    { label: 'Precio máximo', key: 'maxPrice', placeholder: 'Sin límite' },
                    { label: 'Stock mínimo',  key: 'minStock', placeholder: 'Ej: 5' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{f.label}</label>
                      <input type="number" placeholder={f.placeholder}
                        value={(filterConfig as any)[f.key]}
                        onChange={e => setFilterConfig({ ...filterConfig, [f.key]: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 outline-none focus:border-[#004d4d]/40"/>
                    </div>
                  ))}
                  <div className="flex flex-col justify-end">
                    <button onClick={handleClearFilters}
                      className="h-9 rounded-xl bg-gray-900 text-white text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <FilterX size={12}/> Limpiar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CONTENIDO SEGÚN TAB ── */}
          <AnimatePresence mode="wait">

            {/* INVENTARIO */}
            {activeTab === 'inventory' && (
              <motion.div key="inventory" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Unidades en bodega', value: invStats.totalUnitsAll.toLocaleString(),   icon: <Package size={13}/>,      accent: '#004d4d', sub: `${products.length} referencias` },
                    { label: 'Sin stock',           value: invStats.out.toString(),                   icon: <AlertTriangle size={13}/>, accent: '#ef4444', sub: 'Agotados' },
                    { label: 'Stock crítico',        value: invStats.critical.toString(),              icon: <AlertCircle size={13}/>,   accent: '#f59e0b', sub: '1–5 unidades' },
                    { label: 'Valor a precio venta', value: fmt(invStats.totalSaleValue),             icon: <DollarSign size={13}/>,    accent: '#3b82f6', sub: `Costo: ${fmt(invStats.totalCostValue)}` },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.accent}15`, color: s.accent }}>{s.icon}</div>
                      </div>
                      <p className="text-xl font-black text-gray-900">{s.value}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Filtros rápidos + tabla */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Warehouse size={13} className="text-[#004d4d]"/>
                      <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">Gestión de stock</span>
                      <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{invRows.length} refs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {([
                        { key: 'all',      label: 'Todos' },
                        { key: 'out',      label: 'Agotado' },
                        { key: 'critical', label: 'Crítico' },
                        { key: 'ok',       label: 'OK' },
                      ] as const).map(f => (
                        <button key={f.key} onClick={() => setInvFilter(f.key)}
                          className={`h-7 px-3 rounded-lg text-[9px] font-bold transition-all ${invFilter === f.key ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {f.label}
                          {f.key === 'out'      && invStats.out      > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1">{invStats.out}</span>}
                          {f.key === 'critical' && invStats.critical  > 0 && <span className="ml-1 bg-amber-500 text-white rounded-full px-1">{invStats.critical}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/40">
                        {['Producto','Variante','SKU','Stock actual','Nuevo stock','Valor en bodega',''].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-[#004d4d]" size={24}/></td></tr>
                      ) : invRows.length === 0 ? (
                        <tr><td colSpan={7} className="py-12 text-center text-gray-300 text-[11px] font-bold">Sin referencias</td></tr>
                      ) : invRows.map((row, idx) => {
                        const { product: p, variant: v, stock } = row;
                        const rowKey = v ? `${p.id}-${v.id}` : p.id;
                        const editedStock = v
                          ? invEdits[p.id]?.[v.id]
                          : invEdits[p.id]?.['__novariant'];
                        const displayStock = editedStock !== undefined ? editedStock : stock;
                        const isDirty = editedStock !== undefined && editedStock !== stock;
                        const stockColor = stock === 0 ? '#ef4444' : stock <= 5 ? '#f59e0b' : '#10b981';
                        const stockValue = (p.price || 0) * stock;

                        return (
                          <tr key={rowKey} className={`border-b border-gray-50 transition-colors ${isDirty ? 'bg-amber-50/40' : 'hover:bg-gray-50/50'}`}>
                            {/* Producto — solo mostrar en la primera variante */}
                            <td className="px-4 py-3">
                              {(idx === 0 || invRows[idx-1].product.id !== p.id) && (
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center">
                                    {getProductImage(p) ? <ProductMedia src={getProductImage(p)} className="h-full w-full object-cover" alt={p.name}/> : <ImageIcon size={12} className="text-gray-300"/>}
                                  </div>
                                  <p className="text-[11px] font-bold text-gray-800 truncate max-w-[130px]">{p.name}</p>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[10px] font-medium text-gray-500">{v ? v.name : <span className="text-gray-300 italic">Sin variante</span>}</td>
                            <td className="px-4 py-3 text-[10px] font-mono text-gray-400">{v?.sku || p.sku || '—'}</td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-black tabular-nums" style={{ color: stockColor }}>{stock}</span>
                              <span className="text-[9px] text-gray-400 ml-1">uds</span>
                            </td>
                            {/* Input editable */}
                            <td className="px-4 py-3">
                              <input
                                type="number" min={0}
                                value={displayStock}
                                onChange={e => {
                                  const varKey = v ? v.id : '__novariant';
                                  handleStockChange(p.id, varKey, Number(e.target.value));
                                }}
                                className={`w-20 h-8 rounded-lg border text-center text-sm font-black outline-none transition-all ${isDirty ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 bg-gray-50 text-gray-700 focus:border-[#004d4d]/40 focus:bg-white'}`}
                              />
                            </td>
                            <td className="px-4 py-3 text-[11px] font-bold text-gray-600">{stock > 0 ? fmt(stockValue) : <span className="text-gray-300">—</span>}</td>
                            <td className="px-4 py-3">
                              {isDirty && (
                                <button onClick={() => handleSaveStock(p)} disabled={savingStock === p.id}
                                  className="h-7 px-3 rounded-lg bg-[#004d4d] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#003838] transition-all flex items-center gap-1.5 disabled:opacity-60">
                                  {savingStock === p.id ? <Loader2 size={10} className="animate-spin"/> : <CheckCheck size={10}/>}
                                  Guardar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {invRows.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-gray-100 bg-gray-50/60">
                          <td colSpan={5} className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total en bodega</td>
                          <td className="px-4 py-3 text-[11px] font-black text-[#004d4d]">{fmt(invStats.totalSaleValue)}</td>
                          <td/>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </motion.div>
            )}

            {/* CATEGORÍAS */}
            {activeTab === 'categories' && (
              <motion.div key="categories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const count = productCountByCategory.get(cat.id) || 0;
                  return (
                    <button key={cat.id} onClick={() => { setSelectedCategory(cat); setCategoryView('intel'); }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 hover:shadow-md transition-all group overflow-hidden">
                      {/* Imagen o degradado */}
                      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-[#004d4d] to-[#00706e]">
                        {cat.image_url ? (
                          <img src={cat.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={cat.title}/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-20">
                            <Layers size={40} className="text-white"/>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                        <span className="absolute top-2.5 right-2.5 text-[9px] font-bold text-white bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">{count} productos</span>
                      </div>
                      <div className="p-4">
                        <h4 className="text-sm font-black text-gray-900 group-hover:text-[#004d4d] transition-colors">{cat.title}</h4>
                        {cat.description && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="h-1 flex-1 rounded-full bg-gray-100 overflow-hidden mr-3">
                            <div className="h-full bg-gradient-to-r from-[#004d4d] to-[#00b2bd] rounded-full" style={{ width: `${Math.min((count / Math.max(products.length, 1)) * 100, 100)}%` }}/>
                          </div>
                          <ArrowUpRight size={13} className="text-[#004d4d] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button onClick={() => setIsNewCategoryModalOpen(true)}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-[#004d4d]/30 hover:text-[#004d4d] transition-all bg-transparent min-h-[120px]">
                  <Plus size={20}/>
                  <span className="text-[10px] font-bold tracking-widest">Nueva categoría</span>
                </button>
              </motion.div>
            )}

            {/* LISTA PRODUCTOS */}
            {activeTab !== 'inventory' && activeTab !== 'categories' && (
              <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Cabecera tabla */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Activity size={13} className="text-[#004d4d]"/>
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                      {activeTab === 'all' ? 'Todos los productos' : activeTab === 'active' ? 'Productos activos' : 'Borradores'}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#004d4d]/10 text-[#004d4d]">{filteredProducts.length}</span>
                  </div>
                  {(searchTerm || filterConfig.minPrice || filterConfig.maxPrice || filterConfig.minStock) && (
                    <button onClick={handleClearFilters} className="text-[9px] font-bold text-gray-400 flex items-center gap-1 hover:text-[#004d4d]">
                      <FilterX size={11}/> Limpiar
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-[#004d4d]" size={28}/></div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                    <Package size={36} className="mb-3"/>
                    <p className="text-sm font-semibold">{searchTerm ? 'Sin resultados' : 'Catálogo vacío'}</p>
                    <p className="text-[11px] mt-1">{searchTerm ? 'Intenta con otro término' : 'Crea tu primer producto'}</p>
                    {!searchTerm && (
                      <button onClick={handleNewProductClick}
                        className="mt-4 h-9 flex items-center gap-2 px-4 rounded-xl bg-[#004d4d] text-white text-[10px] font-bold">
                        <Plus size={12}/> Nuevo producto
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-5 py-3 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400">Producto</th>
                          <th className="px-4 py-3 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400">Estado</th>
                          <th className="px-4 py-3 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400">Stock</th>
                          <th className="px-4 py-3 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400">Precio</th>
                          <th className="px-4 py-3 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400">Categoría</th>
                          <th className="px-4 py-3 text-right text-[8px] font-bold tracking-widest uppercase text-gray-400">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {filteredProducts.map((p, i) => {
                            const img = getProductImage(p);
                            const stock = p.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) || 0;
                            return (
                              <motion.tr key={p.id}
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                                className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer group"
                                onClick={() => setSelectedProduct(p)}>

                                {/* Producto */}
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                                      {img ? (
                                        <ProductMedia src={img} className="h-full w-full object-cover" alt={p.name}/>
                                      ) : (
                                        <ImageIcon size={14} className="text-gray-300"/>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[12px] font-bold text-gray-900 truncate max-w-[180px]">{p.name}</p>
                                      <p className="text-[9px] text-gray-400 font-mono">{p.variants?.[0]?.sku || '—'}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* Estado */}
                                <td className="px-4 py-3">
                                  <StatusBadge status={p.status}/>
                                </td>

                                {/* Stock */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-black ${stock === 0 ? 'text-rose-500' : stock <= 5 ? 'text-amber-500' : 'text-gray-800'}`}>{stock}</span>
                                    <span className="text-[9px] text-gray-400">uds</span>
                                    {stock <= 5 && <AlertCircle size={10} className={stock === 0 ? 'text-rose-400' : 'text-amber-400'}/>}
                                  </div>
                                </td>

                                {/* Precio */}
                                <td className="px-4 py-3">
                                  <span className="text-[12px] font-black text-[#004d4d]">{fmt(p.price || 0)}</span>
                                </td>

                                {/* Categoría */}
                                <td className="px-4 py-3">
                                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                                    {p.collection?.title || 'General'}
                                  </span>
                                </td>

                                {/* Acciones */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/products/${p.id}/edit`); }}
                                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-[#004d4d]/10 hover:text-[#004d4d] transition-all">
                                      <Edit3 size={11}/>
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); setProductToDelete(p); }}
                                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                                      <Trash2 size={11}/>
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                    {/* Footer tabla */}
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">{filteredProducts.length} productos · {quickStats.byStatus.active} activos · {quickStats.byStatus.draft} borradores</span>
                      {kpis[2].value > 0 && (
                        <button onClick={() => setActiveTab('inventory')} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline">
                          <AlertCircle size={11}/> {kpis[2].value} en stock crítico
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── SIDEBAR DERECHA ── */}
        <div className="hidden xl:flex flex-col gap-4 w-64 shrink-0">

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Resumen del catálogo</p>
            {[
              { label: 'Unidades en bodega', value: quickStats.totalUnits.toLocaleString(), icon: <Box size={12}/>, color: 'text-[#004d4d]' },
              { label: 'Valor del inventario', value: fmt(quickStats.totalValue), icon: <DollarSign size={12}/>, color: 'text-blue-500' },
              { label: 'Con fotos', value: `${quickStats.withImages} de ${products.length}`, icon: <ImageIcon size={12}/>, color: 'text-violet-500' },
              { label: 'Categorías', value: categories.length.toString(), icon: <Layers size={12}/>, color: 'text-amber-500' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-gray-400 truncate">{s.label}</p>
                  <p className="text-[11px] font-black text-gray-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Distribución de estados */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-3">Distribución</p>
            {[
              { label: 'Activos',    count: quickStats.byStatus.active, color: '#10b981' },
              { label: 'Borradores', count: quickStats.byStatus.draft,  color: '#f59e0b' },
              { label: 'Stock OK',   count: products.length - (kpis[2].value as number), color: '#3b82f6' },
              { label: 'Críticos',   count: kpis[2].value as number, color: '#ef4444' },
            ].map((r, i) => (
              <div key={i} className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-gray-600">{r.label}</span>
                  <span className="text-[10px] font-black text-gray-800">{r.count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${products.length > 0 ? (r.count / products.length) * 100 : 0}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: r.color }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div className="bg-[#001a1a] rounded-2xl p-4 space-y-2">
            <p className="text-[9px] font-bold tracking-widest uppercase text-[#00f2ff]/50 mb-3">Acciones rápidas</p>
            {[
              { label: 'Nuevo producto',   icon: <Plus size={11}/>,     action: handleNewProductClick },
              { label: 'Importar Excel',   icon: <Download size={11}/>, action: () => setIsImportModalOpen(true) },
              { label: 'Exportar catálogo',icon: <Download size={11}/>, action: handleExportExcel },
            ].map((a, i) => (
              <button key={i} onClick={a.action}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-semibold transition-all text-left">
                <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[#00f2ff]">{a.icon}</div>
                {a.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric}/>

      {/* ── MODAL LÍMITE PLAN ── */}
      <AnimatePresence>
        {isLimitModalOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLimitModalOpen(false)} className="absolute inset-0 bg-[#001a1a]/80 backdrop-blur-xl"/>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="bg-[#004d4d] p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center"><ShieldCheck size={20}/></div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest text-[#00f2ff]/60 uppercase">Plan Básico</p>
                    <h3 className="text-lg font-black">{limitType === 'blocked' ? 'Límite alcanzado' : '¡Casi llegas al límite!'}</h3>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-white rounded-full" style={{ width: `${(products.length / 30) * 100}%` }}/>
                </div>
                <p className="text-[10px] text-white/60 mt-1">{products.length}/30 productos</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 leading-relaxed">
                  {limitType === 'blocked'
                    ? 'Has aprovechado al máximo tu Plan Básico. Para seguir añadiendo productos, sube de nivel.'
                    : 'Tu catálogo está creciendo rápido. Estás a solo unos productos del límite.'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['Catálogo ilimitado','Más imágenes por producto','SEO avanzado','Soporte prioritario'].map(b => (
                    <div key={b} className="flex items-center gap-2 text-[10px] text-gray-600 font-medium">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0"/>{b}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => router.push('/planes')}
                    className="flex-1 h-10 bg-[#004d4d] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Sparkles size={12}/> Ver planes
                  </button>
                  {limitType === 'warning' && (
                    <button onClick={() => setIsLimitModalOpen(false)}
                      className="px-5 h-10 bg-gray-100 text-gray-400 rounded-2xl font-bold text-[10px]">Continuar</button>
                  )}
                  <button onClick={() => setIsLimitModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><X size={14}/></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL DETALLE CATEGORÍA ── */}
      <AnimatePresence>
        {selectedCategory && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCategory(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">

              {/* Header con imagen */}
              <div className="relative h-52 shrink-0 bg-gradient-to-br from-[#004d4d] to-[#006660] overflow-hidden">
                {selectedCategory.image_url && (
                  <img src={selectedCategory.image_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt={selectedCategory.title}/>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => { setEditingCategory(selectedCategory); setEditCatData({ name: selectedCategory.title, description: selectedCategory.description || '' }); setEditCatImgPreview(selectedCategory.image_url || null); }}
                    className="h-9 px-3 rounded-xl bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center gap-1.5 text-white text-[10px] font-bold transition-all">
                    <Edit3 size={12}/> Editar
                  </button>
                  <button onClick={() => setSelectedCategory(null)}
                    className="h-9 w-9 rounded-xl bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center text-white transition-all">
                    <X size={16}/>
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[9px] font-bold tracking-[0.2em] text-white/50 uppercase mb-1">Categoría</p>
                  <h3 className="text-2xl font-black text-white leading-tight">{selectedCategory.title}</h3>
                  {selectedCategory.description && <p className="text-white/60 text-xs mt-1 line-clamp-1">{selectedCategory.description}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-bold text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                      {selectedCategoryProducts.length} producto{selectedCategoryProducts.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-400/20">
                      {selectedCategoryProducts.filter(p => p.status === 'active').length} activos
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-6 shrink-0 bg-white">
                {(['intel', 'list'] as const).map(tab => (
                  <button key={tab} onClick={() => setCategoryView(tab)}
                    className={`px-4 py-3.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all -mb-px ${categoryView === tab ? 'border-[#004d4d] text-[#004d4d]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    {tab === 'intel' ? 'Resumen' : 'Productos'}
                  </button>
                ))}
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <AnimatePresence mode="wait">
                  {categoryView === 'list' ? (
                    <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6">
                      {selectedCategoryProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                          <Package size={40}/>
                          <p className="text-sm font-bold mt-3 text-gray-400">Sin productos en esta categoría</p>
                          <p className="text-xs text-gray-300 mt-1">Crea productos y asígnalos aquí</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {selectedCategoryProducts.map(p => (
                            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                                {getProductImage(p)
                                  ? <ProductMedia src={getProductImage(p)} className="h-full w-full object-cover" alt={p.name}/>
                                  : <ImageIcon size={20} className="text-gray-200"/>}
                              </div>
                              <div className="p-3">
                                <p className="text-[11px] font-bold text-gray-900 truncate">{p.name}</p>
                                <p className="text-[11px] text-[#004d4d] font-black mt-0.5">{fmt(p.price || 0)}</p>
                                <span className={`mt-1.5 inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                  {p.status === 'active' ? 'Activo' : 'Borrador'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="intel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 space-y-4">
                      {/* KPIs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Total productos', value: selectedCategoryProducts.length, icon: <Package size={14}/>, color: '#004d4d' },
                          { label: 'Valor inventario', value: fmt(selectedCategoryProducts.reduce((a, p) => a + (p.price || 0), 0)), icon: <DollarSign size={14}/>, color: '#059669' },
                          { label: 'Con imagen', value: selectedCategoryProducts.filter(p => getProductImage(p)).length, icon: <ImageIcon size={14}/>, color: '#7c3aed' },
                          { label: 'Activos', value: selectedCategoryProducts.filter(p => p.status === 'active').length, icon: <Activity size={14}/>, color: '#d97706' },
                        ].map((s, i) => (
                          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-xl font-black text-gray-900 mt-0.5 leading-none">{s.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Barra de completitud */}
                      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-black text-gray-900">Salud de la categoría</p>
                          <span className="text-[10px] font-bold text-[#004d4d]">
                            {selectedCategoryProducts.length === 0 ? '—' : `${Math.round((selectedCategoryProducts.filter(p => getProductImage(p) && p.price > 0).length / selectedCategoryProducts.length) * 100)}%`}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: selectedCategoryProducts.length === 0 ? '0%' : `${Math.round((selectedCategoryProducts.filter(p => getProductImage(p) && p.price > 0).length / selectedCategoryProducts.length) * 100)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-[#004d4d] to-[#00b2bd] rounded-full"/>
                        </div>
                        <div className="flex gap-4 mt-3">
                          {[
                            { label: 'Con foto', ok: selectedCategoryProducts.filter(p => getProductImage(p)).length, total: selectedCategoryProducts.length },
                            { label: 'Con precio', ok: selectedCategoryProducts.filter(p => p.price > 0).length, total: selectedCategoryProducts.length },
                            { label: 'Activos', ok: selectedCategoryProducts.filter(p => p.status === 'active').length, total: selectedCategoryProducts.length },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <div className={`h-1.5 w-1.5 rounded-full ${item.ok === item.total && item.total > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}/>
                              <span className="text-[9px] text-gray-500 font-semibold">{item.label} ({item.ok}/{item.total})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Productos recientes */}
                      {selectedCategoryProducts.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                          <p className="text-xs font-black text-gray-900 mb-3">Productos recientes</p>
                          <div className="space-y-2">
                            {selectedCategoryProducts.slice(0, 4).map(p => (
                              <div key={p.id} className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {getProductImage(p) ? <ProductMedia src={getProductImage(p)} className="h-full w-full object-cover" alt={p.name}/> : <ImageIcon size={12} className="text-gray-300"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-gray-900 truncate">{p.name}</p>
                                  <p className="text-[10px] text-gray-400">{fmt(p.price || 0)}</p>
                                </div>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                  {p.status === 'active' ? 'Activo' : 'Borrador'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── GUÍA OPERATIVA ── */}
      <AnimatePresence>
        {isGuideOpen && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setIsGuideOpen(false)}/>
            <div className="fixed inset-0 flex items-center justify-center p-6" style={{ zIndex: 9999 }}>
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white w-full max-w-4xl max-h-[82vh] rounded-[2rem] shadow-2xl overflow-hidden flex md:flex-row flex-col"
                onClick={e => e.stopPropagation()}>
                <button onClick={() => setIsGuideOpen(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 z-20">
                  <X size={14}/>
                </button>
                {/* Nav */}
                <div className="w-56 bg-gray-50 border-r border-gray-100 p-5 flex flex-col shrink-0">
                  <div className="mb-5">
                    <p className="text-[9px] font-bold tracking-widest text-[#004d4d]/50 uppercase mb-1">Tutorial</p>
                    <h3 className="text-base font-black text-gray-900">Gestión de <span className="text-[#004d4d]">productos</span></h3>
                  </div>
                  <div className="space-y-1 flex-1">
                    {(Object.entries(guideContent) as any).map(([key, item]: any) => (
                      <button key={key} onClick={() => setActiveGuideTab(key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${activeGuideTab === key ? 'bg-white shadow-sm border border-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 ${activeGuideTab === key ? 'bg-[#004d4d] text-white' : 'bg-gray-100'}`}>{item.icon}</div>
                        <span className="text-[10px] font-semibold truncate">{item.title}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-[#004d4d] rounded-2xl p-4 text-white relative overflow-hidden">
                      <div className="absolute -right-2 -bottom-2 opacity-10"><Bot size={50}/></div>
                      <p className="text-[9px] font-bold tracking-widest text-[#00f2ff] mb-1">BAYT AI</p>
                      <p className="text-[10px] leading-relaxed text-white/70">Registra productos por voz con Bayt AI.</p>
                    </div>
                  </div>
                </div>
                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-8">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeGuideTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-5">
                      <div className="flex items-start gap-3 pr-10">
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4 bg-gray-50 border border-gray-100 ${guideContent[activeGuideTab as keyof typeof guideContent].color}`}>
                          {guideContent[activeGuideTab as keyof typeof guideContent].icon}
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-gray-900">{guideContent[activeGuideTab as keyof typeof guideContent].title}</h2>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">Guía táctica</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 italic border-l-2 border-[#004d4d]/20 pl-4 leading-relaxed">
                        "{guideContent[activeGuideTab as keyof typeof guideContent].description}"
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Activity size={9} className="text-[#004d4d]"/> Métrica</p>
                          <p className="text-2xl font-black text-gray-900">{guideContent[activeGuideTab as keyof typeof guideContent].kpi.val}</p>
                          <p className="text-[10px] text-[#004d4d] font-semibold mt-0.5">{guideContent[activeGuideTab as keyof typeof guideContent].kpi.label}</p>
                          <div className="mt-2 h-1 w-full bg-white rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ delay: 0.2, duration: 0.5 }} className="h-full bg-gradient-to-r from-[#004d4d] to-[#00b2bd] rounded-full"/>
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-gray-100">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Target size={9} className="text-rose-400"/> ¿Por qué es vital?</p>
                          <p className="text-[11px] text-gray-600 leading-relaxed">{guideContent[activeGuideTab as keyof typeof guideContent].whyImportant}</p>
                        </div>
                      </div>
                      <div className="bg-[#001a1a] rounded-2xl p-5 text-white">
                        <div className="flex items-center gap-3 mb-3">
                          <Bot size={14} className="text-[#00f2ff]"/>
                          <p className="text-[9px] font-bold tracking-widest text-[#00f2ff] uppercase">Estrategia Bayt AI</p>
                        </div>
                        <p className="text-sm text-white/70 italic leading-relaxed">"{guideContent[activeGuideTab as keyof typeof guideContent].baytTip}"</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL EDITAR CATEGORÍA ── */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingCategory(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900">Editar categoría</h3>
                <button onClick={() => setEditingCategory(null)} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><X size={14}/></button>
              </div>
              <label className="block cursor-pointer">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Imagen (opcional)</span>
                {editCatImgPreview ? (
                  <div className="relative h-32 rounded-2xl overflow-hidden border border-gray-200">
                    <img src={editCatImgPreview} className="w-full h-full object-cover"/>
                    <button type="button" onPointerDown={e => e.preventDefault()} onClick={e => { e.preventDefault(); setEditCatImgFile(null); setEditCatImgPreview(null); }}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500"><X size={11}/></button>
                  </div>
                ) : (
                  <div className="h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-300 hover:border-[#004d4d]/30 transition-all">
                    <ImageIcon size={22}/><span className="text-[9px] font-bold">Subir imagen</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setEditCatImgFile(f); setEditCatImgPreview(URL.createObjectURL(f));
                }}/>
              </label>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nombre *</label>
                <input value={editCatData.name} onChange={e => setEditCatData(d => ({ ...d, name: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 outline-none focus:border-[#004d4d]/40"/>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Descripción (opcional)</label>
                <textarea value={editCatData.description} onChange={e => setEditCatData(d => ({ ...d, description: e.target.value }))} rows={2}
                  placeholder="Describe esta categoría…"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#004d4d]/40 resize-none"/>
              </div>
              <button onClick={handleSaveCategory} disabled={isSavingCategory || !editCatData.name.trim()}
                className="w-full h-10 rounded-2xl bg-[#004d4d] text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                {isSavingCategory ? <><Loader2 size={12} className="animate-spin"/>Guardando…</> : 'Guardar cambios'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL NUEVA CATEGORÍA ── */}
      <AnimatePresence>
        {isNewCategoryModalOpen && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setIsNewCategoryModalOpen(false)}/>
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <motion.div initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
                className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-black text-gray-900">Nueva categoría</h3>
                  <button onClick={() => { setIsNewCategoryModalOpen(false); setNewCatImgFile(null); setNewCatImgPreview(null); setNewCategoryData({ name: '', description: '' }); }} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><X size={14}/></button>
                </div>
                <div className="space-y-3">
                  {/* Imagen opcional */}
                  <label className="block cursor-pointer">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Imagen (opcional)</span>
                    {newCatImgPreview ? (
                      <div className="relative h-32 rounded-2xl overflow-hidden border border-gray-200">
                        <img src={newCatImgPreview} className="w-full h-full object-cover"/>
                        <button type="button" onPointerDown={e => e.preventDefault()} onClick={e => { e.preventDefault(); setNewCatImgFile(null); setNewCatImgPreview(null); }}
                          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500">
                          <X size={11}/>
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-300 hover:border-[#004d4d]/30 transition-all">
                        <ImageIcon size={22}/>
                        <span className="text-[9px] font-bold">Subir imagen</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setNewCatImgFile(f); setNewCatImgPreview(URL.createObjectURL(f));
                    }}/>
                  </label>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nombre *</label>
                    <input value={newCategoryData.name} onChange={e => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                      placeholder="Ej: Accesorios Premium"
                      className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 outline-none focus:border-[#004d4d]/40"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Descripción (opcional)</label>
                    <textarea value={newCategoryData.description} onChange={e => setNewCategoryData({ ...newCategoryData, description: e.target.value })} rows={2}
                      placeholder="Describe esta categoría…"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#004d4d]/40 resize-none"/>
                  </div>
                  <button onClick={handleCreateCategory} disabled={isCreatingCategory || !newCategoryData.name.trim()}
                    className="w-full h-10 rounded-2xl bg-[#004d4d] text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                    {isCreatingCategory ? <><Loader2 size={12} className="animate-spin"/>Creando…</> : 'Crear categoría'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL CONFIRMAR ELIMINACIÓN ── */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProductToDelete(null)} className="absolute inset-0 bg-[#001a1a]/70 backdrop-blur-md"/>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 text-center">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-rose-500"/></div>
              <h3 className="text-lg font-black text-gray-900">¿Eliminar producto?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Se eliminará permanentemente <strong>"{productToDelete.name}"</strong> de tu catálogo.
              </p>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setProductToDelete(null)} className="flex-1 h-10 rounded-2xl bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest">Cancelar</button>
                <button onClick={handleDeleteProduct} disabled={isDeletingProduct}
                  className="flex-1 h-10 rounded-2xl bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {isDeletingProduct ? <><Loader2 size={11} className="animate-spin"/>Eliminando</> : 'Sí, eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL IMPORTAR EXCEL ── */}
      <AnimatePresence>
        {isImportModalOpen && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setIsImportModalOpen(false)}/>
            <div className="fixed inset-0 flex items-center justify-center p-6" style={{ zIndex: 9999 }}>
              <motion.div initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
                className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-100 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Download size={16}/></div>
                    <div>
                      <h3 className="text-base font-black text-gray-900">Importar productos</h3>
                      <p className="text-[10px] text-gray-400">Sube tu Excel y se crean automáticamente</p>
                    </div>
                  </div>
                  <button onClick={() => setIsImportModalOpen(false)} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><X size={14}/></button>
                </div>
                <div className="space-y-3">
                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${importFile ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200 hover:border-[#004d4d]/40 hover:bg-gray-50'}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setImportFile(f); }}
                    onClick={() => !importFile && document.getElementById('fileImport')?.click()}>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setImportFile(e.target.files?.[0] || null)} className="hidden" id="fileImport"/>
                    {importFile ? (
                      <div className="space-y-1.5">
                        <CheckCircle2 size={20} className="text-emerald-500 mx-auto"/>
                        <p className="text-sm font-semibold text-gray-800">{importFile.name}</p>
                        <button onClick={e => { e.stopPropagation(); setImportFile(null); }} className="text-[10px] font-bold text-rose-500 hover:underline">Cambiar archivo</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Download size={18} className="text-gray-300 mx-auto"/>
                        <p className="text-sm text-gray-500">Arrastra tu Excel o <span className="text-[#004d4d] font-semibold">haz clic</span></p>
                        <p className="text-[10px] text-gray-400">.xlsx · .xls · .csv</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Columnas requeridas</p>
                    <div className="flex flex-wrap gap-1">
                      {['name','price','stock','description','category','sku','color','size'].map(c => (
                        <span key={c} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#004d4d]/5 border border-[#004d4d]/10 rounded-2xl">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-700">¿Sin formato?</p>
                      <p className="text-[10px] text-gray-400">Descarga nuestra plantilla con ejemplos</p>
                    </div>
                    <button onClick={handleDownloadTemplate}
                      className="h-8 px-3 rounded-xl bg-white border border-gray-200 text-[9px] font-bold text-[#004d4d] hover:bg-[#004d4d] hover:text-white transition-all shadow-sm flex items-center gap-1">
                      <Download size={11}/> Plantilla
                    </button>
                  </div>
                  <button onClick={handleImportSubmit} disabled={!importFile || isImporting}
                    className={`w-full h-10 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!importFile || isImporting ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-[#004d4d] text-white hover:bg-[#003838]'}`}>
                    {isImporting ? <><Loader2 size={13} className="animate-spin"/>Importando…</> : <><Rocket size={13}/> Importar productos</>}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── DRAWER DETALLE PRODUCTO ── */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setSelectedProduct(null)}/>
            <div className="fixed inset-0 flex items-center justify-end p-4" style={{ zIndex: 9999 }}>
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.22 }}
                className="relative bg-white w-full max-w-md h-full max-h-[calc(100vh-2rem)] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}>
                {/* Header imagen */}
                <div className="relative bg-gray-50 shrink-0" style={{ height: 200 }}>
                  {getProductImage(selectedProduct) ? (
                    <ProductMedia src={getProductImage(selectedProduct)} className="h-full w-full object-cover" alt={selectedProduct.name}/>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-200"><ImageIcon size={48}/></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                  <button onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-all">
                    <X size={14}/>
                  </button>
                  <div className="absolute bottom-4 left-4">
                    <StatusBadge status={selectedProduct.status}/>
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <p className="text-[9px] font-bold tracking-widest text-[#004d4d] uppercase">{selectedProduct.collection?.title || 'General'}</p>
                    <h2 className="text-xl font-black text-gray-900 mt-0.5">{selectedProduct.name}</h2>
                    <p className="text-2xl font-black text-[#004d4d] mt-1">{fmt(selectedProduct.price || 0)}</p>
                  </div>

                  {/* Stats rápidos */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Stock total', value: `${selectedProduct.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) || 0} uds` },
                      { label: 'Variantes',   value: `${selectedProduct.variants?.length || 0}` },
                      { label: 'Estado',      value: selectedProduct.status === 'active' ? 'Activo' : 'Borrador' },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <p className="text-sm font-black text-gray-800 mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Variantes */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Variantes</p>
                      {selectedProduct.variants.map((v: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-500">{i+1}</div>
                            <div>
                              <p className="text-[11px] font-bold text-gray-800">{v.name}</p>
                              <p className="text-[9px] font-mono text-gray-400">{v.sku || 'Sin SKU'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${v.stock <= 5 ? 'text-rose-500' : 'text-gray-800'}`}>{v.stock}</span>
                            <StockBadge stock={v.stock}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tip AI */}
                  <div className="bg-[#001a1a] rounded-2xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot size={13} className="text-[#00f2ff]"/>
                      <p className="text-[9px] font-bold tracking-widest text-[#00f2ff] uppercase">Bayt AI</p>
                    </div>
                    <p className="text-[11px] text-white/70 italic leading-relaxed">"Mantén stock en todas las variantes para reducir la tasa de abandono en un 22%."</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex gap-2 shrink-0">
                  <button onClick={() => { router.push(`/dashboard/products/${selectedProduct.id}/edit`); setSelectedProduct(null); }}
                    className="flex-1 h-10 rounded-2xl bg-[#004d4d] text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <Edit3 size={12}/> Editar producto
                  </button>
                  <button onClick={() => { setProductToDelete(selectedProduct); setSelectedProduct(null); }}
                    className="h-10 w-10 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
