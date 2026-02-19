"use client";

import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Clock, 
  Download, 
  Filter, 
  Store, 
  Users, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  PieChart as LucidePieChart,
  BarChart3,
  Activity,
  Zap,
  Target,
  Bot,
  Sparkles,
  LayoutGrid,
  CreditCard,
  Briefcase,
  Layers,
  Globe,
  Monitor,
  ShoppingBag,
    Info, 
    ShieldAlert, 
    Trophy, 
    ArrowRight, 
    RefreshCcw,
    History as LucideHistory,
    Loader2,
    UserPlus,
    Pencil,
    FileText
  } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, Suspense, memo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiRequest } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import TiltCard from '@/components/dashboard/TiltCard';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import ReportsInfoModal from '@/components/dashboard/ReportsInfoModal';
import LiveMapModal from '@/components/dashboard/LiveMapModal';
import GoalsConfigModal from '@/components/dashboard/GoalsConfigModal';
import AdvisorDetailModal from '@/components/dashboard/AdvisorDetailModal';
import PayrollInfoModal from '@/components/dashboard/PayrollInfoModal';
import PayrollMetricModal from '@/components/dashboard/PayrollMetricModal';
import StaffDetailModal from '@/components/dashboard/StaffDetailModal';
import LiquidationConfirmModal from '@/components/dashboard/LiquidationConfirmModal';
import { generateDailyReport } from '@/lib/report-generator';
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
    LineChart,
    Line,
    Legend
} from 'recharts';

