"use client";

import { 
    Wallet, DollarSign, ArrowUpRight, Clock, CheckCircle2, 
    AlertCircle, Info, Download, Calendar, ArrowRight,
    TrendingUp, ShieldCheck, History as HistoryIcon, X, Search,
    ChevronRight, CreditCard, Landmark, Receipt, Zap, Send, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import '@/lib/jspdf-types';

export default function AffiliateTreasury() {
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [reportDates, setReportDates] = useState({ start: '', end: '' });
    const [supportForm, setSupportForm] = useState({ title: '', description: '' });
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

    const stats = [
        { label: 'Balance Total', val: '$ 12.450.000', icon: <Wallet className="text-purple-600" />, detail: 'Fondos acumulados históricos' },
        { label: 'Próximo Pago', val: '$ 584.000', icon: <Calendar className="text-emerald-600" />, detail: 'Fecha estimada: 05 Feb, 2026' },
        { label: 'Total Pagado', val: '$ 11.866.000', icon: <CheckCircle2 className="text-blue-600" />, detail: 'Transferido a tu cuenta bancaria' },
        { label: 'Total Pendiente', val: '$ 0', icon: <Clock className="text-amber-600" />, detail: 'En proceso de verificación' },
    ];

    const paymentHistory = [
        { 
            id: 'LIQ-9045', period: '01/01/2026 - 31/01/2026', amount: '$ 584.000', 
            status: 'Pendiente', method: 'Transferencia Bancaria', date: '-',
            bank: 'Bancolombia', account: '**** 4521', type: 'Ahorros',
            tax: '$ 0', net: '$ 584.000', sales_count: 128
        },
        { 
            id: 'LIQ-9044', period: '01/12/2025 - 31/12/2025', amount: '$ 1.250.000', 
            status: 'Pagado', method: 'Transferencia Bancaria', date: '05 Ene, 2026',
            bank: 'Bancolombia', account: '**** 4521', type: 'Ahorros',
            tax: '$ 12.500', net: '$ 1.237.500', sales_count: 342
        },
        { 
            id: 'LIQ-9043', period: '01/11/2025 - 30/11/2025', amount: '$ 980.000', 
            status: 'Pagado', method: 'Transferencia Bancaria', date: '05 Dic, 2025',
            bank: 'Bancolombia', account: '**** 4521', type: 'Ahorros',
            tax: '$ 9.800', net: '$ 970.200', sales_count: 215
        },
        { 
            id: 'LIQ-9042', period: '01/10/2025 - 31/10/2025', amount: '$ 2.100.000', 
            status: 'Pagado', method: 'Transferencia Bancaria', date: '05 Nov, 2025',
            bank: 'Bancolombia', account: '**** 4521', type: 'Ahorros',
            tax: '$ 21.000', net: '$ 2.079.000', sales_count: 512
        },
    ];

    const showConfirmation = (msg: string) => {
        setConfirmationMessage(msg);
        setTimeout(() => setConfirmationMessage(null), 3000);
    };

    const handleDownloadCertificate = async () => {
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
            doc.text('CERTIFICADO DE INGRESOS Y LIQUIDACIONES', 20, 32);
            doc.text(`Periodo: ${reportDates.start || 'Inicio'} - ${reportDates.end || 'Hoy'}`, 150, 25);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text('Resumen de Cuenta', 20, 60);
            
            const summaryRows = stats.map(s => [s.label, s.val]);
            autoTable(doc, {
                startY: 65,
                head: [['Concepto', 'Monto']],
                body: summaryRows,
                theme: 'grid',
                headStyles: { fillColor: [147, 51, 234] }
            });

            doc.text('Historial Detallado', 20, doc.lastAutoTable.finalY + 15);
            const historyRows = paymentHistory.map(p => [p.period, p.amount, p.status, p.date]);
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Periodo', 'Monto', 'Estatus', 'Fecha Pago']],
                body: historyRows,
                headStyles: { fillColor: [17, 24, 39] }
            });

            doc.save(`Certificado_Tesoreria_Bayup_${new Date().getTime()}.pdf`);
            setIsDateModalOpen(false);
            showConfirmation("Certificado generado con éxito");
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleDownloadReceipt = async (pay: any) => {
        setIsGeneratingPDF(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();

            // Header Corporativo
            doc.setFillColor(17, 24, 39);
            doc.rect(0, 0, 210, 50, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('BAYUP', 20, 25);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('COMPROBANTE OFICIAL DE LIQUIDACIÓN', 20, 38);
            doc.text(`ID: ${pay.id}`, 150, 25);
            doc.text(`Fecha: ${pay.date}`, 150, 32);

            // Información de la Transacción
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalle de la Operación', 20, 65);
            
            autoTable(doc, {
                startY: 75,
                body: [
                    ['Periodo Correspondiente', pay.period],
                    ['Método de Pago', pay.method],
                    ['Entidad Bancaria', pay.bank],
                    ['Número de Cuenta', pay.account],
                    ['Tipo de Cuenta', pay.type],
                    ['Ventas Vinculadas', pay.sales_count]
                ],
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 }
            });

            // Cuadro de Totales
            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFillColor(249, 250, 251);
            doc.rect(120, finalY, 70, 45, 'F');
            
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text('Monto Bruto:', 125, finalY + 10);
            doc.text('Deducciones:', 125, finalY + 20);
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(pay.amount, 160, finalY + 10);
            doc.setTextColor(225, 29, 72); // Rose-600
            doc.text(`- ${pay.tax}`, 160, finalY + 20);
            
            doc.setDrawColor(229, 231, 235);
            doc.line(125, finalY + 25, 185, finalY + 25);
            
            doc.setTextColor(147, 51, 234); // Purple-600
            doc.setFontSize(12);
            doc.text('Total Neto:', 125, finalY + 35);
            doc.text(pay.net, 160, finalY + 35);

            // Firma Digital / Sello
            doc.setTextColor(156, 163, 175);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Este documento es un comprobante digital emitido por la plataforma Bayup.', 20, 280);
            doc.text('No requiere firma física para su validez legal.', 20, 285);

            doc.save(`Comprobante_${pay.id}_Bayup.pdf`);
            showConfirmation("Comprobante descargado correctamente");
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleSendSupport = () => {
        // Simulación de envío al admin
        showConfirmation("Reporte enviado al equipo de soporte");
        setIsSupportModalOpen(false);
        setSelectedPayment(null);
        setSupportForm({ title: '', description: '' });
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                        Gestión de <span className="text-purple-600">Tesorería</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Control financiero detallado de tus ingresos y liquidaciones.</p>
                </div>
                <button 
                    onClick={() => setIsDateModalOpen(true)}
                    className="h-16 px-8 bg-gray-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 hover:bg-purple-600 transition-all active:scale-95"
                >
                    <Download size={18}/> Descargar Certificado
                </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative group overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
                                {item.icon}
                            </div>
                            <div className="h-2 w-2 bg-gray-100 rounded-full group-hover:bg-purple-600 transition-colors"></div>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{item.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 italic tracking-tight">{item.val}</h3>
                        <p className="text-[9px] font-bold text-gray-300 uppercase mt-4">{item.detail}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Payment History Table */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <HistoryIcon size={18} className="text-purple-600" /> Historial de Liquidaciones
                        </h4>
                        <button 
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline"
                        >
                            Ver Todo
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-50 text-left">
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Periodo</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Fecha Pago</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paymentHistory.map((pay, i) => (
                                    <tr 
                                        key={i} 
                                        onClick={() => setSelectedPayment(pay)}
                                        className="hover:bg-gray-50/50 transition-all group cursor-pointer"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <Calendar size={16} className="text-gray-300" />
                                                <p className="text-[12px] font-black text-gray-900 uppercase italic tracking-tight group-hover:text-purple-600">{pay.period}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <p className="text-[13px] font-black text-gray-900 italic">{pay.amount}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                pay.status === 'Pagado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                                            }`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right text-[12px] font-bold text-gray-400 uppercase italic">
                                            {pay.date}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Rules & Info Sidebar */}
                <div className="space-y-8">
                    <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <ShieldCheck size={120} />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-purple-400 flex items-center gap-3 relative z-10">
                            <Info size={18} /> Reglas de Pago
                        </h4>
                        <div className="mt-8 space-y-6 relative z-10">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400">Frecuencia</p>
                                <p className="text-sm font-medium text-gray-200 italic">Liquidaciones automáticas cada día 05 de cada mes.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400">Monto Mínimo</p>
                                <p className="text-sm font-medium text-gray-200 italic">El balance debe superar los $50.000 para procesar el pago.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400">Verificación</p>
                                <p className="text-sm font-medium text-gray-200 italic">Todas las ventas pasan por un periodo de auditoría de 15 días.</p>
                            </div>
                        </div>
                        <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between relative z-10">
                            <p className="text-[10px] font-black uppercase text-emerald-400">Estatus: Verificado</p>
                            <ArrowRight size={18} className="text-gray-500" />
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 mb-2">
                            <TrendingUp size={32} />
                        </div>
                        <h5 className="text-[13px] font-black text-gray-900 uppercase italic">Aumenta tu Comisión</h5>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-wide">Refiere más de 10 empresas activas y sube tu tasa al 0.7% automáticamente.</p>
                        <button className="w-full py-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase text-gray-400 cursor-not-allowed">Próximamente</button>
                    </div>
                </div>
            </div>

            {/* MODAL: SELECCIÓN DE FECHAS PARA CERTIFICADO */}
            <AnimatePresence>
                {isDateModalOpen && (
                    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                            <div className="p-10 bg-gray-900 text-white relative">
                                <button onClick={() => setIsDateModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><X size={24}/></button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl"><Receipt size={28}/></div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Certificado <span className="text-purple-400">Fiscal</span></h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Generación de documento oficial</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Desde</label>
                                        <input type="date" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-purple-200 outline-none text-xs font-bold" value={reportDates.start} onChange={(e) => setReportDates({...reportDates, start: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Hasta</label>
                                        <input type="date" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-purple-200 outline-none text-xs font-bold" value={reportDates.end} onChange={(e) => setReportDates({...reportDates, end: e.target.value})} />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleDownloadCertificate}
                                    disabled={isGeneratingPDF}
                                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isGeneratingPDF ? 'Generando Archivo...' : 'Descargar Certificado PDF'} <Download size={16}/>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: HISTORIAL COMPLETO DE LIQUIDACIONES */}
            <AnimatePresence>
                {isHistoryModalOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20">
                            <div className="p-10 bg-gray-900 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 p-10 opacity-10"><HistoryIcon size={120} /></div>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="h-16 w-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-xl"><HistoryIcon size={28} className="text-white" /></div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Bóveda de <span className="text-purple-400">Liquidaciones</span></h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registro histórico de pagos emitidos</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsHistoryModalOpen(false)} className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all relative z-10 group"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                                {paymentHistory.map((pay, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => { setSelectedPayment(pay); setIsHistoryModalOpen(false); }}
                                        className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-gray-50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-gray-900 group-hover:text-white transition-all duration-500"><Landmark size={24} /></div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight">{pay.period}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{pay.id}</span>
                                                    <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${pay.status === 'Pagado' ? 'text-emerald-500' : 'text-amber-500'}`}>{pay.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-8">
                                            <div>
                                                <p className="text-lg font-black text-gray-900 italic tracking-tight">{pay.amount}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{pay.sales_count} Ventas vinculadas</p>
                                            </div>
                                            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-purple-600 group-hover:bg-purple-50 transition-all"><ChevronRight size={18} /></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: DETALLE DE LIQUIDACIÓN ESPECÍFICA */}
            <AnimatePresence>
                {selectedPayment && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }} 
                            className="bg-[#F8FAFC] w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-12 bg-white border-b border-gray-100 relative shrink-0">
                                <button 
                                    onClick={() => setSelectedPayment(null)} 
                                    className="absolute top-10 right-10 h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all z-50 group"
                                >
                                    <X size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <div className="flex items-center gap-8">
                                    <div className="h-20 w-20 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center shadow-xl"><Landmark size={32} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">{selectedPayment.id}</p>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Detalle de Pago</h2>
                                    </div>
                                </div>
                            </div>
                            <div className="p-12 space-y-10 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-2">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Monto Bruto</p>
                                        <p className="text-2xl font-black text-gray-900 italic">{selectedPayment.amount}</p>
                                    </div>
                                    <div className={`p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 ${selectedPayment.status === 'Pagado' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${selectedPayment.status === 'Pagado' ? 'text-emerald-600' : 'text-amber-600'}`}>Estatus de Pago</p>
                                        <p className={`text-xl font-black italic ${selectedPayment.status === 'Pagado' ? 'text-emerald-700' : 'text-amber-700'}`}>{selectedPayment.status}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4">Información Bancaria</h4>
                                    <div className="grid grid-cols-2 gap-6 text-[11px]">
                                        <div><p className="text-gray-400 font-bold uppercase mb-1">Banco</p><p className="font-black text-gray-900 uppercase">{selectedPayment.bank}</p></div>
                                        <div><p className="text-gray-400 font-bold uppercase mb-1">Cuenta</p><p className="font-black text-gray-900 uppercase">{selectedPayment.account}</p></div>
                                        <div><p className="text-gray-400 font-bold uppercase mb-1">Tipo</p><p className="font-black text-gray-900 uppercase">{selectedPayment.type}</p></div>
                                        <div><p className="text-gray-400 font-bold uppercase mb-1">Método</p><p className="font-black text-gray-900 uppercase">{selectedPayment.method}</p></div>
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6">
                                    <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase text-gray-400">Total Liquidado</p><p className="text-xl font-black italic">{selectedPayment.amount}</p></div>
                                    <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase text-gray-400">Impuestos/Comisiones</p><p className="text-sm font-black text-rose-400">-{selectedPayment.tax}</p></div>
                                    <div className="h-px bg-white/10 w-full"></div>
                                    <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase text-[#00F2FF]">Neto a Recibir</p><p className="text-2xl font-black text-[#00F2FF] italic">{selectedPayment.net}</p></div>
                                </div>
                            </div>
                            <div className="p-10 bg-white border-t border-gray-100 flex gap-4 shrink-0">
                                <button onClick={() => handleDownloadReceipt(selectedPayment)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all flex items-center justify-center gap-3"><Download size={16}/> Comprobante PDF</button>
                                <button onClick={() => setIsSupportModalOpen(true)} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-purple-600 transition-all flex items-center justify-center gap-3"><Zap size={16}/> Soporte Bayup</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: SOPORTE TÉCNICO (REPORTAR PROBLEMA) */}
            <AnimatePresence>
                {isSupportModalOpen && (
                    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                            <div className="p-10 bg-gray-900 text-white relative">
                                <button onClick={() => setIsSupportModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><X size={24}/></button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl"><ShieldAlert size={28}/></div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Soporte <span className="text-purple-400">Bayup</span></h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Reportar incidencia en liquidación</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del Problema</label>
                                    <input type="text" placeholder="Ej: Pago no recibido..." className="w-full p-5 bg-gray-50 rounded-2xl border border-transparent focus:border-purple-200 outline-none text-sm font-bold transition-all" value={supportForm.title} onChange={(e) => setSupportForm({...supportForm, title: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Descripción Completa</label>
                                    <textarea rows={4} placeholder="Describe detalladamente el problema para el administrador..." className="w-full p-5 bg-gray-50 rounded-2xl border border-transparent focus:border-purple-200 outline-none text-sm font-medium italic transition-all" value={supportForm.description} onChange={(e) => setSupportForm({...supportForm, description: e.target.value})} />
                                </div>
                                <button 
                                    onClick={handleSendSupport}
                                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 hover:bg-purple-600 transition-all active:scale-95"
                                >
                                    Enviar Reporte a Admin <Send size={16}/>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirmation Floating Message */}
            <AnimatePresence>
                {(isGeneratingPDF || confirmationMessage) && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-[900]">
                        {isGeneratingPDF ? (
                            <>
                                <div className="h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Procesando Documento...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{confirmationMessage}</span>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
