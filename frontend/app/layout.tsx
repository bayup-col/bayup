import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BaseCommerce Store",
  description: "A store powered by BaseCommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
