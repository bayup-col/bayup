"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '../../../../context/auth-context';

interface QuotationTemplate {
    id: string;
    name: string;
    description: string;
    last_used: string;
    preview_color: string;
}

interface QuoteItem {
    id: string;
    name: string;
    price: number;
    qty: number;
}

const MOCK_TEMPLATES: QuotationTemplate[] = [
    { id: 't1', name: 'Formato Corporativo', description: 'Diseño sobrio para empresas y B2B.', last_used: 'Hoy', preview_color: 'bg-slate-900' },
    { id: 't2', name: 'Moderno / Retail', description: 'Visual y enfocado en fotografía de producto.', last_used: 'Ayer', preview_color: 'bg-purple-600' },
    { id: 't3', name: 'Mínimalista', description: 'Solo información esencial, ultra limpio.', last_used: 'Hace 3 días', preview_color: 'bg-gray-100' },
];

export default function CotizacionesPage() {
    const { token } = useAuth();
    
    // Estados de UI
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate | null>(null);
    
    // Formulario de Generación
    const [clientInfo, setClientInfo] = useState({ name: '', company: '', email: '', phone: '', address: '', validity: '15 días' });
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const handleOpenGenerator = (template: QuotationTemplate) => {
        setSelectedTemplate(template);
        setIsGeneratorOpen(true);
    };

    const handleAddProduct = () => {
        const newItem = { id: Math.random().toString(), name: 'Producto de Inventario', price: 150000, qty: 1 };
        setQuoteItems([...quoteItems, newItem]);
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-16">
            {/* 1. Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Cotizaciones</h1>
                    <p className="text-gray-500 mt-2 font-medium">Crea propuestas profesionales y convierte prospectos en clientes.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all"
                >
                    + Nuevo Formato (IA)
                </button>
            </div>

            {/* 2. Biblioteca de Formatos */}
            <div className="space-y-8">
                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    Mis Plantillas
                    <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{MOCK_TEMPLATES.length} Disponibles</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {MOCK_TEMPLATES.map((t) => (
                        <div key={t.id} onClick={() => handleOpenGenerator(t)} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                            <div className={`${t.preview_color} h-2 w-12 rounded-full mb-6`}></div>
                            <h3 className="text-lg font-black text-gray-900 group-hover:text-purple-600 transition-colors">{t.name}</h3>
                            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{t.description}</p>
                            <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <span>Usado: {t.last_used}</span>
                                <span className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">Usar →</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Historial de Cotizaciones */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Historial de Propuestas</h2>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500">Filtrar</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimiento</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {[
                                { id: 'COT-992', client: 'Constructora S.A.', end: '15 Feb', total: 4500000, status: 'Enviada' },
                                { id: 'COT-991', client: 'Inversiones Global', end: '10 Feb', total: 1200000, status: 'Aceptada' },
                            ].map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                    <td className="px-8 py-6 font-black text-sm text-gray-900">#{c.id}</td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-700">{c.client}</td>
                                    <td className="px-8 py-6 text-xs text-gray-400">{c.end} 2024</td>
                                    <td className="px-8 py-6 font-black text-sm text-gray-900">{formatCurrency(c.total)}</td>
                                    <td className="px-8 py-6 text-right"><span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{c.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: CARGAR FORMATO PDF (IA) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Escáner de Formatos IA</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Copia tu estilo actual automáticamente</p></div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl">✕</button>
                        </div>
                        <div className="p-10 text-center space-y-8">
                            <label className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-all group">
                                <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📄</div>
                                <p className="text-sm font-black text-gray-900 mt-4">Sube tu PDF actual</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Nuestra IA imitará tu diseño profesional</p>
                            </label>
                            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 text-left flex items-start gap-4">
                                <span className="text-xl">💡</span>
                                <p className="text-xs text-amber-900 leading-relaxed font-medium">Sube el formato que usas actualmente en Word o PDF. El sistema extraerá tus logos, tablas y condiciones legales para crear una nueva plantilla Pro.</p>
                            </div>
                        </div>
                        <div className="p-10 pt-0"><button onClick={() => setIsCreateModalOpen(false)} className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Iniciar Procesamiento IA</button></div>
                    </div>
                </div>
            )}

            {/* MODAL: GENERADOR DE COTIZACIÓN */}
            {isGeneratorOpen && selectedTemplate && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Nueva Propuesta: {selectedTemplate.name}</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configuración comercial personalizada</p></div>
                            <button onClick={() => setIsGeneratorOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl">✕</button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                            {/* Formulario */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar border-r border-gray-50">
                                <section className="space-y-6">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Destinatario de la Propuesta</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" placeholder="Nombre del Cliente / Empresa" className="p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold shadow-inner" />
                                        <input type="email" placeholder="Correo Electrónico" className="p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold shadow-inner" />
                                        <input type="text" placeholder="Ciudad y Dirección" className="p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold shadow-inner" />
                                        <select className="p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold text-gray-700 shadow-inner">
                                            <option>Validez: 15 días</option><option>Validez: 30 días</option><option>Validez: 60 días</option>
                                        </select>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Productos y Servicios</h3>
                                    <div className="flex gap-3">
                                        <input type="text" placeholder="Buscar en inventario..." className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold shadow-inner" />
                                        <button onClick={handleAddProduct} className="px-8 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-100">Añadir</button>
                                    </div>
                                    <div className="space-y-3">
                                        {quoteItems.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm group animate-in slide-in-from-left duration-300">
                                                <div className="flex items-center gap-4"><div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">📦</div><div><p className="text-sm font-black text-gray-900">{item.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Unitario: {formatCurrency(item.price)}</p></div></div>
                                                <div className="flex items-center gap-6"><div className="flex items-center bg-gray-50 rounded-xl p-1 gap-3"><button className="h-6 w-6 flex items-center justify-center text-gray-400 font-black">-</button><span className="text-xs font-black w-4 text-center">{item.qty}</span><button className="h-6 w-6 flex items-center justify-center text-gray-400 font-black">+</button></div><p className="text-sm font-black text-gray-900 w-24 text-right">{formatCurrency(item.price * item.qty)}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Resumen & Exportación */}
                            <div className="w-full lg:w-96 bg-gray-50 p-10 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Resumen Comercial</h3>
                                    <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase">Subtotal</span><span className="text-sm font-black text-gray-900">{formatCurrency(quoteItems.reduce((acc, it) => acc + (it.price * it.qty), 0))}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase">IVA (19%)</span><span className="text-sm font-black text-gray-900">$ 0.00</span></div>
                                        <div className="flex justify-between items-center py-4 border-t border-gray-50 mt-4"><span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Total Propuesta</span><span className="text-xl font-black text-purple-600">{formatCurrency(quoteItems.reduce((acc, it) => acc + (it.price * it.qty), 0))}</span></div>
                                    </div>
                                    <div className="space-y-3">
                                        <button className="w-full py-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-purple-200 transition-all"><span>📱</span> Enviar por WhatsApp</button>
                                        <button className="w-full py-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-purple-200 transition-all"><span>✉️</span> Enviar por Correo</button>
                                    </div>
                                </div>
                                <div className="pt-10 space-y-4">
                                    <button onClick={() => { setIsGeneratorOpen(false); setQuoteItems([]); alert("Cotización generada y exportada como PDF Pro."); }} className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">Descargar PDF Profesional</button>
                                    <button onClick={() => setIsGeneratorOpen(false)} className="w-full py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-500">Descartar y Salir</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
