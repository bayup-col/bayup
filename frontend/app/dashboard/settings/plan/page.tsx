"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  Bot, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Crown,
  Sparkles,
  Info,
  Calendar,
  Lock,
  Star,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  CreditCard as CardIcon,
  Plus,
  X,
  Target,
  Rocket,
  ShieldAlert,
  Activity,
  ShoppingBag,
  Users,
  MessageSquare,
  Warehouse,
  FileText,
  BadgePercent,
  Calculator,
  ArrowRight,
  Check
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface PlanFeature {
    text: string;
    included: 'full' | 'limited' | 'none';
    hint?: string;
}

interface Plan {
    id: string;
    name: string;
    price: number;
    priceStr: string;
    originalPrice?: string;
    commission: number;
    commissionStr: string;
    description: string;
    features: PlanFeature[];
    buttonText: string;
}

// --- DATA ---
const PLANS: Plan[] = [
    {
        id: 'basico',
        name: 'Plan Básico',
        price: 0,
        priceStr: '0',
        commission: 0.025,
        commissionStr: '2.5%',
        description: 'Ideal para emprendedores que están iniciando su aventura digital.',
        buttonText: 'Cambiar a Básico',
        features: [
            { text: 'Tienda Online Profesional', included: 'full' },
            { text: 'Facturación & Pedidos', included: 'full' },
            { text: 'Gestión de Envíos', included: 'full' },
            { text: 'Análisis General & Gastos', included: 'full' },
            { text: 'Mensajería: Hasta 500 msgs/mes', included: 'limited', hint: 'Límite básico' },
            { text: 'Staff: 1 Usuario (Dueño)', included: 'limited', hint: 'Solo acceso principal' },
            { text: 'Marketing & Descuentos', included: 'none' },
            { text: 'Asistente Bayt AI', included: 'none' },
        ]
    },
    {
        id: 'pro',
        name: 'Plan Pro',
        price: 0,
        priceStr: '0',
        commission: 0.035,
        commissionStr: '3.5%',
        description: 'Para negocios en crecimiento que necesitan herramientas avanzadas.',
        buttonText: 'Escalar a Pro',
        features: [
            { text: 'Todo lo del Plan Básico', included: 'full' },
            { text: 'Mensajería Manual Ilimitada', included: 'full' },
            { text: 'Staff: Hasta 5 Usuarios', included: 'full', hint: 'Equipo comercial' },
            { text: 'Catálogos WhatsApp & IA', included: 'full' },
            { text: 'Bodegas & Stock Avanzado', included: 'full' },
            { text: 'Garantías & Nómina', included: 'full' },
            { text: 'Marketing & Descuentos', included: 'full' },
            { text: 'Cuentas & Cartera', included: 'full' },
            { text: 'Asistente Bayt AI', included: 'none' },
        ]
    },
    {
        id: 'empresa',
        name: 'Plan Empresa',
        price: 849000,
        priceStr: '849.000',
        originalPrice: '1.499.000',
        commission: 0.02,
        commissionStr: '2.0%',
        description: 'La experiencia definitiva. Control total e Inteligencia Artificial.',
        buttonText: 'Obtener Full Empresa',
        features: [
            { text: 'Plataforma 100% Completa', included: 'full' },
            { text: 'Asistente Bayt AI (Exclusivo)', included: 'full' },
            { text: 'Staff & Vendedores Ilimitados', included: 'full' },
            { text: 'Mensajería 100% Automatizada', included: 'full' },
            { text: 'Multi-sucursal & Omnicanal', included: 'full' },
            { text: 'Análisis Predictivo de IA', included: 'full' },
            { text: 'Personalización de Marca Blanca', included: 'full' },
            { text: 'Comisión Reducida: 2.0%', included: 'full' },
            { text: 'Soporte Prioritario VIP 24/7', included: 'full' },
        ]
    }
];

