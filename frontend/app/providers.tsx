"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/context/toast-context";
import { ThemeProvider } from "@/context/theme-context";
import { CartProvider } from "@/context/cart-context";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

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

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // VALIDACIÓN CRÍTICA: Solo activar Clerk si tenemos una llave de producción real.
  // Si la llave empieza por 'pk_test', la ignoramos en la web real para evitar bloqueos de CORS/Rate Limit.
  const isProdKey = publishableKey?.startsWith('pk_live_');
  const shouldLoadClerk = publishableKey && isProdKey;

  const content = (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );

  if (!shouldLoadClerk) {
    return content;
  }

  return (
    <ClerkProvider localization={esES} publishableKey={publishableKey}>
      {content}
    </ClerkProvider>
  );
}
