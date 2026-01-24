"use client";

import { useState } from 'react';

interface Campaign {
    id: string;
    name: string;
    type: 'email' | 'automation' | 'social';
    status: 'active' | 'scheduled' | 'draft' | 'completed';
    sent: number;
    open_rate: number; // Porcentaje
    click_rate: number; // Porcentaje
    revenue: number;
    date: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
    {
        id: "camp_1", name: "Lanzamiento Verano 2024", type: 'email', status: 'completed',
        sent: 1250, open_rate: 45.2, click_rate: 12.5, revenue: 15400.00, date: "2024-06-01"
    },
    {
        id: "camp_2", name: "Recuperación de Carrito", type: 'automation', status: 'active',
        sent: 340, open_rate: 62.0, click_rate: 28.4, revenue: 8900.50, date: "Siempre activo"
    },
    {
        id: "camp_3", name: "Flash Sale Fin de Mes", type: 'email', status: 'scheduled',
        sent: 0, open_rate: 0, click_rate: 0, revenue: 0, date: "2024-07-30"
    },
    {
        id: "camp_4", name: "Bienvenida Nuevos Usuarios", type: 'automation', status: 'active',
        sent: 850, open_rate: 78.5, click_rate: 35.0, revenue: 4200.00, date: "Siempre activo"
    }
];

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'email' | 'automations'>('overview');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Marketing & Campañas</h1>
                    <p className="text-gray-500 mt-1">Crea, automatiza y mide tus estrategias para vender más.</p>
                </div>
                <button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Crear Campaña
                </button>
            </div>

            {/* KPIs Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Ventas por Marketing</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(28500.50)}</h3>
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full mt-2 inline-block">+12% vs mes anterior</span>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Tasa de Conversión</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">3.8%</h3>
                        <span className="text-xs text-gray-400 font-medium mt-2 inline-block">Promedio de la industria: 2.5%</span>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 10.5H5.25m1.591-5.833l1.59 1.591M6 18h12a3 3 0 003-3V9a3 3 0 00-3-3H6a3 3 0 00-3 3v6a3 3 0 003 3z" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Emails Enviados</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">2,450</h3>
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full mt-2 inline-block">98% entregabilidad</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Sección Principal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200 px-6 pt-4 flex gap-6">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 text-sm font-medium transition-all ${activeTab === 'overview' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Resumen de Campañas
                    </button>
                    <button 
                        onClick={() => setActiveTab('automations')}
                        className={`pb-4 text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'automations' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                        Automatizaciones (Flows)
                    </button>
                    <button 
                        className={`pb-4 text-sm font-medium transition-all text-gray-400 cursor-not-allowed`}
                        title="Próximamente"
                    >
                        Anuncios (Ads)
                    </button>
                </div>

                {/* Contenido de la Tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enviados</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aperturas / Clics</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Editar</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {MOCK_CAMPAIGNS.filter(c => activeTab === 'overview' ? true : c.type === (activeTab === 'automations' ? 'automation' : 'email')).map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{campaign.name}</span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                {campaign.type === 'email' ? '📧 Email Marketing' : '⚡ Automatización'}
                                                <span className="text-gray-300">•</span>
                                                {campaign.date}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                            campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                            campaign.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {campaign.status === 'active' ? 'Activa' :
                                             campaign.status === 'scheduled' ? 'Programada' :
                                             campaign.status === 'completed' ? 'Completada' : 'Borrador'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {campaign.sent > 0 ? campaign.sent.toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-xs w-32">
                                                <span className="text-gray-500">Open:</span>
                                                <span className="font-medium text-gray-900">{campaign.open_rate}%</span>
                                            </div>
                                            <div className="w-32 bg-gray-100 rounded-full h-1.5">
                                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${campaign.open_rate}%` }}></div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between text-xs w-32 mt-1">
                                                <span className="text-gray-500">Click:</span>
                                                <span className="font-medium text-gray-900">{campaign.click_rate}%</span>
                                            </div>
                                            <div className="w-32 bg-gray-100 rounded-full h-1.5">
                                                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${campaign.click_rate}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatCurrency(campaign.revenue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <a href="#" className="text-indigo-600 hover:text-indigo-900">Reporte</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sugerencias de Automatización */}
            {activeTab === 'automations' && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm">
                            <span className="text-2xl">🎂</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Cumpleaños</h3>
                        <p className="text-sm text-gray-500 mt-1">Envía un regalo automático.</p>
                        <button className="mt-4 text-purple-600 text-sm font-medium hover:underline">Activar</button>
                    </div>
                    <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm">
                            <span className="text-2xl">👋</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Recuperación de Cliente</h3>
                        <p className="text-sm text-gray-500 mt-1">Para quienes llevan 90 días sin comprar.</p>
                        <button className="mt-4 text-purple-600 text-sm font-medium hover:underline">Activar</button>
                    </div>
                    <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm">
                            <span className="text-2xl">⭐</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Solicitud de Reseña</h3>
                        <p className="text-sm text-gray-500 mt-1">Pide opinión 7 días tras la entrega.</p>
                        <button className="mt-4 text-purple-600 text-sm font-medium hover:underline">Activar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
