"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Taxes', href: '/dashboard/settings/taxes' },
    { name: 'Shipping', href: '/dashboard/settings/shipping' },
    // Add other settings categories here
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="md:w-1/4 p-4 bg-white shadow rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === item.href
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="md:w-3/4">
        {children}
      </main>
    </div>
  );
}
