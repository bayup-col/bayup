"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../context/auth-context';

interface ProductVariant {
    id: string;
    name: string;
    sku: string | null;
    price_adjustment: number;
    image_url: string | null;
}

interface OrderItem {
    id: string;
    product_variant_id: string; 
    quantity: number;
    price_at_purchase: number;
    product_variant?: ProductVariant; 
}

interface Order {
    id: string;
    customer_id: string;
    tenant_id: string;
    total_price: number;
    status: string; // 'pending', 'paid', 'shipped', 'cancelled', 'new', 'abandoned'
    created_at: string;
    tax_rate_id: string | null;
    tax_rate_snapshot: number | null;
    shipping_option_id: string | null;
    shipping_cost_snapshot: number | null;
    items: OrderItem[];
}

// Datos Mock para pruebas de visualización (simulando diferentes estados)
const MOCK_ORDERS: Order[] = [
    {
        id: "ord_001_new", customer_id: "cust_123", tenant_id: "t_1", total_price: 1250.00, status: "new", created_at: new Date().toISOString(),
        items: [], tax_rate_id: null, tax_rate_snapshot: 0, shipping_option_id: null, shipping_cost_snapshot: 0
    },
    {
        id: "ord_002_pend", customer_id: "cust_456", tenant_id: "t_1", total_price: 3400.50, status: "pending", created_at: new Date(Date.now() - 86400000).toISOString(),
        items: [], tax_rate_id: null, tax_rate_snapshot: 0, shipping_option_id: null, shipping_cost_snapshot: 0
    },
    {
        id: "ord_003_ship", customer_id: "cust_789", tenant_id: "t_1", total_price: 890.00, status: "shipped", created_at: new Date(Date.now() - 172800000).toISOString(),
        items: [], tax_rate_id: null, tax_rate_snapshot: 0, shipping_option_id: null, shipping_cost_snapshot: 0
    },
    {
        id: "ord_004_aban", customer_id: "cust_000", tenant_id: "t_1", total_price: 5000.00, status: "abandoned", created_at: new Date(Date.now() - 259200000).toISOString(),
        items: [], tax_rate_id: null, tax_rate_snapshot: 0, shipping_option_id: null, shipping_cost_snapshot: 0
    }
];

