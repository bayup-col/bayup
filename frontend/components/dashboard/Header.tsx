"use client";

import React, { useState } from 'react';
import { Bell, Bot, Package, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    pathname: string;
    userEmail: string | null;
    userRole: string | null;
    userMenuOpen: boolean;
    setUserMenuOpen: (open: boolean) => void;
    logout: () => void;
    setIsUserSettingsOpen: (open: boolean) => void;
    isBaytOpen: boolean;
    setIsBaytOpen: (open: boolean) => void;
}

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'order' | 'customer' | 'alert' | 'success';
    read: boolean;
}

export const DashboardHeader = ({ 
    pathname, 
    userEmail, 
    userRole, 
    userMenuOpen, 
    setUserMenuOpen, 
    logout, 
    setIsUserSettingsOpen,
    isBaytOpen,
    setIsBaytOpen
}: HeaderProps) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', title: 'Nuevo pedido #1234', description: 'Has recibido una nueva venta de Camiseta Pima.', time: 'Hace 5 min', type: 'order', read: false },
        { id: '2', title: 'Stock bajo', description: 'Zapatillas Running Pro están por agotarse.', time: 'Hace 2 horas', type: 'alert', read: false },
        { id: '3', title: 'Nuevo cliente', description: 'Juan Pérez se ha registrado en tu tienda.', time: 'Hace 5 horas', type: 'customer', read: true },
        { id: '4', title: 'Pago confirmado', description: 'El pago del pedido #1230 ha sido procesado.', time: 'Ayer', type: 'success', read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <Package size={14} className="text-[#004d4d]" />;
            case 'customer': return <Users size={14} className="text-[#00F2FF]" />;
            case 'alert': return <AlertCircle size={14} className="text-rose-600" />;
            case 'success': return <CheckCircle2 size={14} className="text-emerald-600" />;
            default: return <Bell size={14} />;
        }
    };

    return (
        <header className="h-24 flex-shrink-0 flex items-center justify-end px-10 sticky top-0 z-[50] pointer-events-none">
            <div className="relative group p-[2px] rounded-[2rem] overflow-hidden isolate pointer-events-auto shadow-lg shadow-[#004d4d]/5">
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden -z-10">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 left-1/2 w-[300%] aspect-square"
                        style={{
                            background: "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)",
                            translateX: "-50%",
                            translateY: "-50%",
                            willChange: "transform"
                        }}
                    />
                    <div className="absolute inset-[1px] rounded-[1.95rem] bg-white/40 backdrop-blur-2xl" />
                </div>

                <div className="px-6 py-2 flex items-center gap-4 transition-all duration-500 hover:bg-white/20">
                    
                                    {/* Botón de Bayt AI */}
                                    <button 
                                        onClick={() => setIsBaytOpen(!isBaytOpen)}
                                        className={`relative p-2 rounded-full transition-all duration-300 group ${isBaytOpen ? 'bg-[#004d4d] text-[#00F2FF] shadow-lg shadow-[#004d4d]/20' : 'text-[#004d4d]/60 hover:text-[#004d4d] hover:bg-[#004d4d]/5'}`}
                                        title="Hablar con Bayt AI"
                                    >
                                        <Bot size={20} className={`transition-transform duration-500 ${isBaytOpen ? 'rotate-12 scale-110' : 'group-hover:scale-110'}`} />
                                        {!isBaytOpen && <span className="absolute top-1 right-1 h-2 w-2 bg-[#A855F7] rounded-full border-2 border-white animate-pulse"></span>}
                                    </button>
                    
                                    <div className="h-6 w-px bg-[#004d4d]/10"></div>
                    
                                    {/* Botón de Notificaciones */}
                                    <div className="relative">
                                        <button 
                                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                                            className={`relative p-2 rounded-full transition-all duration-300 group ${notificationsOpen ? 'bg-white text-[#004d4d] shadow-sm' : 'text-[#004d4d]/60 hover:text-[#004d4d] hover:bg-[#004d4d]/5'}`}
                                        >
                                            <Bell size={20} className="group-hover:scale-110 transition-transform" />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-1 right-1 h-2 w-2 bg-[#EF4444] rounded-full border-2 border-white"></span>
                                            )}
                                        </button>
                        {notificationsOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                                <div className="absolute right-0 mt-6 w-80 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-6 border-b border-[#004d4d]/5 flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-[#004d4d] uppercase tracking-[0.2em]">Notificaciones</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllAsRead} className="text-[9px] font-black text-[#00F2FF] uppercase hover:underline">Marcar todo</button>
                                        )}
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">Sin actividad nueva</div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div key={n.id} className={`p-5 border-b border-[#004d4d]/5 hover:bg-[#00F2FF]/5 transition-colors flex gap-4 relative group ${!n.read ? 'bg-[#00F2FF]/5' : ''}`}>
                                                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00F2FF]"></div>}
                                                    <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${
                                                        n.type === 'order' ? 'bg-[#004d4d]/5' : 
                                                        n.type === 'alert' ? 'bg-rose-50' : 
                                                        n.type === 'customer' ? 'bg-[#00F2FF]/10' : 'bg-emerald-50'
                                                    }`}>
                                                        {getIcon(n.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-[11px] font-black leading-tight tracking-tight ${!n.read ? 'text-[#001A1A]' : 'text-[#004d4d]/60'}`}>{n.title}</p>
                                                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{n.description}</p>
                                                        <p className="text-[8px] font-black text-[#004d4d]/30 uppercase mt-2 tracking-widest">{n.time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button className="w-full py-4 bg-[#004d4d]/5 text-[9px] font-black text-[#004d4d] uppercase tracking-[0.2em] hover:bg-[#004d4d]/10 transition-all border-t border-[#004d4d]/5">
                                        Historial Completo
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="h-6 w-px bg-[#004d4d]/10"></div>

                    {/* Menú de Usuario - Avatar Rediseñado */}
                    <div className="relative">
                        <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center group">
                            <div className="h-10 w-10 rounded-2xl p-[2px] bg-gradient-to-tr from-[#004d4d] to-[#00F2FF] shadow-lg shadow-[#00F2FF]/10 group-hover:shadow-[#00F2FF]/30 transition-all duration-500">
                                <div className="h-full w-full rounded-[0.9rem] bg-[#001A1A] flex items-center justify-center text-[#00F2FF] text-xs font-black border border-white/10">
                                    {userEmail?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </button>
                        {userMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                                <div className="absolute right-0 mt-6 w-56 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-6 py-4 border-b border-[#004d4d]/5 mb-2 text-right">
                                        <p className="text-[11px] font-black text-[#001A1A] truncate">{userEmail}</p>
                                        <p className="text-[8px] font-black text-[#00F2FF] uppercase tracking-widest mt-1">Socio Premium</p>
                                    </div>
                                    <button onClick={() => { setUserMenuOpen(false); setIsUserSettingsOpen(true); }} className="w-full flex items-center justify-end gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#004d4d]/60 hover:text-[#001A1A] hover:bg-[#004d4d]/5 transition-all">Perfil</button>
                                    <div className="h-px bg-[#004d4d]/5 my-1 mx-6"></div>
                                    <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full flex items-center justify-end gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all">Desconectar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};