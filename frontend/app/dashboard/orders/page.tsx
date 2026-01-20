"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../context/auth-context';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

interface Order {
  id: string;
  customer_id: string;
  total_price: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // For MVP, we assume current_user is also the customer
      const response = await fetch('http://localhost:8000/orders', { // TODO: Implement GET /orders endpoint in backend for current user
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching orders.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-600">You haven't made any orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Order ID: {order.id.substring(0, 8)}...</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-gray-600 mb-2">Total: ${order.total_price.toFixed(2)}</p>
              <p className="text-gray-600 mb-4">Date: {new Date(order.created_at).toLocaleDateString()}</p>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Items:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {order.items.map((item) => (
                  <li key={item.id} className="text-gray-600">
                    Product ID: {item.product_id.substring(0, 8)}... - Quantity: {item.quantity} - Price at purchase: ${item.price_at_purchase.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
