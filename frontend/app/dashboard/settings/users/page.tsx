"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  X, 
  Check, 
  Settings, 
  Trash2,
  Lock,
  Edit3,
  ChevronDown,
  UserCircle2,
  Briefcase,
  Truck,
  DollarSign,
  LayoutDashboard,
  Sparkles,
  Package,
  Loader2,
  AlertTriangle,
  History as LucideHistory,
  Filter,
  Search,
  Bot,
  ArrowUpRight,
  Medal,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Target,
  Rocket,
  ShieldAlert,
  Crown,
  Plus,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { userService } from '@/lib/api';

interface StaffMember {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: 'Activo' | 'Invitado' | 'Suspendido';
    last_active?: string;
}

export default function StaffPage() {
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    
    // UI STATES
    const [activeTab, setActiveTab] = useState<'miembros' | 'roles' | 'auditoria'>('miembros');
    const [searchTerm, setSearchTerm] = useState("");
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

    // FORM STATES
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin_tienda',
        status: 'Invitado' as 'Activo' | 'Invitado' | 'Suspendido'
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
        label, 
        value, 
        onChange, 
        options, 
        icon: Icon 
    }: { 
        label: string, 
        value: string, 
        onChange: (val: string) => void, 
        options: { id: string, label: string, icon?: any }[],
        icon: any
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find(o => o.id === value);

        return (
            <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full pl-14 p-5 bg-gray-50 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                            isOpen ? 'border-[#004d4d] bg-white shadow-lg' : 'border-transparent hover:border-[#004d4d]/20 shadow-inner'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Icon className={`absolute left-5 transition-colors ${isOpen ? 'text-[#004d4d]' : 'text-gray-300'}`} size={18}/>
                            <span className="text-sm font-bold text-slate-700 truncate mr-4">{selectedOption?.label || 'Seleccionar...'}</span>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#004d4d]' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isOpen && (
                            <>
                                <div className="fixed inset-0 z-[1001]" onClick={() => setIsOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute left-0 right-0 mt-3 p-2 bg-white rounded-3xl border border-gray-100 shadow-2xl z-[1002] overflow-hidden"
                                >
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-1">
                                        {options.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    onChange(opt.id);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                                                    value === opt.id 
                                                    ? 'bg-[#004d4d] text-white' 
                                                    : 'hover:bg-gray-50 text-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {opt.icon && <span className={value === opt.id ? 'text-[#00f2ff]' : 'text-gray-400'}>{opt.icon}</span>}
                                                    <span className="text-xs font-bold uppercase tracking-tight truncate">{opt.label}</span>
                                                </div>
                                                {value === opt.id && <Check size={14} className="shrink-0 ml-2" />}
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

    // Combinación dinámica de Roles para el Selector
    const allRolesOptions = useMemo(() => {
        return customRoles.map(cr => {
            const base = baseRoles.find(br => br.id === cr.name);
            return {
                id: cr.name,
                label: base?.label || cr.name,
                icon: base?.icon || <Shield size={14} />
            };
        });
    }, [customRoles]);

    // FETCH DATA
    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [staffData, rolesData, meData, logsData] = await Promise.all([
                userService.getAll(token),
                userService.getRoles(token),
                userService.getMe(token),
                userService.getLogs(token)
            ]);
            
            setCurrentUserPlan(meData.plan);
            setLogs(logsData);
            
            setStaff(staffData.map((u: any) => ({
                id: u.id,
                full_name: u.full_name || 'Usuario',
                email: u.email,
                role: u.role,
                status: u.status || 'Activo',
                last_active: 'Hoy, 10:24 AM' // Mock
            })));

            if (rolesData.length === 0) {
                // Initialize default roles if empty
                const createdRoles = [];
                for (const r of baseRoles) {
                    const defaultPerms: any = {};
                    modules.forEach(m => defaultPerms[m.id] = true);
                    const newRole = await userService.createRole(token, { name: r.id, permissions: defaultPerms });
                    createdRoles.push(newRole);
                }
                setCustomRoles(createdRoles);
            } else {
                setCustomRoles(rolesData);
            }
        } catch (error) {
            showToast("Error al sincronizar el staff", "error");
        } finally {
            setIsLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        if (isAuthenticated && token) fetchData();
    }, [isAuthenticated, token, fetchData]);

    // FILTER LOGIC
    const filteredStaff = useMemo(() => {
        return staff.filter(s => 
            s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [staff, searchTerm]);

    // HANDLERS
    const handleOpenMemberModal = (member: StaffMember | null = null) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                name: member.full_name,
                email: member.email,
                role: member.role,
                status: member.status
            });
        } else {
            setEditingMember(null);
            setFormData({ name: '', email: '', role: 'vendedor', status: 'Invitado' });
        }
        setIsMemberModalOpen(true);
    };

    const handleSaveMember = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDACIÓN DE LÍMITE DE PLAN
        if (!editingMember && staff.length >= 3) {
            showToast("Límite de Staff alcanzado (Máximo 3 miembros en Plan Pro)", "error");
            return;
        }

        setIsSaving(true);
        try {
            if (editingMember) {
                await userService.updateDetails(token!, {
                    email: formData.email,
                    new_role: formData.role,
                    full_name: formData.name,
                    status: formData.status
                });
                showToast("Miembro actualizado", "success");
            } else {
                await userService.create(token!, {
                    email: formData.email.toLowerCase().trim(),
                    full_name: formData.name.trim(),
                    password: Math.random().toString(36).slice(-8) + "Aa1!",
                    role: formData.role,
                    status: formData.status
                });
                showToast("Invitación enviada", "success");
            }
            await fetchData();
            setIsMemberModalOpen(false);
        } catch (error: any) {
            showToast(error.message || "Error al procesar", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMember = async () => {
        if (!userToDelete) return;
        try {
            await userService.delete(token!, userToDelete.id);
            showToast("Miembro eliminado", "success");
            await fetchData();
            setUserToDelete(null);
        } catch (error: any) {
            showToast(error.message || "Error al eliminar", "error");
        }
    };

    const handleTogglePermission = (moduleId: string) => {
        if (!selectedRoleForPerms) return;
        setCustomRoles(prev => prev.map(role => {
            if (role.id === selectedRoleForPerms) {
                return {
                    ...role,
                    permissions: { ...role.permissions, [moduleId]: !role.permissions[moduleId] }
                };
            }
            return role;
        }));
    };

    const handleSaveRolePermissions = async () => {
        const roleToSave = customRoles.find(r => r.id === selectedRoleForPerms);
        if (!roleToSave) return;
        setIsSaving(true);
        try {
            await userService.updateRole(token!, selectedRoleForPerms!, {
                name: roleToSave.name,
                permissions: roleToSave.permissions
            });
            showToast("Permisos actualizados", "success");
            await fetchData();
        } catch (e) {
            showToast("Error al guardar permisos", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // RENDER COMPONENTS
    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Total Staff', value: `${staff.length}/3`, sub: 'Miembros activos', icon: <Users size={20}/>, color: 'text-[#004d4d]' },
                { label: 'En Línea', value: staff.filter(s => s.status === 'Activo').length, sub: 'Operando ahora', icon: <Activity size={20}/>, color: 'text-emerald-500' },
                { label: 'Roles Activos', value: customRoles.length, sub: 'Estructura RBAC', icon: <ShieldCheck size={20}/>, color: 'text-[#00f2ff]' },
                { label: 'Invitaciones', value: staff.filter(s => s.status === 'Invitado').length, sub: 'Pendientes', icon: <Mail size={20}/>, color: 'text-amber-500' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg">Live</span>
                    </div>
                    <div className="mt-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderMiembros = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                    />
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex items-center gap-3">
                    <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                        <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
                    </button>
                    <button onClick={() => handleOpenMemberModal()} className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                        <UserPlus size={18} className="text-[#00f2ff]"/> <span className="text-[10px] font-black uppercase tracking-widest">Invitar Miembro</span>
                    </button>
                </div>
            </div>

            {/* Staff List */}
            <div className="px-4 space-y-4">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
                        <Loader2 className="animate-spin text-[#004d4d]" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Terminal de Staff...</p>
                    </div>
                ) : filteredStaff.map((member) => (
                    <motion.div 
                        key={member.id} 
                        whileHover={{ x: 5 }} 
                        className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 group"
                    >
                        <div className="flex items-center gap-6 flex-1">
                            <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-xl font-black shadow-2xl relative">
                                {member.full_name.charAt(0)}
                                {member.status === 'Activo' && (
                                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white"></div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h4 className="text-xl font-black text-gray-900 tracking-tight">{member.full_name}</h4>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                        member.status === 'Activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        member.status === 'Invitado' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        'bg-rose-50 text-rose-600 border-rose-100'
                                    }`}>
                                        {member.status}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-[#004d4d] mt-1 italic">{member.email}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-12 px-10 border-x border-gray-50">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Rol Designado</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <Shield size={14} className="text-[#00f2ff]" />
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-tight">
                                        {baseRoles.find(r => r.id === member.role)?.label || member.role}
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Última Actividad</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <LucideHistory size={14} className="text-gray-300" />
                                    <span className="text-xs font-bold text-gray-500">{member.last_active}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => handleOpenMemberModal(member)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] hover:bg-[#004d4d]/5 flex items-center justify-center transition-all shadow-inner border border-transparent hover:border-[#004d4d]/10"><Edit3 size={18}/></button>
                            <button onClick={() => setUserToDelete(member)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all shadow-inner border border-transparent hover:border-rose-100"><Trash2 size={18}/></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        setIsSaving(true);
        try {
            const defaultPerms: any = {};
            modules.forEach(m => defaultPerms[m.id] = true);
            const newRole = await userService.createRole(token!, {
                name: newRoleName.trim(),
                permissions: defaultPerms
            });
            setCustomRoles([...customRoles, newRole]);
            setSelectedRoleForPerms(newRole.id);
            setIsCreatingRole(false);
            setNewRoleName("");
            showToast("Nuevo rol estratégico creado", "success");
        } catch (e) {
            showToast("Error al crear el rol", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        setIsSaving(true);
        try {
            await userService.deleteRole(token!, roleToDelete.id);
            showToast("Rol eliminado correctamente", "success");
            if (selectedRoleForPerms === roleToDelete.id) setSelectedRoleForPerms(null);
            await fetchData();
            setRoleToDelete(null);
        } catch (e) {
            showToast("Error al eliminar el rol", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const renderRoles = () => (
        <div className="px-4 space-y-10 animate-in fade-in duration-500">
            <div className="bg-white/40 p-10 rounded-[4rem] border border-white/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-4 max-w-xl text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3"><ShieldCheck className="text-[#004d4d]" size={24}/><h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Control de Accesos (RBAC)</h3></div>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed italic">"Define permisos granulares por módulo para proteger la integridad de tus datos comerciales."</p>
                </div>
                <button 
                    onClick={() => setIsCreatingRole(true)}
                    className="h-14 px-8 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all"
                >
                    <Plus size={18} className="text-[#00f2ff]"/> Nuevo Rol
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Role List */}
                <div className="lg:col-span-4 space-y-4">
                    {customRoles.map((role) => (
                        <div key={role.id} className="group relative">
                            <button 
                                onClick={() => setSelectedRoleForPerms(role.id)}
                                className={`w-full p-8 rounded-[2.5rem] border transition-all text-left flex flex-col gap-4 relative overflow-hidden ${
                                    selectedRoleForPerms === role.id 
                                    ? 'bg-[#001a1a] border-[#00f2ff] text-white shadow-2xl' 
                                    : 'bg-white border-gray-100 text-gray-900 hover:border-[#004d4d]/20'
                                }`}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${
                                        selectedRoleForPerms === role.id ? 'bg-white/10 text-[#00f2ff]' : 'bg-[#004d4d]/5 text-[#004d4d]'
                                    }`}>
                                        <Shield size={24} />
                                    </div>
                                    {selectedRoleForPerms === role.id && (
                                        <motion.div layoutId="activeRole" className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse" />
                                    )}
                                </div>
                                <div className="relative z-10">
                                    <h4 className="text-lg font-black uppercase tracking-tighter italic">{baseRoles.find(br => br.id === role.name)?.label || role.name}</h4>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedRoleForPerms === role.id ? 'text-white/40' : 'text-gray-400'}`}>
                                        {baseRoles.find(br => br.id === role.name)?.desc || 'Rol Personalizado'}
                                    </p>
                                </div>
                            </button>
                            
                            {!baseRoles.find(br => br.id === role.name) && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setRoleToDelete(role); }}
                                    className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white border border-transparent hover:border-white/20 z-20"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Permissions Grid */}
                <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-10 relative overflow-hidden">
                    {!selectedRoleForPerms ? (
                        <div className="h-[500px] flex flex-col items-center justify-center text-gray-300 gap-6 opacity-50">
                            <Lock size={80} strokeWidth={1} />
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-center">Selecciona un rol para<br/>editar sus privilegios</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 h-full flex flex-col">
                            <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 uppercase italic">Privilegios del Módulo</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Habilita o restringe el acceso a la terminal</p>
                                </div>
                                <div className="h-12 w-12 bg-[#004d4d]/5 text-[#004d4d] rounded-2xl flex items-center justify-center font-black italic">!</div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-4">
                                {modules.map((mod) => {
                                    const isActive = customRoles.find(r => r.id === selectedRoleForPerms)?.permissions[mod.id] !== false;
                                    return (
                                        <div key={mod.id} className="p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-[#004d4d]/10 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                                                    isActive ? 'bg-white text-[#004d4d] shadow-sm' : 'bg-gray-100 text-gray-300'
                                                }`}>
                                                    {mod.icon}
                                                </div>
                                                <span className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>
                                                    {mod.label}
                                                </span>
                                            </div>
                                            <div 
                                                onClick={() => handleTogglePermission(mod.id)} 
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full cursor-pointer px-1 transition-all duration-500 ${
                                                    isActive ? 'bg-[#004d4d]' : 'bg-gray-200'
                                                }`}
                                            >
                                                <div className={`h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-500 ${
                                                    isActive ? 'translate-x-5' : 'translate-x-0'
                                                }`}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-8 border-t border-gray-50 flex gap-4">
                                <button onClick={handleSaveRolePermissions} disabled={isSaving} className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={18} className="text-[#00f2ff]"/>}
                                    Sincronizar Permisos
                                </button>
                                <button className="px-10 py-5 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em]">Reset</button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderAuditoria = () => (
        <div className="px-4 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-white/40 p-8 rounded-[3rem] border border-white/60 shadow-sm mb-10">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#004d4d]/5 text-[#004d4d] rounded-2xl flex items-center justify-center">
                        <LucideHistory size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#004d4d] uppercase italic">Registro de Auditoría</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Historial completo de acciones tácticas</p>
                    </div>
                </div>
                <button onClick={fetchData} className="h-10 px-4 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
                    <RefreshCw size={14} /> Actualizar
                </button>
            </div>

            <div className="relative space-y-6 before:absolute before:left-[27px] before:top-4 before:bottom-0 before:w-0.5 before:bg-gray-100">
                {logs.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                        <Shield size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sin registros de actividad recientes</p>
                    </div>
                ) : logs.map((log, i) => (
                    <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative pl-16 group"
                    >
                        <div className={`absolute left-0 top-0 h-14 w-14 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center z-10 transition-all group-hover:scale-110 ${
                            log.action === 'DELETE_USER' ? 'bg-rose-50 text-rose-600' :
                            log.action === 'CREATE_USER' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-blue-50 text-blue-600'
                        }`}>
                            {log.action === 'DELETE_USER' ? <Trash2 size={20} /> : 
                             log.action === 'CREATE_USER' ? <UserPlus size={20} /> : <Edit3 size={20} />}
                        </div>
                        
                        <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest">{log.user_name}</span>
                                        <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                            log.action === 'DELETE_USER' ? 'bg-rose-100 text-rose-700' :
                                            log.action === 'CREATE_USER' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.action.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 leading-tight">{log.detail}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                        {new Date(log.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-[9px] font-bold text-[#00f2ff] uppercase tracking-widest mt-0.5">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000">
            {/* Header Maestro */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Talento Humano</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Miembros del <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Staff</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control centralizado de accesos, roles tácticos y <span className="font-bold text-[#001A1A]">permisos de seguridad</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xl shadow-gray-100/50">
                    <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff]">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tienda ID</p>
                        <p className="text-sm font-black text-gray-900">BAY-2026-STF</p>
                    </div>
                </div>
            </div>

            {renderKPIs()}

            {/* Menú Flotante Central */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'miembros', label: 'Miembros', icon: <Users size={14}/> },
                        { id: 'roles', label: 'Roles & Permisos', icon: <ShieldCheck size={14}/> },
                        { id: 'auditoria', label: 'Historial', icon: <LucideHistory size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="activeStaffTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                    {activeTab === 'miembros' && renderMiembros()}
                    {activeTab === 'roles' && renderRoles()}
                    {activeTab === 'auditoria' && renderAuditoria()}
                </motion.div>
            </AnimatePresence>

            {/* Bayt Insight Banner */}
            <div className="px-4 pt-12">
                <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Medal size={300} /></div>
                    <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                        <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                        <div className="flex-1 space-y-6">
                            <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-[#00f2ff]/20">Bayt Security-IQ</span>
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Blindaje de Staff Inteligente</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                    <div className="flex items-center gap-3"><ShieldCheck className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Auditoría de Roles</p></div>
                                    <p className="text-sm font-medium italic leading-relaxed text-white/80">"Detecto que el 80% de tu staff tiene privilegios de Administrador. Te sugiero asignar roles específicos para minimizar riesgos de fuga de datos."</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                    <div className="flex items-center gap-3"><Zap className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Miembro Destacado</p></div>
                                    <p className="text-sm font-medium italic leading-relaxed text-white/80">"Elena Rodriguez ha gestionado el 45% de los pedidos este mes. Considera revisar su comisión por volumen de ventas."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Miembro Premium */}
            <AnimatePresence>
                {isMemberModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMemberModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            
                            <div className="w-full md:w-[320px] bg-[#001a1a] text-white p-12 flex flex-col justify-between shrink-0">
                                <div className="space-y-8">
                                    <div className="h-16 w-16 bg-[#00f2ff] rounded-2xl flex items-center justify-center text-[#001a1a] shadow-xl"><Rocket size={32} /></div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em] border-b border-white/10 pb-3">Perfil de Staff</h4>
                                        <p className="text-sm font-medium opacity-70 leading-relaxed italic">"Añade miembros para delegar responsabilidades y escalar tu capacidad operativa de forma segura."</p>
                                    </div>
                                </div>
                                <div className="pt-8 border-t border-white/5"><p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em]">Cifrado de Acceso Bayup</p></div>
                            </div>

                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">{editingMember ? 'Editar Perfil' : 'Invitar Miembro'}</h2>
                                    <button onClick={() => setIsMemberModalOpen(false)} className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={24}/></button>
                                </div>

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
                                            options={allRolesOptions}
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

                                    <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                                        <ShieldCheck className="text-emerald-600 shrink-0" size={20}/>
                                        <p className="text-[10px] font-medium text-emerald-800 leading-relaxed italic">"El nuevo miembro recibirá una invitación por correo para configurar su contraseña segura y acceder a los módulos asignados."</p>
                                    </div>
                                </form>

                                <div className="p-10 border-t border-gray-50 bg-gray-50/30 flex gap-4">
                                    <button onClick={handleSaveMember} disabled={isSaving} className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={18} className="text-[#00f2ff]"/>}
                                        {editingMember ? 'Actualizar Miembro' : 'Confirmar Invitación'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Confirmación Eliminación */}
            <AnimatePresence>
                {userToDelete && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUserToDelete(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center relative z-10 border border-white">
                            <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldAlert size={40} /></div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic">¿Revocar Acceso?</h3>
                            <p className="text-gray-500 text-sm mt-4 font-medium italic leading-relaxed">"Estás por eliminar a **{userToDelete.full_name}**. Esta acción es irreversible y cortará su conexión inmediata con la plataforma."</p>
                            <div className="flex flex-col gap-3 mt-10">
                                <button onClick={handleDeleteMember} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all">Eliminar Definitivamente</button>
                                <button onClick={() => setUserToDelete(null)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Crear Rol */}
            <AnimatePresence>
                {isCreatingRole && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreatingRole(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 relative z-10 border border-white">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-12 w-12 bg-[#004d4d]/5 text-[#004d4d] rounded-2xl flex items-center justify-center shadow-inner"><Shield size={24}/></div>
                                <div><h3 className="text-xl font-black text-gray-900 uppercase italic">Crear Nuevo Rol</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Define una nueva jerarquía</p></div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del Rol</label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newRoleName} 
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        placeholder="Ej: Supervisor de Ventas"
                                        className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner transition-all" 
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button onClick={handleCreateRole} disabled={isSaving || !newRoleName.trim()} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={18} className="text-[#00f2ff]"/>}
                                        Confirmar & Crear
                                    </button>
                                    <button onClick={() => setIsCreatingRole(false)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Confirmación Eliminación Rol */}
            <AnimatePresence>
                {roleToDelete && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRoleToDelete(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center relative z-10 border border-white">
                            <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldAlert size={40} /></div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic">¿Eliminar Rol?</h3>
                            <p className="text-gray-500 text-sm mt-4 font-medium italic leading-relaxed">
                                "Estás por eliminar el rol comercial **{roleToDelete.name}**. Los miembros asignados a este rol perderán sus privilegios actuales."
                            </p>
                            <div className="flex flex-col gap-3 mt-10">
                                <button onClick={handleDeleteRole} disabled={isSaving} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                                    Eliminar Definitivamente
                                </button>
                                <button onClick={() => setRoleToDelete(null)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
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
