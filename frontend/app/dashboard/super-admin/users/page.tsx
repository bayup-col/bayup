"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, UserPlus, Shield, Mail, X, Check, Search, 
    Loader2, Lock, ShieldCheck, Zap, RefreshCw, Key, User,
    Trash2, Edit3, AlertTriangle, ShieldAlert, LayoutGrid, Settings,
    DollarSign, Package, Truck, Sparkles, Star, ChevronRight,
    BarChart3, Link2, Tag, FileText, Camera, Users2, TrendingUp, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { userService } from '@/lib/api';

export default function SuperAdminUsersPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'miembros' | 'roles'>('miembros');
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // MODAL STATES
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [passType, setPassType] = useState<'auto' | 'manual'>('auto');
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [userToDelete, setUserToDelete] = useState<any>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'super_admin',
        password: '',
        permissions: {
            inicio: true, empresas: false, afiliados: false, 
            tesoreria: false, marketing: false, soporte: false, settings: false
        }
    });

    const [roleData, setRoleData] = useState({
        name: '',
        permissions: {
            inicio: true, empresas: false, afiliados: false, 
            tesoreria: false, web_analytics: false, marketing: false, 
            soporte: false, apis: false, feature_flags: false,
            riesgos: false, legal: false, docs: false,
            observabilidad: false, settings: false, staff: false
        }
    });

    const modules = [
        { id: 'inicio', label: 'Dashboard', icon: <LayoutDashboard size={16}/> },
        { id: 'empresas', label: 'Empresas', icon: <Star size={16}/> },
        { id: 'afiliados', label: 'Afiliados', icon: <Users size={16}/> },
        { id: 'tesoreria', label: 'Tesorería', icon: <DollarSign size={16}/> },
        { id: 'web_analytics', label: 'Estadísticas Web', icon: <BarChart3 size={16}/> },
        { id: 'marketing', label: 'Marketing', icon: <Sparkles size={16}/> },
        { id: 'soporte', label: 'Soporte', icon: <ShieldCheck size={16}/> },
        { id: 'apis', label: 'APIs', icon: <Link2 size={16}/> },
        { id: 'feature_flags', label: 'Feature Flags', icon: <Tag size={16}/> },
        { id: 'riesgos', label: 'Riesgos', icon: <ShieldAlert size={16}/> },
        { id: 'legal', label: 'Legal', icon: <FileText size={16}/> },
        { id: 'docs', label: 'Documentación', icon: <FileText size={16}/> },
        { id: 'observabilidad', label: 'Observabilidad', icon: <Camera size={16}/> },
        { id: 'settings', label: 'Ajustes', icon: <Settings size={16}/> },
        { id: 'staff', label: 'Staff Global', icon: <Users size={16}/> },
    ];

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [usersData, rolesData] = await Promise.all([
                userService.getAll(token),
                userService.getRoles(token)
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await userService.createRole(token!, {
                name: roleData.name,
                permissions: roleData.permissions
            });
            showToast("Nuevo Rol Creado 💎", "success");
            setIsRoleModalOpen(false);
            setRoleData({ 
                name: '', 
                permissions: { 
                    inicio: true, empresas: false, afiliados: false, tesoreria: false, 
                    web_analytics: false, marketing: false, soporte: false, apis: false, 
                    feature_flags: false, riesgos: false, legal: false, docs: false, 
                    observabilidad: false, settings: false, staff: false 
                } 
            });
            fetchData();
        } catch (error: any) {
            showToast(error.message || "Error al crear rol", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingUser) {
                await userService.updateDetails(token!, {
                    email: formData.email,
                    full_name: formData.full_name,
                    new_role: formData.role,
                    status: editingUser.status,
                    permissions: formData.permissions
                });
                showToast("Cambios sincronizados 💎", "success");
            } else {
                const finalPassword = passType === 'auto' 
                    ? Math.random().toString(36).slice(-8) + "By!" 
                    : formData.password;

                await userService.create(token!, {
                    email: formData.email.toLowerCase().trim(),
                    full_name: formData.full_name.trim(),
                    password: finalPassword,
                    role: formData.role,
                    status: 'Invitado',
                    permissions: formData.permissions
                });
                setGeneratedPassword(finalPassword);
                showToast("Invitación enviada 📧", "success");
            }
            fetchData();
            if (editingUser) closeAndReset();
        } catch (error: any) {
            showToast(error.message || "Error al procesar", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (userId: string) => {
        setIsSaving(true);
        try {
            await userService.delete(token!, userId);
            showToast("Usuario removido del ecosistema", "info");
            setUserToDelete(null);
            fetchData();
        } catch (error: any) {
            showToast(error.message || "Error al eliminar", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const closeAndReset = () => {
        setIsMemberModalOpen(false);
        setIsRoleModalOpen(false);
        setEditingUser(null);
        setGeneratedPassword(null);
        setFormData({ 
            full_name: '', email: '', role: 'super_admin', password: '',
            permissions: { inicio: true, empresas: false, afiliados: false, tesoreria: false, marketing: false, soporte: false, settings: false }
        });
    };

    const renderRoles = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white/40 p-10 rounded-[4rem] border border-white/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Definición de Roles</h3>
                    <p className="text-sm font-medium text-gray-500 italic">Crea plantillas de permisos para tus colaboradores.</p>
                </div>
                <button onClick={() => setIsRoleModalOpen(true)} className="h-14 px-8 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl flex items-center gap-3 hover:scale-105 transition-all">
                    <Plus size={18} className="text-[#00f2ff]"/> Nuevo Rol
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {roles.map((role) => (
                    <div key={role.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6 group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div className="h-12 w-12 rounded-2xl bg-[#004d4d]/5 text-[#004d4d] flex items-center justify-center">
                                <Shield size={24} />
                            </div>
                            <button onClick={async () => { await userService.deleteRole(token!, role.id); fetchData(); }} className="text-gray-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{role.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Permisos activos:</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(role.permissions).filter(([_, v]) => v).map(([k]) => (
                                <span key={k} className="px-3 py-1 bg-gray-50 text-gray-500 text-[8px] font-black rounded-full uppercase tracking-widest border border-gray-100">{k}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in duration-700">
            
            {/* Header Global */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Administración Global</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Staff Global</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">VERSIÓN PLATINUM PLUS - Control total del ecosistema.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/60 p-4 rounded-3xl border border-white shadow-xl">
                    <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff] shadow-lg"><Shield size={22} /></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Sistema</p><p className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">Protocolo Platinum</p></div>
                </div>
            </div>

            {/* Sistema de Pestañas Premium */}
            <div className="flex items-center justify-center gap-6 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center relative">
                    {[
                        { id: 'miembros', label: 'Colaboradores', icon: <Users size={14}/> },
                        { id: 'roles', label: 'Gestión de Roles', icon: <ShieldCheck size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-10 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="staffTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon} {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                    {activeTab === 'miembros' ? (
                        <div className="space-y-8">
                            <div className="w-full max-w-[1100px] mx-auto flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm focus-within:shadow-xl transition-all relative z-30">
                                <div className="relative w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input type="text" placeholder="Buscar colaboradores..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" />
                                </div>
                                <button onClick={() => setIsMemberModalOpen(true)} className="h-12 flex items-center gap-2 px-6 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black transition-all active:scale-95">
                                    <UserPlus size={18} className="text-[#00f2ff]"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Invitar</span>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 px-4">
                                {users.filter(u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                                    <motion.div key={user.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-xl font-black shadow-2xl relative italic">
                                                {user.full_name.charAt(0)}
                                                {user.status === 'Activo' && <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-xl font-black text-gray-900 tracking-tight">{user.full_name}</h4>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${user.status === 'Activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{user.status}</span>
                                                </div>
                                                <p className="text-sm font-bold text-[#004d4d]/60 mt-1 italic">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-12 px-10 border-x border-gray-50">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">Rol Actual</p>
                                                <span className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em]">{user.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => { setEditingUser(user); setFormData({full_name: user.full_name, email: user.email, role: user.role, password: '', permissions: user.permissions || {}}); setIsMemberModalOpen(true); }} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center shadow-inner transition-all"><Edit3 size={18}/></button>
                                            <button onClick={() => setUserToDelete(user)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 flex items-center justify-center shadow-inner transition-all"><Trash2 size={18}/></button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : renderRoles()}
                </motion.div>
            </AnimatePresence>

            {/* MODAL INVITAR MIEMBRO */}
            <AnimatePresence>
                {isMemberModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAndReset} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="bg-white w-full max-w-5xl h-[85vh] rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-gray-100">
                            
                            {/* Lateral Info (Más delgado y estilizado) */}
                            <div className="w-full md:w-[280px] bg-[#001a1a] text-white p-10 flex flex-col justify-between shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                                    <Shield size={200} />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div className="h-14 w-14 bg-[#00f2ff] rounded-2xl flex items-center justify-center text-[#001a1a] shadow-lg shadow-cyan-500/20">
                                        <Zap size={28} />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em]">Acceso Global</h4>
                                        <p className="text-xl font-black italic uppercase leading-tight tracking-tighter">Expandiendo el equipo.</p>
                                        <p className="text-xs font-medium opacity-50 leading-relaxed italic">Delega responsabilidades con precisión quirúrgica.</p>
                                    </div>
                                </div>
                                <div className="relative z-10 pt-10 border-t border-white/10">
                                    <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em]">Seguridad Bayup v2.0</p>
                                </div>
                            </div>

                            {/* Contenido del Formulario */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="px-12 py-8 border-b border-gray-50 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 italic uppercase tracking-tight">
                                            {editingUser ? 'Ajustar Perfil' : 'Nueva Invitación'}
                                        </h2>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configuración de privilegios de red</p>
                                    </div>
                                    <button onClick={closeAndReset} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                        <X size={20}/>
                                    </button>
                                </div>

                                <form onSubmit={handleInvite} className="flex-1 overflow-y-auto px-12 py-10 space-y-10 custom-scrollbar">
                                    {!generatedPassword ? (
                                        <>
                                            {/* Datos Básicos */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Identidad</label>
                                                    <div className="relative group">
                                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#004d4d] transition-colors" size={16}/>
                                                        <input required type="text" placeholder="Nombre y Apellido" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full pl-12 p-4 bg-gray-50/50 border border-gray-100 focus:border-[#004d4d]/20 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Comunicación</label>
                                                    <div className="relative group">
                                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#004d4d] transition-colors" size={16}/>
                                                        <input required type="email" placeholder="email@info.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 p-4 bg-gray-50/50 border border-gray-100 focus:border-[#004d4d]/20 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selección de Rol */}
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Jerarquía de Acceso</label>
                                                <div className="relative">
                                                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004d4d]" size={18} />
                                                    <select className="w-full pl-14 p-4 bg-gray-900 text-white rounded-2xl outline-none text-sm font-bold appearance-none cursor-pointer hover:bg-black transition-all shadow-xl" value={formData.role} onChange={e => {
                                                        const role = roles.find(r => r.name === e.target.value);
                                                        setFormData({...formData, role: e.target.value, permissions: role ? role.permissions : formData.permissions});
                                                    }}>
                                                        <option value="super_admin">Super Administrador (Root)</option>
                                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                                    </select>
                                                    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-cyan rotate-90" size={16} />
                                                </div>
                                            </div>

                                            {/* Permisos en Grid 3 Columnas (Más compacto) */}
                                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <LayoutGrid className="text-gray-300" size={14}/>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Módulos Autorizados</label>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {modules.map((mod) => (
                                                        <button key={mod.id} type="button" onClick={() => setFormData(prev => ({...prev, permissions: {...prev.permissions, [mod.id]: !(prev.permissions as any)[mod.id]}}))} className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${ (formData.permissions as any)[mod.id] ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 hover:opacity-100' }`}>
                                                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${ (formData.permissions as any)[mod.id] ? 'bg-white shadow-sm' : 'bg-gray-100' }`}>
                                                                {mod.icon}
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-tight leading-none">{mod.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-10 space-y-10 animate-in zoom-in-95 duration-500">
                                            <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                                                <ShieldCheck size={48} />
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">¡Invitación Activa!</h3>
                                                <p className="text-sm text-gray-500 italic max-w-sm mx-auto">El colaborador recibirá sus credenciales de acceso en <strong>{formData.email}</strong>.</p>
                                            </div>
                                            <div className="p-8 bg-[#004d4d] rounded-[3rem] text-white space-y-4 shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform group-hover:rotate-45 duration-700"><Key size={100}/></div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Clave de un solo uso</p>
                                                <p className="text-4xl font-black tracking-[0.3em] text-[#00f2ff] drop-shadow-lg">{generatedPassword}</p>
                                            </div>
                                        </div>
                                    )}
                                </form>

                                <div className="px-12 py-8 bg-gray-50/50 border-t border-gray-50 flex items-center gap-6">
                                    <button onClick={generatedPassword ? closeAndReset : handleInvite} disabled={isSaving} className="flex-1 py-5 bg-gray-900 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all">
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : (generatedPassword ? <CheckCircle2 size={18} className="text-[#00f2ff]"/> : <ShieldCheck size={18} className="text-[#00f2ff]"/>)}
                                        {generatedPassword ? 'Finalizar y Salir' : (editingUser ? 'Sincronizar Cambios' : 'Desplegar Invitación')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL CREAR ROL */}
            <AnimatePresence>
                {isRoleModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRoleModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="bg-white w-full max-w-5xl h-[85vh] rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-gray-100">
                            
                            {/* Lateral Info */}
                            <div className="w-full md:w-[280px] bg-[#004d4d] text-white p-10 flex flex-col justify-between shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                                    <ShieldCheck size={200} />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div className="h-14 w-14 bg-[#00f2ff] rounded-2xl flex items-center justify-center text-[#004d4d] shadow-lg shadow-cyan-500/20">
                                        <Shield size={28} />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em]">Arquitectura RBAC</h4>
                                        <p className="text-xl font-black italic uppercase leading-tight tracking-tighter">Perfiles de Seguridad.</p>
                                        <p className="text-xs font-medium opacity-60 leading-relaxed italic">Crea plantillas de permisos para automatizar tus asignaciones.</p>
                                    </div>
                                </div>
                                <div className="relative z-10 pt-10 border-t border-white/10 text-center">
                                    <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em]">Protocolo de Blindaje Bayup</p>
                                </div>
                            </div>

                            {/* Contenido del Formulario */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="px-12 py-8 border-b border-gray-50 flex justify-between items-center bg-white/80">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 italic uppercase tracking-tight">Nuevo Perfil de Rol</h2>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Definición de privilegios por nivel</p>
                                    </div>
                                    <button onClick={() => setIsRoleModalOpen(false)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                        <X size={20}/>
                                    </button>
                                </div>

                                <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto px-12 py-10 space-y-10 custom-scrollbar">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del Rol</label>
                                        <div className="relative group">
                                            <Edit3 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#004d4d] transition-colors" size={16}/>
                                            <input required type="text" placeholder="Ej. Auditor Financiero, Gestor de Contenido..." className="w-full pl-12 p-4 bg-gray-50/50 border border-gray-100 focus:border-[#004d4d]/20 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all" value={roleData.name} onChange={e => setRoleData({...roleData, name: e.target.value})} />
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="text-gray-300" size={14}/>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mapa de Privilegios</label>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {modules.map((mod) => (
                                                <button key={mod.id} type="button" onClick={() => setRoleData(prev => ({...prev, permissions: {...prev.permissions, [mod.id]: !(prev.permissions as any)[mod.id]}}))} className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${ (roleData.permissions as any)[mod.id] ? 'bg-[#004d4d]/5 border-[#004d4d] text-[#004d4d] shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 hover:opacity-100' }`}>
                                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${ (roleData.permissions as any)[mod.id] ? 'bg-white shadow-sm' : 'bg-gray-100' }`}>
                                                        {mod.icon}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-tight leading-none">{mod.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </form>

                                <div className="px-12 py-8 bg-gray-50/50 border-t border-gray-50">
                                    <button type="submit" onClick={handleSaveRole} disabled={isSaving} className="w-full py-5 bg-gray-900 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all">
                                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18} className="text-[#00f2ff]"/>} 
                                        Crear Rol Oficial
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL ELIMINAR */}
            <AnimatePresence>
                {userToDelete && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUserToDelete(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center relative z-10 border border-white">
                            <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldAlert size={40} /></div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic">¿Revocar Acceso?</h3>
                            <p className="text-gray-500 text-sm mt-4 italic leading-relaxed">Estás por remover a **{userToDelete.full_name}**. Esta acción es irreversible.</p>
                            <div className="flex flex-col gap-3 mt-10">
                                <button onClick={() => handleDelete(userToDelete.id)} disabled={isSaving} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar Definitivamente</button>
                                <button onClick={() => setUserToDelete(null)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}

const Plus = ({ size, className }: any) => <Zap className={`${className}`} size={size} />;
const CheckCircle2 = ({ size, className }: any) => <Check className={`${className}`} size={size} />;
const LayoutDashboard = ({ size, className }: any) => <LayoutGrid className={`${className}`} size={size} />;
