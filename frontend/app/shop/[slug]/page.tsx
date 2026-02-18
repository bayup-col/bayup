"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
    Trash2,
    CreditCard,
    Menu,
    X,
    Heart,
    Eye,
    User,
    CheckCheck,
    Plus,
    Loader2
} from 'lucide-react';
import { InteractiveUP } from '@/components/landing/InteractiveUP';
import { StudioProvider } from '../../dashboard/pages/studio/context';
import { Canvas } from '../../dashboard/pages/studio/internal-studio-parts/Canvas';
import { useCart } from '@/context/cart-context';

const PREVIEW_DATA = {
    store_name: "Mi Tienda Bayup",
    owner_id: "preview_owner",
    categories: [
        { id: "c1", title: "Novedades" },
        { id: "c2", title: "Más Vendidos" }
    ],
    products: [
        { 
            id: "p1", 
            name: "Producto de Ejemplo Pro", 
            price: 45000, 
            image_url: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800"],
            collection_id: "c1",
            variants: [{ stock: 10 }]
        },
        { 
            id: "p2", 
            name: "Edición Limitada", 
            price: 89000, 
            image_url: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800"],
            collection_id: "c2",
            variants: [{ stock: 5 }]
        }
    ],
    custom_schema: null
};

export default function PublicShopPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-[#004d4d]" />
            </div>
        }>
            <ShopContent />
        </Suspense>
    );
}

