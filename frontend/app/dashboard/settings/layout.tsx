"use client";

import { ReactNode } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  // Eliminamos la barra lateral secundaria (Taxes/Shipping) 
  // para usar únicamente la navegación principal del Dashboard.
  return (
    <div className="w-full">
      {children}
    </div>
  );
}