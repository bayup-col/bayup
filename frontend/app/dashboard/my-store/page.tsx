"use client";

import { useState } from 'react';
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

// --- TEMAS MOCK ---
const FEATURED_THEMES = [
    { id: 't1', name: 'Aura Minimal', desc: 'Foco absoluto en producto. Estética zen.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop', color: 'bg-emerald-500' },
    { id: 't2', name: 'Cyber Tech', desc: 'Oscuro, vibrante y futurista.', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop', color: 'bg-blue-500' },
    { id: 't3', name: 'Vogue Pro', desc: 'Moda editorial de alta costura.', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop', color: 'bg-purple-500' },
];

export default function MyStoreHub() {
    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-16 animate-in fade-in duration-1000">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#A855F7]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Storefront Customizer</span>
                    </div>
                    <h1 className="text-6xl font-black italic text-gray-900 tracking-tighter uppercase leading-none">Mi <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-purple-600 to-purple-400">Tienda Online</span></h1>
                    <p className="text-gray-500 mt-4 font-medium text-lg italic max-w-2xl">Diseña una experiencia de compra <span className="text-gray-900 font-bold italic underline decoration-purple-500/30">legendaria</span> con el motor visual de Bayup.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 px-8 py-4 rounded-full border border-emerald-100 flex items-center gap-3 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Servidor Activo</span>
                    </div>
                </div>
            </div>

            {/* --- EDITOR BANNER (HERO) --- */}
            <section className="px-4">
                <div className="bg-white/80 backdrop-blur-3xl rounded-[4rem] border border-white/60 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12 pointer-events-none italic font-black text-[20rem]">WEB</div>
                    
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
                                        <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Sincronizado con Bayt AI</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Actions & Control */}
                        <div className="xl:col-span-2 p-12 lg:p-20 flex flex-col justify-center space-y-10">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter leading-tight">Editor Visual <span className="text-purple-600">Premium</span></h3>
                                <p className="text-gray-500 font-medium leading-relaxed italic text-lg">
                                    "Redefine la identidad de tu marca. Cada cambio se publica en <span className="text-gray-900 font-black underline decoration-purple-500/30">tiempo real</span>."
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Link href="/dashboard/pages">
                                    <button className="w-full h-20 bg-purple-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-purple-200 hover:bg-black hover:shadow-none transition-all flex items-center justify-center gap-4 group active:scale-95">
                                        <Paintbrush2 size={20} className="group-hover:rotate-12 transition-transform" />
                                        Lanzar Studio de Diseño
                                    </button>
                                </Link>
                                <button className="w-full h-16 bg-white border border-gray-100 text-gray-900 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95">
                                    <Globe size={16} className="text-purple-500" /> Ver Tienda Online
                                </button>
                            </div>

                            <div className="pt-10 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Monitor size={18}/></div>
                                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Smartphone size={18}/></div>
                                </div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Responsivo Nativo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TEMAS (COLLECTION) --- */}
            <section className="px-4 space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Galería de Temas</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Evoluciona tu estética con un clic</p>
                    </div>
                    <button className="h-12 px-8 bg-gray-50 text-gray-400 rounded-full font-black text-[9px] uppercase tracking-widest border border-gray-100 hover:text-purple-600 hover:border-purple-200 transition-all">Ver Catálogo Completo</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {FEATURED_THEMES.map((theme) => (
                        <motion.div 
                            key={theme.id}
                            whileHover={{ y: -10 }}
                            className="group bg-white rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
                        >
                            <div className="h-64 overflow-hidden relative">
                                <img src={theme.image} alt={theme.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                    <button className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">Vista Previa 360</button>
                                </div>
                            </div>
                            <div className="p-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-xl font-black text-gray-900 italic uppercase">{theme.name}</h4>
                                    <div className={`h-2 w-2 rounded-full ${theme.color} shadow-lg`} />
                                </div>
                                <p className="text-gray-500 text-xs leading-relaxed font-medium italic">"{theme.desc}"</p>
                                <button className="w-full mt-6 py-4 border-2 border-gray-50 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:border-purple-600 group-hover:text-purple-600 transition-all">Activar Estilo</button>
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
                            <span className="px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-purple-500/20">Bayt UI Intelligence</span>
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-400">Optimización Cognitiva</h3>
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
