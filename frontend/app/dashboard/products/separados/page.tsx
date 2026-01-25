"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../../../context/auth-context';

// --- CONFIGURACIÓN DE LÍNEAS DE WHATSAPP ---
const WHATSAPP_LINES = [
    { id: 'line_1', name: 'Asesor Principal', number: '+57 300 456 7890', status: 'Connected' },
    { id: 'line_2', name: 'Ventas Norte', number: '+57 311 222 3344', status: 'Connected' },
    { id: 'line_3', name: 'Ventas Sur', number: '+57 320 555 6677', status: 'Connected' }
];

interface ReservationRequest {
    id: string;
    line_id: string; // Vínculo con la línea específica
    order_number?: string;
    customer_name: string;
    whatsapp_number: string;
    product_name: string;
    details: string; 
    image_url: string | null;
    status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
    requested_at: string;
    ai_confidence: number;
    reminder_sent?: boolean;
}

const MOCK_RESERVATIONS: ReservationRequest[] = [
    {
        id: "res_1", line_id: 'line_1', customer_name: "Mariana López", whatsapp_number: "+57 300 123 4567",
        product_name: "Vestido Floral Verano", details: "Talla S, Color Azul",
        image_url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300",
        status: 'pending', requested_at: new Date().toISOString(), ai_confidence: 98
    },
    {
        id: "res_2", line_id: 'line_1', order_number: "SEP-8240", customer_name: "Juan Carlos Pérez", whatsapp_number: "+57 311 987 6543",
        product_name: "Camisa Oxford Premium", details: "Talla L, Color Blanco",
        image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
        status: 'confirmed', requested_at: new Date(Date.now() - 86400000).toISOString(), ai_confidence: 95,
        reminder_sent: false
    },
    {
        id: "res_3", line_id: 'line_2', customer_name: "Elena Gómez", whatsapp_number: "+57 320 444 5566",
        product_name: "Jeans High Rise", details: "Talla 10, Diseño Clásico",
        image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300",
        status: 'pending', requested_at: new Date(Date.now() - 7200000).toISOString(), ai_confidence: 92
    }
];

