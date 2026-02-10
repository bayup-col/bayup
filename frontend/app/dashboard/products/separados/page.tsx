"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  Smartphone, 
  ChevronRight, 
  Search, 
  Filter, 
  Layers, 
  Package, 
  User, 
  ArrowRight,
  RefreshCcw,
  Zap,
  MoreHorizontal,
  Info,
  X,
  FileText,
  Download,
  DollarSign,
  TrendingUp,
  Activity,
  History,
  Check,
  Plus,
  Calendar as CalendarIcon,
  ShoppingBag,
  CreditCard,
  Edit3,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/context/toast-context";
import TiltCard from '@/components/dashboard/TiltCard';

// --- TYPES ---
interface ReservedOrder {
    id: string;
    customer: { name: string; phone: string; email: string; };
    products: { name: string; variant: string; image: string; price: number; original_price: number; qty: number; }[];
    total_value: number;
    paid_amount: number;
    requested_at: string;
    expires_at: string;
    status: 'pending' | 'partial' | 'completed' | 'cancelled' | 'expired';
    history: { date: string; action: string; amount?: number; }[];
}

const MOCK_RESERVATIONS: ReservedOrder[] = [];

// --- MODAL DE NUEVO SEPARADO (POS MULTI-PRODUCTO + ABONO) ---
const NewSeparadoModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void }) => {
    const [searchTermCust, setSearchTermCust] = useState("");
    const [isCustFocused, setIsCustFocused] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [expiryDate, setExpiryDate] = useState("");
    const [initialAbono, setInitialAbono] = useState<string>("0");

    const mockCustomers: any[] = [];

    const mockProducts: any[] = [];

    const filteredCustomers = useMemo(() => {
        if (!searchTermCust) return mockCustomers.slice(0, 5);
        return mockCustomers.filter(c => c.name.toLowerCase().includes(searchTermCust.toLowerCase()) || c.phone.includes(searchTermCust));
    }, [searchTermCust]);

    const addProduct = (p: any) => {
        if (selectedProducts.find(item => item.id === p.id)) return;
        setSelectedProducts([...selectedProducts, { ...p, original_price: p.price, qty: 1 }]);
    };

    const updateProductPrice = (id: string, newPrice: number) => {
        setSelectedProducts(selectedProducts.map(p => p.id === id ? { ...p, price: newPrice } : p));
    };

    const removeProduct = (id: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    };

    const totalValue = selectedProducts.reduce((acc, p) => acc + p.price, 0);
    const abonoVal = parseInt(initialAbono) || 0;
    const pendingBalance = totalValue - abonoVal;

    const handleFinalize = () => {
        if (!selectedCustomer || selectedProducts.length === 0 || !expiryDate) return;
        onSave({ 
            customer: selectedCustomer, 
            products: selectedProducts, 
            total: totalValue, 
            expiry: expiryDate,
            abono: abonoVal
        });
        onClose();
        setSelectedCustomer(null); setSelectedProducts([]); setExpiryDate(""); setInitialAbono("0");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 50 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }} 
                        exit={{ scale: 0.9, opacity: 0, y: 50 }} 
                        className="bg-[#FAFAFA] w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10 flex flex-col md:flex-row"
                    >
                        {/* --- IZQUIERDA: CONFIGURACIÓN --- */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar border-r border-gray-100">
                            <h2 className="text-3xl font-black text-[#004d4d] uppercase italic">Configurar Separado</h2>
                            
                            {/* CLIENTE */}
                            <section className="space-y-4 relative">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">1. Seleccionar Cliente</h3>
                                {!selectedCustomer ? (
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" placeholder="Nombre o celular..." value={searchTermCust} onFocus={() => setIsCustFocused(true)} onBlur={() => setTimeout(() => setIsCustFocused(false), 200)} onChange={e => setSearchTermCust(e.target.value)} className="w-full pl-12 p-5 bg-white rounded-2xl border border-gray-100 focus:border-[#004d4d] outline-none text-sm font-bold shadow-sm transition-all" />
                                        <AnimatePresence>
                                            {isCustFocused && (
                                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-[70] overflow-hidden">
                                                    <div className="p-2">{filteredCustomers.map(c => (<button key={c.id} onClick={() => { setSelectedCustomer(c); setIsCustFocused(false); }} className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 rounded-2xl transition-all group text-left"><div><p className="font-black text-gray-900 text-sm">{c.name}</p><p className="text-[10px] text-gray-400 uppercase">{c.phone}</p></div><ChevronRight size={16} className="text-gray-200 group-hover:text-[#004d4d]"/></button>))}</div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-[#004d4d] rounded-3xl text-white flex justify-between items-center shadow-xl animate-in zoom-in-95">
                                        <div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center"><User size={20}/></div><div><p className="font-black text-sm">{selectedCustomer.name}</p><p className="text-[10px] text-[#00f2ff] font-bold uppercase">{selectedCustomer.phone}</p></div></div>
                                        <button onClick={() => setSelectedCustomer(null)} className="h-10 px-4 rounded-xl bg-white/10 hover:bg-rose-500 transition-all text-[10px] font-black uppercase">Cambiar</button>
                                    </div>
                                )}
                            </section>

                            {/* PRODUCTOS */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">2. Añadir Productos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {mockProducts.map(p => {
                                        const isAdded = selectedProducts.find(item => item.id === p.id);
                                        return (
                                            <button key={p.id} onClick={() => isAdded ? removeProduct(p.id) : addProduct(p)} className={`p-4 rounded-3xl border transition-all flex items-center gap-4 text-left ${isAdded ? 'bg-cyan-50 border-[#00f2ff]' : 'bg-white border-gray-100'}`}>
                                                <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0"><img src={p.img} className="w-full h-full object-cover" /></div>
                                                <div className="flex-1"><p className="font-black text-xs">{p.name}</p><p className="text-[10px] text-[#004d4d] font-bold mt-1">$ {p.price.toLocaleString()}</p></div>
                                                <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${isAdded ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-transparent'}`}><Check size={14}/></div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* PAGO INICIAL (NUEVO) */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                    <DollarSign size={14} className="text-emerald-500"/> 3. Abono Inicial (Opcional)
                                </h3>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#004d4d] text-lg">$</span>
                                    <input 
                                        type="number" 
                                        value={initialAbono} 
                                        onChange={e => setInitialAbono(e.target.value)} 
                                        className="w-full pl-10 p-5 bg-white rounded-2xl border border-gray-100 focus:border-[#004d4d] outline-none text-xl font-black shadow-sm transition-all" 
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {[10000, 20000, 50000, 100000].map(val => (
                                        <button key={val} onClick={() => setInitialAbono(val.toString())} className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 hover:border-[#004d4d] hover:text-[#004d4d] transition-all">
                                            + {val/1000}k
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* VIGENCIA */}
                            <section className="space-y-4"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">4. Fecha Límite de Liquidación</h3><input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full p-5 bg-white rounded-2xl border border-gray-100 focus:border-[#004d4d] outline-none text-sm font-bold shadow-sm"/></section>
                        </div>

                        {/* --- DERECHA: PREVISUALIZACIÓN --- */}
                        <div className="w-full md:w-[450px] bg-white p-10 flex flex-col justify-between relative border-l border-gray-100">
                            <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <h3 className="text-2xl font-black text-gray-900 italic uppercase border-b pb-4">Ticket de Reserva</h3>
                                
                                <div className="space-y-6 bg-gray-50 p-8 rounded-[3rem] border border-gray-100 shadow-inner">
                                    <div className="space-y-4">
                                        <p className="text-[9px] font-black text-gray-400 uppercase border-b border-gray-200 pb-2">Cliente & Productos</p>
                                        <p className="text-sm font-black text-gray-900">{selectedCustomer?.name || '---'}</p>
                                        <div className="space-y-2">
                                            {selectedProducts.map(p => (
                                                <div key={p.id} className="flex justify-between items-center"><p className="text-[10px] font-bold text-gray-500">{p.name}</p><p className="text-[10px] font-black text-[#004d4d]">$ {p.price.toLocaleString()}</p></div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                            <span>Subtotal</span>
                                            <span>$ {totalValue.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                            <span>Abono Recibido</span>
                                            <span>- $ {abonoVal.toLocaleString()}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
                                            <p className="text-[10px] font-black text-gray-900 uppercase">Saldo Pendiente</p>
                                            <p className="text-2xl font-black text-[#004d4d]">$ {pendingBalance.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 space-y-4">
                                <button onClick={handleFinalize} disabled={!selectedCustomer || selectedProducts.length === 0 || !expiryDate} className={`w-full py-6 rounded-[2rem] font-black text-[10px] uppercase shadow-2xl transition-all flex items-center justify-center gap-3 ${(!selectedCustomer || selectedProducts.length === 0 || !expiryDate) ? 'bg-gray-100 text-gray-300' : 'bg-[#004d4d] text-white hover:scale-[1.02] active:scale-95'}`}><CheckCircle2 size={18} className="text-[#00f2ff]"/> Confirmar Reserva</button>
                                <button onClick={onClose} className="w-full text-[10px] font-black text-gray-400 uppercase text-center hover:text-rose-600 transition-colors">Cancelar</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- OTROS MODALES ---
const PaymentActionModal = ({ isOpen, onClose, reservation, onConfirm }: { isOpen: boolean, onClose: () => void, reservation: ReservedOrder | null, onConfirm: (amount: number) => void }) => {
    const [amount, setAmount] = useState("");
    if (!reservation) return null;
    const saldo = reservation.total_value - reservation.paid_amount;
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                        <div className="bg-[#004d4d] p-10 text-white text-center relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={80} /></div><h2 className="text-2xl font-black uppercase tracking-tight relative z-10">Registrar Pago</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase mt-2">Folio: #{reservation.id}</p></div>
                        <div className="p-10 space-y-8 bg-white">
                            <div className="grid grid-cols-2 gap-4"><button onClick={() => setAmount(saldo.toString())} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:border-[#004d4d] transition-all text-center"><p className="text-[8px] font-black text-gray-400 uppercase">Pago Completo</p><p className="text-xs font-black text-[#004d4d] mt-1">$ {saldo.toLocaleString()}</p></button><div className="p-4 rounded-2xl border border-gray-100 bg-white text-center"><p className="text-[8px] font-black text-gray-400 uppercase">Total Pedido</p><p className="text-xs font-black text-gray-900 mt-1">$ {reservation.total_value.toLocaleString()}</p></div></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Monto Abono</label><div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#004d4d] text-xl">$</span><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-10 p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-xl font-black shadow-inner" placeholder="0.00" /></div></div>
                            <button onClick={() => { onConfirm(parseInt(amount)); onClose(); setAmount(""); }} disabled={!amount || parseInt(amount) <= 0} className="w-full py-5 bg-[#004d4d] text-white rounded-[1.5rem] font-black uppercase text-[10px] shadow-2xl disabled:opacity-50 transition-all">Confirmar</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const SeparadosGuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState('general');
    const content = {
        general: { title: 'Ciclo de Reserva', icon: <RefreshCcw size={20}/>, color: 'text-blue-500', how: 'Gestiona ventas con abonos parciales.', ex: 'Separado de $200k con $50k.', tip: 'Pide al menos el 30% inicial.' },
        cobros: { title: 'Gestión de Cobros', icon: <DollarSign size={20}/>, color: 'text-emerald-500', how: 'Registra múltiples abonos.', ex: 'WhatsApp automático de saldo.', tip: 'Usa WA para estados de cuenta.' },
        vencimiento: { title: 'Alertas de Tiempo', icon: <Clock size={20}/>, color: 'text-rose-500', how: 'Tiempo límite de liquidación.', ex: 'Resalta en rojo a los 10 días.', tip: 'Libera stock vencido los viernes.' }
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row">
                        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D] mb-6">Estrategia Comercial</h3>{Object.entries(content).map(([key, item]) => (<button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}><div className={`${activeTab === key ? 'text-white' : item.color}`}>{item.icon}</div><span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span></button>))}</div>
                        <div className="flex-1 flex flex-col overflow-hidden bg-white"><div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm"><div className="flex items-center gap-4"><div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${content[activeTab as keyof typeof content].color}`}>{content[activeTab as keyof typeof content].icon}</div><h2 className="text-2xl font-black text-slate-900 uppercase italic">{content[activeTab as keyof typeof content].title}</h2></div><button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar"><section><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo funciona?</h4><p className="text-sm font-medium text-slate-600 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">{content[activeTab as keyof typeof content].how}</p></section><div className="grid md:grid-cols-2 gap-8"><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smartphone size={14} className="text-cyan-500"/> Ejemplo</h4><div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]"><p className="text-xs font-medium text-cyan-900 italic">"{content[activeTab as keyof typeof content].ex}"</p></div></section><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Tip</h4><div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]"><p className="text-xs font-bold text-amber-900 leading-relaxed">{content[activeTab as keyof typeof content].tip}</p></div></section></div></div><div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30"><button onClick={onClose} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Entendido</button></div></div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const SeparadosMetricModal = ({ isOpen, onClose, metric }: { isOpen: boolean, onClose: () => void, metric: any }) => {
    if (!metric) return null;

    const renderMetricDetail = () => {
        switch (metric.id) {
            case 't_r': // Reservas Activas
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-[8px] font-black text-blue-400 uppercase">En Proceso</p>
                                <p className="text-lg font-black text-blue-700">18</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <p className="text-[8px] font-black text-emerald-400 uppercase">Liquidadas Hoy</p>
                                <p className="text-lg font-black text-emerald-700">6</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Distribución por Estado</p>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                <div className="h-full bg-blue-500 w-[60%]" />
                                <div className="h-full bg-amber-500 w-[30%]" />
                                <div className="h-full bg-rose-500 w-[10%]" />
                            </div>
                            <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase">
                                <span>Abonos (60%)</span>
                                <span>Pendientes (30%)</span>
                                <span>Alertas (10%)</span>
                            </div>
                        </div>
                    </div>
                );
            case 'm_s': // Capital Separado
                return (
                    <div className="space-y-6">
                        <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <p className="text-[9px] font-black text-gray-400 uppercase mb-4">Tendencia de Valor Reservado</p>
                            <div className="flex items-end justify-between h-24 gap-2">
                                {[40, 70, 55, 90, 60, 85, 100].map((h, i) => (
                                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className="w-full bg-[#004d4d] rounded-t-lg opacity-80" />
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[8px] font-bold text-gray-400"><span>LUN</span><span>DOM</span></div>
                        </div>
                        <p className="text-[10px] font-medium text-gray-500 italic text-center">"El 45% del capital está concentrado en la categoría de **Calzado Premium**."</p>
                    </div>
                );
            case 'a_r': // Recaudo Abonos
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {[
                                { label: 'Efectivo', val: '$ 450k', p: 55 },
                                { label: 'Transferencia', val: '$ 300k', p: 35 },
                                { label: 'Datafono', val: '$ 100k', p: 10 }
                            ].map((m, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="text-gray-500">{m.label}</span>
                                        <span className="text-[#004d4d]">{m.val}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${m.p}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <TrendingUp size={16} className="text-emerald-600"/>
                            <p className="text-[10px] font-black text-emerald-700 uppercase">+15.2% eficiencia de recaudo vs ayer</p>
                        </div>
                    </div>
                );
            case 'p_v': // Alertas Vencimiento
                return (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">⚠️ Casos Críticos (Hoy)</p>
                            {['SEP-1042 - Diana R.', 'SEP-1055 - Carlos M.', 'SEP-1060 - Sandra P.'].map((alert, i) => (
                                <div key={i} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-rose-700">{alert}</span>
                                    <span className="text-[8px] font-black bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full uppercase">Expira en 2h</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-3 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-rose-100">Notificar a todos vía WhatsApp</button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                        <div className={`p-10 text-white relative overflow-hidden ${metric.color.replace('text-', 'bg-')}`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10">{metric.icon}</div>
                            <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">{metric.title}</h2>
                            <p className="text-[10px] font-black uppercase mt-2 opacity-80">{metric.trend}</p>
                            <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-white">
                            <div className="text-center py-4">
                                <span className="text-5xl font-black text-gray-900 italic tracking-tighter">{metric.value}</span>
                                <p className="text-[10px] font-black text-gray-400 uppercase mt-4">{metric.sub}</p>
                            </div>
                            
                            <div className="border-t border-gray-100 pt-8">
                                {renderMetricDetail()}
                            </div>

                            <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-black transition-all">Cerrar Análisis</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function SeparadosPage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [reservations, setReservations] = useState<ReservedOrder[]>([]);
    
    useEffect(() => {
        const saved = localStorage.getItem('bayup_reservations');
        if (saved) { setReservations(JSON.parse(saved)); }
        else { setReservations(MOCK_RESERVATIONS); }
    }, []);

    useEffect(() => {
        if (reservations.length > 0) { localStorage.setItem('bayup_reservations', JSON.stringify(reservations)); }
    }, [reservations]);

    const [activeTab, setActiveTab] = useState<'all' | 'partial' | 'completed' | 'expired'>('all');
    const [selectedReservation, setSelectedReservation] = useState<ReservedOrder | null>(null);
    const [selectedKPI, setSelectedKPI] = useState<any | null>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isNewSeparadoOpen, setIsNewSeparadoOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [resForPayment, setResForPayment] = useState<ReservedOrder | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);

    const formatCurrency = (val: number) => `$ ${val.toLocaleString('es-CO')}`;

    const handleSync = () => {
        setIsSyncing(true); showToast("Sincronizando con inventario global...", "info");
        setTimeout(() => { setIsSyncing(false); showToast("Estados actualizados correctamente 🔄", "success"); }, 2000);
    };

    const handleDatePreset = (p: string) => {
        const d = new Date(); const fmt = (date: Date) => date.toISOString().split('T')[0];
        if (p === 'today') setDateRange({ from: fmt(d), to: fmt(d) });
        if (p === 'week') { const start = new Date(); start.setDate(d.getDate() - 7); setDateRange({ from: fmt(start), to: fmt(d) }); }
        setIsDateMenuOpen(false);
    };

    const handleExportPDF = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const petrol = [0, 77, 77];
            doc.setFillColor(petrol[0], petrol[1], petrol[2]); doc.rect(0, 0, 210, 45, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("AUDITORÍA DE SEPARADOS", 15, 20);
            doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`Generado: ${new Date().toLocaleString()}`, 15, 30);
            let y = 60; doc.setFillColor(245, 245, 245); doc.rect(14, y-6, 185, 8, 'F'); doc.setTextColor(0, 0, 0); doc.text("ID", 16, y); doc.text("CLIENTE", 40, y); doc.text("TOTAL", 100, y); doc.text("PAGADO", 140, y);
            y += 10; filteredReservations.forEach(r => { doc.text(r.id, 16, y); doc.text(r.customer.name.slice(0, 20), 40, y); doc.text(`$ ${r.total_value.toLocaleString()}`, 100, y); doc.text(`$ ${r.paid_amount.toLocaleString()}`, 140, y); y += 8; });
            doc.save(`Reporte_Separados.pdf`); showToast("PDF Generado ✨", "success");
        } catch (e) { console.error(e); }
    };

    const handleWhatsAppNotification = (r: ReservedOrder) => {
        const saldo = r.total_value - r.paid_amount;
        const msg = `Hola ${r.customer.name}! 👋 Tu separado #${r.id} tiene un saldo de ${formatCurrency(saldo)}. Vence el ${new Date(r.expires_at).toLocaleDateString()}.`;
        window.open(`https://wa.me/${r.customer.phone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleNewAbono = (r: ReservedOrder) => { setResForPayment(r); setIsPaymentModalOpen(true); };

    const confirmPayment = (val: number) => {
        if (!resForPayment) return;
        let updatedRes: ReservedOrder | null = null;
        setReservations(prev => prev.map(item => {
            if (item.id === resForPayment.id) {
                const newPaid = item.paid_amount + val;
                const newStatus = newPaid >= item.total_value ? 'completed' : 'partial';
                updatedRes = { ...item, paid_amount: newPaid, status: newStatus, history: [...item.history, { date: new Date().toISOString().split('T')[0], action: 'Abono registrado', amount: val }] };
                return updatedRes;
            }
            return item;
        }));
        if (updatedRes) setSelectedReservation(updatedRes);
        showToast(`Abono de ${formatCurrency(val)} registrado ✨`, "success");
    };

    const handleSaveNewSeparado = (data: any) => {
        const newSep: ReservedOrder = {
            id: `SEP-${Math.floor(Math.random() * 900) + 1000}`,
            customer: { name: data.customer.name, phone: data.customer.phone, email: data.customer.email },
            products: data.products.map((p: any) => ({ ...p, variant: 'Unica', image: p.img, original_price: p.original_price, qty: 1 })),
            total_value: data.total, 
            paid_amount: data.abono, 
            requested_at: new Date().toISOString(), 
            expires_at: data.expiry,
            status: data.abono >= data.total ? 'completed' : (data.abono > 0 ? 'partial' : 'pending'), 
            history: [{ date: new Date().toISOString().split('T')[0], action: 'Reserva creada' + (data.abono > 0 ? ` con abono de ${formatCurrency(data.abono)}` : '') }]
        };
        setReservations([newSep, ...reservations]); showToast("Separado registrado exitosamente 🏷️", "success");
    };

    const kpiData = [
        { id: 't_r', title: 'Reservas Activas', value: '24', trend: '+5% vs semana anterior', sub: 'Pedidos en curso', icon: <Layers size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'm_s', title: 'Capital Separado', value: '$ 4.2M', trend: '+12% este mes', sub: 'Inventario comprometido', icon: <DollarSign size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'a_r', title: 'Recaudo Abonos', value: '$ 850k', trend: 'Actualizado hoy', sub: 'Ingreso real a caja', icon: <Zap size={20}/>, color: 'text-[#004D4D]', bg: 'bg-[#004D4D]/5' },
        { id: 'p_v', title: 'Alertas Vencimiento', value: '05', trend: 'Acción urgente', sub: 'Stock por liberar', icon: <AlertCircle size={20}/>, color: 'text-rose-600', bg: 'bg-rose-50' }
    ];

    const filteredReservations = useMemo(() => {
        return reservations.filter(r => {
            const matchesSearch = r.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'all' || r.status === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [reservations, searchTerm, activeTab]);

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000 relative">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Cartera</span></div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Separados <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00f2ff] px-2 py-1">AI</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Control automatizado de abonos y stock reservado.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleSync} disabled={isSyncing} className="h-14 px-8 bg-white border border-gray-100 text-[#004d4d] rounded-[1.5rem] font-black text-[10px] uppercase shadow-sm hover:shadow-lg flex items-center gap-3 transition-all disabled:opacity-50"><RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''}/> {isSyncing ? 'Sincronizando...' : 'Actualizar Estados'}</button>
                    <button onClick={() => setIsNewSeparadoOpen(true)} className="h-14 px-8 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><Plus size={18} className="text-[#00f2ff]"/> Nuevo Separado</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
                {kpiData.map((kpi, i) => (
                    <TiltCard key={i} className="h-full">
                        <div onClick={() => setSelectedKPI(kpi)} className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color} shadow-inner group-hover:scale-110 transition-transform`}>{kpi.icon}</div>
                                <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">{kpi.trend}</span>
                            </div>
                            <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.title}</p><h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3><p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p></div>
                        </div>
                    </TiltCard>
                ))}
            </div>

            <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                <div className="flex items-center gap-4">
                    <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center relative">
                        {[ { id: 'all', label: 'Todas' }, { id: 'partial', label: 'Abonadas' }, { id: 'completed', label: 'Liquidadas' }, { id: 'expired', label: 'Vencidas' } ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{isActive && <motion.div layoutId="activeSepTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}{tab.label}</button>);
                        })}
                    </div>
                    <button onClick={() => setShowInfoModal(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 transition-all shadow-xl active:scale-95 group"><Info size={20} /></button>
                </div>
                <div className="w-full flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm mx-4 relative">
                    <div className="relative w-full max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Buscar por cliente o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-bold outline-none"/></div>
                    <div className="flex items-center gap-2 pr-2">
                        <div className="relative"><motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400'}`}><Filter size={18}/><AnimatePresence mode="popLayout">{ (isFilterHovered || isFilterMenuOpen) && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Estado</motion.span> }</AnimatePresence></motion.button>
                        {isFilterMenuOpen && (<div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-48 z-50 animate-in fade-in zoom-in-95">{['all', 'partial', 'completed', 'expired'].map(f => (<button key={f} onClick={() => { setActiveTab(f as any); setIsFilterMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[9px] font-black uppercase text-gray-500 hover:bg-gray-50 rounded-lg">{f}</button>))}</div>)}</div>
                        <div className="relative"><motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} onClick={() => setIsDateMenuOpen(!isDateMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400'}`}><CalendarIcon size={18}/><AnimatePresence mode="popLayout">{ (isDateHovered || isDateMenuOpen) && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Período</motion.span> }</AnimatePresence></motion.button>
                        {isDateMenuOpen && (<div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64 z-50 space-y-4 animate-in fade-in zoom-in-95"><div className="grid grid-cols-2 gap-2"><input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg text-[10px] outline-none"/><input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg text-[10px] outline-none"/></div><div className="flex gap-2 pt-2 border-t border-gray-50"><button onClick={() => handleDatePreset('today')} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded text-[8px] font-black uppercase">Hoy</button><button onClick={() => handleDatePreset('week')} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded text-[8px] font-black uppercase">Semana</button></div><button onClick={() => setIsDateMenuOpen(false)} className="w-full py-2 bg-[#004D4D] text-white rounded-lg text-[9px] font-black uppercase">Aplicar</button></div>)}</div>
                        <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleExportPDF} className="h-12 flex items-center gap-2 px-4 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-emerald-600 transition-all"><Download size={18}/><AnimatePresence mode="popLayout">{ isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar PDF</motion.span> }</AnimatePresence></motion.button>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-6">
                {filteredReservations.map((r) => {
                    const progress = (r.paid_amount / r.total_value) * 100;
                    return (<motion.div key={r.id} whileHover={{ x: 5 }} onClick={() => setSelectedReservation(r)} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 cursor-pointer group"><div className="flex items-center gap-6 flex-1"><div className="h-20 w-20 rounded-[1.8rem] overflow-hidden border-2 border-white shadow-lg shrink-0"><img src={r.products[0].image} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" /></div><div><div className="flex items-center gap-3"><h4 className="text-xl font-black text-gray-900 tracking-tight">{r.customer.name}</h4><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{r.id}</span></div><p className="text-xs font-bold text-[#004d4d] mt-1 uppercase italic">{r.products[0].name} {r.products.length > 1 && `+ ${r.products.length - 1} más`}</p><div className="mt-3 flex gap-2"><span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${r.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : r.status === 'expired' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{r.status === 'partial' ? 'Abono Parcial' : r.status === 'completed' ? 'Liquidado' : r.status}</span></div></div></div><div className="flex-[1.5] space-y-4"><div className="flex justify-between items-end"><div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Abonado: {formatCurrency(r.paid_amount)}</p><p className="text-sm font-black text-[#004d4d]">Faltan: {formatCurrency(r.total_value - r.paid_amount)}</p></div><p className="text-lg font-black text-gray-900">{Math.round(progress)}%</p></div><div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full rounded-full shadow-[0_0_10px_rgba(0,242,255,0.3)] ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#004d4d] to-[#00f2ff]'}`}></motion.div></div></div><div className="flex items-center gap-4"><button onClick={(e) => { e.stopPropagation(); handleNewAbono(r); }} className="h-14 px-6 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Registrar Pago</button><button className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all"><ChevronRight size={24}/></button></div></motion.div>);
                })}
            </div>

            <AnimatePresence>
                {selectedReservation && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedReservation(null)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[400]" />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[410] flex flex-col border-l border-slate-200">
                            <div className="px-10 py-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 shrink-0"><div className="flex items-center gap-6"><div className="h-16 w-16 rounded-2xl bg-gray-900 flex items-center justify-center text-white text-2xl font-black shadow-xl">{selectedReservation.id.split('-')[1]}</div><div><h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedReservation.customer.name}</h2><p className="text-sm font-bold text-emerald-600 flex items-center gap-2 mt-1"><CheckCircle2 size={14}/> {selectedReservation.status === 'completed' ? 'Separado Liquidado' : 'Separado en Proceso'}</p></div></div><button onClick={() => setSelectedReservation(null)} className="h-12 w-12 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center"><X size={24}/></button></div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-white">
                                <section className="space-y-8"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Proceso</h3><div className="relative pl-8 space-y-10"><div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-100"></div>{[ { label: 'Separación', date: selectedReservation.requested_at, s: 'done', icon: <Package size={14}/> }, { label: 'Abonos', date: 'En curso', s: selectedReservation.status === 'completed' ? 'done' : 'current', icon: <DollarSign size={14}/> }, { label: 'Entrega', date: 'Pendiente', s: selectedReservation.status === 'completed' ? 'done' : 'pending', icon: <CheckCircle2 size={14}/> } ].map((step, i) => (<div key={i} className="relative flex items-start gap-6"><div className={`absolute -left-[31px] h-8 w-8 rounded-2xl border-4 border-white shadow-md flex items-center justify-center z-10 ${step.s === 'done' ? 'bg-emerald-500 text-white' : step.s === 'current' ? 'bg-[#00F2FF] text-[#004D4D] animate-pulse' : 'bg-slate-100 text-slate-300'}`}>{step.icon}</div><div><p className={`text-sm font-black uppercase ${step.s === 'pending' ? 'text-slate-300' : 'text-slate-900'}`}>{step.label}</p></div></div>))}</div></section>
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Productos</h3>
                                    {selectedReservation.products.map((p, i) => (
                                        <div key={i} className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 flex gap-6 items-center">
                                            <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0"><img src={p.image} className="h-full w-full object-cover" /></div>
                                            <div className="flex-1"><h4 className="text-sm font-black text-gray-900">{p.name}</h4><p className="text-[10px] font-bold text-[#004d4d] uppercase tracking-widest mt-1">{p.variant}</p></div>
                                            <p className="text-sm font-black text-gray-900">{formatCurrency(p.price)}</p>
                                        </div>
                                    ))}
                                </section>
                                <section className="space-y-6"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Historial</h3><div className="space-y-3">{selectedReservation.history.map((h, i) => (<div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Check size={18}/></div><div><p className="text-xs font-black text-slate-900">{h.action}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{h.date}</p></div></div><p className="text-sm font-black text-emerald-600">+{formatCurrency(h.amount || 0)}</p></div>))}</div></section>
                            </div>
                            <div className="p-8 border-t border-slate-100 bg-white flex gap-4"><button onClick={() => handleWhatsAppNotification(selectedReservation)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-3"><MessageSquare size={18}/> WhatsApp</button><button onClick={() => handleNewAbono(selectedReservation)} className="flex-[1.5] py-5 bg-[#004D4D] text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-3"><DollarSign size={18} className="text-[#00F2FF]"/> Registrar Pago</button></div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <SeparadosGuideModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
            <SeparadosMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />
            <NewSeparadoModal isOpen={isNewSeparadoOpen} onClose={() => setIsNewSeparadoOpen(false)} onSave={handleSaveNewSeparado} />
            <PaymentActionModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} reservation={resForPayment} onConfirm={confirmPayment} />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}