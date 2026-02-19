import os
import json
import sys
import uuid

# Añadir el directorio raíz del backend al path para importar los modelos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import WebTemplate

def sync_templates():
    db = SessionLocal()
    
    # Ruta a las plantillas en el frontend
    base_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                             "frontend", "public", "templates", "custom-html")
    
    templates_data = [
        {"folder": "computadora", "name": "Tech Computer Pro", "desc": "Hardware y equipos de computación de alto rendimiento."},
        {"folder": "Hogar", "name": "Home & Comfort", "desc": "Diseño cálido y minimalista para artículos del hogar."},
        {"folder": "Joyeria", "name": "Jewelry Luxe", "desc": "Elegancia y brillo para catálogos de joyas premium."},
        {"folder": "Jugueteria", "name": "Kids World Fun", "desc": "Colorida y dinámica para el mundo infantil."},
        {"folder": "lenceria", "name": "Intimate Elegance", "desc": "Sofisticación para marcas de lencería y moda."},
        {"folder": "Maquillaje", "name": "Beauty & Glow", "desc": "Enfoque visual en cosméticos y cuidado personal."},
        {"folder": "Papeleria", "name": "Stationery Master", "desc": "Orden y creatividad para útiles escolares."},
        {"folder": "pocket", "name": "Pocket Store Quick", "desc": "Diseño compacto para ventas móviles rápidas."},
        {"folder": "Ropa elegante", "name": "Classic Couture", "desc": "Alta costura y moda formal de lujo."},
        {"folder": "Tecnologia", "name": "Tech Engine Hub", "desc": "Gadgets y tecnología con estética futurista."},
        {"folder": "Tenis", "name": "Urban Sneakers", "desc": "Cultura urbana enfocada en calzado de tendencia."},
        {"folder": "Zapatos", "name": "Footwear Collection", "desc": "Catálogo versátil para calzado."},
    ]

    print(f"--- Iniciando Sincronización de {len(templates_data)} Plantillas ---")

    for item in templates_data:
        folder_path = os.path.join(base_path, item["folder"])
        json_path = os.path.join(folder_path, "architecture.json")
        
        if not os.path.exists(json_path):
            print(f" [!] Error: No se encontró architecture.json en {item['folder']}")
            continue

        with open(json_path, 'r', encoding='utf-8') as f:
            schema = json.load(f)

        # Verificar si ya existe para actualizar o crear
        existing = db.query(WebTemplate).filter(WebTemplate.name == item["name"]).first()
        
        if existing:
            print(f" [+] Actualizando: {item['name']}")
            existing.schema_data = schema
            existing.description = item["desc"]
            # Podríamos actualizar el preview_url aquí también
        else:
            print(f" [*] Creando: {item['name']}")
            new_tpl = WebTemplate(
                id=uuid.uuid4(),
                name=item["name"],
                description=item["desc"],
                schema_data=schema,
                active_plans=["Básico", "Pro", "Empresa"],
                is_active=True
            )
            db.add(new_tpl)
    
    try:
        db.commit()
        print("--- Sincronización Completada con Éxito ---")
    except Exception as e:
        db.rollback()
        print(f" [!!!] Error al guardar en base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_templates()
