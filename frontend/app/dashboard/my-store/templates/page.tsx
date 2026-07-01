"use client";

import { useState, useEffect } from 'react';
import { CheckCircle2, Eye, Loader2, Monitor } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';

export default function TenantTemplatesGallery() {
    const { token, shopSlug } = useAuth();
    const { showToast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSelecting, setIsSelecting] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
        Promise.all([
            fetch(`${apiBase}/web-templates`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${apiBase}/shop-pages/home`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({})),
        ]).then(([tpls, page]) => {
            setTemplates((Array.isArray(tpls) ? tpls : []).filter((t: any) => t.template_type === 'html'));
            setCurrentTemplateId((page as any)?.template_id || null);
        }).catch(console.error)
          .finally(() => setIsLoading(false));
    }, [token]);

    const handleSelect = async (tpl: any) => {
        if (isSelecting || tpl.id === currentTemplateId) return;
        setIsSelecting(tpl.id);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
            const res = await fetch(`${apiBase}/shop-pages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_key: 'home', schema_data: {}, template_id: tpl.id }),
            });
            if (res.ok) {
                setCurrentTemplateId(tpl.id);
                showToast(`Plantilla "${tpl.name}" aplicada a tu tienda`, 'success');
            } else {
                showToast('No se pudo cambiar la plantilla', 'error');
            }
        } catch {
            showToast('Error de conexión', 'error');
        } finally {
            setIsSelecting(null);
        }
    };

    const openPreview = (tplId: string) => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
        window.open(`${apiBase}/web-templates/${tplId}/preview/home`, '_blank');
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00f2ff]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Plantilla de Tienda</h1>
                <p className="text-white/50 mt-1 text-sm">
                    Elige el diseño que usará tu tienda web. El cambio se aplica de inmediato.
                </p>
            </div>

            {templates.length === 0 ? (
                <div className="py-20 text-center text-white/30 text-sm">
                    No hay plantillas disponibles en este momento.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tpl => {
                        const isActive = tpl.id === currentTemplateId;
                        return (
                            <div
                                key={tpl.id}
                                className={`rounded-2xl border overflow-hidden transition-all ${
                                    isActive
                                        ? 'border-[#00f2ff] shadow-[0_0_0_2px_rgba(0,242,255,0.2)]'
                                        : 'border-white/10 hover:border-white/20'
                                } bg-white/5`}
                            >
                                <div className="aspect-video bg-black/30 relative overflow-hidden">
                                    {tpl.preview_url ? (
                                        <img
                                            src={tpl.preview_url}
                                            alt={tpl.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-white/10">
                                            <Monitor size={40} />
                                        </div>
                                    )}
                                    {isActive && (
                                        <div className="absolute top-2 right-2 bg-[#00f2ff] text-[#004d4d] text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Activa
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                                        {tpl.description && (
                                            <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{tpl.description}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openPreview(tpl.id)}
                                            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 flex items-center justify-center gap-1.5 transition-all"
                                        >
                                            <Eye size={12} /> Previsualizar
                                        </button>
                                        <button
                                            onClick={() => handleSelect(tpl)}
                                            disabled={isActive || isSelecting !== null}
                                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                                isActive
                                                    ? 'bg-[#00f2ff]/10 text-[#00f2ff] cursor-default'
                                                    : isSelecting === tpl.id
                                                    ? 'bg-[#004d4d] text-[#00f2ff] opacity-70 cursor-wait'
                                                    : 'bg-[#004d4d] text-[#00f2ff] hover:bg-[#006666]'
                                            }`}
                                        >
                                            {isSelecting === tpl.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : isActive ? (
                                                <><CheckCircle2 size={12} /> Activa</>
                                            ) : (
                                                'Seleccionar'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {shopSlug && (
                <div className="pt-4 text-center">
                    <a
                        href={`/html-shop/${shopSlug}`}
                        target="_blank"
                        className="text-[11px] text-white/30 hover:text-white/60 underline transition-colors"
                    >
                        Ver mi tienda →
                    </a>
                </div>
            )}
        </div>
    );
}
