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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error en la petición API');
    }

    return response.json();
}

// User-specific API calls
export const userService = {
    getMe: (token: string) => apiRequest('/auth/me', { token }),
    updateSocialLinks: (token: string, socialLinks: any) => 
        apiRequest('/auth/update-social-links', { 
            method: 'PUT', 
            token, 
            body: JSON.stringify({ social_links: socialLinks }) 
        }),
    updateWhatsAppLines: (token: string, lines: any) => 
        apiRequest('/auth/update-whatsapp-lines', { 
            method: 'PUT', 
            token, 
            body: JSON.stringify({ whatsapp_lines: lines }) 
        }),
};
