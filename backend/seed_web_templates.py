"""
Migra las 12 plantillas locales (frontend/public/templates/custom-html/*) a la
tabla web_templates, para que Super-Admin tenga control real sobre que
plantillas se ofrecen en el onboarding (antes vivian solo como archivos
estaticos, invisibles para Super-Admin).

Ejecutar desde backend/ con el entorno local (sqlite):
  python seed_web_templates.py

Imprime ademas el SQL listo para correr en produccion (Supabase) via
mcp__supabase__execute_sql.
"""
import sys, os, json, uuid
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

FRONTEND_TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "public", "templates", "custom-html")

TEMPLATES = [
    {"slug": "tpl-comp", "name": "Tech Computer Pro", "folder": "computadora", "category": "Tienda",
     "description": "Especializada en hardware y equipos de computación de alto rendimiento.",
     "thumbnail": "https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=800"},
    {"slug": "tpl-hogar", "name": "Home & Comfort", "folder": "Hogar", "category": "Tienda",
     "description": "Diseño cálido y minimalista para artículos del hogar y decoración.",
     "thumbnail": "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=800"},
    {"slug": "tpl-joyeria", "name": "Jewelry Luxe", "folder": "Joyeria", "category": "Tienda",
     "description": "Elegancia y brillo para catálogos de joyas y accesorios premium.",
     "thumbnail": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800"},
    {"slug": "tpl-jugueteria", "name": "Kids World Fun", "folder": "Jugueteria", "category": "Tienda",
     "description": "Colorida y dinámica, ideal para juguetes y mundo infantil.",
     "thumbnail": "https://images.unsplash.com/photo-1532330393533-443990a51d10?q=80&w=800"},
    {"slug": "tpl-lenceria", "name": "Intimate Elegance", "folder": "lenceria", "category": "Tienda",
     "description": "Estilo sofisticado y delicado para marcas de lencería y moda íntima.",
     "thumbnail": "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?q=80&w=800"},
    {"slug": "tpl-maquillaje", "name": "Beauty & Glow", "folder": "Maquillaje", "category": "Tienda",
     "description": "Enfoque visual en cosméticos, maquillaje y cuidado personal.",
     "thumbnail": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800"},
    {"slug": "tpl-papeleria", "name": "Stationery Master", "folder": "Papeleria", "category": "Tienda",
     "description": "Orden y creatividad para útiles escolares y de oficina.",
     "thumbnail": "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=800"},
    {"slug": "tpl-pocket", "name": "Pocket Store Quick", "folder": "pocket", "category": "Venta Directa",
     "description": "Diseño compacto y ultra-rápido para ventas directas desde móvil.",
     "thumbnail": "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=800"},
    {"slug": "tpl-ropa-elegante", "name": "Classic Couture", "folder": "Ropa elegante", "category": "Tienda",
     "description": "Alta costura y moda formal con acabados de lujo.",
     "thumbnail": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800"},
    {"slug": "tpl-tecno", "name": "Tech Engine Hub", "folder": "Tecnologia", "category": "Tienda",
     "description": "Lo último en gadgets y tecnología con estética futurista.",
     "thumbnail": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800"},
    {"slug": "tpl-tenis", "name": "Urban Sneakers", "folder": "Tenis", "category": "Tienda",
     "description": "Cultura urbana y deportiva enfocada en calzado de tendencia.",
     "thumbnail": "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800"},
    {"slug": "tpl-zapatos", "name": "Footwear Collection", "folder": "Zapatos", "category": "Tienda",
     "description": "Catálogo versátil para todo tipo de calzado y estilos.",
     "thumbnail": "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800"},
]


def load_architecture(folder: str) -> dict:
    path = os.path.join(FRONTEND_TEMPLATES_DIR, folder, "architecture.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {
        "header": data.get("header") or {"elements": [], "styles": {}},
        "body": data.get("body") or {"elements": [], "styles": {}},
        "footer": data.get("footer") or {"elements": [], "styles": {}},
    }


def main():
    db = SessionLocal()
    sql_values = []
    try:
        existing = {t.name: t for t in db.query(models.WebTemplate).all()}
        for tpl in TEMPLATES:
            schema = load_architecture(tpl["folder"])

            if tpl["name"] in existing:
                new_id = existing[tpl["name"]].id
                print(f"[SKIP] '{tpl['name']}' ya existe en la base local ({new_id})")
            else:
                new_id = uuid.uuid4()
                row = models.WebTemplate(
                    id=new_id,
                    name=tpl["name"],
                    description=tpl["description"],
                    category=tpl["category"],
                    tags=[tpl["slug"]],
                    uses=0,
                    rating=0.0,
                    is_premium=False,
                    color="#0f1a1a",
                    preview_url=tpl["thumbnail"],
                    schema_data=schema,
                    active_plans=[],
                    is_active=True,
                )
                db.add(row)
                print(f"[OK] Insertado en local: {tpl['name']} -> {new_id}")

            schema_json = json.dumps(schema, ensure_ascii=False).replace("'", "''")
            desc = tpl["description"].replace("'", "''")
            sql_values.append(
                f"('{new_id}', '{tpl['name']}', '{desc}', '{tpl['category']}', "
                f"'[\"{tpl['slug']}\"]'::jsonb, 0, 0.0, false, '#0f1a1a', "
                f"'{tpl['thumbnail']}', '{schema_json}'::jsonb, '[]'::jsonb, true, now(), now())"
            )
        db.commit()
    finally:
        db.close()

    if sql_values:
        out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_web_templates.sql")
        sql_text = (
            "INSERT INTO web_templates (id, name, description, category, tags, uses, rating, "
            "is_premium, color, preview_url, schema_data, active_plans, is_active, created_at, updated_at) VALUES\n"
            + ",\n".join(sql_values) + ";"
        )
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(sql_text)
        print(f"\nSQL de produccion escrito en: {out_path}")


if __name__ == "__main__":
    main()
