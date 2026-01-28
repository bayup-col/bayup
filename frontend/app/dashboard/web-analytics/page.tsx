"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Zap, Eye, MousePointer2, DollarSign, Activity, Users, Globe, Clock, 
  ShoppingCart, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Monitor, Smartphone, Search, 
  PieChart, BarChart3, Calendar, Layers, Sparkles, ChevronDown, Timer, ExternalLink, MessageSquare, 
  Mail, Share2, Download, Rocket, Trophy, ChevronRight, CheckCircle2, X, ArrowRight, Tag, AlertCircle,
  ZapIcon, Bot, Lightbulb, Info, HelpCircle, Radar
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

    const handleDownloadReport = async () => {
        setIsGeneratingPDF(true);
        try {
            const doc = new jsPDF();
            doc.setFillColor(17, 24, 39); doc.rect(0, 0, 210, 297, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(50); doc.setFont('helvetica', 'bold'); doc.text('BAYUP', 20, 70);
            doc.setFontSize(22); doc.setTextColor(147, 51, 234); doc.text('AUDITORÍA ESTRATÉGICA 360', 20, 90);
            doc.save(`Auditoria_BI_Sebas.pdf`);
            showToast("Informe descargado ✨", "success");
        } finally { setIsGeneratingPDF(false); }
    };

    const handleCreateProvider = async () => {
        if (!newProvider.name) return showToast("Nombre obligatorio", "error");
        try {
            const res = await fetch('http://localhost:8000/providers', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(newProvider) });
            if (res.ok) { showToast("Proveedor registrado", "success"); await fetchProviders(); setIsRegisterProviderOpen(false); }
        } catch (e) { showToast("Error", "error"); }
    };

    // --- RENDERS DETALLADOS ---

    const renderOverview = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-10">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl relative z-10 animate-pulse border-4 border-white/10">🤖</div>
                <div className="flex-1 relative z-10 space-y-2">
                    <h3 className="text-2xl font-black tracking-tight italic">¡Hola Sebas! Soy Bayt. Analicemos tu negocio:</h3>
                    <p className="text-gray-400 text-base leading-relaxed font-medium">"Tu conversión está en el <span className="text-emerald-400 font-bold">4.8%</span>, pero detecto una <span className="text-rose-400 font-bold">fuga del 61%</span> al iniciar el checkout. Si ajustamos los costos de envío hoy, podríamos recuperar <span className="text-white font-bold">$24.5M</span>."</p>
                </div>
                <button onClick={() => setActiveTab('marketing')} className="relative z-10 px-8 py-4 bg-white text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-50 transition-all flex items-center gap-2 shadow-xl"><Rocket size={16}/> Activar Rescate AI</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ventas Hoy', val: 3450000, trend: '+18.5%', up: true, h: 'Dinero real generado hoy.' },
                    { label: 'Ticket Promedio', val: 124000, trend: '+5.2%', up: true, h: 'Gasto promedio por cliente.' },
                    { label: 'Pedidos Hoy', val: 42, trend: '-2.1%', up: false, h: 'Órdenes procesadas hoy.' },
                    { label: 'Tasa Conversión', val: '4.8%', trend: '+0.4%', up: true, h: 'Visitas que terminan en compra.' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative group cursor-help transition-all hover:shadow-xl">
                        <div className="flex justify-between items-start"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><Info size={14} className="text-gray-200 group-hover:text-purple-400" /></div>
                        <div className="flex items-end gap-2 mt-2"><h3 className="text-2xl font-black text-gray-900">{typeof kpi.val === 'number' ? formatCurrency(kpi.val) : kpi.val}</h3><div className={`flex items-center text-[10px] font-black mb-1 ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</div></div>
                        <div className="absolute inset-0 bg-gray-900/95 p-8 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[2.5rem] z-20"><p className="text-white text-xs font-medium leading-relaxed">{kpi.h}</p></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-6">
                        <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><AlertCircle className="text-rose-500"/> Fuga de Capital Detectada</h4>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">El <span className="font-bold text-gray-900">61% de tus clientes</span> abandonan al ver el costo de envío. Sugerimos una estrategia de 'Envío Gratis' por compras superiores a $150k.</p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100"><p className="text-2xl font-black text-rose-600">{formatCurrency(24500000)}</p><p className="text-[9px] font-bold text-rose-400 uppercase mt-1">Valor Perdido</p></div>
                            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100"><p className="text-2xl font-black text-amber-600">128</p><p className="text-[9px] font-bold text-amber-400 uppercase mt-1">Abandonos</p></div>
                        </div>
                    </div>
                </div>
                <div className="bg-emerald-500 p-12 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between min-h-[350px] relative overflow-hidden">
                    <div className="space-y-6 relative z-10">
                        <h4 className="text-xl font-black flex items-center gap-3"><CheckCircle2 fill="white"/> Éxito de Recuperación</h4>
                        <p className="text-emerald-100 text-sm font-medium leading-relaxed">"Gracias a las automatizaciones de WhatsApp, hemos rescatado <span className="font-bold text-white">8.9 millones de pesos</span> este mes. Tu tasa de cierre es del 32%."</p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div><p className="text-4xl font-black">{formatCurrency(8900000)}</p><p className="text-[9px] font-bold text-emerald-100 uppercase mt-1">Rescatado hoy</p></div>
                            <div className="text-right"><p className="text-4xl font-black">32%</p><p className="text-[9px] font-bold text-emerald-100 uppercase mt-1">ROI: +420%</p></div>
                        </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 text-[15rem] font-black opacity-[0.05] pointer-events-none">WIN</div>
                </div>
            </div>
        </div>
    );

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
                <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-center relative overflow-hidden"><h4 className="text-xl font-black flex items-center gap-3 relative z-10"><Clock className="text-purple-400"/> Hora de Oro</h4><p className="text-sm font-medium text-gray-400 mt-4 leading-relaxed relative z-10 italic">"Tus ventas reales se concentran entre las <span className="text-white font-bold underline">8:30 PM y las 10:00 PM</span>. No lances campañas a mediodía."</p><div className="absolute -right-10 -bottom-10 text-[12rem] opacity-[0.03] rotate-12 font-black pointer-events-none">TIME</div></div>
            </div>
        </div>
    );

    const renderConversion = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-white p-16 rounded-[4rem] border border-gray-100 shadow-sm max-w-5xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500" />
                <h3 className="text-center text-4xl font-black text-gray-900 tracking-tight italic mb-20">Embudo de Conversión Real</h3>
                <div className="space-y-4">
                    {[ { step: 'Sesiones Totales', val: 12450, pct: 100, loss: 0 }, { step: 'Vieron Producto', val: 8420, pct: 67, loss: 33 }, { step: 'Agregaron Carrito', val: 2150, pct: 17, loss: 74 }, { step: 'Compra Finalizada', val: 524, pct: 4.2, loss: 37 } ].map((item, i) => (
                        <div key={i} className="group relative">
                            <div className="flex items-center gap-12 py-10 px-10 hover:bg-gray-50 transition-all rounded-[3rem] border border-transparent hover:border-gray-100">
                                <div className="w-16 h-16 bg-white border border-gray-50 rounded-[1.5rem] flex items-center justify-center text-purple-600 font-black shadow-sm">{i+1}</div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between font-black uppercase text-[10px] text-gray-400"><span>{item.step}</span><span>{item.val.toLocaleString()} <span className="text-gray-300 ml-2">{item.pct}%</span></span></div>
                                    <div className="h-5 bg-gray-50 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} className={`h-full ${i === 3 ? 'bg-emerald-500' : 'bg-purple-600'} rounded-full`} /></div>
                                </div>
                                <div className="w-32 text-right">{item.loss > 0 ? <p className="text-sm font-black text-rose-500">-{item.loss}% Fuga</p> : <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">Base</p>}</div>
                            </div>
                            {i < 3 && <div className="flex justify-center -my-4 relative z-10"><div className="bg-white p-2.5 rounded-full border border-gray-100 text-gray-300"><ChevronDown size={20}/></div></div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAudience = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 italic">Fidelización</h4>
                    <div className="relative h-64 w-64 flex items-center justify-center">
                        <div className="h-56 w-56 rounded-full border-[20px] border-purple-600 flex flex-col items-center justify-center bg-white shadow-2xl relative z-10"><p className="text-5xl font-black text-gray-900">24%</p><p className="text-[10px] font-black text-gray-400 uppercase mt-1">Recurrentes</p></div>
                        <div className="absolute -top-4 -right-4 px-6 py-3 bg-gray-900 text-white rounded-2xl transform rotate-12 shadow-2xl"><p className="text-sm font-black italic">76% Nuevos</p></div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-10 leading-relaxed">"Tu LTV promedio es de <span className="text-purple-600 font-bold">$458.000</span>. Los clientes fieles compran 1.2 veces al año."</p>
                </div>

                <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-12">
                    <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic">Edad & Conversión</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Diferencia entre quién te ve y quién te paga.</p></div>
                    <div className="space-y-10">
                        {[
                            { range: '18 - 24 años', views: '45%', sales: '12%', color: 'bg-purple-400', tip: 'Mucho tráfico, baja conversión.' },
                            { range: '25 - 34 años', views: '38%', sales: '65%', color: 'bg-emerald-500', tip: 'Tu público objetivo real. Mayor poder de compra.' },
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

    const renderInventory = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-amber-500 p-16 rounded-[4rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl">
                <div className="h-32 w-32 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-2xl relative z-10 animate-bounce border border-white/30 backdrop-blur-md">💡</div>
                <div className="flex-1 relative z-10 space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">Bayt Stock Intelligence</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                        </div>
                        <h3 className="text-3xl font-black tracking-tight italic">Alerta de Suministro Inteligente</h3>
                        <p className="text-amber-100 text-lg font-medium max-w-3xl leading-relaxed mt-2">
                            "En <span className="text-white font-black underline italic">Febrero del año pasado</span>, tu producto estrella fue <span className="text-white font-black italic">Tabletas Purificadoras X</span>. Actualmente tienes solo <span className="bg-rose-600 text-white px-3 py-1 rounded-xl font-black shadow-lg animate-pulse">3 unidades</span> en stock. Bayt recomienda pedir 450 uds hoy."
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsOrderModalOpen(true)} className="px-10 py-5 bg-gray-900 hover:bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-2 border border-white/10">
                            <ShoppingCart size={16}/> Montar Orden
                        </button>
                        <button onClick={() => setIsProductHistoryModalOpen(true)} className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/30 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2">
                            <Activity size={16}/> Historial
                        </button>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 text-[25rem] font-black opacity-[0.08] rotate-12 pointer-events-none uppercase">STOCK</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Trophy size={14} className="text-amber-500"/> Top Ventas (30d)</h4>
                    <div className="space-y-6">
                        {[ { name: 'iPhone 15 Pro Max', sales: 142, rev: 658000000, img: '📱', status: 'Saludable' }, { name: 'AirPods Pro 2', sales: 89, rev: 124500000, img: '🎧', status: 'Saludable' }, { name: 'Cargador 20W USB-C', sales: 45, rev: 45000000, img: '⚡', status: 'Bajo (8 uds)' } ].map((prod, i) => (
                            <div key={i} className="flex items-center justify-between group hover:bg-gray-50/50 p-4 rounded-3xl transition-all">
                                <div className="flex items-center gap-6"><div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">{prod.img}</div><div><p className="text-sm font-black text-gray-900">{prod.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{prod.sales} uds vendidas</p></div></div>
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
                                    <td className="px-10 py-8 text-right"><button onClick={() => setSelectedCoupon(item)} className="h-12 px-8 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl">Ver Campaña</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header Global */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative"><BarChart3 className="text-white" size={36} /><div className="absolute -top-2 -right-2 h-8 w-8 bg-purple-600 rounded-xl flex items-center justify-center text-white border-4 border-gray-50 shadow-lg animate-pulse"><Sparkles size={14} /></div></div>
                    <div><h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Estadísticas Web <span className="text-purple-600">PRO</span></h1><p className="text-gray-500 mt-1 font-medium">Guía Estratégica Bayup</p></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white p-2 rounded-3xl border border-gray-100 shadow-sm h-16 px-6"><Calendar size={18} className="text-purple-600 mr-4" /><div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase">Periodo</span><span className="text-xs font-black text-gray-900 uppercase">Últimos 30 Días</span></div><ChevronDown size={16} className="text-gray-300 ml-4" /></div>
                    <button onClick={handleDownloadReport} disabled={isGeneratingPDF} className="h-16 bg-gray-900 text-white px-8 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border border-white/10 disabled:opacity-50">{isGeneratingPDF ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />} Reporte</button>
                </div>
            </div>

            {/* BARRA DE ACTIVIDAD LIVE SLIM (FIJA) */}
            <div className="bg-white rounded-[2rem] p-5 border border-emerald-50 shadow-xl flex items-center justify-between gap-8 relative overflow-hidden transition-all hover:border-emerald-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 relative">
                        <Activity size={24} className="animate-pulse" />
                        <div className="absolute top-1 right-1 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span><p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em]">Radar Live</p></div>
                        <h4 className="text-xl font-black text-gray-900 tracking-tight">24 Clientes <span className="text-gray-400 font-medium text-sm ml-1">en línea ahora mismo</span></h4>
                    </div>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className="text-center"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Navegación</p><p className="text-sm font-black text-gray-900">4.2 pág/min</p></div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="text-center"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">En Checkout</p><p className="text-sm font-black text-purple-600">3 activos</p></div>
                    <button className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">Radar Global <Radar size={12} className="animate-spin-slow" /></button>
                </div>
            </div>

            {/* Navegación Quirúrgica */}
            <div className="flex items-center justify-center pt-2">
                <div className="flex bg-white/50 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-gray-100 shadow-xl gap-2 w-full max-w-6xl overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'overview', label: 'Resumen Estratégico', icon: <PieChart size={16}/> },
                        { id: 'traffic', label: 'Ruta de Compradores', icon: <Globe size={16}/> },
                        { id: 'conversion', label: 'Ventas & Embudo', icon: <Target size={16}/> },
                        { id: 'audience', label: 'Perfil de Audiencia', icon: <Users size={16}/> },
                        { id: 'inventory', label: 'Stock Inteligente', icon: <Package size={16}/> },
                        { id: 'marketing', label: 'Marketing & ROI', icon: <Rocket size={16}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-2xl scale-[1.02] -translate-y-1' : 'text-gray-400 hover:text-gray-600 hover:bg-white/80'}`}>{tab.icon} {tab.label}</button>
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

            {/* MODALES PRO */}
            <AnimatePresence>
                {selectedCoupon && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col max-h-[90vh]">
                            {/* Cabecera Premium */}
                            <div className="bg-gray-900 p-8 text-white relative flex-shrink-0 overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                                    <Tag size={200} />
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedCoupon(null);
                                    }} 
                                    className="absolute top-8 right-8 h-12 w-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all active:scale-90 z-[100] group/close"
                                >
                                    <X size={24} className="text-white group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                                <div className="relative z-10 flex items-center gap-8">
                                    <div className="h-20 w-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-[1.8rem] flex items-center justify-center shadow-2xl border-2 border-white/10">
                                        <Tag size={36} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-4xl font-black tracking-tighter uppercase italic">{selectedCoupon.c}</h2>
                                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">Campaña Activa</span>
                                        </div>
                                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                            <Calendar size={12} className="text-purple-500" /> Rendimiento Estratégico Detallado
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cuerpo con Scroll */}
                            <div className="p-10 space-y-10 bg-gray-50/50 overflow-y-auto custom-scrollbar flex-1">
                                
                                {/* KPIs de Impacto Inmediato */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Ingresos Reales', val: formatCurrency(selectedCoupon.r), icon: <DollarSign size={14}/>, color: 'text-emerald-600' },
                                        { label: 'Uso de Cupón', val: '452 / 1.000', icon: <Activity size={14}/>, color: 'text-purple-600' },
                                        { label: 'Ticket Promedio', val: formatCurrency(158400), icon: <ShoppingCart size={14}/>, color: 'text-blue-600' },
                                        { label: 'Rentabilidad (ROI)', val: selectedCoupon.roi, icon: <TrendingUp size={14}/>, color: 'text-emerald-500' },
                                    ].map((kpi, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                                {kpi.icon} {kpi.label}
                                            </div>
                                            <h4 className={`text-xl font-black ${kpi.color} group-hover:scale-105 transition-transform origin-left`}>{kpi.val}</h4>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Perfil Demográfico y Género */}
                                    <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                                <Users size={16} className="text-purple-600" /> Perfil de Audiencia
                                            </h4>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg">65% Nuevos</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg">35% Fieles</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {/* Género */}
                                            <div className="space-y-6">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-50 pb-2">Distribución de Género</p>
                                                <div className="space-y-4">
                                                    {[ { g: 'Mujeres', p: '68%', c: 'bg-rose-400' }, { g: 'Hombres', p: '28%', c: 'bg-blue-400' }, { g: 'Otros', p: '4%', c: 'bg-gray-300' } ].map((item, i) => (
                                                        <div key={i} className="space-y-2">
                                                            <div className="flex justify-between text-[10px] font-black uppercase"><span>{item.g}</span><span>{item.p}</span></div>
                                                            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                                                <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full`} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Edad */}
                                            <div className="space-y-6">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-50 pb-2">Rango de Edad</p>
                                                <div className="space-y-4">
                                                    {[ { r: '18-24', p: '45%', c: 'bg-purple-600' }, { r: '25-34', p: '38%', c: 'bg-purple-400' }, { r: '35+', p: '17%', c: 'bg-purple-200' } ].map((item, i) => (
                                                        <div key={i} className="space-y-2">
                                                            <div className="flex justify-between text-[10px] font-black uppercase"><span>{item.r} años</span><span>{item.p}</span></div>
                                                            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                                                <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full`} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dispositivo y Canal */}
                                    <div className="bg-gray-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 font-black uppercase pointer-events-none">TECH</div>
                                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Tecnología & Origen</h4>
                                        <div className="space-y-10">
                                            {/* Dispositivos */}
                                            <div className="flex justify-around items-center">
                                                <div className="text-center group">
                                                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-purple-600 transition-colors">
                                                        <Smartphone size={24} />
                                                    </div>
                                                    <p className="text-lg font-black mt-2">82%</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Móvil</p>
                                                </div>
                                                <div className="text-center group">
                                                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-blue-600 transition-colors">
                                                        <Monitor size={24} />
                                                    </div>
                                                    <p className="text-lg font-black mt-2">18%</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">PC / Tablet</p>
                                                </div>
                                            </div>
                                            {/* Canales */}
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">Canales de Llegada</p>
                                                <div className="space-y-3">
                                                    {[ 
                                                        { s: 'Instagram', p: '55%', i: <Share2 size={10}/> },
                                                        { s: 'WhatsApp', p: '25%', i: <MessageSquare size={10}/> },
                                                        { s: 'Facebook', p: '15%', i: <Globe size={10}/> },
                                                        { s: 'Otros', p: '5%', i: <Search size={10}/> } 
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <span className="w-16 text-[9px] font-bold text-gray-400 uppercase">{item.s}</span>
                                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-400" style={{ width: item.p }} />
                                                            </div>
                                                            <span className="w-8 text-[9px] font-black text-emerald-400 text-right">{item.p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comportamiento Temporal */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Picos Horarios */}
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                            <Clock size={16} className="text-amber-500" /> Picos de Actividad
                                        </h4>
                                        <div className="flex items-end justify-between h-40 pt-4 gap-2">
                                            {[ 20, 35, 25, 60, 95, 80, 45, 30 ].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="w-full bg-gray-50 rounded-t-xl relative overflow-hidden flex items-end h-full">
                                                        <motion.div 
                                                            initial={{ height: 0 }} 
                                                            animate={{ height: `${h}%` }} 
                                                            className={`w-full ${h > 80 ? 'bg-amber-500' : 'bg-gray-200'} group-hover:bg-purple-600 transition-colors`}
                                                        />
                                                    </div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase">
                                                        {['08h', '10h', '12h', '14h', '18h', '20h', '22h', '00h'][i]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium italic text-center">"La conversión máxima ocurre a las <span className="font-bold text-gray-900">8:45 PM</span> los días de semana."</p>
                                    </div>

                                    {/* Geografía y Días */}
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm grid grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-2">
                                                <Globe size={12} className="text-blue-500"/> Geografía
                                            </h4>
                                            <div className="space-y-4">
                                                {[ { l: 'Bogotá', p: '42%' }, { l: 'Medellín', p: '28%' }, { l: 'Cali', p: '12%' }, { l: 'Otras', p: '18%' } ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center group">
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase">{item.l}</span>
                                                        <span className="text-[10px] font-black text-gray-900">{item.p}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-2">
                                                <Calendar size={12} className="text-emerald-500"/> Días Top
                                            </h4>
                                            <div className="space-y-4">
                                                {[ { d: 'Sábados', p: '35%' }, { d: 'Viernes', p: '25%' }, { d: 'Domingos', p: '20%' }, { d: 'Otros', p: '20%' } ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center group">
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase">{item.d}</span>
                                                        <span className="text-[10px] font-black text-gray-900">{item.p}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resumen Estratégico Bayt */}
                                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                                        <Bot size={120} />
                                    </div>
                                    <div className="relative z-10 flex items-start gap-8">
                                        <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-xl">🤖</div>
                                        <div className="flex-1 space-y-4">
                                            <h4 className="text-xl font-black italic tracking-tight">Análisis Estratégico de Campaña</h4>
                                            <p className="text-purple-50 text-sm font-medium leading-relaxed max-w-2xl">
                                                "Esta campaña ha sido altamente efectiva para atraer a un público joven (<span className="text-white font-bold">18-24 años</span>) mayoritariamente <span className="text-white font-bold">femenino</span>. El rendimiento en dispositivos móviles es superior a la media, sugiriendo que el contenido compartido fue optimizado para vertical. Se recomienda extender la vigencia por 15 días más dada la alta rentabilidad detectada."
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            
                            {/* Botón de Cierre */}
                            <div className="p-8 bg-white border-t border-gray-100 flex gap-4 flex-shrink-0">
                                <button onClick={() => setSelectedCoupon(null)} className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                    Cerrar Análisis de Campaña <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {isProductHistoryModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col max-h-[90vh]">
                            <div className="bg-gray-900 p-8 text-white relative flex-shrink-0 overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                                    <Activity size={180} />
                                </div>
                                <button onClick={() => setIsProductHistoryModalOpen(false)} className="absolute top-8 right-8 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all z-10">
                                    <X size={20} />
                                </button>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="h-16 w-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-white/10">
                                        💡
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight uppercase italic">Tabletas Purificadoras X</h2>
                                        <p className="text-amber-400 text-[10px] font-black uppercase mt-1 tracking-widest">Historial Estratégico de Rendimiento</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-8 bg-gray-50/50 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Ventas (Feb Pasado)', val: '1.240 uds', icon: <Package size={14}/>, color: 'text-gray-900' },
                                        { label: 'Ingresos Netos', val: formatCurrency(32240000), icon: <DollarSign size={14}/>, color: 'text-emerald-600' },
                                        { label: 'Nuevos Clientes', val: '185', icon: <Users size={14}/>, color: 'text-blue-600' },
                                        { label: 'Tasa Conversión', val: '8.4%', icon: <Target size={14}/>, color: 'text-purple-600' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                {stat.icon} {stat.label}
                                            </p>
                                            <p className={`text-xl font-black ${stat.color}`}>{stat.val}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4">Argumentación de Bayt AI</h4>
                                        <div className="space-y-4">
                                            {[
                                                "Estacionalidad confirmada: Febrero representa el 22% de tus ventas anuales de este producto.",
                                                "Adquisición de clientes: Este producto tiene un 40% más de probabilidad de atraer clientes nuevos que el resto del catálogo.",
                                                "Rentabilidad: El margen neto por unidad es del 45% tras costos logísticos.",
                                                "Fuga evitable: Perdiste aprox. $12M el año pasado por rotura de stock en la tercera semana de febrero."
                                            ].map((text, i) => (
                                                <div key={i} className="flex gap-4 items-start">
                                                    <div className="h-5 w-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                        <CheckCircle2 size={12}/>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">{text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-900 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <TrendingUp size={120} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-4">Proyección de Venta (Feb 2026)</p>
                                            <h4 className="text-3xl font-black italic tracking-tight">+$45.800.000</h4>
                                            <p className="text-gray-400 text-xs mt-2 font-medium">Potencial de ingresos si se mantiene el stock recomendado.</p>
                                        </div>
                                        <div className="pt-6 border-t border-white/10 flex items-center gap-4">
                                            <div className="h-10 w-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                                                <Bot size={20} />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-300 italic uppercase">Recomendación: Compra prioritaria de 450 unidades.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-white border-t border-gray-100 flex gap-4 flex-shrink-0">
                                <button onClick={() => setIsProductHistoryModalOpen(false)} className="px-10 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-colors">
                                    Cerrar
                                </button>
                                <button onClick={() => { setIsProductHistoryModalOpen(false); setIsOrderModalOpen(true); }} className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                                    Proceder con la Orden
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                                {isOrderModalOpen && (
                                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col max-h-[90vh]">
                                            <div className="bg-gray-900 p-8 text-white flex-shrink-0 relative"><button onClick={() => setIsOrderModalOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={20} /></button><div className="flex items-center gap-4"><div className="h-14 w-14 bg-amber-500 rounded-[1.5rem] flex items-center justify-center shadow-lg"><ShoppingCart size={28} /></div><div><h2 className="text-2xl font-black tracking-tight">Orden de Compra</h2><p className="text-amber-400 text-[10px] font-black uppercase mt-1">Bayt Sugerencia</p></div></div></div><div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/30 custom-scrollbar"><div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6"><div className="flex justify-between items-center pb-4 border-b border-gray-50"><span className="text-[10px] font-black uppercase text-gray-400">Producto</span><span className="text-sm font-black text-gray-900">{orderForm.productName}</span></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">Unidades</label><input type="text" value={formatNumber(orderForm.quantity)} onChange={(e) => setOrderForm({ ...orderForm, quantity: unformatNumber(e.target.value) })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold shadow-inner" /></div><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">Total</label><div className="w-full p-4 bg-gray-100 rounded-2xl font-black text-gray-500">{formatCurrency(orderForm.quantity * orderForm.pricePerUnit)}</div></div></div></div>                            <div className="space-y-4 relative">
                                <div className="flex justify-between items-end px-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</label>
                                    <button onClick={() => setIsRegisterProviderOpen(true)} className="text-[9px] font-black text-purple-600 uppercase underline">+ Registrar Nuevo</button>
                                </div>
                                <button onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)} className="w-full p-5 bg-white border border-gray-100 rounded-3xl text-sm font-black flex justify-between items-center shadow-sm">
                                    {orderForm.provider || 'Selecciona un aliado...'}
                                    <ChevronDown size={16} />
                                </button>
                                <AnimatePresence>
                                    {isProviderDropdownOpen && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[600] max-h-48 overflow-y-auto">
                                            {providers.map((p) => (
                                                <button key={p.id} onClick={() => { setOrderForm({ ...orderForm, provider: p.name }); setIsProviderDropdownOpen(false); }} className="w-full px-6 py-4 text-left hover:bg-purple-50 transition-colors flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase text-gray-700">{p.name}</span>
                                                    {orderForm.provider === p.name && <CheckCircle2 size={14} className="text-purple-600" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Nuevo campo de Notas / Descripción */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instrucciones o Notas del Pedido</label>
                                <textarea 
                                    value={orderForm.notes} 
                                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                    placeholder="Ej: Por favor incluir factura comercial, tallas surtidas según inventario anterior..."
                                    rows={3}
                                    className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] outline-none text-sm font-medium shadow-sm focus:border-purple-200 transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-6 pt-6 border-t border-gray-100">
<div className="grid grid-cols-3 gap-4">{[{ id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={18}/> }, { id: 'email', label: 'Email', icon: <Mail size={18}/> }, { id: 'reminder', label: 'Programar', icon: <Clock size={18}/> }].map((method) => (<div key={method.id} onClick={() => setOrderForm({ ...orderForm, sending_method: method.id as any })} className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${orderForm.sending_method === method.id ? 'bg-purple-50 border-purple-600 shadow-md' : 'bg-white border-gray-100 opacity-60'}`}><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${orderForm.sending_method === method.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{method.icon}</div><span className="text-[9px] font-black uppercase">{method.label}</span></div>))}</div></div></div><div className="p-8 bg-white border-t border-gray-50 flex gap-4"><button onClick={() => setIsOrderModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button><button onClick={handleConfirmOrder} disabled={isSubmittingOrder} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] active:scale-95 transition-all">{isSubmittingOrder ? 'Cargando...' : 'Confirmar Pedido'}</button></div></motion.div></div>
                )}
                {isRegisterProviderOpen && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20"><div className="bg-gray-900 p-8 text-white"><h2 className="text-xl font-black tracking-tight flex items-center gap-3"><Users size={20}/> Nuevo Proveedor</h2></div><div className="p-10 space-y-6"><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Nombre Comercial</label><input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" placeholder="Ej: Distribuidora Tech S.A." /></div><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase ml-2">WhatsApp</label><input value={newProvider.phone} onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" placeholder="+57 300 000 0000" /></div></div><div className="p-8 bg-gray-50 flex gap-4"><button onClick={() => setIsRegisterProviderOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button><button onClick={handleCreateProvider} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all">Registrar Proveedor</button></div></motion.div></div>
                )}
            </AnimatePresence>

            {/* Banner Final Predictivo - Electric Cyber-Clean Card */}
            <div className="max-w-6xl mx-auto mt-24 relative overflow-hidden rounded-[4rem] group shadow-[0_40px_80px_-15px_rgba(0,242,255,0.15)]">
                
                {/* Fondo Claro con Destellos Cian Eléctrico */}
                <div className="absolute inset-0 bg-white overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(147,51,234,0.05)_0%,_transparent_60%)] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    {/* Sutil textura de rejilla tecnológica */}
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#00F2FF 1px, transparent 1px), linear-gradient(90deg, #00F2FF 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                </div>

                <div className="relative p-12 md:p-16 flex flex-col lg:flex-row items-center gap-12 border border-[#00F2FF]/20">
                    
                    {/* Icono de Bayt Pro con Aura Eléctrica */}
                    <div className="shrink-0 relative">
                        <div className="h-28 w-28 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 border-2 border-[#00F2FF]/50">
                            <Bot size={56} className="text-[#00F2FF] drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]" />
                        </div>
                        {/* Resplandor Cian */}
                        <div className="absolute inset-0 bg-[#00F2FF]/30 rounded-[2.5rem] blur-3xl animate-pulse"></div>
                    </div>

                    {/* Mensaje de Impacto con Tipografía Original 4xl */}
                    <div className="flex-1 space-y-6 text-center lg:text-left relative z-10">
                        <div className="flex items-center gap-4 justify-center lg:justify-start">
                            <span className="px-5 py-1.5 bg-[#00F2FF]/10 text-[#00B8C4] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00F2FF]/20">
                                Inteligencia Predictiva
                            </span>
                            <div className="h-1 w-1 bg-gray-200 rounded-full"></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic font-mono">Status: Optimizando</span>
                        </div>
                        
                        <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight max-w-4xl">
                            "Tu conversión móvil <span className="text-[#00B8C4] italic">ha bajado un 12%</span> porque la página de pago tarda <span className="text-purple-600 italic">3 segundos más</span> en cargar para usuarios de Android."
                        </h3>
                    </div>

                    {/* Bloque de Acción e Impacto Económico */}
                    <div className="shrink-0 flex flex-col items-center lg:items-end gap-8 relative z-10 lg:pl-12 lg:border-l lg:border-gray-100">
                        <div className="text-center lg:text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pérdida Mensual Evitable</p>
                            <p className="text-4xl font-black text-gray-900 flex items-center gap-2">
                                <span className="text-[#00F2FF]">$</span>2.450.000
                            </p>
                        </div>
                        <button className="px-12 py-5 bg-gray-900 hover:bg-[#00F2FF] hover:text-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 group/btn">
                            RESCATAR CAPITAL <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
                
                {/* Línea de energía cian en el borde inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F2FF] to-transparent opacity-50"></div>
            </div>
        </div>
    );
}
