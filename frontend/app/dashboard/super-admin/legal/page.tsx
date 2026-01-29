"use client";

import { useState } from 'react';
import { 
    FileText, 
    Globe, 
    Scale, 
    Calculator, 
    BookOpen, 
    Download,
    ShieldCheck,
    Archive
} from 'lucide-react';

export default function GlobalLegal() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Legal & Fiscal</h1>
                    <p className="text-gray-500 mt-1 font-medium">Cumplimiento normativo e impuestos por región.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        <Download size={14} /> Reporte Anual Fiscal
                    </button>
                </div>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#f0f9f9] text-[#004d4d] flex items-center justify-center"><Globe size={24} /></div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Reglas por País</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { country: 'Colombia', tax: 'IVA 19%', status: 'Actualizado' },
                            { country: 'México', tax: 'IVA 16%', status: 'Actualizado' },
                            { country: 'España', tax: 'IVA 21%', status: 'Revisión Pendiente' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <span className="text-sm font-bold text-gray-700">{item.country}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase text-gray-400">{item.tax}</span>
                                    <span className={`text-[10px] font-black uppercase ${item.status === 'Actualizado' ? 'text-emerald-600' : 'text-amber-600'}`}>{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Scale size={24} /></div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Contratos & Términos</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { doc: 'Términos de Servicio (ToS)', version: 'v2.4', date: '10 Ene 2026' },
                            { doc: 'Política de Privacidad (GDPR)', version: 'v3.1', date: '25 Feb 2026' },
                            { doc: 'Acuerdo de Afiliados', version: 'v1.0', date: '01 Mar 2026' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group cursor-pointer hover:bg-gray-100 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-gray-700">{item.doc}</p>
                                    <p className="text-[10px] font-medium text-gray-400">{item.version} • {item.date}</p>
                                </div>
                                <Download size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
