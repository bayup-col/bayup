// Centralized Type Definitions for BaseCommerce

export interface MonthData {
    month: string;
    amount: number;
}

export interface Seller {
    id: string;
    name: string;
    role: string;
    branch: string;
    total_sales: number;
    sales_today: number;
    sales_month: number;
    last_month_sales: number;
    channels: {
        web: boolean;
        social: boolean;
        separados: boolean;
        in_store: boolean;
    };
    history: MonthData[];
    avatar: string;
}

export interface NavItem { 
    id: string; 
    label: string; 
    href: string; 
    type: 'url' | 'anchor'; 
    target_id?: string; 
}

export interface ShortcutIcon { 
    id: string; 
    type: 'search' | 'cart' | 'user' | 'custom'; 
    icon: string; 
    href: string; 
    style: 'minimal' | 'bold' | 'circle'; 
}

export interface Announcement { 
    id: string; 
    text: string; 
}

export interface WhatsAppLine {
    id: string;
    name: string;
    number: string;
    status: string;
}

export interface AIAssistant {
    id: string;
    name: string;
    description: string;
    type: 'appointment_setter' | 'cart_recovery' | 'customer_reengagement' | 'custom';
    status: 'active' | 'inactive';
    last_run: string | null;
    total_actions: number;
    success_rate: number;
    config: any; // Parámetros específicos de n8n
}
