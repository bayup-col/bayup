import uuid
import sys
import os

# Añadir el directorio actual al path para importar el backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from database import SessionLocal, engine
    import models
    from datetime import datetime
except ImportError as e:
    print(f"Error importando módulos del backend: {e}")
    sys.exit(1)

def run_test():
    db = SessionLocal()
    try:
        # 1. Buscar el usuario (comerciante)
        user = db.query(models.User).filter(models.User.email == 'basicobayup@yopmail.com').first()
        if not user:
            user = db.query(models.User).first()
        
        if not user:
            print("No se encontró ningún usuario en la base de datos.")
            return

        print(f"--- INICIANDO PRUEBA PARA: {user.full_name} ({user.email}) ---")

        # 2. Crear un producto de prueba si no hay
        product = db.query(models.Product).filter(models.Product.owner_id == user.id).first()
        if not product:
            print("Creando producto de prueba...")
            product = models.Product(
                id=uuid.uuid4(),
                owner_id=user.id,
                name="Producto de Prueba Elite",
                description="Este es un producto creado automáticamente para verificar el flujo.",
                price=150000,
                status="active",
                category="Pruebas"
            )
            db.add(product)
            db.flush()
            
            # Crear variante obligatoria
            variant = models.ProductVariant(
                id=uuid.uuid4(),
                product_id=product.id,
                name="Única",
                stock=50,
                price=150000,
                sku="TEST-001"
            )
            db.add(variant)
            db.flush()
        else:
            print(f"Usando producto existente: {product.name}")
            variant = product.variants[0] if product.variants else None
            if not variant:
                variant = models.ProductVariant(id=uuid.uuid4(), product_id=product.id, name="Default", stock=10, price=product.price)
                db.add(variant)
                db.flush()

        # 3. Crear una Orden Web (Venta Real)
        print("Inyectando Pedido Web...")
        new_order = models.Order(
            id=uuid.uuid4(),
            tenant_id=user.id,
            customer_name="Juan Prueba",
            customer_email="juan@prueba.com",
            customer_phone="3101234567",
            customer_city="Bogotá",
            shipping_address="Calle 123 #45-67",
            total_price=product.price,
            status="pending",
            payment_method="WhatsApp",
            source="web",
            created_at=datetime.utcnow()
        )
        db.add(new_order)
        db.flush()

        # Item de la orden
        order_item = models.OrderItem(
            id=uuid.uuid4(),
            order_id=new_order.id,
            product_variant_id=variant.id,
            quantity=1,
            price_at_purchase=product.price
        )
        db.add(order_item)

        # 4. Crear un Mensaje Web
        print("Inyectando Mensaje de Cliente...")
        new_message = models.StoreMessage(
            id=uuid.uuid4(),
            tenant_id=user.id,
            customer_name="Juan Prueba",
            customer_email="juan@prueba.com",
            message="Hola, ¿tienen disponibilidad del producto de prueba?",
            status="unread",
            created_at=datetime.utcnow()
        )
        db.add(new_message)

        # 5. Crear una Notificación
        notification = models.Notification(
            id=uuid.uuid4(),
            tenant_id=user.id,
            title="¡Venta de Prueba Exitosa! 🚀",
            message="Se ha generado un pedido de prueba para verificar tu flujo logístico.",
            type="success",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notification)

        db.commit()
        print("\n✅ ¡PRUEBA COMPLETADA CON ÉXITO!")
        print(f"ID PEDIDO: {new_order.id}")
        print("--- REVISA TU DASHBOARD AHORA ---")

    except Exception as e:
        db.rollback()
        print(f"❌ ERROR EN LA PRUEBA: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