export default function OrdersPage() {
    const { token, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'all' | 'new' | 'pending' | 'shipped' | 'abandoned'>('all');
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrders = useCallback(async () => {
        if (!isAuthenticated || !token) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/orders', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                setOrders(MOCK_ORDERS); 
                return;
            }

            const data = await response.json();
            const finalOrders = data.length > 0 ? data : MOCK_ORDERS;
            setOrders(finalOrders);

            // Priorizar pestaña "Nuevos" si existen pedidos nuevos
            if (finalOrders.some((o: Order) => o.status === 'new')) {
                setActiveTab('new');
            }
        } catch (err) {
             setOrders(MOCK_ORDERS);
             if (MOCK_ORDERS.some(o => o.status === 'new')) setActiveTab('new');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Handlers
    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const toggleSelectOrder = (id: string) => {
        setSelectedOrders(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const filteredOrders = orders.filter(order => {
        const matchesTab = activeTab === 'all' || 
                         (activeTab === 'new' && order.status === 'new') ||
                         (activeTab === 'pending' && order.status === 'pending') ||
                         (activeTab === 'shipped' && order.status === 'shipped') ||
                         (activeTab === 'abandoned' && (order.status === 'abandoned' || order.status === 'cancelled'));
        
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             order.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesTab && matchesSearch;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
    );

    const pendingAttentionCount = orders.filter(o => o.status === 'new' || o.status === 'pending').length;

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header Operativo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Pedidos</h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        {pendingAttentionCount > 0 ? (
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="text-rose-600 font-bold">{pendingAttentionCount} pedidos</span> requieren tu atención inmediata.
                            </span>
                        ) : (
                            "Tu tienda está al día. No hay pedidos pendientes."
                        )}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white border border-gray-100 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Exportar
                    </button>
                </div>
            </div>

            {/* Tabs y Buscador */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="flex space-x-1 bg-gray-50 p-1.5 rounded-2xl shadow-sm border border-gray-100/50 w-full lg:w-fit overflow-x-auto">
                    {(['all', 'new', 'pending', 'shipped', 'abandoned'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setSelectedOrders([]); }}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all whitespace-nowrap ${
                                activeTab === tab 
                                ? 'bg-white text-purple-700 shadow-sm border border-gray-100' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab === 'all' ? 'Todo' : 
                            tab === 'new' ? 'Nuevos' : 
                            tab === 'pending' ? 'Pendientes' :
                            tab === 'shipped' ? 'En Envío' : 'Abandonados'}
                            
                            {tab !== 'all' && orders.filter(o => o.status === tab).length > 0 && (
                                <span className="ml-2 opacity-50">({orders.filter(o => o.status === tab).length})</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-80">
                    <input
                        type="text"
                        placeholder="Buscar por ID o Cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 text-sm border border-gray-50 bg-gray-50/50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-500/5 focus:border-purple-200 outline-none transition-all font-medium"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 absolute left-4 top-3 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </div>
            </div>

            {/* Listado de Pedidos Premium */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden relative">
                
                {/* Barra de Acciones Masivas */}
                {selectedOrders.length > 0 && (
                    <div className="absolute top-0 inset-x-0 h-16 bg-purple-600 z-10 flex items-center justify-between px-8 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-4">
                            <span className="text-white text-xs font-black uppercase tracking-widest">{selectedOrders.length} Seleccionados</span>
                            <div className="h-4 w-px bg-white/20"></div>
                            <button onClick={() => alert("Marcados como despachados")} className="text-white text-xs font-bold hover:underline">Marcar como despachados</button>
                            <button onClick={() => alert("Exportando selección")} className="text-white text-xs font-bold hover:underline">Exportar</button>
                        </div>
                        <button onClick={() => setSelectedOrders([])} className="text-white/70 hover:text-white text-sm">✕</button>
                    </div>
                )}

                <table className="min-w-full divide-y divide-gray-50">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-5 text-left w-10">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Orden</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Acciones Rápidas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <p className="text-3xl mb-4">📦</p>
                                    <p className="text-sm font-bold text-gray-900">No hay pedidos aquí</p>
                                    <p className="text-xs text-gray-400 mt-1">Todo está bajo control por ahora.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => {
                                const isActionRequired = order.status === 'new' || order.status === 'pending';
                                return (
                                    <tr 
                                        key={order.id} 
                                        className={`group transition-all duration-300 hover:bg-gray-50/50 ${
                                            order.status === 'new' ? 'bg-emerald-50/30' : 
                                            order.status === 'pending' ? 'bg-rose-50/30' : ''
                                        }`}
                                    >
                                        <td className="px-8 py-6">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => toggleSelectOrder(order.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {order.status === 'new' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                                {order.status === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>}
                                                <span className="text-sm font-black text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-200">
                                                    {order.customer_id.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">Cliente {order.customer_id.slice(0, 4)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                                                order.status === 'new' ? 'bg-blue-50 text-blue-600 border border-blue-100/50' :
                                                order.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100/50' :
                                                order.status === 'shipped' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                                                'bg-gray-50 text-gray-400 border border-gray-100'
                                            }`}>
                                                {order.status === 'new' ? 'Nuevo' :
                                                 order.status === 'pending' ? 'Pendiente' :
                                                 order.status === 'shipped' ? 'En Envío' : 'Abandonado'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="text-sm font-black text-gray-900">{formatCurrency(order.total_price)}</span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                {/* Acciones Contextuales */}
                                                {order.status === 'new' && (
                                                    <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline">Despachar</button>
                                                )}
                                                {order.status === 'pending' && (
                                                    <button className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline">Confirmar</button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Tracking</button>
                                                )}
                                                
                                                <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Ver detalles</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
