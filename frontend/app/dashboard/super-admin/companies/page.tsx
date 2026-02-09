"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { 
    Building2, 
    Search, 
    Filter, 
    MoreHorizontal, 
    ExternalLink, 
    ShieldAlert, 
    ShieldCheck, 
    Calendar,
    DollarSign,
    ArrowUpRight,
    Users,
    Zap,
    Trash2,
    Edit3,
    ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    plan?: {
        name: string;
        price: number;
    };
    stats?: {
        total_sales: number;
        total_products: number;
    };
}

export default function CompaniesDirectory() {
    const { token, login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isImpersonating, setIsImpersonating] = useState<string | null>(null);

    const handleImpersonate = async (userId: string) => {
        if (!token) return;
        setIsImpersonating(userId);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://gallant-education-production-8b4a.up.railway.app";
            const res = await fetch(`${apiBase}/super-admin/impersonate/${userId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const user = data.user;
                
                // Teletransporte: Sobreescribimos la sesión con la del cliente
                login(data.access_token, user.email, user.role, user.permissions, user.plan, user.is_global_staff);
                
                showToast(`Entrando al ecosistema de ${user.full_name}...`, "success");
                router.push('/dashboard');
            } else {
                showToast("Error en el túnel de impersonación", "error");
            }
        } catch (error) {
            showToast("Error de conexión con la red global", "error");
        } finally {
            setIsImpersonating(null);
        }
    };

    useEffect(() => {
        const fetchCompanies = async () => {
            if (!token) return;
            try {
                // Obtenemos todos los usuarios con rol admin_tienda (que son las empresas)
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Filtramos solo los que son dueños de tienda
                    const storeOwners = data.filter((u: any) => u.role === 'admin_tienda');
                    setCompanies(storeOwners);
                }
            } catch (error) {
                showToast("Error al cargar el directorio", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, [token, showToast]);

    const filteredCompanies = useMemo(() => {
        return companies.filter(c => {
            const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 c.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === "all" || c.status.toLowerCase() === filterStatus.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [companies, searchTerm, filterStatus]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
                <div className="flex flex-col items-center gap-4">
                    <Building2 size={40} className="animate-pulse text-[#004d4d]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Escaneando ecosistemas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-10 pt-8">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <button 
                            onClick={() => router.push('/dashboard/super-admin')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-[#004d4d] transition-colors mb-4"
                        >
                            <ArrowLeft size={14} /> Volver al Control
                        </button>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                            Directorio <span className="text-[#004d4d]">Maestro</span>
                        </h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gestión global de ecosistemas comerciales</p>
                    </div>
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 px-4 border-r border-gray-100">
                            <Search size={18} className="text-gray-300" />
                            <input 
                                type="text" 
                                placeholder="Buscar empresa o email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent outline-none text-sm font-medium text-gray-900 w-64"
                            />
                        </div>
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest px-4 text-[#004d4d] cursor-pointer"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="activo">Activos</option>
                            <option value="suspendido">Suspendidos</option>
                            <option value="invitado">Invitados</option>
                        </select>
                    </div>
                </header>

                {/* Grid de Empresas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredCompanies.map((company, index) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#004d4d]/10 transition-all group relative overflow-hidden"
                            >
                                {/* Status Badge */}
                                <div className="absolute top-6 right-8">
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                        company.status.toLowerCase() === 'activo' 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                    }`}>
                                        {company.status}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-5">
                                        <div className="h-16 w-16 rounded-[1.5rem] bg-[#004d4d]/5 flex items-center justify-center text-[#004d4d] border border-[#004d4d]/10 group-hover:bg-[#004d4d] group-hover:text-white transition-all duration-500">
                                            <Building2 size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">{company.full_name}</h3>
                                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tight">{company.email}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Plan Actual</p>
                                            <p className="text-xs font-black text-[#004d4d] uppercase">{company.plan?.name || 'Básico'}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Desde</p>
                                            <p className="text-xs font-black text-gray-900">{new Date(company.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Facturación Total</p>
                                            <p className="text-sm font-black text-gray-900">{formatCurrency(company.stats?.total_sales || 0)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleImpersonate(company.id)}
                                                disabled={isImpersonating !== null}
                                                title="Entrar a la tienda"
                                                className="h-10 w-10 rounded-xl bg-[#004d4d]/5 text-[#004d4d] flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all disabled:opacity-50"
                                            >
                                                {isImpersonating === company.id ? <Loader2 className="animate-spin" size={16} /> : <ExternalLink size={16} />}
                                            </button>
                                            <button 
                                                title="Gestionar Empresa"
                                                className="h-10 w-10 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-all shadow-lg"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredCompanies.length === 0 && (
                        <div className="col-span-full py-40 text-center space-y-4">
                            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                                <Search size={40} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">No se encontraron ecosistemas con esos criterios</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
