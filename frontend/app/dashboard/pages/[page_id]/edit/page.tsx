"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavItem { id: string; label: string; href: string; type: 'url' | 'anchor'; target_id?: string; }
interface ShortcutIcon { id: string; type: 'search' | 'cart' | 'user' | 'custom'; icon: string; href: string; style: 'minimal' | 'bold' | 'circle'; }
interface Announcement { id: string; text: string; }

// --- CONSTANTES MAESTRAS ---
const FONTS = [
    { name: 'Inter', class: 'font-sans' },
    { name: 'Playfair Display', class: 'font-serif' },
    { name: 'Space Grotesk', class: 'font-mono' },
    { name: 'Montserrat', class: 'font-bold' },
    { name: 'Bebas Neue', class: 'uppercase font-black tracking-wider' },
    { name: 'Raleway', class: 'font-light uppercase tracking-widest' },
    { name: 'Outfit', class: 'font-extrabold' },
    { name: 'Syncopate', class: 'uppercase font-black' },
    { name: 'Fraunces', class: 'font-black italic' },
    { name: 'Cormorant', class: 'italic font-serif' }
];

const LOGO_EFFECTS = [
    { id: 'none', label: 'Simple', icon: 'Aa' },
    { id: 'shadow', label: 'Sombra', icon: '☁️' },
    { id: 'outline', label: 'Contorno', icon: '🔳' },
    { id: 'neon', label: 'Neón', icon: '✨' },
    { id: 'italic', label: 'Itálica', icon: '斜' }
];

const ANNOUNCEMENT_STYLES = [
    { id: 'solid', label: 'Sólido', icon: '⬛' },
    { id: 'gradient', label: 'Degradado', icon: '🌈' },
    { id: 'neon', label: 'Neón Pro', icon: '✨' },
    { id: 'glass', label: 'Vidrio', icon: '🪟' },
    { id: 'border', label: 'Borde', icon: '➖' }
];

const TEXT_EFFECTS = [
    { id: 'none', label: 'Simple', icon: 'Aa' },
    { id: 'shadow', label: 'Sombra', icon: '☁️' },
    { id: 'outline', label: 'Borde', icon: '🔳' },
    { id: 'neon', label: 'Brillo', icon: '✨' },
    { id: '3d', label: '3D', icon: '🧊' }
];

