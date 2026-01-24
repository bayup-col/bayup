"use client";

import { useState } from 'react';

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
    source: 'web' | 'whatsapp' | 'facebook' | 'instagram' | 'mercadolibre' | 'falabella';
    last_message: string;
    time: string;
    unread: boolean;
    avatar: string;
    messages: Message[];
    // Datos extendidos para el modal
    total_orders: number;
    total_spent: number;
    history: OrderHistory[];
}

const MOCK_CHATS: Chat[] = [
    {
        id: "1", customer_name: "Juan Pérez", source: 'web', 
        last_message: "Hola, ¿tienen stock de la camiseta negra?", time: "10:30 AM", unread: true, avatar: "JP",
        total_orders: 12, total_spent: 450000,
        history: [
            { id: "8241", date: "20 Ene", amount: 25000, status: "Entregado" },
            { id: "8190", date: "15 Ene", amount: 12000, status: "Entregado" },
            { id: "8055", date: "02 Ene", amount: 45000, status: "Entregado" },
            { id: "7900", date: "24 Dic", amount: 85000, status: "Entregado" },
            { id: "7820", date: "10 Dic", amount: 32000, status: "Entregado" },
        ],
        messages: [
            { id: "m1", sender: 'customer', text: "Hola, ¿tienen stock de la camiseta negra?", time: "10:30 AM" }
        ]
    },
    {
        id: "2", customer_name: "María García", source: 'whatsapp', 
        last_message: "Ya realicé el pago, adjunto comprobante.", time: "09:45 AM", unread: false, avatar: "MG",
        total_orders: 3, total_spent: 85000,
        history: [
            { id: "8200", date: "18 Ene", amount: 35000, status: "Procesando" },
            { id: "8100", date: "05 Ene", amount: 50000, status: "Entregado" },
        ],
        messages: [
            { id: "m2", sender: 'customer', text: "Hola!", time: "09:40 AM" },
            { id: "m3", sender: 'customer', text: "Ya realicé el pago, adjunto comprobante.", time: "09:45 AM" }
        ]
    }
];