export default function PlanSettings() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [currentPlanId, setCurrentPlanId] = useState('basico');
    const [isProcessing, setIsSaving] = useState(false);
    const [isProModalOpen, setIsProModalOpen] = useState(false);
    
    // Calculator State
    const [monthlySales, setMonthlySales] = useState(25000000);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const breakEvenPoint = 56600000; // 849000 / (0.035 - 0.020)

    const handleSwitchPlan = async (planId: string) => {
        if (planId === currentPlanId) return;
        if (planId === 'pro') {
            setIsProModalOpen(true);
            return;
        }
        executeSwitch(planId);
    };

    const executeSwitch = async (planId: string) => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 1500));
        setCurrentPlanId(planId);
        setIsProModalOpen(false);
        showToast(`¡Plan actualizado a ${PLANS.find(p => p.id === planId)?.name}!`, "success");
        setIsSaving(false);
    };

    const formatPriceDisplay = (priceStr: string, isEmpresa: boolean) => {
        if (priceStr === '0') return <span className={isEmpresa ? 'text-[#00f2ff]' : 'text-gray-900'}>$0</span>;
        const parts = priceStr.split('.');
        return (
            <span className={isEmpresa ? 'text-[#00f2ff]' : 'text-gray-900'}>
                ${parts[0]}<span className="text-[0.5em] opacity-60">.{parts[1] || '000'}</span>
            </span>
        );
    };

    const calculateTotalCost = (plan: Plan, sales: number) => {
        return plan.price + (sales * plan.commission);
    };

    const renderProConfirmationModal = () => (
        <AnimatePresence>
            {isProModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-5xl max-h-[85vh] rounded-[3rem] md:rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                        <div className="w-full md:w-[320px] bg-[#001a1a] text-white p-8 md:p-12 flex flex-col justify-between shrink-0">
                            <div className="space-y-8">
                                <div className="h-14 w-14 bg-[#00f2ff] rounded-2xl flex items-center justify-center text-[#001a1a] shadow-[0_0_20px_rgba(0,242,255,0.4)]"><Rocket size={28} /></div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em] border-b border-white/10 pb-3">Potencia Pro</h4>
                                    <p className="text-xs font-medium opacity-70 leading-relaxed italic">"Transforma tu operativa. El Plan Pro desbloquea los centros de mando de alto rendimiento de Bayup."</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <BadgePercent className="text-[#00f2ff]" size={18}/>
                                        <div><p className="text-[8px] font-black uppercase text-white/40">Nueva Comisión</p><p className="text-lg font-black tracking-tight">3.5%</p></div>
                                    </div>
                                    <p className="text-[9px] font-medium text-white/40 leading-tight">Aplicable a ventas futuras tras la activación.</p>
                                </div>
                            </div>
                            <div className="hidden md:block pt-8 border-t border-white/5"><p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em]">Acuerdo Bayup v2.0</p></div>
                        </div>
                        <div className="flex-1 flex flex-col bg-white overflow-hidden">
                            <div className="p-8 md:p-10 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0">
                                <div><h2 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase leading-none">Confirmar Escalado</h2><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2"><ShieldCheck size={14} className="text-[#00f2ff]"/> Auditoría de Desbloqueo</p></div>
                                <button onClick={() => setIsProModalOpen(false)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"><X size={20}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { title: 'Staff: Hasta 5 Usuarios', icon: <Users size={16}/>, desc: 'Habilita tu equipo comercial y operativo.' },
                                        { title: 'Catálogos WA & IA', icon: <ShoppingBag size={16}/>, desc: 'Catálogos automáticos para chat.' },
                                        { title: 'Bodegas & Stock', icon: <Warehouse size={16}/>, desc: 'Gestión multisede avanzada.' },
                                        { title: 'CRM & Mensajes', icon: <MessageSquare size={16}/>, desc: 'Atención al cliente ilimitada.' },
                                        { title: 'Garantías & Nómina', icon: <ShieldCheck size={16}/>, desc: 'Control postventa y personal.' },
                                        { title: 'Marketing Pro', icon: <Target size={16}/>, desc: 'Campañas y segmentación.' }
                                    ].map((m, i) => (
                                        <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all flex items-start gap-4">
                                            <div className="h-9 w-9 bg-white text-[#004d4d] rounded-xl flex items-center justify-center shrink-0 shadow-sm">{m.icon}</div>
                                            <div><p className="text-[11px] font-black text-gray-900 uppercase leading-none">{m.title}</p><p className="text-[10px] font-medium text-gray-400 mt-1.5 leading-tight">{m.desc}</p></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 flex items-start gap-5">
                                    <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><ShieldAlert size={20}/></div>
                                    <div className="space-y-1"><h4 className="text-xs font-black text-amber-900 uppercase">Seguridad de Datos</h4><p className="text-[10px] font-medium text-amber-800 leading-relaxed">Compartirás información de personal para liquidación. Datos protegidos bajo cifrado AES-256.</p></div>
                                </div>
                            </div>
                            <div className="p-8 md:p-10 border-t border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row gap-4 shrink-0">
                                <button onClick={() => executeSwitch('pro')} disabled={isProcessing} className="flex-[2] py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={18} className="text-[#00f2ff]"/>}
                                    Aceptar & Activar Plan Pro
                                </button>
                                <button onClick={() => setIsProModalOpen(false)} className="flex-1 py-5 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-gray-600 hover:border-gray-300 transition-all">Cancelar</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    const renderPlanCard = (plan: Plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isEmpresa = plan.id === 'empresa';
        
        return (
            <motion.div 
                key={plan.id}
                whileHover={{ y: -10 }}
                className={`relative flex flex-col rounded-[4rem] transition-all duration-500 ${
                    isCurrent ? 'scale-105 z-10' : ''
                } ${isEmpresa ? 'p-[2px] overflow-hidden group/conic' : 'p-0'}`}
            >
                {isEmpresa && (
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#00F2FF_0deg,#004d4d_90deg,#9333EA_180deg,#004d4d_270deg,#00F2FF_360deg)] animate-[spin_4s_linear_infinite] opacity-100 group-hover/conic:animate-[spin_2s_linear_infinite]" />
                )}

                <div className={`relative flex-1 flex flex-col p-10 rounded-[calc(4rem-2px)] border transition-all duration-500 h-full ${
                    isCurrent 
                    ? 'bg-white border-[#00f2ff] shadow-[0_0_40px_rgba(0,242,255,0.15)] ring-4 ring-[#00f2ff]/10' 
                    : isEmpresa 
                        ? 'bg-[#001a1a] border-white/10 text-white shadow-2xl group-hover/conic:bg-[#001a1a]/90' 
                        : 'bg-white border-gray-100 shadow-sm hover:shadow-xl'
                }`}>
                    {isCurrent && (
                        <div className="absolute top-6 right-10 flex items-center gap-2 px-4 py-1.5 bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#004d4d]">Plan Actual</span>
                        </div>
                    )}

                    {isEmpresa && !isCurrent && (
                        <div className="absolute top-6 right-10 flex flex-col items-end">
                            <Crown size={24} className="text-[#00f2ff] animate-pulse" />
                            <span className="text-[8px] font-black bg-[#00f2ff] text-[#001a1a] px-2 py-0.5 rounded-full mt-2 uppercase tracking-tighter shadow-lg shadow-[#00f2ff]/20">Bayt AI Enabled</span>
                        </div>
                    )}

                    <div className="mb-10">
                        <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isEmpresa ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                        <p className={`text-xs font-medium mt-2 leading-relaxed opacity-60`}>{plan.description}</p>
                    </div>

                    <div className="mb-10 space-y-2">
                        <div className="space-y-1">
                            {plan.originalPrice && <p className="text-sm font-bold text-rose-500 line-through opacity-60 ml-1">{formatPriceDisplay(plan.originalPrice, isEmpresa)}</p>}
                            <div className="flex items-baseline gap-2">
                                <h4 className="text-5xl font-black tracking-tighter">
                                    {formatPriceDisplay(plan.priceStr, isEmpresa)}
                                </h4>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isEmpresa ? 'text-white/40' : 'text-gray-400'}`}>COP / Mes</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Zap size={14} className="text-[#00f2ff]" />
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isEmpresa ? 'text-[#00f2ff]' : 'text-[#004d4d]'}`}>Comisión: {plan.commissionStr}</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-5 mb-12">
                        {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-4">
                                {feature.included === 'full' ? <CheckCircle2 size={18} className="text-[#00f2ff] shrink-0" /> : feature.included === 'limited' ? <Info size={18} className="text-amber-400 shrink-0" /> : <XCircle size={18} className="opacity-20 shrink-0" />}
                                <div className="flex flex-col">
                                    <span className={`text-xs font-bold ${isEmpresa ? 'text-white/80' : 'text-gray-600'} ${feature.included === 'none' ? 'opacity-30 line-through' : ''}`}>{feature.text}</span>
                                    {feature.hint && <span className="text-[8px] font-medium text-gray-400 uppercase tracking-widest">{feature.hint}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => handleSwitchPlan(plan.id)} disabled={isCurrent || isProcessing} className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : isEmpresa ? 'bg-[#00f2ff] text-[#001a1a] hover:bg-white shadow-xl shadow-[#00f2ff]/20' : 'bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200'}`}>
                        {isProcessing && !isCurrent && !isProModalOpen ? <Loader2 className="animate-spin" size={16} /> : null}
                        {isCurrent ? 'Gestionando Mi Plan' : plan.buttonText}
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-16 animate-in fade-in duration-1000 px-4">
            {renderProConfirmationModal()}
            
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60 italic">Motor de Negocio v2.0</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-[#001A1A]">
                        MI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">PLAN</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">¡Llegó el momento de crecer, mejoremos tu plan! 🚀</p>
                </div>
                <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xl shadow-gray-100/50">
                    <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff]"><Calendar size={22} /></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Próxima Renovación</p><p className="text-sm font-black text-gray-900">01 de Marzo, 2026</p></div>
                </div>
            </div>

            {/* INSIGHT DE AHORRO (INTELIGENCIA DE NEGOCIO) */}
            <div className="px-4">
                <div className="bg-white/40 backdrop-blur-md p-8 rounded-[3rem] border border-white flex flex-col lg:flex-row items-center gap-8 shadow-xl shadow-gray-100/50 max-w-6xl mx-auto">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <Calculator className="text-[#004d4d]" size={20} />
                            <h3 className="text-xl font-black text-[#004d4d] uppercase italic">Analítica de Costos</h3>
                        </div>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed italic">"Desliza para simular tus ventas mensuales y descubre tu plan óptimo."</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ventas Mensuales</p>
                                <p className="text-xl font-black text-gray-900">{formatCurrency(monthlySales)}</p>
                            </div>
                            <input 
                                type="range" min="5000000" max="150000000" step="5000000" 
                                value={monthlySales} onChange={(e) => setMonthlySales(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004d4d]"
                            />
                        </div>
                    </div>
                    <div className="w-full lg:w-[380px] bg-[#001a1a] rounded-[2.5rem] p-8 text-white space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp size={120} /></div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase text-[#00f2ff] tracking-[0.2em]">Resultado Bayup-IQ</h4>
                            {monthlySales >= breakEvenPoint ? (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center gap-2 text-[#00f2ff] font-black italic text-lg uppercase tracking-tighter"><TrendingUp size={20}/> ¡Es hora de subir!</div>
                                    <p className="text-xs font-medium opacity-80 leading-relaxed text-white/80">Ahorras <span className="text-[#00f2ff] font-black">{formatCurrency(calculateTotalCost(PLANS[1], monthlySales) - calculateTotalCost(PLANS[2], monthlySales))}</span> al mes frente al Plan Pro.</p>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-400 font-black italic text-lg uppercase tracking-tighter"><Check size={20}/> Plan Pro Óptimo</div>
                                    <p className="text-xs font-medium opacity-80 leading-relaxed text-white/80">Faltan <span className="text-white font-black">{formatCurrency(breakEvenPoint - monthlySales)}</span> en ventas para que Empresa sea más rentable.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">{PLANS.map(plan => renderPlanCard(plan))}</div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
                <div className="lg:col-span-7 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><CardIcon size={200} /></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-12 w-12 bg-[#004d4d]/5 text-[#004d4d] rounded-2xl flex items-center justify-center shadow-inner"><CreditCard size={24}/></div>
                        <div><h3 className="text-xl font-black text-gray-900 uppercase italic">Método de Suscripción</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Donde se cargan tus servicios premium</p></div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-gray-50 rounded-[3rem] border border-transparent hover:border-[#004d4d]/20 transition-all relative z-10 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-24 bg-gradient-to-br from-gray-800 to-black rounded-xl p-4 flex flex-col justify-between shadow-2xl">
                                <div className="flex justify-between items-start"><div className="h-4 w-6 bg-amber-400/20 rounded-sm"></div><div className="text-[8px] text-white/40 font-bold uppercase">VISA</div></div>
                                <div className="text-[10px] text-white font-mono tracking-widest">**** 4242</div>
                            </div>
                            <div><p className="text-lg font-black text-gray-900 italic uppercase">Visa Platinum</p><p className="text-xs font-bold text-gray-400 mt-1">Expira: 12 / 2026</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="h-12 px-6 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-[#004d4d] hover:border-[#004d4d] transition-all">Cambiar Tarjeta</button>
                            <button className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black shadow-lg"><Plus size={20} className="text-[#00f2ff]"/></button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-5 bg-[#004d4d] p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShieldCheck size={250} /></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3"><Bot size={24} className="text-[#00f2ff]" /><h4 className="text-sm font-black uppercase tracking-widest text-[#00f2ff]">Seguridad de Pago</h4></div>
                        <p className="text-lg font-medium italic opacity-90 leading-relaxed">"Tus datos de pago están cifrados con tecnología AES-256. Bayup no almacena físicamente los números de tus tarjetas."</p>
                        <div className="pt-4 border-t border-white/10 flex items-center gap-4"><ShieldCheck size={32} className="text-[#00f2ff]" /><div><p className="text-[9px] font-black uppercase tracking-widest text-white/60">Certificación PCI-DSS</p><p className="text-[10px] font-black uppercase tracking-widest">Nivel de Seguridad Bancaria</p></div></div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <Activity className={`${className} animate-pulse`} size={size} />;
}
