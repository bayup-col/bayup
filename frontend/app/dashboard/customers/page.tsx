"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import {
  Search,
  Download,
  Plus,
  User,
  Mail,
  Phone,
  ShoppingBag,
  CreditCard,
  X,
  MessageCircle,
  FileText,
  History,
  CheckCircle2
} from 'lucide-react';

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
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#004d4d]/5 rounded-full border border-[#004d4d]/10 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00F2FF] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#004d4d]">CRM System</span>
            </div>
            <h1 className="text-5xl font-black italic text-black tracking-tighter uppercase">
                Cartera de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Clientes</span>
            </h1>
            <p className="text-[#004d4d]/60 mt-2 font-medium text-lg max-w-2xl">
                Gestiona tu audiencia y analiza su comportamiento de compra en tiempo real.
            </p>
        </div>
        <div className="flex gap-3">
            <button
                onClick={handleExport}
                className="px-6 py-4 bg-white border border-[#004d4d]/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d] hover:bg-[#004d4d]/5 transition-all shadow-sm flex items-center gap-2"
            >
                <Download size={14} />
                Exportar
            </button>
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-8 py-4 bg-[#001A1A] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2"
            >
                <Plus size={14} className="text-[#00F2FF]" />
                Nuevo Cliente
            </button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex p-1.5 bg-white border border-[#004d4d]/5 rounded-[2rem] shadow-sm w-full md:w-auto overflow-x-auto">
              {['all', 'new', 'vip', 'tienda'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 md:flex-none px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab
                        ? 'bg-[#004d4d] text-white shadow-lg'
                        : 'text-gray-400 hover:text-[#004d4d] hover:bg-[#004d4d]/5'
                    }`}
                  >
                      {tab === 'all' ? 'Todos' : tab === 'new' ? 'Nuevos' : tab === 'vip' ? 'VIP' : 'Tienda'}
                  </button>
              ))}
          </div>
          <div className="relative w-full md:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00F2FF] transition-colors" size={18} />
              <input
                type="text"
                placeholder="BUSCAR CLIENTE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#004d4d]/10 rounded-[2rem] outline-none text-xs font-black tracking-widest text-[#004d4d] placeholder-gray-300 focus:border-[#00F2FF]/50 focus:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all"
              />
          </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[3rem] border border-[#004d4d]/5 shadow-xl overflow-hidden min-h-[500px] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F2FF] to-transparent opacity-20" />

        {loading ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-[#004d4d]/40">
                <div className="relative mb-4">
                    <div className="w-12 h-12 rounded-full border-4 border-[#004d4d]/10 border-t-[#00F2FF] animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando Data...</p>
            </div>
        ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-gray-300">
                <User size={48} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">No se encontraron resultados</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[#004d4d]/5 bg-[#FAFAFA]/50">
                            <th className="px-10 py-8 text-[9px] font-black text-[#004d4d]/40 uppercase tracking-[0.2em]">Cliente</th>
                            <th className="px-10 py-8 text-[9px] font-black text-[#004d4d]/40 uppercase tracking-[0.2em]">Estado</th>
                            <th className="px-10 py-8 text-[9px] font-black text-[#004d4d]/40 uppercase tracking-[0.2em] text-center">Pedidos</th>
                            <th className="px-10 py-8 text-[9px] font-black text-[#004d4d]/40 uppercase tracking-[0.2em]">LTV (Inversión)</th>
                            <th className="px-10 py-8 text-[9px] font-black text-[#004d4d]/40 uppercase tracking-[0.2em] text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#004d4d]/5">
                        {filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-[#00F2FF]/5 transition-colors group">
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 bg-[#001A1A] text-[#00F2FF] rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-[#00F2FF]/10 group-hover:scale-105 transition-transform duration-300">
                                        {c.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#004d4d] tracking-tight">{c.full_name}</p>
                                        <p className="text-[10px] font-bold text-[#004d4d]/40 mt-0.5 tracking-wide">{c.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.status === 'active'
                                    ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100'
                                    : 'bg-rose-50/50 text-rose-600 border-rose-100'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${c.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    {c.status === 'active' ? 'Activo' : 'Bloqueado'}
                                </span>
                            </td>
                            <td className="px-10 py-6 text-center">
                                <span className="text-sm font-black text-[#004d4d]">{c.total_orders}</span>
                            </td>
                            <td className="px-10 py-6">
                                <span className="text-sm font-black text-[#004d4d] bg-[#00F2FF]/10 px-3 py-1 rounded-lg border border-[#00F2FF]/20">
                                    {formatCurrency(c.total_spent)}
                                </span>
                            </td>
                            <td className="px-10 py-6 text-right">
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                    <button
                                        onClick={() => setSelectedCustomer(c)}
                                        className="h-10 w-10 bg-white border border-[#004d4d]/10 text-[#004d4d] rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white hover:border-transparent transition-all shadow-sm"
                                        title="Ver Perfil"
                                    >
                                        <FileText size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleContact(c)}
                                        className="h-10 w-10 bg-white border border-[#004d4d]/10 text-[#004d4d] rounded-xl flex items-center justify-center hover:bg-[#00F2FF] hover:text-black hover:border-transparent transition-all shadow-sm"
                                        title="Contactar"
                                    >
                                        <MessageCircle size={16} />
                                    </button>
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#001A1A]/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-[#FAFAFA] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/10">
                <div className="p-10 border-b border-[#004d4d]/5 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-2xl font-black italic text-black uppercase tracking-tighter">Registrar <span className="text-[#00F2FF]">Cliente</span></h2>
                        <p className="text-[10px] font-black text-[#004d4d]/40 uppercase tracking-[0.2em] mt-1">Manual Entry</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-[#004d4d]/20 hover:text-black transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleAddCustomer} className="p-10 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[#004d4d]/50 uppercase tracking-[0.2em] ml-4">Nombre Completo</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#004d4d] transition-colors" />
                                <input name="name" required className="w-full pl-12 pr-6 py-4 bg-white border border-[#004d4d]/10 rounded-[2rem] text-sm font-bold outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF] transition-all shadow-sm" placeholder="Ej. Ana García" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[#004d4d]/50 uppercase tracking-[0.2em] ml-4">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#004d4d] transition-colors" />
                                <input name="email" type="email" required className="w-full pl-12 pr-6 py-4 bg-white border border-[#004d4d]/10 rounded-[2rem] text-sm font-bold outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF] transition-all shadow-sm" placeholder="cliente@email.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[#004d4d]/50 uppercase tracking-[0.2em] ml-4">Teléfono</label>
                            <div className="relative group">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#004d4d] transition-colors" />
                                <input name="phone" className="w-full pl-12 pr-6 py-4 bg-white border border-[#004d4d]/10 rounded-[2rem] text-sm font-bold outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF] transition-all shadow-sm" placeholder="+57 ..." />
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-[#001A1A] text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                        Crear Cliente <Plus size={16} className="text-[#00F2FF]" />
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Modal: Detalle / Historial */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#001A1A]/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-[#FAFAFA] w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">

                {/* Header con gradiente */}
                <div className="p-12 relative overflow-hidden bg-[#001A1A] text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F2FF] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <button onClick={() => setSelectedCustomer(null)} className="absolute top-10 right-10 text-white/30 hover:text-white transition-colors z-10">
                        <X size={28} />
                    </button>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                        <div className="h-28 w-28 bg-gradient-to-br from-[#00F2FF] to-[#004d4d] rounded-[2rem] flex items-center justify-center text-4xl font-black text-[#001A1A] shadow-2xl shadow-[#00F2FF]/20">
                            {selectedCustomer.full_name.charAt(0)}
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 mb-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedCustomer.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">
                                    {selectedCustomer.status === 'active' ? 'Cuenta Activa' : 'Cuenta Bloqueada'}
                                </span>
                            </div>
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase">{selectedCustomer.full_name}</h2>
                            <p className="text-[#00F2FF] text-[10px] font-black uppercase tracking-[0.3em]">{selectedCustomer.email}</p>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest pt-2">
                                Miembro desde {new Date(selectedCustomer.join_date).getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-12 space-y-10">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-[#004d4d]/5 shadow-sm hover:shadow-md transition-all text-center group">
                            <ShoppingBag className="mx-auto mb-4 text-[#004d4d]/20 group-hover:text-[#00F2FF] transition-colors" size={24} />
                            <p className="text-[9px] font-black text-[#004d4d]/40 uppercase tracking-[0.2em] mb-1">Total Pedidos</p>
                            <p className="text-3xl font-black text-[#001A1A]">{selectedCustomer.total_orders}</p>
                        </div>
                        <div className="bg-[#001A1A] p-8 rounded-[2rem] shadow-xl text-center group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#00F2FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CreditCard className="mx-auto mb-4 text-white/20 group-hover:text-[#00F2FF] transition-colors relative z-10" size={24} />
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1 relative z-10">LTV (Inversión)</p>
                            <p className="text-3xl font-black text-[#00F2FF] relative z-10">{formatCurrency(selectedCustomer.total_spent)}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-[#004d4d]/5 shadow-sm hover:shadow-md transition-all text-center group">
                            <User className="mx-auto mb-4 text-[#004d4d]/20 group-hover:text-[#00F2FF] transition-colors" size={24} />
                            <p className="text-[9px] font-black text-[#004d4d]/40 uppercase tracking-[0.2em] mb-1">Ticket Promedio</p>
                            <p className="text-xl font-black text-[#001A1A]">{formatCurrency(selectedCustomer.total_spent / (selectedCustomer.total_orders || 1))}</p>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <History size={16} className="text-[#00F2FF]" />
                            <h3 className="text-xs font-black text-[#001A1A] uppercase tracking-[0.2em]">Actividad Reciente</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-6 bg-white border border-[#004d4d]/5 rounded-[2rem] hover:bg-[#00F2FF]/5 transition-colors cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-[#00F2FF]/10 flex items-center justify-center text-[#004d4d]">
                                        <ShoppingBag size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-[#001A1A] uppercase tracking-wide">Pedido #8241</p>
                                        <p className="text-[10px] font-bold text-[#004d4d]/40 uppercase tracking-wider">Hace 2 días</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                    <CheckCircle2 size={10} /> Completado
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-6 bg-white border border-[#004d4d]/5 rounded-[2rem] hover:bg-[#00F2FF]/5 transition-colors cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-[#00F2FF]/10 flex items-center justify-center text-[#004d4d]">
                                        <ShoppingBag size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-[#001A1A] uppercase tracking-wide">Pedido #7912</p>
                                        <p className="text-[10px] font-bold text-[#004d4d]/40 uppercase tracking-wider">Hace 1 semana</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                    <CheckCircle2 size={10} /> Completado
                                </span>
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