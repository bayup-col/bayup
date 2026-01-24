"use client";

import { useState } from 'react';

export default function UserStaffSettings() {
    const [staff, setStaff] = useState([
        { id: 1, name: 'Admin Principal', email: 'owner@tienda.com', role: 'Administrador', status: 'Activo' },
        { id: 2, name: 'Juan Operador', email: 'juan.logistica@tienda.com', role: 'Logística', status: 'Activo' },
        { id: 3, name: 'Maria Editora', email: 'maria.marketing@tienda.com', role: 'Editor', status: 'Invitado' },
    ]);

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Usuarios y Staff</h1>
                    <p className="text-gray-500 mt-1">Gestiona quién tiene acceso al panel de control de tu tienda.</p>
                </div>
                <button className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all">
                    + Invitar Miembro
                </button>
            </div>

            {/* Listado de Staff */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Miembro</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol / Permisos</th>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            <th className="relative px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {staff.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center font-black text-purple-600">{user.name.charAt(0)}</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-400 font-medium italic">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">{user.role}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${user.status === 'Activo' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="text-gray-400 hover:text-purple-600 transition-colors">⚙️ Ajustes</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Roles y Permisos Explicación */}
            <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-4">¿Cómo funcionan los roles?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs font-black text-indigo-800 uppercase mb-1 italic underline">Administrador</p>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">Acceso total a la tienda, incluyendo facturación, planes y gestión de otros usuarios.</p>
                    </div>
                    <div>
                        <p className="text-xs font-black text-indigo-800 uppercase mb-1 italic underline">Editor de Contenido</p>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">Puede gestionar productos, colecciones y marketing, pero no tiene acceso a finanzas.</p>
                    </div>
                    <div>
                        <p className="text-xs font-black text-indigo-800 uppercase mb-1 italic underline">Logística / Operador</p>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">Solo puede ver y procesar pedidos, actualizar inventario y responder chats.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
