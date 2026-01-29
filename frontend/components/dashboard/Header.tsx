"use client";

import React, { useState } from 'react';
import { Bell, Bot, Package, Users, AlertCircle, CheckCircle2, Ghost, LogOut, User as UserIcon, Truck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    type: 'order' | 'logistics' | 'alert' | 'system' | 'success';
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
    const [isHoveringUser, setIsHoveringUser] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', title: 'Nueva venta confirmada', description: 'Has recibido un pago de $150.000 via Mercado Pago.', time: 'Hace 5 min', type: 'success', read: false },
        { id: '2', title: 'Mensaje de Bayt AI', description: 'He detectado una oportunidad en "Zapatillas Urbanas".', time: 'Hace 15 min', type: 'system', read: false },
        { id: '3', title: 'Envío pendiente', description: 'La orden #8240 está lista para despacho.', time: 'Hace 1 hora', type: 'logistics', read: false },
        { id: '4', title: 'Stock Crítico', description: 'Solo quedan 2 unidades de "Reloj Smart".', time: 'Hace 3 horas', type: 'alert', read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const getNotificationStyles = (type: string) => {
        switch (type) {
            case 'success': // Verde - Ventas/Pagos
                return { 
                    icon: <CheckCircle2 size={14} className="text-emerald-600" />, 
                    bg: 'bg-emerald-50', 
                    accent: 'bg-emerald-500' 
                };
            case 'logistics': // Azul - Envíos
                return { 
                    icon: <Truck size={14} className="text-blue-600" />, 
                    bg: 'bg-blue-50', 
                    accent: 'bg-blue-500' 
                };
            case 'alert': // Rojo - Alertas/Negativo
                return { 
                    icon: <AlertCircle size={14} className="text-rose-600" />, 
                    bg: 'bg-rose-50', 
                    accent: 'bg-rose-500' 
                };
            case 'system': // Morado - Bayt AI
                return { 
                    icon: <Sparkles size={14} className="text-purple-600" />, 
                    bg: 'bg-purple-50', 
                    accent: 'bg-purple-500' 
                };
            default:
                return { 
                    icon: <Bell size={14} className="text-gray-600" />, 
                    bg: 'bg-gray-50', 
                    accent: 'bg-gray-500' 
                };
        }
    };

    return (
        <header className="h-24 flex-shrink-0 flex items-center justify-end px-10 sticky top-0 z-[100] pointer-events-none">
            <div className="flex items-center pointer-events-auto">
                
                {/* Contenedor Único Premium (Bayt, Notificaciones, Avatar) */}
                <div className="relative group p-[2px] rounded-full">
                    <div className="absolute inset-0 rounded-full overflow-hidden -z-10 shadow-lg shadow-[#004d4d]/5">
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
                        <div className="absolute inset-[1.5px] rounded-full bg-white/40 backdrop-blur-2xl" />
                    </div>

                    <div className="px-4 py-1.5 flex items-center gap-4">
                        {/* 1. Botón de Bayt AI */}
                        <button 
                            onClick={() => setIsBaytOpen(!isBaytOpen)}
                            className={`relative p-2 rounded-full transition-all duration-300 group ${isBaytOpen ? 'bg-[#004d4d] text-[#00F2FF] shadow-lg shadow-[#004d4d]/20' : 'text-[#004d4d]/60 hover:text-[#004d4d] hover:bg-white/50'}`}
                            title="Hablar con Bayt AI"
                        >
                            <Bot size={20} className={`transition-transform duration-500 ${isBaytOpen ? 'rotate-12 scale-110' : 'group-hover:scale-110'}`} />
                            {!isBaytOpen && <span className="absolute top-1 right-1 h-2 w-2 bg-[#A855F7] rounded-full border-2 border-white animate-pulse"></span>}
                        </button>

                        <div className="h-6 w-px bg-[#004d4d]/10"></div>

                        {/* 2. Botón de Notificaciones */}
                        <div className="relative">
                            <button 
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className={`relative p-2 rounded-full transition-all duration-300 group ${notificationsOpen ? 'bg-white text-[#004d4d] shadow-sm' : 'text-[#004d4d]/60 hover:text-[#004d4d] hover:bg-white/50'}`}
                            >
                                <Bell size={20} className="group-hover:scale-110 transition-transform" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 h-2 w-2 bg-[#EF4444] rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {notificationsOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-6 w-80 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden z-[110]"
                                        >
                                            <div className="p-6 border-b border-[#004d4d]/5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-[10px] font-black text-[#004d4d] uppercase tracking-[0.2em]">Notificaciones</h3>
                                                    {unreadCount > 0 && <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                                                </div>
                                                {unreadCount > 0 && (
                                                    <button onClick={markAllAsRead} className="text-[9px] font-black text-[#004d4d]/40 uppercase hover:text-[#004d4d] transition-colors">Marcar todo</button>
                                                )}
                                            </div>
                                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                                {notifications.length === 0 ? (
                                                    <div className="p-10 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">Sin actividad nueva</div>
                                                ) : (
                                                    notifications.map((n) => {
                                                        const styles = getNotificationStyles(n.type);
                                                        return (
                                                            <div key={n.id} className={`p-5 border-b border-[#004d4d]/5 hover:bg-gray-50/50 transition-colors flex gap-4 relative group ${!n.read ? 'bg-white' : 'opacity-60'}`}>
                                                                {!n.read && <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${styles.accent}`}></div>}
                                                                <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${styles.bg}`}>
                                                                    {styles.icon}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className={`text-[11px] font-black leading-tight tracking-tight ${!n.read ? 'text-[#001A1A]' : 'text-[#004d4d]/60'}`}>{n.title}</p>
                                                                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{n.description}</p>
                                                                    <p className="text-[8px] font-black text-[#004d4d]/30 uppercase mt-2 tracking-widest">{n.time}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            <button className="w-full py-4 bg-[#004d4d]/5 text-[9px] font-black text-[#004d4d] uppercase tracking-[0.2em] hover:bg-[#004d4d]/10 transition-all border-t border-[#004d4d]/5">
                                                Historial Completo
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-6 w-px bg-[#004d4d]/10"></div>

                        {/* 3. Avatar con Reveal Inteligente al Hover */}
                        <div 
                            className="relative flex items-center"
                            onMouseEnter={() => setIsHoveringUser(true)}
                            onMouseLeave={() => setIsHoveringUser(false)}
                        >
                            <div className="flex items-center">
                                <motion.div 
                                    initial={false}
                                    animate={{ 
                                        width: (isHoveringUser || userMenuOpen) ? 'auto' : 0,
                                        opacity: (isHoveringUser || userMenuOpen) ? 1 : 0,
                                        marginRight: (isHoveringUser || userMenuOpen) ? 16 : 0
                                    }}
                                    className="overflow-hidden whitespace-nowrap text-right pointer-events-none"
                                >
                                    <p className="text-[11px] font-black text-[#001A1A] leading-tight truncate">
                                        {userEmail?.split('@')[0]}
                                    </p>
                                    <p className="text-[8px] font-black text-[#004d4d] uppercase tracking-widest italic mt-0.5">
                                        {userRole === 'super_admin' ? 'Master Admin' : 'Premium Partner'}
                                    </p>
                                </motion.div>

                                <div className="relative">
                                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center group">
                                        <div className="h-10 w-10 rounded-2xl p-[2px] bg-gradient-to-tr from-[#004d4d] to-[#00F2FF] shadow-lg shadow-[#00F2FF]/10 group-hover:shadow-[#00F2FF]/30 transition-all duration-500">
                                            <div className="h-full w-full rounded-[0.9rem] bg-[#001A1A] flex items-center justify-center text-[#00F2FF] text-xs font-black border border-white/10">
                                                {userEmail?.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-6 w-64 p-[2px] rounded-[2.5rem] overflow-hidden isolate z-[110] shadow-2xl"
                                                >
                                                    {/* Efecto Aurora para el dropdown con tinte Petroleum sutil */}
                                                    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden -z-10">
                                                        <motion.div 
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                                            className="absolute top-1/2 left-1/2 w-[250%] aspect-square"
                                                            style={{
                                                                background: "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)",
                                                                translateX: "-50%",
                                                                translateY: "-50%",
                                                                willChange: "transform"
                                                            }}
                                                        />
                                                        <div className="absolute inset-[1.5px] rounded-[2.45rem] bg-white/80 backdrop-blur-3xl border border-white/40 shadow-[inset_0_0_25px_rgba(0,77,77,0.05)]" />
                                                    </div>

                                                    <div className="relative p-2">
                                                        <div className="px-6 py-5 border-b border-[#004d4d]/5 mb-2 text-right">
                                                            <p className="text-[11px] font-black text-[#001A1A] truncate">{userEmail}</p>
                                                            <p className="text-[8px] font-black text-[#004d4d] uppercase tracking-[0.2em] mt-1.5">Socio Identificado</p>
                                                        </div>
                                                        
                                                        <div className="space-y-1">
                                                            <button onClick={() => { setUserMenuOpen(false); setIsUserSettingsOpen(true); }} className="w-full flex items-center justify-end gap-3 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-[#004d4d]/70 hover:text-[#001A1A] hover:bg-[#004d4d]/5 transition-all rounded-2xl group/item text-right">
                                                                Configuración <UserIcon size={12} className="text-[#004d4d]/40 group-hover/item:text-[#00F2FF]" />
                                                            </button>
                                                            <div className="h-px bg-[#004d4d]/5 mx-6"></div>
                                                            <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full flex items-center justify-end gap-3 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-rose-500/80 hover:text-rose-600 hover:bg-rose-500/5 transition-all rounded-2xl group/out text-right">
                                                                Desconectar <LogOut size={12} className="text-rose-500/40 group-hover/out:text-rose-600" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};