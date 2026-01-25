"use client";

import React from 'react';

interface SupportWidgetProps {
    isSupportOpen: boolean;
    setIsSupportOpen: (open: boolean) => void;
    supportMessages: { id: number; text: string; sender: string }[];
}

export const SupportWidget = ({ isSupportOpen, setIsSupportOpen, supportMessages }: SupportWidgetProps) => (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col items-end">
        {isSupportOpen && (
            <div className="mb-4 w-80 bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
                <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm">🎧</div>
                        <div><p className="text-xs font-black tracking-tight">Soporte Bayup</p><div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">En línea</span></div></div>
                    </div>
                    <button onClick={() => setIsSupportOpen(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
                </div>
                <div className="h-80 overflow-y-auto p-6 space-y-4 bg-gray-50/30 custom-scrollbar">
                    {supportMessages.map((m) => (
                        <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium ${m.sender === 'me' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100 shadow-sm'}`}>{m.text}</div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                    <input type="text" placeholder="Escribe tu duda..." className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none transition-all" /><button className="h-8 w-8 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700 transition-all shadow-lg">✈️</button>
                </div>
            </div>
        )}
        <button onClick={() => setIsSupportOpen(!isSupportOpen)} className={`h-14 w-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 ${isSupportOpen ? 'bg-gray-900 text-white rotate-90' : 'bg-purple-600 text-white shadow-purple-200'}`}>{isSupportOpen ? '✕' : '💬'}</button>
    </div>
);
