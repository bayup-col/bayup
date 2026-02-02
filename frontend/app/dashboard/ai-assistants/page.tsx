"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Plus, 
  Zap, 
  Activity, 
  ShieldCheck, 
  MessageSquare, 
  Settings2, 
  Trash2, 
  Play, 
  Pause, 
  Cpu, 
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  Target,
  BrainCircuit,
  Workflow,
  Link2,
  ChevronRight,
  Database,
  Terminal,
  ShoppingCart,
  Warehouse,
  BadgePercent,
  Rocket,
  Crown,
  Star,
  Clock,
  LayoutGrid,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";
import { assistantService } from '@/lib/api';
import Link from 'next/link';

// --- INTERFACES ---
interface FlowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    setupTime: string;
    integrations: string[];
    isPremium: boolean;
    rating: number;
    executions: string;
    revenueImpact?: string;
    icon: any;
    color: string;
}

// --- DATA: MARKETPLACE TEMPLATES ---
const TEMPLATES: FlowTemplate[] = [
    { 
        id: 't1', name: 'Confirmación de Pedido Smart', description: 'Detecta venta → Envía confirmación WhatsApp → Descuenta stock.', 
        category: 'Ventas & Pedidos', setupTime: '2 min', integrations: ['WA', 'Store'], isPremium: false, rating: 4.9, 
        executions: '12.4k', revenueImpact: '$12.5M', icon: <ShoppingCart />, color: 'bg-blue-500' 
    },
    { 
        id: 't2', name: 'Recuperador de Carrito IA', description: 'Bayt analiza el abandono y decide qué oferta enviar para cerrar la venta.', 
        category: 'IA & Automatización', setupTime: '5 min', integrations: ['WA', 'AI', 'Store'], isPremium: true, rating: 5.0, 
        executions: '8.2k', revenueImpact: '$45.8M', icon: <Bot />, color: 'bg-[#00f2ff]' 
    },
    { 
        id: 't3', name: 'Alerta de Stock Crítico', description: 'Notifica a compras cuando un producto estrella baja del 10% de stock.', 
        category: 'Inventario', setupTime: '1 min', integrations: ['Store', 'Mail'], isPremium: false, rating: 4.7, 
        executions: '3.1k', icon: <Warehouse />, color: 'bg-amber-500' 
    },
    { 
        id: 't4', name: 'Fidelización Post-Venta', description: 'Envía un cupón de agradecimiento 7 días después de la entrega exitosa.', 
        category: 'Marketing', setupTime: '3 min', integrations: ['WA', 'Promo'], isPremium: true, rating: 4.8, 
        executions: '5.6k', revenueImpact: '$8.2M', icon: <Crown />, color: 'bg-purple-600' 
    }
];

const CATEGORIES = [
    { name: 'Todos', icon: <LayoutGrid size={14}/> },
    { name: 'Mensajería', icon: <MessageSquare size={14}/> },
    { name: 'Ventas', icon: <ShoppingCart size={14}/> },
    { name: 'IA', icon: <Bot size={14}/> },
    { name: 'Inventario', icon: <Warehouse size={14}/> }
];

