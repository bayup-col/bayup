import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
