# VERSION DE EMERGENCIA - SIN LOGICA DE CORREO PARA GARANTIZAR ARRANQUE
def send_email(*args, **kwargs): return True
def send_welcome_email(*args, **kwargs): print("Mock Email: Welcome")
def send_staff_invitation(*args, **kwargs): print("Mock Email: Staff")
def send_affiliate_welcome(*args, **kwargs): print("Mock Email: Affiliate")
def send_password_reset(*args, **kwargs): print("Mock Email: Password Reset")
def send_order_confirmation(*args, **kwargs): print("Mock Email: Order")
