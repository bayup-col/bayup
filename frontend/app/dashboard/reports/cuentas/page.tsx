"use client";

import { useState, useMemo } from 'react';
import { useAuth } from "@/context/auth-context";

interface ProviderInvoice {
    id: string;
    provider_name: string;
    description: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid';
}

interface CustomerCredit {
    id: string;
    customer_name: string;
    customer_phone: string;
    items_summary: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'collected';
}

const MOCK_PROVIDER_INVOICES: ProviderInvoice[] = [
    { id: 'pi_1', provider_name: 'Textiles Premium S.A.', description: 'Lote Algodón Pima 200kg', amount: 4500000, due_date: '2024-02-10', status: 'pending' },
    { id: 'pi_2', provider_name: 'Accesorios Global', description: 'Cierre y cremalleras', amount: 850000, due_date: '2024-01-20', status: 'pending' },
];

const MOCK_CUSTOMER_CREDITS: CustomerCredit[] = [
    { id: 'cc_1', customer_name: 'Marta Lucía R.', customer_phone: '+57 300 111 2233', items_summary: '2 Vestidos Gala, 1 Tacones', amount: 450000, due_date: '2024-02-01', status: 'pending' },
];

export default function CuentasPage() {
    const { token } = useAuth();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'providers' | 'customers'>('providers');
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    
    // Data State
    const [providerInvoices, setProviderInvoices] = useState<ProviderInvoice[]>(MOCK_PROVIDER_INVOICES);
    const [customerCredits, setCustomerCredits] = useState<CustomerCredit[]>(MOCK_CUSTOMER_CREDITS);

    // Form States
    const [newInvoice, setNewInvoice] = useState({ provider: '', desc: '', amount: '', date: '' });
    const [newCredit, setNewCredit] = useState({ customer: '', phone: '', summary: '', amount: '', date: '' });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const handleAddInvoice = () => {
        if (!newInvoice.provider || !newInvoice.amount) return alert("Completa los datos de la factura.");
        const created: ProviderInvoice = {
            id: `pi_${Math.random()}`,
            provider_name: newInvoice.provider,
            description: newInvoice.desc,
            amount: parseFloat(newInvoice.amount),
            due_date: newInvoice.date,
            status: 'pending'
        };
        setProviderInvoices([created, ...providerInvoices]);
        setIsInvoiceModalOpen(false);
        setNewInvoice({ provider: '', desc: '', amount: '', date: '' });
    };

    const handleAddCredit = () => {
        if (!newCredit.customer || !newCredit.amount) return alert("Completa los datos del crédito.");
        const created: CustomerCredit = {
            id: `cc_${Math.random()}`,
            customer_name: newCredit.customer,
            customer_phone: newCredit.phone,
            items_summary: newCredit.summary,
            amount: parseFloat(newCredit.amount),
            due_date: newCredit.date,
            status: 'pending'
        };
        setCustomerCredits([created, ...customerCredits]);
        setIsCreditModalOpen(false);
        setNewCredit({ customer: '', phone: '', summary: '', amount: '', date: '' });
    };

    const markInvoiceAsPaid = (id: string) => {
        setProviderInvoices(providerInvoices.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
    };

    const markCreditAsCollected = (id: string) => {
        setCustomerCredits(customerCredits.map(c => c.id === id ? { ...c, status: 'collected' } : c));
    };

    const totalProviderDebt = providerInvoices.filter(i => i.status === 'pending').reduce((a, b) => a + b.amount, 0);
    const totalCustomerDebt = customerCredits.filter(i => i.status === 'pending').reduce((a, b) => a + b.amount, 0);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* 1. Header & Global KPIs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Cuentas y Cartera</h1>
                    <p className="text-gray-500 mt-2 font-medium">Controla tus deudas con proveedores y el dinero por cobrar de tus clientes.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📉</div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Debo a Proveedores</p>
                            <p className="text-lg font-black text-gray-900 mt-1">{formatCurrency(totalProviderDebt)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📈</div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Me deben Clientes</p>
                            <p className="text-lg font-black text-gray-900 mt-1">{formatCurrency(totalCustomerDebt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Tabs de Navegación */}
            <div className="flex space-x-1 bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-100/50 shadow-sm">
                <button onClick={() => setActiveTab('providers')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'providers' ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>🏢 Cuentas por Pagar (Proveedores)</button>
                <button onClick={() => setActiveTab('customers')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'customers' ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>👥 Cartera por Cobrar (Clientes)</button>
            </div>

            {/* 3. Contenido Principal */}
            <div className="space-y-8">
                {activeTab === 'providers' ? (
                    <>
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Facturas de Proveedores</h2>
                            <button onClick={() => setIsInvoiceModalOpen(true)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">+ Registrar Factura</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {providerInvoices.map((inv) => (
                                <div key={inv.id} className={`bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm relative overflow-hidden group transition-all ${inv.status === 'paid' ? 'opacity-60 grayscale' : 'hover:shadow-xl'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${inv.status === 'paid' ? 'bg-gray-100 text-gray-500' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                            {inv.status === 'paid' ? 'Pagada' : 'Pendiente'}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vence: {inv.due_date}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 leading-tight">{inv.provider_name}</h3>
                                    <p className="text-xs text-gray-400 mt-1 font-medium italic">"{inv.description}"</p>
                                    <p className="text-2xl font-black text-gray-900 mt-6">{formatCurrency(inv.amount)}</p>
                                    {inv.status === 'pending' && (
                                        <button onClick={() => markInvoiceAsPaid(inv.id)} className="w-full mt-8 py-4 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Marcar como Pagada ✅</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cartera de Clientes</h2>
                            <button onClick={() => setIsCreditModalOpen(true)} className="bg-purple-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-100">+ Nuevo Crédito (Fiado)</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {customerCredits.map((credit) => (
                                <div key={credit.id} className={`bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm relative overflow-hidden group transition-all ${credit.status === 'collected' ? 'opacity-60 grayscale' : 'hover:shadow-xl'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${credit.status === 'collected' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse'}`}>
                                            {credit.status === 'collected' ? 'Cobrado' : 'Por Cobrar'}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cobro: {credit.due_date}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 leading-none">{credit.customer_name}</h3>
                                    <p className="text-xs font-bold text-purple-600 mt-2">{credit.customer_phone}</p>
                                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-[10px] font-medium text-gray-500 leading-relaxed border border-gray-100">
                                        Se llevó: {credit.items_summary}
                                    </div>
                                    <p className="text-2xl font-black text-gray-900 mt-6">{formatCurrency(credit.amount)}</p>
                                    {credit.status === 'pending' && (
                                        <button onClick={() => markCreditAsCollected(credit.id)} className="w-full mt-8 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all">Marcar como Recibido 💰</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* MODAL: REGISTRAR FACTURA PROVEEDOR */}
            {isInvoiceModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Nueva Cuenta por Pagar</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Registra deudas con tus proveedores</p></div>
                            <button onClick={() => setIsInvoiceModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl">✕</button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Proveedor</label><input type="text" placeholder="Nombre de la empresa" value={newInvoice.provider} onChange={(e) => setNewInvoice({...newInvoice, provider: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Monto de la Factura</label><input type="number" placeholder="0.00" value={newInvoice.amount} onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-black transition-all" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha de Vencimiento</label><input type="date" value={newInvoice.date} onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Breve Descripción</label><input type="text" placeholder="Ej: Pedido de telas del mes" value={newInvoice.desc} onChange={(e) => setNewInvoice({...newInvoice, desc: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-medium transition-all" /></div>
                        </div>
                        <div className="p-10 pt-0"><button onClick={handleAddInvoice} className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all">Registrar Gasto Pendiente</button></div>
                    </div>
                </div>
            )}

            {/* MODAL: NUEVO CRÉDITO CLIENTE */}
            {isCreditModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Nuevo Crédito (Fiado)</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Registra dinero por cobrar</p></div>
                            <button onClick={() => setIsCreditModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl">✕</button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nombre Cliente</label><input type="text" placeholder="Ej: Juan" value={newCredit.customer} onChange={(e) => setNewCredit({...newCredit, customer: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">WhatsApp</label><input type="text" placeholder="+57" value={newCredit.phone} onChange={(e) => setNewCredit({...newCredit, phone: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" /></div>
                            </div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Monto Total</label><input type="number" placeholder="0.00" value={newCredit.amount} onChange={(e) => setNewCredit({...newCredit, amount: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none text-sm font-black" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha Límite Pago</label><input type="date" value={newCredit.date} onChange={(e) => setNewCredit({...newCredit, date: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Resumen de Mercancía</label><textarea placeholder="Ej: 2 Camisas, 1 Gorra..." value={newCredit.summary} onChange={(e) => setNewCredit({...newCredit, summary: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none text-sm font-medium h-24" /></div>
                        </div>
                        <div className="p-10 pt-0"><button onClick={handleAddCredit} className="w-full bg-purple-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-100 transition-all">Activar Crédito</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