export default function SeparadosPage() {
    const { userEmail, userRole } = useAuth();
    const [reservations, setReservations] = useState<ReservationRequest[]>(MOCK_RESERVATIONS);
    const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'cancelled' | 'expired'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // --- LÓGICA DE MULTILÍNEA ---
    const [selectedLine, setSelectedLine] = useState(WHATSAPP_LINES[0]);
    const [isLineMenuOpen, setIsLineMenuOpen] = useState(false);
    const lineMenuRef = useRef<HTMLDivElement>(null);

    // Simulación: Si el usuario es 'staff_separados', bloquear a Linea 2
    const isRestrictedStaff = userRole === 'staff_separados';
    useEffect(() => {
        if (isRestrictedStaff) setSelectedLine(WHATSAPP_LINES[1]);
    }, [isRestrictedStaff]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (lineMenuRef.current && !lineMenuRef.current.contains(e.target as Node)) setIsLineMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Notificaciones
    const [showTicket, setShowTicket] = useState(false);
    const [ticketData, setTicketData] = useState({ title: '', detail: '', icon: '', type: 'success' });

    useEffect(() => {
        if (showTicket) {
            const timer = setTimeout(() => setShowTicket(false), 4500);
            return () => clearTimeout(timer);
        }
    }, [showTicket]);

    // Filtrado por Línea + Estado + Búsqueda
    const processedData = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - (7 * 86400000));
        return reservations
            .filter(r => r.line_id === selectedLine.id) // Filtrar por línea activa
            .map(res => {
                if (res.status === 'pending' && new Date(res.requested_at) < oneWeekAgo) {
                    return { ...res, status: 'expired' as const };
                }
                return res;
            });
    }, [reservations, selectedLine]);

    const filteredReservations = processedData.filter(res => {
        const matchesTab = res.status === activeTab;
        const matchesSearch = res.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || (res.order_number && res.order_number.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesTab && matchesSearch;
    });

    const triggerTicket = (title: string, detail: string, icon: string, type: string = 'success') => {
        setTicketData({ title, detail, icon, type });
        setShowTicket(true);
    };

    const handleAction = (id: string, action: 'confirmed' | 'cancelled') => {
        setProcessingId(id);
        const resObj = reservations.find(r => r.id === id);
        setTimeout(() => {
            const nextOrderNum = `SEP-${Math.floor(1000 + Math.random() * 9000)}`;
            setReservations(prev => prev.map(res => 
                res.id === id ? { ...res, status: action, order_number: action === 'confirmed' ? (res.order_number || nextOrderNum) : res.order_number } : res
            ));
            setProcessingId(null);
            if (action === 'confirmed') triggerTicket("Confirmado", `${resObj?.customer_name} recibió su ticket.`, "✅");
            else triggerTicket("Cancelado", `Venta de ${resObj?.customer_name} cancelada.`, "✕", "info");
        }, 600);
    };

    const handleReminder = (id: string) => {
        setProcessingId(id);
        const resObj = reservations.find(r => r.id === id);
        setTimeout(() => {
            setReservations(prev => prev.map(res => res.id === id ? { ...res, reminder_sent: true } : res));
            setProcessingId(null);
            triggerTicket("Recordatorio", `WhatsApp enviado a ${resObj?.customer_name}.`, "🔔", "warning");
        }, 600);
    };

    const pendingCount = processedData.filter(r => r.status === 'pending').length;
    const confirmedCount = processedData.filter(r => r.status === 'confirmed').length;
    const cancelledCount = processedData.filter(r => r.status === 'cancelled').length;
    const expiredCount = processedData.filter(r => r.status === 'expired').length;

    return (
        <div className="max-w-7xl mx-auto pb-20 relative">
            
            {/* TICKET NOTIFICACIÓN */}
            <div className={`fixed top-4 right-8 z-[200] transition-all duration-500 transform ${showTicket ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-white rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-purple-100/50 p-1.5 flex items-center gap-4 min-w-[340px] max-w-sm overflow-hidden group">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${ticketData.type === 'success' ? 'bg-emerald-50 text-emerald-600' : ticketData.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'}`}>{ticketData.icon}</div>
                    <div className="flex-1 pr-4">
                        <div className="flex items-center justify-between"><h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{ticketData.title}</h4><span className="text-[8px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-md">Línea: {selectedLine.name}</span></div>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 leading-tight">{ticketData.detail}</p>
                    </div>
                    <button onClick={() => setShowTicket(false)} className="h-8 w-8 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors">✕</button>
                </div>
            </div>

            {/* 1. Header con Selector de Líneas */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Separados</h1>
                        <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest">IA Activa</span>
                    </div>
                    <p className="text-gray-500 font-medium">Línea actual: <span className="text-purple-600 font-bold">{selectedLine.name}</span></p>
                </div>

                {/* SELECTOR DE WHATSAPP INTERACTIVO */}
                <div className="relative" ref={lineMenuRef}>
                    <button 
                        onClick={() => !isRestrictedStaff && setIsLineMenuOpen(!isLineMenuOpen)}
                        className={`bg-white p-4 rounded-[2rem] border shadow-sm flex items-center gap-4 transition-all ${isRestrictedStaff ? 'cursor-default border-gray-100' : 'hover:border-purple-200 hover:shadow-md border-gray-100 active:scale-95'}`}
                    >
                        <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">📱</div>
                        <div className="text-left pr-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">WhatsApp</p>
                            <p className="text-xs font-bold text-emerald-600 mt-1">{selectedLine.status}</p>
                            <p className="text-[9px] font-black text-gray-400 mt-0.5 tracking-tighter">{selectedLine.number}</p>
                        </div>
                        {!isRestrictedStaff && (
                            <svg className={`w-4 h-4 text-gray-300 transition-transform ${isLineMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        )}
                    </button>

                    {isLineMenuOpen && (
                        <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Cambiar Línea / Asesor</p>
                            {WHATSAPP_LINES.map((line) => (
                                <button
                                    key={line.id}
                                    onClick={() => { setSelectedLine(line); setIsLineMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${selectedLine.id === line.id ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                >
                                    <span className="text-lg">📱</span>
                                    <div className="text-left">
                                        <p className="text-xs font-black leading-none">{line.name}</p>
                                        <p className="text-[9px] font-bold opacity-60 mt-1">{line.number}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Filtros y Buscador */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100/50 shadow-sm">
                    {[
                        { id: 'pending', label: 'Pendientes', count: pendingCount },
                        { id: 'confirmed', label: 'Confirmados', count: confirmedCount },
                        { id: 'cancelled', label: 'Cancelados', count: cancelledCount },
                        { id: 'expired', label: 'Vencidos', count: expiredCount }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>{tab.label} {tab.count > 0 && <span>({tab.count})</span>}</button>
                    ))}
                </div>
                <div className="relative w-full lg:w-80">
                    <input type="text" placeholder="Buscar en esta línea..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 text-sm border border-gray-50 bg-gray-50/50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-500/5 outline-none transition-all font-medium" />
                    <svg className="w-5 h-5 absolute left-4 top-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            {/* 3. Listado Dinámico */}
            <div className="space-y-6">
                {filteredReservations.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-50 shadow-sm">
                        <p className="text-4xl mb-4">🔍</p>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Sin resultados</h3>
                        <p className="text-gray-400 text-sm mt-2">No hay registros para {selectedLine.name} en esta categoría.</p>
                    </div>
                ) : (
                    filteredReservations.map((res) => (
                        <div key={res.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden animate-in fade-in duration-500">
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${res.status === 'confirmed' ? 'bg-emerald-500' : res.status === 'expired' ? 'bg-rose-500' : res.status === 'cancelled' ? 'bg-gray-300' : 'bg-purple-600'}`}></div>
                            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4"><div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shadow-inner">👤</div><div><h4 className="text-lg font-black text-gray-900 leading-none">{res.customer_name}</h4><p className="text-xs font-bold text-purple-600 mt-1.5">{res.whatsapp_number}</p></div></div>
                                    {res.order_number && (<div className="inline-flex items-center px-3 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-gray-200">Pedido: {res.order_number}</div>)}
                                </div>
                                <div className="flex-[1.5] flex items-center gap-6 p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                                    <div className="h-20 w-20 rounded-2xl overflow-hidden border border-white shadow-sm flex-shrink-0">{res.image_url ? <img src={res.image_url} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gray-200 flex items-center justify-center">📦</div>}</div>
                                    <div className="flex-1"><h5 className="text-base font-black text-gray-900">{res.product_name}</h5><p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{res.details}</p></div>
                                </div>
                                <div className="min-w-[220px]">
                                    {res.status === 'pending' || res.status === 'expired' ? (
                                        <div className="flex flex-col gap-3"><button onClick={() => handleAction(res.id, 'confirmed')} className="w-full bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200 transition-all">Confirmar Pedido</button><button onClick={() => handleAction(res.id, 'cancelled')} className="w-full bg-white border border-gray-100 hover:bg-rose-50 hover:text-rose-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all">Cancelar</button></div>
                                    ) : res.status === 'confirmed' ? (
                                        <div className="flex flex-col gap-3"><div className="text-center p-3 bg-emerald-50 border border-emerald-100 rounded-2xl"><p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Confirmado ✅</p></div><button onClick={() => handleReminder(res.id)} disabled={processingId === res.id} className={`w-full px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${res.reminder_sent ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-default' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'}`}>{res.reminder_sent ? 'Recordatorio Enviado' : 'Recordar al cliente'}</button><button onClick={() => handleAction(res.id, 'cancelled')} className="w-full px-6 py-3 border border-transparent text-rose-600 text-[10px] font-black uppercase tracking-widest hover:underline">Cancelar Pedido</button></div>
                                    ) : (
                                        <div className="text-center p-4 bg-gray-50 border border-gray-100 rounded-2xl"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancelado ✕</p></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
