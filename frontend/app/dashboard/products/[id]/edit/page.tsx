"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { v4 as uuidv4 } from 'uuid'; // For unique keys for variants

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
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
}

interface VariantInput extends ProductVariant {
  imageFile?: File | null; // For new image upload
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

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

  const handleVariantImageFileChange = (id: string, file: File | null) => {
    setVariants((prevVariants) =>
      prevVariants.map((variant) => (variant.id === id ? { ...variant, imageFile: file } : variant))
    );
  };

  const addVariant = () => {
    setVariants((prevVariants) => [
      ...prevVariants,
      { id: uuidv4(), name: '', sku: '', price_adjustment: 0, stock: 0, image_url: null, imageFile: null },
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
      throw new Error('Failed to upload image to S3');
    }

    const s3BucketName = fields.bucket;
    const s3Region = 'us-east-1'; // TODO: Get from env/config or use metadata
    const imageUrl = `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${fields.key}`;
    return imageUrl;
  };

  useEffect(() => {
    if (!token || !productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/products/${productId}`, { // TODO: Implementar GET /products/{id} en backend
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar el producto');
        }

        const data: Product = await response.json();
        setName(data.name);
        setDescription(data.description || '');
        setBasePrice(data.price);
        setMainImageUrl(data.image_url);
        setVariants(data.variants.map(v => ({ ...v, imageFile: null }))); // Inicializar imageFile a nulo
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al cargar el producto.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [token, productId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!token) {
      setError('Token de autenticación no encontrado.');
      setSaving(false);
      return;
    }

    try {
      let currentMainImageUrl = mainImageUrl;
      if (mainImageFile) {
        currentMainImageUrl = await uploadImageToS3(mainImageFile, mainImageFile.type);
      }

      const variantsWithUrls = await Promise.all(
        variants.map(async (variant) => {
          let variantImageUrl: string | null = variant.image_url;
          if (variant.imageFile) {
            variantImageUrl = await uploadImageToS3(variant.imageFile, variant.imageFile.type);
          }
          return {
            id: variant.id, // Mantener ID para actualizaciones
            name: variant.name,
            sku: variant.sku,
            price_adjustment: variant.price_adjustment,
            stock: variant.stock,
            image_url: variantImageUrl,
          };
        })
      );

      const productPayload = {
        name,
        description,
        price: basePrice,
        image_url: currentMainImageUrl,
        variants: variantsWithUrls,
      };

      const response = await fetch(`http://localhost:8000/products/${productId}`, { // TODO: Implementar PUT /products/{id} en backend
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar el producto');
      }

      router.push('/dashboard/products');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al actualizar el producto.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="max-w-3xl mx-auto p-8">Cargando producto...</p>;
  if (error) return <p className="text-red-500 max-w-3xl mx-auto p-8">Error: {error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Producto: {name}</h2>
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
              Precio Base (para el producto, las variantes se ajustan a partir de este)
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
            {mainImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainImageUrl} alt="Previsualización del producto principal" className="h-20 w-20 object-cover rounded-md mt-2" />
            )}
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
                    value={variant.sku || ''} // Usar || '' para nulo/indefinido
                    onChange={(e) => handleVariantChange(variant.id, 'sku', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={`variant-price-adj-${variant.id}`} className="block text-sm font-medium text-gray-700">
                    Ajuste de Precio (por ejemplo, +5.00)
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
                <div className="col-span-full">
                  <label htmlFor={`variant-image-${variant.id}`} className="block text-sm font-medium text-gray-700">
                    Imagen de la Variante (Opcional)
                  </label>
                  <input
                    type="file"
                    id={`variant-image-${variant.id}`}
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={(e) => handleVariantImageFileChange(variant.id, e.target.files ? e.target.files[0] : null)}
                  />
                  {variant.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={variant.image_url} alt="Previsualización de variante" className="h-20 w-20 object-cover rounded-md mt-2" />
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
          {saving ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
}
