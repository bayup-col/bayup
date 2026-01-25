"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/context/auth-context";

interface Message {
    id: string;
    sender: 'customer' | 'me';
    text: string;
    time: string;
}

interface OrderHistory {
    id: string;
    date: string;
    amount: number;
    status: string;
}

interface Chat {
    id: string;
    customer_name: string;
    source: 'web' | 'whatsapp' | 'facebook' | 'instagram' | 'mercadolibre' | 'falabella' | 'tiktok' | 'telegram';
    last_message: string;
    time: string;
    unread: boolean;
    avatar: string;
    messages: Message[];
    total_orders: number;
    total_spent: number;
    history: OrderHistory[];
}

const CHANNELS = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '✅', color: 'bg-emerald-50 text-emerald-600', status: 'Connected' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-pink-50 text-pink-600', status: 'Disconnected' },
    { id: 'facebook', name: 'Facebook', icon: '🔵', color: 'bg-blue-50 text-blue-600', status: 'Disconnected' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black text-white', status: 'Disconnected' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', color: 'bg-sky-50 text-sky-600', status: 'Disconnected' },
    { id: 'mercadolibre', name: 'Mercado Libre', icon: '🟡', color: 'bg-yellow-50 text-yellow-700', status: 'Connected' },
    { id: 'falabella', name: 'Falabella', icon: '🍊', color: 'bg-orange-50 text-orange-600', status: 'Disconnected' },
];

const MOCK_CHATS: Chat[] = [
    {
        id: "1", customer_name: "Juan Pérez", source: 'web', 
        last_message: "Hola, ¿tienen stock de la camiseta negra?", time: "10:30 AM", unread: true, avatar: "JP",
        total_orders: 12, total_spent: 450000,
        history: [{ id: "8241", date: "20 Ene", amount: 25000, status: "Entregado" }],
        messages: [{ id: "m1", sender: 'customer', text: "Hola, ¿tienen stock de la camiseta negra?", time: "10:30 AM" }]
    },
    {
        id: "2", customer_name: "María García", source: 'whatsapp', 
        last_message: "Ya realicé el pago, adjunto comprobante.", time: "09:45 AM", unread: false, avatar: "MG",
        total_orders: 3, total_spent: 85000,
        history: [{ id: "8200", date: "18 Ene", amount: 35000, status: "Procesando" }],
        messages: [{ id: "m3", sender: 'customer', text: "Ya realicé el pago, adjunto comprobante.", time: "09:45 AM" }]
    }
];

