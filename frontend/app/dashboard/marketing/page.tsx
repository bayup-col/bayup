"use client";

import { useState, useMemo } from 'react';

interface Campaign {
    id: string;
    name: string;
    type: 'email' | 'automation' | 'social' | 'remarketing';
    status: 'active' | 'scheduled' | 'draft' | 'completed';
    sent: number;
    open_rate: number; 
    click_rate: number; 
    revenue: number;
    date: string;
}

interface RemarketingClient {
    id: string;
    name: string;
    email: string;
    phone: string;
    last_purchase: string;
    category: 'inactive' | 'abandoned' | 'vip';
    selected: boolean;
}

const MOCK_CAMPAIGNS: Campaign[] = [
    { id: "camp_1", name: "Lanzamiento Verano 2024", type: 'email', status: 'completed', sent: 1250, open_rate: 45.2, click_rate: 12.5, revenue: 15400.00, date: "2024-06-01" },
    { id: "camp_2", name: "Recuperación de Carrito", type: 'automation', status: 'active', sent: 340, open_rate: 62.0, click_rate: 28.4, revenue: 8900.50, date: "Siempre activo" }
];

const MOCK_REMARKETING_CLIENTS: RemarketingClient[] = [
    { id: 'c1', name: 'Juan Pérez', email: 'juan@mail.com', phone: '+57 300 111 2233', last_purchase: 'Hace 45 días', category: 'inactive', selected: false },
    { id: 'c2', name: 'Maria López', email: 'maria@mail.com', phone: '+57 310 222 3344', last_purchase: 'Hace 2 días', category: 'abandoned', selected: false },
    { id: 'c3', name: 'Carlos Ruiz', email: 'carlos@mail.com', phone: '+57 320 444 5566', last_purchase: 'Hace 10 días', category: 'vip', selected: false },
    { id: 'c4', name: 'Ana Beltrán', email: 'ana@mail.com', phone: '+57 315 777 8899', last_purchase: 'Hace 60 días', category: 'inactive', selected: false },
];

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'email' | 'automations'>('overview');
    const [isRemarketingModalOpen, setIsRemarketingModalOpen] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState<'all' | 'inactive' | 'abandoned' | 'vip'>('all');
    const [clients, setClients] = useState<RemarketingClient[]>(MOCK_REMARKETING_CLIENTS);
    const [isSending, setIsSending] = useState(false);
    const [remarketingMessage, setRemarketingMessage] = useState("¡Hola! Te extrañamos en la tienda. Usa el código VOLVER10 para un 10% de descuento en tu próxima compra.");

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const filteredClients = useMemo(() => {
        return clients.filter(c => selectedSegment === 'all' || c.category === selectedSegment);
    }, [selectedSegment, clients]);

    const handleSelectAll = (checked: boolean) => {
        const visibleIds = filteredClients.map(c => c.id);
        setClients(clients.map(c => visibleIds.includes(c.id) ? { ...c, selected: checked } : c));
    };

    const handleToggleClient = (id: string) => {
        setClients(clients.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
    };

    const handleStartRemarketing = (method: 'whatsapp' | 'email') => {
        const selectedCount = clients.filter(c => c.selected).length;
        if (selectedCount === 0) return alert("Selecciona al menos un cliente.");
        
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            setIsRemarketingModalOpen(false);
            alert(`Campaña de Remarketing enviada con éxito a ${selectedCount} clientes vía ${method}.`);
            setClients(clients.map(c => ({ ...c, selected: false })));
        }, 2000);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Marketing & Campañas</h1>
                    <p className="text-gray-500 mt-2 font-medium italic">Transforma datos en ventas con estrategias inteligentes.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsRemarketingModalOpen(true)}
                        className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-50 transition-all shadow-lg shadow-purple-100 flex items-center gap-2"
                    >
                        🚀 Campaña de Recuperación
                    </button>
                    <button className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2">
                        + Crear Campaña
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Ventas por Marketing', val: 2850000, trend: '+12%', color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Tasa de Conversión', val: '3.8%', trend: 'Superior al promedio', color: 'bg-purple-50 text-purple-600' },
                    { label: 'Impactos Realizados', val: '2,450', trend: '98% Efectividad', color: 'bg-blue-50 text-blue-600' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center justify-between group hover:border-purple-100 transition-all">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{typeof kpi.val === 'number' ? formatCurrency(kpi.val) : kpi.val}</h3>
                            <span className="text-[9px] font-bold text-emerald-500 mt-2 block">{kpi.trend}</span>
                        </div>
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${kpi.color} shadow-inner`}>✨</div>
                    </div>
                ))}
            </div>

            {/* Tabla de Campañas */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="border-b border-gray-50 px-8 pt-6 flex gap-8">
                    {['overview', 'automations'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-6 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
                            {tab === 'overview' ? 'Mis Campañas' : 'Flujos Automáticos'}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaña</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Impactos</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rendimiento</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Retorno</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {MOCK_CAMPAIGNS.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                                    <td className="px-8 py-6"><p className="text-sm font-black text-gray-900">{c.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{c.type}</p></td>
                                    <td className="px-8 py-6"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">{c.status}</span></td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-600">{c.sent.toLocaleString()}</td>
                                    <td className="px-8 py-6"><div className="flex items-center gap-2"><div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className="bg-purple-600 h-full" style={{ width: `${c.open_rate}%` }}></div></div><span className="text-[10px] font-black text-gray-900">{c.open_rate}%</span></div></td>
                                    <td className="px-8 py-6 text-right font-black text-sm text-purple-600">{formatCurrency(c.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL REMARKETING */}
            {isRemarketingModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Remarketing Inteligente</h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Segmenta y recupera ventas perdidas</p>
                            </div>
                            <button onClick={() => setIsRemarketingModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                            {/* Panel Izquierdo: Selección de Clientes */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 border-r border-gray-50 custom-scrollbar">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'all', label: 'Todos', icon: '👥' },
                                        { id: 'inactive', label: 'Inactivos (30d+)', icon: '💤' },
                                        { id: 'abandoned', label: 'Carritos Abandonados', icon: '🛒' },
                                        { id: 'vip', label: 'Clientes VIP', icon: '⭐' }
                                    ].map(seg => (
                                        <button 
                                            key={seg.id} 
                                            onClick={() => setSelectedSegment(seg.id as any)}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedSegment === seg.id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'}`}
                                        >
                                            {seg.icon} {seg.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-50">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seleccionar Filtrados</span>
                                        </label>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">{filteredClients.length} Clientes</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {filteredClients.map(client => (
                                            <div key={client.id} onClick={() => handleToggleClient(client.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${client.selected ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${client.category === 'vip' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{client.name.substr(0,2)}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{client.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Última compra: {client.last_purchase}</p>
                                                    </div>
                                                </div>
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${client.selected ? 'bg-purple-600 border-purple-600' : 'border-gray-200'}`}>
                                                    {client.selected && <span className="text-white text-[10px]">✓</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Panel Derecho: Configuración de Mensaje */}
                            <div className="w-full lg:w-[400px] bg-gray-50 p-10 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Configurar Mensaje</h3>
                                    <div className="space-y-4">
                                        <textarea 
                                            value={remarketingMessage}
                                            onChange={(e) => setRemarketingMessage(e.target.value)}
                                            rows={6} 
                                            className="w-full p-5 bg-white border border-gray-200 rounded-[2rem] outline-none text-sm font-medium leading-relaxed focus:ring-4 focus:ring-purple-500/5 transition-all shadow-inner"
                                        />
                                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3">
                                            <span className="text-xl">✨</span>
                                            <p className="text-[10px] text-purple-700 font-medium leading-relaxed">Tip IA: Incluir un cupón de descuento aumenta la conversión de recuperación en un **24%**.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 space-y-4">
                                    <button 
                                        onClick={() => handleStartRemarketing('whatsapp')}
                                        disabled={isSending}
                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-3"
                                    >
                                        {isSending ? 'Procesando...' : <><span>📱</span> Enviar por WhatsApp</>}
                                    </button>
                                    <button 
                                        onClick={() => handleStartRemarketing('email')}
                                        disabled={isSending}
                                        className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3"
                                    >
                                        {isSending ? 'Procesando...' : <><span>✉️</span> Enviar por Correo</>}
                                    </button>
                                    <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-tighter">Se enviará de forma individual para evitar spam.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
