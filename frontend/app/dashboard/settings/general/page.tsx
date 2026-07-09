"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Mail, Phone, Globe, MapPin, Clock, Camera, Loader2,
  ShieldCheck, Zap, X, ChevronDown, ExternalLink, Save,
  Building2, Hash, User, FileText, Package, Sparkles,
  Activity, ShoppingBag, Smartphone, Check, AlertCircle,
  Instagram, Facebook, Send, ArrowUpRight, Edit3, Eye,
  Wallet, CreditCard, Plus, Trash2, BadgeCheck
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';

// ── TIKTOK ICON ─────────────────────────────────────────────────────────────
const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-.98v6.68c0 5.23-4.03 9.35-9.25 9.23-5.5-.12-9.33-5.14-8.34-10.42.57-3.03 3.14-5.43 6.2-5.86 1.13-.08 2.27.02 3.35.3v4.07c-1.14-.46-2.47-.5-3.6-.07-1.9.72-3.08 2.85-2.6 4.83.4 1.62 1.93 2.78 3.6 2.73 2.33-.06 3.89-2.33 3.89-4.59V0h4.39c-.15.02-.3.01-.45.02z"/>
  </svg>
);

// ── TIPOS ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'Moda & Accesorios',  label: 'Moda & Accesorios',   icon: <ShoppingBag size={14}/> },
  { id: 'Calzado',            label: 'Calzado',              icon: <Package size={14}/> },
  { id: 'Tecnología',         label: 'Tecnología',           icon: <Smartphone size={14}/> },
  { id: 'Hogar',              label: 'Hogar',                icon: <Store size={14}/> },
  { id: 'Belleza',            label: 'Belleza',              icon: <Sparkles size={14}/> },
  { id: 'Mascotas',           label: 'Mascotas',             icon: <Activity size={14}/> },
  { id: 'Deportes',           label: 'Deportes',             icon: <Activity size={14}/> },
  { id: 'Alimentos',          label: 'Alimentos',            icon: <Package size={14}/> },
  { id: 'Joyería',            label: 'Joyería',              icon: <Sparkles size={14}/> },
  { id: 'Arte & Diseño',      label: 'Arte & Diseño',        icon: <Edit3 size={14}/> },
];

const TAX_REGIMES = ['Simplificado', 'Común (Responsable de IVA)', 'Gran Contribuyente', 'Persona Natural'];

const SCHEDULE_DAYS = ['Lun – Vie', 'Lun – Sáb', 'Todos los días', 'Fines de semana', 'Personalizado'];

