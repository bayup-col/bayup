"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe, Edit3, Trash2, Layout, Monitor, ShieldCheck, X, Loader2, Store, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { useTheme } from '@/context/theme-context';
import { CUSTOM_HTML_TEMPLATES, CustomHtmlTemplate } from '@/lib/custom-templates';

const mockTemplates = [
    { id: 't1', name: 'Elite Fashion v1', description: 'Diseño enfocado a marcas de ropa de lujo.', active_plans: ['Básico', 'Pro', 'Empresa'], status: 'active' },
    { id: 't2', name: 'Cyber Clean', description: 'Estilo tecnológico con efectos neón y aurora.', active_plans: ['Pro', 'Empresa'], status: 'active' },
];

export default function WebTemplatesManager() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const { theme } = useTheme();

    const [templates, setTemplates] = useState<any[]>([]);
    const [customHtmlTemplates] = useState<CustomHtmlTemplate[]>(CUSTOM_HTML_TEMPLATES);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTpl, setSelectedTpl] = useState<any | null>(null);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [newPageName, setNewPageName] = useState("");
    const [isAddingPage, setIsAddingPage] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Variables de estilo por tema
    const textPrimary = theme === 'dark' ? 'text-white/90' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-white/50' : 'text-gray-500';
    const textMuted = theme === 'dark' ? 'text-white/30' : 'text-gray-400';
    const cardBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm';
    const cardBgHover = theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20' : 'bg-white border-gray-100 shadow-sm hover:shadow-xl';
    const innerCard = theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-100';
    const previewBg = theme === 'dark' ? 'bg-white/5' : 'bg-gray-50';
    const divider = theme === 'dark' ? 'border-white/5' : 'border-gray-100';
    const badgePlan = theme === 'dark' ? 'bg-cyan/10 text-cyan border-cyan/20' : 'bg-blue-50 text-blue-600 border-blue-100';
    const badgeCategory = theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
    const syncBtn = theme === 'dark' ? 'bg-cyan/10 text-cyan border-cyan/20 hover:bg-cyan/20' : 'bg-cyan/10 text-cyan border-cyan/20 hover:bg-cyan/20';
    const emptyBg = theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-200';
    const emptyIcon = theme === 'dark' ? 'text-white/10' : 'text-gray-200';
    const emptyText = theme === 'dark' ? 'text-white/20' : 'text-gray-400';
    const sectionDivider = theme === 'dark' ? 'border-white/5' : 'border-gray-100';
    const sectionTitle = theme === 'dark' ? 'text-white/90' : 'text-[#004d4d]';
    const modalBg = theme === 'dark' ? 'bg-[#0a1a1a] border-white/10' : 'bg-white border-gray-100';
    const modalInner = theme === 'dark' ? 'bg-white/[0.03] border-white/5 hover:border-cyan/30 hover:bg-white/[0.05]' : 'bg-gray-50 border-transparent hover:border-blue-500 hover:bg-white hover:shadow-xl';
    const modalIconBg = theme === 'dark' ? 'bg-white/5 text-white/30 group-hover:bg-cyan group-hover:text-[#001A1A]' : 'bg-white text-gray-400 group-hover:bg-blue-600 group-hover:text-white';
    const modalTitle = theme === 'dark' ? 'text-white/90' : 'text-gray-900';
    const modalDesc = theme === 'dark' ? 'text-white/30' : 'text-gray-400';
    const addPageBg = theme === 'dark' ? 'bg-white/[0.02] border-white/5 hover:border-cyan/30' : 'bg-white border-gray-100 hover:border-blue-400';
    const addPageIcon = theme === 'dark' ? 'bg-white/5 text-white/20 group-hover/add:bg-cyan/10 group-hover/add:text-cyan' : 'bg-gray-50 text-gray-300 group-hover/add:bg-blue-50 group-hover/add:text-blue-500';
    const addPageText = theme === 'dark' ? 'text-white/20 group-hover/add:text-cyan' : 'text-gray-400 group-hover/add:text-blue-600';
    const dividerLine = theme === 'dark' ? 'bg-white/5' : 'bg-gray-100';
    const dividerText = theme === 'dark' ? 'text-white/20' : 'text-gray-300';

    const masterPages = [
        { id: 'home', label: 'Página Principal', icon: Layout, desc: 'Estructura de inicio.' },
        { id: 'colecciones', label: 'Colecciones', icon: Store, desc: 'Listado de categorías.' },
        { id: 'productos', label: 'Todos los Productos', icon: ShoppingBag, desc: 'Catálogo general.' },
        { id: 'detalles', label: 'Comprar Producto', icon: Eye, desc: 'Detalle de producto.' },
        { id: 'nosotros', label: 'Nosotros', icon: Globe, desc: 'Información de marca.' },
        { id: 'privacidad', label: 'Privacidad', icon: ShieldCheck, desc: 'Textos legales.' },
    ];

    const handleCloudSync = async () => {
        if (!confirm("¿Deseas subir todas las plantillas locales a la base de datos de producción?")) return;
        setIsSyncing(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            for (const tpl of customHtmlTemplates) {
                const resJson = await fetch(`/templates/custom-html/${tpl.folderPath}/architecture.json`);
                if (!resJson.ok) continue;
                const schema = await resJson.json();
                await fetch(`${apiBase}/super-admin/web-templates`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: tpl.name, description: tpl.description, preview_url: tpl.thumbnail,
                        schema_data: schema, active_plans: ["Básico", "Pro", "Empresa"]
                    })
                });
            }
            showToast("¡Sincronización masiva completada! 🚀", "success");
            fetchTemplates();
        } catch (e) {
            showToast("Error en la sincronización", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCreateCustomPage = () => {
        if (!newPageName) return;
        const pageId = newPageName.toLowerCase().replace(/\s+/g, '-');
        window.location.href = `/dashboard/super-admin/web-templates/editor?id=${selectedTpl?.id}&page=${pageId}&name=${newPageName}`;
    };

    const fetchTemplates = async () => {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        if (!storedToken || storedToken === 'null' || storedToken === 'undefined') return;
        setIsLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiBase}/super-admin/web-templates`, {
                headers: { 'Authorization': `Bearer ${storedToken}`, 'Accept': 'application/json' }
            });
            if (res.ok) {
                setTemplates(await res.json());
            } else if (res.status !== 403) {
                showToast(`Error del servidor (${res.status})`, "error");
            }
        } catch (err) {
            showToast("Error de conexión con la red global", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta arquitectura maestra?")) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiBase}/super-admin/web-templates/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { showToast("Arquitectura eliminada", "success"); fetchTemplates(); }
        } catch (e) { showToast("Error al eliminar", "error"); }
    };

    useEffect(() => { fetchTemplates(); }, [token]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-cyan" size={48} />
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${textMuted}`}>Sincronizando Archivos Maestros...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-cyan animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.8)]" />
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${textMuted}`}>Infraestructura Global</span>
                    </div>
                    <h1 className={`text-5xl font-black tracking-tighter uppercase italic leading-none ${textPrimary}`}>
                        Arquitectura <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-[#004D4D]">Web</span>
                    </h1>
                    <p className={`font-medium italic ${textSecondary}`}>Crea y despliega plantillas maestras para todo el ecosistema Bayup.</p>
                </div>
                <div className="flex gap-4 shrink-0">
                    <button
                        onClick={handleCloudSync}
                        disabled={isSyncing}
                        className={`h-14 px-8 border rounded-full font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-4 ${syncBtn}`}
                    >
                        {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                        Sincronizar Nube
                    </button>
                    <Link href="/dashboard/super-admin/web-templates/editor">
                        <button className="h-14 px-10 bg-[#004d4d] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
                            <Plus size={18} className="text-cyan" />
                            Nueva Plantilla
                        </button>
                    </Link>
                </div>
            </div>

            {/* GRID DE PLANTILLAS BACKEND */}
            {templates.length === 0 ? (
                <div className={`text-center py-32 rounded-[4rem] border-2 border-dashed mx-4 ${emptyBg}`}>
                    <Globe size={64} className={`mx-auto mb-6 ${emptyIcon}`} />
                    <h3 className={`text-xl font-black uppercase tracking-widest ${emptyText}`}>No hay arquitecturas desplegadas</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {templates.map((tpl, i) => (
                        <motion.div
                            key={tpl.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`group relative rounded-[3rem] border overflow-hidden transition-all duration-500 ${cardBgHover}`}
                        >
                            <div className={`aspect-video flex items-center justify-center relative overflow-hidden ${previewBg}`}>
                                {tpl.preview_url ? (
                                    <img src={tpl.preview_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                ) : (
                                    <Layout size={48} className={emptyIcon} />
                                )}
                                <div className="absolute inset-0 bg-[#004d4d]/0 group-hover:bg-[#004d4d]/10 transition-colors duration-500" />
                                <Link href={`/studio-preview?template_id=${tpl.id}`} target="_blank" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button className="px-8 py-3 bg-white text-[#004d4d] rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all">
                                        <Monitor size={14} /> Vista Previa Real
                                    </button>
                                </Link>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <h3 className={`text-xl font-black uppercase italic tracking-tighter ${textPrimary}`}>{tpl.name}</h3>
                                    <p className={`text-xs font-medium mt-1 line-clamp-2 ${textMuted}`}>{tpl.description}</p>
                                </div>
                                <div className="space-y-3">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Activo en Planes:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(tpl.active_plans || []).map((p: string) => (
                                            <span key={p} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${badgePlan}`}>{p}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className={`pt-6 border-t flex items-center justify-between gap-4 ${divider}`}>
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

            {/* SECCIÓN PLANTILLAS HTML PERSONALIZADAS */}
            {customHtmlTemplates.length > 0 && (
                <div className={`space-y-8 pt-12 border-t ${sectionDivider}`}>
                    <div className="px-4">
                        <h2 className={`text-3xl font-black tracking-tighter uppercase italic flex items-center gap-4 ${sectionTitle}`}>
                            <Monitor className="text-cyan" />
                            Plantillas HTML Propias
                        </h2>
                        <p className={`font-medium text-sm mt-1 ${textMuted}`}>Diseños subidos manualmente a la carpeta del servidor.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {customHtmlTemplates.map((tpl, i) => (
                            <motion.div
                                key={tpl.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`group relative rounded-[3rem] border overflow-hidden transition-all duration-500 ${cardBgHover}`}
                            >
                                <div className={`aspect-video flex items-center justify-center relative overflow-hidden ${previewBg}`}>
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
                                        <Link href={`/dashboard/super-admin/web-templates/editor?id=${tpl.id}&source=smart`} className="w-48 py-3 bg-cyan text-[#004d4d] rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all">
                                            <Sparkles size={14} /> Smart Studio
                                        </Link>
                                    </div>
                                </div>

                                <div className="p-8 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-xl font-black uppercase italic tracking-tighter ${textPrimary}`}>{tpl.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${badgeCategory}`}>{tpl.category}</span>
                                    </div>
                                    <p className={`text-xs font-medium line-clamp-2 ${textMuted}`}>{tpl.description}</p>
                                    <div className={`pt-6 border-t grid grid-cols-2 gap-3 ${divider}`}>
                                        <Link
                                            href={`/dashboard/super-admin/web-templates/editor?id=${tpl.id}&source=smart`}
                                            className="py-3 bg-gray-900 text-white rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-[#004d4d] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit3 size={12} /> Editar Smart
                                        </Link>
                                        <a
                                            href={`/templates/custom-html/${tpl.folderPath}/code.html`}
                                            target="_blank"
                                            className={`py-3 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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

            {/* MODAL DE SELECCIÓN DE PÁGINA */}
            <AnimatePresence>
                {isSelectionModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSelectionModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-xl" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full max-w-5xl rounded-[4rem] p-12 shadow-2xl space-y-12 max-h-[90vh] overflow-y-auto border ${modalBg}`}
                        >
                            <div className="flex justify-between items-start px-4">
                                <div className="space-y-3">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${badgePlan}`}>Configuración Maestra</span>
                                    <h3 className={`text-5xl font-black italic tracking-tighter capitalize leading-none ${modalTitle}`}>{selectedTpl?.name}</h3>
                                    <p className={`text-base font-medium italic ${modalDesc}`}>Define la arquitectura global de esta plantilla.</p>
                                </div>
                                <button onClick={() => setIsSelectionModalOpen(false)} className={`p-4 rounded-full transition-colors shadow-sm ${theme === 'dark' ? 'hover:bg-white/5 text-white/40' : 'hover:bg-gray-100 text-gray-400'}`}>
                                    <X size={32} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-4 px-4">
                                    <div className={`h-px flex-1 ${dividerLine}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${dividerText}`}>Secciones del Ecosistema</span>
                                    <div className={`h-px flex-1 ${dividerLine}`} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {masterPages.map((page) => (
                                        <Link key={page.id} href={`/dashboard/super-admin/web-templates/editor?id=${selectedTpl?.id}&page=${page.id}`} className="group">
                                            <div className={`p-8 h-full border-2 rounded-[3rem] transition-all duration-500 space-y-6 flex flex-col items-center text-center ${modalInner}`}>
                                                <div className={`h-20 w-20 rounded-[2rem] shadow-lg flex items-center justify-center transition-all duration-700 group-hover:rotate-6 ${modalIconBg}`}>
                                                    <page.icon size={36} />
                                                </div>
                                                <div>
                                                    <h4 className={`text-xl font-black uppercase italic tracking-tighter ${modalTitle}`}>{page.label}</h4>
                                                    <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest leading-relaxed ${modalDesc}`}>{page.desc}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}

                                    {/* BOTÓN AÑADIR NUEVA PÁGINA */}
                                    <div className="group relative">
                                        {!isAddingPage ? (
                                            <button
                                                onClick={() => setIsAddingPage(true)}
                                                className={`w-full p-8 h-full min-h-[280px] rounded-[3rem] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-6 group/add ${addPageBg}`}
                                            >
                                                <div className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${addPageIcon}`}>
                                                    <Plus size={48} />
                                                </div>
                                                <span className={`text-xs font-black uppercase tracking-widest transition-colors ${addPageText}`}>Crear Nueva Sección</span>
                                            </button>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                className="w-full p-8 h-full min-h-[280px] bg-[#004d4d] rounded-[3rem] flex flex-col items-center justify-center gap-6 shadow-2xl text-white"
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
                                                        <button onClick={handleCreateCustomPage} className="flex-1 py-4 bg-cyan text-[#004d4d] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Confirmar</button>
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
