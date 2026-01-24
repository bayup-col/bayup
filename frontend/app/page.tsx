"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar'; // Adjust path if Navbar is in a different location

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) { // Detect scroll after 10px
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar isScrolled={isScrolled} />

      {/* Hero Section */}
      <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 text-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
            <span className="block text-gray-700">Bienvenido a</span>
            <span className="block mt-2">
              <span className="text-red-600">Bayup</span>
            </span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl md:text-2xl leading-relaxed text-gray-500 max-w-2xl mx-auto">
            Tu plataforma de comercio electrónico multiarrendatario definitiva.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary Button */}
            <Link
              href="/login"
              className="w-full sm:w-auto flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              INICIA SESIÓN EN TU PANEL
            </Link>
            {/* Secondary Button */}
            <Link
              href="/shop/[tenantId]" as="/shop/sample-tenant-id" // Placeholder for sample tenant ID
              className="w-full sm:w-auto flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 transition-colors duration-200"
            >
              VER DEMOSTRACIÓN
            </Link>
          </div>
        </div>
      </main>

      {/* Temporary Scrollable Content to test Navbar effect */}
      <section className="bg-white p-20 shadow-inner">
        <div className="max-w-7xl mx-auto text-gray-700">
          <h2 className="text-3xl font-bold mb-4">¡Desplázate para ver el efecto de la barra de navegación!</h2>
          <p className="mb-4">
            Este es contenido de prueba para asegurar que la página sea desplazable.
            Deberías ver que la barra de navegación en la parte superior cambia su apariencia
            (se vuelve glassmórfica) cuando te desplazas hacia abajo.
          </p>
          <div className="h-[1000px] bg-gradient-to-b from-gray-100 to-gray-300 rounded-lg flex items-center justify-center text-gray-500 font-bold text-4xl">
            ÁREA DESPLAZABLE
          </div>
        </div>
      </section>
    </div>
  );
}
