"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Discount {
    id: string;
    code: string;
    type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
    value: number; // 20 para 20% o 200 para $200
    status: 'active' | 'scheduled' | 'expired' | 'depleted';
    used_count: number;
    max_uses: number | null; // null = ilimitado
    min_purchase: number | null;
    start_date: string;
    end_date: string | null;
}

const MOCK_DISCOUNTS: Discount[] = [
    {
        id: "d1", code: "VERANO2024", type: 'percentage', value: 20, 
        status: 'active', used_count: 145, max_uses: 500, 
        min_purchase: 0, start_date: "2024-06-01", end_date: "2024-08-31"
    },
    {
        id: "d2", code: "BIENVENIDA", type: 'fixed_amount', value: 150, 
        status: 'active', used_count: 890, max_uses: null, 
        min_purchase: 1000, start_date: "2024-01-01", end_date: null
    },
    {
        id: "d3", code: "ENVIO_VIP", type: 'free_shipping', value: 0, 
        status: 'active', used_count: 23, max_uses: 100, 
        min_purchase: 2000, start_date: "2024-01-01", end_date: null
    },
    {
        id: "d4", code: "BUENFIN", type: 'percentage', value: 35, 
        status: 'scheduled', used_count: 0, max_uses: 1000, 
        min_purchase: 0, start_date: "2024-11-15", end_date: "2024-11-18"
    },
    {
        id: "d5", code: "FLASH50", type: 'fixed_amount', value: 500, 
        status: 'depleted', used_count: 50, max_uses: 50, 
        min_purchase: 1500, start_date: "2024-02-01", end_date: "2024-02-02"
    }
];

export default function DiscountsPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Aquí podrías poner un toast notification
        alert(`Código ${text} copiado!`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const filteredDiscounts = MOCK_DISCOUNTS.filter(d => {
        const matchesSearch = d.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' 
            ? true 
            : activeTab === 'expired' 
                ? (d.status === 'expired' || d.status === 'depleted') 
                : d.status === activeTab;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="max-w-7xl mx-auto">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Descuentos y Cupones</h1>
                    <p className="text-gray-500 mt-1">Gestiona códigos promocionales y reglas de precios.</p>
                </div>
                <Link 
                    href="/dashboard/discounts/new"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Crear Descuento
                </Link>
            </div>

            {/* KPIs Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Ahorro Total Otorgado</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(145800)}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Cupones Canjeados</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">1,058</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Códigos Activos</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">3</h3>
                </div>
            </div>

            {/* Controles y Filtros */}
            <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {['all', 'active', 'scheduled', 'expired'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab === 'all' ? 'Todos' : 
                             tab === 'active' ? 'Activos' : 
                             tab === 'scheduled' ? 'Programados' : 'Expirados'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Buscar código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </div>
            </div>

            {/* Tabla de Descuentos */}
            <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código / Título</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDiscounts.map((discount) => (
                            <tr key={discount.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded border border-dashed border-gray-400 select-all">
                                            {discount.code}
                                        </span>
                                        <button 
                                            onClick={() => copyToClipboard(discount.code)}
                                            className="text-gray-400 hover:text-purple-600"
                                            title="Copiar código"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {discount.min_purchase ? `Mínimo ${formatCurrency(discount.min_purchase)}` : 'Sin compra mínima'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        discount.status === 'active' ? 'bg-green-100 text-green-800' :
                                        discount.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                        discount.status === 'depleted' ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {discount.status === 'active' ? 'Activo' :
                                         discount.status === 'scheduled' ? 'Programado' :
                                         discount.status === 'depleted' ? 'Agotado' : 'Expirado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-medium">
                                        {discount.type === 'free_shipping' ? 'Envío Gratis' : 
                                         discount.type === 'percentage' ? `${discount.value}% OFF` :
                                         discount.type === 'fixed_amount' ? `-${formatCurrency(discount.value)}` : 
                                         '2x1'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="w-32">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600">{discount.used_count} usados</span>
                                            {discount.max_uses && <span className="text-gray-400">de {discount.max_uses}</span>}
                                        </div>
                                        {discount.max_uses ? (
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div 
                                                    className={`h-1.5 rounded-full ${discount.status === 'depleted' ? 'bg-red-500' : 'bg-purple-500'}`} 
                                                    style={{ width: `${Math.min((discount.used_count / discount.max_uses) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 rounded-full">∞ Ilimitado</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {discount.end_date ? new Date(discount.end_date).toLocaleDateString() : 'Siempre activo'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
