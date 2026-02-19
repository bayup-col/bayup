"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe, Edit3, Trash2, Layout, Monitor, ShieldCheck, CheckCircle2, X, Loader2, Store, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { CUSTOM_HTML_TEMPLATES, CustomHtmlTemplate } from '@/lib/custom-templates';

// Simulamos carga de API real
const mockTemplates = [
    { id: 't1', name: 'Elite Fashion v1', description: 'Diseño enfocado a marcas de ropa de lujo.', active_plans: ['Básico', 'Pro', 'Empresa'], status: 'active' },
    { id: 't2', name: 'Cyber Clean', description: 'Estilo tecnológico con efectos neón y aurora.', active_plans: ['Pro', 'Empresa'], status: 'active' },
];

export default function WebTemplatesManager() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [customHtmlTemplates] = useState<CustomHtmlTemplate[]>(CUSTOM_HTML_TEMPLATES);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTpl, setSelectedTpl] = useState<any | null>(null);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [newPageName, setNewPageName] = useState("");
    const [isAddingPage, setIsAddingPage] = useState(false);

    const masterPages = [
        { id: 'home', label: 'Página Principal', icon: Layout, desc: 'Estructura de inicio.' },
        { id: 'colecciones', label: 'Colecciones', icon: Store, desc: 'Listado de categorías.' },
        { id: 'productos', label: 'Todos los Productos', icon: ShoppingBag, desc: 'Catálogo general.' },
        { id: 'detalles', label: 'Comprar Producto', icon: Eye, desc: 'Detalle de producto.' },
        { id: 'nosotros', label: 'Nosotros', icon: Globe, desc: 'Información de marca.' },
        { id: 'privacidad', label: 'Privacidad', icon: ShieldCheck, desc: 'Textos legales.' },
    ];

    const handleCreateCustomPage = () => {
        if (!newPageName) return;
        const pageId = newPageName.toLowerCase().replace(/\s+/g, '-');
        window.location.href = `/dashboard/super-admin/web-templates/editor?id=${selectedTpl?.id}&page=${pageId}&name=${newPageName}`;
    };

    const fetchTemplates = async () => {
        // Prioridad: LocalStorage directo para evitar delay de React Context
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        
        if (!storedToken || storedToken === 'null' || storedToken === 'undefined') {
            console.warn("API Arquitectura: Abortando petición por falta de token válido.");
            return;
        }

        setIsLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            console.log("Consultando Arquitecturas...");
            const res = await fetch(`${apiBase}/super-admin/web-templates`, {
                headers: { 
                    'Authorization': `Bearer ${storedToken}`,
                    'Accept': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Plantillas cargadas:", data);
                setTemplates(data);
            } else {
                const errorText = await res.text();
                console.error("Error API Arquitectura:", res.status, errorText);
                // No mostramos toast de error 403 para no molestar al usuario, 
                // simplemente dejamos las plantillas locales disponibles.
                if (res.status !== 403) {
                    showToast(`Error del servidor (${res.status})`, "error");
                }
            }
        } catch (err) {
            console.error("Fallo de conexión:", err);
            showToast("Error de conexión con la red global", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta arquitectura maestra?")) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiBase}/super-admin/web-templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast("Arquitectura eliminada", "success");
                fetchTemplates();
            }
        } catch (e) { showToast("Error al eliminar", "error"); }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-[#00f2ff]" size={48} />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Sincronizando Archivos Maestros...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4">
                <div>
                    <h1 className="text-5xl font-black text-[#004d4d] tracking-tight uppercase italic">Arquitectura Web</h1>
                    <p className="text-gray-500 mt-2 font-medium text-lg italic">Crea y despliega plantillas maestras para todo el ecosistema Bayup.</p>
                </div>
                <Link href="/dashboard/super-admin/web-templates/editor">
                    <button className="h-14 px-10 bg-[#004d4d] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
                        <Plus size={18} className="text-[#00f2ff]" />
                        Diseñar Nueva Plantilla
                    </button>
                </Link>
            </div>

            {/* --- GRID DE PLANTILLAS --- */}
            {templates.length === 0 ? (
                <div className="text-center py-32 bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200 mx-4">
                    <Globe size={64} className="mx-auto text-gray-200 mb-6" />
                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No hay arquitecturas desplegadas</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {templates.map((tpl, i) => (
                        <motion.div 
                            key={tpl.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                        >
                            {/* Preview Placeholder */}
                            <div className="aspect-video bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                {tpl.preview_url ? (
                                    <img src={tpl.preview_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                ) : (
                                    <Layout size={48} className="text-gray-200" />
                                )}
                                <div className="absolute inset-0 bg-[#004d4d]/0 group-hover:bg-[#004d4d]/10 transition-colors duration-500" />
                                
                                {/* Botón Preview Flotante */}
                                <Link href={`/studio-preview?template_id=${tpl.id}`} target="_blank" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button className="px-8 py-3 bg-white text-[#004d4d] rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all">
                                        <Monitor size={14} /> Vista Previa Real
                                    </button>
                                </Link>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{tpl.name}</h3>
                                    <p className="text-xs font-medium text-gray-400 mt-1 line-clamp-2">{tpl.description}</p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activo en Planes:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(tpl.active_plans || []).map((p: string) => (
                                            <span key={p} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase border border-blue-100">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                                    <button 
                                        onClick={() => { setSelectedTpl(tpl); setIsSelectionModalOpen(true); }}
                                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#004d4d] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit3 size={12} /> Editar Maestro
                                    </button>
                                    <button onClick={() => handleDelete(tpl.id)} className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* --- SECCIÓN PLANTILLAS HTML PERSONALIZADAS --- */}
            {customHtmlTemplates.length > 0 && (
                <div className="space-y-8 pt-12 border-t border-gray-100">
                    <div className="px-4">
                        <h2 className="text-3xl font-black text-[#004d4d] tracking-tight uppercase italic flex items-center gap-4">
                            <Monitor className="text-[#00f2ff]" />
                            Plantillas HTML Propias
                        </h2>
                        <p className="text-gray-400 font-medium text-sm">Diseños subidos manualmente a la carpeta del servidor.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {customHtmlTemplates.map((tpl, i) => (
                            <motion.div 
                                key={tpl.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                            >
                                <div className="aspect-video bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                    <img src={tpl.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-[#004d4d]/0 group-hover:bg-[#004d4d]/10 transition-colors duration-500" />
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <a 
                                            href={`/templates/custom-html/${tpl.folderPath}/code.html`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-48 py-3 bg-white text-[#004d4d] rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all"
                                        >
                                            <Eye size={14} /> Ver HTML Puro
                                        </a>
                                        
                                        <Link href={`/dashboard/super-admin/web-templates/editor?id=${tpl.id}&source=smart`} className="w-48 py-3 bg-[#00f2ff] text-[#004d4d] rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all">
                                            <Sparkles size={14} /> Smart Studio
                                        </Link>
                                    </div>
                                </div>

                                <div className="p-8 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{tpl.name}</h3>
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase border border-emerald-100">{tpl.category}</span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-400 line-clamp-2">{tpl.description}</p>
                                    
                                    <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-3">
                                        <Link 
                                            href={`/dashboard/super-admin/web-templates/editor?id=${tpl.id}&source=smart`}
                                            className="py-3 bg-gray-900 text-white rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-[#004d4d] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit3 size={12} /> Editar Smart
                                        </Link>
                                        <a 
                                            href={`/templates/custom-html/${tpl.folderPath}/code.html`} 
                                            target="_blank" 
                                            className="py-3 bg-gray-100 text-gray-600 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Monitor size={12} /> Ver HTML
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- MODAL DE SELECCIÓN DE PÁGINA --- */}
            <AnimatePresence>
                {isSelectionModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSelectionModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-5xl bg-white rounded-[4rem] p-12 shadow-2xl space-y-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-start px-4">
                                <div className="space-y-3">
                                    <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">Configuración Maestra</span>
                                    <h3 className="text-5xl font-black text-gray-900 italic tracking-tighter capitalize leading-none">{selectedTpl?.name}</h3>
                                    <p className="text-base font-medium text-gray-400 italic">Define la arquitectura global de esta plantilla.</p>
                                </div>
                                <button onClick={() => setIsSelectionModalOpen(false)} className="p-4 hover:bg-gray-100 rounded-full text-gray-400 transition-colors shadow-sm"><X size={32} /></button>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-4 px-4">
                                    <div className="h-px flex-1 bg-gray-100" />
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Secciones del Ecosistema</span>
                                    <div className="h-px flex-1 bg-gray-100" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {masterPages.map((page) => (
                                        <Link 
                                            key={page.id} 
                                            href={`/dashboard/super-admin/web-templates/editor?id=${selectedTpl?.id}&page=${page.id}`}
                                            className="group"
                                        >
                                            <div className="p-8 h-full bg-gray-50 rounded-[3rem] border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all duration-500 shadow-sm hover:shadow-2xl space-y-6 flex flex-col items-center text-center">
                                                <div className="h-20 w-20 rounded-[2rem] bg-white shadow-lg flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 group-hover:rotate-6">
                                                    <page.icon size={36} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{page.label}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest leading-relaxed">{page.desc}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}

                                    {/* BOTÓN DINÁMICO PARA AÑADIR NUEVA PÁGINA */}
                                    <div className="group relative">
                                        {!isAddingPage ? (
                                            <button 
                                                onClick={() => setIsAddingPage(true)}
                                                className="w-full p-8 h-full min-h-[280px] bg-white rounded-[3rem] border-4 border-dashed border-gray-100 hover:border-blue-400 transition-all duration-500 flex flex-col items-center justify-center gap-6 group/add"
                                            >
                                                <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover/add:bg-blue-50 group-hover/add:text-blue-500 transition-all">
                                                    <Plus size={48} />
                                                </div>
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover/add:text-blue-600">Crear Nueva Sección</span>
                                            </button>
                                        ) : (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                className="w-full p-8 h-full min-h-[280px] bg-blue-600 rounded-[3rem] flex flex-col items-center justify-center gap-6 shadow-2xl text-white"
                                            >
                                                <div className="space-y-4 w-full">
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        placeholder="Nombre de la página..." 
                                                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none text-white font-bold placeholder:text-white/40"
                                                        value={newPageName}
                                                        onChange={(e) => setNewPageName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCustomPage()}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={handleCreateCustomPage} className="flex-1 py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Confirmar</button>
                                                        <button onClick={() => setIsAddingPage(false)} className="px-6 py-4 bg-black/20 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black/40 transition-all">X</button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
