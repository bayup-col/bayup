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
                const res = await fetch(`${apiBase}/super-admin/web-templates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFeaturedTemplates(data.slice(0, 3)); // Mostramos solo las 3 más nuevas como destacadas
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
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Galería de temas</h2>
                        <p className="text-gray-400 text-[10px] font-black tracking-widest mt-1">Evoluciona tu estética con un clic</p>
                    </div>
                    <Link href="/dashboard/my-store/templates">
                        <button className="h-12 px-8 bg-gray-50 text-gray-400 rounded-full font-black text-[9px] tracking-widest border border-gray-100 hover:text-purple-600 hover:border-purple-200 transition-all">Ver catálogo completo</button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {featuredTemplates.map((theme) => (
                        <motion.div 
                            key={theme.id}
                            whileHover={{ y: -10 }}
                            className="group bg-white rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
                        >
                            <div className="h-64 overflow-hidden relative">
                                <img src={theme.preview_url} alt={theme.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                    <Link href="/dashboard/my-store/templates" className="w-full">
                                        <button className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">Vista previa & Activar</button>
                                    </Link>
                                </div>
                            </div>
                            <div className="p-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-xl font-black text-gray-900 italic">{theme.name}</h4>
                                    <div className={`h-2 w-2 rounded-full bg-cyan shadow-lg`} />
                                </div>
                                <p className="text-gray-500 text-xs leading-relaxed font-medium italic">"{theme.description}"</p>
                                <Link href="/dashboard/my-store/templates">
                                    <button className="w-full mt-6 py-4 border-2 border-gray-50 rounded-2xl text-[9px] font-black tracking-[0.2em] text-gray-400 group-hover:border-[#004d4d] group-hover:text-[#004d4d] transition-all uppercase">Personalizar este diseño</button>
                                </Link>
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
