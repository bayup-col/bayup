"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';

interface Page {
  id: string;
  slug: string;
  title: string | null;
  content: any | null;
}

export default function PagesPage() {
  const { token, isAuthenticated } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/pages', { // TODO: Use env variable
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      setPages(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching pages.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const handleDelete = async (pageId: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) {
      return;
    }
    if (!isAuthenticated || !token) {
      setError('Authentication token not found.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/pages/${pageId}`, { // TODO: Use env variable
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      // Remove the deleted page from the state
      setPages((prevPages) => prevPages.filter((page) => page.id !== pageId));
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting the page.');
    }
  };


  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  if (loading) return <p>Loading pages...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Pages</h1>
        <Link href="/dashboard/pages/new" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Create New Page
        </Link>
      </div>

      {pages.length === 0 ? (
        <p className="text-gray-600">You haven't created any pages yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div key={page.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800">{page.title || 'Untitled Page'}</h2>
              <p className="text-gray-600 mt-2">Slug: {page.slug}</p>
              <div className="mt-4 flex space-x-2">
                <Link href={`/dashboard/pages/${page.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(page.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Delete
                </button>
                <Link href={`/shop/${page.owner_id}/pages/${page.slug}`} className="text-blue-600 hover:text-blue-900 text-sm">
                  View Public
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
