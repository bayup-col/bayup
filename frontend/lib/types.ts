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