// ── FIELD COMPONENT ──────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400 block">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-gray-400 italic pl-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', prefix, icon, error }: any) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 [&_svg]:w-3.5 [&_svg]:h-3.5">{icon}</span>}
      {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-10 ${icon ? 'pl-9' : prefix ? 'pl-28' : 'pl-4'} pr-4 rounded-2xl border text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors
          ${error ? 'border-rose-200 bg-rose-50/30 focus:border-rose-400' : 'border-gray-200 bg-white focus:border-[#004d4d]/50'}`}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: any) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#004d4d]/50 transition-colors resize-none"
    />
  );
}

// ── SELECT DROPDOWN ──────────────────────────────────────────────────────────
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string; icon?: React.ReactNode }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full h-10 flex items-center gap-2 px-4 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#004d4d]/40 transition-colors focus:outline-none">
        {selected?.icon && <span className="text-gray-400 [&_svg]:w-3.5 [&_svg]:h-3.5">{selected.icon}</span>}
        <span className="flex-1 text-left truncate">{selected?.label || 'Seleccionar…'}</span>
        <ChevronDown size={13} className={`text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute left-0 right-0 top-12 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
            {options.map(opt => (
              <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-left transition-colors ${value === opt.id ? 'bg-[#004d4d]/5 text-[#004d4d] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                {opt.icon && <span className="[&_svg]:w-3.5 [&_svg]:h-3.5 text-gray-400">{opt.icon}</span>}
                {opt.label}
                {value === opt.id && <Check size={11} className="ml-auto text-[#004d4d]"/>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ title, sub, icon, children, accent }: any) {
  const colors: any = {
    teal:   'bg-[#004d4d]/10 text-[#004d4d]',
    blue:   'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber:  'bg-amber-50 text-amber-600',
    emerald:'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className={`h-9 w-9 rounded-2xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4 ${colors[accent] || colors.teal}`}>{icon}</div>
        <div>
          <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{title}</h3>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function GeneralSettings() {
  const { token, updateUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading]   = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'identidad' | 'contacto' | 'fiscal' | 'canales' | 'pagos'>('identidad');

  // Cuentas bancarias
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [newAccount, setNewAccount] = useState({ bank: '', account_type: 'Ahorros', account_number: '', holder_name: '', holder_id: '' });
  const [addingAccount, setAddingAccount] = useState(false);

  // Datos de identidad
  const [identity, setIdentity] = useState({
    name:     '',
    category: 'Moda & Accesorios',
    story:    '',
    logo:     null as string | null,
    shop_slug: '',
  });

  // Datos de contacto
  const [contact, setContact] = useState({
    email:   '',
    phone:   '',
    address: '',
    city:    '',
    country: 'Colombia',
    hours:   'Lun – Vie: 8:00am – 6:00pm',
    website: '',
  });

  // Datos fiscales
  const [fiscal, setFiscal] = useState({
    nit:        '',
    tax_regime: 'Simplificado',
    legal_rep:  '',
  });

  // Redes sociales
  const [social, setSocial] = useState({
    instagram: '',
    facebook:  '',
    tiktok:    '',
  });

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedDays,    setSchedDays]    = useState('Lun – Vie');
  const [schedOpen,    setSchedOpen2]   = useState('08:00');
  const [schedClose,   setSchedClose]   = useState('18:00');

  // ── CARGA INICIAL ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    apiRequest<any>('/auth/me', { token })
      .then(d => {
        if (!d) return;
        setIdentity({
          name:      d.full_name || '',
          category:  d.category  || 'Moda & Accesorios',
          story:     d.story     || '',
          logo:      d.logo_url  || null,
          shop_slug: d.shop_slug || '',
        });
        setContact({
          email:   d.email         || '',
          phone:   d.phone         || '',
          address: d.address       || '',
          city:    d.customer_city || '',
          country: d.country       || 'Colombia',
          hours:   d.hours         || 'Lun – Vie: 8:00am – 6:00pm',
          website: d.website       || '',
        });
        setFiscal({
          nit:        d.nit        || '',
          tax_regime: d.tax_regime || 'Simplificado',
          legal_rep:  d.legal_rep  || '',
        });
        if (d.social_links) setSocial(prev => ({ ...prev, ...d.social_links }));
        if (d.bank_accounts?.length) setBankAccounts(d.bank_accounts);
      })
      .catch(() => {
        const cached = localStorage.getItem('bayup_company_profile');
        if (cached) {
          try {
            const p = JSON.parse(cached);
            setIdentity(prev => ({ ...prev, name: p.full_name || '', logo: p.logo_url || null, shop_slug: p.shop_slug || '', category: p.category || prev.category, story: p.story || '' }));
            setContact(prev => ({ ...prev, email: p.email || '', phone: p.phone || '', address: p.address || '', city: p.customer_city || '', country: p.country || 'Colombia', hours: p.hours || prev.hours }));
            setFiscal(prev => ({ ...prev, nit: p.nit || '', tax_regime: p.tax_regime || 'Simplificado' }));
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  // ── GUARDAR ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        full_name:     identity.name,
        logo_url:      identity.logo,
        category:      identity.category,
        story:         identity.story,
        shop_slug:     identity.shop_slug,
        email:         contact.email,
        phone:         contact.phone,
        address:       contact.address,
        customer_city: contact.city,
        country:       contact.country,
        hours:         contact.hours,
        website:       contact.website,
        nit:           fiscal.nit,
        tax_regime:    fiscal.tax_regime,
        legal_rep:     fiscal.legal_rep,
        social_links:  social,
      };

      await apiRequest('/admin/update-profile', { method: 'PUT', token, body: JSON.stringify(payload) });

      updateUser({ name: identity.name, slug: identity.shop_slug, logo: identity.logo || '', ...payload } as any);

      // Caché + evento tiempo real
      localStorage.setItem('bayup_company_profile', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('bayup_company_updated', { detail: payload }));

      showToast('¡Configuración guardada y publicada!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error al guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── UPLOAD LOGO ────────────────────────────────────────────────────────────
  const handleLogoUpload = async (file: File) => {
    if (!token) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiRequest<any>('/admin/upload-image', { method: 'POST', token, body: formData });
      if (data.url) {
        setIdentity(p => ({ ...p, logo: data.url }));
        updateUser({ logo: data.url });
        showToast('Logo actualizado', 'success');
      }
    } catch { showToast('Error al subir imagen', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── HORARIO ────────────────────────────────────────────────────────────────
  const applySchedule = () => {
    const hours = `${schedDays}: ${schedOpen} – ${schedClose}`;
    setContact(p => ({ ...p, hours }));
    setScheduleOpen(false);
  };

  const saveBankAccount = async () => {
    if (!newAccount.bank || !newAccount.account_number || !newAccount.holder_name) return;
    const updated = [...bankAccounts, { ...newAccount, id: Date.now().toString() }];
    try {
      await apiRequest('/admin/update-profile', { method: 'PUT', token, body: JSON.stringify({ bank_accounts: updated }) });
      setBankAccounts(updated);
      setNewAccount({ bank: '', account_type: 'Ahorros', account_number: '', holder_name: '', holder_id: '' });
      setAddingAccount(false);
      showToast('Cuenta bancaria guardada', 'success');
    } catch { showToast('Error al guardar cuenta', 'error'); }
  };

  const removeAccount = async (id: string) => {
    const updated = bankAccounts.filter(a => a.id !== id);
    try {
      await apiRequest('/admin/update-profile', { method: 'PUT', token, body: JSON.stringify({ bank_accounts: updated }) });
      setBankAccounts(updated);
      showToast('Cuenta eliminada', 'success');
    } catch { showToast('Error al eliminar', 'error'); }
  };

  const tabs = [
    { id: 'identidad', label: 'Identidad',  icon: <Store size={13}/> },
    { id: 'contacto',  label: 'Contacto',   icon: <Phone size={13}/> },
    { id: 'fiscal',    label: 'Fiscal',     icon: <ShieldCheck size={13}/> },
    { id: 'canales',   label: 'Redes',      icon: <Globe size={13}/> },
    { id: 'pagos',     label: 'Pagos',      icon: <Wallet size={13}/> },
  ] as const;

  const validateEmail = (e: string) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePhone = (p: string) => !p || (p.length === 10 && /^\d+$/.test(p));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-[#004d4d]" size={32}/>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">

      {/* ══════════ MOBILE HERO + TABS (solo < sm) ══════════ */}
      <div className="block sm:hidden -mx-3 space-y-3 pt-2">

        {/* Hero card */}
        <div className="mx-3 rounded-3xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg,#001a1a 0%,#003333 50%,#005252 100%)' }}>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(0,242,255,0.12),transparent 70%)' }}/>
          <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(0,178,189,0.08),transparent 70%)' }}/>

          <div className="flex items-start gap-4 relative z-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-2xl bg-gray-800 border-2 border-white/10 overflow-hidden flex items-center justify-center text-white text-xl font-black shadow-xl">
                {identity.logo ? <img src={identity.logo} className="w-full h-full object-cover" alt="logo"/> : identity.name.charAt(0) || '?'}
              </div>
              <label htmlFor="logo-upload-mob" className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#004d4d] rounded-lg flex items-center justify-center cursor-pointer active:bg-[#00b2bd] transition-colors shadow-lg">
                {isSaving ? <Loader2 size={10} className="animate-spin text-white"/> : <Camera size={10} className="text-white"/>}
              </label>
              <input id="logo-upload-mob" type="file" hidden accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}/>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f2ff]/70">Config Tienda</p>
              </div>
              <h2 className="text-[18px] font-black text-white truncate leading-tight">{identity.name || 'Tu empresa'}</h2>
              <p className="text-[9px] font-bold tracking-widest text-white/35 uppercase mt-0.5">{identity.category}</p>
              {identity.shop_slug && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[8px] text-[#00f2ff]/50 font-mono truncate">bayup.com.co/shop/{identity.shop_slug}</span>
                  <button onClick={() => window.open(`/shop/${identity.shop_slug}`, '_blank')} className="text-[#00f2ff]/50 shrink-0">
                    <ExternalLink size={8}/>
                  </button>
                </div>
              )}
            </div>
            {/* Status + Ver tienda */}
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-[8px] font-bold text-emerald-400 tracking-widest">ACTIVA</span>
              </div>
              <button onClick={() => identity.shop_slug && window.open(`/shop/${identity.shop_slug}`, '_blank')}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 active:bg-white/10 transition-colors">
                <Eye size={9} className="text-white/40"/>
                <span className="text-[8px] text-white/40 font-semibold">Ver tienda</span>
              </button>
            </div>
          </div>

          {/* Guardar */}
          <button onClick={handleSave} disabled={isSaving}
            className="w-full mt-4 h-11 flex items-center justify-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#004d4d 0%,#007a7a 50%,#00b2bd 100%)' }}>
            {isSaving ? <Loader2 size={12} className="animate-spin text-white"/> : <ShieldCheck size={12} className="text-[#00f2ff]"/>}
            <span className="text-white">{isSaving ? 'Guardando…' : 'Guardar y publicar'}</span>
          </button>
        </div>

        {/* Tabs grid 3×2 */}
        <div className="mx-3 grid grid-cols-3 gap-1.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all ${
                activeTab === t.id ? 'bg-[#004d4d] text-white' : 'bg-white border border-gray-100 text-gray-400 shadow-sm'
              }`}>
              <span className={activeTab === t.id ? 'text-white' : 'text-gray-400'}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* ══════════ FIN MOBILE HERO ══════════ */}

      {/* ── HEADER (solo desktop) ── */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] uppercase mb-1 text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>
            Identidad corporativa
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">
            CONFIG TIENDA
          </h1>
          <p className="text-sm mt-1 text-gray-400">Información y configuración general de tu empresa</p>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className="h-10 flex items-center gap-2 px-5 rounded-2xl bg-[#004d4d] hover:bg-[#003838] disabled:opacity-60 text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm">
          {isSaving ? <Loader2 size={13} className="animate-spin"/> : <ShieldCheck size={13} className="text-[#00f2ff]"/>}
          {isSaving ? 'Guardando…' : 'Guardar y publicar'}
        </button>
      </div>

      {/* ── LOGO + PREVIEW CARD (solo desktop) ── */}
      <div className="hidden sm:flex bg-[#001a1a] rounded-3xl p-6 items-center gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#004d4d]/40 to-transparent pointer-events-none"/>
        {/* Avatar/logo */}
        <div className="relative shrink-0 z-10">
          <div className="h-20 w-20 rounded-[1.5rem] bg-gray-800 border-2 border-white/10 overflow-hidden flex items-center justify-center text-white text-2xl font-black shadow-xl">
            {identity.logo ? <img src={identity.logo} className="w-full h-full object-cover" alt="logo"/> : identity.name.charAt(0) || '?'}
          </div>
          <label htmlFor="logo-upload" className="absolute -bottom-1.5 -right-1.5 h-7 w-7 bg-[#004d4d] rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#00b2bd] transition-colors shadow-lg">
            {isSaving ? <Loader2 size={12} className="animate-spin text-white"/> : <Camera size={12} className="text-white"/>}
          </label>
          <input id="logo-upload" type="file" hidden accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}/>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0 z-10">
          <h2 className="text-xl font-black text-white truncate">{identity.name || 'Tu empresa'}</h2>
          <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mt-0.5">{identity.category}</p>
          {identity.shop_slug && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#00f2ff]/60 font-mono">bayup.com.co/shop/{identity.shop_slug}</span>
              <button onClick={() => window.open(`/shop/${identity.shop_slug}`, '_blank')} className="text-[#00f2ff]/60 hover:text-[#00f2ff] transition-colors">
                <ExternalLink size={10}/>
              </button>
            </div>
          )}
        </div>
        {/* Status */}
        <div className="shrink-0 z-10 flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[9px] font-bold text-emerald-400 tracking-widest">ACTIVA</span>
          </div>
          <button onClick={() => identity.shop_slug && window.open(`/shop/${identity.shop_slug}`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <Eye size={10} className="text-white/40"/>
            <span className="text-[9px] text-white/40 font-semibold">Ver tienda</span>
          </button>
        </div>
      </div>

      {/* ── TABS (solo desktop) ── */}
      <div className="hidden sm:flex p-1 rounded-2xl gap-1 w-fit bg-gray-100">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all duration-150 ${
              activeTab === t.id ? 'bg-[#004d4d] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: IDENTIDAD ══ */}
      <AnimatePresence mode="wait">
        {activeTab === 'identidad' && (
          <motion.div key="identidad" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Marca" sub="Nombre e identidad pública" icon={<Store/>} accent="teal">
                <Field label="Nombre de la empresa *">
                  <Input value={identity.name} onChange={(e: any) => setIdentity(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre de tu empresa" icon={<Building2/>}/>
                </Field>
                <Field label="Categoría / nicho de mercado">
                  <Select value={identity.category} onChange={v => setIdentity(p => ({ ...p, category: v }))}
                    options={CATEGORIES}/>
                </Field>
                <Field label="Link de tienda (slug)" hint="Solo letras minúsculas, números y guiones. Ej: mi-tienda">
                  <Input value={identity.shop_slug} onChange={(e: any) => setIdentity(p => ({ ...p, shop_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="mi-tienda" prefix="bayup.com.co/shop/"/>
                </Field>
              </SectionCard>

              <SectionCard title="Historia & Descripción" sub="Cuéntale a tus clientes quién eres" icon={<FileText/>} accent="blue">
                <Field label="Biografía corporativa" hint="Aparece en tu tienda online. Cuenta tu historia en 2-4 líneas.">
                  <Textarea value={identity.story} onChange={(e: any) => setIdentity(p => ({ ...p, story: e.target.value }))}
                    placeholder="Nacimos con la idea de democratizar el lujo..." rows={5}/>
                </Field>
                <div className="p-3 rounded-2xl bg-[#004d4d]/5 border border-[#004d4d]/10">
                  <p className="text-[10px] text-[#004d4d] font-medium leading-relaxed">
                    <span className="font-bold">💡 Tip Bayup:</span> Las tiendas con una historia real venden un <strong>22% más</strong>. Habla de tu propósito, no de tus productos.
                  </p>
                </div>
              </SectionCard>
            </div>
          </motion.div>
        )}

        {/* ══ TAB: CONTACTO ══ */}
        {activeTab === 'contacto' && (
          <motion.div key="contacto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Canales de atención" sub="Cómo te contactan tus clientes" icon={<Mail/>} accent="blue">
                <Field label="Email de soporte *">
                  <Input value={contact.email} onChange={(e: any) => setContact(p => ({ ...p, email: e.target.value }))}
                    type="email" placeholder="soporte@tutienda.com" icon={<Mail/>}
                    error={!validateEmail(contact.email)}/>
                  {!validateEmail(contact.email) && (
                    <p className="text-[9px] text-rose-500 flex items-center gap-1 mt-1"><AlertCircle size={10}/> Email inválido</p>
                  )}
                </Field>
                <Field label="Teléfono / WhatsApp">
                  <Input value={contact.phone} onChange={(e: any) => setContact(p => ({ ...p, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                    placeholder="3001234567" icon={<Phone/>}
                    error={!validatePhone(contact.phone)}/>
                  {!validatePhone(contact.phone) && contact.phone && (
                    <p className="text-[9px] text-rose-500 flex items-center gap-1 mt-1"><AlertCircle size={10}/> Debe tener 10 dígitos</p>
                  )}
                </Field>
                <Field label="Sitio web (opcional)">
                  <Input value={contact.website} onChange={(e: any) => setContact(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://tutienda.com" icon={<Globe/>}/>
                </Field>
              </SectionCard>

              <SectionCard title="Ubicación física" sub="Ciudad, dirección y horarios" icon={<MapPin/>} accent="violet">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ciudad">
                    <Input value={contact.city} onChange={(e: any) => setContact(p => ({ ...p, city: e.target.value }))}
                      placeholder="Bogotá" icon={<MapPin/>}/>
                  </Field>
                  <Field label="País">
                    <Input value={contact.country} onChange={(e: any) => setContact(p => ({ ...p, country: e.target.value }))}
                      placeholder="Colombia" icon={<Globe/>}/>
                  </Field>
                </div>
                <Field label="Dirección principal">
                  <Input value={contact.address} onChange={(e: any) => setContact(p => ({ ...p, address: e.target.value }))}
                    placeholder="Calle 100 #15-20" icon={<Building2/>}/>
                </Field>
                <Field label="Horario de atención">
                  <button onClick={() => setScheduleOpen(true)}
                    className="w-full h-10 flex items-center gap-3 px-4 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#004d4d]/40 transition-colors text-left">
                    <Clock size={14} className="text-gray-300 shrink-0"/>
                    <span className="flex-1 truncate">{contact.hours || 'Configurar horario…'}</span>
                    <Edit3 size={12} className="text-gray-300"/>
                  </button>
                </Field>
              </SectionCard>
            </div>
          </motion.div>
        )}

        {/* ══ TAB: FISCAL ══ */}
        {activeTab === 'fiscal' && (
          <motion.div key="fiscal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Información tributaria" sub="Datos para facturas y documentos legales" icon={<ShieldCheck/>} accent="emerald">
                <Field label="NIT / Identificación fiscal">
                  <Input value={fiscal.nit} onChange={(e: any) => setFiscal(p => ({ ...p, nit: e.target.value }))}
                    placeholder="900.000.000-1" icon={<Hash/>}/>
                </Field>
                <Field label="Régimen tributario">
                  <Select value={fiscal.tax_regime} onChange={v => setFiscal(p => ({ ...p, tax_regime: v }))}
                    options={TAX_REGIMES.map(r => ({ id: r, label: r }))}/>
                </Field>
                <Field label="Representante legal">
                  <Input value={fiscal.legal_rep} onChange={(e: any) => setFiscal(p => ({ ...p, legal_rep: e.target.value }))}
                    placeholder="Nombre completo" icon={<User/>}/>
                </Field>
              </SectionCard>

              {/* Vista previa de cómo aparece en factura */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <FileText size={14} className="text-[#004d4d]"/>
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Así aparece en tu factura</h3>
                </div>
                <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 space-y-1">
                  <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center text-white text-xs font-black mb-2">
                    {identity.logo
                      ? <img src={identity.logo} className="w-full h-full object-cover rounded-lg" alt="logo"/>
                      : identity.name.charAt(0) || '?'}
                  </div>
                  <p className="text-[11px] font-black text-gray-900">{identity.name || 'Nombre de empresa'}</p>
                  {fiscal.nit && <p className="text-[10px] text-gray-500">NIT: {fiscal.nit}</p>}
                  {contact.address && <p className="text-[10px] text-gray-500">{contact.address}</p>}
                  {contact.city && <p className="text-[10px] text-gray-500">{contact.city}{contact.country ? `, ${contact.country}` : ''}</p>}
                  {contact.email && <p className="text-[10px] text-gray-500">{contact.email}</p>}
                  {contact.phone && <p className="text-[10px] text-gray-500">Tel: {contact.phone}</p>}
                </div>
                <p className="text-[9px] text-gray-400 mt-3 italic">Esta información se actualiza automáticamente en todas tus facturas al guardar.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ TAB: CANALES ══ */}
        {activeTab === 'canales' && (
          <motion.div key="canales" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SectionCard title="Redes sociales" sub="Vincula tus canales digitales" icon={<Globe/>} accent="violet">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'instagram', label: 'Instagram', icon: <Instagram size={14}/>, placeholder: 'https://instagram.com/tutienda', color: 'text-pink-500' },
                  { key: 'facebook',  label: 'Facebook',  icon: <Facebook  size={14}/>, placeholder: 'https://facebook.com/tutienda', color: 'text-blue-600' },
                  { key: 'tiktok',    label: 'TikTok',    icon: <TikTokIcon size={14}/>, placeholder: 'https://tiktok.com/@tutienda', color: 'text-gray-900' },
                ].map(s => (
                  <Field key={s.key} label={s.label}>
                    <div className="flex items-center gap-2">
                      <div className={`h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 shrink-0 ${s.color}`}>
                        {s.icon}
                      </div>
                      <div className="flex-1">
                        <Input
                          value={(social as any)[s.key]}
                          onChange={(e: any) => setSocial(p => ({ ...p, [s.key]: e.target.value }))}
                          placeholder={s.placeholder}
                        />
                      </div>
                      {(social as any)[s.key] && (
                        <a href={(social as any)[s.key]} target="_blank" rel="noopener noreferrer"
                          className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 hover:text-[#004d4d] hover:border-[#004d4d]/30 transition-colors shrink-0">
                          <ArrowUpRight size={14}/>
                        </a>
                      )}
                    </div>
                  </Field>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100 p-3 rounded-2xl bg-[#004d4d]/5">
                <p className="text-[10px] text-[#004d4d] font-medium">
                  <span className="font-bold">💡 Tip:</span> Vincular tus redes sociales aumenta la confianza del cliente. Aparecen en el footer de tu tienda online.
                </p>
              </div>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL HORARIO ── */}
      <AnimatePresence>
        {scheduleOpen && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setScheduleOpen(false)}/>
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Horario de atención</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Configura tus días y horas de trabajo</p>
                  </div>
                  <button onClick={() => setScheduleOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                    <X size={15} className="text-gray-400"/>
                  </button>
                </div>
                <div className="space-y-4">
                  <Field label="Días de atención">
                    <Select value={schedDays} onChange={setSchedDays}
                      options={SCHEDULE_DAYS.map(d => ({ id: d, label: d, icon: <Clock size={13}/> }))}/>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Apertura">
                      <input type="time" value={schedOpen} onChange={e => setSchedOpen2(e.target.value)}
                        className="w-full h-10 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:border-[#004d4d]/50"/>
                    </Field>
                    <Field label="Cierre">
                      <input type="time" value={schedClose} onChange={e => setSchedClose(e.target.value)}
                        className="w-full h-10 px-4 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:border-[#004d4d]/50"/>
                    </Field>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#004d4d]/5 text-center">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Vista previa</p>
                    <p className="text-[12px] font-bold text-[#004d4d]">{schedDays}: {schedOpen} – {schedClose}</p>
                  </div>
                  <button onClick={applySchedule} className="w-full h-10 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
                    Confirmar horario
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ══ TAB: PAGOS ══ */}
      <AnimatePresence mode="wait">
        {activeTab === 'pagos' && (
          <motion.div key="pagos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 max-w-2xl">

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-[#004d4d]/5 border border-[#004d4d]/15 rounded-2xl">
              <BadgeCheck size={15} className="text-[#004d4d] mt-0.5 shrink-0"/>
              <p className="text-[11px] text-[#004d4d]/80 leading-relaxed">
                Bayup transfiere el valor neto de tus ventas web a la cuenta registrada aquí, cada <strong>martes y viernes</strong>.
                Asegúrate de que los datos sean correctos antes de guardar.
              </p>
            </div>

            {/* Cuentas existentes */}
            {bankAccounts.length > 0 && (
              <div className="space-y-3">
                {bankAccounts.map((acc: any) => (
                  <div key={acc.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-[#004d4d]/5 flex items-center justify-center shrink-0">
                      <CreditCard size={18} className="text-[#004d4d]"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-black text-gray-900">{acc.bank}</p>
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">{acc.account_type}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">···· {String(acc.account_number).slice(-4)} · {acc.holder_name}</p>
                      {acc.holder_id && <p className="text-[10px] text-gray-400">C.C. / NIT: {acc.holder_id}</p>}
                    </div>
                    <button onClick={() => removeAccount(acc.id)}
                      className="h-8 w-8 rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-400 hover:text-white flex items-center justify-center transition-all">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario nueva cuenta */}
            {addingAccount ? (
              <div className="bg-white border border-[#004d4d]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Nueva cuenta bancaria</p>
                  <button onClick={() => setAddingAccount(false)} className="h-7 w-7 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
                    <X size={13}/>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Banco *">
                    <Input value={newAccount.bank} onChange={(e: any) => setNewAccount(p => ({ ...p, bank: e.target.value }))}
                      placeholder="Ej: Bancolombia, Davivienda…" icon={<Building2/>}/>
                  </Field>
                  <Field label="Tipo de cuenta">
                    <select value={newAccount.account_type} onChange={e => setNewAccount(p => ({ ...p, account_type: e.target.value }))}
                      className="w-full h-10 px-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-[#004d4d]/50">
                      <option>Ahorros</option>
                      <option>Corriente</option>
                    </select>
                  </Field>
                  <Field label="Número de cuenta *">
                    <Input value={newAccount.account_number} onChange={(e: any) => setNewAccount(p => ({ ...p, account_number: e.target.value }))}
                      placeholder="0000000000" icon={<Hash/>}/>
                  </Field>
                  <Field label="Titular de la cuenta *">
                    <Input value={newAccount.holder_name} onChange={(e: any) => setNewAccount(p => ({ ...p, holder_name: e.target.value }))}
                      placeholder="Nombre completo" icon={<User/>}/>
                  </Field>
                  <Field label="Cédula / NIT del titular">
                    <Input value={newAccount.holder_id} onChange={(e: any) => setNewAccount(p => ({ ...p, holder_id: e.target.value }))}
                      placeholder="Número de identificación" icon={<Hash/>}/>
                  </Field>
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setAddingAccount(false)}
                    className="flex-1 h-10 rounded-2xl border border-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button onClick={saveBankAccount}
                    disabled={!newAccount.bank || !newAccount.account_number || !newAccount.holder_name}
                    className="flex-[2] h-10 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2 transition-all">
                    <Check size={13}/> Guardar cuenta
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingAccount(true)}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#004d4d]/40 text-gray-400 hover:text-[#004d4d] text-[10px] font-bold uppercase tracking-widest transition-all">
                <Plus size={14}/> Agregar cuenta bancaria
              </button>
            )}

            {bankAccounts.length === 0 && !addingAccount && (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Wallet size={22} className="text-gray-300"/>
                </div>
                <p className="text-sm font-bold text-gray-400">Sin cuenta bancaria registrada</p>
                <p className="text-[11px] text-gray-300 mt-1">Agrega tu cuenta para recibir los pagos de tus ventas</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
