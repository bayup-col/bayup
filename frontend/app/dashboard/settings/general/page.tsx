"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { WhatsAppLine } from '@/lib/types';
import { userService } from '@/lib/api';

export default function GeneralSettings() {
    const { token, isAuthenticated } = useAuth();
    const [storeName, setStoreName] = useState("");
    const [storeEmail, setStoreEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(true);

    // Estado de WhatsApp Multi-línea (Máximo 3)
    const [whatsappLines, setWhatsappLines] = useState<WhatsAppLine[]>([]);

    // Estado de conexiones sociales
    const [connections, setConnections] = useState({
        instagram: false,
        facebook: false,
        tiktok: false,
        telegram: false
    });

    const [linkingId, setLinkingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !token) return;
        setLoading(true);
        try {
            const userData: any = await userService.getMe(token);
            if (userData) {
                setStoreEmail(userData.email || "");
                setWhatsappLines(userData.whatsapp_lines || []);
                
                // Cargar conexiones sociales desde social_links
                if (userData.social_links) {
                    setConnections(prev => ({
                        ...prev,
                        ...userData.social_links
                    }));
                }

                const savedName = localStorage.getItem('storeName');
                setStoreName(savedName || "Mi Tienda Online");
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [isAuthenticated, token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddWhatsApp = () => {
        if (whatsappLines.length >= 3) return alert("Máximo 3 líneas permitidas.");
        const newLine: WhatsAppLine = {
            id: `line_${Math.random().toString(36).substr(2, 9)}`,
            name: `Línea ${whatsappLines.length + 1}`,
            number: '',
            status: 'Connected'
        };
        setWhatsappLines([...whatsappLines, newLine]);
    };

    const handleRemoveWhatsApp = (id: string) => {
        setWhatsappLines(whatsappLines.filter(l => l.id !== id));
    };

    const handleWhatsAppChange = (id: string, field: keyof WhatsAppLine, value: string) => {
        setWhatsappLines(whatsappLines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const handleSave = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            localStorage.setItem('storeName', storeName);
            window.dispatchEvent(new Event('storage'));

            // Guardar todo en el backend usando el servicio centralizado
            await userService.updateSocialLinks(token, connections);
            await userService.updateWhatsAppLines(token, whatsappLines);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) { 
            alert(err instanceof Error ? err.message : "Error al sincronizar."); 
        } finally { setIsSaving(false); }
    };

    if (loading) return <div className="flex justify-center items-center min-h-[400px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Configuración</h1>
                    <p className="text-gray-500 mt-2 font-medium">Centraliza la conectividad y la identidad de tu negocio.</p>
                </div>
                {showSuccess && (
                    <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-100 animate-in slide-in-from-top-2 duration-300">
                        ¡Configuración guardada! ✨
                    </div>
                )}
            </div>

            {/* 1. Identidad */}
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-10 space-y-8">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Identidad Visual</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                        <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Oficial</label>
                        <input type="email" value={storeEmail} disabled className="w-full mt-2 p-4 bg-gray-50/50 border border-transparent rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed italic" />
                    </div>
                </div>
            </div>

            {/* 2. WHATSAPP MULTI-LÍNEA */}
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-10 space-y-8 relative overflow-hidden">
                <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">WhatsApp Multi-línea</h2>
                        <button 
                            onClick={handleAddWhatsApp}
                            disabled={whatsappLines.length >= 3}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${whatsappLines.length >= 3 ? 'bg-gray-50 text-gray-300' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600'}`}
                        >
                            + Añadir Línea
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">
                        Configura hasta **3 líneas simultáneas**. Estas serán las líneas que atenderán en **Separados (IA)** y las que verás diferenciadas en el módulo de **Mensajes**.
                    </p>

                    <div className="space-y-4">
                        {whatsappLines.map((line, index) => (
                            <div key={line.id} className="p-6 bg-gray-50 rounded-[2rem] border border-transparent flex flex-col md:flex-row items-center gap-6 animate-in zoom-in-95 duration-300 relative group">
                                <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-100">📱</div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre / Asesor (Línea {index + 1})</label>
                                        <input type="text" value={line.name} onChange={(e) => handleWhatsAppChange(line.id, 'name', e.target.value)} className="w-full mt-1 p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Número de Teléfono</label>
                                        <input type="text" placeholder="+57 ..." value={line.number} onChange={(e) => handleWhatsAppChange(line.id, 'number', e.target.value)} className="w-full mt-1 p-3 bg-white border border-gray-100 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveWhatsApp(line.id)} className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">✕</button>
                            </div>
                        ))}
                        {whatsappLines.length === 0 && (
                            <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No hay líneas de WhatsApp vinculadas</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-[0.03] rotate-12">📱</div>
            </div>

            {/* 3. Conexiones Sociales */}
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-10 space-y-8">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Redes Sociales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { id: 'instagram', label: 'Instagram', icon: '📸', color: 'hover:border-pink-200' },
                        { id: 'facebook', label: 'Facebook', icon: '🔵', color: 'hover:border-blue-200' },
                        { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'hover:border-gray-900' },
                        { id: 'telegram', label: 'Telegram', icon: '✈️', color: 'hover:border-sky-200' }
                    ].map((social) => (
                        <button 
                            key={social.id} 
                            onClick={() => setConnections({...connections, [social.id]: !connections[social.id as keyof typeof connections]})}
                            className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${social.color} ${connections[social.id as keyof typeof connections] ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100'}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`text-2xl transition-all ${connections[social.id as keyof typeof connections] ? '' : 'grayscale'}`}>{social.icon}</span>
                                <div className="text-left">
                                    <p className="text-sm font-black text-gray-900">{social.label}</p>
                                    <p className={`text-[9px] font-black uppercase mt-1 ${connections[social.id as keyof typeof connections] ? 'text-purple-600' : 'text-gray-400'}`}>
                                        {connections[social.id as keyof typeof connections] ? 'Vinculado' : 'Desconectado'}
                                    </p>
                                </div>
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${connections[social.id as keyof typeof connections] ? 'bg-purple-600 border-purple-600' : 'border-gray-100'}`}>
                                {connections[social.id as keyof typeof connections] && <span className="text-white text-[10px]">✓</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Dominio */}
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-10 space-y-8">
                <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Dominio
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
                    </h2>
                    <span className="bg-purple-600 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-[0.2em] shadow-lg shadow-purple-100">Premium Plan</span>
                </div>
                <div className="bg-gray-50 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-gray-100">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tu dirección web actual</p>
                        <p className="text-lg text-purple-600 font-black tracking-tight italic">
                            {storeName.toLowerCase().replace(/\s+/g, '') || 'mitienda'}.bayup.com
                        </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-8 py-3.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200">Vincular Dominio</button>
                        <button className="flex-1 md:flex-none px-8 py-3.5 border-2 border-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Comprar Dominio</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-purple-100 transition-all active:scale-95 disabled:opacity-70"
                >
                    {isSaving ? 'Sincronizando...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
}
