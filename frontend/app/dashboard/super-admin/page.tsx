"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/auth-context';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    plan_id: string | null;
}

export default function SuperAdminPage() {
    const { token, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Datos financieros estáticos (Mock)
    const financialData = {
        balance: 125050.00,
        expenses: 42300.00
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    useEffect(() => {
        if (!isAuthenticated || !token) {
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:8000/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch users or unauthorized access');
                }

                const data = await response.json();
                setUsers(data);
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching users.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isAuthenticated, token]);

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Control</h1>
                <p className="text-gray-500">Visión general del rendimiento de la plataforma.</p>
            </div>

            {/* --- SECCIÓN 1: INDICADORES SUPERIORES --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Card Balance Total */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Balance Total</p>
                        <h2 className="text-3xl font-bold text-emerald-600">{formatCurrency(financialData.balance)}</h2>
                        <p className="text-xs text-emerald-600 mt-2 flex items-center font-medium">
                            +12.5% <span className="text-gray-400 ml-1 font-normal">vs mes anterior</span>
                        </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                </div>

                {/* Card Egresos */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Egresos & Deudas</p>
                        <h2 className="text-3xl font-bold text-rose-600">{formatCurrency(financialData.expenses)}</h2>
                        <p className="text-xs text-rose-600 mt-2 flex items-center font-medium">
                            +2.1% <span className="text-gray-400 ml-1 font-normal">vs mes anterior</span>
                        </p>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-rose-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: GESTIÓN DE USUARIOS --- */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Gestión de Usuarios</h2>
                    <span className="text-xs text-gray-500 bg-white border px-2 py-1 rounded">Total: {users.length}</span>
                </div>
                
                <div className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : error ? (
                        <p className="text-red-500 text-center py-4">{error}</p>
                    ) : users.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No se encontraron usuarios.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                        {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">{user.full_name || 'Sin nombre'}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.plan_id || 'Free'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="text-green-600 flex items-center gap-1 text-xs">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                                    Activo
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}