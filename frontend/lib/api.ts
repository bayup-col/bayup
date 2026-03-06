// Centralized API Client
const getApiBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const PRODUCTION_URL = "https://exciting-optimism-production-4624.up.railway.app";
    
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        if (!envUrl || (envUrl.includes("railway.app") && !envUrl.includes("exciting-optimism"))) {
            return PRODUCTION_URL;
        }
    }
    return envUrl || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

interface RequestOptions extends RequestInit {
    token?: string | null;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, ...customConfig } = options;
    
    // Construcción limpia de headers
    const headers = new Headers();

    // 1. Token de Seguridad
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // 2. Inteligencia de Contenido
    const isFormData = customConfig.body instanceof FormData;
    
    // Si NO es FormData, forzamos JSON. Si ES FormData, NO ponemos nada (El navegador pone el boundary)
    if (!isFormData) {
        headers.set('Content-Type', 'application/json');
    }

    // Mezclar con headers personalizados si existen
    if (customConfig.headers) {
        Object.entries(customConfig.headers).forEach(([key, value]) => {
            headers.set(key, value as string);
        });
    }

    const config: RequestInit = {
        ...customConfig,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            if (response.status === 401) {
                console.warn(`[API] Sesión expirada.`);
                localStorage.removeItem('token');
            }
            
            let errorMsg = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                // Aplanar errores de validación de FastAPI (422)
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        errorMsg = errorData.detail.map((e: any) => e.msg).join(", ");
                    } else {
                        errorMsg = errorData.detail;
                    }
                }
            } catch (e) {
                const text = await response.text();
                errorMsg = text || errorMsg;
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
