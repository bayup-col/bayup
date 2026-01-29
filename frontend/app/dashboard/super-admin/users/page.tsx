"use client";

import { useState } from 'react';

type Role = 'Desarrollador' | 'Comercial' | 'Administrador' | 'Marketing' | 'Super Usuario';

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: 'active' | 'inactive';
    last_login: string;
    avatar: string;
    permissions: {
        financials: boolean;
        user_mgmt: boolean;
        marketing_tools: boolean;
        api_access: boolean;
    };
}

const MOCK_STAFF: StaffMember[] = [
    { 
        id: 'S1', name: 'Paolo Tech', email: 'paolo.dev@bayup.com', role: 'Super Usuario', status: 'active', last_login: 'Ahora mismo', avatar: 'P',
        permissions: { financials: true, user_mgmt: true, marketing_tools: true, api_access: true }
    },
    { 
        id: 'S2', name: 'Laura Ventas', email: 'laura.sales@bayup.com', role: 'Comercial', status: 'active', last_login: 'hace 2 horas', avatar: 'L',
        permissions: { financials: false, user_mgmt: false, marketing_tools: true, api_access: false }
    },
    { 
        id: 'S3', name: 'Kevin Code', email: 'kevin.dev@bayup.com', role: 'Desarrollador', status: 'inactive', last_login: 'hace 3 días', avatar: 'K',
        permissions: { financials: false, user_mgmt: false, marketing_tools: false, api_access: true }
    },
];

export default function RolesManagement() {
    const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
    const [editingUser, setEditingUser] = useState<StaffMember | null>(null);

    const roles: Role[] = ['Desarrollador', 'Comercial', 'Administrador', 'Marketing', 'Super Usuario'];

    const toggleStatus = (id: string) => {
        setStaff(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    };

    const updateRole = (id: string, newRole: Role) => {
        setStaff(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Gestión de Equipo</h1>
                    <p className="text-gray-500 mt-1 font-medium">Control de acceso y roles para colaboradores internos de Bayup.</p>
                </div>
                <button className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all">
                    + Invitar Colaborador
                </button>
            </div>

            {/* Listado de Staff */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol / Cargo</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Último Acceso</th>
                            <th className="px-8 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado de Cuenta</th>
                            <th className="relative px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {staff.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center font-black text-white shadow-md">
                                            {member.avatar}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{member.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <select 
                                        value={member.role}
                                        onChange={(e) => updateRole(member.id, e.target.value as Role)}
                                        className="bg-[#f0f9f9] text-[#004d4d] text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border-none outline-none focus:ring-2 focus:ring-[#004d4d] cursor-pointer"
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </td>
                                <td className="px-8 py-5 text-xs font-bold text-gray-400">
                                    {member.last_login}
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <button 
                                        onClick={() => toggleStatus(member.id)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${member.status === 'active' ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${member.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button 
                                        onClick={() => setEditingUser(member)}
                                        className="text-[#004d4d] opacity-0 group-hover:opacity-100 transition-opacity font-black text-[10px] uppercase tracking-widest border-b-2 border-[#004d4d] pb-0.5"
                                    >
                                        Ajustar Permisos
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL DE PERMISOS GRANULARES --- */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-10 bg-gray-900 text-white relative">
                            <button onClick={() => setEditingUser(null)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">✕</button>
                            <h3 className="text-2xl font-black italic tracking-tighter">Privilegios de Acceso</h3>
                            <p className="text-[#00ffff] text-xs font-bold uppercase tracking-widest mt-1">Usuario: {editingUser.name}</p>
                        </div>

                        <div className="p-10 space-y-6">
                            {[
                                { key: 'financials', label: 'Ver y Editar Finanzas', icon: '💰' },
                                { key: 'user_mgmt', label: 'Gestionar Usuarios', icon: '👥' },
                                { key: 'marketing_tools', label: 'Herramientas Marketing', icon: '📢' },
                                { key: 'api_access', label: 'Acceso a llaves API', icon: '🛠️' },
                            ].map((perm) => (
                                <div key={perm.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{perm.icon}</span>
                                        <span className="text-sm font-bold text-gray-700">{perm.label}</span>
                                    </div>
                                    <button className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${editingUser.permissions[perm.key as keyof typeof editingUser.permissions] ? 'bg-[#004d4d] border-[#004d4d]' : 'border-gray-300'}`}>
                                        {editingUser.permissions[perm.key as keyof typeof editingUser.permissions] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-10 pt-0">
                            <button onClick={() => setEditingUser(null)} className="w-full bg-[#004d4d] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Guardar Privilegios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
