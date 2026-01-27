"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from '@/context/toast-context';
import { 
  Loader2, Plus, CheckCircle2, DollarSign, Users, Calendar, 
  Store, Smartphone, X, ChevronRight, Trash2, FileText, 
  Clock, History, Pencil, Package, Check 
} from 'lucide-react';

interface ProviderInvoice {
    id: string;
    description: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid';
    category: string;
    invoice_num?: string;
    items?: {name: string, qty: number}[];
    description_detail?: string;
}

interface CustomerCredit {
    id: string;
    client_name: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'collected';
    invoice_num?: string;
    items?: {name: string, qty: number}[];
    description_detail?: string;
}

export default function CuentasPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'providers' | 'customers'>('providers');
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [providerInvoices, setProviderInvoices] = useState<ProviderInvoice[]>([]);
    const [customerCredits, setCustomerCredits] = useState<CustomerCredit[]>([]);

    const [invoiceItems, setInvoiceItems] = useState<{name: string, qty: number}[]>([{name: '', qty: 1}]);
    const [newInvoice, setNewInvoice] = useState({ provider: '', invoice_num: '', category: 'Mercancía', amount: 0, date: new Date().toISOString().split('T')[0], desc: '' });
    const [newCredit, setNewCredit] = useState({ customer: '', invoice_num: '', amount: 0, date: new Date().toISOString().split('T')[0], desc: '' });

    const loadData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [expRes, recRes] = await Promise.all([
                fetch('http://localhost:8000/expenses', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:8000/receivables', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (expRes.ok) {
                const exps = await expRes.json();
                setProviderInvoices(exps.filter((e: any) => e.category === 'cuenta_proveedor'));
            }
            if (recRes.ok) setCustomerCredits(await recRes.json());
        } catch (e) { showToast("Error al cargar cartera", "error"); }
        finally { setIsLoading(false); }
    }, [token, showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const formatNumberInput = (val: number) => {
        if (!val) return "";
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const unformatNumberInput = (val: string) => {
        return parseFloat(val.replace(/\./g, '')) || 0;
    };

    const handleAction = async (action: 'pay' | 'delete', record: any, type: 'provider' | 'customer') => {
        if (!token) return;
        if (action === 'delete' && !confirm("¿Estás seguro de eliminar este registro definitivamente?")) return;
        try {
            const endpoint = type === 'provider' ? `/expenses/${record.id}` : `/receivables/${record.id}`;
            let res;
            if (action === 'pay') {
                const payload = { ...record, status: type === 'provider' ? 'paid' : 'collected' };
                // Eliminamos campos internos de UI que no pertenecen al esquema del backend
                delete payload.type;
                res = await fetch(`http://localhost:8000${endpoint}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`http://localhost:8000${endpoint}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            if (res.ok) {
                showToast(action === 'pay' ? "Registro liquidado con éxito" : "Registro eliminado", "success");
                setSelectedRecord(null);
                await loadData();
            } else {
                showToast("No se pudo completar la acción", "error");
            }
        } catch (e) { showToast("Error en la operación", "error"); }
    };

    const handleUpdate = async () => {
        if (!token || !selectedRecord) return;
        setIsSaving(true);
        try {
            const endpoint = selectedRecord.type === 'provider' ? `/expenses/${selectedRecord.id}` : `/receivables/${selectedRecord.id}`;
            const res = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...selectedRecord, due_date: new Date(selectedRecord.due_date).toISOString() })
            });
            if (res.ok) {
                showToast("Cambios guardados", "success");
                setIsEditMode(false);
                await loadData();
            }
        } catch (e) { showToast("Error al actualizar", "error"); }
        finally { setIsSaving(false); }
    };

    const handleAddInvoice = async () => {
        if (!newInvoice.provider || newInvoice.amount <= 0) return showToast("Completa los datos", "error");
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:8000/expenses', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: newInvoice.provider, invoice_num: newInvoice.invoice_num,
                    amount: newInvoice.amount, due_date: new Date(newInvoice.date).toISOString(),
                    category: 'cuenta_proveedor', status: 'pending', items: invoiceItems, description_detail: newInvoice.desc
                })
            });
            if (res.ok) {
                showToast("Factura registrada", "success");
                await loadData();
                setIsInvoiceModalOpen(false);
                setNewInvoice({ provider: '', invoice_num: '', category: 'Mercancía', amount: 0, date: new Date().toISOString().split('T')[0], desc: '' });
                setInvoiceItems([{name: '', qty: 1}]);
            }
        } catch (e) { showToast("Error al guardar", "error"); }
        finally { setIsSaving(false); }
    };

    const handleAddCredit = async () => {
        if (!newCredit.customer || newCredit.amount <= 0) return showToast("Completa los datos", "error");
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:8000/receivables', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_name: newCredit.customer, invoice_num: newCredit.invoice_num,
                    amount: newCredit.amount, due_date: new Date(newCredit.date).toISOString(),
                    status: 'pending', items: invoiceItems, description_detail: newCredit.desc
                })
            });
            if (res.ok) {
                showToast("Crédito activado", "success");
                await loadData();
                setIsCreditModalOpen(false);
                setNewCredit({ customer: '', invoice_num: '', amount: 0, date: new Date().toISOString().split('T')[0], desc: '' });
                setInvoiceItems([{name: '', qty: 1}]);
            }
        } catch (e) { showToast("Error al guardar", "error"); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12 animate-in fade-in duration-500">
            {/* Header & Global KPIs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div><h1 className="text-4xl font-black text-gray-900 tracking-tight">Cuentas y Cartera</h1><p className="text-gray-500 mt-2 font-medium">Gestión administrativa de deudas y créditos.</p></div>
                <div className="flex gap-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-inner text-xl">📉</div>
                        <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Proveedores</p><p className="text-base font-black text-gray-900 mt-1">{formatCurrency(providerInvoices.filter(i=>i.status==='pending').reduce((a,b)=>a+b.amount,0))}</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner text-xl">📈</div>
                        <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Clientes</p><p className="text-base font-black text-gray-900 mt-1">{formatCurrency(customerCredits.filter(i=>i.status==='pending').reduce((a,b)=>a+b.amount,0))}</p></div>
                    </div>
                </div>
            </div>

            {/* Navigation & History */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-6">
                <div className="flex space-x-1 bg-gray-50 p-1.5 rounded-2xl w-fit">
                    <button onClick={() => setActiveTab('providers')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'providers' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>🏢 Proveedores</button>
                    <button onClick={() => setActiveTab('customers')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'customers' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>👥 Clientes</button>
                </div>
                <button onClick={() => setIsHistoryModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200"><History size={14} /> Historial Liquidado</button>
            </div>

            {/* Content List */}
            <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">{activeTab === 'providers' ? 'Pendientes de Pago' : 'Pendientes de Cobro'}</h2>
                    <button onClick={() => activeTab === 'providers' ? setIsInvoiceModalOpen(true) : setIsCreditModalOpen(true)} className="text-purple-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ Añadir Registro</button>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    {isLoading ? (<div className="py-20 flex justify-center"><Loader2 className="animate-spin text-purple-600" size={32} /></div>) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Referencia / Concepto</th>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Vencimiento</th>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
                                        <th className="px-8 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Ver</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(activeTab === 'providers' ? providerInvoices : customerCredits).filter(r => r.status === 'pending').map((rec) => (
                                        <tr key={rec.id} onClick={() => setSelectedRecord({...rec, type: activeTab === 'providers' ? 'provider' : 'customer'})} className="hover:bg-gray-50/50 transition-all cursor-pointer group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs ${activeTab === 'providers' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{activeTab === 'providers' ? '🏢' : '👤'}</div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{(rec as any).description || (rec as any).client_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase">{new Date(rec.due_date).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 font-black text-sm text-gray-900">{formatCurrency(rec.amount)}</td>
                                            <td className="px-8 py-5 text-right"><ChevronRight size={16} className="text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all inline-block" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DETALLE (ESPEJO) */}
            {selectedRecord && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
                        <div className={`p-8 text-white relative flex-shrink-0 ${selectedRecord.type === 'provider' ? 'bg-gray-900' : 'bg-purple-600'}`}>
                            <div className="absolute top-6 right-6 flex gap-2">
                                <button onClick={() => setIsEditMode(!isEditMode)} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${isEditMode ? 'bg-white text-purple-600' : 'bg-white/10 hover:bg-white/20'}`}><Pencil size={16} /></button>
                                <button onClick={() => { setSelectedRecord(null); setIsEditMode(false); }} className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all"><X size={16} /></button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg">{selectedRecord.type === 'provider' ? <Store size={24} /> : <Users size={24} />}</div>
                                <div><h2 className="text-xl font-black tracking-tight">{selectedRecord.description || selectedRecord.client_name}</h2><p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Detalle del Registro</p></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{selectedRecord.type === 'provider' ? 'Proveedor' : 'Cliente'}</label>
                                        {isEditMode ? (
                                            <input type="text" value={selectedRecord.description || selectedRecord.client_name} onChange={(e) => setSelectedRecord({...selectedRecord, description: e.target.value, client_name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-purple-200 rounded-2xl outline-none text-sm font-bold shadow-inner" />
                                        ) : (
                                            <div className="w-full p-4 bg-gray-50/50 rounded-2xl text-sm font-bold text-gray-900">{selectedRecord.description || selectedRecord.client_name}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vencimiento</label>
                                        {isEditMode ? (
                                            <input type="date" value={selectedRecord.due_date.split('T')[0]} onChange={(e) => setSelectedRecord({...selectedRecord, due_date: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-purple-200 rounded-2xl outline-none text-sm font-bold shadow-inner" />
                                        ) : (
                                            <div className="w-full p-4 bg-gray-50/50 rounded-2xl text-sm font-bold text-gray-900">{new Date(selectedRecord.due_date).toLocaleDateString()}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto Total</label>
                                        {isEditMode ? (
                                            <input type="text" value={formatNumberInput(selectedRecord.amount)} onChange={(e) => setSelectedRecord({...selectedRecord, amount: unformatNumberInput(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-purple-200 rounded-2xl outline-none text-sm font-black shadow-inner" />
                                        ) : (
                                            <div className="w-full p-4 bg-gray-50/50 rounded-2xl text-sm font-black text-gray-900">{formatCurrency(selectedRecord.amount)}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Referencia #</label>
                                        {isEditMode ? (
                                            <input type="text" value={selectedRecord.invoice_num || ''} onChange={(e) => setSelectedRecord({...selectedRecord, invoice_num: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-purple-200 rounded-2xl outline-none text-sm font-bold shadow-inner" />
                                        ) : (
                                            <div className="w-full p-4 bg-gray-50/50 rounded-2xl text-sm font-bold text-gray-900">{selectedRecord.invoice_num || 'N/A'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                                <div className="flex justify-between items-center"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Productos</h3>
                                    {isEditMode && (<button onClick={() => setSelectedRecord({...selectedRecord, items: [...(selectedRecord.items || []), {name: '', qty: 1}]})} className="text-[9px] font-black uppercase text-purple-600 hover:text-purple-700">+ Añadir</button>)}
                                </div>
                                <div className="space-y-3">
                                    {(selectedRecord.items || [{name: 'Sin productos registrados', qty: 1}]).map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-3">
                                            {isEditMode ? (
                                                <><input type="text" value={item.name} onChange={(e) => { const updated = [...selectedRecord.items]; updated[idx].name = e.target.value; setSelectedRecord({...selectedRecord, items: updated}); }} className="flex-1 p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none" /><input type="number" value={item.qty} onChange={(e) => { const updated = [...selectedRecord.items]; updated[idx].qty = parseInt(e.target.value) || 0; setSelectedRecord({...selectedRecord, items: updated}); }} className="w-20 p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-center outline-none" /></>
                                            ) : (
                                                <div className="flex-1 flex justify-between items-center p-3 bg-white/50 rounded-xl border border-transparent"><span className="text-sm font-bold text-gray-700">{item.name}</span><span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">x{item.qty}</span></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción / Notas Adicionales</label>
                                {isEditMode ? (
                                    <textarea rows={3} value={selectedRecord.description_detail || ''} onChange={(e) => setSelectedRecord({...selectedRecord, description_detail: e.target.value})} className="w-full p-6 bg-gray-50 border-2 border-purple-200 rounded-[2rem] outline-none text-sm font-medium resize-none shadow-inner" />
                                ) : (
                                    <div className="w-full p-6 bg-gray-50/50 rounded-[2rem] text-sm font-medium text-gray-600 italic">{selectedRecord.description_detail || "Sin notas adicionales."}</div>
                                )}
                            </div>
                            <div className="pt-6 border-t border-gray-50 flex gap-4">
                                {isEditMode ? (
                                    <button onClick={handleUpdate} disabled={isSaving} className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Guardar Cambios</button>
                                ) : (
                                    <><button onClick={() => handleAction('pay', selectedRecord, selectedRecord.type)} className="flex-[2] py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Marcar como Liquidado</button><button onClick={() => handleAction('delete', selectedRecord, selectedRecord.type)} className="flex-1 py-5 bg-white border border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all">Eliminar</button></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALES DE CREACIÓN (PRO) */}
            {(isInvoiceModalOpen || isCreditModalOpen) && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
                        <div className={`${isInvoiceModalOpen ? 'bg-gray-900' : 'bg-purple-600'} p-8 text-white flex-shrink-0 relative`}>
                            <button onClick={() => { setIsInvoiceModalOpen(false); setIsCreditModalOpen(false); }} className="absolute top-6 right-6 h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all active:scale-90"><Plus className="rotate-45" size={20} /></button>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg">{isInvoiceModalOpen ? <Store size={24} /> : <Users size={24} />}</div>
                                <div><h2 className="text-xl font-black tracking-tight">{isInvoiceModalOpen ? 'Nueva Factura Proveedor' : 'Nuevo Crédito Cliente'}</h2><p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Gestión Administrativa Pro</p></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{isInvoiceModalOpen ? 'Proveedor' : 'Nombre del Cliente'}</label><input type="text" placeholder="Nombre" value={isInvoiceModalOpen ? newInvoice.provider : newCredit.customer} onChange={(e) => isInvoiceModalOpen ? setNewInvoice({...newInvoice, provider: e.target.value}) : setNewCredit({...newCredit, customer: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold shadow-inner" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Referencia #</label><input type="text" placeholder="Ej: FAC-001" value={isInvoiceModalOpen ? newInvoice.invoice_num : newCredit.invoice_num} onChange={(e) => isInvoiceModalOpen ? setNewInvoice({...newInvoice, invoice_num: e.target.value}) : setNewCredit({...newCredit, invoice_num: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold shadow-inner" /></div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto Total</label><input type="text" value={isInvoiceModalOpen ? formatNumberInput(newInvoice.amount) : formatNumberInput(newCredit.amount)} onChange={(e) => isInvoiceModalOpen ? setNewInvoice({...newInvoice, amount: unformatNumberInput(e.target.value)}) : setNewCredit({...newCredit, amount: unformatNumberInput(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-black shadow-inner" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vencimiento</label><input type="date" value={isInvoiceModalOpen ? newInvoice.date : newCredit.date} onChange={(e) => isInvoiceModalOpen ? setNewInvoice({...newInvoice, date: e.target.value}) : setNewCredit({...newCredit, date: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold shadow-inner" /></div>
                                </div>
                            </div>
                            <div className="space-y-6 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                                <div className="flex justify-between items-center"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Productos</h3><button onClick={() => setInvoiceItems([...invoiceItems, {name: '', qty: 1}])} className="text-[9px] font-black uppercase text-purple-600 hover:text-purple-700">+ Añadir</button></div>
                                <div className="space-y-3">{invoiceItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-3"><input type="text" placeholder="Nombre" value={item.name} onChange={(e) => { const updated = [...invoiceItems]; updated[idx].name = e.target.value; setInvoiceItems(updated); }} className="flex-1 p-4 bg-white rounded-xl text-sm font-bold outline-none border border-gray-100" /><input type="number" placeholder="Cant." value={item.qty} onChange={(e) => { const updated = [...invoiceItems]; updated[idx].qty = parseInt(e.target.value) || 0; setInvoiceItems(updated); }} className="w-20 p-4 bg-white rounded-xl text-sm font-bold text-center outline-none border border-gray-100" /></div>
                                ))}</div>
                            </div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción / Notas</label><textarea rows={3} placeholder="Detalles..." value={isInvoiceModalOpen ? newInvoice.desc : newCredit.desc} onChange={(e) => isInvoiceModalOpen ? setNewInvoice({...newInvoice, desc: e.target.value}) : setNewCredit({...newCredit, desc: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[2rem] outline-none text-sm font-medium border-2 border-transparent focus:bg-white focus:border-purple-200" /></div>
                        </div>
                        <div className="p-10 bg-gray-50/50 border-t border-gray-100 flex gap-4 flex-shrink-0">
                            <button onClick={() => { setIsInvoiceModalOpen(false); setIsCreditModalOpen(false); }} className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-gray-400 border border-gray-100">Cancelar</button>
                            <button onClick={isInvoiceModalOpen ? handleAddInvoice : handleAddCredit} disabled={isSaving} className={`flex-[2] py-4 ${isInvoiceModalOpen ? 'bg-gray-900' : 'bg-purple-600'} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2`}>{isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} {isSaving ? 'Guardando...' : 'Registrar Oficial'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL HISTORIAL (MANTENIDO) */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl h-[80vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
                        <div className="bg-gray-900 p-8 text-white flex justify-between items-center relative flex-shrink-0">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3"><History className="text-purple-400" size={24} /> Historial Liquidado</h2>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-gray-50/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...providerInvoices, ...customerCredits].filter(r => r.status === 'paid' || r.status === 'collected').map((h) => (
                                    <div key={h.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center grayscale text-lg">{(h as any).client_name ? '👤' : '🏢'}</div>
                                            <div><p className="text-sm font-black text-gray-900">{(h as any).client_name || (h as any).description}</p><p className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Liquidado</p></div>
                                        </div>
                                        <p className="text-sm font-black text-gray-900">{formatCurrency(h.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
