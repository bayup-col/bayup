import { Playfair_Display, Fraunces, Baloo_2, Oswald, Space_Grotesk } from "next/font/google";

// Tipografias de display usadas por el sistema de variantes de las plantillas
// de tienda (frontend/components/dashboard/studio/HighFidelityBlocks.tsx).
// Cada una resuelve una identidad de nicho que Inter sola no puede cubrir.
// Aisladas en este modulo (en vez del layout raiz) para que solo las cargen
// las rutas que realmente las usan: la tienda publica y el editor Studio —
// el resto de la app (dashboard, landing) no paga ese peso de red.

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display-luxury", // joyeria, ropa elegante, lenceria: lujo clasico, serif italica
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-editorial", // hogar, papeleria: serif calido tipo revista, sin frialdad de lujo
});

export const baloo2 = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display-playful", // jugueteria: redondeada, amigable, alta legibilidad para ninos/padres
});

export const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-impact", // tenis, pocket: condensada/bold para streetwear y urgencia de oferta
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-tech", // tecnologia, computadora: geometrica, futurista
});

export const studioFontVariables = [
  playfairDisplay.variable,
  fraunces.variable,
  baloo2.variable,
  oswald.variable,
  spaceGrotesk.variable,
].join(" ");
