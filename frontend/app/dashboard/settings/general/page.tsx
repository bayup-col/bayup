"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  X,
  CreditCard,
  MapPin,
  Clock,
  Info,
  Activity,
  AlertCircle,
  Hash,
  LayoutGrid,
  Briefcase,
  Target,
  Sparkles,
  Search,
  Settings2,
  Lock,
  Eye,
  Check,
  ArrowUpRight,
  ArrowRight,
  Bot,
  Medal,
  Award,
  Percent,
  ShoppingBag,
  Scale,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from "@/context/auth-context";
import { useToast } from '@/context/toast-context';
import { userService } from '@/lib/api';

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

export default function GeneralSettings() {
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'identidad' | 'contacto' | 'finanzas' | 'canales'>('identidad');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [identity, setIdentity] = useState({
        name: "Mi Tienda Bayup",
        category: "Moda & Accesorios",
        niche: "Luxury Jewelry",
        story: "Nacimos con la idea de democratizar el lujo...",
        logo: null as string | null
    });

    const [contact, setContacto] = useState({
        emails: ["soporte@mitienda.com"],
        phones: ["+57 300 123 4567"],
        address: "Calle 100 #15-20",
        city: "Bogotá",
        country: "Colombia",
        hours: "Lun - Vie: 8am - 6pm"
    });

    const [accounts, setAccounts] = useState<PaymentAccount[]>([
        { id: 'acc1', bank_name: 'Bancolombia', account_type: 'Ahorros', number: '*** 4582', billing_limit: 10000000, current_billed: 8500000, is_primary: true, status: 'limit_near' },
        { id: 'acc2', bank_name: 'Davivienda', account_type: 'Corriente', number: '*** 9910', billing_limit: 5000000, current_billed: 1200000, is_primary: false, status: 'active' }
    ]);

    const [whatsappLines, setWhatsappLines] = useState([{ id: 'w1', name: 'Ventas', number: '+573001112233' }]);
    const [socialConnections, setSocialConnections] = useState({
        instagram: true, facebook: true, tiktok: false, telegram: false
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 1200));
        showToast("Configuración táctica actualizada 🚀", "success");
        setIsSaving(false);
    };

    const renderIdentidad = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 flex flex-col items-center gap-6 bg-white/60 backdrop-blur-md p-10 rounded-[4rem] border border-white shadow-xl shadow-gray-100/50">
                    <div className="relative group cursor-pointer">
                        <div className="h-48 w-48 rounded-[3.5rem] bg-gray-900 flex items-center justify-center text-white text-6xl font-black shadow-2xl relative overflow-hidden border-8 border-white">
                            {identity.logo ? <img src={identity.logo} className="w-full h-full object-cover" /> : identity.name.charAt(0)}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <Camera className="text-[#00f2ff]" size={32} />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 h-14 w-14 bg-[#00f2ff] rounded-2xl flex items-center justify-center border-4 border-white shadow-xl text-[#004d4d]">
                            <Sparkles size={24} />
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight italic uppercase">{identity.name}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{identity.category}</p>
                    </div>
                </div>
                <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-gray-50 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                        <div className="h-10 w-10 bg-[#004d4d]/5 text-[#004d4d] rounded-xl flex items-center justify-center"><Briefcase size={20}/></div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Perfil Corporativo</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Comercial</label>
                            <input type="text" value={identity.name} onChange={(e) => setIdentity({...identity, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoría / Nicho</label>
                            <select value={identity.category} onChange={(e) => setIdentity({...identity, category: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner transition-all">
                                <option>Moda & Accesorios</option><option>Tecnología</option><option>Hogar</option><option>Belleza</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Historia de Marca (Bio)</label>
                        <textarea rows={4} value={identity.story} onChange={(e) => setIdentity({...identity, story: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[2.5rem] border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-medium shadow-inner transition-all resize-none" />
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderContacto = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Smartphone size={20}/></div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Canales de Atención</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Correo Electrónico Principal</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                <input type="text" value={contact.emails[0]} className="w-full pl-14 p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-200 outline-none text-sm font-bold shadow-inner transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono de Soporte</label>
                            <div className="relative">
                                <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                <input type="text" value={contact.phones[0]} className="w-full pl-14 p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-200 outline-none text-sm font-bold shadow-inner transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Horarios de Atención</label>
                            <div className="relative">
                                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                <input type="text" value={contact.hours} className="w-full pl-14 p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-200 outline-none text-sm font-bold shadow-inner transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><MapPin size={250} /></div>
                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/10 text-[#00f2ff] rounded-xl flex items-center justify-center"><MapPin size={20}/></div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-[#00f2ff]">Presencia Física</h4>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Dirección de Oficina / Local</label>
                                <input type="text" value={contact.address} className="w-full p-5 bg-white/5 border-2 border-white/10 focus:border-[#00f2ff] rounded-2xl outline-none text-sm font-bold transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Ciudad</label>
                                    <input type="text" value={contact.city} className="w-full p-5 bg-white/5 border-2 border-white/10 focus:border-[#00f2ff] rounded-2xl outline-none text-sm font-bold transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">País</label>
                                    <input type="text" value={contact.country} className="w-full p-5 bg-white/5 border-2 border-white/10 focus:border-[#00f2ff] rounded-2xl outline-none text-sm font-bold transition-all" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-[#00f2ff]/10 rounded-3xl border border-[#00f2ff]/20">
                            <p className="text-xs font-medium italic opacity-80 leading-relaxed">"Esta información se sincroniza con tus facturas y el pie de página de tu sitio web oficial."</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderFinanzas = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 px-4">
            <div className="bg-white/40 p-8 rounded-[3rem] border border-white/60 flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Cuentas de Recaudo</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Configura donde recibes tus ganancias y establece topes operativos</p>
                </div>
                <button className="h-14 px-8 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><Plus size={18} className="text-[#00f2ff]"/> Añadir Cuenta</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {accounts.map((acc) => (
                    <motion.div key={acc.id} whileHover={{ y: -10 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden group">
                        {acc.status === 'limit_near' && (
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 animate-pulse"></div>
                        )}
                        <div className="flex justify-between items-start">
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl ${acc.is_primary ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <CreditCard size={32} />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {acc.is_primary && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100 tracking-widest">Primaria</span>}
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                    acc.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {acc.status === 'active' ? 'Operando' : 'Límite Cerca'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">{acc.bank_name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{acc.account_type} · {acc.number}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tope de Facturación</p>
                                <p className="text-sm font-black text-gray-900">{formatCurrency(acc.current_billed)} / {formatCurrency(acc.billing_limit)}</p>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${(acc.current_billed / acc.billing_limit) * 100}%` }} 
                                    className={`h-full rounded-full shadow-[0_0_10px_rgba(0,242,255,0.3)] ${
                                        acc.status === 'limit_near' ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-[#004d4d] to-[#00f2ff]'
                                    }`}
                                ></motion.div>
                            </div>
                            {acc.status === 'limit_near' && (
                                <div className="flex items-center gap-2 text-amber-600 font-bold text-[9px] uppercase tracking-widest animate-in slide-in-from-left">
                                    <AlertCircle size={12}/> Alerta: Estás al 85% del tope mensual
                                </div>
                            )}
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                            <div className="flex gap-2">
                                <button className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all"><Settings2 size={16}/></button>
                                <button className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </div>
                            {!acc.is_primary && (
                                <button className="text-[9px] font-black uppercase text-[#004d4d] hover:underline tracking-widest">Establecer Primaria</button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );

    const renderCanales = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5"><MessageCircle size={150} /></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><Smartphone size={24}/></div>
                                <div><h3 className="text-xl font-black text-gray-900 uppercase italic">Líneas de Atención</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conexión directa vía WhatsApp</p></div>
                            </div>
                            <button className="h-10 w-10 bg-[#004d4d] text-[#00f2ff] rounded-xl flex items-center justify-center shadow-lg"><Plus size={20}/></button>
                        </div>
                        <div className="space-y-4 relative z-10">
                            {whatsappLines.map((line, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border border-transparent hover:border-[#004d4d]/20 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center font-black text-[#004d4d] shadow-sm italic">0{i+1}</div>
                                        <div><p className="text-sm font-black text-gray-900">{line.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{line.number}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]"></div>
                                        <span className="text-[9px] font-black uppercase text-emerald-600">Online</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-5 bg-white p-10 rounded-[4rem] border border-gray-100 shadow-xl space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-[#004d4d] text-[#00f2ff] rounded-2xl flex items-center justify-center shadow-lg"><Globe size={24}/></div>
                        <h3 className="text-xl font-black text-gray-900 uppercase italic">Ecosistema Social</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'instagram', label: 'Instagram', icon: <Instagram size={20}/>, color: 'text-pink-500', bg: 'bg-pink-50' },
                            { id: 'facebook', label: 'Facebook', icon: <Facebook size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { id: 'tiktok', label: 'TikTok', icon: <Activity size={20}/>, color: 'text-gray-900', bg: 'bg-gray-100' },
                            { id: 'telegram', label: 'Telegram', icon: <Send size={20}/>, color: 'text-sky-500', bg: 'bg-sky-50' }
                        ].map((social) => {
                            const isActive = socialConnections[social.id as keyof typeof socialConnections];
                            return (
                                <button key={social.id} className={`p-6 rounded-[2.5rem] transition-all flex flex-col items-center gap-4 border ${isActive ? 'bg-white border-[#004d4d]/20 shadow-xl' : 'bg-gray-50 grayscale opacity-40 hover:opacity-100'}`}>
                                    <div className={`h-12 w-12 ${social.bg} ${social.color} rounded-2xl flex items-center justify-center shadow-sm`}>{social.icon}</div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black uppercase text-gray-900">{social.label}</span>
                                        <span className={`text-[8px] font-black uppercase mt-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>{isActive ? 'Conectado' : 'Pendiente'}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    if (loading) return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
            <div className="relative">
                <div className="h-16 w-16 rounded-[2rem] border-4 border-[#004d4d]/10 border-t-[#004d4d] animate-spin" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#004d4d]" size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Accediendo a la Terminal...</p>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Configuración Central</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Info <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">General</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic italic">
                        Control maestro de la identidad, finanzas y <span className="font-bold text-[#001A1A]">canales de tu marca</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleSave} disabled={isSaving} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group disabled:opacity-50">
                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />}
                        {isSaving ? 'Sincronizando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'identidad', label: 'Identidad', icon: <Store size={14}/> },
                        { id: 'contacto', label: 'Contacto & Web', icon: <MapPin size={14}/> },
                        { id: 'finanzas', label: 'Finanzas & Topes', icon: <CreditCard size={14}/> },
                        { id: 'canales', label: 'Canales & Social', icon: <Globe size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                                {isActive && <motion.div layoutId="activeConfigTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                                {tab.icon} {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                    {activeTab === 'identidad' && renderIdentidad()}
                    {activeTab === 'contacto' && renderContacto()}
                    {activeTab === 'finanzas' && renderFinanzas()}
                    {activeTab === 'canales' && renderCanales()}
                </motion.div>
            </AnimatePresence>
            <div className="px-4 pt-12">
                <div className="bg-[#004953] p-16 rounded-[4rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl border border-white/5">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center shadow-3xl animate-bounce-slow"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 relative z-10 space-y-6 text-center md:text-left">
                        <div>
                            <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Master-Config</span>
                            <h3 className="text-4xl font-black tracking-tight italic mt-4 uppercase">Estado del Onboarding Digital</h3>
                            <p className="text-gray-300 text-lg font-medium leading-relaxed mt-4 italic">"Tu identidad digital está completa al <span className="text-[#00f2ff] font-black">94%</span>. Recuerda que la cuenta **Bancolombia** está próxima a superar el tope de facturación mensual. Sugiero activar la cuenta **Davivienda** como primaria para mañana."</p>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
            `}</style>
        </div>
    );
}