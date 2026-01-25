"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../../context/auth-context';

// --- CONFIGURACIÓN DE BANCOS Y TEMAS ---
const BANK_THEMES: Record<string, { bg: string, text: string, accent: string, logo: string }> = {
    'Nequi': { bg: 'bg-gray-900', text: 'text-white', accent: 'text-pink-500', logo: '🟣' },
    'Bancolombia': { bg: 'bg-[#FFDD00]', text: 'text-gray-900', accent: 'text-black', logo: '🖤' },
    'Davivienda': { bg: 'bg-[#ED1C24]', text: 'text-white', accent: 'text-white', logo: '🏠' },
    'BBVA': { bg: 'bg-[#004481]', text: 'text-white', accent: 'text-[#00A9E0]', logo: '💙' },
    'Ualá': { bg: 'bg-white', text: 'text-gray-900', accent: 'text-purple-600', logo: '🦄' },
    'Otro': { bg: 'bg-slate-100', text: 'text-slate-800', accent: 'text-purple-600', logo: '🏦' }
};

const ACCOUNT_TYPES = [
    { name: 'Ahorros', icon: '💰' },
    { name: 'Corriente', icon: '💳' },
    { name: 'Monedero Digital', icon: '📱' }
];

interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    accountType: string;
    isActive: boolean;
}

