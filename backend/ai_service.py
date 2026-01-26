import os
import json
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import func
import crud, models, schemas
import uuid
from datetime import datetime, time

def get_client():
    api_key = os.getenv("OPENAI_API_KEY", "").strip().replace("\n", "").replace("\r", "")
    return OpenAI(api_key=api_key)

# --- ACCIONES DE NAVEGACIÓN Y REPORTES ---

def get_detailed_analytics(db: Session, owner_id: uuid.UUID):
    """Genera un reporte detallado de ventas y comportamiento"""
    # Aquí iría lógica más compleja de SQL
    return "Tus ventas han crecido un 15% este mes. El producto más vendido es 'Camiseta Algodón' y tus clientes suelen comprar más los martes a las 6pm."

def get_full_dashboard_report(db: Session, owner_id: uuid.UUID):
    """Placeholder para reporte completo de dashboard"""
    return {
        "total_sales": 0,
        "total_orders": 0,
        "active_products": 0,
        "low_stock_alerts": 0,
        "message": "Reporte generado (Versión resumida)"
    }

def generate_image_placeholder(prompt):
    """Simulación de generación de imagen (DALL-E)"""
    return f"https://image.pollinations.ai/prompt/{prompt.replace(' ', '%20')}"

# --- HERRAMIENTAS EXTENDIDAS ---
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_full_dashboard_report",
            "description": "Resumen general: ventas, pedidos, stock, deudas y cobros.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_order_status",
            "description": "Cambiar el estado de un pedido (pagado, enviado, entregado, etc.).",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "ID del pedido"},
                    "new_status": {"type": "string", "enum": ["paid", "shipped", "delivered", "completed", "return_requested"]}
                },
                "required": ["order_id", "new_status"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "navigate_to",
            "description": "Mover al usuario a otra pantalla de la aplicación.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "enum": ["/dashboard/products", "/dashboard/orders", "/dashboard/customers", "/dashboard/settings", "/dashboard/marketing"]
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_image",
            "description": "Generar una imagen para un producto o banner.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Descripción de la imagen"}
                },
                "required": ["prompt"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_expense",
            "description": "Registrar un nuevo gasto en la tienda.",
            "parameters": {
                "type": "object",
                "properties": {
                    "description": {"type": "string", "description": "Concepto del gasto"},
                    "amount": {"type": "number", "description": "Monto del gasto"},
                    "category": {"type": "string", "description": "Categoría opcional"}
                },
                "required": ["description", "amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_income",
            "description": "Registrar un nuevo ingreso o venta manual.",
            "parameters": {
                "type": "object",
                "properties": {
                    "description": {"type": "string", "description": "Concepto del ingreso"},
                    "amount": {"type": "number", "description": "Monto del ingreso"},
                    "category": {"type": "string", "description": "Categoría opcional"}
                },
                "required": ["description", "amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_inventory_status",
            "description": "Consultar productos con stock bajo o agotados.",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]

def process_bayt_chat(db: Session, messages: list, owner_id: uuid.UUID):
    try:
        client = get_client()
        user = db.query(models.User).filter(models.User.id == owner_id).first()
        user_name = user.nickname if user.nickname else "amigo"

        system_prompt = {
            "role": "system", 
            "content": f"""Eres Bayt, el asistente ultra-inteligente de Bayup. 
            Eres tierno, usas emojis con moderación y tuteas. 
            Estás hablando con {user_name}.
            
            HABILIDADES:
            1. Gestionar pedidos (cambiar estados).
            2. Crear ventas y facturas.
            3. Generar reportes de ventas y análisis de comportamiento.
            4. Navegar por la app: Si el usuario quiere ver sus productos o pedidos, usa 'navigate_to'.
            5. Generar imágenes: Usa 'generate_image' para crear visuales.
            6. Crear contenido: Redactar blogs, anuncios o descripciones. 
            
            Si el usuario te pide ir a algún lugar, utiliza la función de navegación automáticamente."""
        }
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[system_prompt] + messages,
            tools=tools,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        action = None
        action_data = None

        if tool_calls:
            messages.append(response_message)
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                if function_name == "navigate_to":
                    action = "navigate"
                    action_data = function_args.get("path")
                    function_response = f"Navegando a {action_data}..."
                
                elif function_name == "generate_image":
                    action = "image"
                    action_data = generate_image_placeholder(function_args.get("prompt"))
                    function_response = f"He generado esta imagen para ti: {action_data}"

                elif function_name == "get_full_dashboard_report":
                    function_response = json.dumps(get_full_dashboard_report(db, owner_id))
                
                elif function_name == "add_expense":
                    expense_data = schemas.ExpenseCreate(
                        description=function_args.get("description"),
                        amount=function_args.get("amount"),
                        due_date=datetime.utcnow(),
                        status="paid"
                    )
                    crud.create_expense(db, expense_data, owner_id)
                    function_response = f"He registrado tu gasto de {function_args.get('amount')} por '{function_args.get('description')}'."

                elif function_name == "add_income":
                    income_data = schemas.IncomeCreate(
                        description=function_args.get("description"),
                        amount=function_args.get("amount"),
                        category=function_args.get("category")
                    )
                    crud.create_income(db, income_data, owner_id)
                    function_response = f"¡Genial! Registré un ingreso de {function_args.get('amount')} por '{function_args.get('description')}'."

                elif function_name == "get_inventory_status":
                    low_stock = db.query(models.ProductVariant).join(models.Product).filter(
                        models.Product.owner_id == owner_id,
                        models.ProductVariant.stock <= 5
                    ).all()
                    if low_stock:
                        items = [f"{v.product.name} ({v.name}): {v.stock} unid." for v in low_stock]
                        function_response = "Tienes estos productos con stock bajo: " + ", ".join(items)
                    else:
                        function_response = "¡Todo bien! No tienes productos con stock crítico."

                else:
                    function_response = "Acción procesada."

                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": function_response,
                })
            
            second_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[system_prompt] + messages
            )
            
            return {
                "response": second_response.choices[0].message.content,
                "action": action,
                "data": action_data
            }

        return {"response": response_message.content, "action": None}
    except Exception as e:
        return {"response": f"Opps, algo salió mal: {str(e)}", "action": None}
