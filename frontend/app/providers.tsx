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

  if (!publishableKey && process.env.NODE_ENV === 'production') {
    // Durante el build en CI, Clerk puede fallar si no hay una llave válida.
    // Solo renderizamos el resto de proveedores si falta la llave para evitar romper el build estático.
    return (
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
  }

  return (
    <ClerkProvider localization={esES} publishableKey={publishableKey || "pk_test_YmF5dXBfdGVzdF9rZXlfZm9yX2J1aWxkX3B1cnBvc2VzX29ubHkK"}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}
