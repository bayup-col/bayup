"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
    ShoppingBag, 
    MessageSquare, 
    Instagram, 
    Facebook, 
    Globe, 
    Search,
    Filter,
    ArrowRight,
    Star,
    ShieldCheck,
    Zap,
    Image as ImageIcon,
    ChevronRight,
    LayoutGrid,
    Truck,
    CreditCard,
    Menu,
    X,
    Heart,
    Eye
} from 'lucide-react';
import { InteractiveUP } from '@/components/landing/InteractiveUP';

export default function PublicShopPage() {
    const { slug } = useParams();
    const [shopData, setShopData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { scrollY } = useScroll();
    const navBg = useTransform(scrollY, [0, 100], ["rgba(255,255,255,0)", "rgba(255,255,255,0.9)"]);
    const navShadow = useTransform(scrollY, [0, 100], ["none", "0 10px 30px rgba(0,0,0,0.05)"]);

    // --- DATOS DE PLANTILLA MAESTRA (Si la tienda está vacía) ---
    const DEFAULT_CATEGORIES = [
        { id: 'cat1', title: 'Essential Series' },
        { id: 'cat2', title: 'Urban Tech' },
        { id: 'cat3', title: 'Luxe Accesorios' }
    ];

    const DEFAULT_PRODUCTS = [
        {
            id: 'd1',
            name: 'Minimalist Overcoat Black',
            price: 450000,
            image_url: 'https://images.unsplash.com/photo-1539533330585-b33b401d29d7?auto=format&fit=crop&q=80&w=1000',
            collection_id: 'cat1',
            sku: 'ESS-001'
        },
        {
            id: 'd2',
            name: 'Cyber-Punk Joggers 2.0',
            price: 285000,
            image_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=1000',
            collection_id: 'cat2',
            sku: 'URB-99'
        },
        {
            id: 'd3',
            name: 'Titanium Edge Watch',
            price: 890000,
            image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000',
            collection_id: 'cat3',
            sku: 'LUX-07'
        },
        {
            id: 'd4',
            name: 'Cloud-Step Sneakers',
            price: 320000,
            image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000',
            collection_id: 'cat2',
            sku: 'SHO-44'
        },
        {
            id: 'd5',
            name: 'Raw Denim Jacket',
            price: 195000,
            image_url: 'https://images.unsplash.com/photo-1576905341939-4ef20c371f7a?auto=format&fit=crop&q=80&w=1000',
            collection_id: 'cat1',
            sku: 'ESS-056'
        },
        {
            id: 'd6',
            name: 'Sahara Desert Boots',
            price: 540000,
            image_url: 'https://images.unsplash.com/photo-1520639889313-7519f0365d77?auto=format&fit=crop&q=80&w=1000',
            collection_id: 'cat3',
            sku: 'LUX-90'
        }
    ];

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/public/shop/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    
                    // Si el usuario no tiene datos reales, le inyectamos la plantilla de lujo
                    const finalData = {
                        ...data,
                        products: data.products && data.products.length > 0 ? data.products : DEFAULT_PRODUCTS,
                        categories: data.categories && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES
                    };
                    setShopData(finalData);
                }
            } catch (error) {
                console.error("Failed to fetch shop", error);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchShop();
    }, [slug]);

    const filteredProducts = useMemo(() => {
        if (!shopData) return [];
        return shopData.products.filter((p: any) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "all" || p.collection_id === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [shopData, searchTerm, selectedCategory]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#001A1A]">
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3], filter: ["blur(0px)", "blur(10px)", "blur(0px)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl font-black italic text-white tracking-tighter"
                >
                    BAYUP
                </motion.div>
                <div className="w-48 h-1 bg-white/10 rounded-full mt-8 overflow-hidden relative">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-[#00f2ff]"
                    />
                </div>
            </div>
        );
    }

    if (!shopData) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-9xl font-black text-gray-100 uppercase mb-4 italic">404</h1>
                <h2 className="text-3xl font-black text-gray-900 uppercase italic">Ecosistema No Sincronizado</h2>
                <button onClick={() => window.location.href = '/'} className="mt-8 px-12 py-5 bg-[#004d4d] text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl">Volver al Portal</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-[#00f2ff] selection:text-black">
            
            {/* --- NAVEGACIÓN FLOTANTE ELITE --- */}
            <motion.nav 
                style={{ backgroundColor: navBg, boxShadow: navShadow }}
                className="fixed top-0 w-full z-[1000] border-b border-white/10 backdrop-blur-md transition-all duration-500"
            >
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsMenuOpen(true)} className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center hover:scale-110 transition-all">
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#004d4d] rounded-xl flex items-center justify-center text-[#00f2ff] font-black text-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                                {shopData.store_name.charAt(0)}
                            </div>
                            <h1 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase">{shopData.store_name}</h1>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center bg-gray-100/50 px-6 py-3 rounded-full border border-gray-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#004d4d]/5 transition-all">
                        <Search size={16} className="text-gray-400" />
                        <input 
                            placeholder="Encontrar algo especial..." 
                            className="bg-transparent outline-none px-4 text-xs font-bold w-80 text-gray-900 placeholder:text-gray-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Soporte Vital</span>
                            <span className="text-[10px] font-bold text-gray-900">{shopData.store_email}</span>
                        </div>
                        <button className="h-14 w-14 rounded-2xl bg-[#004d4d] text-[#00f2ff] flex items-center justify-center shadow-2xl relative group hover:scale-105 transition-all">
                            <ShoppingBag size={24} />
                            <span className="absolute -top-2 -right-2 h-6 w-6 bg-[#00f2ff] text-[#004d4d] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">0</span>
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* --- HERO CINEMATOGRÁFICO --- */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#001A1A]">
                <div className="absolute inset-0 z-0">
                    <motion.div 
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.4 }}
                        transition={{ duration: 2 }}
                        className="w-full h-full"
                    >
                        {/* Placeholder de imagen de alta calidad para el diseño */}
                        <img 
                            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000" 
                            className="w-full h-full object-cover filter brightness-50 contrast-125"
                            alt="Background"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#001A1A]/80 via-transparent to-[#FAFAFA]" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-10">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4"
                    >
                        <span className="px-6 py-2 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.5em] border border-[#00f2ff]/20 backdrop-blur-xl">
                            Ecosistema Certificado Bayup
                        </span>
                        <h2 className="text-7xl md:text-[120px] font-black text-white italic tracking-tighter uppercase leading-[0.85] drop-shadow-2xl">
                            {shopData.store_name.split(' ')[0]} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00f2ff] to-white opacity-80">COLLECTION</span>
                        </h2>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex flex-wrap justify-center gap-8 pt-8"
                    >
                        <div className="flex items-center gap-3 text-white/60">
                            <Truck size={20} className="text-[#00f2ff]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Envíos Nacionales</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60">
                            <ShieldCheck size={20} className="text-[#00f2ff]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Compra Protegida</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60">
                            <CreditCard size={20} className="text-[#00f2ff]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Todos los Medios</span>
                        </div>
                    </motion.div>
                </div>

                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-[8px] font-black text-[#004d4d] uppercase tracking-[0.4em]">Explorar</span>
                    <div className="w-px h-12 bg-gradient-to-b from-[#004d4d] to-transparent" />
                </motion.div>
            </section>

            {/* --- NAVEGACIÓN DE CATEGORÍAS (PILLS) --- */}
            <section className="sticky top-24 z-50 py-8 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar">
                    <div className="flex items-center justify-center gap-4 min-w-max">
                        <button 
                            onClick={() => setSelectedCategory("all")}
                            className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === "all" ? 'bg-[#004d4d] text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100 hover:text-gray-900'}`}
                        >
                            Todos
                        </button>
                        {shopData.categories.map((cat: any) => (
                            <button 
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? 'bg-[#004d4d] text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100 hover:text-gray-900'}`}
                            >
                                {cat.title}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- GRID DE PRODUCTOS (REDISEÑO PLATINUM) --- */}
            <main className="max-w-7xl mx-auto px-6 py-20 pb-40">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product: any, idx: number) => (
                            <motion.div 
                                layout
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -15 }}
                                className="bg-white rounded-[3.5rem] p-4 border border-gray-100 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all group"
                            >
                                <div className="aspect-[4/5] w-full bg-gray-50 rounded-[3rem] mb-6 overflow-hidden relative border border-gray-50 shadow-inner">
                                    {product.image_url ? (
                                        <img 
                                            src={product.image_url} 
                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                            alt={product.name} 
                                        />
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-200 gap-4">
                                            <ImageIcon size={64} strokeWidth={1} />
                                            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Sin Imagen</span>
                                        </div>
                                    )}
                                    
                                    {/* Capas de Interacción */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button className="h-12 w-12 rounded-2xl bg-white text-gray-900 flex items-center justify-center hover:bg-[#00f2ff] hover:scale-110 transition-all shadow-xl">
                                            <Eye size={20} />
                                        </button>
                                        <button className="h-12 w-12 rounded-2xl bg-white text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white hover:scale-110 transition-all shadow-xl">
                                            <Heart size={20} />
                                        </button>
                                    </div>

                                    <div className="absolute top-6 left-6">
                                        <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                                            New Arrival
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="px-4 pb-4 space-y-6">
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter line-clamp-1 group-hover:text-[#004d4d] transition-colors">
                                            {product.name}
                                        </h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Ref: {product.sku || 'CAT-2026'}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Precio Unitario</p>
                                            <p className="text-2xl font-black text-gray-900 tracking-tighter">
                                                ${product.price.toLocaleString('de-DE')}
                                            </p>
                                        </div>
                                        <button className="h-16 w-16 rounded-[2rem] bg-gray-900 text-[#00f2ff] flex items-center justify-center hover:bg-black hover:scale-105 transition-all shadow-2xl active:scale-95 group/btn">
                                            <ShoppingBag size={24} className="group-hover/btn:rotate-12 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredProducts.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="py-40 text-center space-y-6"
                    >
                        <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                            <Search size={48} strokeWidth={1} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-black uppercase italic text-gray-900">No encontramos resultados</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intenta con otra categoría o término de búsqueda</p>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* --- FOOTER TIENDA ELITE --- */}
            <footer className="bg-white border-t border-gray-100 py-32 px-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-20 opacity-[0.02] -rotate-12 pointer-events-none">
                    <ShoppingBag size={500} />
                </div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20 relative z-10">
                    <div className="space-y-8 text-center md:text-left">
                        <div className="text-3xl font-black italic tracking-tighter text-gray-900">
                            <span>BAY</span><InteractiveUP />
                        </div>
                        <p className="text-xs font-medium text-gray-400 leading-relaxed max-w-xs mx-auto md:mx-0">
                            Operando bajo el protocolo de seguridad Bayup Ecosystem. Todas las transacciones están cifradas de extremo a extremo.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Métodos de Pago</h5>
                        <div className="flex gap-4 opacity-30 grayscale">
                            <CreditCard size={32} />
                            <ShieldCheck size={32} />
                            <Zap size={32} />
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center md:items-end gap-8">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Conectar con Marca</h5>
                        <div className="flex gap-4">
                            <button className="h-16 w-16 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#004d4d] hover:text-[#00f2ff] transition-all shadow-sm">
                                <Instagram size={28} />
                            </button>
                            <button className="h-16 w-16 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                <MessageSquare size={28} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto pt-20 border-t border-gray-50 mt-20 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-200">© 2026 {shopData.store_name} | Powered by InteractiveUP</p>
                </div>
            </footer>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}