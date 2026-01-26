"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { assistantService } from '@/lib/api';
import { AIAssistant } from '@/lib/types';
import { 
  Bot, Zap, Plus, Settings, Trash2, Activity, ShieldCheck, AlertCircle, 
  X, MessageSquare, Calendar, AlertTriangle, Key, Copy, Eye, EyeOff, Info
} from 'lucide-react';

export default function AIAssistantsPage() {
    const { token, userEmail } = useAuth();
    const [assistants, setAssistants] = useState<AIAssistant[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para la Bitácora
    const [selectedForLogs, setSelectedForLogs] = useState<AIAssistant | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Estado para API Key
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKey] = useState("by_live_" + Math.random().toString(36).substr(2, 15)); // Simulación para el MVP

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

    useEffect(() => { fetchAssistants(); }, [fetchAssistants]);

    const fetchLogs = async (assistant: AIAssistant) => {
        if (!token) return;
        setSelectedForLogs(assistant);
        setLoadingLogs(true);
        try {
            const data = await assistantService.getLogs(token, assistant.id);
            setLogs(data);
        } catch (err) {
            console.error("Error al cargar logs");
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este asistente?")) return;
        try {
            await assistantService.delete(token!, id);
            setAssistants(prev => prev.filter(a => a.id !== id));
            alert("Asistente eliminado.");
        } catch (err) {
            alert("No se pudo eliminar el asistente.");
        }
    };

    const copyApiKey = () => {
        navigator.clipboard.writeText(apiKey);
        alert("¡Llave copiada con éxito! Ahora pégala en n8n.");
    };

    const stats = useMemo(() => {
        const internal = assistants.filter(a => !(a as any).is_byoa).length;
        const byoa = assistants.filter(a => (a as any).is_byoa).length;
        return { internal, byoa };
    }, [assistants]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        Asistentes IA
                        <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Enterprise</span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Controla tus agentes y conecta aplicaciones externas.</p>
                </div>
                <Link href="/dashboard/ai-assistants/new" className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center gap-3">
                    <Plus size={16} /> Crear Nuevo Agente
                </Link>
            </div>

            {/* Nueva Sección: Credenciales de Conexión (Educativa) */}
            <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-purple-400">
                            <Key size={24} />
                            <h2 className="text-xl font-black uppercase tracking-widest">Llave de Conexión (API Key)</h2>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed font-medium">
                            Imagina que esta llave es el **"Pasaporte"** de tu tienda. Sirve para que herramientas como **n8n** puedan entrar a Bayup de forma segura y actualizar la información de tus clientes o avisarte cuando un agente IA haga una venta.
                        </p>
                        <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <Info size={18} className="text-purple-400 shrink-0 mt-1" />
                            <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                                <span className="text-white">Regla de seguridad:</span> No compartas esta llave con nadie. Si crees que alguien la tiene, genera una nueva inmediatamente.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center space-y-4">
                        <div className="bg-black/30 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex items-center justify-between gap-4 group">
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-purple-400 uppercase mb-2 tracking-widest">Tu Llave Secreta</p>
                                <p className="font-mono text-sm tracking-tighter overflow-hidden truncate">
                                    {showApiKey ? apiKey : "••••••••••••••••••••••••••••"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowApiKey(!showApiKey)} className="p-3 hover:bg-white/10 rounded-xl transition-all">
                                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button onClick={copyApiKey} className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-lg">
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>
                        <button className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-rose-400 self-end transition-colors">Generar nueva llave</button>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 opacity-5">
                    <ShieldCheck size={300} />
                </div>
            </div>

            {/* Listado de Agentes (Simplificado para el reporte) */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                        <Activity size={20} className="text-purple-600" />
                        Agentes Operativos
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-50">
                            {assistants.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${ (a as any).is_byoa ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {(a as any).is_byoa ? <Zap size={16} /> : <Bot size={16} />}
                                            </div>
                                            <div><p className="text-sm font-black text-gray-900">{a.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{a.type}</p></div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => fetchLogs(a)} className="h-9 w-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all"><Activity size={16} /></button>
                                            <button onClick={() => handleDelete(a.id)} className="h-9 w-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reutilizamos el Modal de Logs del paso anterior */}
            {selectedForLogs && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-900 text-white">
                            <h2 className="text-xl font-black">Bitácora: {selectedForLogs.name}</h2>
                            <button onClick={() => setSelectedForLogs(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                            {loadingLogs ? <p className="text-center py-10 font-bold text-gray-400 uppercase text-xs">Cargando...</p> : 
                             logs.length === 0 ? <p className="text-center py-10 text-gray-400 font-bold">Sin actividad.</p> :
                             logs.map((log, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm flex gap-4">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Activity size={14} /></div>
                                    <div><p className="text-xs font-black text-gray-900">{log.action_type.toUpperCase()}</p><p className="text-sm text-gray-500">{log.detail}</p></div>
                                </div>
                             ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
