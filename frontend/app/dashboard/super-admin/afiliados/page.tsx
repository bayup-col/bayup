"use client";

import { useState } from 'react';

interface AffiliateCompany {
    id: string;
    name: string;
    status: string;
    revenue: number;
}

interface Affiliate {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    companies_count: number;
    avg_revenue: number;
    registration_date: string;
    account_age: string;
    level: 'Silver' | 'Gold' | 'Platinum';
    status: 'Activo' | 'Inactivo';
    avatar: string;
    companies: AffiliateCompany[];
    monthly_stats: { month: string, value: number }[];
}

const MOCK_AFFILIATES: Affiliate[] = [
    {
        id: "AF-001",
        full_name: "Juan Camilo Marketing",
        email: "juanc.mkt@gmail.com",
        phone: "+57 310 456 7890",
        address: "Medellín, Colombia",
        companies_count: 12,
        avg_revenue: 145000,
        registration_date: "2023-05-10",
        account_age: "8 meses",
        level: 'Platinum',
        status: 'Activo',
        avatar: "JC",
        companies: [
            { id: "c1", name: "Tech Nova Store", status: "Activo", revenue: 850000 },
            { id: "c2", name: "Gamer Zone", status: "Activo", revenue: 420000 },
        ],
        monthly_stats: [
            { month: 'Ene', value: 950000 }, { month: 'Feb', value: 1100000 }, { month: 'Mar', value: 1450000 }
        ]
    }
];

export default function AffiliatesModule() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>(MOCK_AFFILIATES);
    const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newAffiliate, setNewAffiliate] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        level: 'Silver' as const
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const handleCreateAffiliate = (e: React.FormEvent) => {
        e.preventDefault();
        const created: Affiliate = {
            id: `AF-00${affiliates.length + 1}`,
            ...newAffiliate,
            companies_count: 0,
            avg_revenue: 0,
            registration_date: new Date().toISOString().split('T')[0],
            account_age: "Recién unido",
            status: 'Activo',
            avatar: newAffiliate.full_name.charAt(0).toUpperCase(),
            companies: [],
            monthly_stats: []
        };
        setAffiliates([created, ...affiliates]);
        setIsCreateModalOpen(false);
        setNewAffiliate({ full_name: '', email: '', phone: '', address: '', level: 'Silver' });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic text-[#004d4d]">Gestión de Afiliados</h1>
                    <p className="text-gray-500 mt-1 font-medium">Control de socios y facturación por referidos.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-full sm:w-64">
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#004d4d] shadow-sm transition-all" />
                        <svg className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#004d4d] transition-all">+ Crear Afiliado</button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Afiliado</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Empresas</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Promedio</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Registro</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            <th className="relative px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {affiliates.filter(af => af.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((af) => (
                            <tr key={af.id} onClick={() => setSelectedAffiliate(af)} className="hover:bg-[#f0f9f9] transition-colors cursor-pointer group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-gray-900 flex items-center justify-center font-black text-white shadow-lg">{af.avatar}</div>
                                        <div><p className="text-sm font-black text-gray-900">{af.full_name}</p><p className="text-[10px] font-bold text-gray-400 truncate w-40">{af.email}</p></div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center"><span className="text-sm font-black text-[#004d4d] bg-[#f0f9f9] px-3 py-1 rounded-lg">{af.companies_count}</span></td>
                                <td className="px-8 py-5"><p className="text-sm font-black text-gray-900">{formatCurrency(af.avg_revenue)}</p><span className="text-[9px] font-black text-green-500 uppercase">{af.level}</span></td>
                                <td className="px-8 py-5 text-sm text-gray-400 font-medium">{af.registration_date}</td>
                                <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${af.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {af.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right"><span className="text-[#004d4d] opacity-0 group-hover:opacity-100 transition-opacity font-black text-xs">Perfil →</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREAR AFILIADO */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <form onSubmit={handleCreateAffiliate}>
                            <div className="p-10 bg-gray-900 text-white relative">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">✕</button>
                                <h3 className="text-2xl font-black italic tracking-tighter text-[#00ffff]">Nuevo Afiliado</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Registro manual de socio</p>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                    <input required type="text" value={newAffiliate.full_name} onChange={e => setNewAffiliate({...newAffiliate, full_name: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#004d4d]" /></div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                    <input required type="email" value={newAffiliate.email} onChange={e => setNewAffiliate({...newAffiliate, email: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#004d4d]" /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                                    <input type="text" value={newAffiliate.phone} onChange={e => setNewAffiliate({...newAffiliate, phone: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#004d4d]" /></div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nivel Inicial</label>
                                    <select value={newAffiliate.level} onChange={e => setNewAffiliate({...newAffiliate, level: e.target.value as any})} className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none">
                                        <option value="Silver">Silver</option><option value="Gold">Gold</option><option value="Platinum">Platinum</option>
                                    </select></div>
                                </div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dirección</label>
                                <input type="text" value={newAffiliate.address} onChange={e => setNewAffiliate({...newAffiliate, address: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#004d4d]" /></div>
                            </div>
                            <div className="p-10 pt-0"><button type="submit" className="w-full bg-[#004d4d] hover:bg-[#003333] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Registrar Socio</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE */}
            {selectedAffiliate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        <div className="p-10 border-b border-gray-50 relative bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                            <button onClick={() => setSelectedAffiliate(null)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors text-xl">✕</button>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-[2rem] bg-white text-gray-900 shadow-xl flex items-center justify-center text-3xl font-black">{selectedAffiliate.avatar}</div>
                                <div><h3 className="text-3xl font-black tracking-tighter">{selectedAffiliate.full_name}</h3><p className="text-sm font-bold text-[#00ffff] uppercase tracking-[0.2em] mt-1">{selectedAffiliate.level} Partner • {selectedAffiliate.status}</p></div>
                            </div>
                        </div>
                        <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Empresas Referidas</p><p className="text-3xl font-black text-gray-900">{selectedAffiliate.companies_count}</p></div>
                                <div className="bg-[#f0f9f9] p-6 rounded-3xl border border-[#004d4d]/10 text-center"><p className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest mb-2">Comisiones Totales</p><p className="text-3xl font-black text-[#004d4d]">{formatCurrency(selectedAffiliate.avg_revenue * 12)}</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
