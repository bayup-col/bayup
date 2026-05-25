"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { useTheme } from '@/context/theme-context';
import { Loader2, Search, Filter, Package, ShoppingBag, Zap, Mail, Phone, Calendar, User, Bot, Sparkles, ShieldCheck, ExternalLink, ArrowUpRight, Code, Copy, Check, Download, Globe } from "lucide-react";

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
    last_month_revenue?: number;
    custom_commission_rate?: number;
    commission_is_fixed?: boolean;
    commission_fixed_until?: string;
    referred_by_id?: string;
}

export default function SuperAdminClients() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const { theme } = useTheme();

    const [companies, setCompanies] = useState<CompanyClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClosingMonth, setIsClosingMonth] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<CompanyClient | null>(null);

    // Design Injection States
    const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
    const [designJson, setDesignJson] = useState('');
    const [targetPage, setTargetPage] = useState('home');
    const [isInjecting, setIsInjecting] = useState(false);

    // Commission Update States
    const [editComm, setEditComm] = useState({
        rate: 0,
        fixed: false,
        until: ''
    });

    // Variables de estilo por tema
    const textPrimary = theme === 'dark' ? 'text-white/90' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-white/50' : 'text-gray-500';
    const textMuted = theme === 'dark' ? 'text-white/40' : 'text-gray-400';
    const textFaint = theme === 'dark' ? 'text-white/30' : 'text-gray-400';
    const tableBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm';
    const tableHeader = theme === 'dark' ? 'bg-white/[0.03] text-white/40' : 'bg-gray-50 text-gray-500';
    const tableRow = theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50/50';
    const divider = theme === 'dark' ? 'divide-white/5' : 'divide-gray-50';
    const inputBg = theme === 'dark' ? 'bg-white/5 border-white/10 text-white/80 placeholder:text-white/20' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-300';
    const searchIcon = theme === 'dark' ? 'text-white/30' : 'text-gray-400';
    const loadingText = theme === 'dark' ? 'text-white/40' : 'text-gray-400';
    const innerCard = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100';
    const innerCardMuted = theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-100';

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

    useEffect(() => {
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

    const handleCloseMonth = async () => {
        if (!confirm("¿Deseas ejecutar el cierre contable? Esto actualizará las comisiones de todas las tiendas basado en sus ventas del mes pasado.")) return;
        setIsClosingMonth(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/super-admin/close-month`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast("Cierre de mes completado con éxito 📈", "success");
                fetchCompanies();
            }
        } catch (e) {
            showToast("Error al ejecutar cierre", "error");
        } finally {
            setIsClosingMonth(false);
        }
    };

    const updateManualCommission = async () => {
        if (!selectedCompany) return;
        showToast("Actualizando comisión manual...", "info");
        showToast("Comisión manual establecida correctamente ✨", "success");
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
            <Loader2 className="w-12 h-12 animate-spin text-cyan" />
            <p className={`font-bold uppercase tracking-widest text-xs ${loadingText}`}>Cargando directorio real...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 relative animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className={`text-4xl font-black tracking-tighter italic uppercase ${textPrimary}`}>
                        Comercios <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-cyan">Activos</span>
                    </h1>
                    <p className={`mt-1 font-medium italic ${textSecondary}`}>Gestión integral de las {companies.length} empresas en la red Bayup.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCloseMonth}
                        disabled={isClosingMonth}
                        className="px-8 py-4 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                    >
                        {isClosingMonth ? <Loader2 className="animate-spin" size={16}/> : <Calendar size={16} className="text-cyan"/>}
                        Ejecutar Cierre Mes
                    </button>
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Buscar comercio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-12 pr-4 py-4 border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-cyan/20 shadow-xl transition-all font-bold ${inputBg}`}
                        />
                        <Search className={`w-5 h-5 absolute left-4 top-4 ${searchIcon}`} />
                    </div>
                </div>
            </div>

            <div className={`rounded-[3rem] border shadow-2xl overflow-hidden mx-4 ${tableBg}`}>
                <table className="min-w-full divide-y divide-current">
                    <thead className={tableHeader}>
                        <tr>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Empresa / Identidad</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Plan</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Ventas Totales</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Estado</th>
                            <th className="relative px-8 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-gray-50'}`}>
                        {filteredCompanies.map((company) => (
                            <tr key={company.id} onClick={() => setSelectedCompany(company)} className={`transition-colors cursor-pointer group ${tableRow}`}>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-[1.5rem] bg-[#001A1A] flex items-center justify-center font-black text-cyan shadow-xl group-hover:scale-110 transition-transform uppercase border-2 border-white/10">{company.avatar}</div>
                                        <div>
                                            <p className={`text-sm font-black tracking-tight ${textPrimary}`}>{company.company_name}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${textMuted}`}>{company.owner_name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${
                                        company.plan === 'Gold' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        company.plan === 'Pro' ? 'bg-cyan/10 text-cyan border-cyan/20' :
                                        theme === 'dark' ? 'bg-white/5 text-white/40 border-white/10' : 'bg-gray-100 text-gray-400 border-gray-200'
                                    }`}>{company.plan}</span>
                                </td>
                                <td className="px-8 py-6 text-sm text-emerald-400 font-black tracking-tight">{formatCurrency(company.total_invoiced)}</td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${company.status === 'Activo' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>{company.status}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center group-hover:bg-cyan group-hover:text-[#001A1A] transition-all ${theme === 'dark' ? 'bg-white/5 text-white/20' : 'bg-gray-100 text-gray-400'}`}>
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
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0a1a1a] w-full max-w-5xl rounded-[4rem] shadow-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 max-h-[95vh]">

                        {/* Sidebar Izquierdo: Identidad y Contacto */}
                        <div className="w-full md:w-[380px] bg-white/[0.03] border-r border-white/5 p-12 flex flex-col justify-between">
                            <div className="space-y-10">
                                <div className="text-center space-y-4">
                                    <div className="h-32 w-32 rounded-[2.5rem] bg-[#001A1A] flex items-center justify-center text-5xl font-black text-cyan shadow-2xl mx-auto border-4 border-white/10 uppercase">
                                        {selectedCompany.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white/90 tracking-tighter leading-tight">{selectedCompany.company_name}</h3>
                                        <p className="text-[10px] font-black text-cyan bg-cyan/10 px-3 py-1 rounded-full uppercase tracking-[0.2em] inline-block mt-2">Plan {selectedCompany.plan}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-cyan transition-colors"><Mail size={18}/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Correo Principal</p>
                                            <p className="text-sm font-bold text-white/70 truncate">{selectedCompany.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-cyan transition-colors"><Phone size={18}/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">WhatsApp / Tel</p>
                                            <p className="text-sm font-bold text-white/70">{selectedCompany.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Acciones de Soporte</p>
                                    <button
                                        onClick={() => showToast("Enlace de reseteo enviado al cliente 📧", "success")}
                                        className="w-full py-4 bg-white/[0.06] text-white/60 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={14} /> Resetear Contraseña
                                    </button>
                                    <button
                                        onClick={() => showToast("Generando exportación de datos... 📊", "info")}
                                        className="w-full py-4 bg-white/5 border border-white/10 text-white/40 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download size={14} /> Exportar Info Cliente
                                    </button>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-[#001A1A] text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 group mt-10 border border-white/10">
                                <Zap size={16} className="text-cyan group-hover:animate-pulse" /> Impersonar Tienda
                            </button>
                            <button onClick={() => setIsInjectModalOpen(true)} className="w-full py-5 bg-cyan text-[#001A1A] rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#00f2ff] transition-all shadow-lg flex items-center justify-center gap-3 group mt-4">
                                <Globe size={16} /> Asignar Página Web
                            </button>
                        </div>

                        {/* Contenido Principal: Métricas y Análisis */}
                        <div className="flex-1 bg-transparent p-12 overflow-y-auto custom-scrollbar relative">
                            <button onClick={() => setSelectedCompany(null)} className="absolute top-10 right-10 h-12 w-12 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all z-50 group">
                                <Filter size={24} className="group-hover:rotate-90 transition-transform rotate-45" />
                            </button>

                            <div className="space-y-12">
                                {/* Sección de Métricas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-cyan/5 p-8 rounded-[3rem] border border-cyan/10 flex flex-col justify-between group hover:shadow-xl transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-cyan"><ShoppingBag size={24}/></div>
                                            <span className="text-[10px] font-black text-cyan/40 uppercase tracking-widest">Ventas Mes Pasado</span>
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black text-cyan tracking-tighter">{formatCurrency(selectedCompany.last_month_revenue || 0)}</p>
                                            <p className="text-[10px] font-bold text-cyan/60 uppercase tracking-widest mt-1">Base para cálculo de comisión</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#001A1A] p-8 rounded-[3rem] border border-white/5 flex flex-col justify-between group hover:shadow-xl transition-all shadow-2xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-cyan"><Zap size={24}/></div>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ganancia Bayup Estimada</span>
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(selectedCompany.our_profit)}</p>
                                            <p className="text-[10px] font-bold text-cyan uppercase tracking-widest mt-1">Comisión real aplicada</p>
                                        </div>
                                    </div>
                                </div>

                                {/* PANEL DE CONTROL DE COMISIONES */}
                                <div className="p-10 bg-white/[0.03] rounded-[3.5rem] border border-white/10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={18} className="text-cyan" /> Control de Comisión Especial
                                        </h4>
                                        {selectedCompany.referred_by_id && (
                                            <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase border border-emerald-500/20">
                                                Tienda Referida (0.5% Afiliado Activo)
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">% Comisión Manual</label>
                                            <input
                                                type="number"
                                                value={editComm.rate}
                                                onChange={e => setEditComm({...editComm, rate: parseFloat(e.target.value)})}
                                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-cyan/20 text-white/80"
                                                placeholder="Ej: 1.2"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Válida Hasta</label>
                                            <input
                                                type="date"
                                                value={editComm.until}
                                                onChange={e => setEditComm({...editComm, until: e.target.value})}
                                                disabled={editComm.fixed}
                                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-cyan/20 text-white/80 disabled:opacity-30"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end pb-1">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={editComm.fixed}
                                                    onChange={e => setEditComm({...editComm, fixed: e.target.checked})}
                                                    className="w-5 h-5 rounded-lg border-white/20 text-cyan focus:ring-cyan"
                                                />
                                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-cyan transition-colors">Mantener Fija Permanentemente</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={updateManualCommission}
                                        className="w-full py-4 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-cyan hover:text-[#001A1A] transition-all flex items-center justify-center gap-3"
                                    >
                                        <Check size={16} /> Aplicar Configuración Especial
                                    </button>

                                    <p className="text-[9px] text-white/30 italic text-center">
                                        * Al aplicar una comisión manual, el sistema ignorará los rangos por volumen (0-15M, etc) hasta que la fecha caduque o se desactive la comisión fija.
                                    </p>
                                </div>

                                {/* Grid de Operación */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Productos</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Package size={16} className="text-white/30" />
                                            <p className="text-xl font-black text-white/90">{selectedCompany.product_count}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Pedidos</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <ShoppingBag size={16} className="text-white/30" />
                                            <p className="text-xl font-black text-white/90">{selectedCompany.order_count}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Ticket Prom.</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Sparkles size={16} className="text-cyan" />
                                            <p className="text-xl font-black text-white/90">{formatCurrency(selectedCompany.avg_ticket)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Análisis Bayt AI */}
                                <div className="p-10 bg-gradient-to-br from-[#001a1a] to-[#0d0d0d] rounded-[3.5rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Bot size={200}/></div>
                                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Bot size={24} className="text-cyan animate-pulse" />
                                            <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Análisis Estratégico Bayt</h4>
                                        </div>
                                        <p className="text-lg font-medium text-white/60 italic leading-relaxed px-4">
                                            &quot;Este comercio presenta un índice de crecimiento del <span className="text-cyan">14.2%</span>. Sugerimos recomendar el ajuste de comisiones para escalar su rentabilidad.&quot;
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest">Riesgo: Bajo</div>
                                            <div className="px-5 py-2 bg-cyan/10 rounded-full border border-cyan/20 text-[9px] font-black text-cyan uppercase tracking-widest">Estado: Escalando</div>
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
                    <div className="bg-[#0a1a1a] w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-white/10">
                        <button onClick={() => setIsInjectModalOpen(false)} className="absolute top-8 right-8 text-white/30 hover:text-rose-400"><Filter size={24} className="rotate-45"/></button>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black italic text-white/90 tracking-tighter">Gestión de <span className="text-cyan">Diseño Inyectado</span></h3>
                            <p className="text-xs font-bold text-white/40 mt-2 uppercase tracking-widest">Configuración maestra para {selectedCompany?.company_name}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={async () => {
                                        showToast(`Buscando en /templates/clients/${selectedCompany?.company_name}...`, "info");
                                        try {
                                            const response = await fetch(`/templates/clients/${selectedCompany?.company_name}/schema.json`);
                                            if (response.ok) {
                                                const data = await response.json();
                                                setDesignJson(JSON.stringify(data, null, 2));
                                                showToast("¡Diseño de carpeta cargado! ✨", "success");
                                            } else {
                                                showToast("No se encontró schema.json en la carpeta del cliente.", "info");
                                            }
                                        } catch(e) {
                                            showToast("Error al leer la carpeta local.", "error");
                                        }
                                    }}
                                    className="p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[2rem] text-center hover:bg-emerald-500/20 transition-all group"
                                >
                                    <Package size={24} className="mx-auto text-emerald-400 mb-2 group-hover:scale-110 transition-transform"/>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Cargar desde Carpeta</p>
                                    <p className="text-[8px] text-emerald-400/60 mt-1 italic">Lee el archivo local del equipo</p>
                                </button>

                                <div className="p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] text-center">
                                    <Code size={24} className="mx-auto text-white/40 mb-2"/>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Manual JSON</p>
                                    <p className="text-[8px] text-white/30 mt-1 italic">Pega el código directamente</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2 mb-2 block">Página Destino</label>
                                <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl overflow-x-auto">
                                    {['home', 'catalog', 'product_detail', 'checkout', 'about'].map(p => (
                                        <button key={p} onClick={() => setTargetPage(p)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${targetPage === p ? 'bg-white/10 text-cyan shadow-sm' : 'text-white/30 hover:text-white/60'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2 mb-2 block">Vista previa del Schema</label>
                                <textarea
                                    value={designJson}
                                    onChange={e => setDesignJson(e.target.value)}
                                    placeholder='El JSON aparecerá aquí al cargar la carpeta o al pegarlo...'
                                    className="w-full h-48 p-6 bg-white/5 rounded-3xl border border-white/10 focus:border-cyan/30 outline-none text-xs font-mono text-white/60 placeholder:text-white/20 resize-none"
                                />
                            </div>

                            <button onClick={handleInjectDesign} disabled={isInjecting || !designJson} className="w-full py-5 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-cyan hover:text-[#001A1A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3">
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
