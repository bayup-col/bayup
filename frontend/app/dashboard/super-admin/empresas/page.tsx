"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Loader2, Search, Filter, Package, ShoppingBag, Zap, Mail, Phone, Calendar, User, Bot, Sparkles, ShieldCheck, ExternalLink, ArrowUpRight, Code, Copy, Check } from "lucide-react";

interface CompanyClient {
    id: string;
    owner_name: string;
    company_name: string;
    email: string;
    phone: string;
    plan: string;
    registration_date: string;
    status: string;
    avatar: string;
    total_invoiced: number;
    our_profit: number;
    product_count: number;
    order_count: number;
    avg_ticket: number;
}

export default function SuperAdminClients() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [companies, setCompanies] = useState<CompanyClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<CompanyClient | null>(null);
    
    // Design Injection States
    const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
    const [designJson, setDesignJson] = useState('');
    const [targetPage, setTargetPage] = useState('home');
    const [isInjecting, setIsInjecting] = useState(false);

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

    const handleInjectDesign = async () => {
        if (!selectedCompany || !designJson.trim()) return;
        setIsInjecting(true);
        try {
            let parsedSchema;
            try {
                parsedSchema = JSON.parse(designJson);
            } catch (e) {
                showToast("El JSON no es válido", "error");
                setIsInjecting(false);
                return;
            }

            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/super-admin/inject-design`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tenant_id: selectedCompany.id,
                    page_key: targetPage,
                    schema_data: parsedSchema
                })
            });

            if (res.ok) {
                showToast(`Diseño inyectado en ${targetPage} exitosamente`, "success");
                setIsInjectModalOpen(false);
                setDesignJson('');
            } else {
                showToast("Error al inyectar diseño", "error");
            }
        } catch (e) {
            showToast("Error de conexión", "error");
        } finally {
            setIsInjecting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             c.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#004d4d]" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando directorio real...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 relative animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className="text-4xl font-black text-[#001A1A] tracking-tighter italic uppercase">Comercios <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-cyan">Activos</span></h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Gestión integral de las {companies.length} empresas en la red Bayup.</p>
                </div>
                <div className="relative w-full sm:w-96">
                    <input type="text" placeholder="Buscar por nombre, dueño o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-3xl text-sm outline-none focus:ring-2 focus:ring-[#004d4d]/20 shadow-xl transition-all font-bold" />
                    <Search className="w-5 h-5 absolute left-4 top-4 text-gray-300" />
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden mx-4">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Empresa / Identidad</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Plan</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ventas Totales</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                            <th className="relative px-8 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredCompanies.map((company) => (
                            <tr key={company.id} onClick={() => setSelectedCompany(company)} className="hover:bg-[#f0f9f9]/50 transition-colors cursor-pointer group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-[1.5rem] bg-gray-900 flex items-center justify-center font-black text-cyan shadow-xl group-hover:scale-110 transition-transform uppercase border-2 border-white/10">{company.avatar}</div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 tracking-tight">{company.company_name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{company.owner_name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${
                                        company.plan === 'Gold' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                        company.plan === 'Pro' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' : 
                                        'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>{company.plan}</span>
                                </td>
                                <td className="px-8 py-6 text-sm text-emerald-600 font-black tracking-tight">{formatCurrency(company.total_invoiced)}</td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${company.status === 'Activo' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                                        <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">{company.status}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-inner">
                                        <ArrowUpRight size={18} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE DETALLE PLATINUM PLUS */}
            {selectedCompany && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-3xl border border-white overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 max-h-[95vh]">
                        
                        {/* Sidebar Izquierdo: Identidad y Contacto */}
                        <div className="w-full md:w-[380px] bg-gray-50 border-r border-gray-100 p-12 flex flex-col justify-between">
                            <div className="space-y-10">
                                <div className="text-center space-y-4">
                                    <div className="h-32 w-32 rounded-[2.5rem] bg-gray-900 flex items-center justify-center text-5xl font-black text-cyan shadow-2xl mx-auto border-4 border-white uppercase">
                                        {selectedCompany.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-tight">{selectedCompany.company_name}</h3>
                                        <p className="text-[10px] font-black text-cyan bg-cyan/10 px-3 py-1 rounded-full uppercase tracking-[0.2em] inline-block mt-2">Plan {selectedCompany.plan}</p>
                                    </div>
                                </div>

                            <div className="space-y-6">
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#004d4d] transition-colors"><Mail size={18}/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correo Principal</p>
                                            <p className="text-sm font-bold text-gray-700 truncate">{selectedCompany.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#004d4d] transition-colors"><Phone size={18}/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp / Tel</p>
                                            <p className="text-sm font-bold text-gray-700">{selectedCompany.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Acciones de Soporte</p>
                                    <button 
                                        onClick={() => showToast("Enlace de reseteo enviado al cliente 📧", "success")}
                                        className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={14} /> Resetear Contraseña
                                    </button>
                                    <button 
                                        onClick={() => showToast("Generando exportación de datos... 📊", "info")}
                                        className="w-full py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download size={14} /> Exportar Info Cliente
                                    </button>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 group mt-10">
                                <Zap size={16} className="text-cyan group-hover:animate-pulse" /> Impersonar Tienda
                            </button>
                            <button onClick={() => setIsInjectModalOpen(true)} className="w-full py-5 bg-cyan text-[#001A1A] rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#00f2ff] transition-all shadow-lg flex items-center justify-center gap-3 group mt-4">
                                <Globe size={16} /> Asignar Página Web
                            </button>
                        </div>

                        {/* Contenido Principal: Métricas y Análisis */}
                        <div className="flex-1 bg-white p-12 overflow-y-auto custom-scrollbar relative">
                            <button onClick={() => setSelectedCompany(null)} className="absolute top-10 right-10 h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all z-50 group">
                                <Filter size={24} className="group-hover:rotate-90 transition-transform rotate-45" />
                            </button>

                            <div className="space-y-12">
                                {/* Sección de Métricas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-[#f0f9f9] p-8 rounded-[3rem] border border-[#004d4d]/10 flex flex-col justify-between group hover:shadow-xl transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#004d4d]"><ShoppingBag size={24}/></div>
                                            <span className="text-[10px] font-black text-[#004d4d]/40 uppercase tracking-widest">Facturación</span>
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black text-[#004d4d] tracking-tighter">{formatCurrency(selectedCompany.total_invoiced)}</p>
                                            <p className="text-[10px] font-bold text-[#004d4d]/60 uppercase tracking-widest mt-1">Ventas brutas totales</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-900 p-8 rounded-[3rem] border border-white/5 flex flex-col justify-between group hover:shadow-xl transition-all shadow-2xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-cyan"><Zap size={24}/></div>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Bayup Profit</span>
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(selectedCompany.our_profit)}</p>
                                            <p className="text-[10px] font-bold text-cyan uppercase tracking-widest mt-1">Comisión plataforma (5%)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Grid de Operación */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Productos</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Package size={16} className="text-gray-400" />
                                            <p className="text-xl font-black text-gray-900">{selectedCompany.product_count}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pedidos</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <ShoppingBag size={16} className="text-gray-400" />
                                            <p className="text-xl font-black text-gray-900">{selectedCompany.order_count}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ticket Prom.</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Sparkles size={16} className="text-[#004d4d]" />
                                            <p className="text-xl font-black text-gray-900">{formatCurrency(selectedCompany.avg_ticket)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Análisis Bayt AI */}
                                <div className="p-10 bg-gradient-to-br from-[#001a1a] to-gray-900 rounded-[3.5rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Bot size={200}/></div>
                                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Bot size={24} className="text-cyan animate-pulse" />
                                            <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Análisis Estratégico Bayt</h4>
                                        </div>
                                        <p className="text-lg font-medium text-gray-300 italic leading-relaxed px-4">
                                            &quot;Este comercio presenta un índice de crecimiento del <span className="text-cyan">14.2%</span>. Sugerimos recomendar el ajuste de comisiones para escalar su rentabilidad.&quot;
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest">Riesgo: Bajo</div>
                                            <div className="px-5 py-2 bg-cyan/10 rounded-full border border-cyan/20 text-[9px] font-black text-cyan uppercase tracking-widest text-white/80">Estado: Escalando</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INYECCIÓN DE DISEÑO */}
            {isInjectModalOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <button onClick={() => setIsInjectModalOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-rose-500"><Filter size={24} className="rotate-45"/></button>
                        
                        <div className="mb-8">
                            <h3 className="text-2xl font-black italic text-[#001A1A] tracking-tighter">Gestión de <span className="text-[#004d4d]">Diseño Inyectado</span></h3>
                            <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Configuración maestra para {selectedCompany?.company_name}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={async () => {
                                        // Simulación de carga desde carpeta física
                                        showToast(`Buscando en /templates/clients/${selectedCompany?.company_name}...`, "info");
                                        try {
                                            // En un entorno real, esto llamaría a un endpoint de node que lee el fs
                                            // Por ahora, simulamos la lectura del archivo de la carpeta
                                            const response = await fetch(`/templates/clients/${selectedCompany?.company_name}/schema.json`);
                                            if (response.ok) {
                                                const data = await response.json();
                                                setDesignJson(JSON.stringify(data, null, 2));
                                                showToast("¡Diseño de carpeta cargado! ✨", "success");
                                            } else {
                                                showToast("No se encontró schema.json en la carpeta del cliente.", "warning");
                                            }
                                        } catch(e) {
                                            showToast("Error al leer la carpeta local.", "error");
                                        }
                                    }}
                                    className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] text-center hover:bg-emerald-100 transition-all group"
                                >
                                    <Package size={24} className="mx-auto text-emerald-600 mb-2 group-hover:scale-110 transition-transform"/>
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Cargar desde Carpeta</p>
                                    <p className="text-[8px] text-emerald-600/60 mt-1 italic">Lee el archivo local del equipo</p>
                                </button>

                                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] text-center">
                                    <Code size={24} className="mx-auto text-gray-400 mb-2"/>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Manual JSON</p>
                                    <p className="text-[8px] text-gray-400 mt-1 italic">Pega el código directamente</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 mb-2 block">Página Destino</label>
                                <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl overflow-x-auto">
                                    {['home', 'catalog', 'product_detail', 'checkout', 'about'].map(p => (
                                        <button key={p} onClick={() => setTargetPage(p)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${targetPage === p ? 'bg-white text-[#004d4d] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 mb-2 block">Vista previa del Schema</label>
                                <textarea 
                                    value={designJson} 
                                    onChange={e => setDesignJson(e.target.value)} 
                                    placeholder='El JSON aparecerá aquí al cargar la carpeta o al pegarlo...' 
                                    className="w-full h-48 p-6 bg-gray-50 rounded-3xl border border-transparent focus:border-[#004d4d] outline-none text-xs font-mono text-gray-600 resize-none shadow-inner"
                                />
                            </div>

                            <button onClick={handleInjectDesign} disabled={isInjecting || !designJson} className="w-full py-5 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3">
                                {isInjecting ? <Loader2 className="animate-spin" size={16}/> : <><ShieldCheck size={16}/> Vincular y Publicar Tienda</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}
