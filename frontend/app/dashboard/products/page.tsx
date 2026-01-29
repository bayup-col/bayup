"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { apiRequest } from '@/lib/api';

// --- CONFIGURACIÓN DE SUGERENCIAS ---
const CATEGORIES = [
    { name: 'Ropa', icon: '👕' },
    { name: 'Calzado', icon: '👟' },
    { name: 'Accesorios', icon: '👜' },
    { name: 'Tecnología', icon: '📱' },
    { name: 'Hogar', icon: '🏠' },
    { name: 'Belleza', icon: '💄' },
    { name: 'Deportes', icon: '⚽' },
    { name: 'Otros', icon: '📦' }
];

const SUGGESTIONS = {
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44'],
    colores: [
        { name: 'Negro', hex: '#000000' },
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Rojo', hex: '#EF4444' },
        { name: 'Azul', hex: '#3B82F6' },
        { name: 'Verde', hex: '#10B981' },
        { name: 'Amarillo', hex: '#F59E0B' },
        { name: 'Gris', hex: '#6B7280' },
        { name: 'Rosa', hex: '#EC4899' },
        { name: 'Púrpura', hex: '#8B5CF6' }
    ],
    marcas: ['Nike', 'Adidas', 'Zara', 'H&M', 'Puma', 'Reebok', 'Apple', 'Samsung', 'Genérica'],
    materiales: ['Algodón', 'Cuero', 'Poliéster', 'Seda', 'Lana', 'Lino', 'Mezclilla', 'Sintético'],
    estilos: ['Urbano', 'Formal', 'Deportivo', 'Casual', 'Elegante', 'Vintage', 'Minimalista'],
    generos: ['Hombre', 'Mujer', 'Niño', 'Niña', 'Unisex', 'Todos', 'Otros'],
    otros: ['Temporada 2024', 'Edición Limitada', 'Eco-Friendly', 'Importado']
};

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price_adjustment: number;
  stock: number;
  image_url: string | null;
  attributes: any;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  variants: ProductVariant[];
  status?: 'active' | 'draft' | 'archived';
  category?: string;
  collection_id?: string | null;
}

interface NewProductState {
  name: string;
  status: 'active' | 'draft' | 'archived';
  category: string;
  collection_id: string | null;
  description: string;
  cost: string;
  price: string;
  stock: string;
  sku: string;
  images: { file?: File; preview: string }[];
  attributes: {
    tallas: string[];
    colores: string[];
    marcas: string[];
    materiales: string[];
    estilos: string[];
    generos: string[];
    otros: string[];
  };
}

const MOCK_PRODUCTS_EXTRA: Product[] = [
    { id: "prod_mock_1", name: "Camiseta Básica Oversize", description: "Algodón 100%", price: 250, image_url: null, variants: [{id:'v1', name:'M', sku:'SKU-001', price_adjustment:0, stock: 15, image_url:null, attributes: { tallas: ['M'] }}], status: 'draft', category: 'Ropa', collection_id: null },    
    { id: "prod_mock_2", name: "Zapatillas Running Pro", description: "Suela de gel", price: 1200, image_url: null, variants: [{id:'v2', name:'42', sku:'SKU-002', price_adjustment:0, stock: 0, image_url:null, attributes: { tallas: ['42'] }}], status: 'archived', category: 'Calzado', collection_id: null }
];

