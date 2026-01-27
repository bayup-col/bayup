"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from '@/context/toast-context';
import { Loader2 } from 'lucide-react';

interface Expense {
    id: string;
    category: 'fijo' | 'diario';
    description: string;
    amount: number;
    due_date: string;
    status: string;
}

export default function GastosPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
    const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);

    // Form states
    const [formData, setFormData] = useState({ name: '', amount: 0, desc: '', date: new Date().toISOString().split('T')[0] });

    const fetchExpenses = useCallback(async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const res = await fetch('http://localhost:8000/expenses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filtramos solo gastos operativos (fijos y diarios)
                setExpenses(data.filter((e: any) => e.category === 'operativo_fijo' || e.category === 'operativo_diario'));
            }
        } catch (e) {
            showToast("No se pudieron cargar los gastos", "error");
        } finally {
            setIsLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

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

    const handleAddExpense = async (category: 'fijo' | 'diario') => {
        if (!formData.name || formData.amount <= 0) {
            return showToast("Completa los datos obligatorios", "error");
        }
        
        setIsSaving(true);
        try {
            const payload = {
                description: formData.name.trim(),
                amount: Number(formData.amount),
                due_date: new Date(formData.date).toISOString(),
                category: category === 'fijo' ? 'operativo_fijo' : 'operativo_diario',
                status: "paid" // Marcamos como pagado por defecto al registrar
            };

            const res = await fetch('http://localhost:8000/expenses', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast("Gasto registrado correctamente", "success");
                await fetchExpenses();
                setIsFixedModalOpen(false);
                setIsDailyModalOpen(false);
                setFormData({ name: '', amount: 0, desc: '', date: new Date().toISOString().split('T')[0] });
            } else {
                const errData = await res.json();
                showToast(errData.detail || "Error en el servidor", "error");
            }
        } catch (e) {
            console.error("DEBUG ERROR GASTOS:", e);
            showToast("Error de conexión con el servidor", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const totalFixed = expenses.filter(e => e.category === 'operativo_fijo').reduce((a, b) => a + b.amount, 0);
    const totalDaily = expenses.filter(e => e.category === 'operativo_diario').reduce((a, b) => a + b.amount, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header & Global Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Control de Gastos</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona los costos fijos y la caja menor de tu operación.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsFixedModalOpen(true)} className="bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">+ Gasto Fijo</button>
                    <button onClick={() => setIsDailyModalOpen(true)} className="bg-purple-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all">+ Gasto del Día</button>
                </div>
            </div>

            {/* Dashboards de Gastos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gastos Fijos (Mensuales) */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 flex flex-col">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Costos Fijos</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Presupuesto Mensual Estructurado</p>
                        </div>
                        <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl">🏛️</div>
                    </div>
                    <div className="flex-1 space-y-4">
                        {expenses.filter(e => e.category === 'operativo_fijo').map(e => (
                            <div key={e.id} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                <div><p className="text-sm font-black text-gray-900">{e.description}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(e.due_date).toLocaleDateString()}</p></div>
                                <p className="text-sm font-black text-gray-900">{formatCurrency(e.amount)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Mensual Estimado</span>
                        <span className="text-2xl font-black text-gray-900">{formatCurrency(totalFixed)}</span>
                    </div>
                </div>

                {/* Gastos Diarios (Caja Menor) */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 flex flex-col">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Gastos Diarios</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Caja Menor y Operación Variable</p>
                        </div>
                        <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl">💸</div>
                    </div>
                    <div className="flex-1 space-y-4">
                        {expenses.filter(e => e.category === 'operativo_diario').map(e => (
                            <div key={e.id} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                <div><p className="text-sm font-black text-gray-900">{e.description}</p><p className="text-[10px] font-bold text-gray-400 uppercase italic">{new Date(e.due_date).toLocaleDateString()}</p></div>
                                <p className="text-sm font-black text-purple-600">{formatCurrency(e.amount)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Gastado Hoy</span>
                        <span className="text-2xl font-black text-purple-600">{formatCurrency(totalDaily)}</span>
                    </div>
                </div>
            </div>

            {/* Gráfica de Salud Financiera (Visual) */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
                <div className="relative z-10 w-full md:w-1/3 text-center md:text-left">
                    <h3 className="text-2xl font-black tracking-tight">Balance de Operación</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                        Tus ingresos de hoy cubren el <span className="text-emerald-400 font-black">100%</span> de tus gastos diarios y aportan un <span className="text-purple-400 font-black">12%</span> al pago de tus costos fijos mensuales.
                    </p>
                </div>
                <div className="flex-1 flex items-end justify-between gap-4 h-32 px-10">
                    {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-white/10 rounded-full relative overflow-hidden group">
                            <div className="absolute bottom-0 w-full bg-emerald-500 transition-all duration-1000 group-hover:bg-purple-500" style={{ height: `${h}%` }}></div>
                        </div>
                    ))}
                </div>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black">📈</div>
            </div>

            {/* MODAL GASTO FIJO */}
            {isFixedModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Nuevo Gasto Fijo</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Estructura tus costos mensuales</p></div>
                            <button onClick={() => setIsFixedModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Concepto</label><input type="text" placeholder="Ej: Arriendo, Internet, Nómina..." value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all shadow-inner" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Monto Mensual</label><input type="text" placeholder="0" value={formatNumberInput(formData.amount)} onChange={(e) => setFormData({...formData, amount: unformatNumberInput(e.target.value)})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-black transition-all shadow-inner" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Día de Pago</label><input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all shadow-inner" /></div>
                        </div>
                        <div className="p-10 pt-0"><button disabled={isSaving} onClick={() => handleAddExpense('fijo')} className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50">{isSaving ? 'Registrando...' : 'Registrar Costo Fijo'}</button></div>
                    </div>
                </div>
            )}

            {/* MODAL GASTO DIARIO */}
            {isDailyModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Nuevo Gasto del Día</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Registra salidas de caja menor</p></div>
                            <button onClick={() => setIsDailyModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Descripción Rápida</label><input type="text" placeholder="Ej: Pago taxi, Almuerzo, Cinta adhesiva..." value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all shadow-inner" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Monto Pagado</label><input type="text" placeholder="0" value={formatNumberInput(formData.amount)} onChange={(e) => setFormData({...formData, amount: unformatNumberInput(e.target.value)})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-black transition-all shadow-inner" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nota adicional</label><input type="text" placeholder="¿Para qué fue este gasto?" value={formData.desc} onChange={(e) => setFormData({...formData, desc: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-medium transition-all shadow-inner" /></div>
                        </div>
                        <div className="p-10 pt-0"><button disabled={isSaving} onClick={() => handleAddExpense('diario')} className="w-full bg-purple-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-100 transition-all disabled:opacity-50">{isSaving ? 'Registrando...' : 'Registrar en Caja'}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