const ANIMATIONS = [
    { id: 'fade', label: 'Suave', class: 'animate-in fade-in' },
    { id: 'slide', label: 'Subir', class: 'animate-in slide-in-from-bottom-10' },
    { id: 'zoom', label: 'Zoom', class: 'animate-in zoom-in-95' },
    { id: 'blur', label: 'Foco', class: 'animate-in fade-in blur-in duration-1000' },
    { id: 'bounce', label: 'Salto', class: 'animate-bounce' }
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

export default function VisualEditor({ params }: { params: { page_id: string } }) {
    const [config, setConfig] = useState({
        announcement: { show: true, bg: '#111827', color: '#ffffff', style: 'solid' as any, padding: 10, speed: 3, messages: [{ id: '1', text: 'Envíos gratis por compras superiores a $150.000' }] },
        header: {
            logo_type: 'text' as any, logo_text: 'BAYUP STORE', logo_image: null as any, logo_font: 'Syncopate', logo_effect: 'none' as any, logo_width: 150, logo_position: 'left' as any, logo_color: '#111827',
            nav_items: [{ id: '1', label: 'Inicio', href: '/', type: 'url' }, { id: '2', label: 'Catálogo', href: '/shop', type: 'url' }] as NavItem[],
            nav_font: 'Inter', nav_font_size: 10, nav_spacing: 32, nav_color: '#94a3b8', nav_alignment: 'center' as any,
            bar_style: 'solid' as any, bar_bg: '#ffffff', bar_height: 80, bar_border_weight: 1, 
            shortcuts: [{ id: 'sc1', type: 'search', icon: '🔍', href: '#', style: 'minimal' }, { id: 'sc2', type: 'cart', icon: '👜', href: '/cart', style: 'minimal' }] as ShortcutIcon[], icon_color: '#111827'
        },
        template: {
            hero: { 
                bg_type: 'image' as any, bg_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop', 
                headline: 'NUEVA COLECCIÓN', headline_font: 'Bebas Neue', headline_size: 72, headline_color: '#ffffff', headline_is_bold: true, headline_is_italic: false, headline_effect: 'none' as any,
                subheadline: 'Estilo sin límites para tu día a día.', subheadline_font: 'Inter', subheadline_size: 20, subheadline_color: '#ffffff', subheadline_is_bold: false, subheadline_is_italic: false,
                button_text: 'Explorar Ahora', button_url: '/shop', button_bg: '#ffffff', button_color: '#111827', button_radius: 99, button_style: 'solid' as any, button_size: 10, button_is_bold: true,
                alignment: 'center' as any, animation: 'slide' as any, overlay_opacity: 0.3 
            }
        }
    });

    const [activeTab, setActiveTab] = useState<'cabecera' | 'plantilla' | 'final'>('cabecera');
    const [subTab, setSubTab] = useState<'none' | 'announcement' | 'header_logo' | 'header_menu' | 'header_icons' | 'header_appearance' | 'template_hero'>('none');
    const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
    const [editingLink, setEditingLink] = useState<NavItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!config.announcement.show || config.announcement.messages.length <= 1) return;
        const interval = setInterval(() => setCurrentAnnIndex((prev) => (prev + 1) % config.announcement.messages.length), config.announcement.speed * 1000);
        return () => clearInterval(interval);
    }, [config.announcement.messages.length, config.announcement.speed, config.announcement.show]);

    const updateHeader = (field: string, value: any) => setConfig(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
    const updateAnnouncement = (field: string, value: any) => setConfig(prev => ({ ...prev, announcement: { ...prev.announcement, [field]: value } }));
    const updateHero = (field: string, value: any) => setConfig(prev => ({ ...prev, template: { ...prev.template, hero: { ...prev.template.hero, [field]: value } } }));
    const updateShortcut = (id: string, field: keyof ShortcutIcon, value: any) => updateHeader('shortcuts', config.header.shortcuts.map(s => s.id === id ? { ...s, [field]: value } : s));

    const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            updateHero('bg_url', url);
            updateHero('bg_type', file.type.startsWith('video/') ? 'video' : 'image');
        }
    };

    const getAnnBarStyle = () => {
        const { style, bg, color } = config.announcement;
        switch (style) {
            case 'gradient': return { backgroundColor: bg, color, backgroundImage: `linear-gradient(90deg, ${bg}, #9333ea)` };
            case 'neon': return { backgroundColor: '#000000', color: bg, borderBottom: `2px solid ${bg}`, boxShadow: `0 0 15px ${bg}40` };
            case 'glass': return { backgroundColor: `${bg}80`, color, backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' };
            case 'border': return { backgroundColor: '#ffffff', color: '#111827', borderBottom: `3px solid ${bg}` };
            default: return { backgroundColor: bg, color };
        }
    };

    const getLogoStyle = () => {
        const { logo_effect, logo_color, logo_font } = config.header;
        const fontClass = FONTS.find(f => f.name === logo_font)?.class || '';
        let style: any = { color: logo_color };
        switch (logo_effect) {
            case 'shadow': style.textShadow = `2px 2px 10px ${logo_color}40`; break;
            case 'outline': style.WebkitTextStroke = `1px ${logo_color}`; style.color = 'transparent'; break;
            case 'neon': style.textShadow = `0 0 5px #fff, 0 0 10px #fff, 0 0 20px ${logo_color}, 0 0 30px ${logo_color}`; break;
            case 'italic': style.fontStyle = 'italic'; style.transform = 'skewX(-10deg)'; break;
        }
        return { style, fontClass };
    };

    const getHeroHeadlineStyle = () => {
        const h = config.template.hero;
        const fontClass = FONTS.find(f => f.name === h.headline_font)?.class || '';
        let style: any = { color: h.headline_color, fontSize: `${h.headline_size}px`, fontWeight: h.headline_is_bold ? '900' : '400', fontStyle: h.headline_is_italic ? 'italic' : 'normal' };
        switch (h.headline_effect) {
            case 'shadow': style.textShadow = '0 10px 30px rgba(0,0,0,0.5)'; break;
            case 'outline': style.WebkitTextStroke = `2px ${h.headline_color}`; style.color = 'transparent'; break;
            case 'neon': style.textShadow = `0 0 10px ${h.headline_color}, 0 0 20px ${h.headline_color}`; break;
            case '3d': style.textShadow = `0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1)`; break;
        }
        return { style, fontClass };
    };

    return (
        <div className="fixed inset-0 bg-gray-50 flex overflow-hidden z-[200]">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@700&family=Bebas+Neue&family=Playfair+Display:ital,wght@0,900;1,900&family=Space+Grotesk:wght@700&family=Montserrat:wght@900&family=Raleway:wght@300&family=Outfit:wght@800&family=Fraunces:ital,wght@1,900&family=Cormorant+Garamond:ital,wght@1,700&display=swap');`}</style>

            <aside className="w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-2xl relative z-20">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4"><Link href="/dashboard/pages" className="text-gray-400 hover:text-purple-600 transition-all">←</Link><h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Editor Maestro</h2></div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>

                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    {['cabecera', 'plantilla', 'final'].map((tab) => (
                        <button key={tab} onClick={() => { setActiveTab(tab as any); setSubTab('none'); }} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-purple-600 bg-white border-b-2 border-purple-600' : 'text-gray-400 hover:bg-gray-50'}`}>{tab}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* MENÚ CABECERA */}
                    {activeTab === 'cabecera' && subTab === 'none' && (
                        <div className="p-8 space-y-4 animate-in fade-in duration-500">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Módulos de Cabecera</h3>
                            <button onClick={() => setSubTab('announcement')} className="w-full p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-between hover:border-purple-200 transition-all group shadow-sm"><div className="flex items-center gap-4"><span className="text-2xl">📢</span><div className="text-left"><p className="text-sm font-black text-gray-900">Barra de Anuncios</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Carrusel y Estilo</p></div></div><span className="text-gray-300 group-hover:text-purple-600">→</span></button>
                            <button onClick={() => setSubTab('header_logo')} className="w-full p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-between hover:border-purple-200 transition-all group shadow-sm"><div className="flex items-center gap-4"><span className="text-2xl">✍️</span><div className="text-left"><p className="text-sm font-black text-gray-900">Diseño de Logo</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tipografía y Posición</p></div></div><span className="text-gray-300 group-hover:text-purple-600">→</span></button>
                            <button onClick={() => setSubTab('header_menu')} className="w-full p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-between hover:border-purple-200 transition-all group shadow-sm"><div className="flex items-center gap-4"><span className="text-2xl">📋</span><div className="text-left"><p className="text-sm font-black text-gray-900">Gestión de Menú</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Items y Enlaces</p></div></div><span className="text-gray-300 group-hover:text-purple-600">→</span></button>
                            <button onClick={() => setSubTab('header_icons')} className="w-full p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-between hover:border-purple-200 transition-all group shadow-sm"><div className="flex items-center gap-4"><span className="text-2xl">🔍</span><div className="text-left"><p className="text-sm font-black text-gray-900">Iconos y Atajos</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Lupa y Carrito</p></div></div><span className="text-gray-300 group-hover:text-purple-600">→</span></button>
                            <button onClick={() => setSubTab('header_appearance')} className="w-full p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-between hover:border-purple-200 transition-all group shadow-sm"><div className="flex items-center gap-4"><span className="text-2xl">✨</span><div className="text-left"><p className="text-sm font-black text-gray-900">Apariencia Barra</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Vidrio y Altura</p></div></div><span className="text-gray-300 group-hover:text-purple-600">→</span></button>
                        </div>
                    )}

                    {/* SUBMODULOS CABECERA (RESTAURACIÓN TOTAL) */}
                    {activeTab === 'cabecera' && subTab === 'announcement' && (
                        <div className="p-8 space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3"><button onClick={() => setSubTab('none')} className="text-purple-600 font-black text-xs">←</button><h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Barra de Anuncios</h3></div>
                            <section className="space-y-8">
                                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100"><div><p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Estado</p><p className="text-[8px] font-bold text-gray-400 uppercase">{config.announcement.show ? 'Visible' : 'Oculta'}</p></div><button onClick={() => updateAnnouncement('show', !config.announcement.show)} className={`w-12 h-6 rounded-full relative transition-all ${config.announcement.show ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${config.announcement.show ? 'translate-x-6' : ''}`}></div></button></div>
                                <div className="grid grid-cols-5 gap-2">{ANNOUNCEMENT_STYLES.map(s => (<button key={s.id} onClick={() => updateAnnouncement('style', s.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${config.announcement.style === s.id ? 'bg-purple-50 border-purple-200' : 'bg-white'}`}><span className="text-lg">{s.icon}</span><span className={`text-[7px] font-black uppercase`}>{s.label}</span></button>))}</div>
                                <div className="grid grid-cols-2 gap-4"><ColorPicker label="Fondo" value={config.announcement.bg} onChange={(v) => updateAnnouncement('bg', v)} /><ColorPicker label="Texto" value={config.announcement.color} onChange={(v) => updateAnnouncement('color', v)} /></div>
                                <div className="space-y-2"><div className="flex justify-between text-[9px] font-black uppercase text-gray-400"><span>Grosor</span><span>{config.announcement.padding}px</span></div><input type="range" min="4" max="30" value={config.announcement.padding} onChange={(e) => updateAnnouncement('padding', parseInt(e.target.value))} className="w-full accent-purple-600" /></div>
                                <div className="space-y-2"><div className="flex justify-between text-[9px] font-black uppercase text-gray-400"><span>Velocidad</span><span>{config.announcement.speed}s</span></div><input type="range" min="1" max="10" value={config.announcement.speed} onChange={(e) => updateAnnouncement('speed', parseInt(e.target.value))} className="w-full accent-purple-600" /></div>
                                <div className="space-y-4 pt-4 border-t"><div className="flex justify-between text-[9px] font-black uppercase text-gray-400"><span>Mensajes</span><button onClick={() => updateAnnouncement('messages', [...config.announcement.messages, { id: Math.random().toString(), text: 'Nuevo Anuncio' }])} className="text-purple-600 font-black">+ Añadir</button></div>{config.announcement.messages.map((m, i) => (<div key={m.id} className="flex gap-2"><input type="text" value={m.text} onChange={(e) => { const newMsgs = [...config.announcement.messages]; newMsgs[i].text = e.target.value; updateAnnouncement('messages', newMsgs); }} className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-medium focus:bg-white outline-none" /><button onClick={() => updateAnnouncement('messages', config.announcement.messages.filter(x => x.id !== m.id))} className="text-gray-300 hover:text-rose-500">✕</button></div>))}</div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'cabecera' && subTab === 'header_logo' && (
                        <div className="p-8 space-y-10 animate-in slide-in-from-right-4 duration-500 pb-20">
                            <div className="flex items-center gap-3"><button onClick={() => setSubTab('none')} className="text-purple-600 font-black text-xs">←</button><h3 className="text-xs font-black text-gray-900 uppercase">Diseño de Logo</h3></div>
                            <section className="space-y-8">
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl"><button onClick={() => updateHeader('logo_type', 'text')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg ${config.header.logo_type === 'text' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>Texto</button><button onClick={() => updateHeader('logo_type', 'image')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg ${config.header.logo_type === 'image' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>Imagen</button></div>
                                {config.header.logo_type === 'text' ? (
                                    <div className="space-y-6 animate-in zoom-in-95">
                                        <input type="text" value={config.header.logo_text} onChange={(e) => updateHeader('logo_text', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none" />
                                        <div><label className="text-[9px] font-black text-gray-400 uppercase">Tipografía</label><select value={config.header.logo_font} onChange={(e) => updateHeader('logo_font', e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-xs font-bold">{FONTS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}</select></div>
                                        <div className="grid grid-cols-5 gap-2">{LOGO_EFFECTS.map(eff => (<button key={eff.id} onClick={() => updateHeader('logo_effect', eff.id)} className={`flex flex-col items-center gap-2 p-2 rounded-xl border ${config.header.logo_effect === eff.id ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100'}`}><span className="text-lg">{eff.icon}</span></button>))}</div>
                                        <ColorPicker label="Color Logo" value={config.header.logo_color} onChange={(v) => updateHeader('logo_color', v)} />
                                    </div>
                                ) : (
                                    <label className="border-2 border-dashed border-gray-100 rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50"><input type="file" className="hidden" onChange={(e) => {const f = e.target.files?.[0]; if(f) updateHeader('logo_image', URL.createObjectURL(f));}} /><span className="text-2xl">🖼️</span><p className="text-[8px] font-black text-gray-400 uppercase mt-2">Cargar Imagen</p></label>
                                )}
                                <div className="grid grid-cols-3 gap-2 pt-4 border-t">{['Izquierda', 'Centro', 'Derecha'].map(pos => (<button key={pos} onClick={() => updateHeader('logo_position', pos === 'Izquierda' ? 'left' : pos === 'Centro' ? 'center' : 'right')} className={`py-2 rounded-lg text-[8px] font-black uppercase border ${config.header.logo_position === (pos === 'Izquierda' ? 'left' : pos === 'Centro' ? 'center' : 'right') ? 'bg-purple-600 text-white' : 'bg-white'}`}>{pos}</button>))}</div>
                                <div className="space-y-2"><div className="flex justify-between text-[9px] font-black uppercase text-gray-400"><span>Anchura Logo</span><span>{config.header.logo_width}px</span></div><input type="range" min="50" max="300" value={config.header.logo_width} onChange={(e) => updateHeader('logo_width', parseInt(e.target.value))} className="w-full accent-purple-600" /></div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'cabecera' && subTab === 'header_menu' && (
                        <div className="p-8 space-y-12 animate-in slide-in-from-right-4 duration-500 pb-20">
                            <div className="flex items-center gap-3"><button onClick={() => setSubTab('none')} className="text-purple-600 font-black text-xs">←</button><h3 className="text-xs font-black text-gray-900 uppercase">Gestión de Menú</h3></div>
                            <section className="space-y-8">
                                <div className="space-y-3">{config.header.nav_items.map((item, i) => (<div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group border border-transparent hover:border-purple-200 transition-all"><div className="flex-1"><p className="text-xs font-black text-gray-900">{item.label}</p><p className="text-[8px] font-bold text-purple-500 uppercase truncate max-w-[150px]">{item.type === 'url' ? item.href : `Ancla: ${item.target_id}`}</p></div><div className="flex gap-2"><button onClick={() => setEditingLink(item)} className="h-8 w-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-xs shadow-sm hover:text-purple-600">🔗</button><button onClick={() => updateHeader('nav_items', config.header.nav_items.filter(x => x.id !== item.id))} className="h-8 w-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-300 hover:text-rose-500">✕</button></div></div>))}<button onClick={() => updateHeader('nav_items', [...config.header.nav_items, { id: Math.random().toString(), label: 'Nuevo Enlace', href: '#', type: 'url' }])} className="w-full py-3 text-[9px] font-black text-purple-600 uppercase border border-dashed border-purple-200 rounded-xl hover:bg-purple-50">+ Añadir Ítem</button></div>
                                <div className="space-y-6 pt-4 border-t"><div><label className="text-[9px] font-black text-gray-400 uppercase">Tipografía</label><select value={config.header.nav_font} onChange={(e) => updateHeader('nav_font', e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-xs font-bold">{FONTS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}</select></div><ColorPicker label="Color Enlaces" value={config.header.nav_color} onChange={(v) => updateHeader('nav_color', v)} /></div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'cabecera' && subTab === 'header_icons' && (
                        <div className="p-8 space-y-10 animate-in slide-in-from-right-4 duration-500 pb-20">
                            <div className="flex items-center gap-3"><button onClick={() => setSubTab('none')} className="text-purple-600 font-black text-xs">←</button><h3 className="text-xs font-black text-gray-900 uppercase">Iconos y Atajos</h3></div>
                            <section className="space-y-8">
                                <div className="space-y-6">
                                    {config.header.shortcuts.map((sc) => (
                                        <div key={sc.id} className="p-6 bg-gray-50 rounded-[2rem] border border-transparent hover:border-purple-100 transition-all space-y-4 group">
                                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-2xl">{sc.icon}</span><p className="text-xs font-black text-gray-900 uppercase">{sc.type}</p></div><button onClick={() => updateHeader('shortcuts', config.header.shortcuts.filter(x => x.id !== sc.id))} className="text-gray-300 hover:text-rose-500">✕</button></div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <select value={sc.style} onChange={(e) => updateShortcut(sc.id, 'style', e.target.value as any)} className="w-full p-2 bg-white rounded-lg text-[10px] font-bold border border-gray-100"><option value="minimal">Fino</option><option value="bold">Grueso</option><option value="circle">Circular</option></select>
                                                <select value={sc.icon} onChange={(e) => updateShortcut(sc.id, 'icon', e.target.value)} className="w-full p-2 bg-white rounded-lg text-[10px] font-bold border border-gray-100"><option value="🔍">🔍 Lupa</option><option value="🛒">🛒 Carrito</option><option value="👤">👤 Usuario</option></select>
                                            </div>
                                            <input type="text" value={sc.href} onChange={(e) => updateShortcut(sc.id, 'href', e.target.value)} placeholder="URL..." className="w-full p-2 bg-white rounded-lg text-[10px] font-medium border border-gray-100" />
                                        </div>
                                    ))}
                                    <button onClick={() => updateHeader('shortcuts', [...config.header.shortcuts, { id: Math.random().toString(), type: 'custom', icon: '👤', href: '#', style: 'minimal' }])} className="w-full py-3 text-[9px] font-black text-purple-600 uppercase border border-dashed border-purple-200 rounded-xl hover:bg-purple-50">+ Añadir Icono</button>
                                </div>
                                <ColorPicker label="Color Global Iconos" value={config.header.icon_color} onChange={(v) => updateHeader('icon_color', v)} />
                            </section>
                        </div>
                    )}

                    {activeTab === 'cabecera' && subTab === 'header_appearance' && (
                        <div className="p-8 space-y-10 animate-in slide-in-from-right-4 duration-500 pb-20">
                            <div className="flex items-center gap-3"><button onClick={() => setSubTab('none')} className="text-purple-600 font-black text-xs">←</button><h3 className="text-xs font-black text-gray-900 uppercase">Apariencia Barra</h3></div>
                            <section className="space-y-8">
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl"><button onClick={() => updateHeader('bar_style', 'solid')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg ${config.header.bar_style === 'solid' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>Sólido</button><button onClick={() => updateHeader('bar_style', 'glass')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg ${config.header.bar_style === 'glass' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>Vidrio</button></div>
                                <ColorPicker label="Fondo" value={config.header.bar_bg} onChange={(v) => updateHeader('bar_bg', v)} />
                                <div className="space-y-2"><div className="flex justify-between text-[9px] font-black text-gray-400 uppercase"><span>Altura</span><span>{config.header.bar_height}px</span></div><input type="range" min="60" max="150" value={config.header.bar_height} onChange={(e) => updateHeader('bar_height', parseInt(e.target.value))} className="w-full accent-purple-600 h-1.5" /></div>
                                <div className="flex justify-between items-center"><label className="text-[9px] font-black text-gray-400 uppercase">Grosor Borde</label><input type="number" value={config.header.bar_border_weight} onChange={(e) => updateHeader('bar_border_weight', parseInt(e.target.value))} className="w-16 p-2 bg-gray-50 rounded-lg text-xs font-black" /></div>
                            </section>
                        </div>
                    )}

                    {/* ZONA PLANTILLA (BANNER HERO SUPER POTENCIADO) */}
                    {activeTab === 'plantilla' && subTab === 'none' && (
                        <div className="p-8 space-y-4 animate-in fade-in duration-500">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Módulos del Cuerpo</h3>
                            <button onClick={() => setSubTab('template_hero')} className="w-full p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-between hover:border-purple-200 transition-all group shadow-sm"><div className="flex items-center gap-4"><span className="text-2xl">🖼️</span><div className="text-left"><p className="text-sm font-black text-gray-900">Banner Principal</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Multimedia y Animaciones</p></div></div><span className="text-gray-300 group-hover:text-purple-600">→</span></button>
                        </div>
                    )}

                    {activeTab === 'plantilla' && subTab === 'template_hero' && (
                        <div className="p-8 space-y-12 animate-in slide-in-from-right-4 duration-500 pb-20">
                            <div className="flex items-center gap-3"><button onClick={() => setSubTab('none')} className="text-purple-600 font-black text-xs">←</button><h3 className="text-xs font-black text-gray-900 uppercase">Ajustes Banner Hero</h3></div>
                            <section className="space-y-8">
                                <h4 className="text-[10px] font-black text-gray-900 uppercase border-b pb-2 tracking-widest">1. Fondo</h4>
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl"><button onClick={() => updateHero('bg_type', 'image')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg ${config.template.hero.bg_type === 'image' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>Imagen</button><button onClick={() => updateHero('bg_type', 'video')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg ${config.template.hero.bg_type === 'video' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>Video</button></div>
                                <label className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 transition-all"><input type="file" className="hidden" onChange={handleHeroFileUpload} /><span className="text-3xl">📤</span><p className="text-[8px] font-black text-gray-400 uppercase mt-2">Cargar Fondo</p></label>
                                <div className="space-y-2"><div className="flex justify-between text-[9px] font-black uppercase text-gray-400"><span>Opacidad</span><span>{Math.round(config.template.hero.overlay_opacity * 100)}%</span></div><input type="range" min="0" max="0.8" step="0.1" value={config.template.hero.overlay_opacity} onChange={(e) => updateHero('overlay_opacity', parseFloat(e.target.value))} className="w-full accent-purple-600" /></div>
                            </section>
                            <section className="space-y-8 pt-8 border-t">
                                <h4 className="text-[10px] font-black text-gray-900 uppercase border-b pb-2 tracking-widest">2. Titular</h4>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase">Título</label><input type="text" value={config.template.hero.headline} onChange={(e) => updateHero('headline', e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm font-bold focus:bg-white outline-none" /></div>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase">Tipografía</label><select value={config.template.hero.headline_font} onChange={(e) => updateHero('headline_font', e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-xs font-bold">{FONTS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}</select></div>
                                <div className="grid grid-cols-2 gap-4"><ColorPicker label="Color" value={config.template.hero.headline_color} onChange={(v) => updateHero('headline_color', v)} /><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">Tamaño</label><input type="number" value={config.template.hero.headline_size} onChange={(e) => updateHero('headline_size', parseInt(e.target.value))} className="w-full p-2 bg-gray-50 rounded-lg text-xs font-black" /></div></div>
                                <div className="grid grid-cols-5 gap-2">{TEXT_EFFECTS.map(eff => (<button key={eff.id} onClick={() => updateHero('headline_effect', eff.id)} className={`flex flex-col items-center gap-2 p-2 rounded-xl border ${config.template.hero.headline_effect === eff.id ? 'bg-purple-50 border-purple-200' : 'bg-white'}`}><span className="text-lg">{eff.icon}</span></button>))}</div>
                            </section>
                            <section className="space-y-8 pt-8 border-t">
                                <h4 className="text-[10px] font-black text-gray-900 uppercase border-b pb-2 tracking-widest">3. Subtitular</h4>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase">Texto</label><textarea value={config.template.hero.subheadline} onChange={(e) => updateHero('subheadline', e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-xs h-20 resize-none outline-none" /></div>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase">Tipografía</label><select value={config.template.hero.subheadline_font} onChange={(e) => updateHero('subheadline_font', e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-xs font-bold">{FONTS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}</select></div>
                                <div className="grid grid-cols-2 gap-4"><ColorPicker label="Color" value={config.template.hero.subheadline_color} onChange={(v) => updateHero('subheadline_color', v)} /><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">Tamaño</label><input type="number" value={config.template.hero.subheadline_size} onChange={(e) => updateHero('subheadline_size', parseInt(e.target.value))} className="w-full p-2 bg-gray-50 rounded-lg text-xs font-black" /></div></div>
                            </section>
                            <section className="space-y-8 pt-8 border-t">
                                <h4 className="text-[10px] font-black text-gray-900 uppercase border-b pb-2 tracking-widest">4. Botón</h4>
                                <div className="grid grid-cols-2 gap-4"><div><label className="text-[9px] font-black text-gray-400 uppercase">Texto</label><input type="text" value={config.template.hero.button_text} onChange={(e) => updateHero('button_text', e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-xs outline-none" /></div><div><label className="text-[9px] font-black text-gray-400 uppercase">Link</label><input type="text" value={config.template.hero.button_url} onChange={(e) => updateHero('button_url', e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-xs outline-none" /></div></div>
                                <div className="grid grid-cols-2 gap-4"><ColorPicker label="Fondo" value={config.template.hero.button_bg} onChange={(v) => updateHero('button_bg', v)} /><ColorPicker label="Texto" value={config.template.hero.button_color} onChange={(v) => updateHero('button_color', v)} /></div>
                                <div className="grid grid-cols-3 gap-2">{['solid', 'outline', 'glass'].map(st => (<button key={st} onClick={() => updateHero('button_style', st)} className={`py-2 rounded-lg text-[8px] font-black uppercase border ${config.template.hero.button_style === st ? 'bg-purple-600 text-white' : 'bg-white'}`}>{st}</button>))}</div>
                                <div className="space-y-2"><div className="flex justify-between text-[9px] font-black text-gray-400 uppercase"><span>Redondeado</span><span>{config.template.hero.button_radius}px</span></div><input type="range" min="0" max="99" value={config.template.hero.button_radius} onChange={(e) => updateHero('button_radius', parseInt(e.target.value))} className="w-full accent-purple-600" /></div>
                            </section>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-gray-100 bg-white"><button onClick={() => { setIsSaving(true); setTimeout(() => {setIsSaving(false); alert("Sitio publicado!");}, 1000); }} className="w-full bg-purple-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-purple-700 active:scale-95">Publicar Sitio</button></div>
            </aside>

            {/* 2. AREA DE PREVISUALIZACIÓN */}
            <main className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-gray-200 flex flex-col items-center">
                <div className="w-full max-w-5xl bg-white shadow-[0_60px_120px_rgba(0,0,0,0.12)] rounded-[2.5rem] overflow-hidden min-h-[150vh] transition-all duration-500 relative">
                    {/* CABECERA (Blindada) */}
                    {config.announcement.show && <div className="w-full flex items-center justify-center text-center py-3" style={getAnnBarStyle() as any}><p className="text-[10px] font-black uppercase tracking-[0.15em] animate-in fade-in duration-700" key={currentAnnIndex}>{config.announcement.messages[currentAnnIndex]?.text}</p></div>}
                    <header 
                        className={`px-12 transition-all duration-500 flex items-center relative z-[100] ${config.header.bar_style === 'glass' ? 'bg-white/60 backdrop-blur-xl sticky top-0' : 'bg-white'}`}
                        style={{ height: config.header.bar_height, borderBottom: `${config.header.bar_border_weight}px solid #f1f5f9`, backgroundColor: config.header.bar_style === 'solid' ? config.header.bar_bg : '', justifyContent: 'space-between', flexDirection: config.header.logo_position === 'right' ? 'row-reverse' : 'row' }}
                    >
                        <div className={`flex items-center transition-all duration-500 ${config.header.logo_position === 'center' ? 'absolute left-1/2 -translate-x-1/2' : ''}`} style={{ width: config.header.logo_width }}>
                            {config.header.logo_type === 'text' ? (<span className={`text-2xl transition-all duration-500 ${getLogoStyle().fontClass}`} style={getLogoStyle().style}>{config.header.logo_text}</span>) : (<img src={config.header.logo_image || ''} className="h-full w-auto max-h-[80%] object-contain" alt="Logo" style={{ display: config.header.logo_image ? 'block' : 'none' }} />)}
                        </div>
                        <nav className={`flex transition-all duration-500 ${FONTS.find(f => f.name === config.header.nav_font)?.class || ''}`} style={{ gap: `${config.header.nav_spacing}px` }}>{config.header.nav_items.map(item => (<span key={item.id} className="font-black uppercase tracking-widest text-[10px]" style={{ color: config.header.nav_color }}>{item.label}</span>))}</nav>
                        <div className="flex gap-6 items-center">
                            {config.header.shortcuts.map(sc => (
                                <span 
                                    key={sc.id} 
                                    className={`text-lg cursor-pointer transition-all hover:scale-110 ${sc.style === 'circle' ? 'bg-gray-50 h-10 w-10 flex items-center justify-center rounded-full border border-gray-100' : ''} ${sc.style === 'bold' ? 'font-black' : ''}`}
                                    style={{ color: config.header.icon_color }}
                                >
                                    {sc.icon}
                                </span>
                            ))}
                        </div>
                    </header>

                    {/* BANNER HERO */}
                    <section className="relative h-[650px] overflow-hidden group/hero cursor-pointer" onClick={() => {setActiveTab('plantilla'); setSubTab('template_hero');}}>
                        <div className="absolute inset-0 bg-gray-900">
                            {config.template.hero.bg_type === 'image' ? (<img src={config.template.hero.bg_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover/hero:scale-105" alt="Hero" />) : (<div className="w-full h-full flex items-center justify-center text-white font-black uppercase tracking-[0.5em] text-xl bg-gray-800">Reproduciendo Video...</div>)}
                            <div className="absolute inset-0 transition-all duration-500" style={{ backgroundColor: `rgba(0,0,0,${config.template.hero.overlay_opacity})` }}></div>
                        </div>
                        <div className={`absolute inset-0 flex flex-col justify-center px-24 z-10 ${config.template.hero.alignment === 'center' ? 'items-center text-center' : config.template.hero.alignment === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                            <div className={`max-w-4xl space-y-8 ${ANIMATIONS.find(a => a.id === config.template.hero.animation)?.class || ''}`}>
                                <h1 className={`${FONTS.find(f => f.name === config.template.hero.headline_font)?.class || ''} transition-all duration-500 tracking-tighter leading-[0.9]`} style={getHeroHeadlineStyle().style}>{config.template.hero.headline}</h1>
                                <p className={`${FONTS.find(f => f.name === config.template.hero.subheadline_font)?.class || ''} transition-all duration-500 max-w-xl`} style={{ color: config.template.hero.subheadline_color, fontSize: `${config.template.hero.subheadline_size}px`, fontWeight: config.template.hero.subheadline_is_bold ? '700' : '400' }}>{config.template.hero.subheadline}</p>
                                <button 
                                    className={`px-12 py-5 uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-110 active:scale-95`}
                                    style={{ 
                                        backgroundColor: config.template.hero.button_style === 'outline' ? 'transparent' : (config.template.hero.button_style === 'glass' ? 'rgba(255,255,255,0.2)' : config.template.hero.button_bg),
                                        color: config.template.hero.button_color,
                                        borderRadius: `${config.template.hero.button_radius}px`,
                                        border: config.template.hero.button_style === 'outline' ? `2px solid ${config.template.hero.button_bg}` : (config.template.hero.button_style === 'glass' ? '1px solid rgba(255,255,255,0.3)' : 'none'),
                                        backdropFilter: config.template.hero.button_style === 'glass' ? 'blur(10px)' : 'none',
                                        fontSize: `${config.template.hero.button_size + 4}px`,
                                        fontWeight: config.template.hero.button_is_bold ? '900' : '400'
                                    }}
                                >
                                    {config.template.hero.button_text}
                                </button>
                            </div>
                        </div>
                        <div className="absolute inset-0 border-4 border-purple-500 opacity-0 group-hover/hero:opacity-100 transition-opacity pointer-events-none"></div>
                    </section>
                </div>
            </main>

            {/* MODAL: LINKS INTELIGENTES (Restaurado) */}
            {editingLink && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between"><div><h2 className="text-xl font-black text-gray-900 tracking-tight">Editar Enlace</h2></div><button onClick={() => setEditingLink(null)} className="text-gray-400 hover:text-gray-900 text-xl">✕</button></div>
                        <div className="p-8 space-y-6">
                            <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Etiqueta</label><input type="text" value={editingLink.label} onChange={(e) => setEditingLink({...editingLink, label: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-200" /></div>
                            <div className="space-y-4"><label className="text-[9px] font-black text-gray-400 uppercase">Destino</label><div className="grid grid-cols-2 gap-2"><button onClick={() => setEditingLink({...editingLink, type: 'url'})} className={`py-2 rounded-lg text-[8px] font-black uppercase border ${editingLink.type === 'url' ? 'bg-purple-600 text-white' : 'bg-white'}`}>URL Externa</button><button onClick={() => setEditingLink({...editingLink, type: 'anchor'})} className={`py-2 rounded-lg text-[8px] font-black uppercase border ${editingLink.type === 'anchor' ? 'bg-purple-600 text-white' : 'bg-white'}`}>Sección</button></div><input type="text" value={editingLink.href} onChange={(e) => setEditingLink({...editingLink, href: e.target.value})} placeholder="Destino..." className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" /></div>
                        </div>
                        <div className="p-8 pt-0"><button onClick={() => { updateHeader('nav_items', config.header.nav_items.map(x => x.id === editingLink.id ? editingLink : x)); setEditingLink(null); }} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Confirmar</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
