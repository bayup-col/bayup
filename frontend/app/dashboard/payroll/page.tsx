"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Loader2, UserPlus, DollarSign, X, CheckCircle2, Pencil, Users, Briefcase } from 'lucide-react';

interface StaffPayroll {
    id: string;
    name: string;
    role: string;
    base_salary: number;
    is_configured: boolean;
    type?: string;
}

export default function PayrollPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [staff, setStaff] = useState<StaffPayroll[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // UI State para Edición
    const [editingMember, setEditingMember] = useState<StaffPayroll | null>(null);

    const loadData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:8000/payroll/staff-sync', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("DEBUG NOMINA DATA:", data);
                setStaff(data);
            }
        } catch (e) { showToast("Error al sincronizar staff", "error"); }
        finally { setIsLoading(false); }
    }, [token, showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const formatNumberInput = (val: number) => {
        if (!val) return "";
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const unformatNumberInput = (val: string) => {
        return parseFloat(val.replace(/\./g, '')) || 0;
    };

    const handleSaveConfig = async () => {
        if (!editingMember || editingMember.base_salary < 0) return showToast("El sueldo no puede ser negativo", "error");
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:8000/payroll/configure', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: editingMember.id,
                    type: editingMember.type,
                    name: editingMember.name,
                    role: editingMember.role,
                    base_salary: editingMember.base_salary
                })
            });
            if (res.ok) {
                showToast("Configuración de nómina guardada", "success");
                await loadData();
                setEditingMember(null);
            }
        } catch (e) { showToast("Error al guardar", "error"); }
        finally { setIsSaving(false); }
    };

    const totalPayroll = staff.reduce((acc, s) => acc + s.base_salary, 0);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12 animate-in fade-in duration-500">
            {/* 1. Header con Resumen */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Centro de Nómina 👥</h1>
                    <p className="text-gray-500 mt-2 font-medium">Sincronización automática con tu equipo de trabajo.</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-10">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Presupuesto Mensual Base</p>
                        <p className="text-2xl font-black text-purple-600">{formatCurrency(totalPayroll)}</p>
                    </div>
                    <div className="h-12 w-px bg-gray-100"></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Staff Activo</p>
                        <p className="text-2xl font-black text-gray-900">{staff.length}</p>
                    </div>
                </div>
            </div>

            {/* 2. Listado Sincronizado */}
            <div className="bg-white rounded-[3.5rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-50">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Personal en Nómina</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Toda persona creada en el módulo Staff aparecerá aquí automáticamente</p>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                                    <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol Interno</th>
                                    <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sueldo Base</th>
                                    <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                    <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Configurar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {staff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-[10px] uppercase">{member.name.substr(0,2)}</div>
                                                <p className="text-sm font-black text-gray-900">{member.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={12} className="text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{member.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 font-black text-sm text-gray-900">{formatCurrency(member.base_salary)}</td>
                                        <td className="px-10 py-6 text-right">
                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                                member.is_configured ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                                {member.is_configured ? 'Configurado' : 'Sueldo Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button 
                                                onClick={() => setEditingMember(member)}
                                                className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition-all active:scale-90"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {staff.length === 0 && (
                                    <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px]">No hay miembros registrados en el staff aún</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL: CONFIGURAR SUELDO Y ROL (PRO) */}
            {editingMember && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="bg-gray-900 p-8 text-white relative">
                            <button onClick={() => setEditingMember(null)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={20} /></button>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><DollarSign size={24} /></div>
                                <div><h2 className="text-xl font-black tracking-tight">Configurar Nómina</h2><p className="text-purple-400 text-[10px] font-black uppercase tracking-widest mt-1">{editingMember.name}</p></div>
                            </div>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rol / Cargo Empresarial</label>
                                <select 
                                    value={editingMember.role} 
                                    onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all cursor-pointer"
                                >
                                    <option>Asesor Comercial</option>
                                    <option>Líder de Sucursal</option>
                                    <option>Asesor Digital</option>
                                    <option>Logística</option>
                                    <option>Administrador</option>
                                    <option>Contador</option>
                                    <option>Mensajería</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sueldo Base Mensual</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xs">$</span>
                                    <input 
                                        type="text" 
                                        value={formatNumberInput(editingMember.base_salary)} 
                                        onChange={(e) => setEditingMember({...editingMember, base_salary: unformatNumberInput(e.target.value)})} 
                                        className="w-full pl-8 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-black transition-all shadow-inner" 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-10 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                            <button onClick={() => setEditingMember(null)} className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-gray-400 border border-gray-100">Cancelar</button>
                            <button onClick={handleSaveConfig} disabled={isSaving} className="flex-[2] py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} {isSaving ? 'Guardando...' : 'Aplicar Configuración'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
