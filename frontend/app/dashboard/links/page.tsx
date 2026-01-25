"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/auth-context';
import Link from 'next/link';

interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    accountType: string;
    isActive: boolean;
}

interface PaymentLink {
    id: string;
    title: string;
    amount: number;
    description: string;
    visits: number;
    sales: number;
    target_account_id?: string;
    created_at: string;
    status: 'active' | 'disabled';
}

const BANK_THEMES: Record<string, { logo: string }> = {
    'Nequi': { logo: '🟣' },
    'Bancolombia': { logo: '🖤' },
    'Davivienda': { logo: '🏠' },
    'BBVA': { logo: '💙' },
    'Ualá': { logo: '🦄' },
    'Otro': { logo: '🏦' }
};

const MOCK_LINKS: PaymentLink[] = [
    { id: 'lnk_1', title: 'Camiseta Pima Special', amount: 45000, description: 'Colección Verano 2024', visits: 124, sales: 8, created_at: new Date().toISOString(), status: 'active' }
];

export default function PaymentLinksPage() {
    const { token, isAuthenticated } = useAuth();
    const [links, setLinks] = useState<PaymentLink[]>(MOCK_LINKS);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [newLink, setNewLink] = useState({
        title: '', amount: '', description: '', selectedAccountId: ''
    });

    // Estados para el dropdown personalizado
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    // Cargar cuentas bancarias
    const fetchBankAccounts = useCallback(async () => {
        if (!isAuthenticated || !token) return;
        try {
            const response = await fetch('http://localhost:8000/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const userData = await response.json();
                const accounts = userData.bank_accounts || [];
                setBankAccounts(accounts);
                const active = accounts.find((a: BankAccount) => a.isActive);
                if (active) setNewLink(prev => ({ ...prev, selectedAccountId: active.id }));
            }
        } catch (err) { console.error(err); }
    }, [isAuthenticated, token]);

    useEffect(() => { fetchBankAccounts(); }, [fetchBankAccounts]);

    // Cierre de dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) setIsAccountOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatNumberDisplay = (value: number) => new Intl.NumberFormat('de-DE').format(value);
    const formatCurrency = (amount: number) => `$${formatNumberDisplay(amount)}`;
    const formatNumberInput = (value: string) => {
        if (!value) return '';
        const number = value.replace(/\D/g, '');
        return new Intl.NumberFormat('de-DE').format(parseInt(number));
    };
    const unformatNumberInput = (value: string) => value.replace(/\D/g, '');

    const handleCreateLink = () => {
        if (!newLink.title || !newLink.amount || !newLink.selectedAccountId) return alert("Completa todos los campos.");
        
        const created: PaymentLink = {
            id: `lnk_${Math.random().toString(36).substr(2, 9)}`,
            title: newLink.title,
            amount: parseFloat(newLink.amount),
            description: newLink.description,
            target_account_id: newLink.selectedAccountId,
            visits: 0,
            sales: 0,
            created_at: new Date().toISOString(),
            status: 'active'
        };

        setLinks([created, ...links]);
        setIsModalOpen(false);
        setNewLink({ 
            title: '', amount: '', description: '', 
            selectedAccountId: bankAccounts.find(a => a.isActive)?.id || '' 
        });
    };

    const copyToClipboard = (id: string) => {
        const url = `${window.location.origin}/pay/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const selectedAccount = bankAccounts.find(a => a.id === newLink.selectedAccountId);

    return (
        <div className="max-w-6xl mx-auto pb-20 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Links de Pago</h1>
                    <p className="text-gray-500 mt-2 font-medium">Crea links rápidos para vender por WhatsApp y Redes Sociales.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all">+ Nuevo Link</button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {links.map((link) => (
                    <div key={link.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all group flex flex-col lg:flex-row lg:items-center gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">{link.title}</h3>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-md tracking-widest border border-emerald-100">Activo</span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium mb-4">{link.description || 'Sin descripción adicional'}</p>
                            <div className="flex gap-6">
                                <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Monto</p><p className="text-base font-black text-gray-900">{formatCurrency(link.amount)}</p></div>
                                <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Destino</p><p className="text-sm font-bold text-gray-700 mt-1">{bankAccounts.find(a => a.id === link.target_account_id)?.bankName || 'Cuenta Principal'}</p></div>
                                <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ventas</p><p className="text-base font-black text-purple-600">{link.sales}</p></div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 min-w-[300px]">
                            <button onClick={() => copyToClipboard(link.id)} className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copiedId === link.id ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-gray-900 text-white hover:bg-black shadow-lg'}`}>{copiedId === link.id ? '¡Copiado!' : 'Copiar Link'} {copiedId !== link.id && <span>🔗</span>}</button>
                            <button className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400">Estadísticas</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Nuevo Link</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configura el cobro rápido</p></div>
                            <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl">✕</button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Producto / Concepto *</label>
                                <input type="text" placeholder="Ej: Camiseta Básica" value={newLink.title} onChange={(e) => setNewLink({...newLink, title: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-purple-500/5 rounded-2xl outline-none text-sm font-bold transition-all" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto a Cobrar *</label>
                                    <input type="text" placeholder="0" value={formatNumberInput(newLink.amount)} onChange={(e) => setNewLink({...newLink, amount: unformatNumberInput(e.target.value)})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white rounded-2xl outline-none text-sm font-black transition-all" />
                                </div>

                                {/* SELECTOR DE CUENTA DESPRENDIBLE */}
                                <div className="relative" ref={accountRef}>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cuenta de Depósito *</label>
                                    <button 
                                        onClick={() => setIsAccountOpen(!isAccountOpen)}
                                        className="w-full mt-2 p-4 bg-gray-50 border border-transparent hover:bg-white hover:border-purple-100 rounded-2xl text-sm font-bold text-gray-700 flex items-center justify-between transition-all"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span>{selectedAccount ? BANK_THEMES[selectedAccount.bankName]?.logo : '🏦'}</span>
                                            <span className="truncate">{selectedAccount ? selectedAccount.bankName : 'Seleccionar'}</span>
                                        </div>
                                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                    </button>

                                    {isAccountOpen && (
                                        <div className="absolute z-[120] top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {bankAccounts.length > 0 ? bankAccounts.map((acc) => (
                                                <button
                                                    key={acc.id}
                                                    onClick={() => { setNewLink({...newLink, selectedAccountId: acc.id}); setIsAccountOpen(false); }}
                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${newLink.selectedAccountId === acc.id ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{BANK_THEMES[acc.bankName]?.logo || '🏦'}</span>
                                                        <div className="text-left">
                                                            <p className="text-xs font-black">{acc.bankName}</p>
                                                            <p className="text-[9px] font-bold opacity-60">•••• {acc.accountNumber.slice(-4)}</p>
                                                        </div>
                                                    </div>
                                                    {newLink.selectedAccountId === acc.id && <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>}
                                                </button>
                                            )) : (
                                                <Link href="/dashboard/settings/billing" className="block p-4 text-center text-[10px] font-black uppercase text-purple-600 hover:bg-purple-50 rounded-xl">+ Vincular Cuenta</Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción corta (Opcional)</label>
                                <textarea rows={2} placeholder="Detalles visibles para el cliente..." value={newLink.description} onChange={(e) => setNewLink({...newLink, description: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white rounded-2xl outline-none text-sm font-medium transition-all" />
                            </div>
                        </div>

                        <div className="p-10 pt-0">
                            <button onClick={handleCreateLink} className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all">Activar Link de Pago</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}