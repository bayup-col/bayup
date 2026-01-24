"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/auth-context';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: 'active' | 'blocked';
  total_orders: number;
  total_spent: number;
  join_date: string; // ISO String
  last_active: string; // ISO String
}

// Datos Mock Inteligentes
const MOCK_CUSTOMERS: Customer[] = [
    {
        id: "c1", full_name: "Ana García", email: "ana.garcia@gmail.com", phone: "+52 555 123 4567",
        status: 'active', total_orders: 15, total_spent: 15400.50, 
        join_date: "2023-01-15T10:00:00Z", last_active: new Date().toISOString() // Activa hoy
    },
    {
        id: "c2", full_name: "Carlos López", email: "carlos.lopez@hotmail.com", phone: null,
        status: 'active', total_orders: 1, total_spent: 450.00, 
        join_date: new Date(Date.now() - 86400000 * 5).toISOString(), // Se unió hace 5 días (Nuevo)
        last_active: new Date().toISOString()
    },
    {
        id: "c3", full_name: "María Rodriguez", email: "mrodriguez@outlook.com", phone: "+52 333 987 6543",
        status: 'active', total_orders: 0, total_spent: 0, 
        join_date: "2023-08-20T10:00:00Z", 
        last_active: new Date(Date.now() - 86400000 * 100).toISOString() // Inactiva hace 100 días
    },
    {
        id: "c4", full_name: "Usuario Bloqueado", email: "spam@bot.com", phone: null,
        status: 'blocked', total_orders: 0, total_spent: 0, 
        join_date: "2024-01-01T10:00:00Z", last_active: "2024-01-02T10:00:00Z"
    },
    {
        id: "c5", full_name: "Roberto VIP", email: "robert@empresa.com", phone: "+52 818 777 9999",
        status: 'active', total_orders: 42, total_spent: 85000.00, 
        join_date: "2022-05-10T10:00:00Z", last_active: new Date().toISOString()
    }
];

export default function CustomersPage() {
  const { token, isAuthenticated } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'vip' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulación de fetch
    const fetchCustomers = async () => {
        setLoading(true);
        // Aquí iría el fetch real al backend
        setTimeout(() => {
            setCustomers(MOCK_CUSTOMERS);
            setLoading(false);
        }, 600);
    };

    if (isAuthenticated) fetchCustomers();
  }, [isAuthenticated]);

  // Lógica de Filtrado Avanzada
  const filteredCustomers = customers.filter(customer => {
    // 1. Filtro por Texto (Buscador)
    const matchesSearch = 
        customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Filtro por Pestañas (Lógica de Negocio)
    const now = new Date();
    const joinDate = new Date(customer.join_date);
    const lastActive = new Date(customer.last_active);
    const daysSinceJoin = (now.getTime() - joinDate.getTime()) / (1000 * 3600 * 24);
    const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24);

    if (activeTab === 'all') return true;
    
    if (activeTab === 'new') {
        // Clientes unidos en los últimos 30 días
        return daysSinceJoin <= 30;
    }
    
    if (activeTab === 'vip') {
        // Clientes con más de 5 pedidos o más de $10,000 gastados
        return customer.total_orders > 5 || customer.total_spent > 10000;
    }

    if (activeTab === 'inactive') {
        // Clientes inactivos por más de 90 días
        return daysSinceActive > 90;
    }

    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cartera de Clientes</h1>
            <p className="text-gray-500 mt-1">Administra tus usuarios, revisa su historial y fidelización.</p>
        </div>
        <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Exportar CSV
        </button>
      </div>

      {/* Tabs y Buscador */}
      <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
            <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Todos
            </button>
            <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'new' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Nuevos
                <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">30d</span>
            </button>
            <button
                onClick={() => setActiveTab('vip')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'vip' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                VIP / Recurrentes
                <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full">★</span>
            </button>
            <button
                onClick={() => setActiveTab('inactive')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    activeTab === 'inactive' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Inactivos
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedidos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gasto Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No se encontraron clientes en esta sección.
                        </td>
                    </tr>
                ) : (
                    filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                        {customer.full_name.charAt(0)}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{customer.full_name}</div>
                                        <div className="text-xs text-gray-500">{customer.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {customer.status === 'active' ? 'Activo' : 'Bloqueado'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {customer.total_orders} órdenes
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(customer.total_spent)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(customer.join_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                                    Ver perfil
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
