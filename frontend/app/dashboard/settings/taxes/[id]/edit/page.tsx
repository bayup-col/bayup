"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from "@/context/auth-context";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  is_default: boolean;
  owner_id: string;
}

export default function EditTaxRatePage() {
  const params = useParams();
  const taxRateId = params.id as string;
  const [name, setName] = useState('');
  const [rate, setRate] = useState<number>(0);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (!token || !taxRateId) return;

    const fetchTaxRate = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
        const response = await fetch(`${apiUrl}/taxes/${taxRateId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tax rate');
        }

        const data: TaxRate = await response.json();
        setName(data.name);
        setRate(data.rate);
        setIsDefault(data.is_default);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the tax rate.');
      } finally {
        setLoading(false);
      }
    };
    fetchTaxRate();
  }, [token, taxRateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!token) {
      setError('Authentication token not found.');
      setSaving(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
      const response = await fetch(`${apiUrl}/taxes/${taxRateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, rate, is_default: isDefault }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update tax rate');
      }

      router.push('/dashboard/settings/taxes');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while updating the tax rate.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="max-w-xl mx-auto p-8">Loading tax rate...</p>;
  if (error) return <p className="text-red-500 max-w-xl mx-auto p-8">Error: {error}</p>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Tax Rate: {name}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tax Name
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
            Rate (e.g., 0.19 for 19%)
          </label>
          <input
            type="number"
            id="rate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            id="isDefault"
            name="isDefault"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
            Set as default tax rate
          </label>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Tax Rate'}
        </button>
      </form>
    </div>
  );
}
