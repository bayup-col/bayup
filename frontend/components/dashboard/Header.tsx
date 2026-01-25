"use client";

import React from 'react';

interface HeaderProps {
    pathname: string;
    userEmail: string | null;
    userRole: string | null;
    userMenuOpen: boolean;
    setUserMenuOpen: (open: boolean) => void;
    logout: () => void;
    setIsUserSettingsOpen: (open: boolean) => void;
}

export const DashboardHeader = ({ 
    pathname, 
    userEmail, 
    userRole, 
    userMenuOpen, 
    setUserMenuOpen, 
    logout, 
    setIsUserSettingsOpen 
}: HeaderProps) => (
    <header className="h-16 flex-shrink-0 bg-white/70 backdrop-blur-lg border-b border-white/20 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Plataforma</span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-gray-600 capitalize">{pathname.split('/').pop()?.replace('-', ' ')}</span>
        </div>
        <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-purple-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-3 pl-4 border-l border-gray-100 group">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-gray-900 leading-none">{userEmail?.split('@')[0]}</p>
                        <p className="text-[10px] font-bold text-purple-500 mt-1 uppercase tracking-tighter italic">{userRole === 'super_admin' ? 'Super Admin' : 'Plan Empresa'}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg group-hover:scale-105 transition-transform">
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
