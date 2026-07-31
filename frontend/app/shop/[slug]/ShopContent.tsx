"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { LazyMotion, domAnimation, m, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
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
    Lock,
    ArrowLeft,
    Zap,
    Image as ImageIcon,
    ChevronRight,
    LayoutGrid,
    Layout,
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
import { useCart } from '@/context/cart-context';
import { generateTemplateSchema } from '@/lib/templates-config';
import { trackPageview, trackSearch } from '@/lib/track';

// El motor de Studio (Canvas + su arbol de edicion, dnd-kit, etc.) solo hace
// falta cuando la tienda tiene un diseño publicado con `custom_schema` — pero
// eso es casi siempre el caso real. Igual lo separamos en su propio chunk con
// `next/dynamic` (SSR sigue activo, ver nota abajo) para que el bundle inicial
// del hot path publico no cargue de una todo el codigo del editor (dnd-kit,
// inspector de propiedades, etc. quedan fuera de ese chunk porque viven en
// otros archivos que Canvas no importa en el camino de renderizado publico).
// IMPORTANTE: no se usa `{ ssr: false }` — eso saltaria el render en servidor
// de todo el contenido real de la tienda (hero, productos...) y volveria a
// dejar el HTML inicial vacio, exactamente el problema que este refactor
// soluciona. Con SSR activo (el default), el contenido sigue llegando ya
// renderizado en el HTML; solo el JS del cliente se separa en un chunk aparte.
const Canvas = dynamic(() =>
    import('../../dashboard/pages/studio/internal-studio-parts/Canvas').then(mod => mod.Canvas)
);

