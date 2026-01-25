"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { pageService } from '@/lib/api';
import { NavItem, ShortcutIcon } from '@/lib/types';
import { 
  ArrowLeft, 
  Save, 
  Type, 
  Image as ImageIcon, 
  MousePointer2, 
  Search, 
  ShoppingCart, 
  User, 
  Settings2,
  Bell,
  Eye,
  Monitor,
  Smartphone,
  CheckCircle2,
  Trash2,
  Plus
} from 'lucide-react';

// --- CONSTANTES MAESTRAS ---
const FONTS = [
    { name: 'Inter', class: 'font-sans' },
    { name: 'Playfair Display', class: 'font-serif' },
    { name: 'Space Grotesk', class: 'font-mono' },
    { name: 'Montserrat', class: 'font-bold' },
    { name: 'Bebas Neue', class: 'uppercase font-black tracking-wider' },
    { name: 'Outfit', class: 'font-extrabold' },
];

const LOGO_EFFECTS = [
    { id: 'none', label: 'Simple', icon: <Type size={18} /> },
    { id: 'shadow', label: 'Sombra', icon: <Bell size={18} /> },
    { id: 'neon', label: 'Neón', icon: <Bell size={18} className="text-purple-500" /> },
];

const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl hover:border-purple-200 transition-all group relative">
            <div className="h-8 w-8 rounded-xl shadow-inner border border-white relative overflow-hidden" style={{ backgroundColor: value }}>
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer scale-150" />
            </div>
            <div className="flex-1"><p className="text-[10px] font-mono font-bold text-gray-900 uppercase">{value}</p></div>
        </div>
    </div>
);

