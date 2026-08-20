# INFORME TÉCNICO DEL SISTEMA
## Sistema de Gestión de Solicitudes de Liberación de Información
### Instituto Nacional de Meteorología e Hidrología del Ecuador — INAMHI

---

**Versión:** 1.0  
**Fecha:** 11 de junio de 2026  
**Clasificación:** Interno — Uso Técnico  

---

## TABLA DE CONTENIDOS

1. [Introducción y Objetivo](#1-introducción-y-objetivo)
2. [Alcance del Sistema](#2-alcance-del-sistema)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Módulos Funcionales](#4-módulos-funcionales)
5. [Tecnologías Utilizadas](#5-tecnologías-utilizadas)
6. [Base de Datos](#6-base-de-datos)
7. [API REST — Endpoints](#7-api-rest--endpoints)
8. [Seguridad y Firma Digital](#8-seguridad-y-firma-digital)
9. [Gestión de Roles y Permisos](#9-gestión-de-roles-y-permisos)
10. [Auditoría e Integridad](#10-auditoría-e-integridad)
11. [Despliegue e Infraestructura](#11-despliegue-e-infraestructura)
12. [Variables de Entorno y Configuración](#12-variables-de-entorno-y-configuración)
13. [Generación de Reportes y Documentos PDF](#13-generación-de-reportes-y-documentos-pdf)
14. [Flujo de Trabajo del Proceso de Solicitud](#14-flujo-de-trabajo-del-proceso-de-solicitud)
15. [Limitaciones y Consideraciones](#15-limitaciones-y-consideraciones)

---

## 1. INTRODUCCIÓN Y OBJETIVO

### 1.1 Contexto Institucional

El Instituto Nacional de Meteorología e Hidrología del Ecuador (INAMHI) es la entidad pública responsable de generar, administrar y difundir la información meteorológica, hidrológica y oceanográfica del Ecuador. Como institución del Estado ecuatoriano, está sujeta a la Ley Orgánica de Transparencia y Acceso a la Información Pública (LOTAIP), que obliga a las entidades públicas a atender las solicitudes de información presentadas por la ciudadanía.

### 1.2 Problemática

Antes de la implementación de este sistema, el proceso de atención de solicitudes de liberación de información se realizaba de forma manual y desarticulada, lo que generaba:

- Demoras en el tiempo de respuesta a los ciudadanos
- Falta de trazabilidad en el proceso de aprobación
- Ausencia de firma digital en documentos de respuesta
- Imposibilidad de seguimiento en tiempo real por parte del solicitante
- Riesgos de integridad documental por ausencia de controles criptográficos
- Dificultad para generar reportes estadísticos de gestión

### 1.3 Objetivo del Sistema

El **Sistema de Gestión de Solicitudes de Liberación de Información INAMHI** es una aplicación web institucional que digitaliza y automatiza el proceso de recepción, revisión, aprobación y entrega de documentos en respuesta a solicitudes ciudadanas de acceso a la información pública.

**Objetivos específicos:**

- Proveer un canal digital oficial para que los ciudadanos presenten solicitudes de información
- Implementar un flujo de aprobación multi-nivel (TICS → Jefe Inmediato → Máxima Autoridad)
- Garantizar la integridad de los documentos mediante firma digital criptográfica conforme al estándar PAdES
- Mantener un registro de auditoría inmutable de todas las operaciones realizadas
- Permitir el seguimiento del estado de la solicitud por parte del ciudadano
- Facilitar la generación de reportes estadísticos e históricos para la administración

---

## 2. ALCANCE DEL SISTEMA

El sistema cubre los siguientes procesos institucionales:

| Proceso | Alcance |
|---------|---------|
| Recepción de solicitudes | Formulario público web, validación automática, generación de código de seguimiento |
| Gestión documental | Carga de documentos, versionamiento, almacenamiento seguro |
| Flujo de aprobación | Revisión por TICS, Jefe Inmediato y Máxima Autoridad |
| Firma digital | Aplicación de firma electrónica criptográfica (PAdES) a documentos PDF |
| Notificaciones | Correo electrónico al ciudadano en cada cambio de estado |
| Seguimiento ciudadano | Consulta pública del estado de la solicitud con código único |
| Reportes y estadísticas | Generación de reportes en PDF y Excel por período y estado |
| Auditoría | Registro completo e inmutable de todas las operaciones |
| Administración | Gestión de usuarios, roles y configuración del sistema |

**Fuera del alcance:**
- Integración con sistemas de firma electrónica de terceros (CE-BOE)
- Integración con el sistema de gestión documental institucional externo
- Módulo de pagos

---

## 3. ARQUITECTURA DEL SISTEMA

### 3.1 Visión General

El sistema sigue una arquitectura de **tres capas** desacopladas, desplegadas en un servidor Linux único con Nginx como proxy inverso:

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERNET / RED INTERNA                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/HTTPS :80
                  ┌────────▼────────┐
                  │   NGINX         │
                  │  Proxy Reverso  │
                  │  10.0.153.76:80 │
                  └───┬─────────────┘
                      │
          ┌───────────┴────────────┐
          │                        │
  ┌───────▼──────────┐   ┌────────▼──────────┐
  │  ANGULAR SPA     │   │  FLASK REST API    │
  │  (Frontend)      │   │  :5050/api/*       │
  │  /var/www/inamhi │   │  Gunicorn WSGI     │
  │  /frontend       │   │  Python 3          │
  └──────────────────┘   └────────┬──────────┘
                                  │ TCP 3306
                         ┌────────▼──────────┐
                         │  MySQL 8.0+        │
                         │  inamhi_liberacion │
                         │  _web             │
                         └───────────────────┘
```

### 3.2 Componentes Principales

| Componente | Tecnología | Función |
|------------|-----------|---------|
| Frontend | Angular 21.2 (SPA) | Interfaz de usuario para todos los roles |
| Backend | Flask 3.1 + Gunicorn | API REST, lógica de negocio, procesamiento PDF |
| Base de datos | MySQL 8.0+ | Persistencia de datos y auditoría |
| Servidor web | Nginx | Proxy inverso, archivos estáticos |
| Servicio sistema | systemd | Gestión del proceso backend en producción |

### 3.3 Comunicación entre Componentes

- **Frontend → Backend:** HTTP/REST con JSON, autenticación vía Bearer Token (JWT)
- **Backend → Base de datos:** Conexión MySQL nativa con pool de conexiones
- **Backend → Email:** SMTP para notificaciones automáticas
- **Nginx → Frontend:** Servicio de archivos estáticos compilados
- **Nginx → Backend:** Proxy reverso hacia Gunicorn en `localhost:5050`

---

## 4. MÓDULOS FUNCIONALES

### 4.1 Módulo Público (sin autenticación)

**Solicitud Pública (`/public/solicitud`)**
- Formulario de ingreso de solicitud de información
- Validación de campos en tiempo real
- Generación automática de código único de seguimiento
- Envío de confirmación por correo electrónico al ciudadano

**Seguimiento Público (`/public/seguimiento`)**
- Consulta del estado de la solicitud por código único
- Vista del historial de estados sin autenticación
- Posibilidad de descargar documentos de respuesta entregados

### 4.2 Módulo de Autenticación

**Login (`/auth/login`)**
- Autenticación con usuario y contraseña
- Generación y entrega de JWT con claims de rol
- Redirección automática al dashboard según rol
- Manejo de sesión y cierre de sesión seguro

### 4.3 Módulo de Administrador (`/admin/*`)

- **Dashboard:** Vista general con métricas de solicitudes por estado
- **Solicitudes:** Listado completo, filtros, detalle y gestión de cualquier solicitud
- **Funcionarios:** Alta, baja y modificación de cuentas de funcionarios
- **Usuarios:** Gestión completa de cuentas del sistema
- **Reportes:** Generación de reportes por período, estado y rol en PDF/Excel
- **Auditoría:** Consulta del log de auditoría completo con filtros avanzados
- **Solicitud Detalle:** Vista completa de una solicitud con historial de acciones

### 4.4 Módulo de Analista TICS (`/tics/*`)

- **Dashboard:** Solicitudes pendientes de validación técnica
- **Historial:** Solicitudes previamente atendidas
- **Reportes:** Estadísticas de solicitudes gestionadas

### 4.5 Módulo de Jefe Inmediato (`/jefe/*`)

- **Dashboard:** Solicitudes que requieren revisión y aprobación
- **Historial:** Solicitudes aprobadas o rechazadas
- **Reportes:** Reportes de gestión por período

### 4.6 Módulo de Máxima Autoridad (`/autoridad/*`)

- **Dashboard:** Solicitudes que requieren autorización final
- **Historial:** Solicitudes con decisión tomada
- **Reportes:** Reportes ejecutivos

---

## 5. TECNOLOGÍAS UTILIZADAS

### 5.1 Frontend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Angular | 21.2.0 | Framework SPA principal, standalone components |
| TypeScript | 5.9.2 | Lenguaje de programación (strict mode) |
| SCSS | — | Estilos (preprocesador CSS) |
| Bootstrap | 5.3.8 | Framework CSS responsivo |
| Bootstrap Icons | 1.13.1 | Íconos vectoriales |
| RxJS | 7.8.0 | Programación reactiva, gestión de observables |
| jsPDF | 4.2.1 | Generación de PDF en el cliente |
| jsPDF AutoTable | 5.0.7 | Tablas en documentos PDF |
| XLSX | 0.18.5 | Exportación a Excel |
| FileSaver.js | 2.0.5 | Descarga de archivos en el navegador |
| SweetAlert2 | 11.26.24 | Modales de alerta y confirmación |
| Vitest | 4.0.8 | Framework de pruebas unitarias |
| jsdom | 28.0.0 | DOM virtual para pruebas |
| Node.js | ≥18 | Entorno de compilación |
| npm | — | Gestor de paquetes |

### 5.2 Backend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Python | 3.x | Lenguaje de programación backend |
| Flask | 3.1.3 | Framework web REST API |
| Gunicorn | 23.0.0 | Servidor WSGI para producción |
| Flask-CORS | 6.0.2 | Control de CORS entre frontend y backend |
| Flask-Limiter | 4.1.1 | Rate limiting por IP/usuario |
| mysql-connector-python | 9.7.0 | Conector MySQL nativo |
| PyJWT | 2.12.1 | Generación y validación de JSON Web Tokens |
| bcrypt | 5.0.0 | Hash de contraseñas con salt |
| pyHanko | 0.35.1 | Firma digital PDF estándar PAdES |
| PyMuPDF (fitz) | 1.26.7 | Lectura y manipulación de documentos PDF |
| ReportLab | 4.5.0 | Generación programática de PDFs |
| cryptography | 48.0.0 | Operaciones criptográficas (X.509, etc.) |
| qrcode | 8.2 | Generación de códigos QR para documentos |
| Pillow | 12.2.0 | Procesamiento de imágenes |
| python-dotenv | 1.2.2 | Carga de variables de entorno desde `.env` |
| lxml | 6.1.1 | Procesamiento XML/HTML |
| requests | 2.34.2 | Cliente HTTP para servicios externos |

### 5.3 Infraestructura

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Nginx | Estable | Proxy inverso y servidor de archivos estáticos |
| MySQL | 8.0+ | Motor de base de datos relacional |
| systemd | — | Gestión del servicio backend en Linux |
| Linux (Ubuntu/Debian) | — | Sistema operativo del servidor |

---

## 6. BASE DE DATOS

### 6.1 Motor y Configuración

- **Motor:** MySQL 8.0+
- **Nombre de la base de datos:** `inamhi_liberacion_web`
- **Charset:** UTF-8 (utf8mb4)
- **Conexión:** Pool de conexiones gestionado por mysql-connector-python

### 6.2 Tablas Principales

#### Tabla: `firmas_digitales`
Registro de cada firma electrónica aplicada a un documento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK AUTO | Identificador único |
| solicitud_codigo | VARCHAR | Código de la solicitud asociada |
| version_documento | INT | Versión del documento firmado |
| certificado_info | TEXT (JSON) | Metadatos del certificado digital (CN, serie, validez) |
| hash_documento_antes | VARCHAR(64) | Hash SHA-256 del PDF antes de firmar |
| hash_documento_despues | VARCHAR(64) | Hash SHA-256 del PDF después de firmarlo |
| algoritmo_hash | VARCHAR | Algoritmo usado (SHA-256) |
| timestamp_firma | DATETIME | Fecha y hora exacta de la firma |
| ip_cliente | VARCHAR | Dirección IP del firmante |
| estado_validacion | ENUM | Estado: valida / invalida / pendiente |
| ruta_archivo_firmado | VARCHAR | Ruta física del PDF firmado |

#### Tabla: `auditoria_firmas`
Log inmutable de todas las operaciones realizadas sobre firmas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK AUTO | Identificador único |
| accion | VARCHAR | Tipo de acción (FIRMA_APLICADA, VALIDACION, etc.) |
| solicitud_codigo | VARCHAR | Código de solicitud afectada |
| usuario_id | INT | ID del usuario que realizó la acción |
| detalles | TEXT (JSON) | Información adicional de la operación |
| ip_origen | VARCHAR | IP desde donde se realizó la acción |
| timestamp | DATETIME | Fecha y hora de la operación |

#### Tabla: `versiones_documento`
Versionamiento completo de cada documento del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK AUTO | Identificador único |
| solicitud_codigo | VARCHAR | Código de solicitud |
| numero_version | INT | Número de versión (incremental) |
| tipo_documento | ENUM | Tipo: original / firmado / corregido |
| ruta_archivo | VARCHAR | Ruta física del archivo |
| hash_sha256 | VARCHAR(64) | Hash de integridad del archivo |
| creado_por | INT | ID del usuario creador |
| fecha_creacion | DATETIME | Timestamp de creación |
| activo | BOOLEAN | Si esta versión es la vigente |

> **Nota:** El sistema nunca sobreescribe versiones anteriores. Cada modificación genera una nueva versión, garantizando la trazabilidad documental completa.

### 6.3 Otras Tablas del Sistema

| Tabla | Propósito |
|-------|---------|
| `usuarios` | Cuentas de funcionarios del sistema |
| `solicitudes` | Solicitudes de información ciudadanas |
| `documentos` | Archivos adjuntos a solicitudes |
| `estados_solicitud` | Historial de cambios de estado |
| `notificaciones` | Registro de correos enviados |
| `roles` | Definición de roles del sistema |

---

## 7. API REST — ENDPOINTS

### 7.1 Endpoints Públicos (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/public/solicitudes` | Crear nueva solicitud de información |
| GET | `/api/public/solicitudes/seguimiento/<codigo>` | Consultar estado de solicitud |
| GET | `/api/public/solicitudes/<codigo>/documentos` | Obtener documentos públicos entregados |
| POST | `/api/public/electronico/preparar` | Preparar documento para firma digital |
| POST | `/api/public/electronico/<codigo>/subir-firmado` | Subir PDF con firma aplicada |

### 7.2 Endpoints de Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión, retorna JWT |
| POST | `/api/auth/logout` | Cerrar sesión (invalidar token) |
| GET | `/api/auth/me` | Obtener perfil del usuario autenticado |
| POST | `/api/auth/cambiar-password` | Cambiar contraseña |

### 7.3 Endpoints Administrativos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/solicitudes` | Listar todas las solicitudes con filtros |
| GET | `/api/admin/solicitudes/<id>` | Detalle de una solicitud |
| GET | `/api/admin/solicitudes/<id>/pdf` | Descargar PDF de solicitud |
| GET | `/api/admin/solicitudes/<id>/historial` | Historial de estados |
| GET | `/api/admin/usuarios` | Listar usuarios del sistema |
| POST | `/api/admin/usuarios` | Crear nuevo usuario/funcionario |
| PUT | `/api/admin/usuarios/<id>` | Actualizar usuario |
| DELETE | `/api/admin/usuarios/<id>` | Desactivar usuario |
| GET | `/api/admin/reportes` | Generar reporte por parámetros |
| GET | `/api/admin/auditoria` | Consultar log de auditoría |

### 7.4 Endpoints por Rol de Funcionario

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tics/solicitudes` | Solicitudes pendientes de validación TICS |
| POST | `/api/tics/solicitudes/<id>/validar` | Validar o rechazar solicitud |
| GET | `/api/jefe/solicitudes` | Solicitudes para revisión del jefe |
| POST | `/api/jefe/solicitudes/<id>/aprobar` | Aprobar o rechazar solicitud |
| GET | `/api/autoridad/solicitudes` | Solicitudes para autorización final |
| POST | `/api/autoridad/solicitudes/<id>/autorizar` | Autorizar o denegar solicitud |

### 7.5 Endpoints de Firma Digital

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/firma/preparar/<codigo>` | Preparar PDF para firma (genera PDF listo) |
| POST | `/api/admin/firma/subir/<codigo>` | Subir PDF firmado por el funcionario |
| GET | `/api/admin/firma/validar/<codigo>` | Validar firma del documento |
| GET | `/api/admin/firma/estado/<codigo>` | Estado actual de la firma |

---

## 8. SEGURIDAD Y FIRMA DIGITAL

### 8.1 Autenticación con JWT

El sistema utiliza **JSON Web Tokens (JWT)** para la autenticación stateless de los funcionarios:

- **Algoritmo:** HS256 (HMAC-SHA256)
- **Clave secreta:** 64 caracteres hexadecimales, configurada en `.env`
- **Expiración:** 8 horas (configurable)
- **Claims incluidos:**
  - `sub`: ID del usuario
  - `rol`: Rol del funcionario
  - `exp`: Timestamp de expiración
  - `iat`: Timestamp de emisión

El token se envía en cada petición autenticada mediante el header:
```
Authorization: Bearer <token>
```

**En el frontend (Angular):** Un `HttpInterceptor` adjunta automáticamente el token a todas las peticiones al backend, y redirige al login si el servidor retorna `401 Unauthorized`.

**En el backend (Flask):** Un decorador Python valida el token, verifica el rol requerido y rechaza peticiones con tokens inválidos, expirados o con rol insuficiente.

### 8.2 Hashing de Contraseñas

Las contraseñas se almacenan utilizando **bcrypt** con salt automático:

- Función: `bcrypt.hashpw(password.encode(), bcrypt.gensalt())`
- Factor de trabajo: 12 rondas (por defecto)
- **Nunca se almacena la contraseña en texto plano**

### 8.3 Control de CORS

El backend configura explícitamente los orígenes permitidos para peticiones cross-origin:

- Configuración mediante `Flask-CORS`
- Orígenes permitidos definidos en la variable de entorno `CORS_ORIGINS`
- Solo se permiten los orígenes especificados (lista blanca)

### 8.4 Rate Limiting

Se utiliza **Flask-Limiter** para proteger contra ataques de fuerza bruta y abuso de la API:

- Límites por IP configurables
- Protección especial en endpoints de autenticación (`/api/auth/login`)
- Respuesta `429 Too Many Requests` al superar el límite

### 8.5 Headers de Seguridad HTTP

El backend incluye headers de seguridad en todas las respuestas:

| Header | Valor | Propósito |
|--------|-------|---------|
| `X-Frame-Options` | DENY | Previene clickjacking |
| `X-Content-Type-Options` | nosniff | Previene MIME sniffing |
| `X-XSS-Protection` | 1; mode=block | Protección XSS básica |
| `Strict-Transport-Security` | max-age=31536000 | Fuerza HTTPS |
| `Content-Security-Policy` | Configurado | Previene inyección de contenido |

### 8.6 Firma Digital — pyHanko (PAdES)

Esta es la característica técnica más compleja del sistema. La firma digital garantiza la autenticidad e integridad de los documentos PDF de respuesta.

#### ¿Qué es PAdES?

**PAdES (PDF Advanced Electronic Signatures)** es un estándar europeo (ETSI EN 319 102) para firmas electrónicas avanzadas en documentos PDF, compatible con la normativa de firma electrónica de Ecuador (Ley de Comercio Electrónico, Firmas y Mensajes de Datos).

#### Flujo de Firma Digital

```
1. PREPARACIÓN
   └─> Backend genera PDF con datos de la solicitud
   └─> Backend agrega QR y metadatos de verificación
   └─> Backend devuelve PDF listo para firmar

2. FIRMA
   └─> Funcionario autorizado descarga el PDF
   └─> Aplica su token/certificado digital personal
   └─> Firma el PDF localmente con su certificado
   └─> Sube el PDF firmado al sistema

3. VALIDACIÓN
   └─> Backend valida la firma con pyHanko
   └─> Verifica cadena de certificados X.509
   └─> Calcula hash SHA-256 antes y después
   └─> Registra resultado en auditoria_firmas

4. ALMACENAMIENTO
   └─> PDF firmado se guarda en uploads/firmados/
   └─> Se crea versión en versiones_documento
   └─> Se registra en firmas_digitales
```

#### Información del Certificado Almacenada

Para cada firma se extrae y almacena del certificado:
- **CN (Common Name):** Nombre del firmante
- **Número de serie:** Identificador único del certificado
- **Emisor:** Entidad certificadora
- **Fecha de inicio y fin de validez**
- **Estado de la firma:** válida / inválida / pendiente

#### Validación Criptográfica

pyHanko verifica:
- Integridad del documento (hash SHA-256 antes/después)
- Validez temporal del certificado al momento de la firma
- Cadena de confianza del certificado X.509
- Que el documento no fue modificado tras la firma

### 8.7 Validación de Entrada

- Sanitización de texto en todos los campos del formulario público
- Validación de tipos de archivo permitidos en carga de documentos
- Límite de tamaño de archivos
- Validación de formato en campos como correo electrónico, cédula, etc.

### 8.8 Almacenamiento Seguro de Archivos

Los archivos se organizan en subcarpetas aisladas:

```
backend/uploads/
├── documentos/     # Documentos adjuntos originales de ciudadanos
├── firmados/       # PDFs con firma digital aplicada
├── escaneados/     # Documentos escaneados subidos por funcionarios
└── temp_certs/     # Certificados temporales para procesamiento
```

---

## 9. GESTIÓN DE ROLES Y PERMISOS

### 9.1 Roles del Sistema

El sistema implementa **Role-Based Access Control (RBAC)** con cuatro roles de funcionario:

| Rol | Identificador | Descripción |
|-----|---------------|-------------|
| Administrador | `administrador` | Acceso total: usuarios, solicitudes, configuración, auditoría |
| Analista TICS | `analista_tics` | Valida documentos técnicos, primera revisión |
| Jefe Inmediato | `jefe_inmediato` | Revisa y aprueba solicitudes después de TICS |
| Máxima Autoridad | `maxima_autoridad` | Decisión final de aprobación o negación |

Adicionalmente existe el rol implícito de **ciudadano público**, que no requiere autenticación.

### 9.2 Protección de Rutas en Angular

Se implementa un `RoleGuard` (`src/app/guards/role-guard.ts`) que:

- Intercepta toda navegación a rutas protegidas
- Verifica la existencia y validez del JWT en el almacenamiento local
- Extrae el claim de `rol` del token
- Compara el rol con el requerido por la ruta
- Redirige al login si no está autenticado, o a una página de error si el rol no coincide

### 9.3 Protección de Endpoints en Flask

Cada endpoint del backend está decorado con verificación de rol:

```python
@require_role('administrador')
def endpoint_admin():
    ...

@require_role('jefe_inmediato', 'administrador')  
def endpoint_jefe():
    ...
```

El decorador valida el JWT, extrae el rol y retorna `403 Forbidden` si el rol es insuficiente.

---

## 10. AUDITORÍA E INTEGRIDAD

### 10.1 Principios de Auditoría

El sistema fue diseñado con **auditoría inmutable** como requisito de diseño:

- **Ningún registro de auditoría puede ser modificado o eliminado**
- Cada operación relevante genera automáticamente un registro
- Se captura: quién, qué, cuándo, desde dónde (IP)
- El log es accesible para el administrador pero no editable

### 10.2 Operaciones Auditadas

| Operación | Evento registrado |
|-----------|------------------|
| Login/Logout | Acceso y cierre de sesión de funcionarios |
| Cambio de estado de solicitud | Estado anterior, estado nuevo, usuario |
| Carga de documentos | Tipo, tamaño, hash del archivo |
| Firma digital | Aplicación, validación, rechazo |
| Creación/modificación de usuarios | Campos modificados |
| Descarga de documentos | Quién descargó qué documento |
| Generación de reportes | Parámetros y usuario solicitante |

### 10.3 Integridad Documental

Para garantizar que los documentos no sean alterados:

1. **Hash SHA-256** calculado al subir cada documento
2. **Hash almacenado** en la base de datos junto al archivo
3. **Verificación opcional** que compara el hash almacenado con el hash actual del archivo
4. **Versionamiento:** nunca se sobreescribe un archivo — siempre se crea una versión nueva

### 10.4 Logging del Sistema

El backend mantiene logs operacionales en `backend/logs/`:

- Errores de aplicación
- Peticiones HTTP con código de respuesta
- Operaciones de base de datos críticas
- Errores de firma digital

---

## 11. DESPLIEGUE E INFRAESTRUCTURA

### 11.1 Servidor de Producción

| Parámetro | Valor |
|-----------|-------|
| IP del servidor | 10.0.153.76 |
| Puerto público | 80 (HTTP) |
| Puerto Flask interno | 5050 |
| Puerto MySQL | 3306 (local) |
| Sistema operativo | Linux (Ubuntu/Debian) |
| Servidor web | Nginx (proxy inverso) |
| WSGI | Gunicorn |
| Gestión de procesos | systemd |

### 11.2 Configuración Nginx

Nginx actúa como proxy inverso con la siguiente lógica:

```
GET /api/* → proxy_pass http://127.0.0.1:5050   (Flask backend)
GET /*      → root /var/www/inamhi/frontend      (Angular SPA)
try_files $uri $uri/ /index.html                  (SPA routing fallback)
```

Esta configuración permite que el Angular Router maneje el enrutamiento del lado cliente correctamente.

### 11.3 Servicio systemd

El backend corre como un servicio del sistema (`inamhi-backend.service`):

- **Restart automático** en caso de fallo
- **Arranque automático** al iniciar el servidor
- **Usuario de servicio:** sin privilegios de root
- **Working directory:** directorio del backend

### 11.4 Proceso de Despliegue

El script `deploy/deploy.sh` automatiza:

1. Instalación de dependencias del sistema (nginx, python3, libmysqlclient-dev)
2. Creación de entorno virtual Python
3. Instalación de dependencias (`pip install -r requirements.txt`)
4. Compilación del frontend Angular (`ng build --configuration production`)
5. Copia de archivos al directorio web
6. Configuración de Nginx
7. Configuración del servicio systemd
8. Inicio de servicios

### 11.5 Scripts de Despliegue

| Script | Plataforma | Propósito |
|--------|-----------|---------|
| `deploy/deploy.sh` | Linux Bash | Despliegue completo automatizado en servidor |
| `deploy/build-and-upload.ps1` | Windows PowerShell | Compilar frontend y subir al servidor |

---

## 12. VARIABLES DE ENTORNO Y CONFIGURACIÓN

Toda la configuración sensible se gestiona mediante el archivo `backend/.env`, siguiendo el principio de **no hardcodear credenciales en el código**.

### 12.1 Variables de Base de Datos

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Servidor MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USER` | Usuario de la BD | `inamhi_user` |
| `DB_PASSWORD` | Contraseña de la BD | `<contraseña segura>` |
| `DB_NAME` | Nombre de la BD | `inamhi_liberacion_web` |

### 12.2 Variables de Seguridad

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `JWT_SECRET_KEY` | Clave para firmar JWT | `<64 chars hex>` |
| `JWT_EXPIRATION_HOURS` | Duración de la sesión | `8` |

### 12.3 Variables del Servidor

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `APP_URL` | URL pública del backend | `http://10.0.153.76:5050` |
| `BACKEND_HOST` | IP de escucha Flask | `0.0.0.0` |
| `BACKEND_PORT` | Puerto de escucha Flask | `5050` |
| `CORS_ORIGINS` | Orígenes CORS permitidos | `http://10.0.153.76` |

### 12.4 Variables de Correo Electrónico

| Variable | Descripción |
|----------|-------------|
| `SMTP_HOST` | Servidor de correo saliente |
| `SMTP_PORT` | Puerto SMTP (25, 465, 587) |
| `SMTP_USER` | Cuenta de envío |
| `SMTP_PASSWORD` | Contraseña de la cuenta |
| `SMTP_FROM` | Dirección del remitente visible |

### 12.5 Variables de PDF

| Variable | Descripción |
|----------|-------------|
| `LOGO_PDF` | Nombre del archivo de logo para documentos |

---

## 13. GENERACIÓN DE REPORTES Y DOCUMENTOS PDF

### 13.1 Tipos de Documentos Generados

| Documento | Generado por | Librería |
|-----------|-------------|---------|
| PDF de solicitud (para firma) | Backend Flask | ReportLab + PyMuPDF |
| PDF de respuesta al ciudadano | Backend Flask | ReportLab |
| Reportes estadísticos PDF | Backend Flask | ReportLab |
| Reportes Excel | Frontend Angular | XLSX.js |
| Exportación tabular PDF | Frontend Angular | jsPDF + AutoTable |

### 13.2 Características del PDF Generado

Los documentos PDF de respuesta incluyen:

- **Encabezado institucional** con logo oficial del INAMHI
- **Número de solicitud** y código de seguimiento
- **Datos del solicitante** y de la solicitud
- **Contenido de la respuesta**
- **Código QR** de verificación con URL de validación
- **Espacio para firma digital** (con visibilidad del firmante)
- **Metadatos del documento** (fecha, versión, número de páginas)

### 13.3 Código QR de Verificación

Cada documento incluye un código QR que permite verificar:

- Autenticidad del documento
- Estado actual en el sistema
- Información de la firma digital aplicada

---

## 14. FLUJO DE TRABAJO DEL PROCESO DE SOLICITUD

### 14.1 Diagrama de Estados

```
BORRADOR
   │
   ▼ (ciudadano envía)
RECIBIDA
   │
   ▼ (analista TICS revisa)
EN_REVISION_TICS ─────────────────┐
   │                              │ (TICS rechaza)
   ▼ (TICS valida)                ▼
EN_REVISION_JEFE          RECHAZADA_TICS
   │
   ▼ (Jefe revisa)
EN_REVISION_AUTORIDAD ────────────┐
   │                              │ (Jefe rechaza)
   ▼ (Autoridad autoriza)         ▼
EN_FIRMA_DIGITAL          RECHAZADA_JEFE
   │
   ▼ (documento firmado cargado)
FIRMADA ───────────────────────────┐
   │                               │ (Autoridad niega)
   ▼ (sistema entrega al ciudadano) ▼
ENTREGADA                   NEGADA_AUTORIDAD
```

### 14.2 Descripción de Cada Estado

| Estado | Actor | Acción |
|--------|-------|--------|
| `RECIBIDA` | Sistema | Solicitud ingresada por ciudadano, código generado, email enviado |
| `EN_REVISION_TICS` | Analista TICS | Revisión técnica de los documentos adjuntos |
| `EN_REVISION_JEFE` | Jefe Inmediato | Revisión de contenido y pertinencia de la solicitud |
| `EN_REVISION_AUTORIDAD` | Máxima Autoridad | Decisión final de aprobación o negación |
| `EN_FIRMA_DIGITAL` | Autoridad/TICS | Proceso de firma digital del documento de respuesta |
| `FIRMADA` | Sistema | Firma validada, documento listo para entrega |
| `ENTREGADA` | Sistema | Ciudadano notificado, documento disponible |
| `RECHAZADA_*` | Funcionario | Solicitud rechazada con motivo en cada nivel |
| `NEGADA_AUTORIDAD` | Máxima Autoridad | Negación formal de la solicitud por la máxima autoridad |

### 14.3 Notificaciones Automáticas

El sistema envía correos electrónicos automáticamente en los siguientes eventos:

- Confirmación de recepción de la solicitud (al ciudadano)
- Cambio de estado en el flujo de aprobación
- Rechazo con motivo (al ciudadano)
- Disponibilidad del documento de respuesta (al ciudadano)

---

## 15. LIMITACIONES Y CONSIDERACIONES

### 15.1 Consideraciones de Seguridad

- El servidor actual no usa HTTPS. Se recomienda configurar un certificado TLS/SSL (Let's Encrypt o institucional) para cifrar el tráfico.
- Las contraseñas de la base de datos y JWT se almacenan en `.env` — este archivo no debe estar en el repositorio git (ya configurado en `.gitignore`).
- Los tokens JWT no tienen mecanismo de revocación anticipada. Si un funcionario es desactivado, su token existente sigue siendo válido hasta su expiración (8 horas).

### 15.2 Escalabilidad

- El sistema está diseñado para un servidor único. Para alta disponibilidad se requeriría un balanceador de carga y replicación de MySQL.
- Los archivos subidos (`uploads/`) se almacenan localmente. En un escenario multi-servidor se necesitaría almacenamiento compartido (NFS, S3, etc.).

### 15.3 Dependencias de Firma Digital

- El proceso de firma requiere que el funcionario tenga instalado un certificado digital vigente emitido por una entidad certificadora reconocida en Ecuador.
- pyHanko valida la cadena de certificación, por lo que los certificados deben ser emitidos por CAs de confianza.

### 15.4 Mantenimiento

- Las librerías Python y Angular deben actualizarse periódicamente por razones de seguridad.
- Los logs deben ser rotados regularmente para evitar el agotamiento del disco.
- Se recomienda configurar backups automáticos de la base de datos MySQL.

---

## ANEXO A — ESTRUCTURA DE DIRECTORIOS

```
liberacion-inamhi-ip-version-mejorada-/
├── src/                          # Código fuente Angular
│   └── app/
│       ├── admin/                # Módulo administrador
│       ├── autoridad/            # Módulo máxima autoridad
│       ├── auth/                 # Autenticación
│       ├── jefe/                 # Módulo jefe inmediato
│       ├── tics/                 # Módulo analista TICS
│       ├── public/               # Secciones públicas
│       ├── pages/                # Páginas genéricas
│       ├── services/             # Servicios HTTP Angular
│       ├── guards/               # Guardas de rutas
│       ├── interceptors/         # Interceptores HTTP
│       └── shared/               # Componentes compartidos
├── backend/                      # Código fuente Flask
│   ├── blueprints/               # Módulos de la API
│   ├── utils/                    # Utilidades reutilizables
│   ├── static/                   # Recursos estáticos (logos)
│   ├── uploads/                  # Archivos subidos por usuarios
│   ├── logs/                     # Logs del sistema
│   ├── app.py                    # Aplicación Flask principal
│   ├── config.py                 # Configuración centralizada
│   ├── requirements.txt          # Dependencias Python
│   ├── gunicorn.conf.py          # Configuración Gunicorn
│   ├── wsgi.py                   # Punto de entrada WSGI
│   └── firma_electronica_tablas.sql
├── deploy/                       # Scripts y configuración de despliegue
│   ├── deploy.sh                 # Instalación automatizada Linux
│   ├── build-and-upload.ps1      # Build y upload desde Windows
│   ├── nginx.conf                # Configuración Nginx
│   ├── inamhi-backend.service    # Unidad systemd
│   └── .env.example              # Plantilla de variables de entorno
├── public/                       # Activos estáticos del frontend
├── dist/                         # Frontend compilado (generado)
├── package.json                  # Dependencias Node.js
├── angular.json                  # Configuración Angular CLI
└── tsconfig.json                 # Configuración TypeScript
```

---

*Documento generado el 11 de junio de 2026.*  
*Sistema: INAMHI Liberación Web — Versión mejorada.*
