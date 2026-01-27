"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: 'active' | 'blocked';
  total_orders: number;
  total_spent: number;
  join_date: string;
  last_active: string;
}

const MOCK_CUSTOMERS: Customer[] = [
    {
        id: "c1", full_name: "Ana García", email: "ana.garcia@gmail.com", phone: "+57 300 123 4567",
        status: 'active', total_orders: 15, total_spent: 1540000, 
        join_date: "2023-01-15T10:00:00Z", last_active: new Date().toISOString()
    },
    {
        id: "c2", full_name: "Carlos López", email: "carlos.lopez@hotmail.com", phone: "+57 310 987 6543",
        status: 'active', total_orders: 1, total_spent: 45000, 
        join_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        last_active: new Date().toISOString()
    },
    {
        id: "c5", full_name: "Roberto VIP", email: "robert@empresa.com", phone: "+57 320 777 9999",
        status: 'active', total_orders: 42, total_spent: 8500000, 
        join_date: "2022-05-10T10:00:00Z", last_active: new Date().toISOString()
    }
];

export default function CustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'vip' | 'tienda'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchRealCustomers = useCallback(async () => {
    if (!token) return;
    try {
        setLoading(true);
        const res = await fetch('http://localhost:8000/orders', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const orders = await res.json();
            
            // Extraer clientes únicos de las órdenes
            const customerMap: Record<string, Customer> = {};
            
            orders.forEach((o: any) => {
                const email = o.customer_email || `sin-email-${o.id}`;
                if (!customerMap[email]) {
                    customerMap[email] = {
                        id: o.id,
                        full_name: o.customer_name || o.customer_email?.split('@')[0] || 'Cliente POS',
                        email: o.customer_email || 'No registrado',
                        phone: null,
                        status: 'active',
                        total_orders: 0,
                        total_spent: 0,
                        join_date: o.created_at,
                        last_active: o.created_at,
                        is_pos: !!o.customer_name // Marcamos como cliente de tienda si tiene nombre manual
                    } as any;
                }
                customerMap[email].total_orders += 1;
                customerMap[email].total_spent += o.total_price || 0;
                if (new Date(o.created_at) > new Date(customerMap[email].last_active)) {
                    customerMap[email].last_active = o.created_at;
                }
            });

            setCustomers(Object.values(customerMap));
        }
    } catch (e) {
        console.error("Error al cargar clientes");
    } finally {
        setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchRealCustomers(); }, [fetchRealCustomers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("Función de registro manual en desarrollo. Usa el módulo de Facturación para registrar clientes reales.");
    setIsAddModalOpen(false);
  };

  const handleExport = () => {
    alert("Preparando descarga de CSV con la base de datos de clientes sincronizada...");
  };

  const handleContact = (customer: Customer) => {
    const message = `Hola ${customer.full_name}, te contactamos de Bayup Store...`;
    if (customer.phone) {
        window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
        alert(`Iniciando contacto vía email con ${customer.email}\n\nMensaje: ${message}`);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
        const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'new') return matchesSearch && c.total_orders <= 1;
        if (activeTab === 'vip') return matchesSearch && c.total_spent > 1000000;
        if (activeTab === 'tienda') return matchesSearch && (c as any).is_pos;
        return matchesSearch;
    });
  }, [customers, searchTerm, activeTab]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Cartera de Clientes</h1>
          <p className="text-gray-500 mt-2 font-medium">Gestiona tu audiencia y analiza su comportamiento de compra.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleExport} className="px-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                Exportar CSV
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                + Nuevo Cliente
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex p-1 bg-gray-100 rounded-2xl w-full md:w-auto overflow-x-auto">
              {['all', 'new', 'vip', 'tienda'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      {tab === 'all' ? 'Todos' : tab === 'new' ? 'Nuevos' : tab === 'vip' ? 'VIP' : 'Tienda'}
                  </button>
              ))}
          </div>
          <div className="relative w-full md:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] outline-none text-xs font-bold focus:ring-2 focus:ring-purple-200 transition-all"
              />
          </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando audiencia...</p>
            </div>
        ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-gray-300">
                <p className="text-sm font-bold uppercase tracking-widest">No se encontraron clientes</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Pedidos</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión Total</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm">
                                    {c.full_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{c.full_name}</p>
                                    <p className="text-[10px] font-bold text-gray-400">{c.email}</p>
                                </div>
                            </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {c.status === 'active' ? 'Activo' : 'Bloqueado'}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-center text-sm font-black text-gray-900">{c.total_orders}</td>
                            <td className="px-8 py-6 text-sm font-black text-purple-600">{formatCurrency(c.total_spent)}</td>
                            <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setSelectedCustomer(c)} className="h-9 w-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center hover:bg-purple-100 transition-colors" title="Ver Historial">📋</button>
                                    <button onClick={() => handleContact(c)} className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors" title="Contactar">💬</button>
                                </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Modal: Nuevo Cliente */} 
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-900">Registrar Cliente</h2>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400">✕</button>
                </div>
                <form onSubmit={handleAddCustomer} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input name="name" required className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                            <input name="email" type="email" required className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <input name="phone" className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-200" placeholder="+57 ..." />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Crear Cliente</button>
                </form>
            </div>
        </div>
      )}

      {/* Modal: Detalle / Historial */} 
      {selectedCustomer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 bg-gray-900 text-white relative">
                    <button onClick={() => setSelectedCustomer(null)} className="absolute top-8 right-8 text-white/50 hover:text-white">✕</button>
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 bg-purple-600 rounded-[1.5rem] flex items-center justify-center text-3xl font-black">{selectedCustomer.full_name.charAt(0)}</div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{selectedCustomer.full_name}</h2>
                            <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mt-1">Cliente desde {new Date(selectedCustomer.join_date).getFullYear()}</p>
                        </div>
                    </div>
                </div>
                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-6 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase">Compras</p>
                            <p className="text-2xl font-black text-gray-900">{selectedCustomer.total_orders}</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase">Invertido</p>
                            <p className="text-lg font-black text-purple-600">{formatCurrency(selectedCustomer.total_spent)}</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase">Ticket Prom.</p>
                            <p className="text-lg font-black text-gray-900">{formatCurrency(selectedCustomer.total_spent / (selectedCustomer.total_orders || 1))}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Últimas Actividades</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <span className="text-xs font-bold text-gray-600">Pedido #8241</span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Completado</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <span className="text-xs font-bold text-gray-600">Pedido #7912</span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Completado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}