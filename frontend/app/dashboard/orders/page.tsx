"use client";

import { useState, useMemo, useRef, MouseEvent } from 'react';
import { useToast } from "@/context/toast-context";
import { 
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  X,
  CheckCircle2,
  MessageSquare,
  Clock, 
  Truck, 
  Package, 
  AlertCircle, 
  ArrowUpDown,
  Download,
  RefreshCcw,
  ShoppingBag,
  Globe,
  Smartphone,
  CreditCard,
  Edit3,
  Calendar as CalendarIcon,
  User,
  MapPin,
  Mail,
  Phone,
  Printer,
  Send,
  Trash2,
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  BarChart3,
  Info,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

// --- COMPONENTE DE NÚMEROS ANIMADOS ---
function AnimatedNumber({ value, className, type = 'currency' }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return `${Math.round(current)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span className={className}>{display}</motion.span>;
}

// --- Types ---
type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'delayed';
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
  carrier?: string;
  trackingNumber?: string;
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
    status: "delayed",
    date: "2026-01-30T09:15:00",
    total: 85000,
    paymentMethod: "Transferencia",
    paymentStatus: "pending",
    invoiced: true,
    hasTracking: true,
    carrier: "Servientrega",
    trackingNumber: "987654321",
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
    hasTracking: true,
    carrier: "Coordinadora",
    trackingNumber: "123456789",
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
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [dateRangeState, setDateRangeState] = useState({ from: '', to: '' });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState({ channel: 'all', paymentMethod: 'all', status: 'all' });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('all');
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
  const [isCustomerViewOpen, setIsCustomerViewOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isCarrierDropdownOpen, setIsCarrierDropdownOpen] = useState(false);
  const [shippingData, setShippingData] = useState({ carrier: '', trackingNumber: '' });
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [isDateHovered, setIsDateHovered] = useState(false);
  const [isExportHovered, setIsExportHovered] = useState(false);

  const carriers = ['Servientrega', 'Coordinadora', 'Envia', 'Interrapidisimo', 'FedEx', 'DHL'];

  const getTrackingUrl = (carrier?: string, code?: string) => {
    if (!carrier || !code) return "#";
    const cleanCode = code.trim();
    if (carrier === 'Coordinadora') return `https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastreo-de-guias/?guia=${cleanCode}`;
    if (carrier === 'Servientrega') return `https://www.servientrega.com/wps/portal/Colombia/transacciones-personas/rastreo-envios?id=${cleanCode}`;
    if (carrier === 'Interrapidisimo') return `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${cleanCode}`;
    return "#";
  };

  const updateOrderStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status: newStatus });
  };

  const handlePrintOrder = async (order: Order) => {
    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const petrol = [0, 77, 77];
        
        doc.setFillColor(petrol[0], petrol[1], petrol[2]);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("BAYUP", 15, 20);
        doc.setFontSize(10);
        doc.text(`ORDEN DE PEDIDO: ${order.id}`, 15, 30);
        
        doc.setTextColor(0,0,0);
        doc.setFont("helvetica", "bold");
        doc.text("CLIENTE:", 15, 55);
        doc.setFont("helvetica", "normal");
        doc.text(`${order.customer.name}`, 15, 62);
        doc.text(`${order.customer.email}`, 15, 68);
        doc.text(`${order.customer.phone}`, 15, 74);
        
        doc.setFont("helvetica", "bold");
        doc.text("ENVÍO A:", 120, 55);
        doc.setFont("helvetica", "normal");
        doc.text(`${order.customer.address}`, 120, 62);
        doc.text(`${order.customer.city}, Colombia`, 120, 68);

        let y = 90;
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y-6, 185, 8, 'F');
        doc.text("PRODUCTO", 16, y);
        doc.text("CANT", 130, y);
        doc.text("TOTAL", 160, y);

        y += 10;
        order.items.forEach(item => {
            doc.text(item.name.slice(0, 40), 16, y);
            doc.text(item.quantity.toString(), 133, y);
            doc.text(formatCurrency(item.price * item.quantity), 160, y);
            y += 8;
        });

        doc.setFont("helvetica", "bold");
        doc.text("TOTAL NETO:", 120, y + 10);
        doc.text(formatCurrency(order.total), 160, y + 10);

        doc.save(`Pedido_${order.id}.pdf`);
    } catch (e) { console.error(e); }
  };

  const handleWhatsAppOrder = (order: Order) => {
    const msg = `Hola ${order.customer.name}! 👋 Te informamos que tu pedido ${order.id} por valor de ${formatCurrency(order.total)} ya está en nuestro sistema. Gracias por confiar en Bayup.`;
    window.open(`https://wa.me/${order.customer.phone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmailOrder = (order: Order) => {
    showToast(`Correo enviado exitosamente a ${order.customer.email}`, "success");
  };

  const handleCancelOrder = (order: Order) => {
    if(confirm(`¿Estás seguro de que deseas cancelar la orden ${order.id}?`)) {
        updateOrderStatus(order.id, 'cancelled');
        setSelectedOrder(null);
        showToast("Pedido cancelado correctamente", "info");
    }
  };

  const handleInformProblem = (order: Order) => {
    const trackingUrl = getTrackingUrl(order.carrier, order.trackingNumber);
    const msg = `Hola ${order.customer.name}! 👋 Queremos pedirte una sincera disculpa. Detectamos un retraso en tu envío con ${order.carrier} debido a una novedad logística. 

Estamos trabajando para solucionarlo lo antes posible. Puedes ver el estado actualizado aquí: ${trackingUrl}

Gracias por tu paciencia.`;
    window.open(`https://wa.me/${order.customer.phone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    showToast("Cliente informado sobre el retraso", "success");
  };

  const handleInvoiceOrder = async (order: Order) => {
    // 1. Actualizar estado y marca de facturación
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'processing', invoiced: true } : o));
    if (selectedOrder?.id === order.id) setSelectedOrder({ ...selectedOrder, status: 'processing', invoiced: true });

    // 2. Generar Factura PDF automáticamente
    await handlePrintOrder(order);

    // 3. Notificación WhatsApp específica
    const msg = `¡Hola ${order.customer.name}! 👋 Tu pedido ${order.id} ha sido facturado con éxito. Estamos a la espera de que la transportadora pase por tu pedido para enviarte la guía de seguimiento. ¡Gracias por elegirnos!`;
    window.open(`https://wa.me/${order.customer.phone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');

    // 4. Notificación Premium y Sincronización
    showToast("¡Felicidades! Venta exitosa. El pedido pasó al módulo 'En Proceso' y ya está disponible en tu Historial de Facturación.", "success");

    // 5. Cerrar el modal automáticamente
    setSelectedOrder(null);
  };

  const handleShipOrder = async (order: Order) => {
    if (!shippingData.carrier || !shippingData.trackingNumber) {
        showToast("Por favor completa los datos de envío", "info");
        return;
    }

    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const petrol = [0, 77, 77]; // #004D4D
        const cyan = [0, 242, 255]; // #00F2FF

        // --- 1. DISEÑO HEADER PREMIUM ---
        doc.setFillColor(petrol[0], petrol[1], petrol[2]);
        doc.rect(0, 0, 210, 50, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.text("BAYUP", 15, 25);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("CENTRO DE DESPACHO DIGITAL", 15, 35);
        doc.text(`ORDEN: ${order.id}`, 15, 42);

        doc.setFontSize(12);
        doc.text("FACTURA DE VENTA & GUÍA", 140, 25);
        doc.setFontSize(9);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 140, 32);
        doc.setTextColor(cyan[0], cyan[1], cyan[2]);
        doc.text("ESTADO: ENVIADO", 140, 39);

        // --- 2. SECCIÓN LOGÍSTICA (NUEVO) ---
        doc.setFillColor(245, 250, 250);
        doc.rect(15, 60, 180, 35, 'F');
        doc.setDrawColor(petrol[0], petrol[1], petrol[2]);
        doc.setLineWidth(0.5);
        doc.line(15, 60, 15, 95); // Línea decorativa lateral

        doc.setTextColor(petrol[0], petrol[1], petrol[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("INFORMACIÓN DE SEGUIMIENTO", 22, 70);
        
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Transportadora: ${shippingData.carrier}`, 22, 78);
        doc.text(`Número de Guía: ${shippingData.trackingNumber}`, 22, 84);

        // Lógica de Enlace de Rastreo
        let trackingUrl = "#";
        if (shippingData.carrier === 'Coordinadora') trackingUrl = `https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastreo-de-guias/?guia=${shippingData.trackingNumber}`;
        if (shippingData.carrier === 'Servientrega') trackingUrl = `https://www.servientrega.com/wps/portal/Colombia/transacciones-personas/rastreo-envios?id=${shippingData.trackingNumber}`;
        if (shippingData.carrier === 'Interrapidisimo') trackingUrl = `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${shippingData.trackingNumber}`;

        doc.setTextColor(0, 100, 255);
        doc.setFont("helvetica", "bold");
        doc.text("Rastrear mi paquete ahora (Clic aquí)", 22, 90);
        doc.link(22, 87, 60, 5, { url: trackingUrl });

        // --- 3. DATOS CLIENTE & ENVÍO ---
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text("DESTINATARIO", 120, 70);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text(order.customer.name, 120, 76);
        doc.text(order.customer.address, 120, 82);
        doc.text(`${order.customer.city}, Colombia`, 120, 88);

        // --- 4. DETALLE DE PRODUCTOS ---
        let y = 110;
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y - 6, 180, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("PRODUCTOS FACTURADOS", 17, y);
        doc.text("CANT", 130, y);
        doc.text("TOTAL", 165, y);

        y += 10;
        doc.setFont("helvetica", "normal");
        order.items.forEach(item => {
            doc.text(item.name.slice(0, 45), 17, y);
            doc.text(item.quantity.toString(), 133, y);
            doc.text(formatCurrency(item.price * item.quantity), 165, y);
            y += 8;
        });

        // --- 5. TOTALES ---
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y + 2, 195, y + 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("TOTAL PAGADO:", 110, y + 12);
        doc.setTextColor(petrol[0], petrol[1], petrol[2]);
        doc.text(formatCurrency(order.total), 165, y + 12);

        // --- 6. PIE DE PÁGINA ---
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text("Gracias por tu compra digital. Este documento es un comprobante oficial de despacho.", 105, 280, { align: 'center' });

        doc.save(`Despacho_${order.id}_${order.customer.name.replace(/ /g, '_')}.pdf`);

        // Actualizar Estado y Notificar
        setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'shipped', hasTracking: true } : o));
        
        const msg = `¡Hola ${order.customer.name}! 🚀 Tu pedido ${order.id} ya fue entregado a ${shippingData.carrier}. \n\n📍 Guía: ${shippingData.trackingNumber}\n🔗 Rastrear aquí: ${trackingUrl}\n\nTe adjuntamos tu factura y comprobante de despacho. ¡Disfrútalo!`;
        window.open(`https://wa.me/${order.customer.phone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');

        // --- INTEGRACIÓN: REGISTRAR EN MÓDULO ENVÍOS ---
        const newShipment = {
            id: `SHP-${order.id.split('-')[1] || Date.now().toString().slice(-4)}`,
            order_id: order.id,
            customer: order.customer,
            carrier: shippingData.carrier,
            tracking_number: shippingData.trackingNumber,
            status: 'label_generated',
            last_update: new Date().toISOString(),
            estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            history: [{ date: new Date().toISOString(), message: "Guía generada y pendiente de recolección", location: "Bodega Principal" }]
        };

        const existingShipments = JSON.parse(localStorage.getItem('bayup_shipments') || '[]');
        localStorage.setItem('bayup_shipments', JSON.stringify([...existingShipments, newShipment]));
        // ----------------------------------------------

        showToast("¡Despacho Exitoso! Registrado en el Módulo de Envíos.", "success");
        setIsShippingModalOpen(false);
        setSelectedOrder(null);
        setShippingData({ carrier: '', trackingNumber: '' });

    } catch (e) { 
        console.error(e); 
        showToast("Error al generar los documentos de despacho", "error");
    }
  };

  const guideContent = {
    all: {
        title: 'Vista Global',
        icon: <Globe size={20}/>,
        color: 'text-blue-500',
        howItWorks: 'Es tu centro de mando omnicanal. Aquí convergen todos los pedidos generados en tus canales digitales: Web, Shopify, Marketplaces y Redes Sociales.',
        example: 'Entra un pedido de Shopify y otro de MercadoLibre casi al mismo tiempo; ambos aparecen aquí centralizados para que gestiones tu operación digital sin saltar entre plataformas.',
        tip: 'Usa esta vista para supervisar el rendimiento de tus campañas de marketing digital en tiempo real.'
    },
    to_invoice: {
        title: 'Por Facturar',
        icon: <FileText size={20}/>,
        color: 'text-amber-500',
        howItWorks: 'Filtra pedidos que ya tienen el pago confirmado (Paid) pero carecen de una factura legal generada en el sistema.',
        example: 'Un cliente pagó por PSE en tu web. El dinero ya está en tu cuenta, pero legalmente debes emitirle el documento. Aquí es donde haces clic en "Generar Factura".',
        tip: 'No dejes acumular más de 10 pedidos aquí. La facturación inmediata aumenta la confianza del cliente y acelera el despacho.'
    },
    processing: {
        title: 'En Proceso',
        icon: <Package size={20}/>,
        color: 'text-cyan-500',
        howItWorks: 'Órdenes que ya tienen factura y están en manos de tu equipo de bodega para ser alistadas y empacadas.',
        example: 'Tu operario ve el pedido en esta lista, imprime la etiqueta, busca el producto en la estantería y lo mete en la caja de seguridad.',
        tip: 'Imprime los "Picking Lists" masivos desde las acciones masivas de esta pestaña para que bodega recoja todo de un solo viaje.'
    },
    shipped: {
        title: 'Enviado',
        icon: <Truck size={20}/>,
        color: 'text-indigo-500',
        howItWorks: 'Pedidos que ya tienen un número de guía asignado y han sido entregados a la transportadora (Servientrega, Coordinadora, etc.).',
        example: 'El camión de la transportadora pasó a las 4:00 PM. Escaneas las guías y automáticamente pasan a este estado para seguimiento.',
        tip: 'Si un pedido lleva más de 3 días en este estado sin moverse, contacta proactivamente al cliente. ¡Eso es servicio premium!'
    },
    completed: {
        title: 'Completado',
        icon: <CheckCircle2 size={20}/>,
        color: 'text-emerald-500',
        howItWorks: 'El punto final del éxito. El sistema detecta que la transportadora entregó el paquete o tú confirmaste la recepción manual.',
        example: 'La transportadora marca "Entregado". El pedido se mueve aquí y se dispara un correo automático de "Gracias por tu compra".',
        tip: 'Este es el momento ideal para pedir una reseña en Google o Instagram. Un cliente que acaba de recibir su paquete es el más propenso a recomendarte.'
    },
    delayed: {
        title: 'Retrasado',
        icon: <AlertCircle size={20}/>,
        color: 'text-rose-500',
        howItWorks: 'Alertas críticas. Pedidos cancelados, devoluciones solicitadas o envíos que superaron el tiempo de entrega estimado.',
        example: 'Un cliente puso mal su dirección y la transportadora devolvió el paquete a tu bodega. El pedido aparece aquí resaltado en rojo.',
        tip: 'Trata esta pestaña como tu "Sala de Urgencias". Resolver un pedido retrasado en menos de 2 horas convierte un problema en un cliente fiel.'
    }
  };

  // --- KPI Logic ---
  const kpiData = useMemo(() => [
      {
          id: 'sales_today',
          title: 'Ventas de Hoy',
          value: <AnimatedNumber value={2450000} />,
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
                      <span className="text-sm font-black text-slate-900"><AnimatedNumber value={1200000}/></span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">MercadoLibre</span>
                      <span className="text-sm font-black text-slate-900"><AnimatedNumber value={850000}/></span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">WhatsApp</span>
                      <span className="text-sm font-black text-slate-900"><AnimatedNumber value={400000}/></span>
                  </div>
              </div>
          )
      },
      {
        id: 'pending_invoice',
        title: 'Pendientes Facturar',
        value: <div className="flex items-baseline gap-1"><AnimatedNumber value={5} type="simple"/> <span className="text-sm">Pedidos</span></div>,
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
        value: <AnimatedNumber value={185000} />,
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
                        <p className="text-sm font-black text-slate-900 mt-1"><AnimatedNumber value={50000}/></p>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Ticket Máximo</p>
                        <p className="text-sm font-black text-slate-900 mt-1"><AnimatedNumber value={820000}/></p>
                    </div>
                 </div>
            </div>
        )
      },
      {
        id: 'pending_ship',
        title: 'Pendientes Enviar',
        value: <div className="flex items-baseline gap-1"><AnimatedNumber value={8} type="simple"/> <span className="text-sm">Pedidos</span></div>,
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
  ], [orders]);

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
          matchesStatus = order.status === 'delayed';
          break;
        case 'all':
        default:
          matchesStatus = true;
      }

      // Filtros Avanzados
      const matchesChannel = advancedFilters.channel === 'all' || order.channel === advancedFilters.channel;
      // Simplificación: PaymentMethod en mock es string libre, aquí normalizamos un poco para el ejemplo
      const matchesPayment = advancedFilters.paymentMethod === 'all' || 
                             (advancedFilters.paymentMethod === 'card' && order.paymentMethod.toLowerCase().includes('card')) ||
                             (advancedFilters.paymentMethod === 'transfer' && order.paymentMethod.toLowerCase().includes('transferencia')) ||
                             (advancedFilters.paymentMethod === 'cash' && order.paymentMethod.toLowerCase().includes('efectivo'));

      return matchesSearch && matchesStatus && matchesChannel && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, advancedFilters]);

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

  const handleDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
      const today = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      
      let start = new Date();
      let end = new Date();

      switch (preset) {
          case 'today':
              break; // Start & End are today
          case 'yesterday':
              start.setDate(today.getDate() - 1);
              end.setDate(today.getDate() - 1);
              break;
          case 'week':
              start.setDate(today.getDate() - 7);
              break;
          case 'month':
              start = new Date(today.getFullYear(), today.getMonth(), 1);
              break;
      }
      
      setDateRangeState({ from: formatDate(start), to: formatDate(end) });
  };

  const handleExport = async () => {
    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Colores corporativos
        const petrol = [0, 77, 77]; // #004D4D
        const cyan = [0, 242, 255]; // #00F2FF
        
        // Encabezado
        doc.setFillColor(petrol[0], petrol[1], petrol[2]);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("REPORTE DE PEDIDOS", 14, 20);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const rangeText = dateRangeState.from ? `Del ${dateRangeState.from} al ${dateRangeState.to}` : "Histórico Completo";
        doc.text(rangeText, 14, 30);
        
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, 150, 20);
        doc.text(`Total Registros: ${filteredOrders.length}`, 150, 28);

        // Tabla
        let y = 50;
        const headers = ["ID", "Fecha", "Cliente", "Canal", "Estado", "Total"];
        const colWidths = [30, 35, 50, 25, 25, 25];
        
        // Header Tabla
        doc.setFillColor(240, 240, 240);
        doc.rect(14, y-6, 185, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        
        let x = 14;
        headers.forEach((h, i) => {
            doc.text(h, x, y);
            x += colWidths[i];
        });
        
        y += 8;
        doc.setFont("helvetica", "normal");
        
        // Filas
        filteredOrders.forEach((order) => {
            if (y > 270) { doc.addPage(); y = 20; } // Nueva página
            
            x = 14;
            doc.text(order.id, x, y); x += colWidths[0];
            doc.text(new Date(order.date).toLocaleDateString(), x, y); x += colWidths[1];
            doc.text(order.customer.name.slice(0, 25), x, y); x += colWidths[2]; // Truncar nombre largo
            doc.text(order.channel.toUpperCase(), x, y); x += colWidths[3];
            doc.text(order.status.toUpperCase(), x, y); x += colWidths[4];
            doc.text(formatCurrency(order.total), x, y);
            
            y += 7;
        });

        // Footer Total
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y+2, 199, y+2);
        
        const totalSum = filteredOrders.reduce((acc, o) => acc + o.total, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("TOTAL VENTAS:", 120, y + 10);
        doc.setTextColor(petrol[0], petrol[1], petrol[2]);
        doc.text(formatCurrency(totalSum), 160, y + 10);

        doc.save(`Reporte_Pedidos_${new Date().toISOString().split('T')[0]}.pdf`);
        setIsDateMenuOpen(false);

    } catch (error) {
        console.error("Error generando PDF", error);
        alert("Hubo un error al generar el reporte PDF.");
    }
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
            {/* Centered Floating Menu + Info Button */}
            <div className="flex items-center gap-4">
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

                {/* Guía Icon Button */}
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsGuideOpen(true)}
                    className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all group"
                >
                    <Info size={20} className="group-hover:animate-pulse"/>
                </motion.button>
            </div>

            {/* Workflow Guide Modal (Interactive Center) */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsGuideOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row"
                        >
                            {/* Navigation Sidebar */}
                            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto">
                                <div className="mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Flujo Bayup</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">Guía de Maestría</p>
                                </div>
                                {Object.entries(guideContent).map(([key, item]) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveGuideTab(key)}
                                        className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                                    >
                                        <div className={`${activeGuideTab === key ? 'text-white' : item.color}`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${guideContent[activeGuideTab as keyof typeof guideContent].color}`}>
                                            {guideContent[activeGuideTab as keyof typeof guideContent].icon}
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                                            {guideContent[activeGuideTab as keyof typeof guideContent].title}
                                        </h2>
                                    </div>
                                    <button onClick={() => setIsGuideOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                                        <X size={20}/>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                    <section>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo funciona?
                                        </h4>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                            {guideContent[activeGuideTab as keyof typeof guideContent].howItWorks}
                                        </p>
                                    </section>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Smartphone size={14} className="text-cyan-500"/> Ejemplo Real
                                            </h4>
                                            <div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]">
                                                <p className="text-xs font-medium text-cyan-900 leading-relaxed italic">
                                                    "{guideContent[activeGuideTab as keyof typeof guideContent].example}"
                                                </p>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Zap size={14} className="text-amber-500"/> Bayup Pro-Tip
                                            </h4>
                                            <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]">
                                                <p className="text-xs font-bold text-amber-900 leading-relaxed">
                                                    {guideContent[activeGuideTab as keyof typeof guideContent].tip}
                                                </p>
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30">
                                    <button 
                                        onClick={() => setIsGuideOpen(false)}
                                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
                                    >
                                        Cerrar Guía
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                 <div className="flex items-center gap-2 relative">
                     {/* Overlay de Cierre */}
                     {(isFilterMenuOpen || isDateMenuOpen) && <div className="fixed inset-0 z-40" onClick={() => { setIsFilterMenuOpen(false); setIsDateMenuOpen(false); }} />}

                     <div className="relative z-50">
                        <motion.button 
                            layout
                            onMouseEnter={() => setIsFilterHovered(true)}
                            onMouseLeave={() => setIsFilterHovered(false)}
                            onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsDateMenuOpen(false); }}
                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}
                        >
                            <motion.div layout><Filter size={18}/></motion.div>
                            <AnimatePresence mode="popLayout">
                                {isFilterHovered && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Filtro</motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                        
                        <AnimatePresence>
                            {isFilterMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 w-[300px] z-50 origin-top-right overflow-hidden"
                                >
                                    <div className="flex flex-col">
                                        {[
                                            { id: 'canal', label: 'Canal de Venta', icon: <Globe size={16}/>, options: ['all', 'web', 'whatsapp', 'shopify', 'mercadolibre'], key: 'channel' },
                                            { id: 'pago', label: 'Método de Pago', icon: <CreditCard size={16}/>, options: ['all', 'card', 'transfer', 'cash'], key: 'paymentMethod' },
                                            { id: 'estado', label: 'Estado del Pedido', icon: <AlertCircle size={16}/>, options: ['all', 'pending', 'paid', 'processing', 'shipped', 'delivered'], key: 'status' }
                                        ].map((section) => (
                                            <div key={section.id} className="border-b border-slate-50 last:border-none">
                                                <button 
                                                    onClick={() => setActiveAccordion(activeAccordion === section.id ? null : section.id)}
                                                    className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-50 ${activeAccordion === section.id ? 'bg-slate-50/50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${activeAccordion === section.id ? 'bg-[#004D4D] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            {section.icon}
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-wide text-slate-700">{section.label}</span>
                                                    </div>
                                                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${activeAccordion === section.id ? 'rotate-90' : ''}`}/>
                                                </button>
                                                
                                                <AnimatePresence>
                                                    {activeAccordion === section.id && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-slate-50/30 px-4 pb-4"
                                                        >
                                                            <div className="flex flex-wrap gap-2 pt-2">
                                                                {section.options.map(opt => (
                                                                    <button 
                                                                        key={opt}
                                                                        onClick={() => setAdvancedFilters({...advancedFilters, [section.key]: opt})}
                                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${advancedFilters[section.key as keyof typeof advancedFilters] === opt ? 'bg-[#004D4D] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#004D4D]'}`}
                                                                    >
                                                                        {opt === 'all' ? 'Todos' : opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}

                                        <div className="p-4 bg-slate-50">
                                            <button 
                                                onClick={() => { setAdvancedFilters({channel: 'all', paymentMethod: 'all', status: 'all'}); setIsFilterMenuOpen(false); setActiveAccordion(null); }}
                                                className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-slate-900/10 hover:bg-black transition-all"
                                            >
                                                Limpiar Filtros
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>

                     <div className="relative z-50">
                        <motion.button 
                            layout
                            onMouseEnter={() => setIsDateHovered(true)}
                            onMouseLeave={() => setIsDateHovered(false)}
                            onClick={() => { setIsDateMenuOpen(!isDateMenuOpen); setIsFilterMenuOpen(false); }}
                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}
                        >
                            <motion.div layout><CalendarIcon size={18}/></motion.div>
                            <AnimatePresence mode="popLayout">
                                {isDateHovered && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Fecha</motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <AnimatePresence>
                            {isDateMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-[320px] z-50 origin-top-right"
                                >
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desde</label>
                                                <input 
                                                    type="date" 
                                                    value={dateRangeState.from}
                                                    onChange={(e) => setDateRangeState({ ...dateRangeState, from: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004D4D]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hasta</label>
                                                <input 
                                                    type="date" 
                                                    value={dateRangeState.to}
                                                    onChange={(e) => setDateRangeState({ ...dateRangeState, to: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004D4D]"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => handleDatePreset('today')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-colors">Hoy</button>
                                            <button onClick={() => handleDatePreset('yesterday')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-colors">Ayer</button>
                                            <button onClick={() => handleDatePreset('week')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-colors">7 Días</button>
                                            <button onClick={() => handleDatePreset('month')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-colors">Este Mes</button>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex gap-2">
                                            <button onClick={() => setIsDateMenuOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50">
                                                Cancelar
                                            </button>
                                            <button onClick={handleExport} className="flex-1 py-2.5 bg-[#004D4D] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#004D4D]/20 hover:bg-[#003333] flex items-center justify-center gap-2">
                                                <Download size={14}/> Aplicar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>

                     {/* Botón Exportar */}
                     <motion.button 
                        layout
                        onMouseEnter={() => setIsExportHovered(true)}
                        onMouseLeave={() => setIsExportHovered(false)}
                        onClick={handleExport}
                        className="h-12 flex items-center gap-2 px-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5 transition-all shadow-sm"
                     >
                        <motion.div layout><Download size={18}/></motion.div>
                        <AnimatePresence mode="popLayout">
                            {isExportHovered && (
                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar</motion.span>
                            )}
                        </AnimatePresence>
                     </motion.button>
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

      {/* --- Fullscreen Invoice View (Style POS) --- */}
      <AnimatePresence>
        {isInvoiceViewOpen && selectedOrder && (
            // ... (Invoice view code remains same)
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 50, opacity: 0 }} 
                    animate={{ scale: 1, y: 0, opacity: 1 }} 
                    exit={{ scale: 0.9, y: 50, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-2xl h-full max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white relative"
                >
                    {/* Header Factura */}
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                <User size={24} className="text-[#004D4D]" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase leading-none italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300">Factura</h4>
                                <p className="text-[9px] font-black text-cyan-400 uppercase mt-1 tracking-[0.2em]">Comprobante Digital</p>
                            </div>
                        </div>
                        <div className="text-right space-y-1 relative z-10">
                            <p className="text-[10px] font-black">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                            <p className="text-[9px] font-bold text-cyan-400 opacity-60 italic">{selectedOrder.id}</p>
                            <button 
                                onClick={() => setIsInvoiceViewOpen(false)}
                                className="mt-4 h-10 w-10 rounded-full bg-white/10 hover:bg-rose-500 transition-all flex items-center justify-center"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    </div>

                    {/* Cuerpo Factura (Papel) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10">
                        <div className="grid grid-cols-2 gap-10 border-b border-slate-50 pb-10">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Adquiriente</p>
                                <p className="text-lg font-black text-slate-900">{selectedOrder.customer.name}</p>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><Smartphone size={12} className="text-[#004D4D]" /> {selectedOrder.customer.phone}</p>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><Mail size={12} className="text-[#004D4D]" /> {selectedOrder.customer.email}</p>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Canal de Venta</p>
                                <p className="text-sm font-black text-[#004D4D] uppercase italic">{selectedOrder.channel}</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase">
                                    <CheckCircle2 size={10}/> Pagado
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 border-b border-slate-50 pb-4">
                                <span className="flex-1">Descripción del Item</span>
                                <span className="w-16 text-center">Cant.</span>
                                <span className="w-28 text-right">Total</span>
                            </div>
                            <div className="space-y-6">
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex items-start gap-4 px-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 leading-tight">{item.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">SKU: {item.sku}</p>
                                        </div>
                                        <div className="w-16 text-center text-xs font-black text-slate-900 pt-1">{item.quantity}</div>
                                        <div className="w-28 text-right text-sm font-black text-[#004D4D] pt-1">{formatCurrency(item.price * item.quantity)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-4">
                            <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>{formatCurrency(selectedOrder.total)}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Monto Total</p>
                                <h3 className="text-5xl font-black text-[#004D4D] tracking-tighter">{formatCurrency(selectedOrder.total)}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Footer Factura */}
                    <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                        <button 
                            onClick={() => handlePrintOrder(selectedOrder)}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Printer size={16}/> Descargar PDF
                        </button>
                        <button 
                            onClick={() => handleWhatsAppOrder(selectedOrder)}
                            className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Smartphone size={16}/> Enviar a WhatsApp
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- Customer Intelligence Modal --- */}
      <AnimatePresence>
        {isCustomerViewOpen && selectedOrder && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, x: 100, opacity: 0 }} 
                    animate={{ scale: 1, x: 0, opacity: 1 }} 
                    exit={{ scale: 0.9, x: 100, opacity: 0 }}
                    className="relative bg-[#FAFAFA] w-full max-w-6xl h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20"
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setIsCustomerViewOpen(false)}
                        className="absolute top-8 right-8 z-[510] h-12 w-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:rotate-90"
                    >
                        <X size={20}/>
                    </button>

                    {/* Left Sidebar: Basic Info & Loyalty */}
                    <div className="w-full md:w-[350px] bg-white border-r border-slate-100 p-10 flex flex-col items-center text-center space-y-8">
                        <div className="relative">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-[#004D4D] to-cyan-500 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                                {selectedOrder.customer.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                                <Zap size={16} fill="currentColor"/>
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedOrder.customer.name}</h2>
                            <p className="text-sm font-medium text-cyan-600">{selectedOrder.customer.email}</p>
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                Premium Member
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Edad</p>
                                <p className="text-lg font-black text-slate-900">28 Años</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Club Puntos</p>
                                <p className="text-lg font-black text-emerald-600">1,250</p>
                            </div>
                        </div>

                        <div className="w-full space-y-4 text-left">
                            <div className="flex items-center gap-4 text-slate-600">
                                <Smartphone size={18} className="text-slate-400"/>
                                <span className="text-sm font-bold">{selectedOrder.customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <MapPin size={18} className="text-slate-400"/>
                                <span className="text-xs font-medium leading-tight">{selectedOrder.customer.address}, {selectedOrder.customer.city}</span>
                            </div>
                        </div>

                        {/* Customer Spend Trend Graph */}
                        <div className="w-full pt-6 border-t border-slate-50 space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gasto Mensual</p>
                                    <p className="text-lg font-black text-slate-900">$450,000</p>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                                    <TrendingUp size={12}/> +15%
                                </div>
                            </div>
                            <div className="flex items-end justify-between h-16 gap-1 px-2">
                                {[30, 45, 25, 60, 80, 100].map((h, i) => (
                                    <div key={i} className="w-full bg-slate-50 rounded-t-md relative overflow-hidden group">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            className={`absolute bottom-0 w-full rounded-t-md ${i === 5 ? 'bg-cyan-500' : 'bg-slate-200'}`}
                                        ></motion.div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Últimos 6 meses</p>
                        </div>
                    </div>

                    {/* Right Content: Insights & Analytics */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        {/* Summary Header */}
                        <div className="flex justify-between items-end pr-16">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Customer <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004D4D] to-cyan-500">Intelligence</span></h3>
                                <p className="text-slate-400 text-sm font-medium mt-1">Análisis de comportamiento y patrones de compra.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Última Actividad</p>
                                <p className="text-sm font-black text-slate-900">{new Date(selectedOrder.date).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Behavioral Box */}
                            <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Comportamiento en Sitio</h4>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Tiempo/Sitio</p>
                                        <p className="text-lg font-black text-slate-900 mt-1">12m 45s</p>
                                    </div>
                                    <div className="p-4 bg-cyan-50 rounded-2xl overflow-hidden">
                                        <p className="text-[9px] font-black text-cyan-600 uppercase">Cupones</p>
                                        <p className="text-sm font-black text-cyan-700 mt-1 truncate">WELCOME10</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl overflow-hidden">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase">Tipo Cliente</p>
                                        <p className="text-sm font-black text-emerald-700 mt-1 truncate">Recurrente</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Búsquedas Recientes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Zapatillas Nike', 'Camisetas Oversize', 'Gorra Black', 'Calzado Deportivo'].map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack Box */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smartphone size={14}/> Tecnología</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Smartphone size={16} className="text-emerald-500"/>
                                            <span className="text-xs font-bold text-slate-700">Mobile</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">70%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-500" style={{ width: '70%' }}></div>
                                        <div className="h-full bg-[#004D4D]" style={{ width: '30%' }}></div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Globe size={16} className="text-[#004D4D]"/>
                                            <span className="text-xs font-bold text-slate-700">Desktop</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">30%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic mt-4 text-center border-t pt-4">Dispositivo: iPhone 15 Pro</p>
                            </div>
                        </div>

                        {/* Recent History & Views */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos Vistos (Session)</h4>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((it, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden"><img src={it.image} className="w-full h-full object-cover"/></div>
                                            <div className="flex-1"><p className="text-xs font-black text-slate-900">{it.name}</p><p className="text-[9px] text-slate-400">Visto 3 veces</p></div>
                                            <div className="text-right"><p className="text-xs font-black text-[#004D4D]">{formatCurrency(it.price)}</p></div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial de Órdenes</h4>
                                <div className="space-y-3">
                                    {[
                                        { id: '#7520', d: '10/12/2025', t: 120000, s: 'delivered' },
                                        { id: '#7680', d: '05/01/2026', t: 85000, s: 'delivered' }
                                    ].map((prev, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <div>
                                                <p className="text-xs font-black text-slate-900">{prev.id}</p>
                                                <p className="text-[9px] text-slate-400">{prev.d}</p>
                                            </div>
                                            <p className="text-xs font-black text-[#004D4D]">{formatCurrency(prev.t)}</p>
                                            <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={12}/></div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- Fullscreen Invoice View (Style POS) --- */}
      <AnimatePresence>
        {isInvoiceViewOpen && selectedOrder && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 50, opacity: 0 }} 
                    animate={{ scale: 1, y: 0, opacity: 1 }} 
                    exit={{ scale: 0.9, y: 50, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-2xl h-full max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white relative"
                >
                    {/* Header Factura */}
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                <User size={24} className="text-[#004D4D]" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase leading-none italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300">Factura</h4>
                                <p className="text-[9px] font-black text-cyan-400 uppercase mt-1 tracking-[0.2em]">Comprobante Digital</p>
                            </div>
                        </div>
                        <div className="text-right space-y-1 relative z-10">
                            <p className="text-[10px] font-black">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                            <p className="text-[9px] font-bold text-cyan-400 opacity-60 italic">{selectedOrder.id}</p>
                            <button 
                                onClick={() => setIsInvoiceViewOpen(false)}
                                className="mt-4 h-10 w-10 rounded-full bg-white/10 hover:bg-rose-500 transition-all flex items-center justify-center"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    </div>

                    {/* Cuerpo Factura (Papel) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-10 space-y-10">
                        <div className="grid grid-cols-2 gap-10 border-b border-slate-50 pb-10">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Adquiriente</p>
                                <p className="text-lg font-black text-slate-900">{selectedOrder.customer.name}</p>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><Smartphone size={12} className="text-[#004D4D]" /> {selectedOrder.customer.phone}</p>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><Mail size={12} className="text-[#004D4D]" /> {selectedOrder.customer.email}</p>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Canal de Venta</p>
                                <p className="text-sm font-black text-[#004D4D] uppercase italic">{selectedOrder.channel}</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase">
                                    <CheckCircle2 size={10}/> Pagado
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 border-b border-slate-50 pb-4">
                                <span className="flex-1">Descripción del Item</span>
                                <span className="w-16 text-center">Cant.</span>
                                <span className="w-28 text-right">Total</span>
                            </div>
                            <div className="space-y-6">
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex items-start gap-4 px-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 leading-tight">{item.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">SKU: {item.sku}</p>
                                        </div>
                                        <div className="w-16 text-center text-xs font-black text-slate-900 pt-1">{item.quantity}</div>
                                        <div className="w-28 text-right text-sm font-black text-[#004D4D] pt-1">{formatCurrency(item.price * item.quantity)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-4">
                            <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>{formatCurrency(selectedOrder.total)}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Monto Total</p>
                                <h3 className="text-5xl font-black text-[#004D4D] tracking-tighter">{formatCurrency(selectedOrder.total)}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Footer Factura */}
                    <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                        <button 
                            onClick={() => handlePrintOrder(selectedOrder)}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Printer size={16}/> Descargar PDF
                        </button>
                        <button 
                            onClick={() => handleWhatsAppOrder(selectedOrder)}
                            className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Smartphone size={16}/> Enviar a WhatsApp
                        </button>
                    </div>
                </motion.div>
            </motion.div>
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
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCustomerViewOpen(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all gap-2 group shadow-sm hover:shadow-md"
                  >
                    <User size={20} className="text-slate-400 group-hover:text-cyan-600 transition-colors"/>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-cyan-700">Ver Cliente</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEmailOrder(selectedOrder!)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all gap-2 group shadow-sm hover:shadow-md"
                  >
                    <Send size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors"/>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-blue-700">Email</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleWhatsAppOrder(selectedOrder!)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all gap-2 group shadow-sm hover:shadow-md"
                  >
                    <Smartphone size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors"/>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-700">WhatsApp</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCancelOrder(selectedOrder!)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 transition-all gap-2 group shadow-sm hover:shadow-md"
                  >
                    <Trash2 size={20} className="text-slate-400 group-hover:text-rose-600 transition-colors"/>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-rose-700">Cancelar</span>
                  </motion.button>
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
                 {selectedOrder.status === 'delivered' ? (
                    <button 
                        onClick={() => setIsInvoiceViewOpen(true)}
                        className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                    >
                        <FileText size={16} className="text-cyan-400"/> Ver Factura
                    </button>
                 ) : selectedOrder.status === 'delayed' ? (
                    <>
                        <button 
                            onClick={() => handleInformProblem(selectedOrder)}
                            className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={16}/> Informar Problema
                        </button>
                        <button 
                            onClick={() => {
                                const url = getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber);
                                if (url !== "#") window.open(url, '_blank');
                                else showToast("Datos de rastreo no disponibles", "info");
                            }}
                            className="flex-[2] py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-rose-600 text-white shadow-xl shadow-rose-900/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                        >
                            <AlertCircle size={18}/> Revisar Problema
                        </button>
                    </>
                 ) : (
                    <>
                        <button 
                            onClick={() => setIsInvoiceViewOpen(true)}
                            className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                        >
                            <FileText size={16} className="text-cyan-400"/> Ver Factura
                        </button>
                        
                        {selectedOrder.status === 'shipped' ? (
                            <>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShippingData({ carrier: selectedOrder.carrier || '', trackingNumber: selectedOrder.trackingNumber || '' });
                                        setIsShippingModalOpen(true);
                                    }}
                                    className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit3 size={16}/> 
                                    <span className="text-[10px] font-black uppercase tracking-widest">Editar Guía</span>
                                </motion.button>
                                <button 
                                    onClick={() => {
                                        const url = getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber);
                                        if (url !== "#") window.open(url, '_blank');
                                        else showToast("Datos de rastreo no disponibles", "info");
                                    }}
                                    className="flex-[2] py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#004D4D] text-white shadow-xl shadow-cyan-900/20 hover:bg-[#003333] transition-all flex items-center justify-center gap-2"
                                >
                                    <Globe size={18} className="text-cyan-400"/> Rastrear Pedido
                                </button>
                            </>
                        ) : selectedOrder.status === 'processing' ? (
                            <button 
                                onClick={() => setIsShippingModalOpen(true)}
                                className="flex-[2] py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#004D4D] text-white shadow-xl shadow-cyan-900/10 hover:bg-[#003333] transition-all flex items-center justify-center gap-2"
                            >
                                <Truck size={18}/> Generar Guía
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleInvoiceOrder(selectedOrder!)}
                                className="flex-[2] py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18}/> Facturar Venta
                            </button>
                        )}
                    </>
                 )}
              </div>

              {/* Shipping Data Modal */}
              <AnimatePresence>
                {isShippingModalOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsShippingModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20, opacity: 0 }} 
                            animate={{ scale: 1, y: 0, opacity: 1 }} 
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border border-white"
                        >
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-6 italic">Detalles de Despacho</h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-1 relative">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Transportadora</label>
                                    <button 
                                        onClick={() => setIsCarrierDropdownOpen(!isCarrierDropdownOpen)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 transition-all hover:bg-white hover:border-[#004D4D]/20 shadow-inner group"
                                    >
                                        <span>{shippingData.carrier || "Seleccionar empresa..."}</span>
                                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isCarrierDropdownOpen ? 'rotate-180 text-[#004D4D]' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isCarrierDropdownOpen && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-[700] overflow-hidden"
                                            >
                                                <div className="max-h-48 overflow-y-auto p-2 custom-scrollbar">
                                                    {carriers.map((c) => (
                                                        <button 
                                                            key={c}
                                                            onClick={() => {
                                                                setShippingData({...shippingData, carrier: c});
                                                                setIsCarrierDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${shippingData.carrier === c ? 'bg-[#004D4D] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            {c}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Guía</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: 123456789"
                                        value={shippingData.trackingNumber}
                                        onChange={(e) => setShippingData({...shippingData, trackingNumber: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#004D4D] transition-all shadow-inner"
                                    />
                                </div>

                                <button 
                                    onClick={() => handleShipOrder(selectedOrder!)}
                                    className="w-full mt-4 py-4 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-cyan-900/20 hover:bg-black transition-all"
                                >
                                    Confirmar y Enviar Guía
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
              </AnimatePresence>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
