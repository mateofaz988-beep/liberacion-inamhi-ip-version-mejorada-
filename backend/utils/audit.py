import json

from mysql.connector import Error

from utils.db import get_db_connection
from utils.helpers import obtener_ip_cliente

# =====================================================
# Registro de auditoría general
# =====================================================

def registrar_auditoria(
    usuario_id,
    solicitud_id,
    modulo: str,
    accion: str,
    descripcion: str,
    datos_anteriores=None,
    datos_nuevos=None,
):
    conexion = get_db_connection()
    if conexion is None:
        return

    try:
        cursor = conexion.cursor()
        cursor.execute(
            """
            INSERT INTO auditoria
                (usuario_id, solicitud_id, modulo, accion, descripcion,
                 datos_anteriores, datos_nuevos, ip_cliente)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                usuario_id,
                solicitud_id,
                modulo,
                accion,
                descripcion,
                json.dumps(datos_anteriores) if datos_anteriores else None,
                json.dumps(datos_nuevos) if datos_nuevos else None,
                obtener_ip_cliente(),
            ),
        )
        conexion.commit()
    except Error as e:
        print(f"[audit] error al registrar auditoría: {e}")
    finally:
        try:
            cursor.close()
            conexion.close()
        except Exception:
            pass
