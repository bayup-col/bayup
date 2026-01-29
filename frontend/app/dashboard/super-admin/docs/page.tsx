"use client";

import { useState } from 'react';
import { 
    Book, 
    Search, 
    FileText, 
    Zap, 
    ChevronRight, 
    PlayCircle,
    HelpCircle,
    Edit3
} from 'lucide-react';

export default function GlobalDocs() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Documentación del Equipo</h1>
                    <p className="text-gray-500 mt-1 font-medium">Procedimientos, guías y runbooks oficiales.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 shadow-sm hover:bg-gray-50 transition-all">
                        <Edit3 size={14} /> Editar Base de Conocimiento
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <input type="text" placeholder="¿Qué estás buscando? (Ej: Onboarding de empresas)" className="w-full p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-all" />
                <Search size={20} className="absolute right-8 top-6 text-gray-400" />
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'Operaciones', items: ['Activación de empresas', 'Gestión de disputas', 'Pagos a afiliados'], color: 'text-[#004d4d]', bg: 'bg-[#f0f9f9]' },
                    { title: 'Soporte Técnico', items: ['Debugging de n8n', 'Logs de transacciones', 'Feature Flags guide'], color: 'text-purple-600', bg: 'bg-purple-50' },
                    { title: 'Legal & Compliance', items: ['KYC Procedimiento', 'Reglas fiscales MX/CO', 'Actualización de ToS'], color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((cat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center`}><Book size={20} /></div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">{cat.title}</h2>
                        </div>
                        <div className="space-y-2">
                            {cat.items.map((item, j) => (
                                <div key={j} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer group">
                                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{item}</span>
                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-900" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
