"""
Endpoints de Liquidación — se importan en main.py al final.
v2: comisión sobre todas las ventas (POS + web), sin filtro de source.
"""
import datetime as dt
import uuid as uuid_lib
from fastapi import HTTPException, Request

BAYUP_RATE = 0.025
PRIX_RATE  = 0.0


def _next_payment_dates():
    today = dt.date.today()
    payment_days = {1, 4}  # martes=1, viernes=4
    dates = []
    d = today + dt.timedelta(days=1)
    while len(dates) < 2:
        if d.weekday() in payment_days:
            dates.append(d)
        d += dt.timedelta(days=1)
    return dates


def register_liquidation_routes(app, _authenticate, _tenant_id, _require_super_admin):
    import models
    from database import SessionLocal

    @app.get("/admin/liquidations/summary")
    async def get_liquidation_summary(request: Request):
        db = SessionLocal()
        try:
            user = await _authenticate(request, db)
            tid = _tenant_id(user)

            last_paid = (
                db.query(models.Liquidation)
                .filter(models.Liquidation.tenant_id == tid, models.Liquidation.status == "paid")
                .order_by(models.Liquidation.paid_date.desc())
                .first()
            )
            cutoff = last_paid.paid_date if last_paid else None

            q = db.query(models.Order).filter(
                models.Order.tenant_id == tid,
                models.Order.status.in_(["confirmed", "delivered", "completed", "pending"]),
            )
            if cutoff:
                q = q.filter(models.Order.created_at > cutoff)
            pending_orders = q.all()

            gross_pending = sum(o.total_price for o in pending_orders)
            bayup_fee     = round(gross_pending * BAYUP_RATE, 2)
            prix_fee      = round(gross_pending * PRIX_RATE, 2)
            net_pending   = round(gross_pending - bayup_fee - prix_fee, 2)

            next_dates = _next_payment_dates()

            scheduled = (
                db.query(models.Liquidation)
                .filter(models.Liquidation.tenant_id == tid, models.Liquidation.status == "scheduled")
                .order_by(models.Liquidation.scheduled_date.asc())
                .first()
            )

            all_paid = db.query(models.Liquidation).filter(
                models.Liquidation.tenant_id == tid, models.Liquidation.status == "paid"
            ).all()

            return {
                "pending": {
                    "gross":       gross_pending,
                    "bayup_fee":   bayup_fee,
                    "prix_fee":    prix_fee,
                    "net":         net_pending,
                    "order_count": len(pending_orders),
                },
                "next_payment_dates": [str(d) for d in next_dates],
                "scheduled_liquidation": {
                    "id":             str(scheduled.id),
                    "scheduled_date": scheduled.scheduled_date.isoformat() if scheduled.scheduled_date else None,
                    "net_amount":     scheduled.net_amount,
                    "status":         scheduled.status,
                } if scheduled else None,
                "history": {
                    "total_paid_net":     round(sum(l.net_amount for l in all_paid), 2),
                    "total_paid_gross":   round(sum(l.gross_amount for l in all_paid), 2),
                    "total_bayup_earned": round(sum(l.bayup_commission for l in all_paid), 2),
                    "payment_count":      len(all_paid),
                },
                "pending_orders": [
                    {
                        "id":           str(o.id),
                        "customer_name":o.customer_name,
                        "total_price":  o.total_price,
                        "net":          round(o.total_price * (1 - BAYUP_RATE - PRIX_RATE), 2),
                        "created_at":   o.created_at.isoformat(),
                        "status":       o.status,
                    }
                    for o in pending_orders[:50]
                ],
            }
        finally:
            db.close()

    @app.get("/admin/liquidations")
    async def list_my_liquidations(request: Request):
        db = SessionLocal()
        try:
            user = await _authenticate(request, db)
            tid = _tenant_id(user)
            lqs = (
                db.query(models.Liquidation)
                .filter(models.Liquidation.tenant_id == tid)
                .order_by(models.Liquidation.created_at.desc())
                .limit(100)
                .all()
            )
            return [
                {
                    "id":                str(l.id),
                    "gross_amount":      l.gross_amount,
                    "bayup_commission":  l.bayup_commission,
                    "prix_fee":          l.prix_fee,
                    "net_amount":        l.net_amount,
                    "order_count":       l.order_count,
                    "status":            l.status,
                    "period_start":      l.period_start.isoformat() if l.period_start else None,
                    "period_end":        l.period_end.isoformat() if l.period_end else None,
                    "scheduled_date":    l.scheduled_date.isoformat() if l.scheduled_date else None,
                    "paid_date":         l.paid_date.isoformat() if l.paid_date else None,
                    "transfer_reference":l.transfer_reference,
                    "notes":             l.notes,
                    "created_at":        l.created_at.isoformat(),
                }
                for l in lqs
            ]
        finally:
            db.close()

    @app.get("/super-admin/liquidations")
    async def sa_list_liquidations(request: Request, status: str | None = None):
        db = SessionLocal()
        try:
            caller = await _authenticate(request, db)
            _require_super_admin(caller)
            q = db.query(models.Liquidation)
            if status:
                q = q.filter(models.Liquidation.status == status)
            lqs = q.order_by(models.Liquidation.created_at.desc()).limit(200).all()
            result = []
            for l in lqs:
                t = db.query(models.User).filter(models.User.id == l.tenant_id).first()
                result.append({
                    "id":                str(l.id),
                    "tenant_id":         str(l.tenant_id),
                    "tenant_name":       t.full_name if t else "—",
                    "tenant_email":      t.email if t else "—",
                    "gross_amount":      l.gross_amount,
                    "bayup_commission":  l.bayup_commission,
                    "prix_fee":          l.prix_fee,
                    "net_amount":        l.net_amount,
                    "order_count":       l.order_count,
                    "status":            l.status,
                    "scheduled_date":    l.scheduled_date.isoformat() if l.scheduled_date else None,
                    "paid_date":         l.paid_date.isoformat() if l.paid_date else None,
                    "transfer_reference":l.transfer_reference,
                    "notes":             l.notes,
                    "created_at":        l.created_at.isoformat(),
                })
            return result
        finally:
            db.close()

    @app.get("/super-admin/liquidations/pending-balances")
    async def sa_pending_balances(request: Request):
        db = SessionLocal()
        try:
            caller = await _authenticate(request, db)
            _require_super_admin(caller)
            tenants = db.query(models.User).filter(
                models.User.is_global_staff == False,
                models.User.onboarding_completed == True,
            ).all()
            result = []
            for t in tenants:
                last_paid = (
                    db.query(models.Liquidation)
                    .filter(models.Liquidation.tenant_id == t.id, models.Liquidation.status == "paid")
                    .order_by(models.Liquidation.paid_date.desc())
                    .first()
                )
                cutoff = last_paid.paid_date if last_paid else None
                q = db.query(models.Order).filter(
                    models.Order.tenant_id == t.id,
                    models.Order.status.in_(["confirmed", "delivered", "completed", "pending"]),
                )
                if cutoff:
                    q = q.filter(models.Order.created_at > cutoff)
                orders = q.all()
                gross = sum(o.total_price for o in orders)
                net = round(gross * (1 - BAYUP_RATE - PRIX_RATE), 2)
                result.append({
                    "tenant_id":    str(t.id),
                    "tenant_name":  t.full_name or t.email,
                    "tenant_email": t.email,
                    "shop_slug":    t.shop_slug,
                    "gross":        round(gross, 2),
                    "bayup_fee":    round(gross * BAYUP_RATE, 2),
                    "prix_fee":     round(gross * PRIX_RATE, 2),
                    "net":          net,
                    "order_count":  len(orders),
                    "bank_accounts":t.bank_accounts or [],
                })
            result.sort(key=lambda x: x["net"], reverse=True)
            return result
        finally:
            db.close()

    @app.post("/super-admin/liquidations")
    async def sa_create_liquidation(payload: dict, request: Request):
        db = SessionLocal()
        try:
            caller = await _authenticate(request, db)
            _require_super_admin(caller)
            tenant_id_str = payload.get("tenant_id")
            if not tenant_id_str:
                raise HTTPException(status_code=400, detail="tenant_id requerido")
            try:
                tid = uuid_lib.UUID(tenant_id_str)
            except ValueError:
                raise HTTPException(status_code=400, detail="tenant_id invalido")

            gross     = float(payload.get("gross_amount", 0))
            bayup_fee = round(gross * BAYUP_RATE, 2)
            prix_fee  = round(gross * PRIX_RATE, 2)
            net       = round(gross - bayup_fee - prix_fee, 2)

            scheduled_str = payload.get("scheduled_date")
            scheduled_dt  = dt.datetime.fromisoformat(scheduled_str) if scheduled_str else None

            liq = models.Liquidation(
                tenant_id          = tid,
                gross_amount       = gross,
                bayup_commission   = bayup_fee,
                prix_fee           = prix_fee,
                net_amount         = net,
                order_count        = int(payload.get("order_count", 0)),
                period_start       = dt.datetime.fromisoformat(payload["period_start"]) if payload.get("period_start") else None,
                period_end         = dt.datetime.fromisoformat(payload["period_end"]) if payload.get("period_end") else None,
                status             = payload.get("status", "scheduled"),
                scheduled_date     = scheduled_dt,
                notes              = payload.get("notes"),
            )
            db.add(liq)
            db.commit()
            db.refresh(liq)
            return {"id": str(liq.id), "status": liq.status, "net_amount": liq.net_amount}
        finally:
            db.close()

    @app.put("/super-admin/liquidations/{liq_id}/pay")
    async def sa_mark_paid(liq_id: str, payload: dict, request: Request):
        db = SessionLocal()
        try:
            caller = await _authenticate(request, db)
            _require_super_admin(caller)
            try:
                lid = uuid_lib.UUID(liq_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="ID invalido")
            liq = db.query(models.Liquidation).filter(models.Liquidation.id == lid).first()
            if not liq:
                raise HTTPException(status_code=404, detail="Liquidacion no encontrada")
            liq.status             = "paid"
            liq.paid_date          = dt.datetime.utcnow()
            liq.transfer_reference = payload.get("transfer_reference", "")
            liq.notes              = payload.get("notes", liq.notes)
            db.commit()
            return {"ok": True, "paid_date": liq.paid_date.isoformat()}
        finally:
            db.close()

    @app.delete("/super-admin/liquidations/{liq_id}")
    async def sa_delete_liquidation(liq_id: str, request: Request):
        db = SessionLocal()
        try:
            caller = await _authenticate(request, db)
            _require_super_admin(caller)
            try:
                lid = uuid_lib.UUID(liq_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="ID invalido")
            liq = db.query(models.Liquidation).filter(models.Liquidation.id == lid).first()
            if not liq:
                raise HTTPException(status_code=404, detail="No encontrada")
            if liq.status == "paid":
                raise HTTPException(status_code=400, detail="No se puede eliminar una liquidacion pagada")
            db.delete(liq)
            db.commit()
            return {"ok": True}
        finally:
            db.close()
