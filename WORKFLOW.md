# BAYUP — Estrategia de Ramas y Releases

## Estado actual

| Rama | Entorno | Plataforma | URL |
|------|---------|------------|-----|
| `main` | **Producción** | Vercel (auto-deploy, alias de producción) + Render (auto-deploy) | www.bayup.com.co |
| `development` | Integración | Vercel (preview automático por push) | `bayup-git-development-*.vercel.app` |

> `main` ES producción. `development` es la rama donde se integra el trabajo
> del equipo antes de pasar a producción — Vercel genera un preview del
> frontend en cada push, pero **no hay un backend de Render separado para
> `development`**: ese preview sigue hablando con la API de producción salvo
> que se configure `NEXT_PUBLIC_API_URL` distinto. No asumir que `development`
> es un entorno aislado de extremo a extremo todavía (ver "Estrategia de
> staging" más abajo).

---

## Flujo de trabajo recomendado

### Para cambios pequeños o urgentes
```
development  ← push directo (solo si el cambio es trivial y probado localmente)
```

### Para cualquier feature o fix con riesgo
```
development ← PR desde feature/fix-branch
```

1. Crear rama desde `development`:
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/nombre-descriptivo
   ```

2. Desarrollar y hacer commit localmente. Correr `pytest` (backend) y
   `npm run build` (frontend) antes de subir — el CI corre lo mismo, pero
   detectarlo localmente ahorra una vuelta.

3. Abrir Pull Request hacia `development` en GitHub.
   - `BaseCommerce CI` corre flake8 + pytest (backend) y build (frontend).
   - `Quality Gate` corre typecheck TS + syntax check Python.
   - El bot añade un comentario con el resumen en el PR.

4. Revisar el comentario del bot. Si el syntax check de Python o `BaseCommerce CI`
   fallan: **no mergear**.

5. Merge a `development` → solo despliega el preview de Vercel, no producción.

6. Cuando `development` esté estable y confirmado: merge `development → main`.
   - Verificar antes: `pytest` (204 tests) y `npm run build` en local o CI en verde.
   - Push a `main` → Vercel y Render despliegan producción automáticamente.
   - Confirmar tras el deploy: `curl https://api.bayup.com.co/health`.

---

## Estrategia de staging (cuando el volumen lo justifique)

Cuando se necesite un entorno de staging separado:

1. Crear rama `staging` desde `development`.
2. En Vercel: añadir un "Branch deployment" para `staging` con dominio
   `staging.bayup.com.co` (sin afectar producción).
3. En Render: crear un servicio duplicado que escuche el webhook de la rama
   `staging`.
4. El flujo queda:
   ```
   feature/* → staging → (QA aprueba) → development → main (= producción)
   ```

---

## Cómo hacer un release

El "release" es el merge `development → main`. Para marcar hitos:

```bash
git tag -a v1.2.0 -m "Release 1.2.0: descripción del cambio principal"
git push origin v1.2.0
```

---

## Cómo hacer rollback

Ver `scripts/rollback.sh` para instrucciones detalladas.

**Resumen rápido:**

- **Frontend (Vercel):** Dashboard → Deployments → deployment anterior → `Promote to Production`
  Tarda ~30 segundos, sin redeploy.

- **Backend (Render):** Dashboard → servicio → Events → deployment anterior → `Rollback to this deploy`
  Tarda ~1-2 minutos.

- **Alternativa universal:** `git revert <SHA> && git push origin main`
  Crea un commit de reversión; Vercel y Render reaccionan automáticamente.

---

## Reglas del equipo

- **Nunca hacer `git push --force` a `development` ni a `main`.**
- Si un PR falla el syntax check de Python o `BaseCommerce CI`: resolver antes de mergear.
- Si el typecheck de TS reporta errores nuevos (distintos de los 7 preexistentes):
  resolverlos antes de mergear.
- Antes de mergear `development → main`: confirmar que `pytest` y `npm run build`
  pasan (local o vía CI en `development`).
- Después de cada deploy a `main` que toque la base de datos: verificar `/health`
  (`curl https://api.bayup.com.co/health`) antes de cerrar el ticket.
- Documentar incidentes de producción con: qué falló, cuánto tardó el rollback,
  cómo se previene en el futuro.

---

## Variables de entorno por plataforma

| Variable | Render (backend) | Vercel (frontend) |
|----------|-----------------|-------------------|
| `SENTRY_DSN` | Sí (backend Sentry) | Sí (server-side Sentry) |
| `NEXT_PUBLIC_SENTRY_DSN` | No aplica | Sí (client-side Sentry) |
| `APP_ENV` | `production` | No aplica |
| `DATABASE_URL` | Sí | No aplica |
| `SECRET_KEY` | Sí | No aplica |
| `NEXT_PUBLIC_API_URL` | No aplica | Sí |

Para activar Sentry: añadir `SENTRY_DSN` en Render y `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN`
en Vercel. No se requiere cambio de código.
