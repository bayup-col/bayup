"use client";

import { 
    User, Mail, Shield, Wallet, 
    Bell, Lock, Smartphone, Globe,
    ChevronRight, CheckCircle2, Save, Plus, X, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function AffiliateSettings() {
    const [isSaving, setIsSaving] = useState(false);
    const [confirmation, setConfirmation] = useState<string | null>(null);
    
    // Inicializar estado con valores por defecto
    const [formData, setFormData] = useState({
        fullName: 'Afiliado Bayup Oficial',
        email: 'afiliado@bayup.com',
        phone: '+57 300 000 0000',
        location: 'Bogotá, Colombia'
    });

    // Cargar datos guardados al montar el componente
    useEffect(() => {
        const savedData = localStorage.getItem('affiliate_profile_data');
        if (savedData) {
            try {
                setFormData(JSON.parse(savedData));
            } catch (e) {
                console.error("Error al cargar datos de perfil", e);
            }
        }
    }, []);

    const showConfirmation = (msg: string) => {
        setConfirmation(msg);
        setTimeout(() => setConfirmation(null), 3000);
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulación de guardado con persistencia local
        setTimeout(() => {
            localStorage.setItem('affiliate_profile_data', JSON.stringify(formData));
            setIsSaving(false);
            showConfirmation("Cambios guardados correctamente");
        }, 1500);
    };

    const handleAction = (label: string) => {
        showConfirmation(`${label} estará disponible próximamente`);
    };

    return (
        <div className="space-y-12 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                        Configuración del <span className="text-purple-600">Perfil</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Gestiona tus datos personales, preferencias y métodos de pago.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-14 px-8 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Save size={18}/>
                    )}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Personal Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                        <div className="flex items-center gap-4 border-b border-gray-50 pb-8">
                            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Información Personal</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    value={formData.fullName} 
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email de Socio</label>
                                <input 
                                    type="email" 
                                    value={formData.email} 
                                    readOnly
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent outline-none text-sm font-bold text-gray-400 cursor-not-allowed" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono / WhatsApp</label>
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+57 300 000 0000" 
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ciudad / País</label>
                                <input 
                                    type="text" 
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    placeholder="Bogotá, Colombia" 
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                        <div className="flex items-center gap-4 border-b border-gray-50 pb-8">
                            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Wallet size={20} />
                            </div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Método de Pago</h4>
                        </div>

                        <div className="p-8 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300">
                                <Plus size={24} />
                            </div>
                            <p className="text-[11px] font-black text-gray-400 uppercase italic">Aún no has configurado un método de pago</p>
                            <p className="text-[9px] text-gray-400 uppercase max-w-xs leading-relaxed font-bold">Para recibir tus comisiones, debes adjuntar una certificación bancaria válida.</p>
                            <button 
                                onClick={() => handleAction("Configuración de pago")}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-500 active:scale-95"
                            >
                                Configurar Ahora
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Seguridad</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Cambiar Contraseña', icon: <Lock size={16}/> },
                                { label: 'Autenticación 2FA', icon: <Smartphone size={16}/> },
                                { label: 'Sesiones Activas', icon: <Shield size={16}/> },
                            ].map((item, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleAction(item.label)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-gray-400 group-hover:text-purple-600 transition-colors">{item.icon}</div>
                                        <span className="text-[10px] font-black uppercase text-gray-900">{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-purple-600 p-10 rounded-[3.5rem] text-white shadow-xl shadow-purple-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Bell size={80} />
                        </div>
                        <h5 className="text-[12px] font-black uppercase italic relative z-10">Notificaciones</h5>
                        <p className="mt-4 text-[10px] font-medium italic text-purple-100/80 leading-relaxed relative z-10">
                            Recibe alertas inmediatas en tu móvil cuando una de tus empresas realice una venta de alto valor.
                        </p>
                        <div className="mt-8 flex items-center gap-4 relative z-10">
                            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 flex items-center gap-3">
                                <Clock size={14} className="text-purple-200" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Próximamente</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Floating Message */}
            <AnimatePresence>
                {confirmation && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-[800]">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{confirmation}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
