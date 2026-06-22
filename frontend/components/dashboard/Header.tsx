"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Bot, Moon, Sun, DollarSign, Truck, AlertCircle } from 'lucide-react';
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
    const { token, userPlan, isGlobalStaff } = useAuth();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [shouldHide, setShouldHide] = useState(false);
    const [scrollVisible, setScrollVisible] = useState(true);
    const lastScrollY = useRef(0);
    const lastCountRef = useRef(0);

    const isSuperAdminZone = pathname?.startsWith('/dashboard/super-admin');
    const isEmpresaPlan = userPlan?.name === 'Empresa' || isGlobalStaff;

    // Scroll: ocultar al bajar, mostrar al subir
    useEffect(() => {
        const main = document.querySelector('main');
        if (!main) return;
        const handleScroll = () => {
            const current = main.scrollTop;
            setScrollVisible(current < lastScrollY.current || current < 60);
            lastScrollY.current = current;
        };
        main.addEventListener('scroll', handleScroll, { passive: true });
        return () => main.removeEventListener('scroll', handleScroll);
    }, []);

    // Polling de Notificaciones
    useEffect(() => {
        let intervalId: any = null;
        const fetchNotifications = async () => {
            if (!token) { if (intervalId) clearInterval(intervalId); return; }
            try {
                const isProduction = window.location.hostname.includes('railway.app') || window.location.hostname.includes('bayup.com');
                const data = await apiRequest<any[]>('/notifications', { token }).catch(() => {
                    if (isProduction && intervalId) clearInterval(intervalId);
                    return null;
                });
                if (data && Array.isArray(data)) {
                    const unread = data.filter((n: any) => !n.is_read).length;
                    if (unread > lastCountRef.current) {
                        try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch (e) {}
                    }
                    lastCountRef.current = unread;
                    setNotifications(data);
                }
            } catch (err: any) {}
        };
        fetchNotifications();
        intervalId = setInterval(fetchNotifications, 30000);
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [token]);

    // Ocultar al abrir modal
    useEffect(() => {
        const checkModal = () => {
            const hasModal = document.body.classList.contains('modal-open') ||
                             document.body.style.overflow === 'hidden' ||
                             !!document.querySelector('[data-modal-active="true"]');
            setShouldHide(hasModal);
        };
        const observer = new MutationObserver(checkModal);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
        checkModal();
        return () => observer.disconnect();
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getNotificationStyles = (type: string) => {
        if (isSuperAdminZone) {
            switch (type) {
                case 'success': return { icon: <DollarSign size={14} className="text-cyan" />, bg: 'bg-cyan/10' };
                case 'logistics': return { icon: <Truck size={14} className="text-cyan" />, bg: 'bg-cyan/10' };
                default: return { icon: <Bell size={14} className="text-white/40" />, bg: 'bg-white/5' };
            }
        }
        switch (type) {
            case 'success': return { icon: <DollarSign size={14} className="text-emerald-600" />, bg: 'bg-emerald-50' };
            case 'logistics': return { icon: <Truck size={14} className="text-blue-600" />, bg: 'bg-blue-50' };
            case 'alert': return { icon: <AlertCircle size={14} className="text-rose-600" />, bg: 'bg-rose-50' };
            default: return { icon: <Bell size={14} className="text-gray-600" />, bg: 'bg-gray-50' };
        }
    };

    const visible = scrollVisible && !shouldHide;

    return (
        <>
            {/* Botón flotante fijo en esquina superior derecha */}
            <motion.div
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -16, scale: visible ? 1 : 0.9 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="fixed top-5 right-6 z-[200] pointer-events-none"
                style={{ pointerEvents: visible ? 'auto' : 'none' }}
            >
                <div className="flex items-center gap-2">
                    {/* Campana */}
                    <div className="relative">
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg border transition-all duration-200 hover:scale-105 active:scale-95 relative ${
                                isSuperAdminZone
                                ? 'bg-[#001A1A]/90 border-white/10 text-white/40 hover:text-[#00f2ff]'
                                : 'bg-white/90 border-white text-[#004d4d]/50 hover:text-[#004d4d]'
                            }`}
                        >
                            <Bell size={17} />
                            {unreadCount > 0 && (
                                <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 animate-ping ${
                                    isSuperAdminZone ? 'bg-[#00f2ff] border-[#001A1A]' : 'bg-rose-500 border-white'
                                }`} />
                            )}
                        </button>

                        <AnimatePresence>
                            {notificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ duration: 0.18 }}
                                        className={`absolute right-0 mt-3 w-80 backdrop-blur-3xl rounded-3xl shadow-2xl border overflow-hidden z-[110] ${
                                            isSuperAdminZone ? 'bg-[#001A1A]/95 border-white/5' : 'bg-white/95 border-gray-100'
                                        }`}
                                    >
                                        <div className={`px-5 py-4 border-b flex items-center justify-between ${isSuperAdminZone ? 'border-white/5' : 'border-gray-100'}`}>
                                            <h3 className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${isSuperAdminZone ? 'text-white/40' : 'text-[#004d4d]'}`}>Notificaciones</h3>
                                            {unreadCount > 0 && (
                                                <span className={`text-white text-[8px] font-bold px-2 py-0.5 rounded-full ${isSuperAdminZone ? 'bg-[#00f2ff]/80' : 'bg-emerald-500'}`}>{unreadCount}</span>
                                            )}
                                        </div>
                                        <div className="max-h-[320px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className={`p-10 text-center text-[10px] font-medium ${isSuperAdminZone ? 'text-white/20' : 'text-gray-400'}`}>Sin notificaciones</div>
                                            ) : notifications.map((n) => {
                                                const styles = getNotificationStyles(n.type);
                                                return (
                                                    <div key={n.id} className={`px-5 py-4 border-b flex gap-3 transition-colors ${isSuperAdminZone ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50/80'} ${!n.is_read ? '' : 'opacity-40'}`}>
                                                        <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${styles.bg}`}>{styles.icon}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[11px] font-semibold truncate ${isSuperAdminZone ? 'text-white/80' : 'text-gray-800'}`}>{n.title}</p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
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
                </div>
            </motion.div>

        </>
    );
};
