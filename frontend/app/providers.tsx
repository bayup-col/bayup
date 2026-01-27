"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/context/toast-context";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Limpieza de URLs temporales colgadas
    if (typeof window !== 'undefined') {
        const originalRevoke = window.URL.revokeObjectURL;
        window.URL.revokeObjectURL = function(url) {
            if (url && url.startsWith('blob:')) {
                try { originalRevoke(url); } catch (e) {}
            }
        };
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
