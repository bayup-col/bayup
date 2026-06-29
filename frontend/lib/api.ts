// Centralized API Client - Dynamic Base URL detection
const getApiBaseUrl = () => {
    // Fallback solo si NEXT_PUBLIC_API_URL no está configurada en el entorno de despliegue
    const PRODUCTION_URL = "https://bayup-backend.onrender.com";

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Si es localhost o IP local, usar el motor local — respeta
        // NEXT_PUBLIC_API_URL si está definida (puede no ser :8000, p.ej. si
        // ese puerto ya está ocupado por otro proceso en la máquina) y solo
        // cae al :8000 de siempre si no hay nada configurado.
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
            return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        }
        // Cualquier otro dominio (producción, túneles de desarrollo, previews de Vercel):
        // usar la variable de entorno configurada, y solo si falta, el fallback de producción.
        return process.env.NEXT_PUBLIC_API_URL || PRODUCTION_URL;
    }
    return process.env.NEXT_PUBLIC_API_URL || PRODUCTION_URL;
};

interface RequestOptions extends RequestInit {
    token?: string | null;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, ...customConfig } = options;
    const baseUrl = getApiBaseUrl();
    
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!(customConfig.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (customConfig.headers) Object.assign(headers, customConfig.headers);

    const config: RequestInit = { ...customConfig, headers };

    try {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const fullUrl = `${baseUrl}${cleanEndpoint}`;
        
        const response = await fetch(fullUrl, config);

        if (!response.ok) {
            if (response.status === 401) localStorage.removeItem('token');
            let errorMsg = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = Array.isArray(errorData.detail) ? errorData.detail.map((e: any) => e.msg).join(", ") : (errorData.detail || errorMsg);
            } catch (e) {
                errorMsg = await response.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }
        return await response.json();
    } catch (error: any) {
        // DETECCIÓN MAESTRA DE PRODUCCIÓN: Railway o Dominio Propio
        const isProduction = typeof window !== 'undefined' && 
                            (window.location.hostname.includes('railway.app') || 
                             window.location.hostname.includes('bayup.com'));

        // En producción, silenciamos TODOS los errores de red/API para mantener la consola limpia
        // Esto es crítico cuando el backend está reiniciando (502) o desplegando (404)
        if (!isProduction) {
            console.error(`[API] Fallo en ${endpoint}:`, error.message);
        }
        
        throw error;
    }
}

// SERVICES
export const userService = {
    getMe: (token: string) => apiRequest<any>('/auth/me', { token }),
    getAll: (token: string) => apiRequest<any[]>('/admin/staff', { token }),
    create: (token: string, data: any) =>
        apiRequest('/admin/staff', { method: 'POST', token, body: JSON.stringify(data) }),
    updateDetails: (token: string, data: any) =>
        apiRequest('/admin/update-user', { method: 'POST', token, body: JSON.stringify(data) }),
    delete: (token: string, userId: string) =>
        apiRequest(`/admin/staff/${userId}`, { method: 'DELETE', token }),
    getLogs: (token: string) => apiRequest<any[]>('/admin/logs', { token }),
    getRoles: (token: string) => apiRequest<any[]>('/admin/roles', { token }),
    updateRole: (token: string, roleId: string, data: any) =>
        apiRequest(`/admin/roles/${roleId}`, { method: 'PUT', token, body: JSON.stringify(data) }),
};

export const productService = {
    getAll: (token: string) => apiRequest<any[]>('/products', { token }),
    create: (token: string, data: any) => 
        apiRequest('/products', { method: 'POST', token, body: JSON.stringify(data) }),
    update: (token: string, id: string, data: any) =>
        apiRequest(`/products/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
};

export const orderService = {
    getAll: (token: string) => apiRequest<any[]>('/orders', { token }),
    create: (token: string, data: any) => 
        apiRequest('/orders', { method: 'POST', token, body: JSON.stringify(data) }),
};

export const categoryService = {
    getAll: (token: string) => apiRequest<any[]>('/collections', { token }),
    create: (token: string, data: any) => 
        apiRequest('/collections', { method: 'POST', token, body: JSON.stringify(data) }),
};
