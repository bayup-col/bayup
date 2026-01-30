"use client";

import { useState, useMemo, useRef, MouseEvent } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package, 
  ArrowUpDown,
  RefreshCcw,
  ShoppingBag,
  Globe,
  Smartphone,
  CreditCard,
  Calendar as CalendarIcon,
  User,
  MapPin,
  Printer,
  Send,
  Trash2,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// --- Types ---
type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
type Channel = 'web' | 'shopify' | 'mercadolibre' | 'whatsapp' | 'pos';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  channel: Channel;
  status: OrderStatus;
  date: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  invoiced: boolean;
  hasTracking: boolean;
}

interface MetricData {
    id: string;
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: any;
    color: string;
    bg: string;
    description: string;
    detailContent?: React.ReactNode;
}

// --- Mock Data ---
const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-7829",
    customer: { name: "Esteban Quito", email: "esteban@example.com", phone: "+57 300 123 4567", address: "Calle 123 #45-67", city: "Bogotá" },
    channel: "web",
    status: "paid",
    date: "2026-01-30T10:23:00",
    total: 150000,
    paymentMethod: "Credit Card",
    paymentStatus: "paid",
    invoiced: false,
    hasTracking: false,
    items: [{ id: "1", name: "Nike Air Max 90", sku: "NK-AM90-BLK", quantity: 1, price: 150000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80" }]
  },
  {
    id: "ORD-7830",
    customer: { name: "Maria Fernanda", email: "mafe@example.com", phone: "+57 310 987 6543", address: "Cra 80 #12-34", city: "Medellín" },
    channel: "whatsapp",
    status: "pending",
    date: "2026-01-30T09:15:00",
    total: 85000,
    paymentMethod: "Transferencia",
    paymentStatus: "pending",
    invoiced: false,
    hasTracking: false,
    items: [{ id: "2", name: "Camiseta Básica Premium", sku: "TS-BAS-WHT", quantity: 2, price: 42500, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&q=80" }]
  },
  {
    id: "ORD-7828",
    customer: { name: "Carlos Ruiz", email: "carlos@example.com", phone: "+57 315 555 1234", address: "Av. Siempre Viva 742", city: "Cali" },
    channel: "mercadolibre",
    status: "processing",
    date: "2026-01-29T16:40:00",
    total: 320000,
    paymentMethod: "MercadoPago",
    paymentStatus: "paid",
    invoiced: true,
    hasTracking: false, // Facturado pero sin guia (Pendiente enviar)
    items: [{ id: "3", name: "Smartwatch Series 5", sku: "SW-S5-BLK", quantity: 1, price: 320000, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80" }]
  },
  {
    id: "ORD-7825",
    customer: { name: "Luisa Lane", email: "luisa@daily.com", phone: "+57 300 555 9999", address: "Calle 100 #15-20", city: "Barranquilla" },
    channel: "shopify",
    status: "delivered",
    date: "2026-01-28T14:20:00",
    total: 450000,
    paymentMethod: "PayPal",
    paymentStatus: "paid",
    invoiced: true,
    hasTracking: true,
    items: [{ id: "4", name: "Bolso de Cuero", sku: "BG-LTH-BRN", quantity: 1, price: 450000, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&q=80" }]
  }
];

// --- Components ---

// 1. Tilt Card Component
const TiltCard = ({ data, onClick }: { data: MetricData, onClick: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative h-full cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className={`relative h-full bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-cyan-900/5 overflow-hidden`}>
                {/* Background Gradient Effect */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${data.bg} opacity-20 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700`}></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between" style={{ transform: "translateZ(20px)" }}>
                    <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-2xl ${data.bg} ${data.color} shadow-sm`}>
                            {data.icon}
                        </div>
                        {data.trend && (
                             <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wide ${data.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {data.trendUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                {data.trend}
                             </div>
                        )}
                    </div>
                    
                    <div className="mt-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{data.title}</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{data.value}</h3>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// 2. Metric Modal
const MetricModal = ({ metric, onClose }: { metric: MetricData | null, onClose: () => void }) => {
    if (!metric) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className={`p-8 bg-gradient-to-br ${metric.bg} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className={`h-12 w-12 rounded-2xl bg-white/90 flex items-center justify-center ${metric.color} shadow-lg`}>
                            {metric.icon}
                        </div>
                        <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-slate-900 transition-colors">
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="relative z-10 mt-6">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{metric.value}</h3>
                        <p className="text-sm font-bold text-slate-600 uppercase tracking-wider opacity-80">{metric.title}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                     <p className="text-slate-500 font-medium mb-6 text-sm leading-relaxed">{metric.description}</p>
                     <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        {metric.detailContent}
                     </div>
                     <button onClick={onClose} className="w-full mt-6 py-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                        Entendido
                     </button>
                </div>
            </motion.div>
        </div>
    );
};

const ChannelIcon = ({ channel }: { channel: Channel }) => {
  switch (channel) {
    case 'web': return <Globe size={14} className="text-cyan-600" />;
    case 'shopify': return <ShoppingBag size={14} className="text-green-600" />;
    case 'mercadolibre': return <ShoppingBag size={14} className="text-yellow-600" />; 
    case 'whatsapp': return <Smartphone size={14} className="text-green-500" />;
    case 'pos': return <CreditCard size={14} className="text-slate-600" />;
    default: return <Globe size={14} className="text-slate-400" />;
  }
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-cyan-50 text-cyan-700 border-cyan-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
    returned: "bg-rose-50 text-rose-700 border-rose-200",
  };
  
  const labels = {
    pending: "Pendiente",
    paid: "Pagado",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    returned: "Devuelto",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function OrdersPage() {
  const [orders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);

  // --- KPI Logic ---
  const kpiData: MetricData[] = [
      {
          id: 'sales_today',
          title: 'Ventas de Hoy',
          value: '$2,450,000',
          trend: '+12% vs ayer',
          trendUp: true,
          icon: <DollarSign size={20}/>,
          color: 'text-emerald-600',
          bg: 'from-emerald-50 to-teal-50',
          description: 'Total facturado hoy a través de todos los canales conectados (Web, WhatsApp, Marketplace).',
          detailContent: (
              <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Canal Web</span>
                      <span className="text-sm font-black text-slate-900">$1,200,000</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">MercadoLibre</span>
                      <span className="text-sm font-black text-slate-900">$850,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">WhatsApp</span>
                      <span className="text-sm font-black text-slate-900">$400,000</span>
                  </div>
              </div>
          )
      },
      {
        id: 'pending_invoice',
        title: 'Pendientes Facturar',
        value: '5 Pedidos',
        icon: <FileText size={20}/>,
        color: 'text-amber-600',
        bg: 'from-amber-50 to-orange-50',
        description: 'Órdenes confirmadas y pagadas que aún no cuentan con documento de facturación electrónica generado.',
        detailContent: (
            <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-2">Sugerencia: Revisar datos fiscales del cliente antes de emitir.</p>
                {orders.filter(o => o.status === 'paid' && !o.invoiced).slice(0,3).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{o.id}</span>
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">Sin Factura</span>
                    </div>
                ))}
            </div>
        )
      },
      {
        id: 'aov',
        title: 'Ticket Promedio',
        value: '$185,000',
        trend: '-2% vs ayer',
        trendUp: false,
        icon: <BarChart3 size={20}/>,
        color: 'text-cyan-600',
        bg: 'from-cyan-50 to-sky-50',
        description: 'Valor promedio de compra por cliente en tiempo real.',
        detailContent: (
            <div className="space-y-6">
                 {/* Insight Banner */}
                 <div className="bg-cyan-50 p-4 rounded-xl flex items-start gap-3 border border-cyan-100">
                    <div className="bg-white p-1.5 rounded-lg shadow-sm">
                        <TrendingUp size={16} className="text-cyan-600"/>
                    </div>
                    <div>
                        <p className="text-xs font-black text-cyan-900 uppercase tracking-wide">Desempeño Saludable</p>
                        <p className="text-[10px] text-cyan-700 font-medium mt-1">
                            Los clientes están gastando un <span className="font-bold">15% más</span> en accesorios que el mes pasado.
                        </p>
                    </div>
                 </div>

                 {/* Visualización de Barras (Simulada) */}
                 <div className="space-y-2">
                    <div className="flex justify-between items-end h-24 gap-2 px-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="w-full bg-slate-100 rounded-t-lg relative group overflow-hidden">
                                <div 
                                    className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${i === 6 ? 'bg-cyan-500' : 'bg-slate-200 group-hover:bg-cyan-200'}`} 
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase px-1">
                        <span>Lun</span><span>Dom</span>
                    </div>
                 </div>

                 {/* Métricas Secundarias */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Ticket Mínimo</p>
                        <p className="text-sm font-black text-slate-900 mt-1">$50,000</p>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Ticket Máximo</p>
                        <p className="text-sm font-black text-slate-900 mt-1">$820,000</p>
                    </div>
                 </div>
            </div>
        )
      },
      {
        id: 'pending_ship',
        title: 'Pendientes Enviar',
        value: '8 Pedidos',
        icon: <Truck size={20}/>,
        color: 'text-indigo-600',
        bg: 'from-indigo-50 to-violet-50',
        description: 'Pedidos facturados que están listos en bodega pero no tienen guía de transporte generada.',
        detailContent: (
            <div className="space-y-3">
                 <div className="p-3 bg-indigo-50 rounded-xl flex items-start gap-3">
                    <AlertCircle size={16} className="text-indigo-600 mt-0.5"/>
                    <p className="text-xs text-indigo-800 font-medium">Recuerda generar las guías antes de las 4:00 PM para despacho el mismo día.</p>
                 </div>
                 <button className="w-full py-2 bg-white border border-indigo-100 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors">
                     Ver lista de despachos
                 </button>
            </div>
        )
      }
  ];

  // Filtrado
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;

      switch (statusFilter) {
        case 'to_invoice':
          // Pagado pero NO facturado
          matchesStatus = order.status === 'paid' && !order.invoiced;
          break;
        case 'processing':
          matchesStatus = order.status === 'processing';
          break;
        case 'shipped':
          matchesStatus = order.status === 'shipped';
          break;
        case 'completed':
          matchesStatus = order.status === 'delivered';
          break;
        case 'delayed':
          // Lógica ejemplo: Pendientes o Retornos
          matchesStatus = order.status === 'pending' || order.status === 'cancelled' || order.status === 'returned';
          break;
        case 'all':
        default:
          matchesStatus = true;
      }

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Selección múltiple
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredOrders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredOrders.map(o => o.id)));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-cyan-100">
      
      {/* --- Main Header (Updated) --- */}
      <div className="px-8 py-8 md:py-10 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión Operativa</span>
          </div>
          <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Pedidos</span>
          </h1>
          <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed">
              Central de operaciones y despachos en tiempo real para <span className="font-bold text-[#001A1A]">Sebas</span>.
          </p>
      </div>

      <main className="px-8 pb-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* --- KPI Cards (Tilt Effect) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-48">
          {kpiData.map((data) => (
            <TiltCard key={data.id} data={data} onClick={() => setSelectedMetric(data)} />
          ))}
        </div>

        {/* --- WORKFLOW NAVIGATION (Centered & Connected) --- */}
        <div className="flex flex-col items-center justify-center space-y-6 pt-4">
            {/* Centered Floating Menu */}
            <div className="p-1.5 bg-white border border-slate-200 rounded-full shadow-xl shadow-slate-200/50 flex items-center relative z-10">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'to_invoice', label: 'Por Facturar' },
                    { id: 'processing', label: 'En Proceso' },
                    { id: 'shipped', label: 'Enviado' },
                    { id: 'completed', label: 'Completado' },
                    { id: 'delayed', label: 'Retrasado' }
                ].map((tab) => {
                    const isActive = statusFilter === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`relative px-6 py-3 rounded-full text-xs font-black uppercase tracking-wide transition-all duration-300 z-10 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg shadow-[#004D4D]/20 -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Secondary Actions Row */}
            <div className="w-full flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar orden, cliente o SKU..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
                    />
                 </div>
                 <div className="flex items-center gap-2">
                     <button className="p-3 text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold uppercase">
                        <Filter size={18}/> Filtros
                     </button>
                     <button className="p-3 text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold uppercase">
                        <CalendarIcon size={18}/> Fecha
                     </button>
                 </div>
            </div>
        </div>

        {/* --- Data Table --- */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
          {/* Bulk Actions Header */}
          {selectedIds.size > 0 && (
            <div className="bg-cyan-50 px-8 py-4 flex items-center justify-between animate-in slide-in-from-top-2">
              <span className="text-sm font-bold text-cyan-900">{selectedIds.size} seleccionados</span>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white border border-cyan-200 text-cyan-700 rounded-lg text-xs font-bold hover:bg-cyan-100 transition-colors uppercase">Imprimir Etiquetas</button>
                <button className="px-4 py-2 bg-white border border-cyan-200 text-cyan-700 rounded-lg text-xs font-bold hover:bg-cyan-100 transition-colors uppercase">Cambiar Estado</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-6 w-10 text-center">
                    <input type="checkbox" onChange={toggleAll} checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0} className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/20"/>
                  </th>
                  <th className="p-6 cursor-pointer hover:text-slate-600 group"><div className="flex items-center gap-1">Orden <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/></div></th>
                  <th className="p-6">Canal</th>
                  <th className="p-6">Fecha</th>
                  <th className="p-6">Cliente</th>
                  <th className="p-6">Estado</th>
                  <th className="p-6 text-right">Total</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedIds.has(order.id) ? 'bg-cyan-50/30' : ''}`}
                  >
                    <td className="p-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelection(order.id)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/20"
                      />
                    </td>
                    <td className="p-6">
                      <span className="font-black text-slate-900 group-hover:text-cyan-600 transition-colors text-sm">{order.id}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 w-fit px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <ChannelIcon channel={order.channel} /> 
                        <span className="capitalize">{order.channel}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-xs font-medium text-slate-500">
                        {new Date(order.date).toLocaleDateString()}
                        <span className="block text-[10px] text-slate-400 font-bold mt-0.5">{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{order.customer.name}</span>
                        <span className="text-xs text-slate-400 font-medium">{order.customer.email}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-6 text-right">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="p-6 text-right">
                      <button className="p-2 text-slate-300 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="p-16 text-center">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={32} className="text-slate-300"/>
              </div>
              <p className="text-lg font-bold text-slate-900">No se encontraron pedidos</p>
              <p className="text-sm text-slate-500 mt-1">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </main>

      {/* --- Metric Detail Modal --- */}
      <AnimatePresence>
          {selectedMetric && (
              <MetricModal metric={selectedMetric} onClose={() => setSelectedMetric(null)} />
          )}
      </AnimatePresence>

      {/* --- Right Panel (Order Details) --- */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
            >
              {/* Header Panel */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-slate-900">{selectedOrder.id}</h2>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                    <CalendarIcon size={14}/> {new Date(selectedOrder.date).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content Panel */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                
                {/* Actions Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all gap-2 group">
                    <Printer size={20} className="text-slate-400 group-hover:text-cyan-600"/>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Factura</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all gap-2 group">
                    <Send size={20} className="text-slate-400 group-hover:text-cyan-600"/>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Email</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all gap-2 group">
                    <Smartphone size={20} className="text-slate-400 group-hover:text-emerald-600"/>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">WhatsApp</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 transition-all gap-2 group">
                    <Trash2 size={20} className="text-slate-400 group-hover:text-rose-600"/>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Cancelar</span>
                  </button>
                </div>

                {/* Customer & Shipping */}
                <div className="grid md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={14}/> Cliente
                    </h3>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                      <p className="text-sm font-bold text-slate-900">{selectedOrder.customer.name}</p>
                      <p className="text-sm text-cyan-600 font-medium">{selectedOrder.customer.email}</p>
                      <p className="text-sm text-slate-500">{selectedOrder.customer.phone}</p>
                    </div>
                  </section>
                  <section className="space-y-4">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14}/> Envío
                    </h3>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                      <p className="text-sm font-medium text-slate-700">{selectedOrder.customer.address}</p>
                      <p className="text-sm text-slate-500">{selectedOrder.customer.city}, Colombia</p>
                      <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">Transportadora: Servientrega (Standard)</p>
                    </div>
                  </section>
                </div>

                {/* Items */}
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag size={14}/> Items ({selectedOrder.items.length})
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                          <th className="p-4">Producto</th>
                          <th className="p-4 text-center">Cant</th>
                          <th className="p-4 text-right">Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items.map(item => (
                          <tr key={item.id}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden">
                                  <img src={item.image} alt={item.name} className="h-full w-full object-cover"/>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{item.name}</p>
                                  <p className="text-[10px] text-slate-400">{item.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center font-medium text-slate-600">{item.quantity}</td>
                            <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Payment Info */}
                 <section className="bg-slate-900 rounded-[2rem] p-8 text-white flex items-center justify-between shadow-xl shadow-slate-900/10">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Pagado</p>
                      <p className="text-3xl font-black mt-1">{formatCurrency(selectedOrder.total)}</p>
                      <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1"><CreditCard size={12}/> {selectedOrder.paymentMethod}</p>
                    </div>
                    {selectedOrder.paymentStatus === 'paid' ? (
                      <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/50">
                        <CheckCircle2 size={28}/>
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/50">
                        <Clock size={28}/>
                      </div>
                    )}
                 </section>

              </div>
              
              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 bg-white flex gap-4">
                 <button className="flex-1 py-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                   Soporte
                 </button>
                 <button className="flex-[2] py-4 rounded-xl font-bold text-sm bg-slate-900 text-white shadow-xl shadow-cyan-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                   <Truck size={18}/> Crear Guía de Envío
                 </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
