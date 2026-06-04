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

JWT_SECRET_KEY       = os.getenv("JWT_SECRET_KEY", "inamhi_liberacion_web_secret_2026")
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
LOGO_INAMHI_PATH  = os.path.join(BASE_DIR, "static", "img", "logo_inamhi.png")

# =====================================================
# CORS — orígenes permitidos
# =====================================================

CORS_ORIGINS = [
    "http://localhost:4300",
    "http://127.0.0.1:4300",
    "http://10.0.5.120:4300",
    "http://10.0.153.69",
    "http://10.0.153.69:4300",
]
