"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";

export default function NewShippingOptionPage() {
  const [name, setName] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [minOrderTotal, setMinOrderTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!token) {
      setError('Token de autenticación no encontrado.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        cost,
        min_order_total: minOrderTotal !== null ? minOrderTotal : undefined, // Enviar como undefined si es nulo
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
      const response = await fetch(`${apiUrl}/shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear la opción de envío');
      }

      router.push('/dashboard/settings/shipping');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al crear la opción de envío.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Añadir Nueva Opción de Envío</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre de la Opción (por ejemplo, Estándar, Expresión)
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
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
            Costo
          </label>
          <input
            type="number"
            id="cost"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={cost}
            onChange={(e) => setCost(parseFloat(e.target.value))}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="minOrderTotal" className="block text-sm font-medium text-gray-700">
            Total Mínimo del Pedido (Opcional)
          </label>
          <input
            type="number"
            id="minOrderTotal"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={minOrderTotal !== null ? minOrderTotal : ''}
            onChange={(e) => setMinOrderTotal(e.target.value ? parseFloat(e.target.value) : null)}
            min="0"
            step="0.01"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear Opción de Envío'}
        </button>
      </form>
    </div>
  );
}
