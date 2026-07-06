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

    # ── Tenant: historial de cobros de comisión POS ───────────────────────────
    @app.get("/admin/pos-commissions")
    async def get_pos_commission_history(request: Request):
        db = SessionLocal()
        try:
            user = await _authenticate(request, db)
            tid = _tenant_id(user)
            records = (
                db.query(models.Liquidation)
                .filter(
                    models.Liquidation.tenant_id == tid,
                    models.Liquidation.liq_type == "pos_commission",
                )
                .order_by(models.Liquidation.created_at.desc())
                .limit(50)
                .all()
            )
            return [
                {
                    "id":               str(r.id),
                    "gross_amount":     r.gross_amount,
                    "bayup_commission": r.bayup_commission,
                    "order_count":      r.order_count,
                    "status":           r.status,
                    "paid_date":        r.paid_date.isoformat() if r.paid_date else None,
                    "transfer_reference": r.transfer_reference,
                    "notes":            r.notes,
                    "created_at":       r.created_at.isoformat(),
                }
                for r in records
            ]
        finally:
            db.close()

    # ── Super admin: listar comisiones POS pendientes por tenant ──────────────
    @app.get("/super-admin/pos-commissions/pending")
    async def sa_pos_commissions_pending(request: Request):
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
                last_collected = (
                    db.query(models.Liquidation)
                    .filter(
                        models.Liquidation.tenant_id == t.id,
                        models.Liquidation.liq_type == "pos_commission",
                        models.Liquidation.status == "paid",
                    )
                    .order_by(models.Liquidation.paid_date.desc())
                    .first()
                )
                cutoff_pos = last_collected.paid_date if last_collected else None
                q = db.query(models.Order).filter(
                    models.Order.tenant_id == t.id,
                    models.Order.source == "pos",
                    models.Order.status.in_(["confirmed", "delivered", "completed", "pending"]),
                )
                if cutoff_pos:
                    q = q.filter(models.Order.created_at > cutoff_pos)
                pos_orders = q.all()
                if not pos_orders:
                    continue
                gross_pos = sum(o.total_price for o in pos_orders)
                commission = round(gross_pos * BAYUP_RATE, 2)
                result.append({
                    "tenant_id":    str(t.id),
                    "tenant_name":  t.full_name or t.email,
                    "tenant_email": t.email,
                    "shop_slug":    t.shop_slug,
                    "pos_gross":    round(gross_pos, 2),
                    "commission":   commission,
                    "pos_count":    len(pos_orders),
                    "bank_accounts": t.bank_accounts or [],
                    "last_collected": last_collected.paid_date.isoformat() if last_collected else None,
                })
            result.sort(key=lambda x: x["commission"], reverse=True)
            return result
        finally:
            db.close()

    # ── Super admin: registrar cobro de comisión POS ──────────────────────────
    @app.post("/super-admin/pos-commissions/collect")
    async def sa_collect_pos_commission(payload: dict, request: Request):
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
                raise HTTPException(status_code=400, detail="tenant_id inválido")

            gross_pos  = float(payload.get("pos_gross", 0))
            commission = round(gross_pos * BAYUP_RATE, 2)
            pos_count  = int(payload.get("pos_count", 0))

            rec = models.Liquidation(
                tenant_id        = tid,
                liq_type         = "pos_commission",
                gross_amount     = gross_pos,
                bayup_commission = commission,
                prix_fee         = 0.0,
                net_amount       = 0.0,
                order_count      = pos_count,
                status           = "paid",
                paid_date        = dt.datetime.utcnow(),
                transfer_reference = payload.get("reference", ""),
                notes            = payload.get("notes", ""),
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            return {
                "id":         str(rec.id),
                "commission": commission,
                "status":     "paid",
                "paid_date":  rec.paid_date.isoformat(),
            }
        finally:
            db.close()

    @app.get("/admin/liquidations/summary")
    async def get_liquidation_summary(request: Request):
        db = SessionLocal()
        try:
            user = await _authenticate(request, db)
            tid = _tenant_id(user)

            # Cutoff web: última liquidación web pagada
            last_paid_web = (
                db.query(models.Liquidation)
                .filter(
                    models.Liquidation.tenant_id == tid,
                    models.Liquidation.status == "paid",
                    models.Liquidation.liq_type == "web",
                )
                .order_by(models.Liquidation.paid_date.desc())
                .first()
            )
            # Cutoff POS: último cobro de comisión POS pagado
            last_paid_pos = (
                db.query(models.Liquidation)
                .filter(
                    models.Liquidation.tenant_id == tid,
                    models.Liquidation.status == "paid",
                    models.Liquidation.liq_type == "pos_commission",
                )
                .order_by(models.Liquidation.paid_date.desc())
                .first()
            )
            cutoff_web = last_paid_web.paid_date if last_paid_web else None
            cutoff_pos = last_paid_pos.paid_date if last_paid_pos else None

            q_web = db.query(models.Order).filter(
                models.Order.tenant_id == tid,
                models.Order.status.in_(["confirmed", "delivered", "completed", "pending"]),
                models.Order.source != "pos",
            )
            if cutoff_web:
                q_web = q_web.filter(models.Order.created_at > cutoff_web)
            web_orders = q_web.all()

            q_pos = db.query(models.Order).filter(
                models.Order.tenant_id == tid,
                models.Order.status.in_(["confirmed", "delivered", "completed", "pending"]),
                models.Order.source == "pos",
            )
            if cutoff_pos:
                q_pos = q_pos.filter(models.Order.created_at > cutoff_pos)
            pos_orders = q_pos.all()

            pending_orders = web_orders + pos_orders

            gross_web      = sum(o.total_price for o in web_orders)
            bayup_fee_web  = round(gross_web * BAYUP_RATE, 2)
            net_web        = round(gross_web - bayup_fee_web, 2)

            gross_pos      = sum(o.total_price for o in pos_orders)
            pos_commission = round(gross_pos * BAYUP_RATE, 2)  # lo que el tenant le debe a Bayup

            # Lo que Bayup realmente transfiere = neto web - comisión POS pendiente
            net_transfer   = round(net_web - pos_commission, 2)

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
                    # Totales generales (para backward-compat y stats cards)
                    "gross":          round(gross_web + gross_pos, 2),
                    "bayup_fee":      round(bayup_fee_web + pos_commission, 2),
                    "prix_fee":       0.0,
                    "net":            net_transfer,
                    "order_count":    len(pending_orders),
                    # Desglose por canal
                    "web_gross":      gross_web,
                    "web_net":        net_web,
                    "web_count":      len(web_orders),
                    "pos_gross":      gross_pos,
                    "pos_commission": pos_commission,
                    "pos_count":      len(pos_orders),
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
                        "source":       o.source or 'web',
                        # Para POS: el tenant ya cobró, Bayup solo toma comisión
                        # Para web: Bayup transfiere el neto
                        "net":          round(o.total_price * (1 - BAYUP_RATE), 2) if (o.source or 'web').lower() != 'pos' else 0,
                        "commission":   round(o.total_price * BAYUP_RATE, 2),
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
            # Solo liquidaciones web (no comisiones POS — esas tienen su propio endpoint)
            q = db.query(models.Liquidation).filter(
                models.Liquidation.liq_type.in_(["web", None])
            )
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
                    "liq_type":          l.liq_type or "web",
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
                # Solo órdenes web (POS tiene su propio flujo de cobro de comisión)
                last_paid_web = (
                    db.query(models.Liquidation)
                    .filter(
                        models.Liquidation.tenant_id == t.id,
                        models.Liquidation.status == "paid",
                        models.Liquidation.liq_type == "web",
                    )
                    .order_by(models.Liquidation.paid_date.desc())
                    .first()
                )
                cutoff = last_paid_web.paid_date if last_paid_web else None
                q = db.query(models.Order).filter(
                    models.Order.tenant_id == t.id,
                    models.Order.status.in_(["confirmed", "delivered", "completed", "pending"]),
                    models.Order.source != "pos",
                )
                if cutoff:
                    q = q.filter(models.Order.created_at > cutoff)
                orders = q.all()
                if not orders:
                    continue
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
                liq_type           = "web",
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
