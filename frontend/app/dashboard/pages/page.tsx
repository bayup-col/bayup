"use client";

import { useState } from 'react';
import Link from 'next/link';

interface WebPage {
    id: string;
    title: string;
    url: string;
    status: 'published' | 'draft';
    last_edit: string;
    is_home: boolean;
}

const MOCK_PAGES: WebPage[] = [
    { id: 'p1', title: 'Página de Inicio', url: '/', status: 'published', last_edit: 'Hoy, 10:30 AM', is_home: true },
    { id: 'p2', title: 'Nueva Colección 2024', url: '/verano', status: 'draft', last_edit: 'Ayer', is_home: false },
    { id: 'p3', title: 'Sobre Nosotros', url: '/nosotros', status: 'published', last_edit: 'Hace 3 días', is_home: false },
];

export default function PagesDashboard() {
    const [pages] = useState<WebPage[]>(MOCK_PAGES);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mis Páginas</h1>
                    <p className="text-gray-500 mt-2 font-medium italic">Diseña y gestiona la presencia web de tu marca.</p>
                </div>
                <Link 
                    href="/dashboard/pages/new"
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all"
                >
                    + Crear Nueva Página
                </Link>
            </div>

            {/* Listado de Páginas */}
            <div className="grid grid-cols-1 gap-6">
                {pages.map((page) => (
                    <div key={page.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-gray-50 rounded-[2rem] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📄</div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{page.title}</h3>
                                    {page.is_home && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-black uppercase rounded-md tracking-widest border border-purple-100">Home</span>}
                                </div>
                                <p className="text-xs text-gray-400 font-medium mt-1 italic">Ruta: {page.url}</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="text-right hidden md:block">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</p>
                                <span className={`text-[10px] font-black uppercase ${page.status === 'published' ? 'text-emerald-500' : 'text-amber-500'}`}>● {page.status === 'published' ? 'Publicada' : 'Borrador'}</span>
                            </div>
                            <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
                            <div className="flex gap-3">
                                <Link 
                                    href={`/dashboard/pages/${page.id}/edit`}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all"
                                >
                                    Editar Diseño
                                </Link>
                                <button className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all">🗑️</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Banner IA Visual */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative z-10">🎨</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight">Editor Visual No-Code</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
                        Crea experiencias de compra impactantes sin escribir una sola línea de código. Arrastra secciones, personaliza colores y conecta tus productos reales en segundos.
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black italic">BUILDER</div>
            </div>
        </div>
    );
}