export default function FlowMarketPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeCategory, setActiveCategory] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Flujos Instalados', value: '12', sub: 'Operando ahora', icon: <Zap size={20}/>, color: 'text-[#00f2ff]' },
                { label: 'Acciones Realizadas', value: '24.5k', sub: 'Este mes', icon: <Activity size={20}/>, color: 'text-emerald-500' },
                { label: 'Tiempo Ahorrado', value: '180h', sub: 'Productividad neta', icon: <Clock size={20}/>, color: 'text-blue-500' },
                { label: 'Impacto en Caja', value: '$58.2M', sub: 'Dinero recuperado', icon: <Target size={20}/>, color: 'text-purple-500' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg">Live</span>
                    </div>
                    <div className="mt-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderFlowCard = (flow: FlowTemplate) => (
        <motion.div 
            key={flow.id}
            whileHover={{ y: -10 }}
            className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all relative overflow-hidden"
        >
            {flow.isPremium && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00f2ff] to-[#004d4d]"></div>
            )}
            
            <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                    <div className={`h-16 w-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-500 ${flow.color} text-white`}>
                        {flow.icon}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {flow.isPremium && (
                            <span className="px-3 py-1 bg-[#00f2ff]/10 text-[#004d4d] rounded-full text-[8px] font-black uppercase tracking-widest border border-[#00f2ff]/20 flex items-center gap-1">
                                <Sparkles size={10} /> Bayt Choice
                            </span>
                        )}
                        <div className="flex items-center gap-1 text-amber-400">
                            <Star size={10} fill="currentColor"/>
                            <span className="text-[10px] font-black">{flow.rating}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase leading-tight">{flow.name}</h3>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{flow.category} · {flow.setupTime} setup</p>
                    <p className="text-sm font-medium text-gray-500 mt-4 leading-relaxed italic">"{flow.description}"</p>
                </div>

                {flow.revenueImpact && (
                    <div className="p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Impacto Real</p>
                        <p className="text-lg font-black text-emerald-700 italic">+{flow.revenueImpact}</p>
                    </div>
                )}
            </div>

            <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                    {flow.integrations.map((ing, i) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-gray-400 uppercase">{ing}</div>
                    ))}
                </div>
                <Link href={`/dashboard/ai-assistants/new?template=${flow.id}`}>
                    <button className="h-12 px-8 bg-gray-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3">
                        Instalar Flujo <ChevronRight size={14} className="text-[#00f2ff]"/>
                    </button>
                </Link>
            </div>
        </motion.div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000">
            
            {/* Header Maestro */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Bayup Automation Hub</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Marketplace de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Flujos</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Instala estrategias operativas en segundos. Sin código, sin nodos, <span className="font-bold text-[#001A1A]">solo resultados</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ai-assistants/new">
                        <button className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                            <BrainCircuit size={18} className="text-[#00f2ff]" />
                            Crear Flujo con IA
                        </button>
                    </Link>
                </div>
            </div>

            {renderKPIs()}

            {/* BARRA DE BÚSQUEDA & CATEGORÍAS */}
            <div className="px-4 space-y-8">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                    <div className="relative flex-1 w-full bg-white/60 backdrop-blur-md p-2 rounded-full border border-white/60 shadow-sm flex items-center px-6">
                        <Search className="text-slate-400 mr-4" size={20} />
                        <input 
                            type="text" 
                            placeholder="¿Qué quieres automatizar hoy? (ej: Ventas, Cartera, Stock...)" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-4 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300" 
                        />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                        {CATEGORIES.map((cat) => (
                            <button 
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`h-14 px-8 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${
                                    activeCategory === cat.name 
                                    ? 'bg-[#004d4d] text-white shadow-xl border-transparent scale-105' 
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-[#004d4d]'
                                }`}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <AnimatePresence>
                        {TEMPLATES
                            .filter(t => activeCategory === 'Todos' || t.category.includes(activeCategory))
                            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(flow => renderFlowCard(flow))
                        }
                    </AnimatePresence>
                </div>
            </div>

            {/* BANNER BAYT: RECOMENDADOR PROACTIVO */}
            <div className="px-4 pt-12">
                <div className="bg-[#001a1a] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5 group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000"><Star size={300} /></div>
                    <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                        <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse shadow-3xl"><Bot size={64} className="text-[#00f2ff]" /></div>
                        <div className="flex-1 space-y-6">
                            <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-[#00f2ff]/20">Bayt Smart Recommendation</span>
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Maximiza tu Eficiencia hoy</h3>
                            <p className="text-gray-300 text-lg font-medium leading-relaxed italic max-w-4xl">
                                "He detectado que tienes <span className="text-[#00f2ff] font-black underline decoration-2 underline-offset-8">128 carritos abandonados</span> esta semana. Recomiendo instalar el flujo **'Recuperador de Carrito IA'** para rescatar aprox. **$24.5M** en ventas potenciales."
                            </p>
                            <button className="px-10 py-5 bg-[#00f2ff] text-[#001a1a] rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all">
                                Instalar Recomendación <ArrowRight size={16}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
