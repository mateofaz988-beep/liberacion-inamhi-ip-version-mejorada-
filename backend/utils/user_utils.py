import logging

from mysql.connector import Error

from utils.db import get_db_connection

log = logging.getLogger("inamhi")

_SQL_USUARIO_BASE = """
    SELECT
        u.id, u.rol_id, r.nombre AS rol,
        u.nombres, u.apellidos, u.cedula, u.correo,
        u.usuario, u.password_hash, u.cargo,
        u.area_unidad, u.dependencia, u.telefono_ext,
        u.estado
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
"""


def obtener_usuario_por_username(username: str) -> dict | None:
    conexion = get_db_connection()
    if conexion is None:
        return None
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(_SQL_USUARIO_BASE + " WHERE u.usuario = %s LIMIT 1", (username,))
        return cursor.fetchone()
    except Error as e:
        log.error("[user] error obtener_usuario_por_username: %s", e)
        return None
    finally:
        try:
            cursor.close()
            conexion.close()
        except Exception:
            pass


def obtener_usuario_por_id(usuario_id: int) -> dict | None:
    conexion = get_db_connection()
    if conexion is None:
        return None
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(
            _SQL_USUARIO_BASE + ", u.ultimo_acceso, u.created_at, u.updated_at"
            " FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id"
            " WHERE u.id = %s LIMIT 1",
            (usuario_id,),
        )
        return cursor.fetchone()
    except Error as e:
        log.error("[user] error obtener_usuario_por_id: %s", e)
        return None
    finally:
        try:
            cursor.close()
            conexion.close()
        except Exception:
            pass


def actualizar_ultimo_acceso(usuario_id: int) -> bool:
    conexion = get_db_connection()
    if conexion is None:
        return False
    try:
        cursor = conexion.cursor()
        cursor.execute("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = %s", (usuario_id,))
        conexion.commit()
        return True
    except Error as e:
        log.error("[user] error actualizar_ultimo_acceso: %s", e)
        return False
    finally:
        try:
            cursor.close()
            conexion.close()
        except Exception:
            pass
