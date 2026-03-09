"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Bot, LogOut, User as UserIcon, Truck, Sparkles, Moon, Sun, DollarSign, Package, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

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
    const { token, userPlan, isGlobalStaff, userLogo } = useAuth();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [isHoveringUser, setIsHoveringUser] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [shouldHide, setShouldHide] = useState(false);
    const lastCountRef = useRef(0);

    const isSuperAdminZone = pathname?.startsWith('/dashboard/super-admin');
    const isEmpresaPlan = userPlan?.name === 'Empresa' || isGlobalStaff;

    // Polling de Notificaciones Reales
    useEffect(() => {
        let intervalId: any = null;

        const fetchNotifications = async () => {
            if (!token) {
                if (intervalId) clearInterval(intervalId);
                return;
            }
            try {
                const data = await apiRequest<any[]>('/notifications', { token });
                if (data) {
                    const unread = data.filter((n: any) => !n.is_read).length;
                    
                    if (unread > lastCountRef.current) {
                        try {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                            audio.play();
                        } catch (e) {}
                    }
                    lastCountRef.current = unread;
                    setNotifications(data);
                }
            } catch (err: any) { 
                if (err?.message?.includes('401')) {
                    if (intervalId) clearInterval(intervalId);
                }
            }
        };

        fetchNotifications();
        intervalId = setInterval(fetchNotifications, 30000);
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [token]);

    // Lógica para ocultar el header si hay modales abiertos
    useEffect(() => {
        const checkModal = () => {
            const hasModal = document.body.classList.contains('modal-open') || 
                             document.body.style.overflow === 'hidden' ||
                             !!document.querySelector('[data-modal-active="true"]');
            setShouldHide(hasModal);
        };

        const observer = new MutationObserver(checkModal);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
        
        // También chequear al montar y en intervalos cortos para mayor seguridad
        checkModal();
        const interval = setInterval(checkModal, 500);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getNotificationStyles = (type: string) => {
        if (isSuperAdminZone) {
            switch (type) {
                case 'success': return { icon: <DollarSign size={14} className="text-cyan" />, bg: 'bg-cyan/10', accent: 'bg-cyan' };
                case 'logistics': return { icon: <Truck size={14} className="text-cyan" />, bg: 'bg-cyan/10', accent: 'bg-cyan' };
                default: return { icon: <Bell size={14} className="text-white/40" />, bg: 'bg-white/5', accent: 'bg-white/20' };
            }
        }
        switch (type) {
            case 'success': return { icon: <DollarSign size={14} className="text-emerald-600" />, bg: 'bg-emerald-50', accent: 'bg-emerald-500' };
            case 'logistics': return { icon: <Truck size={14} className="text-blue-600" />, bg: 'bg-blue-50', accent: 'bg-blue-500' };
            case 'alert': return { icon: <AlertCircle size={14} className="text-rose-600" />, bg: 'bg-rose-50', accent: 'bg-rose-500' };
            default: return { icon: <Bell size={14} className="text-gray-600" />, bg: 'bg-gray-50', accent: 'bg-gray-500' };
        }
    };

    return (
        <header className={`h-24 flex-shrink-0 flex items-center justify-end px-10 sticky top-0 z-[50] pointer-events-auto transition-all duration-700 ${shouldHide ? 'opacity-0 translate-y-[-20px] pointer-events-none' : 'opacity-100 translate-y-0'}`}>
            <div className={`absolute inset-0 -z-10 backdrop-blur-3xl border-b transition-all duration-500 ${
                isSuperAdminZone ? 'bg-black/20 border-white/5' : (theme === 'dark' ? 'bg-[#001212]/20 border-white/5' : 'bg-white/20 border-white/40')
            }`} />
            
            <div className="flex items-center">
                <div className="relative group p-[2px] rounded-full">
                    <div className="absolute inset-0 rounded-full overflow-hidden -z-10">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 left-1/2 w-[300%] aspect-square" style={{ background: isSuperAdminZone ? "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #001A1A 360deg)" : "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)", translateX: "-50%", translateY: "-50%" }} />
                        <div className={`absolute inset-[1.5px] rounded-full backdrop-blur-2xl transition-colors duration-500 ${isSuperAdminZone ? 'bg-[#001A1A]/60' : 'bg-white/40'}`} />
                    </div>

                    <div className="px-4 py-1.5 flex items-center gap-4">
                        {(isEmpresaPlan || isGlobalStaff || isSuperAdminZone) && (
                            <>
                                <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isSuperAdminZone ? 'text-white/40 hover:text-cyan' : 'text-[#004d4d]/60 hover:text-[#00F2FF]'}`}>{theme === 'light' ? <Moon size={20} /> : <Sun size={20} className={isSuperAdminZone ? 'text-cyan' : 'text-[#00F2FF]'} />}</button>
                                <div className={`h-6 w-px ${isSuperAdminZone ? 'bg-white/5' : 'bg-[#004d4d]/10'}`}></div>
                            </>
                        )}
                        
                        {(isEmpresaPlan || isSuperAdminZone) && (
                            <>
                                <button onClick={() => setIsBaytOpen(!isBaytOpen)} className={`p-2 rounded-full transition-colors ${isBaytOpen ? (isSuperAdminZone ? 'text-cyan' : 'text-[#00F2FF]') : (isSuperAdminZone ? 'text-white/40 hover:text-cyan' : 'text-[#004d4d]/60')}`}><Bot size={20} /></button>
                                <div className={`h-6 w-px ${isSuperAdminZone ? 'bg-white/5' : 'bg-[#004d4d]/10'}`}></div>
                            </>
                        )}
                        
                        <div className="relative">
                            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className={`relative p-2 transition-colors ${isSuperAdminZone ? 'text-white/40 hover:text-cyan' : 'text-[#004d4d]/60 hover:text-[#004d4d]'}`}>
                                <Bell size={20} />
                                {unreadCount > 0 && <span className={`absolute top-1 right-1 h-2 w-2 rounded-full border-2 animate-ping ${isSuperAdminZone ? 'bg-cyan border-[#001A1A]' : 'bg-[#EF4444] border-white'}`}></span>}
                            </button>

                            <AnimatePresence>
                                {notificationsOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute right-0 mt-6 w-84 backdrop-blur-3xl rounded-[2.5rem] shadow-3xl border overflow-hidden z-[110] ${isSuperAdminZone ? 'bg-[#001A1A]/95 border-white/5' : 'bg-white/95 border-white'}`}>
                                            <div className={`p-6 border-b flex items-center justify-between ${isSuperAdminZone ? 'border-white/5' : 'border-[#004d4d]/5'}`}>
                                                <h3 className={`text-[10px] font-black capitalize tracking-tight ${isSuperAdminZone ? 'text-white/40' : 'text-[#004d4d]'}`}>Centro de Alertas</h3>
                                                {unreadCount > 0 && <span className={`text-white text-[8px] font-bold px-2 py-0.5 rounded-full ${isSuperAdminZone ? 'bg-cyan' : 'bg-emerald-500'}`}>{unreadCount}</span>}
                                            </div>
                                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                                {notifications.length === 0 ? (
                                                    <div className="p-10 text-center text-gray-400 text-[10px] font-black capitalize">Sistemas Estables</div>
                                                ) : notifications.map((n) => {
                                                    const styles = getNotificationStyles(n.type);
                                                    return (
                                                        <div key={n.id} className={`p-5 border-b flex gap-4 transition-colors ${isSuperAdminZone ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50'} ${!n.is_read ? '' : 'opacity-50'}`}>
                                                            <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${styles.bg}`}>{styles.icon}</div>
                                                            <div className="flex-1 text-left">
                                                                <p className={`text-[11px] font-black ${isSuperAdminZone ? 'text-white/80' : 'text-gray-900'}`}>{n.title}</p>
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

                        <div className={`h-6 w-px ${isSuperAdminZone ? 'bg-white/5' : 'bg-[#004d4d]/10'}`}></div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className={`h-10 w-10 rounded-2xl shadow-lg border flex items-center justify-center hover:scale-105 transition-all relative group overflow-hidden ${isSuperAdminZone ? 'bg-cyan border-cyan/20 text-black' : 'bg-gradient-to-br from-[#004d4d] to-[#001a1a] border-[#00f2ff]/20 text-white'}`}
                                >
                                    <span className="text-[10px] font-black tracking-widest uppercase">
                                        {(userEmail || 'B').charAt(0)}
                                    </span>
                                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 rounded-full z-10 ${isSuperAdminZone ? 'bg-white border-[#001A1A]' : 'bg-emerald-500 border-white'}`}></div>
                                </button>
                            </div>
                    </div>
                </div>
            </div>

            {/* Menú Desplegable de Usuario (Glassmorphism) */}
            <AnimatePresence>
                {userMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute right-10 top-24 w-64 backdrop-blur-3xl rounded-[2rem] shadow-3xl border overflow-hidden z-[110] ${isSuperAdminZone ? 'bg-[#001A1A]/95 border-white/5' : 'bg-white/95 border-white'}`}
                        >
                            <div className={`p-6 border-b ${isSuperAdminZone ? 'bg-white/5 border-white/5' : 'bg-gradient-to-br from-[#004d4d]/5 to-transparent border-gray-100/50'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isSuperAdminZone ? 'text-white/20' : 'text-gray-400'}`}>IDENTIDAD GLOBAL</p>
                                <p className={`text-xs font-black mt-1 truncate ${isSuperAdminZone ? 'text-white' : 'text-[#004d4d]'}`}>{userEmail || 'Comandante Bayup'}</p>
                                <div className={`mt-2 inline-block px-2 py-0.5 rounded-full ${isSuperAdminZone ? 'bg-cyan/20' : 'bg-[#00F2FF]/10'}`}>
                                    <p className={`text-[8px] font-black uppercase tracking-tighter ${isSuperAdminZone ? 'text-cyan' : 'text-[#004d4d]'}`}>{userRole || 'SUPER ADMIN'}</p>
                                </div>
                            </div>
                            
                            <div className="p-2">
                                <button 
                                    onClick={() => { setIsUserSettingsOpen(true); setUserMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group ${isSuperAdminZone ? 'hover:bg-white/5' : 'hover:bg-[#004d4d]/5'}`}
                                >
                                    <div className={`h-8 w-8 rounded-xl shadow-sm flex items-center justify-center transition-all group-hover:scale-110 ${isSuperAdminZone ? 'bg-white/5 text-white/40 group-hover:text-cyan' : 'bg-white text-gray-400 group-hover:text-[#00F2FF]'}`}>
                                        <UserIcon size={14} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isSuperAdminZone ? 'text-white/40 group-hover:text-white' : 'text-gray-600'}`}>Perfil Central</span>
                                </button>

                                <button 
                                    onClick={logout}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group ${isSuperAdminZone ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'}`}
                                >
                                    <div className={`h-8 w-8 rounded-xl shadow-sm flex items-center justify-center transition-all group-hover:scale-110 ${isSuperAdminZone ? 'bg-white/5 text-white/40 group-hover:text-rose-400' : 'bg-white text-gray-400 group-hover:text-rose-500'}`}>
                                        <LogOut size={14} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isSuperAdminZone ? 'text-white/40 group-hover:text-rose-400' : 'text-gray-600 group-hover:text-rose-600'}`}>Desconexión</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};
