"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { publicService } from '@/lib/api';
import { Search, ShoppingCart, User, Package } from 'lucide-react';

export default function TenantShopPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  
  const [config, setConfig] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStoreData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      // 1. Cargar diseño de la página de inicio
      const pageData = await publicService.getStorePage(tenantId, 'home');
      if (pageData.content) setConfig(pageData.content);

      // 2. Cargar productos de la tienda
      const productsData = await publicService.getStoreProducts(tenantId);
      setProducts(productsData);
    } catch (err: any) {
      setError("La tienda no está disponible en este momento.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando Tienda...</p>
    </div>
  );

  if (error || !config) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8 text-center">
      <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-6">
        <Package size={40} />
      </div>
      <h1 className="text-2xl font-black text-gray-900">Tienda no encontrada</h1>
      <p className="text-gray-500 mt-2">Asegúrate de que la URL sea correcta o que el dueño haya publicado su sitio.</p>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-1000">
      {/* 1. BARRA DE ANUNCIOS */}
      {config.announcement?.show && (
        <div 
          className="w-full py-2.5 text-center transition-all duration-500"
          style={{ backgroundColor: config.announcement.bg, color: config.announcement.color }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            {config.announcement.messages[0]?.text}
          </p>
        </div>
      )}

      {/* 2. NAVEGACIÓN PRINCIPAL */}
      <header 
        className="px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-50"
        style={{ height: config.header.bar_height }}
      >
        <div className="text-2xl font-black" style={{ color: config.header.logo_color, fontFamily: config.header.logo_font }}>
          {config.header.logo_text}
        </div>
        
        <nav className="hidden lg:flex items-center gap-10">
          {config.header.nav_items.map((item: any) => (
            <a key={item.id} href={item.href} className="text-[10px] font-black uppercase tracking-widest hover:text-purple-600 transition-colors" style={{ color: config.header.nav_color }}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6 text-gray-900">
          <Search size={20} className="cursor-pointer hover:text-purple-600 transition-all" />
          <User size={20} className="cursor-pointer hover:text-purple-600 transition-all" />
          <div className="relative cursor-pointer group">
            <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">0</span>
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER */}
      <section className="relative h-[70vh] min-h-[500px] bg-gray-900 overflow-hidden">
        <img src={config.template.hero.bg_url} className="absolute inset-0 w-full h-full object-cover scale-105" alt="Banner" />
        <div className="absolute inset-0 bg-black" style={{ opacity: config.template.hero.overlay_opacity }}></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 md:p-12">
          <h1 
            className="text-white font-black leading-[0.9] mb-8 transition-all max-w-4xl"
            style={{ fontSize: 'calc(2rem + 4vw)', fontFamily: config.template.hero.headline_font }}
          >
            {config.template.hero.headline}
          </h1>
          <button 
            className="px-12 py-5 font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-110 active:scale-95 transition-all"
            style={{ backgroundColor: config.template.hero.button_bg, color: config.template.hero.button_color, borderRadius: config.template.hero.button_radius }}
          >
            {config.template.hero.button_text}
          </button>
        </div>
      </section>

      {/* 4. GRILLA DE PRODUCTOS REALES */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12">
        <div className="flex items-end justify-between border-b border-gray-100 pb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Nuestros Productos</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Explora la colección exclusiva</p>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{products.length} Artículos</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
              <Package size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay productos disponibles</p>
            </div>
          ) : products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="aspect-[4/5] bg-gray-50 rounded-[2.5rem] overflow-hidden relative mb-6">
                <img 
                  src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={product.name}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <button className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                  Añadir al carrito
                </button>
              </div>
              <div className="px-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{product.name}</h3>
                <p className="text-lg font-black text-purple-600 mt-1">{formatCurrency(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 5. FOOTER SIMPLE */}
      <footer className="bg-gray-50 border-t border-gray-100 py-20 mt-20">
        <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-xl font-black opacity-30" style={{ fontFamily: config.header.logo_font }}>{config.header.logo_text}</div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© {new Date().getFullYear()} • Powered by Bayup</p>
          <div className="flex gap-6 grayscale opacity-50">
            {/* Aquí podrían ir los iconos de redes sociales guardados en la configuración global */}
          </div>
        </div>
      </footer>
    </div>
  );
}