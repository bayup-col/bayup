"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ImageIcon, Loader2, Link as LinkIcon, Copy, Check, Smartphone, Monitor,
  Globe, ExternalLink, Send, EyeOff, Package, Menu, Search, ShoppingBag,
  Heart, SlidersHorizontal, Home, LayoutGrid, User,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';
import type { CatalogData } from '@/lib/catalog-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bayup.com.co';

export default function CatalogContent({ initialData }: { initialData?: CatalogData | null }) {
  const { token, shopSlug, userName } = useAuth();
  const { showToast } = useToast();

  const [catalog, setCatalog] = useState<CatalogData | null>(initialData || null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialData?.banner_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [copied, setCopied] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const [catRes, prodRes] = await Promise.allSettled([
      apiRequest<CatalogData | null>('/catalog', { token }),
      apiRequest<any[]>('/products', { token }),
    ]);
    if (catRes.status === 'fulfilled') {
      setCatalog(catRes.value);
      if (catRes.value?.banner_url) setBannerPreview(catRes.value.banner_url);
    }
    if (prodRes.status === 'fulfilled') {
      setProducts(Array.isArray(prodRes.value) ? prodRes.value.filter(p => p.status === 'active') : []);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleBannerSelect = (file: File) => {
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSave = async (thenPublish = false) => {
    if (!token) return;
    setIsSaving(true);
    try {
      let bannerUrl = catalog?.banner_url || null;
      if (bannerFile) {
        setIsUploading(true);
        const fd = new FormData();
        fd.append('file', bannerFile);
        const data = await apiRequest<{ url: string }>('/admin/upload-image', { method: 'POST', token, body: fd });
        bannerUrl = data.url;
        setIsUploading(false);
      }
      const updated = await apiRequest<CatalogData>('/catalog', {
        method: 'PUT', token, body: JSON.stringify({ banner_url: bannerUrl }),
      });
      setCatalog(updated);
      setBannerFile(null);
      if (thenPublish) {
        const published = await apiRequest<CatalogData>('/catalog/publish', { method: 'POST', token });
        setCatalog(published);
        showToast('Catálogo publicado 🎉', 'success');
      } else {
        showToast('Borrador guardado', 'success');
      }
    } catch (e: any) {
      showToast(e?.message || 'Error al guardar el catálogo', 'error');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!token) return;
    try {
      const updated = await apiRequest<CatalogData>('/catalog/unpublish', { method: 'POST', token });
      setCatalog(updated);
      showToast('Catálogo despublicado', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Error al despublicar', 'error');
    }
  };

  const handleCopyLink = () => {
    if (!catalog?.public_url) return;
    navigator.clipboard.writeText(catalog.public_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPublished = catalog?.status === 'published';
  const canPublish = !!bannerPreview;
  const storeName = userName || 'Tu Tienda';
  const categories = useMemo(
    () => Array.from(new Set(products.map((p: any) => p?.category).filter(Boolean))).slice(0, 6) as string[],
    [products]
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-[#004d4d]" size={32} />
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* ── HERO ── */}
      <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#001a1a 0%,#003333 50%,#005252 100%)' }}>
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(0,242,255,0.12),transparent 70%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f2ff]/70 mb-1">Catálogo</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Tu catálogo digital</h1>
            <p className="text-white/50 text-xs sm:text-sm mt-1 max-w-lg">
              Sube un banner, revisa la vista previa y publica un link para compartir por WhatsApp. Muestra siempre todos tus productos activos, con carrito y pago real.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 self-start">
            <div className={`h-1.5 w-1.5 rounded-full ${isPublished ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] font-bold text-white/70 tracking-widest uppercase">
              {isPublished ? 'Publicado' : 'Borrador'}
            </span>
          </div>
        </div>
      </div>

      {isPublished && catalog?.public_url && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <LinkIcon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Link de tu catálogo</p>
              <p className="text-sm font-bold text-emerald-900 truncate">{catalog.public_url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Mira nuestro catálogo: ${catalog.public_url}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity">
              <Send size={14} /> Compartir
            </a>
            <a href={catalog.public_url} target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors">
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── EDITOR ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ImageIcon size={14} /> Banner principal
              </p>
              <label
                htmlFor="catalog-banner-upload"
                className="relative block h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-[#00b2bd] transition-colors group"
              >
                {bannerPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerPreview} alt="Banner del catálogo" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:text-[#00b2bd]">
                    <ImageIcon size={22} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Subir imagen (1600x600 sugerido)</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={24} />
                  </div>
                )}
              </label>
              <input id="catalog-banner-upload" type="file" hidden accept="image/*"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerSelect(f); }} />
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
              <Package size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-gray-500 leading-relaxed">
                Tu catálogo muestra automáticamente los <span className="text-gray-900 font-bold">{products.length} productos activos</span> de tu inventario. Para agregar o quitar productos, edítalos en el módulo Productos.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleSave(true)}
                disabled={!canPublish || isSaving}
                className={`w-full py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  !canPublish || isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#004d4d] text-white shadow-lg shadow-[#004d4d]/20 hover:scale-[1.01]'
                }`}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} className="text-[#00f2ff]" />}
                {isPublished ? 'Actualizar y republicar' : 'Publicar catálogo'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Guardar borrador
                </button>
                {isPublished && (
                  <button
                    onClick={handleUnpublish}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                  >
                    <EyeOff size={13} /> Despublicar
                  </button>
                )}
              </div>
              {!shopSlug && (
                <p className="text-[10px] font-bold text-amber-600 text-center pt-1">
                  Configura el link de tu tienda en Config Tienda antes de publicar.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div className="lg:col-span-7">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="p-1 bg-gray-100 rounded-full flex items-center gap-1">
                <button onClick={() => setDevice('mobile')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${device === 'mobile' ? 'bg-white text-[#004d4d] shadow-sm' : 'text-gray-400'}`}>
                  <Smartphone size={13} /> Móvil
                </button>
                <button onClick={() => setDevice('desktop')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${device === 'desktop' ? 'bg-white text-[#004d4d] shadow-sm' : 'text-gray-400'}`}>
                  <Monitor size={13} /> Escritorio
                </button>
              </div>
            </div>

            <div className="bg-black rounded-[2.5rem] p-3 shadow-2xl mx-auto transition-all"
              style={{ maxWidth: device === 'mobile' ? '360px' : '100%' }}>
              <div className="bg-[#0a0a0a] rounded-[2rem] overflow-hidden min-h-[560px] max-h-[680px] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
                  <Menu size={16} className="text-white/70" />
                  <span className="text-white font-black text-[11px] uppercase tracking-[0.15em] truncate max-w-[45%]">{storeName}</span>
                  <div className="flex items-center gap-3">
                    <Search size={15} className="text-white/70" />
                    <div className="relative">
                      <ShoppingBag size={15} className="text-white/70" />
                      {products.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-white text-black text-[7px] font-black flex items-center justify-center">
                          {Math.min(products.length, 9)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hero */}
                <div className={`relative w-full overflow-hidden ${device === 'mobile' ? 'h-64' : 'h-80'}`}>
                  {bannerPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerPreview} alt="Vista previa del banner" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#001a1a] to-[#005252]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    {!bannerPreview && (
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Sube tu banner para verlo aquí</p>
                    )}
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/60 mb-1.5">Tu estilo, tu marca</p>
                    <h2 className={`font-black text-white uppercase leading-none ${device === 'mobile' ? 'text-2xl' : 'text-4xl'}`}>{storeName}</h2>
                    <p className="text-white/60 text-[10px] mt-2 max-w-[80%] leading-relaxed">Descubre nuestra selección de productos, hecha para ti.</p>
                    <span className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white text-black rounded-full text-[9px] font-black uppercase tracking-widest">
                      Ver catálogo →
                    </span>
                  </div>
                </div>

                {/* Categorías */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-4 px-4 py-4 overflow-x-auto border-b border-white/5">
                    {categories.map((cat) => (
                      <div key={cat} className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <Package size={15} className="text-white/50" />
                        </div>
                        <span className="text-[8px] font-bold text-white/60 uppercase tracking-wide truncate max-w-[52px]">{cat}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Búsqueda + filtros */}
                <div className="flex items-center gap-2 px-4 pt-4">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
                    <Search size={12} className="text-white/40" />
                    <span className="text-[9px] font-semibold text-white/40">Buscar productos...</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 shrink-0">
                    <SlidersHorizontal size={11} className="text-white/60" />
                    <span className="text-[9px] font-bold text-white/60">Filtros</span>
                  </div>
                </div>

                {/* Productos */}
                <div className="p-4">
                  <p className="text-[11px] font-black text-white uppercase tracking-wide mb-3">
                    Todos los productos <span className="text-white/40 font-semibold normal-case">· {products.length}</span>
                  </p>
                  <div className={`grid gap-3 ${device === 'mobile' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {(products.length ? products : Array.from({ length: 6 })).slice(0, device === 'mobile' ? 6 : 9).map((p: any, i: number) => (
                      <div key={p?.id || i} className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5">
                        <div className="relative aspect-square bg-white/5 flex items-center justify-center">
                          {p?.image_url?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-white/20" />
                          )}
                          {p?.category && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/70 text-white text-[7px] font-black uppercase tracking-wide truncate max-w-[80%]">
                              {p.category}
                            </span>
                          )}
                          <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/50 flex items-center justify-center">
                            <Heart size={10} className="text-white" />
                          </span>
                        </div>
                        <div className="p-2 flex items-end justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-white truncate">{p?.name || 'Producto'}</p>
                            {p?.price != null && <p className="text-[10px] font-black text-white/70">${Number(p.price).toLocaleString('es-CO')}</p>}
                          </div>
                          <span className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            <ShoppingBag size={11} className="text-white" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!products.length && (
                    <p className="text-[10px] text-white/40 text-center mt-4">Agrega productos activos para que aparezcan aquí.</p>
                  )}
                </div>

                {/* Bottom nav (solo look móvil) */}
                {device === 'mobile' && (
                  <div className="flex items-center justify-around px-2 py-3.5 border-t border-white/5 mt-2 sticky bottom-0 bg-[#0a0a0a]">
                    {[
                      { icon: <Home size={15} />, label: 'Inicio' },
                      { icon: <LayoutGrid size={15} />, label: 'Categorías' },
                      { icon: <Heart size={15} />, label: 'Favoritos' },
                      { icon: <User size={15} />, label: 'Mi cuenta' },
                    ].map((item, i) => (
                      <div key={i} className={`flex flex-col items-center gap-1 ${i === 0 ? 'text-white' : 'text-white/40'}`}>
                        {item.icon}
                        <span className="text-[7px] font-bold uppercase tracking-wide">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
