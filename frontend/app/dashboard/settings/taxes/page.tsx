"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from "@/context/auth-context";

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
      const response = await fetch('http://localhost:8000/taxes', { // TODO: Usar variable de entorno
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar las tasas de impuestos');
      }

      const data = await response.json();
      setTaxRates(data);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cargar las tasas de impuestos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const handleDeleteTaxRate = async (taxRateId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tasa de impuesto?')) {
      return;
    }
    if (!isAuthenticated || !token) {
      setError('Token de autenticación no encontrado.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/taxes/${taxRateId}`, { // TODO: Usar variable de entorno
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la tasa de impuesto');
      }

      setTaxRates((prevTaxRates) => prevTaxRates.filter((rate) => rate.id !== taxRateId));
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al eliminar la tasa de impuesto.');
    }
  };


  useEffect(() => {
    fetchTaxRates();
  }, [fetchTaxRates]);

  if (loading) return <p>Cargando tasas de impuestos...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tasas de Impuestos</h1>
        <Link href="/dashboard/settings/taxes/new" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Añadir Nueva Tasa de Impuesto
        </Link>
      </div>

      {taxRates.length === 0 ? (
        <p className="text-gray-600">Aún no has añadido ninguna tasa de impuesto.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taxRates.map((rate) => (
            <div key={rate.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800">{rate.name}</h2>
              <p className="text-gray-600 mt-2">Tasa: {(rate.rate * 100).toFixed(2)}%</p>
              <p className="text-gray-500">Predeterminada: {rate.is_default ? 'Sí' : 'No'}</p>
              <div className="mt-4 flex space-x-2">
                <Link href={`/dashboard/settings/taxes/${rate.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                  Editar
                </Link>
                <button
                  onClick={() => handleDeleteTaxRate(rate.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
