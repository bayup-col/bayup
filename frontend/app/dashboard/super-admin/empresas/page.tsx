"use client";

import { useState } from 'react';

interface CompanyClient {
    id: string;
    owner_name: string;
    company_name: string;
    niche: string;
    plan: 'Free' | 'Pro' | 'Gold';
    registration_date: string;
    status: 'Activo' | 'Inactivo';
    avatar: string;
    commercial_source: string;
    total_invoiced: number;
    our_profit: number;
    account_age: string;
    monthly_growth: { month: string, value: number }[];
}

const MOCK_COMPANIES: CompanyClient[] = [
    {
        id: "comp_1", owner_name: "Ricardo Gomez", company_name: "Tech Nova Store", niche: "Tecnología", plan: "Gold", 
        registration_date: "2023-10-12", status: "Activo", avatar: "TN", commercial_source: "Andrés Silva (Comercial)",
        total_invoiced: 1250000, our_profit: 62500, account_age: "102 días",
        monthly_growth: [{ month: 'Ene', value: 850000 }, { month: 'Feb', value: 980000 }, { month: 'Mar', value: 1250000 }]
    },
    {
        id: "comp_2", owner_name: "Mariana Casallas", company_name: "Vogue Boutique", niche: "Moda", plan: "Pro", 
        registration_date: "2023-12-05", status: "Activo", avatar: "VB", commercial_source: "Enlace Afiliado (Instagram)",
        total_invoiced: 450000, our_profit: 22500, account_age: "48 días",
        monthly_growth: [{ month: 'Ene', value: 320000 }, { month: 'Feb', value: 410000 }, { month: 'Mar', value: 450000 }]
    }
];

export default function SuperAdminClients() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNiche, setSelectedNiche] = useState('Todos');
    const [selectedCompany, setSelectedCompany] = useState<CompanyClient | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const filteredCompanies = MOCK_COMPANIES.filter(c => {
        const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesNiche = selectedNiche === 'Todos' || c.niche === selectedNiche;
        return matchesSearch && matchesNiche;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 relative animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Directorio de Empresas</h1>
                    <p className="text-gray-500 mt-1 font-medium">Gestión y monitoreo de comercios activos en la red.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#004d4d] shadow-sm transition-all" />
                        <svg className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)} className="w-full sm:w-auto px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 outline-none shadow-sm cursor-pointer">
                        {["Todos", "Tecnología", "Moda", "Hogar", "Salud", "Comida"].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa / Página</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dueño</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Registro</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            <th className="relative px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredCompanies.map((company) => (
                            <tr key={company.id} onClick={() => setSelectedCompany(company)} className="hover:bg-[#f0f9f9] transition-colors cursor-pointer group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-500 shadow-inner group-hover:scale-110 transition-transform">{company.avatar}</div>
                                        <div><p className="text-sm font-black text-gray-900">{company.company_name}</p><p className="text-[10px] font-bold text-[#004d4d] uppercase tracking-tighter">{company.niche}</p></div>
                                    </div>
                                </td>
                                <td className="px-8 py-5"><p className="text-sm font-medium text-gray-700">{company.owner_name}</p></td>
                                <td className="px-8 py-5"><span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${company.plan === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-[#f0f9f9] text-[#004d4d]'}`}>{company.plan}</span></td>
                                <td className="px-8 py-5 text-sm text-gray-400 font-medium">{company.registration_date}</td>
                                <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${company.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {company.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right"><span className="text-[#004d4d] opacity-0 group-hover:opacity-100 transition-opacity font-black text-xs uppercase tracking-widest">Detalles →</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DETALLE */}
            {selectedCompany && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        <div className="p-10 border-b border-gray-50 relative bg-gradient-to-r from-gray-50 to-white">
                            <button onClick={() => setSelectedCompany(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors text-xl">✕</button>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-[#004d4d] to-[#008080] shadow-xl flex items-center justify-center text-3xl font-black text-white">{selectedCompany.avatar}</div>
                                <div><h3 className="text-3xl font-black text-gray-900 tracking-tighter">{selectedCompany.company_name}</h3><p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{selectedCompany.niche} • {selectedCompany.status}</p></div>
                            </div>
                        </div>
                        <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Facturación Mensual</p><p className="text-2xl font-black text-gray-900">{formatCurrency(selectedCompany.total_invoiced)}</p></div>
                                <div className="bg-[#f0f9f9] p-6 rounded-3xl border border-[#004d4d]/10 text-center"><p className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest mb-2">Nuestra Ganancia</p><p className="text-2xl font-black text-[#004d4d]">{formatCurrency(selectedCompany.our_profit)}</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
