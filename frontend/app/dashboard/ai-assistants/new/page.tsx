"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Plus, Zap, Workflow, Link2, Sparkles, ArrowLeft, ChevronRight, Terminal, 
  Database, MessageSquare, Rocket, BrainCircuit, Settings2, X, Target, Search, 
  Code2, Cpu, Fingerprint, Info, ShoppingCart, Users, Activity, ArrowRight, 
  ShieldCheck, MoreHorizontal, FileText, Calendar, Layers, Scale, Crown, 
  AlertCircle, Truck, Package, BadgePercent, Clock, Warehouse, Check, 
  MousePointer2, GripVertical, Hand
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/context/toast-context";

// --- INTERFACES ---
type CreationStep = 'selector' | 'n8n_link' | 'templates' | 'canvas';

interface NeuralNode {
    id: string;
    type: 'origin' | 'logic' | 'action' | 'destination';
    label: string;
    icon: any;
    desc: string;
    color: string;
    badge?: string;
    position: { x: number, y: number };
}

export default function NewAIAgentPage() {
    const { showToast } = useToast();
    const [step, setStep] = useState<CreationStep>('selector');
    const [n8nUrl, setN8nUrl] = useState("");
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [nodes, setNodes] = useState<NeuralNode[]>([]);
    
    // --- NAVEGACIÓN INFINITA ---
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleSwitchStep = (newStep: CreationStep) => setStep(newStep);

    // --- MOTOR DE PANEO GLOBAL ---
    useEffect(() => {
        if (!isPanning) return;

        const handleMouseMove = (e: MouseEvent) => {
            setViewOffset({
                x: e.clientX - panStart.current.x,
                y: e.clientY - panStart.current.y
            });
        };

        const handleMouseUp = () => setIsPanning(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPanning]);

    const onMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.neural-node')) return;
        setIsPanning(true);
        panStart.current = { x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y };
    };

    // --- DRAG & DROP ---
    const onDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('nodeType', type);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('nodeType') as NeuralNode['type'];
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left - viewOffset.x - 140;
        const y = e.clientY - rect.top - viewOffset.y - 60;

        const defaults: any = {
            origin: { label: 'Nueva Entrada', icon: <Database size={20}/>, color: 'bg-blue-500' },
            logic: { label: 'Cerebro Bayt', icon: <Bot size={20}/>, color: 'bg-[#00f2ff]' },
            action: { label: 'Nueva Acción', icon: <Zap size={20}/>, color: 'bg-purple-500' },
            destination: { label: 'Punto Final', icon: <Warehouse size={20}/>, color: 'bg-amber-500' }
        };

        setNodes([...nodes, {
            id: `node_${Date.now()}`,
            type,
            label: defaults[type].label,
            icon: defaults[type].icon,
            desc: 'Configura tu lógica de negocio',
            color: defaults[type].color,
            position: { x, y }
        }]);
        showToast(`Bloque añadido al espacio`, "success");
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setNodes([]);
        await new Promise(r => setTimeout(r, 2000));
        setNodes([
            { id: '1', type: 'origin', label: 'Trigger Smart', icon: <Database size={20}/>, desc: 'Evento detectado', color: 'bg-blue-500', position: { x: 100, y: 200 } },
            { id: '2', type: 'logic', label: 'Bayt AI Core', icon: <Bot size={20}/>, desc: 'Análisis neural', color: 'bg-[#00f2ff]', position: { x: 450, y: 200 } },
            { id: '3', type: 'action', label: 'Acción Ejecutiva', icon: <Zap size={20}/>, desc: 'Tarea completada', color: 'bg-purple-500', position: { x: 800, y: 200 } }
        ]);
        setIsGenerating(false);
        showToast("Flujo orquestado con éxito", "success");
    };

    // --- RENDERIZADO DE PANTALLAS ---
    const renderSelector = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 max-w-6xl mx-auto px-4">
            <div className="text-center space-y-4">
                <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-[#00f2ff]/20">AI Terminal</span>
                <h2 className="text-5xl font-black italic text-gray-900 tracking-tighter uppercase leading-tight">Nuevo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00f2ff]">Cerebro</span></h2>
                <p className="text-gray-400 font-medium max-w-2xl mx-auto italic">Define la arquitectura operativa de tu empresa con inteligencia autónoma.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div whileHover={{ y: -10 }} onClick={() => setStep('n8n_link')} className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm cursor-pointer group hover:shadow-2xl transition-all">
                    <div className="h-16 w-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform"><Link2 size={32}/></div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic">Pegar Link n8n</h3>
                    <p className="text-xs text-gray-400 mt-4 italic leading-relaxed">"Importa un flujo técnico externo desde tu servidor propio."</p>
                </motion.div>

                <motion.div whileHover={{ y: -10 }} onClick={() => setStep('canvas')} className="bg-[#001a1a] p-10 rounded-[4rem] border border-white/10 shadow-2xl cursor-pointer group ring-4 ring-[#00f2ff]/5 scale-105 z-10 transition-all">
                    <div className="h-16 w-16 bg-[#00f2ff] text-[#001a1a] rounded-2xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform"><BrainCircuit size={32}/></div>
                    <h3 className="text-2xl font-black text-white uppercase italic">Lienzo Neural</h3>
                    <p className="text-xs text-gray-400 mt-4 italic leading-relaxed">"Crea flujos complejos en lenguaje humano. La IA dibuja tu idea."</p>
                </motion.div>

                <motion.div whileHover={{ y: -10 }} onClick={() => setStep('templates')} className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm cursor-pointer group hover:shadow-2xl transition-all">
                    <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform"><Rocket size={32}/></div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic">Recetas Élite</h3>
                    <p className="text-xs text-gray-400 mt-4 italic leading-relaxed">"Activa automatizaciones probadas para ventas y stock."</p>
                </motion.div>
            </div>
        </motion.div>
    );

    const renderN8nLink = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-10 px-4">
            <button onClick={() => setStep('selector')} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft size={14}/> Volver al Selector</button>
            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-2xl space-y-8 text-center">
                <div className="h-20 w-20 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl"><Link2 size={40}/></div>
                <div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase italic">Vincular n8n</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Sincronización de Webhook Pro</p>
                </div>
                <input type="text" value={n8nUrl} onChange={e => setN8nUrl(e.target.value)} placeholder="https://n8n.tu-empresa.com/..." className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-[#004d4d] outline-none font-bold text-sm shadow-inner transition-all" />
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4 text-left">
                    <Info className="text-blue-600 shrink-0" size={20}/>
                    <p className="text-[10px] font-medium text-blue-800 leading-relaxed italic">"Bayt utilizará esta URL para enviar y recibir datos en tiempo real. Asegúrate de que el webhook sea tipo POST."</p>
                </div>
                <button className="w-full py-6 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">Verificar Conexión & Vincular</button>
            </div>
        </motion.div>
    );

    const renderTemplates = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-6xl mx-auto space-y-12 px-4">
            <button onClick={() => setStep('selector')} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft size={14}/> Volver al Selector</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { title: 'Cotización Inteligente 360', desc: 'Detecta pedido de precios → Genera PDF → Envía al cliente.', icon: <FileText className="text-blue-500"/> },
                    { title: 'Gestor de Cartera Pro', desc: 'Envía recordatorios persuasivos según historial de pagos.', icon: <BadgePercent className="text-amber-500"/> },
                    { title: 'Agenda G-Cal Sync', desc: 'Gestiona reservas vía chat y sincroniza calendarios.', icon: <Calendar className="text-emerald-500"/> },
                    { title: 'Recuperación Carrito IA', desc: 'Analiza abandono y decide qué oferta enviar.', icon: <ShoppingCart className="text-rose-500"/> }
                ].map((t, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white p-10 rounded-[3rem] border border-gray-100 flex items-start gap-8 cursor-pointer hover:border-purple-200 shadow-sm transition-all group">
                        <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-purple-50 transition-colors">{t.icon}</div>
                        <div>
                            <h4 className="text-xl font-black text-gray-900 italic uppercase">{t.title}</h4>
                            <p className="text-xs text-gray-400 mt-2 italic leading-relaxed">"{t.desc}"</p>
                            <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest mt-4 flex items-center gap-2">Instalar Receta <ArrowRight size={12}/></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );

    const renderCanvas = () => (
        <div className="fixed inset-0 z-[100] bg-[#000d0d] flex flex-col overflow-hidden select-none">
            {/* Header Pro */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0 z-[150]">
                <div className="flex items-center gap-6">
                    <button onClick={() => setStep('selector')} className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-all"><X size={20}/></button>
                    <div><h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Lienzo Neural Bayt</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest flex items-center gap-2 mt-2"><div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-ping"></div> Terminal Libre Activa</p></div>
                </div>
                <div className="flex-1 max-w-2xl mx-10 relative">
                    <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00f2ff]" size={18} />
                    <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()} placeholder="Define tu estrategia operativa aquí..." className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-12 text-sm text-white outline-none focus:border-[#00f2ff]/50 transition-all placeholder:text-white/20 italic" />
                    <button onClick={handleGenerate} className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#00f2ff] text-[#001a1a] rounded-full font-black text-[9px] uppercase tracking-widest shadow-[0_0_20px_#00f2ff]/30">Generar</button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <Hand size={14} className={isPanning ? 'text-[#00f2ff]' : 'text-white/20'}/>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Sostén fondo para mover</span>
                    </div>
                    <button className="px-8 py-4 bg-[#00f2ff] text-[#001a1a] rounded-2xl font-black text-[9px] uppercase shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:scale-105 transition-all">Publicar</button>
                </div>
            </div>

            {/* ESPACIO INFINITO CON DISEÑO PREMIUM */}
            <div 
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onDragOver={e => e.preventDefault()}
                onDrop={onDrop}
                className={`flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-fixed overflow-hidden cursor-${isPanning ? 'grabbing' : 'grab'}`}
            >
                {/* CAPAS DE FONDO */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.03)_0%,_transparent_70%)]"></div>
                <div 
                    id="canvas-grid"
                    className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                    style={{ 
                        backgroundImage: 'radial-gradient(#00f2ff 1px, transparent 1px)', 
                        backgroundSize: '50px 50px',
                        backgroundPosition: `${viewOffset.x}px ${viewOffset.y}px` 
                    }}
                ></div>

                {/* ESCENARIO DE NODOS */}
                <div 
                    style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }}
                    className="absolute inset-0 pointer-events-none"
                >
                    <div className="relative w-full h-full pointer-events-auto">
                        <AnimatePresence>
                            {nodes.length === 0 && !isGenerating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 text-center space-y-6">
                                    <div className="h-24 w-24 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-[#00f2ff]/20 flex items-center justify-center mx-auto"><MousePointer2 size={40} className="text-white" /></div>
                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-[0.2em]">Tablero de Orquestación</h3>
                                    <p className="text-white font-bold uppercase tracking-[0.4em] text-xs">Arrastra bloques o usa el prompt para comenzar</p>
                                </div>
                            )}

                            {nodes.map(node => (
                                <motion.div
                                    key={node.id}
                                    drag
                                    dragMomentum={false}
                                    initial={{ opacity: 0, scale: 0.8, x: node.position.x, y: node.position.y }}
                                    animate={{ opacity: 1, scale: 1, x: node.position.x, y: node.position.y }}
                                    className="absolute w-72 neural-node cursor-grab active:cursor-grabbing"
                                >
                                    <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-3xl relative group hover:border-[#00f2ff]/40 transition-all">
                                        <div className={`absolute top-0 left-0 w-full h-1.5 ${node.color} opacity-80 shadow-[0_0_15px_rgba(0,242,255,0.2)]`}></div>
                                        <button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} className="absolute -top-2 -right-2 h-8 w-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 hover:scale-110"><X size={14}/></button>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${node.color} text-white shadow-2xl border-4 border-white/5`}>{node.icon}</div>
                                            <GripVertical size={20} className="text-white/10 group-hover:text-[#00f2ff]/40 transition-colors" />
                                        </div>
                                        <h4 className="text-white font-black uppercase italic tracking-tight text-lg leading-none">{node.label}</h4>
                                        <p className="text-[10px] text-white/40 mt-3 font-medium italic leading-relaxed">"{node.desc}"</p>
                                        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">{node.type}</span>
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]"></div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* SIDEBAR TÁCTICO */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-3xl rounded-full border border-white/10 p-5 space-y-8 shadow-3xl z-[200]">
                    {[
                        { type: 'origin', icon: <Database size={24}/>, label: 'Origen', color: 'text-blue-400' },
                        { type: 'logic', icon: <Bot size={24}/>, label: 'Lógica', color: 'text-[#00f2ff]' },
                        { type: 'action', icon: <Zap size={24}/>, label: 'Acción', color: 'text-purple-400' },
                        { type: 'destination', icon: <Warehouse size={24}/>, label: 'Destino', color: 'text-amber-400' }
                    ].map((tool, i) => (
                        <div key={i} draggable onDragStart={e => onDragStart(e, tool.type)} className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-[#00f2ff] hover:text-[#001a1a] transition-all cursor-grab active:cursor-grabbing group relative">
                            <div className={tool.color}>{tool.icon}</div>
                            <div className="absolute left-20 px-4 py-2 bg-gray-900 text-white text-[9px] font-black uppercase rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all border border-white/10 shadow-2xl">{tool.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* OVERLAY DE CARGA NEURAL */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[300] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-8">
                        <div className="relative">
                            <div className="h-32 w-32 rounded-[3.5rem] border-4 border-[#00f2ff]/10 border-t-[#00f2ff] animate-spin"></div>
                            <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00f2ff] animate-pulse" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-widest text-center">Inyectando Lógica Neural</h3>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-32 pt-10 px-4">
            <AnimatePresence mode="wait">
                {step === 'selector' && renderSelector()}
                {step === 'n8n_link' && renderN8nLink()}
                {step === 'templates' && renderTemplates()}
                {step === 'canvas' && renderCanvas()}
            </AnimatePresence>
        </div>
    );
}