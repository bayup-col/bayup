import requests
import json

# Número personal (el número de prueba que empieza por 313)
# Asegúrate de que este número esté registrado en WhatsApp y sea el correcto.
# El formato debe ser algo como "57313XXXXXXX@c.us"
recipient_number = "573138903322@c.us" 

# Mensaje de prueba
test_message = "¡Hola! Este es un mensaje de prueba desde Bayup para verificar la conexión de WhatsApp. ¡Éxito!"

# URL del puente de WhatsApp
bridge_url = "http://localhost:8001/send"

try:
    response = requests.post(
        bridge_url,
        json={"to": recipient_number, "body": test_message},
        timeout=10 # Aumentar un poco el timeout por si acaso
    )
    response.raise_for_status() # Lanza una excepción para errores HTTP (4xx o 5xx)

    print(f"Mensaje de prueba enviado con éxito a {recipient_number}. Respuesta: {response.json()}")
    print("Por favor, revisa el WhatsApp del número que empieza por 313.")

except requests.exceptions.RequestException as e:
    print(f"Error al enviar mensaje de prueba de WhatsApp: {e}")
    print("Asegúrate de que el whatsapp-bridge esté corriendo y autenticado.")
except json.JSONDecodeError:
    print(f"Error al decodificar la respuesta JSON. Respuesta recibida: {response.text}")
except Exception as e:
    print(f"Ocurrió un error inesperado: {e}")