export default function ChatsPage() {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(MOCK_CHATS[0]);
    const [filter, setFilter] = useState('all');
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [aiStep, setAiStep] = useState(1);

    const getSourceIcon = (source: string) => {
        const channel = CHANNELS.find(c => c.id === source);
        return channel ? channel.icon : '💬';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="h-[calc(100vh-10rem)] flex bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden relative">
            
            {/* 1. SIDEBAR DE CHATS */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Mensajes</h2>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsConfigModalOpen(true)}
                                className="h-9 w-9 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm"
                                title="Configurar Canales"
                            >
                                ⚙️
                            </button>
                            <button 
                                onClick={() => setIsAIModalOpen(true)}
                                className="h-9 w-9 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
                                title="Agente IA"
                            >
                                ✨
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                        {['all', 'web', 'whatsapp', 'mercadolibre', 'instagram'].map((s) => (
                            <button 
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filter === s ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'}`}
                            >
                                {s === 'all' ? 'Todos' : s}
                            </button>
                        ))}
                    </div>

                    <input type="text" placeholder="Buscar cliente..." className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs focus:ring-4 focus:ring-purple-500/5 outline-none shadow-sm transition-all" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {MOCK_CHATS.filter(c => filter === 'all' || c.source === filter).map((chat) => (
                        <div 
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`p-5 flex items-center gap-4 cursor-pointer transition-all border-l-4 ${selectedChat?.id === chat.id ? 'bg-white border-purple-600 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-100 to-purple-50 flex items-center justify-center font-black text-purple-600 shadow-inner">{chat.avatar}</div>
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center text-[10px] shadow-sm border border-gray-50">{getSourceIcon(chat.source)}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <p className={`text-sm font-black truncate ${chat.unread ? 'text-gray-900' : 'text-gray-600'}`}>{chat.customer_name}</p>
                                    <span className="text-[10px] font-bold text-gray-400">{chat.time}</span>
                                </div>
                                <p className={`text-xs truncate mt-0.5 ${chat.unread ? 'font-bold text-purple-600' : 'text-gray-400'}`}>{chat.last_message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. VENTANA DE CHAT */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChat ? (
                    <>
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                            <div onClick={() => setIsCustomerModalOpen(true)} className="flex items-center gap-4 cursor-pointer group">
                                <div className="h-11 w-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-100 group-hover:scale-105 transition-transform">{selectedChat.avatar}</div>
                                <div>
                                    <p className="text-base font-black text-gray-900 group-hover:text-purple-600 transition-colors tracking-tight">{selectedChat.customer_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En línea · Ver Perfil CRM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/20 custom-scrollbar" style={{backgroundImage: 'radial-gradient(#e5e7eb 0.8px, transparent 0.8px)', backgroundSize: '24px 24px'}}>
                            {selectedChat.messages.map((m) => (
                                <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[65%] p-5 rounded-[2rem] shadow-sm text-sm font-medium leading-relaxed ${m.sender === 'me' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                        {m.text}
                                        <p className={`text-[9px] mt-2 font-bold uppercase opacity-50 ${m.sender === 'me' ? 'text-right' : 'text-left'}`}>{m.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white border-t border-gray-100 flex gap-4 items-center">
                            <input type="text" placeholder="Escribe tu respuesta aquí..." className="flex-1 bg-gray-50 border border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-purple-500/5 outline-none transition-all font-medium" />
                            <button className="bg-purple-600 text-white h-14 w-14 rounded-2xl shadow-xl shadow-purple-100 flex items-center justify-center hover:bg-purple-700 hover:scale-105 transition-all">
                                <svg className="w-6 h-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 2 9 18zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                        <div className="text-8xl mb-4">💬</div>
                        <p className="font-black uppercase tracking-[0.2em] text-[10px]">Selecciona un hilo de conversación</p>
                    </div>
                )}
            </div>

            {/* MODAL INTEGRACIONES (CRM CONFIG) */}
            {isConfigModalOpen && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Conectar Canales</h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Centraliza tus ventas y mensajes</p>
                            </div>
                            <button onClick={() => setIsConfigModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>
                        
                        <div className="p-10 overflow-y-auto max-h-[500px] custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
                            {CHANNELS.map((channel) => (
                                <div key={channel.id} className="p-6 rounded-[2rem] border border-gray-100 hover:border-purple-200 transition-all group flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${channel.color}`}>{channel.icon}</div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{channel.name}</p>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${channel.status === 'Connected' ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                {channel.status === 'Connected' ? '● Activo' : 'Disponible'}
                                            </p>
                                        </div>
                                    </div>
                                    <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${channel.status === 'Connected' ? 'bg-gray-50 text-gray-400' : 'bg-purple-600 text-white shadow-lg shadow-purple-100 hover:bg-purple-700'}`}>
                                        {channel.status === 'Connected' ? 'Ajustes' : 'Vincular'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-10 pt-0">
                            <div className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100 flex items-center gap-4">
                                <div className="text-2xl">💡</div>
                                <p className="text-xs font-bold text-purple-700 leading-relaxed">Vincular tus canales permite que el **Asistente IA** responda automáticamente por ti en todas las plataformas.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OTROS MODALES (IA y Cliente)... */}
            {isCustomerModalOpen && selectedChat && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 text-center relative">
                            <button onClick={() => setIsCustomerModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors text-xl">✕</button>
                            <div className="h-24 w-24 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-[2rem] shadow-xl flex items-center justify-center text-4xl font-black text-white mx-auto mb-6">{selectedChat.avatar}</div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedChat.customer_name}</h3>
                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mt-2">Perfil Omnicanal Activo</p>
                        </div>
                        <div className="p-10 space-y-8 overflow-y-auto max-h-[400px] custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-6 rounded-3xl text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Órdenes</p><p className="text-3xl font-black text-gray-900">{selectedChat.total_orders}</p></div>
                                <div className="bg-gray-50 p-6 rounded-3xl text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Gasto Total</p><p className="text-3xl font-black text-emerald-600">{formatCurrency(selectedChat.total_spent)}</p></div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actividad Reciente</h4>
                                {selectedChat.history.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:border-purple-200 transition-all">
                                        <div><p className="text-xs font-black text-gray-900">Orden #{order.id}</p><p className="text-[10px] font-bold text-gray-400 mt-1">{order.date}</p></div>
                                        <div className="text-right"><p className="text-sm font-black text-gray-900">{formatCurrency(order.amount)}</p><span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{order.status}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-10 pt-0"><button className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">Ver historial completo</button></div>
                    </div>
                </div>
            )}

            {/* MODAL IA */}
            {isAIModalOpen && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="bg-gray-900 p-10 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-6">✨</div>
                                <h2 className="text-2xl font-black tracking-tight leading-none">Cerebro IA</h2>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Configuración de Automatización</p>
                            </div>
                            <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-5 rotate-12">✨</div>
                        </div>
                        <div className="p-10 flex-1 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Horarios de Activación</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[9px] font-black text-gray-400 uppercase">Desde</label><input type="time" defaultValue="20:00" className="w-full mt-2 p-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-black focus:bg-white focus:ring-4 focus:ring-purple-500/5 transition-all outline-none" /></div>
                                    <div><label className="text-[9px] font-black text-gray-400 uppercase">Hasta</label><input type="time" defaultValue="08:00" className="w-full mt-2 p-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-black focus:bg-white focus:ring-4 focus:ring-purple-500/5 transition-all outline-none" /></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 pt-0"><button onClick={() => setIsAIModalOpen(false)} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-100 transition-all">Guardar Configuración</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
