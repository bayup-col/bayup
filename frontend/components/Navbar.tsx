// frontend/components/Navbar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  isScrolled: boolean;
}

export default function Navbar({ isScrolled }: NavbarProps) {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/register');
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ease-in-out
        backdrop-blur-lg bg-black/40 border-b border-white/10
        ${isScrolled
          ? 'bg-black/60 shadow-lg'
          : 'bg-black/40'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-white text-2xl font-bold">
              BAYUP
            </Link>
          </div>

          {/* Right: Navigation Links and Button */}
          <div className="flex items-center space-x-4 md:space-x-8">
            {/* Nav Links (hidden on small screens, adjust as needed for a mobile menu) */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="#" className="text-white text-sm font-medium hover:text-gray-300">
                INICIO
              </Link>
              <Link href="#" className="text-white text-sm font-medium hover:text-gray-300">
                TECNOLOGÍA
              </Link>
              <Link href="#" className="text-white text-sm font-medium hover:text-gray-300">
                PLANES
              </Link>
            </div>
            
            {/* Action Button */}
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md shadow-md
                         hover:bg-red-700 transition-colors duration-200 ease-in-out
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              INICIAR SESIÓN
            </button>

            {/* Mobile menu button (optional, not implemented for this scope) */}
            {/* <button className="md:hidden text-white focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button> */}
          </div>
        </div>
      </div>
    </nav>
  );
}
