"use client";

import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Globe, 
  Home,
  Layout,
  ChevronRight,
  Settings2,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { useEffect, useState } from 'react';

export default function PagesDashboard() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [pages, setPages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveTemplate, setHasActiveTemplate] = useState(false);

    useEffect(() => {
        const fetchState = async () => {
            if (!token) return;
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                
                // 1. Verificamos si hay una página de inicio configurada (indicador de plantilla activa)
                const resStatus = await fetch(`${apiBase}/shop-pages/home`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (resStatus.ok) {
                    const statusData = await resStatus.json();
                    if (statusData.schema_data) {
                        setHasActiveTemplate(true);
                        
                        // Generamos las páginas maestras dinámicamente para el listado
                        const masterPages = [
                            { id: 'p1', title: 'Página de Inicio', url: '/', key: 'home', icon: <Home size={32}/>, desc: 'Escaparate principal y aterrizaje de campañas.' },
                            { id: 'p2', title: 'Detalle de Producto', url: '/product/slug', key: 'product_detail', icon: <Layout size={32}/>, desc: 'Alta conversión: Fotos izq, Info der y carrusel de similares.' },
                            { id: 'p3', title: 'Catálogo & Colecciones', url: '/shop', key: 'catalog', icon: <Globe size={32}/>, desc: 'Buscador pro y filtros inteligentes con panel lateral desenfocado.' },
                            { id: 'p4', title: 'Checkout & Pago', url: '/checkout', key: 'checkout', icon: <Settings2 size={32}/>, desc: 'Proceso de pago optimizado: Identificación vs Resumen de compra.' },
                            { id: 'p5', title: 'Nosotros / Contacto', url: '/about', key: 'about', icon: <FileText size={32}/>, desc: 'Información de marca, ubicación y canales de contacto.' }
                        ];
                        setPages(masterPages);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchState();
    }, [token]);

    const handleViewPage = (pageUrl: string) => {
        const savedSettings = localStorage.getItem('bayup_general_settings');
        let slug = "preview";
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                slug = parsed.contact?.shop_slug || "preview";
            } catch (e) {}
        }
        window.open(`/shop/${slug}${pageUrl === '/' ? '' : pageUrl}`, '_blank');
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-[#00f2ff]" size={48} />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Consultando Arquitecturas...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4">
                <div>
                    <h1 className="text-5xl font-black text-[#004d4d] tracking-tight uppercase italic">Mis Páginas</h1>
                    <p className="text-gray-500 mt-2 font-medium text-lg italic">Gestiona el contenido y la arquitectura de tu sitio web.</p>
                </div>
                <Link href="/dashboard/my-store/templates">
                    <button className="h-14 px-10 bg-[#004d4d] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
                        <Sparkles size={18} className="text-[#00f2ff]" />
                        Explorar Plantillas
                    </button>
                </Link>
            </div>

            {/* --- LISTADO DE PÁGINAS --- */}
            <div className="space-y-12 px-4">
                {pages.length === 0 ? (
                    <div className="relative group p-[2px] overflow-hidden rounded-[4rem] transition-all duration-500 shadow-2xl">
                        <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,#00f2ff_20deg,transparent_40deg,#00f2ff_60deg,transparent_80deg)] animate-aurora pointer-events-none opacity-40" />
                        <div className="relative bg-white p-20 rounded-[3.9rem] text-center space-y-8">
                            <div className="h-24 w-24 bg-[#004d4d]/5 rounded-[2.5rem] flex items-center justify-center mx-auto text-[#004d4d]">
                                <Layout size={48} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">¡Dale vida a tu tienda!</h2>
                                <p className="text-gray-400 max-w-lg mx-auto font-medium text-lg italic">No tienes un diseño activo. Elige una de nuestras plantillas inteligentes y lánzate al mercado en minutos.</p>
                            </div>
                            <Link href="/dashboard/my-store/templates" className="inline-block">
                                <button className="h-16 px-12 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-[#004d4d] transition-all flex items-center gap-4 group">
                                    Ver Catálogo de Diseños
                                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform text-[#00f2ff]"/>
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    pages.map((page, i) => (
                        <motion.div 
                            key={page.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative group p-[2px] overflow-hidden rounded-[4rem] transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,242,255,0.15)]"
                        >
                            <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,#00f2ff_20deg,transparent_40deg,#00f2ff_60deg,transparent_80deg)] animate-aurora pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
                            <div className="relative bg-white p-10 rounded-[3.9rem] flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                <div className="flex items-center gap-8 flex-1">
                                    <div className={`h-24 w-24 rounded-[3rem] flex items-center justify-center shadow-inner transition-all group-hover:scale-110 duration-500 bg-gray-50 text-gray-400 group-hover:bg-[#004d4d]/5 group-hover:text-[#004d4d]`}>
                                        {page.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">{page.title}</h3>
                                            <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">Configurada</span>
                                        </div>
                                        <p className="text-lg font-medium italic text-gray-400 mt-2">{page.desc}</p>
                                        <p className="text-xs font-bold text-[#00f2ff] mt-2 flex items-center gap-2">
                                            <Globe size={14}/> bayup.com<span className="text-[#004d4d]">{page.url}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 relative z-10">
                                    <Link 
                                        href={`/dashboard/pages/studio?page=${page.key}`} 
                                        className="flex-1 lg:flex-none"
                                    >
                                        <button className="w-full lg:w-auto h-16 px-12 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#004d4d] transition-all flex items-center justify-center gap-3 group/btn active:scale-95">
                                            Personalizar Página
                                            <Edit3 size={16} className="text-[#00f2ff] group-hover/btn:rotate-12 transition-transform"/>
                                        </button>
                                    </Link>
                                    <button 
                                        onClick={() => handleViewPage(page.url)}
                                        className="h-16 w-16 bg-white border border-gray-100 rounded-3xl flex items-center justify-center text-gray-400 hover:text-[#00f2ff] hover:border-[#00f2ff] transition-all shadow-sm"
                                    >
                                        <ExternalLink size={24} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <style jsx global>{`
                @keyframes aurora-border {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                .animate-aurora {
                    animation: aurora-border 4s linear infinite;
                }
            `}</style>
        </div>
    );
}
