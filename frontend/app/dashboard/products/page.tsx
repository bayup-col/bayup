"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'draft' | 'out_of_stock';
}

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<Product[]>('/products', { token });
      setProducts(data);
    } catch (err) {
      console.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE', token });
      setProducts(products.filter(p => p.id !== id));
      alert("Producto eliminado.");
    } catch (err) {
      alert("No se pudo eliminar el producto.");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Inventario</h1>
          <p className="text-gray-500 mt-2 font-medium">Gestiona tus productos y niveles de stock en tiempo real.</p>
        </div>
        <Link href="/dashboard/products/new" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-100 transition-all active:scale-95 text-center">
          + Nuevo Producto
        </Link>
      </div>

      <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center px-8">
        <span className="text-xl mr-4">🔍</span>
        <input 
          type="text" 
          placeholder="Buscar por nombre o SKU..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 py-4 bg-transparent outline-none text-sm font-medium text-gray-600"
        />
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">SKU</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold">Cargando inventario...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold">No se encontraron productos.</td></tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">📦</div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{product.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-gray-500 uppercase">{product.sku}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${product.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {product.stock} unidades
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-gray-900">{formatCurrency(product.price)}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/products/${product.id}/edit`} className="p-2 text-gray-400 hover:text-purple-600 transition-colors">✎</Link>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}