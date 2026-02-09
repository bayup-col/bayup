"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Store, 
  MapPin, 
  Globe, 
  Smartphone, 
  ChevronRight, 
  X, 
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock, 
  DollarSign,
  Rocket,
  Activity,
  Zap,
  LayoutGrid,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Package,
  Search,
  Filter,
  Download,
  Calendar,
  Sparkles,
    Bot, 
    Truck, 
    Monitor,
    ArrowLeftRight,  BarChart3, RotateCcw, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from '@/context/toast-context';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    Cell,
    PieChart,
    Pie
} from 'recharts';

// --- COMPONENTE TILT CARD PREMIUM ---
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        setRotateX((e.clientY - box.top - centerY) / 7); 
        setRotateY((centerX - (e.clientX - box.left)) / 7);
        setGlarePos({ x: ((e.clientX - box.left)/box.width)*100, y: ((e.clientY - box.top)/box.height)*100, opacity: 0.3 });
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlarePos(p => ({...p, opacity: 0})); }}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
            className={`bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-2xl flex flex-col justify-between group relative overflow-hidden h-full ${className}`}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ opacity: glarePos.opacity, background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.9) 0%, transparent 50%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(80px)", position: "relative", zIndex: 2 }} className="h-full flex flex-col justify-between">{children}</div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#00f2ff]/20 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

// --- INTERFACES ---
interface Branch {
    id: string;
    name: string;
    responsible: string;
    location: string;
    status: 'open' | 'closed' | 'maintenance';
    revenue: number;
    expenses: number;
    growth: number;
    stock_status: 'optimal' | 'critical' | 'normal';
    staff_count: number;
    trend_data: { day: string; value: number }[];
    created_at: string;
}

// --- MOCK DATA ---
const MOCK_BRANCHES: Branch[] = [
    {
        id: 'b1',
        name: 'Tienda Principal',
        responsible: 'Sebastian Gomez',
        location: 'Bogotá, Chicó',
        status: 'open',
        revenue: 12500000,
        expenses: 4200000,
        growth: 12.5,
        stock_status: 'optimal',
        staff_count: 8,
        created_at: '2026-01-01',
        trend_data: [
            { day: 'L', value: 400 }, { day: 'M', value: 300 }, { day: 'M', value: 500 },
            { day: 'J', value: 450 }, { day: 'V', value: 650 }, { day: 'S', value: 800 }, { day: 'D', value: 720 }
        ]
    },
    {
        id: 'b2',
        name: 'Sucursal Norte',
        responsible: 'Elena Rodriguez',
        location: 'Medellín, Poblado',
        status: 'open',
        revenue: 8400000,
        expenses: 3100000,
        growth: 8.2,
        stock_status: 'normal',
        staff_count: 5,
        created_at: '2026-01-15',
        trend_data: [
            { day: 'L', value: 200 }, { day: 'M', value: 250 }, { day: 'M', value: 300 },
            { day: 'J', value: 280 }, { day: 'V', value: 400 }, { day: 'S', value: 550 }, { day: 'D', value: 480 }
        ]
    },
    {
        id: 'b3',
        name: 'Showroom Sur',
        responsible: 'Carlos Ruiz',
        location: 'Cali, Unicentro',
        status: 'maintenance',
        revenue: 4200000,
        expenses: 1800000,
        growth: -2.4,
        stock_status: 'critical',
        staff_count: 3,
        created_at: '2026-02-01',
        trend_data: [
            { day: 'L', value: 150 }, { day: 'M', value: 120 }, { day: 'M', value: 180 },
            { day: 'J', value: 160 }, { day: 'V', value: 220 }, { day: 'S', value: 300 }, { day: 'D', value: 250 }
        ]
    }
];

