"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Theme {
    id: string;
    name: string;
    desc: string;
    image: string;
}

const FEATURED_THEMES: Theme[] = [
    { id: 't1', name: 'Minimalist Aura', desc: 'Limpio, moderno y enfocado en el producto.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&h=250&auto=format&fit=crop' },
    { id: 't2', name: 'Vogue Boutique', desc: 'Elegancia clásica para tiendas de moda.', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&h=250&auto=format&fit=crop' },
    { id: 't3', name: 'Tech Pulse', desc: 'Diseño oscuro y vibrante para tecnología.', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&h=250&auto=format&fit=crop' },
];

export default function MyStoreHub() {
    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-16 animate-in fade-in duration-700">
            {/* 1. Cabecera */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mi Tienda Online</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona el diseño y la apariencia de tu canal de ventas digital.</p>
                </div>
                <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Estado: En línea</span>
                </div>
            </div>

            {/* 2. CARD PRINCIPAL: EDITOR (Diseño Restaurado) */}
            <section className="space-y-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Editor de Sitio Web</h2>
                <div className="relative group overflow-hidden bg-white rounded-[3rem] border border-gray-100 shadow-2xl transition-all duration-500 hover:shadow-purple-500/10">
                    <div className="grid grid-cols-1 lg:grid-cols-5 h-full min-h-[400px]">
                        {/* Preview Thumbnail */}
                        <div className="lg:col-span-3 bg-gray-50 relative overflow-hidden border-r border-gray-50">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent z-10"></div>
                            <img 
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop" 
                                alt="Preview Editor" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="h-20 w-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-3xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">🎨</div>
                            </div>
                        </div>

                        {/* Info & Actions */}
                        <div className="lg:col-span-2 p-12 flex flex-col justify-center space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 leading-tight tracking-tighter">Editor Visual Pro</h3>
                                <p className="text-gray-500 mt-4 text-sm leading-relaxed font-medium">
                                    Modifica textos, imágenes y estructura de tu tienda en tiempo real. Todos los cambios se reflejan al instante en tu dominio.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Link href="/dashboard/pages" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-purple-100 flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest">
                                    <span>Personalizar diseño</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </Link>
                                <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest">
                                    Vista previa en vivo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. TEMAS SUGERIDOS */}
            <section className="space-y-8 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight italic">Temas Destacados</h3>
                        <p className="text-gray-500 text-sm mt-1 font-medium">Plantillas premium listas para usar.</p>
                    </div>
                    <Link href="/dashboard/pages/new" className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline">Ver tienda de temas →</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {FEATURED_THEMES.map((theme) => (
                        <div key={theme.id} className="group flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                            <div className="h-48 overflow-hidden relative">
                                <img src={theme.image} alt={theme.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-xl">Previsualizar</button>
                                </div>
                            </div>
                            <div className="p-8 space-y-3">
                                <h4 className="text-lg font-black text-gray-900">{theme.name}</h4>
                                <p className="text-gray-500 text-xs leading-relaxed font-medium">{theme.desc}</p>
                                <button className="w-full mt-4 py-3 border-2 border-gray-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:border-purple-600 group-hover:text-purple-600 transition-all">Usar este tema</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Banner IA */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10 shadow-2xl">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative z-10">✨</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight leading-tight">Optimización Web con IA</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl font-medium">Nuestras plantillas están conectadas al **Asistente IA**, permitiendo respuestas automáticas y personalización de contenido según el comportamiento de tus clientes.</p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black italic">SMART</div>
            </div>
        </div>
    );
}