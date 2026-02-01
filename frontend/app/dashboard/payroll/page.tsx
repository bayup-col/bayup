"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  Briefcase, 
  Pencil, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Download, 
  Filter, 
  Search, 
  MoreVertical, 
  X, 
  Plus, 
  ChevronRight, 
  Bot, 
  Sparkles, 
  FileText, 
  CreditCard, 
  Calendar,
  Activity,
  ArrowUpRight,
  UserPlus,
  ShieldCheck,
  Zap,
  PieChart,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";

// --- MOCK DATA PARA LA VISTA FULL ---
const MOCK_PERIODS = ['Febrero 2026', 'Enero 2026', 'Diciembre 2025'];

interface StaffPayroll {
    id: string;
    name: string;
    role: string;
    base_salary: number;
    commissions: number;
    bonuses: number;
    deductions: number;
    status: 'paid' | 'pending' | 'processing';
    is_configured: boolean;
    last_payment_date?: string;
}

const MOCK_STAFF: StaffPayroll[] = [
    { id: 's1', name: 'Elena Rodriguez', role: 'Asesor Comercial', base_salary: 1200000, commissions: 450000, bonuses: 100000, deductions: 50000, status: 'pending', is_configured: true, last_payment_date: '30 Ene 2026' },
    { id: 's2', name: 'Carlos Ruiz', role: 'Líder de Sucursal', base_salary: 2500000, commissions: 850000, bonuses: 200000, deductions: 120000, status: 'paid', is_configured: true, last_payment_date: '30 Ene 2026' },
    { id: 's3', name: 'Roberto Gómez', role: 'Logística', base_salary: 1500000, commissions: 0, bonuses: 50000, deductions: 40000, status: 'pending', is_configured: true, last_payment_date: '30 Ene 2026' },
    { id: 's4', name: 'Lucía Fernández', role: 'Administrador', base_salary: 3500000, commissions: 0, bonuses: 0, deductions: 180000, status: 'processing', is_configured: true, last_payment_date: '30 Ene 2026' },
];

