# 🚀 CONTEXTO MAESTRO: PROYECTO BAYUP

> **Para el Nuevo Desarrollador / Gemini CLI:**
> Este documento contiene la "verdad única" sobre el estado, propósito y arquitectura de Bayup. Úsalo para alinearte rápidamente con el equipo.

---

## 1. 🧬 ¿Qué es Bayup? (ADN del Proyecto)
Bayup no es solo un CMS de e-commerce; es un **socio de crecimiento**.
A diferencia de Shopify o Tiendanube, **Bayup democratiza el comercio electrónico eliminando las barreras de entrada**.

*   **Filosofía:** "Tu éxito es nuestro éxito".
*   **Diferencial Clave:** No cobramos mensualidades fijas en los planes de entrada. Solo ganamos una pequeña comisión si el usuario vende.
*   **Visión:** Crear un ecosistema "Todo en Uno" (Tienda, POS, WhatsApp, Marketing, Logística) con una estética **"Platinum Plus"** (Futurista, Limpia, Premium).

---

## 2. 💼 Modelo de Negocio: Los Planes
Actualmente manejamos 3 niveles de servicio:

### 🟢 Plan Básico (Start)
*   **Costo:** $0 USD / mes.
*   **Modelo:** Comisión por venta exitosa.
*   **Incluye:** Tienda personalizada, Botón de WhatsApp, Gestión de productos ilimitada, Pasarela de pagos.
*   **Target:** Emprendedores que inician.

### 🔵 Plan Pro Elite (Growth)
*   **Costo:** $0 USD / mes (Comisión reducida).
*   **Incluye:** Todo lo del Básico + Dominio propio, Analítica Avanzada, Herramientas de Marketing Pro, Personalización CSS.
*   **Target:** Marcas en crecimiento que buscan identidad propia.

### 🟣 Plan Empresa (Scale) - *Próximamente*
*   **Costo:** Personalizado / Fijo.
*   **Incluye:** API dedicada, Soporte VIP 24/7 con asesor humano, Multi-sucursal, Consultoría estratégica.
*   **Target:** Grandes volúmenes de venta.

---

## 3. 🛠️ Stack Tecnológico & Herramientas

### Frontend (La Joya de la Corona)
*   **Framework:** Next.js 14 (App Router).
*   **Lenguaje:** TypeScript.
*   **Estilos:** Tailwind CSS.
*   **Animaciones (CRÍTICO):** Framer Motion (usado extensivamente para efectos 3D, Rolling Text, Aurora Borders).
*   **Iconos:** Lucide React.
*   **Componentes Clave:** Glassmorphism, Tilt 3D Cards, Gradientes Interactivos.

### Backend (El Motor)
*   **Framework:** Python (FastAPI).
*   **Base de Datos:** Supabase (PostgreSQL).
*   **Autenticación:** Clerk / Supabase Auth.
*   **IA:** Integración con LLMs para "Bayt" (El asistente virtual).

### Infraestructura
*   **Deploy:** Vercel.
*   **Contenedores:** Docker.
*   **Control de Versiones:** Git (GitHub).

---

## 4. 📂 Estado Actual de la Plataforma

### ✅ Módulos Completados / Avanzados:
1.  **Landing Page (Home):** Nivel "Platinum Plus". Incluye:
    *   Scroll Narrativo con fondos 3D (Alcancía, Megáfono, Gráfica).
    *   Tabla comparativa interactiva (Glassmorphism).
    *   Sección de Aliados (Soporte Humano).
    *   Globo 3D interactivo ("Vende en todo el mundo").
2.  **Dashboard Principal:** Panel de control modular.
3.  **Facturación (POS):** Sistema de venta manual, integración con WhatsApp y control de stock.
4.  **Staff & Permisos:** Sistema RBAC completo para gestionar empleados y roles.
5.  **Productos:** Gestión de inventario con variantes.

### 🚧 En Desarrollo / Roadmap:
*   Refinamiento del asistente de IA "Bayt".
*   Módulo avanzado de Afiliados.
*   Integraciones logísticas automatizadas.

---

## 5. 🎨 Guía de Estilo & UI (Design System)

Si vas a tocar código visual, debes respetar estas reglas sagradas:

1.  **Colores Corporativos:**
    *   **Cyan Neón:** `#00f2ff` (Acentos, brillos, botones primarios).
    *   **Petroleum Profundo:** `#004d4d` (Fondos, textos fuertes, elementos oscuros).
2.  **Estética "Platinum Plus":**
    *   Uso de **Glassmorphism** (fondos translúcidos con `backdrop-blur`).
    *   Bordes con efecto **"Aurora"** (gradientes en movimiento).
    *   Sombras profundas y dinámicas para dar **Volumen 3D**.
    *   Tipografías grandes, en mayúsculas e itálicas para títulos de impacto.
3.  **Interacción:** Todo debe reaccionar al mouse (Hover effects, Tilt, Glow). Nada es estático.

---

## 6. ⚠️ Reglas del Workflow (Gemini CLI)

1.  **Ramas de Git:**
    *   `main`: **SAGRADA**. Es producción. Solo se toca para merges finales.
    *   `development`: Zona de guerra. Aquí hacemos los cambios.
2.  **Proceso de Edición:**
    *   Siempre usa `read_file` antes de editar para entender el contexto.
    *   Usa `replace` para cambios quirúrgicos.
    *   Si un cambio es visualmente complejo, prefiere `write_file` con el componente completo para evitar errores de sintaxis.
3.  **Mentalidad:** No asumas nada. Verifica las librerías instaladas (`package.json`) antes de importar algo nuevo.

---

## 7. 🚀 Tu Primera Misión (Sugerencia)

Para familiarizarte, te sugiero:
1.  Leer el archivo `frontend/components/landing/NarrativeScroll.tsx`. Es el componente más complejo visualmente ahora mismo.
2.  Revisar `frontend/app/dashboard/invoicing/page.tsx` para entender la lógica de negocio (POS).
3.  Ejecutar el proyecto localmente y navegar por la Landing Page para ver las animaciones en acción.

**¡Bienvenido al equipo Bayup! Vamos a construir el futuro del e-commerce.**
