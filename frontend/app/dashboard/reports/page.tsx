"use client";

import { useState } from 'react';

// --- MOCK DATA ---
const KPI_DATA = {
    revenue: { value: 145850.00, trend: +12.5, label: "Ingresos Totales" },
    orders: { value: 1240, trend: +5.2, label: "Pedidos Totales" },
    aov: { value: 117.62, trend: -2.1, label: "Ticket Promedio" },
    conversion: { value: 3.2, trend: +0.4, label: "Tasa de Conversión" }
};

const TOP_PRODUCTS = [
    { name: "Camiseta Básica Oversize", sales: 450, revenue: 112500, trend: "up" },
    { name: "Zapatillas Urban", sales: 120, revenue: 98000, trend: "up" },
    { name: "Gorra Snapback", sales: 85, revenue: 12500, trend: "down" },
    { name: "Calcetines Pack x3", sales: 340, revenue: 5600, trend: "stable" },
];

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'customers' | 'finance'>('overview');
    const [dateRange, setDateRange] = useState('30d');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    // --- COMPONENTES VISUALES ---
    
    // Gráfica de Línea SVG (Simulada)
    const LineChartMock = () => (
        <div className="relative h-64 w-full bg-gradient-to-b from-white to-gray-50 rounded-xl overflow-hidden">
            {/* Grid Lines */}
            <div className="absolute inset-0 grid grid-rows-4 w-full h-full">
                <div className="border-b border-dashed border-gray-200 w-full"></div>
                <div className="border-b border-dashed border-gray-200 w-full"></div>
                <div className="border-b border-dashed border-gray-200 w-full"></div>
            </div>
            {/* Line Path */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path 
                    d="M0,200 Q150,100 300,150 T600,100 T900,180 T1200,50 L1200,300 L0,300 Z" 
                    fill="url(#gradient)" 
                />
                <path 
                    d="M0,200 Q150,100 300,150 T600,100 T900,180 T1200,50" 
                    fill="none" 
                    stroke="#8b5cf6" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="drop-shadow-md"
                />
            </svg>
            {/* Labels */}
            <div className="absolute bottom-2 left-4 text-xs text-gray-400">01 Ene</div>
            <div className="absolute bottom-2 right-4 text-xs text-gray-400">30 Ene</div>
        </div>
    );

    // Barras Simples (CSS)
    const BarChartMock = () => (
        <div className="h-48 flex items-end justify-between gap-2 px-2">
            {[40, 70, 45, 90, 60, 75, 50, 80, 95, 60, 45, 70].map((h, i) => (
                <div key={i} className="w-full bg-indigo-50 rounded-t-md relative group hover:bg-indigo-100 transition-colors">
                    <div 
                        className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md transition-all duration-500 group-hover:bg-indigo-600"
                        style={{ height: `${h}%` }}
                    ></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Informes y Estadísticas</h1>
                    <p className="text-gray-500 mt-1">Análisis detallado del rendimiento de tu negocio.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer py-1 px-2"
                    >
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="90d">Últimos 3 meses</option>
                        <option value="year">Este año</option>
                    </select>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <button className="text-gray-500 hover:text-purple-600 px-2 transition-colors" title="Descargar Reporte">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Tabs de Navegación */}
            <div className="mb-8 overflow-x-auto">
                <nav className="flex space-x-8 border-b border-gray-200 min-w-max">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'overview' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Resumen Ejecutivo
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'sales' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Análisis de Ventas
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'customers' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Clientes y Retención
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'finance' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Finanzas
                    </button>
                </nav>
            </div>

            {/* Contenido Principal */}
            <div className="space-y-6">
                
                {/* 1. KPIs Cards (Siempre visibles o parte del Overview) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(KPI_DATA).map(([key, data]) => (
                        <div key={key} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                            <p className="text-sm font-medium text-gray-500 mb-1">{data.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {key === 'conversion' ? `${data.value}%` : 
                                     key === 'orders' ? data.value : formatCurrency(data.value)}
                                </h3>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center ${
                                    data.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {data.trend >= 0 ? '↑' : '↓'} {Math.abs(data.trend)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. Gráfica Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfica Grande */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Tendencia de Ingresos</h3>
                            <span className="text-sm text-gray-500">Últimos 30 días</span>
                        </div>
                        <LineChartMock />
                    </div>

                    {/* Resumen Lateral */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Ventas por Categoría</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Ropa</span>
                                        <span className="font-medium">65%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Calzado</span>
                                        <span className="font-medium">25%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Accesorios</span>
                                        <span className="font-medium">10%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '10%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Beneficio Neto</p>
                                    <p className="text-xs text-gray-500">Después de impuestos</p>
                                </div>
                                <div className="ml-auto font-bold text-gray-800">{formatCurrency(45200)}</div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 3. Tablas Detalladas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">Productos Más Vendidos</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos Generados</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tendencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {TOP_PRODUCTS.map((product, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{formatCurrency(product.revenue)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {product.trend === 'up' && <span className="text-green-600 flex items-center gap-1">↑ En alza</span>}
                                            {product.trend === 'down' && <span className="text-red-500 flex items-center gap-1">↓ Bajando</span>}
                                            {product.trend === 'stable' && <span className="text-gray-400 flex items-center gap-1">→ Estable</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
