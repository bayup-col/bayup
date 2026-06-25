# BAYUP — Estrategia de Ramas y Releases

## Estado actual

| Rama | Entorno | Plataforma | URL |
|------|---------|------------|-----|
| `development` | **Producción** | Vercel (auto-deploy) + Render (auto-deploy) | www.bayup.com.co |

> Por ahora `development` ES producción. Cada push a esta rama despliega
> automáticamente. Cambiar esto requiere modificar la rama de producción en
> la configuración del proyecto en Vercel y en el webhook de Render.

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

2. Desarrollar y hacer commit localmente.

3. Abrir Pull Request hacia `development` en GitHub.
   - El Quality Gate se ejecuta automáticamente (typecheck TS + syntax Python).
   - El bot añade un comentario con el resumen en el PR.

4. Revisar el comentario del bot. Si Python syntax falla: **no mergear**.

5. Merge → Vercel y Render despliegan automáticamente.

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
   feature/* → staging → (QA aprueba) → development (= producción)
   ```

---

## Cómo hacer un release

No existe un proceso formal de release mientras `development = producción`.
El "release" es el merge a `development`. Para marcar hitos:

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

- **Alternativa universal:** `git revert <SHA> && git push origin development`
  Crea un commit de reversión; Vercel y Render reaccionan automáticamente.

---

## Reglas del equipo

- **Nunca hacer `git push --force` a `development`.**
- Si un PR falla el syntax check de Python: resolver antes de mergear.
- Si el typecheck de TS reporta errores nuevos (distintos de los 7 preexistentes):
  resolverlos antes de mergear.
- Después de cada deploy que toque la base de datos: verificar `/health`
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
