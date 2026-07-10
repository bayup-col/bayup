"use client";

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence } from 'framer-motion';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import {
  User, Mail, Smartphone, Search, Plus, Trash2, MessageSquare,
  CheckCircle2, DollarSign, Calendar, Filter, TrendingUp, ShoppingBag,
  Zap, Download, ChevronDown, Package, ShoppingCart, CreditCard,
  MapPin, Activity, ArrowLeft, Loader2, ShieldCheck, Target,
  Globe, Wallet, Eye, X, Store, FileText, RefreshCw, Inbox,
  Receipt, FilterX, Check, FileSpreadsheet
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { apiRequest } from '@/lib/api';

// ── HELPERS ────────────────────────────────────────────────────────────────
const fmtCOP = (n: number) =>
  `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n)}`;

// ── INTERFACES ─────────────────────────────────────────────────────────────
interface Product {
  id: string; name: string; category: string; description?: string;
  price: number; wholesale_price?: number; sku: string; image_url?: any; variants?: any[];
}
interface InvoicingItem {
  id: string; name: string; variant_id?: string;
  price: number; quantity: number; sku: string; image?: string; maxStock: number;
}
interface PastInvoice {
  id: string; invoice_num: string; date: string; customer: string;
  customer_email?: string; customer_phone?: string; customer_city?: string;
  source: string; payment_method: string; total: number; status?: string;
}

// ── KPI CARD ──────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent, progress }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; accent: string; progress?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4"
          style={{ backgroundColor: `${accent}15`, color: accent }}>
          {icon}
        </div>
        {sub && (
          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${accent}12`, color: accent }}>
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      </div>
      {progress !== undefined && (
        <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: accent }}/>
        </div>
      )}
    </div>
  );
}

// ── SOURCE BADGE ──────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  const s = (source || '').toLowerCase();
  const cfg =
    s === 'pos' || s === 'tienda física'      ? { label: 'Tienda',        color: '#7c3aed', bg: '#7c3aed15' } :
    s === 'whatsapp'                          ? { label: 'WhatsApp',      color: '#16a34a', bg: '#16a34a15' } :
    s === 'social' || s === 'redes sociales' ? { label: 'Redes Sociales', color: '#f59e0b', bg: '#f59e0b15' } :
    s === 'web' || s === 'página web'         ? { label: 'Web',           color: '#0891b2', bg: '#0891b215' } :
                                               { label: source || 'Otros', color: '#6b7280', bg: '#6b728015' };
  return (
    <span className="text-[8px] font-black px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── PAYMENT BADGE ─────────────────────────────────────────────────────────
function PaymentBadge({ method }: { method: string }) {
  const isCash = method === 'cash' || method === 'Efectivo';
  return (
    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isCash ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
      {isCash ? 'Efectivo' : 'Transferencia'}
    </span>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function InvoicingPage() {
  const { token, userEmail: authEmail } = useAuth();
  const { showToast } = useToast();

  // Core state
  const [registeredCustomers,      setRegisteredCustomers]      = useState<any[]>([]);
  const [isPOSActive,              setIsPOSActive]              = useState(false);
  const [posMobileTab,             setPosMobileTab]             = useState<'form'|'preview'>('form');
  const [selectedInvoice,          setSelectedInvoice]          = useState<PastInvoice | null>(null);
  const [fullSelectedOrder,        setFullSelectedOrder]        = useState<any>(null);
  const [selectedMetric,           setSelectedMetric]           = useState<any>(null);
  const [products,                 setProducts]                 = useState<Product[]>([]);
  const [companyData,              setCompanyData]              = useState<any>(() => {
    try { const c = localStorage.getItem('bayup_company_profile'); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [history,                  setHistory]                  = useState<PastInvoice[]>([]);
  const [historySearch,            setHistorySearch]            = useState('');
  const [dateRange,                setDateRange]                = useState({ start: '', end: '' });
  const [extraFilters,             setExtraFilters]             = useState({ source: 'Todos', payment: 'Todos' });
  const [isFilterOpen,             setIsFilterOpen]             = useState(false);
  const [showExportMenu,           setShowExportMenu]           = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // POS state
  const [customerInfo,             setCustomerInfo]             = useState({ name: '', email: '', phone: '', city: '', source: 'Tienda Física', type: 'final', seller: '' });
  const [posCustomerMode,          setPosCustomerMode]          = useState<'search' | 'create'>('create');
  const [customerSearch,           setCustomerSearch]           = useState('');
  const [isSourceDropdownOpen,     setIsSourceDropdownOpen]     = useState(false);
  const [selectedVendedor,         setSelectedVendedor]         = useState(() => {
    try { return localStorage.getItem('bayup_last_vendedor') || ''; } catch { return ''; }
  });
  const [vendedores,               setVendedores]               = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bayup_vendedores') || '[]'); } catch { return []; }
  });
  const [isVendedorDropdownOpen,   setIsVendedorDropdownOpen]   = useState(false);
  const [newVendedorName,          setNewVendedorName]          = useState('');
  const [showNewVendedor,          setShowNewVendedor]          = useState(false);
  const [invoiceItems,             setInvoiceItems]             = useState<InvoicingItem[]>([]);
  const [productSearch,            setProductSearch]            = useState('');
  const [selectedCategory,         setSelectedCategory]         = useState('Todas');
  const [categories,               setCategories]               = useState<string[]>(['Todas']);
  const [isProcessing,             setIsProcessing]             = useState(false);
  const [paymentMethod,            setPaymentMethod]            = useState<'cash' | 'transfer'>('cash');

  // Variant modal state
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [selectedVariants,          setSelectedVariants]          = useState<Record<string, any>>({});
  const [tempPrice,                 setTempPrice]                 = useState(0);
  const [tempQty,                   setTempQty]                   = useState(1);
  const [mounted,                   setMounted]                   = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [currentImageIndex,         setCurrentImageIndex]         = useState(0);
  const [quickVariant,              setQuickVariant]              = useState({ name: '', sku: '' });
  const [isCreatingQuickVariant,    setIsCreatingQuickVariant]    = useState(false);

  // ── Data loading ──
  const loadData = useCallback(async () => {
    if (!token) return;
    const isProduction = window.location.hostname.includes('railway.app') || window.location.hostname.includes('bayup.com');

    const [pRes, userData, cRes, oRes, custRes] = await Promise.allSettled([
      apiRequest<any[]>('/products', { token }),
      apiRequest<any>('/auth/me', { token }),
      isProduction ? Promise.resolve([]) : apiRequest<any[]>('/collections', { token }),
      apiRequest<any[]>('/orders', { token }),
      apiRequest<any[]>('/admin/users', { token }),
    ]);

    if (userData.status === 'fulfilled' && userData.value) setCompanyData(userData.value);
    if (pRes.status === 'fulfilled' && pRes.value) setProducts(pRes.value);

    if (isProduction) {
      setCategories(['Todas', 'General', 'Nueva Colección']);
    } else if (cRes.status === 'fulfilled' && Array.isArray(cRes.value)) {
      setCategories(['Todas', ...cRes.value.map((c: any) => c.title || c.name)]);
    }

    if (oRes.status === 'fulfilled' && Array.isArray(oRes.value)) {
      const sorted = [...oRes.value].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const mapped = sorted.map((o, i) => ({
        id: o.id,
        invoice_num: `#${String(i + 1).padStart(4, '0')}`,
        date: o.created_at,
        customer: o.customer_name || 'Cliente',
        customer_email: o.customer_email,
        customer_phone: o.customer_phone,
        customer_city: o.customer_city,
        source: o.source || 'pos',
        payment_method: o.payment_method || 'cash',
        total: o.total_price || 0,
        status: o.status
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(mapped);
    }
    if (custRes.status === 'fulfilled' && Array.isArray(custRes.value)) {
      setRegisteredCustomers(custRes.value);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handler = (e: any) => { if (e.detail) setCompanyData((p: any) => ({ ...p, ...e.detail })); };
    window.addEventListener('bayup_company_updated', handler);
    return () => window.removeEventListener('bayup_company_updated', handler);
  }, []);

  useEffect(() => {
    if (isPOSActive) document.body.classList.add('sidebar-hide');
    else             document.body.classList.remove('sidebar-hide');
    return () => document.body.classList.remove('sidebar-hide');
  }, [isPOSActive]);

  // Ventas visibles en facturación: POS (cualquier estado) + web solo si completado
  const isFacturable = (inv: PastInvoice) => {
    const src = (inv.source || '').toLowerCase();
    const isWeb = src === 'web' || src === 'página web';
    return !isWeb || inv.status === 'completed';
  };

  // ── KPIs ── (POS + pedidos web completados)
  const invoicingKpis = useMemo(() => {
    const billed    = history.filter(isFacturable);
    const today     = new Date().toISOString().split('T')[0];
    const todayOrds = billed.filter(inv => inv.date?.split('T')[0] === today);
    const salesToday = todayOrds.reduce((a, b) => a + Number(b.total), 0);
    const totalRev   = billed.reduce((a, b) => a + Number(b.total), 0);
    const avgTicket  = billed.length > 0 ? totalRev / billed.length : 0;
    return [
      { icon: <Activity/>, label: 'Ventas de hoy', value: fmtCOP(salesToday),        sub: 'En vivo',  accent: '#10b981', progress: Math.min((salesToday / 1000000) * 100, 100) },
      { icon: <ShoppingBag/>, label: 'Operaciones', value: String(billed.length),     sub: 'Total',    accent: '#0891b2', progress: Math.min((billed.length / 50) * 100, 100) },
      { icon: <Target/>, label: 'Ticket promedio', value: fmtCOP(avgTicket),          sub: 'Market',   accent: '#7c3aed', progress: 60 },
      { icon: <Wallet/>, label: 'Flujo de caja',   value: fmtCOP(totalRev),           sub: 'Balance',  accent: '#004d4d', progress: 75 },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  // ── Filtered history ──
  const filteredHistory = useMemo(() => history.filter(inv => {
    if (!isFacturable(inv)) return false;        // excluir web no completados
    const q = historySearch.toLowerCase();
    const matchSearch  = !q || inv.customer?.toLowerCase().includes(q) || inv.invoice_num?.toLowerCase().includes(q);
    const d = new Date(inv.date);
    const matchStart   = !dateRange.start || d >= new Date(dateRange.start);
    const matchEnd     = !dateRange.end   || d <= new Date(dateRange.end);
    const matchSource  = extraFilters.source === 'Todos' || inv.source === extraFilters.source;
    const matchPayment = extraFilters.payment === 'Todos' ||
      inv.payment_method === (extraFilters.payment === 'Efectivo' ? 'cash' : 'transfer');
    return matchSearch && matchStart && matchEnd && matchSource && matchPayment;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [history, historySearch, dateRange, extraFilters]);

  // ── EXPORT ──
  const handleExportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Bayup';
    const ws = wb.addWorksheet('Facturación');
    ws.columns = [
      { key: 'num',     width: 14 },
      { key: 'date',    width: 16 },
      { key: 'cliente', width: 30 },
      { key: 'email',   width: 28 },
      { key: 'phone',   width: 16 },
      { key: 'ciudad',  width: 16 },
      { key: 'origen',  width: 16 },
      { key: 'metodo',  width: 18 },
      { key: 'total',   width: 20 },
    ];
    const hdr = ws.getRow(1);
    ['# FACTURA','FECHA','CLIENTE','EMAIL','TELÉFONO','CIUDAD','ORIGEN','MÉTODO PAGO','TOTAL (COP)'].forEach((h, i) => {
      const cell = hdr.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10, name: 'Arial' };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thick', color: { argb: '00F2FF' } } };
    });
    hdr.height = 36;
    filteredHistory.forEach((inv, i) => {
      const row = ws.addRow({
        num: inv.invoice_num, date: inv.date,
        cliente: inv.customer, email: inv.customer_email || '—',
        phone: inv.customer_phone || '—', ciudad: inv.customer_city || '—',
        origen: inv.source, metodo: inv.payment_method, total: inv.total,
      });
      row.height = 26;
      row.getCell(9).numFmt = '"$"#,##0';
      row.getCell(9).font = { bold: true, color: { argb: '004D4D' }, name: 'Arial', size: 10 };
      if (i % 2 === 0) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFA' } }; });
    });
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `facturacion_${new Date().toISOString().slice(0,10)}.xlsx`);
    setShowExportMenu(false);
    showToast('Excel descargado ✓', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['# FACTURA','FECHA','CLIENTE','EMAIL','TELÉFONO','CIUDAD','ORIGEN','MÉTODO PAGO','TOTAL'];
    const rows = filteredHistory.map(inv => [
      inv.invoice_num, inv.date, inv.customer,
      inv.customer_email || '', inv.customer_phone || '', inv.customer_city || '',
      inv.source, inv.payment_method, inv.total,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `facturacion_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showToast('CSV descargado ✓', 'success');
  };

  // ── Filtered products ──
  const filteredProducts = useMemo(() => products.filter(p => {
    const totalStock = p.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) ?? 0;
    if (totalStock <= 0) return false;
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        (p.sku?.toLowerCase() || '').includes(productSearch.toLowerCase());
    const productCat  = p.category || (p as any).collection?.title || 'General';
    const matchCat    = selectedCategory === 'Todas' || productCat.toLowerCase() === selectedCategory.toLowerCase();
    return matchSearch && matchCat;
  }).slice(0, 12), [productSearch, products, selectedCategory]);

  const calculateSubtotal = () => invoiceItems.reduce((a, i) => a + i.price * i.quantity, 0);

  // ── Handlers ──
  const handleViewDetail = async (inv: PastInvoice) => {
    setSelectedInvoice(inv);
    setFullSelectedOrder(null);
    try {
      const data = await apiRequest<any[]>('/orders', { token });
      const detail = data.find((o: any) => o.id === inv.id);
      if (detail) setFullSelectedOrder(detail);
    } catch {}
  };

  const handleCreateQuickVariant = async () => {
    if (!quickVariant.name || !quickVariant.sku || !selectedProductForVariant) return;
    setIsCreatingQuickVariant(true);
    try {
      const newV = { name: quickVariant.name, sku: quickVariant.sku, stock: 99, price_adjustment: 0 };
      const updatedProduct = { ...selectedProductForVariant, variants: [...(selectedProductForVariant.variants || []), newV] };
      await apiRequest(`/products/${selectedProductForVariant.id}`, { method: 'PUT', token, body: JSON.stringify(updatedProduct) });
      setProducts(prev => prev.map(p => p.id === selectedProductForVariant.id ? updatedProduct : p));
      setSelectedProductForVariant(updatedProduct);
      setSelectedVariants(prev => ({ ...prev, [quickVariant.name]: newV }));
      setQuickVariant({ name: '', sku: '' });
      showToast("Variante creada ✨", "success");
    } catch { showToast("Error al crear variante", "error"); }
    finally { setIsCreatingQuickVariant(false); }
  };

  const addToCart = (product: Product, variantsMap?: Record<string, any>, customPrice?: number, qty = 1) => {
    const selections = variantsMap && Object.keys(variantsMap).length > 0 ? Object.values(variantsMap) : [];
    const variantDesc = selections.length > 0 ? selections.map(v => `${v.name}: ${v.sku}`).join(' / ') : 'Base';
    const finalPrice = customPrice !== undefined
      ? customPrice
      : (customerInfo.type === 'mayorista' ? (product.wholesale_price || product.price) : product.price)
        + selections.reduce((acc, v) => acc + (v.price_adjustment || 0), 0);
    const mainImg = Array.isArray(product.image_url) && product.image_url.length > 0
      ? product.image_url[0]
      : (typeof product.image_url === 'string' ? product.image_url : null);
    // Si no hay selección explícita, usa la primera variante con stock
    const firstVariantWithStock = product.variants?.find((v: any) => (v.stock || 0) > 0);
    const primaryVariantId = selections.length > 0
      ? selections[0].id
      : (firstVariantWithStock?.id ?? product.variants?.[0]?.id ?? product.id);
    const maxStock = selections.length > 0
      ? Math.min(...selections.map(s => s.stock ?? 0))
      : (firstVariantWithStock?.stock ?? product.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) ?? 0);
    setInvoiceItems(prev => [...prev, {
      id: product.id,
      variant_id: primaryVariantId,
      name: selections.length === 0 ? product.name : `${product.name} (${variantDesc})`,
      price: finalPrice,
      quantity: qty,
      maxStock,
      sku: selections.length > 0 ? selections.map(s => s.sku).join('-') : product.sku,
      image: selections.length > 0 ? (selections.find(s => s.image_url)?.image_url || mainImg) : mainImg
    }]);
    setSelectedProductForVariant(null);
    showToast("Producto añadido ✨", "success");
  };

  const handleProductClick = (product: Product) => {
    setSelectedProductForVariant(product);
    const initial: Record<string, any> = {};
    if (product.variants?.length) {
      const families = Array.from(new Set(product.variants.map(v => v.name)));
      families.forEach(f => { const first = product.variants?.find(v => v.name === f); if (first) initial[f] = first; });
    }
    setSelectedVariants(initial);
    const base = customerInfo.type === 'mayorista' && (product.wholesale_price || 0) > 0 ? product.wholesale_price : product.price;
    const adjust = Object.values(initial).reduce((acc, v) => acc + (v.price_adjustment || 0), 0);
    setTempPrice((base || 0) + adjust);
    setTempQty(1);
    setCurrentImageIndex(0);
  };

  const handleFinalize = async () => {
    if (invoiceItems.length === 0) return;
    setIsProcessing(true);
    try {
      const subtotal = calculateSubtotal();
      const body = {
        customer_name: customerInfo.name || 'Cliente',
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.phone || null,
        customer_city: customerInfo.city || null,
        customer_type: customerInfo.type || 'final',
        seller_name: customerInfo.seller || null,
        total_price: subtotal,
        commission_amount: Math.round(subtotal * 0.025),
        commission_rate_snapshot: 0.025,
        payment_method: paymentMethod === 'cash' ? 'cash' : 'transfer',
        source: customerInfo.source === 'Tienda Física' ? 'pos'
               : customerInfo.source === 'WhatsApp'    ? 'whatsapp'
               : customerInfo.source === 'Redes Sociales' ? 'social'
               : customerInfo.source || 'pos',
        items: invoiceItems.map(i => ({
          product_variant_id: i.variant_id,
          quantity: i.quantity,
          price_at_purchase: i.price,
        })),
      };
      console.log('[Facturar] body enviado:', JSON.stringify(body, null, 2));
      const res = await apiRequest<any>('/orders', { method: 'POST', token, body: JSON.stringify(body) });
      if (res) {
        showToast("Venta exitosa 🚀", "success");
        const { generateInvoicePDF } = await import('@/lib/report-generator');
        // Genera y descarga el PDF localmente
        await generateInvoicePDF({ company: companyData, order: res, customer: customerInfo });
        // Si hay email, genera base64 y envía al cliente por correo
        if (customerInfo.email) {
          try {
            const pdfBase64 = await generateInvoicePDF({
              company: companyData, order: res, customer: customerInfo, returnBase64: true,
            }) as string;
            if (pdfBase64) {
              await apiRequest(`/orders/${res.id}/attach-invoice`, {
                method: 'POST', token,
                body: JSON.stringify({ pdf_base64: pdfBase64, customer_email: customerInfo.email }),
              });
            }
          } catch { /* silencioso — el PDF local ya se descargó */ }
        }
        if (customerInfo.phone)
          window.open(`https://wa.me/57${customerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Factura #${String(res.id).slice(-4).toUpperCase()} de ${companyData?.full_name}: $${calculateSubtotal().toLocaleString()}`)}`, '_blank');

        // Auto-crear cliente si tiene nombre real y no existe ya
        if (customerInfo.name && customerInfo.name !== 'Cliente') {
          try {
            // Verificar contra los ya cargados en memoria (evita doble creación)
            const phone = (customerInfo.phone || '').trim();
            const email = (customerInfo.email || '').trim().toLowerCase();
            const alreadyExists = registeredCustomers.some(c =>
              (phone && c.phone === phone) ||
              (email && c.email?.toLowerCase() === email && !c.email?.includes('@bayup.internal'))
            );
            if (!alreadyExists) {
              await apiRequest('/admin/users', {
                method: 'POST', token,
                body: JSON.stringify({
                  full_name: customerInfo.name,
                  email: email || null,
                  phone: phone || null,
                  city: customerInfo.city || null,
                  customer_type: customerInfo.type || 'final',
                  acquisition_channel: customerInfo.source === 'Tienda Física' ? 'pos'
                    : customerInfo.source === 'WhatsApp' ? 'whatsapp'
                    : customerInfo.source === 'Redes Sociales' ? 'social' : 'pos',
                }),
              });
            }
          } catch { /* silencioso — no bloquear la factura */ }
        }

        // Limpiar formulario del cliente para la próxima factura
        setCustomerInfo({ name: '', email: '', phone: '', city: '', source: 'Tienda Física', type: 'final', seller: '' });
        setInvoiceItems([]); setIsPOSActive(false); loadData();
      }
    } catch (err: any) {
      const raw = err?.message || '';
      const stockMatch = raw.match(/Stock insuficiente para (.+?)\. Disponible: (\d+)/i);
      const friendly = stockMatch
        ? `Sin stock para "${stockMatch[1]}". Actualiza el inventario en Productos antes de facturar.`
        : (raw || 'Error al crear la factura');
      showToast(friendly, 'error');
    } finally { setIsProcessing(false); }
  };

  // ── Input base style ──
  const inputCls = "w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/40 focus:bg-white transition-all";

  // ── Mobile KPI values ──
  const mobileKpis = useMemo(() => {
    const billed   = history.filter(isFacturable);
    const today    = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const totalRev  = billed.reduce((a, b) => a + Number(b.total), 0);
    const todayRev  = billed.filter(inv => inv.date?.split('T')[0] === today).reduce((a, b) => a + Number(b.total), 0);
    const yestRev   = billed.filter(inv => inv.date?.split('T')[0] === yesterday).reduce((a, b) => a + Number(b.total), 0);
    const pct       = yestRev > 0 ? ((todayRev - yestRev) / yestRev) * 100 : (todayRev > 0 ? 100 : 0);
    const pending   = history.filter(inv => inv.status === 'pending' || inv.status === 'pendiente');
    const pendingTotal = pending.reduce((a, b) => a + Number(b.total), 0);
    const dateStr   = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    return { totalRev, todayRev, pct, pendingTotal, pendingCount: pending.length, dateStr, recent: billed };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  return (
    <div className="max-w-[1400px] mx-auto pb-20 space-y-6">
      <AnimatePresence mode="wait">

        {/* ══════════════════════ VISTA LISTADO ══════════════════════ */}
        {!isPOSActive && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6">

            {/* ── MOBILE HERO (solo visible en pantallas < sm) ── */}
            <div className="block sm:hidden -mx-3 space-y-3 pt-2">

              {/* Hero card oscuro */}
              <div className="mx-3 rounded-3xl p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(145deg,#001a1a 0%,#003333 50%,#005252 100%)' }}>
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
                  style={{ background: 'radial-gradient(circle,rgba(0,242,255,0.12),transparent 70%)' }}/>
                <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full"
                  style={{ background: 'radial-gradient(circle,rgba(0,178,189,0.08),transparent 70%)' }}/>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-[#00f2ff]/15 flex items-center justify-center">
                      <Wallet size={12} className="text-[#00f2ff]"/>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f2ff]/70">Flujo de caja</p>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${mobileKpis.pct >= 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                    <TrendingUp size={9}/> {mobileKpis.pct >= 0 ? '+' : ''}{mobileKpis.pct.toFixed(1)}%
                  </span>
                </div>

                <div className="mb-1">
                  <p className="text-[11px] font-bold text-white/30">$</p>
                  <p className="text-[42px] font-black text-white leading-none tracking-tight -mt-1">
                    {new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(mobileKpis.totalRev)}
                    <span className="text-[22px] text-white/25">.00</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-pulse"/>
                    <p className="text-[9px] text-white/40">En vivo · {mobileKpis.dateStr}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-[9px] text-white/35 font-bold">
                    <Activity size={9}/> {history.filter(isFacturable).length} ventas
                  </div>
                </div>
              </div>

              {/* Dos mini stats */}
              <div className="grid grid-cols-2 gap-2.5 mx-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="h-7 w-7 rounded-xl bg-[#004d4d]/8 flex items-center justify-center">
                      <FileText size={13} className="text-[#004d4d]"/>
                    </div>
                    <span className="text-[8px] font-black text-[#004d4d] bg-[#004d4d]/8 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Hoy</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Facturado</p>
                  <p className="text-[22px] font-black text-gray-900 leading-none">{fmtCOP(mobileKpis.todayRev)}</p>
                  <p className="text-[9px] text-gray-400 mt-1.5">
                    {history.filter(isFacturable).filter(inv => inv.date?.split('T')[0] === new Date().toISOString().split('T')[0]).length} facturas
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="h-7 w-7 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Receipt size={13} className="text-amber-500"/>
                    </div>
                    {mobileKpis.pendingCount > 0 && (
                      <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{mobileKpis.pendingCount}</span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pendiente</p>
                  <p className="text-[22px] font-black text-gray-900 leading-none">{fmtCOP(mobileKpis.pendingTotal)}</p>
                  <p className="text-[9px] text-gray-400 mt-1.5">por cobrar</p>
                </div>
              </div>

              {/* CTA — Nueva venta */}
              <div className="mx-3">
                <button onClick={() => setIsPOSActive(true)}
                  className="w-full h-[52px] rounded-2xl font-black text-[13px] tracking-[0.12em] uppercase flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg,#004d4d 0%,#007a7a 50%,#00b2bd 100%)', color: '#ffffff' }}>
                  <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Plus size={14} strokeWidth={3}/>
                  </div>
                  Nueva venta
                </button>
              </div>

              {/* Lista de transacciones */}
              <div className="mx-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
                  <div>
                    <p className="text-[13px] font-black text-gray-900">Transacciones</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Historial completo</p>
                  </div>
                  {mobileKpis.recent.length > 0 && (
                    <span className="text-[10px] font-black text-[#004d4d] bg-[#004d4d]/8 px-2.5 py-1 rounded-full">
                      {mobileKpis.recent.length}
                    </span>
                  )}
                </div>

                {mobileKpis.recent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <Receipt size={18} className="text-gray-300"/>
                    </div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin ventas aún</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50/80 max-h-[400px] overflow-y-auto">
                    {mobileKpis.recent.map((inv, i) => {
                      const src = (inv.source || '').toLowerCase();
                      const srcCfg =
                        src === 'whatsapp'                            ? { icon: <MessageSquare size={13} className="text-emerald-600"/>, bg: 'bg-emerald-50' } :
                        src === 'web' || src === 'página web'         ? { icon: <Globe size={13} className="text-sky-500"/>, bg: 'bg-sky-50' } :
                        src === 'social' || src === 'redes sociales'  ? { icon: <Zap size={13} className="text-amber-500"/>, bg: 'bg-amber-50' } :
                                                                        { icon: <ShoppingCart size={13} className="text-[#004d4d]"/>, bg: 'bg-[#004d4d]/8' };
                      const isPaid = !inv.status || inv.status === 'completed' || inv.status === 'completado';
                      const dateLabel = (() => {
                        const d = new Date(inv.date);
                        const now = new Date();
                        const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
                        if (diffH < 24) return `Hoy · ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
                        if (diffH < 48) return `Ayer · ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
                        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
                      })();
                      return (
                        <div key={inv.id || i} className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors">
                          <div className={`h-9 w-9 rounded-xl ${srcCfg.bg} flex items-center justify-center shrink-0`}>
                            {srcCfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-gray-800 truncate">
                              {inv.customer || (inv.invoice_num ? `Factura ${inv.invoice_num}` : `Venta #${String(inv.id).slice(-5).toUpperCase()}`)}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{dateLabel}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[13px] font-black text-gray-900">{fmtCOP(Number(inv.total))}</p>
                            <span className={`text-[8px] font-black uppercase tracking-wide ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {isPaid ? '✓ Pagado' : '⏳ Pendiente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="h-4"/>
            </div>
            {/* ── FIN MOBILE HERO ── */}

            {/* Header (solo desktop) */}
            <div className="hidden sm:flex items-end justify-between">
              <div>
                <p className="flex items-center gap-2 text-[9px] font-black tracking-[0.22em] uppercase text-gray-400 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>
                  Terminal de facturación
                </p>
                <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d] leading-none">
                  FACTURACIÓN
                </h1>
                <p className="text-gray-400 text-sm mt-1.5">Control de ventas y punto de venta digital</p>
              </div>
              <button onClick={() => setIsPOSActive(true)}
                className="h-10 px-5 bg-[#004d4d] hover:bg-[#003838] text-white rounded-xl font-black text-[9px] tracking-widest uppercase transition-all flex items-center gap-2 shadow-sm">
                <Plus size={14} className="text-[#00f2ff]"/> Nueva venta
              </button>
            </div>

            {/* KPIs (solo desktop) */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
              {invoicingKpis.map((k, i) => <KpiCard key={i} {...k}/>)}
            </div>

            {/* Tabla — solo desktop */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Toolbar */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <div className="flex-1 flex items-center gap-2 h-9 bg-gray-50 rounded-xl border border-gray-100 px-3">
                  <Search size={13} className="text-gray-300 shrink-0"/>
                  <input value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Buscar por ID o cliente…"
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"/>
                  {historySearch && <button onClick={() => setHistorySearch('')} className="text-gray-300 hover:text-gray-500"><X size={12}/></button>}
                </div>

                <button onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`h-9 flex items-center gap-1.5 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wide transition-all ${isFilterOpen ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'bg-white border-gray-200 text-gray-400 hover:border-[#004d4d]/30'}`}>
                  {isFilterOpen ? <FilterX size={12}/> : <Filter size={12}/>} Filtros
                </button>

                <div className="relative" ref={exportMenuRef}>
                  <button onClick={() => setShowExportMenu(v => !v)}
                    className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-[#004d4d] hover:bg-[#003838] text-white text-[9px] font-black uppercase tracking-wide transition-all">
                    <Download size={12}/> Exportar <ChevronDown size={10} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
                  </button>
                  <AnimatePresence>
                    {showExportMenu && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
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

                <button onClick={loadData}
                  className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#004d4d] transition-all">
                  <RefreshCw size={13}/>
                </button>
              </div>

              {/* Panel filtros */}
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-gray-100">
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Desde</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                          className={inputCls}/>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hasta</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                          className={inputCls}/>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Canal</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Todos', 'pos', 'WhatsApp', 'Página Web'].map(s => (
                            <button key={s} onClick={() => setExtraFilters(p => ({ ...p, source: s }))}
                              className={`h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all ${extraFilters.source === s ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                              {s === 'pos' ? 'Tienda' : s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pago</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Todos', 'Efectivo', 'Transferencia'].map(s => (
                            <button key={s} onClick={() => setExtraFilters(p => ({ ...p, payment: s }))}
                              className={`h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all ${extraFilters.payment === s ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                              {s}
                            </button>
                          ))}
                          <button onClick={() => { setDateRange({ start:'', end:'' }); setExtraFilters({ source:'Todos', payment:'Todos' }); }}
                            className="h-8 px-3 rounded-xl text-[9px] font-black text-rose-400 hover:text-rose-500 uppercase tracking-wide transition-all">
                            Limpiar
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabla contenido */}
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <Receipt size={22} className="text-gray-300"/>
                  </div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin facturas registradas</p>
                  <button onClick={() => setIsPOSActive(true)}
                    className="mt-2 h-9 px-5 bg-[#004d4d] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#003838] transition-all flex items-center gap-2">
                    <Plus size={12}/> Crear primera venta
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {/* Header fila */}
                  <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5">
                    {['Factura', 'Cliente', 'Fecha', 'Canal', 'Pago', 'Total', ''].map((h, i) => (
                      <p key={i} className="text-[8px] font-black uppercase tracking-widest text-gray-400">{h}</p>
                    ))}
                  </div>

                  {filteredHistory.map(inv => (
                    <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => handleViewDetail(inv)}
                      className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/70 cursor-pointer transition-all group">

                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-[#004d4d]/8 flex items-center justify-center shrink-0">
                          <Receipt size={13} className="text-[#004d4d]"/>
                        </div>
                        <p className="text-[11px] font-black text-gray-900">{inv.invoice_num}</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-gray-800 truncate">{inv.customer}</p>
                        <p className="text-[9px] text-gray-400">{inv.customer_phone || '—'}</p>
                      </div>

                      <p className="text-[10px] font-medium text-gray-500">
                        {new Date(inv.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>

                      <SourceBadge source={inv.source}/>
                      <PaymentBadge method={inv.payment_method}/>

                      <p className="text-sm font-black text-[#004d4d]">{fmtCOP(inv.total)}</p>

                      <button className="h-8 w-8 rounded-xl bg-white border border-gray-100 text-gray-300 hover:text-[#004d4d] hover:border-[#004d4d]/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                        <Eye size={13}/>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Footer */}
              {filteredHistory.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-[9px] font-bold text-gray-400">
                    <span className="font-black text-gray-600">{filteredHistory.length}</span> facturas
                  </p>
                  <p className="text-[9px] font-bold text-gray-400">
                    Total: <span className="font-black text-[#004d4d]">
                      {fmtCOP(filteredHistory.reduce((a, b) => a + b.total, 0))}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════ VISTA POS ══════════════════════ */}
        {isPOSActive && (
          <motion.div key="pos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex flex-col lg:flex-row bg-[#f8f9fa]" style={{ overflow: 'hidden' }}>

            {/* ── Tab bar móvil ── */}
            <div className="lg:hidden shrink-0 bg-white border-b border-gray-100 flex items-center px-4 gap-2 h-12">
              <button onClick={() => setIsPOSActive(false)}
                className="h-7 w-7 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 shrink-0">
                <ArrowLeft size={13}/>
              </button>
              <div className="flex-1 flex p-0.5 bg-gray-100 rounded-xl gap-0.5">
                {(['form','preview'] as const).map(tab => (
                  <button key={tab} onClick={() => setPosMobileTab(tab)}
                    className={`flex-1 py-1.5 rounded-[10px] text-[9px] font-black uppercase tracking-wide transition-all ${posMobileTab === tab ? 'bg-[#004d4d] text-white shadow-sm' : 'text-gray-400'}`}>
                    {tab === 'form' ? '📋 Formulario' : '📄 Vista previa'}
                  </button>
                ))}
              </div>
              <span className="text-[9px] font-black text-[#004d4d] bg-[#004d4d]/8 px-2 py-1 rounded-lg shrink-0">
                {invoiceItems.length} items
              </span>
            </div>

            {/* ── Columna izquierda: cliente + productos ── */}
            <div className={`lg:w-1/2 flex-col border-r border-gray-100 bg-white ${posMobileTab === 'form' ? 'flex' : 'hidden lg:flex'}`} style={{ minHeight: 0 }}>

              {/* Header POS (solo desktop) */}
              <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <button onClick={() => setIsPOSActive(false)}
                  className="flex items-center gap-2 text-[9px] font-black text-gray-400 hover:text-rose-500 uppercase tracking-widest transition-all">
                  <ArrowLeft size={14}/> Cancelar
                </button>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nueva venta — POS</p>
                <div className="w-20"/>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ minHeight: 0 }}>

                {/* Sección cliente */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d]"/>
                      Cliente
                    </p>
                    {/* Toggle buscar/crear */}
                    <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                      {(['create', 'search'] as const).map(m => (
                        <button key={m} onClick={() => setPosCustomerMode(m)}
                          className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wide transition-all ${posCustomerMode === m ? 'bg-white text-[#004d4d] shadow-sm' : 'text-gray-400'}`}>
                          {m === 'create' ? 'Nuevo' : 'Buscar'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modo crear */}
                  {posCustomerMode === 'create' && (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      {[
                        { label: 'Nombre',    key: 'name',  placeholder: 'Nombre completo',    type: 'text' },
                        { label: 'WhatsApp',  key: 'phone', placeholder: '300…',               type: 'text' },
                        { label: 'Correo',    key: 'email', placeholder: 'email@ejemplo.com',  type: 'email' },
                        { label: 'Ciudad',    key: 'city',  placeholder: 'Ciudad',             type: 'text' },
                      ].map(f => (
                        <div key={f.key} className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{f.label}</label>
                          <input
                            value={(customerInfo as any)[f.key]}
                            onChange={e => setCustomerInfo(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder} type={f.type}
                            className={inputCls}/>
                        </div>
                      ))}

                      {/* Canal */}
                      <div className="space-y-1 relative">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Canal</label>
                        <button onClick={() => { setIsSourceDropdownOpen(!isSourceDropdownOpen); setIsVendedorDropdownOpen(false); }}
                          className={`${inputCls} flex items-center justify-between text-left`}>
                          <span className="text-[#004d4d]">{customerInfo.source}</span>
                          <ChevronDown size={13} className="text-gray-400 shrink-0"/>
                        </button>
                        {isSourceDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-1.5 space-y-0.5">
                            {['Tienda Física','WhatsApp','Redes Sociales'].map(opt => (
                              <button key={opt} onClick={() => { setCustomerInfo(p => ({ ...p, source: opt })); setIsSourceDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold hover:bg-gray-50 text-gray-700">
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Vendedor */}
                      <div className="space-y-1 relative">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Vendedor</label>
                        <button onClick={() => { setIsVendedorDropdownOpen(!isVendedorDropdownOpen); setIsSourceDropdownOpen(false); }}
                          className={`${inputCls} flex items-center justify-between text-left`}>
                          <span className={selectedVendedor ? 'text-[#004d4d]' : 'text-gray-300 font-normal'}>
                            {selectedVendedor || 'Seleccionar…'}
                          </span>
                          <ChevronDown size={13} className="text-gray-400 shrink-0"/>
                        </button>
                        {isVendedorDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-1.5 space-y-0.5">
                            {vendedores.map(v => (
                              <div key={v} className={`flex items-center gap-1 rounded-lg ${selectedVendedor === v ? 'bg-[#004d4d]/5' : 'hover:bg-gray-50'}`}>
                                <button onClick={() => { setSelectedVendedor(v); localStorage.setItem('bayup_last_vendedor', v); setIsVendedorDropdownOpen(false); }}
                                  className={`flex-1 text-left px-3 py-2 text-[11px] font-semibold ${selectedVendedor === v ? 'text-[#004d4d]' : 'text-gray-700'}`}>
                                  {v}
                                </button>
                                <button onClick={() => {
                                  const u = vendedores.filter(x => x !== v);
                                  setVendedores(u);
                                  localStorage.setItem('bayup_vendedores', JSON.stringify(u));
                                  if (selectedVendedor === v) { setSelectedVendedor(''); localStorage.removeItem('bayup_last_vendedor'); }
                                }} className="h-6 w-6 flex items-center justify-center rounded-md text-gray-300 hover:text-rose-400 hover:bg-rose-50 mr-1 transition-all shrink-0">
                                  <X size={11}/>
                                </button>
                              </div>
                            ))}
                            {showNewVendedor ? (
                              <div className="flex gap-1.5 p-1.5">
                                <input autoFocus value={newVendedorName} onChange={e => setNewVendedorName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && newVendedorName.trim()) {
                                      const u = [...vendedores, newVendedorName.trim()];
                                      setVendedores(u); localStorage.setItem('bayup_vendedores', JSON.stringify(u));
                                      setSelectedVendedor(newVendedorName.trim()); localStorage.setItem('bayup_last_vendedor', newVendedorName.trim()); setNewVendedorName('');
                                      setShowNewVendedor(false); setIsVendedorDropdownOpen(false);
                                    }
                                  }}
                                  placeholder="Nombre…" className="flex-1 h-8 px-3 bg-gray-50 rounded-lg text-xs outline-none font-medium"/>
                                <button onClick={() => {
                                  if (!newVendedorName.trim()) return;
                                  const u = [...vendedores, newVendedorName.trim()];
                                  setVendedores(u); localStorage.setItem('bayup_vendedores', JSON.stringify(u));
                                  setSelectedVendedor(newVendedorName.trim()); localStorage.setItem('bayup_last_vendedor', newVendedorName.trim()); setNewVendedorName('');
                                  setShowNewVendedor(false); setIsVendedorDropdownOpen(false);
                                }} className="h-8 px-3 bg-[#004d4d] text-white rounded-lg text-[9px] font-bold">
                                  OK
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setShowNewVendedor(true)}
                                className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-bold text-[#004d4d] hover:bg-[#004d4d]/5 flex items-center gap-1.5">
                                <Plus size={10}/> Añadir vendedor
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tarifa + Pago */}
                      <div className="col-span-2 grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tarifa</label>
                          <div className="flex p-0.5 bg-gray-100 rounded-xl h-9 gap-0.5">
                            {([['final','Final'],['mayorista','Mayorista']] as const).map(([val, lbl]) => (
                              <button key={val} onClick={() => setCustomerInfo(p => ({ ...p, type: val }))}
                                className={`flex-1 rounded-[10px] text-[9px] font-black transition-all ${customerInfo.type === val ? 'bg-[#004d4d] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pago</label>
                          <div className="flex p-0.5 bg-gray-100 rounded-xl h-9 gap-0.5">
                            {([['cash','Efectivo'],['transfer','Transferencia']] as const).map(([val, lbl]) => (
                              <button key={val} onClick={() => setPaymentMethod(val as 'cash' | 'transfer')}
                                className={`flex-1 rounded-[10px] text-[9px] font-black transition-all ${paymentMethod === val ? 'bg-[#004d4d] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modo buscar cliente */}
                  {posCustomerMode === 'search' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 h-10 bg-gray-50 rounded-xl border border-gray-100 px-3">
                        <Search size={13} className="text-gray-300 shrink-0"/>
                        <input autoFocus value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                          placeholder="Nombre, teléfono o correo…"
                          className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-700 placeholder:text-gray-300"/>
                        {customerSearch && <button onClick={() => setCustomerSearch('')} className="text-gray-300 hover:text-gray-500"><X size={12}/></button>}
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(() => {
                          const q = customerSearch.toLowerCase();
                          // Merge: registered customers first, then history-only entries
                          const merged = new Map<string, { name: string; email: string; phone: string; city: string; source: string; type: string }>();
                          registeredCustomers
                            .filter(c => c.full_name && !c.email?.includes('@bayup.internal'))
                            .forEach(c => {
                              const key = c.phone || c.email || c.full_name;
                              merged.set(key, {
                                name: c.full_name, email: c.email || '', phone: c.phone || '',
                                city: c.customer_city || c.city || '', source: 'Base de clientes', type: c.customer_type || 'final',
                              });
                            });
                          history.forEach(inv => {
                            if (inv.customer && !merged.has(inv.customer_email || inv.customer)) {
                              merged.set(inv.customer_email || inv.customer, {
                                name: inv.customer, email: inv.customer_email || '', phone: inv.customer_phone || '',
                                city: inv.customer_city || '', source: inv.source || 'Tienda Física', type: 'final',
                              });
                            }
                          });
                          const res = Array.from(merged.values()).filter(c =>
                            !q || c.name?.toLowerCase().includes(q) ||
                            c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
                          );
                          if (res.length === 0) return (
                            <div className="py-8 text-center text-[10px] font-medium text-gray-300">
                              {customerSearch ? 'Sin resultados' : 'Escribe para buscar…'}
                            </div>
                          );
                          return res.map(c => (
                            <button key={c.email || c.name}
                              onClick={() => {
                                setCustomerInfo(prev => ({ ...prev, name: c.name, email: c.email, phone: c.phone, city: c.city, type: c.type || prev.type }));
                                setPosCustomerMode('create'); setCustomerSearch('');
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-[#004d4d]/20 transition-all text-left">
                              <div className="h-8 w-8 rounded-lg bg-[#004d4d]/8 flex items-center justify-center shrink-0">
                                <span className="text-[#004d4d] font-bold text-sm">{(c.name || '?').charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-gray-800 truncate">{c.name}</p>
                                <p className="text-[9px] text-gray-400">{c.phone || c.email || '—'}</p>
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección productos */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d]"/>
                    Productos
                  </p>
                  <div className="flex items-center gap-2 h-9 bg-gray-50 rounded-xl border border-gray-100 px-3">
                    <Search size={13} className="text-gray-300 shrink-0"/>
                    <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      placeholder="Buscar producto…"
                      className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-700 placeholder:text-gray-300"/>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-wide transition-all ${selectedCategory === cat ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredProducts.map(p => {
                      const isWholesale = customerInfo.type === 'mayorista' && (p.wholesale_price || 0) > 0;
                      const price       = isWholesale ? p.wholesale_price : p.price;
                      const img         = Array.isArray(p.image_url) && p.image_url.length > 0 ? p.image_url[0] : (typeof p.image_url === 'string' ? p.image_url : null);
                      return (
                        <button key={p.id} onClick={() => handleProductClick(p)}
                          className="bg-white p-3 rounded-xl border border-gray-100 hover:border-[#004d4d]/25 hover:shadow-md transition-all text-left relative group">
                          <div onClick={e => { e.stopPropagation(); addToCart(p); }}
                            className="absolute top-2 right-2 z-20 h-7 w-7 bg-[#004d4d] text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110">
                            <Plus size={13} strokeWidth={3}/>
                          </div>
                          <div className="aspect-square bg-gray-50 rounded-lg mb-2.5 overflow-hidden">
                            {img
                              ? <img src={img} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                              : <div className="h-full flex items-center justify-center text-gray-200"><Package size={20}/></div>}
                          </div>
                          <p className="text-[10px] font-black text-gray-900 truncate leading-tight">{p.name}</p>
                          <p className={`text-[11px] font-black mt-0.5 ${isWholesale ? 'text-emerald-500' : 'text-[#004d4d]'}`}>
                            {fmtCOP(price || 0)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Columna derecha: preview documento factura ── */}
            <div className={`lg:w-1/2 flex-col bg-[#e8e8e8] border-l border-gray-300 overflow-y-auto ${posMobileTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
              <div className="p-5 flex flex-col flex-1">

                {/* Documento */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col flex-1">

                  {/* Cabecera empresa + número de factura */}
                  <div className="flex items-start justify-between p-6 gap-4">
                    <div className="space-y-0.5 flex-1">
                      {companyData?.logo_url
                        ? <img src={companyData.logo_url} className="h-10 w-auto object-contain mb-3"/>
                        : <p className="text-2xl font-black text-[#001a1a] tracking-tight mb-3">{companyData?.full_name || 'Mi Empresa'}</p>}
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Empresa Registrada</p>
                      <p className="text-[10px] text-gray-500 mt-1">NIT: {companyData?.nit || '900.000.000-1'}</p>
                      <p className="text-[10px] text-gray-500">{companyData?.address || 'Dirección de operación principal'}</p>
                      <p className="text-[10px] text-gray-500">Email: {companyData?.email || authEmail || '—'}</p>
                      <p className="text-[10px] text-gray-500">WhatsApp: {companyData?.phone || 'Sin contacto'}</p>
                    </div>
                    <div className="border-2 border-[#001a1a] rounded-xl p-3 shrink-0 min-w-[155px]">
                      <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest text-center mb-1">Factura de Venta</p>
                      <p className="text-[22px] font-black text-[#001a1a] text-center">#{String(history.length + 1).padStart(4, '0')}</p>
                      <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                        {[
                          ['Fecha:', new Date().toLocaleDateString('es-CO')],
                          ['Medio:', paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'],
                          ['Vendedor:', selectedVendedor || '—'],
                        ].map(([k,v]) => (
                          <div key={k} className="flex justify-between gap-2">
                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{k}</span>
                            <span className="text-[8px] font-bold text-gray-700 truncate max-w-[90px] text-right">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200 mx-6"/>

                  {/* Adquiriente + QR */}
                  <div className="flex items-start justify-between p-6 gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-2">Adquiriente</p>
                      <p className="text-[17px] font-black text-[#001a1a] uppercase leading-tight">{customerInfo.name || 'Cliente Mostrador'}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 pt-1">
                        <Smartphone size={9}/> {customerInfo.phone || 'Sin número'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Mail size={9}/> {customerInfo.email || 'Sin correo'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <MapPin size={9}/> {customerInfo.city || 'Ciudad'}
                      </div>
                    </div>
                    {/* QR decorativo */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div className="h-[68px] w-[68px] rounded-lg bg-gray-50 border border-gray-200 p-1.5 flex items-center justify-center">
                        <div className="grid grid-cols-5 gap-[2px] w-full h-full">
                          {Array.from({length:25}).map((_,i)=>(
                            <div key={i} className={`rounded-[1px] ${[0,1,2,5,7,9,10,12,14,15,17,22,23,24,6,8,16,18,20].includes(i)?'bg-gray-800':'bg-transparent'}`}/>
                          ))}
                        </div>
                      </div>
                      <p className="text-[6px] font-black text-gray-300 uppercase tracking-wider text-center leading-tight">Validación<br/>Bayup Core</p>
                    </div>
                  </div>

                  {/* Tabla productos */}
                  <div className="mx-6 rounded-xl overflow-hidden border border-gray-200">
                    <div className="grid grid-cols-[1fr_44px_78px_78px] bg-[#001a1a] px-3 py-2">
                      {['Descripción del activo / SKU','Cant.','V. Unitario','Subtotal'].map((h,i)=>(
                        <p key={i} className="text-[7px] font-black uppercase tracking-widest text-white">{h}</p>
                      ))}
                    </div>
                    {invoiceItems.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Esperando ingreso de activos…</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {invoiceItems.map((item, i) => (
                          <div key={i} className="grid grid-cols-[1fr_44px_78px_78px] items-center px-3 py-2.5 group hover:bg-gray-50 transition-all">
                            <div>
                              <p className="text-[9px] font-black text-gray-900 leading-tight">{item.name}</p>
                              <p className="text-[7px] text-gray-400">SKU: {item.sku}</p>
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <button
                                disabled={item.quantity >= item.maxStock}
                                onClick={() => { const n=[...invoiceItems]; n[i].quantity++; setInvoiceItems([...n]); }}
                                className="h-4 w-6 rounded text-gray-400 hover:text-emerald-500 flex items-center justify-center text-xs font-bold border border-gray-100 bg-white disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                              <span className="text-[9px] font-black text-gray-900">{item.quantity}</span>
                              <button onClick={() => { const n=[...invoiceItems]; if(n[i].quantity>1)n[i].quantity--; else { setInvoiceItems(invoiceItems.filter((_,idx)=>idx!==i)); return; } setInvoiceItems([...n]); }}
                                className="h-4 w-6 rounded text-gray-400 hover:text-rose-400 flex items-center justify-center text-xs font-bold border border-gray-100 bg-white">-</button>
                            </div>
                            <p className="text-[9px] font-semibold text-gray-600">{fmtCOP(item.price)}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] font-black text-[#001a1a]">{fmtCOP(item.price * item.quantity)}</p>
                              <button onClick={() => setInvoiceItems(invoiceItems.filter((_,idx)=>idx!==i))}
                                className="h-5 w-5 flex items-center justify-center rounded text-gray-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={10}/>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Totales + observaciones legales */}
                  <div className="flex items-start gap-5 p-6">
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100 self-stretch">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-2">Observaciones Legales</p>
                      <p className="text-[7px] text-gray-400 italic leading-relaxed uppercase">
                        Representación gráfica de factura electrónica. Los activos aquí descritos han sido verificados bajo los protocolos de inventario de Bayup. Garantía sujeta a términos del emisor.
                      </p>
                    </div>
                    <div className="shrink-0 w-44 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase">Subtotal bruto</span>
                        <span className="text-[9px] font-black text-gray-800">{fmtCOP(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase">Impuesto IVA (0%)</span>
                        <span className="text-[9px] font-black text-gray-800">$0</span>
                      </div>
                      <div className="bg-[#001a1a] rounded-xl px-3 py-2.5 flex items-center justify-between mt-1">
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Total Neto</span>
                        <span className="text-base font-black text-white">{fmtCOP(calculateSubtotal())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sello */}
                  <div className="px-6 pb-5 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={11} className="text-[#004d4d]"/>
                      <p className="text-[7px] font-black text-[#004d4d] uppercase tracking-widest">Documento Protegido por Bayup Core V4.2</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón "Ver vista previa" — solo móvil */}
              {invoiceItems.length > 0 && (
                <div className="lg:hidden p-3 bg-[#e8e8e8] border-t border-gray-300">
                  <button onClick={() => setPosMobileTab('preview')}
                    className="w-full h-10 bg-[#004d4d] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    Ver vista previa ({invoiceItems.length} items) →
                  </button>
                </div>
              )}

              {/* CTAs — sticky al fondo del scroll */}
              <div className="sticky bottom-0 p-4 bg-[#e8e8e8] border-t border-gray-300 flex gap-3 mt-2">
                <button
                  onClick={() => {
                    if (invoiceItems.length === 0) return;
                    import('@/lib/report-generator').then(m => m.generateInvoicePDF({
                      company: companyData,
                      order: { id: 'preview', items: invoiceItems, total_price: calculateSubtotal() },
                      customer: customerInfo
                    }));
                  }}
                  disabled={invoiceItems.length === 0}
                  className="flex-1 h-12 bg-white border border-gray-300 rounded-2xl text-gray-600 font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-gray-500 transition-all disabled:opacity-30 shadow-sm">
                  <Download size={13}/> Descargar Comprobante
                </button>
                <button onClick={handleFinalize}
                  disabled={isProcessing || invoiceItems.length === 0}
                  className="flex-1 h-12 bg-[#001a1a] hover:bg-black text-white rounded-2xl font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-40">
                  {isProcessing
                    ? <Loader2 size={14} className="animate-spin"/>
                    : <><CheckCircle2 size={14}/> Confirmar y Facturar</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ DRAWER — Detalle de factura ══ */}
      <AnimatePresence>
        {selectedInvoice && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 backdrop-blur-sm" style={{ zIndex: 9998 }}
              onClick={() => { setSelectedInvoice(null); setFullSelectedOrder(null); }}/>
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
              style={{ zIndex: 9999 }}>

              {/* Header */}
              <div className="bg-[#001a1a] px-6 pt-6 pb-5 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-black text-[#00f2ff]/40 uppercase tracking-widest mb-1">
                      Comprobante de venta
                    </p>
                    <h2 className="text-xl font-black text-white">{selectedInvoice.invoice_num}</h2>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {new Date(selectedInvoice.date).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <button onClick={() => { setSelectedInvoice(null); setFullSelectedOrder(null); }}
                    className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-all">
                    <X size={14}/>
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">

                {/* Empresa + cliente */}
                <div className="p-5 grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Vendedor</p>
                    {companyData?.logo_url
                      ? <img src={companyData.logo_url} className="h-8 w-auto object-contain"/>
                      : <p className="text-[11px] font-black text-gray-900">{companyData?.full_name || 'Empresa'}</p>}
                    <p className="text-[9px] text-gray-400">NIT: {companyData?.nit || '—'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                    <p className="text-[11px] font-black text-gray-900">{selectedInvoice.customer}</p>
                    {selectedInvoice.customer_phone && <p className="text-[9px] text-gray-400">{selectedInvoice.customer_phone}</p>}
                    {selectedInvoice.customer_email && <p className="text-[9px] text-gray-400 truncate">{selectedInvoice.customer_email}</p>}
                    {selectedInvoice.customer_city  && <p className="text-[9px] text-gray-400">{selectedInvoice.customer_city}</p>}
                  </div>
                </div>

                {/* Badges */}
                <div className="px-5 py-3 flex items-center gap-2 flex-wrap">
                  <SourceBadge source={selectedInvoice.source}/>
                  <PaymentBadge method={selectedInvoice.payment_method}/>
                </div>

                {/* Productos */}
                <div className="p-5 space-y-3">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Productos
                  </p>
                  {!fullSelectedOrder ? (
                    <div className="flex items-center gap-2 py-4 text-gray-300">
                      <Loader2 size={14} className="animate-spin"/> <span className="text-[10px] font-medium">Cargando…</span>
                    </div>
                  ) : fullSelectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="h-9 w-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-[#004d4d]"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-gray-900 truncate">{item.product_variant?.product?.name || 'Producto'}</p>
                        <p className="text-[8px] text-gray-400">SKU: {item.product_variant?.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-[#004d4d]">x{item.quantity}</p>
                        <p className="text-[9px] text-gray-400">{fmtCOP((item.price_at_purchase || 0) * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="p-5">
                  <div className="bg-[#001a1a] rounded-2xl p-4 flex items-center justify-between">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Total neto</p>
                    <p className="text-2xl font-black text-white">{fmtCOP(selectedInvoice.total)}</p>
                  </div>
                </div>
              </div>

              {/* Footer CTAs */}
              <div className="p-5 border-t border-gray-100 space-y-2 shrink-0 bg-gray-50/50">
                <button
                  onClick={() => { if (fullSelectedOrder) import('@/lib/report-generator').then(m => m.generateInvoicePDF({ company: companyData, order: fullSelectedOrder, customer: { name: selectedInvoice.customer, email: selectedInvoice.customer_email, phone: selectedInvoice.customer_phone, city: selectedInvoice.customer_city } })); }}
                  className="w-full h-11 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <Download size={13}/> Descargar PDF
                </button>
                {selectedInvoice.customer_phone && (
                  <button onClick={() => window.open(`https://wa.me/57${selectedInvoice.customer_phone?.replace(/\D/g, '')}`, '_blank')}
                    className="w-full h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <MessageSquare size={12}/> Contactar por WhatsApp
                  </button>
                )}
                <button onClick={() => { setSelectedInvoice(null); setFullSelectedOrder(null); }}
                  className="w-full h-9 rounded-2xl border border-gray-200 bg-white text-gray-400 font-black text-[9px] uppercase tracking-widest hover:text-gray-600 transition-all">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MODAL — Selección de variante (portal) ══ */}
      {mounted && createPortal(
      <AnimatePresence>
        {selectedProductForVariant && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm" style={{ zIndex: 9998 }}
              onClick={() => setSelectedProductForVariant(null)}/>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16,1,0.3,1] }}
              className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
              style={{ zIndex: 9999 }}>
              <div className="w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col max-h-[94vh] pointer-events-auto" style={{ borderRadius: '28px' }}>

                {/* Zona imagen con gradiente inferior y controles superpuestos */}
                {(() => {
                  const imgSrc = Array.isArray(selectedProductForVariant.image_url) && selectedProductForVariant.image_url.length > 0
                    ? selectedProductForVariant.image_url[currentImageIndex]
                    : (typeof selectedProductForVariant.image_url === 'string' && selectedProductForVariant.image_url ? selectedProductForVariant.image_url : null);
                  return (
                    <div className="relative shrink-0 overflow-hidden" style={{ height: '280px', borderRadius: '28px 28px 0 0', background: imgSrc ? '#f3f4f6' : 'linear-gradient(135deg,#e8faf9,#f0fdf4)' }}>
                      {imgSrc ? (
                        <img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={selectedProductForVariant.name}/>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-[#004d4d]/10 flex items-center justify-center">
                            <Package size={32} className="text-[#004d4d]/40"/>
                          </div>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Sin imagen</span>
                        </div>
                      )}
                      {/* Gradiente inferior sobre imagen */}
                      {imgSrc && (
                        <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}/>
                      )}
                      {/* Botón cerrar */}
                      <button onClick={() => setSelectedProductForVariant(null)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>
                        <X size={15} className="text-gray-600"/>
                      </button>
                      {/* Badge categoría */}
                      {selectedProductForVariant.category && (
                        <span className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', color: '#004d4d' }}>
                          {selectedProductForVariant.category}
                        </span>
                      )}
                      {/* Nombre encima del gradiente */}
                      {imgSrc && (
                        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                          <h3 className="text-white font-black text-lg leading-tight drop-shadow-sm">{selectedProductForVariant.name}</h3>
                          {selectedProductForVariant.description && (
                            <p className="text-white/70 text-[11px] mt-0.5 line-clamp-1">{selectedProductForVariant.description}</p>
                          )}
                        </div>
                      )}
                      {/* Puntitos para múltiples imágenes */}
                      {Array.isArray(selectedProductForVariant.image_url) && selectedProductForVariant.image_url.length > 1 && (
                        <div className="absolute bottom-3 right-4 flex gap-1">
                          {selectedProductForVariant.image_url.map((_: string, i: number) => (
                            <button key={i} onClick={() => setCurrentImageIndex(i)}
                              className={`h-1.5 rounded-full transition-all ${currentImageIndex === i ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Detalles */}
                <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: '20px 20px 8px' }}>

                  {/* Nombre si no hay imagen */}
                  {!(Array.isArray(selectedProductForVariant.image_url) ? selectedProductForVariant.image_url.length > 0 : !!selectedProductForVariant.image_url) && (
                    <div className="mb-4">
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{selectedProductForVariant.name}</h3>
                      {selectedProductForVariant.description && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{selectedProductForVariant.description}</p>
                      )}
                    </div>
                  )}

                  {/* Variantes agrupadas por atributo */}
                  {selectedProductForVariant.variants && selectedProductForVariant.variants.length > 0 ? (() => {
                    // Parsear atributo y valor: "Talla / L" → attr="Talla", val="L"
                    // Si no hay "/", usar v.name como attr y v.sku como val
                    const parseVariant = (v: any): { attr: string; val: string } => {
                      if (v.name && v.name.includes('/')) {
                        const parts = v.name.split('/').map((s: string) => s.trim());
                        return { attr: parts[0], val: parts.slice(1).join(' / ') };
                      }
                      return { attr: v.name || 'Variante', val: v.sku || v.name || '—' };
                    };
                    // Agrupar y deduplicar por id o name+sku
                    const seenVariants = new Set<string>();
                    const groups: Record<string, Array<{ v: any; val: string }>> = {};
                    selectedProductForVariant.variants.forEach((v: any) => {
                      const dedupeKey = v.id || `${v.name}__${v.sku}`;
                      if (seenVariants.has(dedupeKey)) return;
                      seenVariants.add(dedupeKey);
                      const { attr, val } = parseVariant(v);
                      if (!groups[attr]) groups[attr] = [];
                      // Deduplicar también por val dentro del grupo
                      if (!groups[attr].some(existing => existing.val === val)) {
                        groups[attr].push({ v, val });
                      }
                    });
                    const attrs = Object.keys(groups);
                    return (
                      <div className="mb-4 flex flex-col gap-3">
                        {attrs.map(attr => {
                          const options = groups[attr];
                          // La selección se guarda con la key = attr original del nombre completo
                          // Buscar si alguna opción de este grupo está seleccionada
                          const selectedEntry = options.find(({ v }) => {
                            const sv = selectedVariants[v.name] || selectedVariants[attr];
                            return sv && (sv.id ? sv.id === v.id : sv.sku === v.sku && sv.name === v.name);
                          });
                          return (
                            <div key={attr}>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-[9px] font-black text-[#004d4d] uppercase tracking-widest">{attr}</label>
                                {selectedEntry && (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${(selectedEntry.v.stock ?? 0) <= 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {(selectedEntry.v.stock ?? 0) <= 0 ? 'Agotado' : `${selectedEntry.v.stock} en stock`}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {options.map(({ v, val }) => {
                                  const outOfStock = (v.stock ?? 0) <= 0;
                                  const isSelected = selectedEntry?.v === v ||
                                    (selectedEntry?.v.id ? selectedEntry.v.id === v.id : selectedEntry?.v.sku === v.sku && selectedEntry?.v.name === v.name);
                                  return (
                                    <button key={v.id || v.sku || val}
                                      disabled={outOfStock}
                                      onClick={() => {
                                        // Guardar con la key del nombre completo original (v.name) para compatibilidad con addToCart
                                        const updated = { ...selectedVariants };
                                        // Eliminar selecciones previas del mismo attr
                                        options.forEach(({ v: ov }) => { delete updated[ov.name]; });
                                        updated[v.name] = v;
                                        setSelectedVariants(updated);
                                        const base = customerInfo.type === 'mayorista' && (selectedProductForVariant.wholesale_price || 0) > 0
                                          ? selectedProductForVariant.wholesale_price : selectedProductForVariant.price;
                                        const totalAdj = Object.values(updated).reduce((acc: number, sv: any) => acc + (sv.price_adjustment || 0), 0);
                                        setTempPrice((base || 0) + totalAdj);
                                      }}
                                      className="transition-all"
                                      style={{
                                        padding: '7px 16px',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        border: `2px solid ${isSelected ? '#004d4d' : outOfStock ? '#e5e7eb' : '#d1d5db'}`,
                                        background: isSelected ? '#004d4d' : outOfStock ? '#f9fafb' : '#ffffff',
                                        color: isSelected ? '#ffffff' : outOfStock ? '#9ca3af' : '#374151',
                                        opacity: outOfStock ? 0.5 : 1,
                                        cursor: outOfStock ? 'not-allowed' : 'pointer',
                                        textDecoration: outOfStock ? 'line-through' : 'none',
                                      }}>
                                      {val}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })() : (
                    <div className="mb-4 p-4 rounded-2xl border border-dashed border-gray-200 space-y-3" style={{ background: '#f9fafb' }}>
                      <p className="text-[10px] font-black text-[#004d4d] uppercase">Sin variantes — crea una rápida</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase">Atributo</label>
                          <input value={quickVariant.name} onChange={e => setQuickVariant(p => ({ ...p, name: e.target.value }))}
                            placeholder="Ej: Talla" className={inputCls}/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase">Valor</label>
                          <input value={quickVariant.sku} onChange={e => setQuickVariant(p => ({ ...p, sku: e.target.value }))}
                            placeholder="Ej: XL" className={inputCls}/>
                        </div>
                      </div>
                      <button onClick={handleCreateQuickVariant}
                        disabled={!quickVariant.name || !quickVariant.sku || isCreatingQuickVariant}
                        className="w-full h-9 bg-[#004d4d] text-white rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-1.5">
                        {isCreatingQuickVariant ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12}/>}
                        Crear variante
                      </button>
                    </div>
                  )}

                  {/* Precio + Cantidad + CTA */}
                  <div className="mt-auto pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                    {/* Fila precio + cantidad */}
                    <div className="flex gap-3 mb-4">
                      {/* Precio editable */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Precio unit.</span>
                          <span className="text-[8px] font-bold text-gray-300">editable</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00a896] font-black text-lg leading-none">$</span>
                          <input type="text" value={tempPrice.toLocaleString('de-DE')}
                            onChange={e => setTempPrice(Number(e.target.value.replace(/\D/g, '')))}
                            className="w-full outline-none transition-all"
                            style={{ paddingLeft: '28px', paddingRight: '10px', height: '48px', background: 'linear-gradient(135deg, #e8faf9, #f0fdf4)', border: '2px solid #b2f0ea', borderRadius: '14px', fontSize: '18px', fontWeight: 900, color: '#004d4d' }}/>
                        </div>
                      </div>
                      {/* Cantidad */}
                      <div className="shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cant.</span>
                        </div>
                        <div className="flex items-center gap-0 h-[48px] rounded-[14px] overflow-hidden" style={{ border: '2px solid #e5e7eb' }}>
                          <button onClick={() => setTempQty(q => Math.max(1, q - 1))}
                            className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors font-black text-lg">
                            −
                          </button>
                          <span className="w-9 text-center font-black text-[15px] text-gray-800">{tempQty}</span>
                          <button onClick={() => setTempQty(q => q + 1)}
                            className="w-10 h-full flex items-center justify-center text-[#004d4d] hover:bg-[#004d4d]/5 transition-colors font-black text-lg">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Total si qty > 1 */}
                    {tempQty > 1 && (
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] text-gray-400">{tempQty} unidades × ${tempPrice.toLocaleString('de-DE')}</span>
                        <span className="text-[13px] font-black text-[#004d4d]">${(tempPrice * tempQty).toLocaleString('de-DE')}</span>
                      </div>
                    )}
                    <button onClick={() => addToCart(selectedProductForVariant, selectedVariants, tempPrice, tempQty)}
                      className="w-full flex items-center justify-center gap-2.5 font-black text-[11px] uppercase tracking-widest text-white transition-all"
                      style={{ height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #003333, #004d4d)', boxShadow: '0 8px 24px rgba(0,77,77,0.35)' }}>
                      <ShoppingCart size={15}/> Agregar a la factura
                    </button>
                    <button onClick={() => setSelectedProductForVariant(null)}
                      className="w-full text-[9px] font-bold uppercase text-gray-300 hover:text-rose-400 transition-colors tracking-widest text-center mt-3 mb-1">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      , document.body)}

      <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric}/>
    </div>
  );
}
