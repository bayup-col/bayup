"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
          Welcome to BaseCommerce!
        </h1>
        <p className="mt-6 text-xl leading-8 text-gray-700">
          Your ultimate multi-tenant e-commerce platform.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Login to your Admin Dashboard
          </Link>
          {/* TODO: Add a link to a sample public store, e.g., /shop/sample-tenant-id */}
          {/* <Link href="/shop/your-sample-store-id" className="text-sm font-semibold leading-6 text-gray-900">
            Visit a Sample Store <span aria-hidden="true">→</span>
          </Link> */}
        </div>
      </div>
    </main>
  );
}