const PREVIEW_DATA = {
    store_name: "Silicon Pro",
    owner_id: "preview_owner",
    categories: [
        { id: "c1", title: "iPhone", imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba3f21?q=80&w=800" },
        { id: "c2", title: "MacBook", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800" }
    ],
    products: [
        {
            id: "p1",
            name: "iPhone 15 Pro",
            price: 4500000,
            image_url: ["https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=800"],
            collection_id: "c1",
            variants: [{ stock: 10 }]
        },
        {
            id: "p2",
            name: "MacBook Air M3",
            price: 6800000,
            image_url: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800"],
            collection_id: "c2",
            variants: [{ stock: 5 }]
        }
    ],
    custom_schema: null
};

// Declaración para el objeto Wompi global que inyecta el script del widget
declare global {
    interface Window {
        WidgetCheckout: any;
    }
}

const LEGAL_LABELS: Record<string, string> = {
    terms_conditions: 'Términos y condiciones',
    privacy_policy:   'Política de privacidad',
    return_policy:    'Devoluciones y cambios',
    shipping_policy:  'Política de envíos',
};

export function ShopContent({ initialShopData }: { initialShopData: any }) {
    const { slug } = useParams();
    const searchParams = useSearchParams();

    // ROUTER DINÁMICO: Identificamos qué vista mostrar
    const view = searchParams.get("view") || "home"; // home, product, catalog, checkout, about
    const productId = searchParams.get("id");

    const router = useRouter();
    const { items: cart, addItem, removeItem, clearCart, total: cartTotal, isCartOpen, setIsCartOpen, isCheckoutOpen, setIsCheckoutOpen } = useCart();

    // La carga inicial (tienda + productos + diseño publicado de la vista con
    // la que se abrió la página) ya llega resuelta desde el servidor
    // (page.tsx, Server Component) — arrancamos con esos datos en vez de un
    // estado vacío + spinner, que es justamente el waterfall que se elimina.
    const [shopData, setShopData] = useState<any>(initialShopData);
    const [loading, setLoading] = useState(!initialShopData);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // --- LÓGICA DE INTERFAZ ---
    const [isClientLoginOpen, setIsClientLoginOpen] = useState(false);
    const [customerData, setCustomerData] = useState({
        name: "", phone: "", email: "", address: "", city: "", notes: ""
    });
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [placingOrderStep, setPlacingOrderStep] = useState<'idle' | 'creating' | 'confirming'>('idle');
    const [legalModalOpen, setLegalModalOpen] = useState<null | keyof typeof LEGAL_LABELS>(null);
    const customHtmlRef = useRef<HTMLDivElement>(null);

    // Carga el script del widget de Wompi al montar
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.wompi.co/widget.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

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
            quantity: 1,
            tenant_id: shopData.id,
            owner_id: shopData.owner_id
        });
    };

    // Carga el motor de Tailwind (CDN) una sola vez, solo si la tienda usa
    // alguna plantilla HTML nativa (custom_html) — su propio observer de DOM
    // recalcula clases en cada navegación siguiente sin recargar el script.
    useEffect(() => {
        if (!shopData.custom_html) return;
        if ((window as any).tailwind) return;
        const script = document.createElement('script');
        script.src = 'https://cdn.tailwindcss.com';
        document.head.appendChild(script);
    }, [shopData.custom_html]);

    // Adaptador de plantillas HTML nativas (WebTemplate tipo "html"): las
    // páginas llegan como HTML crudo vía dangerouslySetInnerHTML, así que
    // el navegador nunca ejecuta sus <script> (comportamiento estándar de
    // innerHTML). Este efecto: (1) revive esos scripts recreándolos como
    // nodos reales, (2) rellena los data-bayup="..." con los datos que ya
    // están en React (sin que la plantilla haga fetch propio) y (3) conecta
    // data-bayup-action al carrito/checkout/router reales de Bayup — NO al
    // carrito de localStorage ni al checkout por WhatsApp que trae la
    // plantilla de fábrica (eso saltaría Wompi, el registro de pedidos y el
    // descuento de inventario).
    useEffect(() => {
        const root = customHtmlRef.current;
        if (!shopData.custom_html || !root) return;

        Array.from(root.querySelectorAll('script')).forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = oldScript.textContent;
            oldScript.replaceWith(newScript);
        });

        const fmt = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
        const products: any[] = shopData.products || [];
        const imgOf = (p: any) => Array.isArray(p.image_url) ? p.image_url[0] : p.image_url;

        root.querySelectorAll('[data-bayup="store-name"]').forEach(el => { el.textContent = shopData.full_name || ''; });
        root.querySelectorAll('[data-bayup="store-phone"]').forEach(el => { el.textContent = shopData.phone || ''; });
        root.querySelectorAll('[data-bayup="cart-count"]').forEach(el => {
            el.textContent = cart.length ? String(cart.length) : '';
            (el as HTMLElement).style.display = cart.length ? '' : 'none';
        });

        const grid = root.querySelector('[data-bayup="product-grid"]');
        const cardTpl = root.querySelector('template[data-bayup="product-card-template"]') as HTMLTemplateElement | null;
        if (grid && cardTpl) {
            grid.innerHTML = '';
            products.forEach(p => {
                const clone = cardTpl.content.cloneNode(true) as DocumentFragment;
                const src = imgOf(p);
                clone.querySelectorAll('[data-bayup-card="image"]').forEach((el: any) => { if (src) el.src = src; el.alt = p.name; });
                clone.querySelectorAll('[data-bayup-card="name"]').forEach(el => { el.textContent = p.name; });
                clone.querySelectorAll('[data-bayup-card="price"]').forEach(el => { el.textContent = fmt(p.price); });
                clone.querySelectorAll('[data-bayup-action="add-to-cart"]').forEach(el => { (el as HTMLElement).dataset.productId = String(p.id); });
                clone.querySelectorAll('[data-bayup-action="nav-product"]').forEach(el => { (el as HTMLElement).dataset.productId = String(p.id); });
                grid.appendChild(clone);
            });
        }

        if (view === 'product' && productId) {
            const p = products.find(x => String(x.id) === String(productId));
            if (p) {
                const src = imgOf(p);
                root.querySelectorAll('[data-bayup="product-name"]').forEach(el => { el.textContent = p.name; });
                root.querySelectorAll('[data-bayup="product-price"]').forEach(el => { el.textContent = fmt(p.price); });
                root.querySelectorAll('[data-bayup="product-description"]').forEach(el => { el.textContent = p.description || ''; });
                root.querySelectorAll('img[data-bayup="product-image"]').forEach((el: any) => { if (src) el.src = src; el.alt = p.name; });
                root.querySelectorAll('[data-bayup-action="add-to-cart"]').forEach(el => { (el as HTMLElement).dataset.productId = String(p.id); });
            }
        }

        const cartBody = root.querySelector('[data-bayup="cart-items"]');
        const rowTpl = root.querySelector('template[data-bayup="cart-row-template"]') as HTMLTemplateElement | null;
        if (cartBody) {
            cartBody.innerHTML = '';
            if (rowTpl) {
                cart.forEach(item => {
                    const clone = rowTpl.content.cloneNode(true) as DocumentFragment;
                    clone.querySelectorAll('[data-bayup-row="name"]').forEach(el => { el.textContent = item.title; });
                    clone.querySelectorAll('[data-bayup-row="price"]').forEach(el => { el.textContent = fmt(item.price); });
                    clone.querySelectorAll('[data-bayup-row="qty"]').forEach(el => { el.textContent = String(item.quantity); });
                    clone.querySelectorAll('[data-bayup-row="subtotal"]').forEach(el => { el.textContent = fmt(item.price * item.quantity); });
                    cartBody.appendChild(clone);
                });
            }
        }
        root.querySelectorAll('[data-bayup="cart-subtotal"], [data-bayup="cart-total"]').forEach(el => { el.textContent = fmt(cartTotal); });

        const NAV_VIEW: Record<string, string> = { 'nav-home': '', 'nav-catalog': 'catalog', 'nav-contact': 'contact', 'nav-privacy': 'privacy', 'nav-cart': 'cart' };
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement)?.closest('[data-bayup-action]') as HTMLElement | null;
            if (!target || !root.contains(target)) return;
            const action = target.dataset.bayupAction || '';
            if (action in NAV_VIEW) {
                e.preventDefault();
                const v = NAV_VIEW[action];
                router.push(v ? `/shop/${slug}?view=${v}` : `/shop/${slug}`);
                return;
            }
            if (action === 'nav-product') {
                e.preventDefault();
                const pid = target.dataset.productId;
                if (pid) router.push(`/shop/${slug}?view=product&id=${pid}`);
                return;
            }
            if (action === 'add-to-cart') {
                e.preventDefault();
                const pid = target.dataset.productId || (productId as string | undefined);
                const product = products.find(x => String(x.id) === String(pid));
                if (product) {
                    // addItem directo (mismo patrón que el sistema de bloques en
                    // HighFidelityBlocks.tsx) — no addToCart(): esa función valida
                    // stock contra product.variants, pero el listado público de
                    // productos nunca incluye variants, así que ese chequeo
                    // siempre falla y bloquearía el carrito para cualquier producto.
                    const imgSrc = imgOf(product);
                    addItem({
                        id: product.id,
                        title: product.name,
                        price: product.price,
                        image: imgSrc || '',
                        quantity: 1,
                        tenant_id: shopData.id,
                        owner_id: shopData.owner_id,
                    });
                }
                return;
            }
            if (action === 'checkout') {
                e.preventDefault();
                if (cart.length === 0) return;
                setIsCheckoutOpen(true);
            }
        };
        root.addEventListener('click', handleClick);
        return () => root.removeEventListener('click', handleClick);
    }, [shopData.custom_html, shopData.products, shopData.full_name, shopData.phone, cart, cartTotal, view, productId, slug, router]);

    const extractErrorMessage = async (res: Response, fallback: string) => {
        try {
            const err = await res.json();
            if (typeof err.detail === 'string') return err.detail;
            if (Array.isArray(err.detail)) return err.detail.map((d: any) => d.msg || JSON.stringify(d)).join('. ');
        } catch {}
        return fallback;
    };

    // El script del widget de Wompi carga en paralelo (async) — si el backend
    // responde muy rápido, puede que aún no esté listo. Esperamos un poco
    // antes de rendirnos, en vez de fallar de inmediato.
    const waitForWompiScript = async (maxWaitMs = 6000): Promise<boolean> => {
        const start = Date.now();
        while (typeof window.WidgetCheckout !== 'function') {
            if (Date.now() - start > maxWaitMs) return false;
            await new Promise(r => setTimeout(r, 150));
        }
        return true;
    };

    // Espera a que el backend confirme el pago vía webhook (única fuente de verdad).
    // El navegador nunca marca un pago como aprobado por su cuenta.
    const waitForPaymentConfirmation = async (apiBase: string, paymentId: string, maxTries = 10): Promise<any> => {
        for (let i = 0; i < maxTries; i++) {
            await new Promise(r => setTimeout(r, 1500));
            const res = await fetch(`${apiBase}/public/payment/${paymentId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'approved' || data.status === 'failed') return data;
            }
        }
        return null;
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setIsPlacingOrder(true);
        setPlacingOrderStep('creating');

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

            // BUSCAMOS EL VARIANT_ID CORRECTO
            // Para el Plan Básico, si no hay variantes seleccionadas, enviamos la primera disponible
            const itemsWithVariants = await Promise.all(cart.map(async (item) => {
                const prod = shopData.products.find((p: any) => p.id === item.id);
                const variantId = (prod?.variants && prod.variants.length > 0)
                    ? prod.variants[0].id
                    : item.id; // Fallback
                return { product_variant_id: variantId, quantity: item.quantity };
            }));

            const res = await fetch(`${apiBase}/public/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: shopData.id,
                    customer_name: customerData.name,
                    customer_phone: customerData.phone,
                    customer_email: customerData.email,
                    shipping_address: `${customerData.address}, ${customerData.city}`,
                    currency: 'COP',
                    items: itemsWithVariants,
                }),
            });

            if (!res.ok) {
                alert(`Error: ${await extractErrorMessage(res, 'No se pudo iniciar el pago.')}`);
                setIsPlacingOrder(false);
                setPlacingOrderStep('idle');
                return;
            }

            const config = await res.json();

            if (!config.public_key) {
                // Pasarela no disponible: no se puede cobrar en línea en este momento.
                alert(
                    'Los pagos en línea no están disponibles en este momento. ' +
                    (config.whatsapp_url ? 'Contacta directamente a la tienda para coordinar tu compra.' : 'Intenta de nuevo más tarde.')
                );
                if (config.whatsapp_url) window.open(config.whatsapp_url, '_blank');
                setIsPlacingOrder(false);
                setPlacingOrderStep('idle');
                return;
            }

            if (typeof window.WidgetCheckout !== 'function') {
                const ready = await waitForWompiScript();
                if (!ready) {
                    throw new Error('La pasarela de pago tardó demasiado en cargar. Recarga la página e intenta de nuevo.');
                }
            }

            // redirectUrl es obligatorio para métodos como transferencia bancaria/PSE:
            // esos flujos sacan al comprador del sitio para autenticarse con su banco,
            // por lo que el callback in-page nunca se ejecuta. Sin esto, Wompi lo deja
            // varado en su propia página de confirmación sin forma de volver a la tienda.
            const redirectUrl = `${window.location.origin}/pago/confirmando?payment_id=${config.payment_id}&slug=${slug}`;

            const checkout = new window.WidgetCheckout({
                currency: config.currency,
                amountInCents: config.amount_in_cents,
                reference: config.reference,
                publicKey: config.public_key,
                signature: { integrity: config.signature },
                redirectUrl,
                customerData: {
                    email: customerData.email,
                    fullName: customerData.name,
                    phoneNumber: customerData.phone.replace(/\D/g, ''),
                    phoneNumberPrefix: '+57',
                },
            });

            checkout.open(async (result: any) => {
                const clientStatus = result?.transaction?.status;
                if (clientStatus !== 'APPROVED') {
                    alert(`Pago no completado (${clientStatus || 'cancelado'}).`);
                    setIsPlacingOrder(false);
                    setPlacingOrderStep('idle');
                    return;
                }

                // El widget dice "aprobado", pero solo el webhook firmado de Wompi
                // confirma de verdad y crea el pedido — nunca confiamos en el navegador.
                setPlacingOrderStep('confirming');
                const confirmed = await waitForPaymentConfirmation(apiBase, config.payment_id);

                if (confirmed?.status === 'approved') {
                    clearCart();
                    setIsCheckoutOpen(false);
                    if (confirmed.order_id) {
                        router.push(`/pedido/${confirmed.order_id}`);
                    } else {
                        alert('¡Pago aprobado! Tu pedido está en camino.');
                    }
                } else {
                    alert('Tu pago está siendo verificado. Te notificaremos por correo en cuanto se confirme.');
                }
                setIsPlacingOrder(false);
                setPlacingOrderStep('idle');
            });

        } catch (error: any) {
            console.error('handlePlaceOrder error:', error);
            alert(`Error de conexión: ${error?.message || 'Intenta de nuevo.'}`);
            setIsPlacingOrder(false);
            setPlacingOrderStep('idle');
        }
    };

    // La primera vez que corre este efecto, los datos de `slug`+`view` con los
    // que se abrió la página ya vinieron resueltos desde el servidor
    // (initialShopData) — nos la saltamos para no repetir el fetch dos veces.
    // Cambios posteriores de vista/slug (navegación dentro de la SPA) sí
    // vuelven a pedir datos frescos al backend, igual que antes.
    const didConsumeInitialLoad = useRef(false);

    useEffect(() => {
        const fetchShop = async () => {
            setLoading(true);
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

                // 1. Cargamos info base de la tienda
                const res = await fetch(`${apiBase}/public/shop/${slug}`);
                if (res.ok) {
                    const data = await res.json();

                    // 2 y 3. Productos y diseño publicado solo dependen del id de la
                    // tienda (no uno del otro), asi que se piden en paralelo en vez
                    // de en cascada — reduce a la mitad el tiempo hasta que la
                    // tienda publica se ve completa.
                    // "cart" no es una página real persistida (su contenido es 100%
                    // dinámico, viene del carrito en memoria) — reutilizamos el
                    // header/footer ya publicados de "home" para mantener la misma
                    // navegación y pie de página en vez de pedir una página inexistente.
                    const pageKeyToFetch = view === 'cart' ? 'home' : view;
                    const [prodResult, pageResult] = await Promise.allSettled([
                        fetch(`${apiBase}/public/stores/${data.id}/products`),
                        fetch(`${apiBase}/public/stores/${data.id}/pages/${pageKeyToFetch}`),
                    ]);

                    if (prodResult.status === 'fulfilled' && prodResult.value.ok) {
                        data.products = await prodResult.value.json();
                    } else if (prodResult.status === 'rejected') {
                        console.error("Error cargando productos", prodResult.reason);
                    }

                    if (pageResult.status === 'fulfilled' && pageResult.value.ok) {
                        const pageData = await pageResult.value.json();
                        const sd = pageData?.schema_data;
                        if (sd && (sd.header || sd.body || sd.footer)) {
                            data.custom_schema = sd;
                        }
                        // Plantilla tipo HTML: no tiene schema_data, el backend
                        // devuelve el HTML crudo de esta página puntual.
                        if (pageData && pageData.html) {
                            data.custom_html = pageData.html;
                        }
                    } else if (pageResult.status === 'rejected') {
                        console.warn(`Diseño para vista ${view} no publicado.`);
                    }

                    setShopData(data);
                }
            } catch (error) {
                console.error("Failed to fetch shop", error);
            } finally {
                setLoading(false);
            }
        };

        if (!didConsumeInitialLoad.current) {
            didConsumeInitialLoad.current = true;
            if (initialShopData) {
                setLoading(false);
                return;
            }
        }

        if (slug) fetchShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, view]);

    // Registra la vista una vez que se confirma que la tienda existe —
    // evita ensuciar la analítica con slugs inválidos.
    useEffect(() => {
        if (!loading && shopData && typeof slug === 'string') {
            const path = `/shop/${slug}${view !== 'home' ? `?view=${view}` : ''}${productId ? `&id=${productId}` : ''}`;
            trackPageview(slug, path);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, view, productId, loading, !!shopData]);

    // "cart" reutiliza el header/footer de home (ver el fetch más arriba) pero
    // reemplaza el body por la página nativa de carrito — no hay shop_pages
    // real para "cart" porque su contenido es 100% dinámico (items en memoria).
    const canvasOverrideData = useMemo(() => {
        if (!shopData?.custom_schema) return shopData?.custom_schema;
        if (view !== 'cart') return shopData.custom_schema;
        return {
            header: shopData.custom_schema.header,
            footer: shopData.custom_schema.footer,
            body: { elements: [{ id: 'cart-page', type: 'cart-page', props: {} }], styles: {} },
        };
    }, [shopData?.custom_schema, view]);

    const filteredProducts = useMemo(() => {
        if (!shopData) return [];
        return (shopData.products || []).filter((p: any) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "all" || p.collection_id === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [shopData, searchTerm, selectedCategory]);

    // Registra el término buscado (debounced dentro de trackSearch) para
    // "Top búsquedas en tienda" en Estadísticas.
    useEffect(() => {
        if (typeof slug === 'string' && searchTerm.trim().length >= 2) {
            trackSearch(slug, searchTerm, filteredProducts.length);
        }
    }, [slug, searchTerm, filteredProducts.length]);

    const { scrollY } = useScroll();
    const navBg = useTransform(scrollY, [0, 100], ["rgba(255,255,255,0)", "rgba(255,255,255,0.95)"]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#004d4d]" size={40}/></div>;
    if (!shopData) return <div className="h-screen flex items-center justify-center">Tienda no encontrada</div>;

    return (
        <LazyMotion features={domAnimation}>
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-[#00f2ff] selection:text-black relative">

            {/* --- NAVEGACIÓN UNIVERSAL --- */}
            {/* Oculta en páginas de plantilla HTML nativa (custom_html): ese
                HTML trae su propio header/nav — mostrar ambos duplicaría la
                barra superior. */}
            {!shopData.custom_html && (<>
            <m.nav style={{ backgroundColor: navBg }} className="fixed top-0 w-full z-[1000] border-b border-white/10 backdrop-blur-md h-20 lg:h-24 flex items-center px-4 lg:px-6">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-4 lg:gap-10 min-w-0">
                        <button onClick={() => setIsMenuOpen(o => !o)} className="lg:hidden h-10 w-10 -ml-2 rounded-xl flex items-center justify-center text-gray-700 shrink-0">
                            {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
                        </button>
                        <div onClick={() => router.push(`/shop/${slug}`)} className="flex items-center gap-3 cursor-pointer min-w-0">
                            <div className="h-9 w-9 lg:h-10 lg:w-10 bg-[#004d4d] rounded-xl flex items-center justify-center text-[#00f2ff] font-black shrink-0">{shopData.full_name?.charAt(0) || 'B'}</div>
                            <h1 className="text-base lg:text-xl font-black italic uppercase tracking-tighter truncate">{shopData.full_name}</h1>
                        </div>
                        <nav className="hidden lg:flex items-center gap-8">
                            <button onClick={() => router.push(`/shop/${slug}?view=home`)} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${view === 'home' ? 'text-[#004d4d]' : 'text-gray-400 hover:text-black'}`}>Inicio</button>
                            <button onClick={() => router.push(`/shop/${slug}?view=catalog`)} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${view === 'catalog' ? 'text-[#004d4d]' : 'text-gray-400 hover:text-black'}`}>Catálogo</button>
                            <button onClick={() => router.push(`/shop/${slug}?view=about`)} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${view === 'about' ? 'text-[#004d4d]' : 'text-gray-400 hover:text-black'}`}>Nosotros</button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                        <div className="hidden md:flex items-center bg-gray-100 rounded-2xl px-4 h-12">
                            <Search size={16} className="text-gray-400" />
                            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); if(view !== 'catalog') router.push(`/shop/${slug}?view=catalog`); }} placeholder="Buscar producto..." className="bg-transparent border-none outline-none px-3 text-sm font-bold w-40 focus:w-60 transition-all" />
                        </div>
                        <button onClick={() => setIsCartOpen(true)} className="h-11 w-11 lg:h-14 lg:w-14 rounded-2xl bg-[#004d4d] text-[#00f2ff] flex items-center justify-center shadow-lg relative active:scale-90 transition-all">
                            <ShoppingBag size={20} className="lg:hidden" />
                            <ShoppingBag size={24} className="hidden lg:block" />
                            {cart.length > 0 && <span className="absolute -top-2 -right-2 h-6 w-6 bg-[#00f2ff] text-[#004d4d] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
                        </button>
                    </div>
                </div>
            </m.nav>

            {/* --- MENÚ MÓVIL --- */}
            <AnimatePresence>
                {isMenuOpen && (
                    <m.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="lg:hidden fixed top-20 left-0 w-full z-[999] bg-white border-b border-gray-100 shadow-xl px-6 py-6 space-y-4"
                    >
                        <div className="flex items-center bg-gray-100 rounded-2xl px-4 h-12">
                            <Search size={16} className="text-gray-400" />
                            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); if(view !== 'catalog') router.push(`/shop/${slug}?view=catalog`); }} placeholder="Buscar producto..." className="bg-transparent border-none outline-none px-3 text-sm font-bold w-full" />
                        </div>
                        {[['home','Inicio'],['catalog','Catálogo'],['about','Nosotros']].map(([v, label]) => (
                            <button key={v} onClick={() => { router.push(`/shop/${slug}?view=${v}`); setIsMenuOpen(false); }}
                                className={`w-full text-left py-3 text-sm font-black uppercase tracking-widest transition-colors ${view === v ? 'text-[#004d4d]' : 'text-gray-400'}`}>
                                {label}
                            </button>
                        ))}
                    </m.div>
                )}
            </AnimatePresence>
            </>)}

            {/* --- PANEL DE FILTROS (GLASSMORPHISM) --- */}
            <AnimatePresence>
                {isFiltersOpen && (
                    <div className="fixed inset-0 z-[2000] flex justify-end">
                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFiltersOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <m.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="relative w-80 bg-white/95 backdrop-blur-3xl h-screen shadow-2xl p-10 flex flex-col border-l border-white/20">
                            <div className="flex items-center justify-between mb-12">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Filtros</h3>
                                <button onClick={() => setIsFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20}/></button>
                            </div>
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nuestras Líneas</p>
                                    <div className="space-y-2">
                                        <button onClick={() => setSelectedCategory('all')} className={`w-full text-left p-4 rounded-2xl text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>Todos los productos</button>
                                        {shopData.categories?.map((cat: any) => (
                                            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full text-left p-4 rounded-2xl text-xs font-bold transition-all ${selectedCategory === cat.id ? 'bg-[#004d4d] text-white shadow-xl' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{cat.title}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsFiltersOpen(false)} className="mt-auto py-5 bg-gray-900 text-[#00f2ff] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Ver Resultados</button>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MOTOR DE RENDERIZADO (STUDIO VS DEFAULT) --- */}
            <main className={shopData.custom_html ? '' : 'pt-20 lg:pt-24 min-h-screen'}>
                {shopData.custom_html ? (
                    // Plantilla tipo HTML curada por el equipo Bayup (no es
                    // contenido subido por el usuario final, por eso el
                    // riesgo de inyección es bajo) — se renderiza tal cual.
                    <div ref={customHtmlRef} dangerouslySetInnerHTML={{ __html: shopData.custom_html }} />
                ) : shopData.custom_schema ? (
                    <StudioProvider>
                        <Canvas
                            overrideData={canvasOverrideData}
                            isPreview={true}
                            initialProducts={shopData.products}
                            initialCategories={shopData.categories}
                            onOpenCart={() => setIsCartOpen(true)}
                            tenantId={shopData.owner_id}
                            productId={productId}
                            hideHeader
                        />
                    </StudioProvider>
                ) : (
                    view === 'home' ? (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="max-w-7xl mx-auto px-6 py-24 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#004d4d] mb-4">{shopData.category || 'Tienda Bayup'}</p>
                                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">{shopData.full_name}</h1>
                                <p className="text-gray-400 mt-6 font-medium text-lg max-w-xl mx-auto">Descubre nuestra selección de productos, pensados para ti.</p>
                                <button onClick={() => router.push(`/shop/${slug}?view=catalog`)} className="mt-10 inline-flex items-center gap-3 px-10 py-5 bg-gray-900 text-[#00f2ff] rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black hover:-translate-y-1 transition-all">Ver Catálogo <ArrowRight size={16}/></button>
                            </div>
                            {(shopData.products || []).length > 0 && (
                                <div className="max-w-7xl mx-auto px-6 pb-24">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Destacados</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                                        {(shopData.products || []).slice(0, 4).map((product: any) => {
                                            const imgSrc = Array.isArray(product.image_url) ? product.image_url[0] : product.image_url;
                                            return (
                                                <div key={product.id} onClick={() => router.push(`/shop/${slug}?view=product&id=${product.id}`)} className="bg-white rounded-[3.5rem] p-5 border border-gray-100 shadow-sm group cursor-pointer hover:shadow-2xl transition-all duration-500">
                                                    <div className="aspect-[4/5] bg-gray-50 rounded-[2.8rem] mb-8 overflow-hidden relative">
                                                        {imgSrc ? (
                                                            <Image src={imgSrc} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-gray-200"><ImageIcon size={40}/></div>
                                                        )}
                                                    </div>
                                                    <div className="px-2 space-y-2">
                                                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-tight line-clamp-1">{product.name}</h4>
                                                        <p className="text-2xl font-black text-[#004d4d] tracking-tighter">${Number(product.price).toLocaleString('es-CO')}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>
                    ) : view === 'about' ? (
                        <section className="max-w-3xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#004d4d] mb-4">Sobre Nosotros</p>
                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-tight">{shopData.full_name}</h1>
                            <p className="text-gray-500 mt-6 font-medium text-lg leading-relaxed">
                                {shopData.category ? `Somos una tienda especializada en ${shopData.category}.` : 'Bienvenido a nuestra tienda.'} Trabajamos para ofrecerte productos de calidad y una experiencia de compra confiable.
                            </p>
                            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {shopData.hours && (
                                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Horario</p>
                                        <p className="text-sm font-bold text-gray-900">{shopData.hours}</p>
                                    </div>
                                )}
                                {shopData.phone && (
                                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Contacto</p>
                                        <p className="text-sm font-bold text-gray-900">{shopData.phone}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    ) : view === 'catalog' ? (
                        <section className="max-w-7xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                                <div>
                                    <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">Catálogo <br/> <span className="text-[#004d4d]">Completo</span></h2>
                                    <p className="text-gray-400 mt-4 font-medium italic text-lg">Descubre nuestra selección de curaduría experta.</p>
                                </div>
                                <button onClick={() => setIsFiltersOpen(true)} className="flex items-center gap-3 px-10 py-5 bg-white border border-gray-100 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"><Filter size={18} className="text-[#004d4d]"/> Filtrar Selección</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                                {filteredProducts.map((product: any) => {
                                    const imgSrc = Array.isArray(product.image_url) ? product.image_url[0] : product.image_url;
                                    return (
                                        <div key={product.id} onClick={() => router.push(`/shop/${slug}?view=product&id=${product.id}`)} className="bg-white rounded-[3.5rem] p-5 border border-gray-100 shadow-sm group cursor-pointer hover:shadow-2xl transition-all duration-500">
                                            <div className="aspect-[4/5] bg-gray-50 rounded-[2.8rem] mb-8 overflow-hidden relative">
                                                {imgSrc ? (
                                                    <Image src={imgSrc} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-200"><ImageIcon size={40}/></div>
                                                )}
                                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"><div className="h-12 w-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg"><Eye size={20} className="text-[#004d4d]"/></div></div>
                                            </div>
                                            <div className="px-2 space-y-2">
                                                <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-tight line-clamp-1">{product.name}</h4>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{shopData.categories?.find((c:any) => c.id === product.collection_id)?.title || 'Colección'}</p>
                                                <div className="flex items-center justify-between pt-4">
                                                    <p className="text-2xl font-black text-[#004d4d] tracking-tighter">${Number(product.price).toLocaleString('es-CO')}</p>
                                                    <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="h-14 w-14 rounded-2xl bg-gray-900 text-[#00f2ff] flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl"><Plus size={24}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ) : view === 'product' ? (() => {
                        const product = (shopData.products || []).find((p: any) => p.id === productId);
                        if (!product) return (
                            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
                                <p className="text-gray-400 font-bold">Producto no encontrado.</p>
                                <button onClick={() => router.push(`/shop/${slug}?view=catalog`)} className="text-[#004d4d] font-black text-sm underline">Volver al catálogo</button>
                            </div>
                        );
                        const images: string[] = Array.isArray(product.image_url) ? product.image_url : (product.image_url ? [product.image_url] : []);
                        return (
                            <section className="max-w-5xl mx-auto px-6 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-gray-700 font-black text-[10px] uppercase tracking-widest mb-10 transition-colors">
                                    <ChevronRight size={14} className="rotate-180"/> Volver
                                </button>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                    <div className="aspect-square bg-gray-50 rounded-[3rem] overflow-hidden relative">
                                        {images[0]
                                            ? <Image src={images[0]} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover"/>
                                            : <div className="h-full w-full flex items-center justify-center text-gray-200"><ImageIcon size={64}/></div>
                                        }
                                    </div>
                                    <div className="flex flex-col justify-center space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-[#004d4d] uppercase tracking-[0.3em] mb-3">
                                                {shopData.categories?.find((c:any) => c.id === product.collection_id)?.title || shopData.category || 'Producto'}
                                            </p>
                                            <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight">{product.name}</h1>
                                            {product.description && <p className="text-gray-500 mt-4 leading-relaxed">{product.description}</p>}
                                        </div>
                                        <p className="text-5xl font-black text-[#004d4d] tracking-tighter">${Number(product.price).toLocaleString('es-CO')}</p>
                                        <button
                                            onClick={() => { addToCart(product); setIsCartOpen(true); }}
                                            className="w-full h-16 rounded-3xl bg-gray-900 text-[#00f2ff] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black active:scale-95 transition-all shadow-2xl"
                                        >
                                            <ShoppingBag size={20}/> Agregar al carrito
                                        </button>
                                    </div>
                                </div>
                            </section>
                        );
                    })() : (
                        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
                            <p className="text-gray-400 font-bold">Vista no disponible.</p>
                            <button onClick={() => router.push(`/shop/${slug}`)} className="text-[#004d4d] font-black text-sm underline">Ir al inicio</button>
                        </div>
                    )
                )}
            </main>

            {/* --- FOOTER LEGAL --- */}
            {/* La plantilla HTML nativa ya trae su propio footer. */}
            {!shopData.custom_html && (shopData.terms_conditions || shopData.privacy_policy || shopData.return_policy || shopData.shipping_policy) && (
                <footer className="border-t border-gray-100 bg-white py-10 px-6">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[11px] text-gray-400 font-medium">© {new Date().getFullYear()} {shopData.full_name}. Todos los derechos reservados.</p>
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                            {(Object.keys(LEGAL_LABELS) as (keyof typeof LEGAL_LABELS)[]).map(key => shopData[key] && (
                                <button key={key} onClick={() => setLegalModalOpen(key)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#004d4d] transition-colors">
                                    {LEGAL_LABELS[key]}
                                </button>
                            ))}
                        </div>
                    </div>
                </footer>
            )}

            {/* --- COMPONENTES GLOBALES (SIEMPRE DISPONIBLES) --- */}

            {/* SIDEBAR CARRITO */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[3000] flex justify-end">
                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <m.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-white h-screen shadow-2xl flex flex-col">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#001A1A] text-white">
                                <h3 className="text-xl font-black uppercase italic tracking-widest">Tu Selección</h3>
                                <button onClick={() => setIsCartOpen(false)} className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><X size={20}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30"><ShoppingBag size={64}/><p className="text-[10px] font-black uppercase mt-4">Carrito Vacío</p></div>
                                ) : cart.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-[2rem] border border-gray-100">
                                        <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">{item.image ? <Image src={item.image} width={80} height={80} className="h-full w-full object-cover" alt={item.title}/> : <ShoppingBag size={24} className="text-gray-300"/>}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 line-clamp-1">{item.title}</p>
                                            <p className="text-xs font-bold text-[#004d4d] mt-1">${item.price.toLocaleString('es-CO')}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Cantidad: {item.quantity}</p>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-rose-500 self-center"><Trash2 size={18}/></button>
                                    </div>
                                ))}
                            </div>
                            {cart.length > 0 && (
                                <div className="p-8 border-t bg-gray-50/50 space-y-6">
                                    <div className="flex justify-between items-end"><p className="text-[10px] font-black text-gray-400 uppercase">Total Estimado</p><p className="text-3xl font-black text-gray-900 tracking-tighter">${cartTotal.toLocaleString('es-CO')}</p></div>
                                    <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full py-6 bg-gray-900 text-[#00f2ff] rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Finalizar Compra</button>
                                </div>
                            )}
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CHECKOUT — página completa estilo retail (no modal flotante) */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[4000] bg-gray-50 overflow-y-auto">

                        {/* Barra superior */}
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
                            <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
                                <button onClick={() => setIsCheckoutOpen(false)}
                                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#004d4d] transition-colors">
                                    <ArrowLeft size={16}/> <span className="hidden sm:inline">Volver a la tienda</span>
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 bg-[#004d4d] rounded-lg flex items-center justify-center text-[#00f2ff] font-black text-xs shrink-0">{shopData.full_name?.charAt(0) || 'B'}</div>
                                    <span className="text-sm font-black uppercase tracking-tight text-gray-800 hidden sm:inline">{shopData.full_name}</span>
                                </div>
                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <Lock size={11}/> <span className="hidden sm:inline">Compra segura</span>
                                </p>
                            </div>
                        </div>

                        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_380px] gap-10 px-5 sm:px-8 py-8 sm:py-12">

                            {/* Formulario */}
                            <div className="order-2 lg:order-1">
                                <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-1">Información de envío</h1>
                                <p className="text-sm text-gray-400 mb-8">Completa tus datos para coordinar la entrega y el pago.</p>

                                <form onSubmit={handlePlaceOrder} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Nombre completo</label>
                                        <input required placeholder="Ej. María Torres" value={customerData.name}
                                            onChange={e => setCustomerData({...customerData, name: e.target.value})}
                                            className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 focus:border-[#004d4d] focus:ring-2 focus:ring-[#004d4d]/10 outline-none text-sm font-medium text-gray-800 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">WhatsApp</label>
                                            <input required placeholder="300 000 0000" maxLength={10} value={customerData.phone}
                                                onChange={e => setCustomerData({...customerData, phone: e.target.value.replace(/\D/g,'')})}
                                                className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 focus:border-[#004d4d] focus:ring-2 focus:ring-[#004d4d]/10 outline-none text-sm font-medium text-gray-800 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Correo electrónico</label>
                                            <input required type="email" placeholder="tu@correo.com" value={customerData.email}
                                                onChange={e => setCustomerData({...customerData, email: e.target.value})}
                                                className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 focus:border-[#004d4d] focus:ring-2 focus:ring-[#004d4d]/10 outline-none text-sm font-medium text-gray-800 transition-all" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Dirección</label>
                                            <input required placeholder="Calle, número, barrio" value={customerData.address}
                                                onChange={e => setCustomerData({...customerData, address: e.target.value})}
                                                className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 focus:border-[#004d4d] focus:ring-2 focus:ring-[#004d4d]/10 outline-none text-sm font-medium text-gray-800 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Ciudad</label>
                                            <input required placeholder="Ej. Pereira" value={customerData.city}
                                                onChange={e => setCustomerData({...customerData, city: e.target.value})}
                                                className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 focus:border-[#004d4d] focus:ring-2 focus:ring-[#004d4d]/10 outline-none text-sm font-medium text-gray-800 transition-all" />
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isPlacingOrder}
                                        className="w-full h-14 bg-[#004d4d] text-white rounded-xl font-bold text-sm hover:bg-[#003838] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        {placingOrderStep === 'confirming' ? 'Confirmando pago…' : isPlacingOrder ? 'Procesando…' : <>Pagar ahora <ArrowRight size={16}/></>}
                                    </button>
                                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                                        <ShieldCheck size={13}/> Pago procesado de forma segura por Wompi
                                    </p>
                                </form>
                            </div>

                            {/* Resumen del pedido */}
                            <div className="order-1 lg:order-2">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-24">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 mb-5">Resumen del pedido</h2>
                                    <div className="space-y-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex gap-3">
                                                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                                                    {item.image ? <Image src={item.image} width={64} height={64} className="h-full w-full object-cover" alt={item.title}/> : <ShoppingBag size={18} className="text-gray-300"/>}
                                                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gray-800 text-white text-[10px] font-bold flex items-center justify-center">{item.quantity}</span>
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">{item.title}</p>
                                                </div>
                                                <p className="text-xs font-bold text-gray-600 shrink-0 self-center">${(item.price * item.quantity).toLocaleString('es-CO')}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-100 mt-5 pt-5 space-y-2.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="font-bold text-gray-700">${cartTotal.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Envío</span>
                                            <span className="font-bold text-gray-400">Se coordina con la tienda</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <span className="text-sm font-black text-gray-900">Total</span>
                                            <span className="text-xl font-black text-[#004d4d]">${cartTotal.toLocaleString('es-CO')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* MODAL LOGIN CLIENTE */}
            <AnimatePresence>
                {isClientLoginOpen && (
                    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClientLoginOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-xl" />
                        <m.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-white/20">
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
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL TEXTOS LEGALES */}
            <AnimatePresence>
                {legalModalOpen && (
                    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLegalModalOpen(null)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-sm" />
                        <m.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem] shadow-2xl p-8 sm:p-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">{LEGAL_LABELS[legalModalOpen]}</h3>
                                <button onClick={() => setLegalModalOpen(null)} className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"><X size={16}/></button>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{shopData[legalModalOpen]}</p>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{` .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; } `}</style>
        </div>
        </LazyMotion>
    );
}
