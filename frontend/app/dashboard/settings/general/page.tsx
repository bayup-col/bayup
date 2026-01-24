"use client";

import { useState, useEffect } from 'react';

export default function GeneralSettings() {
    const [storeName, setStoreName] = useState("");
    const [storeEmail, setStoreEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        const savedName = localStorage.getItem('storeName');
        if (savedName) setStoreName(savedName);
        else setStoreName("Mi Tienda Online");
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        
        // Simulación de guardado en base de datos
        setTimeout(() => {
            localStorage.setItem('storeName', storeName);
            
            // Disparar un evento para que el Layout se entere del cambio de nombre
            window.dispatchEvent(new Event('storage'));
            
            setIsSaving(false);
            setShowSuccess(true);
            
            // Ocultar mensaje de éxito tras 3 segundos
            setTimeout(() => setShowSuccess(false), 3000);
            
            // Opcional: Recargar para asegurar que todo el layout se actualice
            // window.location.reload(); 
        }, 800);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Información General</h1>
                    <p className="text-gray-500 mt-1 font-medium">Configura la identidad y los datos de contacto de tu tienda.</p>
                </div>
                {showSuccess && (
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-bold animate-in slide-in-from-top-2 duration-300">
                        ¡Cambios guardados con éxito! ✨
                    </div>
                )}
            </div>

            {/* 1. Identidad */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-4">Identidad de la tienda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de la tienda</label>
                        <input 
                            type="text" 
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="Ej: Mi Tienda Online" 
                            className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email de contacto</label>
                        <input 
                            type="email" 
                            value={storeEmail}
                            onChange={(e) => setStoreEmail(e.target.value)}
                            placeholder="ventas@tienda.com" 
                            className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
                        />
                    </div>
                </div>
            </div>

            {/* 2. Dominio */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-lg font-bold text-gray-800">Dominio Personalizado</h2>
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Premium</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="text-sm font-bold text-gray-900">Tu dominio actual:</p>
                        <p className="text-sm text-purple-600 font-mono mt-1 italic font-bold">
                            {storeName.toLowerCase().replace(/\s+/g, '') || 'mitienda'}.bayup.com
                        </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">Vincular dominio</button>
                        <button className="flex-1 md:flex-none px-6 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Comprar</button>
                    </div>
                </div>
            </div>

            {/* 3. Dirección */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-4">Ubicación física</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Dirección completa" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Ciudad" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                        <input type="text" placeholder="País" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-100 transition-all flex items-center gap-3 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isSaving ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Guardando...
                        </>
                    ) : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
}