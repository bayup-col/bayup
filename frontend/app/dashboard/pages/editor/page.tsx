"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Plus, 
  Save, 
  Eye, 
  Smartphone, 
  Monitor, 
  Tablet,
  X,
  Trash2,
  Undo2,
  Redo2,
  Layout,
  Paintbrush2
} from 'lucide-react';
import { PageRenderer, PageComponent, ComponentType } from '@/components/PageRenderer';
import { useToast } from "@/context/toast-context";
import Link from 'next/link';

export default function PageEditor() {
    const { showToast } = useToast();
    const [isMounted, setIsMounted] = useState(false);
    
    const [components, setComponents] = useState<PageComponent[]>([
        {
            id: 'sec_1',
            type: 'section',
            props: {},
            styles: { padding: '120px 20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' },
            children: [
                {
                    id: 'txt_1',
                    type: 'text',
                    props: { text: 'STUDIO DE DISEÑO BAYUP' },
                    styles: { fontSize: '64px', fontWeight: '900', textAlign: 'center', color: '#000000', fontStyle: 'italic' },
                },
                {
                    id: 'btn_1',
                    type: 'button',
                    props: { label: 'Explorar Tienda' },
                    styles: { backgroundColor: '#004d4d', color: '#ffffff', padding: '16px 32px', borderRadius: '40px' },
                }
            ]
        }
    ]);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const updateComponent = (id: string, updates: Partial<PageComponent>) => {
        const deepUpdate = (list: PageComponent[]): PageComponent[] => {
            return list.map(c => {
                if (c.id === id) return { ...c, ...updates };
                if (c.children) return { ...c, children: deepUpdate(c.children) };
                return c;
            });
        };
        setComponents(deepUpdate(components));
    };

    const addComponent = (type: ComponentType) => {
        const newId = `${type}_${Date.now()}`;
        const newComp: PageComponent = {
            id: newId,
            type,
            props: type === 'text' ? { text: 'Nuevo Texto' } : { label: 'Click aquí' },
            styles: type === 'text' ? { fontSize: '24px', color: '#000000' } : { backgroundColor: '#00f2ff', color: '#001a1a', padding: '12px 24px' },
            children: type === 'section' ? [] : undefined
        };
        setComponents([...components, newComp]);
        setSelectedId(newId);
        showToast(`Elemento añadido`, "success");
    };

    const selectedComp = useMemo(() => {
        const findDeep = (list: PageComponent[]): PageComponent | undefined => {
            for (const c of list) {
                if (c.id === selectedId) return c;
                if (c.children) {
                    const found = findDeep(c.children);
                    if (found) return found;
                }
            }
        };
        return findDeep(components);
    }, [components, selectedId]);

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 bg-[#f8f9fa] flex overflow-hidden">
            {/* HERRAMIENTAS IZQUIERDA */}
            <div className="w-80 bg-white border-r border-gray-100 flex flex-col z-[100] shadow-2xl">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white font-black italic">B</div>
                        <h2 className="text-sm font-black uppercase tracking-widest italic">Studio</h2>
                    </div>
                    <Link href="/dashboard/pages"><X size={20} className="text-gray-400 hover:text-black"/></Link>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Librería</p>
                    <div className="grid grid-cols-2 gap-4">
                        {[{ type: 'text', icon: <Type size={20}/>, label: 'Texto' }, { type: 'button', icon: <Square size={20}/>, label: 'Botón' }].map((item) => (
                            <button key={item.type} onClick={() => addComponent(item.type as ComponentType)} className="p-6 bg-gray-50 rounded-3xl flex flex-col items-center gap-3 hover:bg-[#00f2ff]/10 transition-all border border-transparent hover:border-[#00f2ff]/20">
                                <div className="text-gray-400">{item.icon}</div>
                                <span className="text-[9px] font-black uppercase text-gray-400">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CANVAS CENTRAL */}
            <div className="flex-1 flex flex-col relative bg-[#edeff2]">
                <div className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 z-[90]">
                    <div className="flex items-center gap-4 bg-gray-100 p-1.5 rounded-2xl">
                        {['desktop', 'tablet', 'mobile'].map((m) => (
                            <button key={m} onClick={() => setViewMode(m as any)} className={`p-3 rounded-xl transition-all ${viewMode === m ? 'bg-white text-[#004d4d] shadow-md' : 'text-gray-400'}`}>
                                {m === 'desktop' ? <Monitor size={18}/> : m === 'tablet' ? <Tablet size={18}/> : <Smartphone size={18}/>}
                            </button>
                        ))}
                    </div>
                    <button className="px-10 py-4 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl flex items-center gap-3"><Save size={16} className="text-[#00f2ff]"/> Guardar</button>
                </div>
                <div className="flex-1 overflow-y-auto p-20 flex justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                    <motion.div animate={{ width: viewMode === 'mobile' ? 375 : viewMode === 'tablet' ? 768 : '100%', height: 'fit-content' }} className="bg-white shadow-2xl rounded-[2rem] overflow-hidden min-h-full border border-white/20">
                        <PageRenderer components={components} isEditor={true} selectedId={selectedId} onComponentClick={setSelectedId} />
                    </motion.div>
                </div>
            </div>

            {/* PROPIEDADES DERECHA */}
            <AnimatePresence>
                {selectedId && selectedComp && (
                    <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="w-96 bg-white border-l border-gray-100 flex flex-col z-[100] shadow-2xl">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between text-[#004d4d]">
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Propiedades</h3>
                            <button onClick={() => setSelectedId(null)} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-rose-500 shadow-sm"><X size={18}/></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contenido</p>
                            {selectedComp.type === 'text' && <textarea value={selectedComp.props.text} onChange={(e) => updateComponent(selectedComp.id, { props: { ...selectedComp.props, text: e.target.value } })} className="w-full h-40 p-8 bg-gray-50 rounded-[2rem] text-sm font-bold border-2 border-transparent focus:border-[#00f2ff]/30 focus:bg-white outline-none transition-all italic" />}
                            {selectedComp.type === 'button' && <input type="text" value={selectedComp.props.label} onChange={(e) => updateComponent(selectedComp.id, { props: { ...selectedComp.props, label: e.target.value } })} className="w-full p-6 bg-gray-50 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-[#00f2ff]/30 focus:bg-white outline-none" />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
