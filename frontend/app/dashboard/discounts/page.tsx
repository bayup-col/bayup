"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Discount {
    id: string;
    code: string;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    value: number;
    status: 'active' | 'scheduled' | 'expired';
    used_count: number;
    max_uses: number | null;
    min_purchase: number;
}

const INITIAL_DISCOUNTS: Discount[] = [
    { id: "d1", code: "VERANO20", type: 'percentage', value: 20, status: 'active', used_count: 145, max_uses: 500, min_purchase: 0 },
    { id: "d2", code: "BIENVENIDA", type: 'fixed_amount', value: 15000, status: 'active', used_count: 89, max_uses: null, min_purchase: 50000 },
    { id: "d3", code: "FREE_SHIP", type: 'free_shipping', value: 0, status: 'active', used_count: 23, max_uses: 100, min_purchase: 100000 },
];

export default function DiscountsPage() {
    const [discounts, setDiscounts] = useState<Discount[]>(INITIAL_DISCOUNTS);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar este cupón permanentemente?")) {
            setDiscounts(discounts.filter(d => d.id !== id));
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert("¡Código copiado al portapapeles! 📋");
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
    };

    const filtered = discounts.filter(d => d.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Descuentos</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona tus campañas de marketing y fidelización.</p>
                </div>
                <Link href="/dashboard/discounts/new" className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-center">
                    + Crear Cupón
                </Link>
            </div>

            <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center px-8">
                <span className="text-xl mr-4">🔍</span>
                <input 
                    type="text" 
                    placeholder="Buscar código promocional..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 py-4 bg-transparent outline-none text-sm font-medium"
                />
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código / Requisito</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Uso</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg font-mono font-bold text-sm border border-purple-100">{d.code}</span>
                                        <button onClick={() => copyCode(d.code)} className="text-gray-300 hover:text-purple-600">📋</button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">Compra mín: {formatCurrency(d.min_purchase)}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="max-w-[120px] mx-auto">
                                        <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 mb-1">
                                            <span>{d.used_count} usos</span>
                                            {d.max_uses && <span>de {d.max_uses}</span>}
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-purple-600 rounded-full" 
                                                style={{ width: `${d.max_uses ? (d.used_count / d.max_uses) * 100 : 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-sm font-black text-gray-900">
                                        {d.type === 'percentage' ? `${d.value}% OFF` : d.type === 'free_shipping' ? 'Gratis' : formatCurrency(d.value)}
                                    </p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{d.type === 'free_shipping' ? 'Envío' : 'De descuento'}</p>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button onClick={() => handleDelete(d.id)} className="h-9 w-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors opacity-0 group-hover:opacity-100">✕</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}