"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar'; 

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
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
            <Link
              href="/login"
              className="w-full sm:w-auto flex justify-center items-center px-8 py-4 border border-transparent text-base font-bold rounded-2xl shadow-xl text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95"
            >
              INICIA SESIÓN EN TU PANEL
            </Link>
            <Link
              href="/shop/sample-tenant" 
              className="w-full sm:w-auto flex justify-center items-center px-8 py-4 border border-transparent text-base font-bold rounded-2xl shadow-xl text-white bg-gray-800 hover:bg-gray-700 transition-all active:scale-95"
            >
              VER DEMOSTRACIÓN
            </Link>
          </div>
        </div>
      </main>

      <section className="bg-white p-20 shadow-inner">
        <div className="max-w-7xl mx-auto text-gray-700 text-center">
          <h2 className="text-3xl font-black mb-4">Potencia tu negocio con tecnología de vanguardia</h2>
          <p className="mb-8 text-gray-500 max-w-2xl mx-auto">
            Bayup te ofrece todas las herramientas necesarias para gestionar inventarios, ventas y clientes en un solo lugar.
          </p>
          <div className="h-[400px] bg-gradient-to-tr from-gray-50 to-gray-200 rounded-[3rem] border border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-black text-2xl">
            VISTA PREVIA DE LA PLATAFORMA
          </div>
        </div>
      </section>
    </div>
  );
}