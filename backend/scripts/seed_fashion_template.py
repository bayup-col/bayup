import sys
import os
import uuid
import json
from sqlalchemy.orm import Session

# Añadir el directorio actual al path para importar database
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.database import SessionLocal
    from backend import models
except ImportError:
    from database import SessionLocal
    import models

def seed_oneup_fashion():
    db = SessionLocal()
    print("Iniciando creación de plantilla ONEUP Fashion Premium...")

    # 1. Buscar o crear el usuario ONEUP
    oneup_email = "oneup@bayup.com"
    oneup = db.query(models.User).filter(models.User.email == oneup_email).first()
    
    if not oneup:
        print(f"Creando usuario {oneup_email}...")
        # Buscamos un plan básico
        plan = db.query(models.Plan).filter(models.Plan.name == "Básico").first()
        oneup = models.User(
            email=oneup_email,
            full_name="OneUp Fashion",
            nickname="OneUp",
            shop_slug="oneup",
            hashed_password="hashed_dummy_pass", # No importa para el front
            role="admin_tienda",
            plan_id=plan.id if plan else None,
            status="Activo"
        )
        db.add(oneup)
        db.commit()
        db.refresh(oneup)

    tenant_id = oneup.id

    # 2. Crear Productos de Moda (Ejemplos)
    fashion_products = [
        {
            "name": "Vestido Eira Silk",
            "description": "Vestido largo en seda con caída fluida. Elegancia minimalista.",
            "price": 285000,
            "image_url": ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800"],
            "sku": "VE-001"
        },
        {
            "name": "Blusa Aura White",
            "description": "Blusa blanca en lino orgánico. Frescura y estilo.",
            "price": 145000,
            "image_url": ["https://images.unsplash.com/photo-1539109136881-3be061694b9b?q=80&w=800"],
            "sku": "BA-002"
        },
        {
            "name": "Pantalón Luna Beige",
            "description": "Pantalón de tiro alto en tono tierra. Calce perfecto.",
            "price": 195000,
            "image_url": ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800"],
            "sku": "PL-003"
        }
    ]

    for p_data in fashion_products:
        exists = db.query(models.Product).filter(models.Product.sku == p_data["sku"], models.Product.owner_id == tenant_id).first()
        if not exists:
            p = models.Product(**p_data, owner_id=tenant_id)
            db.add(p)
    db.commit()

    # 3. Definir Schemas de Páginas (Home)
    # Reutilizamos los componentes Smart de HighFidelityBlocks
    
    home_schema = {
        "header": {
            "elements": [{
                "id": str(uuid.uuid4()),
                "type": "navbar",
                "props": {
                    "logoText": "ONEUP",
                    "menuItems": ["Novedades", "Colecciones", "Contacto"]
                }
            }],
            "styles": {}
        },
        "footer": {
            "elements": [{
                "id": str(uuid.uuid4()),
                "type": "footer-premium",
                "props": {
                    "logoText": "ONEUP",
                    "description": "Elevando el estándar de la moda colombiana con diseño minimalista y calidad excepcional."
                }
            }],
            "styles": {}
        },
        "body": {
            "elements": [
                {
                    "id": str(uuid.uuid4()),
                    "type": "hero-banner",
                    "props": {
                        "title": "ELEGANCIA ETERNA",
                        "subtitle": "Nueva Colección 2026: Minimalismo que inspira confianza.",
                        "imageUrl": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000",
                        "primaryBtnText": "VER COLECCIÓN"
                    }
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "product-grid",
                    "props": {
                        "title": "LAS PIEZAS MÁS DESEADAS",
                        "products": [
                            { "id": "p1", "name": "Vestido Eira Silk", "price": 285000, "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800", "category": "VESTIDOS" },
                            { "id": "p2", "name": "Blusa Aura White", "price": 145000, "image": "https://images.unsplash.com/photo-1539109136881-3be061694b9b?q=80&w=800", "category": "TOPS" },
                            { "id": "p3", "name": "Pantalón Luna Beige", "price": 195000, "image": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800", "category": "BOTTOMS" }
                        ]
                    }
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "text-block-premium",
                    "props": {
                        "title": "NUESTRO PROPÓSITO",
                        "subtitle": "Moda consciente para mujeres visionarias",
                        "content": "En OneUp, creemos que la ropa es una extensión de tu identidad. Cada costura está pensada para empoderar tu camino diario."
                    }
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "contact-form",
                    "props": {
                        "title": "ESCRIBENOS",
                        "badge": "SOPORTE"
                    }
                }
            ],
            "styles": {}
        }
    }

    # 4. Inyectar/Actualizar la página Home en la DB
    home_page = db.query(models.ShopPage).filter(models.ShopPage.tenant_id == tenant_id, models.ShopPage.page_key == "home").first()
    if home_page:
        home_page.schema_data = home_schema
        home_page.is_published = True
    else:
        home_page = models.ShopPage(
            tenant_id=tenant_id,
            page_key="home",
            schema_data=home_schema,
            is_published=True
        )
        db.add(home_page)
    
    db.commit()
    print(f"✅ Plantilla OneUp inyectada con éxito para el tenant {tenant_id}")
    print(f"🚀 Visita: /shop/oneup para ver el resultado.")

if __name__ == "__main__":
    seed_oneup_fashion()
