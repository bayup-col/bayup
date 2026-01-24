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
    
    // Estado para la pestaña activa
    const [activeTab, setActiveTab] = useState<'all' | 'new' | 'pending' | 'shipped' | 'abandoned'>('all');

    const fetchOrders = useCallback(async () => {
        if (!isAuthenticated || !token) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // Si falla la API real por ahora, usamos MOCK_ORDERS para mostrar el diseño
                console.warn("Backend error, using mock data for UI demo");
                setOrders(MOCK_ORDERS); 
                return;
            }

            const data = await response.json();
            // Mezclamos con mock data si viene vacío para que veas el diseño
            setOrders(data.length > 0 ? data : MOCK_ORDERS);
        } catch (err: any) {
             // Fallback a mock data en error de red para demo
             console.error(err);
             setOrders(MOCK_ORDERS);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Lógica de filtrado
    const filteredOrders = orders.filter(order => {
        if (activeTab === 'all') return true;
        if (activeTab === 'new') return order.status === 'new';
        if (activeTab === 'pending') return order.status === 'pending';
        if (activeTab === 'shipped') return order.status === 'shipped';
        if (activeTab === 'abandoned') return order.status === 'abandoned' || order.status === 'cancelled';
        return true;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Pedidos</h1>
                    <p className="text-gray-500 mt-1">Administra y procesa las órdenes de tu tienda.</p>
                </div>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    Exportar
                </button>
            </div>

            {/* Barra de Navegación (Tabs) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-x-auto">
                <div className="flex min-w-max p-1">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'all' 
                            ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        Todo
                    </button>
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'new' 
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        Nuevos
                        {orders.filter(o => o.status === 'new').length > 0 && (
                            <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                                {orders.filter(o => o.status === 'new').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'pending' 
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setActiveTab('shipped')}
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'shipped' 
                            ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        En envío
                    </button>
                    <button
                        onClick={() => setActiveTab('abandoned')}
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                            activeTab === 'abandoned' 
                            ? 'bg-red-50 text-red-700 ring-1 ring-red-200' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        Abandonados
                    </button>
                </div>
            </div>

            {/* Listado de Pedidos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No hay pedidos en esta categoría</h3>
                        <p className="mt-1 text-sm text-gray-500">Los pedidos aparecerán aquí cuando cambien de estado.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-purple-600">#{order.id.slice(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                {order.customer_id.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm text-gray-900">Cliente {order.customer_id.slice(0, 4)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            order.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                            order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                            order.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {order.status === 'new' ? 'Nuevo' :
                                             order.status === 'pending' ? 'Pendiente' :
                                             order.status === 'shipped' ? 'En Envío' :
                                             order.status === 'abandoned' ? 'Abandonado' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {formatCurrency(order.total_price)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <a href="#" className="text-purple-600 hover:text-purple-900">Ver detalles</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}