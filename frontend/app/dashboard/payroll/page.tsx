"use client";

import { useState } from 'react';

interface Employee {
    id: string;
    name: string;
    role: string;
    base_salary: number;
    commissions: number; // Sumado automáticamente del módulo comisiones en un sistema real
    bonuses: number;
    deductions: number;
    status: 'pending' | 'paid';
}

const MOCK_EMPLOYEES: Employee[] = [
    { id: 'e1', name: 'Lorena Gómez', role: 'Líder de Sucursal', base_salary: 1800000, commissions: 1350000, bonuses: 200000, deductions: 50000, status: 'pending' },
    { id: 'e2', name: 'Andrés Felipe', role: 'Asesor Comercial', base_salary: 1300000, commissions: 360000, bonuses: 0, deductions: 0, status: 'pending' },
    { id: 'e3', name: 'Marta Lucía', role: 'Asesor Digital', base_salary: 1300000, commissions: 560000, bonuses: 150000, deductions: 20000, status: 'paid' },
];

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const calculateNet = (e: Employee) => (e.base_salary + e.commissions + e.bonuses) - e.deductions;

    const totalPayroll = employees.filter(e => e.status === 'pending').reduce((acc, e) => acc + calculateNet(e), 0);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Centro de Nómina 👥</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona los pagos, bonificaciones y deducciones de tu equipo humano.</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Nómina Pendiente</p>
                        <p className="text-2xl font-black text-purple-600">{formatCurrency(totalPayroll)}</p>
                    </div>
                    <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">+ Ejecutar Pago Masivo</button>
                </div>
            </div>

            {/* Listado de Personal */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Registro de Empleados</h2>
                    <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-4 py-2 rounded-full">+ Añadir Empleado</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Empleado</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sueldo Base</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Incentivos (Com/Bon)</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Neto</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {employees.map((e) => (
                                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-xs">{e.name.substr(0,2).toUpperCase()}</div>
                                            <div><p className="text-sm font-black text-gray-900">{e.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{e.role}</p></div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-700">{formatCurrency(e.base_salary)}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-emerald-600">+{formatCurrency(e.commissions + e.bonuses)}</span>
                                            <span className="text-[9px] text-gray-300">|</span>
                                            <span className="text-xs font-black text-rose-400">-{formatCurrency(e.deductions)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-black text-base text-gray-900">{formatCurrency(calculateNet(e))}</td>
                                    <td className="px-8 py-6 text-right">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            e.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {e.status === 'paid' ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Banner Informativo */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative z-10">👥</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight">Gestión Humana Automatizada</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
                        El centro de nómina integra los sueldos fijos con las comisiones variables generadas en el POS y la tienda online. Al finalizar el mes, puedes generar todos los desprendibles de pago con un solo clic.
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black italic">HR</div>
            </div>
        </div>
    );
}
