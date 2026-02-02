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
        }
      },
    },
  },
  plugins: [],
};
export default config;
