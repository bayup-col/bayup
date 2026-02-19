"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, CheckCircle2, Eye, Loader2, Sparkles, Monitor } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { CUSTOM_HTML_TEMPLATES } from '@/lib/custom-templates';

export default function ClientTemplatesGallery() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [dbTemplates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSelecting, setIsSelecting] = useState<string | null>(null);

    // Combinamos las plantillas locales con las de la base de datos
    // Usamos un Map para evitar duplicados si ya se sincronizaron
    const allTemplates = [
        ...CUSTOM_HTML_TEMPLATES.map(t => ({ ...t, isLocal: true })),
        ...dbTemplates.filter(dt => !CUSTOM_HTML_TEMPLATES.some(lt => lt.name === dt.name))
    ];

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiBase}/super-admin/web-templates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        if (token) fetchTemplates();
    }, [token]);

    const handleSelectTemplate = async (template: any) => {
        setIsSelecting(template.id);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            
            // Si es local, primero debemos obtener su architecture.json
            let schema = template.schema_data;
            if (template.isLocal) {
                const resJson = await fetch(`/templates/custom-html/${template.folderPath}/architecture.json`);
                if (resJson.ok) schema = await resJson.json();
            }

            // CLONACIÓN: Guardamos el schema en las páginas del cliente
            const res = await fetch(`${apiBase}/shop-pages`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page_key: 'home',
                    schema_data: schema
                })
            });

            if (res.ok) {
                showToast(`¡Diseño "${template.name}" instalado con éxito!`, "success");
                // PASAMOS EL ID PARA QUE EL EDITOR SEPA QUÉ CARGAR
                window.location.href = `/dashboard/pages/studio?page=home&id=${template.id}`;
            } else {
                throw new Error("Error al clonar plantilla");
            }
        } catch (e) {
            showToast("No se pudo instalar la plantilla", "error");
        } finally {
            setIsSelecting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-[#00f2ff]" size={48} />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Cargando Catálogo de Diseños...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000 p-6">
            <div className="space-y-4">
                <h1 className="text-5xl font-black text-[#004d4d] tracking-tight uppercase italic">Elige tu Diseño</h1>
                <p className="text-gray-500 font-medium text-lg italic">Selecciona una arquitectura maestra y personalízala para tu marca.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {allTemplates.map((tpl, i) => (
                    <motion.div 
                        key={tpl.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                    >
                        <div className="aspect-video relative overflow-hidden bg-gray-50">
                            <img src={tpl.preview_url || tpl.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        </div>

                        <div className="p-10 space-y-6">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">{tpl.name}</h3>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase border border-emerald-100">{tpl.category}</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{tpl.description}</p>
                            </div>

                            <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                                <button 
                                    onClick={() => handleSelectTemplate(tpl)}
                                    disabled={isSelecting !== null}
                                    className="w-full py-4 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00f2ff] hover:text-[#004d4d] transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    {isSelecting === tpl.id ? <Loader2 className="animate-spin" /> : <><Sparkles size={16} /> Personalizar esta Plantilla</>}
                                </button>
                                
                                <a 
                                    href={tpl.isLocal ? `/templates/custom-html/${tpl.folderPath}/code.html` : '#'} 
                                    target="_blank"
                                    className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-100 transition-all text-center"
                                >
                                    <Monitor size={16} /> Vista Previa
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
