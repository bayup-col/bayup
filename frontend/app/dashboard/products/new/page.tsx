"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';

export default function NewProductPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const uploadImageToS3 = async (file: File): Promise<string | null> => {
    if (!token) return null;

    // 1. Get presigned URL from backend
    const presignedUrlRes = await fetch(`http://localhost:8000/products/upload-url?file_type=${file.type}`, {
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

    // 2. Upload image directly to S3 using the presigned URL and fields
    const formData = new FormData();
    for (const key in fields) {
      formData.append(key, fields[key]);
    }
    formData.append('file', file); // 'file' is the key expected by S3 for the file itself

    const uploadRes = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload image to S3');
    }

    // Return the URL where the image will be accessible (constructed from S3 bucket details)
    const s3BucketName = fields.bucket; // Assuming bucket name is returned in fields
    const s3Region = 'us-east-1'; // TODO: Get from env/config
    const imageUrl = `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${fields.key}`;
    return imageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }

    let imageUrl: string | null = null;
    if (imageFile) {
      try {
        imageUrl = await uploadImageToS3(imageFile);
      } catch (err: any) {
        setError(err.message || 'Image upload failed.');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('http://localhost:8000/products', { // TODO: Use env variable
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, price, stock, image_url: imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create product');
      }

      router.push('/dashboard/products');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while creating the product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            id="price"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
            Stock
          </label>
          <input
            type="number"
            id="stock"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value))}
            min="0"
            required
          />
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Product Image
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