const AttributeField = ({ label, category, value, suggestions, onAdd, onRemove }: any) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);   
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSuggestions = (suggestions || []).filter((s: any) => {      
        const name = typeof s === 'string' ? s : s.name;
        return name.toLowerCase().includes(inputValue.toLowerCase()) && !(value || []).includes(name);
    });

    const handleSelect = (val: string) => {
        onAdd(category, val);
        setInputValue('');
        setIsOpen(false);
    };

    return (
        <div className="space-y-3 relative" ref={containerRef}>       
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <div className="flex flex-wrap gap-2 p-3 bg-white border border-gray-100 focus-within:border-purple-200 rounded-2xl transition-all shadow-sm">
                {(value || []).map((tag: string, i: number) => (
                    <span key={i} className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1 rounded-xl text-[10px] font-black text-purple-700">
                        {tag}<button type="button" onClick={() => onRemove(category, i)} className="hover:text-rose-500 transition-colors">✕</button>      
                    </span>
                ))}
                <input type="text" placeholder="Escribe o selecciona..." value={inputValue} onFocus={() => setIsOpen(true)} onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }} onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) { e.preventDefault(); handleSelect(inputValue.trim()); } }} className="flex-1 bg-transparent outline-none text-xs font-bold min-w-[120px] placeholder:text-gray-300" />
            </div>
            {isOpen && (filteredSuggestions.length > 0) && (
                <div className="absolute z-[120] top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar">
                    <div className="p-2">
                        {filteredSuggestions.map((s: any, i: number) => {
                            const name = typeof s === 'string' ? s : s.name;
                            return (
                                <button key={i} type="button" onClick={() => handleSelect(name)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 rounded-xl transition-colors text-left" >
                                    {s.hex && (<div className="h-4 w-4 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: s.hex }}></div>)}
                                    <span className="text-xs font-bold text-gray-700">{name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ProductsPage() {
  const { token, logout, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);  
  const [importFile, setImportFile] = useState<File | null>(null);    
  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string, icon: string}[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [showVariants, setShowVariants] = useState(false);
  const [includeGatewayFee, setIncludeGatewayFee] = useState(false);  
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const [newProduct, setNewProduct] = useState<NewProductState>({
    name: '', status: 'active', category: '', collection_id: null, description: '', cost: '', price: '', stock: '', sku: '',   
    images: [],
    attributes: { tallas: [], colores: [], marcas: [], materiales: [], estilos: [], generos: [], otros: [] }
  });

  const resetForm = () => {
    setNewProduct({
        name: '', status: 'active', category: '', collection_id: null, description: '', cost: '', price: '', stock: '', sku: '',
        images: [],
        attributes: { tallas: [], colores: [], marcas: [], materiales: [], estilos: [], generos: [], otros: [] }
    });
    setIsEditMode(false);
    setCurrentProductId(null);
    setShowVariants(false);
    setIncludeGatewayFee(false);
  };

  const fetchProducts = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/products', { token });
      if (data && Array.isArray(data)) {
          setProducts(data.map((p: any) => ({ 
            ...p, 
            status: p.status || (p.variants?.every((v:any) => v.stock === 0) ? 'archived' : 'active'), 
            category: p.category || 'General' 
          })));
      }
    } catch (err) { 
      console.error("Error fetching products:", err);
    } finally { 
      setLoading(false); 
    }
  }, [token]);

  const fetchCollections = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<any[]>('/collections', { token });
      if (data && Array.isArray(data) && data.length > 0) {
          setAvailableCategories(data.map(c => ({ id: c.id, name: c.title, icon: '📦' })));
      }
    } catch (err) {
      console.error("Error fetching collections");
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
    fetchCollections();
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setIsModalOpen(false); setIsImportModalOpen(false); resetForm(); } };
    const handleClickOutside = (e: MouseEvent) => { if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setIsCategoryDropdownOpen(false); };
    window.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);       
    return () => { window.removeEventListener('keydown', handleEsc); document.removeEventListener('mousedown', handleClickOutside); };       
  }, [fetchProducts, fetchCollections]);

  const handleEditClick = (product: Product) => {
    setIsEditMode(true);
    setCurrentProductId(product.id);
    const mainVariant = product.variants?.[0] || { sku: '', stock: 0, attributes: {} };

    setNewProduct({
        name: product.name || '',
        status: product.status || 'active',
        category: product.category || '',
        collection_id: product.collection_id || null,
        description: product.description || '',
        cost: '', 
        price: (product.price || 0).toString(),
        stock: (mainVariant.stock || 0).toString(),
        sku: mainVariant.sku || '',
        images: product.image_url ? [{ preview: product.image_url }] : [],
        attributes: {
            tallas: mainVariant.attributes?.tallas || [],
            colores: mainVariant.attributes?.colores || [],
            marcas: mainVariant.attributes?.marcas || [],
            materiales: mainVariant.attributes?.materiales || [],     
            estilos: mainVariant.attributes?.estilos || [],
            generos: mainVariant.attributes?.generos || [],
            otros: mainVariant.attributes?.otros || []
        }
    });

    if (Object.values(mainVariant.attributes || {}).some((arr: any) => Array.isArray(arr) && arr.length > 0)) {
        setShowVariants(true);
    }
    setIsModalOpen(true);
  };

  const addTag = (category: keyof typeof newProduct.attributes, value: string) => {
    if (!value.trim()) return;
    setNewProduct(prev => ({ ...prev, attributes: { ...prev.attributes, [category]: [...(prev.attributes[category] || []), value.trim()] } }));      
  };

  const removeTag = (category: keyof typeof newProduct.attributes, index: number) => {
    setNewProduct(prev => {
        const newTags = [...(prev.attributes[category] || [])];
        newTags.splice(index, 1);
        return { ...prev, attributes: { ...prev.attributes, [category]: newTags } };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imgs = files.filter(f => f.type.startsWith('image/'));      
    let updatedImages = [...newProduct.images];
    if (imgs.length > 0) {
        if (updatedImages.length + imgs.length > 5) alert("Máximo 5 imágenes.");
        else updatedImages = [...updatedImages, ...imgs.map(f => ({ file: f, preview: URL.createObjectURL(f) }))];
    }
    setNewProduct({ ...newProduct, images: updatedImages });
  };

  const formatNumberInput = (value: string) => {
    if (!value) return '';
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('de-DE').format(parseInt(number) || 0);   
  };

  const unformatNumberInput = (value: string) => value.replace(/\D/g, '');

  const handleSaveProduct = async () => {
    if (!newProduct.name) return alert("Por favor asigna un nombre al producto.");
    try {
        const productData = {
            name: newProduct.name,
            description: newProduct.description,
            price: parseFloat(newProduct.price) || 0,
            image_url: newProduct.images.length > 0 ? newProduct.images[0].preview : null,
            product_type_id: null, // El backend espera este campo aunque sea null
            collection_id: newProduct.collection_id, // Enviamos el ID real de la colección
            variants: [{ 
                name: "Estándar", 
                sku: newProduct.sku || null, 
                price_adjustment: 0, 
                stock: parseInt(newProduct.stock) || 0, 
                attributes: newProduct.attributes 
            }]
        };
        const url = isEditMode ? `/products/${currentProductId}` : '/products';
        await apiRequest(url, { method: isEditMode ? 'PUT' : 'POST', token, body: JSON.stringify(productData) });
        
        setIsModalOpen(false);
        resetForm();
        fetchProducts();
    } catch (err: any) { 
        console.error("Error al guardar:", err);
        alert(`Error al guardar: ${err.message || "Verifica los datos e intenta de nuevo"}`); 
    }
  };

  const costVal = parseFloat(newProduct.cost) || 0;
  const priceVal = parseFloat(newProduct.price) || 0;
  const platformCommission = priceVal * 0.025;
  const gatewayFee = includeGatewayFee ? priceVal * 0.035 : 0;
  const profit = (priceVal - costVal) - platformCommission - gatewayFee;  
  const margin = priceVal > 0 ? (profit / priceVal) * 100 : 0;

  const activeCount = (products || []).filter(p => p.status === 'active').length;
  const draftCount = (products || []).filter(p => p.status === 'draft').length;
  const lowStockCount = (products || []).filter(p => (p.variants?.[0]?.stock || 0) <= 5).length;

  return (
    <div className="max-w-7xl mx-auto pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div><h1 className="text-4xl font-black text-gray-900 tracking-tight">Inventario</h1><p className="text-gray-500 mt-2 font-medium"><span className="text-emerald-600 font-bold">{activeCount} activos</span> · <span className="text-rose-600 font-bold ml-1">{lowStockCount} con stock bajo</span> · <span className="text-amber-600 font-bold ml-1">{draftCount} borradores</span></p></div>
        <div className="flex gap-3"><button type="button" onClick={() => setIsImportModalOpen(true)} className="bg-white border border-gray-100 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2">Importar</button><button type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2">Agregar producto</button></div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex space-x-1 bg-gray-50 p-1.5 rounded-2xl shadow-sm border border-gray-100/50 w-full lg:w-fit overflow-x-auto">  
            {(['all', 'active', 'draft', 'archived'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>{tab === 'all' ? 'Todos' : tab === 'active' ? 'Activos' : tab === 'draft' ? 'Borradores' : 'Archivados'}</button>    
            ))}
          </div>
          <div className="relative w-full lg:w-80"><input type="text" placeholder="Buscar por nombre o SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 text-sm border border-gray-50 bg-gray-50/50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-500/5 focus:border-purple-200 outline-none transition-all font-medium" /></div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden relative">
        {loading && products.length === 0 ? (
            <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div>
        ) : (
            <table className="min-w-full divide-y divide-gray-50">        
                <thead className="bg-gray-50/50"><tr><th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-[40%]">Producto</th><th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th><th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock</th><th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Colección</th><th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Acciones</th></tr></thead>      
                <tbody className="bg-white divide-y divide-gray-50">      
                    {(products || []).filter(p => (activeTab === 'all' || p.status === activeTab) && (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((product) => {
                        const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
                                                return (
                                                    <tr key={product.id} className="hover:bg-gray-50/50 group transition-all duration-300">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-5">
                                                                <div className="h-14 w-14 flex-shrink-0 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                                    {product.image_url && !product.image_url.includes('undefined') ? (
                                                                        <img 
                                                                            src={product.image_url} 
                                                                            alt={product.name}
                                                                            className="h-full w-full object-cover" 
                                                                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                                                                        />
                                                                    ) : (
                                                                        <span className="text-xl">📦</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors tracking-tight">{product.name}</div>
                                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                                        {product.variants?.length || 0} variantes <span className="h-1 w-1 rounded-full bg-gray-300"></span> {product.category}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                        <td className="px-8 py-6 whitespace-nowrap"><span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${product.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : product.status === 'draft' ? 'bg-amber-50 text-amber-600 border-amber-100/50' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{product.status === 'active' ? 'Activo' : product.status === 'draft' ? 'Borrador' : 'Archivado'}</span></td><td className="px-8 py-6 whitespace-nowrap"><p className={`text-sm font-black ${totalStock <= 5 ? 'text-rose-600' : 'text-gray-900'}`}>{totalStock} <span className="text-[10px] text-gray-400 uppercase ml-1">en stock</span></p></td><td className="px-8 py-6 whitespace-nowrap"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.category}</span></td><td className="px-8 py-6 whitespace-nowrap text-right"><div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"><button type="button" onClick={() => handleEditClick(product)} className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline">Editar</button><button type="button" onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar?')) setProducts(products.filter(p => p.id !== product.id)); }} className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline">Eliminar</button></div></td></tr>);
                    })}
                </tbody>
            </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10"><div><h2 className="text-2xl font-black text-gray-900 tracking-tight">{isEditMode ? 'Editar Producto' : 'Nuevo Producto'}</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Completa los detalles para tu catálogo</p></div><button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 transition-colors text-gray-400 text-xl">✕</button></div>
                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                    <div className="border-b border-gray-50 pb-12">   
                        <div className="flex items-center gap-2 mb-6"><h3 className="text-xl font-black text-gray-900 tracking-tight">Información Básica</h3></div>
                        <div className="space-y-6">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del producto *</label><input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ej: Camiseta de Algodón Pima" className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white rounded-2xl outline-none text-sm font-bold" /></div>
                            <div className="grid grid-cols-2 gap-6">  
                                <div className="relative" ref={categoryRef}>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Colección</label> 
                                    <button type="button" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)} className="w-full mt-2 p-4 bg-gray-50 border border-transparent hover:bg-white hover:border-purple-100 rounded-2xl outline-none text-sm font-bold text-gray-700 flex items-center justify-between transition-all"><span>{newProduct.category ? newProduct.category : 'Seleccionar colección'}</span></button>
                                    {isCategoryDropdownOpen && (<div className="absolute z-[120] top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2">{availableCategories.map((cat, i) => (<button key={i} type="button" onClick={() => { setNewProduct({...newProduct, category: cat.name, collection_id: cat.id}); setIsCategoryDropdownOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${newProduct.category === cat.name ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>{cat.name}</button>))}</div>)}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>    
                                    <div className="flex gap-2 mt-2"> 
                                        <button type="button" onClick={() => setNewProduct({...newProduct, status: 'active'})} className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${newProduct.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400'}`}>Activo</button>
                                        <button type="button" onClick={() => setNewProduct({...newProduct, status: 'draft'})} className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${newProduct.status === 'draft' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400'}`}>Borrador</button>
                                        <button type="button" onClick={() => setNewProduct({...newProduct, status: 'archived'})} className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${newProduct.status === 'archived' ? 'bg-gray-100 border-gray-300 text-gray-700 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400'}`}>Archivado</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-b border-gray-50 pb-12"><div className="flex items-center gap-2 mb-6"><h3 className="text-xl font-black text-gray-900 tracking-tight">Descripción Amplia</h3></div><textarea rows={5} value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} placeholder="Escribe aquí..." className="w-full p-6 bg-gray-50 border border-transparent focus:bg-white rounded-[2rem] outline-none transition-all text-sm font-medium"></textarea></div>
                    <div className="border-b border-gray-50 pb-12">   
                        <div className="flex items-center gap-2 mb-6"><h3 className="text-xl font-black text-gray-900 tracking-tight">Multimedia</h3></div>
                        <label className="border-2 border-dashed border-gray-100 rounded-[2rem] p-12 text-center hover:bg-gray-50 hover:border-purple-200 transition-all cursor-pointer group flex flex-col items-center justify-center relative"><input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} /><p className="text-sm font-bold text-gray-900 mt-4">Sube archivos</p></label>
                        {newProduct.images.length > 0 && (
                            <div className="flex flex-wrap gap-4 mt-8">
                                {newProduct.images.map((img, i) => (<div key={i} className="h-24 w-24 rounded-2xl border border-gray-100 bg-gray-50 relative overflow-hidden group">
    <img 
        src={img.preview} 
        className="h-full w-full object-cover" 
        alt="" 
        onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
        }}
    />
    <button type="button" onClick={() => { const imgs = [...newProduct.images]; imgs.splice(i, 1); setNewProduct({...newProduct, images: imgs}); }} className="absolute top-1 right-1 h-5 w-5 bg-white/90 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 z-10 shadow-sm">✕</button>
    {i === 0 && <span className="absolute bottom-1 left-1 bg-purple-600 text-white text-[6px] font-black uppercase px-1.5 py-0.5 rounded shadow-lg">Principal</span>}
</div>))}
                            </div>
                        )}
                    </div>
                    <div className="border-b border-gray-50 pb-12">   
                        <div className="flex items-center gap-2 mb-6"><h3 className="text-xl font-black text-gray-900 tracking-tight">Finanzas e Inventario</h3></div>
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo</label><input type="text" value={formatNumberInput(newProduct.cost)} onChange={(e) => setNewProduct({...newProduct, cost: unformatNumberInput(e.target.value)})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white rounded-2xl outline-none text-sm font-black transition-all" /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio PVP</label><input type="text" value={formatNumberInput(newProduct.price)} onChange={(e) => setNewProduct({...newProduct, price: unformatNumberInput(e.target.value)})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white rounded-2xl outline-none text-sm font-black transition-all" /></div>
                            </div>
                            <div className="flex items-center gap-3 px-2"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={includeGatewayFee} onChange={(e) => setIncludeGatewayFee(e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-purple-600"></div><span className="ml-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">¿Agregar costo pasarela? (3.5%)</span></label></div>        
                            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row justify-between items-center group relative overflow-hidden">
                                <div className="relative z-10"><p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Ganancia neta estimada</p><h4 className="text-4xl font-black mt-3">${profit.toLocaleString('de-DE')}</h4><p className="text-[10px] text-gray-500 mt-3">* Comisión (2.5%) {includeGatewayFee ? '+ Pasarela (3.5%) ' : ''}ya descontada</p></div>
                                <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${margin > 30 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>Margen: {margin.toFixed(1)}%</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock</label><input type="text" value={formatNumberInput(newProduct.stock)} onChange={(e) => setNewProduct({...newProduct, stock: unformatNumberInput(e.target.value)})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent focus:bg-white rounded-2xl outline-none text-sm font-black" /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU</label><input type="text" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 border border-transparent rounded-2xl outline-none text-sm font-bold uppercase" /></div>
                            </div>
                        </div>
                    </div>
                    <div><div className="flex items-center gap-2 mb-6"><h3 className="text-xl font-black text-gray-900 tracking-tight">Atributos</h3></div>{showVariants ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-gray-50 rounded-[3rem] border border-purple-100 relative"><button type="button" onClick={() => setShowVariants(false)} className="absolute top-6 right-6 text-gray-400 hover:text-rose-500 transition-colors text-xs font-bold">✕ Ocultar</button><AttributeField label="Tallas" category="tallas" suggestions={SUGGESTIONS.tallas} value={newProduct.attributes.tallas} onAdd={addTag} onRemove={removeTag} /><AttributeField label="Colores" category="colores" suggestions={SUGGESTIONS.colores} value={newProduct.attributes.colores} onAdd={addTag} onRemove={removeTag} /><AttributeField label="Público / Género" category="generos" suggestions={SUGGESTIONS.generos} value={newProduct.attributes.generos} onAdd={addTag} onRemove={removeTag} /><AttributeField label="Marcas" category="marcas" suggestions={SUGGESTIONS.marcas} value={newProduct.attributes.marcas} onAdd={addTag} onRemove={removeTag} /><AttributeField label="Materiales" category="materiales" suggestions={SUGGESTIONS.materiales} value={newProduct.attributes.materiales} onAdd={addTag} onRemove={removeTag} /><AttributeField label="Estilo" category="estilos" suggestions={SUGGESTIONS.estilos} value={newProduct.attributes.estilos} onAdd={addTag} onRemove={removeTag} /><AttributeField label="Otros" category="otros" suggestions={SUGGESTIONS.otros} value={newProduct.attributes.otros} onAdd={addTag} onRemove={removeTag} /></div>) : (<button type="button" onClick={() => setShowVariants(true)} className="w-full p-10 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-purple-600 hover:border-purple-100 transition-all">+ Personalizar Atributos</button>)}</div>
                </div>
                <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between sticky bottom-0 z-10"><button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button><div className="flex gap-4"><button type="button" onClick={() => { setNewProduct({...newProduct, status: 'draft'}); handleSaveProduct(); }} className="px-8 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 shadow-sm transition-all">Borrador</button><button type="button" onClick={handleSaveProduct} className="px-8 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all">{isEditMode ? 'Actualizar producto' : 'Guardar producto'}</button></div></div>
            </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between"><div><h2 className="text-xl font-black text-gray-900 tracking-tight">Importar</h2></div><button type="button" onClick={() => setIsImportModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors text-gray-400">✕</button></div>
                <div className="p-10 text-center"><div className="border-2 border-dashed rounded-3xl p-12 border-gray-100 hover:border-purple-200 hover:bg-gray-50"><input type="file" id="csvFile" accept=".csv" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] || null)} /><label htmlFor="csvFile" className="cursor-pointer"><p className="text-sm font-bold text-gray-900">{importFile ? importFile.name : 'Selecciona un archivo CSV'}</p></label></div></div>
                <div className="p-8 pt-0 flex gap-3"><button type="button" onClick={() => setIsImportModalOpen(false)} className="flex-1 px-6 py-4 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Cancelar</button><button type="button" disabled={!importFile} className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all ${importFile ? 'bg-purple-600 shadow-lg shadow-purple-100' : 'bg-gray-200 cursor-not-allowed'}`}>Procesar</button></div>
            </div>
        </div>
      )}
    </div>
  );
}