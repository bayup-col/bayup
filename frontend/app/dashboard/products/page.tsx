"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
}

export default function ProductsPage() {
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/products', { // TODO: Use env variable
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching products.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Products</h1>
        <Link href="/dashboard/products/new" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Add New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-600">You haven't added any products yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
              {product.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover rounded-md mb-4" />
              )}
              <h2 className="text-xl font-semibold text-gray-800">{product.name}</h2>
              <p className="text-gray-600 mt-2">{product.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                <span className="text-gray-500">Stock: {product.stock}</span>
              </div>
              <div className="mt-4 flex space-x-2">
                <Link href={`/dashboard/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                  Edit
                </Link>
                {/* Delete functionality will be added later */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
