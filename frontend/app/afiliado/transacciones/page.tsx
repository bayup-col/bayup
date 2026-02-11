"use client";

import {
    Activity, ArrowUpRight, Building2, Calendar, CheckCircle2, ChevronLeft, ChevronRight, 
    CreditCard, DollarSign, Download, ExternalLink, Filter, Globe, History as HistoryIcon, 
    Mail, MessageSquare, Search, X, Zap, ShieldCheck, Info, Clock, Send, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import '@/lib/jspdf-types';

export default function AffiliateTransactions() {
    const [searchQuery, setSearchQuery] = useState('');
    const [companyFilter, setCompanyFilter] = useState('Todas');
    const [isCompanyFilterOpen, setIsCompanyFilterOpen] = useState(false);
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const itemsPerPage = 5;

    // Datos con campos de fecha normalizados para el filtro
    const transactions = [
        { id: '#TR-8541', company: 'Moda Urbana Store', amount: '$ 450.000', commission: '$ 2.250', date: '28 Ene, 14:22', isoDate: '2026-01-28', status: 'Verificado', channel: 'WhatsApp', net: '$ 2.250', client: 'Carlos Ruiz' },
        { id: '#TR-8540', company: 'Tech Gadgets S.A.', amount: '$ 890.000', commission: '$ 4.450', date: '28 Ene, 12:05', isoDate: '2026-01-28', status: 'Verificado', channel: 'Web Store', net: '$ 4.450', client: 'Ana Martínez' },
        { id: '#TR-8539', company: 'Café Aroma Premium', amount: '$ 125.000', commission: '$ 625', date: '27 Ene, 21:10', isoDate: '2026-01-27', status: 'Verificado', channel: 'Web Store', net: '$ 625', client: 'Roberto Gómez' },
        { id: '#TR-8538', company: 'Moda Urbana Store', amount: '$ 210.000', commission: '$ 1.050', date: '27 Ene, 18:45', isoDate: '2026-01-27', status: 'Auditoría', channel: 'WhatsApp', net: '$ 1.050', client: 'Carlos Ruiz' },
        { id: '#TR-8537', company: 'Deportes Extremos', amount: '$ 3.500.000', commission: '$ 17.500', date: '26 Ene, 15:30', isoDate: '2026-01-26', status: 'Verificado', channel: 'Manual POS', net: '$ 17.500', client: 'Lucía Fernández' },
        { id: '#TR-8536', company: 'Tech Gadgets S.A.', amount: '$ 640.000', commission: '$ 3.200', date: '26 Ene, 11:15', isoDate: '2026-01-26', status: 'Verificado', channel: 'Web Store', net: '$ 3.200', client: 'Ana Martínez' },
        { id: '#TR-8535', company: 'Boutique Elegance', amount: '$ 980.000', commission: '$ 4.900', date: '25 Ene, 09:15', isoDate: '2026-01-25', status: 'Verificado', channel: 'Web Store', net: '$ 4.900', client: 'Elena Prado' },
    ];

    const companies = ['Todas', 'Moda Urbana Store', 'Tech Gadgets S.A.', 'Café Aroma Premium', 'Deportes Extremos', 'Boutique Elegance'];

    // LÓGICA DE FILTRADO COMPLETA (Búsqueda + Empresa + Fecha)
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tr => {
            const matchesSearch = tr.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 tr.company.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCompany = companyFilter === 'Todas' || tr.company === companyFilter;
            
            let matchesDate = true;
            if (dateRange.start) {
                matchesDate = matchesDate && tr.isoDate >= dateRange.start;
            }
            if (dateRange.end) {
                matchesDate = matchesDate && tr.isoDate <= dateRange.end;
            }
            
            return matchesSearch && matchesCompany && matchesDate;
        });
    }, [searchQuery, companyFilter, dateRange]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(start, start + itemsPerPage);
    }, [filteredTransactions, currentPage]);

    // GENERACIÓN DE PDF PROFESIONAL (Sustituye al CSV "feo")
    const handleExportReport = async () => {
        setIsGeneratingReport(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();

            // Estilo Corporativo Bayup
            doc.setFillColor(17, 24, 39); // Dark Header
            doc.rect(0, 0, 210, 45, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('BAYUP PARTNER', 20, 20);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('HISTORIAL ESTRATÉGICO DE TRANSACCIONES', 20, 32);
            doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 145, 20);
            doc.text(`Filtro: ${dateRange.start || 'Inicio'} - ${dateRange.end || 'Hoy'}`, 145, 27);

            const tableRows = filteredTransactions.map(tr => [
                tr.id,
                tr.company,
                tr.date,
                tr.channel,
                tr.amount,
                tr.commission,
                tr.status
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['Referencia', 'Empresa Origen', 'Fecha', 'Canal', 'Monto Venta', 'Comisión (0.5%)', 'Estatus']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [147, 51, 234], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 4 },
                columnStyles: {
                    4: { halign: 'right' },
                    5: { halign: 'right', fontStyle: 'bold' }
                }
            });

            doc.save(`Reporte_Transacciones_Bayup_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleDownloadSingleReceipt = async (tr: any) => {
        setIsGeneratingReport(true);
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
            doc.text('COMPROBANTE INDIVIDUAL DE COMISIÓN', 20, 38);
            doc.text(`ID: ${tr.id}`, 150, 25);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text('Detalle del Registro', 20, 65);
            
            autoTable(doc, {
                startY: 75,
                body: [
                    ['Empresa Origen', tr.company],
                    ['Cliente / Propietario', tr.client],
                    ['Canal de Venta', tr.channel],
                    ['Fecha de Registro', tr.date],
                    ['Estado de Auditoría', tr.status]
                ],
                theme: 'grid',
                styles: { fontSize: 10 }
            });

            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFillColor(249, 250, 251);
            doc.rect(130, finalY, 60, 30, 'F');
            doc.setTextColor(147, 51, 234);
            doc.setFontSize(14);
            doc.text(tr.net, 135, finalY + 15);
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);
            doc.text('BENEFICIO GENERADO', 135, finalY + 22);

            doc.save(`Registro_${tr.id}_Bayup.pdf`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                        Historial de <span className="text-purple-600">Transacciones</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Detalle pormenorizado de cada venta que genera beneficios para ti.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleExportReport}
                        disabled={isGeneratingReport}
                        className="h-16 px-8 bg-white border border-gray-100 rounded-3xl font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        <Download size={18}/> {isGeneratingReport ? 'Procesando...' : 'Exportar Reporte PDF'}
                    </button>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {/* Search & Global Filters */}
                <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/30">
                    <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-gray-100 w-full max-w-lg focus-within:border-purple-200 transition-all">
                        <Search size={16} className="text-gray-300" />
                        <input 
                            type="text" 
                            placeholder="Buscar por ID de transacción o empresa..." 
                            className="bg-transparent border-none outline-none text-[11px] font-bold w-full placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsCompanyFilterOpen(!isCompanyFilterOpen)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${isCompanyFilterOpen ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900'}`}
                            >
                                <Building2 size={16}/> {companyFilter === 'Todas' ? 'Todas las Empresas' : companyFilter}
                            </button>
                            <AnimatePresence>
                                {isCompanyFilterOpen && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-50 overflow-hidden">
                                        {companies.map((c) => (
                                            <button key={c} onClick={() => { setCompanyFilter(c); setIsCompanyFilterOpen(false); setCurrentPage(1); }} className={`w-full px-6 py-3 text-left text-[10px] font-black uppercase transition-colors hover:bg-gray-50 ${companyFilter === c ? 'text-purple-600 bg-purple-50/50' : 'text-gray-400'}`}>
                                                {c}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${isDateFilterOpen || (dateRange.start || dateRange.end) ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900'}`}
                            >
                                <Calendar size={16}/> {dateRange.start || dateRange.end ? 'Fecha Filtrada' : 'Filtrar Fecha'}
                            </button>
                            <AnimatePresence>
                                {isDateFilterOpen && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-50">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase">Desde</label>
                                                <input type="date" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:border-purple-200 outline-none text-[10px] font-bold" value={dateRange.start} onChange={(e) => { setDateRange({...dateRange, start: e.target.value}); setCurrentPage(1); }} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase">Hasta</label>
                                                <input type="date" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:border-purple-200 outline-none text-[10px] font-bold" value={dateRange.end} onChange={(e) => { setDateRange({...dateRange, end: e.target.value}); setCurrentPage(1); }} />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={() => { setDateRange({start:'', end:''}); setIsDateFilterOpen(false); }} className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-gray-900 transition-all">Limpiar</button>
                                                <button onClick={() => setIsDateFilterOpen(false)} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all">Aplicar</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50 text-left">
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Fecha</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa Origen</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Canal</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Venta Total</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Tu Comisión (0.5%)</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedTransactions.map((tr, i) => (
                                <tr key={i} onClick={() => setSelectedTransaction(tr)} className="hover:bg-gray-50/50 transition-all group cursor-pointer">
                                    <td className="px-10 py-8">
                                        <div>
                                            <p className="text-[12px] font-black text-gray-900 uppercase italic leading-tight group-hover:text-purple-600 transition-colors">{tr.id}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{tr.date}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px] font-black group-hover:bg-gray-900 group-hover:text-white transition-all">
                                                {tr.company.substring(0, 1)}
                                            </div>
                                            <p className="text-[11px] font-black text-gray-700 uppercase italic">{tr.company}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="inline-flex items-center gap-2 text-gray-400">
                                            {tr.channel === 'WhatsApp' && <MessageSquare size={14} />}
                                            {tr.channel === 'Web Store' && <Globe size={14} />}
                                            {tr.channel === 'Manual POS' && <CreditCard size={14} />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">{tr.channel}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <p className="text-[13px] font-black text-gray-900 italic">{tr.amount}</p>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <p className="text-[13px] font-black text-purple-600 italic">{tr.commission}</p>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${ 
                                            tr.status === 'Verificado' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {tr.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {paginatedTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-10 py-20 text-center">
                                        <p className="text-[11px] font-black text-gray-300 uppercase italic tracking-widest">No se encontraron transacciones con los filtros aplicados</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-10 bg-gray-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Página {currentPage} de {Math.max(1, totalPages)} — Mostrando {paginatedTransactions.length} de {filteredTransactions.length} registros</p>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center transition-all shadow-sm ${currentPage === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-900 hover:border-gray-900'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-12 w-12 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all ${currentPage === i + 1 ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center transition-all shadow-sm ${currentPage === totalPages || totalPages === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-900 hover:border-gray-900'}`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL: DETALLE DE TRANSACCIÓN */}
            <AnimatePresence>
                {selectedTransaction && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className="bg-[#F8FAFC] w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[85vh]"
                        >
                            <div className="p-12 bg-white border-b border-gray-100 relative shrink-0">
                                <button 
                                    onClick={() => setSelectedTransaction(null)} 
                                    className="absolute top-10 right-10 h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all z-50 group"
                                >
                                    <X size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <div className="flex items-center gap-8">
                                    <div className="h-20 w-20 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center shadow-xl"><Activity size={32} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">{selectedTransaction.id}</p>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Detalle Venta</h2>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-2">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Monto de Venta</p>
                                        <p className="text-2xl font-black text-gray-900 italic">{selectedTransaction.amount}</p>
                                    </div>
                                    <div className="bg-purple-600 p-8 rounded-[2.5rem] shadow-xl space-y-2">
                                        <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest">Tu Comisión (0.5%)</p>
                                        <p className="text-2xl font-black text-white italic">{selectedTransaction.commission}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-3"><Zap size={16} className="text-purple-600" /> Trazabilidad del Beneficio</h4>
                                    <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Empresa Origen</p><p className="text-xs font-black text-gray-900 uppercase italic">{selectedTransaction.company}</p></div>
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Cliente / Propietario</p><p className="text-xs font-black text-gray-900 uppercase italic">{selectedTransaction.client}</p></div>
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Canal de Venta</p><p className="text-xs font-black text-gray-900 uppercase italic">{selectedTransaction.channel}</p></div>
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Fecha & Hora</p><p className="text-xs font-black text-gray-900 uppercase italic">{selectedTransaction.date}</p></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-8 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100"><CheckCircle2 size={20} /></div>
                                        <div><p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Estatus Transacción</p><p className="text-xs font-bold text-emerald-600 uppercase italic">{selectedTransaction.status}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Neto Generado</p><p className="text-xl font-black text-emerald-600 italic">{selectedTransaction.net}</p></div>
                                </div>
                            </div>

                            <div className="p-10 bg-white border-t border-gray-100 flex gap-4 shrink-0">
                                <button 
                                    onClick={() => handleDownloadSingleReceipt(selectedTransaction)}
                                    className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Download size={16}/> Exportar Registro
                                </button>
                                <button onClick={() => setIsAuditModalOpen(true)} className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-purple-600 transition-all flex items-center justify-center gap-3 active:scale-95">Ver Auditoría <ExternalLink size={16}/></button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: AUDITORÍA DE OPERACIÓN */}
            <AnimatePresence>
                {isAuditModalOpen && selectedTransaction && (
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
                                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">La venta ha sido trazada correctamente al enlace del afiliado vinculado a {selectedTransaction.company}.</p>
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

            {/* Confirmation Floating Message */}
            <AnimatePresence>
                {isGeneratingReport && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-[800]">
                        <div className="h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Generando Informe Profesional...</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
