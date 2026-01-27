"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { collectionService } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewCollectionPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'active',
        image_url: null // Aseguramos que se envíe como nulo para evitar errores de validación
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !token) return;

        setLoading(true);
        try {
            await collectionService.create(token, formData);
            alert("Colección creada con éxito.");
            router.push('/dashboard/collections');
        } catch (err: any) {
            console.error("Error al crear colección:", err);
            alert(`Error al crear la colección: ${err.message || "Verifica los datos"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Nueva Colección</h1>
                    <p className="text-gray-500 mt-2 font-medium">Crea una categoría para organizar tus productos.</p>
                </div>
                <Link href="/dashboard/collections" className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-purple-600 transition-all border border-gray-100 shadow-sm">
                    <ArrowLeft size={20} />
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título de la Colección</label>
                            <input 
                                type="text" 
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Ej: Nueva Colección de Verano"
                                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción (Opcional)</label>
                            <textarea 
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Describe de qué trata esta colección..."
                                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-medium transition-all shadow-inner resize-none" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de Visibilidad</label>
                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, status: 'active'})}
                                    className={`flex-1 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${formData.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                                >
                                    Pública (Activa)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, status: 'hidden'})}
                                    className={`flex-1 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${formData.status === 'hidden' ? 'bg-gray-100 text-gray-600 border-gray-200 shadow-sm' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                                >
                                    Oculta (Borrador)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        <Save size={18} /> {loading ? 'Guardando...' : 'Crear Colección'}
                    </button>
                </div>
            </form>
        </div>
    );
}
