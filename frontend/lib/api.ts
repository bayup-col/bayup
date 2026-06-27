// Centralized API Client - Dynamic Base URL detection
const getApiBaseUrl = () => {
    // Fallback solo si NEXT_PUBLIC_API_URL no está configurada en el entorno de despliegue
    const PRODUCTION_URL = "https://bayup-backend.onrender.com";

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Si es localhost o IP local, USAR SIEMPRE EL MOTOR LOCAL
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
            return 'http://localhost:8000';
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

    // credentials: 'include' envía las cookies httpOnly automáticamente en cada request
    const config: RequestInit = { ...customConfig, headers, credentials: 'include' };

    try {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const fullUrl = `${baseUrl}${cleanEndpoint}`;

        let response = await fetch(fullUrl, config);

        // Auto-refresh: si el access token expiró, intentar renovarlo con el refresh token (cookie)
        if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
            try {
                const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                });
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    const newToken = refreshData.access_token;
                    if (newToken) localStorage.setItem('token', newToken);
                    const retryHeaders = { ...headers };
                    if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
                    response = await fetch(fullUrl, { ...config, headers: retryHeaders });
                }
            } catch {}
        }

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
        const isProduction = typeof window !== 'undefined' &&
                            (window.location.hostname.includes('railway.app') ||
                             window.location.hostname.includes('bayup.com'));
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