export default function ChatsPage() {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(MOCK_CHATS[0]);
    const [filter, setFilter] = useState<'all' | 'web' | 'whatsapp' | 'mercadolibre'>('all');
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [aiStep, setAiStep] = useState(1);

    const getSourceIcon = (source: string) => {
        switch(source) {
            case 'web': return '🌐';
            case 'whatsapp': return '✅';
            case 'facebook': return '🔵';
            case 'mercadolibre': return '🟡';
            default: return '💬';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="h-[calc(100vh-10rem)] flex bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden relative font-sans">
            
            {/* 1. SIDEBAR DE CHATS */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter">Mensajes</h2>
                        <button 
                            onClick={() => setIsAIModalOpen(true)}
                            className="h-8 w-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                        >
                            ✨
                        </button>
                    </div>
                    
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                        {['all', 'web', 'whatsapp', 'mercadolibre'].map((s) => (
                            <button 
                                key={s}
                                onClick={() => setFilter(s as any)}
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filter === s ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'}`}
                            >
                                {s === 'all' ? 'Todos' : s}
                            </button>
                        ))}
                    </div>

                    <input 
                        type="text" 
                        placeholder="Buscar conversación..." 
                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                    {MOCK_CHATS.filter(c => filter === 'all' || c.source === filter).map((chat) => (
                        <div 
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-l-4 ${selectedChat?.id === chat.id ? 'bg-white border-purple-600 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-500 shadow-inner">
                                    {chat.avatar}
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center text-[10px] shadow-sm border border-gray-50">
                                    {getSourceIcon(chat.source)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <p className={`text-sm font-bold truncate ${chat.unread ? 'text-gray-900' : 'text-gray-600'}`}>{chat.customer_name}</p>
                                    <span className="text-[10px] text-gray-400">{chat.time}</span>
                                </div>
                                <p className={`text-xs truncate ${chat.unread ? 'font-bold text-purple-600' : 'text-gray-400'}`}>{chat.last_message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. VENTANA DE CONVERSACIÓN (Ahora ocupa el resto del espacio) */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChat ? (
                    <>
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
                            <div 
                                onClick={() => setIsCustomerModalOpen(true)}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-all">{selectedChat.avatar}</div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors">{selectedChat.customer_name}</p>
                                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Ver detalles del cliente
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30" style={{backgroundImage: 'radial-gradient(#e5e7eb 0.5px, transparent 0.5px)', backgroundSize: '20px 20px'}}>
                            {selectedChat.messages.map((m) => (
                                <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-3xl shadow-sm text-sm ${m.sender === 'me' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                            <input 
                                type="text" 
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <button className="bg-purple-600 text-white h-12 w-12 rounded-2xl shadow-lg flex items-center justify-center hover:bg-purple-700 transition-all">✈️</button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <div className="text-6xl text-gray-100">💬</div>
                        <p className="font-bold uppercase tracking-widest text-xs">Selecciona un chat para empezar</p>
                    </div>
                )}
            </div>

            {/* MODAL DETALLES DEL CLIENTE */}
            {isCustomerModalOpen && selectedChat && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 relative">
                            <button onClick={() => setIsCustomerModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors text-xl">✕</button>
                            <div className="text-center">
                                <div className="h-20 w-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-3xl shadow-xl flex items-center justify-center text-3xl font-black text-white mx-auto mb-4">{selectedChat.avatar}</div>
                                <h3 className="text-xl font-black text-gray-900">{selectedChat.customer_name}</h3>
                                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-1">Cliente Verificado {getSourceIcon(selectedChat.source)}</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto max-h-[400px] custom-scrollbar">
                            {/* KPIs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-3xl text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pedidos Totales</p>
                                    <p className="text-2xl font-black text-gray-900">{selectedChat.total_orders}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-3xl text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gasto Total</p>
                                    <p className="text-2xl font-black text-green-600">{formatCurrency(selectedChat.total_spent)}</p>
                                </div>
                            </div>

                            {/* Historial */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Últimos 5 Pedidos</h4>
                                <div className="space-y-2">
                                    {selectedChat.history.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-purple-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center text-sm font-bold text-purple-600">#</div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900">Pedido #{order.id}</p>
                                                    <p className="text-[10px] text-gray-400">{order.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900">{formatCurrency(order.amount)}</p>
                                                <span className="text-[9px] font-black text-green-500 uppercase">{order.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-0">
                            <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg">Ver Perfil Completo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL IA (Se mantiene igual) */}
            {isAIModalOpen && (
                <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-8 text-white relative">
                            <button onClick={() => setIsAIModalOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">✕</button>
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md">✨</div>
                                <div><h2 className="text-xl font-black tracking-tight">Chat Inteligente</h2><p className="text-purple-100 text-xs font-bold uppercase tracking-widest">Paso {aiStep} de 3</p></div>
                            </div>
                        </div>
                        <div className="p-8 flex-1">
                            {aiStep === 1 && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 italic underline decoration-purple-500 underline-offset-4 text-lg">¿Cómo funciona?</h3>
                                    <ul className="space-y-4 text-sm text-gray-600">
                                        <li className="flex gap-3"><span className="text-purple-600 font-black">01.</span>Sincronizamos tu stock y precios con la IA.</li>
                                        <li className="flex gap-3"><span className="text-purple-600 font-black">02.</span>La IA atiende clientes en tus horarios de descanso.</li>
                                        <li className="flex gap-3"><span className="text-purple-600 font-black">03.</span>Tú solo revisas las ventas cerradas al día siguiente.</li>
                                    </ul>
                                </div>
                            )}
                            {aiStep === 2 && (
                                <div className="space-y-6">
                                    <h3 className="font-bold text-gray-900 text-lg italic">Horarios de descanso</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[10px] font-black text-gray-400 uppercase">Activar IA</label><input type="time" defaultValue="20:00" className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" /></div>
                                        <div><label className="text-[10px] font-black text-gray-400 uppercase">Desactivar IA</label><input type="time" defaultValue="08:00" className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" /></div>
                                    </div>
                                </div>
                            )}
                            {aiStep === 3 && (
                                <div className="space-y-6">
                                    <h3 className="font-bold text-gray-900 text-lg italic">Días de trabajo</h3>
                                    <div className="flex flex-wrap gap-2">{['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(day => (<span key={day} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-400 cursor-pointer hover:border-purple-500 hover:text-purple-600 transition-all">{day}</span>))}</div>
                                </div>
                            )}
                        </div>
                        <div className="p-8 pt-0 flex gap-3">
                            <button onClick={() => { if (aiStep < 3) setAiStep(aiStep + 1); else { setIsAIModalOpen(false); setAiStep(1); } }} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all">{aiStep === 3 ? 'Activar IA Ahora' : 'Siguiente paso'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
