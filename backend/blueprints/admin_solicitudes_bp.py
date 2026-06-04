"""
Blueprint de solicitudes administrativas.

Las rutas complejas siguen definidas en app_routes.py (generado desde app.py)
y se registran aquí para mantener la estructura de Blueprints.
Este módulo actúa como punto de extensión: a medida que las rutas se migren
a este archivo se elimina la referencia a app_routes.
"""
from flask import Blueprint

admin_solicitudes_bp = Blueprint("admin_solicitudes", __name__, url_prefix="/api/admin/solicitudes")

# Las rutas de este blueprint se registran directamente en app.py
# durante la fase de migración. Ver MIGRATION.md para el plan de extracción.
