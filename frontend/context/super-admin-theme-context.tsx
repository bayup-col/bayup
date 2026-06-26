"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Tema visual exclusivo de la zona Super-Admin (/dashboard/super-admin/**).
 *
 * Independiente por completo de `theme-context.tsx` (que está fijado a 'light'
 * para el dashboard tenant-facing y no debe tocarse). Aquí el default es
 * 'dark' — el look "centro de comando" que ya existe — y el usuario puede
 * alternar a 'light' con un botón en el header. La preferencia se persiste
 * en localStorage bajo una key propia para no interferir con el tema general.
 */

type SuperAdminTheme = 'dark' | 'light';

const STORAGE_KEY = 'bayup-superadmin-theme';

interface SuperAdminThemeContextType {
  saTheme: SuperAdminTheme;
  toggleSaTheme: () => void;
}

const SuperAdminThemeContext = createContext<SuperAdminThemeContextType | undefined>(undefined);

export function SuperAdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [saTheme, setSaTheme] = useState<SuperAdminTheme>('dark');

  // Lee la preferencia guardada al montar (default 'dark' si no hay nada o el valor es inválido)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') setSaTheme(stored);
  }, []);

  const toggleSaTheme = () => {
    const next: SuperAdminTheme = saTheme === 'dark' ? 'light' : 'dark';
    setSaTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <SuperAdminThemeContext.Provider value={{ saTheme, toggleSaTheme }}>
      {children}
    </SuperAdminThemeContext.Provider>
  );
}

export function useSuperAdminTheme() {
  const context = useContext(SuperAdminThemeContext);
  if (context === undefined) {
    throw new Error('useSuperAdminTheme must be used within a SuperAdminThemeProvider');
  }
  return context;
}
