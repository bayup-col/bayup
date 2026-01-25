# Guía de Contribución y Buenas Prácticas - Bayup

Este documento establece los estándares técnicos para el desarrollo de la plataforma Bayup. El objetivo es mantener un código limpio, escalable y profesional.

## 🌟 Reglas de Oro

### 1. Arquitectura de Componentes (Atomicidad)
*   **Archivos Pequeños:** Los archivos `.tsx` no deben exceder las 250 líneas.
*   **Modularidad:** Si un elemento se repite o es complejo, extráelo a `frontend/components/`.
*   **Ubicación:** 
    *   Componentes globales -> `frontend/components/`
    *   Componentes específicos del Dashboard -> `frontend/components/dashboard/`

### 2. TypeScript Estricto
*   **Prohibido el uso de `any`:** Todos los datos deben estar tipados.
*   **Tipos Centralizados:** Las interfaces compartidas (User, Product, Seller, etc.) deben definirse en `frontend/lib/types.ts`.
*   **Prop-types:** Define interfaces claras para las props de cada componente.

### 3. Gestión de API
*   **Cliente Único:** Todas las peticiones al backend deben usar el cliente centralizado en `frontend/lib/api.ts`.
*   **Servicios:** Agrupa las llamadas por dominio (ej. `userService`, `productService`) dentro de la capa de servicios.
*   **Seguridad:** No quemes URLs en los componentes. Usa variables de entorno (`.env`).

### 4. Idioma y Nomenclatura
*   **Código en Inglés:** Variables, funciones, nombres de archivos y comentarios deben escribirse en inglés (ej. `isSaving`, `handleUpdate`).
*   **Interfaz en Español:** Los textos visibles para el usuario final deben estar en español.
*   **Consistencia:** Usa *PascalCase* para componentes y *camelCase* para variables/funciones.

### 5. Lógica vs Vista (Hooks)
*   **Separación de Intereses:** Evita saturar los archivos `.tsx` con lógica compleja.
*   **Custom Hooks:** Mueve la lógica de estado y efectos a hooks personalizados si la página se vuelve difícil de leer.

---

## 🚀 Proceso de Despliegue
Antes de hacer `push` a `main`:
1. Ejecuta `npm run build` en la carpeta `frontend` para asegurar que no hay errores de TypeScript.
2. Verifica que no haya archivos de configuración (`vercel.json`, `package.json`) en la raíz que puedan entrar en conflicto con el **Root Directory** de Vercel.
