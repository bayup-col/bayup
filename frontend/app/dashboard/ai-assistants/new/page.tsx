"use client";

import { useState, useEffect, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/context/auth-context';

import { assistantService, apiRequest } from '@/lib/api';

import { CheckCircle2, AlertTriangle, Zap, Bot, HelpCircle, Loader2 } from 'lucide-react';



type AssistantType = 'appointment_setter' | 'cart_recovery' | 'customer_reengagement' | 'custom';



function NewAIAssistantContent() {

    const { token } = useAuth();

    const router = useRouter();

    const searchParams = useSearchParams();

    const typeFromQuery = searchParams.get('type') as AssistantType;



    const [step, setStep] = useState(typeFromQuery ? 2 : 1);

    const [selectedType, setSelectedType] = useState<AssistantType | null>(typeFromQuery || null);

    const [isCreating, setIsCreating] = useState(false);

    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');



    const [formData, setFormData] = useState({

        name: '',

        description: '',

        system_prompt: '',

        n8n_webhook_url: '',

        assistant_type: ''

    });



    useEffect(() => {

        if (typeFromQuery) {

            setSelectedType(typeFromQuery);

            setFormData(prev => ({ ...prev, assistant_type: typeFromQuery }));

            setStep(2);

        }

    }, [typeFromQuery]);



    const handleTestWebhook = async () => {

        if (!formData.n8n_webhook_url) return alert("Pega una URL primero.");

        setTestStatus('testing');

        try {

            // Enviamos un ping real al webhook del cliente

            const response = await fetch(formData.n8n_webhook_url, {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ event: 'bayup_test_ping', message: 'Verificando conexión...' })

            });

            if (response.ok) setTestStatus('success');

            else setTestStatus('failed');

        } catch (err) {

            setTestStatus('failed');

        }

    };



    const handleCreate = async () => {

        if (!token) return;

        setIsCreating(true);

        try {

            await assistantService.create(token, {

                ...formData,

                assistant_type: selectedType,

                is_byoa: selectedType === 'custom' || !!formData.n8n_webhook_url,

                status: 'active',

                config: {}

            });

            alert("¡Agente IA guardado y activo! 🚀");

            router.push('/dashboard/ai-assistants');

        } catch (err) {

            alert("Error al guardar el asistente.");

        } finally {

            setIsCreating(false);

        }

    };



    return (

        <div className="max-w-4xl mx-auto pb-20 space-y-10 animate-in fade-in duration-500">

            <div className="flex items-center justify-between">

                <div>

                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">

                        {selectedType === 'custom' ? 'Modo Arquitecto IA' : 'Crear Agente IA'}

                    </h1>

                    <p className="text-gray-500 mt-2 font-medium">Configura el cerebro y las conexiones de tu agente.</p>

                </div>

                <div className="flex items-center gap-2">

                    {[1, 2].map((s) => (

                        <div key={s} className={`h-2 w-8 rounded-full transition-all ${step === s ? 'bg-purple-600' : 'bg-gray-200'}`} />

                    ))}

                </div>

            </div>



            {step === 1 && (

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">

                    {[

                        { id: 'appointment_setter', title: 'Appointment Setter', icon: <Bot size={24}/>, desc: 'Agendar citas automáticamente.', badge: 'Interno' },

                        { id: 'cart_recovery', title: 'Cart Recovery', icon: <Bot size={24}/>, desc: 'Recuperar carritos abandonados.', badge: 'Interno' },

                        { id: 'customer_reengagement', title: 'Fidelización', icon: <Bot size={24}/>, desc: 'Re-activar clientes antiguos.', badge: 'Interno' },

                        { id: 'custom', title: 'Personalizado (BYOA)', icon: <Zap size={24}/>, desc: 'Crea tu propio flujo desde cero.', badge: 'Tu Infra' },

                    ].map((tpl) => (

                        <div 

                            key={tpl.id}

                            onClick={() => { setSelectedType(tpl.id as any); setStep(2); }}

                            className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer shadow-sm group relative ${selectedType === tpl.id ? 'border-purple-600 bg-purple-50/30' : 'border-gray-50 bg-white hover:border-purple-200'}`}

                        >

                            <span className={`absolute top-6 right-8 text-[8px] font-black uppercase px-2 py-1 rounded-md ${tpl.badge === 'Interno' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>{tpl.badge}</span>

                            <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">{tpl.icon}</div>

                            <h3 className="text-lg font-black text-gray-900">{tpl.title}</h3>

                            <p className="text-xs text-gray-500 mt-1">{tpl.desc}</p>

                        </div>

                    ))}

                </div>

            )}



            {step === 2 && (

                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">

                    <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-10">

                        <div className="space-y-6">

                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">

                                <span className="h-8 w-8 bg-purple-600 text-white rounded-xl flex items-center justify-center text-sm font-bold">1</span>

                                Configuración Básica

                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="space-y-2">

                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Comercial</label>

                                    <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Agente de Ventas" className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold border border-transparent focus:border-purple-200" />

                                </div>

                                <div className="space-y-2">

                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>

                                    <input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Para qué sirve..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold border border-transparent focus:border-purple-200" />

                                </div>

                            </div>

                        </div>



                        <div className="space-y-6 pt-10 border-t border-gray-50">

                            <div className="flex items-center justify-between">

                                <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">

                                    <span className="h-8 w-8 bg-purple-600 text-white rounded-xl flex items-center justify-center text-sm font-bold">2</span>

                                    Conexión n8n Webhook

                                </h2>

                                <button className="text-purple-600 flex items-center gap-1 text-[9px] font-black uppercase"><HelpCircle size={12}/> Ver Tutorial</button>

                            </div>

                            

                            <div className="relative">

                                <input 

                                    value={formData.n8n_webhook_url} 

                                    onChange={(e) => { setFormData({...formData, n8n_webhook_url: e.target.value}); setTestStatus('idle'); }} 

                                    placeholder="https://tu-servidor.n8n.cloud/webhook/..." 

                                    className="w-full p-5 bg-purple-50/50 rounded-2xl outline-none text-xs font-mono border border-dashed border-purple-200 pr-32" 

                                />

                                <button 

                                    onClick={handleTestWebhook}

                                    disabled={testStatus === 'testing'}

                                    className={`absolute right-2 top-2 px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${testStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}

                                >

                                    {testStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : testStatus === 'success' ? '¡Conectado!' : 'Probar Link'}

                                </button>

                            </div>

                            

                            {testStatus === 'failed' && (

                                <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-2">

                                    <AlertTriangle size={12}/> No recibimos respuesta del Webhook. Revisa n8n o tu túnel ngrok.

                                </p>

                            )}

                        </div>



                        <div className="space-y-2 pt-10 border-t border-gray-50">

                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instrucciones IA (Prompt)</label>

                            <textarea value={formData.system_prompt} onChange={(e) => setFormData({...formData, system_prompt: e.target.value})} rows={5} placeholder="Define la personalidad y reglas..." className="w-full p-5 bg-gray-50 rounded-[2rem] outline-none text-sm font-medium leading-relaxed border border-transparent focus:border-purple-200 resize-none" />

                        </div>

                    </div>



                    <div className="flex justify-between items-center pt-6">

                        <button onClick={() => setStep(1)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">← Cambiar Plantilla</button>

                        <button 

                            onClick={handleCreate}

                            disabled={isCreating || !formData.name}

                            className="bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all disabled:opacity-50"

                        >

                            {isCreating ? 'Finalizando...' : 'Activar Agente Maestro 🚀'}

                        </button>

                    </div>

                </div>

            )}

        </div>

    );

}



export default function NewAIAssistantPage() {

    return (

        <Suspense fallback={

            <div className="flex items-center justify-center py-20">

                <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />

            </div>

        }>

            <NewAIAssistantContent />

        </Suspense>

    );

}
