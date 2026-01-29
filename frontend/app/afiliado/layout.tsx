"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { 
    LayoutDashboard, Building2, Wallet, History, BarChart3, 
    FileText as FileTextIcon, Settings, LogOut, User, Bell, ChevronRight, 
    Search, Menu, X, Globe, Sparkles, MessageSquare, Send, Bot, Info, Clock, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
    const { userRole, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    
    // UI States
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // Support Chat State
    const [chatMessage, setChatMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', text: '¡Hola! Soy tu asistente de soporte Bayup. ¿En qué puedo ayudarte hoy?' }
    ]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else if (userRole !== 'afiliado') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, userRole, router]);

    // Filtrado de items del Sidebar (Configuración se movió al perfil)
    const menuItems = [
        { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', href: '/afiliado/dashboard' },
        { icon: <Building2 size={20}/>, label: 'Empresas', href: '/afiliado/empresas' },
        { icon: <Wallet size={20}/>, label: 'Tesorería', href: '/afiliado/tesoreria' },
        { icon: <History size={20}/>, label: 'Transacciones', href: '/afiliado/transacciones' },
        { icon: <BarChart3 size={20}/>, label: 'Estadísticas', href: '/afiliado/estadisticas' },
        { icon: <FileTextIcon size={20}/>, label: 'Material', href: '/afiliado/material' },
    ];

    const notifications = [
        { id: 1, title: 'Nueva Función: Reportes PDF', type: 'new', time: 'Hace 2h', icon: <Sparkles className="text-purple-500" /> },
        { id: 2, title: 'Liquidación pendiente de revisión', type: 'pending', time: 'Hace 5h', icon: <Clock className="text-amber-500" /> },
        { id: 3, title: 'Firma de contrato de socio', type: 'action', time: 'Ayer', icon: <Info className="text-blue-500" /> },
    ];

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;
        
        setChatHistory([...chatHistory, { role: 'user', text: chatMessage }]);
        setChatMessage("");
        
        setTimeout(() => {
            setChatHistory(prev => [...prev, { role: 'assistant', text: "He recibido tu reporte. Un asesor se conectará en breve para ayudarte con tu observación." }]);
        }, 1000);
    };

    if (!isAuthenticated || userRole !== 'afiliado') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Sincronizando con Red de Socios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-700 overflow-x-hidden">
            
            {/* SIDEBAR OPTIMIZADO */}
            <aside className={`fixed inset-y-0 left-0 z-[60] bg-white border-r border-gray-100 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-20'} overflow-hidden flex flex-col`}>
                <div className="h-24 flex items-center px-6 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-gray-200">
                            <img src="/assets/Logo Bayup sin fondo blanca.png" className="h-6 w-6 brightness-0 invert" alt="B" />
                        </div>
                        {isSidebarOpen && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-black tracking-tighter italic uppercase">
                                Bayup <span className="text-purple-600">Partner</span>
                            </motion.span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={`w-full group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative ${
                                    isActive 
                                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`${isActive ? 'text-white' : 'group-hover:text-purple-600 transition-colors'}`}>
                                    {item.icon}
                                </div>
                                {isSidebarOpen && (
                                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">{item.label}</span>
                                )}
                                {isActive && isSidebarOpen && (
                                    <motion.div layoutId="activeNav" className="absolute right-4"><ChevronRight size={14} /></motion.div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    <div className={`p-4 rounded-3xl bg-purple-50 border border-purple-100 transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <Sparkles size={16} className="text-purple-600" />
                            <p className="text-[9px] font-black uppercase text-purple-600 tracking-widest">Nivel Pro</p>
                        </div>
                        <p className="text-[10px] text-purple-900/60 font-medium italic leading-tight uppercase">Socio Estratégico Autorizado</p>
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className={`flex-1 transition-all duration-500 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
                
                {/* HEADER CON NUEVAS FUNCIONALIDADES */}
                <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-gray-50 rounded-xl transition-all active:scale-90">
                            {isSidebarOpen ? <X size={20} className="text-gray-400"/> : <Menu size={20} className="text-gray-400"/>}
                        </button>
                        <div className="hidden md:flex items-center bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100 w-80 group focus-within:border-purple-200 transition-all">
                            <Search size={16} className="text-gray-300 group-focus-within:text-purple-400" />
                            <input type="text" placeholder="Buscar en ecosistema..." className="bg-transparent border-none outline-none text-[11px] font-bold ml-3 w-full placeholder:text-gray-300" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        {/* CHAT DE SOPORTE */}
                        <button 
                            onClick={() => setIsSupportOpen(!isSupportOpen)}
                            className={`p-3 rounded-xl transition-all relative active:scale-95 group ${isSupportOpen ? 'bg-purple-600 text-white' : 'bg-white border border-gray-100 text-gray-400 hover:text-purple-600'}`}
                        >
                            <MessageSquare size={20} />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-emerald-500 rounded-full border-2 border-white"></span>
                        </button>

                        {/* CAMPANA DE NOTIFICACIONES */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className={`p-3 rounded-xl transition-all relative active:scale-95 group ${isNotificationsOpen ? 'bg-gray-900 text-white shadow-xl' : 'bg-white border border-gray-100 text-gray-400 hover:text-purple-600'}`}
                            >
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 h-2 w-2 bg-purple-600 rounded-full border-2 border-white animate-pulse"></span>
                            </button>

                            <AnimatePresence>
                                {isNotificationsOpen && (
                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-[70]">
                                        <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest italic">Centro de Alertas</p>
                                            <span className="px-2 py-0.5 bg-purple-600 rounded-md text-[8px] font-black">3 NUEVAS</span>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                            {notifications.map((n) => (
                                                <div key={n.id} className="p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group cursor-pointer">
                                                    <div className="flex gap-4">
                                                        <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">{n.icon}</div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-gray-900 uppercase italic leading-tight">{n.title}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{n.time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full py-4 bg-gray-50 text-[9px] font-black uppercase text-gray-400 hover:text-purple-600 transition-all border-t border-gray-100">Marcar todas como leídas</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <div className="h-10 w-px bg-gray-100 mx-2"></div>

                        {/* AVATAR ESTILO ACORDEÓN (DROPDOWN) */}
                        <div className="relative">
                            <div 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={`flex items-center gap-4 group cursor-pointer p-2 rounded-2xl transition-all active:scale-95 ${isProfileOpen ? 'bg-gray-900' : 'hover:bg-gray-50'}`}
                            >
                                <div className={`text-right hidden sm:block transition-colors ${isProfileOpen ? 'text-white' : 'text-gray-900'}`}>
                                    <p className="text-[11px] font-black uppercase">Socio Bayup</p>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${isProfileOpen ? 'text-purple-400' : 'text-gray-400'}`}>ID: #AF-2026</p>
                                </div>
                                <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-purple-100 shrink-0">
                                    AF
                                </div>
                            </div>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="absolute top-full right-0 mt-4 w-60 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-[70]">
                                        <div className="p-2 space-y-1">
                                            <button 
                                                onClick={() => { router.push('/afiliado/configuracion'); setIsProfileOpen(false); }}
                                                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all group"
                                            >
                                                <Settings size={18} className="group-hover:text-purple-600" /> Mi Configuración
                                            </button>
                                            <div className="h-px bg-gray-100 mx-4"></div>
                                            <button 
                                                onClick={logout}
                                                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all"
                                            >
                                                <LogOut size={18}/> Cerrar Sesión
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* CONTENT */}
                <main className="p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-6rem)]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* MODAL CHAT DE SOPORTE FUNCIONAL */}
            <AnimatePresence>
                {isSupportOpen && (
                    <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="fixed bottom-8 right-8 w-96 bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden z-[100] flex flex-col">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Bot size={80}/></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><Bot size={24}/></div>
                                <div>
                                    <h3 className="text-sm font-black italic uppercase">Soporte Bayup</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Asesores en línea</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsSupportOpen(false)} className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all z-10"><X size={18}/></button>
                        </div>

                        <div className="flex-1 h-[400px] overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/50">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-[11px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none shadow-xl' : 'bg-white text-gray-600 rounded-tl-none border border-gray-100 shadow-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-100 flex items-center gap-3">
                            <input 
                                type="text" 
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Escribe tu observación o error..." 
                                className="flex-1 bg-gray-50 px-6 py-4 rounded-2xl border-none outline-none text-[11px] font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                            <button type="submit" className="h-14 w-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-purple-600 transition-all active:scale-90 shrink-0">
                                <Send size={20}/>
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
