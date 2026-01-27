"use client";

import React, { useState } from 'react';
import { Bell, Bot, Package, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

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
            case 'order': return <Package size={14} className="text-purple-600" />;
            case 'customer': return <Users size={14} className="text-blue-600" />;
            case 'alert': return <AlertCircle size={14} className="text-rose-600" />;
            case 'success': return <CheckCircle2 size={14} className="text-emerald-600" />;
            default: return <Bell size={14} />;
        }
    };

    return (
        <header className="h-16 flex-shrink-0 bg-white/70 backdrop-blur-lg border-b border-white/20 flex items-center justify-between px-8 sticky top-0 z-[50] shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Plataforma</span>
                <span className="text-gray-300">/</span>
                <span className="text-xs font-bold text-gray-600 capitalize">{pathname.split('/').pop()?.replace('-', ' ')}</span>
            </div>
            
            <div className="flex items-center gap-6">
                {/* Botón de Bayt AI */}
                <button 
                    onClick={() => setIsBaytOpen(!isBaytOpen)}
                    className={`relative p-2.5 rounded-xl transition-all duration-300 group ${isBaytOpen ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    title="Hablar con Bayt AI"
                >
                    <Bot size={22} className={`transition-transform duration-500 ${isBaytOpen ? 'rotate-12 scale-110' : 'group-hover:scale-110'}`} />
                    {!isBaytOpen && <span className="absolute top-2 right-2 h-2 w-2 bg-purple-500 rounded-full border-2 border-white animate-pulse"></span>}
                </button>

                {/* Botón de Notificaciones */}
                <div className="relative">
                    <button 
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className={`relative p-2.5 rounded-xl transition-all duration-300 group ${notificationsOpen ? 'bg-gray-100 text-purple-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Bell size={22} className="group-hover:scale-110 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Notificaciones</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-[9px] font-black text-purple-600 uppercase hover:underline">Marcar todo como leído</button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase">No tienes notificaciones</div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-4 relative group ${!n.read ? 'bg-purple-50/30' : ''}`}>
                                                {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600"></div>}
                                                <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
                                                    n.type === 'order' ? 'bg-purple-100' : 
                                                    n.type === 'alert' ? 'bg-rose-100' : 
                                                    n.type === 'customer' ? 'bg-blue-100' : 'bg-emerald-100'
                                                }`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-xs font-black leading-tight ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                                                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{n.description}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">{n.time}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button className="w-full py-4 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all border-t border-gray-100">
                                    Ver todas las notificaciones
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-3 pl-4 border-l border-gray-100 group">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-gray-900 leading-none">{userEmail?.split('@')[0]}</p>
                            <p className="text-[10px] font-bold text-purple-500 mt-1 uppercase tracking-tighter italic">{userRole === 'super_admin' ? 'Super Admin' : 'Plan Empresa'}</p>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                            {userEmail?.charAt(0).toUpperCase()}
                        </div>
                    </button>
                    {userMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button onClick={() => { setUserMenuOpen(false); setIsUserSettingsOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors font-bold text-left"><span className="text-lg">👤</span> Usuario</button>
                                <div className="h-px bg-gray-50 my-1 mx-2"></div>
                                <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-bold text-left"><span className="text-lg">🚪</span> Cerrar Sesión</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};