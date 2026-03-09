// Centralized API Client - Dynamic Base URL detection
const getApiBaseUrl = () => {
    const PRODUCTION_URL = "https://exciting-optimism-production-4624.up.railway.app";
    
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
                        
        if (isLocal) {
            return 'http://localhost:8000';
        }
        return PRODUCTION_URL;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
        console.error(`[API] Fallo en ${endpoint}:`, error.message);
        throw error;
    }
}

// SERVICES
export const userService = {
    getMe: (token: string) => apiRequest<any>('/auth/me', { token }),
    getAll: (token: string) => apiRequest<any[]>('/admin/users', { token }),
    create: (token: string, data: any) => 
        apiRequest('/admin/users', { method: 'POST', token, body: JSON.stringify(data) }),
    updateDetails: (token: string, data: any) => 
        apiRequest('/admin/update-user', { method: 'POST', token, body: JSON.stringify(data) }),
    delete: (token: string, userId: string) =>
        apiRequest(`/admin/users/${userId}`, { method: 'DELETE', token }),
    getLogs: (token: string) => apiRequest<any[]>('/admin/logs', { token }),
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
