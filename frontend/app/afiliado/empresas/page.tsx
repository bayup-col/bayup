"use client";

import { 
    Building2, Search, Filter, Plus, MoreHorizontal, 
    ArrowUpRight, Activity, TrendingUp, ChevronRight,
    CheckCircle2, AlertCircle, Copy, Link as LinkIcon, Share2, X, Zap,
    Mail, Phone, Calendar, DollarSign, Download, ExternalLink,
    ChevronDown, User, Globe, MessageSquare, ShieldAlert, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AffiliateBusinesses() {
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
    const [isReportRangeModalOpen, setIsReportRangeModalOpen] = useState(false);
    
    const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
    const [copiedType, setCopiedType] = useState<'code' | 'link' | 'pdf' | 'anomaly' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [anomalyForm, setAnomalyForm] = useState({ title: '', description: '' });
    const [reportRange, setReportRange] = useState({ start: '', end: '' });
    
    const affiliateCode = "AF-2026-PRO";
    const onboardingLink = `https://bayup.com/onboarding?ref=${affiliateCode}`;

    const handleCopy = (text: string, type: 'code' | 'link' | 'pdf' | 'anomaly') => {
        if (text) navigator.clipboard.writeText(text);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
    };

    const shareToWhatsApp = () => {
        const text = `¡Hola! Únete a Bayup usando mi enlace de socio y escala tu e-commerce: ${onboardingLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    // --- FUNCIONES DE GENERACIÓN DE PDF PROFESIONAL ---

    const handleExportList = () => {
        setCopiedType('pdf');
        
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                
                // Estilo de Cabecera
                doc.setFillColor(17, 24, 39); // Gray-900
                doc.rect(0, 0, 210, 40, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('BAYUP', 20, 20);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('REPORTE GLOBAL DE EMPRESAS VINCULADAS', 20, 30);
                doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 25);

                // Tabla de Datos
                const tableRows = filteredBusinesses.map(biz => [
                    biz.name,
                    biz.owner,
                    biz.status,
                    biz.sales,
                    biz.commission,
                    biz.total
                ]);

                autoTable(doc, {
                    startY: 50,
                    head: [['Empresa', 'Propietario', 'Estado', 'Ventas Mes', 'Comisión', 'Total Histórico']],
                    body: tableRows,
                    theme: 'striped',
                    headStyles: { fillColor: [147, 51, 234], fontStyle: 'bold' }, // Purple-600
                    styles: { fontSize: 9, cellPadding: 5 },
                    columnStyles: {
                        3: { halign: 'right' },
                        4: { halign: 'right' },
                        5: { halign: 'right' }
                    }
                });

                doc.save('Base_de_Datos_Empresas_Bayup.pdf');
            } catch (err) {
                console.error("Error al generar PDF:", err);
            } finally {
                setCopiedType(null);
            }
        }, 1500);
    };

    const handleExportBusinessDetail = (biz: any) => {
        setCopiedType('pdf');
        
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                
                // Cabecera Premium
                doc.setFillColor(17, 24, 39);
                doc.rect(0, 0, 210, 50, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(24);
                doc.text(biz.name.toUpperCase(), 20, 25);
                doc.setFontSize(10);
                doc.text('INFORME DETALLADO DE RENDIMIENTO - BAYUP PARTNER', 20, 38);
                
                // Información General
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Información del Socio', 20, 65);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Propietario: ${biz.owner}`, 20, 75);
                doc.text(`Correo: ${biz.email}`, 20, 82);
                doc.text(`Teléfono: ${biz.phone}`, 20, 89);
                doc.text(`Fecha de Registro: ${biz.joinDate}`, 20, 96);

                // KPIs en el PDF
                doc.setFillColor(249, 250, 251);
                doc.rect(130, 60, 60, 40, 'F');
                doc.setTextColor(147, 51, 234);
                doc.setFontSize(14);
                doc.text(biz.total, 135, 75);
                doc.setTextColor(107, 114, 128);
                doc.setFontSize(8);
                doc.text('TOTAL HISTÓRICO GENERADO', 135, 82);

                // Historial Mensual
                const historyRows = biz.monthlyHistory.map((h: any) => [
                    h.month,
                    h.sales,
                    '0.5%',
                    h.commission,
                    'Liquidado'
                ]);

                autoTable(doc, {
                    startY: 110,
                    head: [['Periodo', 'Ventas Totales', 'Tasa', 'Tu Beneficio', 'Estatus']],
                    body: historyRows,
                    headStyles: { fillColor: [17, 24, 39] },
                    styles: { fontSize: 9 }
                });

                doc.save(`Reporte_${biz.name.replace(/\s+/g, '_')}.pdf`);
            } catch (err) {
                console.error("Error al generar PDF detallado:", err);
            } finally {
                setCopiedType(null);
            }
        }, 1500);
    };

    const handleContactBusiness = (biz: any) => {
        if (biz.phone) {
            const text = `Hola ${biz.owner}, soy tu socio de Bayup. Me gustaría contactarte...`;
            window.open(`https://wa.me/${biz.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
        } else {
            window.location.href = `mailto:${biz.email}`;
        }
    };

    const businesses = [
        { 
            id: 1, name: 'Moda Urbana Store', owner: 'Carlos Ruiz', status: 'Activa', 
            sales: '$ 12.450.000', commission: '$ 62.250', total: '$ 584.000', 
            growth: '+15%', lastSale: 'Hoy, 10:45', email: 'contacto@modaurbana.com', 
            phone: '+57 310 456 7890', joinDate: '12 Nov, 2025',
            monthlyHistory: [
                { month: 'Enero 2026', sales: '$ 12.450.000', commission: '$ 62.250' },
                { month: 'Diciembre 2025', sales: '$ 10.200.000', commission: '$ 51.000' },
                { month: 'Noviembre 2025', sales: '$ 8.500.000', commission: '$ 42.500' }
            ]
        },
        { 
            id: 2, name: 'Tech Gadgets S.A.', owner: 'Ana Martínez', status: 'Activa', 
            sales: '$ 45.800.000', commission: '$ 229.000', total: '$ 1.250.000', 
            growth: '+22%', lastSale: 'Ayer, 18:20', email: 'admin@techgadgets.co', 
            phone: '+57 300 123 4567', joinDate: '05 Oct, 2025',
            monthlyHistory: [
                { month: 'Enero 2026', sales: '$ 45.800.000', commission: '$ 229.000' },
                { month: 'Diciembre 2025', sales: '$ 38.000.000', commission: '$ 190.000' },
                { month: 'Noviembre 2025', sales: '$ 35.000.000', commission: '$ 175.000' }
            ]
        },
        { 
            id: 3, name: 'Café Aroma Premium', owner: 'Roberto Gómez', status: 'Activa', 
            sales: '$ 2.100.000', commission: '$ 10.500', total: '$ 45.000', 
            growth: '-5%', lastSale: '25 Ene, 09:15', email: 'roberto@cafearoma.com', 
            phone: '+57 315 987 6543', joinDate: '20 Dic, 2025',
            monthlyHistory: [
                { month: 'Enero 2026', sales: '$ 2.100.000', commission: '$ 10.500' }
            ]
        },
        { 
            id: 4, name: 'Deportes Extremos', owner: 'Lucía Fernández', status: 'Pendiente', 
            sales: '$ 0', commission: '$ 0', total: '$ 0', 
            growth: '0%', lastSale: 'N/A', email: 'lucia@extremos.com', 
            phone: '+57 320 555 0000', joinDate: '15 Ene, 2026',
            monthlyHistory: []
        },
        { 
            id: 5, name: 'Hogar & Confort', owner: 'David Prada', status: 'Inactiva', 
            sales: '$ 850.000', commission: '$ 4.250', total: '$ 12.000', 
            growth: '-10%', lastSale: '12 Dic, 14:00', email: 'gerencia@hogarconfort.net', 
            phone: '+57 311 222 3333', joinDate: '01 Sep, 2025',
            monthlyHistory: [
                { month: 'Septiembre 2025', sales: '$ 850.000', commission: '$ 4.250' }
            ]
        },
    ];

    const filteredBusinesses = useMemo(() => {
        return businesses.filter(biz => {
            const matchesSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 biz.owner.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'Todas' || biz.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter]);

    // Lógica de Paginación
    const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
    const paginatedBusinesses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredBusinesses.slice(start, start + itemsPerPage);
    }, [filteredBusinesses, currentPage]);

    const openDetail = (biz: any) => {
        setSelectedBusiness(biz);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-12">
            {/* Header & Referral Tools */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                        Gestión de <span className="text-purple-600">Empresas</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Monitorea y expande tu red de empresas aliadas.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button 
                        onClick={() => handleCopy(affiliateCode, 'code')}
                        className={`h-20 px-8 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] border-2 transition-all active:scale-95 flex items-center gap-4 shadow-sm ${
                            copiedType === 'code' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-gray-100 text-gray-400 hover:border-purple-200 hover:text-purple-600'
                        }`}
                    >
                        {copiedType === 'code' ? <CheckCircle2 size={20}/> : <Copy size={20}/>}
                        {copiedType === 'code' ? '¡Código Copiado!' : 'Copiar Código de Afiliado'}
                    </button>

                    <button 
                        onClick={() => setIsLinkModalOpen(true)}
                        className="h-20 px-8 bg-gray-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 hover:bg-purple-600 hover:scale-105 transition-all active:scale-95"
                    >
                        <LinkIcon size={20}/> Generar Link de Afiliado
                    </button>
                </div>
            </div>

            {/* KPI Summary Row */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 min-w-[240px]">
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activas</p>
                        <h4 className="text-xl font-black text-gray-900 italic">42 Unidades</h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 min-w-[240px]">
                    <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En Proceso</p>
                        <h4 className="text-xl font-black text-gray-900 italic">8 Unidades</h4>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30">
                    <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-gray-100 w-full max-w-md focus-within:border-purple-200 transition-all">
                        <Search size={16} className="text-gray-300" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o dueño..." 
                            className="bg-transparent border-none outline-none text-[11px] font-bold w-full placeholder:text-gray-300" 
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${isFilterOpen ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900'}`}
                            >
                                <Filter size={16}/> Filtrar: {statusFilter}
                            </button>
                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-50"
                                    >
                                        {['Todas', 'Activa', 'Pendiente', 'Inactiva'].map((status) => (
                                            <button 
                                                key={status}
                                                onClick={() => { setStatusFilter(status); setIsFilterOpen(false); setCurrentPage(1); }}
                                                className={`w-full px-6 py-3 text-left text-[10px] font-black uppercase hover:bg-gray-50 transition-colors ${statusFilter === status ? 'text-purple-600' : 'text-gray-400'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setIsActionsOpen(!isActionsOpen)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${isActionsOpen ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900'}`}
                            >
                                <MoreHorizontal size={16}/> Acciones
                            </button>
                            <AnimatePresence>
                                {isActionsOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-50"
                                    >
                                        <button 
                                            onClick={() => { handleExportList(); setIsActionsOpen(false); }}
                                            className="w-full px-6 py-3 text-left text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                        >
                                            <Download size={14}/> Exportar Lista
                                        </button>
                                        <button 
                                            onClick={() => { setIsReportRangeModalOpen(true); setIsActionsOpen(false); }}
                                            className="w-full px-6 py-3 text-left text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                        >
                                            <Calendar size={14}/> Reporte Mensual
                                        </button>
                                        <div className="h-px bg-gray-100 my-2 mx-4"></div>
                                        <button 
                                            onClick={() => { setIsAnomalyModalOpen(true); setIsActionsOpen(false); }}
                                            className="w-full px-6 py-3 text-left text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-3"
                                        >
                                            <AlertCircle size={14}/> Reportar Anomalía
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa / Propietario</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventas Mes</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Comisión Mes</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Histórico Total</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedBusinesses.map((biz) => (
                                <tr key={biz.id} className="hover:bg-gray-50/50 group transition-all">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-xs italic uppercase">
                                                {biz.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-black text-gray-900 uppercase italic leading-tight group-hover:text-purple-600 transition-colors">{biz.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{biz.owner}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            biz.status === 'Activa' ? 'bg-emerald-50 text-emerald-600' : 
                                            biz.status === 'Pendiente' ? 'bg-amber-50 text-amber-600' : 
                                            'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                                biz.status === 'Activa' ? 'bg-emerald-500' : 
                                                biz.status === 'Pendiente' ? 'bg-amber-500' : 
                                                'bg-rose-500'
                                            }`}></span>
                                            {biz.status}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <p className="text-[13px] font-black text-gray-900 italic">{biz.sales}</p>
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1">{biz.growth} VS MES ANT</p>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <p className="text-[13px] font-black text-purple-600 italic">{biz.commission}</p>
                                        <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">LIQUIDACIÓN: 01/02</p>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <p className="text-[13px] font-black text-gray-900 italic">{biz.total}</p>
                                            <div className="h-8 w-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-all cursor-pointer">
                                                <TrendingUp size={14} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button 
                                            onClick={() => openDetail(biz)}
                                            className="px-6 py-3 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all active:scale-95 flex items-center gap-2 ml-auto"
                                        >
                                            Detalle <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedBusinesses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-10 py-20 text-center">
                                        <p className="text-[11px] font-black text-gray-300 uppercase italic tracking-widest">No se encontraron empresas con los filtros aplicados</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        Página {currentPage} de {Math.max(1, totalPages)} — Mostrando {paginatedBusinesses.length} de {filteredBusinesses.length} empresas vinculadas
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black transition-all ${currentPage === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-900 hover:border-purple-600'}`}
                        >
                            Atrás
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black transition-all ${currentPage === totalPages || totalPages === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-900 hover:border-purple-600'}`}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL: GENERADOR DE ENLACE DE SOCIO */}
            <AnimatePresence>
                {isLinkModalOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="p-10 bg-gray-900 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                    <LinkIcon size={120} />
                                </div>
                                <button 
                                    onClick={() => setIsLinkModalOpen(false)}
                                    className="absolute top-8 right-8 h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all z-50 group"
                                >
                                    <X size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                                
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Zap className="text-[#00F2FF]" size={20} />
                                        <p className="text-[10px] font-black uppercase text-[#00F2FF] tracking-[0.3em]">Partner Referral Engine</p>
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">Generador de <span className="text-purple-400">Enlace Único</span></h2>
                                    <p className="text-gray-400 text-xs font-medium italic">Vincula empresas automáticamente a tu red de beneficios.</p>
                                </div>
                            </div>

                            <div className="p-10 space-y-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tu Código de Vinculación</p>
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group">
                                        <p className="text-xl font-black text-gray-900 italic tracking-widest">{affiliateCode}</p>
                                        <span className="px-4 py-1.5 bg-purple-100 text-purple-600 rounded-full text-[9px] font-black uppercase">Vínculo Maestro</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">URL Final de Onboarding</p>
                                    <div className="p-6 bg-purple-50/50 rounded-3xl border border-purple-100 text-purple-900 font-mono text-xs break-all leading-relaxed relative">
                                        {onboardingLink}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <button 
                                        onClick={() => handleCopy(onboardingLink, 'link')}
                                        className={`h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                                            copiedType === 'link' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-gray-900 border border-gray-100 hover:bg-gray-50'
                                        }`}
                                    >
                                        {copiedType === 'link' ? <CheckCircle2 size={18}/> : <Copy size={18}/>}
                                        {copiedType === 'link' ? '¡Enlace Copiado!' : 'Copiar Link'}
                                    </button>

                                    <button 
                                        onClick={shareToWhatsApp}
                                        className="h-16 bg-[#25D366] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-green-100 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95"
                                    >
                                        <Share2 size={18}/> Compartir a WhatsApp
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: DETALLE PROFUNDO DE EMPRESA */}
            <AnimatePresence>
                {isDetailModalOpen && selectedBusiness && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#F8FAFC] w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
                        >
                            {/* Header del Detalle */}
                            <div className="p-12 bg-white border-b border-gray-100 relative overflow-hidden shrink-0">
                                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(147,51,234,0.05)_0%,_transparent_60%)]"></div>
                                <button 
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="absolute top-10 right-10 h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all z-50 group"
                                >
                                    <X size={24} className="group-hover:scale-110 transition-transform" />
                                </button>

                                <div className="flex items-center gap-10 relative z-10">
                                    <div className="h-24 w-24 bg-gray-900 text-white rounded-[2.5rem] flex items-center justify-center font-black text-3xl italic uppercase shadow-2xl">
                                        {selectedBusiness.name.substring(0, 2)}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">{selectedBusiness.name}</h2>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                selectedBusiness.status === 'Activa' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {selectedBusiness.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-6 text-gray-400">
                                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase"><User size={14} className="text-purple-600"/> {selectedBusiness.owner}</div>
                                            <div className="h-1 w-1 bg-gray-200 rounded-full"></div>
                                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase"><Calendar size={14} className="text-purple-600"/> Socio desde {selectedBusiness.joinDate}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cuerpo del Detalle */}
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                                {/* Información de Contacto & KPIs Rápidos */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4">Canales de Contacto</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 group cursor-pointer">
                                                <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all"><Mail size={16}/></div>
                                                <p className="text-[11px] font-bold text-gray-600 truncate">{selectedBusiness.email}</p>
                                            </div>
                                            <div className="flex items-center gap-4 group cursor-pointer">
                                                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Phone size={16}/></div>
                                                <p className="text-[11px] font-bold text-gray-600">{selectedBusiness.phone}</p>
                                            </div>
                                            <div className="flex items-center gap-4 group cursor-pointer">
                                                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Globe size={16}/></div>
                                                <p className="text-[11px] font-bold text-gray-600">Ver Catálogo</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={60}/></div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Total Histórico</p>
                                            <h3 className="text-3xl font-black text-gray-900 italic tracking-tight">{selectedBusiness.total}</h3>
                                            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase italic"><TrendingUp size={12}/> Red de beneficios activa</div>
                                        </div>
                                        <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Activity size={60}/></div>
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Ventas del Mes</p>
                                            <h3 className="text-3xl font-black text-white italic tracking-tight">{selectedBusiness.sales}</h3>
                                            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-[#00F2FF] uppercase italic"><Zap size={12}/> Generando {selectedBusiness.commission} hoy</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Desglose Mensual */}
                                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                            <TrendingUp size={18} className="text-purple-600" /> Desglose Mensual de Beneficios
                                        </h4>
                                        <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline">Ver Auditoría Completa</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-50">
                                                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Periodo</th>
                                                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventas Totales</th>
                                                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasa</th>
                                                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Tu Beneficio</th>
                                                    <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {selectedBusiness.monthlyHistory.map((history: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 transition-all group">
                                                        <td className="px-10 py-6 text-[12px] font-black text-gray-900 uppercase italic">{history.month}</td>
                                                        <td className="px-10 py-6 text-right text-[12px] font-bold text-gray-600">{history.sales}</td>
                                                        <td className="px-10 py-6 text-right text-[10px] font-black text-purple-600">0.5%</td>
                                                        <td className="px-10 py-6 text-right text-[13px] font-black text-gray-900 italic">{history.commission}</td>
                                                        <td className="px-10 py-6 text-center">
                                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100">Liquidados</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {selectedBusiness.monthlyHistory.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-10 py-12 text-center">
                                                            <p className="text-[11px] font-black text-gray-300 uppercase italic tracking-widest">No hay historial de facturación disponible</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Footer del Detalle */}
                            <div className="p-10 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Análisis de rendimiento procesado por Bayt AI</p>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleExportBusinessDetail(selectedBusiness)}
                                        className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all flex items-center gap-3"
                                    >
                                        <Download size={16}/> Exportar Datos
                                    </button>
                                    <button 
                                        onClick={() => handleContactBusiness(selectedBusiness)}
                                        className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-purple-600 transition-all active:scale-95 flex items-center gap-3"
                                    >
                                        Contactar Empresa <ExternalLink size={16}/>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: REPORTAR ANOMALÍA */}
            <AnimatePresence>
                {isAnomalyModalOpen && (
                    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="p-10 bg-rose-600 text-white relative">
                                <button onClick={() => setIsAnomalyModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><X size={24}/></button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"><ShieldAlert size={28}/></div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Reportar <span className="text-rose-200">Anomalía</span></h2>
                                        <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest mt-1">Este reporte llegará directamente al Super Admin</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Título del Problema</label>
                                    <input type="text" placeholder="Ej: Discrepancia en comisión..." className="w-full p-5 bg-gray-50 rounded-2xl border border-transparent focus:border-rose-200 outline-none text-sm font-bold transition-all" value={anomalyForm.title} onChange={(e) => setAnomalyForm({...anomalyForm, title: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Descripción Detallada</label>
                                    <textarea rows={4} placeholder="Explica detalladamente la situación detectada..." className="w-full p-5 bg-gray-50 rounded-2xl border border-transparent focus:border-rose-200 outline-none text-sm font-medium italic transition-all" value={anomalyForm.description} onChange={(e) => setAnomalyForm({...anomalyForm, description: e.target.value})} />
                                </div>
                                <button 
                                    onClick={() => { handleCopy('', 'anomaly'); setIsAnomalyModalOpen(false); }}
                                    className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-rose-100 flex items-center justify-center gap-3 hover:bg-rose-700 transition-all active:scale-95"
                                >
                                    Enviar Reporte Maestro <Send size={16}/>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: RANGO DE REPORTE MENSUAL */}
            <AnimatePresence>
                {isReportRangeModalOpen && (
                    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="p-10 bg-gray-900 text-white relative">
                                <button onClick={() => setIsReportRangeModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><X size={24}/></button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl"><Calendar size={28}/></div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Reporte <span className="text-purple-400">Personalizado</span></h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Selecciona el periodo de auditoría</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Desde</label>
                                        <input type="date" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-purple-200 outline-none text-xs font-bold" value={reportRange.start} onChange={(e) => setReportRange({...reportRange, start: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Hasta</label>
                                        <input type="date" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-purple-200 outline-none text-xs font-bold" value={reportRange.end} onChange={(e) => setReportRange({...reportRange, end: e.target.value})} />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { handleExportList(); setIsReportRangeModalOpen(false); }}
                                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 hover:bg-purple-600 transition-all active:scale-95"
                                >
                                    Generar Reporte PDF <Download size={16}/>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Confirmation Messages */}
            <AnimatePresence>
                {copiedType && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-[800]"
                    >
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {copiedType === 'code' && 'Código de socio copiado'}
                            {copiedType === 'link' && 'Enlace de socio copiado'}
                            {copiedType === 'pdf' && 'Generando archivo PDF...'}
                            {copiedType === 'anomaly' && 'Reporte enviado al Super Admin'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}