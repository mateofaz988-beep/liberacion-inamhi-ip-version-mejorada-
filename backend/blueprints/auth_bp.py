from flask import Blueprint, jsonify, request

from utils.auth_utils import (
    crear_hash_password,
    generar_token,
    token_requerido,
    verificar_password,
)
from utils.db import get_db_connection
from utils.helpers import limpiar_texto
from utils.user_utils import (
    actualizar_ultimo_acceso,
    obtener_usuario_por_id,
    obtener_usuario_por_username,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"estado": "error", "mensaje": "no se recibieron datos"}), 400

    username = limpiar_texto(data.get("usuario"))
    password = limpiar_texto(data.get("password"))

    if not username or not password:
        return jsonify({"estado": "error", "mensaje": "usuario y contraseña son obligatorios"}), 400

    usuario = obtener_usuario_por_username(username)

    if usuario is None:
        return jsonify({"estado": "error", "mensaje": "usuario o contraseña incorrectos"}), 401

    if usuario["estado"] != "activo":
        return jsonify({"estado": "error", "mensaje": "usuario inactivo. comuníquese con el administrador."}), 403

    # Migración automática de contraseña placeholder → bcrypt
    if usuario["password_hash"] == "PENDIENTE_GENERAR_HASH_CEDULA":
        if password != usuario["cedula"]:
            return jsonify({"estado": "error", "mensaje": "usuario o contraseña incorrectos"}), 401

        nuevo_hash = crear_hash_password(password)
        try:
            conn = get_db_connection()
            if conn:
                cur = conn.cursor()
                cur.execute("UPDATE usuarios SET password_hash = %s WHERE id = %s", (nuevo_hash, usuario["id"]))
                conn.commit()
                cur.close()
                conn.close()
        except Exception:
            pass

        token = generar_token(usuario)
        actualizar_ultimo_acceso(usuario["id"])
        return _respuesta_login_ok(token, usuario)

    if not verificar_password(password, usuario["password_hash"]):
        return jsonify({"estado": "error", "mensaje": "usuario o contraseña incorrectos"}), 401

    token = generar_token(usuario)
    actualizar_ultimo_acceso(usuario["id"])
    return _respuesta_login_ok(token, usuario)


@auth_bp.route("/me", methods=["GET"])
@token_requerido
def auth_me():
    usuario = obtener_usuario_por_id(request.usuario_actual["id"])
    if usuario is None:
        return jsonify({"estado": "error", "mensaje": "usuario no encontrado"}), 404
    return jsonify({"estado": "ok", "usuario": usuario}), 200


# ─── helpers privados ──────────────────────────────────────────────────────────

def _respuesta_login_ok(token: str, usuario: dict):
    return jsonify({
        "estado": "ok",
        "mensaje": "inicio de sesión exitoso",
        "token": token,
        "usuario": {
            "id":          usuario["id"],
            "nombres":     usuario["nombres"],
            "apellidos":   usuario["apellidos"],
            "cedula":      usuario["cedula"],
            "correo":      usuario["correo"],
            "usuario":     usuario["usuario"],
            "rol":         usuario.get("rol"),
            "cargo":       usuario.get("cargo"),
            "area_unidad": usuario.get("area_unidad"),
            "dependencia": usuario.get("dependencia"),
            "telefono_ext":usuario.get("telefono_ext"),
        },
    }), 200
