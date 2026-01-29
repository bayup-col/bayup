"use client";

import { 
    Copy, Share2, Download, ExternalLink, 
    FileText as FileTextIcon, Image as ImageIcon, MessageSquare, Sparkles, 
    Zap, Link as LinkIcon, CheckCircle2, Globe, X, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function AffiliateMaterial() {
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const affiliateLink = "https://bayup.com/refer/partner-af-2026";
    const affiliateCode = "AF-2026-PRO";

    const showConfirmation = (msg: string) => {
        setConfirmation(msg);
        setTimeout(() => setConfirmation(null), 3000);
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showConfirmation(`${label} copiado al portapapeles`);
    };

    const handleShare = (platform: 'whatsapp' | 'linkedin') => {
        const message = `¿Quieres llevar tu e-commerce al siguiente nivel? Conoce Bayup, la plataforma que integra IA y logística avanzada en un solo lugar. Regístrate hoy y obtén un 15% de descuento en tu primer mes. 🚀 ${affiliateLink}`;
        
        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        } else {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(affiliateLink)}`, '_blank');
        }
    };

    const handleUpcoming = (name: string) => {
        showConfirmation(`${name} estará disponible próximamente`);
    };

    const assets = [
        { name: 'Logo Pack Bayup', type: 'PNG/SVG', size: '2.4 MB', icon: <ImageIcon size={24}/> },
        { name: 'Manual de Identidad', type: 'PDF', size: '12.8 MB', icon: <FileTextIcon size={24}/> },
        { name: 'Banner Campaña 2026', type: 'MP4/GIF', size: '15.2 MB', icon: <Zap size={24}/> },
        { name: 'Scripts de Venta AI', type: 'DOCX', size: '0.8 MB', icon: <MessageSquare size={24}/> },
    ];

    return (
        <div className="space-y-12 relative">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                    Kit de <span className="text-purple-600">Marketing</span>
                </h1>
                <p className="text-gray-400 text-sm font-medium mt-1">Herramientas y recursos diseñados para potenciar tus referidos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Affiliate Link Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gray-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <LinkIcon size={180} />
                        </div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="text-[#00F2FF]" size={20} />
                                    <p className="text-[10px] font-black uppercase text-[#00F2FF] tracking-[0.3em]">Tu Enlace Único de Socio</p>
                                </div>
                                <h2 className="text-4xl font-black italic tracking-tighter leading-tight max-w-xl">
                                    Comparte Bayup y <span className="text-purple-400 underline decoration-purple-400/30">Gana de por Vida</span>.
                                </h2>
                                <p className="text-gray-400 text-sm font-medium italic max-w-lg">
                                    Cada tienda que se registre a través de este enlace quedará vinculada permanentemente a tu cuenta de afiliado.
                                </p>
                            </div>

                            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-6 backdrop-blur-sm">
                                <div className="flex-1 font-mono text-sm text-[#00F2FF] break-all truncate">
                                    {affiliateLink}
                                </div>
                                <button 
                                    onClick={() => handleCopy(affiliateLink, 'Enlace')}
                                    className="shrink-0 h-14 px-8 bg-white text-gray-900 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 hover:bg-[#00F2FF]"
                                >
                                    <Copy size={16}/> Copiar Link
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Suggested Copy Section */}
                    <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                <MessageSquare size={18} className="text-purple-600" /> Copy Sugerido para Redes
                            </h4>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opción 01 — Directa</span>
                        </div>
                        
                        <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 italic text-gray-600 text-sm leading-relaxed relative group">
                            <button 
                                onClick={() => handleCopy(`¿Quieres llevar tu e-commerce al siguiente nivel? Conoce Bayup, la plataforma que integra IA y logística avanzada en un solo lugar. Regístrate hoy y obtén un 15% de descuento en tu primer mes. 🚀 ${affiliateLink}`, 'Texto sugerido')}
                                className="absolute top-6 right-6 p-2 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:text-purple-600"
                            >
                                <Copy size={14} />
                            </button>
                            "¿Quieres llevar tu e-commerce al siguiente nivel? Conoce Bayup, la plataforma que integra IA y logística avanzada en un solo lugar. Regístrate hoy y obtén un 15% de descuento en tu primer mes. 🚀 [Tu Link de Afiliado]"
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={() => handleShare('whatsapp')}
                                className="py-5 bg-gray-50 rounded-2xl text-[10px] font-black uppercase text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center justify-center gap-3"
                            >
                                <Share2 size={16} /> WhatsApp Share
                            </button>
                            <button 
                                onClick={() => handleShare('linkedin')}
                                className="py-5 bg-gray-50 rounded-2xl text-[10px] font-black uppercase text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center justify-center gap-3"
                            >
                                <Globe size={16} /> LinkedIn Post
                            </button>
                        </div>
                    </div>
                </div>

                {/* Downloadable Assets */}
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-10">Recursos Visuales</h4>
                        <div className="space-y-6">
                            {assets.map((asset, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                            {asset.icon}
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-black text-gray-900 uppercase italic leading-tight">{asset.name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{asset.type} — {asset.size}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleUpcoming(asset.name)}
                                        className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white transition-all active:scale-90"
                                    >
                                        <Clock size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => handleUpcoming('Kit Completo')}
                            className="w-full mt-12 py-5 bg-gray-100 text-gray-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 cursor-not-allowed"
                        >
                            <Clock size={18}/> Próximamente
                        </button>
                    </div>

                    <div className="bg-emerald-500 p-10 rounded-[3.5rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Sparkles size={80} />
                        </div>
                        <h5 className="text-[13px] font-black uppercase italic relative z-10">Consejo de Partner</h5>
                        <p className="mt-4 text-[11px] font-medium italic text-emerald-50/80 leading-relaxed relative z-10">
                            "Las empresas que ven un video demo antes de registrarse tienen una tasa de retención un 40% mayor. Usa nuestros videos tutoriales."
                        </p>
                        <button 
                            onClick={() => handleUpcoming('Tutoriales')}
                            className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:underline relative z-10"
                        >
                            Próximamente <Clock size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Floating Message */}
            <AnimatePresence>
                {confirmation && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-[800]">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{confirmation}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
