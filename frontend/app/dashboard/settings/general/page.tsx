"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Mail, 
  Smartphone, 
  Globe, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Link2,
  Camera,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe2,
  X
} from 'lucide-react';
import { useAuth } from "@/context/auth-context";
import { useToast } from '@/context/toast-context';
import { WhatsAppLine } from '@/lib/types';
import { userService } from '@/lib/api';

export default function GeneralSettings() {
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const [storeName, setStoreName] = useState("");
    const [storeEmail, setStoreEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [whatsappLines, setWhatsappLines] = useState<WhatsAppLine[]>([]);
    const [connections, setConnections] = useState({
        instagram: false,
        facebook: false,
        tiktok: false,
        telegram: false
    });

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !token) return;
        setLoading(true);
        try {
            const userData: any = await userService.getMe(token);
            if (userData) {
                setStoreEmail(userData.email || "");
                setWhatsappLines(userData.whatsapp_lines || []);
                if (userData.social_links) setConnections(prev => ({ ...prev, ...userData.social_links }));
                const savedName = localStorage.getItem('storeName');
                setStoreName(savedName || "Mi Tienda Online");
            }
        } catch (err) { 
            showToast("Error al sincronizar datos", "error");
        } finally { setLoading(false); }
    }, [isAuthenticated, token, showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddWhatsApp = () => {
        if (whatsappLines.length >= 3) return showToast("Máximo 3 líneas permitidas", "info");
        setWhatsappLines([...whatsappLines, { id: `line_${Date.now()}`, name: '', number: '', status: 'Connected' }]);
    };

    const handleSave = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            localStorage.setItem('storeName', storeName);
            window.dispatchEvent(new Event('storage'));
            
            // Enviamos el objeto completo al backend
            await userService.updateDetails(token, {
                email: storeEmail,
                full_name: storeName,
                social_links: connections,
                whatsapp_lines: whatsappLines
            });
            showToast("Configuración actualizada correctamente", "success");
        } catch (err) { 
            showToast("Fallo en la sincronización", "error");
        } finally { setIsSaving(false); }
    };

    const handleSocialConnect = (platform: string) => {
        const urls: Record<string, string> = {
            instagram: "https://www.instagram.com/accounts/login/",
            facebook: "https://www.facebook.com/login",
            tiktok: "https://www.tiktok.com/login",
            telegram: "https://web.telegram.org/"
        };

        // Cambiamos el estado local para mostrar como vinculado
        setConnections(prev => ({ ...prev, [platform]: !prev[platform as keyof typeof prev] }));
        
        // Abrimos el enlace de login en una pestaña nueva
        if (!connections[platform as keyof typeof connections]) {
            window.open(urls[platform], '_blank');
        }
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
            <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600" size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Iniciando sistema...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-32">
            {/* Glossy Header */}
            <div className="bg-white/40 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30 px-8 py-6 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                        <Store size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Info General</h1>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tienda ID: {storeName.slice(0,3).toUpperCase()}-2026</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-100 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                    {isSaving ? 'Sincronizando' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* BLOQUE PRINCIPAL: IDENTIDAD (8 COLUMNAS) */}
                <div className="lg:col-span-8 space-y-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-100 border border-gray-50">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8 flex items-center gap-2">
                            <Zap size={14} className="text-purple-600" /> Identidad del Negocio
                        </h3>
                        <div className="space-y-10">
                            <div className="group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-purple-600 transition-colors">Nombre de tu marca</label>
                                <input 
                                    type="text" 
                                    value={storeName} 
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="w-full mt-2 bg-transparent text-4xl font-black text-gray-900 outline-none border-b-2 border-gray-50 focus:border-purple-600 transition-all pb-4 placeholder:text-gray-100"
                                    placeholder="Nombre de la Tienda"
                                />
                            </div>
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-gray-100 transition-all">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Correo de Soporte</p>
                                    <div className="flex items-center gap-3 text-gray-600 font-bold">
                                        <Mail size={18} className="text-gray-300" />
                                        {storeEmail}
                                    </div>
                                </div>
                                <div className="flex-1 p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100/50">
                                    <p className="text-[9px] font-black text-emerald-600/50 uppercase tracking-widest mb-2">Estado de Conexión</p>
                                    <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-[10px]">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Servidor Sincronizado
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* BLOQUE DOMINIO: ESTILO TECH */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-10">
                            <Globe2 size={250} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-3 py-1 bg-purple-600 rounded-full text-[8px] font-black uppercase tracking-widest">Global CDN</span>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest">SSL Active</span>
                            </div>
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Dirección de Acceso Público</p>
                            <h4 className="text-4xl font-black tracking-tighter mb-8">
                                {storeName.toLowerCase().replace(/\s+/g, '') || 'mitienda'}<span className="text-purple-500">.bayup.com</span>
                            </h4>
                            <div className="flex flex-wrap gap-4">
                                <button className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-white/5">
                                    <ExternalLink size={14} /> Abrir Tienda
                                </button>
                                <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                                    Configurar Dominio Propio
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* BARRA LATERAL: WHATSAPP Y SOCIAL (4 COLUMNAS) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* WhatsApp Cards */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">WhatsApp Business</h3>
                            <button onClick={handleAddWhatsApp} className="h-8 w-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 hover:scale-110 transition-all"><Plus size={18}/></button>
                        </div>
                        <AnimatePresence>
                            {whatsappLines.map((line, idx) => (
                                <motion.div 
                                    layout
                                    key={line.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl group relative"
                                >
                                    <button onClick={() => setWhatsappLines(whatsappLines.filter(l => l.id !== line.id))} className="absolute top-4 right-4 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xs">{idx+1}</div>
                                        <input 
                                            type="text" 
                                            value={line.name} 
                                            placeholder="Asesor"
                                            onChange={(e) => setWhatsappLines(whatsappLines.map(l => l.id === line.id ? {...l, name: e.target.value} : l))}
                                            className="bg-transparent text-xs font-black text-gray-900 outline-none uppercase tracking-widest placeholder:text-gray-200"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                                        <Smartphone size={14} className="text-gray-300" />
                                        <input 
                                            type="text" 
                                            value={line.number}
                                            placeholder="+57..."
                                            onChange={(e) => setWhatsappLines(whatsappLines.map(l => l.id === line.id ? {...l, number: e.target.value} : l))}
                                            className="bg-transparent text-sm font-bold text-gray-600 outline-none w-full"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Social Grid (Tus iconos favoritos) */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-100 border border-gray-50">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Canales Sociales</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'instagram', label: 'Insta', icon: <Instagram size={20}/>, color: 'text-pink-500', bg: 'bg-pink-50' },
                                { id: 'facebook', label: 'FB', icon: <Facebook size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { id: 'tiktok', label: 'TikTok', icon: <Camera size={20}/>, color: 'text-gray-900', bg: 'bg-gray-100' },
                                { id: 'telegram', label: 'Tele', icon: <Send size={20}/>, color: 'text-sky-500', bg: 'bg-sky-50' }
                            ].map((social) => {
                                const isActive = connections[social.id as keyof typeof connections];
                                return (
                                    <button 
                                        key={social.id} 
                                        onClick={() => handleSocialConnect(social.id)}
                                        className={`p-5 rounded-3xl transition-all flex flex-col items-center gap-3 border ${isActive ? 'bg-white border-purple-200 shadow-xl shadow-purple-100/50' : 'bg-gray-50/50 border-transparent grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:bg-white hover:border-gray-100'}`}
                                    >
                                        <div className={`h-10 w-10 ${social.bg} ${social.color} rounded-xl flex items-center justify-center shadow-sm`}>
                                            {social.icon}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-tighter text-gray-900">{social.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}