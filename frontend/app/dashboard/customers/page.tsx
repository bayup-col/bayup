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
  ShieldAlert
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
  customer_type?: 'normal' | 'mayorista' | 'tienda';
  total_orders: number;
  total_spent: number;
  join_date: string;
  last_active: string;
  is_pos?: boolean;
}

const MOCK_CUSTOMERS: Customer[] = [
    {
        id: "c1", full_name: "Ana García", email: "ana.garcia@gmail.com", phone: "+57 300 123 4567",
        status: 'active', customer_type: 'normal', total_orders: 15, total_spent: 1540000,
        join_date: "2023-01-15T10:00:00Z", last_active: new Date().toISOString()
    },
    {
        id: "c2", full_name: "Carlos López", email: "carlos.lopez@hotmail.com", phone: "+57 310 987 6543",
        status: 'active', customer_type: 'tienda', total_orders: 1, total_spent: 45000,
        join_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        last_active: new Date().toISOString()
    },
    {
        id: "c5", full_name: "Roberto VIP", email: "robert@empresa.com", phone: "+57 320 777 9999",
        status: 'active', customer_type: 'mayorista', total_orders: 42, total_spent: 8500000,
        join_date: "2022-05-10T10:00:00Z", last_active: new Date().toISOString()
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
  
  // Action Bar States
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [isDateHovered, setIsDateHovered] = useState(false);
  const [isExportHovered, setIsExportHovered] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchRealCustomers = useCallback(async () => {
    if (!token) return;
    try {
        setLoading(true);
        const res = await fetch('http://localhost:8000/orders', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const orders = await res.json();
            const customerMap: Record<string, Customer> = {};
            orders.forEach((o: any) => {
                const email = o.customer_email || `sin-email-${o.id}`;
                if (!customerMap[email]) {
                    customerMap[email] = {
                        id: o.id,
                        full_name: o.customer_name || o.customer_email?.split('@')[0] || 'Cliente POS',
                        email: o.customer_email || 'No registrado',
                        phone: null,
                        status: 'active',
                        total_orders: 0,
                        total_spent: 0,
                        join_date: o.created_at,
                        last_active: o.created_at,
                        is_pos: !!o.customer_name
                    };
                }
                customerMap[email].total_orders += 1;
                customerMap[email].total_spent += o.total_price || 0;
                if (new Date(o.created_at) > new Date(customerMap[email].last_active)) {
                    customerMap[email].last_active = o.created_at;
                }
            });
            setCustomers(prev => [...MOCK_CUSTOMERS, ...Object.values(customerMap).filter(c => !MOCK_CUSTOMERS.find(m => m.email === c.email))]);
        }
    } catch (e) { console.error("Error al cargar clientes"); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchRealCustomers(); }, [fetchRealCustomers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
  };

  const handleExport = () => {
    showToast("Generando reporte de cartera Platinum...", "info");
    setTimeout(() => {
        generateCustomersPDF({
            customers: filteredCustomers,
            stats: {
                totalCustomers: customers.length,
                avgLTV: formatCurrency(customers.reduce((acc, c) => acc + c.total_spent, 0) / (customers.length || 1)),
                activeRetention: '68%',
                topSpendersCount: customers.filter(c => c.total_spent > 1000000).length
            }
        });
        showToast("Reporte de clientes exportado 📄", "success");
    }, 1500);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
        const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (activeTab === 'nuevos' && c.total_orders > 1) return false;
        if (activeTab === 'vip' && c.total_spent <= 1000000) return false;
        if (activeTab === 'tienda' && !c.is_pos) return false;

        if (filterStatus !== 'all' && c.status !== filterStatus) return false;

        return true;
    });
  }, [customers, searchTerm, activeTab, filterStatus]);

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
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
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
            total_orders: 0,
            total_spent: 0,
            join_date: new Date().toISOString(),
            last_active: new Date().toISOString(),
            is_pos: newCustomer.type === 'tienda'
        };
        setCustomers(prev => [newC, ...prev]);
        setIsCreatingCustomer(false);
        setWizardStep(1);
        setNewCustomer({ name: '', email: '', phone: '', gender: 'all', city: 'Bogotá', type: 'normal' });
        showToast("Perfil de cliente activado en la red", "success");
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreatingCustomer(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20">
                <div className="bg-gray-900 p-10 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Users size={200} /></div>
                    <button onClick={() => { setIsCreatingCustomer(false); setWizardStep(1); }} className="absolute top-10 right-10 h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-50 transition-all z-20"><X size={24} /></button>
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="h-20 w-20 rounded-[2rem] bg-[#00f2ff] text-[#001a1a] flex items-center justify-center text-3xl font-black shadow-[0_0_30px_rgba(0,242,255,0.3)]">{wizardStep}</div>
                        <div>
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Arquitecto de <span className="text-[#00f2ff]">Identidad Cliente</span></h3>
                            <div className="flex items-center gap-2 mt-3">
                                {[1, 2, 3, 4].map(s => <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${wizardStep >= s ? 'w-12 bg-[#00f2ff]' : 'w-4 bg-white/10'}`} />)}
                                <span className="ml-4 text-[10px] font-black uppercase text-[#00f2ff]/60 tracking-widest">{wizardStep === 1 ? 'Identidad' : wizardStep === 2 ? 'Ubicación' : wizardStep === 3 ? 'Segmento' : 'Activación'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12 md:p-16 custom-scrollbar bg-[#FAFAFA]">
                    <AnimatePresence mode="wait">
                        {wizardStep === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-10">
                                <div className="text-center space-y-4"><h4 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">Datos de Conexión</h4><p className="text-gray-500 font-medium">Define los puntos de contacto básicos.</p></div>
                                <div className="space-y-6">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nombre Completo</label><input type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-[#00f2ff] font-bold shadow-inner" placeholder="Ej: Elena Rodriguez" /></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email</label><input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-[#00f2ff] font-bold shadow-inner" placeholder="elena@mail.com" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">WhatsApp</label><input type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-[#00f2ff] font-bold shadow-inner" placeholder="+57 300..." /></div>
                                    </div>
                                </div>
                                <div className="flex justify-center pt-4"><button disabled={!newCustomer.name || !newCustomer.email} onClick={() => setWizardStep(2)} className="px-16 py-5 bg-gray-900 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all">Siguiente: Perfil Demográfico</button></div>
                            </motion.div>
                        )}
                        {wizardStep === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                <div className="text-center space-y-4"><h4 className="text-3xl font-black text-gray-900 uppercase italic">Geografía & Género</h4><p className="text-gray-500 font-medium mt-2">Rasgos para segmentación inteligente.</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                                    <div className="space-y-6"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Género del Cliente</label><div className="grid grid-cols-2 gap-4">{[{ id: 'male', label: 'Hombre', icon: <User size={18}/> }, { id: 'female', label: 'Mujer', icon: <User size={18}/> }].map(g => ( <button key={g.id} onClick={() => setNewCustomer({...newCustomer, gender: g.id})} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${newCustomer.gender === g.id ? 'border-[#004d4d] bg-white shadow-xl scale-105' : 'border-gray-100 bg-white text-gray-400'}`}>{g.icon}<span className="text-[10px] font-black uppercase tracking-widest">{g.label}</span></button> )) }</div></div>
                                    <div className="space-y-6"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Ubicación Principal</label><div className="grid grid-cols-2 gap-4">{['Bogotá', 'Medellín', 'Cali', 'Barranquilla'].map(city => ( <button key={city} onClick={() => setNewCustomer({...newCustomer, city})} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${newCustomer.city === city ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>{city}</button> ))}</div></div>
                                </div>
                                <div className="flex justify-center"><button onClick={() => setWizardStep(3)} className="px-16 py-5 bg-gray-900 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all">Siguiente: Nivel de Cuenta</button></div>
                            </motion.div>
                        )}
                        {wizardStep === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                <div className="text-center space-y-4"><h4 className="text-3xl font-black text-gray-900 uppercase italic">Protocolo de Segmentación</h4><p className="text-gray-500 font-medium mt-2">Nivel de importancia y tipo de tarifa.</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">{[{ id: 'normal', label: 'Retail Final', icon: <ShoppingBag size={24}/>, desc: 'Cliente estándar online.' }, { id: 'mayorista', label: 'Mayorista', icon: <FileText size={24}/>, desc: 'Precios especiales por volumen.' }, { id: 'tienda', label: 'POS Físico', icon: <LayoutGrid size={24}/>, desc: 'Registro en mostrador.' }].map(type => ( <button key={type.id} onClick={() => setNewCustomer({...newCustomer, type: type.id})} className={`p-10 rounded-[3.5rem] border-2 transition-all text-left flex flex-col justify-between h-72 ${newCustomer.type === type.id ? 'border-[#004d4d] bg-white shadow-2xl ring-4 ring-[#004d4d]/5' : 'border-gray-100 bg-white'}`}><div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 ${newCustomer.type === type.id ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-50 text-gray-400'}`}>{type.icon}</div><div><h5 className="text-sm font-black text-gray-900 uppercase tracking-tight">{type.label}</h5><p className="text-[10px] text-gray-400 mt-2 font-medium leading-relaxed">{type.desc}</p></div></button> ))}</div>
                                <div className="flex justify-center"><button onClick={() => setWizardStep(4)} className="px-16 py-5 bg-gray-900 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all">Siguiente: Validar Activación</button></div>
                            </motion.div>
                        )}
                        {wizardStep === 4 && (
                            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-8 text-center">
                                <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><ShieldCheck size={48}/></div>
                                <h4 className="text-4xl font-black italic uppercase">Perfil Optimizado</h4>
                                <p className="text-gray-500 font-medium italic">"El Arquitecto Neural ha validado a **{newCustomer.name}**. El perfil se activará en el segmento **{newCustomer.type.toUpperCase()}**."</p>
                                <div className="bg-gray-900 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12 mt-10">
                                    <div className="flex-1 text-left space-y-4"><h5 className="text-2xl font-black italic uppercase">¿Confirmar Alta?</h5></div>
                                    <button onClick={handleCreate} className="px-16 py-8 bg-[#00f2ff] text-gray-900 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-[0_0_50px_rgba(0,242,255,0.3)] hover:bg-white transition-all active:scale-95 flex items-center gap-3"><Zap size={20} fill="currentColor"/> Activar Ahora</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center px-16">
                    <button onClick={() => wizardStep > 1 && setWizardStep(wizardStep - 1)} className={`text-[10px] font-black uppercase tracking-widest text-gray-400 ${wizardStep === 1 ? 'opacity-0' : ''}`}>Regresar</button>
                    <button onClick={() => wizardStep < 4 && setWizardStep(wizardStep + 1)} className={`text-[10px] font-black uppercase tracking-widest text-[#004d4d] ${wizardStep === 4 ? 'opacity-0' : ''}`}>Siguiente <ArrowRight size={14}/></button>
                </div>
            </motion.div>
        </div>
    );
  };

  const renderCustomerDetail = () => {
    if (!selectedCustomer) return null;
    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCustomer(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-[#FAFAFA] w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/20">
                <div className="p-12 relative overflow-hidden bg-gray-900 text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F2FF] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <button onClick={() => setSelectedCustomer(null)} className="absolute top-10 right-10 text-white/30 hover:text-white transition-colors z-10"><X size={28} /></button>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                        <div className="h-28 w-28 bg-gradient-to-br from-[#00F2FF] to-[#004d4d] rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-[#001A1A] shadow-2xl">{selectedCustomer.full_name.charAt(0)}</div>
                        <div className="text-center md:text-left space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 mb-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedCustomer.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">{selectedCustomer.status === 'active' ? 'Cuenta Activa' : 'Cuenta Bloqueada'}</span>
                            </div>
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase">{selectedCustomer.full_name}</h2>
                            <p className="text-[#00F2FF] text-[10px] font-black uppercase tracking-[0.3em]">{selectedCustomer.email}</p>
                        </div>
                    </div>
                </div>
                <div className="p-12 space-y-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center group transition-all">
                            <ShoppingBag className="mx-auto mb-4 text-gray-200 group-hover:text-[#004d4d] transition-colors" size={24} />
                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Pedidos</p>
                            <p className="text-3xl font-black text-gray-900">{selectedCustomer.total_orders}</p>
                        </div>
                        <div className="bg-[#004d4d] p-8 rounded-[2.5rem] shadow-xl text-center group relative overflow-hidden">
                            <CreditCard className="mx-auto mb-4 text-white/20 relative z-10" size={24} />
                            <p className="text-[9px] font-black text-white/40 uppercase mb-1 relative z-10">LTV (Inversión)</p>
                            <p className="text-3xl font-black text-[#00f2ff] relative z-10">{formatCurrency(selectedCustomer.total_spent)}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center group transition-all">
                            <Bot className="mx-auto mb-4 text-gray-200 group-hover:text-[#004d4d] transition-colors" size={24} />
                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Ticket Prom.</p>
                            <p className="text-xl font-black text-gray-900">{formatCurrency(selectedCustomer.total_spent / (selectedCustomer.total_orders || 1))}</p>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-6"><History size={16} className="text-[#00F2FF]" /><h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Registro de Interacciones</h3></div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2.5rem] hover:border-[#00f2ff]/30 transition-all cursor-default">
                                <div className="flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={16} /></div><div><p className="text-xs font-black text-gray-900 uppercase tracking-wide">Último Pedido Sincronizado</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(selectedCustomer.last_active).toLocaleDateString()}</p></div></div>
                                <span className="text-[9px] font-black text-[#004d4d] uppercase tracking-widest italic">Actividad Reciente</span>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex gap-4">
                        <button onClick={() => { window.open(`https://wa.me/${selectedCustomer.phone?.replace(/\D/g, '')}`, '_blank'); showToast("Abriendo WhatsApp Business...", "info"); }} className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"><MessageCircle size={16}/> Contactar por WhatsApp</button>
                        <button className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all">Protocolo de Fidelización</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-in fade-in duration-1000 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#004d4d]/5 rounded-full blur-[120px]" /><div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00f2ff]/5 rounded-full blur-[100px]" />
        </div>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
            <div>
                <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Customer Intelligence System</span></div>
                <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Cartera de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Clientes</span></h1>
                <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Analiza el comportamiento, LTV y segmentación de tu audiencia en tiempo real.</p>
            </div>
            <div className="flex items-center gap-4"><button onClick={() => { setIsCreatingCustomer(true); setWizardStep(1); }} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group"><Plus size={18} className="text-[#00f2ff] group-hover:rotate-90 transition-transform duration-500" /> Nuevo Cliente</button></div>
        </div>
        {renderKPIs()}
        <div className="flex items-center justify-center gap-4 shrink-0 relative z-20">
            <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                {[ { id: 'todos', label: 'Todos', icon: <LayoutGrid size={14}/> }, { id: 'nuevos', label: 'Nuevos', icon: <Zap size={14}/> }, { id: 'vip', label: 'Segmento VIP', icon: <Star size={14}/> }, { id: 'tienda', label: 'POS Físico', icon: <ShoppingBag size={14}/> } ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{isActive && ( <motion.div layoutId="activeCustTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} /> )}{tab.icon}{tab.label}</button>);
                })}
            </div>
            <motion.button whileHover={{ scale: 1.1, rotate: 5 }} onClick={() => setShowInfoModal(true)} className="h-12 w-12 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl flex items-center justify-center text-[#004d4d] hover:bg-gray-900 hover:text-white transition-all group"><Info size={18} /></motion.button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-2 rounded-[2rem] border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar por nombre, email o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none" /></div>
            <div className="flex items-center gap-2 pr-2">
                <div className="relative">
                    <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}><Filter size={18}/><AnimatePresence mode="popLayout">{(isFilterHovered || isFilterMenuOpen) && ( <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden ml-2">{filterStatus === 'all' ? 'Estado' : filterStatus}</motion.span> )}</AnimatePresence></motion.button>
                    <AnimatePresence>{isFilterMenuOpen && ( <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50">{['all', 'active', 'blocked'].map((s) => ( <button key={s} onClick={() => { setFilterStatus(s as any); setIsFilterMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${filterStatus === s ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{s === 'all' ? 'Todos' : s}</button> ))}</motion.div> )}</AnimatePresence>
                </div>
                <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleExport} className="h-12 flex items-center gap-2 px-4 bg-white border border-gray-100 rounded-2xl text-slate-500 hover:text-emerald-600 transition-all shadow-sm"><Download size={18}/><AnimatePresence mode="popLayout">{isExportHovered && ( <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden ml-2">Exportar</motion.span> )}</AnimatePresence></motion.button>
            </div>
        </div>
        <div className="px-4 pb-20">
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden min-h-[500px]">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identidad Cliente</th>
                            <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tipo de Cliente</th>
                            <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Frecuencia</th>
                            <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión LTV</th>
                            <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? ( 
                            <tr><td colSpan={6} className="py-40 text-center"><div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-[#004d4d]/10 border-t-[#00f2ff] rounded-full animate-spin"></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sincronizando Cartera...</p></div></td></tr> 
                        ) : filteredCustomers.map((c) => ( 
                            <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="hover:bg-gray-50 transition-all group cursor-pointer">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-110 transition-transform duration-500">{c.full_name.charAt(0)}</div>
                                        <div><p className="text-sm font-black text-gray-900 tracking-tight">{c.full_name}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.email}</p></div>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{c.status}</span>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.customer_type === 'mayorista' ? 'bg-blue-50 text-blue-600 border-blue-100' : c.customer_type === 'tienda' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{c.customer_type === 'mayorista' ? 'Mayorista' : c.customer_type === 'tienda' ? 'Tienda' : 'Final'}</span>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100"><ShoppingBag size={12} className="text-[#004d4d]"/><span className="text-xs font-black text-[#004d4d]">{c.total_orders} Pedidos</span></div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className="text-sm font-black text-gray-900 bg-[#00f2ff]/10 px-3 py-1 rounded-lg border border-[#00f2ff]/20">{formatCurrency(c.total_spent)}</span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-sm"><ArrowUpRight size={18}/></button>
                                </td>
                            </tr> 
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <AnimatePresence>{isCreatingCustomer && renderCreateWizard()}</AnimatePresence>
        <AnimatePresence>{selectedCustomer && renderCustomerDetail()}</AnimatePresence>
        <CustomersInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
        <CustomersMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />
        <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; }.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }`}</style>
    </div>
  );
}
