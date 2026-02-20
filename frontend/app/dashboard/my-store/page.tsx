"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  ExternalLink, 
  Layout, 
  Sparkles, 
  Monitor, 
  Smartphone, 
  Settings2, 
  Layers, 
  ChevronRight,
  Eye,
  CheckCircle2,
  Rocket,
  MousePointer2,
  Paintbrush2,
  Globe,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export default function MyStoreHub() {
    const { token } = useAuth();
    const [featuredTemplates, setFeaturedTemplates] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchTopTemplates = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiBase}/web-templates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFeaturedTemplates(data.slice(0, 4)); // Mostramos 4 temas destacados
                }
            } catch (err) { console.error(err); }
        };
        if (token) fetchTopTemplates();
    }, [token]);

    const handleViewStore = () => {
        const savedSettings = localStorage.getItem('bayup_general_settings');
        let slug = "preview";
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                slug = parsed.contact?.shop_slug || "preview";
            } catch (e) {}
        }
        window.open(`/shop/${slug}`, '_blank');
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-16 animate-in fade-in duration-1000">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#A855F7]"></span>
                        <span className="text-[10px] font-black tracking-[0.3em] text-gray-400">Storefront customizer</span>
                    </div>
                    <h1 className="text-6xl font-black italic text-gray-900 tracking-tighter leading-none">Mi <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-purple-600 to-purple-400">tienda online</span></h1>
                    <p className="text-gray-500 mt-4 font-medium text-lg italic max-w-2xl">Diseña una experiencia de compra <span className="text-gray-900 font-bold italic underline decoration-purple-500/30">legendaria</span> con el motor visual de Bayup.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 px-8 py-4 rounded-full border border-emerald-100 flex items-center gap-3 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                        <span className="text-[10px] font-black text-emerald-700 tracking-widest">Servidor activo</span>
                    </div>
                </div>
            </div>

            {/* --- EDITOR BANNER (HERO) --- */}
            <section className="px-4">
                <div className="bg-white/80 backdrop-blur-3xl rounded-[4rem] border border-white/60 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12 pointer-events-none italic font-black text-[20rem]">Web</div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-5 min-h-[550px]">
                        {/* Live Preview Mockup */}
                        <div className="xl:col-span-3 p-12 lg:p-20 bg-gray-50/50 flex items-center justify-center relative overflow-hidden border-r border-gray-100">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.05)_0%,_transparent_70%)]"></div>
                            
                            <motion.div 
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative z-10 w-full max-w-3xl aspect-[16/10] bg-white rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden group-hover:scale-[1.02] transition-transform duration-700"
                            >
                                <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-rose-400" />
                                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                    <div className="ml-4 h-3 w-40 bg-gray-200 rounded-full" />
                                </div>
                                <img 
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop" 
                                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000"
                                    alt="Live Website"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-10">
                                    <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[9px] font-black text-gray-900 tracking-widest">Sincronizado con Bayt AI</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Actions & Control */}
                        <div className="xl:col-span-2 p-12 lg:p-20 flex flex-col justify-center space-y-10">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black text-gray-900 italic tracking-tighter leading-tight">Editor visual <span className="text-purple-600">premium</span></h3>
                                <p className="text-gray-500 font-medium leading-relaxed italic text-lg">
                                    "Redefine la identidad de tu marca. Cada cambio se publica en <span className="text-gray-900 font-black underline decoration-purple-500/30">tiempo real</span>."
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Link href="/dashboard/pages">
                                    <button className="w-full h-20 bg-purple-600 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] shadow-2xl shadow-purple-200 hover:bg-black hover:shadow-none transition-all flex items-center justify-center gap-4 group active:scale-95">
                                        <Paintbrush2 size={20} className="group-hover:rotate-12 transition-transform" />
                                        Personalizar página web
                                    </button>
                                </Link>
                                <button 
                                    onClick={handleViewStore}
                                    className="w-full h-16 bg-white border border-gray-100 text-gray-900 rounded-[1.8rem] font-black text-[10px] tracking-[0.2em] shadow-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Eye size={16} className="text-purple-500" /> Ver tienda online
                                </button>
                            </div>

                            <div className="pt-10 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Monitor size={18}/></div>
                                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Smartphone size={18}/></div>
                                </div>
                                <p className="text-[10px] font-black text-gray-300 tracking-widest italic">Responsivo nativo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TEMAS (COLLECTION) --- */}
            <section className="px-4 space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Galería de temas</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1 w-12 bg-[#00f2ff] rounded-full" />
                            <p className="text-gray-400 text-[10px] font-black tracking-widest uppercase">Arquitecturas maestras disponibles</p>
                        </div>
                    </div>
                    <Link href="/dashboard/my-store/templates">
                        <button className="group relative px-10 py-5 bg-[#004d4d] text-white rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase overflow-hidden shadow-[0_20px_40px_rgba(0,77,77,0.2)] hover:shadow-[#00f2ff]/20 transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00f2ff]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3 relative z-10">
                                <Layout size={18} className="text-[#00f2ff]" />
                                Ver catálogo completo
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {featuredTemplates.map((theme) => (
                        <motion.div 
                            key={theme.id}
                            whileHover={{ y: -12 }}
                            className="group bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
                        >
                            <div className="h-56 overflow-hidden relative bg-gray-50">
                                <img src={theme.preview_url || theme.thumbnail} alt={theme.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#004d4d]/80 via-[#004d4d]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <Link href="/dashboard/my-store/templates" className="w-full">
                                        <button className="w-full py-3 bg-[#00f2ff] text-[#004d4d] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">Instalar ahora</button>
                                    </Link>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter italic">{theme.name}</h4>
                                    <div className="px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Premium</span>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-[11px] leading-relaxed font-medium italic line-clamp-3">"{theme.description}"</p>
                                
                                <div className="mt-auto pt-6">
                                    <Link href="/dashboard/my-store/templates">
                                        <button className="w-full py-3 border border-gray-100 rounded-xl text-[9px] font-black tracking-[0.1em] text-gray-400 group-hover:bg-gray-50 group-hover:text-[#004d4d] transition-all uppercase">Ver detalles</button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- SMART BANNER IA --- */}
            <div className="px-4">
                <div className="bg-[#001a1a] rounded-[4rem] p-16 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000"><Bot size={300} /></div>
                    <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                        <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-purple-500/50 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            <Sparkles size={64} className="text-purple-400" />
                        </div>
                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <span className="px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black tracking-[0.4em] border border-purple-500/20">Bayt UI intelligence</span>
                            <h3 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-400">Optimización cognitiva</h3>
                            <p className="text-gray-400 text-lg font-medium leading-relaxed italic max-w-3xl">
                                "Tus páginas ahora son inteligentes. Bayt analiza el comportamiento del usuario en tiempo real y <span className="text-purple-400 font-black">reordena automáticamente</span> tus productos para maximizar la conversión."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
