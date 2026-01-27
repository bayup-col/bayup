"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  AlertTriangle
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
}

export default function UserStaffSettings() {
    const { token, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    
    // ESTADOS BÁSICOS
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<StaffMember | null>(null);

    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // LÓGICA DE FILTRADO Y PAGINACIÓN
    const { filteredStaff, totalPages } = useMemo(() => {
        // En este caso el backend no devuelve fecha exacta, pero los IDs UUID suelen venir ordenados o podemos invertir el array
        // Si el backend devuelve los más viejos primero, invertimos para que el más nuevo esté arriba
        const sorted = [...staff].reverse(); 
        
        const total = Math.ceil(sorted.length / itemsPerPage);
        const sliced = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return { filteredStaff: sliced, totalPages: total };
    }, [staff, currentPage]);

    // ESTADO DEL FORMULARIO (Definido antes de ser usado)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin_tienda',
        status: 'Invitado' as 'Activo' | 'Invitado' | 'Suspendido'
    });

    // ESTADO PARA GESTIÓN DE ROLES
    const [customRoles, setCustomRoles] = useState<any[]>([]);
    const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<any>(null);
    const [isSavingPerms, setIsSavingPerms] = useState(false);
    const [isCreatingNewRole, setIsCreatingNewRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");

    const modules = [
        { id: 'inicio', label: 'Dashboard / Inicio', icon: <LayoutDashboard size={16}/> },
        { id: 'facturacion', label: 'Facturación / POS', icon: <DollarSign size={16}/> },
        { id: 'productos', label: 'Inventario / Productos', icon: <Package size={16}/> },
        { id: 'pedidos', label: 'Pedidos / Operación', icon: <Truck size={16}/> },
        { id: 'clientes', label: 'Clientes / Cartera', icon: <Users size={16}/> },
        { id: 'marketing', label: 'Marketing / IA', icon: <Sparkles size={16}/> },
        { id: 'configuracion', label: 'Configuraciones', icon: <Settings size={16}/> },
    ];

    const roles = [
        { id: 'admin_tienda', label: 'Administrador', icon: <Shield size={14} />, desc: 'Acceso total' },
        { id: 'editor', label: 'Editor', icon: <Edit3 size={14} />, desc: 'Contenido y productos' },
        { id: 'logistica', label: 'Logística', icon: <Truck size={14} />, desc: 'Pedidos y stock' },
        { id: 'vendedor', label: 'Vendedor', icon: <DollarSign size={14} />, desc: 'Ventas y clientes' }
    ];

    const statuses = [
        { id: 'Activo', color: 'bg-emerald-500' },
        { id: 'Invitado', color: 'bg-amber-500' },
        { id: 'Suspendido', color: 'bg-rose-500' }
    ];

    // UNIFICACIÓN DE ROLES: Base + Personalizados
    const allAvailableRoles = useMemo(() => {
        const customMapped = customRoles.map(cr => ({
            id: cr.name, // El backend guarda el ID técnico en el campo 'name'
            label: roles.find(r => r.id === cr.name)?.label || cr.name,
            icon: roles.find(r => r.id === cr.name)?.icon || <Shield size={14} />,
            desc: roles.find(r => r.id === cr.name)?.desc || 'Rol personalizado'
        }));
        
        // Evitamos duplicados si el backend ya devolvió los base
        const uniqueRoles = [...customMapped];
        roles.forEach(base => {
            if (!uniqueRoles.find(r => r.id === base.id)) uniqueRoles.push(base);
        });
        
        return uniqueRoles;
    }, [customRoles, roles]);

    // CARGA DE DATOS
    const fetchRoles = useCallback(async () => {
        if (!token) return;
        try {
            const data = await userService.getRoles(token);
            if (data.length === 0) {
                const createdRoles = [];
                for (const r of roles) {
                    const defaultPerms: any = {};
                    modules.forEach(m => defaultPerms[m.id] = true);
                    const newRole = await userService.createRole(token, { name: r.id, permissions: defaultPerms });
                    createdRoles.push(newRole);
                }
                setCustomRoles(createdRoles);
            } else {
                setCustomRoles(data);
            }
        } catch (e) { console.error("Error fetching roles", e); }
    }, [token]);

    const fetchStaff = useCallback(async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const data = await userService.getAll(token);
            setStaff(data.map((u: any) => ({
                id: u.id,
                full_name: u.full_name || 'Usuario',
                email: u.email,
                role: u.role,
                status: u.status || 'Activo'
            })));
        } catch (error) {
            showToast("No se pudo cargar la lista de staff", "error");
        } finally {
            setIsLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchStaff();
            fetchRoles();
        }
    }, [isAuthenticated, token, fetchStaff, fetchRoles]);

    // MANEJADORES DE EVENTOS
    const handleOpenModal = (member: StaffMember | null = null) => {
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
            setFormData({ name: '', email: '', role: 'admin_tienda', status: 'Invitado' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const selectedRole = roles.find(r => r.label === formData.role || r.id === formData.role);
            const roleId = selectedRole ? selectedRole.id : formData.role;

            if (editingMember) {
                await userService.updateDetails(token!, {
                    email: formData.email,
                    new_role: roleId,
                    full_name: formData.name,
                    status: formData.status
                });
                showToast("Usuario actualizado correctamente", "success");
            } else {
                const newUserData = {
                    email: formData.email.toLowerCase().trim(),
                    full_name: formData.name.trim(),
                    password: Math.random().toString(36).slice(-8) + "Aa1!",
                    role: roleId || "vendedor",
                    status: formData.status || "Activo"
                };
                await userService.create(token!, newUserData);
                showToast("Miembro invitado con éxito", "success");
            }
            await fetchStaff();
            setIsModalOpen(false);
        } catch (error: any) {
            showToast(error.message || "Error al procesar la solicitud", "error");
        }
    };

    const handleDelete = (user: StaffMember) => {
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await userService.delete(token!, userToDelete.id);
            showToast("Usuario eliminado correctamente", "success");
            await fetchStaff();
            setUserToDelete(null);
        } catch (e) {
            showToast("Error al eliminar el usuario", "error");
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

    const handleSavePermissions = async () => {
        const roleToSave = customRoles.find(r => r.id === selectedRoleForPerms);
        if (!roleToSave) return;
        setIsSavingPerms(true);
        try {
            const cleanPermissions: Record<string, boolean> = {};
            modules.forEach(mod => { cleanPermissions[mod.id] = roleToSave.permissions[mod.id] !== false; });
            await userService.updateRole(token!, selectedRoleForPerms, {
                name: roleToSave.name,
                permissions: cleanPermissions
            });
            showToast("Permisos guardados", "success");
            await fetchRoles();
            setTimeout(() => setIsPermissionsModalOpen(false), 800);
        } catch (e) { showToast("Error al guardar permisos", "error"); }
        finally { setIsSavingPerms(false); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        <Users className="text-purple-600" size={36} /> Usuarios y Staff
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona los accesos y permisos de tu equipo.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsPermissionsModalOpen(true)} className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-purple-600 shadow-sm transition-all"><Settings size={22} /></button>
                    <button onClick={() => handleOpenModal()} className="bg-gray-900 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-3"><UserPlus size={16} /> Invitar Miembro</button>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                        <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando staff...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Miembro</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rol / Permisos</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStaff.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-[1.5rem] bg-purple-50 flex items-center justify-center font-black text-purple-600 text-xl">{user.full_name.charAt(0)}</div>
                                                <div>
                                                    <p className="text-base font-black text-gray-900 leading-tight">{user.full_name}</p>
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-1 italic">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-[11px] font-black text-gray-700 bg-gray-100/80 px-4 py-2 rounded-xl uppercase">{roles.find(r => r.id === user.role)?.label || user.role}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full inline-flex items-center gap-2 ${
                                                user.status === 'Activo' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' :
                                                user.status === 'Invitado' ? 'text-amber-600 bg-amber-50 border border-amber-100' :
                                                'text-rose-600 bg-rose-50 border border-rose-100'
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Activo' ? 'bg-emerald-500' : user.status === 'Invitado' ? 'bg-amber-500' : 'bg-rose-500'}`}></span> 
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(user)} className="h-10 w-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-purple-600 shadow-sm transition-all flex items-center justify-center"><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(user)} className="h-10 w-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-rose-600 shadow-sm transition-all flex items-center justify-center"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Controles de Paginación */}
                        {totalPages > 1 && (
                            <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Página {currentPage} de {totalPages}</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-6 py-3 bg-white border border-gray-100 rounded-[1.2rem] text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 disabled:opacity-30 transition-all shadow-sm"
                                    >
                                        Anterior
                                    </button>
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-6 py-3 bg-white border border-gray-100 rounded-[1.2rem] text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 disabled:opacity-30 transition-all shadow-sm"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Miembro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative">
                        <div className="bg-gray-900 p-8 text-white rounded-t-[3rem] relative">
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20"><X size={20} /></button>
                            <h2 className="text-xl font-black">{editingMember ? 'Editar Miembro' : 'Invitar al Equipo'}</h2>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-8 overflow-visible">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase">Nombre Completo</label>
                                <div className="relative">
                                    <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 overflow-visible">
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Rol</label>
                                    <button type="button" onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl font-bold transition-all hover:bg-purple-50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-purple-600">{allAvailableRoles.find(r => r.id === formData.role)?.icon}</span>
                                            {allAvailableRoles.find(r => r.id === formData.role)?.label || formData.role}
                                        </div>
                                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isRoleDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                            {allAvailableRoles.map((r) => (
                                                <button key={r.id} type="button" onClick={() => { setFormData({...formData, role: r.id}); setIsRoleDropdownOpen(false); }} className="w-full px-4 py-3 text-left hover:bg-purple-50 flex items-center gap-3 transition-colors group">
                                                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 transition-all">{r.icon}</div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-900">{r.label}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{r.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Estado</label>
                                    <button type="button" onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${statuses.find(s => s.id === formData.status)?.color || 'bg-gray-300'}`}></div>
                                            {formData.status}
                                        </div>
                                        <ChevronDown size={16} />
                                    </button>
                                    {isStatusDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[600] max-h-48 overflow-y-auto custom-scrollbar">
                                            {statuses.map((s) => (
                                                <button key={s.id} type="button" onClick={() => { setFormData({...formData, status: s.id as any}); setIsStatusDropdownOpen(false); }} className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3">
                                                    <div className={`h-2 w-2 rounded-full ${s.color}`}></div>
                                                    <span className="text-xs font-black uppercase tracking-wider">{s.id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase shadow-xl transition-all">Guardar Cambios</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Permisos */}
            {isPermissionsModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3.5rem] shadow-2xl relative flex flex-col overflow-hidden">
                        <div className="bg-gray-900 p-10 text-white relative">
                            <button onClick={() => setIsPermissionsModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white"><X size={24} /></button>
                            <h2 className="text-3xl font-black tracking-tighter">Control de Accesos</h2>
                        </div>
                        <div className="flex-1 flex overflow-hidden bg-gray-50/50">
                            <div className="w-1/3 border-r border-gray-100 p-8 space-y-6 overflow-y-auto">
                                <div className="space-y-2">
                                    {customRoles.map((r) => (
                                        <button key={r.id} onClick={() => setSelectedRoleForPerms(r.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm ${selectedRoleForPerms === r.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-purple-50'}`}>
                                            <Shield size={14} className="opacity-50" /> {roles.find(br => br.id === r.name)?.label || r.name}
                                        </button>
                                    ))}
                                    {isCreatingNewRole ? (
                                        <input autoFocus type="text" placeholder="Nombre..." value={newRoleName} onChange={(e)=>setNewRoleName(e.target.value)} onKeyDown={async (e)=>{
                                            if(e.key==='Enter' && newRoleName.trim()){
                                                const defaultPerms:any={}; modules.forEach(m=>defaultPerms[m.id]=true);
                                                const res = await fetch('http://localhost:8000/admin/roles', { method:'POST', headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'}, body:JSON.stringify({name:newRoleName, permissions:defaultPerms})});
                                                if(res.ok){ showToast("Nuevo rol creado", "success"); setIsCreatingNewRole(false); setNewRoleName(""); fetchRoles(); }
                                            }
                                        }} className="w-full p-4 border-2 border-purple-200 rounded-2xl outline-none font-bold" />
                                    ) : (
                                        <button onClick={()=>setIsCreatingNewRole(true)} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-purple-600 transition-all">+ Crear Nuevo Rol</button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 p-10 overflow-y-auto bg-white">
                                {selectedRoleForPerms ? (
                                    <div className="space-y-8 animate-in slide-in-from-right duration-500">
                                        <h3 className="text-lg font-black">Permisos para {customRoles.find(r => r.id === selectedRoleForPerms)?.name}</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {modules.map((mod) => {
                                                const isActive = customRoles.find(r => r.id === selectedRoleForPerms)?.permissions[mod.id] !== false;
                                                return (
                                                    <div key={mod.id} className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-3xl">
                                                        <div className="flex items-center gap-4 text-gray-900">{mod.icon} <p className="text-sm font-black">{mod.label}</p></div>
                                                        <div onClick={() => handleTogglePermission(mod.id)} className={`relative inline-flex h-7 w-12 items-center rounded-full cursor-pointer px-1 transition-colors ${isActive ? 'bg-purple-600' : 'bg-gray-200'}`}><div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`}></div></div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button onClick={handleSavePermissions} disabled={isSavingPerms} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] disabled:opacity-50">{isSavingPerms ? 'Guardando...' : 'Guardar Configuración'}</button>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50"><Shield size={60} /><p className="text-xs font-black uppercase text-center">Selecciona un rol</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación Premium */}
            {userToDelete && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">¿Eliminar a este miembro?</h3>
                        <p className="text-gray-500 text-sm mt-3 font-medium">Esta acción eliminará permanentemente a <span className="font-bold text-gray-900">{userToDelete.full_name}</span> del equipo. No se puede deshacer.</p>
                        
                        <div className="flex flex-col gap-3 mt-8">
                            <button onClick={confirmDelete} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95">Eliminar Definitivamente</button>
                            <button onClick={() => setUserToDelete(null)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
