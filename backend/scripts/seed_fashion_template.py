import sys
import os
import json
import uuid
import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal
from models import WebTemplate

def seed_fashion_template():
    db = SessionLocal()
    
    # --- HEADER COMPARTIDO ---
    header_common = {
      "elements": [{
        "id": "nav-main", "type": "navbar",
        "props": {
          "logoText": "BAYUP HAUTE COUTURE", "logoFont": "font-black", "logoSize": 22, "navHeight": 100, "align": "center",
          "menuItems": [
            { "label": "Inicio", "url": "/studio-preview?page=home" },
            { "label": "Productos", "url": "/studio-preview?page=productos" },
            { "label": "Nosotros", "url": "/studio-preview?page=nosotros" }
          ],
          "showCart": True, "showSearch": True, "showUser": True, "bgColor": "#ffffff", "barEffect": "glass"
        }
      }],
      "styles": {}
    }

    # --- FOOTER COMPARTIDO ---
    footer_common = { "elements": [{ "id": "f1", "type": "footer-premium", "props": { "logoText": "BAYUP HAUTE", "bgColor": "#000000", "textColor": "#ffffff" }}]}

    # --- PÁGINA: INICIO (HOME) ---
    home_schema = {
      "header": header_common,
      "body": {
        "elements": [
          { "id": "h1", "type": "hero-banner", "props": { "title": "DEFINIENDO EL ESTILO", "height": 700, "imageUrl": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop", "primaryBtnText": "Ver Colección" }},
          { "id": "t1", "type": "text", "props": { "content": "LOS MÁS DESEADOS", "align": "center", "size": 32, "font": "font-black", "posY": 40 }},
          { "id": "g1", "type": "product-grid", "props": { "layout": "carousel", "itemsCount": 8, "cardStyle": "premium", "cardBorderRadius": 40 }},
          { "id": "t2", "type": "text", "props": { "content": "EXPLORA EL CATÁLOGO", "align": "center", "size": 24, "font": "font-black", "color": "#9ca3af" }},
          { "id": "c1", "type": "cards", "props": { "columns": 2, "gap": 48, "cards": [
            { "id": "m", "title": "HOMBRE / URBAN", "description": "Estilo para el día a día.", "bgImage": "https://images.unsplash.com/photo-1488161628813-eb4417f1d1b8?q=80&w=1964&auto=format&fit=crop", "url": "/studio-preview?page=productos&cat=men" },
            { "id": "w", "title": "MUJER / CHIC", "description": "Elegancia en cada paso.", "bgImage": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop", "url": "/studio-preview?page=productos&cat=women" }
          ]}}
        ]
      },
      "footer": footer_common
    }

    # --- PÁGINA: PRODUCTOS (PRODUCTOS) ---
    productos_schema = {
      "header": header_common,
      "body": {
        "elements": [
          { "id": "ph1", "type": "hero-banner", "props": { "title": "CATÁLOGO 2026", "height": 350, "imageUrl": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop", "overlayOpacity": 50 }},
          { "id": "pg1", "type": "product-grid", "props": { "showFilters": True, "columns": 4, "itemsCount": 20, "cardStyle": "premium", "filterPlacement": "left", "filterBg": "#f9fafb" }}
        ]
      },
      "footer": footer_common
    }

    # --- PÁGINA: NOSOTROS ---
    nosotros_schema = {
      "header": header_common,
      "body": {
        "elements": [
          { "id": "ah1", "type": "hero-banner", "props": { "title": "NUESTRA HISTORIA", "height": 450, "imageUrl": "https://images.unsplash.com/photo-1534452286302-2f5603b24f8c?q=80&w=2070&auto=format&fit=crop" }},
          { "id": "at1", "type": "text", "props": { "content": "BAYUP HAUTE COUTURE", "align": "center", "size": 42, "font": "font-black" }},
          { "id": "at2", "type": "text", "props": { "content": "Somos una marca comprometida con la excelencia y la sostenibilidad.", "align": "center", "size": 18 }}
        ]
      },
      "footer": footer_common
    }

    multi_page_data = {
        "home": home_schema,
        "productos": productos_schema,
        "nosotros": nosotros_schema
    }

    try:
        existing = db.query(WebTemplate).filter(WebTemplate.name == "Fashion Brand Platinum").first()
        if existing:
            existing.schema_data = multi_page_data
            print("Plantilla 'Fashion Brand Platinum' actualizada.")
        db.commit()
    except Exception as e: print(f"Error: {e}"); db.rollback()
    finally: db.close()

if __name__ == "__main__":
    seed_fashion_template()
