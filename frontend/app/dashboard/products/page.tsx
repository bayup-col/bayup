"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price_adjustment: number;
  stock: number;
  image_url: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  variants: ProductVariant[];
  status?: 'active' | 'draft' | 'archived';
  category?: string; // Campo simulado para categoría
}

// Datos Mock para demostración
const MOCK_PRODUCTS_EXTRA: Product[] = [
    {
        id: "prod_mock_1", name: "Camiseta Básica Oversize", description: "Algodón 100%", price: 250, image_url: null, variants: [{id:'v1', name:'M', sku:'SKU-001', price_adjustment:0, stock: 15, image_url:null}], status: 'draft', category: 'Ropa'
    },
    {
        id: "prod_mock_2", name: "Zapatillas Running Pro", description: "Suela de gel", price: 1200, image_url: null, variants: [{id:'v2', name:'42', sku:'SKU-002', price_adjustment:0, stock: 0, image_url:null}], status: 'archived', category: 'Calzado'
    }
];

export default function ProductsPage() {
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado de UI
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/products', { 
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn("API Error, using mock data");
        setProducts(MOCK_PRODUCTS_EXTRA);
        return;
      }

      const data = await response.json();
      
      const enrichedData = data.map((p: any) => ({
          ...p,
          status: p.status || (p.variants?.every((v:any) => v.stock === 0) ? 'archived' : 'active'),
          category: p.category || 'General' // Default category
      }));

      setProducts([...enrichedData, ...MOCK_PRODUCTS_EXTRA]);

    } catch (err: any) {
      console.error(err);
      setProducts(MOCK_PRODUCTS_EXTRA);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const handleDeleteProduct = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar navegar al detalle
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Lógica de Filtrado Combinada (Tabs + Search)
  const filteredProducts = products.filter(product => {
      const matchesTab = activeTab === 'all' || product.status === activeTab;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
  });

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventario de Productos</h1>
        </div>
        <Link 
            href="/dashboard/products/new" 
            className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar producto
        </Link>
      </div>

      {/* Tabs y Buscador */}
      <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {(['all', 'active', 'draft', 'archived'] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === tab 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {tab === 'all' ? 'Todos' : 
                     tab === 'active' ? 'Activos' : 
                     tab === 'draft' ? 'Borradores' : 'Archivados'}
                </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">Producto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventario</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            No se encontraron productos con estos filtros.
                        </td>
                    </tr>
                ) : (
                    filteredProducts.map((product) => {
                        const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
                        return (
                            <tr key={product.id} className="hover:bg-gray-50 group cursor-pointer transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
                                            {product.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{product.name}</div>
                                            <div className="text-sm text-gray-500">{product.variants.length} variantes</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        product.status === 'active' ? 'bg-green-100 text-green-800' :
                                        product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {product.status === 'active' ? 'Activo' : 
                                         product.status === 'draft' ? 'Borrador' : 'Archivado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={totalStock === 0 ? 'text-red-500 font-medium' : ''}>
                                        {totalStock} en existencia
                                    </span>
                                    {product.variants.length > 1 && <div className="text-xs text-gray-400">en {product.variants.length} variantes</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.category}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/dashboard/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                                            Editar
                                        </Link>
                                        <button onClick={(e) => handleDeleteProduct(product.id, e)} className="text-red-600 hover:text-red-900">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
