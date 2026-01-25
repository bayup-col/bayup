"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Template {
    id: string;
    name: string;
    category: string;
    image: string;
    description: string;
    color: string;
}

const TEMPLATES: Template[] = [
    { id: 't1', name: 'Minimal Luxe', category: 'Fashion', image: '👗', description: 'Diseño limpio con tipografías serif elegantes. Ideal para marcas de lujo.', color: 'bg-slate-900' },
    { id: 't2', name: 'Tech Dynamic', category: 'Electrónica', image: '📱', description: 'Alto contraste, modo oscuro y grids futuristas para gadgets.', color: 'bg-blue-600' },
    { id: 't3', name: 'Organic Fresh', category: 'Belleza / Salud', image: '🌿', description: 'Tonos pasteles y bordes redondeados. Transmite calma y confianza.', color: 'bg-emerald-500' },
    { id: 't4', name: 'Street Vibe', category: 'Urbano', image: '🛹', description: 'Estilo tipográfico agresivo y layouts asimétricos.', color: 'bg-orange-500' },
    { id: 't5', name: 'Corporate Pro', category: 'B2B', image: '🏢', description: 'Estructura sólida enfocada en servicios y confianza empresarial.', color: 'bg-indigo-900' },
    { id: 't6', name: 'Kids Playground', category: 'Infantil', image: '🎨', description: 'Colores vibrantes y elementos lúdicos para jugueterías.', color: 'bg-pink-400' },
];

export default function NewPageTemplates() {
    const [selectedCat, setSelectedCategory] = useState('Todos');

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Biblioteca de Plantillas</h1>
                    <p className="text-gray-500 mt-2 font-medium italic">Selecciona un punto de partida para tu nueva página.</p>
                </div>
                <Link href="/dashboard/pages" className="px-6 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">← Volver al Dashboard</Link>
            </div>

            {/* Filtros de Categoría */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {['Todos', 'Fashion', 'Electrónica', 'Belleza / Salud', 'Urbano', 'B2B'].map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedCat === cat ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid de Plantillas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {TEMPLATES.filter(t => selectedCat === 'Todos' || t.category === selectedCat).map((t) => (
                    <div key={t.id} className="group cursor-pointer">
                        <div className="relative aspect-[4/3] bg-gray-50 rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
                            <div className={`absolute inset-0 ${t.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-700">
                                {t.image}
                            </div>
                            {/* Overlay de Acción */}
                            <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                                <Link 
                                    href={`/dashboard/pages/${t.id}/edit`}
                                    className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transform scale-90 group-hover:scale-100 transition-all duration-500"
                                >
                                    Usar esta Plantilla
                                </Link>
                            </div>
                        </div>
                        <div className="mt-6 px-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.name}</h3>
                                <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase tracking-tighter">{t.category}</span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-2">{t.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}