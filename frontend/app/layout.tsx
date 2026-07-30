import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

// Las tipografias de display del sistema de variantes de Studio
// (frontend/lib/studio-fonts.ts) se cargan solo en las rutas que las usan
// (tienda publica y editor Studio), no aqui — evita que el resto de la app
// pague el peso de red de 5 familias tipograficas que no necesita.

export const metadata: Metadata = {
  title: "Bayup",
  description: "A business operating system powered by Bayup",
  icons: {
    icon: [
      { url: '/assets/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/assets/icon.png', type: 'image/png', sizes: '180x180' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