export default function VisualEditor() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const pageId = params.page_id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'cabecera' | 'plantilla' | 'final'>('cabecera');
    const [subTab, setSubTab] = useState<'none' | 'announcement' | 'header_logo' | 'header_menu' | 'header_icons' | 'header_appearance' | 'template_hero'>('none');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    const [config, setConfig] = useState<any>({
        announcement: { show: true, bg: '#111827', color: '#ffffff', style: 'solid', padding: 10, speed: 3, messages: [{ id: '1', text: 'Envíos gratis por compras superiores a $150.000' }] },
        header: {
            logo_type: 'text', logo_text: 'BAYUP STORE', logo_image: null, logo_font: 'Inter', logo_effect: 'none', logo_width: 150, logo_position: 'left', logo_color: '#111827',
            nav_items: [{ id: '1', label: 'Inicio', href: '/', type: 'url' }],
            nav_font: 'Inter', nav_color: '#94a3b8',
            bar_style: 'solid', bar_bg: '#ffffff', bar_height: 80, bar_border_weight: 1, 
            shortcuts: [{ id: 'sc1', type: 'search', icon: 'Search', href: '#', style: 'minimal' }], icon_color: '#111827'
        },
        template: {
            hero: { 
                bg_type: 'image', bg_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop', 
                headline: 'NUEVA COLECCIÓN', headline_font: 'Bebas Neue', headline_size: 72, headline_color: '#ffffff',
                button_text: 'Explorar Ahora', button_url: '/shop', button_bg: '#ffffff', button_color: '#111827', button_radius: 99,
                overlay_opacity: 0.3 
            }
        }
    });

    const fetchPageData = useCallback(async () => {
        if (!token || !pageId) return;
        try {
            const page = await pageService.getById(token, pageId);
            if (page.content) setConfig(page.content);
        } catch (err) {
            console.error("Error al cargar configuración de la página");
        } finally {
            setIsLoading(false);
        }
    }, [token, pageId]);

    useEffect(() => { fetchPageData(); }, [fetchPageData]);

    const handleSave = async () => {
        if (!token || !pageId) return;
        setIsSaving(true);
        try {
            await pageService.update(token, pageId, { content: config });
            alert("¡Cambios publicados con éxito! ✨");
        } catch (err) {
            alert("Error al guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateHeader = (field: string, value: any) => setConfig((prev: any) => ({ ...prev, header: { ...prev.header, [field]: value } }));

    if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

    return (
        <div className="fixed inset-0 bg-gray-100 flex overflow-hidden z-[200]">
            {/* 1. BARRA LATERAL DE HERRAMIENTAS */}
            <aside className="w-[400px] bg-white border-r border-gray-200 flex flex-col shadow-2xl relative z-20">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/pages" className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-purple-600 transition-all border border-gray-100"><ArrowLeft size={18} /></Link>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Editor Visual</h2>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">En línea</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('desktop')} className={`p-2 rounded-lg ${viewMode === 'desktop' ? 'bg-purple-50 text-purple-600' : 'text-gray-300'}`}><Monitor size={16} /></button>
                        <button onClick={() => setViewMode('mobile')} className={`p-2 rounded-lg ${viewMode === 'mobile' ? 'bg-purple-50 text-purple-600' : 'text-gray-300'}`}><Smartphone size={16} /></button>
                    </div>
                </div>

                <div className="flex border-b border-gray-100">
                    {['cabecera', 'plantilla', 'final'].map((tab) => (
                        <button key={tab} onClick={() => { setActiveTab(tab as any); setSubTab('none'); }} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400'}`}>{tab}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {activeTab === 'cabecera' && subTab === 'none' && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Componentes Globales</h3>
                            <button onClick={() => setSubTab('header_logo')} className="w-full p-6 bg-gray-50 rounded-[2rem] border border-transparent hover:border-purple-200 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-purple-600"><Type size={20} /></div>
                                    <div className="text-left"><p className="text-sm font-black text-gray-900">Logo y Marca</p><p className="text-[9px] text-gray-400 font-bold uppercase">Identidad Visual</p></div>
                                </div>
                                <ArrowLeft size={14} className="rotate-180 text-gray-300 group-hover:text-purple-600 transition-all" />
                            </button>
                            <button onClick={() => setSubTab('header_menu')} className="w-full p-6 bg-gray-50 rounded-[2rem] border border-transparent hover:border-purple-200 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-purple-600"><MousePointer2 size={20} /></div>
                                    <div className="text-left"><p className="text-sm font-black text-gray-900">Menú de Navegación</p><p className="text-[9px] text-gray-400 font-bold uppercase">Enlaces y Orden</p></div>
                                </div>
                                <ArrowLeft size={14} className="rotate-180 text-gray-300 group-hover:text-purple-600 transition-all" />
                            </button>
                        </div>
                    )}

                    {subTab === 'header_logo' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <button onClick={() => setSubTab('none')} className="text-purple-600 font-black text-[10px] uppercase flex items-center gap-2 mb-4"><ArrowLeft size={12} /> Volver</button>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Texto del Logo</label>
                                    <input value={config.header.logo_text} onChange={(e) => updateHeader('logo_text', e.target.value)} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none text-sm font-black border border-transparent focus:border-purple-200" />
                                </div>
                                <ColorPicker label="Color de Marca" value={config.header.logo_color} onChange={(v) => updateHeader('logo_color', v)} />
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fuente Tipográfica</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {FONTS.map(f => (
                                            <button key={f.name} onClick={() => updateHeader('logo_font', f.name)} className={`p-3 rounded-xl border text-[10px] font-bold ${config.header.logo_font === f.name ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>{f.name}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-gray-100 bg-white">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-purple-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSaving ? 'Publicando...' : <><Save size={16} /> Publicar Sitio</>}
                    </button>
                </div>
            </aside>

            {/* 2. AREA DE PREVISUALIZACIÓN DINÁMICA */}
            <main className="flex-1 overflow-hidden flex flex-col items-center justify-center p-12 bg-gray-200">
                <div 
                    className={`bg-white shadow-[0_60px_120px_rgba(0,0,0,0.1)] transition-all duration-700 overflow-hidden relative ${viewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-[3rem] border-[12px] border-gray-900' : 'w-full max-w-6xl h-full rounded-[3rem]'}`}
                >
                    {/* Header de Previsualización */}
                    <header 
                        className="px-12 flex items-center justify-between border-b border-gray-50 transition-all duration-500"
                        style={{ height: config.header.bar_height, backgroundColor: config.header.bar_bg }}
                    >
                        <div className="text-2xl font-black transition-all" style={{ color: config.header.logo_color, fontFamily: config.header.logo_font }}>
                            {config.header.logo_text}
                        </div>
                        <nav className="hidden md:flex gap-8">
                            {config.header.nav_items.map((item: any) => (
                                <span key={item.id} className="text-[10px] font-black uppercase tracking-widest" style={{ color: config.header.nav_color }}>{item.label}</span>
                            ))}
                        </nav>
                        <div className="flex gap-6 text-gray-900">
                            <Search size={20} />
                            <ShoppingCart size={20} />
                            <User size={20} />
                        </div>
                    </header>

                    {/* Banner Hero en Previsualización */}
                    <section className="relative h-[500px] bg-gray-900 overflow-hidden">
                        <img src={config.template.hero.bg_url} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black" style={{ opacity: config.template.hero.overlay_opacity }}></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                            <h1 className="text-white font-black leading-tight mb-6 transition-all" style={{ fontSize: config.template.hero.headline_size, fontFamily: config.template.hero.headline_font }}>
                                {config.template.hero.headline}
                            </h1>
                            <button className="px-10 py-4 font-black text-[10px] uppercase tracking-widest transition-all" style={{ backgroundColor: config.template.hero.button_bg, color: config.template.hero.button_color, borderRadius: config.template.hero.button_radius }}>
                                {config.template.hero.button_text}
                            </button>
                        </div>
                    </section>

                    {/* Placeholder para contenido adicional */}
                    <div className="p-20 text-center text-gray-200">
                        <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-20">Contenido de la Tienda</p>
                    </div>
                </div>
            </main>
        </div>
    );
}