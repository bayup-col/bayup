"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Smartphone, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Store, 
  Package, 
  LayoutDashboard, 
  Globe, 
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from '@/context/toast-context';
import { Seller, MonthData } from '@/lib/types';

const MONTHS_LIST = ['Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero'];

const INITIAL_SELLERS: Seller[] = [
    {
        id: 's1', name: 'Lorena Gómez', role: 'Líder de Ventas', branch: 'Tienda Principal',
        total_sales: 45800000, sales_today: 1250000, sales_month: 8500000, last_month_sales: 7200000,
        channels: { web: true, social: true, separados: true, in_store: true },
        history: [
            { month: 'Agosto', amount: 4500000 },
            { month: 'Septiembre', amount: 6000000 },
            { month: 'Octubre', amount: 8500000 },
            { month: 'Noviembre', amount: 7000000 },
            { month: 'Diciembre', amount: 12000000 },
            { month: 'Enero', amount: 8500000 }
        ],
        avatar: 'LG'
    },
    {
        id: 's2', name: 'Andrés Felipe', role: 'Asesor Junior', branch: 'Tienda Principal',
        total_sales: 12400000, sales_today: 450000, sales_month: 3200000, last_month_sales: 3500000,
        channels: { web: false, social: true, separados: true, in_store: true },
        history: [
            { month: 'Agosto', amount: 2100000 },
            { month: 'Septiembre', amount: 3000000 },
            { month: 'Octubre', amount: 2800000 },
            { month: 'Noviembre', amount: 4500000 },
            { month: 'Diciembre', amount: 5200000 },
            { month: 'Enero', amount: 3200000 }
        ],
        avatar: 'AF'
    }
];

