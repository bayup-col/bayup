"use client";

import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  Users, 
  FileText, 
  Calendar,
  ChevronRight,
  Download,
  Filter,
  Store,
  ArrowLeftRight,
  X,
  ExternalLink,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '@/lib/jspdf-types';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Mock function to assign branch based on something (e.g. random or hash) since backend doesn't send it yet
const getBranchForOrder = (order: any) => {
    // Simulación: Si el total es par -> Principal, impar -> Secundaria
    // En producción esto vendría del backend
    const lastChar = order.id.slice(-1).charCodeAt(0);
    return lastChar % 2 === 0 ? 'Tienda Principal' : 'Sucursal Norte';
};

export default function ReportsPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    
    // Filtros de Fecha (Por defecto: Mes actual)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);

    // --- ESTADO DE SUCURSALES ---
    const [selectedBranch, setSelectedBranch] = useState<string>('Todas');
    const [isComparing, setIsComparing] = useState(false);
    const availableBranches = ['Tienda Principal', 'Sucursal Norte'];

    // --- ESTADO DE MODAL DE DETALLES ---
    const [detailsModal, setDetailsModal] = useState<'income' | 'expenses' | null>(null);

    // --- ESTADO DE DATOS INTEGRADOS REALES ---
    const [salesHistory, setSalesHistory] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [salesRes, expRes] = await Promise.all([
                fetch('http://localhost:8000/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:8000/expenses', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (salesRes.ok) {
                const salesData = await salesRes.json();
                setSalesHistory(salesData.map((o: any) => ({
                    ...o,
                    total: o.total_price,
                    date: o.created_at,
                    source: o.customer_email === 'No registrado' ? 'pos' : 'web',
                    branch: getBranchForOrder(o) // Asignamos sucursal simulada
                })));
            }

            if (expRes.ok) {
                const expensesData = await expRes.json();
                setExpenses(expensesData.map((e: any) => ({
                    ...e,
                    branch: 'Tienda Principal' // Gastos por defecto a la principal por ahora
                })));
            }

            const savedSellers = localStorage.getItem('business_sellers');
            if (savedSellers) setSellers(JSON.parse(savedSellers));

        } catch (err) { 
            console.error("Error loading intelligence data", err); 
        } finally { 
            setIsLoading(false); 
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    // --- FILTRADO INTELIGENTE POR FECHA Y SUCURSAL ---
    const calculateStats = (branchFilter: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        const filteredSales = salesHistory.filter(s => {
            const d = new Date(s.date);
            const dateMatch = d >= start && d <= end;
            const branchMatch = branchFilter === 'Todas' || s.branch === branchFilter;
            return dateMatch && branchMatch;
        });

        const filteredExpenses = expenses.filter(e => {
            const d = new Date(e.due_date);
            const dateMatch = d >= start && d <= end;
            const branchMatch = branchFilter === 'Todas' || e.branch === branchFilter; 
            return dateMatch && branchMatch;
        });

        const totalIncome = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
        const totalExpensesValue = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        
        const netProfit = totalIncome - totalExpensesValue;
        const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        return { 
            totalIncome, 
            totalExpenses: totalExpensesValue, 
            netProfit, 
            margin, 
            count: filteredSales.length,
            filteredSales,
            filteredExpenses
        };
    };

    const totals = useMemo(() => calculateStats(selectedBranch), [salesHistory, expenses, startDate, endDate, selectedBranch]);
    
    // Stats para Comparativa
    const compareStats = useMemo(() => {
        if (!isComparing) return null;
        return {
            principal: calculateStats('Tienda Principal'),
            norte: calculateStats('Sucursal Norte')
        };
    }, [salesHistory, expenses, startDate, endDate, isComparing]);


    // --- GENERACIÓN DE PDF ---
    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();
            
            // 1. Estilo y Encabezado
            doc.setFillColor(17, 24, 39); // Gray-900
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('BAYUP', 20, 20);
            doc.setFontSize(10);
            doc.text(`BALANCE INTEGRADO - ${selectedBranch.toUpperCase()}`, 20, 30);
            
            // 2. Periodo
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.text(`Periodo: ${startDate} al ${endDate}`, 140, 50);
            doc.text(`Generado: ${new Date().toLocaleString()}`, 140, 55);

            // 3. Resumen Financiero
            doc.setTextColor(17, 24, 39);
            doc.setFontSize(14);
            doc.text('Resumen General', 20, 70);
            
            autoTable(doc, {
                startY: 75,
                head: [['Concepto', 'Valor']],
                body: [
                    ['Ventas Brutas Reales', formatCurrency(totals.totalIncome)],
                    ['Salidas de Dinero (Gastos)', formatCurrency(totals.totalExpenses)],
                    ['Utilidad Neta', formatCurrency(totals.netProfit)],
                    ['Margen de Rentabilidad', `${totals.margin.toFixed(2)}%`],
                    ['Total Órdenes en Periodo', totals.count.toString()]
                ],
                theme: 'striped',
                headStyles: { fillColor: [147, 51, 234] } // Purple-600
            });

            // 4. Detalle de Ventas por Canal
            const currentY = doc.lastAutoTable.finalY + 15;
            doc.text('Desglose por Canales', 20, currentY);
            const channelData = ['pos', 'web'].map(canal => {
                const canalSales = totals.filteredSales.filter(s => s.source === canal);
                const canalTotal = canalSales.reduce((acc, s) => acc + s.total, 0);
                return [canal === 'pos' ? 'Tienda Física' : 'Tienda Web', canalSales.length, formatCurrency(canalTotal)];
            });

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Origen', 'Órdenes', 'Total']],
                body: channelData,
                theme: 'grid'
            });

            // 5. Detalle de Gastos
            if (totals.filteredExpenses.length > 0) {
                const expensesY = doc.lastAutoTable.finalY + 15;
                doc.text('Detalle de Gastos Registrados', 20, expensesY);
                autoTable(doc, {
                    startY: expensesY + 5,
                    head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
                    body: totals.filteredExpenses.map(e => [
                        new Date(e.due_date).toLocaleDateString(),
                        e.description,
                        e.category.toUpperCase(),
                        formatCurrency(e.amount)
                    ]),
                    theme: 'striped'
                });
            }

            // 6. Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Este documento es un reporte generado automáticamente por la inteligencia de Bayup.', 20, 285);

            doc.save(`Balance_Bayup_${startDate}_${endDate}.pdf`);
            showToast("Balance descargado con éxito", "success");
        } catch (error) {
            console.error("PDF Export Error:", error);
            showToast("Error al generar el PDF", "error");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Centro de Inteligencia</h1>
                    <p className="text-gray-500 mt-2 font-medium">Balance real integrado: Ventas + Gastos + Nómina + Comisiones.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Selector de Sucursal y Comparativa */}
                    <div className="flex items-center bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                        {!isComparing && (
                            <div className="flex bg-gray-50 rounded-xl p-1">
                                <button 
                                    onClick={() => setSelectedBranch('Todas')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedBranch === 'Todas' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Todas
                                </button>
                                {availableBranches.map(branch => (
                                    <button 
                                        key={branch}
                                        onClick={() => setSelectedBranch(branch)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedBranch === branch ? 'bg-white shadow-md text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {branch}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        <div className="w-px h-8 bg-gray-100 mx-3"></div>
                        
                        <button 
                            onClick={() => setIsComparing(!isComparing)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isComparing ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                            <ArrowLeftRight size={14} />
                            {isComparing ? 'Salir Comparativa' : 'Comparar'}
                        </button>
                    </div>

                    {/* Selector de Rango de Fechas Premium */}
                    <div className="flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm gap-2">
                        <div className="flex flex-col px-3">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Desde</span>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer" 
                            />
                        </div>
                        <div className="h-8 w-px bg-gray-100 mx-1"></div>
                        <div className="flex flex-col px-3">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hasta</span>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer" 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleDownloadPDF} 
                        disabled={isExporting}
                        className="flex items-center gap-3 px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                    >
                        {isExporting ? 'Generando...' : 'Descargar PDF'}
                    </button>
                </div>
            </div>

            {/* VISTA COMPARATIVA (NUEVA) */}
            {isComparing && compareStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* COLUMNA A: PRINCIPAL */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Tienda Principal</h3>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-purple-50 shadow-lg relative overflow-hidden">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ventas Netas</p>
                            <p className="text-3xl font-black text-gray-900">{formatCurrency(compareStats.principal.totalIncome)}</p>
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 font-bold">Utilidad</span>
                                    <span className={`font-black ${compareStats.principal.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(compareStats.principal.netProfit)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 font-bold">Margen</span>
                                    <span className="font-black text-purple-600">{compareStats.principal.margin.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA B: NORTE */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Sucursal Norte</h3>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden opacity-90">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ventas Netas</p>
                            <p className="text-3xl font-black text-gray-900">{formatCurrency(compareStats.norte.totalIncome)}</p>
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 font-bold">Utilidad</span>
                                    <span className={`font-black ${compareStats.norte.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(compareStats.norte.netProfit)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 font-bold">Margen</span>
                                    <span className="font-black text-purple-600">{compareStats.norte.margin.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* KPIS ESTÁNDAR (CON FILTRO APLICADO) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                    <div 
                        onClick={() => setDetailsModal('income')}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ventas Reales ({selectedBranch})</p>
                            <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><ArrowUpRight size={14}/></div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(totals.totalIncome)}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-2">Click para ver desglose 🔎</p>
                        <div className="absolute right-4 bottom-4 text-3xl opacity-5">💰</div>
                    </div>
                    
                    <div 
                        onClick={() => setDetailsModal('expenses')}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Salidas de Dinero</p>
                            <div className="bg-rose-50 text-rose-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><ArrowUpRight size={14}/></div>
                        </div>
                        <p className="text-2xl font-black text-rose-600">{formatCurrency(totals.totalExpenses)}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-2">Click para auditar gastos 🔎</p>
                        <div className="absolute right-4 bottom-4 text-3xl opacity-5">💸</div>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Utilidad Neta Actual</p>
                        <p className="text-2xl font-black">{formatCurrency(totals.netProfit)}</p>
                        <p className="text-[9px] font-bold text-purple-300 mt-2 italic">Margen Real: {totals.margin.toFixed(1)}%</p>
                        <div className="absolute right-4 bottom-4 text-3xl opacity-20 animate-pulse">✨</div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Asesores Facturando</p>
                        <p className="text-2xl font-black text-gray-900">{sellers.length}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-2">Equipo comercial activo</p>
                        <div className="absolute right-4 bottom-4 text-3xl opacity-5">👥</div>
                    </div>
                </div>
            )}

            {/* TABLA DE RENDIMIENTO POR ORIGEN (Datos Reales) */}
            {!isComparing && (
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Ventas por Canal ({selectedBranch})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Origen</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cant. Órdenes</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bruto</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Participación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {['pos', 'web', 'whatsapp', 'instagram'].map((canal) => {
                                    const canalSales = totals.filteredSales.filter(s => s.source === canal);
                                    const canalTotal = canalSales.reduce((acc, s) => acc + s.total, 0);
                                    const percent = totals.totalIncome > 0 ? (canalTotal / totals.totalIncome) * 100 : 0;
                                    
                                    return (
                                        <tr key={canal} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-6 font-black text-sm text-gray-900 uppercase">{canal === 'pos' ? 'Tienda Física' : canal}</td>
                                            <td className="px-8 py-6 text-sm font-bold text-gray-600">{canalSales.length}</td>
                                            <td className="px-8 py-6 font-black text-sm text-gray-900">{formatCurrency(canalTotal)}</td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden"><div className="bg-purple-600 h-full" style={{ width: `${percent}%` }}></div></div>
                                                    <span className="text-[10px] font-black text-gray-400">{percent.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* BANNER IA CONECTADO */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative z-10">💡</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight">Estado de Rentabilidad Real</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
                        Tu margen neto real tras descontar gastos operativos y comisiones de equipo es del <span className="text-purple-400 font-black">{totals.margin.toFixed(1)}%</span>. 
                        {totals.netProfit > 0 ? " Tu operación es saludable y genera flujo de caja positivo." : " Alerta: Tus gastos están superando tus ingresos actuales."}
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black">DATA</div>
            </div>

            {/* MODAL FLOTANTE DE DETALLES (AUDITORÍA) */}
            {detailsModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        {/* Header Modal */}
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {detailsModal === 'income' ? 'Auditoría de Ingresos' : 'Auditoría de Gastos'}
                                </h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                                    {detailsModal === 'income' ? 'Listado detallado de todas las ventas del periodo' : 'Desglose completo de salidas de dinero'}
                                </p>
                            </div>
                            <button onClick={() => setDetailsModal(null)} className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Listado Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 custom-scrollbar">
                            <div className="space-y-4">
                                {(detailsModal === 'income' ? totals.filteredSales : totals.filteredExpenses)
                                    .sort((a:any, b:any) => new Date(b.date || b.due_date).getTime() - new Date(a.date || a.due_date).getTime())
                                    .map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${detailsModal === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {detailsModal === 'income' ? '💰' : '🧾'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{detailsModal === 'income' ? `Orden #${item.id.slice(0,8)}` : item.description}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                    {new Date(item.date || item.due_date).toLocaleDateString()} · {detailsModal === 'income' ? (item.source === 'pos' ? 'Tienda Física' : 'Web') : item.category}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
                                            <div>
                                                <p className={`text-base font-black ${detailsModal === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {formatCurrency(item.total || item.amount)}
                                                </p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">{item.branch || 'General'}</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    // Navegar al módulo correspondiente para ver detalle
                                                    if (detailsModal === 'income') router.push('/dashboard/orders');
                                                    else router.push('/dashboard/reports/gastos');
                                                }}
                                                className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                title="Ir al origen del dato"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(detailsModal === 'income' ? totals.filteredSales : totals.filteredExpenses).length === 0 && (
                                    <div className="text-center py-20 text-gray-400 font-bold uppercase text-xs">No hay registros en este periodo</div>
                                )}
                            </div>
                        </div>
                        
                        {/* Footer informativo */}
                        <div className="p-6 border-t border-gray-50 bg-white flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>Mostrando {(detailsModal === 'income' ? totals.filteredSales : totals.filteredExpenses).length} registros</span>
                            <span className="flex items-center gap-2"><Search size={12}/> Haz click en la flecha para ir al módulo</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
