import sys, os, json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
import models

FRONTEND_TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "public", "templates", "custom-html")

NAME_TO_FOLDER = {
    "Home & Comfort": "Hogar",
    "Jewelry Luxe": "Joyeria",
    "Kids World Fun": "Jugueteria",
    "Beauty & Glow": "Maquillaje",
    "Stationery Master": "Papeleria",
    "Classic Couture": "Ropa elegante",
    "Tech Engine Hub": "Tecnologia",
    "Urban Sneakers": "Tenis",
    "Footwear Collection": "Zapatos",
    "Tech Computer Pro": "computadora",
    "Intimate Elegance": "lenceria",
    "Pocket Store Quick": "pocket",
}


def load_architecture(folder: str) -> dict:
    path = os.path.join(FRONTEND_TEMPLATES_DIR, folder, "architecture.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {
        "header": data.get("header") or {"elements": [], "styles": {}},
        "body": data.get("body") or {"elements": [], "styles": {}},
        "footer": data.get("footer") or {"elements": [], "styles": {}},
    }


db = SessionLocal()
sql_updates = []
try:
    for name, folder in NAME_TO_FOLDER.items():
        schema = load_architecture(folder)
        row = db.query(models.WebTemplate).filter(models.WebTemplate.name == name).first()
        if not row:
            print(f"[SKIP] '{name}' no existe en la base local")
            continue
        row.schema_data = schema
        print(f"[OK] Actualizado en local: {name} ({row.id})")
        schema_json = json.dumps(schema, ensure_ascii=False).replace("'", "''")
        sql_updates.append(f"UPDATE web_templates SET schema_data = '{schema_json}'::jsonb WHERE id = '{row.id}';")
    db.commit()
finally:
    db.close()

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "update_about_contact_blocks.sql")
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_updates))
print(f"SQL escrito en: {out_path}")
