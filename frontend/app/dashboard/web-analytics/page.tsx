"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Zap, Eye, MousePointer2, DollarSign, Activity, Users, Globe, Clock, 
  ShoppingCart, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Monitor, Smartphone, Search, 
  PieChart, BarChart3, Calendar, Layers, Sparkles, ChevronDown, Timer, ExternalLink, MessageSquare, 
  Mail, Share2, Download, Rocket, Trophy, ChevronRight, CheckCircle2, X, ArrowRight, Tag, AlertCircle,
  Bot, Lightbulb, Info, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function WebAnalyticsPage() {
    const { token, userEmail } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'conversion' | 'audience' | 'inventory' | 'marketing'>('overview');
    
    // UI States
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isProductHistoryModalOpen, setIsProductHistoryModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Form States
    const [orderForm, setOrderForm] = useState({ productName: "Tabletas Purificadoras X", quantity: 450, provider: "", pricePerUnit: 26000, sending_method: 'whatsapp', scheduled_at: '', notes: '' });
    const [providers, setProviders] = useState<any[]>([]);
    const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
    const [isRegisterProviderOpen, setIsRegisterProviderOpen] = useState(false);
    const [newProvider, setNewProvider] = useState({ name: '', email: '', phone: '' });

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    const formatNumber = (val: number) => !val ? "0" : val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const unformatNumber = (val: string) => parseInt(val.replace(/\./g, '')) || 0;

    const fetchProviders = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:8000/providers', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setProviders(await res.json());
        } catch (e) { console.error(e); }
    }, [token]);

    useEffect(() => { if (isOrderModalOpen) fetchProviders(); }, [isOrderModalOpen, fetchProviders]);

    const handleConfirmOrder = async () => {
        if (!orderForm.provider) return showToast("Selecciona un proveedor", "error");
        setIsSubmittingOrder(true);
        try {
            const res = await fetch('http://localhost:8000/purchase-orders', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_name: orderForm.productName, quantity: orderForm.quantity, total_amount: orderForm.quantity * orderForm.pricePerUnit, provider_name: orderForm.provider, sending_method: orderForm.sending_method, status: orderForm.sending_method === 'reminder' ? 'scheduled' : 'sent' })
            });
            if (res.ok) { showToast("Pedido procesado con éxito 🚀", "success"); setIsOrderModalOpen(false); }
        } catch (e) { showToast("Error de conexión", "error"); }
        finally { setIsSubmittingOrder(false); }
    };

    // --- GENERADOR DE REPORTE PDF PROFESIONAL (7 PÁGINAS) ---
    const handleDownloadReport = async () => {
        setIsGeneratingPDF(true);
        try {
            const doc = new jsPDF();
            const primaryColor = [147, 51, 234];
            const darkColor = [17, 24, 39];

            // PÁGINA 1: PORTADA
            doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]); doc.rect(0, 0, 210, 297, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(50); doc.setFont('helvetica', 'bold'); doc.text('BAYUP', 20, 70);
            doc.setFontSize(22); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.text('BUSINESS INTELLIGENCE REPORT', 20, 90);
            doc.setFontSize(14); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
            doc.text(`Empresa: SEBAS STORE`, 20, 130);
            doc.text(`División: Análisis Web & Marketing Pro`, 20, 140);
            doc.text(`Periodo: Últimos 30 días (${new Date().toLocaleDateString()})`, 20, 150);
            doc.text(`ID Reporte: #BI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 160);

            // PÁGINA 2: RESUMEN EJECUTIVO & FUNNEL
            doc.addPage(); doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]); doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.text('1. Resumen Ejecutivo de Operación', 20, 30);
            autoTable(doc, {
                startY: 40,
                head: [['Métrica Principal', 'Valor Actual', 'vs Periodo Anterior']],
                body: [
                    ['Ventas Brutas Totales', formatCurrency(3450000), '+18.5% (En alza)'],
                    ['Ticket Promedio de Venta', formatCurrency(124000), '+5.2%'],
                    ['Tasa de Conversión General', '4.8%', '+0.4%'],
                    ['Ingresos Recuperados', formatCurrency(8900000), '+32%']
                ],
                theme: 'striped', headStyles: { fillColor: darkColor }
            });
            const funnelY = (doc as any).lastAutoTable.finalY + 20; doc.text('2. Análisis de Embudo (Sales Funnel)', 20, funnelY);
            autoTable(doc, {
                startY: funnelY + 10, head: [['Etapa del Proceso', 'Usuarios', '% Retención', '% Fuga']],
                body: [['Sesiones Totales', '12,450', '100%', '0%'], ['Visualización Producto', '8,420', '67%', '33%'], ['Adición Carrito', '2,150', '17%', '74%'], ['Inicio Checkout', '840', '6%', '61%'], ['Compra Finalizada', '524', '4.2%', '37%']],
                theme: 'grid', headStyles: { fillColor: primaryColor }
            });

            // PÁGINA 3: TRÁFICO
            doc.addPage(); doc.text('3. Tráfico & Comportamiento de Usuario', 20, 30);
            autoTable(doc, {
                startY: 40, head: [['Canal de Origen', 'Sesiones', 'Rebote', 'Tiempo Promedio']],
                body: [['Directo', '4,500', '12%', '4m 20s'], ['Instagram Ads', '3,200', '24%', '1m 45s'], ['Google SEO', '1,800', '18%', '3m 10s'], ['TikTok Shop', '1,200', '42%', '0m 55s'], ['WhatsApp Business', '850', '5%', '6m 12s']],
                theme: 'striped', headStyles: { fillColor: [59, 130, 246] }
            });
            const tempY = (doc as any).lastAutoTable.finalY + 20; doc.text('Análisis de Temporalidad', 20, tempY);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('Peak de Tráfico: 2:00 PM - 4:00 PM', 25, tempY + 10); doc.text('Peak de Ventas Reales: 8:30 PM - 10:00 PM', 25, tempY + 18); doc.text('Día más rentable: Sábados', 25, tempY + 26); doc.text('Dispositivo Predominante: MÓVIL (82%)', 25, tempY + 34);

            // PÁGINA 4: AUDIENCIA
            doc.addPage(); doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.text('4. Audiencia & Perfil del Cliente', 20, 30);
            autoTable(doc, {
                startY: 40, head: [['Segmento', 'Distribución / Valor']],
                body: [['Clientes Nuevos', '76%'], ['Clientes Recurrentes', '24%'], ['Lifetime Value (LTV)', formatCurrency(458000)], ['Género Predominante', 'Mujeres (68%)'], ['Rango de Edad Top', '25 - 34 años (42%)'], ['Ubicación Principal', 'Bogotá, Colombia (45%)']],
                theme: 'grid', headStyles: { fillColor: [79, 70, 229] }
            });

            // PÁGINA 5: INVENTARIO
            doc.addPage(); doc.text('5. Desempeño de Productos & Inventario', 20, 30);
            autoTable(doc, {
                startY: 40, head: [['Producto', 'Ventas (30d)', 'Estado de Stock']],
                body: [['iPhone 15 Pro Max', '142', 'Saludable'], ['AirPods Pro 2', '89', 'Saludable'], ['Tabletas Purificadoras X', '12', 'CRÍTICO (3 uds)']],
                theme: 'striped', headStyles: { fillColor: [245, 158, 11] }
            });
            const alertY = (doc as any).lastAutoTable.finalY + 20; doc.setFillColor(254, 243, 199); doc.rect(15, alertY, 180, 25, 'F');
            doc.setTextColor(146, 64, 14); doc.setFontSize(10); doc.text('ALERTA PREDICTIVA: Alta probabilidad de quiebre de stock en Tabletas X para Febrero.', 20, alertY + 15);

            // PÁGINA 6: MARKETING
            doc.addPage(); doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]); doc.text('6. Marketing & Recuperación de Ventas', 20, 30);
            autoTable(doc, {
                startY: 40, head: [['Canal de Rescate', 'Impactos', 'Tasa Apertura', 'Ingresos']],
                body: [['Email Marketing', '1,240', '45%', formatCurrency(2100000)], ['WhatsApp Direct', '680', '92%', formatCurrency(3300000)], ['SMS / Push', '320', '15%', formatCurrency(0)]],
                theme: 'grid', headStyles: { fillColor: primaryColor }
            });

            // PÁGINA 7: RECOMENDACIONES
            doc.addPage(); doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]); doc.rect(0, 0, 210, 297, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.text('7. Recomendaciones Estratégicas', 20, 40);
            doc.setFontSize(12); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.text('ACCIONES INMEDIATAS POR BAYT AI:', 20, 60);
            doc.setTextColor(200, 200, 200); doc.text('1. Optimizar Checkout: Se pierde el 61% en inicio de pago.', 25, 80); doc.text('2. Inversión Ads: WhatsApp tiene ROI 3x superior al Email.', 25, 95); doc.text('3. Abastecimiento: Pedir 450 uds de Tabletas X para Febrero.', 25, 110);

            // FOOTER GLOBAL
            const totalPages = doc.internal.getNumberOfPages();
            for(let i = 1; i <= totalPages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.text(`Confidencial - Sebas Store | Bayup Business Intelligence | Página ${i} de ${totalPages}`, 20, 285); }

            doc.save(`Reporte_Estrategico_Sebas.pdf`);
            showToast("Informe de Inteligencia 360° generado ✨", "success");
        } catch (e) { showToast("Error al generar PDF", "error"); }
        finally { setIsGeneratingPDF(false); }
    };

    // --- BLOQUE 1: RESUMEN ESTRATÉGICO (LA GUÍA) ---
    const renderOverview = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-10">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl relative z-10 animate-pulse">🤖</div>
                <div className="flex-1 relative z-10 space-y-2">
                    <h3 className="text-2xl font-black tracking-tight italic">¡Hola Sebas! Soy Bayt. Analicemos tu negocio:</h3>
                    <p className="text-gray-400 text-base leading-relaxed font-medium">
                        "Tu conversión está en el <span className="text-emerald-400 font-bold">4.8%</span> (superior a la media), pero detecto una <span className="text-rose-400 font-bold">fuga del 61%</span> al iniciar el checkout. Si ajustamos los costos de envío hoy, podríamos recuperar <span className="text-white font-bold">$24.5M</span> en ventas perdidas."
                    </p>
                </div>
                <button onClick={() => setActiveTab('marketing')} className="relative z-10 px-8 py-4 bg-white text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-50 transition-all flex items-center gap-2"><Rocket size={16}/> Activar Rescate AI</button>
            </div>

            {/* BARRA DE ACTIVIDAD EN TIEMPO REAL (NUEVO) */}
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 relative">
                        <Activity size={24} className="animate-pulse" />
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monitor Live</p>
                        </div>
                        <h4 className="text-xl font-black text-gray-900">24 Usuarios <span className="text-gray-400 font-medium ml-1">navegando en tu tienda ahora</span></h4>
                    </div>
                </div>
                
                <div className="flex items-center gap-8 relative z-10">
                    <div className="text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Páginas/Min</p>
                        <p className="text-sm font-black text-gray-900">4.2</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Checkout Activo</p>
                        <p className="text-sm font-black text-purple-600">3 clientes</p>
                    </div>
                    <button className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Ver Mapa en Vivo</button>
                </div>
                {/* Micro-gráfica de fondo decorativa */}
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <BarChart3 size={120} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ingresos Totales', val: 3450000, trend: '+18.5%', up: true, help: 'Dinero real generado por ventas finalizadas.' },
                    { label: 'Ticket Promedio', val: 124000, trend: '+5.2%', up: true, help: 'Promedio de lo que gasta cada cliente.' },
                    { label: 'Pedidos Hoy', val: 42, trend: '-2.1%', up: false, help: 'Total de órdenes procesadas con éxito.' },
                    { label: 'Tasa Conversión', val: '4.8%', trend: '+0.4%', up: true, help: 'Porcentaje de visitas que terminan en compra.' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative group cursor-help transition-all hover:shadow-xl">
                        <div className="flex justify-between items-start"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><Info size={14} className="text-gray-200 group-hover:text-purple-400" /></div>
                        <div className="flex items-end gap-2 mt-2"><h3 className="text-2xl font-black text-gray-900">{typeof kpi.val === 'number' ? formatCurrency(kpi.val) : kpi.val}</h3><div className={`flex items-center text-[10px] font-black mb-1 ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</div></div>
                        <div className="absolute inset-0 bg-gray-900/95 p-8 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[2.5rem] z-20"><p className="text-white text-xs font-medium leading-relaxed">{kpi.help}</p></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-6">
                        <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><AlertCircle className="text-rose-500"/> Fuga de Capital Detectada</h4>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">Bayt ha detectado que el <span className="font-bold text-gray-900">61% de tus clientes</span> abandonan al ver el costo de envío. Sugerimos una estrategia de 'Envío Gratis' por compras superiores a $150k.</p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100"><p className="text-2xl font-black text-rose-600">{formatCurrency(24500000)}</p><p className="text-[9px] font-bold text-rose-400 uppercase mt-1">Valor en el Limbo</p></div>
                            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100"><p className="text-2xl font-black text-amber-600">128</p><p className="text-[9px] font-bold text-amber-400 uppercase mt-1">Carritos Abiertos</p></div>
                        </div>
                    </div>
                </div>
                <div className="bg-emerald-500 p-12 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between min-h-[350px] relative overflow-hidden">
                    <div className="space-y-6 relative z-10">
                        <h4 className="text-xl font-black flex items-center gap-3"><CheckCircle2 fill="white"/> Éxito de Recuperación</h4>
                        <p className="text-emerald-100 text-sm font-medium leading-relaxed">"Gracias a las automatizaciones de WhatsApp, hemos rescatado <span className="font-bold text-white">8.9 millones de pesos</span> este mes. Tu tasa de cierre es del 32%."</p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div><p className="text-4xl font-black">{formatCurrency(8900000)}</p><p className="text-[9px] font-bold text-emerald-100 uppercase mt-1">Rescatado este mes</p></div>
                            <div className="text-right"><p className="text-4xl font-black">32%</p><p className="text-[9px] font-bold text-emerald-100 uppercase mt-1">ROI: +420%</p></div>
                        </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 text-[15rem] font-black opacity-[0.05] pointer-events-none">WIN</div>
                </div>
            </div>
        </div>
    );

    // --- BLOQUE 2: RUTA DE COMPRADORES (TRÁFICO) ---
    const renderTraffic = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-12">
                    <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic">Ruta de Adquisición</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Bayt: "Tu mayor volumen viene de Instagram Ads, pero Google SEO tiene el menor rebote."</p></div>
                    <div className="space-y-8">
                        {[ { s: 'Directo', p: '36%', c: 'bg-gray-900', t: '4m 20s' }, { s: 'Instagram Ads', p: '25%', c: 'bg-purple-600', t: '1m 45s' }, { s: 'Google SEO', p: '14%', c: 'bg-blue-500', t: '3m 10s' } ].map((item, i) => (
                            <div key={i} className="space-y-3 group">
                                <div className="flex justify-between text-xs font-black uppercase tracking-tight"><span>{item.s}</span><span>{item.p} <span className="text-gray-300 ml-2">avg: {item.t}</span></span></div>
                                <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full`} /></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-center relative overflow-hidden">
                    <h4 className="text-xl font-black flex items-center gap-3 relative z-10"><Clock className="text-purple-400"/> Hora de Oro</h4>
                    <p className="text-sm font-medium text-gray-400 mt-4 leading-relaxed relative z-10 italic">
                        "Tus ventas reales se concentran entre las <span className="text-white font-bold underline">8:30 PM y las 10:00 PM</span>. No lances campañas a mediodía aunque veas más tráfico."
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase text-purple-400 relative z-10"><Monitor size={12}/> 18% Desktop <span className="text-gray-600">|</span> <Smartphone size={12}/> 82% Mobile</div>
                    <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-[0.03] rotate-12 font-black">TIME</div>
                </div>
            </div>
        </div>
    );

    const renderConversion = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-white p-16 rounded-[4rem] border border-gray-100 shadow-sm max-w-5xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500" />
                <div className="text-center space-y-4 mb-20">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tight italic mb-4">Embudo de Conversión Real</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Análisis de pérdida y retención quirúrgico</p>
                </div>
                <div className="space-y-4">
                    {[ 
                        { step: 'Sesiones Totales', val: 12450, pct: 100, loss: 0, icon: <Eye size={20}/> },
                        { step: 'Vieron Producto', val: 8420, pct: 67, loss: 33, icon: <Package size={20}/> },
                        { step: 'Agregaron al Carrito', val: 2150, pct: 17, loss: 74, icon: <ShoppingCart size={20}/> },
                        { step: 'Inicio de Checkout', val: 840, pct: 6, loss: 61, icon: <DollarSign size={20}/> },
                        { step: 'Compra Exitosa', val: 524, pct: 4.2, loss: 37, icon: <CheckCircle2 size={20}/> },
                    ].map((item, i) => (
                        <div key={i} className="group relative">
                            <div className="flex items-center gap-12 py-10 px-10 hover:bg-gray-50 transition-all rounded-[3rem] border border-transparent hover:border-gray-100">
                                <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-sm flex items-center justify-center text-purple-600 border border-gray-50">{item.icon}</div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.step}</p>
                                        <p className="text-2xl font-black text-gray-900">{item.val.toLocaleString()} <span className="text-gray-300 font-medium text-sm ml-2">{item.pct}%</span></p>
                                    </div>
                                    <div className="h-5 w-full bg-gray-50 rounded-full relative overflow-hidden shadow-inner">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} className={`h-full ${i === 4 ? 'bg-emerald-500' : 'bg-purple-600'} rounded-full`} />
                                    </div>
                                </div>
                                <div className="w-32 text-right">
                                    {item.loss > 0 ? (
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-rose-500">-{item.loss}% Fuga</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Abandono</p>
                                        </div>
                                    ) : (
                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">Base</p>
                                    )}
                                </div>
                            </div>
                            {i < 4 && <div className="flex justify-center -my-4 relative z-10"><div className="bg-white p-2.5 rounded-full border border-gray-100 text-gray-300"><ChevronDown size={20}/></div></div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // --- BLOQUE 4: PERFIL DE AUDIENCIA & EDADES ---
    const renderAudience = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 italic">Fidelización</h4>
                    <div className="relative h-64 w-64 flex items-center justify-center">
                        <div className="h-56 w-56 rounded-full border-[20px] border-purple-600 flex flex-col items-center justify-center bg-white shadow-2xl relative z-10"><p className="text-5xl font-black text-gray-900">24%</p><p className="text-[10px] font-black text-gray-400 uppercase mt-1">Recurrentes</p></div>
                        <div className="absolute -top-4 -right-4 px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl transform rotate-12"><p className="text-sm font-black italic">76% Nuevos</p></div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-10 italic leading-relaxed">"Tu LTV promedio es de <span className="text-purple-600 font-bold">$458.000</span>. Los clientes fieles compran 1.2 veces al año."</p>
                </div>

                <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-12">
                    <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic">Segmentación de Edades & Conversión</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Diferencia entre quién te ve y quién te paga.</p></div>
                    <div className="space-y-10">
                        {[
                            { range: '18 - 24 años', views: '45%', sales: '12%', color: 'bg-purple-400', tip: 'Mucho tráfico, pero buscan rebajas.' },
                            { range: '25 - 34 años', views: '38%', sales: '65%', color: 'bg-emerald-500', tip: 'Tu público objetivo real. Mayor poder adquisitivo.' },
                            { range: '35 - 44 años', views: '12%', sales: '18%', color: 'bg-blue-500', tip: 'Clientes fieles con compras recurrentes.' },
                        ].map((age, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-4 items-center gap-6 group">
                                <span className="text-sm font-black text-gray-800 uppercase tracking-tighter">{age.range}</span>
                                <div className="md:col-span-2 space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-gray-400"><span>Visitas ({age.views})</span><span>Ventas Reales ({age.sales})</span></div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full flex overflow-hidden shadow-inner">
                                        <div className="bg-gray-200 h-full border-r border-white" style={{ width: age.views }} />
                                        <div className={`${age.color} h-full`} style={{ width: age.sales }} />
                                    </div>
                                </div>
                                <p className="text-[9px] font-medium text-gray-400 italic leading-tight group-hover:text-purple-600 transition-colors">{age.tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // --- BLOQUE 5: PRODUCTOS & INVENTARIO (DETALLADO) ---
    const renderInventory = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-amber-500 p-16 rounded-[4rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl">
                <div className="h-32 w-32 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-2xl relative z-10 animate-bounce">💡</div>
                <div className="flex-1 relative z-10 space-y-6">
                    <div>
                        <h3 className="text-3xl font-black tracking-tight italic">Alerta de Suministro Inteligente</h3>
                        <p className="text-amber-100 text-lg font-medium max-w-3xl leading-relaxed mt-2">
                            "El año pasado en <span className="text-white font-black underline italic">Febrero</span>, tu producto estrella fue <span className="text-white font-black italic">Tabletas Purificadoras X</span>. Actualmente tienes solo <span className="bg-rose-600 text-white px-3 py-1 rounded-xl font-black shadow-lg animate-pulse">3 unidades</span> en stock. Bayt recomienda pedir 450 uds hoy."
                        </p>
                    </div>
                    <button onClick={() => setIsOrderModalOpen(true)} className="px-10 py-5 bg-gray-900 hover:bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95">Montar Orden de Abastecimiento</button>
                </div>
                <div className="absolute -right-20 -bottom-20 text-[25rem] font-black opacity-[0.08] rotate-12 pointer-events-none uppercase">STOCK</div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Trophy size={14} className="text-amber-500"/> Desempeño de Productos (30d)</h4>
                    <div className="space-y-6">
                        {[
                            { name: 'iPhone 15 Pro Max', sales: 142, rev: 658000000, img: '📱', status: 'Saludable' },
                            { name: 'AirPods Pro 2', sales: 89, rev: 124500000, img: '🎧', status: 'Saludable' },
                            { name: 'Cargador 20W USB-C', sales: 45, rev: 45000000, img: '⚡', status: 'Bajo (8 uds)' },
                        ].map((prod, i) => (
                            <div key={i} className="flex items-center justify-between group hover:bg-gray-50/50 p-4 rounded-3xl transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">{prod.img}</div>
                                    <div><p className="text-sm font-black text-gray-900">{prod.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{prod.sales} uds vendidas</p></div>
                                </div>
                                <div className="text-right"><p className="text-sm font-black text-emerald-600">{formatCurrency(prod.rev)}</p><span className={`text-[8px] font-black uppercase ${prod.status.includes('Bajo') ? 'text-rose-500' : 'text-emerald-500'}`}>{prod.status}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-900 p-12 rounded-[3.5rem] text-white flex flex-col justify-center relative overflow-hidden min-h-[300px]">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest relative z-10">Inteligencia Predictiva</p>
                    <h4 className="text-xl font-black mt-4 relative z-10 leading-relaxed italic">"Tus 'Fundas Silicona' tienen un 40% más de stock de lo que el sistema proyecta vender este trimestre. Sugerimos un descuento dinámico del 15%."</h4>
                    <div className="absolute right-[-20px] bottom-[-20px] text-[12rem] opacity-[0.03] rotate-12 font-black"><DollarSign size={150}/></div>
                </div>
            </div>
        </div>
    );

    // --- BLOQUE 6: MARKETING & ROI (CON DATA REAL DEL REPORTE) ---
    const renderMarketing = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="h-20 w-20 bg-purple-50 text-purple-600 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform"><Mail size={36}/></div>
                    <div><h4 className="text-3xl font-black text-gray-900">1,240</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Emails Enviados</p></div>
                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden mt-2"><div className="h-full bg-purple-600" style={{ width: '45%' }} /></div>
                    <p className="text-sm font-black text-emerald-600">{formatCurrency(2100000)} <span className="text-[8px] text-gray-400 font-bold uppercase ml-1">recuperado</span></p>
                </div>
                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:-rotate-6 transition-transform"><MessageSquare size={36}/></div>
                    <div><h4 className="text-3xl font-black text-gray-900">680</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">WhatsApp Enviados</p></div>
                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden mt-2"><div className="h-full bg-emerald-500" style={{ width: '92%' }} /></div>
                    <p className="text-sm font-black text-emerald-600">{formatCurrency(3300000)} <span className="text-[8px] text-gray-400 font-bold uppercase ml-1">recuperado</span></p>
                </div>
                <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white flex flex-col items-center gap-6 group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="h-20 w-20 bg-white/10 text-white rounded-[2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><TrendingUp size={36} className="text-emerald-400"/></div>
                    <div><h4 className="text-3xl font-black text-white">{formatCurrency(5400000)}</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">ROI Total Rescate</p></div>
                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 rotate-12 font-black">ROI</div>
                </div>
            </div>
            
            <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><Tag size={16} className="text-purple-600" /> Rendimiento de Campañas & Cupones</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50 text-left">
                        <thead><tr className="bg-white"><th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cupón</th><th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Efectividad</th><th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingresos Reales</th><th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Informe</th></tr></thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {[ { c: 'WELCOME10', e: '28%', r: 12450000, roi: '+420%' }, { c: 'PROMOVERANO', e: '42%', r: 8900000, roi: '+580%' }, { c: 'RESCATE20', e: '12%', r: 3200000, roi: '+110%' } ].map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 group transition-all">
                                    <td className="px-10 py-8 font-black text-purple-600 uppercase font-mono">{item.c}</td>
                                    <td className="px-10 py-8 text-center"><div className="flex items-center justify-center gap-2 font-black text-xs text-gray-900">{item.e} <span className="text-[8px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">{item.roi}</span></div></td>
                                    <td className="px-10 py-8 font-black text-gray-900 text-lg">{formatCurrency(item.r)}</td>
                                    <td className="px-10 py-8 text-right"><button onClick={() => setSelectedCoupon(item)} className="h-12 px-8 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl">Ver Auditoría BI</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Header Global Impactante */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative"><BarChart3 className="text-white" size={36} /><div className="absolute -top-2 -right-2 h-8 w-8 bg-purple-600 rounded-xl flex items-center justify-center text-white border-4 border-gray-50 shadow-lg animate-pulse"><Sparkles size={14} /></div></div>
                    <div><h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Estadísticas Web <span className="text-purple-600">PRO</span></h1><p className="text-gray-500 mt-1 font-medium flex items-center gap-2">Guía Estratégica de Crecimiento Bayup</p></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white p-2 rounded-3xl border border-gray-100 shadow-sm gap-4 px-6 h-16"><Calendar size={18} className="text-purple-600" /><div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Periodo</span><span className="text-xs font-black text-gray-900 uppercase">Últimos 30 Días</span></div><ChevronDown size={16} className="text-gray-300" /></div>
                    <button onClick={handleDownloadReport} disabled={isGeneratingPDF} className="h-16 bg-gray-900 hover:bg-black text-white px-8 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3 border border-white/10 disabled:opacity-50">{isGeneratingPDF ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />} Descargar Reporte</button>
                </div>
            </div>

            {/* Navegación Quirúrgica */}
            <div className="flex items-center justify-center pt-4">
                <div className="flex bg-white/50 backdrop-blur-2xl p-2.5 rounded-[3rem] border border-gray-100 shadow-2xl gap-3 w-full max-w-6xl overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'overview', label: 'Resumen Estratégico', icon: <PieChart size={16}/> },
                        { id: 'traffic', label: 'Ruta de Compradores', icon: <Globe size={16}/> },
                        { id: 'conversion', label: 'Ventas & Embudo', icon: <Target size={16}/> },
                        { id: 'audience', label: 'Perfil de Audiencia', icon: <Users size={16}/> },
                        { id: 'inventory', label: 'Stock Inteligente', icon: <Package size={16}/> },
                        { id: 'marketing', label: 'Marketing & ROI', icon: <Rocket size={16}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-2xl scale-[1.02] -translate-y-1' : 'text-gray-400 hover:text-gray-600 hover:bg-white/80'}`}>{tab.icon} {tab.label}</button>
                    ))}
                </div>
            </div>

            {/* Contenido Dinámico */}
            <div className="min-h-[600px] relative">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'traffic' && renderTraffic()}
                        {activeTab === 'conversion' && renderConversion()}
                        {activeTab === 'audience' && renderAudience()}
                        {activeTab === 'inventory' && renderInventory()}
                        {activeTab === 'marketing' && renderMarketing()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* MODAL AUDITORÍA DE CUPÓN (BI) */}
            <AnimatePresence>
                {selectedCoupon && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col">
                            <div className="bg-gray-900 p-10 text-white relative flex-shrink-0">
                                <button onClick={() => setSelectedCoupon(null)} className="absolute top-8 right-8 h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={24} /></button>
                                <div className="flex items-center gap-6"><div className="h-16 w-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-lg"><Tag size={32} /></div><div><h2 className="text-3xl font-black tracking-tight">{selectedCoupon.c}</h2><p className="text-purple-400 text-[10px] font-black uppercase mt-1">Informe de Conversión Inteligente</p></div></div>
                            </div>
                            <div className="p-12 space-y-10 bg-gray-50/30 overflow-y-auto max-h-[65vh] custom-scrollbar">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-end"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auditoría de Uso</p><p className="text-sm font-black text-gray-900">142 <span className="text-gray-300">/ 500 meta</span></p></div>
                                    <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '28%' }} className="h-full bg-purple-600 rounded-full" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingresos Totales</p><h4 className="text-3xl font-black text-emerald-600 mt-2">{formatCurrency(selectedCoupon.r)}</h4></div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atribución de Público</p><div className="flex items-center gap-4 mt-2"><div className="text-center flex-1"><p className="text-xl font-black text-purple-600">65%</p><p className="text-[8px] font-bold text-gray-400 uppercase">Nuevos</p></div><div className="w-px h-8 bg-gray-100"></div><div className="text-center flex-1"><p className="text-xl font-black text-emerald-500">35%</p><p className="text-[8px] font-bold text-gray-400 uppercase">Fieles</p></div></div></div>
                                </div>
                                <div className="bg-gray-900 p-8 rounded-[3.5rem] text-white space-y-6 relative overflow-hidden shadow-2xl">
                                    <div className="flex justify-between items-start relative z-10"><div><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">ROI de Campaña</p><h3 className="text-5xl font-black text-white">{selectedCoupon.roi}</h3></div><div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-purple-400 border border-white/5"><Sparkles size={28}/></div></div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 relative z-10"><p className="text-sm font-medium text-gray-300 leading-relaxed italic">"Este cupón es excepcional para captar tráfico nuevo. Sugiero activarlo automáticamente en el checkout para usuarios que duden más de 2 min."</p></div>
                                    <div className="absolute -right-10 -bottom-10 text-[15rem] font-black opacity-[0.03] rotate-12 uppercase pointer-events-none">ROI</div>
                                </div>
                            </div>
                            <div className="p-10 bg-white border-t border-gray-50"><button onClick={() => setSelectedCoupon(null)} className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl transition-all active:scale-95">Cerrar Informe de Inteligencia</button></div>
                        </motion.div>
                    </div>
                )}

                {/* MODAL DE ORDEN DE COMPRA (INVENTARIO) */}
                {isOrderModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col">
                            <div className="bg-gray-900 p-10 text-white relative">
                                <button onClick={() => setIsOrderModalOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={24} /></button>
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center shadow-lg"><ShoppingCart size={32} /></div>
                                    <h2 className="text-2xl font-black tracking-tight">Orden de Compra</h2>
                                </div>
                            </div>
                            <div className="p-12 space-y-10">
                                <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-4 border border-gray-100">
                                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase">Producto</span><span className="text-sm font-black text-gray-900">{orderForm.productName}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase">Unidades</span><span className="text-sm font-black text-purple-600">450 uds</span></div>
                                </div>
                                <div className="space-y-4 relative">
                                    <div className="flex justify-between items-end px-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</label><button onClick={() => setIsRegisterProviderOpen(true)} className="text-[9px] font-black text-purple-600 uppercase underline">+ Registrar Nuevo</button></div>
                                    <button onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)} className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl text-sm font-black flex justify-between items-center shadow-sm">{orderForm.provider || 'Selecciona un aliado...'}<ChevronDown size={20}/></button>
                                    <AnimatePresence>
                                        {isProviderDropdownOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[600] max-h-48 overflow-y-auto">
                                                {providers.map(p => (
                                                    <button key={p.id} onClick={() => { setOrderForm({...orderForm, provider: p.name}); setIsProviderDropdownOpen(false); }} className="w-full px-6 py-4 text-left hover:bg-purple-50 text-xs font-black uppercase">{p.name}</button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button onClick={handleConfirmOrder} className="w-full py-6 bg-gray-900 hover:bg-black text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                    {isSubmittingOrder ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={20} />}
                                    Confirmar Abastecimiento
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* MODAL REGISTRO PROVEEDOR QUICK */}
                {isRegisterProviderOpen && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20">
                            <div className="bg-gray-900 p-8 text-white"><h2 className="text-xl font-black tracking-tight flex items-center gap-3"><Users size={20}/> Nuevo Proveedor</h2></div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Nombre Comercial</label><input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner" placeholder="Ej: Distribuidora Tech S.A." /></div>
                                <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase ml-1">WhatsApp</label><input value={newProvider.phone} onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner" placeholder="+57 300 000 0000" /></div>
                            </div>
                            <div className="p-8 bg-gray-50 flex gap-4"><button onClick={() => setIsRegisterProviderOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button><button onClick={handleCreateProvider} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all">Registrar Proveedor</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Banner Final de IA Predictiva */}
            <div className="bg-gradient-to-r from-gray-900 via-purple-950 to-indigo-950 rounded-[4rem] p-16 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl border border-white/5">
                <div className="h-32 w-32 bg-purple-600 rounded-[2.5rem] flex items-center justify-center text-7xl relative z-10 animate-pulse border-4 border-white/10 shadow-2xl">🤖</div>
                <div className="flex-1 relative z-10 space-y-6">
                    <div className="flex items-center gap-4"><span className="px-4 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-purple-500/30">Análisis Predictivo Bayup</span><div className="h-px flex-1 bg-white/10" /></div>
                    <h3 className="text-4xl font-black tracking-tight leading-tight max-w-4xl">"Tu conversión móvil ha bajado un 12% porque la página de pago tarda 3 segundos más en cargar para usuarios de Android."</h3>
                    <div className="flex gap-6 pt-4"><button className="px-10 py-5 bg-white text-gray-900 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-purple-50 transition-all flex items-center gap-3 shadow-xl">Optimizar Imágenes Ahora</button></div>
                </div>
                <div className="absolute -right-20 -bottom-20 text-[30rem] font-black opacity-[0.03] rotate-12 pointer-events-none uppercase">BAYT</div>
            </div>
        </div>
    );
}