// --- COMPONENTE DE NÚMEROS ANIMADOS ---
const AnimatedNumber = memo(({ value, type = 'currency', className }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) => {
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

// --- CONFIGURACIÓN DE COLORES ---
const COLORS = {
    primary: "#004d4d",
    accent: "#00f2ff",
    success: "#10b981",
    error: "#f43f5e",
    warning: "#f59e0b",
    white: "#ffffff",
    gray: "#f3f4f6"
};

// --- MOCK DATA PARA INTELIGENCIA ---
const REVENUE_BY_CHANNEL: any[] = [];
const SALES_TREND: any[] = [];
const BRANCH_COMPARISON: any[] = [];
const ADVISOR_RANKING: any[] = [];

function ReportsContent() {
    const { token, userEmail } = useAuth();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as any || 'general';

    const [activeTab, setActiveTab] = useState<'general' | 'sucursales' | 'asesores' | 'nomina' | 'bayt'>(initialTab);
    const [selectedPeriod, setSelectedPeriod] = useState('Este mes');
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- DATOS REALES ---
    const [orders, setOrders] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);

    const [selectedMetric, setSelectedMetric] = useState<any>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
    const [selectedAdvisor, setSelectedAdvisor] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // --- ESTADOS NÓMINA ---
    const [payrollStaff, setPayrollStaff] = useState<any[]>([]);
    const [filterRole, setFilterRole] = useState("all");
    const [isSyncing, setIsSyncing] = useState(false);
    const [memberToLiquidate, setMemberToLiquidate] = useState<any>(null);

    useEffect(() => {
        const saved = localStorage.getItem('bayup_payroll_data');
        if (saved) setPayrollStaff(JSON.parse(saved));
    }, []);

    const totalPayroll = useMemo(() => 
        payrollStaff.reduce((acc, s) => acc + (s.base_salary + (s.commissions || 0) + (s.bonuses || 0) - (s.deductions || 0)), 0), 
    [payrollStaff]);

    const handleLiquidar = (member: any) => setMemberToLiquidate(member);
    
    const handleSincronizarStaff = () => {
        setIsSyncing(true);
        showToast("Sincronizando staff...", "info");
        setTimeout(() => { 
            showToast("Sincronización completa", "success"); 
            setIsSyncing(false); 
        }, 2000);
    };

    const filteredPayrollStaff = useMemo(() => {
        return payrollStaff.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === 'all' || s.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [payrollStaff, searchTerm, filterRole]);

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [oData, eData] = await Promise.all([
                apiRequest<any[]>('/orders', { token }),
                apiRequest<any[]>('/expenses', { token }).catch(() => [])
            ]);
            if (oData) setOrders(oData);
            if (eData) setExpenses(eData);
        } catch (e) {
            console.error("Error cargando inteligencia:", e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((acc, o) => acc + (o.total_price || 0), 0);
        const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Tendencia Semanal (Últimos 7 días)
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const trend = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dayName = days[d.getDay()];
            const dateStr = d.toISOString().split('T')[0];
            const daySales = orders
                .filter(o => o.created_at.startsWith(dateStr))
                .reduce((acc, o) => acc + (o.total_price || 0), 0);
            return { name: dayName, actual: daySales, anterior: daySales * 0.8 }; // Simulación de periodo anterior para comparativa
        });

        // Ventas por Canal
        const channels = [
            { name: 'WhatsApp', key: 'WhatsApp', color: '#10b981' },
            { name: 'Tienda Física (POS)', key: 'pos', color: '#004d4d' },
            { name: 'Página Web', key: 'web', color: '#00f2ff' }
        ];
        const byChannel = channels.map(c => ({
            name: c.name,
            value: orders.filter(o => (o.source || '').toLowerCase() === c.key.toLowerCase()).reduce((acc, o) => acc + (o.total_price || 0), 0),
            color: c.color
        }));

        return { totalRevenue, totalExpenses, netProfit, avgTicket, trend, byChannel };
    }, [orders, expenses]);

    const KPIS = [
        { label: 'Ventas brutas', value: formatCurrency(stats.totalRevenue), sub: 'Total ingresos', icon: <DollarSign size={18}/>, color: 'text-[#004d4d]', trend: 'Live' },
        { label: 'Utilidad neta', value: formatCurrency(stats.netProfit), sub: 'Margen real', icon: <TrendingUp size={18}/>, color: 'text-emerald-600', trend: 'Live' },
        { label: 'Gastos operativos', value: formatCurrency(stats.totalExpenses), sub: 'Fijos y variables', icon: <CreditCard size={18}/>, color: 'text-rose-600', trend: 'Live' },
        { label: 'Ticket promedio', value: formatCurrency(stats.avgTicket), sub: 'Valor por venta', icon: <ShoppingBag size={18}/>, color: 'text-amber-600', trend: 'OK' },
        { label: 'Pedidos totales', value: orders.length.toString(), sub: 'Volumen físico/web', icon: <Briefcase size={18}/>, color: 'text-blue-600', trend: 'OK', isSimple: true },
        { label: 'Conversión', value: '0%', sub: 'Efectividad web', icon: <Activity size={18}/>, color: 'text-[#00f2ff]', trend: 'N/A' },
    ];

    const [activeHistoryTab, setActiveHistoryTab] = useState<'maestro' | 'riesgos' | 'hitos'>('maestro');

    const historyData = useMemo(() => {
        const all: any[] = [];
        return all.filter(i => i.tab === activeHistoryTab);
    }, [activeHistoryTab]);

    const handleExport = async () => {
        try {
            showToast("Generando reporte maestro...", "info");
            const [products, orders, expenses] = await Promise.all([
                apiRequest<any[]>('/products', { token }),
                apiRequest<any[]>('/orders', { token }),
                apiRequest<any[]>('/finances/expenses', { token }).catch(() => [])
            ]);

            await generateDailyReport({
                userName: userEmail?.split('@')[0] || 'Empresario',
                products: products || [],
                orders: orders || [],
                expenses: expenses || []
            });
            
            showToast("¡Reporte generado con éxito! 📊", "success");
        } catch (error) {
            console.error("Error generating PDF:", error);
            showToast("Error al generar el reporte detallado", "error");
        }
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-4 shrink-0">
            {KPIS.map((kpi, i) => (
                <TiltCard key={i} onClick={() => setSelectedMetric(kpi)} className="h-full">
                    <div className="bg-white/95 p-6 rounded-[2.2rem] border border-white shadow-xl flex flex-col justify-between h-full group">
                        <div className="flex justify-between items-start">
                            <div className={`h-10 w-10 rounded-xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend.startsWith('+') || kpi.trend === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{kpi.trend}</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-[9px] font-black text-gray-400 tracking-widest">{kpi.label}</p>
                            <h3 className="text-xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                        </div>
                    </div>
                </TiltCard>
            ))}
        </div>
    );

    const renderGeneralCharts = () => (
        <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 h-[450px] flex flex-col">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-xl font-black italic tracking-widest text-[#004d4d]">Tendencia semanal</h4>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mt-1">Comparativa vs periodo anterior</p>
                        </div>
                        <BarChart3 className="text-gray-200" size={24} />
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trend}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#004d4d" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#004d4d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="actual" stroke="#004d4d" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" />
                                <Area type="monotone" dataKey="anterior" stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#004d4d] p-10 rounded-[3.5rem] shadow-2xl space-y-8 h-[450px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 text-white"><Globe size={200} /></div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-xl font-black italic tracking-widest text-white">Ingresos por canal</h4>
                        <span className="text-[10px] font-black text-[#00f2ff] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">Omnicanal</span>
                    </div>
                    <div className="flex-1 min-h-0 relative z-10 flex flex-col justify-center">
                        <div className="space-y-6">
                            {stats.byChannel.map((channel, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black text-white/80 tracking-widest">{channel.name}</span>
                                        <span className="text-sm font-black text-white">{formatCurrency(channel.value)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${stats.totalRevenue > 0 ? (channel.value / stats.totalRevenue) * 100 : 0}%` }} 
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: channel.color }}
                                        ></motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/40 p-6 rounded-[3rem] border border-white/60">
                    <div>
                        <h4 className="text-xl font-black text-[#004d4d] italic">Monitor de flujo live</h4>
                        <p className="text-gray-400 text-[9px] font-black tracking-[0.3em] mt-1 italic">Registro cronológico de movimientos financieros</p>
                    </div>
                    <div className="p-1 bg-white border border-gray-100 rounded-2xl flex items-center shadow-sm">
                        {[
                            { id: 'maestro', label: 'Libro maestro', icon: <Layers size={12}/> },
                            { id: 'riesgos', label: 'Alertas de margen', icon: <ShieldAlert size={12}/> },
                            { id: 'hitos', label: 'Hitos de crecimiento', icon: <Trophy size={12}/> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveHistoryTab(tab.id as any)}
                                className={`px-6 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all flex items-center gap-2 ${activeHistoryTab === tab.id ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="p-10 space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeHistoryTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {historyData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 rounded-[2.2rem] bg-gray-50/50 border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-lg transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${
                                                item.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 
                                                item.type === 'out' ? 'bg-rose-50 text-rose-600' : 
                                                'bg-[#00f2ff]/10 text-[#004d4d]'
                                            }`}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{item.event}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[9px] font-black text-gray-400">{item.time}</span>
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                                                        item.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 
                                                        item.type === 'out' ? 'bg-rose-100 text-rose-700' : 
                                                        'bg-[#00f2ff] text-[#004d4d]'
                                                    }`}>{item.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {item.amount > 0 && (
                                                <p className={`text-lg font-black ${item.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                                                </p>
                                            )}
                                            <button className="text-[9px] font-black text-[#004d4d] tracking-widest opacity-0 group-hover:opacity-100 transition-all mt-1">Ver auditoría <ArrowRight size={10} className="inline ml-1"/></button>
                                        </div>
                                    </div>
                                ))}
                                {historyData.length === 0 && (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300"><Layers size={32}/></div>
                                        <p className="text-[10px] font-black text-gray-400 tracking-widest">No hay registros para este filtro aún</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 text-center">
                        <button className="text-[10px] font-black text-[#004d4d] tracking-[0.4em] hover:underline">Cargar historial completo</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBranchComparison = () => (
        <div className="px-4 space-y-8">
            <div className="bg-white/40 p-8 rounded-[3rem] border border-white/60 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-[#004d4d] italic">Eficiencia por sucursal</h3>
                    <p className="text-gray-400 text-[10px] font-black tracking-widest mt-1">Comparativa de rentabilidad operativa</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsMapOpen(true)} className="h-12 px-6 rounded-2xl bg-white border border-gray-100 text-[10px] font-black tracking-widest shadow-sm hover:bg-gray-50 transition-colors">Ver mapa live</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {BRANCH_COMPARISON.map((branch, i) => (
                    <motion.div key={i} whileHover={{ y: -10 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Store size={100} /></div>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black italic">0{i+1}</div>
                            <h5 className="text-xl font-black text-gray-900 tracking-tight">{branch.name}</h5>
                        </div>
                        <div className="space-y-6">
                            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-2">
                                <p className="text-[9px] font-black text-gray-400 tracking-widest">Ventas totales</p>
                                <p className="text-2xl font-black text-gray-900">{formatCurrency(branch.ventas)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-rose-50 rounded-[1.5rem] border border-rose-100">
                                    <p className="text-[8px] font-black text-rose-400 tracking-widest">Gastos</p>
                                    <p className="text-sm font-black text-rose-600">{formatCurrency(branch.gastos)}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-[1.5rem] border border-emerald-100">
                                    <p className="text-[8px] font-black text-emerald-400 tracking-widest">Profit</p>
                                    <p className="text-sm font-black text-emerald-600">{formatCurrency(branch.profit)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-[#004d4d] tracking-widest">Rentabilidad</span>
                            <span className="text-sm font-black text-[#004d4d] italic">{((branch.profit / branch.ventas) * 100).toFixed(1)}%</span>
                        </div>
                    </motion.div>
                ))}
            </div>
            <LiveMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />
        </div>
    );

    const renderAdvisorRanking = () => (
        <div className="px-4 space-y-8">
            <div className="bg-white/40 p-8 rounded-[3rem] border border-white/60 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-[#004d4d] italic">Productividad de asesores</h3>
                    <p className="text-gray-400 text-[10px] font-black tracking-widest mt-1">Ranking de facturación y crecimiento mensual</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsGoalsModalOpen(true)} className="h-12 px-6 rounded-2xl bg-gray-900 text-white text-[10px] font-black tracking-widest shadow-xl hover:scale-105 transition-transform">Configurar metas</button>
                </div>
            </div>
            <div className="space-y-4">
                {ADVISOR_RANKING.map((advisor, i) => (
                    <motion.div 
                        key={i} 
                        whileHover={{ x: 10 }} 
                        onClick={() => setSelectedAdvisor(advisor)}
                        className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative overflow-hidden cursor-pointer group"
                    >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${advisor.status === 'high' ? 'bg-emerald-500' : advisor.status === 'normal' ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
                        
                        <div className="flex items-center gap-6 flex-1">
                            <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-2xl font-black shadow-2xl group-hover:scale-110 transition-transform italic">
                                {advisor.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900 tracking-tight">{advisor.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 italic">Asesor de ventas</p>
                            </div>
                        </div>

                        <div className="flex-[2] grid grid-cols-3 gap-10 px-10 border-x border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 tracking-widest">Facturación</p>
                                <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(advisor.ventas)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 tracking-widest">Tasa cierre</p>
                                <p className="text-xl font-black text-[#004d4d] mt-1">{advisor.conversion}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 tracking-widest">Crecimiento</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {advisor.growth.startsWith('+') ? <ArrowUpRight className="text-emerald-500" size={16}/> : <ArrowDownRight className="text-rose-500" size={16}/>}
                                    <p className={`text-xl font-black ${advisor.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{advisor.growth}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="h-12 px-6 rounded-2xl bg-gray-50 text-[10px] font-black tracking-widest text-gray-400 group-hover:text-[#004d4d] group-hover:bg-[#004d4d]/5 transition-all">Reporte individual</button>
                            <button className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Zap size={20} className="text-[#00f2ff]" /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderBaytInsight = () => (
        <div className="px-4">
            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Activity size={300} /></div>
                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 space-y-6">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black tracking-[0.3em] border border-[#00f2ff]/20">Bayt business-iq</span>
                        <h3 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Estado general del negocio</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><Sparkles className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black tracking-widest text-[#00f2ff]">Oportunidad detectada</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">&quot;Tu rentabilidad ha subido un 4.2% gracias a la reducción del costo logístico en la Sucursal Norte. Recomiendo replicar su modelo de empaque en la Principal.&quot;</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><TrendingDown className="text-rose-400" size={20}/><p className="text-[10px] font-black tracking-widest text-rose-400">Alerta de rendimiento</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">&quot;El canal de Instagram tiene el CAC más alto ($22.500). Sugiero pausar pauta en este canal y mover el 20% del presupuesto a WhatsApp, que es un 3x más eficiente.&quot;</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPayrollKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 tracking-widest">Total nómina</p>
                <h4 className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(totalPayroll)}</h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 tracking-widest">Colaboradores</p>
                <h4 className="text-3xl font-black text-slate-900 mt-2">{payrollStaff.length} activos</h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 tracking-widest">Estado de pago</p>
                <h4 className="text-xl font-black text-emerald-600 mt-2 italic">Al día</h4>
            </div>
        </div>
    );

    const renderPayrollStaff = () => (
        <div className="px-4 space-y-4">
            {filteredPayrollStaff.map((member) => (
                <div key={member.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#004d4d] text-white flex items-center justify-center font-black">{member.name.charAt(0)}</div>
                        <div>
                            <p className="font-black text-slate-900">{member.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{member.role}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400">Neto a pagar</p>
                            <p className="font-black text-[#004d4d]">{formatCurrency(member.base_salary + member.commissions + member.bonuses - member.deductions)}</p>
                        </div>
                        <button onClick={() => handleLiquidar(member)} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${member.status === 'paid' ? 'bg-emerald-50 text-emerald-600 cursor-default' : 'bg-gray-900 text-white hover:bg-black'}`}>
                            {member.status === 'paid' ? 'Pagado' : 'Liquidar'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000 relative">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black tracking-[0.2em] text-[#004d4d]/60">Inteligencia de negocio</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-[#001A1A]">
                        Infor<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">mes</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">
                        Analiza tus métricas y revisa el crecimiento de tu empresa. 📈
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative z-50">
                        <button 
                            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                            className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all active:scale-95"
                        >
                            <div className="px-6 py-2 text-left">
                                <p className="text-[8px] font-black text-gray-400 tracking-widest">Periodo de análisis</p>
                                <p className="text-sm font-black text-gray-900 w-32 truncate">{selectedPeriod}</p>
                            </div>
                            <div className={`h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg ${isPeriodOpen ? 'bg-[#004d4d] rotate-180' : ''}`}>
                                <Calendar size={20} className="text-[#00f2ff]"/>
                            </div>
                        </button>

                        <AnimatePresence>
                            {isPeriodOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 w-full bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden p-2"
                                >
                                    {PERIOD_OPTIONS.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setSelectedPeriod(option);
                                                setIsPeriodOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-between group ${selectedPeriod === option ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                        >
                                            {option}
                                            {selectedPeriod === option && <div className="h-2 w-2 rounded-full bg-[#00f2ff]" />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={handleExport} className="h-14 px-8 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><Download size={18} className="text-[#00f2ff]"/> Exportar auditoría</button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'general', label: 'General', icon: <LayoutGrid size={14}/> },
                        { id: 'sucursales', label: 'Sucursales', icon: <Store size={14}/> },
                        { id: 'asesores', label: 'Asesores', icon: <Users size={14}/> },
                        { id: 'bayt', label: 'Bayt insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-8 py-3 rounded-full text-[9px] font-black tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="activeAnalysisTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                
                {/* Botón de Información (Separado / Satélite) */}
                <button
                    onClick={() => setShowInfoModal(true)}
                    className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 hover:bg-[#004d4d] hover:text-white transition-all shadow-xl active:scale-95 group"
                >
                    <Info size={20} />
                </button>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-12">
                    {activeTab === 'general' && renderGeneralCharts()}
                    {activeTab === 'sucursales' && renderBranchComparison()}
                                        {activeTab === 'asesores' && (
                                            <div className="space-y-8">
                                                {renderAdvisorRanking()}
                                            </div>
                                        )}
                    
                                        {activeTab === 'nomina' && (
                                            <div className="space-y-12">
                                                {renderPayrollKPIs()}
                                                <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-2 rounded-[2rem] border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
                                                    <div className="relative flex-1 w-full">
                                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                        <input type="text" placeholder="Buscar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none" />
                                                    </div>
                                                    <button onClick={handleSincronizarStaff} disabled={isSyncing} className="h-12 px-6 bg-gray-900 text-white rounded-2xl text-[10px] font-black flex items-center gap-2">
                                                        {isSyncing ? <Loader2 size={14} className="animate-spin"/> : <UserPlus size={14}/>}
                                                        Sincronizar staff
                                                    </button>
                                                </div>
                                                {renderPayrollStaff()}
                                            </div>
                                        )}
                    
                                        {activeTab === 'bayt' && renderBaytInsight()}
                </motion.div>
            </AnimatePresence>

            {/* --- MODALES --- */}
            <MetricDetailModal 
                isOpen={!!selectedMetric} 
                onClose={() => setSelectedMetric(null)} 
                metric={selectedMetric} 
            />

            <ReportsInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
            />

            <LiveMapModal 
                isOpen={isMapOpen} 
                onClose={() => setIsMapOpen(false)} 
            />

            <GoalsConfigModal 
                isOpen={isGoalsModalOpen} 
                onClose={() => setIsGoalsModalOpen(false)} 
                advisors={ADVISOR_RANKING}
            />

            <AdvisorDetailModal 
                isOpen={!!selectedAdvisor} 
                onClose={() => setSelectedAdvisor(null)} 
                advisor={selectedAdvisor} 
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}

export default function AnalysisGeneralPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-black tracking-widest text-[#004d4d]">Cargando inteligencia...</div>}>
            <ReportsContent />
        </Suspense>
    );
}
