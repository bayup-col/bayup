"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  ChevronDown, 
  Search, 
  X, 
  CheckCircle2, 
  Mail, 
  MessageSquare, 
  Bell, 
  Calendar,
  Filter,
  ArrowUpRight,
  MoreVertical,
  ExternalLink,
  Users,
  Package,
  Clock,
  DollarSign,
  Rocket,
  Trash2,
  Send,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '@/lib/jspdf-types';

interface OrderItem {
    name: string;
    qty: number;
}

export default function PurchaseOrdersPage() {
    const { token, userEmail } = useAuth();
    const { showToast } = useToast();
    
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'sent'>('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
    // Create PO Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [items, setItems] = useState<OrderItem[]>([{ name: '', qty: 1 }]);
    const [orderForm, setOrderForm] = useState({
        provider_name: '',
        total_amount: 0,
        sending_method: 'whatsapp',
        scheduled_at: ''
    });
    
    const [providers, setProviders] = useState<any[]>([]);
    const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Quick Register Provider State
    const [isRegisterProviderOpen, setIsRegisterProviderOpen] = useState(false);
    const [newProvider, setNewProvider] = useState({ name: '', email: '', phone: '' });

    // --- GENERADOR DE PDF ---
    const generatePOPDF = (poData: any, provider: any) => {
        const doc = new jsPDF();
        
        // 1. Encabezado Premium
        doc.setFillColor(17, 24, 39);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDEN DE COMPRA', 20, 28);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`ID: PO-${poData.id.slice(0,8).toUpperCase()}`, 155, 20);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 155, 27);
        doc.text(`Estado: ${poData.status.toUpperCase()}`, 155, 34);

        // 2. Información de SEBAS (EMPRESA)
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('REMITENTE:', 20, 60);
        
        doc.setFontSize(14);
        doc.setTextColor(147, 51, 234); // Morado Bayup
        doc.text('SEBAS STORE', 20, 68);
        
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Nit: 900.123.456-1', 20, 74);
        doc.text('WhatsApp: +57 300 123 4567', 20, 79);
        doc.text(`Email: ${userEmail || 'contacto@sebas.com'}`, 20, 84);
        doc.text('Dirección: Calle 123 #45-67, Bogotá, Colombia', 20, 89);

        // 3. Información del PROVEEDOR
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PROVEEDOR:', 120, 60);
        
        doc.setFontSize(11);
        doc.text(provider?.name || poData.provider_name || 'Proveedor General', 120, 68);
        
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Email: ${provider?.email || 'N/A'}`, 120, 74);
        doc.text(`Tel: ${provider?.phone || 'N/A'}`, 120, 79);

        // 4. Tabla de Productos Detallada
        autoTable(doc, {
            startY: 100,
            head: [['Ítem', 'Descripción del Producto', 'Cantidad']],
            body: items.map((i, idx) => [idx + 1, i.name.toUpperCase(), i.qty]),
            theme: 'striped',
            headStyles: { fillColor: [147, 51, 234], fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 5 }
        });

        // 5. Totales y Notas
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`VALOR ESTIMADO DE COMPRA: ${formatCurrency(orderForm.total_amount)}`, 100, finalY);

        // 6. Pie de página Legal
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Esta orden de compra es un documento oficial emitido a través de la plataforma Bayup.', 20, 280);
        doc.text('Favor confirmar recepción y fecha estimada de entrega.', 20, 285);

        return doc;
    };

    const loadData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [ordersRes, providersRes] = await Promise.all([
                fetch('http://localhost:8000/purchase-orders', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:8000/providers', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (ordersRes.ok) setOrders(await ordersRes.json());
            if (providersRes.ok) setProviders(await providersRes.json());
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    }, [token]);

    const handleCreateProvider = async () => {
        if (!newProvider.name) return showToast("El nombre es obligatorio", "error");
        try {
            const res = await fetch('http://localhost:8000/providers', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProvider)
            });
            if (res.ok) {
                showToast("Proveedor registrado", "success");
                await loadData();
                setOrderForm({ ...orderForm, provider_name: newProvider.name });
                setIsRegisterProviderOpen(false);
                setNewProvider({ name: '', email: '', phone: '' });
            }
        } catch (e) { showToast("Error al registrar", "error"); }
    };

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenModal = (order?: any) => {
        if (order) {
            setEditingOrder(order);
            setItems(order.items && order.items.length > 0 ? order.items : [{ name: order.product_name, qty: order.quantity }]);
            setOrderForm({
                provider_name: order.provider_name || '',
                total_amount: order.total_amount || 0,
                sending_method: order.sending_method || 'whatsapp',
                scheduled_at: order.scheduled_at ? new Date(order.scheduled_at).toISOString().slice(0, 16) : ''
            });
        } else {
            setEditingOrder(null);
            setItems([{ name: '', qty: 1 }]);
            setOrderForm({ provider_name: '', total_amount: 0, sending_method: 'whatsapp', scheduled_at: '' });
        }
        setIsCreateModalOpen(true);
    };

    const handleCreatePO = async (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = items.filter(i => i.name && i.qty > 0);
        if (validItems.length === 0 || !orderForm.provider_name) return showToast("Completa los datos", "error");
        
        setIsSubmitting(true);
        try {
            const providerObj = providers.find(p => p.name === orderForm.provider_name);
            const summary = validItems.length === 1 ? validItems[0].name : `${validItems[0].name} y ${validItems.length - 1} más...`;
            const total_qty = validItems.reduce((acc, curr) => acc + curr.qty, 0);

            const method = editingOrder ? 'PUT' : 'POST';
            const url = editingOrder ? `http://localhost:8000/purchase-orders/${editingOrder.id}` : 'http://localhost:8000/purchase-orders';

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_name: summary,
                    quantity: total_qty,
                    items: validItems,
                    total_amount: orderForm.total_amount,
                    provider_name: orderForm.provider_name,
                    sending_method: orderForm.sending_method,
                    status: orderForm.sending_method === 'reminder' ? 'scheduled' : 'sent',
                    scheduled_at: orderForm.scheduled_at || null
                })
            });

            if (res.ok) {
                const poData = await res.json();
                if (orderForm.sending_method !== 'reminder') {
                    const doc = generatePOPDF(poData, providerObj);
                    if (orderForm.sending_method === 'whatsapp') {
                        doc.save(`PO_${poData.id.slice(0,8)}.pdf`);
                        const waUrl = `https://wa.me/${providerObj?.phone?.replace(/\+/g, '')}?text=${encodeURIComponent("Hola, adjunto mi nueva orden de compra.")}`;
                        window.open(waUrl, '_blank');
                    }
                }
                showToast(editingOrder ? "Orden actualizada" : "Orden procesada", "success");
                setIsCreateModalOpen(false);
                await loadData();
            }
        } catch (e) { console.error(e); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!editingOrder) return;
        if (!confirm("¿Eliminar esta orden permanentemente?")) return;
        try {
            const res = await fetch(`http://localhost:8000/purchase-orders/${editingOrder.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast("Orden eliminada", "success");
                setIsCreateModalOpen(false);
                await loadData();
            }
        } catch (e) { console.error(e); }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const formatNumberInput = (val: number) => {
        if (val === 0) return "0";
        if (!val) return "";
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const unformatNumberInput = (val: string) => {
        return parseInt(val.replace(/\./g, '')) || 0;
    };

    const { filteredOrders, totalPages } = useMemo(() => {
        const filtered = orders
            .filter(o => {
                const matchSearch = o.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  o.provider_name?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchStatus = activeTab === 'pending' ? o.status === 'scheduled' : o.status === 'sent';
                return matchSearch && matchStatus;
            })
            // ORDENAMIENTO: El más nuevo arriba
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const total = Math.ceil(filtered.length / itemsPerPage);
        const sliced = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return { filteredOrders: sliced, totalPages: total };
    }, [orders, searchTerm, activeTab, currentPage]);

    // Resetear a página 1 cuando cambie el tab o búsqueda
    useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestión de Compras</h1>
                    <p className="text-gray-500 mt-2 font-medium">Automatiza y controla el suministro de tu tienda.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center gap-3">
                    <Plus size={16} /> Nueva Orden
                </button>
            </div>

            {/* Tabs de Estado */}
            <div className="flex items-center justify-center">
                <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-2">
                    <button onClick={() => setActiveTab('pending')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
                        <Clock size={14}/> Pendientes / Programadas
                    </button>
                    <button onClick={() => setActiveTab('sent')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sent' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
                        <Send size={14}/> Enviadas al Proveedor
                    </button>
                </div>
            </div>

            {/* Buscador */}
            <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-4 px-8 group focus-within:border-purple-200 transition-all">
                <Search className="text-gray-400 group-focus-within:text-purple-600" size={20} />
                <input type="text" placeholder="Buscar órdenes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 py-4 bg-transparent outline-none text-sm font-bold text-gray-900" />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50 text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Orden</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={4} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] animate-pulse">Cargando...</td></tr>
                            ) : filteredOrders.map((o) => (
                                <tr key={o.id} onClick={() => handleOpenModal(o)} className="hover:bg-gray-50/50 transition-all group cursor-pointer">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${activeTab === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors">{o.product_name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{new Date(o.created_at).toLocaleDateString()} · {o.quantity} uds</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-xs font-bold text-gray-600">{o.provider_name}</td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${o.status === 'sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{o.status}</span>
                                            <span className="text-[8px] font-black text-gray-300 uppercase">{o.sending_method}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right font-black text-sm text-gray-900">{formatCurrency(o.total_amount)}</td>
                                </tr>
                            ))}
                            {!isLoading && filteredOrders.length === 0 && (
                                <tr><td colSpan={4} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px]">No hay órdenes en esta sección</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Página {currentPage} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Anterior
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL MULTI-PRODUCTO */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col">
                            <div className="bg-gray-900 p-8 text-white relative">
                                <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={20} /></button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-lg"><ShoppingCart size={28} /></div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">{editingOrder ? 'Editar Orden' : 'Nueva Orden'}</h2>
                                        <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Suministros Inteligentes</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleCreatePO} className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/30 custom-scrollbar max-h-[70vh]">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Productos</p>
                                        <button type="button" onClick={() => setItems([...items, { name: '', qty: 1 }])} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2">+ Añadir</button>
                                    </div>
                                    <div className="space-y-3">
                                        {items.map((item, i) => (
                                            <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm animate-in slide-in-from-left-2">
                                                <input value={item.name} onChange={(e) => { const n = [...items]; n[i].name = e.target.value; setItems(n); }} className="flex-[3] p-3 bg-gray-50 rounded-xl outline-none text-xs font-bold" placeholder="Producto..." />
                                                <input type="number" value={item.qty} onChange={(e) => { const n = [...items]; n[i].qty = parseInt(e.target.value) || 0; setItems(n); }} className="flex-1 p-3 bg-gray-50 rounded-xl outline-none text-xs font-black text-center" />
                                                {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all"><Trash2 size={16}/></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100 items-end">
                                    <div className="space-y-2 relative">
                                        <div className="flex justify-between items-end px-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</label>
                                            <button type="button" onClick={() => setIsRegisterProviderOpen(true)} className="text-[9px] font-black text-purple-600 uppercase hover:underline">+ Registrar Nuevo</button>
                                        </div>
                                        <button type="button" onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)} className="w-full p-5 bg-white rounded-3xl text-sm font-black shadow-sm flex justify-between items-center border border-transparent hover:border-purple-100">{orderForm.provider_name || 'Seleccionar...'}<ChevronDown size={16}/></button>
                                        <AnimatePresence>{isProviderDropdownOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-50 overflow-hidden">
                                                {providers.length > 0 ? providers.map(p => (
                                                    <button key={p.id} type="button" onClick={() => { setOrderForm({...orderForm, provider_name: p.name}); setIsProviderDropdownOpen(false); }} className="w-full px-6 py-4 text-left text-xs font-black uppercase text-gray-600 hover:bg-purple-50">{p.name}</button>
                                                )) : (
                                                    <div className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase">Sin proveedores</div>
                                                )}
                                            </motion.div>
                                        )}</AnimatePresence>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Inversión</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xs">$</span>
                                            <input 
                                                type="text" 
                                                value={formatNumberInput(orderForm.total_amount)} 
                                                onChange={(e) => setOrderForm({...orderForm, total_amount: unformatNumberInput(e.target.value)})} 
                                                className="w-full pl-10 p-5 bg-white border-2 border-transparent focus:border-purple-200 rounded-3xl outline-none text-sm font-black shadow-sm" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                                    {[{ id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={18}/> }, { id: 'email', label: 'Email', icon: <Mail size={18}/> }, { id: 'reminder', label: 'Recordatorio', icon: <Bell size={18}/> }].map(m => (
                                        <div key={m.id} onClick={() => setOrderForm({...orderForm, sending_method: m.id})} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${orderForm.sending_method === m.id ? 'bg-white border-purple-600 shadow-lg scale-[1.02]' : 'bg-white border-transparent grayscale opacity-60'}`}>
                                            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900">{m.icon}</div>
                                            <span className="text-[9px] font-black uppercase">{m.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {orderForm.sending_method === 'reminder' && <input type="datetime-local" value={orderForm.scheduled_at} onChange={(e) => setOrderForm({...orderForm, scheduled_at: e.target.value})} className="w-full p-5 bg-white rounded-3xl outline-none text-sm font-black shadow-sm border-2 border-transparent focus:border-purple-200" />}
                            </form>

                            <div className="p-10 border-t border-gray-50 bg-white flex gap-4">
                                {editingOrder && <button type="button" onClick={handleDelete} className="h-16 w-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>}
                                <button type="submit" onClick={handleCreatePO} disabled={isSubmitting} className="flex-1 h-16 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                    {isSubmitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Rocket size={18} />}
                                    {editingOrder ? 'Guardar Cambios' : orderForm.sending_method === 'reminder' ? 'Programar' : 'Confirmar & Enviar'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: REGISTRAR NUEVO PROVEEDOR */}
            <AnimatePresence>
                {isRegisterProviderOpen && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20"
                        >
                            <div className="bg-gray-900 p-8 text-white">
                                <h2 className="text-xl font-black tracking-tight flex items-center gap-3"><Users size={20}/> Nuevo Proveedor</h2>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                    <input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" placeholder="Ej: Distribuidora Tech S.A." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo de Contacto</label>
                                    <input value={newProvider.email} onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" placeholder="proveedor@mail.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono / WhatsApp</label>
                                    <input value={newProvider.phone} onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" placeholder="+57 300 000 0000" />
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 flex gap-4">
                                <button onClick={() => setIsRegisterProviderOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                                <button onClick={handleCreateProvider} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Registrar Proveedor</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
