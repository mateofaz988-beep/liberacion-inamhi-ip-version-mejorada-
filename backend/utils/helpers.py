import ipaddress
import re
from datetime import datetime
from urllib.parse import urlparse

from flask import request

# =====================================================
# Limpieza de texto
# =====================================================

def limpiar_texto(valor) -> str:
    if valor is None:
        return ""
    return str(valor).strip()


def normalizar_espacios(texto) -> str:
    return re.sub(r"\s+", " ", limpiar_texto(texto))


# =====================================================
# Validaciones
# =====================================================

def validar_solo_letras_espacios(texto: str) -> bool:
    return bool(re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$", limpiar_texto(texto)))


def validar_correo_general(correo: str) -> bool:
    correo = limpiar_texto(correo)
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", correo))


def validar_cedula_formato(cedula: str) -> bool:
    return bool(re.match(r"^\d{10}$", limpiar_texto(cedula)))


def validar_telefono_10_digitos(telefono: str) -> bool:
    return bool(re.match(r"^\d{10}$", limpiar_texto(telefono)))


def validar_ipv4(ip: str) -> bool:
    try:
        ipaddress.IPv4Address(limpiar_texto(ip))
        return True
    except ValueError:
        return False


def validar_url(url: str) -> bool:
    url = limpiar_texto(url)
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def validar_fecha(fecha: str) -> bool:
    try:
        datetime.strptime(limpiar_texto(fecha), "%Y-%m-%d")
        return True
    except ValueError:
        return False


def convertir_fecha(fecha: str):
    return datetime.strptime(limpiar_texto(fecha), "%Y-%m-%d").date()


# =====================================================
# Red
# =====================================================

def obtener_ip_cliente() -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "0.0.0.0"
