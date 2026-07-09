-- ============================================================
-- LIMPIEZA DE DATOS DE PRUEBA DE UN TENANT
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Borra: orders, order_items, liquidations, shipments
-- NO borra: usuario, productos, colecciones, clientes, config
-- ============================================================

-- 1. Encuentra el tenant y confirma antes de borrar
SELECT
  u.id,
  u.email,
  u.full_name,
  u.shop_slug,
  (SELECT COUNT(*) FROM orders      o WHERE o.tenant_id = u.id) AS pedidos,
  (SELECT COUNT(*) FROM liquidations l WHERE l.tenant_id = u.id) AS liquidaciones,
  (SELECT COUNT(*) FROM shipments    s WHERE s.tenant_id = u.id) AS envios
FROM users u
WHERE u.email = 'davidaraque20@gmail.com';  -- <-- cambia si el email es otro

-- ============================================================
-- ¡EJECUTA SOLO LO DE ABAJO DESPUÉS DE CONFIRMAR EL ID!
-- Reemplaza <TENANT_ID> con el UUID que devolvió la consulta anterior
-- ============================================================

DO $$
DECLARE
  tid UUID;
BEGIN
  SELECT id INTO tid FROM users WHERE email = 'davidaraque20@gmail.com';

  IF tid IS NULL THEN
    RAISE EXCEPTION 'Tenant no encontrado. Verifica el email.';
  END IF;

  RAISE NOTICE 'Limpiando datos del tenant: %', tid;

  -- Items de pedidos primero (FK)
  DELETE FROM order_items
  WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = tid);
  RAISE NOTICE 'order_items eliminados';

  -- Pedidos
  DELETE FROM orders WHERE tenant_id = tid;
  RAISE NOTICE 'orders eliminados';

  -- Liquidaciones (web + comisiones POS)
  DELETE FROM liquidations WHERE tenant_id = tid;
  RAISE NOTICE 'liquidations eliminadas';

  -- Envíos
  DELETE FROM shipments WHERE tenant_id = tid;
  RAISE NOTICE 'shipments eliminados';

  RAISE NOTICE '✓ Limpieza completada. Cuenta y productos intactos.';
END $$;
