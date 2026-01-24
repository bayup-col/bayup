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
                const response = await fetch('http://localhost:8000/admin/users', {
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

        fetchUsers();
    }, [isAuthenticated, token]);

    if (loading) return <p>Cargando datos del Super Admin...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de Super Admin</h1>
            <p className="text-gray-600 mb-4">
                Esta área es para que los administradores de la plataforma gestionen usuarios, planes y otras configuraciones del sistema.
            </p>

            {/* Lista de Usuarios */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Todos los Usuarios</h2>
            {users.length === 0 ? (
                <p className="text-gray-600">No se encontraron usuarios.</p>
            ) : (
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.id} className="border p-4 rounded-md bg-gray-50">
                            <p><strong>Correo:</strong> {user.email}</p>
                            <p><strong>Nombre:</strong> {user.full_name || 'N/A'}</p>
                            <p><strong>Rol:</strong> {user.role}</p>
                            <p><strong>Plan ID:</strong> {user.plan_id || 'N/A'}</p>
                            {/* Las acciones de cambiar rol/plan podrían ir aquí */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
