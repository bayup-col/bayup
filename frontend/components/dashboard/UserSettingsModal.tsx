"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User, 
  ShieldCheck, 
  Settings, 
  Sparkles, 
  Camera, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Globe2, 
  Moon, 
  Sun, 
  ArrowUpRight,
  LogOut,
  Save,
  Key,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { userEmail, userRole, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguridad' | 'preferencias'>('perfil');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passError, setPassError] = useState('');

  // Helper to get clean API URL
  const getApiUrl = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  };

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: userEmail || '',
    phone: '',
    role: userRole || 'Admin',
  });

  useEffect(() => {
    if (isOpen && token) {
      fetchUserData();
    }
    if (!isOpen) {
        setIsChangingPassword(false);
        setShowPasswords(false);
        setPasswords({ current: '', new: '', confirm: '' });
        setPassError('');
    }
  }, [isOpen, token]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          fullName: data.full_name || '',
          email: data.email || userEmail || '',
          phone: data.phone || '',
          role: data.role || userRole || 'Admin',
        });
      }
    } catch (e) { console.error("Error fetching user data", e); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/admin/update-profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          phone: formData.phone
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        // Dispatch event for UI updates (like in Header/Sidebar)
        window.dispatchEvent(new CustomEvent('bayup_name_update', { detail: formData.fullName }));
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Error saving profile", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
        setPassError('Las nuevas contraseñas no coinciden');
        return;
    }
    if (passwords.new.length < 6) {
        setPassError('La nueva contraseña debe tener al menos 6 caracteres');
        return;
    }

    setIsSaving(true);
    setPassError('');

    try {
        const res = await fetch(`${getApiUrl()}/admin/change-password`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: passwords.current,
                new_password: passwords.new,
                confirm_password: passwords.confirm
            })
        });

        const data = await res.json();
        if (res.ok) {
            setSaveSuccess(true);
            setIsChangingPassword(false);
            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            // Handle 404 specifically if it happens
            if (res.status === 404) {
              setPassError('Endpoint no encontrado (404). Verifica el backend.');
            } else {
              setPassError(data.detail || 'Error al cambiar la contraseña');
            }
        }
    } catch (e) {
        setPassError('Error de conexión con el servidor');
    } finally {
        setIsSaving(false);
    }
  };

  const menuItems = [
    { id: 'perfil', label: 'Mi Perfil', icon: <User size={18}/>, subtitle: 'Datos Personales', disabled: false },
    { id: 'seguridad', label: 'Seguridad', icon: <Lock size={18}/>, subtitle: 'Acceso y Protección', disabled: false },
    { id: 'preferencias', label: 'Preferencias', icon: <Settings size={18}/>, subtitle: 'Configuración App', disabled: true },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
        />

        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white/90 backdrop-blur-2xl w-full max-w-5xl h-[80vh] rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/50 flex flex-col md:flex-row"
        >
            {/* Sidebar Táctico */}
            <div className="w-full md:w-72 bg-gray-50/50 border-r border-gray-100 p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                <div>
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="h-10 w-10 bg-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg shadow-[#004d4d]/20">
                            <User className="text-[#00f2ff]" size={20}/>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Configuración</h3>
                            <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-tighter">Cuenta Bayup</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => !item.disabled && setActiveTab(item.id as any)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-white shadow-xl shadow-gray-200/50 translate-x-1' : item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/50 hover:translate-x-1'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-[#004d4d] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {item.icon}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest block transition-colors ${activeTab === item.id ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>{item.label}</span>
                                            {item.disabled && (
                                                <span className="text-[6px] font-black bg-[#00F2FF]/20 text-[#004d4d] px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Próximamente</span>
                                            )}
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">{item.subtitle}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-10">
                    <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 p-4 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-2xl transition-all group"
                    >
                        <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <LogOut size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            {/* Area de Contenido */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white/40">
                {/* Cabecera */}
                <div className="p-8 border-b border-gray-50 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#004d4d]/5 flex items-center justify-center text-[#004d4d]">
                            {menuItems.find(m => m.id === activeTab)?.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">
                                {menuItems.find(m => m.id === activeTab)?.label}
                            </h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">
                                {menuItems.find(m => m.id === activeTab)?.subtitle}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all shadow-sm"
                    >
                        <X size={20}/>
                    </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'perfil' && (
                            <motion.div 
                                key="perfil"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="max-w-2xl space-y-8"
                            >
                                <div className="flex items-center gap-8">
                                    <div className="relative group">
                                        <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 group-hover:border-[#00F2FF] group-hover:text-[#00F2FF] transition-all cursor-pointer overflow-hidden shadow-inner">
                                            <Camera size={32} />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Cambiar Foto</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 tracking-tight">{formData.fullName || 'Usuario Bayup'}</h4>
                                        <p className="text-xs text-gray-400 font-medium">Gestiona tu identidad personal en la plataforma.</p>
                                        <div className="mt-2 inline-block px-2 py-0.5 bg-[#00F2FF]/10 rounded-full border border-[#00F2FF]/20">
                                            <span className="text-[8px] font-black text-[#004d4d] uppercase tracking-widest">{formData.role}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] ml-2">Nombre Completo</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                                placeholder="Ej. Juan Pérez"
                                                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#004d4d] transition-all shadow-sm"
                                            />
                                            <User size={14} className="absolute right-5 top-4 text-gray-300" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] ml-2">WhatsApp / Teléfono</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                placeholder="+57 300 000 0000"
                                                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#004d4d] transition-all shadow-sm"
                                            />
                                            <Phone size={14} className="absolute right-5 top-4 text-gray-300" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] ml-2">Correo Electrónico (Acceso)</label>
                                        <div className="relative">
                                            <input 
                                                type="email" 
                                                value={formData.email}
                                                readOnly
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold text-gray-400 cursor-not-allowed shadow-inner"
                                            />
                                            <Mail size={14} className="absolute right-5 top-4 text-gray-300" />
                                        </div>
                                        <p className="text-[8px] text-gray-400 font-medium ml-2">El correo es tu identidad única y no puede cambiarse manualmente.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'seguridad' && (
                            <motion.div 
                                key="seguridad"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="max-w-2xl space-y-8"
                            >
                                <div className="p-8 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden group transition-all duration-500">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><ShieldCheck size={120} /></div>
                                    <div className="relative z-10">
                                        <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <ShieldCheck size={14}/> Protección de Cuenta
                                        </h4>
                                        <p className="text-sm font-medium leading-relaxed opacity-80 italic">
                                            "La seguridad de tu negocio comienza con la protección de tu acceso maestro. Mantén tus credenciales actualizadas."
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {!isChangingPassword ? (
                                        <button 
                                            onClick={() => setIsChangingPassword(true)}
                                            className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl hover:border-[#004d4d] transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#004d4d] transition-colors">
                                                    <Key size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Cambiar Contraseña</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Último cambio hace 3 meses</p>
                                                </div>
                                            </div>
                                            <ArrowUpRight size={16} className="text-gray-300 group-hover:text-[#004d4d]" />
                                        </button>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-8 bg-white border border-[#004d4d]/20 rounded-[2.5rem] shadow-xl space-y-6"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest">Nueva Contraseña</h4>
                                                <button onClick={() => setIsChangingPassword(false)} className="text-[8px] font-black text-rose-500 uppercase tracking-tighter hover:underline">Cancelar</button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña Actual</label>
                                                    <div className="relative">
                                                        <input 
                                                            type={showPasswords ? "text" : "password"} 
                                                            value={passwords.current}
                                                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-[#004d4d] transition-all"
                                                            placeholder="••••••••"
                                                        />
                                                        <button 
                                                            onClick={() => setShowPasswords(!showPasswords)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                                                        >
                                                            {showPasswords ? <EyeOff size={16}/> : <Eye size={16}/>}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                                        <div className="relative">
                                                            <input 
                                                                type={showPasswords ? "text" : "password"} 
                                                                value={passwords.new}
                                                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-[#004d4d] transition-all"
                                                                placeholder="Mín. 6 caracteres"
                                                            />
                                                            <button 
                                                                onClick={() => setShowPasswords(!showPasswords)}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                                                            >
                                                                {showPasswords ? <EyeOff size={16}/> : <Eye size={16}/>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Nueva</label>
                                                        <div className="relative">
                                                            <input 
                                                                type={showPasswords ? "text" : "password"} 
                                                                value={passwords.confirm}
                                                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-[#004d4d] transition-all"
                                                                placeholder="Repite la clave"
                                                            />
                                                            <button 
                                                                onClick={() => setShowPasswords(!showPasswords)}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                                                            >
                                                                {showPasswords ? <EyeOff size={16}/> : <Eye size={16}/>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {passError && (
                                                    <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                        <AlertCircle size={12} />
                                                        <span className="text-[9px] font-bold uppercase">{passError}</span>
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={handlePasswordChange}
                                                    disabled={isSaving}
                                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isSaving ? 'Procesando...' : <>Actualizar Credenciales <ShieldCheck size={14}/></>}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <button className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl opacity-60 cursor-not-allowed transition-all group relative overflow-hidden">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Smartphone size={18} />
                                            </div>
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Autenticación en Dos Pasos (2FA)</p>
                                                    <span className="text-[6px] font-black bg-[#00F2FF]/20 text-[#004d4d] px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Próximamente</span>
                                                </div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Capa de Seguridad Extra</p>
                                            </div>
                                        </div>
                                        <Lock size={16} className="text-gray-300" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'preferencias' && (
                            <motion.div 
                                key="preferencias"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="max-w-2xl space-y-8 relative"
                            >
                                {/* Overlay de Próximamente */}
                                <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-white/10 rounded-[3rem] flex flex-col items-center justify-center border border-white/40 shadow-2xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#004d4d]/5 to-transparent pointer-events-none"></div>
                                    <motion.div 
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative p-10 bg-white/90 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white flex flex-col items-center text-center max-w-sm"
                                    >
                                        <div className="h-20 w-20 bg-[#004d4d] rounded-[2rem] flex items-center justify-center text-[#00f2ff] shadow-2xl shadow-[#004d4d]/20 mb-6">
                                            <Sparkles size={40} className="animate-pulse" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-2">Próximamente</h3>
                                        <div className="h-1 w-12 bg-[#00f2ff] rounded-full mb-6"></div>
                                        <p className="text-sm font-bold text-gray-800 leading-relaxed italic mb-8">
                                            "Estamos afinando los algoritmos de personalización para que Bayup se adapte exactamente a tu ritmo de trabajo."
                                        </p>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-[#00f2ff] rounded-full">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-ping"></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Bayt AI Engine v3.0</span>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="opacity-40 grayscale pointer-events-none">
                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                            <Moon size={12} className="text-gray-900"/> Personalización Visual
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'bg-[#004d4d]/5 border-[#004d4d] text-[#004d4d]' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                            >
                                                <Sun size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Modo Claro</span>
                                            </button>
                                            <button 
                                                className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'bg-[#004d4d]/5 border-[#004d4d] text-[#004d4d]' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                            >
                                                <Moon size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Modo Oscuro</span>
                                            </button>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                            <Bell size={12} className="text-gray-900"/> Notificaciones Bayt
                                        </h4>
                                        <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden">
                                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Phone size={18}/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Alertas WhatsApp</p>
                                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Ventas y Pedidos</p>
                                                    </div>
                                                </div>
                                                <div className="h-6 w-12 bg-emerald-500 rounded-full p-1 cursor-pointer flex justify-end">
                                                    <div className="h-4 w-4 bg-white rounded-full shadow-sm"></div>
                                                </div>
                                            </div>
                                            <div className="p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500"><Mail size={18}/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Resúmenes Email</p>
                                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Reportes Diarios de ROI</p>
                                                    </div>
                                                </div>
                                                <div className="h-6 w-12 bg-gray-200 rounded-full p-1 cursor-pointer flex justify-start">
                                                    <div className="h-4 w-4 bg-white rounded-full shadow-sm"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer de Acción */}
                <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md relative z-10">
                    <div className="flex items-center gap-2">
                        {saveSuccess ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-emerald-500">
                                <CheckCircle2 size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Cambios guardados con éxito</span>
                            </motion.div>
                        ) : (
                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                                Bayup Settings Engine • v2.0
                            </p>
                        )}
                    </div>
                    
                    {activeTab === 'perfil' && (
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-10 py-4 ${isSaving ? 'bg-gray-400' : 'bg-[#004d4d] hover:bg-black'} text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 active:scale-95`}
                        >
                            {isSaving ? 'Guardando...' : <>Guardar Cambios <Save size={16}/></>}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    </div>
  );
}
