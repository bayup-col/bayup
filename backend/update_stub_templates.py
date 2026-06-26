"""
Actualiza el schema_data de las 8 plantillas que estaban casi vacias
(solo navbar+hero+footer con 1-2 props) con contenido real y coherente,
leyendo los architecture.json ya actualizados en el frontend.

Ejecutar desde backend/ con el entorno local (sqlite):
  python update_stub_templates.py

Imprime el SQL listo para correr en produccion (Supabase) via
mcp__supabase__execute_sql.
"""
import sys, os, json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

FRONTEND_TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "public", "templates", "custom-html")

NAME_TO_FOLDER = {
    "Kids World Fun": "Jugueteria",
    "Intimate Elegance": "lenceria",
    "Beauty & Glow": "Maquillaje",
    "Stationery Master": "Papeleria",
    "Pocket Store Quick": "pocket",
    "Classic Couture": "Ropa elegante",
    "Tech Engine Hub": "Tecnologia",
    "Footwear Collection": "Zapatos",
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


def main():
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
            sql_updates.append(
                f"UPDATE web_templates SET schema_data = '{schema_json}'::jsonb WHERE id = '{row.id}';"
            )
        db.commit()
    finally:
        db.close()

    if sql_updates:
        out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "update_stub_templates.sql")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(sql_updates))
        print(f"\nSQL de produccion escrito en: {out_path}")


if __name__ == "__main__":
    main()
