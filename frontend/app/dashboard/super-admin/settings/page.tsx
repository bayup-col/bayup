"use client";

import { useState } from 'react';
import { 
    Settings, 
    Globe, 
    CreditCard, 
    Zap, 
    Coins, 
    Palette,
    ShieldCheck,
    Bell,
    Save
} from 'lucide-react';

export default function GlobalSettings() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Configuración Global</h1>
                    <p className="text-gray-500 mt-1 font-medium">Variables maestras del ecosistema Bayup.</p>
                </div>
                <button className="flex items-center gap-2 px-8 py-4 bg-[#004d4d] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#004d4d]/20 hover:bg-[#003333] transition-all active:scale-95">
                    <Save size={14} /> Guardar Cambios Globales
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: General Vars */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center"><Coins size={24} /></div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Estructura de Comisiones</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comisión Base (%)</label>
                                <input type="number" defaultValue="5.0" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#004d4d]/20 rounded-2xl outline-none text-sm font-bold transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comisión Afiliados (%)</label>
                                <input type="number" defaultValue="0.5" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[#004d4d]/20 rounded-2xl outline-none text-sm font-bold transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center"><Globe size={24} /></div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Regiones Soportadas</h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {['Colombia', 'México', 'España', 'Estados Unidos', 'Ecuador', 'Perú'].map((country) => (
                                <div key={country} className="flex items-center gap-3 px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 group cursor-pointer hover:border-[#004d4d] transition-all">
                                    <span className="text-sm font-bold text-gray-700">{country}</span>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                </div>
                            ))}
                            <button className="px-6 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                                + Agregar Región
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Security & Branding */}
                <div className="space-y-8">
                    <div className="bg-[#002222] p-8 rounded-[3rem] text-white space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-[#004d4d] flex items-center justify-center"><ShieldCheck size={20} /></div>
                            <h2 className="text-lg font-black italic tracking-tighter">Seguridad Global</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black uppercase tracking-widest">Mantenimiento</span>
                                <div className="h-6 w-11 bg-gray-700 rounded-full relative flex items-center px-1">
                                    <div className="h-4 w-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black uppercase tracking-widest">Nuevos Registros</span>
                                <div className="h-6 w-11 bg-emerald-500 rounded-full relative flex items-center justify-end px-1">
                                    <div className="h-4 w-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center"><Palette size={20} /></div>
                            <h2 className="text-lg font-bold text-gray-800">Branding</h2>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo Principal (Claro/Oscuro)</p>
                            <div className="flex gap-4">
                                <div className="h-20 w-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-[10px] font-black text-gray-300">LOGO</div>
                                <div className="h-20 w-20 bg-gray-900 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black text-white/20">LOGO</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
