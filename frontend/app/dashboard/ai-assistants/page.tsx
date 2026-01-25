"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { assistantService } from '@/lib/api';
import { AIAssistant } from '@/lib/types';

export default function AIAssistantsPage() {
    const { token } = useAuth();
    const [assistants, setAssistants] = useState<AIAssistant[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAssistants = useCallback(async () => {
        if (!token) return;
        try {
            const data = await assistantService.getAll(token);
            setAssistants(data);
        } catch (err) {
            console.error("Error al cargar asistentes");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAssistants();
    }, [fetchAssistants]);

    const toggleAssistant = async (id: string, currentStatus: string) => {
        if (!token) return;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await assistantService.toggleStatus(token, id, newStatus);
            setAssistants(assistants.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
        } catch (err) {
            alert("No se pudo cambiar el estado.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!token || !confirm("¿Eliminar este asistente?")) return;
        try {
            await assistantService.delete(token, id);
            setAssistants(assistants.filter(a => a.id !== id));
        } catch (err) {
            alert("Error al eliminar.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        Asistentes IA
                        <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">PRO</span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Orquestación de agentes inteligentes conectados a n8n.</p>
                </div>
                <Link href="/dashboard/ai-assistants/new" className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-center">
                    + Crear Nuevo Agente
                </Link>
            </div>

            {/* Listado Real de Agentes */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h2 className="text-xl font-black text-gray-900">Mis Agentes Operativos</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agente / Tipo</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones Totales</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={4} className="px-8 py-20 text-center font-bold text-gray-400">Sincronizando con el cerebro IA...</td></tr>
                            ) : assistants.length === 0 ? (
                                <tr><td colSpan={4} className="px-8 py-20 text-center font-bold text-gray-400">No tienes agentes creados todavía.</td></tr>
                            ) : assistants.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black">AI</div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{a.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{a.assistant_type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button 
                                            onClick={() => toggleAssistant(a.id, a.status)}
                                            className={`w-12 h-6 rounded-full relative transition-all ${a.status === 'active' ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${a.status === 'active' ? 'translate-x-6' : ''}`}></div>
                                        </button>
                                    </td>
                                    <td className="px-8 py-6 text-center text-sm font-bold text-gray-600">{a.total_actions}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleDelete(a.id)} className="h-9 w-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors">✕</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}