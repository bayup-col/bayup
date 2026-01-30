import uuid
import datetime
from database import SessionLocal
import models
import crud
import schemas

def generate_test_sale():
    db = SessionLocal()
    try:
        # 1. Buscar al usuario administrador para asignarle la venta y el cliente
        admin = db.query(models.User).filter(models.User.role == 'admin_tienda').first()
        if not admin:
            print("Error: No se encontró un usuario administrador.")
            return

        # 2. Definir los datos de la venta aleatoria
        # Usamos el ID de las Zapatillas Nitro Pro Max que inyectamos antes
        variant_id = uuid.UUID("00000000-0000-4000-b000-000000000001")
        
        # Verificar que la variante existe
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == variant_id).first()
        if not variant:
            print(f"Error: La variante {variant_id} no existe en la DB. Asegúrate de haber reiniciado el backend.")
            return

        order_data = schemas.OrderCreate(
            customer_name="Carlos Prueba Bayup",
            customer_email="carlos.test@gmail.com",
            customer_phone="573109876543",
            seller_name="Asesor Premium",
            items=[
                schemas.OrderItemCreate(product_variant_id=variant_id, quantity=2)
            ]
        )

        # 3. Crear la orden usando la lógica real del sistema
        # Nota: Usamos el ID del admin como customer_id para esta prueba rápida
        new_order = crud.create_order(db=db, order=order_data, customer_id=admin.id)
        
        # Forzamos el canal a 'whatsapp' para probar los iconos
        new_order.source = 'whatsapp'
        db.commit()

        print(f"Venta generada con éxito: {new_order.id}")
        print(f"Número de Factura: FAC-{new_order.id.hex[:4].upper()}")
        print(f"Cliente: {new_order.customer_name}")
        print(f"WhatsApp registrado: {new_order.customer_phone}")

    except Exception as e:
        print(f"Error al generar la venta: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_test_sale()
