"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Bot, Moon, Sun, DollarSign, Truck, AlertCircle, UserPlus, Headset, Building2, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/theme-context';
import { useSuperAdminTheme } from '@/context/super-admin-theme-context';
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
    mobileMode?: boolean;
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
    setIsBaytOpen,
    mobileMode = false,
}: HeaderProps) => {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const { saTheme, toggleSaTheme } = useSuperAdminTheme();
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

    // Polling de Notificaciones para tenants
    useEffect(() => {
        if (isSuperAdminZone) return;
        let intervalId: any = null;
        const fetchNotifications = async () => {
            if (!token) { if (intervalId) clearInterval(intervalId); return; }
            try {
                const isProduction = window.location.hostname.includes('railway.app') || window.location.hostname.includes('bayup.com');
                const data = await apiRequest<any[]>('/notifications', { token }).catch((err: any) => {
                    if (err?.message === 'Could not validate credentials') {
                        if (intervalId) clearInterval(intervalId);
                        sessionStorage.setItem('bayup_logout_reason', 'account_removed');
                        logout();
                        return null;
                    }
                    if (isProduction && intervalId) clearInterval(intervalId);
                    return null;
                });
                if (data && Array.isArray(data)) {
                    lastCountRef.current = data.filter((n: any) => !n.is_read).length;
                    setNotifications(data);
                }
            } catch (err: any) {}
        };
        fetchNotifications();
        intervalId = setInterval(fetchNotifications, 30000);
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [token, logout, isSuperAdminZone]);

    // Polling de Notificaciones para super admin
    useEffect(() => {
        if (!isSuperAdminZone || !token || !isGlobalStaff) return;
        let intervalId: any = null;
        const fetchAdminNotifications = async () => {
            try {
                const [regs, tickets, stats] = await Promise.all([
                    apiRequest<any[]>('/super-admin/registrations', { token }).catch(() => []),
                    apiRequest<any[]>('/super-admin/support/tickets', { token }).catch(() => []),
                    apiRequest<any>('/super-admin/stats', { token }).catch(() => null),
                ]);
                const built: any[] = [];

                // Registros: cada pendiente es una notificación accionable
                (regs || []).forEach((r: any) => built.push({
                    id: `reg-${r.id}`,
                    title: 'Registro pendiente de aprobación',
                    message: `${r.full_name || r.email} está esperando activación`,
                    type: 'registration',
                    is_read: false,
                    href: '/dashboard/super-admin/registros',
                }));

                // Soporte: tickets sin resolver
                (tickets || []).filter((t: any) => t.status !== 'resolved').forEach((t: any) => built.push({
                    id: `ticket-${t.id}`,
                    title: 'Ticket de soporte abierto',
                    message: t.subject || 'Sin asunto',
                    type: 'support',
                    is_read: false,
                    href: '/dashboard/super-admin/soporte',
                }));

                // Tesorería: comisión del día si hay actividad
                if (stats?.commission_today > 0) {
                    const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO');
                    built.push({
                        id: 'treasury-today',
                        title: 'Comisión generada hoy',
                        message: `${fmt(stats.commission_today)} en comisiones · ${fmt(stats.revenue_today)} en ventas`,
                        type: 'treasury',
                        is_read: true,
                        href: '/dashboard/super-admin/tesoreria',
                    });
                }

                // Empresas: activas vs total
                if (stats?.total_companies > 0) {
                    const inactive = stats.total_companies - (stats.active_companies || 0);
                    if (inactive > 0) built.push({
                        id: 'companies-inactive',
                        title: `${inactive} empresa${inactive > 1 ? 's' : ''} inactiva${inactive > 1 ? 's' : ''}`,
                        message: `${stats.active_companies} de ${stats.total_companies} empresas activas`,
                        type: 'company',
                        is_read: true,
                        href: '/dashboard/super-admin/empresas',
                    });
                }

                setNotifications(built);
            } catch {}
        };
        fetchAdminNotifications();
        intervalId = setInterval(fetchAdminNotifications, 60000);
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [token, isSuperAdminZone]);

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

    const markAsRead = async (id: string) => {
        if (!token) return;
        try {
            await apiRequest(`/notifications/${id}/read`, { method: 'PUT', token });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch {}
    };

    const markAllAsRead = async () => {
        if (!token || unreadCount === 0) return;
        try {
            await apiRequest('/notifications/read-all', { method: 'PUT', token });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {}
    };

    const isSuperAdminDark = isSuperAdminZone && saTheme === 'dark';

    const getNotificationStyles = (type: string) => {
        if (isSuperAdminDark) {
            switch (type) {
                case 'registration': return { icon: <UserPlus size={14} className="text-cyan" />, bg: 'bg-cyan/10' };
                case 'support':      return { icon: <Headset size={14} className="text-amber-400" />, bg: 'bg-amber-400/10' };
                case 'treasury':     return { icon: <Wallet size={14} className="text-emerald-400" />, bg: 'bg-emerald-400/10' };
                case 'company':      return { icon: <Building2 size={14} className="text-rose-400" />, bg: 'bg-rose-400/10' };
                case 'success':      return { icon: <DollarSign size={14} className="text-cyan" />, bg: 'bg-cyan/10' };
                case 'logistics':    return { icon: <Truck size={14} className="text-cyan" />, bg: 'bg-cyan/10' };
                default:             return { icon: <Bell size={14} className="text-white/40" />, bg: 'bg-white/5' };
            }
        }
        switch (type) {
            case 'registration': return { icon: <UserPlus size={14} className="text-teal-600" />, bg: 'bg-teal-50' };
            case 'support':      return { icon: <Headset size={14} className="text-amber-600" />, bg: 'bg-amber-50' };
            case 'treasury':     return { icon: <Wallet size={14} className="text-emerald-600" />, bg: 'bg-emerald-50' };
            case 'company':      return { icon: <Building2 size={14} className="text-rose-600" />, bg: 'bg-rose-50' };
            case 'success':      return { icon: <DollarSign size={14} className="text-emerald-600" />, bg: 'bg-emerald-50' };
            case 'logistics':    return { icon: <Truck size={14} className="text-blue-600" />, bg: 'bg-blue-50' };
            case 'alert':        return { icon: <AlertCircle size={14} className="text-rose-600" />, bg: 'bg-rose-50' };
            default:             return { icon: <Bell size={14} className="text-gray-600" />, bg: 'bg-gray-50' };
        }
    };

    const visible = scrollVisible && !shouldHide;

    // Modo mobile: solo campana inline para la barra superior del layout
    if (mobileMode) {
        return (
            <div className="relative">
                <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="h-9 w-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#004d4d]/60 hover:text-[#004d4d] transition-all relative"
                >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white animate-ping" />
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
                                className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[110]"
                            >
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#004d4d]">Notificaciones</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-[9px] font-bold text-gray-400 hover:text-[#004d4d]">
                                            Marcar todo leído
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                    {notifications.length === 0
                                        ? <p className="px-5 py-6 text-center text-[11px] text-gray-400">Sin notificaciones</p>
                                        : notifications.map(n => {
                                            const { icon, bg } = getNotificationStyles(n.type);
                                            return (
                                                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-[#004d4d]/3' : ''}`}
                                                    onClick={() => { markAsRead(n.id); if (n.href) { setNotificationsOpen(false); window.location.href = n.href; } }}>
                                                    <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>{icon}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-bold text-gray-800 truncate">{n.title}</p>
                                                        <p className="text-[10px] text-gray-400 line-clamp-2">{n.message}</p>
                                                    </div>
                                                    {!n.is_read && <div className="h-1.5 w-1.5 rounded-full bg-[#004d4d] mt-1.5 shrink-0" />}
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

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
                    {/* Toggle claro/oscuro — exclusivo de la zona Super-Admin */}
                    {isSuperAdminZone && (
                        <button
                            onClick={toggleSaTheme}
                            aria-label={saTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                            title={saTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                            className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${
                                saTheme === 'dark'
                                ? 'bg-[#001A1A]/90 border-white/10 text-white/40 hover:text-[#00f2ff]'
                                : 'bg-white/90 border-gray-200 text-[#004d4d]/50 hover:text-[#004d4d]'
                            }`}
                        >
                            {saTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                    )}

                    {/* Campana */}
                    <div className="relative">
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg border transition-all duration-200 hover:scale-105 active:scale-95 relative ${
                                isSuperAdminDark
                                ? 'bg-[#001A1A]/90 border-white/10 text-white/40 hover:text-[#00f2ff]'
                                : 'bg-white/90 border-white text-[#004d4d]/50 hover:text-[#004d4d]'
                            }`}
                        >
                            <Bell size={17} />
                            {unreadCount > 0 && (
                                <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 animate-ping ${
                                    isSuperAdminDark ? 'bg-[#00f2ff] border-[#001A1A]' : 'bg-rose-500 border-white'
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
                                            isSuperAdminDark ? 'bg-[#001A1A]/95 border-white/5' : 'bg-white/95 border-gray-100'
                                        }`}
                                    >
                                        <div className={`px-5 py-3 border-b flex items-center justify-between gap-2 ${isSuperAdminDark ? 'border-white/5' : 'border-gray-100'}`}>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${isSuperAdminDark ? 'text-white/40' : 'text-[#004d4d]'}`}>Notificaciones</h3>
                                                {unreadCount > 0 && (
                                                    <span className={`text-white text-[8px] font-bold px-2 py-0.5 rounded-full ${isSuperAdminDark ? 'bg-[#00f2ff]/80' : 'bg-emerald-500'}`}>{unreadCount}</span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && !isSuperAdminZone && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className={`text-[9px] font-semibold px-2.5 py-1 rounded-xl transition-colors shrink-0 ${isSuperAdminDark ? 'text-[#00f2ff]/60 hover:text-[#00f2ff] hover:bg-white/5' : 'text-[#004d4d]/60 hover:text-[#004d4d] hover:bg-[#004d4d]/5'}`}
                                                >
                                                    Marcar todas como leídas
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[320px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className={`p-10 text-center text-[10px] font-medium ${isSuperAdminDark ? 'text-white/20' : 'text-gray-400'}`}>Sin notificaciones</div>
                                            ) : notifications.map((n) => {
                                                const styles = getNotificationStyles(n.type);
                                                return (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => {
                                                            if (isSuperAdminZone && n.href) {
                                                                router.push(n.href);
                                                            } else if (!n.is_read) {
                                                                markAsRead(n.id);
                                                            }
                                                            setNotificationsOpen(false);
                                                        }}
                                                        className={`w-full px-5 py-4 border-b flex gap-3 transition-colors text-left ${isSuperAdminDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50/80'} ${!n.is_read ? '' : 'opacity-40'}`}
                                                    >
                                                        <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${styles.bg}`}>{styles.icon}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[11px] font-semibold truncate ${isSuperAdminDark ? 'text-white/80' : 'text-gray-800'}`}>{n.title}</p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                                        </div>
                                                        {!n.is_read && (
                                                            <div className={`h-2 w-2 rounded-full shrink-0 mt-1 ${isSuperAdminDark ? 'bg-[#00f2ff]' : 'bg-[#004d4d]'}`}/>
                                                        )}
                                                    </button>
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
