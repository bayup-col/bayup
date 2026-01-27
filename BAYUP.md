# BAYUP: Documento Maestro del Ecosistema E-commerce AI

## 1. Visión General
**Bayup** es una plataforma de comercio electrónico de última generación diseñada para centralizar la operación, el crecimiento y la gestión de tiendas digitales y físicas en una única interfaz premium. A diferencia de las plataformas tradicionales, Bayup integra Inteligencia Artificial nativa (**Bayt**) y un sistema de automatización robusto para eliminar la fricción operativa.

## 2. Metodología de Trabajo
El proyecto se desarrolla bajo una filosofía de **Diseño Full & Conectividad Total**:
*   **Interfaz Premium:** Cada módulo debe mantener una estética de alto nivel (Glassmorphism, sombras suaves, animaciones fluidas con Framer Motion).
*   **Single Source of Truth:** El inventario, las ventas y los clientes están sincronizados en tiempo real entre el POS (Punto de Venta) y la tienda online.
*   **Modularidad:** Arquitectura desacoplada (FastAPI en el Backend y Next.js en el Frontend) que permite escalar funciones sin comprometer la estabilidad.

## 3. Estructura de Planes y Negocio
Bayup democratiza el acceso a tecnología enterprise con un modelo basado en el éxito del cliente.

### **Plan Básico**
*   **Costo:** $0 / mes.
*   **Comisión por Venta:** 2.5%.
*   **Alcance:** Operación esencial para emprendedores.
*   **Módulos Incluidos:**
    *   Visualizador y creador de Tienda Online (Funciones base).
    *   Dashboard de Inicio.
    *   Gestión de Pedidos y Envíos.
    *   Productos: Lista total, Colecciones e Inventario.
    *   Mensajería: Funciones básicas (sin IA).
    *   Clientes: Base de datos parcial.
    *   Informes: Análisis General.
    *   Configuración: Info General y Mi Plan.
*   **Restricción:** No incluye acceso al asistente Bayt.

### **Plan Pro**
*   **Costo:** $0 / mes.
*   **Comisión por Venta:** 3.5%.
*   **Alcance:** Potencia total para negocios en crecimiento que prefieren no pagar mensualidad fija.
*   **Módulos Incluidos:**
    *   Tienda Online Full (Todas las funciones activas).
    *   Operación Completa: Pedidos, Envíos y Facturación (POS).
    *   Productos Full: Catálogos WhatsApp, Bodegas y Stock.
    *   Mensajería: Módulo completo de chats.
    *   Finanzas y Crecimiento: Links de pago, Marketing, Club de Puntos, Descuentos.
    *   Gestión: Nómina y CRM Completo (Base de datos total).
    *   Informes Avanzados: Vendedores, Cuentas y Cartera, Control de Gastos.
    *   Configuración: Acceso a sub-módulo de Finanzas.
*   **Restricción:** No incluye acceso al asistente Bayt.

### **Plan Empresa (Enterprise)**
*   **Costo:** $270 USD / mes.
*   **Comisión por Venta:** 2.0%.
*   **Alcance:** La experiencia definitiva de Bayup con inteligencia artificial sin restricciones.
*   **Módulos Incluidos:** **Acceso Total e Ilimitado** a toda la plataforma.
*   **Beneficio Exclusivo:** Uso libre de **Bayt** (Asistente IA) para automatización de ventas, atención al cliente y análisis predictivo.

> **Nota sobre Costos Transaccionales:** Los porcentajes de comisión de Bayup son adicionales a los costos de las pasarelas de pago externas (Promedio estimado: 3.5% + $500 COP fijos por transacción exitosa).

---

## 4. Roles del Sistema

### **Super Admin (Maestro)**
Es el centro de control de Bayup. Permite supervisar la salud del ecosistema completo.
*   **Dashboard Global:** Métricas de toda la plataforma.
*   **Comercial:** Control de ingresos por comisiones y suscripciones.
*   **Clientes (Tenants):** Gestión de todas las tiendas creadas.
*   **Ventas:** Seguimiento de transacciones a nivel global.
*   **Afiliados:** Sistema de referidos y partners (**En Construcción**).
*   **Roles & Sistema:** Configuración de permisos maestros.

### **Admin Tienda (Dueño de Negocio)**
Tiene el control total sobre su propia tienda y staff. Puede delegar permisos específicos a su equipo mediante el módulo de Staff.

### **Staff (Colaboradores)**
Usuarios sujetos a **RBAC (Control de Acceso Basado en Roles)**. Solo ven los módulos que el Admin Tienda les asigne (Ej: un Vendedor solo ve Facturación, un Bodeguero solo ve Inventario).

### **Afiliado**
*(Estado: En fase de diseño y construcción)*. Rol destinado a la expansión de la plataforma mediante recomendaciones.

---

## 5. Glosario de Módulos (Admin Tienda)

### **Operación**
1.  **Inicio:** Dashboard con métricas clave de la tienda.
2.  **Facturación (POS):** Punto de venta físico para ventas manuales con descuento automático de stock.
3.  **Pedidos:** Gestión del ciclo de vida de cada venta.
4.  **Envíos:** Logística y seguimiento de paquetes.
5.  **Multiventa:** Integración con canales de venta externos.
6.  **Mensajes:** Centro de atención al cliente (WhatsApp/Instagram).
7.  **Link de Pago:** Generación de enlaces directos de cobro.
8.  **Clientes:** CRM para gestión de base de datos y fidelización.
9.  **Garantías:** Gestión de devoluciones y soporte post-venta.

### **Productos**
1.  **Todos los Productos:** Catálogo maestro.
2.  **Colecciones:** Agrupación lógica de productos.
3.  **Inventario:** Control de existencias por variante.
4.  **Catálogos WhatsApp:** Generación de PDFs o links compartibles.
5.  **Separados (IA):** Gestión inteligente de apartados de mercancía.
6.  **Cotizaciones:** Creación de propuestas comerciales.
7.  **Bodegas:** Gestión de múltiples puntos de almacenamiento.

### **Crecimiento & Gestión**
1.  **Marketing:** Herramientas de difusión y campañas.
2.  **Club de Puntos:** Sistema de fidelización (Loyalty).
3.  **Descuentos:** Cupones y reglas de precios.
4.  **Automatizaciones:** Flujos de trabajo automáticos.
5.  **Asistentes IA:** Entrenamiento y despliegue de Bayt.
6.  **Nómina:** Pago y gestión de empleados.
7.  **Informes:** Análisis profundo de la rentabilidad.

---

## 6. Diferenciación Competitiva
*   **Inteligencia Artificial Bayt:** No es un chatbot común; es un asistente que entiende el inventario, los precios y las necesidades del cliente para cerrar ventas solo.
*   **Modelo de Comisión:** Permite que los negocios tengan herramientas Pro sin pagar una suscripción mensual, creciendo junto a la plataforma.
*   **Centralización Total:** Elimina la necesidad de usar 5 herramientas diferentes; Bayup lo tiene todo, desde la nómina hasta el POS.
*   **Diseño Enterprise:** Una interfaz que no solo funciona bien, sino que proyecta profesionalismo y lujo a los clientes del comercio.

---
*Documento actualizado al lunes, 26 de enero de 2026.*
