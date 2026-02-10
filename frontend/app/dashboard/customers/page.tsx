"use client";

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  Target, 
  Zap, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  X,
  Mail,
  Smartphone,
  MapPin,
  Clock,
  ShieldCheck,
  Bot,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Heart,
  UserCheck,
  Plus,
  Save,
  Loader2,
  ChevronDown,
  Store,
  Globe,
  Share2,
  MessageCircle,
  Navigation
} from 'lucide-react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import { exportCustomersToExcel } from '@/lib/customers-export';

// --- COMPONENTE DE NÚMEROS ANIMADOS ---
const AnimatedNumber = memo(({ value, type = 'simple', className }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return `${current.toFixed(1)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });

    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span className={className}>{display}</motion.span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

// --- TILT CARD PREMIUM ---
const PremiumCard = ({ children, onClick, className = "", dark = false }: { children: React.ReactNode, onClick?: () => void, className?: string, dark?: boolean }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glare, setGlare] = useState({ x: 50, y: 50, op: 0 });

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        setRotateX((y - box.height/2) / 20);
        setRotateY((box.width/2 - x) / 20);
        setGlare({ x: (x/box.width)*100, y: (y/box.height)*100, op: dark ? 0.15 : 0.1 });
    };

    return (
        <motion.div
            onClick={onClick}
            onMouseMove={handleMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlare(g => ({...g, op: 0})); }}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className={`rounded-[3rem] border transition-all duration-500 relative overflow-hidden isolate cursor-pointer ${dark ? 'bg-[#001A1A] border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-xl'} ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                 style={{ opacity: glare.op, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${dark ? 'rgba(0,242,255,0.2)' : 'white'} 0%, transparent 60%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(30px)", position: "relative", zIndex: 2 }} className="h-full">{children}</div>
            <div className={`absolute -bottom-20 -right-20 h-40 w-40 blur-[80px] rounded-full pointer-events-none ${dark ? 'bg-[#00f2ff]/10' : 'bg-[#004d4d]/5'}`} />
        </motion.div>
    );
};

// --- INTERFACES ---
interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  status: 'active' | 'blocked' | 'Activo' | 'Bloqueado';
  customer_type: 'final' | 'mayorista';
  acquisition_channel: 'web' | 'redes' | 'tienda' | 'whatsapp';
  total_spent: number;
}

export default function CustomersPage() {
  const { token, userEmail } = useAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  // Estados para Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
      full_name: '',
      email: '',
      phone: '',
      city: '',
      customer_type: 'final' as 'final' | 'mayorista',
      acquisition_channel: 'web' as 'web' | 'redes' | 'tienda' | 'whatsapp',
      status: 'active'
  });

  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
        const res = await fetch(`${apiBase}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setCustomers(data.filter((u: any) => u.role === 'cliente'));
        }
    } catch (e) { console.error("Sync Error"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const stats = useMemo(() => ({
    total: customers.length,
    ltv: customers.reduce((acc, c) => acc + (c.total_spent || 0), 0),
    activeRate: customers.length > 0 ? 92.4 : 0,
    newToday: 0
  }), [customers]);

  const kpis = [
    { label: "Total Clientes", value: stats.total, icon: <Users size={24}/>, color: "text-[#004d4d]", bg: "bg-[#004d4d]/5", trend: "Live" },
    { label: "Valor de Cartera", value: stats.ltv, icon: <DollarSign size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+0%", isCurrency: true },
    { label: "Tasa Retención", value: stats.activeRate, icon: <Heart size={24}/>, color: "text-rose-600", bg: "bg-rose-50", trend: "94% ok", isPercentage: true },
    { label: "Nuevos Hoy", value: stats.newToday, icon: <UserPlus size={24}/>, color: "text-purple-600", bg: "bg-purple-50", trend: "Iniciando" },
  ];

  const handleCreateCustomer = async () => {
      if (!formData.full_name || !formData.email) {
          showToast("Nombre y Email son obligatorios", "error");
          return;
      }
      setIsSaving(true);
      try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
          const res = await fetch(`${apiBase}/admin/users`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  email: formData.email,
                  full_name: formData.full_name,
                  phone: formData.phone,
                  city: formData.city,
                  status: 'Activo',
                  password: Math.random().toString(36).slice(-10),
                  role: 'cliente',
                  nickname: formData.full_name.split(' ')[0],
                  customer_type: formData.customer_type,
                  acquisition_channel: formData.acquisition_channel
              })
          });
          if (res.ok) {
              showToast("Cliente registrado con éxito ✨", "success");
              setIsModalOpen(false);
              setFormData({ full_name: '', email: '', phone: '', city: '', customer_type: 'final', acquisition_channel: 'web', status: 'active' });
              fetchCustomers();
          } else {
              const err = await res.json();
              showToast(err.detail || "Error al registrar cliente", "error");
          }
      } catch (e) {
          showToast("Error de conexión con el servidor", "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleExport = async () => {
      if (customers.length === 0) {
          showToast("No hay clientes para exportar", "info");
          return;
      }
      try {
          showToast("Generando Excel Empresarial...", "info");
          await exportCustomersToExcel(customers, "Bayup_Tienda");
          showToast("¡Base de datos exportada! 📊", "success");
      } catch (e) {
          showToast("Error al generar el archivo", "error");
      }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
      
      {/* 1. HEADER PLATINUM */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60 italic">Customer Intelligence v2.0</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-[#001A1A]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">CLIENTES</span>
            </h1>
            <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">
                Hola <span className="text-[#004d4d] font-bold">{userEmail?.split('@')[0]}</span>, analiza el comportamiento y lealtad de tu comunidad. 👋
            </p>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="h-12 px-8 bg-[#004d4d] text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center gap-3 group">
                <Plus size={16} className="group-hover:rotate-90 transition-transform"/> Nuevo Cliente
            </button>
            <button onClick={handleExport} className="h-12 px-8 bg-white border border-gray-100 text-[#004d4d] rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                <Download size={16} /> Exportar Base
            </button>
        </div>
      </div>

      {/* 2. GRID DE MÉTRICAS MAESTRAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {kpis.map((kpi, i) => (
              <div key={i} onClick={() => setSelectedMetric(kpi)}>
                  <PremiumCard className="p-8 group h-full">
                      <div className="flex justify-between items-start mb-6">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 border border-white/50 ${kpi.bg} ${kpi.color}`}>
                              {kpi.icon}
                          </div>
                          <div className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-wider text-gray-400">
                              {kpi.trend}
                          </div>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{kpi.label}</p>
                          <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">
                              <AnimatedNumber value={kpi.value} type={kpi.isCurrency ? 'currency' : kpi.isPercentage ? 'percentage' : 'simple'} />
                          </h3>
                      </div>
                  </PremiumCard>
              </div>
          ))}
      </div>

      {/* 3. LISTADO TÁCTICO */}
      <div className="px-4 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-3">
                  <Activity size={20} className="text-[#004d4d]"/>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Directorio de Cuentas</h4>
              </div>
              <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full max-w-md transition-all focus-within:shadow-xl focus-within:border-cyan/30">
                  <Search size={18} className="text-gray-300 ml-2" />
                  <input 
                    placeholder="Buscar por nombre, email o ID..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="flex-1 bg-transparent outline-none text-sm font-bold" 
                  />
              </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden">
              <table className="w-full text-center">
                  <thead>
                      <tr className="bg-gray-50/50">
                          {['Cliente', 'Contacto', 'Ubicación', 'Estado', 'Tipo', 'Inversión Total'].map((h, i) => (
                              <th key={i} className="px-8 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">{h}</th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                      {loading ? (
                          <tr><td colSpan={6} className="py-20 text-center"><div className="h-12 w-12 border-4 border-[#004d4d] border-t-cyan rounded-full animate-spin mx-auto" /></td></tr>
                      ) : filteredCustomers.length === 0 ? (
                          <tr><td colSpan={6} className="py-20 text-center text-gray-300 font-black uppercase text-[10px]">Sin clientes registrados</td></tr>
                      ) : filteredCustomers.map((c) => (
                          <tr key={c.id} className="hover:bg-white/60 transition-all cursor-pointer group">
                              <td className="px-8 py-8">
                                  <div className="flex items-center justify-center gap-4">
                                      <div className="h-12 w-12 rounded-[1.2rem] bg-gray-900 text-white flex items-center justify-center font-black text-sm italic shadow-lg group-hover:scale-110 transition-transform">
                                          {c.full_name.charAt(0)}
                                      </div>
                                      <div className="text-left">
                                          <p className="text-sm font-black text-gray-900">{c.full_name}</p>
                                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ID: {c.id.slice(0,8)}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-8 py-8">
                                  <div className="flex flex-col items-center gap-1">
                                      <p className="text-xs font-bold text-gray-600">{c.email}</p>
                                      <p className="text-[10px] text-gray-400 font-medium">{c.phone || 'Sin WhatsApp'}</p>
                                  </div>
                              </td>
                              <td className="px-8 py-8">
                                  <div className="flex items-center justify-center gap-2 text-gray-500 italic">
                                      <MapPin size={12} className="text-cyan" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{c.city || 'No Registrada'}</span>
                                  </div>
                              </td>
                              <td className="px-8 py-8">
                                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status === 'active' || c.status === 'Activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      {c.status === 'active' || c.status === 'Activo' ? 'Activo' : 'Bloqueado'}
                                  </span>
                              </td>
                              <td className="px-8 py-8 uppercase text-[9px] font-black text-gray-400 italic">{c.customer_type === 'mayorista' ? 'Mayorista' : 'Final'}</td>
                              <td className="px-8 py-8 font-black text-[#004D4D] text-base">
                                  <AnimatedNumber value={c.total_spent || 0} type="currency" />
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* 4. MODAL DE CREACIÓN (DOUBLE COLUMN PLATINUM) */}
      <AnimatePresence>
          {isModalOpen && (
              <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsModalOpen(false)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
                  >
                      {/* Lado Izquierdo: Vista Previa Real-Time */}
                      <div className="lg:w-[450px] bg-slate-950 p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
                          <div className="absolute top-0 right-0 p-12 opacity-5"><Bot size={300} /></div>
                          <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-8">
                                  <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan/60">Vista Previa Elite</span>
                              </div>
                              <PremiumCard dark className="p-8 aspect-[4/5] flex flex-col justify-between border-white/10">
                                  <div className="flex justify-between items-start">
                                      <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-tr from-cyan to-blue-600 flex items-center justify-center text-4xl font-black italic shadow-2xl">
                                          {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : '?'}
                                      </div>
                                      <div className="px-4 py-1 bg-white/10 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-cyan">
                                          {formData.customer_type === 'final' ? 'Usuario Final' : 'Mayorista'}
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <div>
                                          <div className="flex items-center gap-2 mb-1">
                                              <Navigation size={10} className="text-cyan" />
                                              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan/60">{formData.city || 'Ubicación'}</span>
                                          </div>
                                          <h4 className="text-3xl font-black tracking-tight leading-none truncate">{formData.full_name || 'Nombre del Cliente'}</h4>
                                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">{formData.email || 'correo@ejemplo.com'}</p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Canal</p>
                                              <p className="text-lg font-black text-[#00f2ff] capitalize">{formData.acquisition_channel}</p>
                                          </div>
                                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Estado</p>
                                              <p className="text-lg font-black text-white">Activo</p>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Cuenta Verificada</span>
                                  </div>
                              </PremiumCard>
                          </div>
                          <div className="relative z-10 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                              <p className="text-[10px] font-bold italic text-white/40 leading-relaxed">&quot;Al registrar la ubicación del cliente, Bayt AI podrá generar mapas de calor sobre tus ventas y optimizar los costos de envío automáticos.&quot;</p>
                          </div>
                      </div>

                      {/* Lado Derecho: Formulario Táctico */}
                      <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-gray-50/50">
                          <div className="flex justify-between items-start mb-12">
                              <div>
                                  <h3 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase">Registro de Cuenta</h3>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Diligencia la información oficial del cliente</p>
                              </div>
                              <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-all shadow-sm">
                                  <X size={20}/>
                              </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                  <input 
                                    type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    placeholder="Ej: Sebas Betancourt"
                                    className="w-full p-5 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-cyan/10 transition-all font-bold text-sm"
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                  <input 
                                    type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                    placeholder="cliente@bayup.com"
                                    className="w-full p-5 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-cyan/10 transition-all font-bold text-sm"
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp / Celular</label>
                                  <input 
                                    type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+57 300 000 0000"
                                    className="w-full p-5 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-cyan/10 transition-all font-bold text-sm"
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ciudad de Origen</label>
                                  <input 
                                    type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                                    placeholder="Ej: Bogotá, Medellín..."
                                    className="w-full p-5 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-cyan/10 transition-all font-bold text-sm"
                                  />
                              </div>
                              
                              {/* SELECTOR PREMIUM DE TIPO DE CLIENTE */}
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Cliente</label>
                                  <div className="grid grid-cols-2 gap-3">
                                      {[
                                          { id: 'final', label: 'Usuario Final', icon: <UserCheck size={14}/> },
                                          { id: 'mayorista', label: 'Mayorista', icon: <ShoppingBag size={14}/> }
                                      ].map((type) => (
                                          <button
                                            key={type.id}
                                            onClick={() => setFormData({...formData, customer_type: type.id as any})}
                                            className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${formData.customer_type === type.id ? 'bg-[#004d4d] border-[#004d4d] text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                          >
                                              {type.icon}
                                              <span className="text-[9px] font-black uppercase tracking-widest">{type.label}</span>
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              {/* SELECTOR PREMIUM DE CANAL DE ADQUISICIÓN */}
                              <div className="md:col-span-2 space-y-4">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Canal de Adquisición (¿De donde llegó?)</label>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {[
                                          { id: 'web', label: 'Página Web', icon: <Globe size={16}/> },
                                          { id: 'redes', label: 'Redes Sociales', icon: <Share2 size={16}/> },
                                          { id: 'tienda', label: 'Tienda Física', icon: <Store size={16}/> },
                                          { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16}/> }
                                      ].map((channel) => (
                                          <button
                                            key={channel.id}
                                            onClick={() => setFormData({...formData, acquisition_channel: channel.id as any})}
                                            className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 transition-all ${formData.acquisition_channel === channel.id ? 'bg-cyan border-cyan text-[#001a1a] shadow-xl scale-[1.02]' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                          >
                                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${formData.acquisition_channel === channel.id ? 'bg-black/10' : 'bg-gray-50'}`}>
                                                  {channel.icon}
                                              </div>
                                              <span className="text-[10px] font-black uppercase tracking-widest">{channel.label}</span>
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          <div className="mt-12 p-8 bg-[#004d4d]/5 rounded-[2.5rem] border border-[#004d4d]/10 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-sm"><Sparkles size={20}/></div>
                                  <div>
                                      <p className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest">Base de Datos Railway</p>
                                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 italic">El registro será almacenado y sincronizado globalmente</p>
                                  </div>
                              </div>
                              <button 
                                onClick={handleCreateCustomer}
                                disabled={isSaving}
                                className="h-14 px-12 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black disabled:opacity-50 transition-all flex items-center gap-3"
                              >
                                  {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} className="text-[#00f2ff]"/>}
                                  {isSaving ? 'Sincronizando...' : 'Finalizar Registro'}
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <MetricDetailModal 
        isOpen={!!selectedMetric} 
        onClose={() => setSelectedMetric(null)} 
        metric={selectedMetric} 
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}