export default function VendedoresPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [filterMonth, setFilterMonth] = useState('Enero');
    const [availableBranches, setAvailableBranches] = useState<string[]>(['Tienda Principal']);
    const [userToDelete, setUserToDelete] = useState<Seller | null>(null);
    
    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // --- LÓGICA DE ORDENAMIENTO Y PAGINACIÓN ---
    const { filteredSellers, totalPages } = useMemo(() => {
        // En este caso el backend devuelve los IDs, invertimos para que el más nuevo esté arriba
        const sorted = [...sellers].reverse();
        const total = Math.ceil(sorted.length / itemsPerPage);
        const sliced = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        return { filteredSellers: sliced, totalPages: total };
    }, [sellers, currentPage]);

    const [formData, setFormData] = useState({
        name: '',
        role: 'Asesor de Ventas',
        branch: 'Tienda Principal',
        web: false,
        social: true,
        separados: true,
        in_store: true
    });

    const loadData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:8000/sellers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSellers(data.map((s: any) => ({
                    ...s,
                    avatar: s.name.substr(0,2).toUpperCase(),
                    total_sales: 0, sales_today: 0, sales_month: 0, last_month_sales: 0,
                    channels: { web: true, social: true, separados: true, in_store: true },
                    history: MONTHS_LIST.map(m => ({ month: m, amount: 0 }))
                })));
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const handleCreate = async () => {
        if (!formData.name) return showToast("Escribe el nombre.", "error");
        try {
            const res = await fetch('http://localhost:8000/sellers', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                showToast("Asesor registrado con éxito", "success");
                await loadData();
                setIsCreateModalOpen(false);
                setFormData({ name: '', role: 'Asesor de Ventas', branch: 'Tienda Principal', web: false, social: true, separados: true, in_store: true });
            }
        } catch (e) { showToast("Error al conectar", "error"); }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            const res = await fetch(`http://localhost:8000/sellers/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const updated = sellers.filter(s => s.id !== userToDelete.id);
                setSellers(updated);
                showToast("Asesor eliminado del sistema", "success");
            } else {
                showToast("Error al eliminar asesor", "error");
            }
        } catch (error) {
            showToast("Error de conexión", "error");
        } finally {
            setUserToDelete(null);
        }
    };

    const TrendIndicator = ({ current, previous }: { current: number, previous: number }) => {
        if (previous === 0) return null;
        const diff = current - previous;
        const percent = (diff / previous) * 100;
        const isUp = diff >= 0;
        return (
            <div className={`flex items-center gap-1 text-[9px] font-black uppercase mt-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? '↑' : '↓'} {formatCurrency(Math.abs(diff))} ({Math.abs(percent).toFixed(1)}%)
            </div>
        );
    };

    const selectedMonthSales = useMemo(() => {
        if (!selectedSeller || !selectedSeller.history) return 0;
        const data = selectedSeller.history.find(h => h.month === filterMonth);
        return data ? data.amount : 0;
    }, [selectedSeller, filterMonth]);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Equipo de Ventas</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona tus asesores y analiza su crecimiento comercial.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">+ Registrar Asesor</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSellers.map((seller) => (
                    <div key={seller.id} onClick={() => setSelectedSeller(seller)} className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                        {/* Botón Eliminar Flotante */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setUserToDelete(seller); }}
                            className="absolute top-6 right-6 h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-300 hover:text-rose-500 hover:border-rose-100 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 z-20"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="h-20 w-20 bg-purple-50 rounded-3xl flex items-center justify-center text-2xl font-black text-purple-600 mb-4 shadow-inner group-hover:scale-110 transition-transform duration-500">{seller.avatar}</div>
                            <h3 className="text-xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">{seller.name}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{seller.role}</p>
                            <div className="w-full mt-8 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                                <div className="text-left"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Este Mes</p><p className="text-sm font-black text-gray-900">{formatCurrency(seller.sales_month)}</p><TrendIndicator current={seller.sales_month} previous={seller.last_month_sales} /></div>
                                <div className="text-right flex flex-col items-end"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hoy</p><p className="text-sm font-black text-purple-600">{formatCurrency(seller.sales_today)}</p></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Página {currentPage} de {totalPages}</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={14} className="inline mr-1"/> Anterior
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 disabled:opacity-30 transition-all"
                        >
                            Siguiente <ChevronRight size={14} className="inline ml-1"/>
                        </button>
                    </div>
                </div>
            )}

            {/* 3. Comparativa Brutal (Ranking) */}
            <div className="bg-white p-12 rounded-[3rem] border border-gray-50 shadow-sm space-y-10">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Comparativa de Desempeño</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Ranking de Facturación Mensual</p>
                </div>
                <div className="space-y-6">
                    {sellers.sort((a,b) => b.sales_month - a.sales_month).map((s, i) => {
                        const max = Math.max(...sellers.map(x => x.sales_month)) || 1;
                        const width = (s.sales_month / max) * 100;
                        return (
                            <div key={s.id} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-gray-400">0{i+1}</span>
                                        <p className="text-sm font-black text-gray-900">{s.name}</p>
                                    </div>
                                    <p className="text-xs font-black text-purple-600">{formatCurrency(s.sales_month)} <span className="text-gray-400 font-bold ml-1">este mes</span></p>
                                </div>
                                <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden flex">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${width}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DETALLE PROFUNDO */}
            {selectedSeller && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-purple-600 text-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-lg">{selectedSeller.avatar}</div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedSeller.name}</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{selectedSeller.role} · {selectedSeller.branch}</p>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedSeller(null); setFilterMonth('Enero'); }} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-gray-50/20 custom-scrollbar">
                            {/* KPIs Rápidos y Filtro de Mes */}
                            <div className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Consulta Mensual Detallada</h3>
                                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                                        <span className="text-[9px] font-black text-gray-400 uppercase ml-3">Ver mes:</span>
                                        <select 
                                            value={filterMonth}
                                            onChange={(e) => setFilterMonth(e.target.value)}
                                            className="bg-transparent text-xs font-black text-purple-600 outline-none px-3 py-1 cursor-pointer"
                                        >
                                            {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-center relative overflow-hidden group">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Ventas en {filterMonth}</p>
                                        <p className="text-3xl font-black text-purple-600 relative z-10">{formatCurrency(selectedMonthSales)}</p>
                                        <div className="absolute right-0 bottom-0 p-4 opacity-5 text-5xl group-hover:scale-110 transition-transform">📊</div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Promedio Diario ({filterMonth})</p>
                                        <p className="text-3xl font-black text-gray-900">{formatCurrency(selectedMonthSales / 30)}</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Histórico</p>
                                        <p className="text-3xl font-black text-gray-900">{formatCurrency(selectedSeller.total_sales)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Gráfica de Barras con Montos Reales */}
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-8 flex flex-col">
                                <div className="flex justify-between items-start">
                                    <div><h3 className="text-xl font-black text-gray-900 tracking-tight">Historial de Facturación</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Comparativa de los últimos 6 meses</p></div>
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">Tendencia Positiva</span>
                                </div>
                                <div className="flex-1 flex items-end justify-between gap-4 px-4 min-h-[200px]">
                                    {(selectedSeller?.history || []).map((h, i) => {
                                        const max = Math.max(...(selectedSeller?.history || []).map(x => x.amount)) || 1;
                                        const height = (h.amount / max) * 100;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                                <div className="w-full relative h-40 flex items-end justify-center">
                                                    <div 
                                                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-1000 ${h.month === filterMonth ? 'bg-purple-600 shadow-lg shadow-purple-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}
                                                        style={{ height: `${height}%` }}
                                                    ></div>
                                                    {/* Tooltip de monto real */}
                                                    <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{formatCurrency(h.amount)}</div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase ${h.month === filterMonth ? 'text-purple-600' : 'text-gray-400'}`}>{h.month.substr(0, 3)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Canales y Reconocimiento */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Canales Operativos</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'web', label: 'Venta Web', icon: '🌐', active: selectedSeller.channels.web },
                                            { id: 'social', label: 'Redes', icon: '📱', active: selectedSeller.channels.social },
                                            { id: 'separados', label: 'Separados', icon: '✨', active: selectedSeller.channels.separados },
                                            { id: 'in_store', label: 'Sala', icon: '🏪', active: selectedSeller.channels.in_store }
                                        ].map(c => (
                                            <div key={c.id} className={`flex items-center gap-3 p-4 rounded-2xl border ${c.active ? 'bg-purple-50 border-purple-100 text-purple-700' : 'bg-gray-50 border-transparent text-gray-400 opacity-50'}`}>
                                                <span className="text-base">{c.icon}</span><span className="text-[10px] font-black uppercase">{c.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-10 rounded-[3rem] text-white flex flex-col justify-center shadow-xl relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="text-3xl mb-4">🏆</div>
                                        <h4 className="text-xl font-black tracking-tight">Status: Top Performer</h4>
                                        <p className="text-gray-400 text-sm mt-2 font-medium leading-relaxed">Lorena ha mantenido una facturación superior a los <span className="text-purple-400 font-bold">$7.000.000</span> mensuales de forma consistente durante el último trimestre.</p>
                                    </div>
                                    <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-5 rotate-12">✨</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL REGISTRAR ASESOR - DISEÑO PREMIUM */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-visible relative"
                    >
                        {/* Header Oscuro Glass */}
                        <div className="bg-gray-900 p-8 text-white relative rounded-t-[3rem]">
                            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all active:scale-90">
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Nuevo Asesor</h2>
                                    <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest mt-1">Sincronización de Equipo</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-8 overflow-visible">
                            <div className="space-y-6 overflow-visible">
                                {/* Nombre */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                    <div className="relative group">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-purple-600 transition-colors" size={18} />
                                        <input 
                                            type="text" 
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Ej: Carolina Herrera"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                {/* Cargo y Sucursal */}
                                <div className="grid grid-cols-2 gap-6 overflow-visible">
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo / Rol</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 border-2 border-transparent hover:border-purple-100 rounded-2xl outline-none text-xs font-bold transition-all appearance-none cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={16} className="text-purple-600" />
                                                {formData.role}
                                            </div>
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isRoleDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[1100] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                {['Asesor de Ventas', 'Líder de Tienda', 'Gestor de Inventario'].map((role) => (
                                                    <button 
                                                        key={role}
                                                        type="button"
                                                        onClick={() => { setFormData({...formData, role}); setIsRoleDropdownOpen(false); }}
                                                        className="w-full px-5 py-3 text-left text-[11px] font-black uppercase text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                                                    >
                                                        {role}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sucursal</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 border-2 border-transparent hover:border-purple-100 rounded-2xl outline-none text-xs font-bold transition-all appearance-none cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-purple-600" />
                                                {formData.branch}
                                            </div>
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isBranchDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isBranchDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[1100] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                {availableBranches.map((branch) => (
                                                    <button 
                                                        key={branch}
                                                        type="button"
                                                        onClick={() => { setFormData({...formData, branch}); setIsBranchDropdownOpen(false); }}
                                                        className="w-full px-5 py-3 text-left text-[11px] font-black uppercase text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <MapPin size={12} className="opacity-30" />
                                                        {branch}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Canales de Venta */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Canales Permitidos</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'web', label: 'Venta Web', icon: <Globe size={14}/> },
                                            { id: 'social', label: 'Redes Sociales', icon: <Smartphone size={14}/> },
                                            { id: 'separados', label: 'Separados (IA)', icon: <Package size={14}/> },
                                            { id: 'in_store', label: 'Venta en Sala', icon: <Store size={14}/> }
                                        ].map((canal) => {
                                            const isActive = formData[canal.id as keyof typeof formData] as boolean;
                                            return (
                                                <button 
                                                    key={canal.id}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, [canal.id]: !isActive})}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-100 text-gray-400 grayscale opacity-60'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {canal.icon}
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">{canal.label}</span>
                                                    </div>
                                                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'bg-purple-600 border-purple-600' : 'border-gray-200'}`}>
                                                        {isActive && <Check size={10} className="text-white" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleCreate}
                                    className="flex-[2] py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} />
                                    Confirmar Registro
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Modal de Confirmación de Eliminación */}
            {userToDelete && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center relative overflow-hidden"
                    >
                        <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">¿Eliminar Asesor?</h3>
                        <p className="text-gray-500 text-sm mt-3 font-medium leading-relaxed">
                            Vas a eliminar a <span className="font-bold text-gray-900">{userToDelete.name}</span>. Esta acción borrará sus registros de comisiones y metas.
                        </p>
                        
                        <div className="flex flex-col gap-3 mt-10">
                            <button 
                                onClick={confirmDelete} 
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95"
                            >
                                Confirmar Eliminación
                            </button>
                            <button 
                                onClick={() => setUserToDelete(null)} 
                                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
