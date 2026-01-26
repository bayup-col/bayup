"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Send, 
  X, 
  MessageSquare, 
  Mic, 
  Sparkles, 
  Database, 
  FileSpreadsheet, 
  PackagePlus,
  ArrowRight,
  Users
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bayt';
    type?: 'text' | 'action' | 'report';
    imageUrl?: string;
}

export const BaytAssistant = () => {
    const { token } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "¡Hola! Soy Bayt, tu asistente inteligente. ¿En qué puedo ayudarte a potenciar tu negocio hoy?", sender: 'bayt' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera manteniendo la conversación
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (manualText?: string) => {
        const textToSend = manualText || input.trim();
        if (!textToSend || !token) return;

        const userMsg: Message = { id: Date.now(), text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const chatHistory = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));
            chatHistory.push({ role: 'user', content: textToSend });

            const data: any = await apiRequest('/ai/chat', {
                method: 'POST',
                token,
                body: JSON.stringify({ messages: chatHistory })
            });

            const { response, action, data: actionData } = data;

            if (action === 'navigate' && actionData) {
                router.push(actionData);
            }

            const baytMsg: Message = { 
                id: Date.now() + 1, 
                text: response, 
                sender: 'bayt',
                imageUrl: action === 'image' ? actionData : undefined
            };
            
            setMessages(prev => [...prev, baytMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now(), text: "Lo siento, tuve un problema al conectarme con mi cerebro. Verifica tu conexión.", sender: 'bayt' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[300] flex flex-col items-end">
            {isOpen && (
                <div ref={modalRef} className="mb-4 w-[400px] h-[600px] bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
                    {/* Header Premium de Bayt */}
                    <div className="bg-gray-900 p-8 text-white relative">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Bot size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Bayt AI</h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cerebro Operativo Activo</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Área de Chat */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30 custom-scrollbar">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed ${
                                    m.sender === 'user' 
                                    ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-200' 
                                    : 'bg-white text-gray-700 rounded-tl-none border border-gray-100 shadow-sm font-medium'
                                }`}>
                                    {m.text}
                                    {m.imageUrl && (
                                        <img src={m.imageUrl} alt="AI Generated" className="mt-3 rounded-2xl w-full h-auto shadow-md border border-gray-100" />
                                    )}
                                    {m.type === 'report' && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                                            <FileSpreadsheet className="text-emerald-600" size={20} />
                                            <span className="text-[10px] font-black text-gray-400 uppercase">ventas_enero.xlsx</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="px-8 py-4 flex gap-2 overflow-x-auto no-scrollbar">
                        <button 
                            onClick={() => handleSend("Bayt, dame el informe del día 🚀")}
                            className="flex-shrink-0 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-purple-100"
                        >
                            <Sparkles size={14} /> Informe del día
                        </button>
                        <button 
                            onClick={() => handleSend("¿Cuántos vendedores tengo?")}
                            className="flex-shrink-0 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-blue-100"
                        >
                            <Users size={14} /> Mis Vendedores
                        </button>
                    </div>

                    {/* Input */}
                    <div className="p-6 bg-white border-t border-gray-100">
                        <div className="relative flex items-center bg-gray-50 rounded-[1.5rem] p-2 pr-4 border border-transparent focus-within:border-purple-200 focus-within:bg-white transition-all shadow-inner">
                            <button className="p-3 text-gray-400 hover:text-purple-600"><Mic size={20} /></button>
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pídele algo a Bayt..." 
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium px-2 py-3" 
                            />
                            <button 
                                onClick={() => handleSend()}
                                className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-lg shadow-gray-200"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón Flotante */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 relative overflow-hidden group ${isOpen ? 'bg-gray-900 text-white rotate-90' : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'}`}
            >
                {isOpen ? <X size={24} /> : (
                    <>
                        <Bot size={28} />
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </>
                )}
            </button>
        </div>
    );
};