"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { v4 as uuidv4 } from 'uuid';

interface VariantInput {
  id: string;
  name: string;
  sku: string;
  price_adjustment: number;
  stock: number;
  imageFile: File | null;
  imageUrl: string | null;
  attributes: Record<string, string>; // Atributos específicos del tipo de producto
}

interface ProductType {
  id: string;
  name: string;
  description: string;
  attributes: ProductAttribute[];
}

interface ProductAttribute {
  id: string;
  name: string;
  attribute_type: 'select' | 'text' | 'number';
  options?: string[];
}

export default function NewProductPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [productTypeId, setProductTypeId] = useState<string>('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [variants, setVariants] = useState<VariantInput[]>([
    { id: uuidv4(), name: 'Default', sku: '', price_adjustment: 0, stock: 0, imageFile: null, imageUrl: null, attributes: {} },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  // Obtener tipos de productos al cargar
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const response = await fetch('http://localhost:8000/product-types');
        if (!response.ok) throw new Error('Error al obtener tipos de productos');
        const data = await response.json();
        setProductTypes(data);
      } catch (err) {
        console.error('Error fetching product types:', err);
      }
    };

    fetchProductTypes();
  }, []);

  // Actualizar tipo de producto seleccionado
  useEffect(() => {
    if (productTypeId) {
      const selected = productTypes.find(type => type.id === productTypeId);
      setSelectedProductType(selected || null);
      // Resetear atributos de variantes cuando cambia el tipo
      setVariants(prevVariants =>
        prevVariants.map(variant => ({
          ...variant,
          attributes: {}
        }))
      );
    } else {
      setSelectedProductType(null);
    }
  }, [productTypeId, productTypes]);

  const handleMainImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainImageFile(e.target.files[0]);
    } else {
      setMainImageFile(null);
    }
  };

  const handleVariantChange = (id: string, field: keyof VariantInput, value: any) => {
    setVariants((prevVariants) =>
      prevVariants.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant))
    );
  };

  const handleVariantAttributeChange = (id: string, attributeName: string, value: string) => {
    setVariants((prevVariants) =>
      prevVariants.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              attributes: { ...variant.attributes, [attributeName]: value }
            }
          : variant
      )
    );
  };

  const addVariant = () => {
    setVariants((prevVariants) => [
      ...prevVariants,
      { id: uuidv4(), name: '', sku: '', price_adjustment: 0, stock: 0, imageFile: null, imageUrl: null, attributes: {} },
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants((prevVariants) => prevVariants.filter((variant) => variant.id !== id));
  };

  const uploadImageToS3 = async (file: File, fileType: string): Promise<string | null> => {
    if (!token) return null;

    const presignedUrlRes = await fetch(`http://localhost:8000/products/upload-url?file_type=${fileType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!presignedUrlRes.ok) {
      const errorData = await presignedUrlRes.json();
      throw new Error(errorData.detail || 'Failed to get presigned URL');
    }

    const { url, fields } = await presignedUrlRes.json();
    const formData = new FormData();
    for (const key in fields) {
      formData.append(key, fields[key]);
    }
    formData.append('file', file);

    const uploadRes = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error('Error al cargar la imagen a S3');
    }

    return url.split('?')[0] + '/' + fields.key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!token) {
      setError('Token de autenticación no encontrado.');
      setSaving(false);
      return;
    }

    try {
      let mainImageUrl: string | null = null;
      if (mainImageFile) {
        mainImageUrl = await uploadImageToS3(mainImageFile, mainImageFile.type);
      }

      const variantsWithUrls = await Promise.all(
        variants.map(async (variant) => {
          let variantImageUrl: string | null = variant.imageUrl;
          if (variant.imageFile) {
            variantImageUrl = await uploadImageToS3(variant.imageFile, variant.imageFile.type);
          }
          return {
            name: variant.name,
            sku: variant.sku,
            price_adjustment: variant.price_adjustment,
            stock: variant.stock,
            image_url: variantImageUrl,
            attributes: variant.attributes,
          };
        })
      );

      const productPayload = {
        name,
        description,
        price: basePrice,
        image_url: mainImageUrl,
        product_type_id: productTypeId || null,
        variants: variantsWithUrls,
      };

      const response = await fetch('http://localhost:8000/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear el producto');
      }

      router.push('/dashboard/products');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al crear el producto.');
    } finally {
      setSaving(false);
    }
  };

  const renderAttributeInput = (attribute: ProductAttribute, variantId: string, value: string) => {
    switch (attribute.attribute_type) {
      case 'select':
        return (
          <select
            key={attribute.id}
            value={value}
            onChange={(e) => handleVariantAttributeChange(variantId, attribute.name, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="">Selecciona {attribute.name}</option>
            {attribute.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'number':
        return (
          <input
            key={attribute.id}
            type="number"
            value={value}
            onChange={(e) => handleVariantAttributeChange(variantId, attribute.name, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        );
      case 'text':
      default:
        return (
          <input
            key={attribute.id}
            type="text"
            value={value}
            onChange={(e) => handleVariantAttributeChange(variantId, attribute.name, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Añadir Nuevo Producto</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Product Details */}
        <section className="border p-4 rounded-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalles del Producto</h3>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre del Producto
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
          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="mt-4">
            <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
              Precio Base
            </label>
            <input
              type="number"
              id="basePrice"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value))}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="mt-4">
            <label htmlFor="productType" className="block text-sm font-medium text-gray-700">
              Tipo de Producto
            </label>
            <select
              id="productType"
              value={productTypeId}
              onChange={(e) => setProductTypeId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Selecciona un tipo de producto</option>
              {productTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <label htmlFor="mainImage" className="block text-sm font-medium text-gray-700">
              Imagen Principal del Producto
            </label>
            <input
              type="file"
              id="mainImage"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={handleMainImageFileChange}
            />
          </div>
        </section>

        {/* Product Variants Section */}
        <section className="border p-4 rounded-md mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Variantes del Producto</h3>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Añadir Variante
            </button>
          </div>

          {variants.map((variant, index) => (
            <div key={variant.id} className="border-t border-gray-200 pt-4 mt-4 first:border-t-0 first:mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`variant-name-${variant.id}`} className="block text-sm font-medium text-gray-700">
                    Nombre de la Variante
                  </label>
                  <input
                    type="text"
                    id={`variant-name-${variant.id}`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    value={variant.name}
                    onChange={(e) => handleVariantChange(variant.id, 'name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`variant-sku-${variant.id}`} className="block text-sm font-medium text-gray-700">
                    SKU (Opcional)
                  </label>
                  <input
                    type="text"
                    id={`variant-sku-${variant.id}`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    value={variant.sku}
                    onChange={(e) => handleVariantChange(variant.id, 'sku', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={`variant-price-adj-${variant.id}`} className="block text-sm font-medium text-gray-700">
                    Ajuste de Precio
                  </label>
                  <input
                    type="number"
                    id={`variant-price-adj-${variant.id}`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    value={variant.price_adjustment}
                    onChange={(e) => handleVariantChange(variant.id, 'price_adjustment', parseFloat(e.target.value))}
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor={`variant-stock-${variant.id}`} className="block text-sm font-medium text-gray-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    id={`variant-stock-${variant.id}`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    value={variant.stock}
                    onChange={(e) => handleVariantChange(variant.id, 'stock', parseInt(e.target.value))}
                    min="0"
                    required
                  />
                </div>

                {/* Atributos dinámicos según el tipo de producto */}
                {selectedProductType?.attributes && selectedProductType.attributes.length > 0 && (
                  <div className="col-span-full">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Atributos de {selectedProductType.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProductType.attributes.map((attribute) => (
                        <div key={attribute.id}>
                          <label className="block text-sm font-medium text-gray-700">
                            {attribute.name}
                          </label>
                          {renderAttributeInput(
                            attribute,
                            variant.id,
                            variant.attributes[attribute.name] || ''
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="col-span-full">
                  <label htmlFor={`variant-image-${variant.id}`} className="block text-sm font-medium text-gray-700">
                    Imagen de la Variante (Opcional)
                  </label>
                  <input
                    type="file"
                    id={`variant-image-${variant.id}`}
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={(e) => handleVariantChange(variant.id, 'imageFile', e.target.files ? e.target.files[0] : null)}
                  />
                  {variant.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={variant.imageUrl} alt="Previsualización de variante" className="h-20 w-20 object-cover rounded-md mt-2" />
                  )}
                </div>
              </div>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(variant.id)}
                  className="mt-4 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Eliminar Variante
                </button>
              )}
            </div>
          ))}
        </section>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={saving}
        >
          {saving ? 'Creando...' : 'Crear Producto'}
        </button>
      </form>
    </div>
  );
}
