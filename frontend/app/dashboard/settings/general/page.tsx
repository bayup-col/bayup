"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Mail, Smartphone, Globe, Instagram, Facebook, 
  MessageCircle, Send, CheckCircle2, Trash2, Plus, 
  Camera, Loader2, ShieldCheck, Zap, X, CreditCard, 
  MapPin, Clock, Info, Activity, AlertCircle, LayoutGrid, 
  Briefcase, Sparkles, Settings2, Check, ArrowUpRight, 
  Bot, ShoppingBag, ChevronRight, Hash, ExternalLink, ShoppingCart, Lock
} from 'lucide-react';
import { useAuth } from "@/context/auth-context";
import { useToast } from '@/context/toast-context';

// --- ICONO TIKTOK SVG ---
const TikTokIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-.98v6.68c0 5.23-4.03 9.35-9.25 9.23-5.5-.12-9.33-5.14-8.34-10.42.57-3.03 3.14-5.43 6.2-5.86 1.13-.08 2.27.02 3.35.3v4.07c-1.14-.46-2.47-.5-3.6-.07-1.9.72-3.08 2.85-2.6 4.83.4 1.62 1.93 2.78 3.6 2.73 2.33-.06 3.89-2.33 3.89-4.59V0h4.39c-.15.02-.3.01-.45.02z"/>
    </svg>
);

// --- INTERFACES ---
interface PaymentAccount {
    id: string;
    bank_name: string;
    account_type: string;
    number: string;
    billing_limit: number;
    current_billed: number;
    is_primary: boolean;
    status: 'active' | 'limit_near' | 'limit_reached';
}

interface WhatsAppLine {
    id: string;
    name: string;
    number: string;
}

