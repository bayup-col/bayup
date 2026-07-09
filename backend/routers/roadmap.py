import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import get_db
from deps import current_user, require_super_admin

router = APIRouter(tags=["roadmap"])


def _serialize(i, admin: bool = False) -> dict:
    d = {
        "id": str(i.id),
        "title": i.title,
        "tagline": i.tagline,
        "description": i.description,
        "phase": i.phase,
        "tags": i.tags or [],
        "gradient": i.gradient,
        "accent_color": i.accent_color,
        "image_url": i.image_url,
        "votes": i.votes,
        "sort_order": i.sort_order,
    }
    if admin:
        d["is_active"] = i.is_active
        d["created_at"] = str(i.created_at)
    return d


class RoadmapItemIn(BaseModel):
    title: str
    tagline: str = ""
    description: str = ""
    phase: str = "proximamente"
    tags: list = []
    gradient: str = ""
    accent_color: str = ""
    image_url: str = ""
    sort_order: int = 0
    is_active: bool = True


class RoadmapVoteIn(BaseModel):
    session_key: str = ""


@router.get("/public/roadmap")
def get_roadmap_public(db: Session = Depends(get_db)):
    items = db.query(models.RoadmapItem).filter(
        models.RoadmapItem.is_active == True
    ).order_by(models.RoadmapItem.sort_order).all()
    return [_serialize(i) for i in items]


@router.get("/super-admin/roadmap")
async def get_roadmap_admin(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    items = db.query(models.RoadmapItem).order_by(models.RoadmapItem.sort_order).all()
    return [_serialize(i, admin=True) for i in items]


@router.post("/super-admin/roadmap")
async def create_roadmap_item(request: Request, body: RoadmapItemIn, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    data = {k: (v if v != "" else None) for k, v in body.model_dump().items()}
    item = models.RoadmapItem(id=_uuid.uuid4(), **data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": str(item.id)}


@router.put("/super-admin/roadmap/{item_id}")
async def update_roadmap_item(item_id: str, request: Request, body: RoadmapItemIn, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    item = db.query(models.RoadmapItem).filter(models.RoadmapItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    for k, v in body.model_dump().items():
        setattr(item, k, v if v != "" else None)
    db.commit()
    return {"ok": True}


@router.delete("/super-admin/roadmap/{item_id}")
async def delete_roadmap_item(item_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    item = db.query(models.RoadmapItem).filter(models.RoadmapItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.get("/super-admin/roadmap/{item_id}/voters")
async def get_roadmap_voters(item_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    votes = db.query(models.RoadmapVote).filter(
        models.RoadmapVote.item_id == item_id
    ).order_by(models.RoadmapVote.voted_at.desc()).all()
    result = []
    for v in votes:
        u = db.query(models.User).filter(models.User.id == v.user_id).first() if v.user_id else None
        result.append({
            "id": str(v.id),
            "voted_at": str(v.voted_at),
            "user_id": str(v.user_id) if v.user_id else None,
            "user_name": (getattr(u, "full_name", None) or getattr(u, "email", None)) if u else None,
            "user_email": getattr(u, "email", None) if u else None,
            "session_key": v.session_key,
        })
    return result


@router.post("/public/roadmap/{item_id}/vote")
async def vote_roadmap_item(item_id: str, request: Request, body: RoadmapVoteIn, db: Session = Depends(get_db)):
    user_id = None
    try:
        from deps import current_user as _cu
        u = await _cu(request=request, db=db)
        user_id = u.id
    except Exception:
        pass

    item = db.query(models.RoadmapItem).filter(models.RoadmapItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    q = db.query(models.RoadmapVote).filter(models.RoadmapVote.item_id == item_id)
    if user_id:
        existing = q.filter(models.RoadmapVote.user_id == user_id).first()
    else:
        existing = q.filter(models.RoadmapVote.session_key == body.session_key).first() if body.session_key else None

    if existing:
        db.delete(existing)
        item.votes = max(0, (item.votes or 0) - 1)
        db.commit()
        return {"voted": False, "votes": item.votes}
    else:
        vote = models.RoadmapVote(id=_uuid.uuid4(), item_id=item.id, user_id=user_id, session_key=body.session_key or None)
        db.add(vote)
        item.votes = (item.votes or 0) + 1
        db.commit()
        return {"voted": True, "votes": item.votes}
