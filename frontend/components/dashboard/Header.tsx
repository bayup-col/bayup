"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Bot, LogOut, User as UserIcon, Truck, Sparkles, Moon, Sun, DollarSign, Package, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';

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
    const { theme, toggleTheme } = useTheme();
    const { token } = useAuth();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [isHoveringUser, setIsHoveringUser] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const lastCountRef = useRef(0);

    // Polling de Notificaciones Reales
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!token) return;
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const unread = data.filter((n: any) => !n.is_read).length;
                    
                    // Sonido si hay algo nuevo
                    if (unread > lastCountRef.current) {
                        try {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                            audio.play();
                        } catch (e) {}
                    }
                    lastCountRef.current = unread;
                    setNotifications(data);
                }
            } catch (err) { console.error(err); }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getNotificationStyles = (type: string) => {
        switch (type) {
            case 'success': 
                return { icon: <DollarSign size={14} className="text-emerald-600" />, bg: 'bg-emerald-50', accent: 'bg-emerald-500' };
            case 'logistics': 
                return { icon: <Truck size={14} className="text-blue-600" />, bg: 'bg-blue-50', accent: 'bg-blue-500' };
            case 'alert': 
                return { icon: <AlertCircle size={14} className="text-rose-600" />, bg: 'bg-rose-50', accent: 'bg-rose-500' };
            default:
                return { icon: <Bell size={14} className="text-gray-600" />, bg: 'bg-gray-50', accent: 'bg-gray-500' };
        }
    };

    return (
        <header className="h-24 flex-shrink-0 flex items-center justify-end px-10 sticky top-0 z-[50] pointer-events-auto transition-all duration-500">
            <div className={`absolute inset-0 -z-10 backdrop-blur-3xl border-b transition-all duration-500 ${
                theme === 'dark' ? 'bg-[#001212]/20 border-white/5' : 'bg-white/20 border-white/40'
            }`} />
            
            <div className="flex items-center">
                <div className="relative group p-[2px] rounded-full">
                    <div className="absolute inset-0 rounded-full overflow-hidden -z-10">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 left-1/2 w-[300%] aspect-square" style={{ background: "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)", translateX: "-50%", translateY: "-50%" }} />
                        <div className="absolute inset-[1.5px] rounded-full bg-white/40 backdrop-blur-2xl" />
                    </div>

                    <div className="px-4 py-1.5 flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full text-[#004d4d]/60 hover:text-[#00F2FF]">{theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-[#00F2FF]" />}</button>
                        <div className="h-6 w-px bg-[#004d4d]/10"></div>
                        <button onClick={() => setIsBaytOpen(!isBaytOpen)} className={`p-2 rounded-full ${isBaytOpen ? 'text-[#00F2FF]' : 'text-[#004d4d]/60'}`}><Bot size={20} /></button>
                        <div className="h-6 w-px bg-[#004d4d]/10"></div>
                        
                        <div className="relative">
                            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2 text-[#004d4d]/60 hover:text-[#004d4d]">
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-[#EF4444] rounded-full border-2 border-white animate-ping"></span>}
                            </button>

                            <AnimatePresence>
                                {notificationsOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-6 w-80 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden z-[110]">
                                            <div className="p-6 border-b border-[#004d4d]/5 flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest">Notificaciones</h3>
                                                {unreadCount > 0 && <span className="bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
                                            </div>
                                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                                {notifications.length === 0 ? (
                                                    <div className="p-10 text-center text-gray-400 text-[10px] font-black uppercase">Sin actividad</div>
                                                ) : notifications.map((n) => {
                                                    const styles = getNotificationStyles(n.type);
                                                    return (
                                                        <div key={n.id} className={`p-5 border-b border-gray-50 flex gap-4 ${!n.is_read ? 'bg-white' : 'opacity-50'}`}>
                                                            <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${styles.bg}`}>{styles.icon}</div>
                                                            <div className="flex-1">
                                                                <p className="text-[11px] font-black text-gray-900">{n.title}</p>
                                                                <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-6 w-px bg-[#004d4d]/10"></div>

                        <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="h-10 w-10 rounded-2xl bg-[#001A1A] flex items-center justify-center text-[#00F2FF] text-xs font-black border border-white/10 shadow-lg">
                            {userEmail?.charAt(0).toUpperCase()}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
