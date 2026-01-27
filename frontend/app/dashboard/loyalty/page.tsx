"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Trophy, 
  Settings, 
  Plus, 
  X, 
  Gift, 
  Camera, 
  CheckCircle2, 
  Star, 
  Trash2,
  Coins,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/context/toast-context";

interface Reward {
    id: string;
    name: string;
    points: number;
    image: string | null;
    stock: number | null; // null significa ilimitado
}

export default function LoyaltyPage() {
    const { showToast } = useToast();
    const [isActive, setIsActive] = useState(true);
    const [earnRate, setEarnRate] = useState(1000);
    const [redeemRate, setRedeemRate] = useState(100);
    const [redeemValue, setRedeemRateValue] = useState(5000);
    const [isSaving, setIsSaving] = useState(false);
    const [isBonoActive, setIsBonoActive] = useState(true);
    
    // Rewards State
    const [rewards, setRewards] = useState<Reward[]>([]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newReward, setNewReward] = useState({ name: '', points: 0, image: null as string | null, stock: null as number | null });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar datos al iniciar
    useEffect(() => {
        const savedRewards = localStorage.getItem('loyalty_rewards');
        if (savedRewards) {
            setRewards(JSON.parse(savedRewards));
        } else {
            // Valores iniciales por defecto si no hay nada guardado
            const initial = [
                { id: 'r1', name: 'Gorra Oficial Bayup', points: 500, image: null, stock: 10 },
                { id: 'r2', name: 'Bono de Regalo $50.000', points: 1000, image: null, stock: null }
            ];
            setRewards(initial);
            localStorage.setItem('loyalty_rewards', JSON.stringify(initial));
        }
    }, []);

    const formatNumber = (val: number) => {
        if (!val) return "0";
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const unformatNumber = (val: string) => {
        return parseInt(val.replace(/\./g, '')) || 0;
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast("Configuración del Club de Puntos actualizada con éxito 🏆", "success");
        }, 1000);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewReward({ ...newReward, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddReward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReward.name || newReward.points <= 0) {
            return showToast("Completa el nombre y los puntos del premio", "error");
        }

        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const reward: Reward = {
            id: Math.random().toString(36).substr(2, 9),
            ...newReward
        };
        
        const updatedRewards = [...rewards, reward];
        setRewards(updatedRewards);
        localStorage.setItem('loyalty_rewards', JSON.stringify(updatedRewards));
        
        setIsProcessing(false);
        setIsModalOpen(false);
        setNewReward({ name: '', points: 0, image: null, stock: null });
        showToast("¡Nuevo premio añadido al catálogo! 🎁", "success");
    };

    const deleteReward = (id: string) => {
        const updatedRewards = rewards.filter(r => r.id !== id);
        setRewards(updatedRewards);
        localStorage.setItem('loyalty_rewards', JSON.stringify(updatedRewards));
        showToast("Premio eliminado", "success");
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        Club de Puntos <Trophy className="text-amber-500" size={32} />
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Fideliza a tus clientes premiando cada una de sus compras.</p>
                </div>
                <div className="flex items-center gap-6 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado: {isActive ? 'Activo' : 'Pausado'}</p>
                    </div>
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={`w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 left-1 h-6 w-6 bg-white rounded-full transition-transform shadow-md ${isActive ? 'translate-x-6' : ''}`}></div>
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-10 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                {/* Configuración Izquierda */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Reglas de Acumulación */}
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Coins size={80} /></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm"><Star size={24} /></div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Reglas de Acumulación</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Define cuánto vale cada peso en puntos</p>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Por cada compra de:</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-amber-600">$</span>
                                    <input 
                                        type="text" 
                                        value={formatNumber(earnRate)} 
                                        onChange={(e) => setEarnRate(unformatNumber(e.target.value))}
                                        className="w-full pl-10 pr-4 py-5 bg-gray-50 rounded-[1.5rem] border-2 border-transparent focus:bg-white focus:border-amber-200 outline-none text-sm font-black transition-all shadow-inner" 
                                    />
                                </div>
                            </div>
                            <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300"><ArrowRight /></div>
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">El cliente gana:</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value="1"
                                        disabled
                                        className="w-full px-5 py-5 bg-gray-100 rounded-[1.5rem] border-none outline-none text-sm font-black text-gray-400" 
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600 uppercase">Punto</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reglas de Canje Rápido */}
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Gift size={80} /></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm"><Settings size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Bono de Descuento</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Conversión de puntos a dinero real</p>
                                </div>
                            </div>
                            {/* Toggle Específico para Bono */}
                            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{isBonoActive ? 'Habilitado' : 'Desactivado'}</span>
                                <button 
                                    onClick={() => setIsBonoActive(!isBonoActive)}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-300 shadow-inner ${isBonoActive ? 'bg-purple-600' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform shadow-sm ${isBonoActive ? 'translate-x-5' : ''}`}></div>
                                </button>
                            </div>
                        </div>
                        
                        <div className={`flex flex-col md:flex-row items-center gap-8 relative z-10 transition-all duration-500 ${isBonoActive ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Al completar:</label>
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        value={formatNumber(redeemRate)} 
                                        onChange={(e) => setRedeemRate(unformatNumber(e.target.value))}
                                        className="w-full px-5 py-5 bg-gray-50 rounded-[1.5rem] border-2 border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-black transition-all shadow-inner" 
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-600 uppercase">Puntos</span>
                                </div>
                            </div>
                            <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300"><ArrowRight /></div>
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recibe un bono de:</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-emerald-600">$</span>
                                    <input 
                                        type="text" 
                                        value={formatNumber(redeemValue)} 
                                        onChange={(e) => setRedeemRateValue(unformatNumber(e.target.value))}
                                        className="w-full pl-10 pr-4 py-5 bg-gray-50 rounded-[1.5rem] border-2 border-transparent focus:bg-white focus:border-emerald-200 outline-none text-sm font-black transition-all shadow-inner" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                        >
                            {isSaving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
                            {isSaving ? 'Procesando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </div>

                {/* Catálogo de Premios Derecha */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-900">Catálogo</h2>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="h-10 w-10 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 transition-all shadow-lg active:scale-90"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {rewards.map((reward) => (
                                <div key={reward.id} className="group relative bg-gray-50 p-4 rounded-3xl border border-transparent hover:bg-white hover:border-purple-100 transition-all">
                                    <button 
                                        onClick={() => deleteReward(reward.id)}
                                        className="absolute -top-2 -right-2 h-8 w-8 bg-white border border-rose-100 text-rose-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-rose-500 hover:text-white"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
                                            {reward.image ? (
                                                <img src={reward.image} alt={reward.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Gift className="text-purple-300" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{formatNumber(reward.points)} Puntos</p>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">{reward.name}</p>
                                            <p className={`text-[9px] font-black uppercase mt-1 ${reward.stock !== null && reward.stock <= 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                                                {reward.stock === null ? '∞ Ilimitado' : reward.stock <= 0 ? '🚫 Agotado' : `${reward.stock} disponibles`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {rewards.length === 0 && (
                                <div className="py-10 text-center space-y-4">
                                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300"><Gift /></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No hay premios aún</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-amber-500 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-xl shadow-amber-500/10">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Consejo Bayt</p>
                            <h3 className="text-lg font-black mt-2 leading-tight">Motiva a tus clientes</h3>
                            <p className="text-xs font-medium mt-3 opacity-90 leading-relaxed">
                                Ofrecer premios físicos tangibles aumenta la recurrencia de compra en un 40% más que solo bonos de descuento.
                            </p>
                        </div>
                        <div className="absolute -right-10 -bottom-10 text-[10rem] opacity-10 rotate-12"><Trophy /></div>
                    </div>
                </div>
            </div>

            {/* MODAL: AÑADIR PREMIO PREMIUM */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden relative border border-white/20"
                        >
                            {/* Header Dark */}
                            <div className="bg-gray-900 p-8 text-white relative">
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                        <Gift size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">Nuevo Premio</h2>
                                        <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Catálogo de Fidelización</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleAddReward} className="p-10 space-y-8">
                                {/* Foto del Regalo */}
                                <div className="flex flex-col items-center gap-4 bg-gray-50 p-8 rounded-[2.5rem] border border-dashed border-gray-200 hover:border-purple-300 transition-all group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    {newReward.image ? (
                                        <div className="h-32 w-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl relative group">
                                            <img src={newReward.image} alt="Preview" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <Camera className="text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center text-gray-300 shadow-sm group-hover:text-purple-500 transition-all">
                                                <Camera size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-gray-900 uppercase">Subir Foto del Regalo</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Formatos JPG, PNG</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Premio</label>
                                        <input 
                                            type="text" 
                                            value={newReward.name}
                                            onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all shadow-inner" 
                                            placeholder="Ej: Camiseta Coleccionista" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Puntos Necesarios</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={formatNumber(newReward.points)}
                                                    onChange={(e) => setNewReward({ ...newReward, points: unformatNumber(e.target.value) })}
                                                    className="w-full pl-5 pr-12 py-5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all shadow-inner" 
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-600 uppercase">PTS</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Existencias</label>
                                            <input 
                                                type="number" 
                                                value={newReward.stock === null ? '' : newReward.stock}
                                                onChange={(e) => setNewReward({ ...newReward, stock: e.target.value === '' ? null : parseInt(e.target.value) })}
                                                className="w-full p-5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-black transition-all shadow-inner" 
                                                placeholder="∞ Ilimitado" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isProcessing}
                                        className="flex-[2] py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                Añadir al Catálogo
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
