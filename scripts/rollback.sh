#!/usr/bin/env bash
# =============================================================================
# BAYUP — Rollback de Emergencia
# =============================================================================
# Usar cuando un deploy a producción introduce regresión crítica.
# Objetivo: volver al último deployment estable en < 5 minutos.
#
# PLATAFORMAS:
#   Frontend → Vercel  (rama 'development' despliega a www.bayup.com.co)
#   Backend  → Render  (servicio FastAPI)
# =============================================================================

set -euo pipefail

echo "========================================"
echo " BAYUP — Rollback de Emergencia"
echo "========================================"
echo ""

# =============================================================================
# FRONTEND: ROLLBACK EN VERCEL
# =============================================================================
# OPCIÓN A — Dashboard (recomendado para emergencias, sin CLI)
# ─────────────────────────────────────────────────────────────
# 1. Ir a: https://vercel.com/dashboard
# 2. Seleccionar el proyecto bayup (bayup.com.co)
# 3. Clic en la pestaña "Deployments"
# 4. Localizar el último deployment con estado "Ready" ANTERIOR al problemático
# 5. Clic en los tres puntos (...) de ese deployment
# 6. Seleccionar "Promote to Production"
# 7. Confirmar → el rollback tarda ~30 segundos (sin redeploy, solo alias swap)
#
# OPCIÓN B — Vercel CLI (si está instalada localmente)
# ─────────────────────────────────────────────────────
# Listar deployments recientes:
#   vercel ls --prod
#
# Promover un deployment específico a producción:
#   vercel promote <DEPLOYMENT_URL> --scope=<TEAM_SLUG>
#   Ejemplo:
#   vercel promote bayup-abc123def.vercel.app --scope=bayup-team
#
# OPCIÓN C — GitHub (si el commit problemático ya está en 'development')
# ───────────────────────────────────────────────────────────────────────
# Revertir el commit problemático y hacer push:
#   git revert <COMMIT_SHA>
#   git push origin development
# Vercel detectará el push y desplegará automáticamente con el revert.
# ⚠️  Esto crea un commit nuevo; no reescribe historia. Es el método más seguro.

echo "[FRONTEND] Instrucciones de rollback en Vercel:"
echo "  Dashboard: https://vercel.com/dashboard"
echo "  1. Deployments > deployment anterior estable > '...' > 'Promote to Production'"
echo ""

# =============================================================================
# BACKEND: ROLLBACK EN RENDER
# =============================================================================
# OPCIÓN A — Dashboard (recomendado, siempre disponible)
# ───────────────────────────────────────────────────────
# 1. Ir a: https://dashboard.render.com
# 2. Seleccionar el servicio web del backend de BAYUP
# 3. Clic en la pestaña "Events" (historial de deploys)
# 4. Localizar el deployment estable anterior
# 5. Clic en "Rollback to this deploy"
# 6. Confirmar → Render redeploya la imagen anterior (~1-2 min)
#
# OPCIÓN B — Render CLI (si está instalada)
# ─────────────────────────────────────────
# render deploys list --service=<SERVICE_ID>
# render deploys rollback <DEPLOY_ID> --service=<SERVICE_ID>
#
# OPCIÓN C — Git revert + push (mismo que frontend)
# ──────────────────────────────────────────────────
# git revert <COMMIT_SHA>
# git push origin development
# Render detectará el push via webhook y redesplegará automáticamente.

echo "[BACKEND] Instrucciones de rollback en Render:"
echo "  Dashboard: https://dashboard.render.com"
echo "  1. Servicio backend > Events > deployment anterior > 'Rollback to this deploy'"
echo ""

# =============================================================================
# VERIFICACIÓN POST-ROLLBACK
# =============================================================================
# Después de realizar el rollback, verificar:
#
# 1. Backend health:
#    curl -sf https://api.bayup.com.co/health && echo "Backend OK"
#
# 2. Frontend (comprobación visual):
#    https://www.bayup.com.co  → debe cargar sin errores
#
# 3. Login funcional:
#    Iniciar sesión con una cuenta de prueba y confirmar acceso al dashboard
#
# 4. Revisión de logs:
#    - Render: Dashboard > servicio > Logs
#    - Vercel: Dashboard > proyecto > Deployments > deployment > Functions logs
#
# 5. Confirmar en Sentry (cuando esté configurado):
#    https://sentry.io  → verificar que los errores anteriores no se repiten

echo "[VERIFICACIÓN] Checks post-rollback:"
echo "  Backend: curl https://api.bayup.com.co/health"
echo "  Frontend: https://www.bayup.com.co"
echo ""
echo "Rollback completado. Documentar el incidente en el equipo."
