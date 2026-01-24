"use client";

import { ReactNode } from 'react';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  // El menú ya es renderizado por el layout padre (dashboard/layout.tsx)
  // Este layout solo envuelve el contenido
  return <>{children}</>;
}
