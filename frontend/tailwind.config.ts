import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        // Tipografias de display para el sistema de variantes de plantillas de
        // tienda (ver HighFidelityBlocks.tsx). Cada token resuelve una identidad
        // de nicho distinta sin tocar la tipografia base de TecnoPlaza OS.
        "display-luxury": ["var(--font-display-luxury)", "serif"], // Playfair Display — joyeria, ropa elegante, lenceria
        "display-editorial": ["var(--font-display-editorial)", "serif"], // Fraunces — hogar, papeleria
        "display-playful": ["var(--font-display-playful)", "sans-serif"], // Baloo 2 — jugueteria
        "display-impact": ["var(--font-display-impact)", "sans-serif"], // Oswald — tenis, pocket
        "display-tech": ["var(--font-display-tech)", "sans-serif"], // Space Grotesk — tecnologia, computadora
      },
      colors: {
        background: "#FAFAFA",
        surface: "#F0F0F2",
        graphite: "#121212",
        petroleum: "#004d4d",
        cyan: "#00f2ff",
        deepblue: "#001a2c",
      },
      backgroundImage: {
        "cinematic-gradient": "radial-gradient(circle at center, #FAFAFA 0%, #F0F0F2 100%)",
        "mesh-pattern": "url('https://grainy-gradients.vercel.app/noise.svg')",
      },
      animation: {
        "pulse-slow": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 10s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "aurora-border": "aurora-border 6s linear infinite",
        "aurora": "aurora-border 4s linear infinite",
        "gradient-x": "gradient-x 3s ease infinite",
        "gradient-slow": "gradient-x 8s ease infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "aurora-border": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        }
      },
    },
  },
  plugins: [],
};
export default config;
