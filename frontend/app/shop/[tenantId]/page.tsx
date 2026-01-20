"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
}

export default function TenantShopPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!tenantId) {
      setError('Tenant ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/public/stores/${tenantId}/products`, { // TODO: Use env variable
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products for this store');
      }

      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching products.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) return <p>Loading store...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Welcome to Store {tenantId.substring(0, 8)}...</h1>
      
      {products.length === 0 ? (
        <p className="text-gray-600">This store doesn't have any products yet.</p>
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
              <div className="mt-4">
                {/* For MVP, just a placeholder to view product or add to cart */}
                <Link href={`/shop/${tenantId}/products/${product.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                  View Product
                </Link>
                {/* Add to cart functionality will be added later */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
