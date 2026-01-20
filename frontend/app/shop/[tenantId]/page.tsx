"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PageRenderer from '../../../../components/PageRenderer'; // Adjust path as needed

interface PageContent {
  sections: any[]; // Define a more specific type if needed
}

export default function TenantShopPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageContent = useCallback(async () => {
    if (!tenantId) {
      setError('Tenant ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // For MVP, fetch a default "home" page slug
      const response = await fetch(`http://localhost:8000/public/stores/${tenantId}/pages/home`, { // TODO: Use env variable
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch store page content');
      }

      const data = await response.json();
      setPageContent(data.content); // Assuming the API returns {id, slug, title, content}
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching store content.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPageContent();
  }, [fetchPageContent]);

  if (loading) return <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading store...</p>;
  if (error) return <p className="text-red-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Error: {error}</p>;
  if (!pageContent) return <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">No content found for this store.</p>;

  return (
    <div className="max-w-7xl mx-auto">
      {pageContent && <PageRenderer content={pageContent} />}
    </div>
  );
}
