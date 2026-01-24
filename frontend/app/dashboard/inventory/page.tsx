"use client";

import { useState } from 'react';

interface InventoryItem {
    id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    current_stock: number;
    min_stock_threshold: number;
    price: number;
    category: string;
    location: string; // Pasillo/Almacén
}

const MOCK_INVENTORY: InventoryItem[] = [
    { id: "inv_1", product_name: "Camiseta Básica", variant_name: "Blanca / M", sku: "TSH-WHT-M", current_stock: 45, min_stock_threshold: 10, price: 250, category: "Ropa", location: "Sector A-1" },
    { id: "inv_2", product_name: "Camiseta Básica", variant_name: "Negra / L", sku: "TSH-BLK-L", current_stock: 8, min_stock_threshold: 15, price: 250, category: "Ropa", location: "Sector A-1" },
    { id: "inv_3", product_name: "Zapatillas Urban", variant_name: "Gris / 42", sku: "SNE-GRY-42", current_stock: 0, min_stock_threshold: 5, price: 1200, category: "Calzado", location: "Sector B-4" },
    { id: "inv_4", product_name: "Gorra Snapback", variant_name: "Azul / Única", sku: "CAP-BLU-UNI", current_stock: 12, min_stock_threshold: 5, price: 350, category: "Accesorios", location: "Sector C-2" },
    { id: "inv_5", product_name: "Reloj Minimalist", variant_name: "Plata", sku: "WAT-SLV", current_stock: 3, min_stock_threshold: 10, price: 2500, category: "Accesorios", location: "Caja Fuerte" },
];

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'low' | 'out'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    // Cálculos de Inventario
    const totalValue = MOCK_INVENTORY.reduce((acc, item) => acc + (item.current_stock * item.price), 0);
    const lowStockItems = MOCK_INVENTORY.filter(item => item.current_stock > 0 && item.current_stock <= item.min_stock_threshold);
    const outOfStockItems = MOCK_INVENTORY.filter(item => item.current_stock === 0);

    const filteredInventory = MOCK_INVENTORY.filter(item => {
        const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'all') return matchesSearch;
        if (activeTab === 'low') return matchesSearch && item.current_stock > 0 && item.current_stock <= item.min_stock_threshold;
        if (activeTab === 'out') return matchesSearch && item.current_stock === 0;
        return matchesSearch;
    });

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Control de Inventario</h1>
                    <p className="text-gray-500 mt-1">Monitoreo automático de existencias y valor de almacén.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        Descargar Reporte
                    </button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm">
                        + Entrada de Stock
                    </button>
                </div>
            </div>

            {/* KPIs de Inventario */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Valor en Almacén</p>
                    <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Items Totales</p>
                    <h3 className="text-2xl font-bold text-gray-900">{MOCK_INVENTORY.length} <span className="text-sm font-normal text-gray-400">SKUs</span></h3>
                </div>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Stock Bajo</p>
                    <h3 className="text-2xl font-bold text-amber-700">{lowStockItems.length} <span className="text-sm font-normal">avisos</span></h3>
                </div>
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Agotados</p>
                    <h3 className="text-2xl font-bold text-rose-700">{outOfStockItems.length} <span className="text-sm font-normal">productos</span></h3>
                </div>
            </div>

            {/* Filtros Avanzados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                        >
                            Todo
                        </button>
                        <button 
                            onClick={() => setActiveTab('low')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'low' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            Stock Bajo
                        </button>
                        <button 
                            onClick={() => setActiveTab('out')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'out' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            Agotado
                        </button>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto / SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Nivel</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                <th className="relative px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInventory.map((item) => {
                                const stockPercent = Math.min((item.current_stock / (item.min_stock_threshold * 3)) * 100, 100);
                                const isLow = item.current_stock > 0 && item.current_stock <= item.min_stock_threshold;
                                const isOut = item.current_stock === 0;

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{item.product_name}</span>
                                                <span className="text-xs text-gray-500">{item.variant_name}</span>
                                                <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1 rounded mt-1 w-fit">{item.sku}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                                                {item.current_stock} uds.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-500 ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`}
                                                    style={{ width: isOut ? '100%' : `${stockPercent}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] mt-1 text-gray-400">
                                                Min. sugerido: {item.min_stock_threshold}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(item.current_stock * item.price)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-purple-600 hover:text-purple-900 mr-4">Ajustar</button>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ayuda/Sugerencia de Reabastecimiento */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm text-3xl">💡</div>
                    <div>
                        <h4 className="text-lg font-bold">Asistente de Reabastecimiento</h4>
                        <p className="text-purple-100 text-sm">Tienes {lowStockItems.length} productos con stock bajo. ¿Deseas generar una orden de compra automática para tus proveedores?</p>
                    </div>
                </div>
                <button className="bg-white text-purple-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-50 transition-all shadow-md">
                    Analizar Pedido
                </button>
            </div>
        </div>
    );
}
