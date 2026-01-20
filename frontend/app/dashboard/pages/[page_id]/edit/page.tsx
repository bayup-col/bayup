"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/auth-context';

interface Page {
  id: string;
  slug: string;
  title: string | null;
  content: any | null;
}

export default function EditPagePage() {
  const params = useParams();
  const pageId = params.page_id as string;
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (!token || !pageId) return;

    const fetchPage = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/pages/${pageId}`, { // TODO: Use env variable
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch page');
        }

        const data: Page = await response.json();
        setSlug(data.slug);
        setTitle(data.title || '');
        setContent(JSON.stringify(data.content, null, 2));
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [token, pageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!token) {
      setError('Authentication token not found.');
      setSaving(false);
      return;
    }

    try {
      const parsedContent = JSON.parse(content);
      const response = await fetch(`http://localhost:8000/pages/${pageId}`, { // TODO: Use env variable
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ slug, title, content: parsedContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update page');
      }

      router.push('/dashboard/pages');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while updating the page. Make sure your JSON is valid.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="max-w-xl mx-auto p-8">Loading page...</p>;
  if (error) return <p className="text-red-500 max-w-xl mx-auto p-8">Error: {error}</p>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Page: {title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Page Title
          </label>
          <input
            type="text"
            id="title"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Page Slug (e.g., home, about-us)
          </label>
          <input
            type="text"
            id="slug"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Page Content (JSON)
          </label>
          <textarea
            id="content"
            rows={10}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Page'}
        </button>
      </form>
    </div>
  );
}
