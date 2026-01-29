"use client";

import { 
    TrendingUp, Users, DollarSign, Activity, 
    ArrowUpRight, ArrowDownRight, Calendar, Building2,
    Zap, Sparkles, Filter, X, Search, ChevronRight, ArrowRight,
    Download, Briefcase, Clock, CheckCircle2, ShieldCheck, Receipt, Info,
    FileText, User as UserIcon, MapPin, Eye, ExternalLink as ExternalLinkIcon, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import '@/lib/jspdf-types';

export default function AffiliateDashboard() {
    const [activePeriod, setActivePeriod] = useState('Día');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isActivityDetailModalOpen, setIsActivityDetailModalOpen] = useState(false);
    const [isActivityPeriodModalOpen, setIsActivityPeriodModalOpen] = useState(false);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [activityReportRange, setActivityReportRange] = useState({ start: '', end: '' });

    const kpis = [
        { label: 'Facturación Hoy', val: '$ 4.250.000', trend: '+12.5%', up: true, icon: <Building2 size={24}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Comisión Hoy (0.5%)', val: '$ 21.250', trend: '+12.5%', up: true, icon: <Zap size={24}/>, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Comisión del Mes', val: '$ 584.000', trend: '+8.2%', up: true, icon: <DollarSign size={24}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total Ganado', val: '$ 12.450.000', trend: 'Histórico', up: true, icon: <Sparkles size={24}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const recentActivity = [
        { id: 'TRX-1001', company: 'Moda Urbana Store', amount: '$ 450.000', commission: '$ 2.250', date: '28 Ene, 14:45', status: 'Confirmado', type: 'Venta Online', client: 'Juan Perez', location: 'Bogotá, COL' },
        { id: 'TRX-1002', company: 'Tech Gadgets S.A.', amount: '$ 1.200.000', commission: '$ 6.000', date: '28 Ene, 14:28', status: 'Confirmado', type: 'Venta Online', client: 'Maria Gomez', location: 'Medellín, COL' },
        { id: 'TRX-1003', company: 'Café Aroma Premium', amount: '$ 85.000', commission: '$ 425', date: '28 Ene, 13:50', status: 'Confirmado', type: 'Manual POS', client: 'Carlos Ruiz', location: 'Cali, COL' },
        { id: 'TRX-1004', company: 'Deportes Extremos', amount: '$ 320.000', commission: '$ 1.600', date: '28 Ene, 11:10', status: 'Pendiente', type: 'Venta Online', client: 'Lucia Fernandez', location: 'Cartagena, COL' },
    ];

    const extendedHistory = [
        ...recentActivity,
        { id: 'TRX-1005', company: 'Boutique Elegance', amount: '$ 980.000', commission: '$ 4.900', date: '28 Ene, 09:15', status: 'Confirmado', type: 'Venta Online', client: 'Ana Martinez', location: 'Barranquilla, COL' },
        { id: 'TRX-1006', company: 'Gamer Zone', amount: '$ 2.150.000', commission: '$ 10.750', date: '27 Ene, 18:30', status: 'Confirmado', type: 'Venta Online', client: 'Roberto Gomez', location: 'Pereira, COL' },
        { id: 'TRX-1007', company: 'Fit Life Gym', amount: '$ 120.000', commission: '$ 600', date: '27 Ene, 14:20', status: 'Auditado', type: 'Manual POS', client: 'Elena Prado', location: 'Bucaramanga, COL' },
        { id: 'TRX-1008', company: 'Pet Shop Lovery', amount: '$ 75.000', commission: '$ 375', date: '27 Ene, 11:10', status: 'Confirmado', type: 'Venta Online', client: 'David Prada', location: 'Manizales, COL' },
        { id: 'TRX-1009', company: 'Pet Shop Lovery', amount: '$ 125.000', commission: '$ 625', date: '26 Ene, 16:45', status: 'Confirmado', type: 'Venta Online', client: 'David Prada', location: 'Manizales, COL' },
    ];

    const handleExportActivityReport = async () => {
        setIsGeneratingPDF(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();

            doc.setFillColor(17, 24, 39);
            doc.rect(0, 0, 210, 45, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('BAYUP PARTNER', 20, 20);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('REPORTE DETALLADO DE ACTIVIDAD', 20, 32);
            doc.text(`Generado: ${new Date().toLocaleDateString()}`, 150, 20);
            doc.text(`Rango: ${activityReportRange.start || 'Global'} - ${activityReportRange.end || 'Hoy'}`, 150, 27);

            const tableRows = extendedHistory.map(act => [
                act.id,
                act.company,
                act.date,
                act.type,
                act.amount,
                act.commission,
                act.status
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['ID', 'Empresa', 'Fecha', 'Canal', 'Monto', 'Comisión', 'Estatus']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [147, 51, 234], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 4 },
                columnStyles: {
                    4: { halign: 'right' },
                    5: { halign: 'right' }
                }
            });

            doc.save(`Reporte_Actividad_Bayup_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("Error generando PDF:", error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleDownloadSingleReceipt = async (act: any) => {
        setIsGeneratingPDF(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();

            doc.setFillColor(17, 24, 39);
            doc.rect(0, 0, 210, 50, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('BAYUP', 20, 25);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('COMPROBANTE DE OPERACIÓN DE AFILIADO', 20, 38);
            doc.text(`ID: ${act.id}`, 150, 25);
            doc.text(`Fecha: ${act.date}`, 150, 32);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalle de la Venta', 20, 65);
            
            autoTable(doc, {
                startY: 75,
                body: [
                    ['Empresa Origen', act.company],
                    ['Cliente Comprador', act.client],
                    ['Ubicación', act.location],
                    ['Canal de Venta', act.type],
                    ['Estado de Transacción', act.status]
                ],
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 }
            });

            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFillColor(249, 250, 251);
            doc.rect(120, finalY, 70, 40, 'F');
            
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text('Venta Bruta:', 125, finalY + 12);
            doc.text('Tasa Comisión:', 125, finalY + 22);
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(act.amount, 160, finalY + 12);
            doc.text('0.5%', 160, finalY + 22);
            
            doc.setDrawColor(229, 231, 235);
            doc.line(125, finalY + 27, 185, finalY + 27);
            
            doc.setTextColor(147, 51, 234);
            doc.setFontSize(12);
            doc.text('Tu Ganancia:', 125, finalY + 35);
            doc.text(act.commission, 160, finalY + 35);

            doc.save(`Comprobante_${act.id}_Bayup.pdf`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleOpenActivityDetail = (activity: any) => {
        setSelectedActivity(activity);
        setIsActivityDetailModalOpen(true);
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                        Centro de <span className="text-purple-600">Comando</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Sigue el crecimiento de tus empresas referidas en tiempo real.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                        {['Día', 'Mes', 'Año'].map((period) => (
                            <button 
                                key={period}
                                onClick={() => setActivePeriod(period)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePeriod === period ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                    <div className="relative group">
                        <button className="p-3.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-purple-600 hover:border-purple-100 transition-all shadow-sm">
                            <Calendar size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {kpis.map((kpi, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`p-4 ${kpi.bg} ${kpi.color} rounded-2xl transition-transform group-hover:scale-110 duration-500`}>
                                {kpi.icon}
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {kpi.up ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                                {kpi.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight italic">{kpi.val}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Evolution Chart Placeholder */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                <Activity size={18} className="text-purple-600" /> Evolución de Comisiones
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Tendencia de ingresos en {activePeriod.toLowerCase()}</p>
                        </div>
                        <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-purple-600 cursor-pointer transition-all border border-gray-100">
                            <Filter size={16} />
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-[2rem] relative group cursor-crosshair">
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                        <div className="text-center relative z-10">
                            <div className="h-16 w-16 bg-white rounded-3xl shadow-xl border border-gray-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                                <TrendingUp size={32} className="text-purple-600" />
                            </div>
                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest italic">Análisis {activePeriod} Bayt AI</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Sincronizando con base de datos real...</p>
                        </div>
                        
                        {/* Mock Wave Lines */}
                        <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 320">
                            <path fill="#9333ea" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,144C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                        </svg>
                    </div>
                </div>

                {/* Real-time Activity */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <Activity size={18} className="text-purple-600" /> Actividad Live
                        </h4>
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    </div>

                    <div className="flex-1 space-y-6">
                        {recentActivity.map((act, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleOpenActivityDetail(act)}
                                className="flex items-center justify-between p-4 rounded-3xl border border-transparent hover:border-gray-50 hover:bg-gray-50/50 transition-all group cursor-pointer active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-purple-600 font-black text-xs group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 uppercase">
                                        {act.company.substring(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-gray-900 uppercase italic leading-tight">{act.company}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{act.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-black text-emerald-500">+{act.commission}</p>
                                    <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">Sale: {act.amount}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="w-full mt-10 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:border-purple-200 hover:text-purple-600 transition-all active:scale-95"
                    >
                        Ver Todo el Historial
                    </button>
                </div>
            </div>

            {/* MODAL: HISTORIAL COMPLETO DE ACTIVIDAD (DISEÑO PREMIUM) */}
            <AnimatePresence>
                {isHistoryModalOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20"
                        >
                            {/* Header Modal */}
                            <div className="p-10 bg-gray-900 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                    <HistoryIcon size={120} />
                                </div>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="h-16 w-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-xl">
                                        <HistoryIcon size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Historial de <span className="text-purple-400">Actividad</span></h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registro completo de comisiones generadas</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all relative z-10 group"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search & Filters Inside Modal */}
                            <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30 shrink-0">
                                <div className="flex-1 flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-gray-100 focus-within:border-purple-200 transition-all">
                                    <Search size={16} className="text-gray-300" />
                                    <input type="text" placeholder="Filtrar por empresa..." className="bg-transparent border-none outline-none text-[11px] font-bold w-full" />
                                </div>
                                <button 
                                    onClick={() => setIsActivityPeriodModalOpen(true)}
                                    className="h-14 px-6 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase text-gray-400 flex items-center gap-3 hover:text-gray-900 transition-all active:scale-95 shadow-sm"
                                >
                                    <Filter size={16}/> Periodo
                                </button>
                            </div>

                            {/* Activity List */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                                {extendedHistory.map((act, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => handleOpenActivityDetail(act)}
                                        className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-gray-50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group cursor-pointer active:scale-[0.99]"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-sm uppercase text-purple-600 group-hover:bg-gray-900 group-hover:text-white transition-all duration-500 italic">
                                                {act.company.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight group-hover:text-purple-600 transition-colors">{act.company}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{act.date}</span>
                                                    <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${act.status === 'Confirmado' ? 'text-emerald-500' : 'text-amber-500'}`}>{act.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-8">
                                            <div>
                                                <p className="text-lg font-black text-gray-900 italic tracking-tight">+{act.commission}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Venta: {act.amount}</p>
                                            </div>
                                            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-purple-600 group-hover:bg-purple-50 transition-all">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Modal */}
                            <div className="p-10 border-t border-gray-50 bg-white shrink-0 flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Mostrando {extendedHistory.length} transacciones recientes</p>
                                <button 
                                    onClick={handleExportActivityReport}
                                    className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50"
                                    disabled={isGeneratingPDF}
                                >
                                    {isGeneratingPDF ? 'Procesando...' : 'Exportar Reporte'} <Download size={16}/>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: DETALLE DE ACTIVIDAD ESPECÍFICA */}
            <AnimatePresence>
                {isActivityDetailModalOpen && selectedActivity && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#F8FAFC] w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[85vh]"
                        >
                            <div className="p-12 bg-white border-b border-gray-100 relative shrink-0">
                                <button 
                                    onClick={() => setIsActivityDetailModalOpen(false)} 
                                    className="absolute top-10 right-10 h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all z-50 group"
                                >
                                    <X size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <div className="flex items-center gap-8">
                                    <div className="h-20 w-20 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center shadow-xl">
                                        <Receipt size={32} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">{selectedActivity.id}</p>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Detalle de Operación</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-2">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Monto Bruto</p>
                                        <p className="text-2xl font-black text-gray-900 italic">{selectedActivity.amount}</p>
                                    </div>
                                    <div className="bg-purple-600 p-6 rounded-3xl shadow-xl space-y-2">
                                        <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest">Tu Comisión (0.5%)</p>
                                        <p className="text-2xl font-black text-white italic">{selectedActivity.commission}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-3">
                                        <Info size={16} className="text-purple-600" /> Trazabilidad de la Venta
                                    </h4>
                                    <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Empresa Origen</p><p className="text-xs font-black text-gray-900 uppercase italic">{selectedActivity.company}</p></div>
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Cliente / Comprador</p><p className="text-xs font-black text-gray-900 uppercase italic">{selectedActivity.client}</p></div>
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Canal de Venta</p><p className="text-xs font-black text-gray-900 uppercase italic">{selectedActivity.type}</p></div>
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Fecha & Hora</p><p className="text-xs font-black text-gray-900 uppercase italic">{selectedActivity.date}</p></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-8 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100"><CheckCircle2 size={20} /></div>
                                        <div><p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Estatus Auditoría</p><p className="text-xs font-bold text-emerald-600 uppercase italic">{selectedActivity.status}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Neto Generado</p><p className="text-xl font-black text-emerald-600 italic">{selectedActivity.commission}</p></div>
                                </div>
                            </div>

                            <div className="p-10 bg-white border-t border-gray-100 flex gap-4 shrink-0">
                                <button onClick={() => handleDownloadSingleReceipt(selectedActivity)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all flex items-center justify-center gap-3 active:scale-95"><Download size={16}/> Comprobante</button>
                                <button onClick={() => setIsAuditModalOpen(true)} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-purple-600 transition-all flex items-center justify-center gap-3 active:scale-95">Ver Auditoría <ExternalLinkIcon size={16}/></button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: AUDITORÍA DE OPERACIÓN */}
            <AnimatePresence>
                {isAuditModalOpen && selectedActivity && (
                    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                            <div className="p-10 bg-gray-900 text-white relative">
                                <button onClick={() => setIsAuditModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><X size={24}/></button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl"><ShieldCheck size={28}/></div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Auditoría <span className="text-purple-400">Bayt AI</span></h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Verificación de cumplimiento de socio</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100"><CheckCircle2 size={20}/></div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase">Validación de origen</p>
                                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">La venta ha sido trazada correctamente al enlace del afiliado vinculado a {selectedActivity.company}.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="h-10 w-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-100"><Info size={20}/></div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase">Cálculo de Beneficio</p>
                                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">Tasa de 0.5% aplicada sobre monto bruto. No se detectaron deducciones adicionales por cargos de servicio.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="h-10 w-10 bg-purple-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-100"><Clock size={20}/></div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase">Tiempo de Liquidación</p>
                                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">Disponible para retiro en el próximo ciclo de pagos (Día 05 del mes siguiente).</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsAuditModalOpen(false)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 hover:bg-purple-600 transition-all active:scale-95">Finalizar Revisión</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: FILTRO DE PERIODO PARA ACTIVIDAD */}
            <AnimatePresence>
                {isActivityPeriodModalOpen && (
                    <div className="fixed inset-0 z-[750] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                            <div className="p-10 bg-gray-900 text-white relative">
                                <button onClick={() => setIsActivityPeriodModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><X size={24}/></button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl"><Clock size={28}/></div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Filtrar <span className="text-purple-400">Actividad</span></h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Selecciona el rango de auditoría</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Desde</label>
                                        <input type="date" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-purple-200 outline-none text-xs font-bold" value={activityReportRange.start} onChange={(e) => setActivityReportRange({...activityReportRange, start: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Hasta</label>
                                        <input type="date" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-purple-200 outline-none text-xs font-bold" value={activityReportRange.end} onChange={(e) => setActivityReportRange({...activityReportRange, end: e.target.value})} />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsActivityPeriodModalOpen(false)}
                                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 hover:bg-purple-600 transition-all active:scale-95"
                                >
                                    Aplicar Filtro <CheckCircle2 size={16}/>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirmation Floating Message */}
            <AnimatePresence>
                {isGeneratingPDF && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-[800]">
                        <div className="h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Generando Informe Profesional...</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function HistoryIcon({ size, className }: { size: number, className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}