export default function GeneralSettings() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'perfil' | 'finanzas' | 'canales'>('perfil');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [currentPlan, setCurrentPlan] = useState<'Pro' | 'Empresa' | 'Básico'>('Básico');

    const [identity, setIdentity] = useState({
        name: "Mi Tienda Bayup",
        category: "Moda & Accesorios",
        story: "Nacimos con la idea de democratizar el lujo...",
        logo: null as string | null
    });

    const [contact, setContact] = useState({
        email: "soporte@mitienda.com",
        phone: "3001234567",
        address: "Calle 100 #15-20",
        city: "Bogotá",
        country: "Colombia",
        hours: "Lun - Vie: 8am - 6pm",
        website: "",
        shop_slug: "", // Pilar 2
        nit: "",
        tax_regime: "Simplificado",
        legal_rep: ""
    });

    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [whatsappLines, setWhatsappLines] = useState<WhatsAppLine[]>([]);
    const [socialLinks, setSocialLinks] = useState({
        instagram: "https://www.instagram.com/",
        facebook: "https://www.facebook.com/?locale=es_LA",
        tiktok: "https://www.tiktok.com/signup?lang=es",
        telegram: "#"
    });

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
    const [accountFormData, setAccountFormData] = useState({
        bank_name: '',
        account_type: 'Ahorros',
        number: '',
        billing_limit: '5000000'
    });

    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
    const [whatsappFormData, setWhatsappFormData] = useState({ name: '', number: '' });

    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);

    const guideSteps = [
        {
            id: 'identidad',
            title: 'Identidad & Marca',
            icon: <Store size={20}/>,
            desc: 'La primera impresión es la que vende. Tu logo y nombre son el ADN de tu negocio.',
            details: [
                { label: 'Logo Corporativo', value: 'Usa una imagen cuadrada (1:1) de alta resolución. Evita textos pequeños que no se lean en móvil.' },
                { label: 'Nicho de Mercado', value: 'Ayuda a Bayup a categorizarte para enviarte el tráfico correcto y sugerencias personalizadas.' },
                { label: 'Historia / Bio', value: 'No vendas productos, vende soluciones. Cuenta por qué creaste esta marca en 3 o 4 líneas.' }
            ],
            baytTip: 'Las tiendas con una biografía que cuenta una historia real venden un 22% más que las que solo listan productos.'
        },
        {
            id: 'contacto',
            title: 'Contacto & Confianza',
            icon: <Mail size={20}/>,
            desc: 'La transparencia genera ventas. Asegúrate de que tus clientes puedan encontrarte.',
            details: [
                { label: 'Email de Soporte', value: 'Usa un correo profesional. Aquí llegarán las dudas de tus clientes.' },
                { label: 'Teléfono Público', value: 'Preferiblemente un número con WhatsApp activo para cierre de ventas directo.' },
                { label: 'Horarios', value: 'Define tus tiempos de respuesta. Un cliente informado es un cliente paciente.' }
            ],
            baytTip: 'Mostrar un número de contacto visible reduce el abandono de carrito en un 15%.'
        },
        {
            id: 'tienda',
            title: 'Tu Link (Slug)',
            icon: <Zap size={20}/>,
            desc: 'Tu dirección en el mundo digital. Es el enlace que compartirás en todas tus redes sociales.',
            details: [
                { label: 'Shop Slug', value: 'Debe ser corto, memorable y sin caracteres especiales. Ej: "mi-tienda" en lugar de "mi_tienda_123".' },
                { label: 'Importancia SEO', value: 'Este nombre ayuda a Google a encontrarte. Si lo cambias, los enlaces anteriores dejarán de funcionar.' }
            ],
            baytTip: 'Los slugs cortos son más fáciles de recordar y tienen una tasa de click un 40% mayor en redes sociales.'
        },
        {
            id: 'ubicacion',
            title: 'Presencia Física',
            icon: <MapPin size={20}/>,
            desc: 'Incluso si eres 100% digital, tener una base de operaciones genera seguridad legal y logística.',
            details: [
                { label: 'Ciudad/País', value: 'Vital para calcular costos de envío automáticos y moneda de recaudo.' },
                { label: 'Dirección', value: 'Solo se mostrará en las facturas y guías de envío si tú lo permites.' }
            ],
            baytTip: 'Muchos clientes prefieren comprar en tiendas de su misma ciudad para recibir el pedido más rápido.'
        }
    ];

    const categoriesOptions = [
        { id: 'Moda & Accesorios', label: 'Moda & Accesorios', icon: <ShoppingBag size={14}/> },
        { id: 'Calzado', label: 'Calzado', icon: <ChevronRight size={14}/> },
        { id: 'Tecnología', label: 'Tecnología', icon: <Smartphone size={14}/> },
        { id: 'Hogar', label: 'Hogar', icon: <Store size={14}/> },
        { id: 'Belleza', label: 'Belleza', icon: <Sparkles size={14}/> },
        { id: 'Mascotas', label: 'Mascotas', icon: <Store size={14}/> },
        { id: 'Deportes', label: 'Deportes', icon: <Activity size={14}/> },
        { id: 'Alimentos', label: 'Alimentos', icon: <Zap size={14}/> },
    ];

    useEffect(() => {
        // Cargar datos locales primero para consistencia inmediata
        const savedData = localStorage.getItem('bayup_general_settings');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.identity) setIdentity(parsed.identity);
                if (parsed.contact) setContact(parsed.contact);
                if (parsed.social_links) setSocialLinks(parsed.social_links);
            } catch (e) { console.error("Error al cargar datos locales", e); }
        }

        const fetchStoreData = async () => {
            if (!token) return;
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setIdentity(prev => ({ 
                        ...prev, 
                        name: data.full_name || prev.name,
                        logo: data.logo_url || prev.logo
                    }));
                    setContact(prev => ({ 
                        ...prev, 
                        email: data.email, 
                        phone: data.phone || prev.phone,
                        shop_slug: data.shop_slug || "" 
                    }));
                    if (data.bank_accounts) setAccounts(data.bank_accounts);
                    if (data.whatsapp_lines) setWhatsappLines(data.whatsapp_lines);
                    if (data.social_links) setSocialLinks(prev => ({ ...prev, ...data.social_links }));
                }
            } catch (err) { console.error("Error al cargar perfil", err); }
        };
        fetchStoreData();

        const savedPlan = localStorage.getItem('bayup_user_plan');
        if (savedPlan) {
            setCurrentPlan(savedPlan as any);
        }
        setLoading(false);
    }, [token]);

    const formatCurrency = (val: string | number) => {
        try {
            const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, '') || '0') : val;
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
        } catch (e) { return "$ " + val; }
    };

    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.(com|co|col|net|org|me)$/.test(email);
    const validatePhone = (phone: string) => phone.length === 10 && /^\d+$/.test(phone);

    const handleSaveMain = async () => {
        if (!validateEmail(contact.email)) { showToast("Email inválido", "error"); return; }
        if (!validatePhone(contact.phone)) { showToast("Teléfono de 10 dígitos requerido", "error"); return; }
        setIsSaving(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/admin/update-profile`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: identity.name,
                    logo_url: identity.logo,
                    phone: contact.phone,
                    shop_slug: contact.shop_slug,
                    bank_accounts: accounts,
                    social_links: socialLinks,
                    whatsapp_lines: whatsappLines
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Error al actualizar en el servidor");
            }

            window.dispatchEvent(new CustomEvent('bayup_name_update', { detail: identity.name }));
            
            // Persistir localmente para reflejo inmediato en Dashboard
            const settingsToSave = {
                identity: identity,
                contact: contact,
                social_links: socialLinks
            };
            localStorage.setItem('bayup_general_settings', JSON.stringify(settingsToSave));
            
            showToast("Configuración sincronizada con éxito 🚀", "success");
        } catch (e: any) { 
            showToast(e.message || "Error al sincronizar", "error"); 
        } finally { setIsSaving(false); }
    };

    const handleAccountAction = (e: React.FormEvent) => {
        e.preventDefault();
        const limit = parseInt(accountFormData.billing_limit.replace(/\D/g, ''));
        if (editingAccount) {
            setAccounts(accounts.map(a => a.id === editingAccount.id ? { ...a, ...accountFormData, billing_limit: limit } : a));
        } else {
            setAccounts([...accounts, { id: Date.now().toString(), ...accountFormData, billing_limit: limit, current_billed: 0, is_primary: accounts.length === 0, status: 'active' }]);
        }
        setIsAccountModalOpen(false);
    };

    const handleWhatsAppAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePhone(whatsappFormData.number)) { showToast("Número de 10 dígitos", "error"); return; }
        setWhatsappLines([...whatsappLines, { id: Date.now().toString(), ...whatsappFormData }]);
        setIsWhatsappModalOpen(false);
        setWhatsappFormData({ name: '', number: '' });
    };

    const PremiumSelect = ({ label, value, onChange, options, icon: Icon }: any) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-gray-400  tracking-widest ml-2">{label}</label>
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full pl-14 p-5 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-[#004d4d]/20 text-left flex items-center justify-between group transition-all">
                    <Icon className="absolute left-5 text-gray-300 group-hover:text-[#004d4d]" size={18}/>
                    <span className="text-sm font-bold text-slate-700">{options.find((o:any) => o.id === value)?.label || 'Seleccionar...'}</span>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden p-2">
                            {options.map((opt: any) => (
                                <button key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${value === opt.id ? 'bg-[#004d4d] text-white' : 'hover:bg-gray-50 text-slate-600'}`}>
                                    {opt.icon} <span className="text-xs font-bold ">{opt.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                        <span className="text-[10px] font-black  tracking-[0.3em] text-[#004d4d]/60 italic">Identidad corporativa v2.0</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter  leading-none text-[#001A1A]">
                        Info <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">general</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">¡Toda la información de tu empresa en un solo lugar! 🏢</p>
                </div>
                <button onClick={handleSaveMain} disabled={isSaving} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px]  tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18} className="text-[#00f2ff]" />}
                    {isSaving ? 'Sincronizando...' : 'Guardar y publicar cambios'}
                </button>
            </div>

            <div className="flex items-center justify-center gap-6 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto relative">
                    {[ 
                        { id: 'perfil', label: 'Información de Tienda', icon: <Store size={14}/>, disabled: false }, 
                        { id: 'finanzas', label: 'Finanzas (Próximamente)', icon: <CreditCard size={14}/>, disabled: true }, 
                        { id: 'canales', label: currentPlan === 'Básico' ? <div className="flex items-center gap-2">Canales & social <Lock size={10} className="text-gray-400"/></div> : 'Canales & social', icon: <Globe size={14}/>, disabled: currentPlan === 'Básico' } 
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => !tab.disabled && setActiveTab(tab.id as any)} 
                                className={`relative px-8 py-3.5 rounded-full text-[9px] font-black tracking-widest transition-all z-10 whitespace-nowrap flex items-center gap-2 ${
                                    isActive ? 'text-white' : tab.disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-900'
                                }`}
                            >
                                {isActive && (
                                    <motion.div layoutId="generalTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon} {tab.label}
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all group shrink-0">
                    <Info size={20} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>

            <div className="px-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'perfil' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                            {/* SECCIÓN 1: IDENTIDAD Y MARCA */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4 flex flex-col items-center gap-6 bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm">
                                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('logo-file')?.click()}>
                                        <div className="h-48 w-48 rounded-[3.5rem] bg-gray-900 flex items-center justify-center text-white text-6xl font-black border-8 border-white shadow-2xl relative overflow-hidden">
                                            {identity.logo ? <img src={identity.logo} className="w-full h-full object-cover" /> : identity.name.charAt(0)}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Camera className="text-[#00f2ff]" /></div>
                                        </div>
                                        <input id="logo-file" type="file" hidden accept="image/*" onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if(f) { const r = new FileReader(); r.onloadend = () => setIdentity({...identity, logo: r.result as string}); r.readAsDataURL(f); }
                                        }}/>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-black text-gray-900 italic tracking-tight">{identity.name}</h3>
                                        <p className="text-[10px] font-black text-gray-400 mt-1 tracking-widest uppercase">{identity.category}</p>
                                    </div>
                                </div>
                                <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 tracking-widest ml-2 uppercase">Nombre de la empresa</label>
                                            <input 
                                                type="text" 
                                                value={identity.name} 
                                                onChange={(e) => {
                                                    const newName = e.target.value;
                                                    setIdentity({...identity, name: newName});
                                                    window.dispatchEvent(new CustomEvent('bayup_name_update', { detail: newName }));
                                                }} 
                                                className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" 
                                            />
                                        </div>
                                        <PremiumSelect label="NICHO DE MERCADO" value={identity.category} onChange={(v:any) => setIdentity({...identity, category: v})} options={categoriesOptions} icon={LayoutGrid} />
                                    </div>
                                    <div className="space-y-2 pt-4">
                                        <label className="text-[10px] font-black text-gray-400 tracking-widest ml-2 uppercase">Historia / biografía corporativa</label>
                                        <textarea rows={3} value={identity.story} onChange={(e) => setIdentity({...identity, story: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-medium shadow-inner resize-none" />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: CONTACTO Y TIENDA ONLINE */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
                                    <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Mail size={20}/></div><h4 className="text-sm font-black tracking-widest uppercase">Atención al cliente</h4></div>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 tracking-widest ml-2 uppercase">Email de soporte</label>
                                                <input value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} className={`w-full p-5 bg-gray-50 rounded-2xl border-2 outline-none text-sm font-bold shadow-inner ${validateEmail(contact.email) ? 'border-transparent' : 'border-rose-200'}`} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 tracking-widest ml-2 uppercase">Teléfono público</label>
                                                <input maxLength={10} value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value.replace(/\D/g, '')})} className={`w-full p-5 bg-gray-50 rounded-2xl border-2 outline-none text-sm font-bold shadow-inner ${validatePhone(contact.phone) ? 'border-transparent' : 'border-rose-200'}`} />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4 pt-6 border-t border-gray-100">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[#004d4d] tracking-widest ml-2 flex items-center gap-2 uppercase">
                                                    <Zap size={12} /> Link de tienda único (slug)
                                                </label>
                                                <div className="relative group">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-bold">bayup.com.co/shop/</span>
                                                    <input 
                                                        value={contact.shop_slug} 
                                                        onChange={e => setContact({...contact, shop_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                                                        placeholder="mi-tienda"
                                                        className="w-full p-5 pl-36 bg-[#004d4d]/5 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-black text-[#004d4d] shadow-inner" 
                                                    />
                                                </div>
                                                <p className="text-[9px] text-gray-400 ml-2 italic">Este es el link que pondrás en tu Instagram o TikTok.</p>
                                            </div>

                                            <button 
                                                onClick={() => window.open(`/shop/${contact.shop_slug || 'preview'}`, '_blank')}
                                                disabled={!contact.shop_slug}
                                                className="w-full flex items-center justify-between p-5 bg-gray-900 text-white rounded-2xl group hover:bg-black transition-all disabled:opacity-50"
                                            >
                                                <span className="text-[10px] font-black tracking-widest uppercase">Ver mi tienda ahora</span>
                                                <ExternalLink size={16} className="text-[#00f2ff]"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white relative overflow-hidden flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><MapPin size={250} /></div>
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center gap-3"><div className="h-10 w-10 bg-white/10 text-[#00f2ff] rounded-xl flex items-center justify-center"><MapPin size={20}/></div><h4 className="text-sm font-black tracking-widest uppercase">Ubicación física</h4></div>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/40 tracking-widest ml-2 uppercase">Dirección principal</label>
                                                <input value={contact.address} onChange={e => setContact({...contact, address: e.target.value})} className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl outline-none text-sm font-bold" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-white/40 tracking-widest ml-2 uppercase">Ciudad</label>
                                                    <input value={contact.city} onChange={e => setContact({...contact, city: e.target.value})} className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl outline-none text-sm font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-white/40 tracking-widest ml-2 uppercase">País</label>
                                                    <input value={contact.country} onChange={e => setContact({...contact, country: e.target.value})} className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl outline-none text-sm font-bold" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 mt-8 p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-[#00f2ff]/20 text-[#00f2ff] rounded-2xl flex items-center justify-center shrink-0"><Clock size={20}/></div>
                                            <div>
                                                <h5 className="text-[10px] font-black tracking-widest uppercase text-white/60">Horario de operación</h5>
                                                <input value={contact.hours} onChange={e => setContact({...contact, hours: e.target.value})} className="bg-transparent border-none outline-none text-sm font-bold w-full p-0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'finanzas' && (
                        <motion.div key="fin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                            <div className="bg-white/40 p-8 rounded-[3rem] border border-white/60 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div><h3 className="text-2xl font-black text-[#004d4d]  italic">Cuentas de recaudo</h3></div>
                                <button onClick={() => { setEditingAccount(null); setAccountFormData({ bank_name: '', account_type: 'Ahorros', number: '', billing_limit: '5000000' }); setIsAccountModalOpen(true); }} className="h-14 px-8 bg-gray-900 text-white rounded-2xl font-black text-[10px]  shadow-xl flex items-center gap-3"><Plus size={18} className="text-[#00f2ff]"/> Añadir cuenta</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {accounts.map((acc) => (
                                    <motion.div key={acc.id} whileHover={{ y: -5 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden group">
                                        <div className="flex justify-between items-start">
                                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${acc.is_primary ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-100 text-gray-400'}`}><CreditCard size={32} /></div>
                                            {acc.is_primary && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black  rounded-lg border border-emerald-100">Principal</span>}
                                        </div>
                                        <div><h4 className="text-2xl font-black text-gray-900  italic">{acc.bank_name}</h4><p className="text-sm font-black text-[#004d4d] mt-1">{acc.number}</p></div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between"><p className="text-[10px] font-black text-gray-400 ">Tope mensual</p><p className="text-sm font-black text-gray-900">{formatCurrency(acc.billing_limit)}</p></div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(acc.current_billed / acc.billing_limit) * 100}%` }} className="h-full rounded-full bg-[#004d4d]"></motion.div></div>
                                        </div>
                                        <div className="pt-6 border-t border-gray-50 flex gap-4">
                                            <button onClick={() => { setEditingAccount(acc); setAccountFormData({ bank_name: acc.bank_name, account_type: acc.account_type, number: acc.number, billing_limit: acc.billing_limit.toString() }); setIsAccountModalOpen(true); }} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all"><Settings2 size={16}/></button>
                                            <button onClick={() => setAccounts(accounts.filter(a => a.id !== acc.id))} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                            {!acc.is_primary && <button onClick={() => setAccounts(accounts.map(a => ({...a, is_primary: a.id === acc.id})))} className="flex-1 py-3 bg-[#004d4d]/5 hover:bg-[#004d4d] text-[#004d4d] hover:text-white rounded-2xl text-[9px] font-black  transition-all">Activar recaudo</button>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'canales' && (
                        <motion.div key="chan" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                            <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
                                <h3 className="text-xl font-black text-gray-900 italic">Ecosistema social</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[ 
                                        { id: 'instagram', label: 'Instagram', icon: <Instagram size={24}/>, color: 'text-pink-500', link: socialLinks.instagram, disabled: false }, 
                                        { id: 'facebook', label: 'Facebook', icon: <Facebook size={24}/>, color: 'text-blue-600', link: socialLinks.facebook, disabled: false }, 
                                        { id: 'tiktok', label: 'TikTok', icon: <TikTokIcon size={24}/>, color: 'text-gray-900', link: socialLinks.tiktok, disabled: false }, 
                                        { id: 'telegram', label: 'Telegram', icon: <Send size={24}/>, color: 'text-gray-300', link: '#', disabled: true } 
                                    ].map((social) => (
                                        <a 
                                            key={social.id} 
                                            href={social.disabled ? undefined : social.link} 
                                            target={social.disabled ? undefined : "_blank"} 
                                            rel="noopener noreferrer" 
                                            className={`p-8 rounded-[3rem] bg-gray-50 border border-transparent transition-all flex flex-col items-center gap-4 group relative overflow-hidden ${
                                                social.disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-[#004d4d]/20 hover:bg-white hover:shadow-2xl'
                                            }`}
                                        >
                                            <div className={`h-14 w-14 bg-white ${social.color} rounded-2xl flex items-center justify-center shadow-lg ${!social.disabled && 'group-hover:scale-110'} transition-all`}>
                                                {social.icon}
                                            </div>
                                            <span className="text-[10px] font-black text-gray-900 tracking-widest text-center">
                                                {social.label} {social.disabled && <span className="block text-[8px]">(Próximamente)</span>}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 md:p-12">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="bg-white w-full max-w-5xl h-[80vh] rounded-[4rem] shadow-3xl relative z-10 border border-white/20 overflow-hidden flex flex-col md:flex-row">
                            
                            {/* SIDEBAR TÁCTICO */}
                            <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 p-8 flex flex-col gap-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-gray-900 italic tracking-tight">Guía <span className="text-[#004d4d]">Élite</span></h3>
                                    <p className="text-[9px] font-black text-gray-400 tracking-[0.2em] uppercase">Módulo Info General</p>
                                </div>
                                <div className="flex flex-col gap-2 flex-1">
                                    {guideSteps.map((step, idx) => (
                                        <button key={step.id} onClick={() => setActiveGuideStep(idx)} className={`flex items-center gap-4 p-4 rounded-3xl transition-all group ${activeGuideStep === idx ? 'bg-[#004d4d] text-white shadow-xl scale-[1.02]' : 'hover:bg-white text-gray-500 hover:text-[#004d4d]'}`}>
                                            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${activeGuideStep === idx ? 'bg-white/20 text-[#00f2ff]' : 'bg-gray-200/50 group-hover:bg-[#004d4d]/10'}`}>{step.icon}</div>
                                            <span className="text-[10px] font-black tracking-widest uppercase">{step.title}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="p-6 bg-[#004d4d]/5 rounded-[2.5rem] border border-[#004d4d]/10">
                                    <div className="flex items-center gap-3 mb-2"><Zap size={14} className="text-[#004d4d]"/> <span className="text-[9px] font-black tracking-widest uppercase text-[#004d4d]">Propósito</span></div>
                                    <p className="text-[10px] font-medium text-gray-500 leading-relaxed italic">"Tu perfil no es solo datos, es la base de tu confianza digital para cerrar ventas."</p>
                                </div>
                            </div>

                            {/* CONTENIDO PRINCIPAL */}
                            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar relative flex flex-col">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all z-20"><X size={20}/></button>
                                
                                <div className="flex-1 space-y-10">
                                    <div className="space-y-4">
                                        <div className="h-16 w-16 bg-[#004d4d]/10 text-[#004d4d] rounded-3xl flex items-center justify-center scale-110 mb-6">{guideSteps[activeGuideStep].icon}</div>
                                        <h2 className="text-4xl font-black text-gray-900 italic tracking-tighter leading-none">{guideSteps[activeGuideStep].title}</h2>
                                        <p className="text-gray-400 font-medium text-lg leading-relaxed max-w-xl">{guideSteps[activeGuideStep].desc}</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {guideSteps[activeGuideStep].details.map((det, i) => (
                                            <div key={i} className="p-8 bg-gray-50 rounded-[3rem] border border-transparent hover:border-gray-200 transition-all group">
                                                <h4 className="text-[10px] font-black tracking-widest uppercase text-[#004d4d] mb-2">{det.label}</h4>
                                                <p className="text-sm font-medium text-gray-600 leading-relaxed">{det.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-10 bg-[#001a1a] rounded-[4rem] text-white relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-700"><Bot size={200} /></div>
                                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                            <div className="h-20 w-20 bg-gradient-to-br from-[#00f2ff] to-[#004d4d] rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0"><Bot size={40} className="text-white animate-pulse" /></div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_10px_#00f2ff] animate-pulse"></span><span className="text-[10px] font-black tracking-widest uppercase text-[#00f2ff]">Estrategia de Bayt AI</span></div>
                                                <p className="text-lg font-bold italic leading-tight text-white/90">"{guideSteps[activeGuideStep].baytTip}"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-12 flex justify-end">
                                    <button onClick={() => activeGuideStep === guideSteps.length - 1 ? setIsGuideOpen(false) : setActiveGuideStep(activeGuideStep + 1)} className="h-16 px-10 bg-[#004d4d] text-white rounded-full font-black text-[10px] tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
                                        {activeGuideStep === guideSteps.length - 1 ? '¡LO TENGO CLARO!' : 'SIGUIENTE PASO'}
                                        {activeGuideStep !== guideSteps.length - 1 && <ChevronRight size={18} className="text-[#00f2ff]" />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {isAccountModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAccountModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-10 relative z-10 border border-white">
                                                        <form onSubmit={handleAccountAction} className="space-y-8">
                                                            <h3 className="text-2xl font-black text-gray-900  italic">Configurar cuenta</h3>
                                                            <div className="space-y-6">
                                                                <input required placeholder="Banco / entidad" value={accountFormData.bank_name} onChange={e => setAccountFormData({...accountFormData, bank_name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                                                <input required placeholder="Nro de cuenta" value={accountFormData.number} onChange={e => setAccountFormData({...accountFormData, number: e.target.value.replace(/\D/g,'')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black text-gray-400   tracking-widest ml-2">Tope mensual (COP)</label>
                                                                    <input required value={formatDots(accountFormData.billing_limit)} onChange={e => setAccountFormData({...accountFormData, billing_limit: e.target.value.replace(/\D/g, '')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-black shadow-inner" />
                                                                    <p className="text-[9px] font-black text-[#004d4d] ml-2">Total: {formatCurrency(accountFormData.billing_limit)}</p>
                                                                </div>
                                                            </div>
                                                            <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px]   shadow-xl hover:bg-black transition-all">Confirmar configuración</button>
                                                        </form>
                        </motion.div>
                    </div>
                )}
                {isWhatsappModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWhatsappModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-3xl p-10 relative z-10 border border-white">
                                                        <form onSubmit={handleWhatsAppAction} className="space-y-8">
                                                            <h3 className="text-xl font-black text-gray-900  italic">Vincular WhatsApp</h3>
                                                            <div className="space-y-6">
                                                                <input required placeholder="Canal (ej: ventas)" value={whatsappFormData.name} onChange={e => setWhatsappFormData({...whatsappFormData, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none text-sm font-bold shadow-inner" />
                                                                <input required placeholder="Número (10 dígitos)" maxLength={10} value={whatsappFormData.number} onChange={e => setWhatsappFormData({...whatsappFormData, number: e.target.value.replace(/\D/g,'')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none text-sm font-bold shadow-inner" />
                                                            </div>
                                                            <button type="submit" className="w-full py-5 bg-[#004d4d] text-white rounded-2xl font-black text-[10px]   shadow-xl">Activar línea</button>
                                                        </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}
