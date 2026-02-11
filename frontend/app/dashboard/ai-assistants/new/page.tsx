"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Plus, Zap, Workflow, Link2, Sparkles, ArrowLeft, ChevronRight, Terminal, 
  Database, MessageSquare, Rocket, BrainCircuit, X, Target, Search, 
  Code2, Cpu, Fingerprint, Info, ShoppingCart, Users, Activity, ArrowRight, 
  ShieldCheck, MoreHorizontal, FileText, Calendar, Layers, Scale, Crown, 
  AlertCircle, Truck, Package, BadgePercent, Clock, Warehouse, Check, 
  MousePointer2, GripVertical, Hand, Trash2, Edit3, Save, MessageCircle,
  PlusCircle
} from 'lucide-react';
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
    instruction: string;
    position: { x: number, y: number };
}

interface Connection {
    from: string;
    to: string;
}

export default function NewAIAgentPage() {
    const { showToast } = useToast();
    const [isMounted, setIsMounted] = useState(false);
    const [step, setStep] = useState<CreationStep>('selector');
    const [n8nUrl, setN8nUrl] = useState("");
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [nodes, setNodes] = useState<NeuralNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    
    // --- NAVEGACIÓN INFINITA ---
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

    // --- MOTOR DE PANEO GLOBAL ---
    useEffect(() => {
        if (!isPanning || !isMounted) return;
        const handleMouseMove = (e: MouseEvent) => {
            setViewOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
        };
        const handleGlobalMouseUp = () => setIsPanning(false);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isPanning, isMounted]);

    const onMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.neural-node') || (e.target as HTMLElement).closest('.floating-ui')) return;
        setIsPanning(true);
        panStart.current = { x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y };
    };

    const handleSwitchStep = (newStep: CreationStep) => {
        setSelectedNodeId(null);
        setConnectingFrom(null);
        setStep(newStep);
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

        let x = e.clientX - rect.left - viewOffset.x - 140;
        let y = e.clientY - rect.top - viewOffset.y - 60;

        const defaults: any = {
            origin: { label: 'Entrada', icon: <Database size={20}/>, color: 'bg-emerald-500', inst: 'Al detectar evento...' },
            logic: { label: 'Bayt AI', icon: <Bot size={20}/>, color: 'bg-[#00f2ff]', inst: 'Si pasa X, entonces...' },
            action: { label: 'Acción', icon: <Zap size={20}/>, color: 'bg-purple-500', inst: 'Ejecutar tarea...' },
            destination: { label: 'Punto Final', icon: <Warehouse size={20}/>, color: 'bg-amber-500', inst: 'Guardar en...' }
        };

        const newNode: NeuralNode = {
            id: `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type,
            label: defaults[type].label,
            icon: defaults[type].icon,
            desc: 'Programación pendiente',
            color: defaults[type].color,
            instruction: defaults[type].inst,
            position: { x, y }
        };

        setNodes([...nodes, newNode]);
        setSelectedNodeId(newNode.id);
    };

    const handleNodeClick = (nodeId: string) => {
        if (connectingFrom && connectingFrom !== nodeId) {
            if (!connections.some(c => c.from === connectingFrom && c.to === nodeId)) {
                setConnections([...connections, { from: connectingFrom, to: nodeId }]);
                showToast("Flujo vinculado", "success");
            }
            setConnectingFrom(null);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setNodes([]);
        setConnections([]);
        await new Promise(r => setTimeout(r, 2000));
        
        const p = prompt.toLowerCase();
        const generated: NeuralNode[] = [];
        const conns: Connection[] = [];

        if (p.includes('whatsapp') || p.includes('escriba')) {
            generated.push({ id: 'n1', type: 'origin', label: 'WhatsApp', icon: <MessageCircle size={20}/>, desc: 'Saludar automáticamente', color: 'bg-emerald-500', instruction: 'Saluda al cliente.', position: { x: 100, y: 200 } });
        }
        if (p.includes('cotizacion') || p.includes('cotizar')) {
            generated.push({ id: 'n2', type: 'logic', label: 'Analizador', icon: <Scale size={20}/>, desc: 'Identificar pedido', color: 'bg-[#00f2ff]', instruction: 'Analiza producto.', position: { x: 450, y: 200 } });
            generated.push({ id: 'n3', type: 'action', label: 'PDF Creator', icon: <FileText size={20}/>, desc: 'Generar cotización', color: 'bg-purple-500', instruction: 'Crea PDF oficial.', position: { x: 800, y: 100 } });
            generated.push({ id: 'n4', type: 'destination', label: 'CRM Bayup', icon: <Users size={20}/>, desc: 'Registrar flujo', color: 'bg-amber-500', instruction: 'Marca en CRM.', position: { x: 800, y: 350 } });
            conns.push({ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n2', to: 'n4' });
        }

        setNodes(generated);
        setConnections(conns);
        setIsGenerating(false);
    };

    const renderConnections = () => (
        <svg key="connections-layer" className="absolute inset-0 pointer-events-none overflow-visible" style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }}>
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
            </defs>
            {connections.map((conn, i) => {
                const from = nodes.find(n => n.id === conn.from);
                const to = nodes.find(n => n.id === conn.to);
                if (!from || !to) return null;
                const path = `M ${from.position.x + 288} ${from.position.y + 100} C ${from.position.x + 400} ${from.position.y + 100}, ${to.position.x - 100} ${to.position.y + 100}, ${to.position.x} ${to.position.y + 100}`;
                return <path key={`conn-${i}`} d={path} stroke="#00f2ff" strokeWidth="2" fill="none" opacity="0.3" filter="url(#glow)" />;
            })}
        </svg>
    );

    // --- RENDERIZADO DE PANTALLAS ---
    const renderSelector = () => (
        <motion.div key="selector-ui" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 max-w-6xl mx-auto pt-20 px-4">
            <div className="text-center space-y-4">
                <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-[#00f2ff]/20">Bayt AI Deployment</span>
                <h2 className="text-5xl font-black italic text-gray-900 tracking-tighter uppercase leading-tight">Nuevo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00f2ff]">Cerebro</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div whileHover={{ y: -10 }} onClick={() => handleSwitchStep('n8n_link')} className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm cursor-pointer group hover:shadow-2xl transition-all">
                    <div className="h-16 w-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center mb-8"><Link2 size={32}/></div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic">Pegar Link n8n</h3>
                    <p className="text-xs text-gray-400 mt-4 italic leading-relaxed">"Importa un flujo técnico externo desde tu servidor."</p>
                </motion.div>

                <motion.div whileHover={{ y: -10 }} onClick={() => handleSwitchStep('canvas')} className="bg-[#001a1a] p-10 rounded-[4rem] border border-white/10 shadow-2xl cursor-pointer group ring-4 ring-[#00f2ff]/5 scale-105 z-10 transition-all">
                    <div className="h-16 w-16 bg-[#00f2ff] text-[#001a1a] rounded-2xl flex items-center justify-center mb-8 shadow-xl"><BrainCircuit size={32}/></div>
                    <h3 className="text-2xl font-black text-white uppercase italic">Lienzo Neural</h3>
                    <p className="text-xs text-gray-400 mt-4 italic leading-relaxed">"Crea flujos complejos en lenguaje humano. La IA dibuja tu idea."</p>
                </motion.div>

                <motion.div whileHover={{ y: -10 }} onClick={() => handleSwitchStep('templates')} className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm cursor-pointer group hover:shadow-2xl transition-all">
                    <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8"><Rocket size={32}/></div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic">Recetas Élite</h3>
                    <p className="text-xs text-gray-400 mt-4 italic leading-relaxed">"Activa automatizaciones probadas para ventas y stock."</p>
                </motion.div>
            </div>
        </motion.div>
    );

    const renderN8nLink = () => (
        <motion.div key="n8n-ui" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-10 px-4 pt-20">
            <button onClick={() => handleSwitchStep('selector')} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft size={14}/> Volver al Selector</button>
            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-2xl space-y-8 text-center">
                <div className="h-20 w-20 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl"><Link2 size={40}/></div>
                <h3 className="text-3xl font-black text-gray-900 uppercase italic">Vincular n8n</h3>
                <input type="text" value={n8nUrl} onChange={e => setN8nUrl(e.target.value)} placeholder="https://n8n.tu-empresa.com/..." className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-[#004d4d] outline-none font-bold text-sm shadow-inner transition-all" />
                <button className="w-full py-6 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest">Verificar Conexión & Vincular</button>
            </div>
        </motion.div>
    );

    const renderTemplates = () => (
        <motion.div key="templates-ui" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-6xl mx-auto space-y-12 px-4 pt-20">
            <button onClick={() => handleSwitchStep('selector')} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft size={14}/> Volver al Selector</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { title: 'Cotización Inteligente 360', icon: <FileText className="text-blue-500"/> },
                    { title: 'Gestor de Cartera Pro', icon: <BadgePercent className="text-amber-500"/> },
                    { title: 'Agenda G-Cal Sync', icon: <Calendar className="text-emerald-500"/> },
                    { title: 'Recuperación Carrito IA', icon: <ShoppingCart className="text-rose-500"/> }
                ].map((t, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white p-10 rounded-[3rem] border border-gray-100 flex items-center gap-8 cursor-pointer hover:border-purple-200 transition-all">
                        <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center">{t.icon}</div>
                        <div><h4 className="text-xl font-black text-gray-900 italic uppercase">{t.title}</h4><button className="text-[10px] font-black text-purple-600 uppercase mt-2">Instalar Receta</button></div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );

    const renderCanvas = () => (
        <div key="canvas-root" className="fixed inset-0 z-[100] bg-[#000a0a] flex flex-col overflow-hidden select-none">
            {/* Header Neural */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-xl z-[150]">
                <div className="flex items-center gap-6">
                    <button onClick={() => handleSwitchStep('selector')} className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/10"><X size={20}/></button>
                    <div><h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Lienzo Neural Bayt</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest flex items-center gap-2 mt-1"><div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-ping"></div> Terminal Activa</p></div>
                </div>
                <div className="flex-1 max-w-2xl mx-10 relative">
                    <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00f2ff]" size={18} />
                    <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()} placeholder="Ej: Cuando me escriban por WA saluda, si piden cotizar envía PDF..." className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-24 text-sm text-white outline-none focus:border-[#00f2ff]/50 transition-all italic placeholder:text-white/20" />
                    <button onClick={handleGenerate} className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-[#00f2ff] text-[#001a1a] rounded-full font-black text-[9px] uppercase shadow-lg">Generar</button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <Hand size={14} className={isPanning ? 'text-[#00f2ff]' : 'text-white/20'}/>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Sostén fondo para mover</span>
                    </div>
                    <button className="px-8 py-4 bg-[#00f2ff] text-[#001a1a] rounded-2xl font-black text-[9px] uppercase shadow-[0_0_20px_rgba(0,242,255,0.3)]">Publicar</button>
                </div>
            </div>

            {/* Espacio Libre */}
            <div ref={canvasRef} onMouseDown={onMouseDown} onDragOver={e => e.preventDefault()} onDrop={onDrop} className={`flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-fixed cursor-${isPanning ? 'grabbing' : 'grab'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.03)_0%,_transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00f2ff 1px, transparent 1px)', backgroundSize: '50px 50px', backgroundPosition: `${viewOffset.x}px ${viewOffset.y}px` }} />

                {renderConnections()}

                <div style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }} className="absolute inset-0 pointer-events-none">
                    <div className="relative w-full h-full pointer-events-auto">
                        <AnimatePresence mode="popLayout">
                            {nodes.map(node => (
                                <motion.div
                                    key={node.id}
                                    drag dragMomentum={false}
                                    onDrag={(e, info) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, position: { x: n.position.x + info.delta.x, y: n.position.y + info.delta.y } } : n))}
                                    onClick={() => handleNodeClick(node.id)}
                                    initial={{ opacity: 0, scale: 0.8, x: node.position.x, y: node.position.y }}
                                    animate={{ opacity: 1, scale: 1, x: node.position.x, y: node.position.y }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className={`absolute w-72 neural-node cursor-grab active:cursor-grabbing group ${connectingFrom === node.id ? 'ring-2 ring-[#00f2ff] ring-offset-4 ring-offset-black rounded-[3.5rem]' : ''}`}
                                >
                                    <div className={`bg-white/5 backdrop-blur-3xl p-8 rounded-[3.5rem] border ${selectedNodeId === node.id ? 'border-[#00f2ff]' : 'border-white/10'} relative transition-all`}>
                                        <div className={`absolute top-0 left-0 w-full h-1.5 ${node.color} opacity-80`} />
                                        <button onClick={(e) => { e.stopPropagation(); setConnectingFrom(node.id); showToast("Selecciona el destino", "info"); }} className="absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-[#00f2ff] text-[#001a1a] rounded-full z-30 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-110 active:scale-95 transition-all"><Plus size={20} strokeWidth={3} className={connectingFrom === node.id ? 'animate-spin' : ''} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }} className="absolute top-6 right-6 h-8 w-8 bg-white/5 text-white/40 rounded-xl flex items-center justify-center hover:bg-[#00f2ff] hover:text-[#001a1a] opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter(n => n.id !== node.id)); setConnections(connections.filter(c => c.from !== node.id && c.to !== node.id)); setSelectedNodeId(null); }} className="absolute -top-2 -right-2 h-8 w-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20"><X size={14}/></button>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${node.color} text-white shadow-2xl`}>{node.icon}</div>
                                            <GripVertical size={20} className="text-white/10" />
                                        </div>
                                        <h4 className="text-white font-black uppercase italic tracking-tight text-lg leading-none">{node.label}</h4>
                                        <p className="text-[10px] text-white/40 mt-3 font-medium italic line-clamp-2">"{node.desc}"</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-3xl rounded-full border border-white/10 p-5 space-y-8 z-[200]">
                    {[
                        { type: 'origin', icon: <Database size={24}/>, color: 'text-emerald-400' },
                        { type: 'logic', icon: <Bot size={24}/>, color: 'text-[#00f2ff]' },
                        { type: 'action', icon: <Zap size={24}/>, color: 'text-purple-400' },
                        { type: 'destination', icon: <Warehouse size={24}/>, color: 'text-amber-400' }
                    ].map((tool) => (
                        <div key={tool.type} draggable onDragStart={e => onDragStart(e, tool.type as any)} className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-[#00f2ff] hover:text-[#001a1a] transition-all cursor-grab active:cursor-grabbing">
                            <div className={tool.color}>{tool.icon}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Terminal Flotante */}
            <AnimatePresence>
                {selectedNodeId && selectedNode && (
                    <div key="floating-terminal" className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none p-10">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedNodeId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-xl bg-black/80 backdrop-blur-3xl rounded-[4rem] border border-white/10 p-12 shadow-2xl pointer-events-auto relative">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black text-white uppercase italic">Programación Neural</h3>
                                <button onClick={() => setSelectedNodeId(null)} className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10"><X size={24}/></button>
                            </div>
                            <textarea 
                                value={selectedNode.instruction} 
                                onChange={e => {
                                    const val = e.target.value;
                                    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, instruction: val, desc: val.slice(0, 45) + '...' } : n));
                                }}
                                className="w-full h-64 bg-white/5 border border-white/10 rounded-[3rem] p-10 text-base text-white outline-none focus:border-[#00f2ff]/50 transition-all italic resize-none" 
                            />
                            <button onClick={() => setSelectedNodeId(null)} className="mt-10 w-full py-6 bg-[#00f2ff] text-[#001a1a] rounded-[2rem] font-black text-[10px] uppercase shadow-lg">Guardar Neurona</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Overlay IA */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[600] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-8">
                        <div className="h-32 w-32 rounded-[3.5rem] border-4 border-[#00f2ff]/10 border-t-[#00f2ff] animate-spin"></div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-widest text-center">Inyectando Lógica Neural</h3>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    if (!isMounted) return <div className="fixed inset-0 bg-[#000a0a]" />;

    return (
        <div className="max-w-[1600px] mx-auto pb-32">
            <AnimatePresence mode="wait" initial={false}>
                {step === 'selector' && renderSelector()}
                {step === 'n8n_link' && renderN8nLink()}
                {step === 'templates' && renderTemplates()}
                {step === 'canvas' && renderCanvas()}
            </AnimatePresence>
        </div>
    );
}
