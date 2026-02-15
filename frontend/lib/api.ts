// Centralized API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
    token?: string | null;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, ...customConfig } = options;
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...customConfig.headers,
    };

    const config: RequestInit = {
        ...customConfig,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorClone = response.clone();
        let errorMsg = `Error ${response.status}`;
        try {
            const errorData = await errorClone.json();
            errorMsg = errorData.detail || errorMsg;
        } catch (e) {
            errorMsg = await response.text() || errorMsg;
        }

        if (response.status === 401) {
            console.warn(`Sesión no autorizada en ${endpoint}.`);
            localStorage.removeItem('token');
        }
        
        throw new Error(errorMsg);
    }

    return response.json();
}

// SERVICES
export const userService = {
    getMe: (token: string) => apiRequest<any>('/auth/me', { token }),
    getAll: (token: string) => apiRequest<any[]>('/admin/users', { token }),
    create: (token: string, data: any) => 
        apiRequest('/admin/users', { 
            method: 'POST', 
            token, 
            body: JSON.stringify(data) 
        }),
    updateDetails: (token: string, data: any) => 
        apiRequest('/admin/update-user', { 
            method: 'POST', 
            token, 
            body: JSON.stringify(data) 
        }),
    delete: (token: string, userId: string) =>
        apiRequest(`/admin/users/${userId}`, { method: 'DELETE', token }),
    
    getLogs: (token: string) => apiRequest<any[]>('/admin/logs', { token }),
    
    // Custom Roles
    getRoles: (token: string) => apiRequest<any[]>('/admin/roles', { token }),
    createRole: (token: string, data: any) => 
        apiRequest('/admin/roles', { method: 'POST', token, body: JSON.stringify(data) }),
    updateRole: (token: string, roleId: string, data: any) => 
        apiRequest(`/admin/roles/${roleId}`, { method: 'PUT', token, body: JSON.stringify(data) }),
    deleteRole: (token: string, roleId: string) =>
        apiRequest(`/admin/roles/${roleId}`, { method: 'DELETE', token }),
};

export const productService = {
    getAll: (token: string) => apiRequest<any[]>('/products', { token }),
    create: (token: string, data: any) => 
        apiRequest('/products', { 
            method: 'POST', 
            token, 
            body: JSON.stringify(data) 
        }),
};

export const orderService = {
    getAll: (token: string) => apiRequest<any[]>('/orders', { token }),
    create: (token: string, data: any) => 
        apiRequest('/orders', { 
            method: 'POST', 
            token, 
            body: JSON.stringify(data) 
        }),
    updateStatus: (token: string, orderId: string, status: string) =>
        apiRequest(`/orders/${orderId}/status?status=${status}`, {
            method: 'PUT',
            token
        })
};

export const assistantService = {
    getAll: (token: string) => apiRequest<any[]>('/ai-assistants', { token }),
    create: (token: string, data: any) => 
        apiRequest('/ai-assistants', { method: 'POST', token, body: JSON.stringify(data) }),
    delete: (token: string, id: string) => 
        apiRequest(`/ai-assistants/${id}`, { method: 'DELETE', token }),
    getLogs: (token: string, id: string) => 
        apiRequest<any[]>(`/ai-assistants/${id}/logs`, { token }),
};

export const pageService = {
    getAll: (token: string) => apiRequest<any[]>('/pages', { token }),
    getById: (token: string, id: string) => apiRequest<any>(`/pages/${id}`, { token }),
    create: (token: string, data: any) => 
        apiRequest('/pages', { method: 'POST', token, body: JSON.stringify(data) }),
    update: (token: string, id: string, data: any) => 
        apiRequest(`/pages/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
    delete: (token: string, id: string) => 
        apiRequest(`/pages/${id}`, { method: 'DELETE', token }),
};

export const categoryService = {
    getAll: (token: string) => apiRequest<any[]>('/collections', { token }),
    create: (token: string, data: any) => 
        apiRequest('/collections', { method: 'POST', token, body: JSON.stringify(data) }),
    delete: (token: string, id: string) => 
        apiRequest(`/collections/${id}`, { method: 'DELETE', token }),
};

export const shopPageService = {
    get: (token: string, pageKey: string) => 
        apiRequest<any>(`/shop-pages/${pageKey}`, { token }),
    save: (token: string, data: any) => 
        apiRequest('/shop-pages', { method: 'POST', token, body: JSON.stringify(data) }),
    getPublic: (tenantId: string, pageKey: string) => 
        apiRequest<any>(`/public/shop-pages/${tenantId}/${pageKey}`),
};

export const publicService = {
    getStorePage: (tenantId: string, slug: string) => 
        apiRequest<any>(`/public/stores/${tenantId}/pages/${slug}`),
    getStoreProducts: (tenantId: string) => 
        apiRequest<any[]>(`/public/stores/${tenantId}/products`),
};
