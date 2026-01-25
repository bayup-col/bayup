"use client";

import { useState } from 'react';

export default function LoyaltyPage() {
    const [isActive, setIsActive] = useState(true);
    const [earnRate, setEarnRate] = useState(1000);
    const [redeemRate, setRedeemRate] = useState(100);
    const [redeemValue, setRedeemRateValue] = useState(5000);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert("Configuración del Club de Puntos actualizada. 🏆");
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Club de Puntos</h1>
                    <p className="text-gray-500 mt-2 font-medium">Fideliza a tus clientes premiando cada una de sus compras.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Programa</p>
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={`w-14 h-7 rounded-full relative transition-all duration-500 ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 left-1 h-5 w-5 bg-white rounded-full transition-transform shadow-sm ${isActive ? 'translate-x-7' : ''}`}></div>
                    </button>
                </div>
            </div>

            <div className={`space-y-8 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                {/* Configuración de Ganancia */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl">💰</div>
                        <h2 className="text-xl font-black text-gray-900">Reglas de Acumulación</h2>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Por cada compra de:</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                                <input 
                                    type="number" 
                                    value={earnRate} 
                                    onChange={(e) => setEarnRate(parseInt(e.target.value))}
                                    className="w-full pl-8 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-black focus:ring-2 focus:ring-purple-200" 
                                />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-gray-200">→</div>
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">El cliente gana:</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    defaultValue={1}
                                    disabled
                                    className="w-full px-4 py-4 bg-gray-100 rounded-2xl border-none outline-none text-sm font-black text-gray-400" 
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">Punto</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuración de Canje */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl">🎁</div>
                        <h2 className="text-xl font-black text-gray-900">Reglas de Canje</h2>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Al completar:</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={redeemRate} 
                                    onChange={(e) => setRedeemRate(parseInt(e.target.value))}
                                    className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-black focus:ring-2 focus:ring-purple-200" 
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">Puntos</span>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-gray-200">→</div>
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recibe un bono de:</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                                <input 
                                    type="number" 
                                    value={redeemValue} 
                                    onChange={(e) => setRedeemRateValue(parseInt(e.target.value))}
                                    className="w-full pl-8 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-black focus:ring-2 focus:ring-purple-200" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
}