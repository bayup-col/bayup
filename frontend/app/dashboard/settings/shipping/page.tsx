"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../context/auth-context';

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
  min_order_total: number | null;
  owner_id: string;
}

export default function ShippingOptionsPage() {
  const { token, isAuthenticated } = useAuth();
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShippingOptions = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/shipping', { // TODO: Usar variable de entorno
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar las opciones de envío');
      }

      const data = await response.json();
      setShippingOptions(data);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cargar las opciones de envío.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const handleDeleteShippingOption = async (shippingOptionId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta opción de envío?')) {
      return;
    }
    if (!isAuthenticated || !token) {
      setError('Token de autenticación no encontrado.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/shipping/${shippingOptionId}`, { // TODO: Usar variable de entorno
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la opción de envío');
      }

      setShippingOptions((prevOptions) => prevOptions.filter((option) => option.id !== shippingOptionId));
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al eliminar la opción de envío.');
    }
  };


  useEffect(() => {
    fetchShippingOptions();
  }, [fetchShippingOptions]);

  if (loading) return <p>Cargando opciones de envío...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Opciones de Envío</h1>
        <Link href="/dashboard/settings/shipping/new" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Añadir Nueva Opción de Envío
        </Link>
      </div>

      {shippingOptions.length === 0 ? (
        <p className="text-gray-600">Aún no has añadido ninguna opción de envío.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shippingOptions.map((option) => (
            <div key={option.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800">{option.name}</h2>
              <p className="text-gray-600 mt-2">Costo: ${option.cost.toFixed(2)}</p>
              <p className="text-gray-500">Total Mín. del Pedido: {option.min_order_total !== null ? `$${option.min_order_total.toFixed(2)}` : 'N/A'}</p>
              <div className="mt-4 flex space-x-2">
                <Link href={`/dashboard/settings/shipping/${option.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                  Editar
                </Link>
                <button
                  onClick={() => handleDeleteShippingOption(option.id)}
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
