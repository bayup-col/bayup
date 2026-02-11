// frontend/lib/plan-configs.ts

export type ModuleId = 
  | 'inicio' | 'facturacion' | 'pedidos' | 'envios' | 'productos' | 'products_all' 
  | 'inventory' | 'catalogs' | 'separados' | 'cotizaciones' | 'bodegas' 
  | 'multiventa' | 'mensajes' | 'clientes' | 'garantias' | 'web_analytics' 
  | 'marketing' | 'loyalty' | 'discounts' | 'automations' | 'ai_assistants'
  | 'reports' | 'reports_gen' | 'reports_payroll' | 'purchase_orders' | 'sucursales' 
  | 'vendedores' | 'cuentas' | 'gastos' | 'comisiones' | 'settings' 
  | 'settings_general' | 'settings_plan' | 'settings_users';

export const BASICO_MODULES: ModuleId[] = [
    'inicio', 
    'facturacion', 
    'pedidos', 
    'envios', 
    'productos', 
    'products_all', 
    'mensajes', 
    'clientes', 
    'settings', 
    'settings_general', 
    'settings_plan', 
    'reports', 
    'reports_gen'
];

export const PRO_MODULES: ModuleId[] = [
    ...BASICO_MODULES,
    'inventory', 
    'garantias', 
    'web_analytics', 
    'marketing', 
    'loyalty', 
    'discounts', 
    'automations',
    'catalogs',   // Agregado a Pro
    'separados',  // Agregado a Pro
    'cotizaciones' // Página web para mayoristas / Cotizaciones
];

export const EMPRESA_MODULES: ModuleId[] = [
    ...PRO_MODULES,
    'multiventa',    // Movido a Empresa
    'ai_assistants', // Movido a Empresa
    'bodegas', 
    'reports_payroll', 
    'purchase_orders', 
    'sucursales', 
    'vendedores', 
    'cuentas', 
    'gastos', 
    'comisiones', 
    'settings_users'
];

export const getModulesByPlan = (planName: string): ModuleId[] => {
    switch (planName) {
        case 'Empresa': return EMPRESA_MODULES;
        case 'Pro': return PRO_MODULES;
        default: return BASICO_MODULES;
    }
};