function ShopContent() {
    const { slug } = useParams();
    const searchParams = useSearchParams();
    const pageKey = searchParams.get("page") || "home";
    const router = useRouter();
    const { items: cart, addItem, removeItem, clearCart, total: cartTotal, isCartOpen, setIsCartOpen } = useCart();
    
    const [shopData, setShopData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); 
    
    // --- LÓGICA DE INTERFAZ ---
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isClientLoginOpen, setIsClientLoginOpen] = useState(false); 
    const [customerData, setCustomerData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        notes: ""
    });
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const addToCart = (product: any) => {
        const totalStock = product.variants?.reduce((a: any, b: any) => a + (b.stock || 0), 0) || 0;
        if (totalStock <= 0 && product.id !== 'd1') { 
            alert("Lo sentimos, este producto está agotado.");
            return;
        }

        addItem({
            id: product.id,
            title: product.name,
            price: product.price,
            image: Array.isArray(product.image_url) ? product.image_url[0] : (product.image_url || ''),
            quantity: 1
        });
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setIsPlacingOrder(true);

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://bayup-interactive-production.up.railway.app';
            const payload = {
                customer_name: customerData.name,
                customer_phone: customerData.phone,
                customer_email: customerData.email,
                tenant_id: shopData.owner_id,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const res = await fetch(`${apiBase}/public/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                clearCart();
                setIsCheckoutOpen(false);
                setIsCartOpen(false);
                setCustomerData({ name: "", phone: "", email: "", address: "", city: "", notes: "" });
                alert("¡Pedido recibido! ✅ Te hemos enviado una confirmación automática a tu WhatsApp.");
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'No se pudo crear el pedido.'}`);
            }
        } catch (error) {
            alert("Error de conexión. Intenta de nuevo.");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    useEffect(() => {
        const fetchShop = async () => {
            setLoading(true);
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://bayup-interactive-production.up.railway.app';
                
                // 1. Intentar cargar desde el servidor (Ruta normal)
                const res = await fetch(`${apiBase}/public/shop/${slug}?page=${pageKey}`);
                
                if (res.ok) {
                    const data = await res.json();
                    
                    // Si no tiene esquema, intentar buscar el esquema específico de la página
                    if (!data.custom_schema) {
                        try {
                            const pageRes = await fetch(`${apiBase}/public/shop-pages/${data.owner_id}/${pageKey}`);
                            if (pageRes.ok) {
                                const pageData = await pageRes.json();
                                if (pageData && pageData.schema_data) {
                                    data.custom_schema = pageData.schema_data;
                                }
                            }
                        } catch (e) {}
                    }
                    setShopData(data);
                } else if (slug === "preview") {
                    // 2. Si es preview y falla el servidor, intentar cargar desde LocalStorage (Lo que acaba de hacer el usuario en el Studio)
                    const localPreview = localStorage.getItem("bayup-studio-preview");
                    if (localPreview) {
                        const parsedSchema = JSON.parse(localPreview);
                        setShopData({
                            ...PREVIEW_DATA,
                            custom_schema: parsedSchema
                        });
                    } else {
                        // 3. Fallback final: Mock data básica
                        setShopData(PREVIEW_DATA);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch shop", error);
                if (slug === "preview") setShopData(PREVIEW_DATA);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchShop();
    }, [slug, pageKey]);

    const filteredProducts = useMemo(() => {
        if (!shopData) return [];
        return (shopData.products || []).filter((p: any) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "all" || p.collection_id === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [shopData, searchTerm, selectedCategory]);

    const { scrollY } = useScroll();
    const navBg = useTransform(scrollY, [0, 100], ["rgba(255,255,255,0)", "rgba(255,255,255,0.9)"]);
    const navShadow = useTransform(scrollY, [0, 100], ["none", "0 10px 30px rgba(0,0,0,0.05)"]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <div className="relative">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360]
                        }} 
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} 
                        className="h-16 w-16 border-4 border-gray-100 border-t-[#004d4d] rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-[#004d4d] rounded-full animate-pulse" />
                    </div>
                </div>
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 animate-pulse">Cargando Experiencia</p>
            </div>
        );
    }

    if (!shopData) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-9xl font-black text-gray-100 uppercase mb-4 italic">404</h1>
                <h2 className="text-3xl font-black text-gray-900 uppercase italic">Tienda No Encontrada</h2>
                <button onClick={() => router.push('/')} className="mt-8 px-12 py-5 bg-[#004d4d] text-white rounded-full font-black text-xs uppercase tracking-widest">Volver</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-[#00f2ff] selection:text-black">
            
            {/* --- CONTENIDO PRINCIPAL: CUSTOM VS DEFAULT --- */}
            {shopData.custom_schema ? (
                <StudioProvider>
                    <Canvas 
                        overrideData={shopData.custom_schema} 
                        isPreview={true} 
                        initialProducts={shopData.products}
                        initialCategories={shopData.categories}
                        onOpenCart={() => setIsCartOpen(true)}
                        onOpenLogin={() => setIsClientLoginOpen(true)}
                    />
                </StudioProvider>
            ) : (
                <>
                    {/* NAVEGACIÓN DEFAULT */}
                    <motion.nav style={{ backgroundColor: navBg, boxShadow: navShadow }} className="fixed top-0 w-full z-[1000] border-b border-white/10 backdrop-blur-md h-24 flex items-center">
                        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#004d4d] rounded-xl flex items-center justify-center text-[#00f2ff] font-black text-lg shadow-lg rotate-3">{shopData.store_name.charAt(0)}</div>
                                <h1 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase">{shopData.store_name}</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="h-14 w-14 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all shadow-sm"><User size={24} /></button>
                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[600]">
                                                <button onClick={() => { setIsUserMenuOpen(false); setIsClientLoginOpen(true); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl text-[10px] font-black uppercase text-gray-600 flex items-center gap-3"><User size={14} /> Iniciar Sesión</button>
                                                <button onClick={() => { setIsUserMenuOpen(false); setIsClientLoginOpen(true); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl text-[10px] font-black uppercase text-[#004D4D] flex items-center gap-3"><Plus size={14} /> Registrarse</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button onClick={() => setIsCartOpen(true)} className="h-14 w-14 rounded-2xl bg-[#004d4d] text-[#00f2ff] flex items-center justify-center shadow-2xl relative">
                                    <ShoppingBag size={24} />
                                    {cart.length > 0 && <span className="absolute -top-2 -right-2 h-6 w-6 bg-[#00f2ff] text-[#004d4d] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>}
                                </button>
                            </div>
                        </div>
                    </motion.nav>

                    {/* HERO DEFAULT */}
                    <section className="relative min-h-[85vh] flex items-center justify-center bg-[#001A1A]">
                        <div className="absolute inset-0 z-0 opacity-40"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000" className="w-full h-full object-cover" /></div>
                        <div className="relative z-10 text-center text-white space-y-6">
                            <h2 className="text-7xl md:text-[100px] font-black italic tracking-tighter uppercase leading-none">{shopData.store_name} <br/> <span className="text-cyan">COLECCIÓN</span></h2>
                            <p className="text-xl font-medium italic opacity-60">Explora lo mejor del catálogo oficial.</p>
                        </div>
                    </section>

                    {/* PRODUCTOS DEFAULT */}
                    <main className="max-w-7xl mx-auto px-6 py-20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                            {filteredProducts.map((product: any) => (
                                <div key={product.id} className="bg-white rounded-[3rem] p-4 border border-gray-100 shadow-sm group">
                                    <div className="aspect-[4/5] bg-gray-50 rounded-[2.5rem] mb-6 overflow-hidden"><img src={Array.isArray(product.image_url) ? product.image_url[0] : (product.image_url || '')} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000" /></div>
                                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter">{product.name}</h4>
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-xl font-black text-[#004d4d]">${Number(product.price).toLocaleString()}</p>
                                        <button onClick={() => addToCart(product)} className="h-12 w-12 rounded-2xl bg-gray-900 text-cyan flex items-center justify-center hover:scale-110 transition-all"><ShoppingBag size={20}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </>
            )}

            {/* --- COMPONENTES GLOBALES (SIEMPRE DISPONIBLES) --- */}
            
            {/* SIDEBAR CARRITO */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[3000] flex justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-white h-screen shadow-2xl flex flex-col">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#001A1A] text-white">
                                <h3 className="text-xl font-black uppercase italic tracking-widest">Tu Selección</h3>
                                <button onClick={() => setIsCartOpen(false)} className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><X size={20}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30"><ShoppingBag size={64}/><p className="text-[10px] font-black uppercase mt-4">Carrito Vacío</p></div>
                                ) : cart.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-[2rem] border border-gray-100">
                                        <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white shrink-0"><img src={item.image || 'https://via.placeholder.com/100'} className="h-full w-full object-cover" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 line-clamp-1">{item.title}</p>
                                            <p className="text-xs font-bold text-[#004d4d] mt-1">${item.price.toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Cantidad: {item.quantity}</p>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-rose-500 self-center"><Trash2 size={18}/></button>
                                    </div>
                                ))}
                            </div>
                            {cart.length > 0 && (
                                <div className="p-8 border-t bg-gray-50/50 space-y-6">
                                    <div className="flex justify-between items-end"><p className="text-[10px] font-black text-gray-400 uppercase">Total Estimado</p><p className="text-3xl font-black text-gray-900 tracking-tighter">${cartTotal.toLocaleString()}</p></div>
                                    <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full py-6 bg-gray-900 text-[#00f2ff] rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Finalizar Compra</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL CHECKOUT */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-3xl p-12 overflow-hidden border border-white/20">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#001A1A] mb-8">Información de <span className="text-[#004d4d]">Envío</span></h3>
                            <form onSubmit={handlePlaceOrder} className="space-y-6">
                                <input required placeholder="Nombre Completo" value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input required placeholder="WhatsApp" maxLength={10} value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value.replace(/\D/g,'')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    <input required type="email" placeholder="Email" value={customerData.email} onChange={e => setCustomerData({...customerData, email: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input required placeholder="Dirección" value={customerData.address} onChange={e => setCustomerData({...customerData, address: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    <input required placeholder="Ciudad" value={customerData.city} onChange={e => setCustomerData({...customerData, city: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                </div>
                                <button type="submit" disabled={isPlacingOrder} className="w-full py-6 bg-[#004d4d] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-4">{isPlacingOrder ? "Procesando..." : <>Confirmar Pedido <ArrowRight size={18}/></>}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL LOGIN CLIENTE */}
            <AnimatePresence>
                {isClientLoginOpen && (
                    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClientLoginOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-white/20">
                            <div className="text-center mb-8">
                                <div className="h-20 w-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-[#004d4d] mb-4 shadow-inner"><User size={40} /></div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Área de Clientes</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Inicia sesión en {shopData?.store_name}</p>
                            </div>
                            <div className="space-y-4">
                                <input placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-[#004d4d]/20 outline-none text-sm font-bold shadow-inner" />
                                <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-[#004d4d]/20 outline-none text-sm font-bold shadow-inner" />
                                <button className="w-full py-5 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all mt-4">Acceder</button>
                                <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-wider mt-4">¿Aún no tienes cuenta? <span className="text-[#004d4d] cursor-pointer hover:underline">Regístrate gratis</span></p>
                            </div>
                            <button onClick={() => setIsClientLoginOpen(false)} className="absolute top-6 right-6 text-gray-300 hover:text-rose-500 transition-colors"><X size={20}/></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{` .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; } `}</style>
        </div>
    );
}
