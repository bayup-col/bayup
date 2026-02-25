📑 Plan de Implementación: SaaS E-commerce Multi-tenant
Este documento detalla la hoja de ruta para la construcción de una plataforma de gestión de e-commerce basada en plantillas, bajo una arquitectura SaaS Multi-tenant, utilizando Next.js, FastAPI y Arquitectura Hexagonal.

🏗️ 0. Definición Técnica y Stack
Frontend: Next.js (App Router), Tailwind CSS, Shadcn/UI.

Backend: Python 3.11+ con FastAPI.

Arquitectura: Hexagonal (Ports & Adapters).

Base de Datos: PostgreSQL (Aislamiento por tenant_id).

Autenticación: Clerk o Auth0 (Multi-tenant support).

Infraestructura: Docker, AWS S3, Nginx/Caddy (Proxy Inverso).

🗂️ Fase 1: Cimientos y Aislamiento (Semanas 1-3)
Objetivo: Establecer la estructura donde vivirán todos los clientes.

1.1. Modelado de Base de Datos (Postgres)
Tenant Scoping: Todas las tablas críticas (products, orders, categories) deben incluir una columna tenant_id.

Índices: Crear índices compuestos (tenant_id, id) para optimizar las consultas y asegurar el aislamiento lógico.

1.2. Backend Hexagonal (FastAPI)
Domain Layer: Definir entidades puras (Tenant, Product, Order).

Application Layer: Definir casos de uso (ej. RegisterNewTenant, ProcessSale).

Infrastructure Layer: * Repository Pattern: Implementar adaptadores para SQLAlchemy/SQLModel.

Middleware de Tenant: Crear un interceptor que extraiga el tenant_id del JWT y lo asocie al contexto de la base de datos en cada request.

1.3. Identidad (Clerk/Auth0)
Configurar organizaciones/tenants en el proveedor de identidad.

Sincronizar el perfil del usuario con la tabla users local para manejar roles internos (Admin vs Operador).

🌐 Fase 2: Motor Multi-dominio y Routing (Semanas 4-5)
Objetivo: Hacer que la plataforma responda a diferentes dominios.

2.1. Middleware de Next.js
Implementar lógica de detección de hostname:

admin.plataforma.com -> Panel de Super Admin.

dashboard.plataforma.com -> Panel del Cliente (Tenant).

*.plataforma.com o dominio-cliente.com -> Tienda pública del cliente.

2.2. Proxy Inverso (Caddy/Nginx)
Configurar Caddy para la generación automática de certificados SSL (Let's Encrypt) para los dominios personalizados que apunten a nuestra IP.

🎨 Fase 3: Page Builder basado en JSON (Semanas 6-9)
Objetivo: Permitir la personalización visual de las tiendas.

3.1. Definición del Contrato JSON
Crear un esquema estándar para las páginas:

JSON

{
  "sections": [
    { "type": "header", "settings": { "logo": "url", "sticky": true } },
    { "type": "hero", "settings": { "title": "Ofertas", "bg": "#000" } }
  ]
}
3.2. Renderizador Dinámico (Frontend)
Crear un diccionario de componentes en React que mapee el type del JSON con un componente real de Shadcn/UI.

Uso de ISR (Incremental Static Regeneration) para cachear las tiendas de los clientes y asegurar tiempos de carga menores a 1s.

3.3. Editor Visual (Mobile-First)
Panel de configuración para el administrador de la empresa donde pueda modificar el JSON de su plantilla y ver cambios en tiempo real (Preview mode).

🛒 Fase 4: Core E-commerce y Lógica de Negocio (Semanas 10-13)
Objetivo: Funcionalidades de venta profesional.

4.1. Gestión de Catálogo
CRUD de productos con variantes (Talla, Color) y gestión de inventario.

Carga de imágenes optimizada directamente a AWS S3 (vía Signed URLs).

4.2. Impuestos y Configuración
Módulo para que cada empresa configure manualmente sus tasas impositivas (ej. IVA 19%, Tax 7%).

Lógica de cálculo en el checkout: subtotal * (1 + tax_rate).

4.3. Carrito y Checkout
Persistencia de carrito en localStorage con sincronización en DB para usuarios logueados.

Checkout optimizado para móviles (One-page checkout).

💳 Fase 5: Split Payments y Comisiones (Semanas 14-16)
Objetivo: Monetización de la plataforma.

5.1. Integración con Wompi
Configurar el flujo de **Split Payments** de Wompi para separar automáticamente la comisión de Bayup del pago al comercio.

Implementar Webhooks para la confirmación de transacciones en tiempo real.

5.2. Lógica de Comisión Decreciente
Implementar el cálculo dinámico basado en el plan del tenant:
- **Básico:** 3.5%
- **Pro:** 2.5%
- **Empresa:** 1.5%
- **Ventas POS:** 0% fija.

Al procesar el pago, enviar automáticamente el % correspondiente a la cuenta maestra de Bayup y el resto directo a la cuenta del cliente a través de Wompi.

🏢 Fase 6: Paneles de Administración (Semanas 17-18)
Objetivo: Gestión de los dos niveles de usuario.

6.1. Panel Super Admin (Nosotros)
Métricas globales: MRR (Ingresos recurrentes), churn rate, tiendas más activas.

Gestión de planes: Creación de niveles (Básico, Pro, Enterprise) con límites de productos.

6.2. Panel Admin de Empresa (Clientes)
Dashboard de ventas propias.

Gestión de pedidos y estados de envío.

Configuración de la marca (Logos, colores, dominio).

🚀 Fase 7: QA, Optimización y Lanzamiento (Semanas 19-20)
Objetivo: Estabilidad y escalabilidad.

7.1. Pruebas y Calidad
Unit Tests: Probar lógica de comisiones en Python.

E2E Tests: Flujo completo de compra con Playwright.

Security: Auditoría de aislamiento (asegurar que el Tenant A no pueda ver datos del Tenant B).

7.2. Despliegue (DevOps)
CI/CD con GitHub Actions.

Monitoreo de errores con Sentry.

Log centralizado para auditoría de transacciones.

🛡️ Reglas de Oro del Proyecto
Mobile First: Ninguna funcionalidad se aprueba si no es perfecta en móvil primero.

Clean Code: Seguir principios SOLID. El código debe ser autodocumentado.

Seguridad: Validación estricta de esquemas con Pydantic (Backend) y Zod (Frontend).

Escalabilidad: El backend debe ser stateless para permitir escalado horizontal.