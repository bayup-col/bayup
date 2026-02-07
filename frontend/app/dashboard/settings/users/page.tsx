"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Shield, Mail, X, Check, Settings, Trash2, Lock, Edit3, 
  ChevronDown, UserCircle2, Briefcase, Truck, DollarSign, LayoutDashboard, 
  Sparkles, Package, Loader2, AlertTriangle, History as LucideHistory, 
  Filter, Search, Bot, ArrowUpRight, Medal, Activity, CheckCircle2, 
  ShieldCheck, Zap, Target, Rocket, ShieldAlert, Crown, Plus, RefreshCw, 
  Info, Calendar, RotateCcw, TrendingUp, BarChart3, ArrowDownRight, Clock, Smartphone,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { userService } from '@/lib/api';

// --- INTERFACES ---
interface StaffMember {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: 'Activo' | 'Invitado' | 'Suspendido';
    last_active?: string;
    created_at?: string;
    payroll_active: boolean;
}

export default function StaffPage() {
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    
    // UI STATES
    const [activeTab, setActiveTab] = useState<'miembros' | 'roles' | 'auditoria'>('miembros');
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [filterRole, setFilterRole] = useState<string>("all");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // DATA STATES
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [customRoles, setCustomRoles] = useState<any[]>([]);
    const [currentUserPlan, setCurrentUserPlan] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    
    // MODAL STATES
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    const [userToDelete, setUserToDelete] = useState<StaffMember | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<any>(null);
    const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string | null>(null);
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

    // FORM STATES
    const [formData, setFormData] = useState({
        name: '', email: '', role: 'admin_tienda', status: 'Invitado' as any, payroll_active: true
    });

    const modules = [
        { id: 'inicio', label: 'Dashboard / Inicio', icon: <LayoutDashboard size={16}/> },
        { id: 'facturacion', label: 'Facturación / POS', icon: <DollarSign size={16}/> },
        { id: 'productos', label: 'Inventario / Productos', icon: <Package size={16}/> },
        { id: 'pedidos', label: 'Pedidos / Operación', icon: <Truck size={16}/> },
        { id: 'clientes', label: 'Clientes / Cartera', icon: <Users size={16}/> },
        { id: 'marketing', label: 'Marketing / IA', icon: <Sparkles size={16}/> },
        { id: 'configuracion', label: 'Configuraciones', icon: <Settings size={16}/> },
    ];

    const baseRoles = [
        { id: 'admin_tienda', label: 'Administrador', icon: <ShieldCheck size={14} />, desc: 'Acceso total al sistema' },
        { id: 'editor', label: 'Editor', icon: <Edit3 size={14} />, desc: 'Contenido y productos' },
        { id: 'logistica', label: 'Logística', icon: <Truck size={14} />, desc: 'Pedidos y stock' },
        { id: 'vendedor', label: 'Vendedor', icon: <DollarSign size={14} />, desc: 'Ventas y clientes' }
    ];

    // --- COMPONENTE SELECT PREMIUM ---
    const PremiumSelect = ({ 
        label, value, onChange, options, icon: Icon, openUp = false
    }: { 
        label: string, value: string, onChange: (val: string) => void, 
        options: { id: string, label: string, icon?: any }[], icon: any, openUp?: boolean
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find(o => o.id === value);
        return (
            <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
                <div className="relative">
                    <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full pl-14 p-5 bg-gray-50 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${isOpen ? 'border-[#004d4d] bg-white shadow-xl' : 'border-transparent hover:border-[#004d4d]/20 shadow-inner'}`}>
                        <div className="flex items-center gap-3"><Icon className={`absolute left-5 transition-all duration-300 ${isOpen ? 'text-[#004d4d]' : 'text-gray-300'}`} size={18}/><span className={`text-sm font-bold transition-colors ${isOpen ? 'text-[#004d4d]' : 'text-slate-700'}`}>{selectedOption?.label || 'Seleccionar...'}</span></div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-[#004d4d]' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {isOpen && (
                            <>
                                <div className="fixed inset-0 z-[1001]" onClick={() => setIsOpen(false)} />
                                <motion.div initial={{ opacity: 0, y: openUp ? -10 : 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: openUp ? -10 : 10, scale: 0.98 }} className={`absolute left-0 right-0 p-2 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl z-[1002] overflow-hidden ring-1 ring-black/5 ${openUp ? 'bottom-full mb-3' : 'mt-3'}`}>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-1">
                                        {options.map((opt) => (
                                            <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); }} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${value === opt.id ? 'bg-[#004d4d] text-white shadow-lg' : 'hover:bg-[#00f2ff]/5 text-slate-600 hover:text-[#004d4d]'}`}>
                                                <div className="flex items-center gap-3 overflow-hidden"><div className={`transition-transform duration-300 ${value === opt.id ? 'text-[#00f2ff]' : 'text-gray-400'}`}>{opt.icon || <Shield size={14} />}</div><span className="text-[11px] font-black uppercase tracking-tight truncate">{opt.label}</span></div>
                                                {value === opt.id && <Check size={14} className="text-[#00f2ff]" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    };

    const allRolesOptions = useMemo(() => {
        return customRoles.map(cr => {
            const base = baseRoles.find(br => br.id === cr.name);
            return { id: cr.name, label: base?.label || cr.name, icon: base?.icon || <Shield size={14} /> };
        });
    }, [customRoles]);

    const TiltCard = ({ children }: { children: React.ReactNode }) => {
        const [rotateX, setRotateX] = useState(0);
        const [rotateY, setRotateY] = useState(0);
        const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            const card = e.currentTarget; const box = card.getBoundingClientRect();
            const centerX = box.width / 2; const centerY = box.height / 2;
            setRotateX((e.clientY - box.top - centerY) / 7); setRotateY((centerX - (e.clientX - box.left)) / 7);
            setGlarePos({ x: ((e.clientX - box.left)/box.width)*100, y: ((e.clientY - box.top)/box.height)*100, opacity: 0.3 });
        };
        return (
            <motion.div onMouseMove={handleMouseMove} onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlarePos(p => ({...p, opacity: 0})); }} animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.05 : 1 }} transition={{ type: "spring", stiffness: 250, damping: 20 }} style={{ transformStyle: "preserve-3d", perspective: "1000px" }} className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/80 shadow-2xl flex flex-col justify-between group relative overflow-hidden h-full">
                <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ opacity: glarePos.opacity, background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.9) 0%, transparent 50%)`, zIndex: 1 }} />
                <div style={{ transform: "translateZ(80px)", position: "relative", zIndex: 2 }}>{children}</div>
                <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#00f2ff]/10 blur-[60px] rounded-full pointer-events-none" />
            </motion.div>
        );
    };

    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const staffData = await userService.getAll(token).catch(() => []);
            const rolesData = await userService.getRoles(token).catch(() => []);
            const meData = await userService.getMe(token).catch(() => ({ plan: { name: 'Pro' } }));
            const logsData = await userService.getLogs(token).catch(() => []);
            setCurrentUserPlan(meData.plan); setLogs(logsData);
            if (staffData && Array.isArray(staffData)) {
                setStaff(staffData.map((u: any) => ({
                    id: u.id, full_name: u.full_name || 'Usuario', email: u.email, role: u.role, status: u.status || 'Activo', last_active: u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Sin actividad', created_at: u.created_at || '2026-01-01', payroll_active: true
                })));
            }
            if (rolesData && Array.isArray(rolesData)) setCustomRoles(rolesData);
        } catch (error) { console.error(error); }
        finally { setIsLoading(false); }
    }, [token]);

    useEffect(() => { if (isAuthenticated && token) fetchData(); }, [isAuthenticated, token, fetchData]);

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === "all" || s.role === filterRole;
            let matchesDate = true;
            if (dateRange.start && dateRange.end && s.created_at) {
                const d = new Date(s.created_at).getTime();
                matchesDate = d >= new Date(dateRange.start).getTime() && d <= new Date(dateRange.end).getTime();
            }
            return matchesSearch && matchesRole && matchesDate;
        });
    }, [staff, searchTerm, filterRole, dateRange]);

    const handleSaveMember = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("BOTÓN PRESIONADO: Iniciando proceso de guardado...");
        
        if (generatedPassword) { 
            console.log("Limpiando contraseña generada y cerrando modal.");
            setIsMemberModalOpen(false); 
            setGeneratedPassword(null); 
            return; 
        }
        
        setIsSaving(true);
        try {
            if (editingMember) {
                console.log("Editando miembro existente:", editingMember.email);
                await userService.updateDetails(token!, { email: formData.email, new_role: formData.role, full_name: formData.name, status: formData.status });
                showToast("Miembro actualizado", "success"); 
                setIsMemberModalOpen(false);
            } else {
                console.log("Creando nuevo miembro...");
                const tempPassword = Math.random().toString(36).slice(-10) + "Aa1!";
                console.log("Datos a enviar:", { email: formData.email, name: formData.name, role: formData.role });
                
                const response = await userService.create(token!, { 
                    email: formData.email.toLowerCase().trim(), 
                    full_name: formData.name.trim(), 
                    password: tempPassword, 
                    role: formData.role, 
                    status: formData.status 
                });
                
                console.log("RESPUESTA DEL SERVIDOR:", response);
                setGeneratedPassword(tempPassword); 
                showToast("Invitación enviada", "success");
            }
            await fetchData();
        } catch (error: any) { 
            console.error("ERROR CRÍTICO AL GUARDAR:", error);
            showToast(error.message || "Error al procesar la solicitud", "error"); 
        }
        finally { 
            console.log("Proceso finalizado.");
            setIsSaving(false); 
        }
    };

    const handleOpenMemberModal = (member: StaffMember | null = null) => {
        console.log("CLICK DETECTADO: Abriendo modal de miembro...");
        setGeneratedPassword(null);
        if (member) {
            setEditingMember(member); setFormData({ name: member.full_name, email: member.email, role: member.role, status: member.status, payroll_active: member.payroll_active });
        } else {
            setEditingMember(null); setFormData({ name: '', email: '', role: 'vendedor', status: 'Invitado', payroll_active: true });
        }
        setIsMemberModalOpen(true);
    };

    const handleTogglePermission = (moduleId: string) => {
        if (!selectedRoleForPerms) return;
        setCustomRoles(prev => prev.map(role => {
            if (role.id === selectedRoleForPerms) {
                return { ...role, permissions: { ...role.permissions, [moduleId]: !role.permissions[moduleId] } };
            }
            return role;
        }));
    };

    const handleSaveRolePermissions = async () => {
        const roleToSave = customRoles.find(r => r.id === selectedRoleForPerms);
        if (!roleToSave) return;
        setIsSaving(true);
        try {
            await userService.updateRole(token!, selectedRoleForPerms!, { name: roleToSave.name, permissions: roleToSave.permissions });
            showToast("Permisos actualizados", "success"); await fetchData();
        } catch (e) { showToast("Error", "error"); }
        finally { setIsSaving(false); }
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { id: 'total', label: 'Total Staff', value: `${staff.length}/${currentUserPlan?.name === 'Free' ? 1 : 10}`, sub: 'Miembros activos', icon: <Users size={20}/>, color: 'text-[#004d4d]' },
                { id: 'online', label: 'En Línea', value: staff.filter(s => s.status === 'Activo').length, sub: 'Sesiones live', icon: <Activity size={20}/>, color: 'text-emerald-500' },
                { id: 'roles', label: 'Roles Activos', value: customRoles.length, sub: 'Estructura RBAC', icon: <ShieldCheck size={20}/>, color: 'text-[#00f2ff]' },
                { id: 'invitaciones', label: 'Invitaciones', value: staff.filter(s => s.status === 'Invitado').length, sub: 'Pendientes', icon: <Mail size={20}/>, color: 'text-amber-500' },
            ].map((kpi, i) => (
                <div key={i} onClick={() => setSelectedKPI(kpi.id)} className="cursor-pointer h-full">
                    <TiltCard>
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>{kpi.icon}</div>
                            <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg">Stats</span>
                        </div>
                        <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3><p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p></div>
                    </TiltCard>
                </div>
            ))}
        </div>
    );

    const renderMiembros = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="w-full max-w-[1100px] mx-auto flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm focus-within:shadow-xl transition-all relative z-30">
                <div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input type="text" placeholder="Buscar por nombre, email o cargo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" /></div>
                <div className="flex items-center gap-1">
                    <div className="relative"><motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}><Filter size={18}/> <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Cargo</motion.span>}</AnimatePresence></motion.button><AnimatePresence>{isFilterMenuOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"><button onClick={() => { setFilterRole('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[10px] font-black uppercase hover:bg-gray-50">Todos</button></motion.div>}</AnimatePresence></div>
                    <div className="relative group/date"><motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${dateRange.start ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}><Calendar size={18}/> <AnimatePresence>{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Fechas</motion.span>}</AnimatePresence></motion.button><div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 scale-95 pointer-events-none group-hover/date:opacity-100 group-hover/date:scale-100 group-hover/date:pointer-events-auto transition-all z-50 flex gap-2"><input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] outline-none"/><input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] outline-none"/><button onClick={() => setDateRange({start:'', end:''})} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><RotateCcw size={14}/></button></div></div>
                    <button 
                        onClick={() => {
                            console.log("BOTÓN INVITAR PRESIONADO");
                            handleOpenMemberModal();
                        }} 
                        className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 group"
                    >
                        <UserPlus size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform"/>
                        <span className="text-[10px] font-black uppercase">Invitar</span>
                    </button>
                </div>
            </div>
            <div className="px-4 space-y-4">
                {filteredStaff.map((member) => (
                    <motion.div key={member.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="flex items-center gap-6 flex-1"><div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-xl font-black shadow-2xl relative">{member.full_name.charAt(0)}{member.status === 'Activo' && <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white"></div>}</div><div><div className="flex items-center gap-3"><h4 className="text-xl font-black text-gray-900 tracking-tight">{member.full_name}</h4><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${member.status === 'Activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{member.status}</span></div><p className="text-sm font-bold text-[#004d4d] mt-1 italic">{member.email}</p></div></div>
                        <div className="flex items-center gap-12 px-10 border-x border-gray-50"><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Nómina Activa</p><div className={`h-6 w-12 rounded-full relative flex items-center px-1 transition-all ${member.payroll_active ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`h-4 w-4 bg-white rounded-full shadow transition-all ${member.payroll_active ? 'translate-x-6' : 'translate-x-0'}`}></div></div></div><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Última Actividad</p><p className="text-xs font-bold text-gray-500">{member.last_active}</p></div></div>
                        <div className="flex items-center gap-3"><button onClick={() => handleOpenMemberModal(member)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center shadow-inner"><Edit3 size={18}/></button><button onClick={() => setUserToDelete(member)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 flex items-center justify-center shadow-inner"><Trash2 size={18}/></button></div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderAuditoria = () => (
        <div className="px-4 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-white/40 p-8 rounded-[3rem] border border-white/60 shadow-sm mb-10"><div className="flex items-center gap-4"><div className="h-12 w-12 bg-[#004d4d]/5 text-[#004d4d] rounded-2xl flex items-center justify-center"><LucideHistory size={24} /></div><div><h3 className="text-xl font-black text-[#004d4d] uppercase italic">Auditoría de Staff</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Control de accesos y cambios</p></div></div><button onClick={fetchData} className="h-10 px-4 bg-white border border-gray-100 rounded-xl text-[9px] font-black hover:bg-gray-50 transition-all flex items-center gap-2"><RefreshCw size={14} /> Actualizar</button></div>
            <div className="relative space-y-6 before:absolute before:left-[27px] before:top-4 before:bottom-0 before:w-0.5 before:bg-gray-100">{logs.map((log, i) => (
                <div key={log.id} className="relative pl-16 group"><div className={`absolute left-0 top-0 h-14 w-14 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center z-10 transition-all group-hover:scale-110 ${log.action === 'DELETE_USER' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>{log.action === 'DELETE_USER' ? <Trash2 size={20} /> : <Edit3 size={20} />}</div><div className="bg-white/60 p-6 rounded-[2rem] border border-white shadow-sm group-hover:bg-white transition-all"><div className="flex justify-between items-center"><div><p className="text-[10px] font-black text-[#004d4d] uppercase">{log.user_name}</p><p className="text-sm font-bold text-gray-800">{log.detail}</p></div><div className="text-right"><p className="text-[10px] font-black text-gray-400">{new Date(log.created_at).toLocaleDateString()}</p></div></div></div></div>
            ))}</div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div><div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Talento Humano</span></div><h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Miembros del <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Staff</span></h1><p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Control de accesos y <span className="font-bold text-[#001A1A]">seguridad de nómina</span>.</p></div>
                <div className="flex items-center gap-4 bg-white/60 p-4 rounded-3xl border border-white shadow-xl"><div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff]"><Shield size={22} /></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tienda ID</p><p className="text-sm font-black text-gray-900 uppercase">Bay-2026-STF</p></div></div>
            </div>
            {renderKPIs()}
            <div className="flex items-center justify-center gap-6 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto relative">
                    {[ { id: 'miembros', label: 'Miembros', icon: <Users size={14}/> }, { id: 'roles', label: 'Roles & Permisos', icon: <ShieldCheck size={14}/> }, { id: 'auditoria', label: 'Historial', icon: <LucideHistory size={14}/> } ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all z-10 whitespace-nowrap ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{isActive && <motion.div layoutId="staffTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}{tab.icon} {tab.label}</button>
                        );
                    })}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all group"><Info size={20}/></button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {activeTab === 'miembros' && renderMiembros()}
                    {activeTab === 'roles' && (
                        <div className="px-4 space-y-10">
                            <div className="bg-white/40 p-10 rounded-[4rem] border border-white/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="space-y-4 max-w-xl text-center md:text-left"><div className="flex items-center justify-center md:justify-start gap-3"><ShieldCheck className="text-[#004d4d]" size={24}/><h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Control de Accesos (RBAC)</h3></div><p className="text-sm font-medium text-gray-500 leading-relaxed italic">&quot;Define permisos granulares por módulo.&quot;</p></div>
                                <button onClick={() => setIsCreatingRole(true)} className="h-14 px-8 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><Plus size={18} className="text-[#00f2ff]"/> Nuevo Rol</button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4 space-y-4">{customRoles.map((role) => (<button key={role.id} onClick={() => setSelectedRoleForPerms(role.id)} className={`w-full p-8 rounded-[2.5rem] border transition-all text-left flex flex-col gap-4 relative overflow-hidden ${selectedRoleForPerms === role.id ? 'bg-[#001a1a] border-[#00f2ff] text-white shadow-2xl' : 'bg-white border-gray-100 text-gray-900 hover:border-[#004d4d]/20 shadow-sm'}`}><div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${selectedRoleForPerms === role.id ? 'bg-white/10 text-[#00f2ff]' : 'bg-[#004d4d]/5 text-[#004d4d]'}`}><Shield size={24} /></div><div className="relative z-10"><h4 className="text-lg font-black uppercase tracking-tighter italic">{role.name}</h4><p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedRoleForPerms === role.id ? 'text-white/40' : 'text-gray-400'}`}>Jerarquía Corporativa</p></div></button>))}</div>
                                <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-10 relative overflow-hidden">
                                    {!selectedRoleForPerms ? (<div className="h-[400px] flex flex-col items-center justify-center text-gray-300 gap-6 opacity-50"><Lock size={80} strokeWidth={1} /><p className="text-xs font-black uppercase tracking-[0.3em] text-center">Selecciona un rol</p></div>) : (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 h-full flex flex-col">
                                            <div className="flex items-center justify-between border-b border-gray-50 pb-8"><h3 className="text-2xl font-black text-gray-900 uppercase italic">Privilegios</h3></div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-4">{modules.map((mod) => { const isActive = customRoles.find(r => r.id === selectedRoleForPerms)?.permissions[mod.id] !== false; return (<div key={mod.id} className="p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-[#004d4d]/10 transition-all flex items-center justify-between group"><div className="flex items-center gap-4"><div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-white text-[#004d4d] shadow-sm' : 'bg-gray-100 text-gray-300'}`}>{mod.icon}</div><span className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>{mod.label}</span></div><div onClick={() => handleTogglePermission(mod.id)} className={`relative inline-flex h-7 w-12 items-center rounded-full cursor-pointer px-1 transition-all duration-500 ${isActive ? 'bg-[#004d4d]' : 'bg-gray-200'}`}><div className={`h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-500 ${isActive ? 'translate-x-5' : 'translate-x-0'}`}></div></div></div>); })}</div>
                                            <div className="pt-8 border-t border-gray-50"><button onClick={handleSaveRolePermissions} disabled={isSaving} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black flex items-center justify-center gap-3">{isSaving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={18} className="text-[#00f2ff]"/>} Sincronizar Permisos</button></div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'auditoria' && renderAuditoria()}
                </motion.div>
            </AnimatePresence>

            {/* MODAL DETALLE KPI */}
            <AnimatePresence>
                {selectedKPI && (
                    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedKPI(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-white">
                            <div className="p-10 bg-gray-900 text-white relative">
                                <button onClick={() => setSelectedKPI(null)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:text-rose-500 transition-all"><X size={20}/></button>
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedKPI === 'total' ? 'Capacidad' : selectedKPI === 'online' ? 'Live' : selectedKPI === 'roles' ? 'RBAC Map' : 'Tramites'}</h3>
                                <p className="text-[10px] font-black uppercase text-[#00f2ff] mt-2 tracking-[0.3em]">Business Intelligence Bayup</p>
                            </div>
                            <div className="p-10 space-y-8">
                                {selectedKPI === 'total' && (<div className="space-y-6"><div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Crecimiento</p><p className="text-xl font-black text-emerald-600">+12.5%</p></div><div className="p-6 bg-gray-50 rounded-2xl"><p className="text-xs font-medium italic">"El 100% de tu staff está vinculado a la nómina central."</p></div></div>)}
                                {selectedKPI === 'online' && (<div className="space-y-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Actividad</p><div className="space-y-3">{staff.filter(s => s.status === 'Activo').slice(0, 3).map((s, i) => (<div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"><div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div><span className="text-xs font-bold">{s.full_name}</span></div><span className="text-[10px] font-black text-gray-400 uppercase">Live</span></div>))}</div></div>)}
                                {selectedKPI === 'roles' && (<div className="space-y-6"><div className="grid grid-cols-2 gap-4">{baseRoles.map(r => (<div key={r.id} className="p-5 bg-gray-50 rounded-3xl text-center"><p className="text-[9px] font-black uppercase mb-2">{r.label}</p><p className="text-2xl font-black">{staff.filter(s => s.role === r.id).length}</p></div>))}</div></div>)}
                                {selectedKPI === 'invitaciones' && (<div className="space-y-6"><div className="p-8 bg-amber-50 rounded-[2.5rem] text-center"><p className="text-3xl font-black text-amber-600">{staff.filter(s => s.status === 'Invitado').length}</p><p className="text-[10px] font-bold uppercase tracking-widest mt-1">Pendientes</p></div></div>)}
                                <button onClick={() => setSelectedKPI(null)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Cerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3">
                                <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg"><Bot size={24}/></div>
                                {[ {id:0, label:'Capital Humano', icon:<Users/>}, {id:1, label:'Seguridad RBAC', icon:<Shield/>}, {id:2, label:'Auditoría Live', icon:<LucideHistory/>}, {id:3, label:'Integración Nómina', icon:<DollarSign/>} ].map(step => (<button key={step.id} onClick={() => setActiveGuideStep(step.id)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-xl' : 'text-gray-500 hover:bg-white'}`}>{step.icon}<span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span></button>))}
                            </div>
                            <div className="flex-1 p-16 flex flex-col justify-between bg-white relative overflow-y-auto custom-scrollbar">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100]"><X size={24}/></button>
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Capital <span className="text-[#004D4D]">Humano</span></h2><p className="text-gray-500 text-lg font-medium leading-relaxed italic">&quot;Tu activo más valioso.&quot;</p><div className="grid grid-cols-2 gap-6"><div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm"><p className="text-[10px] font-black uppercase text-gray-400">Slots</p><p className="text-sm font-medium mt-2">Gestiona el límite según tu plan.</p></div></div></div>)}
                                    {activeGuideStep === 1 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase tracking-tighter">Seguridad <span className="text-[#004D4D]">RBAC</span></h2><p className="text-gray-500 text-lg font-medium italic">Control de Acceso Basado en Roles.</p><div className="relative p-10 bg-gray-900 rounded-[3.5rem] text-white overflow-hidden shadow-2xl"><div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={120}/></div><p className="text-xs font-medium text-gray-400 italic">"Define quién ve qué. Blindaje total de finanzas y base de datos."</p></div></div>)}
                                    {activeGuideStep === 3 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase tracking-tighter">Conexión <span className="text-[#004D4D]">Nómina</span></h2><p className="text-gray-500 text-lg font-medium italic">Integración financiera total.</p><div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100"><p className="text-xs font-medium text-emerald-800 italic">Cada miembro queda vinculado automáticamente al centro de costos de nómina central.</p></div></div>)}
                                </div>
                                <button onClick={() => setIsGuideOpen(false)} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase shadow-2xl mt-12">Entendido</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL REGISTRO MIEMBRO */}
            <AnimatePresence>
                {isMemberModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMemberModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white">
                            <div className="w-full md:w-[320px] bg-[#001a1a] text-white p-12 flex flex-col justify-between shrink-0"><div className="space-y-8"><div className="h-16 w-16 bg-[#00f2ff] rounded-2xl flex items-center justify-center text-[#001a1a] shadow-xl"><Rocket size={32} /></div><div className="space-y-4"><h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em] border-b border-white/10 pb-3">Perfil de Staff</h4><p className="text-sm font-medium opacity-70 italic">Delega responsabilidades de forma segura.</p></div></div></div>
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-white/80 sticky top-0 z-10"><h2 className="text-3xl font-black text-gray-900 italic uppercase">{editingMember ? 'Editar' : 'Invitar'}</h2><button onClick={() => setIsMemberModalOpen(false)} className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500"><X size={24}/></button></div>
                                <form onSubmit={handleSaveMember} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                                            <div className="relative">
                                                <UserCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-14 p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Corporativo</label>
                                            <div className="relative">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-14 p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <PremiumSelect 
                                            label="Rol Designado"
                                            value={formData.role}
                                            onChange={(val) => setFormData({...formData, role: val})}
                                            options={allRolesOptions.length > 0 ? allRolesOptions : baseRoles}
                                            icon={Shield}
                                        />
                                        <PremiumSelect 
                                            label="Estado Inicial"
                                            value={formData.status}
                                            onChange={(val) => setFormData({...formData, status: val as any})}
                                            options={[
                                                { id: 'Activo', label: 'Activo', icon: <Activity size={14} /> },
                                                { id: 'Invitado', label: 'Invitado', icon: <Mail size={14} /> },
                                                { id: 'Suspendido', label: 'Suspendido', icon: <ShieldAlert size={14} /> }
                                            ]}
                                            icon={Activity}
                                        />
                                    </div>

                                    {generatedPassword && (
                                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                                            <ShieldCheck className="text-emerald-600 shrink-0" size={20}/>
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Contraseña Temporal (Copiar ahora):</p>
                                                <code className="text-sm font-black text-[#004d4d] bg-white px-3 py-1 rounded-lg block text-center border border-emerald-100">{generatedPassword}</code>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botón de envío inyectado directamente en el flujo del formulario */}
                                    <div className="pt-6">
                                        <button 
                                            type="submit"
                                            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95"
                                        >
                                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={18} className="text-[#00f2ff]"/>}
                                            {generatedPassword ? 'Cerrar y Finalizar' : (editingMember ? 'Actualizar Cambios' : 'Enviar Invitación Ahora')}
                                        </button>
                                    </div>
                                </form>
                                <div className="p-10 border-t border-gray-50 bg-gray-50/30 flex gap-4 hidden">
                                    {/* Este bloque viejo lo ocultamos para no romper el diseño mientras probamos */}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {userToDelete && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUserToDelete(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center relative z-10 border border-white"><div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldAlert size={40} /></div><h3 className="text-xl font-black text-gray-900 uppercase italic">¿Revocar Acceso?</h3><p className="text-gray-500 text-sm mt-4 italic leading-relaxed">Estás por remover a **{userToDelete.full_name}**.</p><div className="flex flex-col gap-3 mt-10"><button onClick={async () => { await userService.delete(token!, userToDelete.id); fetchData(); setUserToDelete(null); showToast("Eliminado", "info"); }} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Eliminar Definitivamente</button><button onClick={() => setUserToDelete(null)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button></div></motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE STAFF PLATINUM */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            
                            {/* SIDEBAR TÁCTICO */}
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3">
                                <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"><Bot size={24}/></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004d4d] mb-4">Guía Maestro Staff</h3>
                                {[
                                    { id: 0, label: 'Capital Humano', icon: <Users size={16}/> },
                                    { id: 1, label: 'Seguridad RBAC', icon: <Shield size={16}/> },
                                    { id: 2, label: 'Auditoría Live', icon: <LucideHistory size={16}/> },
                                    { id: 3, label: 'Integración Nómina', icon: <DollarSign size={16}/> }
                                ].map(step => (
                                    <button 
                                        key={step.id} 
                                        onClick={() => setActiveGuideStep(step.id)} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-xl shadow-[#004d4d]/20' : 'text-gray-500 hover:bg-white'}`}
                                    >
                                        <div className={activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-300'}>{step.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                    </button>
                                ))}
                                <div className="mt-auto pt-8 border-t border-gray-100 px-2"><p className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em]">Bayup Financial Core v2.0</p></div>
                            </div>

                            {/* CONTENIDO ESTRATÉGICO VISUAL */}
                            <div className="flex-1 p-16 flex flex-col justify-between relative bg-white overflow-y-auto custom-scrollbar">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100]"><X size={24}/></button>
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Capital <span className="text-[#004D4D]">Humano</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">&quot;Tu activo más valioso requiere un control centralizado y eficiente.&quot;</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] mb-6 shadow-sm"><UserPlus size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Slots de Staff</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Gestiona el límite de miembros según tu plan. La escalabilidad es clave para el crecimiento.</p>
                                                </div>
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#00f2ff] mb-6 shadow-sm"><Zap size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Delegación Pro</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">&quot;Bayt sugiere: No operes solo. Delega tareas operativas para enfocarte en la estrategia.&quot;</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 1 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Seguridad <span className="text-[#004D4D]">RBAC</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Control de Acceso Basado en Roles para blindar tu información.</p>
                                            </div>
                                            <div className="relative p-10 bg-[#001A1A] rounded-[3.5rem] overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={120}/></div>
                                                <div className="space-y-6 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-[#00f2ff]/10 text-[#00f2ff] flex items-center justify-center border border-[#00f2ff]/20"><Lock size={20}/></div>
                                                        <p className="text-sm font-black uppercase tracking-widest text-[#00f2ff]">Privilegios Granulares</p>
                                                    </div>
                                                    <div className="h-px w-full bg-white/10"></div>
                                                    <div className="flex items-center gap-4 opacity-60">
                                                        <div className="h-10 w-10 rounded-xl bg-white/10 text-white flex items-center justify-center"><ShieldCheck size={20}/></div>
                                                        <p className="text-sm font-black uppercase tracking-widest">Protección de Datos</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 2 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Auditoría <span className="text-[#004D4D]">Live</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Trazabilidad total de cada acción realizada en la plataforma.</p>
                                            </div>
                                            <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 relative overflow-hidden">
                                                <div className="flex items-center gap-6 mb-8">
                                                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-lg shadow-gray-200/50"><LucideHistory size={28}/></div>
                                                    <div>
                                                        <p className="text-xl font-black text-gray-900">Registro Forense</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline de Operación</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all hover:shadow-md">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                                                        <p className="text-xs font-bold text-gray-600 leading-relaxed italic">&quot;Bayt analiza patrones de conexión inusuales. Si detectamos un inicio de sesión fuera de horario, recibirás una alerta inmediata.&quot;</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 flex justify-center opacity-30">
                                                    <BarChart3 size={60} strokeWidth={1}/>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 3 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Conexión <span className="text-[#004D4D]">Nómina</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Integración financiera total para el cumplimiento legal y contable.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex flex-col gap-4">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><ShieldCheck size={24}/></div>
                                                    <div><p className="text-[10px] font-black uppercase text-emerald-900 tracking-widest">Validación Salarial</p><p className="text-xs font-medium text-emerald-800 mt-2">Cada miembro queda vinculado automáticamente al centro de costos de nómina.</p></div>
                                                </div>
                                                <div className="p-8 bg-[#004D4D]/5 border border-[#004D4D]/10 rounded-[2.5rem] flex flex-col gap-4">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-sm"><CreditCard size={24}/></div>
                                                    <div><p className="text-[10px] font-black uppercase text-[#004d4d] tracking-widest">Seguridad Social</p><p className="text-xs font-medium text-gray-600 mt-2">Bayt monitorea que los aportes legales estén sincronizados.</p></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setIsGuideOpen(false)} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-2xl mt-12">Entendido, Continuar Gestión</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}
