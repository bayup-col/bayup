"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Plus,
  User,
  Mail,
  Phone,
  ShoppingBag,
  CreditCard,
  X,
  MessageCircle,
  MessageSquare,
  FileText,
  History,
  CheckCircle2,
  TrendingUp,
  Clock,
  ShieldCheck,
  Star,
  Users,
  Activity,
  ArrowRight,
  Filter,
  Calendar,
  Info,
  ArrowUpRight,
  Bot,
  Zap,
  Trash2,
  Smartphone,
  Send,
  PieChart,
  LayoutGrid,
  ShieldAlert,
  MapPin,
  Briefcase,
  Target,
  Globe
} from 'lucide-react';
import TiltCard from '@/components/dashboard/TiltCard';
import CustomersInfoModal from '@/components/dashboard/CustomersInfoModal';
import CustomersMetricModal from '@/components/dashboard/CustomersMetricModal';
import { generateCustomersPDF } from '@/lib/customers-report';

// --- INTERFACES ---
interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: 'active' | 'blocked';
  customer_type: 'normal' | 'mayorista' | 'tienda';
  acquisition_channel: 'web' | 'whatsapp' | 'instagram' | 'tienda';
  gender: 'male' | 'female' | 'other' | 'all';
  city: string;
  total_orders: number;
  total_spent: number;
  join_date: string;
  last_active: string;
  is_pos?: boolean;
  history?: { id: string; date: string; status: string; amount: number; comment: string }[];
}

const MOCK_CUSTOMERS: Customer[] = [
    {
        id: "c1", full_name: "Ana García", email: "ana.garcia@gmail.com", phone: "+57 300 123 4567",
        status: 'active', customer_type: 'normal', acquisition_channel: 'whatsapp', gender: 'female', city: 'Bogotá', total_orders: 15, total_spent: 1540000,
        join_date: "2023-01-15T10:00:00Z", last_active: "2026-01-28T15:30:00Z",
        history: [
            { id: "ORD-8241", date: "28 Ene 2026", status: "Completado", amount: 120000, comment: "Compra Reloj Gold" },
            { id: "ORD-7912", date: "15 Dic 2025", status: "Completado", amount: 450000, comment: "Regalo Navidad" }
        ]
    },
    {
        id: "c2", full_name: "Carlos López", email: "carlos.lopez@hotmail.com", phone: "+57 310 987 6543",
        status: 'active', customer_type: 'tienda', acquisition_channel: 'tienda', gender: 'male', city: 'Cali', total_orders: 1, total_spent: 45000,
        join_date: "2026-01-20T10:00:00Z", last_active: "2026-01-20T10:00:00Z",
        history: [{ id: "REG-001", date: "Hoy", status: "Registro", amount: 0, comment: "Alta en tienda física" }]
    },
    {
        id: "c5", full_name: "Roberto Velásquez", email: "robert@empresa.com", phone: "+57 320 777 9999",
        status: 'active', customer_type: 'mayorista', acquisition_channel: 'web', gender: 'male', city: 'Medellín', total_orders: 42, total_spent: 18500000,
        join_date: "2022-05-10T10:00:00Z", last_active: "2026-02-02T09:00:00Z",
        history: [
            { id: "ORD-9001", date: "02 Feb 2026", status: "Procesando", amount: 2500000, comment: "Lote Sneakers Pro x20" }
        ]
    }
];

