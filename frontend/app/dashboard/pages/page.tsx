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
  Settings2
} from 'lucide-react';
import Link from 'next/link';

// --- MOCK DATA ---
const MOCK_PAGES = [
    { id: 'p1', title: 'Página de Inicio', url: '/', status: 'published', is_home: true },
    { id: 'p2', title: 'Colecciones', url: '/colecciones', status: 'draft', is_home: false },
    { id: 'p3', title: 'Sobre la Marca', url: '/nosotros', status: 'published', is_home: false },
    { id: 'p4', title: 'Políticas & Legal', url: '/legal', status: 'published', is_home: false },
];

export default function PagesDashboard() {
    return (
        <div className="max-w-[1200px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000">
            
            {/* --- HEADER SIMPLE & PODEROSO --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4">
                <div>
                    <h1 className="text-5xl font-black text-[#004d4d] tracking-tight uppercase italic">Mis Páginas</h1>
                    <p className="text-gray-500 mt-2 font-medium text-lg italic">Gestiona el contenido y la arquitectura de tu sitio web.</p>
                </div>
                <Link href="/dashboard/pages/new">
                    <button className="h-14 px-10 bg-[#004d4d] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
                        <Plus size={18} className="text-[#00f2ff]" />
                        Crear Nueva Página
                    </button>
                </Link>
            </div>

            {/* --- LISTADO DE PÁGINAS CON EFECTO AURA --- */}
            <div className="space-y-12 px-4">
                {MOCK_PAGES.map((page, i) => (
                    <motion.div 
                        key={page.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative group p-[2px] overflow-hidden rounded-[4rem] transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,242,255,0.15)]"
                    >
                        {/* Capa de Aura Neón (Línea corriendo por los bordes) */}
                        <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,#00f2ff_20deg,transparent_40deg,#00f2ff_60deg,transparent_80deg)] animate-aurora pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        {/* Contenido del Card (Sobre el Aura) */}
                        <div className="relative bg-white/90 backdrop-blur-2xl p-10 rounded-[3.9rem] flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                            <div className="flex items-center gap-8">
                                <div className={`h-20 w-20 rounded-[2.5rem] flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 duration-500 ${page.is_home ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-400'}`}>
                                    {page.is_home ? <Home size={32}/> : <FileText size={32}/>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">{page.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            page.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {page.status === 'published' ? 'Publicada' : 'Borrador'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 mt-2 flex items-center gap-2">
                                        <Globe size={14} className="text-[#00f2ff]"/> bayup.com<span className="text-[#004d4d]">{page.url}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 relative z-10">
                                <Link href={`/dashboard/pages/${page.id}/edit`} className="flex-1 lg:flex-none">
                                    <button className="w-full lg:w-auto h-14 px-10 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#004d4d] transition-all flex items-center justify-center gap-3 group/btn active:scale-95">
                                        Personalizar Diseño
                                        <Edit3 size={14} className="text-[#00f2ff] group-hover/btn:rotate-12 transition-transform"/>
                                    </button>
                                </Link>
                                <button className="h-14 w-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#00f2ff] hover:border-[#00f2ff] transition-all shadow-sm">
                                    <ExternalLink size={20} />
                                </button>
                                <button className="h-14 w-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
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