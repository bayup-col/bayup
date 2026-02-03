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
    
    const [activeTab, setActiveTab] = useState<'identidad' | 'contacto' | 'finanzas' | 'canales'>('identidad');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [currentPlan, setCurrentPlan] = useState<'Pro' | 'Empresa' | 'Básico'>('Pro');

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
        website: "mitienda.bayup.com",
        nit: "",
        tax_regime: "Simplificado",
        legal_rep: ""
    });

    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [whatsappLines, setWhatsappLines] = useState<WhatsAppLine[]>([]);
    const [socialLinks, setSocialLinks] = useState({
        instagram: "https://instagram.com/bayup",
        facebook: "https://facebook.com/bayup",
        tiktok: "https://tiktok.com/@bayup",
        telegram: "https://t.me/bayup"
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
        const savedData = localStorage.getItem('bayup_general_settings');
        const savedPlan = localStorage.getItem('bayup_user_plan');
        
        if (savedPlan) {
            setCurrentPlan(savedPlan as any);
        }

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setIdentity(parsed.identity || identity);
                setContact(parsed.contact || contact);
                setAccounts(parsed.accounts || []);
                setWhatsappLines(parsed.whatsappLines || []);
                setSocialLinks(parsed.socialLinks || socialLinks);
            } catch (e) { console.error(e); }
        } else {
            setAccounts([{ id: '1', bank_name: 'Bancolombia', account_type: 'Ahorros', number: '1234567890', billing_limit: 10000000, current_billed: 2500000, is_primary: true, status: 'active' }]);
            setWhatsappLines([{ id: 'w1', name: 'Ventas Directas', number: '3001112233' }]);
        }
        setLoading(false);
    }, []);

    const handleUpgrade = () => {
        setCurrentPlan('Empresa');
        localStorage.setItem('bayup_user_plan', 'Empresa');
        showToast("¡Plan Empresa Activado! 🚀 Datos fiscales desbloqueados.", "success");
    };

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
            localStorage.setItem('bayup_general_settings', JSON.stringify({ identity, contact, accounts, whatsappLines, socialLinks }));
            window.dispatchEvent(new CustomEvent('bayup_name_update', { detail: identity.name }));
            await new Promise(r => setTimeout(r, 1000));
            showToast("Configuración guardada 🚀", "success");
        } catch (e) { showToast("Error al guardar", "error"); }
        finally { setIsSaving(false); }
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
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
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
                                    {opt.icon} <span className="text-xs font-bold uppercase">{opt.label}</span>
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
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase text-[#004d4d]/60 tracking-[0.2em]">Configuración Maestra</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Info <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">General</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">&quot;Control maestro de la identidad, finanzas y canales de tu marca comercial.&quot;</p>
                </div>
                <button onClick={handleSaveMain} disabled={isSaving} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18} className="text-[#00f2ff]" />}
                    {isSaving ? 'Sincronizando...' : 'Guardar y Publicar Cambios'}
                </button>
            </div>

            <div className="flex justify-center px-4">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto">
                    {[ { id: 'identidad', label: 'Identidad', icon: <Store size={14}/> }, { id: 'contacto', label: 'Contacto & Web', icon: <MapPin size={14}/> }, { id: 'finanzas', label: 'Finanzas & Topes', icon: <CreditCard size={14}/> }, { id: 'canales', label: 'Canales & Social', icon: <Globe size={14}/> } ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>{tab.icon} {tab.label}</button>
                    ))}
                </div>
            </div>

            <div className="px-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'identidad' && (
                        <motion.div key="id" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                                    <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">{identity.name}</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">{identity.category}</p>
                                </div>
                            </div>
                            <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre de la Empresa</label>
                                        <input type="text" value={identity.name} onChange={(e) => setIdentity({...identity, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    </div>
                                    <PremiumSelect label="Nicho de Mercado" value={identity.category} onChange={(v:any) => setIdentity({...identity, category: v})} options={categoriesOptions} icon={LayoutGrid} />
                                </div>
                                <div className="pt-8 border-t border-gray-100 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3"><ShieldCheck className={currentPlan === 'Empresa' ? "text-emerald-500" : "text-gray-300"} size={20}/><h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Datos Fiscales</h4></div>
                                        {currentPlan !== 'Empresa' && <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-lg border border-amber-100">Requiere Plan Empresa</span>}
                                    </div>
                                    {currentPlan === 'Empresa' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">NIT / RUT</label>
                                                <input type="text" value={contact.nit} onChange={e => setContact({...contact, nit: e.target.value})} placeholder="900.xxx.xxx-x" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-xs font-bold shadow-inner" />
                                            </div>
                                            <PremiumSelect 
                                                label="Régimen Tributario" 
                                                value={contact.tax_regime} 
                                                onChange={(v:any) => setContact({...contact, tax_regime: v})} 
                                                options={[
                                                    { id: 'Simplificado', label: 'Simplificado', icon: <Zap size={14} className="text-amber-500"/> },
                                                    { id: 'Común', label: 'Régimen Común', icon: <ShieldCheck size={14} className="text-emerald-500"/> },
                                                    { id: 'Gran Contribuyente', label: 'Gran Contribuyente', icon: <Briefcase size={14} className="text-[#004d4d]"/> }
                                                ]}
                                                icon={Activity}
                                            />
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Representante Legal</label>
                                                <input type="text" value={contact.legal_rep} onChange={e => setContact({...contact, legal_rep: e.target.value})} placeholder="Nombre completo" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-xs font-bold shadow-inner" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center text-center space-y-4">
                                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm"><Lock size={20}/></div>
                                            <p className="text-xs font-medium text-gray-400 max-w-sm">Sube al Plan Empresa para automatizar tu facturación legal.</p>
                                            <button onClick={handleUpgrade} className="px-8 py-3 bg-gray-900 text-[#00f2ff] rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Mejorar a Empresa</button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 pt-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Historia / Biografía</label>
                                    <textarea rows={4} value={identity.story} onChange={(e) => setIdentity({...identity, story: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-medium shadow-inner resize-none" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'contacto' && (
                        <motion.div key="contact" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Mail size={20}/></div><h4 className="text-sm font-black uppercase tracking-widest">Atención al Cliente</h4></div>
                                <div className="space-y-6">
                                    <input value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} className={`w-full p-5 bg-gray-50 rounded-2xl border-2 outline-none text-sm font-bold shadow-inner ${validateEmail(contact.email) ? 'border-transparent' : 'border-rose-200'}`} />
                                    <input maxLength={10} value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value.replace(/\D/g, '')})} className={`w-full p-5 bg-gray-50 rounded-2xl border-2 outline-none text-sm font-bold shadow-inner ${validatePhone(contact.phone) ? 'border-transparent' : 'border-rose-200'}`} />
                                    <div className="space-y-4">
                                        <input value={contact.website} onChange={e => setContact({...contact, website: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border border-transparent outline-none text-sm font-bold shadow-inner" />
                                        <div className="flex flex-col gap-3">
                                            <button className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-2xl group"><span className="text-[10px] font-black uppercase">Vincular Dominio</span><Globe size={16} className="text-[#00f2ff]"/></button>
                                            <button className="flex items-center justify-between p-4 bg-white border border-gray-200 text-gray-900 rounded-2xl"><span className="text-[10px] font-black uppercase">Comprar Dominio</span><ShoppingCart size={16} className="text-[#004d4d]"/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><MapPin size={250} /></div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center gap-3"><div className="h-10 w-10 bg-white/10 text-[#00f2ff] rounded-xl flex items-center justify-center"><MapPin size={20}/></div><h4 className="text-sm font-black uppercase tracking-widest">Ubicación</h4></div>
                                    <div className="space-y-6">
                                        <input value={contact.address} onChange={e => setContact({...contact, address: e.target.value})} className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl outline-none text-sm font-bold" />
                                        <div className="grid grid-cols-2 gap-6">
                                            <input value={contact.city} onChange={e => setContact({...contact, city: e.target.value})} className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl outline-none text-sm font-bold" />
                                            <input value={contact.country} onChange={e => setContact({...contact, country: e.target.value})} className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl outline-none text-sm font-bold" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'finanzas' && (
                        <motion.div key="fin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                            <div className="bg-white/40 p-8 rounded-[3rem] border border-white/60 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div><h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Cuentas de Recaudo</h3></div>
                                <button onClick={() => { setEditingAccount(null); setAccountFormData({ bank_name: '', account_type: 'Ahorros', number: '', billing_limit: '5000000' }); setIsAccountModalOpen(true); }} className="h-14 px-8 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-3"><Plus size={18} className="text-[#00f2ff]"/> Añadir Cuenta</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {accounts.map((acc) => (
                                    <motion.div key={acc.id} whileHover={{ y: -5 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden group">
                                        <div className="flex justify-between items-start">
                                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${acc.is_primary ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-100 text-gray-400'}`}><CreditCard size={32} /></div>
                                            {acc.is_primary && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100">Principal</span>}
                                        </div>
                                        <div><h4 className="text-2xl font-black text-gray-900 uppercase italic">{acc.bank_name}</h4><p className="text-sm font-black text-[#004d4d] mt-1">{acc.number}</p></div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between"><p className="text-[10px] font-black text-gray-400 uppercase">Tope Mensual</p><p className="text-sm font-black text-gray-900">{formatCurrency(acc.billing_limit)}</p></div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(acc.current_billed / acc.billing_limit) * 100}%` }} className="h-full rounded-full bg-[#004d4d]"></motion.div></div>
                                        </div>
                                        <div className="pt-6 border-t border-gray-50 flex gap-4">
                                            <button onClick={() => { setEditingAccount(acc); setAccountFormData({ bank_name: acc.bank_name, account_type: acc.account_type, number: acc.number, billing_limit: acc.billing_limit.toString() }); setIsAccountModalOpen(true); }} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all"><Settings2 size={16}/></button>
                                            <button onClick={() => setAccounts(accounts.filter(a => a.id !== acc.id))} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                            {!acc.is_primary && <button onClick={() => setAccounts(accounts.map(a => ({...a, is_primary: a.id === acc.id})))} className="flex-1 py-3 bg-[#004d4d]/5 hover:bg-[#004d4d] text-[#004d4d] hover:text-white rounded-2xl text-[9px] font-black uppercase transition-all">Activar Recaudo</button>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'canales' && (
                        <motion.div key="chan" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
                                <div className="flex justify-between items-center"><h3 className="text-xl font-black text-gray-900 uppercase italic">Líneas WhatsApp</h3><button onClick={() => setIsWhatsappModalOpen(true)} className="h-10 w-10 bg-[#004d4d] text-white rounded-xl flex items-center justify-center shadow-lg"><Plus size={20}/></button></div>
                                <div className="space-y-4">
                                    {whatsappLines.map((line) => (
                                        <div key={line.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border border-transparent hover:border-emerald-100 transition-all">
                                            <div className="flex items-center gap-6"><div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center font-black text-[#004d4d] shadow-sm italic">WA</div><div><p className="text-sm font-black text-gray-900">{line.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{line.number}</p></div></div>
                                            <button onClick={() => setWhatsappLines(whatsappLines.filter(w => w.id !== line.id))} className="h-10 w-10 bg-white text-gray-300 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-5 bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
                                <h3 className="text-xl font-black text-gray-900 uppercase italic">Ecosistema Social</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[ { id: 'instagram', label: 'Instagram', icon: <Instagram size={24}/>, color: 'text-pink-500', link: socialLinks.instagram }, { id: 'facebook', label: 'Facebook', icon: <Facebook size={24}/>, color: 'text-blue-600', link: socialLinks.facebook }, { id: 'tiktok', label: 'TikTok', icon: <TikTokIcon size={24}/>, color: 'text-gray-900', link: socialLinks.tiktok }, { id: 'telegram', label: 'Telegram', icon: <Send size={24}/>, color: 'text-sky-500', link: socialLinks.telegram } ].map((social) => (
                                        <a key={social.id} href={social.link} target="_blank" rel="noopener noreferrer" className="p-8 rounded-[3rem] bg-gray-50 border border-transparent hover:border-[#004d4d]/20 hover:bg-white hover:shadow-2xl transition-all flex flex-col items-center gap-4 group relative overflow-hidden">
                                            <div className={`h-14 w-14 bg-white ${social.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}>{social.icon}</div>
                                            <span className="text-[10px] font-black uppercase text-gray-900 tracking-widest">{social.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isAccountModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAccountModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-10 relative z-10 border border-white">
                            <form onSubmit={handleAccountAction} className="space-y-8">
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic">Configurar Cuenta</h3>
                                <div className="space-y-6">
                                    <input required placeholder="Banco / Entidad" value={accountFormData.bank_name} onChange={e => setAccountFormData({...accountFormData, bank_name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    <input required placeholder="Nro de Cuenta" value={accountFormData.number} onChange={e => setAccountFormData({...accountFormData, number: e.target.value.replace(/\D/g,'')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tope Mensual (COP)</label>
                                        <input required value={formatDots(accountFormData.billing_limit)} onChange={e => setAccountFormData({...accountFormData, billing_limit: e.target.value.replace(/\D/g, '')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-black shadow-inner" />
                                        <p className="text-[9px] font-black text-[#004d4d] ml-2">Total: {formatCurrency(accountFormData.billing_limit)}</p>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all">Confirmar Configuración</button>
                            </form>
                        </motion.div>
                    </div>
                )}
                {isWhatsappModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWhatsappModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-3xl p-10 relative z-10 border border-white">
                            <form onSubmit={handleWhatsAppAction} className="space-y-8">
                                <h3 className="text-xl font-black text-gray-900 uppercase italic">Vincular WhatsApp</h3>
                                <div className="space-y-6">
                                    <input required placeholder="Canal (Ej: Ventas)" value={whatsappFormData.name} onChange={e => setWhatsappFormData({...whatsappFormData, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none text-sm font-bold shadow-inner" />
                                    <input required placeholder="Número (10 dígitos)" maxLength={10} value={whatsappFormData.number} onChange={e => setWhatsappFormData({...whatsappFormData, number: e.target.value.replace(/\D/g,'')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none text-sm font-bold shadow-inner" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Activar Línea</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="px-4 pt-12">
                <div className="bg-[#004953] p-16 rounded-[4rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl border border-white/5">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center shadow-3xl"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 relative z-10 space-y-6 text-center md:text-left">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Master-Config</span>
                        <h3 className="text-4xl font-black tracking-tight italic uppercase">Estado del Onboarding</h3>
                        <p className="text-gray-300 text-lg font-medium leading-relaxed italic">&quot;Tu identidad digital está completa al 94%. Recuerda que la cuenta Bancolombia está próxima a superar el tope de facturación mensual.&quot;</p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}