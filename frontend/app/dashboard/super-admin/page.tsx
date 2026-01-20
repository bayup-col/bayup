"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/auth-context';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    plan_id: string | null;
}

export default function SuperAdminPage() {
    const { token, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                // For MVP, this endpoint doesn't exist yet, it's illustrative.
                // In a real scenario, this would be a protected /admin/users endpoint
                // that only super_admins can access.
                // For now, it will return an error as no such endpoint is implemented.
                const response = await fetch('http://localhost:8000/admin/users', { // TODO: Implement admin endpoints
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch users or unauthorized access');
                }

                const data = await response.json();
                setUsers(data);
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching users.');
            } finally {
                setLoading(false);
            }
        };
        // fetchUsers(); // Don't call this for now as endpoint doesn't exist
        setLoading(false); // Manually set loading to false for placeholder
        setError("Super Admin endpoint not yet implemented on backend. This page is a placeholder.");
    }, [isAuthenticated, token]);

    if (loading) return <p>Loading Super Admin data...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Super Admin Dashboard</h1>
            <p className="text-gray-600 mb-4">
                This area is for platform administrators to manage users, plans, and other system-wide settings.
                Functionality for this section is currently a placeholder.
            </p>

            {/* Placeholder for User List */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Users (Placeholder)</h2>
            {users.length === 0 ? (
                <p className="text-gray-600">No users found or endpoint not implemented.</p>
            ) : (
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.id} className="border p-4 rounded-md bg-gray-50">
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                            <p><strong>Plan ID:</strong> {user.plan_id || 'N/A'}</p>
                            {/* Actions like change role/plan could go here */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
