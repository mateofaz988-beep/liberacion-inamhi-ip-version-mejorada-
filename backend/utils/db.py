import logging
import mysql.connector
from mysql.connector import Error
from mysql.connector.pooling import MySQLConnectionPool

from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_POOL_SIZE

log = logging.getLogger("inamhi")

# =====================================================
# Pool de conexiones MySQL
# Las conexiones se reutilizan en vez de crearse desde cero
# en cada request — mejora latencia y evita agotamiento de sockets.
# =====================================================

_pool: MySQLConnectionPool | None = None


def _init_pool() -> MySQLConnectionPool:
    return MySQLConnectionPool(
        pool_name="inamhi_pool",
        pool_size=DB_POOL_SIZE,
        pool_reset_session=True,
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=False,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci",
    )


def get_db_connection():
    """
    Devuelve una conexión del pool. La conexión debe cerrarse con
    conexion.close() al terminar — esto la devuelve al pool, no la destruye.
    Retorna None si el pool no está disponible o la BD no responde.
    """
    global _pool
    try:
        if _pool is None:
            _pool = _init_pool()
        return _pool.get_connection()
    except Error as e:
        log.error("[db] error obteniendo conexión del pool: %s", e)
        _pool = None
        return None


def init_db(app):
    global _pool
    with app.app_context():
        try:
            _pool = _init_pool()
            conn = _pool.get_connection()
            conn.close()
            log.info("[db] pool inicializado — %s conexiones a %s/%s", DB_POOL_SIZE, DB_HOST, DB_NAME)
        except Error as e:
            log.warning("[db] no se pudo inicializar el pool: %s. Se reconectará por request.", e)
