import os
from dotenv import load_dotenv

load_dotenv()

# =====================================================
# Base del proyecto
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# =====================================================
# Base de datos
# =====================================================

DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = int(os.getenv("DB_PORT", 3306))
DB_USER     = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME     = os.getenv("DB_NAME", "inamhi_liberacion_web")
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 10))

# =====================================================
# JWT
# =====================================================

_jwt_secret = os.getenv("JWT_SECRET_KEY", "")
_default_weak = "inamhi_liberacion_web_secret_2026"

if not _jwt_secret or _jwt_secret == _default_weak:
    import warnings
    warnings.warn(
        "JWT_SECRET_KEY no está configurado o usa el valor por defecto inseguro. "
        "Genere uno con: python -c \"import secrets; print(secrets.token_hex(64))\" "
        "y configúrelo en el archivo .env",
        stacklevel=2,
    )
    if not _jwt_secret:
        import secrets as _secrets
        _jwt_secret = _secrets.token_hex(64)

JWT_SECRET_KEY       = _jwt_secret
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 8))

# =====================================================
# Servidor
# =====================================================

BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", 5050))
APP_URL      = os.getenv("APP_URL", f"http://127.0.0.1:{BACKEND_PORT}")

# =====================================================
# SMTP
# =====================================================

SMTP_HOST     = os.getenv("SMTP_HOST", "")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM", SMTP_USER)

# =====================================================
# Rutas de archivos
# =====================================================

UPLOAD_FOLDER     = os.path.join(BASE_DIR, "uploads")
DOCUMENTOS_FOLDER = os.path.join(UPLOAD_FOLDER, "documentos")
FIRMADOS_FOLDER   = os.path.join(UPLOAD_FOLDER, "firmados")
ESCANEADOS_FOLDER = os.path.join(UPLOAD_FOLDER, "escaneados")
TEMP_CERTS_FOLDER = os.path.join(UPLOAD_FOLDER, "temp_certs")
LOGO_INAMHI_PATH  = os.path.join(BASE_DIR, "static", "img", os.getenv("LOGO_PDF", "logo_inamhi.png"))

# =====================================================
# CORS — orígenes permitidos
# Configura CORS_ORIGINS en .env como lista separada por comas.
# Ejemplo: CORS_ORIGINS=http://localhost:4300,https://app.inamhi.gob.ec
# =====================================================

_cors_env = os.getenv("CORS_ORIGINS", "")
if _cors_env:
    CORS_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    # Valores por defecto solo para desarrollo local
    CORS_ORIGINS = [
        "http://localhost:4300",
        "http://127.0.0.1:4300",
    ]
