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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const originalWarn = console.warn;
                const originalError = console.error;
                
                console.warn = function() {
                  const msg = arguments[0];
                  if (msg && typeof msg === 'string' && (
                    msg.includes('feature_collector') || 
                    msg.includes('deprecated parameters') ||
                    msg.includes('Invalid scope') ||
                    msg.includes('THREE')
                  )) {
                    return;
                  }
                  originalWarn.apply(console, arguments);
                };

                console.error = function() {
                  const msg = arguments[0];
                  if (msg && typeof msg === 'string' && (
                    msg.includes('feature_collector') ||
                    msg.includes('THREE.WebGLRenderer') ||
                    msg.includes('WebGL context')
                  )) {
                    return;
                  }
                  originalError.apply(console, arguments);
                };
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
