"use client";

import { useState } from 'react';
import { useToast } from '@/context/toast-context';
import { Settings, Shield, Globe, CreditCard, Bell, Save, Percent, Mail, Zap } from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [commission,    setCommission]    = useState('3');
  const [platformName,  setPlatformName]  = useState('Bayup');
  const [supportEmail,  setSupportEmail]  = useState('soporte@bayup.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifs,   setEmailNotifs]   = useState(true);
  const [autoSuspend,   setAutoSuspend]   = useState(false);
  const [trialDays,     setTrialDays]     = useState('14');

  const save = () => showToast('Configuración guardada ✓', 'success');

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`relative h-5 w-9 rounded-full transition-all duration-200 ${value ? 'bg-[#00f2ff]/60' : 'bg-white/10'}`}>
      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? 'left-4' : 'left-0.5'}`}/>
    </button>
  );

  const Field = ({ label, value, onChange, type='text', suffix }: any) => (
    <div className="flex items-center justify-between py-3.5 border-b border-white/[0.04]">
      <p className="text-[12px] text-white/50">{label}</p>
      <div className="flex items-center gap-2">
        {suffix && <span className="text-[10px] text-white/20">{suffix}</span>}
        <input value={value} onChange={e => onChange(e.target.value)} type={type}
          className="w-36 h-8 px-3 bg-white/5 border border-white/8 rounded-lg text-[12px] text-white/60 outline-none text-right focus:border-white/15 transition-all"/>
      </div>
    </div>
  );

  const sections = [
    {
      icon: <Globe size={15}/>, label: 'Plataforma', color: '#00f2ff',
      content: (
        <div>
          <Field label="Nombre de la plataforma" value={platformName} onChange={setPlatformName}/>
          <Field label="Email de soporte" value={supportEmail} onChange={setSupportEmail}/>
          <Field label="Días de prueba gratuita" value={trialDays} onChange={setTrialDays} type="number" suffix="días"/>
        </div>
      )
    },
    {
      icon: <CreditCard size={15}/>, label: 'Facturación', color: '#10b981',
      content: (
        <div>
          <Field label="Comisión Bayup" value={commission} onChange={setCommission} type="number" suffix="%"/>
          <div className="flex items-center justify-between py-3.5 border-b border-white/[0.04]">
            <p className="text-[12px] text-white/50">Suspensión automática por impago</p>
            <Toggle value={autoSuspend} onChange={setAutoSuspend}/>
          </div>
        </div>
      )
    },
    {
      icon: <Bell size={15}/>, label: 'Notificaciones', color: '#f59e0b',
      content: (
        <div>
          <div className="flex items-center justify-between py-3.5 border-b border-white/[0.04]">
            <p className="text-[12px] text-white/50">Notificaciones por email</p>
            <Toggle value={emailNotifs} onChange={setEmailNotifs}/>
          </div>
        </div>
      )
    },
    {
      icon: <Shield size={15}/>, label: 'Sistema', color: '#ef4444',
      content: (
        <div>
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-[12px] text-white/50">Modo mantenimiento</p>
              <p className="text-[9px] text-white/20 mt-0.5">Bloquea el acceso a todos los tenants</p>
            </div>
            <Toggle value={maintenanceMode} onChange={setMaintenanceMode}/>
          </div>
          {maintenanceMode && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/8 border border-red-500/15">
              <p className="text-[10px] text-red-400/70 font-bold">⚠ Modo mantenimiento activo — los usuarios no pueden acceder</p>
            </div>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 pb-12">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">Sistema global · Bayup</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Configuración</h1>
        </div>
        <button onClick={save}
          className="h-9 px-5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white font-bold text-[11px] flex items-center gap-2 transition-all">
          <Save size={13}/> Guardar cambios
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.map(s => (
          <div key={s.label} className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor:`${s.color}12`, color:s.color }}>
                {s.icon}
              </div>
              <p className="text-[11px] font-black text-white/60 uppercase tracking-wide">{s.label}</p>
            </div>
            <div className="px-5 py-1">{s.content}</div>
          </div>
        ))}
      </div>

      {/* Info técnica */}
      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Información del sistema</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:'Versión API',   value:'v4.2.1',     color:'#00f2ff' },
            { label:'Entorno',       value:'Producción', color:'#10b981' },
            { label:'Base de datos', value:'PostgreSQL',  color:'#7c3aed' },
            { label:'Uptime',        value:'99.97%',     color:'#f59e0b' },
          ].map(i => (
            <div key={i.label} className="rounded-xl border border-white/5 bg-white/[0.015] p-3">
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1.5">{i.label}</p>
              <p className="text-[13px] font-black" style={{ color:i.color }}>{i.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
