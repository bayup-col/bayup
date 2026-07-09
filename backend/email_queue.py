"""
Cola de emails persistente en PostgreSQL.

Reemplaza los threading.Thread(daemon=True) que se pierden si el servidor
se reinicia mid-flight. El flujo:
  1. enqueue()  — guarda el job en email_jobs (< 1ms, nunca bloquea la request)
  2. worker()   — corre en segundo plano cada 5s, procesa pending, reintenta failed
  3. Si el proceso muere, al reiniciar el worker recoge los pending automáticamente
"""
import json
import logging
import threading
import time

logger = logging.getLogger("bayup.email_queue")

# DDL — se ejecuta en _sync_postgres_schema al arranque (añadido allí)
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS email_jobs (
    id          BIGSERIAL PRIMARY KEY,
    func        VARCHAR(120) NOT NULL,
    kwargs_json TEXT         NOT NULL,
    status      VARCHAR(20)  DEFAULT 'pending',
    attempts    INTEGER      DEFAULT 0,
    error       TEXT,
    created_at  TIMESTAMP    DEFAULT NOW(),
    updated_at  TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_email_jobs_status ON email_jobs (status);
"""

MAX_ATTEMPTS = 4          # 4 intentos antes de marcar como failed
RETRY_DELAY  = 60         # segundos entre reintentos
POLL_INTERVAL = 5         # segundos entre polls del worker


def enqueue(func_name: str, **kwargs) -> None:
    """
    Encola un email de forma no bloqueante.
    func_name: nombre del método en email_service (ej. 'send_order_confirmation')
    kwargs:    argumentos del método
    """
    from database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(
            text(
                "INSERT INTO email_jobs (func, kwargs_json) VALUES (:func, :kwargs)"
            ),
            {"func": func_name, "kwargs": json.dumps(kwargs)},
        )
        db.commit()
    except Exception as e:
        logger.warning("email_queue.enqueue error: %s", e)
    finally:
        db.close()


def _process_one(job_id: int, func_name: str, kwargs_json: str) -> None:
    """Ejecuta un job de email y actualiza su estado en DB."""
    import email_service as _es
    from database import SessionLocal
    from sqlalchemy import text

    db = SessionLocal()
    try:
        func = getattr(_es, func_name, None)
        if not func:
            raise ValueError(f"email_service.{func_name} no existe")
        kwargs = json.loads(kwargs_json)
        func(**kwargs)
        db.execute(
            text("UPDATE email_jobs SET status='sent', updated_at=NOW() WHERE id=:id"),
            {"id": job_id},
        )
        db.commit()
    except Exception as e:
        logger.warning("email_queue job %d falló: %s", job_id, e)
        db.execute(
            text(
                "UPDATE email_jobs "
                "SET attempts = attempts + 1, "
                "    error = :err, "
                "    status = CASE WHEN attempts + 1 >= :max THEN 'failed' ELSE 'pending' END, "
                "    updated_at = NOW() + INTERVAL '1 minute' * (attempts + 1) "
                "WHERE id = :id"
            ),
            {"id": job_id, "err": str(e)[:500], "max": MAX_ATTEMPTS},
        )
        db.commit()
    finally:
        db.close()


def _worker_loop() -> None:
    """Bucle del worker. Procesa hasta 10 emails por ciclo."""
    from database import SessionLocal
    from sqlalchemy import text

    while True:
        try:
            db = SessionLocal()
            try:
                rows = db.execute(
                    text(
                        "SELECT id, func, kwargs_json FROM email_jobs "
                        "WHERE status = 'pending' AND attempts < :max AND updated_at <= NOW() "
                        "ORDER BY id ASC LIMIT 10"
                    ),
                    {"max": MAX_ATTEMPTS},
                ).fetchall()
            finally:
                db.close()

            for row in rows:
                _process_one(row[0], row[1], row[2])
        except Exception as e:
            logger.warning("email_queue worker error: %s", e)

        time.sleep(POLL_INTERVAL)


_worker_started = False
_worker_lock    = threading.Lock()


def start_worker() -> None:
    """Arranca el worker en background. Idempotente — solo corre uno."""
    global _worker_started
    with _worker_lock:
        if _worker_started:
            return
        _worker_started = True
    t = threading.Thread(target=_worker_loop, daemon=True, name="email-queue-worker")
    t.start()
    logger.info("email_queue: worker iniciado")
