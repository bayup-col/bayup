"use client";

import { useState } from 'react';
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
  DollarSign
} from 'lucide-react';

interface StaffMember {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'Activo' | 'Invitado' | 'Suspendido';
}

export default function UserStaffSettings() {
    const [staff, setStaff] = useState<StaffMember[]>([
        { id: 1, name: 'Admin Principal', email: 'owner@tienda.com', role: 'Administrador', status: 'Activo' },
        { id: 2, name: 'Juan Operador', email: 'juan.logistica@tienda.com', role: 'Logística', status: 'Activo' },
        { id: 3, name: 'Maria Editora', email: 'maria.marketing@tienda.com', role: 'Editor', status: 'Invitado' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Logística',
        status: 'Invitado' as 'Activo' | 'Invitado' | 'Suspendido'
    });

    const roles = [
        { id: 'Administrador', icon: <Shield size={14} />, desc: 'Acceso total' },
        { id: 'Editor', icon: <Edit3 size={14} />, desc: 'Contenido y productos' },
        { id: 'Logística', icon: <Truck size={14} />, desc: 'Pedidos y stock' },
        { id: 'Vendedor', icon: <DollarSign size={14} />, desc: 'Ventas y clientes' }
    ];

    const statuses = [
        { id: 'Activo', color: 'bg-emerald-500' },
        { id: 'Invitado', color: 'bg-amber-500' },
        { id: 'Suspendido', color: 'bg-rose-500' }
    ];

    const handleOpenModal = (member: StaffMember | null = null) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                name: member.name,
                email: member.email,
                role: member.role,
                status: member.status
            });
        } else {
            setEditingMember(null);
            setFormData({
                name: '',
                email: '',
                role: 'Logística',
                status: 'Invitado'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember) {
            setStaff(staff.map(s => s.id === editingMember.id ? { ...s, ...formData } : s));
        } else {
            const newMember: StaffMember = {
                id: Date.now(),
                ...formData
            };
            setStaff([...staff, newMember]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar a este miembro del staff?')) {
            setStaff(staff.filter(s => s.id !== id));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        <Users className="text-purple-600" size={36} />
                        Usuarios y Staff
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Gestiona los accesos y permisos de tu equipo de trabajo.
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center gap-3"
                >
                    <UserPlus size={16} />
                    Invitar Miembro
                </button>
            </div>

            {/* Listado de Staff */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden">
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
                            {staff.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-all group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-[1.5rem] bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-center font-black text-purple-600 text-xl shadow-sm group-hover:scale-110 transition-transform">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-gray-900 leading-tight">{user.name}</p>
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className="text-purple-400" />
                                            <span className="text-[11px] font-black text-gray-700 bg-gray-100/80 px-4 py-2 rounded-xl uppercase tracking-widest">{user.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-full inline-flex items-center gap-2 ${
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
                                            <button 
                                                onClick={() => handleOpenModal(user)}
                                                className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-200 hover:shadow-lg transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-200 hover:shadow-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Explicación de Roles */}
            <div className="p-10 bg-gray-900 rounded-[3rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Shield size={200} />
                </div>
                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                    <Lock className="text-purple-400" size={24} />
                    Gestión de Permisos Inteligente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                    <div className="space-y-3">
                        <div className="h-1 w-12 bg-purple-500 rounded-full"></div>
                        <p className="text-[11px] font-black text-purple-400 uppercase tracking-[0.2em]">Administrador</p>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">Control total sobre la configuración, finanzas y gestión de usuarios.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">Editor de Contenido</p>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">Enfocado en productos, marketing y diseño de la tienda.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
                        <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em]">Logística / Operador</p>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">Gestión de pedidos, inventario y atención al cliente.</p>
                    </div>
                </div>
            </div>

            {/* Modal de Miembro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <div className="bg-gray-900 p-8 text-white relative rounded-t-[3rem]">
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all">
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">{editingMember ? 'Editar Miembro' : 'Invitar al Equipo'}</h2>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configuración de Accesos</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                    <div className="relative">
                                        <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" placeholder="Ej: Juan Pérez" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all" placeholder="correo@tienda.com" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Custom Role Selector */}
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rol Asignado</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 border border-transparent hover:border-purple-100 rounded-2xl outline-none text-sm font-bold transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-purple-600">{roles.find(r => r.id === formData.role)?.icon}</span>
                                                {formData.role}
                                            </div>
                                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isRoleDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[190px] overflow-y-auto custom-scrollbar">
                                                {roles.map((role) => (
                                                    <button
                                                        key={role.id}
                                                        type="button"
                                                        onClick={() => { setFormData({...formData, role: role.id}); setIsRoleDropdownOpen(false); }}
                                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-50 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-purple-600 group-hover:bg-white transition-all">{role.icon}</div>
                                                            <div className="text-left">
                                                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{role.id}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{role.desc}</p>
                                                            </div>
                                                        </div>
                                                        {formData.role === role.id && <Check size={14} className="text-purple-600" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Custom Status Selector */}
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 border border-transparent hover:border-purple-100 rounded-2xl outline-none text-sm font-bold transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${statuses.find(s => s.id === formData.status)?.color}`}></div>
                                                {formData.status}
                                            </div>
                                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isStatusDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-48 overflow-y-auto custom-scrollbar">
                                                {statuses.map((status) => (
                                                    <button
                                                        key={status.id}
                                                        type="button"
                                                        onClick={() => { setFormData({...formData, status: status.id as any}); setIsStatusDropdownOpen(false); }}
                                                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className={`h-2 w-2 rounded-full ${status.color}`}></div>
                                                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{status.id}</span>
                                                        {formData.status === status.id && <Check size={14} className="text-purple-600 ml-auto" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors border border-gray-100">Cancelar</button>
                                <button type="submit" className="flex-1 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <Check size={16} />
                                    {editingMember ? 'Guardar Cambios' : 'Enviar Invitación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