// --- MODAL DE DETALLE DE MÉTRICA ---
const SucursalesMetricModal = ({ isOpen, onClose, metric }: { isOpen: boolean, onClose: () => void, metric: any }) => {
    if (!metric) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                        <div className={`p-10 text-white relative overflow-hidden ${metric.color.replace('text-', 'bg-')}`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10">{metric.icon}</div>
                            <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">{metric.label}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-2 relative z-10 opacity-80">{metric.trend}</p>
                            <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-white">
                            <div className="text-center py-6">
                                <span className="text-5xl font-black text-gray-900 tracking-tighter italic">{metric.value}</span>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Estado de la Red Física</p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-gray-500">Salud Operativa</span>
                                    <span className="text-sm font-black text-emerald-600">Excelente</span>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-gray-500">Capacidad Red</span>
                                    <span className="text-sm font-black text-[#004d4d]">94%</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl">Cerrar Análisis</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function SucursalesPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'monitor' | 'transferencias' | 'inventario' | 'bayt'>('monitor');
    const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [selectedKPI, setSelectedKPI] = useState<any | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        responsible: '',
        location: '',
        staff_count: '1'
    });

    const handleSaveBranch = (e: React.FormEvent) => {
        e.preventDefault();
        const newBranch: Branch = {
            id: `b${Date.now()}`,
            name: formData.name,
            responsible: formData.responsible,
            location: formData.location,
            status: 'open',
            revenue: 0,
            expenses: 0,
            growth: 0,
            stock_status: 'normal',
            staff_count: parseInt(formData.staff_count),
            created_at: new Date().toISOString().split('T')[0],
            trend_data: [{ day: 'L', value: 0 }, { day: 'M', value: 0 }, { day: 'M', value: 0 }]
        };
        setBranches([...branches, newBranch]);
        showToast("Sucursal registrada exitosamente 🚀", "success");
        setIsCreateModalOpen(false);
    };

    const handleDownloadBranchAudit = (branch: Branch) => {
        const title = `AUDITORÍA OPERATIVA: ${branch.name.toUpperCase()}`;
        const date = new Date().toLocaleDateString();
        const html = `
            <html><head><meta charset="utf-8"><style>
                .header { background: #001a1a; color: #00f2ff; font-family: sans-serif; font-weight: bold; text-align: center; padding: 30px; }
                .card { border: 1px solid #004d4d; margin: 20px; padding: 20px; font-family: sans-serif; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f8fafc; color: #64748b; padding: 10px; text-align: left; font-size: 12px; }
                td { border-bottom: 1px solid #f1f5f9; padding: 12px; font-size: 14px; }
                .money { color: #004d4d; font-weight: bold; }
            </style></head><body>
                <div class="header">${title}<br><small>Reporte de Cumplimiento | ${date}</small></div>
                <div class="card">
                    <h3>RESUMEN FINANCIERO</h3>
                    <table>
                        <tr><th>Indicador</th><th>Valor Actual</th></tr>
                        <tr><td>Facturación Acumulada</td><td class="money">${formatCurrency(branch.revenue)}</td></tr>
                        <tr><td>Gastos Operativos</td><td class="money" style="color: #ef4444;">${formatCurrency(branch.expenses)}</td></tr>
                        <tr><td>Utilidad Neta</td><td class="money">${formatCurrency(branch.revenue - branch.expenses)}</td></tr>
                        <tr><td>Crecimiento Mensual</td><td>${branch.growth}%</td></tr>
                    </table>
                </div>
                <div class="card">
                    <h3>DATOS DE SEDE</h3>
                    <p><b>Responsable:</b> ${branch.responsible}</p>
                    <p><b>Ubicación:</b> ${branch.location}</p>
                    <p><b>Staff Activo:</b> ${branch.staff_count} Miembros</p>
                    <p><b>Estado Stock:</b> ${branch.stock_status.toUpperCase()}</p>
                </div>
            </body></html>
        `;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Auditoria_${branch.name.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.xls`;
        a.click();
        showToast("Auditoría de sede generada 📈", "success");
    };

    const handleDownloadReport = () => {
        const title = "REPORTE DE RED DE SUCURSALES BAYUP";
        const date = new Date().toLocaleDateString();
        const html = `
            <html><head><meta charset="utf-8"><style>
                .header { background: #001a1a; color: #00f2ff; font-family: sans-serif; font-weight: bold; text-align: center; padding: 20px; }
                table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
                th { background: #004d4d; color: white; padding: 10px; }
                td { border: 1px solid #eee; padding: 10px; text-align: left; }
            </style></head><body>
                <div class="header">${title}<br><small>Generado el ${date}</small></div>
                <table>
                    <thead><tr><th>Sede</th><th>Ubicación</th><th>Responsable</th><th>Facturación</th><th>Estado</th></tr></thead>
                    <tbody>
                        ${filteredBranches.map(b => `<tr><td>${b.name}</td><td>${b.location}</td><td>${b.responsible}</td><td>${formatCurrency(b.revenue)}</td><td>${b.status}</td></tr>`).join('')}
                    </tbody>
                </table>
            </body></html>
        `;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Reporte_Sucursales_${date.replace(/\//g, '-')}.xls`;
        a.click();
        showToast("Reporte exportado correctamente 📊", "success");
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const filteredBranches = useMemo(() => {
        return branches.filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.location.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesDate = true;
            if (dateRange.start && dateRange.end) {
                const d = new Date(b.created_at).getTime();
                matchesDate = d >= new Date(dateRange.start).getTime() && d <= new Date(dateRange.end).getTime();
            }
            return matchesSearch && matchesDate;
        });
    }, [branches, searchTerm, dateRange]);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { id: 's_a', label: 'Sucursales Activas', value: '03', sub: 'Puntos de venta', icon: <Store size={20}/>, trend: 'OK', color: 'text-[#004d4d]' },
                { id: 'v_t', label: 'Venta Total Red', value: '$ 25.1M', sub: 'Consolidado mensual', icon: <DollarSign size={20}/>, trend: '+12.5%', color: 'text-emerald-600' },
                { id: 's_e', label: 'Sucursal Estrella', value: 'Principal', sub: 'Mayor facturación', icon: <Zap size={20}/>, trend: 'Top 1', color: 'text-[#00f2ff]' },
                { id: 'e_o', label: 'Eficiencia Operativa', value: '74.2%', sub: 'Margen promedio', icon: <Activity size={20}/>, trend: '+2.1%', color: 'text-amber-500' },
            ].map((kpi, i) => (
                <div key={i} onClick={() => setSelectedKPI(kpi)}>
                    <TiltCard className="p-8 cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>{kpi.trend}</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                        </div>
                    </TiltCard>
                </div>
            ))}
        </div>
    );

    const renderActionBar = () => (
        <div className="w-full max-w-[1100px] mx-auto flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:shadow-xl focus-within:border-[#004d4d]/20 relative z-30">
            <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre de sucursal o ciudad..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" 
                />
            </div>
            
            <div className="flex items-center gap-1">
                {/* FILTROS */}
                <div className="relative">
                    <motion.button 
                        layout 
                        onMouseEnter={() => setIsFilterHovered(true)} 
                        onMouseLeave={() => setIsFilterHovered(false)} 
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} 
                        className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}
                    >
                        <Filter size={18}/> 
                        <AnimatePresence>
                            {isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Ubicación</motion.span>}
                        </AnimatePresence>
                    </motion.button>
                    
                    <AnimatePresence>
                        {isFilterMenuOpen && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-gray-100">
                                <button onClick={() => setIsFilterMenuOpen(false)} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Todas las sedes</button>
                                <button onClick={() => setIsFilterMenuOpen(false)} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Principales</button>
                                <button onClick={() => setIsFilterMenuOpen(false)} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Showrooms</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* FECHAS */}
                <div className="relative group/date">
                    <motion.button 
                        layout 
                        onMouseEnter={() => setIsDateHovered(true)} 
                        onMouseLeave={() => setIsDateHovered(false)} 
                        className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${dateRange.start ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}
                    >
                        <Calendar size={18}/> 
                        <AnimatePresence>
                            {isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Fechas</motion.span>}
                        </AnimatePresence>
                    </motion.button>
                    
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 scale-95 pointer-events-none group-hover/date:opacity-100 group-hover/date:scale-100 group-hover/date:pointer-events-auto transition-all z-50 flex gap-2">
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none border border-transparent focus:border-[#004d4d]" />
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none border border-transparent focus:border-[#004d4d]" />
                        <button onClick={() => setDateRange({start:'', end:''})} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors"><RotateCcw size={14}/></button>
                    </div>
                </div>

                {/* EXPORTAR */}
                <motion.button 
                    layout 
                    onMouseEnter={() => setIsExportHovered(true)} 
                    onMouseLeave={() => setIsExportHovered(false)} 
                    onClick={handleDownloadReport}
                    className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 border border-transparent hover:bg-white hover:border-gray-100 text-gray-500 transition-all"
                >
                    <Download size={18}/> 
                    <AnimatePresence>
                        {isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Reporte</motion.span>}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );

    const renderBranchMonitor = () => (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBranches.map((branch) => (
                <TiltCard 
                    key={branch.id} 
                    className="p-10 cursor-pointer group"
                >
                    <div onClick={() => setSelectedBranch(branch)} className="h-full flex flex-col justify-between">
                        {/* Status Badge */}
                        <div className="flex justify-between items-start">
                            <div className="h-14 w-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-2xl">
                                <Store size={28} />
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                branch.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                branch.status === 'maintenance' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                                {branch.status === 'open' ? 'Operando' : branch.status === 'maintenance' ? 'Mantenimiento' : 'Cerrada'}
                            </span>
                        </div>

                        {/* Basic Info */}
                        <div className="mt-8">
                            <h4 className="text-2xl font-black text-gray-900 tracking-tight">{branch.name}</h4>
                            <div className="flex items-center gap-2 text-gray-400 mt-1">
                                <MapPin size={12} className="text-[#00f2ff]"/>
                                <p className="text-[10px] font-bold uppercase tracking-widest">{branch.location}</p>
                            </div>
                        </div>

                        {/* Mini Charts & Stats */}
                        <div className="space-y-6 mt-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-inner">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Facturación</p>
                                    <p className="text-sm font-black text-gray-900 mt-1">{formatCurrency(branch.revenue)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-inner">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Crecimiento</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {branch.growth >= 0 ? <ArrowUpRight size={12} className="text-emerald-500"/> : <ArrowDownRight size={12} className="text-rose-500"/>}
                                        <p className={`text-sm font-black ${branch.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{branch.growth}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Trend Area */}
                            <div className="h-20 w-full opacity-40 group-hover:opacity-100 transition-opacity">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={branch.trend_data}>
                                        <Area type="monotone" dataKey="value" stroke={branch.growth >= 0 ? "#10b981" : "#f43f5e"} fill={branch.growth >= 0 ? "#10b981" : "#f43f5e"} fillOpacity={0.1} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Stock Status Bar */}
                        <div className="pt-6 border-t border-gray-50 space-y-2 mt-auto">
                            <div className="flex justify-between items-end">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inventario</p>
                                <span className={`text-[9px] font-black uppercase ${
                                    branch.stock_status === 'optimal' ? 'text-emerald-600' :
                                    branch.stock_status === 'normal' ? 'text-blue-600' : 'text-rose-600'
                                }`}>{branch.stock_status}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: branch.stock_status === 'optimal' ? '90%' : branch.stock_status === 'normal' ? '65%' : '25%' }} 
                                    className={`h-full rounded-full ${
                                        branch.stock_status === 'optimal' ? 'bg-emerald-500' :
                                        branch.stock_status === 'normal' ? 'bg-blue-500' : 'bg-rose-500'
                                    }`}
                                ></motion.div>
                            </div>
                        </div>
                    </div>
                </TiltCard>
            ))}
        </div>
    );

    const renderBaytInsight = () => (
        <div className="px-4">
            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Globe size={300} /></div>
                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 space-y-6">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Network-Insight</span>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Optimización de Red de Ventas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><Truck className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Logística Inteligente</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"La **Sucursal Norte** tiene exceso de stock en calzado, mientras la **Tienda Principal** está en crítico. Sugiero transferencia inmediata de 45 pares para capturar la demanda del fin de semana."</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Oportunidad de Expansión</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"El 22% de tus pedidos web en Cali son recogidos en punto físico. El **Showroom Sur** tiene potencial para convertirse en centro de distribución 'Dark Store' para reducir costos de envío."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Red de Operaciones</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Sucursales</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control multi-sede, expansión de imperio y rendimiento logístico de <span className="font-bold text-[#001A1A]">tu red</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                        <Rocket size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                        Registrar Sucursal
                    </button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'monitor', label: 'Monitor de Red', icon: <Monitor size={14}/> },
                        { id: 'transferencias', label: 'Transferencias', icon: <ArrowLeftRight size={14}/> },
                        { id: 'inventario', label: 'Inventario por Sede', icon: <Package size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            {activeTab === tab.id && (
                                <motion.div layoutId="branchTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                            )}
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all group">
                    <Info size={20} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {activeTab === 'monitor' && (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderBranchMonitor()}
                        </div>
                    )}
                    {activeTab === 'transferencias' && (
                        <div className="px-4 py-20 text-center text-gray-300 font-bold uppercase tracking-widest border-4 border-dashed border-gray-100 rounded-[4rem]">Historial de Transferencias entre sedes en desarrollo</div>
                    )}
                    {activeTab === 'inventario' && (
                        <div className="px-4 py-20 text-center text-gray-300 font-bold uppercase tracking-widest border-4 border-dashed border-gray-100 rounded-[4rem]">Monitor de Stock segmentado por sede en desarrollo</div>
                    )}
                    {activeTab === 'bayt' && renderBaytInsight()}
                </motion.div>
            </AnimatePresence>

            {/* --- MODAL 360° DETALLE DE SUCURSAL --- */}
            <AnimatePresence>
                {selectedBranch && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBranch(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            
                            {/* SIDEBAR SUCURSAL */}
                            <div className="w-full md:w-[400px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <button onClick={() => setSelectedBranch(null)} className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all"><X size={24}/></button>
                                
                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Información de Sede</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-[1.5rem] bg-gray-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl">
                                            <Store size={32} />
                                        </div>
                                        <div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedBranch.name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">{selectedBranch.responsible}</p></div>
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><MapPin size={18} className="text-[#00f2ff]"/> {selectedBranch.location}</div>
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><Users size={18} className="text-[#00f2ff]"/> {selectedBranch.staff_count} Colaboradores</div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Resumen de Operación</h4>
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Facturación:</span><span className="text-xs font-black text-emerald-600">{formatCurrency(selectedBranch.revenue)}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Gastos:</span><span className="text-xs font-black text-rose-600">{formatCurrency(selectedBranch.expenses)}</span></div>
                                        <div className="pt-2 border-t border-gray-50 flex items-center justify-between"><span className="text-[10px] font-black text-gray-900 uppercase">Utilidad:</span><span className="text-sm font-black text-[#004d4d]">{formatCurrency(selectedBranch.revenue - selectedBranch.expenses)}</span></div>
                                    </div>
                                </section>

                                <button 
                                    onClick={() => handleDownloadBranchAudit(selectedBranch)}
                                    className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3"
                                >
                                    <Download size={16} className="text-[#00f2ff]" /> Descargar Auditoría
                                </button>
                            </div>

                            {/* MAIN CONTENT: TRENDS & ANALYTICS */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Rendimiento Detallado</h2>
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2"><Activity size={14} className="text-[#00f2ff]"/> Análisis de facturación semanal</p>
                                    </div>
                                    <button className="h-12 px-6 bg-gray-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#004d4d] border border-gray-100">Configurar Metas</button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    {/* Gráfica de Tendencia */}
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedBranch.trend_data}>
                                                <defs>
                                                    <linearGradient id="colorBranch" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#004d4d" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#004d4d" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                                <Area type="monotone" dataKey="value" stroke="#004d4d" strokeWidth={4} fillOpacity={1} fill="url(#colorBranch)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Alertas Específicas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-[#001a1a] p-8 rounded-[2.5rem] text-white space-y-4">
                                            <div className="flex items-center gap-3"><AlertCircle className="text-amber-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest">Alerta de Margen</p></div>
                                            <p className="text-sm font-medium italic opacity-80 leading-relaxed">"Los gastos operativos de esta sede subieron un 15% este mes. Revisa el consumo de servicios públicos y logística local."</p>
                                        </div>
                                        <div className="bg-[#004d4d] p-8 rounded-[2.5rem] text-white space-y-4">
                                            <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest">Potencial de Venta</p></div>
                                            <p className="text-sm font-medium italic opacity-80 leading-relaxed">"Sábado es el día de mayor tráfico en esta ubicación. Refuerza el staff con 1 persona adicional para maximizar cierres."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE SUCURSALES */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            
                            {/* COLUMNA IZQUIERDA: MENÚ TÁCTICO */}
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3">
                                <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"><Bot size={24}/></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004d4d] mb-4">Guía Maestro Red</h3>
                                
                                {[
                                    { id: 0, label: 'Monitor de Red', icon: <Monitor size={16}/> },
                                    { id: 1, label: 'Logística Cruzada', icon: <ArrowLeftRight size={16}/> },
                                    { id: 2, label: 'Stock Multi-sede', icon: <Package size={16}/> },
                                    { id: 3, label: 'Inteligencia Bayt', icon: <Sparkles size={16}/> }
                                ].map(step => (
                                    <button 
                                        key={step.id} 
                                        onClick={() => setActiveGuideStep(step.id)} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-xl shadow-[#004d4d]/20' : 'text-gray-500 hover:bg-white hover:shadow-sm'}`}
                                    >
                                        <div className={activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-300'}>{step.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                    </button>
                                ))}

                                <div className="mt-auto pt-8 border-t border-gray-100">
                                    <div className="p-4 bg-[#004d4d]/5 rounded-2xl">
                                        <p className="text-[8px] font-black text-[#004d4d] uppercase tracking-widest">Core Status</p>
                                        <p className="text-[10px] font-bold text-gray-500 mt-1">Multi-sede Sincronizado</p>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: CONTENIDO VISUAL */}
                            <div className="flex-1 p-16 flex flex-col justify-between relative overflow-y-auto custom-scrollbar bg-white">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100]"><X size={24}/></button>
                                
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Control de <span className="text-[#004D4D]">Imperio</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">&quot;Supervisa cada punto de contacto físico de tu marca desde un solo centro de mando.&quot;</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] mb-6 shadow-sm"><Activity size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Health Status</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Monitorea si las sedes están operando, en mantenimiento o cerradas en tiempo real.</p>
                                                </div>
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#00f2ff] mb-6 shadow-sm"><BarChart3 size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Revenue Mix</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Compara qué sede está aportando más al crecimiento global de la red.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 1 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Logística <span className="text-[#004D4D]">Cruzada</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Mueve mercancía entre sedes para evitar el lucro cesante.</p>
                                            </div>
                                            <div className="relative p-10 bg-[#001A1A] rounded-[3.5rem] overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowLeftRight size={120}/></div>
                                                <div className="space-y-6 relative z-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-14 w-14 rounded-2xl bg-[#004d4d] text-[#00f2ff] flex items-center justify-center shadow-lg"><Truck size={28}/></div>
                                                        <div>
                                                            <p className="text-sm font-black uppercase tracking-widest text-[#00f2ff]">Transferencias Seguras</p>
                                                            <p className="text-xs font-medium text-gray-400 mt-1 italic">Cada movimiento de stock queda auditado con firma de los responsables de origen y destino.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 3 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Inteligencia <span className="text-[#004D4D]">Bayt</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Deja que la IA optimice la distribución geográfica de tu stock.</p>
                                            </div>
                                            <div className="p-10 bg-gray-900 rounded-[3.5rem] relative overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/10 rounded-full blur-[80px]"></div>
                                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                                    <div className="h-20 w-20 bg-[#00f2ff]/10 text-[#00f2ff] rounded-[2rem] border border-[#00f2ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.2)] animate-pulse"><Bot size={48}/></div>
                                                    <div className="space-y-4">
                                                        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#00f2ff]">Bayt Network-Strategist</p>
                                                        <p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Bayt identifica qué productos tienen más rotación en cada barrio para sugerir transferencias preventivas, ahorrando un 12% en logística de última milla.&quot;</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-12 pt-12 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-900 text-[#00f2ff] flex items-center justify-center font-black text-xs shadow-lg italic">B</div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bayup Infrastructure v2.0</p>
                                    </div>
                                    <button onClick={() => setIsGuideOpen(false)} className="px-12 py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95">Entendido, Continuar Gestión</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL REGISTRO SUCURSAL PLATINUM --- */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-[1200px] h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col lg:flex-row">
                            
                            {/* Botón Cerrar */}
                            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-xl z-[100] transition-all"><X size={24}/></button>

                            {/* COLUMNA IZQUIERDA: FORMULARIO */}
                            <div className="w-full lg:w-[500px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar flex flex-col space-y-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff] shadow-lg"><Rocket size={24}/></div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">Nueva Sucursal</h3>
                                </div>

                                <form onSubmit={handleSaveBranch} className="space-y-8 flex-1">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre de la Sede</label>
                                        <input required placeholder="Ej: Sucursal Centro" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-[#004d4d] text-sm font-bold shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Responsable / Gerente</label>
                                        <input required placeholder="Nombre completo" value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-[#004d4d] text-sm font-bold shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ubicación Geográfica</label>
                                        <input required placeholder="Ciudad, Barrio o Dirección" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-[#004d4d] text-sm font-bold shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Equipo Inicial (Colaboradores)</label>
                                        <input type="number" value={formData.staff_count} onChange={e => setFormData({...formData, staff_count: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-[#004d4d] text-sm font-bold shadow-sm" />
                                    </div>
                                    <button type="submit" className="w-full py-6 bg-gray-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4">
                                        <CheckCircle2 size={24} className="text-[#00f2ff]"/> Activar Punto de Venta
                                    </button>
                                </form>
                            </div>

                            {/* COLUMNA DERECHA: LIVE PREVIEW */}
                            <div className="flex-1 bg-[#FAFAFA] p-16 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="text-center mb-12 mt-10 relative z-10">
                                    <span className="px-4 py-1 bg-[#004d4d]/10 text-[#004d4d] rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Red en Vivo</span>
                                    <h4 className="text-xl font-medium text-gray-400 mt-4 italic">Vista previa de la sucursal en el imperio</h4>
                                </div>

                                <motion.div key={formData.name + formData.location} initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-[450px] my-auto">
                                    <TiltCard className="p-12 h-auto bg-white shadow-3xl">
                                        <div className="flex justify-between items-start mb-10">
                                            <div className="h-20 w-20 rounded-[2rem] bg-gray-900 text-white flex items-center justify-center shadow-2xl"><Store size={40}/></div>
                                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Nueva Sede</span>
                                        </div>
                                        <div className="space-y-2 mb-10">
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{formData.name || 'Nombre de la Sede'}</h2>
                                            <div className="flex items-center gap-2 text-[#004d4d]"><MapPin size={14}/><p className="text-xs font-bold uppercase tracking-widest italic">{formData.location || 'Sin ubicación'}</p></div>
                                        </div>
                                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center gap-6">
                                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm"><Users size={20}/></div>
                                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidad de Staff</p><p className="text-sm font-black text-gray-900">{formData.staff_count} Miembros</p></div>
                                        </div>
                                    </TiltCard>
                                </motion.div>

                                <div className="mt-auto mb-10 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl max-w-sm flex items-center gap-6 relative z-10">
                                    <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center shadow-lg"><Bot size={24}/></div>
                                    <p className="text-xs font-medium text-gray-600 italic leading-relaxed">&quot;La apertura de una sede en **{formData.location || 'esta zona'}** proyecta un ROI operativo del 14% en los primeros 90 días.&quot;</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SucursalesMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}