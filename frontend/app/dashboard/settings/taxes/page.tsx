"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../context/auth-context';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  is_default: boolean;
  owner_id: string;
}

export default function TaxesPage() {
  const { token, isAuthenticated } = useAuth();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxRates = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/taxes', { // TODO: Use env variable
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tax rates');
      }

      const data = await response.json();
      setTaxRates(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching tax rates.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const handleDeleteTaxRate = async (taxRateId: string) => {
    if (!window.confirm('Are you sure you want to delete this tax rate?')) {
      return;
    }
    if (!isAuthenticated || !token) {
      setError('Authentication token not found.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/taxes/${taxRateId}`, { // TODO: Use env variable
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete tax rate');
      }

      setTaxRates((prevTaxRates) => prevTaxRates.filter((rate) => rate.id !== taxRateId));
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting the tax rate.');
    }
  };


  useEffect(() => {
    fetchTaxRates();
  }, [fetchTaxRates]);

  if (loading) return <p>Loading tax rates...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tax Rates</h1>
        <Link href="/dashboard/settings/taxes/new" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Add New Tax Rate
        </Link>
      </div>

      {taxRates.length === 0 ? (
        <p className="text-gray-600">You haven't added any tax rates yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taxRates.map((rate) => (
            <div key={rate.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800">{rate.name}</h2>
              <p className="text-gray-600 mt-2">Rate: {(rate.rate * 100).toFixed(2)}%</p>
              <p className="text-gray-500">Default: {rate.is_default ? 'Yes' : 'No'}</p>
              <div className="mt-4 flex space-x-2">
                <Link href={`/dashboard/settings/taxes/${rate.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                  Edit
                </Link>
                <button
                  onClick={() => handleDeleteTaxRate(rate.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
