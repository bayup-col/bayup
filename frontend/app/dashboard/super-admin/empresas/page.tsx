import { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth-context";
import { Loader2, Search, Filter } from "lucide-react";

interface CompanyClient {
    id: string;
    owner_name: string;
    company_name: string;
    email: string;
    niche?: string;
    plan: string;
    registration_date: string;
    status: string;
    avatar: string;
    total_invoiced: number;
    our_profit: number;
}

export default function SuperAdminClients() {
    const { token } = useAuth();
    const [companies, setCompanies] = useState<CompanyClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNiche, setSelectedNiche] = useState('Todos');
    const [selectedCompany, setSelectedCompany] = useState<CompanyClient | null>(null);

    useEffect(() => {
        const fetchCompanies = async () => {
            if (!token) return;
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiBase}/super-admin/stores`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(data);
                }
            } catch (e) {
                console.error("Error fetching companies:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, [token]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesNiche = selectedNiche === 'Todos' || c.niche === selectedNiche;
        return matchesSearch && matchesNiche;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#004d4d]" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando directorio real...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 relative animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Directorio de Empresas</h1>
                    <p className="text-gray-500 mt-1 font-medium">Gestión y monitoreo de las {companies.length} empresas activas en producción.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input type="text" placeholder="Buscar por nombre, dueño o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#004d4d] shadow-sm transition-all" />
                        <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa / Email</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dueño</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Facturación</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            <th className="relative px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredCompanies.map((company) => (
                            <tr key={company.id} onClick={() => setSelectedCompany(company)} className="hover:bg-[#f0f9f9] transition-colors cursor-pointer group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-gray-900 flex items-center justify-center font-black text-cyan shadow-lg group-hover:scale-110 transition-transform uppercase">{company.avatar}</div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{company.company_name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">{company.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5"><p className="text-sm font-medium text-gray-700">{company.owner_name}</p></td>
                                <td className="px-8 py-5"><span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-gray-100 text-gray-600">{company.plan}</span></td>
                                <td className="px-8 py-5 text-sm text-emerald-600 font-black">{formatCurrency(company.total_invoiced)}</td>
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
                {filteredCompanies.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">No se encontraron empresas con esos criterios.</p>
                    </div>
                )}
            </div>

            {/* MODAL DETALLE */}
            {selectedCompany && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        <div className="p-10 border-b border-gray-50 relative bg-gradient-to-br from-gray-900 to-[#001a1a] text-white">
                            <button onClick={() => setSelectedCompany(null)} className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors text-xl">✕</button>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-[2rem] bg-white/10 backdrop-blur-xl shadow-xl flex items-center justify-center text-3xl font-black text-cyan border border-white/20 uppercase">{selectedCompany.avatar}</div>
                                <div><h3 className="text-3xl font-black text-white tracking-tighter">{selectedCompany.company_name}</h3><p className="text-sm font-bold text-cyan/60 uppercase tracking-[0.2em] mt-1">{selectedCompany.plan} • {selectedCompany.status}</p></div>
                            </div>
                        </div>
                        <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 text-center group hover:bg-white hover:shadow-xl transition-all">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Facturación Total</p>
                                    <p className="text-3xl font-black text-gray-900">{formatCurrency(selectedCompany.total_invoiced)}</p>
                                </div>
                                <div className="bg-[#f0f9f9] p-8 rounded-[2.5rem] border border-[#004d4d]/10 text-center group hover:shadow-xl transition-all">
                                    <p className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest mb-3">Comisión Bayup</p>
                                    <p className="text-3xl font-black text-[#004d4d]">{formatCurrency(selectedCompany.our_profit)}</p>
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-4">
                                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dueño de cuenta</p><p className="text-sm font-bold text-gray-900">{selectedCompany.owner_name}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Principal</p><p className="text-sm font-bold text-[#004d4d]">{selectedCompany.email}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha Registro</p><p className="text-sm font-bold text-gray-900">{selectedCompany.registration_date}</p></div>
                            </div>
                            <button className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Impersonar Usuario (Entrar a Tienda)</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
