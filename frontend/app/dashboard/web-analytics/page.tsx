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
import '@/lib/jspdf-types';

export default function WebAnalyticsPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'conversion' | 'audience' | 'inventory' | 'marketing'>('overview');
    
    // UI States
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isProductHistoryModalOpen, setIsProductHistoryModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
    const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<'winners' | 'stuck' | 'decline' | 'reorder' | null>(null);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isExecutingStrategy, setIsExecutingStrategy] = useState(false);
    const [strategySteps, setStrategySteps] = useState<string[]>([]);
    const [executedToday, setExecutedToday] = useState<Record<string, string>>({});
    const [audienceView, setAudienceView] = useState<'all' | 'traffic' | 'conversion'>('all');
    const [startMonth, setStartMonth] = useState('Enero 2026');
    const [endMonth, setEndMonth] = useState('Enero 2026');
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

    const availableMonths = [
        'Octubre 2025', 'Noviembre 2025', 'Diciembre 2025', 
        'Enero 2026', 'Febrero 2026', 'Marzo 2026'
    ];

    useEffect(() => {
        const saved = localStorage.getItem('bayt_executed_strategies');
        if (saved) setExecutedToday(JSON.parse(saved));
    }, []);

    const isAlreadyExecuted = (category: string) => {
        const lastExec = executedToday[category];
        if (!lastExec) return false;
        return lastExec === new Date().toISOString().split('T')[0];
    };

    const strategyDetails = {
        winners: [
            { step: "Análisis de Elasticidad", desc: "Bayt calcula el punto máximo de precio sin sacrificar volumen de ventas." },
            { step: "Sincronización de Ads", desc: "Ajuste automático de presupuesto en Meta/Google Ads hacia estos SKUs." },
            { step: "Reserva de Inventario", desc: "Bloqueo preventivo de stock para pedidos de alta prioridad." },
            { step: "Escalado de Margen", desc: "Implementación de reglas dinámicas de precios (+2% incremental)." }
        ],
        stuck: [
            { step: "Segmentación de Audiencia", desc: "Identificación de clientes que compraron productos similares en el pasado." },
            { step: "Generación de Ofertas AI", desc: "Creación de cupones de un solo uso con fecha de caducidad agresiva." },
            { step: "Despliegue de WhatsApp", desc: "Envío programado a través de la API oficial para evitar bloqueos." },
            { step: "Reporte de Liquidación", desc: "Monitorización en tiempo real del capital rescatado." }
        ],
        decline: [
            { step: "Mapeo de Afinidad", desc: "Bayt busca qué productos 'Ganadores' suelen comprarse con estos SKUs." },
            { step: "Creación de Bundles", desc: "Configuración automática de 'Combos' en el checkout para forzar salida." },
            { step: "Optimización UI", desc: "Posicionamiento de estos combos en el 'Top of Page' de la tienda." },
            { step: "Venta Sugerida", desc: "Activación de Pop-ups de Cross-selling en el carrito de compras." }
        ],
        reorder: [
            { step: "Lead-time Sync", desc: "Cruce de datos de entrega histórica del proveedor vs. velocidad de venta." },
            { step: "Draft de OC", desc: "Generación de PDF oficial con precios pactados y cantidades óptimas." },
            { step: "Alerta Financiera", desc: "Notificación al área contable sobre el flujo de caja necesario." },
            { step: "Confirmación de Envío", desc: "Seguimiento automático de la guía una vez el proveedor despache." }
        ]
    };

    const handleExecuteStrategicPlan = async () => {
        if (!selectedInventoryCategory) return;
        setIsExecutingStrategy(true);
        setStrategySteps(["Inicializando protocolos Bayt..."]);
        
        const steps = {
            winners: [
                "Analizando patrones de compra exitosos...",
                "Configurando algoritmos de precios dinámicos (+2%)...",
                "Reasignando presupuesto de marketing a SKUs ganadores...",
                "Estrategia de escalado activada con éxito."
            ],
            stuck: [
                "Identificando clientes con alta afinidad histórica...",
                "Diseñando oferta de liquidación personalizada...",
                "Preparando motor de envíos masivos vía WhatsApp...",
                "Campaña de rescate de capital enviada con éxito."
            ],
            decline: [
                "Analizando afinidad de productos para Bundles...",
                "Generando ofertas combinadas 'Smart-Mix'...",
                "Actualizando frontend de la tienda online...",
                "Promoción de evacuación de stock activa."
            ],
            reorder: [
                "Verificando tiempos de entrega del proveedor...",
                "Generando borrador de Orden de Compra oficial...",
                "Sincronizando con el módulo de finanzas...",
                "Orden procesada y notificada al aliado."
            ]
        };

        for (const step of steps[selectedInventoryCategory]) {
            await new Promise(resolve => setTimeout(resolve, 800));
            setStrategySteps(prev => [...prev, step]);
        }

        setTimeout(() => {
            showToast("Plan Estratégico desplegado al 100% 🚀", "success");
            setIsExecutingStrategy(false);
            const today = new Date().toISOString().split('T')[0];
            const updated = { ...executedToday, [selectedInventoryCategory]: today };
            setExecutedToday(updated);
            localStorage.setItem('bayt_executed_strategies', JSON.stringify(updated));
        }, 1000);
    };

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
                body: JSON.stringify({ product_name: orderForm.productName, quantity: orderForm.quantity, total_amount: orderForm.quantity * orderForm.pricePerUnit, provider_name: orderForm.provider, sending_method: orderForm.sending_method, status: orderForm.sending_method === 'reminder' ? 'scheduled' : 'sent', notes: orderForm.notes })
            });
            if (res.ok) { showToast("Pedido procesado con éxito 🚀", "success"); setIsOrderModalOpen(false); }
        } catch (e) { showToast("Error de conexión", "error"); }
        finally { setIsSubmittingOrder(false); }
    };

    const [isCelebrating, setIsCelebrating] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleDownloadReport = async () => {
        setIsGeneratingPDF(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            const today = new Date().toLocaleDateString();

            // Función auxiliar para pie de página
            const addFooter = (pageNum: number, total: number) => {
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Confidencial - Sebas Store | Bayup Business Intelligence | Página ${pageNum} de ${total}`, margin, pageHeight - 10);
                doc.setDrawColor(230, 230, 230);
                doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
            };

            // --- PÁGINA 1: PORTADA & RESUMEN EJECUTIVO ---
            doc.setFillColor(0, 73, 83); // Deep Petrol
            doc.rect(0, 0, pageWidth, 80, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(40); doc.setFont('helvetica', 'bold'); doc.text('BAYUP', margin, 40);
            doc.setFontSize(18); doc.text('BUSINESS INTELLIGENCE REPORT', margin, 55);
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text(`Empresa: SEBAS STORE`, margin, 65);
            doc.text(`Periodo: ${startMonth} - ${endMonth}`, margin, 70);
            doc.text(`ID Reporte: #BI-GHFCORPM1`, pageWidth - 70, 70);

            doc.setTextColor(0, 73, 83);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('1. Resumen Ejecutivo de Operación', margin, 100);
            
            autoTable(doc, {
                startY: 110,
                head: [['Métrica Principal', 'Valor Actual', 'vs Periodo Anterior']],
                body: [
                    ['Ventas Brutas Totales', formatCurrency(3450000), '+18.5% (En alza)'],
                    ['Ticket Promedio de Venta', formatCurrency(124000), '+5.2%'],
                    ['Tasa de Conversión General', '4.8%', '+0.4%'],
                    ['Pedidos Finalizados', '42 pedidos', 'Estable'],
                    ['Carritos Abandonados', '128 carritos', '-2.1% (Mejora)'],
                    ['Ingresos Recuperados', formatCurrency(8900000), '+32%']
                ],
                theme: 'striped',
                headStyles: { fillColor: [0, 73, 83] },
                margin: { left: margin, right: margin }
            });

            addFooter(1, 7);

            // --- PÁGINA 2: ANÁLISIS DE EMBUDO ---
            doc.addPage();
            doc.setTextColor(0, 73, 83);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('2. Análisis de Embudo (Sales Funnel)', margin, 30);
            
            autoTable(doc, {
                startY: 40,
                head: [['Etapa del Proceso', 'Usuarios', '% Retención', '% Fuga']],
                body: [
                    ['Sesiones Totales en Web', '12,450', '100%', '0%'],
                    ['Visualización de Producto', '8,420', '67%', '33%'],
                    ['Adición al Carrito', '2,150', '17%', '74%'],
                    ['Inicio de Checkout', '840', '6%', '61%'],
                    ['Compra Finalizada', '524', '4.2%', '37%']
                ],
                theme: 'grid',
                headStyles: { fillColor: [147, 51, 234] },
                margin: { left: margin, right: margin }
            });

            doc.setFontSize(10); doc.setTextColor(100, 100, 100);
            doc.text('Nota: El mayor cuello de botella se encuentra en el Inicio de Checkout (61% de fuga).', margin, doc.lastAutoTable.finalY + 10);

            addFooter(2, 7);

            // --- PÁGINA 3: TRÁFICO & COMPORTAMIENTO ---
            doc.addPage();
            doc.setTextColor(0, 73, 83);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('3. Tráfico & Comportamiento de Usuario', margin, 30);
            
            autoTable(doc, {
                startY: 40,
                head: [['Canal de Origen', 'Sesiones', 'Tasa de Rebote', 'Tiempo Promedio']],
                body: [
                    ['Directo', '4,500', '12%', '4m 20s'],
                    ['Instagram Ads', '3,200', '24%', '1m 45s'],
                    ['Google SEO', '1,800', '18%', '3m 10s'],
                    ['TikTok Shop', '1,200', '42%', '0m 55s'],
                    ['WhatsApp Business', '850', '5%', '6m 12s']
                ],
                theme: 'striped',
                headStyles: { fillColor: [0, 73, 83] }
            });

            doc.setFontSize(12); doc.text('Análisis de Temporalidad', margin, doc.lastAutoTable.finalY + 20);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text('• Peak de Ventas Reales: 8:30 PM - 10:00 PM', margin + 5, doc.lastAutoTable.finalY + 30);
            doc.text('• Día más rentable: Sábados', margin + 5, doc.lastAutoTable.finalY + 35);
            doc.text('• Dispositivo Predominante: MÓVIL (82%)', margin + 5, doc.lastAutoTable.finalY + 40);

            addFooter(3, 7);

            // --- PÁGINA 4: AUDIENCIA ---
            doc.addPage();
            doc.setTextColor(0, 73, 83);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('4. Audiencia & Perfil del Cliente', margin, 30);
            
            autoTable(doc, {
                startY: 40,
                head: [['Segmento', 'Distribución / Valor']],
                body: [
                    ['Clientes Nuevos', '76%'],
                    ['Clientes Recurrentes', '24%'],
                    ['Lifetime Value (LTV)', formatCurrency(458000)],
                    ['Género Predominante', 'Mujeres (68%)'],
                    ['Rango de Edad Top', '25 - 34 años (42%)'],
                    ['Ubicación Principal', 'Bogotá, Colombia (45%)'],
                    ['Frecuencia de Compra', '1.2 veces por año']
                ],
                theme: 'grid'
            });

            addFooter(4, 7);

            // --- PÁGINA 5: DESEMPEÑO DE PRODUCTOS (LOS GANADORES) ---
            doc.addPage();
            doc.setTextColor(0, 73, 83);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('5. Análisis 80/20: Productos Ancla', margin, 30);
            
            autoTable(doc, {
                startY: 40,
                head: [['Producto', 'Margen Neto', 'Contribución', 'Rol Estratégico']],
                body: [
                    ['Tabletas Purificadoras X', '68%', formatCurrency(124500000), 'Ancla Principal'],
                    ['Kit Supervivencia 360', '52%', formatCurrency(88400000), 'Multiplicador'],
                    ['Filtro de Carbón Pro', '45%', formatCurrency(72000000), 'Generador de Flujo'],
                    ['Botella Térmica Bayup', '42%', formatCurrency(45000000), 'Activo de Retención'],
                    ['Linterna Solar Pro', '38%', formatCurrency(36000000), 'Potencial']
                ],
                headStyles: { fillColor: [16, 185, 129] }
            });

            doc.setFillColor(255, 248, 230); doc.rect(margin, doc.lastAutoTable.finalY + 10, pageWidth - (margin*2), 30, 'F');
            doc.setFontSize(9); doc.setTextColor(180, 83, 9); doc.setFont('helvetica', 'bolditalic');
            doc.text('ALERTA PREDICTIVA DE BAYT:', margin + 5, doc.lastAutoTable.finalY + 20);
            doc.setFont('helvetica', 'normal');
            doc.text('Se detecta riesgo de quiebre de stock en "Tabletas X" para Febrero. Demanda proyectada +340%.', margin + 5, doc.lastAutoTable.finalY + 28);

            addFooter(5, 7);

            // --- PÁGINA 6: CAPITAL MUERTO & MARKETING ---
            doc.addPage();
            doc.setTextColor(0, 73, 83);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('6. Rescate de Liquidez & Marketing', margin, 30);
            
            doc.setFontSize(11); doc.text('Productos Estancados (Inacción)', margin, 40);
            autoTable(doc, {
                startY: 45,
                head: [['Producto', 'Capital Inerte', 'Antigüedad', 'Reinversión']],
                body: [
                    ['Fundas Silicona Pro', formatCurrency(8500000), '92 días', formatCurrency(4200000)],
                    ['Protector Pantalla X', formatCurrency(6200000), '120 días', formatCurrency(3100000)],
                    ['Cables USB-C Braided', formatCurrency(4800000), '75 días', formatCurrency(2400000)]
                ],
                headStyles: { fillColor: [225, 29, 72] }
            });

            doc.setFontSize(11); doc.text('Rendimiento de Campañas', margin, doc.lastAutoTable.finalY + 15);
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Campaña', 'Impactos', 'Efectividad', 'ROI']],
                body: [
                    ['WELCOME10', '1,240', '28%', '+420%'],
                    ['PROMOVERANO', '850', '42%', '+580%'],
                    ['RESCATE20', '320', '12%', '+110%']
                ],
                headStyles: { fillColor: [147, 51, 234] }
            });

            addFooter(6, 7);

            // --- PÁGINA 7: RECOMENDACIONES ---
            doc.addPage();
            doc.setTextColor(0, 73, 83);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('7. Recomendaciones Estratégicas AI', margin, 30);
            
            doc.setFillColor(249, 250, 251); doc.rect(margin, 40, pageWidth - (margin*2), 120, 'F');
            doc.setFontSize(10); doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'bold');
            doc.text('ACCIONES INMEDIATAS RECOMENDADAS POR BAYT AI:', margin + 10, 55);
            
            doc.setFont('helvetica', 'normal');
            const recs = [
                "1. Optimización de Checkout: Se pierde el 61% de usuarios. Simplificar métodos de pago.",
                "2. Inversión en Ads: WhatsApp tiene un ROI 3x superior al Email, priorizar pauta allí.",
                "3. Reabastecimiento: Solicitar 450 unidades de 'Tabletas X' antes de que inicie Febrero.",
                "4. Segmentación: Lanzar campaña de fidelización para el 76% de clientes nuevos.",
                "5. Estrategia de Salida: Aplicar descuento del 25% a 'Fundas Silicona' para liberar $8.5M.",
                "6. Horarios: Programar disparos de marketing a las 7:45 PM para capturar el pico nocturno."
            ];
            
            recs.forEach((r, i) => {
                doc.text(r, margin + 10, 70 + (i * 12));
            });

            doc.save(`BI_Report_SebasStore_${today.replace(/\//g, '-')}.pdf`);
            showToast("Auditoría BI descargada ✨", "success");
        } catch (e) {
            console.error(e);
            showToast("Error al generar el reporte", "error");
        } finally {
            setIsGeneratingPDF(false);
        }
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
                {[ { label: 'Ventas Hoy', val: 3450000, trend: '+18.5%', up: true, h: 'Dinero real generado hoy.' }, { label: 'Ticket Promedio', val: 124000, trend: '+5.2%', up: true, h: 'Gasto promedio por cliente.' }, { label: 'Pedidos Hoy', val: 42, trend: '-2.1%', up: false, h: 'Órdenes procesadas hoy.' }, { label: 'Tasa Conversión', val: '4.8%', trend: '+0.4%', up: true, h: 'Visitas que terminan en compra.' }, ].map((kpi, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative group cursor-help transition-all hover:shadow-xl">
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

            {/* NUEVA FILA: Rankings Estratégicos de Productos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top 5 Vendidos - Rediseño Elegante */}
                <div 
                    onMouseEnter={() => setIsCelebrating(true)}
                    onMouseLeave={() => setIsCelebrating(false)}
                    onMouseMove={handleMouseMove}
                    className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10 relative overflow-hidden group/card"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/card:bg-amber-500/10 transition-colors duration-700"></div>
                    
                    {/* Confetti Particles - Mouse Follower */}
                    <AnimatePresence>
                        {isCelebrating && [...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0, x: mousePos.x, y: mousePos.y }}
                                animate={{ 
                                    opacity: [0, 1, 0], 
                                    scale: [0, 1, 0.5],
                                    x: mousePos.x + (Math.random() - 0.5) * 250,
                                    y: mousePos.y + (Math.random() - 0.5) * 250,
                                    rotate: Math.random() * 360
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: i * 0.05 }}
                                className="absolute pointer-events-none z-0"
                                style={{
                                    left: 0,
                                    top: 0,
                                    width: i % 2 === 0 ? "6px" : "10px",
                                    height: i % 2 === 0 ? "6px" : "3px",
                                    backgroundColor: ["#00F2FF", "#9333ea", "#f59e0b", "#10b981"][i % 4],
                                    borderRadius: i % 3 === 0 ? "50%" : "1px",
                                    boxShadow: "0 0 10px rgba(255,255,255,0.5)"
                                }}
                            />
                        ))}
                    </AnimatePresence>

                    <div className="flex items-center justify-between border-b border-gray-50 pb-8 relative z-10">
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Trophy size={18} className="text-amber-500" /> Top Éxito Comercial
                            </h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-2 tracking-widest ml-7">Catálogo de Alto Rendimiento</p>
                        </div>
                        <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-inner">
                            <Sparkles size={18} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {[
                            { name: "Tabletas Purificadoras X", val: 12450, growth: "+24%", rank: "01", color: "text-amber-500" },
                            { name: "Kit Supervivencia 360", val: 8920, growth: "+12%", rank: "02", color: "text-gray-400" },
                            { name: "Filtro de Carbón Pro", val: 5150, growth: "+45%", rank: "03", color: "text-orange-400" },
                            { name: "Botella Térmica Bayup", val: 4200, growth: "+8%", rank: "04", color: "text-gray-300" },
                            { name: "Linterna Solar Pro", val: 3800, growth: "+15%", rank: "05", color: "text-gray-300" }
                        ].map((prod, idx) => (
                            <div key={idx} className="flex items-center justify-between p-6 hover:bg-gray-50/80 rounded-[2rem] transition-all duration-500 group cursor-pointer border border-transparent hover:border-gray-100 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center gap-8">
                                    <span className={`text-[10px] font-black italic ${prod.color} w-6 tracking-tighter group-hover:scale-110 transition-transform`}>{prod.rank}</span>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight italic group-hover:text-purple-600 transition-colors">{prod.name}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Impacto Global Detectado</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs font-black text-gray-900">{prod.val.toLocaleString()}</p>
                                        <p className="text-[7px] font-black text-gray-300 uppercase tracking-tighter">Units</p>
                                    </div>
                                    <div className="h-8 w-px bg-gray-100"></div>
                                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black italic shadow-sm group-hover:shadow-md transition-all">
                                        {prod.growth}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alerta de Rotación (Capital Muerto) */}
                <div className="bg-[#004953] p-12 rounded-[3.5rem] text-white space-y-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 font-black uppercase pointer-events-none italic">STUCK</div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] italic text-[#00F2FF]">Alerta de Rotación</h4>
                        <AlertTriangle size={20} className="text-rose-400 animate-pulse" />
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        {[
                            { name: "Cargador Solar 1.0", capital: 8500000, days: "92 días" },
                            { name: "Brújula Clásica Pro", capital: 6200000, days: "120 días" },
                            { name: "Cantimplora Basic", capital: 4800000, days: "75 días" }
                        ].map((prod, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/item">
                                <div className="space-y-1">
                                    <p className="text-xs font-black italic tracking-tight">{prod.name}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Inactivo por: {prod.days}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-[#00F2FF] italic">{formatCurrency(prod.capital)}</p>
                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Capital Inerte</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-white/10 relative z-10">
                        <button onClick={() => setActiveTab('inventory')} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Liberar Capital Ahora</button>
                    </div>
                </div>
            </div>

            {/* TERCERA FILA: Inteligencia de Búsqueda & Demanda */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar de Búsquedas (Demanda Latente) */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10 relative overflow-hidden group/search">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/search:bg-blue-500/10 transition-colors duration-700"></div>
                    
                    <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Search size={18} className="text-blue-500" /> Radar de Búsquedas
                            </h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-2 tracking-widest ml-7">Demanda Latente en Tienda</p>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shadow-inner">
                            <Activity size={18} className="animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { term: "Termo Inteligente Bayup", count: 850, status: "Sin Stock", color: "text-rose-500" },
                            { term: "Mochila Solar Pro", count: 620, status: "Bajo Stock", color: "text-amber-500" },
                            { term: "Funda MagSafe Carbon", count: 450, status: "No en Catálogo", color: "text-purple-500" },
                            { term: "Kit Filtro Avanzado", count: 380, status: "Bajo Stock", color: "text-amber-500" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-50 group">
                                <div className="flex items-center gap-6">
                                    <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-[10px] font-black text-blue-500">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase italic group-hover:text-blue-600 transition-colors">{item.term}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.count} búsquedas / semana</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${item.color} bg-white border border-gray-100 shadow-sm`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Análisis de Suministro AI */}
                <div className="bg-[#004953] p-12 rounded-[3.5rem] text-white flex flex-col justify-between relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <ShoppingCart size={200} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xl font-black flex items-center gap-3 uppercase italic text-[#00F2FF]">
                                <Bot size={24} className="text-[#00F2FF] animate-pulse" /> Estrategia de Suministro
                            </h4>
                            <span className="text-[8px] font-black bg-white/10 text-[#00F2FF] px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">AI Projection</span>
                        </div>
                        
                        <p className="text-base font-medium text-gray-300 mt-10 leading-relaxed italic">
                            "He detectado una demanda insatisfecha proyectada en <span className="text-white font-black underline decoration-[#00F2FF] decoration-2 underline-offset-4">{formatCurrency(12400000)}</span> basada en búsquedas fallidas. Prioriza la compra de <span className="text-[#00F2FF] font-black italic">Termo Inteligente</span> y evalúa añadir <span className="text-[#00F2FF] font-black italic">Funda MagSafe Carbon</span> a tu inventario hoy mismo."
                        </p>
                    </div>

                    <div className="relative z-10 mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#00F2FF] border border-white/10 shadow-xl">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ROI Proyectado Adición</p>
                                <p className="text-xl font-black text-white italic">+18.5% <span className="text-[10px] text-[#00F2FF] ml-1">Market Opportunity</span></p>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('inventory')} className="px-8 py-4 bg-[#00F2FF] text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-white transition-all active:scale-95">Ir a Inventario</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTraffic = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Fila 1: Adquisición & Timing (Original) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-12">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Ruta de Adquisición</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Bayt: "Tu mayor volumen viene de Instagram Ads, pero Google SEO tiene el menor rebote."</p>
                    </div>
                    <div className="space-y-8">
                        {[ 
                            { s: 'Directo', p: '36%', c: 'bg-gray-900', t: '4m 20s' }, 
                            { s: 'Instagram Ads', p: '25%', c: 'bg-purple-600', t: '1m 45s' }, 
                            { s: 'Google SEO', p: '14%', c: 'bg-[#004953]', t: '3m 10s' } 
                        ].map((item, i) => (
                            <div key={i} className="space-y-3 group">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                    <span className="text-gray-500 group-hover:text-gray-900 transition-colors">{item.s}</span>
                                    <span>{item.p} <span className="text-gray-300 ml-2 font-mono italic">avg: {item.t}</span></span>
                                </div>
                                <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-gray-100">
                                    <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full shadow-sm`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-between relative overflow-hidden group border border-white/5 shadow-2xl">
                    {/* Background Effect */}
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <Clock size={220} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#004953]/20 to-transparent opacity-50"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xl font-black flex items-center gap-3 uppercase italic">
                                <Timer className="text-purple-400 animate-pulse"/> Hora de Oro
                            </h4>
                            <span className="text-[8px] font-black bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full uppercase tracking-widest border border-purple-500/30">Live Analysis</span>
                        </div>
                        
                        <p className="text-sm font-medium text-gray-400 mt-8 leading-relaxed italic">
                            "Tus ventas reales se concentran entre las <span className="text-white font-black underline decoration-purple-500 decoration-4 underline-offset-4">8:30 PM y las 10:00 PM</span>. Bayt recomienda programar tus notificaciones push en este rango."
                        </p>
                    </div>

                    <div className="relative z-10 mt-10 space-y-6">
                        {/* Visual Time Graph - Mini Sparkline */}
                        <div className="flex items-end gap-1.5 h-16">
                            {[15, 25, 40, 30, 20, 15, 35, 60, 95, 100, 85, 40].map((h, i) => (
                                <div key={i} className="flex-1 bg-white/5 rounded-t-lg relative overflow-hidden h-full">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        className={`absolute bottom-0 w-full ${h > 80 ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-gray-700'}`}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Pico de conversión activo</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity size={10} className="text-gray-500" />
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic font-mono">Intensity: 98%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fila 2: Flujo Interno & Puntos de Fuga (NUEVO) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Flujo de Navegación Quirúrgico */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <Layers size={18} className="text-purple-600" /> Flujo Interno Bayup
                        </h4>
                        <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase italic">User Journey Mapping</span>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {[
                            { from: 'Home / Landing', to: 'Catálogo General', p: '85%', color: 'bg-gray-900' },
                            { from: 'Catálogo General', to: 'Página de Producto', p: '42%', color: 'bg-indigo-600' },
                            { from: 'Página de Producto', to: 'Carrito / Checkout', p: '18%', color: 'bg-purple-600' },
                            { from: 'Checkout', to: 'Orden Completada', p: '4.2%', color: 'bg-emerald-500' }
                        ].map((flow, idx) => (
                            <div key={idx} className="flex items-center gap-6 group">
                                <div className="w-32 text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter truncate">{flow.from}</p>
                                </div>
                                <div className="flex-1 relative h-8 flex items-center">
                                    <div className="absolute inset-0 bg-gray-50 rounded-xl"></div>
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: flow.p }} 
                                        className={`absolute inset-y-1.5 left-1.5 ${flow.color} rounded-lg shadow-lg`} 
                                    />
                                    <div className="relative z-10 w-full flex justify-center">
                                        <span className="text-[10px] font-black text-white mix-blend-difference uppercase italic">{flow.p} de retención</span>
                                    </div>
                                </div>
                                <div className="w-32">
                                    <p className="text-[9px] font-black text-gray-900 uppercase tracking-tighter truncate italic">{flow.to}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Puntos de Abandono Críticos */}
                <div className="bg-[#004953] p-12 rounded-[3.5rem] text-white space-y-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 font-black uppercase pointer-events-none italic">EXIT</div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] italic text-[#00F2FF]">Puntos de Fuga Críticos</h4>
                        <AlertTriangle size={20} className="text-rose-400 animate-pulse" />
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                        {[
                            { page: '/checkout/shipping', loss: '61%', reason: 'Costos de envío altos', trend: 'up' },
                            { page: '/products/premium-kit', loss: '34%', reason: 'Falta de reviews reales', trend: 'down' },
                            { page: '/search/no-results', loss: '82%', reason: 'Búsquedas fallidas', trend: 'up' }
                        ].map((exit, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/item">
                                <div className="space-y-1">
                                    <p className="text-xs font-black italic tracking-tight">{exit.page}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">{exit.reason}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-rose-400 italic">{exit.loss}</p>
                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Abandonan Aquí</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fila 3: Búsqueda Interna & Landing Efficiency */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 flex flex-col justify-between">
                    <div>
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <Search size={16} className="text-blue-500" /> Eficacia de Búsqueda
                        </h4>
                        <div className="mt-8 text-center space-y-2">
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">72%</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Encuentran su producto</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed text-center">
                        "El 28% restante no encuentra resultados. Bayt recomienda añadir 'Sinónimos AI' para términos como 'termo' vs 'botella'."
                    </p>
                </div>

                <div className="lg:col-span-2 bg-gradient-to-r from-gray-900 to-[#004953] p-12 rounded-[3.5rem] text-white relative overflow-hidden group">
                    <div className="relative z-10 flex items-start gap-10">
                        <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl border border-white/20">🚀</div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <h4 className="text-2xl font-black italic tracking-tight uppercase">Optimización de Rutas Bayt</h4>
                                <p className="text-[#00F2FF] text-[10px] font-black uppercase mt-1 tracking-[0.3em]">IA Performance Insight</p>
                            </div>
                            <p className="text-gray-300 text-lg font-medium leading-relaxed italic">
                                "He detectado que los usuarios que entran por <span className="text-white font-black underline decoration-[#00F2FF]">Instagram Ads</span> tienen una ruta 3x más corta hacia el carrito, pero abandonan masivamente en el cálculo de envío. Si implementas 'Envío Gratis' automático para este canal, el ROI proyectado subirá un <span className="text-[#00F2FF] font-black">18%</span>."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConversion = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-white p-16 rounded-[4rem] border border-gray-100 shadow-sm max-w-5xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500" />
                
                <div className="text-center mb-20 space-y-2">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Embudo de Conversión Real</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Auditoría Quirúrgica de Ventas</p>
                </div>

                <div className="space-y-4">
                    {[ 
                        { step: 'Sesiones Totales', sub: 'Tráfico global calificado', val: 12450, pct: 100, loss: 0, money: 0, insight: 'Base de entrada mensual.' }, 
                        { step: 'Visualización de Producto', sub: 'Interés real en el catálogo', val: 8420, pct: 67, loss: 33, money: 14200000, insight: 'Mejorar calidad de fotos.' }, 
                        { step: 'Agregaron al Carrito', sub: 'Intención de compra detectada', val: 2150, pct: 17, loss: 74, money: 28500000, insight: 'Simplificar opciones de talla.' }, 
                        { step: 'Compra Finalizada', sub: 'Conversión y cierre de caja', val: 524, pct: 4.2, loss: 37, money: 12400000, insight: 'Fuga por costos de envío.' } 
                    ].map((item, i) => (
                        <div key={i} className="group relative">
                            <div className="flex items-center gap-12 py-10 px-10 hover:bg-gray-50 transition-all rounded-[3rem] border border-transparent hover:border-gray-100">
                                <div className="w-16 h-16 bg-white border border-gray-50 rounded-[1.5rem] flex items-center justify-center text-purple-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                                    {i+1}
                                </div>
                                
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black uppercase text-xs text-gray-900">{item.step}</span>
                                                <span className="text-[8px] font-black text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full uppercase italic">Bayt Insight: {item.insight}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.sub}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-gray-900">{item.val.toLocaleString()}</span>
                                            <span className="text-[10px] font-black text-gray-300 ml-2 italic">{item.pct}%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-gray-100">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${item.pct}%` }} 
                                            className={`h-full ${i === 3 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-purple-600'} rounded-full`} 
                                        />
                                    </div>
                                </div>

                                <div className="w-40 text-right">
                                    {item.loss > 0 ? (
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-rose-500">-{item.loss}% Fuga</p>
                                            <p className="text-[9px] font-bold text-rose-300 uppercase italic">-{formatCurrency(item.money)} en riesgo</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg inline-block">Punto de Origen</p>
                                            <p className="text-[8px] font-bold text-gray-300 uppercase block">100% Retención</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {i < 3 && (
                                <div className="flex justify-center -my-4 relative z-10">
                                    <div className="bg-white p-2.5 rounded-full border border-gray-100 text-gray-300 shadow-sm">
                                        <ChevronDown size={20} className="animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-10 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Target size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Conversión Final</p>
                            <p className="text-xl font-black text-gray-900 italic">4.2% <span className="text-xs text-emerald-500 font-bold ml-1">Excellent Performance</span></p>
                        </div>
                    </div>
                    <button onClick={() => setActiveTab('marketing')} className="px-8 py-4 bg-gray-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl">Activar Optimización AI</button>
                </div>
            </div>
        </div>
    );

    const renderAudience = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header de Fidelización & Composición */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 italic">Composición de Audiencia</h4>
                    <div className="relative h-64 w-64 flex items-center justify-center">
                        <div className="h-56 w-56 rounded-full border-[20px] border-[#004953] flex flex-col items-center justify-center bg-white shadow-[0_0_40px_rgba(0,73,83,0.1)] relative z-10 group-hover:scale-105 transition-transform duration-500">
                            <p className="text-5xl font-black text-gray-900">35%</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase mt-1">Clientes Fieles</p>
                        </div>
                        <div className="absolute -top-4 -right-4 px-6 py-3 bg-emerald-500 text-white rounded-2xl transform rotate-12 shadow-2xl z-20">
                            <p className="text-sm font-black italic">65% Nuevos</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-10 leading-relaxed max-w-[200px]">
                        "Tu tasa de retención ha subido un <span className="text-emerald-500 font-bold">4.2%</span> este mes. Los clientes fieles generan el 58% de tus ingresos."
                    </p>
                </div>

                <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-12">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Demografía Estratégica</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Perfil biopsicosocial del comprador Bayup</p>
                        </div>
                        <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner">
                            <Users size={24} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        {/* Distribución de Género */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                <Layers size={14} className="text-purple-600" />
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Distribución de Género</p>
                            </div>
                            <div className="space-y-6">
                                {[ 
                                    { g: 'Mujeres', p: '68%', c: 'bg-rose-400' }, 
                                    { g: 'Hombres', p: '28%', c: 'bg-blue-400' },
                                    { g: 'Otros', p: '4%', c: 'bg-gray-300' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2 group">
                                        <div className="flex justify-between text-[10px] font-black uppercase">
                                            <span className="text-gray-500 group-hover:text-gray-900 transition-colors">{item.g}</span>
                                            <span className="text-gray-900">{item.p}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner">
                                            <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rango de Edad */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                <Timer size={14} className="text-purple-600" />
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Rango de Edad</p>
                            </div>
                            <div className="space-y-6">
                                {[ 
                                    { r: '18 - 24 años', p: '45%', c: 'bg-purple-600' }, 
                                    { r: '25 - 34 años', p: '38%', c: 'bg-purple-400' },
                                    { r: '35+ años', p: '17%', c: 'bg-purple-200' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2 group">
                                        <div className="flex justify-between text-[10px] font-black uppercase">
                                            <span className="text-gray-500 group-hover:text-gray-900 transition-colors">{item.r}</span>
                                            <span className="text-gray-900">{item.p}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner">
                                            <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NUEVA FILA: Edad & Conversión Comparativa */}
            <div className="bg-white p-16 rounded-[4rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500"></div>
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Edad & Conversión Real</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Diferencia crítica entre quién te ve y quién te paga</p>
                    </div>
                    <div className="flex gap-6">
                        <button 
                            onClick={() => setAudienceView(audienceView === 'traffic' ? 'all' : 'traffic')}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl transition-all border ${
                                audienceView === 'traffic' 
                                ? 'bg-cyan-50 border-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.15)] scale-105' 
                                : 'bg-white border-gray-100 hover:border-cyan-200'
                            }`}
                        >
                            <div className={`h-3 w-3 rounded-full transition-all ${audienceView === 'traffic' ? 'bg-[#004953] animate-pulse' : 'bg-gray-200'}`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${audienceView === 'traffic' ? 'text-[#004953]' : 'text-gray-400'}`}>Tráfico (Visitas)</span>
                        </button>
                        <button 
                            onClick={() => setAudienceView(audienceView === 'conversion' ? 'all' : 'conversion')}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl transition-all border ${
                                audienceView === 'conversion' 
                                ? 'bg-purple-50 border-purple-200 shadow-[0_0_20px_rgba(147,51,234,0.15)] scale-105' 
                                : 'bg-white border-gray-100 hover:border-purple-200'
                            }`}
                        >
                            <div className={`h-3 w-3 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.5)] transition-all ${audienceView === 'conversion' ? 'bg-purple-600 animate-pulse' : 'bg-gray-200'}`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${audienceView === 'conversion' ? 'text-purple-600' : 'text-gray-400'}`}>Conversión (Ventas)</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-12">
                    {[
                        { range: '18 - 24 años', views: '45%', sales: '12%', color: 'bg-purple-600', glow: 'shadow-[0_0_20px_rgba(147,51,234,0.3)]' },
                        { range: '25 - 34 años', views: '38%', sales: '65%', color: 'bg-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
                        { range: '35 - 44 años', views: '12%', sales: '18%', color: 'bg-blue-500', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
                        { range: '45+ años', views: '5%', sales: '5%', color: 'bg-amber-500', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' }
                    ].map((age, i) => (
                        <div key={i} className={`grid grid-cols-1 md:grid-cols-4 items-center gap-10 group/row transition-all duration-500 ${
                            audienceView === 'all' ? 'opacity-100' : 
                            (audienceView === 'traffic' || audienceView === 'conversion') ? 'opacity-100' : 'opacity-40'
                        }`}>
                            <div className="space-y-1">
                                <span className={`text-lg font-black italic uppercase tracking-tighter transition-colors ${audienceView !== 'all' ? 'text-gray-900' : 'text-gray-900'}`}>{age.range}</span>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Segmento {i+1}</p>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className={`transition-all duration-500 ${audienceView === 'traffic' ? 'text-cyan-600 scale-110 origin-left' : 'text-gray-400'}`}>Visitas ({age.views})</span>
                                    <span className={`transition-all duration-500 ${audienceView === 'conversion' ? (i === 1 ? 'text-emerald-500 scale-110 origin-right' : 'text-purple-600 scale-110 origin-right') : 'text-gray-400'}`}>Ventas Reales ({age.sales})</span>
                                </div>
                                <div className="h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-gray-100 relative">
                                    <div 
                                        className={`bg-gray-200 h-full rounded-l-full border-r border-white transition-all duration-700 ${audienceView === 'conversion' ? 'opacity-10 blur-[1px]' : 'opacity-100'}`} 
                                        style={{ width: age.views }} 
                                    />
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: age.sales }} 
                                        className={`${age.color} h-full rounded-r-full relative transition-all duration-700 ${
                                            audienceView === 'traffic' ? 'opacity-10 blur-[1px]' : `opacity-100 ${age.glow}`
                                        }`} 
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-transparent group-hover/row:border-gray-100 transition-all">
                                <p className="text-[9px] font-bold text-gray-500 italic leading-tight leading-relaxed">
                                    {i === 0 ? 'Mucho tráfico curioso, pero conversión por debajo de la media.' :
                                     i === 1 ? 'Tu motor financiero real. Máxima eficiencia de compra.' :
                                     i === 2 ? 'Público maduro con alto ticket promedio y lealtad de marca.' :
                                     'Nicho estable con comportamiento de compra predecible.'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fila 2: Tecnología & Canales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tech & Origin */}
                <div className="bg-gray-900 p-12 rounded-[3.5rem] text-white space-y-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 text-[15rem] font-black text-white/5 pointer-events-none uppercase">TECH</div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] italic text-purple-400">Tecnología & Origen</h4>
                        <ZapIcon size={20} className="text-purple-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-12 relative z-10">
                        <div className="text-center p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                            <Smartphone size={40} className="mx-auto text-emerald-400 mb-4" />
                            <p className="text-4xl font-black italic">82%</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">Tráfico Móvil</p>
                        </div>
                        <div className="text-center p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                            <Monitor size={40} className="mx-auto text-blue-400 mb-4" />
                            <p className="text-4xl font-black italic">18%</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">PC / Tablet</p>
                        </div>
                    </div>
                </div>

                {/* Canales de Adquisición */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <Share2 size={18} className="text-purple-600" /> Canales de Adquisición
                        </h4>
                        <span className="px-4 py-1.5 bg-gray-50 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">Live Source Radar</span>
                    </div>
                    <div className="space-y-6">
                        {[ 
                            { s: 'Instagram', p: '55%', i: <Smartphone size={14}/>, color: 'bg-gradient-to-r from-purple-600 to-rose-500' },
                            { s: 'WhatsApp', p: '25%', i: <MessageSquare size={14}/>, color: 'bg-emerald-500' },
                            { s: 'Facebook', p: '15%', i: <Users size={14}/>, color: 'bg-blue-600' },
                            { s: 'Otros', p: '5%', i: <Search size={14}/>, color: 'bg-gray-400' } 
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-6 group">
                                <span className="w-20 text-[10px] font-black text-gray-400 uppercase group-hover:text-gray-900 transition-colors">{item.s}</span>
                                <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden shadow-inner p-0.5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.color} rounded-full`} />
                                </div>
                                <span className="w-12 text-[11px] font-black text-gray-900 text-right">{item.p}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fila 3: Picos de Actividad & Geografía */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Picos Horarios */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <Clock size={18} className="text-amber-500" /> Picos de Actividad
                        </h4>
                        <p className="text-[9px] font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">Hora Pico: 20:00h</p>
                    </div>
                    <div className="flex items-end justify-between h-48 pt-4 gap-3">
                        {[ 20, 35, 25, 60, 95, 80, 45, 30 ].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full bg-gray-50 rounded-t-2xl relative overflow-hidden flex items-end h-full shadow-inner group-hover:bg-gray-100 transition-all">
                                    <motion.div 
                                        initial={{ height: 0 }} 
                                        animate={{ height: `${h}%` }} 
                                        className={`w-full ${h > 80 ? 'bg-gray-900' : 'bg-purple-500/40'} group-hover:bg-purple-600 transition-colors rounded-t-xl`}
                                    />
                                </div>
                                <span className="text-[9px] font-black text-gray-400 uppercase font-mono">
                                    {['08h', '10h', '12h', '14h', '18h', '20h', '22h', '00h'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium italic text-center">"La conversión máxima ocurre a las <span className="font-bold text-gray-900">8:45 PM</span> los días de semana."</p>
                </div>

                {/* Geografía & Días Top */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm grid grid-cols-2 gap-12 relative overflow-hidden">
                    <div className="space-y-8">
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2">
                            <Globe size={14} className="text-blue-500"/> Geografía
                        </h4>
                        <div className="space-y-5">
                            {[ { l: 'Bogotá', p: '42%' }, { l: 'Medellín', p: '28%' }, { l: 'Cali', p: '12%' }, { l: 'Otras', p: '18%' } ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black text-gray-400 uppercase group-hover:text-gray-900 transition-colors">{item.l}</span>
                                    <span className="text-[11px] font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg">{item.p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2">
                            <Calendar size={14} className="text-emerald-500"/> Días Top
                        </h4>
                        <div className="space-y-5">
                            {[ { d: 'Sábados', p: '35%' }, { d: 'Viernes', p: '25%' }, { d: 'Domingos', p: '20%' }, { d: 'Otros', p: '20%' } ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black text-gray-400 uppercase group-hover:text-gray-900 transition-colors">{item.d}</span>
                                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{item.p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Insight Final de Bayt */}
            <div className="bg-gradient-to-r from-gray-900 to-indigo-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <Bot size={180} />
                </div>
                <div className="relative z-10 flex items-start gap-10">
                    <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl border border-white/20 animate-pulse">🤖</div>
                    <div className="flex-1 space-y-6">
                        <div>
                            <h4 className="text-2xl font-black italic tracking-tight uppercase">Auditoría Demográfica Global</h4>
                            <p className="text-purple-400 text-[10px] font-black uppercase mt-1 tracking-[0.3em]">Bayt AI Strategic Analysis</p>
                        </div>
                        <p className="text-gray-300 text-lg font-medium leading-relaxed max-w-4xl italic">
                            "Tu audiencia dominante es <span className="text-white font-black underline italic">femenina (68%)</span>, joven (<span className="text-white font-black italic">18-24 años</span>) y altamente móvil. El <span className="text-emerald-400 font-black">82% de tus ventas</span> se cierran desde un smartphone, principalmente los sábados a las 8:45 PM. Estrategia recomendada: Reforzar pauta en Instagram Ads con formato vertical 'mobile-first' entre las 18h y las 22h para maximizar el ROI global."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInventory = () => (
        <>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                <div onClick={() => setSelectedInventoryCategory('winners')} className="group relative bg-white/40 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)] transition-all duration-500 cursor-pointer overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform"><Trophy size={24} /></div>
                                <div className="text-right"><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Top Revenue</span></div>
                            </div>
                            <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Ganadores</h3><p className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-[0.2em]">Escalabilidad detectada</p></div>
                            <div className="flex items-end gap-2"><span className="text-3xl font-black text-gray-900">+$124M</span><span className="text-[10px] font-black text-emerald-500 mb-1.5 flex items-center gap-1"><TrendingUp size={12}/> +18%</span></div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Analizar Potencial de Escala</span><div className="h-8 w-8 bg-gray-900 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"><ArrowRight size={16} /></div></div>
                    </div>
                </div>
                <div onClick={() => setSelectedInventoryCategory('reorder')} className="group relative bg-white/40 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.15)] transition-all duration-500 cursor-pointer overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform"><Zap size={24} /></div>
                                <div className="text-right"><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Alerta Stock</span></div>
                            </div>
                            <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Reabastecer</h3><p className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-[0.2em]">Pérdida inminente</p></div>
                            <div className="flex items-end gap-2"><span className="text-3xl font-black text-rose-600">-$8.4M</span><span className="text-[10px] font-black text-gray-400 mb-1.5 italic">Riesgo / Semana</span></div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Evitar Quiebre de Stock</span><div className="h-8 w-8 bg-gray-900 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"><ArrowRight size={16} /></div></div>
                    </div>
                </div>
                <div onClick={() => setSelectedInventoryCategory('stuck')} className="group relative bg-white/40 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(244,63,94,0.15)] transition-all duration-500 cursor-pointer overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="h-12 w-12 bg-rose-50 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform"><AlertTriangle size={24} /></div>
                                <div className="text-right"><span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">Capital Pegado</span></div>
                            </div>
                            <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Estancado</h3><p className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-[0.2em]">Flujo de caja bloqueado</p></div>
                            <div className="flex items-end gap-2"><span className="text-3xl font-black text-gray-900">$24.5M</span><span className="text-[10px] font-black text-rose-500 mb-1.5 italic">Inactivo</span></div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">Liberar Capital Ahora</span><div className="h-8 w-8 bg-gray-900 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"><ArrowRight size={16} /></div></div>
                    </div>
                </div>
                <div onClick={() => setSelectedInventoryCategory('decline')} className="group relative bg-white/40 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(245,158,11,0.15)] transition-all duration-500 cursor-pointer overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="h-12 w-12 bg-amber-50 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform"><TrendingDown size={24} /></div>
                                <div className="text-right"><span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">Curva Baja</span></div>
                            </div>
                            <div><h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">En Declive</h3><p className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-[0.2em]">Salida estratégica</p></div>
                            <div className="flex items-end gap-2"><span className="text-3xl font-black text-gray-900">-42%</span><span className="text-[10px] font-black text-amber-600 mb-1.5 italic">Vs. Mes Anterior</span></div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-amber-600 transition-colors">Ver Plan de Evacuación</span><div className="h-8 w-8 bg-gray-900 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"><ArrowRight size={16} /></div></div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 p-12 rounded-[3.5rem] text-white flex flex-col justify-center relative overflow-hidden min-h-[300px] mt-10">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest relative z-10">Inteligencia Predictiva</p>
                <h4 className="text-xl font-black mt-4 relative z-10 leading-relaxed italic">"Tus 'Fundas Silicona' tienen un 40% más de stock de lo que el sistema proyecta vender este trimestre. Sugerimos un descuento dinámico del 15%."</h4>
                <div className="absolute right-[-20px] bottom-[-20px] text-[12rem] opacity-[0.03] rotate-12 font-black"><DollarSign size={150}/></div>
            </div>
        </>
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
                <div className="flex items-center gap-4 relative">
                    <div className="relative">
                        <button 
                            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                            className="flex items-center bg-white p-2 rounded-3xl border border-gray-100 shadow-sm h-16 px-6 hover:border-purple-200 transition-all active:scale-95 group"
                        >
                            <Calendar size={18} className="text-purple-600 mr-4" />
                            <div className="flex flex-col items-start">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rango de Análisis</span>
                                <span className="text-[10px] font-black text-gray-900 uppercase">{startMonth} - {endMonth}</span>
                            </div>
                            <ChevronDown size={16} className={`text-gray-300 ml-4 transition-transform duration-300 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isPeriodDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full right-0 mt-3 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 z-[600] min-w-[450px]"
                                >
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Selector Desde */}
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Mes de Inicio
                                            </p>
                                            <div className="space-y-1">
                                                {availableMonths.map((m) => (
                                                    <button 
                                                        key={`start-${m}`}
                                                        onClick={() => setStartMonth(m)}
                                                        className={`w-full px-4 py-2.5 text-left text-[10px] font-black uppercase rounded-xl transition-all ${startMonth === m ? 'bg-gray-900 text-white shadow-lg scale-[1.02]' : 'text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Selector Hasta */}
                                        <div className="space-y-4 border-l border-gray-50 pl-8">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div> Mes de Cierre
                                            </p>
                                            <div className="space-y-1">
                                                {availableMonths.map((m) => (
                                                    <button 
                                                        key={`end-${m}`}
                                                        onClick={() => setEndMonth(m)}
                                                        className={`w-full px-4 py-2.5 text-left text-[10px] font-black uppercase rounded-xl transition-all ${endMonth === m ? 'bg-gray-900 text-white shadow-lg scale-[1.02]' : 'text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                                        <button 
                                            onClick={() => {
                                                setStartMonth(availableMonths[3]);
                                                setEndMonth(availableMonths[3]);
                                            }}
                                            className="text-[9px] font-black text-gray-400 uppercase underline hover:text-gray-900 transition-colors"
                                        >
                                            Reiniciar Rango
                                        </button>
                                        <button 
                                            onClick={() => setIsPeriodDropdownOpen(false)}
                                            className="px-8 py-3 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-all active:scale-95"
                                        >
                                            Aplicar Rango
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={handleDownloadReport} disabled={isGeneratingPDF} className="h-16 bg-gray-900 text-white px-8 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border border-white/10 disabled:opacity-50 transition-all hover:bg-black active:scale-95">{isGeneratingPDF ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />} Reporte</button>
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
                    {[ { id: 'overview', label: 'Resumen Estratégico', icon: <PieChart size={16}/> }, { id: 'traffic', label: 'Ruta de Compradores', icon: <Globe size={16}/> }, { id: 'conversion', label: 'Ventas & Embudo', icon: <Target size={16}/> }, { id: 'audience', label: 'Perfil de Audiencia', icon: <Users size={16}/> }, { id: 'inventory', label: 'Stock Inteligente', icon: <Package size={16}/> }, { id: 'marketing', label: 'Marketing & ROI', icon: <Rocket size={16}/> }, ].map(tab => (
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
                {selectedInventoryCategory && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col max-h-[90vh]">
                            <div className="bg-gray-900 p-8 text-white relative flex-shrink-0">
                                <button onClick={() => setSelectedInventoryCategory(null)} className="absolute top-8 right-8 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all z-10">
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-6">
                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl ${ selectedInventoryCategory === 'winners' ? 'bg-emerald-500 shadow-emerald-200' : selectedInventoryCategory === 'stuck' ? 'bg-rose-500 shadow-rose-200' : selectedInventoryCategory === 'decline' ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-500 shadow-blue-200'}`}>
                                        {selectedInventoryCategory === 'winners' ? <Trophy size={32}/> : selectedInventoryCategory === 'stuck' ? <AlertTriangle size={32}/> : selectedInventoryCategory === 'decline' ? <TrendingDown size={32}/> : <Zap size={32}/>}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight uppercase italic">
                                            {selectedInventoryCategory === 'winners' ? 'Optimización de Motores de Caja' : selectedInventoryCategory === 'stuck' ? 'Desbloqueo de Capital Muerto' : selectedInventoryCategory === 'decline' ? 'Plan de Salida Estratégica' : 'Rescate de Ventas Perdidas'}
                                        </h2>
                                        <p className="text-purple-400 text-[10px] font-black uppercase mt-1 tracking-[0.2em] italic">Intelligence Business Bayt AI</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-10 bg-gray-50/50 overflow-y-auto custom-scrollbar flex-1">
                                {isExecutingStrategy ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in zoom-in duration-500">
                                        <div className="relative">
                                            <div className="h-32 w-32 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 border-2 border-purple-500/30">
                                                <Bot size={60} className="text-purple-400 animate-pulse" />
                                            </div>
                                            <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl opacity-20 animate-ping"></div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Desplegando Táctica Bayt</h3>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">Ejecución en tiempo real...</p>
                                        </div>
                                        <div className="w-full max-w-md bg-gray-900 rounded-3xl p-8 shadow-2xl space-y-4 border border-white/5">
                                            {strategySteps.map((step, i) => (
                                                <div key={i} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                                                    <div className="h-4 w-4 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                                                    </div>
                                                    <p className="text-[11px] font-mono text-gray-300 leading-tight">{step}</p>
                                                </div>
                                            ))}
                                            <div className="h-4 w-1 bg-purple-500 animate-bounce ml-1.5 mt-2"></div>
                                        </div>
                                    </div>
                                ) : strategySteps.length > 0 && !isExecutingStrategy ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in zoom-in duration-500">
                                        <div className="h-32 w-32 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-white">
                                            <CheckCircle2 size={60} />
                                        </div>
                                        <div className="text-center space-y-4">
                                            <h3 className="text-3xl font-black text-gray-900 italic">¡Operación Completada!</h3>
                                            <p className="text-gray-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                                                Bayt ha desplegado la estrategia con éxito. Los resultados empezarán a reflejarse en tus métricas de BI en las próximas horas.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedInventoryCategory(null); setStrategySteps([]); }}
                                            className="px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black active:scale-95 transition-all"
                                        >
                                            Entendido, Volver al Dashboard
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4">Métricas de Alto Impacto</h4>
                                                <div className="space-y-6">
                                                    {selectedInventoryCategory === 'winners' ? (
                                                        <>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Profit Share</span><span className="text-xs text-gray-600 font-bold">Contribución neta total</span></div><span className="text-xl font-black text-emerald-600">65.4%</span></div>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">LTV Ratio</span><span className="text-xs text-gray-600 font-bold">Valor de vida del cliente</span></div><span className="text-xl font-black text-purple-600">3.2x</span></div>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Scaling Cap</span><span className="text-xs text-gray-600 font-bold">Potencial de escalado</span></div><span className="text-xl font-black text-gray-900">Alto</span></div>
                                                        </>
                                                    ) : selectedInventoryCategory === 'stuck' ? (
                                                        <>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Dead Capital</span><span className="text-xs text-gray-600 font-bold">Dinero sin rotación</span></div><span className="text-xl font-black text-rose-600">$24.5M</span></div>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Holding Cost</span><span className="text-xs text-gray-600 font-bold">Costo de inacción/mes</span></div><span className="text-xl font-black text-rose-500">$480.000</span></div>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Inventory Aging</span><span className="text-xs text-gray-600 font-bold">Antigüedad promedio</span></div><span className="text-xl font-black text-gray-900">58 días</span></div>
                                                        </>
                                                    ) : selectedInventoryCategory === 'decline' ? (
                                                        <>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Residue Risk</span><span className="text-xs text-gray-600 font-bold">Riesgo de obsolescencia</span></div><span className="text-xl font-black text-amber-600">Muy Alto</span></div>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Demand Drop</span><span className="text-xs text-gray-600 font-bold">Caída vs. Trimestre ant.</span></div><span className="text-xl font-black text-rose-600">-48.2%</span></div>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Evacuation Priority</span><span className="text-xs text-gray-600 font-bold">Nivel de urgencia</span></div><span className="text-xl font-black text-gray-900">Inmediata</span></div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Daily Lost Sales</span><span className="text-xs text-gray-600 font-bold">Ventas perdidas por día</span></div><span className="text-xl font-black text-rose-600">$1.2M</span></div>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Customer Churn Risk</span><span className="text-xs text-gray-600 font-bold">Riesgo de fuga a competencia</span></div><span className="text-xl font-black text-blue-600">Alto (15%)</span></div>
                                                            <div className="flex justify-between items-center group"><div className="space-y-1"><span className="text-[10px] text-gray-400 font-black uppercase block">Time-to-Out</span><span className="text-xs text-gray-600 font-bold">Tiempo para stock cero</span></div><span className="text-xl font-black text-gray-900">48 horas</span></div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-gray-900 p-10 rounded-[3rem] text-white space-y-8 flex flex-col justify-center relative overflow-hidden shadow-2xl">
                                                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none uppercase font-black text-8xl">BI</div>
                                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest italic relative z-10">Bayt Strategic Argumentation</p>
                                                <p className="text-base text-gray-300 font-medium leading-relaxed italic relative z-10">
                                                    {selectedInventoryCategory === 'winners' ? '"Estos productos son el 20% de tu inventario que genera el 80% de tu rentabilidad. El argumento para actuar es simple: si duplicas la inversión aquí, tu margen neto crecerá exponencialmente sin aumentar costos fijos. No solo vendes un producto, vendes el ancla de tu negocio."' :
                                                     selectedInventoryCategory === 'stuck' ? '"Tener $24.5M en una bodega es perder dinero cada hora por inflación y costo de oportunidad. Si liberas este capital hoy con un descuento del 25%, podrías reinvertirlo en [GANADORES] y generar $15M adicionales en 30 días. El capital estancado es el cáncer de la liquidez."' :
                                                     selectedInventoryCategory === 'decline' ? '"La demanda del mercado ha mutado. Seguir manteniendo este stock a precio full es una batalla perdida. El plan es evacuar el inventario restante mediante Bundles con productos Top para limpiar la bodega y recuperar el 100% de la inversión inicial antes de que el valor residual caiga a cero."' :
                                                     '"Cada minuto que el botón [Montar Orden] no es presionado, tu tienda está regalando clientes a la competencia. El costo de adquisición de un cliente nuevo es 5 veces mayor que retener a uno actual; no los dejes ir por falta de stock básico. Esta es una emergencia operativa."' }
                                                </p>
                                                <div className="h-px w-full bg-white/10 relative z-10"></div>
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-purple-400 border border-white/10 shadow-xl">🤖</div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Impacto Proyectado: <span className="text-emerald-400">Excelente</span></p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* NUEVO CARD: Hoja de Ruta Operativa */}
                                        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8 mt-10">
                                            <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                                        <Layers size={18} className="text-purple-600" /> Hoja de Ruta Operativa
                                                    </h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 ml-7">Secuencia de ejecución automatizada por Bayt</p>
                                                </div>
                                                <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                                                    <ZapIcon size={20} />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {selectedInventoryCategory && strategyDetails[selectedInventoryCategory].map((step, idx) => (
                                                    <div key={idx} className="relative p-6 bg-gray-50 rounded-[2rem] border border-transparent hover:border-purple-100 transition-all group">
                                                        <div className="absolute -top-3 -left-3 h-8 w-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                                                            {idx + 1}
                                                        </div>
                                                        <h5 className="text-xs font-black text-gray-900 uppercase mb-2 mt-2">{step.step}</h5>
                                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8 mt-10">
                                            {selectedInventoryCategory === 'winners' ? (
                                                <>
                                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                                        <div>
                                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                                                <Trophy size={18} className="text-emerald-500" /> Ranking de Rentabilidad Crítica (80/20)
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 ml-7">Productos 'Ancla' que generan el 80% de tu utilidad neta</p>
                                                        </div>
                                                        <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase italic">Core Business Assets</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {[
                                                            { rank: 1, name: "Tabletas Purificadoras X", margin: "68%", contribution: 124500000, efficiency: "Alta", label: "Ancla Principal" },
                                                            { rank: 2, name: "Kit Supervivencia 360", margin: "52%", contribution: 88400000, efficiency: "Máxima", label: "Multiplicador de Margen" },
                                                            { rank: 3, name: "Filtro de Carbón Pro", margin: "45%", contribution: 72000000, efficiency: "Estable", label: "Generador de Flujo" },
                                                            { rank: 4, name: "Botella Térmica Bayup", margin: "42%", contribution: 45000000, efficiency: "Media", label: "Activo de Retención" },
                                                            { rank: 5, name: "Linterna Solar Pro", margin: "38%", contribution: 36000000, efficiency: "Escalable", label: "Potencial de Crecimiento" }
                                                        ].map((product, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all border border-transparent hover:border-gray-100 group">
                                                                <div className="flex items-center gap-8">
                                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg ${ idx === 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : idx === 1 ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : idx === 2 ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-black text-gray-900 uppercase italic">{product.name}</p>
                                                                            <span className="text-[7px] font-black bg-gray-900 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">{product.label}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 mt-1">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Margen Neto: <span className="text-emerald-600">{product.margin}</span></p>
                                                                            <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Eficiencia: <span className="text-gray-900">{product.efficiency}</span></p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-black text-gray-900">+{formatCurrency(product.contribution)}</p>
                                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Contribución a Utilidad</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : selectedInventoryCategory === 'stuck' ? (
                                                <>
                                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                                        <div>
                                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                                                <DollarSign size={18} className="text-rose-500" /> Ranking de Rescate de Liquidez
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 ml-7">Capital 'Secuestrado': libéralo para reinvertir en activos de alto ROI</p>
                                                        </div>
                                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase italic animate-pulse">High Holding Cost</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {[
                                                            { rank: 1, name: "Fundas Silicona Pro", capital: 8500000, opportunity: 4200000, discount: "25%", aging: "92 días" },
                                                            { rank: 2, name: "Protector Pantalla X", capital: 6200000, opportunity: 3100000, discount: "30%", aging: "120 días" },
                                                            { rank: 3, name: "Cables USB-C Braided", capital: 4800000, opportunity: 2400000, discount: "20%", aging: "75 días" },
                                                            { rank: 4, name: "Soporte Coche MagSafe", capital: 3200000, opportunity: 1600000, discount: "15%", aging: "60 días" },
                                                            { rank: 5, name: "Adaptador Audio Jack", capital: 1800000, opportunity: 900000, discount: "40%", aging: "150 días" }
                                                        ].map((product, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-6 bg-rose-50/20 rounded-[2.5rem] hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all border border-transparent hover:border-rose-100 group">
                                                                <div className="flex items-center gap-8">
                                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg ${ idx === 0 ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-rose-400 border border-rose-100'}`}>
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-gray-900 uppercase italic">{product.name}</p>
                                                                        <div className="flex items-center gap-4 mt-1">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Antigüedad: <span className="text-rose-600">{product.aging}</span></p>
                                                                            <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Descuento Sugerido: <span className="text-gray-900 font-black">{product.discount}</span></p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-black text-rose-600">{formatCurrency(product.capital)}</p>
                                                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Potencial de Reinversión: +{formatCurrency(product.opportunity)}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : selectedInventoryCategory === 'decline' ? (
                                                <>
                                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                                        <div>
                                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                                                <TrendingDown size={18} className="text-amber-500" /> Ranking de Salida Estratégica (Bundles AI)
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 ml-7">Evacuación de inventario: recupera inversión antes de obsolescencia</p>
                                                        </div>
                                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase italic">Inventory Liquidation Phase</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {[
                                                            { rank: 1, name: "Cargador Solar 1.0", drop: "-62%", residual: 4200000, bundle: "Tabletas Purificadoras X", units: "45 uds" },
                                                            { rank: 2, name: "Brújula Clásica Pro", drop: "-45%", residual: 2800000, bundle: "Kit Supervivencia 360", units: "32 uds" },
                                                            { rank: 3, name: "Cantimplora Basic", drop: "-38%", residual: 1500000, bundle: "Botella Térmica Bayup", units: "115 uds" },
                                                            { rank: 4, name: "Cuerda Paracord (Azul)", drop: "-24%", residual: 950000, bundle: "Mochila Pro-Tactical", units: "210 uds" }
                                                        ].map((product, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-6 bg-amber-50/30 rounded-[2.5rem] hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all border border-transparent hover:border-amber-100 group">
                                                                <div className="flex items-center gap-8">
                                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg ${ idx === 0 ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-amber-400 border border-amber-100'}`}>
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-gray-900 uppercase italic">{product.name}</p>
                                                                        <div className="flex items-center gap-4 mt-1">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Caída Demanda: <span className="text-rose-500 font-black">{product.drop}</span></p>
                                                                            <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                                                            <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">Bundle Sugerido: <span className="text-gray-900">{product.bundle}</span></p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-black text-amber-600">{formatCurrency(product.residual)}</p>
                                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Valor Residual en Riesgo</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                                        <div>
                                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                                                <AlertCircle size={18} className="text-rose-500" /> Ranking de Emergencia Operativa
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 ml-7">Ventas en fuga: cada minuto sin stock regala clientes al rival</p>
                                                        </div>
                                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase italic animate-pulse">Critical Stockout Risk</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {[
                                                            { rank: 1, name: "PowerBank Solar 20k", lost: 1200000, churn: "Muy Alto", stock: "0 uds", time: "AGOTADO" },
                                                            { rank: 2, name: "Hamaca Ultra-Light", lost: 850000, churn: "Alto", stock: "2 uds", time: "4 horas" },
                                                            { rank: 3, name: "Navaja Multi-Tool", lost: 450000, churn: "Medio", stock: "5 uds", time: "12 horas" },
                                                            { rank: 4, name: "Mochila Pro-Tactical", lost: 320000, churn: "Bajo", stock: "8 uds", time: "1.5 días" }
                                                        ].map((product, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-6 bg-rose-50/30 rounded-[2.5rem] hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all border border-transparent hover:border-rose-100 group">
                                                                <div className="flex items-center gap-8">
                                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg ${ idx === 0 ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 animate-pulse' : idx === 1 ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-rose-400 border border-rose-100'}`}>
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-gray-900 uppercase italic">{product.name}</p>
                                                                        <div className="flex items-center gap-4 mt-1">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Stock Actual: <span className="text-rose-600 font-black">{product.stock}</span></p>
                                                                            <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tiempo para Stockout: <span className="text-gray-900">{product.time}</span></p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-black text-rose-600">-{formatCurrency(product.lost)}/día</p>
                                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Venta Perdida Proyectada</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-8 bg-white border-t border-gray-100 flex gap-6">
                                <button onClick={() => setSelectedInventoryCategory(null)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] hover:text-gray-900 transition-colors">Posponer Análisis</button>
                                <button 
                                    onClick={handleExecuteStrategicPlan}
                                    disabled={isExecutingStrategy || (selectedInventoryCategory && isAlreadyExecuted(selectedInventoryCategory))}
                                    className={`flex-[2.5] py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 ${
                                        selectedInventoryCategory && isAlreadyExecuted(selectedInventoryCategory) 
                                        ? 'bg-emerald-500 text-white cursor-not-allowed' 
                                        : 'bg-gray-900 hover:bg-black text-white'
                                    }`}
                                >
                                    {isExecutingStrategy ? (
                                        <>Desplegando Estrategia... <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                                    ) : selectedInventoryCategory && isAlreadyExecuted(selectedInventoryCategory) ? (
                                        <>Bayt ya está optimizando esto <CheckCircle2 size={16} /></>
                                    ) : (
                                        <>Ejecutar Plan Estratégico Bayt <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" /></>
                                    )}
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
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsProductHistoryModalOpen(false);
                                    }} 
                                    className="absolute top-8 right-8 h-12 w-12 bg-white/10 hover:bg-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-90 z-[100] group/close"
                                >
                                    <X size={24} className="text-white group-hover/close:rotate-90 transition-transform duration-300" />
                                </button>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="h-16 w-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-white/10">
                                        💡
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight uppercase italic text-white">Tabletas Purificadoras X</h2>
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
                                <button onClick={() => setIsProductHistoryModalOpen(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-colors">
                                    Cerrar Análisis
                                </button>
                                <button onClick={() => { setIsProductHistoryModalOpen(false); setIsOrderModalOpen(true); }} className="flex-[2] py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                                    Proceder con la Orden de Compra
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isOrderModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col max-h-[90vh]">
                            <div className="bg-gray-900 p-8 text-white flex-shrink-0 relative">
                                <button onClick={() => setIsOrderModalOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all">
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-amber-500 rounded-[1.5rem] flex items-center justify-center shadow-lg">
                                        <ShoppingCart size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">Orden de Compra</h2>
                                        <p className="text-amber-400 text-[10px] font-black uppercase mt-1">Bayt Sugerencia</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/30 custom-scrollbar">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                        <span className="text-[10px] font-black uppercase text-gray-400">Producto</span>
                                        <span className="text-sm font-black text-gray-900">{orderForm.productName}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase">Unidades</label>
                                            <input 
                                                type="text" 
                                                value={formatNumber(orderForm.quantity)} 
                                                onChange={(e) => setOrderForm({ ...orderForm, quantity: unformatNumber(e.target.value) })} 
                                                className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase">Total</label>
                                            <div className="w-full p-4 bg-gray-100 rounded-2xl font-black text-gray-500">{formatCurrency(orderForm.quantity * orderForm.pricePerUnit)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 relative">
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
                                    <div className="grid grid-cols-3 gap-4">
                                        {[{ id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={18}/> }, { id: 'email', label: 'Email', icon: <Mail size={18}/> }, { id: 'reminder', label: 'Programar', icon: <Clock size={18}/> }].map((method) => (
                                            <div key={method.id} onClick={() => setOrderForm({ ...orderForm, sending_method: method.id as any })} className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${orderForm.sending_method === method.id ? 'bg-purple-50 border-purple-600 shadow-md' : 'bg-white border-gray-100 opacity-60'}`}>
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${orderForm.sending_method === method.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    {method.icon}
                                                </div>
                                                <span className="text-[9px] font-black uppercase">{method.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-white border-t border-gray-100 flex gap-4">
                                <button onClick={() => setIsOrderModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                                <button onClick={handleConfirmOrder} disabled={isSubmittingOrder} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] active:scale-95 transition-all">{isSubmittingOrder ? 'Cargando...' : 'Confirmar Pedido'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isRegisterProviderOpen && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20">
                            <div className="bg-gray-900 p-8 text-white">
                                <h2 className="text-xl font-black tracking-tight flex items-center gap-3"><Users size={20}/> Nuevo Proveedor</h2>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Nombre Comercial</label>
                                    <input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" placeholder="Ej: Distribuidora Tech S.A." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2">WhatsApp</label>
                                    <input value={newProvider.phone} onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" placeholder="+57 300 000 0000" />
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 flex gap-4">
                                <button onClick={() => setIsRegisterProviderOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                                <button onClick={handleCreateProvider} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all">Registrar Proveedor</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {selectedCoupon && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col max-h-[90vh]">
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
                                    <X size={24} className="text-white group-hover/close:rotate-90 transition-transform duration-300" />
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

                            <div className="p-10 space-y-10 bg-gray-50/50 overflow-y-auto custom-scrollbar flex-1">
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

                                    <div className="bg-gray-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 font-black uppercase pointer-events-none">TECH</div>
                                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Tecnología & Origen</h4>
                                        <div className="space-y-10">
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
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">Canales de Llegada</p>
                                                <div className="space-y-3">
                                                    {[ { s: 'Instagram', p: '55%', i: <Share2 size={10}/> }, { s: 'WhatsApp', p: '25%', i: <MessageSquare size={10}/> }, { s: 'Facebook', p: '15%', i: <Globe size={10}/> }, { s: 'Otros', p: '5%', i: <Search size={10}/> } ].map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <span className="w-16 text-[9px] font-bold text-gray-400 uppercase">{item.s}</span>
                                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: item.p }} /></div>
                                                            <span className="w-8 text-[9px] font-black text-emerald-400 text-right">{item.p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3"><Clock size={16} className="text-amber-500" /> Picos de Actividad</h4>
                                        <div className="flex items-end justify-between h-40 pt-4 gap-2">
                                            {[ 20, 35, 25, 60, 95, 80, 45, 30 ].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="w-full bg-gray-50 rounded-t-xl relative overflow-hidden flex items-end h-full">
                                                        <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} className={`w-full ${h > 80 ? 'bg-amber-500' : 'bg-gray-200'} group-hover:bg-purple-600 transition-colors`} />
                                                    </div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase">{['08h', '10h', '12h', '14h', '18h', '20h', '22h', '00h'][i]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm grid grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-2"><Globe size={12} className="text-blue-500"/> Geografía</h4>
                                            <div className="space-y-4">
                                                {[ { l: 'Bogotá', p: '42%' }, { l: 'Medellín', p: '28%' }, { l: 'Cali', p: '12%' }, { l: 'Otras', p: '18%' } ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center group"><span className="text-[10px] font-bold text-gray-600 uppercase">{item.l}</span><span className="text-[10px] font-black text-gray-900">{item.p}</span></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-2"><Calendar size={12} className="text-emerald-500"/> Días Top</h4>
                                            <div className="space-y-4">
                                                {[ { d: 'Sábados', p: '35%' }, { d: 'Viernes', p: '25%' }, { d: 'Domingos', p: '20%' }, { d: 'Otros', p: '20%' } ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center group"><span className="text-[10px] font-bold text-gray-600 uppercase">{item.d}</span><span className="text-[10px] font-black text-gray-900">{item.p}</span></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="relative z-10 flex items-start gap-8">
                                        <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-xl">🤖</div>
                                        <div className="flex-1 space-y-4">
                                            <h4 className="text-xl font-black italic tracking-tight">Análisis Estratégico de Campaña</h4>
                                            <p className="text-purple-50 text-sm font-medium leading-relaxed max-w-2xl italic">"Esta campaña ha sido altamente efectiva para atraer a un público joven mayoritariamente femenino. El rendimiento en dispositivos móviles es superior a la media. Se recomienda extender la vigencia por 15 días más dada la alta rentabilidad detectada."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-white border-t border-gray-100">
                                <button onClick={() => setSelectedCoupon(null)} className="w-full py-5 bg-gray-900 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                    Cerrar Análisis de Campaña <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

                        {/* Banner Final Predictivo - Rediseño Slim Elegante */}
                        <div className="max-w-7xl mx-auto mt-20 relative overflow-hidden rounded-[2.5rem] group shadow-2xl border border-white/5">
                            <div className="absolute inset-0 bg-[#004953] backdrop-blur-xl">
                                <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#00F2FF]/5 to-transparent opacity-50"></div>
                            </div>
            
                                            <div className="relative px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-12 z-10">
                                                <div className="flex items-center gap-10 flex-1">
                                                    <div className="shrink-0 relative">
                                                        <div className="h-16 w-16 bg-gray-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-[#00F2FF]/30">
                                                            <Bot size={36} className="text-[#00F2FF] animate-pulse" />
                                                        </div>
                                                        <div className="absolute inset-0 bg-[#00F2FF]/20 blur-2xl rounded-full"></div>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[8px] font-black text-[#00F2FF] uppercase tracking-[0.4em] px-3 py-1 border border-[#00F2FF]/20 rounded-md">Critical Business Insight</span>
                                                            <div className="h-1 w-1 bg-[#00F2FF]/40 rounded-full"></div>
                                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest italic font-mono">Status: Analysis Active</p>
                                                        </div>
                                                        <h3 className="text-base md:text-xl font-medium text-white/90 leading-tight italic max-w-2xl">
                                                            "Tu conversión móvil <span className="text-[#00F2FF] font-black underline decoration-2 underline-offset-8">ha bajado un 12%</span> por latencia crítica en Android (3s+)."
                                                        </h3>
                                                    </div>
                                                </div>
                            
                                                <div className="flex items-center gap-12 pl-12 border-l border-white/10">
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Impacto Mensual</p>
                                                        <p className="text-3xl font-black text-white italic tracking-tighter">
                                                            <span className="text-[#00F2FF]">$</span>2.450.000
                                                        </p>
                                                    </div>
                                                    <button className="px-10 py-4 bg-white text-gray-900 hover:bg-[#00F2FF] transition-all rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 flex items-center gap-3 group/btn">
                                                        RESCATAR CAPITAL <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>                        </div>        </div>
    );
}