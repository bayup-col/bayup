import type { Metadata } from "next";
import { Inter, Playfair_Display, Fraunces, Baloo_2, Oswald, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

// Tipografias de display usadas por el sistema de variantes de las plantillas
// de tienda (frontend/components/dashboard/studio/HighFidelityBlocks.tsx).
// Cada una resuelve una identidad de nicho que Inter sola no puede cubrir:
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display-luxury", // joyeria, ropa elegante, lenceria: lujo clasico, serif italica
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-editorial", // hogar, papeleria: serif calido tipo revista, sin frialdad de lujo
});

const baloo2 = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display-playful", // jugueteria: redondeada, amigable, alta legibilidad para ninos/padres
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-impact", // tenis, pocket: condensada/bold para streetwear y urgencia de oferta
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-tech", // tecnologia, computadora: geometrica, futurista
});

export const metadata: Metadata = {
  title: "Bayup",
  description: "A business operating system powered by Bayup",
  icons: {
    icon: [
      { url: '/assets/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/assets/favicon.ico', sizes: '180x180', type: 'image/x-icon' },
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
      className={`${inter.variable} ${playfairDisplay.variable} ${fraunces.variable} ${baloo2.variable} ${oswald.variable} ${spaceGrotesk.variable}`}
    >
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