export default function PayrollPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'resumen' | 'liquidación' | 'colaboradores' | 'bayt'>('resumen');
    const [staff, setStaff] = useState<StaffPayroll[]>(MOCK_STAFF);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState(MOCK_PERIODS[0]);
    
    // UI State
    const [editingMember, setEditingMember] = useState<StaffPayroll | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<StaffPayroll | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const totalPayroll = useMemo(() => staff.reduce((acc, s) => acc + (s.base_salary + s.commissions + s.bonuses - s.deductions), 0), [staff]);
    const pendingAmount = useMemo(() => staff.filter(s => s.status !== 'paid').reduce((acc, s) => acc + (s.base_salary + s.commissions + s.bonuses - s.deductions), 0), [staff]);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Total Nómina Período', value: formatCurrency(totalPayroll), sub: selectedPeriod, icon: <DollarSign size={20}/>, color: 'text-[#004d4d]' },
                { label: 'Pendiente por Pagar', value: formatCurrency(pendingAmount), sub: `${staff.filter(s => s.status !== 'paid').length} colaboradores`, icon: <Clock size={20}/>, color: 'text-amber-500' },
                { label: 'Bonos & Comisiones', value: formatCurrency(staff.reduce((acc, s) => acc + s.commissions + s.bonuses, 0)), sub: 'Basado en ventas', icon: <TrendingUp size={20}/>, color: 'text-emerald-600' },
                { label: 'Costo de Personal', value: '18.4%', sub: 'vs Ingresos Totales', icon: <PieChart size={20}/>, color: 'text-[#00f2ff]' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">KPI 0{i+1}</span>
                    </div>
                    <div className="mt-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderActionBar = () => (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o rol..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                    <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Rol</span>
                </button>
                <button className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                    <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Generar Reporte</span>
                </button>
            </div>
        </div>
    );

    const renderLiquidacion = () => (
        <div className="px-4 space-y-4">
            {staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((member) => (
                <motion.div key={member.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="h-16 w-16 rounded-[1.8rem] bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-2xl">
                            {member.name.substr(0,2).toUpperCase()}
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-gray-900 tracking-tight">{member.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                    {member.role}
                                </span>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">U. Pago: {member.last_payment_date}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-6 px-10 border-x border-gray-50">
                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sueldo Base</p><p className="text-sm font-black text-gray-900 mt-1">{formatCurrency(member.base_salary)}</p></div>
                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-emerald-600">Comisiones</p><p className="text-sm font-black text-emerald-600 mt-1">+{formatCurrency(member.commissions)}</p></div>
                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-rose-500">Deducciones</p><p className="text-sm font-black text-rose-500 mt-1">-{formatCurrency(member.deductions)}</p></div>
                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-[#004d4d]">Total Neto</p><p className="text-lg font-black text-[#004d4d] mt-1">{formatCurrency(member.base_salary + member.commissions + member.bonuses - member.deductions)}</p></div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-2">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                member.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                member.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                                {member.status === 'paid' ? 'Pagado' : member.status === 'processing' ? 'En Trámite' : 'Pendiente'}
                            </span>
                        </div>
                        <button onClick={() => setSelectedEmployeeDetail(member)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all"><FileText size={20}/></button>
                        <button disabled={member.status === 'paid'} className={`h-12 px-6 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${member.status === 'paid' ? 'bg-gray-100 text-gray-300' : 'bg-gray-900 text-white hover:bg-black active:scale-95'}`}>
                            <CreditCard size={16} className={member.status === 'paid' ? 'text-gray-200' : 'text-[#00f2ff]'}/> Liquidar
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Recursos Humanos</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Nómina</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control automatizado de pagos, comisiones y rentabilidad de <span className="font-bold text-[#001A1A]">tu equipo</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="px-6 py-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Período Activo</p>
                            <p className="text-sm font-black text-gray-900">{selectedPeriod}</p>
                        </div>
                        <button className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-lg"><Calendar size={20} className="text-[#00f2ff]"/></button>
                    </div>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'resumen', label: 'Resumen', icon: <LayoutGrid size={14}/> },
                        { id: 'liquidación', label: 'Liquidación', icon: <CreditCard size={14}/> },
                        { id: 'colaboradores', label: 'Colaboradores', icon: <Users size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="activePayrollTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {(activeTab === 'resumen' || activeTab === 'liquidación') && (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderLiquidacion()}
                        </div>
                    )}
                    
                    {activeTab === 'colaboradores' && (
                        <div className="px-4">
                            <div className="bg-white rounded-[4rem] border border-gray-100 shadow-xl overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                    <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Directorio de Staff</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configuración base de salarios y roles</p></div>
                                    <button className="h-14 px-8 bg-[#004d4d] text-[#00f2ff] rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3"><UserPlus size={18}/> Sincronizar Staff</button>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {staff.map(member => (
                                        <div key={member.id} className="bg-gray-50/50 border border-gray-100 p-8 rounded-[3rem] space-y-6 hover:bg-white hover:shadow-xl transition-all group">
                                            <div className="flex justify-between items-start">
                                                <div className="h-14 w-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-lg font-black">{member.name.charAt(0)}</div>
                                                <button onClick={() => setEditingMember(member)} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-[#004d4d] shadow-sm"><Pencil size={16}/></button>
                                            </div>
                                            <div>
                                                <h5 className="text-lg font-black text-gray-900">{member.name}</h5>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{member.role}</p>
                                            </div>
                                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <div><p className="text-[8px] font-black text-gray-400 uppercase">Sueldo Configurado</p><p className="text-sm font-black text-[#004d4d]">{formatCurrency(member.base_salary)}</p></div>
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]"></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bayt' && (
                        <div className="px-4">
                            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Users size={300} /></div>
                                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                                    <div className="flex-1 space-y-6">
                                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Talent-Insight</span>
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Eficiencia del Capital Humano</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Elena Rodriguez ha superado su meta de ventas en un 24%. Recomiendo aplicar una **bonificación extraordinaria** de $150.000 para incentivar el trimestre."</p></div>
                                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Tu costo de nómina ha bajado un 2.1% respecto al mes anterior mientras la facturación subió un 12%. El ROI de personal está en su punto máximo."</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL: DETALLE DE COLABORADOR (VOUCHER) */}
            <AnimatePresence>
                {selectedEmployeeDetail && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEmployeeDetail(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                            <div className="bg-gray-900 p-12 text-white relative">
                                <button onClick={() => setSelectedEmployeeDetail(null)} className="absolute top-10 right-10 h-12 w-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose-500 transition-all"><X size={24}/></button>
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="h-24 w-24 bg-[#004d4d] text-[#00f2ff] rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/10">{selectedEmployeeDetail.name.charAt(0)}</div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">{selectedEmployeeDetail.name}</h2>
                                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">Comprobante de Liquidación</p>
                                </div>
                            </div>
                            <div className="p-12 space-y-10 bg-[#FAFAFA]">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-4"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sueldo Base</span><span className="text-sm font-black text-gray-900">{formatCurrency(selectedEmployeeDetail.base_salary)}</span></div>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-4"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Comisiones de Venta</span><span className="text-sm font-black text-emerald-600">+{formatCurrency(selectedEmployeeDetail.commissions)}</span></div>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-4"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bonificaciones</span><span className="text-sm font-black text-emerald-600">+{formatCurrency(selectedEmployeeDetail.bonuses)}</span></div>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-4"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Deducciones (Ley)</span><span className="text-sm font-black text-rose-500">-{formatCurrency(selectedEmployeeDetail.deductions)}</span></div>
                                    <div className="flex justify-between items-center pt-2"><span className="text-sm font-black text-gray-900 uppercase">Total a Recibir</span><span className="text-2xl font-black text-[#004d4d]">{formatCurrency(selectedEmployeeDetail.base_salary + selectedEmployeeDetail.commissions + selectedEmployeeDetail.bonuses - selectedEmployeeDetail.deductions)}</span></div>
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex-1 py-5 bg-white border border-gray-100 text-gray-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-3"><Download size={16}/> Descargar PDF</button>
                                    <button className="flex-1 py-5 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"><MessageSquare size={16} className="text-[#00f2ff]"/> Enviar por WhatsApp</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: CONFIGURACIÓN BASE (STAFF) */}
            <AnimatePresence>
                {editingMember && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingMember(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                            <div className="bg-[#004d4d] p-10 text-white flex items-center gap-6">
                                <div className="h-16 w-16 bg-[#00f2ff] text-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg"><Briefcase size={32} /></div>
                                <div><h2 className="text-2xl font-black uppercase tracking-tight">Configurar Perfil</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">{editingMember.name}</p></div>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Cargo Empresarial</label>
                                    <select className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner">
                                        <option>Asesor Comercial</option><option>Administrador</option><option>Logística</option><option>Líder de Sucursal</option>
                                    </select>
                                </div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Sueldo Base Mensual</label>
                                    <div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004d4d] font-black text-sm">$</span>
                                        <input type="text" defaultValue={editingMember.base_salary} className="w-full pl-10 pr-5 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4"><button onClick={() => setEditingMember(null)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-gray-400">Cancelar</button><button onClick={() => setEditingMember(null)} className="flex-[2] py-5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl">Aplicar Cambios</button></div>
                            </div>
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