export default function BillingSettings() {
    const { token, isAuthenticated, logout } = useAuth();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formAccount, setFormAccount] = useState({
        bankName: 'Nequi', accountNumber: '', accountHolder: '', accountType: 'Ahorros'
    });

    // Estados para dropdowns personalizados
    const [isBankOpen, setIsBankOpen] = useState(false);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const bankRef = useRef<HTMLDivElement>(null);
    const typeRef = useRef<HTMLDivElement>(null);

    // --- CARGAR CUENTAS DEL SERVIDOR ---
    const fetchAccounts = useCallback(async () => {
        if (!isAuthenticated || !token) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const userData = await response.json();
                setAccounts(userData.bank_accounts || []);
            }
        } catch (err) {
            console.error("Error fetching accounts:", err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    // --- GUARDAR CUENTAS EN EL SERVIDOR ---
    const persistAccounts = async (updatedAccounts: BankAccount[]) => {
        try {
            const response = await fetch('http://localhost:8000/auth/update-bank-accounts', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bank_accounts: updatedAccounts })
            });
            if (!response.ok) alert("Error al sincronizar con el servidor. Por favor re-ingresa.");
        } catch (err) {
            console.error("Persistence error:", err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bankRef.current && !bankRef.current.contains(e.target as Node)) setIsBankOpen(false);
            if (typeRef.current && !typeRef.current.contains(e.target as Node)) setIsTypeOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSetActive = async (id: string) => {
        const updated = accounts.map(acc => ({ ...acc, isActive: acc.id === id }));
        setAccounts(updated);
        await persistAccounts(updated);
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setFormAccount({ bankName: 'Nequi', accountNumber: '', accountHolder: '', accountType: 'Ahorros' });
        setIsModalOpen(true);
    };

    const openEditModal = (acc: BankAccount, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditMode(true);
        setEditingId(acc.id);
        setFormAccount({
            bankName: acc.bankName,
            accountNumber: acc.accountNumber,
            accountHolder: acc.accountHolder,
            accountType: acc.accountType
        });
        setIsModalOpen(true);
    };

    const handleSaveAccount = async () => {
        if (!formAccount.accountNumber || !formAccount.accountHolder) return alert("Completa todos los campos.");

        let updated: BankAccount[] = [];
        if (isEditMode && editingId) {
            updated = accounts.map(acc => acc.id === editingId ? { ...acc, ...formAccount } : acc);
        } else {
            const accountToAdd: BankAccount = {
                id: Math.random().toString(36).substr(2, 9),
                ...formAccount,
                isActive: accounts.length === 0
            };
            updated = [...accounts, accountToAdd];
        }
        
        setAccounts(updated);
        await persistAccounts(updated);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setFormAccount({ bankName: 'Nequi', accountNumber: '', accountHolder: '', accountType: 'Ahorros' });
        setEditingId(null);
        setIsEditMode(false);
        setIsBankOpen(false);
        setIsTypeOpen(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (accounts.find(a => a.id === id)?.isActive) return alert("No puedes eliminar la cuenta activa.");
        if (!confirm("¿Eliminar esta cuenta?")) return;
        
        const updated = accounts.filter(a => a.id !== id);
        setAccounts(updated);
        await persistAccounts(updated);
    };

    if (loading) return <div className="flex justify-center items-center min-h-[400px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Finanzas</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona tus cuentas de retiro y monitorea tus ingresos.</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    disabled={accounts.length >= 3}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg ${accounts.length >= 3 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white shadow-purple-100 hover:bg-purple-700 active:scale-95'}`}
                >
                    {accounts.length >= 3 ? 'Límite alcanzado' : '+ Agregar Cuenta'}
                </button>
            </div>

            {/* SECCIÓN DE CUENTAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {accounts.map((acc) => {
                    const theme = BANK_THEMES[acc.bankName] || BANK_THEMES['Otro'];
                    return (
                        <div 
                            key={acc.id}
                            onClick={() => handleSetActive(acc.id)}
                            className={`relative aspect-[1.6/1] rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 shadow-xl group overflow-hidden ${theme.bg} ${theme.text} ${acc.isActive ? 'ring-4 ring-offset-4 ring-purple-500 scale-[1.02]' : 'opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}
                        >
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                            
                            <div className="relative h-full flex flex-col justify-between z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Banco</p>
                                        <h3 className="text-lg font-black tracking-tight">{acc.bankName}</h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-2xl">{theme.logo}</div>
                                        <button onClick={(e) => openEditModal(acc, e)} className="text-[8px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-all opacity-0 group-hover:opacity-100">Editar</button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Número de Cuenta</p>
                                    <p className="text-xl font-black tracking-[0.1em] mt-1">{acc.accountNumber.replace(/\d(?=\d{4})/g, "•")}</p>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Titular</p>
                                        <p className="text-xs font-bold uppercase">{acc.accountHolder}</p>
                                    </div>
                                    {acc.isActive ? (
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest border border-white/20">Activa</span>
                                    ) : (
                                        <button onClick={(e) => handleDelete(acc.id, e)} className="text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all">Eliminar</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Banner IA */}
            <div className="p-8 bg-purple-50 rounded-[3rem] border border-purple-100 flex items-center gap-6">
                <div className="h-16 w-16 bg-white rounded-[1.5rem] shadow-sm flex items-center justify-center text-3xl">🤖</div>
                <div className="flex-1">
                    <h4 className="text-lg font-black text-purple-900 tracking-tight">IA Sincronizada</h4>
                    <p className="text-sm text-purple-700/70 font-medium leading-relaxed">
                        Tu Asistente IA compartirá los datos de la cuenta <span className="font-black underline">Activa</span> en WhatsApp y Redes Sociales automáticamente.
                    </p>
                </div>
            </div>

            {/* MODAL VINCULAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{isEditMode ? 'Editar Cuenta' : 'Vincular Cuenta'}</h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configuración de depósito</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                {/* SELECTOR BANCO PERSONALIZADO */}
                                <div className="relative" ref={bankRef}>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banco</label>
                                    <button 
                                        onClick={() => { setIsBankOpen(!isBankOpen); setIsTypeOpen(false); }}
                                        className="w-full mt-2 p-4 bg-gray-50 border border-transparent hover:border-purple-100 rounded-2xl text-sm font-bold text-gray-700 flex items-center justify-between transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{BANK_THEMES[formAccount.bankName]?.logo}</span>
                                            <span>{formAccount.bankName}</span>
                                        </div>
                                        <svg className={`w-4 h-4 transition-transform ${isBankOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {isBankOpen && (
                                        <div className="absolute z-[120] top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {Object.keys(BANK_THEMES).map((bank) => (
                                                <button
                                                    key={bank}
                                                    onClick={() => { setFormAccount({...formAccount, bankName: bank}); setIsBankOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${formAccount.bankName === bank ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                                >
                                                    <span className="text-lg">{BANK_THEMES[bank].logo}</span>
                                                    {bank}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* SELECTOR TIPO CUENTA PERSONALIZADO */}
                                <div className="relative" ref={typeRef}>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                                    <button 
                                        onClick={() => { setIsTypeOpen(!isTypeOpen); setIsBankOpen(false); }}
                                        className="w-full mt-2 p-4 bg-gray-50 border border-transparent hover:border-purple-100 rounded-2xl text-sm font-bold text-gray-700 flex items-center justify-between transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{ACCOUNT_TYPES.find(t => t.name === formAccount.accountType)?.icon}</span>
                                            <span>{formAccount.accountType}</span>
                                        </div>
                                        <svg className={`w-4 h-4 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {isTypeOpen && (
                                        <div className="absolute z-[120] top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {ACCOUNT_TYPES.map((type) => (
                                                <button
                                                    key={type.name}
                                                    onClick={() => { setFormAccount({...formAccount, accountType: type.name}); setIsTypeOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${formAccount.accountType === type.name ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                                >
                                                    <span className="text-lg">{type.icon}</span>
                                                    {type.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número de Cuenta / Celular</label>
                                <input type="text" placeholder="000-000000-00" value={formAccount.accountNumber} onChange={(e) => setFormAccount({...formAccount, accountNumber: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white rounded-2xl outline-none text-sm font-black tracking-widest transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Titular</label>
                                <input type="text" placeholder="Como aparece en el banco" value={formAccount.accountHolder} onChange={(e) => setFormAccount({...formAccount, accountHolder: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white rounded-2xl outline-none text-sm font-bold uppercase transition-all" />
                            </div>
                        </div>

                        <div className="p-10 pt-0">
                            <button onClick={handleSaveAccount} className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all">
                                {isEditMode ? 'Actualizar Información' : 'Confirmar y Vincular'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORIAL */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50"><h2 className="text-xl font-black text-gray-900 tracking-tight">Historial de Cargos</h2></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50"><tr><th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th><th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Concepto</th><th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th><th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                                                                {[{ date: '01 Ene 2024', desc: 'Suscripción Plan Empresa', amount: '$49.00', status: 'Pagado' }].map((invoice, i) => (
                            
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors"><td className="px-8 py-5 text-xs font-bold text-gray-500">{invoice.date}</td><td className="px-8 py-5 text-sm font-black text-gray-900">{invoice.desc}</td><td className="px-8 py-5 text-sm font-black text-gray-900">{invoice.amount}</td><td className="px-8 py-5 text-right"><span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-md">{invoice.status}</span></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