export default function CustomersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'todos' | 'nuevos' | 'vip' | 'tienda'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', gender: 'all', city: 'Bogotá', type: 'normal' });
  
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [isDateHovered, setIsDateHovered] = useState(false);
  const [isExportHovered, setIsExportHovered] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const formatCurrency = (amount: number) => {
    const val = Number(amount);
    if (isNaN(val)) return "$ 0";
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val).replace('$', '$ ');
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
        const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (activeTab === 'nuevos' && c.total_orders > 1) return false;
        if (activeTab === 'vip' && c.customer_type !== 'mayorista') return false;
        if (activeTab === 'tienda' && !c.is_pos) return false;
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        return true;
    });
  }, [customers, searchTerm, activeTab, filterStatus]);

  const handleExport = () => {
    showToast("Generando reporte de cartera Platinum...", "info");
    setTimeout(() => {
        generateCustomersPDF({
            customers: filteredCustomers,
            stats: {
                totalCustomers: customers.length,
                avgLTV: formatCurrency(customers.reduce((acc, c) => acc + c.total_spent, 0) / (customers.length || 1)),
                activeRetention: '68%',
                topSpendersCount: customers.filter(c => c.customer_type === 'mayorista').length
            }
        });
        showToast("Reporte de clientes exportado 📄", "success");
    }, 1500);
  };

  const renderKPIs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
        {[
            { label: 'Total Cartera', value: customers.length, sub: 'Clientes activos', icon: <Users size={20}/>, color: 'text-[#004d4d]' },
            { label: 'LTV Promedio', value: formatCurrency(customers.reduce((acc, c) => acc + c.total_spent, 0) / (customers.length || 1)), sub: 'Valor por cliente', icon: <Activity size={20}/>, color: 'text-blue-600' },
            { label: 'Retención Activa', value: '68.4%', sub: 'Healthy tier', icon: <ShieldCheck size={20}/>, color: 'text-emerald-500' },
            { label: 'Alertas de Fuga', value: '12', sub: 'Inactivos +90d', icon: <Clock size={20}/>, color: 'text-rose-600', pulse: true },
        ].map((kpi, i) => (
            <TiltCard key={i} onClick={() => setSelectedKPI(kpi)} className="h-full">
                <div className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>{kpi.icon}</div>
                        <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase">CRM Data</span>
                    </div>
                    <div className="mt-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                    </div>
                    {kpi.pulse && <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#F43F5E]"></div>}
                </div>
            </TiltCard>
        ))}
    </div>
  );

  const renderCreateWizard = () => {
    const handleCreate = () => {
        const newC: Customer = {
            id: `c${Date.now()}`,
            full_name: newCustomer.name,
            email: newCustomer.email,
            phone: newCustomer.phone,
            status: 'active',
            customer_type: newCustomer.type as any,
            gender: newCustomer.gender as any,
            city: newCustomer.city,
            acquisition_channel: 'tienda',
            total_orders: 0,
            total_spent: 0,
            join_date: new Date().toISOString(),
            last_active: new Date().toISOString(),
            is_pos: newCustomer.type === 'tienda',
            history: []
        };
        setCustomers(prev => [newC, ...prev]);
        setIsCreatingCustomer(false);
        setWizardStep(1);
        showToast("Perfil de cliente activado", "success");
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreatingCustomer(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-5xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20">
                <div className="bg-gray-900 p-10 text-white shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="h-20 w-20 rounded-[2rem] bg-[#00f2ff] text-[#001a1a] flex items-center justify-center text-3xl font-black">{wizardStep}</div>
                        <div><h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Nuevo <span className="text-[#00f2ff]">Perfil Cliente</span></h3></div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#FAFAFA]">
                    <AnimatePresence mode="wait">
                        {wizardStep === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nombre Completo</label><input type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-[#00f2ff] font-bold" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email</label><input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-[#00f2ff] font-bold" /></div>
                                </div>
                                <button onClick={() => setWizardStep(2)} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest">Siguiente Paso</button>
                            </motion.div>
                        )}
                        {wizardStep === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto grid grid-cols-2 gap-8">
                                <div className="space-y-6"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Género</label><div className="grid grid-cols-2 gap-4">{['male', 'female'].map(g => (<button key={g} onClick={() => setNewCustomer({...newCustomer, gender: g as any})} className={`p-6 rounded-2xl border-2 transition-all ${newCustomer.gender === g ? 'border-[#004d4d] bg-white shadow-lg' : 'bg-white border-gray-100'}`}>{g.toUpperCase()}</button>))}</div></div>
                                <div className="space-y-6"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</label><div className="grid grid-cols-2 gap-4">{['Bogotá', 'Medellín', 'Cali', 'Barranquilla'].map(c => (<button key={c} onClick={() => setNewCustomer({...newCustomer, city: c})} className={`p-4 rounded-xl border-2 transition-all ${newCustomer.city === c ? 'bg-gray-900 text-white' : 'bg-white border-gray-100'}`}>{c}</button>))}</div></div>
                                <div className="col-span-2 flex justify-center pt-8"><button onClick={() => setWizardStep(3)} className="px-16 py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase">Continuar</button></div>
                            </motion.div>
                        )}
                        {wizardStep === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto space-y-10 text-center">
                                <h4 className="text-2xl font-black italic uppercase">¿Confirmar registro de {newCustomer.name}?</h4>
                                <button onClick={handleCreate} className="px-20 py-8 bg-[#00f2ff] text-gray-900 rounded-[2rem] font-black uppercase text-sm shadow-3xl hover:bg-white transition-all">Activar Perfil</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
  };

  const renderCustomerDetail = () => {
    if (!selectedCustomer) return null;
    const c = selectedCustomer;
    const lastActiveStr = !isNaN(new Date(c.last_active).getTime()) ? new Date(c.last_active).toLocaleDateString() : 'N/A';
    const joinStr = !isNaN(new Date(c.join_date).getTime()) ? new Date(c.join_date).toLocaleDateString() : 'N/A';

    return (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
            <motion.div key="det-ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCustomer(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div key="det-content" initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-[#FAFAFA] w-full max-w-5xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/20 relative z-[1510]">
                <div className="p-12 relative overflow-hidden bg-gray-900 text-white shrink-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00F2FF] to-emerald-500 rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/2" />
                    <button onClick={() => setSelectedCustomer(null)} className="absolute top-10 right-10 text-white/30 hover:text-white transition-colors z-10"><X size={28} /></button>
                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                        <div className="h-32 w-32 bg-gradient-to-br from-[#00F2FF] to-[#004d4d] rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-[#001A1A] shadow-2xl border-4 border-white/10">{c.full_name?.charAt(0) || '?'}</div>
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{c.status}</span>
                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase border bg-blue-500/10 text-blue-400 flex items-center gap-1.5"><Briefcase size={10}/> {c.customer_type?.toUpperCase()}</span>
                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase border bg-white/5 text-gray-300 flex items-center gap-1.5"><MapPin size={10}/> {c.city}</span>
                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase border bg-[#00f2ff]/10 text-[#00f2ff] flex items-center gap-1.5"><Globe size={10}/> {c.acquisition_channel?.toUpperCase() || 'WEB'}</span>
                            </div>
                            <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">{c.full_name}</h2>
                            <p className="text-[#00F2FF] text-sm font-bold uppercase">{c.email}</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-12 space-y-12 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 text-center"><ShoppingBag className="mx-auto mb-4 text-[#004d4d]" size={24} /><p className="text-[9px] font-black text-gray-400 uppercase">Pedidos</p><p className="text-3xl font-black">{c.total_orders}</p></div>
                        <div className="bg-[#004d4d] p-8 rounded-[2.5rem] shadow-xl text-center text-white"><CreditCard className="mx-auto mb-4 text-[#00f2ff]" size={24} /><p className="text-[9px] font-black text-white/40 uppercase">LTV</p><p className="text-3xl font-black text-[#00f2ff]">{formatCurrency(c.total_spent)}</p></div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 text-center"><Clock className="mx-auto mb-4 text-amber-500" size={24} /><p className="text-[9px] font-black text-gray-400 uppercase">Última Compra</p><p className="text-xl font-black">{lastActiveStr}</p></div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 text-center"><Activity className="mx-auto mb-4 text-emerald-500" size={24} /><p className="text-[9px] font-black text-gray-400 uppercase">Miembro Desde</p><p className="text-xl font-black">{joinStr}</p></div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><History size={18} className="text-[#00F2FF]"/> Historial de Transacciones</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {c.history && c.history.map((h, i) => (
                                <div key={i} className="flex items-center justify-between p-8 bg-white border border-gray-100 rounded-[3rem] group">
                                    <div className="flex items-center gap-6"><div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#004d4d] group-hover:scale-110 transition-transform"><ShoppingBag size={24} /></div><div><p className="text-sm font-black text-gray-900 uppercase">{h.status}</p><p className="text-[11px] text-gray-400 font-medium italic">"{h.comment}"</p></div></div>
                                    <div className="text-right"><p className="text-lg font-black text-[#004d4d]">{formatCurrency(h.amount || 0)}</p><p className="text-[10px] font-bold text-gray-300 uppercase">{h.date}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-100 flex gap-4">
                        <button onClick={() => { if(c.phone) { window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}`, '_blank'); } }} className="flex-1 py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all"><MessageSquare size={18}/> WhatsApp</button>
                        <button className="flex-1 py-6 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all">Protocolo Elite</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-in fade-in duration-1000 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"><div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#004d4d]/5 rounded-full blur-[120px]" /><div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00f2ff]/5 rounded-full blur-[100px]" /></div>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
            <div><div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Customer Intelligence</span></div><h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Cartera de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Clientes</span></h1><p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Analiza el comportamiento y segmentación en tiempo real.</p></div>
            <div className="flex items-center gap-4"><button onClick={() => { setIsCreatingCustomer(true); setWizardStep(1); }} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group"><Plus size={18} className="text-[#00f2ff] group-hover:rotate-90 transition-transform duration-500" /> Nuevo Cliente</button></div>
        </div>
        {renderKPIs()}
        <div className="flex items-center justify-center gap-4 shrink-0 relative z-20">
            <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                {[ { id: 'todos', label: 'Todos', icon: <LayoutGrid size={14}/> }, { id: 'nuevos', label: 'Nuevos', icon: <Zap size={14}/> }, { id: 'vip', label: 'Mayoristas', icon: <Star size={14}/> }, { id: 'tienda', label: 'Tienda', icon: <ShoppingBag size={14}/> } ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{isActive && ( <motion.div layoutId="activeCustTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} /> )}{tab.icon}{tab.label}</button>);
                })}
            </div>
            <motion.button whileHover={{ scale: 1.1, rotate: 5 }} onClick={() => setShowInfoModal(true)} className="h-12 w-12 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl flex items-center justify-center text-[#004d4d] hover:bg-gray-900 hover:text-white transition-all group"><Info size={18} /></motion.button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-2 rounded-[2rem] border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar por nombre, email o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none" /></div>
            <div className="flex items-center gap-2 pr-2">
                <div className="relative"><motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}><Filter size={18}/><AnimatePresence mode="popLayout">{(isFilterHovered || isFilterMenuOpen) && ( <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden ml-2">{filterStatus === 'all' ? 'Estado' : filterStatus}</motion.span> )}</AnimatePresence></motion.button><AnimatePresence>{isFilterMenuOpen && ( <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50">{['all', 'active', 'blocked'].map((s) => ( <button key={s} onClick={() => { setFilterStatus(s as any); setIsFilterMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${filterStatus === s ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{s === 'all' ? 'Todos' : s}</button> ))}</motion.div> )}</AnimatePresence></div>
                <div className="relative"><motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} onClick={() => setIsDateMenuOpen(!isDateMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}><Calendar size={18}/><AnimatePresence mode="popLayout">{(isDateHovered || isDateMenuOpen) && ( <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden ml-2">{filterDateRange === 'all' ? 'Fecha' : filterDateRange}</motion.span> )}</AnimatePresence></motion.button><AnimatePresence>{isDateMenuOpen && ( <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50">{['all', 'today', 'week', 'month'].map((r) => ( <button key={r} onClick={() => { setFilterDateRange(r); setIsDateMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${filterDateRange === r ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{r}</button> ))}</motion.div> )}</AnimatePresence></div>
                <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleExport} className="h-12 flex items-center gap-2 px-4 bg-white border border-gray-100 rounded-2xl text-slate-500 hover:text-emerald-600 transition-all shadow-sm"><Download size={18}/><AnimatePresence mode="popLayout">{isExportHovered && ( <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden ml-2">Exportar</motion.span> )}</AnimatePresence></motion.button>
            </div>
        </div>
        <div className="px-4 pb-20">
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden min-h-[500px]"><table className="w-full text-left"><thead><tr className="bg-gray-50/50 border-b border-gray-100"><th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identidad Cliente</th><th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th><th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th><th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Origen</th><th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Frecuencia</th><th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Inversión LTV</th><th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acción</th></tr></thead><tbody className="divide-y divide-gray-50">{loading ? ( <tr><td colSpan={7} className="py-40 text-center"><div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-[#004d4d]/10 border-t-[#00f2ff] rounded-full animate-spin"></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sincronizando Cartera...</p></div></td></tr> ) : filteredCustomers.map((c) => ( <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="hover:bg-gray-50 transition-all group cursor-pointer"><td className="px-10 py-6"><div className="flex items-center gap-6"><div className="h-14 w-14 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-110 transition-transform duration-500">{c.full_name?.charAt(0) || '?'}</div><div><p className="text-sm font-black text-gray-900 tracking-tight">{c.full_name || 'Sin Nombre'}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.email}</p></div></div></td><td className="px-10 py-6"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{c.status}</span></td><td className="px-10 py-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.customer_type === 'mayorista' ? 'bg-blue-50 text-blue-600 border-blue-100' : c.customer_type === 'tienda' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{c.customer_type === 'mayorista' ? 'Mayorista' : c.customer_type === 'tienda' ? 'Tienda' : 'Final'}</span></td><td className="px-10 py-6 text-center"><div className="flex items-center justify-center gap-2 text-[#004d4d]">{c.acquisition_channel === 'whatsapp' ? <MessageSquare size={14}/> : c.acquisition_channel === 'tienda' ? <LayoutGrid size={14}/> : <Globe size={14}/>}<span className="text-[10px] font-black uppercase">{c.acquisition_channel || 'Web'}</span></div></td><td className="px-10 py-6 text-center"><div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100"><ShoppingBag size={12} className="text-[#004d4d]"/><span className="text-xs font-black text-[#004d4d]">{c.total_orders || 0} Pedidos</span></div></td><td className="px-10 py-6 text-right"><span className="text-sm font-black text-gray-900 bg-[#00f2ff]/10 px-3 py-1 rounded-lg border border-[#00f2ff]/20">{formatCurrency(c.total_spent || 0)}</span></td><td className="px-10 py-6 text-right"><button className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-sm"><ArrowUpRight size={18}/></button></td></tr> ))}</tbody></table></div>
        </div>
        <AnimatePresence mode="wait">{isCreatingCustomer && renderCreateWizard()}</AnimatePresence>
        <AnimatePresence mode="wait">{selectedCustomer && renderCustomerDetail()}</AnimatePresence>
        <CustomersInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
        <CustomersMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />
        <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; }.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }`}</style>
    </div>
  );
}
