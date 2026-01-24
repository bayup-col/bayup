"use client";

import { useState } from 'react';

export default function BillingSettings() {
    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Facturación y Retiros</h1>
                <p className="text-gray-500 mt-1">Configura dónde quieres recibir el dinero de tus ventas automáticas.</p>
            </div>

            {/* Cuenta de Retiro */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Cuenta de Depósito</h2>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Vinculada</span>
                </div>
                <p className="text-sm text-gray-500 italic">Cada vez que un cliente compra, el dinero se depositará automáticamente en esta cuenta.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banco / Plataforma</label>
                        <select className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none">
                            <option>Stripe Connect</option>
                            <option>Mercado Pago</option>
                            <option>Transferencia Bancaria Directa</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número de Cuenta / ID</label>
                        <input type="text" defaultValue="STR-9284-XXXX" className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                </div>
            </div>

            {/* Historial de Facturas */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50"><h2 className="text-lg font-bold text-gray-800">Historial de Cargos</h2></div>
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-8 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                            <th className="px-8 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Concepto</th>
                            <th className="px-8 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
                            <th className="px-8 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Recibo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {[
                            { date: '01 Ene 2024', desc: 'Suscripción Plan Pro', amount: '$49.00' },
                            { date: '15 Dic 2023', desc: 'Compra de Dominio .com', amount: '$12.00' }
                        ].map((invoice, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-4 text-sm font-medium text-gray-600">{invoice.date}</td>
                                <td className="px-8 py-4 text-sm font-bold text-gray-900">{invoice.desc}</td>
                                <td className="px-8 py-4 text-sm font-bold text-gray-900">{invoice.amount}</td>
                                <td className="px-8 py-4 text-right"><button className="text-purple-600 font-bold text-xs hover:underline">PDF</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
