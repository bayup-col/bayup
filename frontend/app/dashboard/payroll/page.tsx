"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, DollarSign, Briefcase, Pencil, CheckCircle2, 
  Clock, TrendingUp, Download, Filter, Search, X, 
  Plus, Bot, Sparkles, FileText, CreditCard, 
  Calendar, Activity, UserPlus, ShieldCheck, Zap, 
  PieChart, LayoutGrid, MessageSquare, ChevronDown, Loader2, Info
} from 'lucide-react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import TiltCard from '@/components/dashboard/TiltCard';
import PayrollInfoModal from '@/components/dashboard/PayrollInfoModal';
import PayrollMetricModal from '@/components/dashboard/PayrollMetricModal';
import StaffDetailModal from '@/components/dashboard/StaffDetailModal';
import LiquidationConfirmModal from '@/components/dashboard/LiquidationConfirmModal';

// --- INTERFACES ---
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

const MOCK_PERIODS: string[] = [];

const BASE_MOCK_STAFF: StaffPayroll[] = [];

export default function PayrollPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'resumen' | 'liquidación' | 'colaboradores' | 'bayt'>('resumen');
    const [staff, setStaff] = useState<StaffPayroll[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [selectedPeriod, setSelectedPeriod] = useState(MOCK_PERIODS[0] || 'Sin periodos');
    const [loading, setLoading] = useState(true);
    
    // Estados para auditoría y UX
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState<any>(null);
    const [isHeaderPeriodOpen, setIsHeaderPeriodOpen] = useState(false);
    const [isActionPeriodOpen, setIsActionPeriodOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);

    // Modales y Estados de Edición
    const [editingMember, setEditingMember] = useState<StaffPayroll | null>(null);
    const [tempSalary, setTempSalary] = useState("");
    const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<StaffPayroll | null>(null);
    const [memberToLiquidate, setMemberToLiquidate] = useState<StaffPayroll | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // --- CARGA Y PERSISTENCIA ---
    useEffect(() => {
        const savedPayroll = localStorage.getItem('bayup_payroll_data');
        if (savedPayroll) {
            setStaff(JSON.parse(savedPayroll));
        } else {
            setStaff(BASE_MOCK_STAFF);
        }
        setLoading(false);
    }, []);

    const saveToStorage = (newData: StaffPayroll[]) => {
        setStaff(newData);
        localStorage.setItem('bayup_payroll_data', JSON.stringify(newData));
    };

    // --- HELPERS ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        if (!num) return "";
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const totalPayroll = useMemo(() => staff.reduce((acc, s) => acc + (s.base_salary + s.commissions + s.bonuses - s.deductions), 0), [staff]);
    const pendingAmount = useMemo(() => staff.filter(s => s.status !== 'paid').reduce((acc, s) => acc + (s.base_salary + s.commissions + s.bonuses - s.deductions), 0), [staff]);

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === 'all' || s.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [staff, searchTerm, filterRole]);

    // --- HANDLERS ---
    const handleLiquidar = (member: StaffPayroll) => {
        setMemberToLiquidate(member);
    };

    const confirmLiquidation = () => {
        if (!memberToLiquidate) return;
        const newData = staff.map(s => s.id === memberToLiquidate.id ? { ...s, status: 'paid' as const, last_payment_date: 'Hoy' } : s);
        saveToStorage(newData);
        showToast("Liquidación procesada con éxito 💸", "success");
        setMemberToLiquidate(null);
    };

    const handleSincronizarStaff = () => {
        setIsSyncing(true);
        showToast("Sincronizando con base de datos de Staff...", "info");
        setTimeout(() => {
            showToast("Staff actualizado con éxito", "success");
            setIsSyncing(false);
        }, 2000);
    };

    const handleUpdateSalary = () => {
        if (!editingMember) return;
        const newSalary = parseInt(tempSalary.replace(/\D/g, ''));
        if (isNaN(newSalary) || newSalary < 0) {
            showToast("Sueldo base inválido", "error");
            return;
        }

        const newData = staff.map(s => s.id === editingMember.id ? { ...s, base_salary: newSalary } : s);
        saveToStorage(newData);
        setEditingMember(null);
        showToast("Perfil de nómina actualizado", "success");
    };

    const handleExportExcel = () => {
        showToast("Generando reporte de nómina Excel...", "info");
        setTimeout(() => showToast("Archivo generado con éxito", "success"), 1500);
    };

    // --- RENDER COMPONENTS ---
    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Total Nómina Período', value: formatCurrency(totalPayroll), sub: selectedPeriod, icon: <DollarSign size={20}/>, color: 'text-[#004d4d]' },
                { label: 'Pendiente por Pagar', value: formatCurrency(pendingAmount), sub: `${staff.filter(s => s.status !== 'paid').length} colaboradores`, icon: <Clock size={20}/>, color: 'text-amber-500' },
                { label: 'Bonos & Comisiones', value: formatCurrency(staff.reduce((acc, s) => acc + s.commissions + s.bonuses, 0)), sub: 'Basado en ventas', icon: <TrendingUp size={20}/>, color: 'text-emerald-600' },
                { label: 'Costo de Personal', value: '18.4%', sub: 'vs Ingresos Totales', icon: <PieChart size={20}/>, color: 'text-[#00f2ff]' },
            ].map((kpi, i) => (
                <TiltCard key={i} onClick={() => setSelectedKPI(kpi)} className="h-full">
                    <div className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">Live</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                        </div>
                    </div>
                </TiltCard>
            ))}
        </div>
    );

    const renderActionBar = () => (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-2 rounded-[2rem] border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            
            <div className="flex items-center gap-2 pr-2">
                {/* Botón Filtro */}
                <div className="relative">
                    <motion.button 
                        layout
                        onMouseEnter={() => setIsFilterHovered(true)}
                        onMouseLeave={() => setIsFilterHovered(false)}
                        onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsActionPeriodOpen(false); }}
                        className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}
                    >
                        <motion.div layout><Filter size={18}/></motion.div>
                        <AnimatePresence mode="popLayout">
                            {(isFilterHovered || isFilterMenuOpen) && (
                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                                    {filterRole === 'all' ? 'Rol' : filterRole}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                        {isFilterMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                            >
                                {['all', 'Asesor Comercial', 'Líder de Sucursal', 'Logística', 'Administrador'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => { setFilterRole(role); setIsFilterMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterRole === role ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {role === 'all' ? 'Todos' : role}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Botón Fecha */}
                <div className="relative">
                    <motion.button 
                        layout
                        onMouseEnter={() => setIsDateHovered(true)}
                        onMouseLeave={() => setIsDateHovered(false)}
                        onClick={() => { setIsActionPeriodOpen(!isActionPeriodOpen); setIsFilterMenuOpen(false); }}
                        className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isActionPeriodOpen ? 'bg-[#004d4d] text-white' : 'bg-white text-slate-500 border border-gray-100'} shadow-sm`}
                    >
                        <motion.div layout><Calendar size={18}/></motion.div>
                        <AnimatePresence mode="popLayout">
                            {(isDateHovered || isActionPeriodOpen) && (
                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Período</motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                        {isActionPeriodOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                            >
                                {MOCK_PERIODS.map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => { setSelectedPeriod(period); setIsActionPeriodOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedPeriod === period ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Botón Exportar */}
                <motion.button 
                    layout
                    onMouseEnter={() => setIsExportHovered(true)}
                    onMouseLeave={() => setIsExportHovered(false)}
                    onClick={handleExportExcel}
                    className="h-12 flex items-center gap-2 px-4 bg-white border border-gray-100 rounded-2xl text-slate-500 hover:text-emerald-600 transition-all shadow-sm"
                >
                    <motion.div layout><Download size={18}/></motion.div>
                    <AnimatePresence mode="popLayout">
                        {isExportHovered && (
                            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar Excel</motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );

    const renderLiquidacion = () => (
        <div className="px-4 space-y-4">
            {filteredStaff.length === 0 ? (
                <div className="py-20 text-center text-gray-400">
                    <Users size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No se encontraron colaboradores</p>
                </div>
            ) : filteredStaff.map((member) => (
                <motion.div key={member.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-[#00f2ff] flex items-center justify-center text-xl font-black shadow-2xl">
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
                        <button onClick={() => setSelectedEmployeeDetail(member)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><FileText size={20}/></button>
                        <button 
                            disabled={member.status === 'paid'} 
                            onClick={() => handleLiquidar(member)}
                            className={`h-12 px-6 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${member.status === 'paid' ? 'bg-gray-100 text-gray-300' : 'bg-gray-900 text-white hover:bg-black active:scale-95'}`}
                        >
                            <CreditCard size={16} className={member.status === 'paid' ? 'text-gray-200' : 'text-[#00f2ff]'}/> 
                            {member.status === 'paid' ? 'Liquidado' : 'Liquidar'}
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000 relative">
            
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Recursos Humanos</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Nómina</span>
                    </h1>
                </div>
                <div className="relative">
                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="px-6 py-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Período Activo</p>
                            <p className="text-sm font-black text-gray-900">{selectedPeriod}</p>
                        </div>
                        <button 
                            onClick={() => setIsHeaderPeriodOpen(!isHeaderPeriodOpen)} 
                            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isHeaderPeriodOpen ? 'bg-[#004d4d] rotate-180' : 'bg-gray-900 hover:bg-black'}`}
                        >
                            <Calendar size={20} className="text-[#00f2ff]"/>
                        </button>
                    </div>

                    <AnimatePresence>
                        {isHeaderPeriodOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100]"
                            >
                                {MOCK_PERIODS.map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => { setSelectedPeriod(period); setIsHeaderPeriodOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedPeriod === period ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {renderKPIs()}

            {/* Menu Tabs + Info Button */}
            <div className="flex justify-center items-center gap-4 px-4">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto">
                    {[
                        { id: 'resumen', label: 'Resumen', icon: <LayoutGrid size={14}/> },
                        { id: 'liquidación', label: 'Liquidación', icon: <CreditCard size={14}/> },
                        { id: 'colaboradores', label: 'Colaboradores', icon: <Users size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Botón de Información Satélite */}
                <button
                    onClick={() => setShowInfoModal(true)}
                    className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 hover:bg-[#004d4d] hover:text-white transition-all shadow-xl active:scale-95 group"
                >
                    <Info size={20} />
                </button>
            </div>

            {/* Dynamic Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
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
                                    <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Directorio de Staff</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configuración base de salarios</p></div>
                                    <button 
                                        onClick={handleSincronizarStaff} 
                                        disabled={isSyncing}
                                        className="h-14 px-8 bg-[#004d4d] text-[#00f2ff] rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {isSyncing ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <UserPlus size={18}/>
                                        )}
                                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Staff'}
                                    </button>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {staff.map(member => (
                                        <div key={member.id} className="bg-gray-50/50 border border-gray-100 p-8 rounded-[3rem] space-y-6 hover:bg-white hover:shadow-xl transition-all group">
                                            <div className="flex justify-between items-start">
                                                <div className="h-14 w-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-lg font-black">{member.name.charAt(0)}</div>
                                                <button onClick={() => { setEditingMember(member); setTempSalary(member.base_salary.toString()); }} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-[#004d4d] shadow-sm transition-all"><Pencil size={16}/></button>
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
                                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed text-white/40">El asistente Bayt analizará el desempeño de tu equipo a medida que registres ventas.</p></div>
                                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Tu costo de nómina ha bajado un 2.1% respecto al mes anterior. El ROI de personal está en su punto máximo."</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODALES */}
            <PayrollInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
            
            <PayrollMetricModal 
                isOpen={!!selectedKPI} 
                onClose={() => setSelectedKPI(null)} 
                metric={selectedKPI} 
            />

            <StaffDetailModal 
                isOpen={!!selectedEmployeeDetail} 
                onClose={() => setSelectedEmployeeDetail(null)} 
                member={selectedEmployeeDetail}
                period={selectedPeriod}
            />

            <LiquidationConfirmModal
                isOpen={!!memberToLiquidate}
                onClose={() => setMemberToLiquidate(null)}
                onConfirm={confirmLiquidation}
                memberName={memberToLiquidate?.name || ""}
                amount={formatCurrency(memberToLiquidate ? (memberToLiquidate.base_salary + memberToLiquidate.commissions + memberToLiquidate.bonuses - memberToLiquidate.deductions) : 0)}
            />

            {/* MODAL: CONFIGURAR SUELDO */}
            <AnimatePresence>
                {editingMember && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingMember(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                            <div className="bg-[#004d4d] p-10 text-white flex items-center gap-6">
                                <div className="h-14 w-14 bg-[#00f2ff] text-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg"><Briefcase size={28} /></div>
                                <div><h2 className="text-xl font-black uppercase tracking-tight">Editar Nómina</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">{editingMember.name}</p></div>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Sueldo Base Mensual (COP)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={formatDots(tempSalary)} 
                                            onChange={(e) => setTempSalary(e.target.value.replace(/\D/g, ''))} 
                                            className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-black shadow-inner" 
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#004d4d] opacity-40 uppercase">COP</div>
                                    </div>
                                    <p className="text-[9px] font-black text-[#004d4d] ml-2 mt-2">Vista previa: {formatCurrency(parseInt(tempSalary || "0"))}</p>
                                </div>
                                <button onClick={handleUpdateSalary} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-black transition-all">Guardar Configuración</button>
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