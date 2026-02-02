"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Zap, Eye, MousePointer2, DollarSign, Activity, Users, Globe, Clock, 
  ShoppingCart, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Monitor, Smartphone, Search, 
  PieChart as LucidePieChart, BarChart3, Calendar, Layers, Sparkles, ChevronDown, Timer, ExternalLink, MessageSquare, 
  Mail, Share2, Download, Rocket, Trophy, ChevronRight, CheckCircle2, X, ArrowRight, Tag, AlertCircle,
  ZapIcon, Bot, Lightbulb, Info, HelpCircle, Radar,
  History as LucideHistory,
  Scale,
  Crown,
  Warehouse,
  BadgePercent,
  Workflow,
  ShieldCheck
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
    const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);

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
            <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-12 border border-white/10">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center shadow-3xl relative z-10">
                    <Bot size={64} className="text-[#00f2ff] animate-bounce-slow" />
                </div>
                <div className="flex-1 relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Strategic Analyst</span>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight italic uppercase">Análisis Ejecutivo del Negocio</h3>
                    <p className="text-gray-300 text-lg leading-relaxed font-medium italic">"Tu conversión está en el <span className="text-[#00f2ff] font-bold">4.8%</span>, pero detecto una <span className="text-rose-400 font-bold">fuga del 61%</span> al iniciar el checkout. Si ajustamos los costos de envío hoy, podríamos recuperar <span className="text-white font-bold">$24.5M</span>."</p>
                </div>
                <button onClick={() => setActiveTab('marketing')} className="relative z-10 px-10 py-5 bg-[#00f2ff] text-[#001a1a] rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(0,242,255,0.3)]"><Rocket size={18}/> Activar Rescate AI</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[ 
                    { label: 'Ventas Hoy', val: 3450000, trend: '+18.5%', up: true, h: 'Dinero real generado hoy.', icon: <DollarSign size={20}/>, color: 'text-[#004d4d]' }, 
                    { label: 'Ticket Promedio', val: 124000, trend: '+5.2%', up: true, h: 'Gasto promedio por cliente.', icon: <ShoppingCart size={20}/>, color: 'text-purple-500' }, 
                    { label: 'Pedidos Hoy', val: 42, trend: '-2.1%', up: false, h: 'Órdenes procesadas hoy.', icon: <Package size={20}/>, color: 'text-blue-500' }, 
                    { label: 'Tasa Conversión', val: '4.8%', trend: '+0.4%', up: true, h: 'Visitas que terminan en compra.', icon: <Target size={20}/>, color: 'text-emerald-500' }, 
                ].map((kpi, i) => (
                    <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all cursor-help relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg ${kpi.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{kpi.trend}</div>
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{typeof kpi.val === 'number' ? formatCurrency(kpi.val) : kpi.val}</h3>
                        </div>
                        <div className="absolute inset-0 bg-gray-900/95 p-8 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[2.5rem] z-20">
                            <p className="text-white text-xs font-medium leading-relaxed">{kpi.h}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner"><AlertCircle size={24}/></div>
                                <div><h4 className="text-xl font-black text-gray-900 uppercase italic">Fuga de Capital</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Abandono Crítico en Checkout</p></div>
                            </div>
                            <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[8px] font-black uppercase rounded-lg border border-rose-100">Alerta Roja</span>
                        </div>
                        <p className="text-base text-gray-500 font-medium leading-relaxed italic">El <span className="font-black text-gray-900 underline decoration-rose-500 decoration-2 underline-offset-4">61% de tus clientes</span> abandonan al ver el costo de envío. Sugerimos una estrategia de 'Envío Gratis' por compras superiores a $150k.</p>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner text-center"><p className="text-2xl font-black text-gray-900">{formatCurrency(24500000)}</p><p className="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-widest">Valor Perdido</p></div>
                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner text-center"><p className="text-2xl font-black text-rose-600">128</p><p className="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-widest">Abandonos</p></div>
                        </div>
                    </div>
                </div>
                <div className="bg-[#004d4d] p-12 rounded-[4rem] text-white shadow-2xl flex flex-col justify-between min-h-[350px] relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><CheckCircle2 size={300} fill="white"/></div>
                    <div className="space-y-8 relative z-10">
                        <div className="flex items-center justify-between border-b border-white/10 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white/10 text-[#00f2ff] rounded-2xl flex items-center justify-center shadow-inner"><ShieldCheck size={24}/></div>
                                <div><h4 className="text-xl font-black uppercase italic tracking-tight">Éxito de Recuperación</h4><p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Performance del Motor AI</p></div>
                            </div>
                            <span className="px-3 py-1 bg-[#00f2ff]/10 text-[#00f2ff] text-[8px] font-black uppercase rounded-lg border border-[#00f2ff]/20">Optimizado</span>
                        </div>
                        <p className="text-gray-200 text-base font-medium leading-relaxed italic">"Gracias a las automatizaciones de WhatsApp, hemos rescatado <span className="font-black text-[#00f2ff] underline underline-offset-4">8.9 millones de pesos</span> este mes. Tu tasa de cierre es del 32%."</p>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="text-center md:text-left"><p className="text-4xl font-black text-[#00f2ff]">{formatCurrency(8900000)}</p><p className="text-[9px] font-black text-white/40 uppercase mt-2 tracking-widest">Rescatado hoy</p></div>
                            <div className="text-center md:text-right"><p className="text-4xl font-black text-white">32%</p><p className="text-[9px] font-black text-white/40 uppercase mt-2 tracking-widest">ROI: +420%</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rankings Estratégicos de Productos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div 
                    onMouseEnter={() => setIsCelebrating(true)}
                    onMouseLeave={() => setIsCelebrating(false)}
                    onMouseMove={handleMouseMove}
                    className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10 relative overflow-hidden group/card"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/card:bg-amber-500/10 transition-colors duration-700"></div>
                    
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

                    <div className="flex items-center justify-between border-b border-gray-100 pb-8 relative z-10">
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
                            <div key={idx} className="flex items-center justify-between p-6 hover:bg-white rounded-[2.5rem] transition-all duration-500 group cursor-pointer border border-transparent hover:border-gray-100 hover:shadow-xl">
                                <div className="flex items-center gap-8">
                                    <span className={`text-[10px] font-black italic ${prod.color} w-6 tracking-tighter group-hover:scale-110 transition-transform`}>{prod.rank}</span>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight italic group-hover:text-[#004d4d] transition-colors">{prod.name}</p>
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

                <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white space-y-10 shadow-2xl relative overflow-hidden group border border-white/10">
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
                            <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group/item">
                                <div className="space-y-1">
                                    <p className="text-sm font-black italic tracking-tight">{prod.name}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Inactivo por: {prod.days}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-[#00F2FF] italic">{formatCurrency(prod.capital)}</p>
                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Capital Inerte</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-white/10 relative z-10">
                        <button onClick={() => setActiveTab('inventory')} className="w-full py-5 bg-[#00f2ff] text-[#001a1a] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)]">Liberar Capital Ahora</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10 relative overflow-hidden group/search">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/search:bg-blue-500/10 transition-colors duration-700"></div>
                    
                    <div className="flex items-center justify-between border-b border-gray-100 pb-8">
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
                            <div key={idx} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[2.5rem] hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-50 group">
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

                <div className="bg-[#004d4d] p-12 rounded-[4rem] text-white flex flex-col justify-between relative overflow-hidden group shadow-2xl border border-white/5">
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
                        
                        <p className="text-lg font-medium text-gray-300 mt-10 leading-relaxed italic">
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
                        <button onClick={() => setActiveTab('inventory')} className="px-10 py-5 bg-[#00F2FF] text-[#001a1a] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-white transition-all active:scale-95">Ir a Inventario</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTraffic = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-12">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Ruta de Adquisición</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Bayt: "Tu mayor volumen viene de Instagram Ads, pero Google SEO tiene el menor rebote."</p>
                    </div>
                    <div className="space-y-8">
                        {[ 
                            { s: 'Directo', p: '36%', c: 'bg-gray-900', t: '4m 20s' }, 
                            { s: 'Instagram Ads', p: '25%', c: 'bg-[#9333ea]', t: '1m 45s' }, 
                            { s: 'Google SEO', p: '14%', c: 'bg-[#004d4d]', t: '3m 10s' } 
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
                <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white flex flex-col justify-between relative overflow-hidden group border border-white/5 shadow-2xl">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)]"></div>
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <Clock size={220} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xl font-black flex items-center gap-3 uppercase italic">
                                <Timer className="text-[#00f2ff] animate-pulse"/> Hora de Oro
                            </h4>
                            <span className="text-[8px] font-black bg-[#00f2ff]/20 text-[#00f2ff] px-3 py-1 rounded-full uppercase tracking-widest border border-[#00f2ff]/30">Live Analysis</span>
                        </div>
                        
                        <p className="text-base font-medium text-gray-300 mt-8 leading-relaxed italic">
                            "Tus ventas reales se concentran entre las <span className="text-white font-black underline decoration-[#00f2ff] decoration-4 underline-offset-8">8:30 PM y las 10:00 PM</span>. Bayt recomienda programar tus notificaciones push en este rango."
                        </p>
                    </div>

                    <div className="relative z-10 mt-10 space-y-6">
                        <div className="flex items-end gap-1.5 h-16">
                            {[15, 25, 40, 30, 20, 15, 35, 60, 95, 100, 85, 40].map((h, i) => (
                                <div key={i} className="flex-1 bg-white/5 rounded-t-lg relative overflow-hidden h-full">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        className={`absolute bottom-0 w-full ${h > 80 ? 'bg-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-gray-700'}`}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <Layers size={18} className="text-[#004d4d]" /> Flujo Interno Bayup
                        </h4>
                        <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase italic">User Journey Mapping</span>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                        {[
                            { from: 'Home / Landing', to: 'Catálogo General', p: '85%', color: 'bg-gray-900' },
                            { from: 'Catálogo General', to: 'Página de Producto', p: '42%', color: 'bg-[#004d4d]' },
                            { from: 'Página de Producto', to: 'Carrito / Checkout', p: '18%', color: 'bg-purple-600' },
                            { from: 'Checkout', to: 'Orden Completada', p: '4.2%', color: 'bg-emerald-500' }
                        ].map((flow, idx) => (
                            <div key={idx} className="flex items-center gap-6 group">
                                <div className="w-32 text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate">{flow.from}</p>
                                </div>
                                <div className="flex-1 relative h-10 flex items-center">
                                    <div className="absolute inset-0 bg-gray-100 rounded-2xl"></div>
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: flow.p }} 
                                        className={`absolute inset-y-1.5 left-1.5 ${flow.color} rounded-xl shadow-lg`} 
                                    />
                                    <div className="relative z-10 w-full flex justify-center">
                                        <span className="text-[10px] font-black text-white mix-blend-difference uppercase italic">{flow.p} de retención</span>
                                    </div>
                                </div>
                                <div className="w-32">
                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter truncate italic">{flow.to}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#004d4d] p-12 rounded-[4rem] text-white space-y-10 shadow-2xl relative overflow-hidden group border border-white/5">
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
                            <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group/item">
                                <div className="space-y-1">
                                    <p className="text-sm font-black italic tracking-tight">{exit.page}</p>
                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{exit.reason}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-rose-400 italic">{exit.loss}</p>
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Abandonan Aquí</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10 flex flex-col justify-between">
                    <div>
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <Search size={16} className="text-blue-500" /> Eficacia de Búsqueda
                        </h4>
                        <div className="mt-10 text-center space-y-2">
                            <p className="text-5xl font-black text-gray-900 tracking-tighter italic">72%</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Encuentran su producto</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 font-medium italic leading-relaxed text-center">
                        "El 28% restante no encuentra resultados. Bayt recomienda añadir 'Sinónimos AI' para términos como 'termo' vs 'botella'."
                    </p>
                </div>

                <div className="lg:col-span-2 bg-[#001a1a] p-12 rounded-[4rem] text-white relative overflow-hidden group shadow-2xl border border-white/5">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)]"></div>
                    <div className="relative z-10 flex items-start gap-12">
                        <div className="h-24 w-24 bg-gray-900 rounded-[2.5rem] border-2 border-[#00f2ff]/50 flex items-center justify-center text-5xl shadow-3xl animate-pulse">🚀</div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <h4 className="text-2xl font-black italic tracking-tight uppercase">Optimización de Rutas Bayt</h4>
                                <p className="text-[#00F2FF] text-[10px] font-black uppercase mt-1 tracking-[0.3em]">IA Performance Insight</p>
                            </div>
                            <p className="text-gray-300 text-lg font-medium leading-relaxed italic max-w-3xl">
                                "He detectado que los usuarios que entran por <span className="text-white font-black underline decoration-[#00f2ff] decoration-2 underline-offset-8">Instagram Ads</span> tienen una ruta 3x más corta hacia el carrito, pero abandonan masivamente en el cálculo de envío. Si implementas 'Envío Gratis' automático para este canal, el ROI proyectado subirá un <span className="text-[#00f2ff] font-black">18%</span>."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConversion = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-white/60 backdrop-blur-md p-16 rounded-[4rem] border border-white/80 shadow-sm max-w-5xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-emerald-500" />
                
                <div className="text-center mb-20 space-y-4">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Embudo de Conversión Real</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Auditoría Quirúrgica de Ventas Bayup</p>
                </div>

                <div className="space-y-6">
                    {[ 
                        { step: 'Sesiones Totales', sub: 'Tráfico global calificado', val: 12450, pct: 100, loss: 0, money: 0, insight: 'Base de entrada mensual.' }, 
                        { step: 'Visualización de Producto', sub: 'Interés real en el catálogo', val: 8420, pct: 67, loss: 33, money: 14200000, insight: 'Mejorar calidad de fotos.' }, 
                        { step: 'Agregaron al Carrito', sub: 'Intención de compra detectada', val: 2150, pct: 17, loss: 74, money: 28500000, insight: 'Simplificar opciones de talla.' }, 
                        { step: 'Compra Finalizada', sub: 'Conversión y cierre de caja', val: 524, pct: 4.2, loss: 37, money: 12400000, insight: 'Fuga por costos de envío.' } 
                    ].map((item, i) => (
                        <div key={i} className="group relative">
                            <div className="flex items-center gap-12 py-12 px-12 hover:bg-white rounded-[3.5rem] border border-transparent hover:border-gray-100 hover:shadow-xl transition-all duration-500">
                                <div className="w-20 h-20 bg-gray-900 text-[#00f2ff] rounded-[2rem] flex items-center justify-center font-black text-2xl shadow-xl group-hover:scale-110 transition-transform italic">
                                    0{i+1}
                                </div>
                                
                                <div className="flex-1 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-4">
                                                <span className="font-black uppercase text-sm text-gray-900 italic tracking-tight">{item.step}</span>
                                                <span className="px-3 py-1 bg-[#00f2ff]/10 text-[#004d4d] rounded-full text-[8px] font-black uppercase tracking-widest border border-[#00f2ff]/20">Bayt Insight: {item.insight}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-gray-900 italic">{item.val.toLocaleString()}</span>
                                            <span className="text-[11px] font-black text-[#004d4d] ml-3 opacity-40">{item.pct}%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner p-1 border border-gray-100">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${item.pct}%` }} 
                                            className={`h-full ${i === 3 ? 'bg-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-[#004d4d]'} rounded-full transition-all duration-1000`} 
                                        />
                                    </div>
                                </div>

                                <div className="w-48 text-right shrink-0">
                                    {item.loss > 0 ? (
                                        <div className="space-y-1">
                                            <p className="text-lg font-black text-rose-500">-{item.loss}% Fuga</p>
                                            <p className="text-[9px] font-bold text-rose-300 uppercase tracking-widest">-{formatCurrency(item.money)} en riesgo</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 text-center">
                                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100 shadow-sm">Punto de Origen</span>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2">100% Retención</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {i < 3 && (
                                <div className="flex justify-center -my-6 relative z-10">
                                    <div className="bg-white p-3 rounded-full border border-gray-100 text-[#00f2ff] shadow-lg animate-bounce">
                                        <ChevronDown size={24} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-20 pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-[#00f2ff]/10 text-[#004d4d] rounded-3xl flex items-center justify-center shadow-inner">
                            <Target size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Conversión Final</p>
                            <p className="text-3xl font-black text-gray-900 italic tracking-tighter">4.2% <span className="text-sm text-emerald-500 font-black ml-2">Excellent Performance</span></p>
                        </div>
                    </div>
                    <button onClick={() => setActiveTab('marketing')} className="px-12 py-6 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl active:scale-95">Activar Optimización AI</button>
                </div>
            </div>
        </div>
    );

    const renderAudience = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#004d4d] to-[#00f2ff]"></div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-12 italic">Composición de Audiencia</h4>
                    <div className="relative h-64 w-64 flex items-center justify-center">
                        <div className="h-56 w-56 rounded-full border-[24px] border-[#001a1a] flex flex-col items-center justify-center bg-white shadow-[0_0_50px_rgba(0,242,255,0.1)] relative z-10 group-hover:scale-105 transition-transform duration-700">
                            <p className="text-6xl font-black text-gray-900 italic tracking-tighter">35%</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">Clientes Fieles</p>
                        </div>
                        <div className="absolute -top-6 -right-6 px-8 py-4 bg-[#00f2ff] text-[#001a1a] rounded-[2rem] transform rotate-12 shadow-2xl z-20 border-4 border-white">
                            <p className="text-sm font-black italic uppercase">65% Nuevos</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium mt-12 leading-relaxed max-w-[240px] italic">
                        "Tu tasa de retención ha subido un <span className="text-emerald-500 font-black">4.2%</span> este mes. Los clientes fieles generan el 58% de tus ingresos."
                    </p>
                </div>

                <div className="lg:col-span-2 bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-12">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Demografía Estratégica</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Perfil Biopsicosocial del Comprador Bayup</p>
                        </div>
                        <div className="h-14 w-14 bg-[#004d4d]/5 rounded-3xl flex items-center justify-center text-[#004d4d] shadow-inner border border-[#004d4d]/10">
                            <Users size={28} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                                <div className="h-8 w-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500"><Layers size={16}/></div>
                                <p className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Distribución de Género</p>
                            </div>
                            <div className="space-y-8">
                                {[ 
                                    { g: 'Mujeres', p: '68%', c: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.4)]' }, 
                                    { g: 'Hombres', p: '28%', c: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.4)]' },
                                    { g: 'Otros', p: '4%', c: 'bg-gray-300' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-3 group cursor-default">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-gray-400 group-hover:text-gray-900 transition-colors">{item.g}</span>
                                            <span className="text-gray-900">{item.p}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-gray-100">
                                            <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full transition-all duration-1000`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                                <div className="h-8 w-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Timer size={16}/></div>
                                <p className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Rango de Edad</p>
                            </div>
                            <div className="space-y-8">
                                {[ 
                                    { r: '18 - 24 años', p: '45%', c: 'bg-[#004d4d] shadow-[0_0_10px_rgba(0,77,77,0.3)]' }, 
                                    { r: '25 - 34 años', p: '38%', c: 'bg-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.3)]' },
                                    { r: '35+ años', p: '17%', c: 'bg-gray-400' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-3 group cursor-default">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-gray-400 group-hover:text-gray-900 transition-colors">{item.r}</span>
                                            <span className="text-gray-900">{item.p}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-gray-100">
                                            <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full transition-all duration-1000`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-md p-16 rounded-[4rem] border border-white/80 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00f2ff]"></div>
                <div className="flex flex-col md:flex-row justify-between items-start mb-20 gap-8">
                    <div>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Edad & Conversión Real</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Diferencia Crítica entre Tráfico y Facturación</p>
                    </div>
                    <div className="flex gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                        <button 
                            onClick={() => setAudienceView(audienceView === 'traffic' ? 'all' : 'traffic')}
                            className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all ${
                                audienceView === 'traffic' 
                                ? 'bg-[#001a1a] text-white shadow-xl scale-105' 
                                : 'text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            <div className={`h-2.5 w-2.5 rounded-full ${audienceView === 'traffic' ? 'bg-[#00f2ff] animate-pulse shadow-[0_0_8px_#00f2ff]' : 'bg-gray-200'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Tráfico</span>
                        </button>
                        <button 
                            onClick={() => setAudienceView(audienceView === 'conversion' ? 'all' : 'conversion')}
                            className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all ${
                                audienceView === 'conversion' 
                                ? 'bg-[#004d4d] text-white shadow-xl scale-105' 
                                : 'text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_#00f2ff] ${audienceView === 'conversion' ? 'bg-[#00f2ff] animate-pulse' : 'bg-gray-200'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Ventas</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-16">
                    {[
                        { range: '18 - 24 años', views: '45%', sales: '12%', color: 'bg-gray-900', glow: 'shadow-[0_0_20px_rgba(0,0,0,0.1)]' },
                        { range: '25 - 34 años', views: '38%', sales: '65%', color: 'bg-[#00f2ff]', glow: 'shadow-[0_0_30px_rgba(0,242,255,0.4)]' },
                        { range: '35 - 44 años', views: '12%', sales: '18%', color: 'bg-[#004d4d]', glow: 'shadow-[0_0_20px_rgba(0,77,77,0.3)]' },
                        { range: '45+ años', views: '5%', sales: '5%', color: 'bg-gray-400', glow: 'shadow-sm' }
                    ].map((age, i) => (
                        <div key={i} className={`grid grid-cols-1 md:grid-cols-12 items-center gap-12 group/row transition-all duration-700 ${
                            audienceView === 'all' ? 'opacity-100' : 
                            (audienceView === 'traffic' || audienceView === 'conversion') ? 'opacity-100' : 'opacity-20 blur-[1px]'
                        }`}>
                            <div className="md:col-span-3 space-y-1">
                                <span className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">{age.range}</span>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-1 w-1 rounded-full bg-[#004d4d]"></div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Core Group {i+1}</p>
                                </div>
                            </div>
                            <div className="md:col-span-6 space-y-5">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                                    <span className={`transition-all duration-500 ${audienceView === 'traffic' ? 'text-[#004d4d] scale-110' : 'text-gray-400'}`}>Visitas ({age.views})</span>
                                    <span className={`transition-all duration-500 ${audienceView === 'conversion' ? 'text-[#00f2ff] font-black scale-110' : 'text-gray-400'}`}>Ventas Reales ({age.sales})</span>
                                </div>
                                <div className="h-5 bg-gray-50 rounded-full overflow-hidden shadow-inner p-1 border border-gray-100 relative">
                                    <div 
                                        className={`bg-gray-200 h-full rounded-l-full border-r-2 border-white transition-all duration-1000 ${audienceView === 'conversion' ? 'opacity-10 blur-[2px]' : 'opacity-100'}`} 
                                        style={{ width: age.views }} 
                                    />
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: age.sales }} 
                                        className={`${age.color} h-full rounded-r-full relative transition-all duration-1000 ${
                                            audienceView === 'traffic' ? 'opacity-10 blur-[2px]' : `opacity-100 ${age.glow}`
                                        }`} 
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-3 bg-gray-50 p-6 rounded-[2rem] border border-transparent group-hover/row:border-gray-100 transition-all shadow-inner">
                                <p className="text-[10px] font-bold text-gray-500 italic leading-relaxed text-center">
                                    {i === 0 ? 'Mucho tráfico curioso, pero conversión por debajo de la media.' :
                                     i === 1 ? 'Tu motor financiero real. Máxima eficiencia de compra detectada.' :
                                     i === 2 ? 'Público maduro con alto ticket promedio y lealtad de marca.' :
                                     'Nicho estable con comportamiento de compra predecible.'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white space-y-10 shadow-2xl relative overflow-hidden group border border-white/5">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)]"></div>
                    <div className="absolute -right-10 -bottom-10 text-[15rem] font-black text-white/5 pointer-events-none uppercase italic">TECH</div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-[0.3em] italic text-[#00f2ff]">Tecnología & Origen</h4>
                        <ZapIcon size={24} className="text-[#00f2ff] animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 gap-12 relative z-10">
                        <div className="text-center p-10 bg-white/5 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all duration-500 shadow-xl">
                            <Smartphone size={48} className="mx-auto text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
                            <p className="text-5xl font-black italic tracking-tighter">82%</p>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">Tráfico Móvil</p>
                        </div>
                        <div className="text-center p-10 bg-white/5 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all duration-500 shadow-xl">
                            <Monitor size={48} className="mx-auto text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
                            <p className="text-5xl font-black italic tracking-tighter">18%</p>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">PC / Tablet</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-4">
                            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-inner"><Share2 size={20} /></div>
                            Canales de Adquisición
                        </h4>
                        <span className="px-4 py-2 bg-gray-50 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">Live Source Radar</span>
                    </div>
                    <div className="space-y-10 pt-4">
                        {[ 
                            { s: 'Instagram', p: '55%', color: 'bg-gradient-to-r from-purple-600 to-rose-500' },
                            { s: 'WhatsApp', p: '25%', color: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
                            { s: 'Facebook', p: '15%', color: 'bg-blue-600' },
                            { s: 'Otros', p: '5%', color: 'bg-gray-400' } 
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-8 group">
                                <span className="w-24 text-[11px] font-black text-gray-400 uppercase group-hover:text-gray-900 transition-colors italic">{item.s}</span>
                                <div className="flex-1 h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner p-1 border border-gray-50">
                                    <motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.color} rounded-full`} />
                                </div>
                                <span className="w-16 text-sm font-black text-gray-900 text-right italic">{item.p}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shadow-inner"><Clock size={20} /></div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Picos de Actividad</h4>
                        </div>
                        <p className="text-[10px] font-black text-amber-500 bg-amber-50 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-amber-100">Hora Pico: 20:00h</p>
                    </div>
                    <div className="flex items-end justify-between h-56 pt-8 gap-4">
                        {[ 20, 35, 25, 60, 95, 80, 45, 30 ].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="w-full bg-gray-50 rounded-t-[1.5rem] relative overflow-hidden flex items-end h-full shadow-inner group-hover:bg-gray-100 transition-all border border-gray-50">
                                    <motion.div 
                                        initial={{ height: 0 }} 
                                        animate={{ height: `${h}%` }} 
                                        className={`w-full ${h > 80 ? 'bg-gray-900 shadow-xl' : 'bg-[#004d4d]/20'} group-hover:bg-[#004d4d] transition-all duration-500 rounded-t-xl`}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase font-mono tracking-tighter italic">
                                    {['08h', '10h', '12h', '14h', '18h', '20h', '22h', '00h'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium italic text-center pt-4">"La conversión máxima ocurre a las <span className="font-black text-gray-900">8:45 PM</span> los días de semana."</p>
                </div>

                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm grid grid-cols-2 gap-16 relative overflow-hidden">
                    <div className="space-y-10">
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] border-b-2 border-gray-50 pb-6 flex items-center gap-3">
                            <Globe size={16} className="text-blue-500"/> Geografía
                        </h4>
                        <div className="space-y-6">
                            {[ { l: 'Bogotá', p: '42%' }, { l: 'Medellín', p: '28%' }, { l: 'Cali', p: '12%' }, { l: 'Otras', p: '18%' } ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center group cursor-default">
                                    <span className="text-[11px] font-black text-gray-400 uppercase group-hover:text-gray-900 transition-colors italic">{item.l}</span>
                                    <span className="text-[12px] font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-xl shadow-sm border border-gray-100">{item.p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-10">
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] border-b-2 border-gray-50 pb-6 flex items-center gap-3">
                            <Calendar size={16} className="text-emerald-500"/> Días Top
                        </h4>
                        <div className="space-y-6">
                            {[ { d: 'Sábados', p: '35%' }, { d: 'Viernes', p: '25%' }, { d: 'Domingos', p: '20%' }, { d: 'Otros', p: '20%' } ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center group cursor-default">
                                    <span className="text-[11px] font-black text-gray-400 uppercase group-hover:text-gray-900 transition-colors italic">{item.d}</span>
                                    <span className="text-[12px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl shadow-sm border border-emerald-100">{item.p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-[#001a1a] to-[#004d4d] p-16 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group border border-white/10">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Bot size={220} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center text-6xl shadow-3xl animate-pulse shrink-0">🤖</div>
                    <div className="flex-1 space-y-8">
                        <div>
                            <h4 className="text-3xl font-black italic tracking-tight uppercase">Auditoría Demográfica Global</h4>
                            <p className="text-[#00f2ff] text-[10px] font-black uppercase mt-2 tracking-[0.4em]">Bayt AI Strategic Execution Analysis</p>
                        </div>
                        <p className="text-gray-300 text-xl font-medium leading-relaxed italic max-w-5xl">
                            "Tu audiencia dominante es <span className="text-white font-black underline decoration-[#00f2ff] decoration-2 underline-offset-8">femenina (68%)</span>, joven (<span className="text-white font-black italic">18-24 años</span>) y altamente móvil. El <span className="text-[#00f2ff] font-black">82% de tus ventas</span> se cierran desde un smartphone, principalmente los sábados a las 8:45 PM. Estrategia recomendada: Reforzar pauta en Instagram Ads con formato vertical 'mobile-first' entre las 18h y las 22h para maximizar el ROI global."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInventory = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-gradient-to-r from-[#1e1b4b] via-[#4c1d95] to-[#1e1b4b] p-16 rounded-[4rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl border border-white/10">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.15)_0%,_transparent_60%)] animate-pulse"></div>
                <div className="h-32 w-32 bg-white/10 rounded-[3rem] flex items-center justify-center text-6xl shadow-3xl relative z-10 animate-bounce-slow border border-white/20 backdrop-blur-xl">
                    <Sparkles className="text-[#00f2ff]" size={48} />
                </div>
                <div className="flex-1 relative z-10 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="px-5 py-2 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20 backdrop-blur-sm">Bayt Stock Intelligence</span>
                            <div className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_8px_#00f2ff]"></div>
                        </div>
                        <h3 className="text-4xl font-black tracking-tight italic uppercase">Alerta de Suministro Inteligente</h3>
                        <p className="text-purple-100 text-xl font-medium max-w-4xl leading-relaxed italic mt-4">
                            "En <span className="text-white font-black underline decoration-[#00f2ff] decoration-2 underline-offset-8 italic">Febrero del año pasado</span>, tu producto estrella fue <span className="text-white font-black italic">Tabletas Purificadoras X</span>. Actualmente tienes solo <span className="bg-[#00f2ff] text-[#001a1a] px-4 py-1.5 rounded-2xl font-black shadow-[0_0_20px_rgba(0,242,255,0.4)] animate-pulse inline-block mx-2">3 unidades</span> en stock. Bayt recomienda pedir 450 uds hoy."
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsOrderModalOpen(true)} className="px-12 py-6 bg-white text-[#1e1b4b] hover:bg-[#00f2ff] rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl transition-all active:scale-95 flex items-center gap-3 border border-white/10">
                            <ShoppingCart size={20}/> Montar Orden de Compra
                        </button>
                        <button onClick={() => setIsProductHistoryModalOpen(true)} className="px-12 py-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-white/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-3">
                            <LucideHistory size={20} className="text-[#00f2ff]"/> Ver Historial Estratégico
                        </button>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 text-[25rem] font-black opacity-[0.05] rotate-12 pointer-events-none uppercase italic">STOCK</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                <div onClick={() => setSelectedInventoryCategory('winners')} className="group relative bg-white/60 backdrop-blur-md p-10 rounded-[4rem] border border-white/80 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="h-14 w-14 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-emerald-200 group-hover:scale-110 transition-transform"><Trophy size={28} /></div>
                                <div className="text-right"><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">Top Revenue</span></div>
                            </div>
                            <div><h3 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Ganadores</h3><p className="text-[11px] text-gray-400 font-bold uppercase mt-2 tracking-[0.3em]">Escalabilidad Directa Detectada</p></div>
                            <div className="flex items-end gap-3"><span className="text-4xl font-black text-gray-900">+$124M</span><span className="text-[11px] font-black text-emerald-500 mb-2 flex items-center gap-1"><TrendingUp size={14}/> +18%</span></div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Analizar Potencial de Escala</span><div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"><ArrowRight size={20} /></div></div>
                    </div>
                </div>
                
                <div onClick={() => setSelectedInventoryCategory('reorder')} className="group relative bg-white/60 backdrop-blur-md p-10 rounded-[4rem] border border-white/80 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="h-14 w-14 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 group-hover:scale-110 transition-transform"><ZapIcon size={28} /></div>
                                <div className="text-right"><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">Alerta Stock</span></div>
                            </div>
                            <div><h3 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Reabastecer</h3><p className="text-[11px] text-gray-400 font-bold uppercase mt-2 tracking-[0.3em]">Prevención de Pérdida Inminente</p></div>
                            <div className="flex items-end gap-3"><span className="text-4xl font-black text-rose-600">-$8.4M</span><span className="text-[11px] font-black text-gray-400 mb-2 italic">Riesgo / Semana</span></div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Evitar Quiebre de Stock</span><div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"><ArrowRight size={20} /></div></div>
                    </div>
                </div>

                <div onClick={() => setSelectedInventoryCategory('stuck')} className="group relative bg-white/60 backdrop-blur-md p-10 rounded-[4rem] border border-white/80 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="h-14 w-14 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-rose-200 group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div>
                                <div className="text-right"><span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-4 py-1.5 rounded-xl border border-rose-100">Capital Pegado</span></div>
                            </div>
                            <div><h3 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Estancado</h3><p className="text-[11px] text-gray-400 font-bold uppercase mt-2 tracking-[0.3em]">Flujo de Caja en Riesgo</p></div>
                            <div className="flex items-end gap-3"><span className="text-4xl font-black text-gray-900">$24.5M</span><span className="text-[11px] font-black text-rose-500 mb-2 italic">Inactivo</span></div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">Liberar Capital Ahora</span><div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"><ArrowRight size={20} /></div></div>
                    </div>
                </div>

                <div onClick={() => setSelectedInventoryCategory('decline')} className="group relative bg-white/60 backdrop-blur-md p-10 rounded-[4rem] border border-white/80 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-amber-200 group-hover:scale-110 transition-transform"><TrendingDown size={28} /></div>
                                <div className="text-right"><span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-4 py-1.5 rounded-xl border border-amber-100">Curva Baja</span></div>
                            </div>
                            <div><h3 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">En Declive</h3><p className="text-[11px] text-gray-400 font-bold uppercase mt-2 tracking-[0.3em]">Salida Estratégica AI</p></div>
                            <div className="flex items-end gap-3"><span className="text-4xl font-black text-gray-900">-42%</span><span className="text-[11px] font-black text-amber-600 mb-2 italic">Vs. Mes Anterior</span></div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-amber-600 transition-colors">Ver Plan de Evacuación</span><div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"><ArrowRight size={20} /></div></div>
                    </div>
                </div>
            </div>

            <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white flex flex-col justify-center relative overflow-hidden min-h-[300px] mt-10 border border-white/5 shadow-3xl group">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-[#00f2ff]/10 rounded-2xl flex items-center justify-center text-[#00f2ff] shadow-inner border border-[#00f2ff]/20"><Sparkles size={24} /></div>
                        <p className="text-[11px] font-black text-[#00f2ff] uppercase tracking-[0.4em]">Inteligencia Predictiva Bayt</p>
                    </div>
                    <h4 className="text-2xl font-black leading-relaxed italic max-w-5xl">"Tus 'Fundas Silicona' tienen un <span className="text-white underline decoration-[#00f2ff] decoration-2 underline-offset-8">40% más de stock</span> de lo que el sistema proyecta vender este trimestre. Sugerimos un descuento dinámico del <span className="text-[#00f2ff]">15%</span> para optimizar liquidez."</h4>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] text-[12rem] opacity-[0.03] rotate-12 font-black group-hover:scale-110 transition-transform duration-1000"><DollarSign size={150}/></div>
            </div>
        </div>
    );

    const renderMarketing = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div whileHover={{ y: -5 }} className="bg-white/60 backdrop-blur-md p-10 rounded-[4rem] border border-white/80 shadow-sm flex flex-col items-center gap-8 group transition-all">
                    <div className="h-20 w-20 bg-purple-50 text-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform"><Mail size={40}/></div>
                    <div className="text-center">
                        <h4 className="text-4xl font-black text-gray-900 italic tracking-tighter">1,240</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Emails Enviados</p>
                    </div>
                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100">
                        <div className="h-full bg-purple-600 rounded-full shadow-sm" style={{ width: '45%' }} />
                    </div>
                    <p className="text-base font-black text-emerald-600">{formatCurrency(2100000)} <span className="text-[9px] text-gray-400 font-bold uppercase ml-2 tracking-widest">recuperado</span></p>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white/60 backdrop-blur-md p-10 rounded-[4rem] border border-white/80 shadow-sm flex flex-col items-center gap-8 group transition-all">
                    <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:-rotate-6 transition-transform"><MessageSquare size={40}/></div>
                    <div className="text-center">
                        <h4 className="text-4xl font-black text-gray-900 italic tracking-tighter">680</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">WhatsApp Enviados</p>
                    </div>
                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100">
                        <div className="h-full bg-emerald-500 rounded-full shadow-sm" style={{ width: '92%' }} />
                    </div>
                    <p className="text-base font-black text-emerald-600">{formatCurrency(3300000)} <span className="text-[9px] text-gray-400 font-bold uppercase ml-2 tracking-widest">recuperado</span></p>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-[#001a1a] p-10 rounded-[4rem] text-white flex flex-col items-center gap-8 group shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)]"></div>
                    <div className="h-20 w-20 bg-white/10 text-[#00f2ff] rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><TrendingUp size={40} /></div>
                    <div className="text-center relative z-10">
                        <h4 className="text-4xl font-black text-white italic tracking-tighter">{formatCurrency(5400000)}</h4>
                        <p className="text-[10px] font-black text-[#00f2ff]/60 uppercase tracking-[0.2em] mt-2">ROI Total Rescate AI</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 rotate-12 font-black pointer-events-none uppercase italic">WINNER</div>
                </motion.div>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-[4rem] border border-white/80 shadow-sm overflow-hidden">
                <div className="p-12 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-[#004d4d]/5 text-[#004d4d] rounded-xl flex items-center justify-center"><Tag size={20} /></div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] italic">Rendimiento de Campañas & Cupones</h4>
                    </div>
                    <button className="h-12 px-8 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl transition-all">Exportar Reporte</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50 text-left">
                        <thead><tr className="bg-white"><th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cupón Estratégico</th><th className="px-12 py-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Efectividad</th><th className="px-12 py-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingresos Brutos</th><th className="px-12 py-8 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Análisis</th></tr></thead>
                        <tbody className="divide-y divide-gray-50 bg-white/50">
                            {[ { c: 'WELCOME10', e: '28%', r: 12450000, roi: '+420%' }, { c: 'PROMOVERANO', e: '42%', r: 8900000, roi: '+580%' }, { c: 'RESCATE20', e: '12%', r: 3200000, roi: '+110%' } ].map((item, i) => (
                                <tr key={i} className="hover:bg-white group transition-all duration-500">
                                    <td className="px-12 py-10">
                                        <span className="px-4 py-2 bg-gray-900 text-[#00f2ff] rounded-xl font-black text-xs uppercase font-mono shadow-lg group-hover:scale-105 inline-block transition-transform">{item.c}</span>
                                    </td>
                                    <td className="px-12 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-lg font-black text-gray-900 italic">{item.e}</span>
                                            <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-tighter">ROI: {item.roi}</span>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10 font-black text-gray-900 text-xl italic tracking-tighter">{formatCurrency(item.r)}</td>
                                    <td className="px-12 py-10 text-right">
                                        <button onClick={() => setSelectedCoupon(item)} className="h-12 px-8 bg-gray-50 text-[#004d4d] border border-[#004d4d]/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004d4d] hover:text-white transition-all shadow-sm active:scale-95">Ver Campaña</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
            {/* Header Global */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 px-4">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative border-2 border-white/10">
                        <BarChart3 className="text-white" size={36} />
                        <div className="absolute -top-2 -right-2 h-10 w-10 bg-[#004d4d] rounded-2xl flex items-center justify-center text-[#00f2ff] border-4 border-gray-50 shadow-xl animate-pulse">
                            <Sparkles size={18} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60">Inteligencia de Negocio</span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">
                            Estadísticas Web <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00f2ff]">PRO</span>
                        </h1>
                        <p className="text-[#004d4d]/60 mt-3 font-medium max-w-lg leading-relaxed italic">
                            Terminal estratégica de análisis Bayup. Datos operativos en <span className="font-black text-gray-900">tiempo real</span>.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 relative">
                    <div className="relative">
                        <button 
                            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                            className="flex items-center bg-white/60 backdrop-blur-xl p-2 rounded-[2rem] border border-white/80 shadow-sm h-20 px-10 hover:border-[#004d4d]/20 transition-all active:scale-95 group"
                        >
                            <Calendar size={22} className="text-[#004d4d] mr-6" />
                            <div className="flex flex-col items-start">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Rango de Análisis</span>
                                <span className="text-sm font-black text-gray-900 uppercase italic tracking-tighter">{startMonth} - {endMonth}</span>
                            </div>
                            <ChevronDown size={20} className={`text-gray-300 ml-6 transition-transform duration-500 ${isPeriodDropdownOpen ? 'rotate-180 text-[#004d4d]' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isPeriodDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 15 }}
                                    className="absolute top-full right-0 mt-4 bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-3xl border border-gray-100 p-10 z-[600] min-w-[500px]"
                                >
                                    <div className="grid grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Mes de Inicio
                                            </p>
                                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-4">
                                                {availableMonths.map((m) => (
                                                    <button 
                                                        key={`start-${m}`}
                                                        onClick={() => setStartMonth(m)}
                                                        className={`w-full px-6 py-3 text-left text-[11px] font-black uppercase rounded-2xl transition-all ${startMonth === m ? 'bg-gray-900 text-white shadow-xl scale-[1.05]' : 'text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6 border-l border-gray-100 pl-12">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div> Mes de Cierre
                                            </p>
                                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-4">
                                                {availableMonths.map((m) => (
                                                    <button 
                                                        key={`end-${m}`}
                                                        onClick={() => setEndMonth(m)}
                                                        className={`w-full px-6 py-3 text-left text-[11px] font-black uppercase rounded-2xl transition-all ${endMonth === m ? 'bg-gray-900 text-white shadow-xl scale-[1.05]' : 'text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-gray-100 flex justify-between items-center">
                                        <button 
                                            onClick={() => {
                                                setStartMonth(availableMonths[3]);
                                                setEndMonth(availableMonths[3]);
                                            }}
                                            className="text-[10px] font-black text-gray-400 uppercase underline decoration-gray-200 underline-offset-4 hover:text-gray-900 transition-colors"
                                        >
                                            Reiniciar Rango
                                        </button>
                                        <button 
                                            onClick={() => setIsPeriodDropdownOpen(false)}
                                            className="px-10 py-4 bg-[#004d4d] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all active:scale-95"
                                        >
                                            Aplicar Rango
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={handleDownloadReport} disabled={isGeneratingPDF} className="h-20 bg-gray-900 text-white px-10 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-4 border border-white/10 shadow-2xl disabled:opacity-50 transition-all hover:bg-black active:scale-95 group">
                        {isGeneratingPDF ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download size={22} className="text-[#00f2ff] group-hover:animate-bounce" />
                        )}
                        <span>Reporte Ejecutivo</span>
                    </button>
                </div>
            </div>

            {/* BARRA DE ACTIVIDAD LIVE SLIM (FIJA) */}
            <div className="px-4">
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-emerald-100/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden transition-all hover:border-emerald-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 relative border border-emerald-100 shadow-inner">
                            <Activity size={28} className="animate-pulse" />
                            <div className="absolute top-1 right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_8px_#10B981]"></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1"><span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span><p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Radar Live Active</p></div>
                            <h4 className="text-2xl font-black text-gray-900 tracking-tighter italic">24 Clientes <span className="text-gray-400 font-medium text-base ml-2">navegando tu tienda ahora</span></h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 relative z-10 bg-gray-50/50 px-10 py-4 rounded-3xl border border-gray-100">
                        <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ritmo</p><p className="text-base font-black text-gray-900">4.2 pág/min</p></div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">En Checkout</p><p className="text-base font-black text-purple-600">3 activos</p></div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <button 
                            onClick={() => setIsRadarModalOpen(true)}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center gap-3 shadow-lg hover:scale-105 transition-all"
                        >
                            Radar Global <Radar size={14} className="animate-spin-slow text-[#00f2ff]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Navegación Quirúrgica - Menú Flotante */}
            <div className="flex items-center justify-center pt-4 z-20 px-4">
                <div className="flex bg-white/80 backdrop-blur-2xl p-2 rounded-full border border-gray-100 shadow-2xl gap-2 w-full max-w-6xl overflow-x-auto custom-scrollbar no-scrollbar relative">
                    {[ 
                        { id: 'overview', label: 'Resumen Estratégico', icon: <LucidePieChart size={16}/> }, 
                        { id: 'traffic', label: 'Ruta de Compradores', icon: <Globe size={16}/> }, 
                        { id: 'conversion', label: 'Ventas & Embudo', icon: <Target size={16}/> }, 
                        { id: 'audience', label: 'Perfil de Audiencia', icon: <Users size={16}/> }, 
                        { id: 'inventory', label: 'Stock Inteligente', icon: <Package size={16}/> }, 
                        { id: 'marketing', label: 'Marketing & ROI', icon: <Rocket size={16}/> }, 
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id as any)} 
                                className={`flex-1 flex items-center justify-center gap-3 px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap relative z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="activeWebTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                <span className="relative z-20 flex items-center gap-2">{tab.icon} {tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Contenido Dinámico */}
            <div className="min-h-[800px] relative px-4 pt-10">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeTab} 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -30 }} 
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'traffic' && renderTraffic()}
                        {activeTab === 'conversion' && renderConversion()}
                        {activeTab === 'audience' && renderAudience()}
                        {activeTab === 'inventory' && renderInventory()}
                        {activeTab === 'marketing' && renderMarketing()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* MODALES PRO (REDISEÑADOS) */}
            <AnimatePresence>
                {isRadarModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
                        {/* Full Screen Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsRadarModalOpen(false)} 
                            className="fixed inset-0 bg-black/90 backdrop-blur-2xl" 
                        />
                        
                        {/* Modal Container */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 100 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 100 }} 
                            className="bg-[#001a1a] w-full max-w-6xl rounded-[4rem] shadow-[0_0_100px_rgba(0,242,255,0.1)] overflow-hidden relative z-10 border border-white/10 flex flex-col md:flex-row h-[80vh] m-4 md:m-10"
                        >
                            
                            {/* RADAR VISUAL (LEFT) */}
                            <div className="flex-1 relative flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#004d4d]/20 to-transparent"></div>
                                
                                {/* Radar Circles */}
                                <div className="relative h-[500px] w-[500px] flex items-center justify-center">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="absolute border border-[#00f2ff]/20 rounded-full" style={{ width: `${i * 33}%`, height: `${i * 33}%` }}></div>
                                    ))}
                                    
                                    {/* Rotating Sweep */}
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute h-full w-full rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,242,255,0.1)_350deg,#00f2ff_360deg)] opacity-50"
                                    />

                                    {/* Pulse Points (Cities) */}
                                    {[
                                        { top: '40%', left: '50%', label: 'Bogotá', count: 12 },
                                        { top: '35%', left: '42%', label: 'Medellín', count: 6 },
                                        { top: '55%', left: '40%', label: 'Cali', count: 3 },
                                        { top: '25%', left: '52%', label: 'B/quilla', count: 2 },
                                        { top: '45%', left: '65%', label: 'Llanos', count: 1 }
                                    ].map((point, i) => (
                                        <div key={i} className="absolute" style={{ top: point.top, left: point.left }}>
                                            <div className="relative">
                                                <div className="h-3 w-3 bg-[#00f2ff] rounded-full shadow-[0_0_15px_#00f2ff] animate-pulse"></div>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 whitespace-nowrap">
                                                    <p className="text-[8px] font-black text-[#00f2ff] uppercase tracking-widest">{point.label}: {point.count}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute bottom-10 left-10 space-y-2">
                                    <p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.5em] flex items-center gap-3">
                                        <div className="h-2 w-2 bg-[#00f2ff] rounded-full animate-ping"></div> Scanner Active
                                    </p>
                                    <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest italic">Lat: 4.7110° N | Lon: 74.0721° W</p>
                                </div>
                            </div>

                            {/* SESSIONS PANEL (RIGHT) */}
                            <div className="w-full md:w-[400px] bg-black/40 backdrop-blur-xl border-l border-white/10 p-10 flex flex-col h-full shrink-0">
                                <div className="flex justify-between items-start mb-10 shrink-0">
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Live Feed</h3>
                                        <p className="text-[#00f2ff] text-[10px] font-black uppercase tracking-widest mt-1 italic">Conexiones Globales</p>
                                    </div>
                                    <button onClick={() => setIsRadarModalOpen(false)} className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all border border-white/10"><X size={20}/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 mb-8">
                                    {[
                                        { city: 'Bogotá D.C.', users: 12, device: 'iPhone 15', status: 'Checkout' },
                                        { city: 'Medellín', users: 6, device: 'Android S24', status: 'Catálogo' },
                                        { city: 'Cali', users: 3, device: 'iPhone 13', status: 'Producto' },
                                        { city: 'B/quilla', users: 2, device: 'Windows PC', status: 'Home' },
                                        { city: 'Pereira', users: 1, device: 'iPhone 14 Pro', status: 'Producto' }
                                    ].map((city, i) => (
                                        <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group cursor-default">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-black text-white italic">{city.city}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Smartphone size={10} className="text-gray-500" />
                                                        <p className="text-[9px] font-bold text-gray-500 uppercase">{city.device}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-[#00f2ff] tracking-tighter">{city.users}</p>
                                                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${city.status === 'Checkout' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{city.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-4 shrink-0">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Tráfico Real</p>
                                            <p className="text-3xl font-black text-white italic tracking-tighter">24 <span className="text-sm text-emerald-400 font-black ml-2">Online</span></p>
                                        </div>
                                        <Bot size={32} className="text-[#00f2ff] opacity-40 animate-bounce-slow" />
                                    </div>
                                    <button className="w-full py-4 bg-[#00f2ff] text-[#001a1a] rounded-xl font-black text-[9px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:bg-white transition-all active:scale-95">Bloquear Tráfico Sospechoso</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {selectedInventoryCategory && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setSelectedInventoryCategory(null)} 
                            className="fixed inset-0 bg-black/80 backdrop-blur-2xl" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                            className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/20 flex flex-col max-h-[90vh] m-4"
                        >

                            
                            <div className="w-full md:w-[350px] bg-[#001a1a] text-white p-12 flex flex-col justify-between shrink-0 relative overflow-hidden">
                                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#00f2ff]/5 rounded-full blur-3xl"></div>
                                <div className="space-y-10 relative z-10">
                                    <div className={`h-20 w-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-3xl ${ selectedInventoryCategory === 'winners' ? 'bg-emerald-500 shadow-emerald-500/40' : selectedInventoryCategory === 'stuck' ? 'bg-rose-500 shadow-rose-500/40' : selectedInventoryCategory === 'decline' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-[#00f2ff] text-[#001a1a] shadow-[#00f2ff]/40'}`}>
                                        {selectedInventoryCategory === 'winners' ? <Trophy size={40}/> : selectedInventoryCategory === 'stuck' ? <AlertTriangle size={40}/> : selectedInventoryCategory === 'decline' ? <TrendingDown size={40}/> : <ZapIcon size={40}/>}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-tight">
                                            {selectedInventoryCategory === 'winners' ? 'Optimización de Motores de Caja' : selectedInventoryCategory === 'stuck' ? 'Desbloqueo de Capital Muerto' : selectedInventoryCategory === 'decline' ? 'Plan de Salida Estratégica' : 'Rescate de Ventas Perdidas'}
                                        </h2>
                                        <p className="text-[#00f2ff] text-[10px] font-black uppercase mt-4 tracking-[0.4em] italic">Intelligence Business Bayt AI</p>
                                    </div>
                                    
                                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-3">
                                            <Activity size={14} className="text-[#00f2ff]" /> Métricas de Impacto
                                        </p>
                                        <div className="space-y-6">
                                            {selectedInventoryCategory === 'winners' ? (
                                                <>
                                                    <div><span className="text-[9px] text-white/40 font-black uppercase block mb-1">Profit Share</span><span className="text-2xl font-black text-emerald-400 tracking-tighter italic">65.4%</span></div>
                                                    <div><span className="text-[9px] text-white/40 font-black uppercase block mb-1">LTV Ratio</span><span className="text-2xl font-black text-[#00f2ff] tracking-tighter italic">3.2x</span></div>
                                                </>
                                            ) : selectedInventoryCategory === 'stuck' ? (
                                                <>
                                                    <div><span className="text-[9px] text-white/40 font-black uppercase block mb-1">Dead Capital</span><span className="text-2xl font-black text-rose-400 tracking-tighter italic">$24.5M</span></div>
                                                    <div><span className="text-[9px] text-white/40 font-black uppercase block mb-1">Holding Cost</span><span className="text-2xl font-black text-[#00f2ff] tracking-tighter italic">$480k/m</span></div>
                                                </>
                                            ) : selectedInventoryCategory === 'decline' ? (
                                                <>
                                                    <div><span className="text-[9px] text-white/40 font-black uppercase block mb-1">Demand Drop</span><span className="text-2xl font-black text-rose-400 tracking-tighter italic">-48.2%</span></div>
                                                    <div><span className="text-[9px] text-white/40 font-black uppercase block mb-1">Residue Risk</span><span className="text-2xl font-black text-amber-400 tracking-tighter italic">Extremo</span></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div><span className="text-[9px] text-white/40 font-black uppercase block mb-1">Lost Sales</span><span className="text-2xl font-black text-rose-400 tracking-tighter italic">$1.2M/d</span></div>
                                                    <div><span className="text-[9px] text-white/40 font-black uppercase block mb-1">Time-to-Out</span><span className="text-2xl font-black text-[#00f2ff] tracking-tighter italic">48h</span></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-10 border-t border-white/5 relative z-10 flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.3em]">Cifrado Bayup AI</p>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]"></div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Acuerdo Estratégico</h2>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-[#00f2ff]"/> Auditoría de Ejecución en Tiempo Real
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedInventoryCategory(null)} className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all active:scale-90 shadow-inner">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    {isExecutingStrategy ? (
                                        <div className="flex flex-col items-center justify-center py-20 space-y-10 animate-in fade-in zoom-in duration-700">
                                            <div className="relative">
                                                <div className="h-40 w-40 bg-gray-900 rounded-[3.5rem] flex items-center justify-center shadow-3xl relative z-10 border-2 border-[#00f2ff]/30">
                                                    <Bot size={80} className="text-[#00f2ff] animate-pulse" />
                                                </div>
                                                <div className="absolute inset-0 bg-[#00f2ff] rounded-full blur-[60px] opacity-20 animate-ping"></div>
                                            </div>
                                            <div className="text-center space-y-3">
                                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Desplegando Táctica Bayt</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] italic">Red Neuronal en Ejecución...</p>
                                            </div>
                                            <div className="w-full max-w-lg bg-gray-900 rounded-[3rem] p-10 shadow-3xl space-y-6 border border-white/5 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={150} /></div>
                                                {strategySteps.map((step, i) => (
                                                    <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-4 items-start relative z-10">
                                                        <div className="h-5 w-5 rounded-full bg-[#00f2ff]/20 flex items-center justify-center shrink-0 mt-1">
                                                            <div className="h-2 w-2 rounded-full bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]"></div>
                                                        </div>
                                                        <p className="text-[12px] font-mono text-gray-300 leading-tight italic">{step}</p>
                                                    </motion.div>
                                                ))}
                                                <div className="h-6 w-1.5 bg-[#00f2ff] animate-bounce ml-2 mt-4 shadow-[0_0_15px_#00f2ff]"></div>
                                            </div>
                                        </div>
                                    ) : strategySteps.length > 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 space-y-10 animate-in fade-in zoom-in duration-700">
                                            <div className="h-40 w-40 bg-emerald-500 text-white rounded-[3.5rem] flex items-center justify-center shadow-3xl border-8 border-white group">
                                                <CheckCircle2 size={80} className="group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="text-center space-y-6">
                                                <h3 className="text-4xl font-black text-gray-900 italic uppercase tracking-tight">¡Operación Exitosa!</h3>
                                                <p className="text-gray-500 text-lg font-medium max-w-lg mx-auto leading-relaxed italic">
                                                    Bayt ha desplegado la estrategia con éxito. Los resultados empezarán a impactar tus métricas operativas de inmediato.
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => { setSelectedInventoryCategory(null); setStrategySteps([]); }}
                                                className="px-16 py-6 bg-gray-900 text-white rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-3xl hover:bg-black active:scale-95 transition-all border border-white/10"
                                            >
                                                Volver a la Terminal
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 gap-10">
                                                <div className="bg-[#001a1a] p-12 rounded-[3.5rem] text-white space-y-10 flex flex-col justify-center relative overflow-hidden shadow-3xl border border-white/5">
                                                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)]"></div>
                                                    <p className="text-[11px] font-black text-[#00f2ff] uppercase tracking-[0.5em] italic relative z-10">Bayt AI Strategic Logic</p>
                                                    <p className="text-xl text-gray-300 font-medium leading-relaxed italic relative z-10 max-w-4xl">
                                                        {selectedInventoryCategory === 'winners' ? '"Estos productos son el 20% de tu inventario que genera el 80% de tu rentabilidad. Si duplicas la inversión aquí, tu margen neto crecerá exponencialmente sin aumentar costos fijos. No solo vendes un producto, vendes el ancla de tu negocio."' :
                                                         selectedInventoryCategory === 'stuck' ? '"Tener $24.5M en una bodega es perder dinero cada hora por inflación y costo de oportunidad. Si liberas este capital hoy con un descuento del 25%, podrías reinvertirlo en activos ganadores y generar utilidad real en 30 días."' :
                                                         selectedInventoryCategory === 'decline' ? '"La demanda del mercado ha mutado. Seguir manteniendo este stock a precio full es una batalla perdida. El plan es evacuar el inventario mediante Bundles con productos Top para limpiar la bodega y recuperar el flujo."' :
                                                         '"Cada minuto que el botón no es presionado, tu tienda regala clientes a la competencia. El costo de adquisición es 5 veces mayor que retener a uno actual; no los dejes ir por falta de stock básico. Esta es una emergencia operativa."' }
                                                    </p>
                                                    <div className="h-px w-full bg-white/10 relative z-10"></div>
                                                    <div className="flex items-center gap-6 relative z-10">
                                                        <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#00f2ff] border border-white/10 shadow-xl">🤖</div>
                                                        <p className="text-[11px] font-black text-[#00f2ff] uppercase tracking-[0.3em]">Impacto Proyectado: <span className="text-white ml-2">Excelente</span></p>
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    <div className="flex items-center gap-4 px-4">
                                                        <div className="h-10 w-10 bg-[#004d4d] text-white rounded-xl flex items-center justify-center"><Workflow size={20}/></div>
                                                        <h4 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Hoja de Ruta Operativa</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                        {selectedInventoryCategory && strategyDetails[selectedInventoryCategory].map((step, idx) => (
                                                            <div key={idx} className="relative p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#00f2ff]/20 transition-all group">
                                                                <div className="absolute -top-4 -left-4 h-10 w-10 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center text-xs font-black shadow-2xl border-2 border-white">
                                                                    {idx + 1}
                                                                </div>
                                                                <h5 className="text-[11px] font-black text-gray-900 uppercase mb-3 mt-2 italic tracking-tight">{step.step}</h5>
                                                                <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">{step.desc}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="p-10 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-6 shrink-0">
                                    <button onClick={() => setSelectedInventoryCategory(null)} className="flex-1 py-6 bg-gray-50 text-gray-400 rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:text-gray-900 transition-colors shadow-inner">Posponer Análisis</button>
                                    <button 
                                        onClick={handleExecuteStrategicPlan}
                                        disabled={isExecutingStrategy || (selectedInventoryCategory && isAlreadyExecuted(selectedInventoryCategory))}
                                        className={`flex-[2.5] py-6 rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-3xl active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 ${
                                            selectedInventoryCategory && isAlreadyExecuted(selectedInventoryCategory) 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-gray-900 hover:bg-black text-white'
                                        }`}
                                    >
                                        {isExecutingStrategy ? (
                                            <>Desplegando Estrategia... <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                                        ) : selectedInventoryCategory && isAlreadyExecuted(selectedInventoryCategory) ? (
                                            <>Bayt ya está optimizando esto <CheckCircle2 size={20} className="text-white" /></>
                                        ) : (
                                            <>Ejecutar Plan Estratégico <ArrowRight size={20} className="text-[#00f2ff] group-hover:translate-x-2 transition-transform" /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isProductHistoryModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductHistoryModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-5xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 flex flex-col md:flex-row max-h-[90vh]">
                            <div className="w-full md:w-[320px] bg-[#001a1a] text-white p-12 flex flex-col justify-between shrink-0">
                                <div className="space-y-10">
                                    <div className="h-16 w-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-3xl border-2 border-white/10 animate-bounce-slow">💡</div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight uppercase italic text-white leading-tight">Tabletas Purificadoras X</h2>
                                        <p className="text-amber-400 text-[10px] font-black uppercase mt-4 tracking-widest italic">Historial de Rendimiento Bayt</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest border-b border-white/10 pb-3">Resumen Histórico</p>
                                        <div className="space-y-4">
                                            <div><p className="text-[8px] font-black uppercase text-white/30">Ventas Anteriores</p><p className="text-xl font-black text-[#00f2ff] tracking-tight">1.240 uds</p></div>
                                            <div><p className="text-[8px] font-black uppercase text-white/30">Ingresos Generados</p><p className="text-xl font-black text-emerald-400 tracking-tight">{formatCurrency(32240000)}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-10 border-t border-white/5"><p className="text-[9px] font-black uppercase text-white/20 tracking-[0.3em]">Business Intelligence v2.0</p></div>
                            </div>

                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase leading-none">Auditoría Estratégica</h2>
                                    <button onClick={() => setIsProductHistoryModalOpen(false)} className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all shadow-inner"><X size={24}/></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar bg-gray-50/20">
                                    <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-6 flex items-center gap-3"><Sparkles size={18} className="text-amber-500"/> Argumentación Bayt AI</h4>
                                        <div className="space-y-6">
                                            {[
                                                "Estacionalidad confirmada: Febrero representa el 22% de tus ventas anuales.",
                                                "Adquisición de clientes: 40% más efectivo que el promedio.",
                                                "Rentabilidad: Margen neto del 45% tras costos logísticos.",
                                                "Fuga evitable: $12M perdidos el año pasado por falta de stock."
                                            ].map((text, i) => (
                                                <div key={i} className="flex gap-5 items-start">
                                                    <div className="h-6 w-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-inner"><Check size={14}/></div>
                                                    <p className="text-sm text-gray-600 font-medium leading-relaxed italic">{text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-[#001a1a] p-10 rounded-[3.5rem] text-white flex flex-col justify-between relative overflow-hidden shadow-3xl">
                                        <div className="absolute top-0 right-0 p-10 opacity-5"><TrendingUp size={150} /></div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.4em] mb-4 italic">Proyección de Venta (Febrero 2026)</p>
                                            <h4 className="text-5xl font-black italic tracking-tighter">+{formatCurrency(45800000)}</h4>
                                            <p className="text-gray-400 text-sm mt-4 font-medium italic opacity-80 leading-relaxed">"Potencial de ingresos bloqueado por falta de stock actual. El sistema recomienda una compra inmediata."</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 border-t border-gray-50 bg-white flex gap-6 shrink-0">
                                    <button onClick={() => setIsProductHistoryModalOpen(false)} className="flex-1 py-6 bg-gray-50 text-gray-400 rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:text-gray-900 transition-all shadow-inner">Cerrar</button>
                                    <button onClick={() => { setIsProductHistoryModalOpen(false); setIsOrderModalOpen(true); }} className="flex-[2.5] py-6 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:bg-black active:scale-95 transition-all">Montar Orden de Compra Ahora</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isOrderModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOrderModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 flex flex-col max-h-[90vh]">
                            <div className="bg-gray-900 p-8 text-white relative shrink-0">
                                <button onClick={() => setIsOrderModalOpen(false)} className="absolute top-8 right-8 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={20}/></button>
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-amber-500 rounded-[1.8rem] flex items-center justify-center text-[#001a1a] shadow-xl animate-pulse-slow"><ShoppingCart size={32} /></div>
                                    <div><h2 className="text-2xl font-black tracking-tight italic uppercase">Generar Pedido</h2><p className="text-amber-400 text-[10px] font-black uppercase mt-1 tracking-widest italic">Bayt Auto-Procurement</p></div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/20 custom-scrollbar">
                                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-inner space-y-8">
                                    <div className="flex justify-between items-center pb-6 border-b border-gray-50">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Producto Táctico</span>
                                        <span className="text-sm font-black text-gray-900 italic uppercase underline decoration-[#00f2ff] decoration-4 underline-offset-4">{orderForm.productName}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Unidades</label>
                                            <input type="text" value={formatNumber(orderForm.quantity)} onChange={(e) => setOrderForm({ ...orderForm, quantity: unformatNumber(e.target.value) })} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-black text-lg border-2 border-transparent focus:border-amber-200 transition-all shadow-inner" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Total Estimado</label>
                                            <div className="w-full p-5 bg-gray-100 rounded-2xl font-black text-lg text-gray-500 italic tracking-tighter shadow-inner">{formatCurrency(orderForm.quantity * orderForm.pricePerUnit)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 relative">
                                    <div className="flex justify-between items-end px-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seleccionar Aliado</label>
                                        <button onClick={() => setIsRegisterProviderOpen(true)} className="text-[10px] font-black text-[#004d4d] uppercase underline decoration-2 decoration-[#00f2ff] underline-offset-4">+ Registrar Nuevo</button>
                                    </div>
                                    <button onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)} className="w-full p-6 bg-white border border-gray-100 rounded-[2rem] text-sm font-black flex justify-between items-center shadow-xl group hover:border-[#004d4d]/20 transition-all italic">
                                        {orderForm.provider || 'Buscar en directorio de proveedores...'}
                                        <ChevronDown size={20} className={`text-gray-300 transition-transform duration-300 ${isProviderDropdownOpen ? 'rotate-180 text-[#004d4d]' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isProviderDropdownOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2.5rem] shadow-3xl border border-gray-100 py-4 z-[600] max-h-60 overflow-y-auto custom-scrollbar p-2">
                                                {providers.length > 0 ? providers.map((p) => (
                                                    <button key={p.id} onClick={() => { setOrderForm({ ...orderForm, provider: p.name }); setIsProviderDropdownOpen(false); }} className="w-full px-8 py-4 text-left hover:bg-[#004d4d] hover:text-white transition-all rounded-2xl flex items-center justify-between group/opt">
                                                        <span className="text-xs font-black uppercase tracking-widest">{p.name}</span>
                                                        {orderForm.provider === p.name && <CheckCircle2 size={16} className="text-[#00f2ff]" />}
                                                    </button>
                                                )) : <div className="p-10 text-center text-gray-300 text-xs font-bold uppercase italic tracking-widest">No hay proveedores registrados</div>}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex items-start gap-6 shadow-inner">
                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><Bot size={20} /></div>
                                    <p className="text-[11px] text-emerald-800 font-medium leading-relaxed italic">"Bayt ha sincronizado esta orden con tu historial de precios. Se enviará automáticamente vía WhatsApp Business al aliado seleccionado tras tu confirmación."</p>
                                </div>
                            </div>
                            <div className="p-10 bg-white border-t border-gray-100 flex gap-6 shrink-0">
                                <button onClick={() => setIsOrderModalOpen(false)} className="flex-1 py-6 bg-gray-50 text-gray-400 rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:text-gray-900 transition-colors shadow-inner">Cancelar</button>
                                <button onClick={handleConfirmOrder} disabled={isSubmittingOrder} className="flex-[2.5] py-6 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50">
                                    {isSubmittingOrder ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Rocket size={20} className="text-[#00f2ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                    Confirmar & Despachar Orden
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isRegisterProviderOpen && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRegisterProviderOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl overflow-hidden relative border border-white">
                            <div className="bg-[#001a1a] p-10 text-white flex items-center gap-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={120} /></div>
                                <div className="h-14 w-14 bg-[#00f2ff] rounded-2xl flex items-center justify-center text-[#001a1a] shadow-xl relative z-10"><UserPlus size={28}/></div>
                                <div className="relative z-10"><h2 className="text-xl font-black italic uppercase tracking-tight">Nuevo Aliado</h2><p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Directorio de Suministro</p></div>
                            </div>
                            <div className="p-10 space-y-8 bg-gray-50/20">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre de la Empresa</label>
                                    <input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-bold shadow-sm focus:border-[#004d4d] transition-all" placeholder="Ej: Distribuidora Tech S.A." />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">WhatsApp de Contacto</label>
                                    <input value={newProvider.phone} onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })} className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-bold shadow-sm focus:border-[#004d4d] transition-all" placeholder="+57 300 000 0000" />
                                </div>
                                <div className="flex flex-col gap-3 pt-4">
                                    <button onClick={handleCreateProvider} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">Registrar Aliado Táctico</button>
                                    <button onClick={() => setIsRegisterProviderOpen(false)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {selectedCoupon && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCoupon(null)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-6xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 flex flex-col md:flex-row max-h-[90vh]">
                            
                            <div className="w-full md:w-[350px] bg-gray-900 text-white p-12 flex flex-col justify-between shrink-0 relative overflow-hidden border-r border-white/10">
                                <div className="absolute top-0 right-0 p-10 opacity-5"><Tag size={250} /></div>
                                <div className="space-y-12 relative z-10">
                                    <div className="h-20 w-20 bg-gradient-to-tr from-purple-600 to-rose-500 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-3xl animate-pulse-slow">
                                        <Tag size={40} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">{selectedCoupon.c}</h2>
                                            <span className="px-3 py-1 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#00f2ff]/20">Active</span>
                                        </div>
                                        <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mt-6 flex items-center gap-3 border-b border-white/10 pb-4">
                                            <Calendar size={14} className="text-purple-500" /> Rendimiento Estratégico
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        <div><p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-2">Ingresos Reales</p><p className="text-3xl font-black text-[#00f2ff] tracking-tighter italic">{formatCurrency(selectedCoupon.r)}</p></div>
                                        <div><p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-2">Eficacia de Cupón</p><p className="text-3xl font-black text-emerald-400 tracking-tighter italic">{selectedCoupon.e}</p></div>
                                    </div>
                                </div>
                                <div className="pt-10 border-t border-white/5 relative z-10 flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.3em]">Campaign Insight v4.0</p>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Análisis de Campaña</h2>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-[#00f2ff]"/> Auditoría de Retorno sobre Inversión (ROI)
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedCoupon(null)} className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all active:scale-90 shadow-inner"><X size={24}/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center gap-4 border-b border-gray-50 pb-4 mb-6">
                                                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users size={16}/></div>
                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Audiencia Atrapada</p>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter italic">452 <span className="text-sm text-gray-400 font-bold ml-1">leads</span></p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-4 italic">65% Clientes nuevos atraídos por este cupón.</p>
                                        </div>
                                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center gap-4 border-b border-gray-50 pb-4 mb-6">
                                                <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><ShoppingCart size={16}/></div>
                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Ticket Promedio</p>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter italic">{formatCurrency(158400)}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-4 italic">+12.5% vs promedio de tienda regular.</p>
                                        </div>
                                        <div className="bg-[#001a1a] p-8 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl">
                                            <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-6">
                                                <div className="h-8 w-8 bg-white/10 text-[#00f2ff] rounded-xl flex items-center justify-center"><TrendingUp size={16}/></div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">ROI Realizado</p>
                                            </div>
                                            <p className="text-3xl font-black text-[#00f2ff] tracking-tighter italic">{selectedCoupon.roi}</p>
                                            <p className="text-[9px] font-bold text-white/40 uppercase mt-4 italic">Crecimiento neto en utilidad marginal.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-6">Perfil Demográfico de Campaña</h4>
                                            <div className="grid grid-cols-2 gap-12">
                                                <div className="space-y-6">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={12} className="text-rose-500"/> Género</p>
                                                    <div className="space-y-4">
                                                        {[ { g: 'Mujeres', p: '68%', c: 'bg-rose-400' }, { g: 'Hombres', p: '28%', c: 'bg-blue-400' } ].map((item, i) => (
                                                            <div key={i} className="space-y-2">
                                                                <div className="flex justify-between text-[9px] font-black uppercase"><span>{item.g}</span><span>{item.p}</span></div>
                                                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full`} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Timer size={12} className="text-purple-500"/> Edad</p>
                                                    <div className="space-y-4">
                                                        {[ { r: '18-24', p: '45%', c: 'bg-purple-600' }, { r: '25-34', p: '38%', c: 'bg-purple-400' } ].map((item, i) => (
                                                            <div key={i} className="space-y-2">
                                                                <div className="flex justify-between text-[9px] font-black uppercase"><span>{item.r} años</span><span>{item.p}</span></div>
                                                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full`} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[3.5rem] text-white flex flex-col justify-center relative overflow-hidden shadow-3xl">
                                            <div className="absolute top-0 right-0 p-10 opacity-10"><Bot size={180} /></div>
                                            <div className="relative z-10 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-white/20 rounded-[1.5rem] flex items-center justify-center text-white border border-white/30 backdrop-blur-xl shadow-xl animate-pulse">🤖</div>
                                                    <p className="text-[11px] font-black text-[#00f2ff] uppercase tracking-[0.4em] italic">Análisis Estratégico AI</p>
                                                </div>
                                                <p className="text-lg font-medium leading-relaxed italic">"Esta campaña ha sido altamente efectiva para atraer a un público joven. Se recomienda <span className="text-[#00f2ff] font-black underline decoration-2 underline-offset-8">extender la vigencia por 15 días</span> dada la alta rentabilidad detectada en el ticket promedio."</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 bg-white border-t border-gray-100 shrink-0">
                                    <button onClick={() => setSelectedCoupon(null)} className="w-full py-6 bg-gray-900 text-white rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-3xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-4 group/btn border-4 border-transparent hover:border-gray-100">
                                        Finalizar Auditoría de Campaña <ArrowRight size={20} className="text-[#00f2ff] group-hover/btn:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Banner Final Predictivo - Rediseño Slim Elegante */}
            <div className="px-4 mt-20">
                <div className="bg-[#001a1a] rounded-[4rem] relative overflow-hidden group shadow-3xl border border-white/5">
                    <div className="absolute inset-0 bg-[#004953] backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#00F2FF]/10 to-transparent"></div>
                    </div>
    
                    <div className="relative px-16 py-12 flex flex-col lg:flex-row items-center justify-between gap-16 z-10">
                        <div className="flex items-center gap-12 flex-1">
                            <div className="shrink-0 relative">
                                <div className="h-20 w-20 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-3xl border-2 border-[#00f2ff]/30 relative z-10 group-hover:scale-110 transition-transform duration-700">
                                    <Bot size={48} className="text-[#00f2ff] animate-bounce-slow" />
                                </div>
                                <div className="absolute inset-0 bg-[#00f2ff]/30 blur-3xl rounded-full"></div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-6">
                                    <span className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.5em] px-4 py-1.5 bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-full">Critical Business Insight</span>
                                    <div className="h-2 w-2 bg-[#00f2ff] rounded-full animate-ping"></div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic font-mono">Terminal: Analysis Active</p>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight italic uppercase tracking-tighter">
                                    "Tu conversión móvil <span className="text-[#00f2ff] underline underline-offset-[12px] decoration-4">ha bajado un 12%</span> por latencia crítica."
                                </h3>
                            </div>
                        </div>
    
                        <div className="flex items-center gap-16 lg:pl-16 lg:border-l border-white/10 shrink-0">
                            <div className="text-center lg:text-right">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Impacto en Capital</p>
                                <p className="text-5xl font-black text-white italic tracking-tighter">
                                    <span className="text-[#00f2ff] text-3xl mr-1">$</span>2.450.000
                                </p>
                            </div>
                            <button className="px-12 py-6 bg-white text-[#001a1a] hover:bg-[#00f2ff] transition-all rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-3xl active:scale-95 flex items-center gap-4 group/btn border-4 border-transparent hover:border-white/50">
                                RESCATAR CAPITAL <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>
        </div>
    );
}