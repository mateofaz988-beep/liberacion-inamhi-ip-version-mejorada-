import datetime
from functools import wraps

import bcrypt
import jwt
from flask import jsonify, request

from config import JWT_SECRET_KEY, JWT_EXPIRATION_HOURS

# =====================================================
# Contraseñas
# =====================================================

def crear_hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verificar_password(password_plano: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password_plano.encode("utf-8"),
            password_hash.encode("utf-8")
        )
    except Exception:
        return False


# =====================================================
# JWT
# =====================================================

def generar_token(usuario: dict) -> str:
    expiracion = datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "id":      usuario["id"],
        "usuario": usuario["usuario"],
        "correo":  usuario["correo"],
        "rol":     usuario["rol"],
        "exp":     expiracion,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


def decodificar_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# =====================================================
# Decoradores de autenticación
# =====================================================

def token_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({"estado": "ok", "mensaje": "preflight correcto."}), 200

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"estado": "error", "mensaje": "token no proporcionado"}), 401

        try:
            partes = auth_header.split(" ")
            if len(partes) != 2 or partes[0] != "Bearer":
                return jsonify({"estado": "error", "mensaje": "formato de token inválido"}), 401

            payload = decodificar_token(partes[1])
            if payload is None:
                return jsonify({"estado": "error", "mensaje": "token inválido o expirado"}), 401

            request.usuario_actual = payload
        except Exception as e:
            return jsonify({"estado": "error", "mensaje": "error al validar token", "error": str(e)}), 401

        return f(*args, **kwargs)
    return decorador


def roles_permitidos(*roles):
    def wrapper(f):
        @wraps(f)
        def decorador(*args, **kwargs):
            usuario_actual = getattr(request, "usuario_actual", None)
            if usuario_actual is None:
                return jsonify({"estado": "error", "mensaje": "usuario no autenticado"}), 401
            if usuario_actual["rol"] not in roles:
                return jsonify({
                    "estado": "error",
                    "mensaje": "no tiene permisos para acceder a este recurso",
                    "rol_actual": usuario_actual["rol"],
                    "roles_permitidos": roles,
                }), 403
            return f(*args, **kwargs)
        return decorador
    return wrapper
