"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    console.log("🚀 [Paso 1] Iniciando intento de login...");

    try {
      // Auto-detección de la URL del servidor
      const apiHost = window.location.hostname;
      const apiBase = `http://${apiHost}:8000`;
      
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password: password }),
      });

      console.log(`📥 [Paso 2] Respuesta de login desde ${apiBase} recibida. Status:`, response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Credenciales incorrectas');
      }

      const data = await response.json();
      console.log("🔑 [Paso 3] Token obtenido con éxito.");
      
      // Obtener info del usuario directamente con fetch
      const userResponse = await fetch(`${apiBase}/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });

      console.log("👤 [Paso 4] Respuesta de perfil recibida. Status:", userResponse.status);

      let userRole = 'admin_tienda';
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userRole = userData.role || 'admin_tienda';
        console.log("✅ [Paso 5] Datos de usuario cargados. Rol:", userRole);
      }
      
      // Guardar y Redirigir
      login(data.access_token, email, userRole);
      console.log("🚚 [Paso 6] Redirigiendo al dashboard...");
      
      if (userRole === 'super_admin') {
        router.push('/dashboard/super-admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error("❌ [ERROR] Fallo en el login:", err);
      setError(err.message || 'Error de conexión con el servidor. ¿Está el backend encendido?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-10 space-y-8 bg-white rounded-[3rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="h-24 w-auto flex items-center justify-center mx-auto mb-6">
            <img src="/assets/Logo Bayup sin fondo negra.png" alt="Bayup Logo" className="h-full object-contain" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">¡Hola de nuevo!</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Ingresa a tu centro operativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="tu@email.com"
              className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading ? 'Verificando...' : 'Entrar al Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
