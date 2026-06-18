# PROMPT COMPLETO — INFORME TÉCNICO INAMHI
# Pega todo este contenido en cualquier IA (ChatGPT, Gemini, Copilot, etc.)

---

Eres un redactor técnico especializado en sistemas de información institucionales.
Necesito que generes un INFORME TÉCNICO COMPLETO Y PROFESIONAL en español,
con formato Word/documento formal, sobre el siguiente sistema de software.

---

## DATOS DEL SISTEMA

**Nombre:** Sistema de Gestión de Solicitudes de Liberación de Información
**Institución:** Instituto Nacional de Meteorología e Hidrología del Ecuador (INAMHI)
**Tipo:** Aplicación web institucional full-stack
**Fecha del informe:** junio 2026
**Versión:** 1.0 (versión mejorada)

---

## PROPÓSITO DEL SISTEMA

Digitaliza y automatiza el proceso de recepción, revisión, aprobación y entrega
de documentos en respuesta a solicitudes ciudadanas de acceso a la información
pública, en cumplimiento de la LOTAIP (Ley Orgánica de Transparencia y Acceso
a la Información Pública del Ecuador).

---

## ARQUITECTURA

- Arquitectura de 3 capas desacopladas
- Servidor Linux único con Nginx como proxy inverso en IP 10.0.153.69:80
- Frontend SPA Angular servido como archivos estáticos
- Backend Flask en puerto 5050 (via Gunicorn + systemd)
- Base de datos MySQL en puerto 3306

```
INTERNET → NGINX :80
              ├── /api/* → Flask :5050 (Gunicorn WSGI)
              └── /* → Angular SPA (/var/www/inamhi/frontend)
                              ↓
                         MySQL 8.0+ :3306
```

---

## ESTRUCTURA COMPLETA DEL PROYECTO (archivo por archivo)

```
liberacion-inamhi-ip-version-mejorada-/          ← Raíz del repositorio
│
├── src/                                          ← Código fuente del FRONTEND (Angular)
│   ├── index.html                                ← HTML raíz donde se monta la SPA Angular
│   ├── main.ts                                   ← Punto de entrada de Angular, bootstrapApplication()
│   ├── styles.scss                               ← Estilos globales SCSS (Bootstrap, variables, reset)
│   │
│   ├── environments/                             ← Configuración de entornos Angular
│   │   ├── environment.ts                        ← Variables para desarrollo local (apiUrl, flags)
│   │   └── environment.prod.ts                   ← Variables para producción (apiUrl apunta al servidor)
│   │
│   └── app/                                      ← Módulo raíz de la aplicación Angular
│       ├── app.ts                                ← Componente raíz (AppComponent), standalone
│       ├── app.html                              ← Template del componente raíz (<router-outlet>)
│       ├── app.scss                              ← Estilos del componente raíz
│       ├── app.spec.ts                           ← Pruebas unitarias del AppComponent
│       ├── app.config.ts                         ← Configuración de la app: provideRouter, provideHttpClient, interceptores
│       ├── app.routes.ts                         ← Definición de TODAS las rutas de la aplicación con lazy loading y guards
│       │
│       ├── auth/                                 ← Módulo de autenticación
│       │   └── login/                            ← Componente de login (ruta: /auth/login)
│       │       ├── login.ts                      ← Lógica: formulario reactivo, llamada a auth.service, manejo de JWT
│       │       ├── login.html                    ← Template: formulario usuario/contraseña, mensajes de error
│       │       ├── login.scss                    ← Estilos del formulario de login
│       │       └── login.spec.ts                 ← Pruebas unitarias del componente login
│       │
│       ├── admin/                                ← Módulo del ADMINISTRADOR (ruta base: /admin)
│       │   ├── dashboard/                        ← Panel principal del administrador (ruta: /admin/dashboard)
│       │   │   ├── dashboard.ts                  ← Métricas globales: total solicitudes, por estado, por mes
│       │   │   ├── dashboard.html                ← Cards de KPIs, gráficos de estado
│       │   │   ├── dashboard.scss                ← Estilos del dashboard
│       │   │   └── dashboard.spec.ts             ← Pruebas unitarias
│       │   │
│       │   ├── solicitudes/                      ← Listado de todas las solicitudes (ruta: /admin/solicitudes)
│       │   │   ├── solicitudes.ts                ← Tabla con filtros por estado/fecha, paginación, búsqueda
│       │   │   ├── solicitudes.html              ← Tabla de solicitudes con acciones (ver, descargar PDF)
│       │   │   └── solicitudes.scss              ← Estilos de la tabla
│       │   │
│       │   ├── solicitud-detalle/                ← Vista detallada de una solicitud (ruta: /admin/solicitudes/:id)
│       │   │   ├── solicitud-detalle.ts          ← Detalle completo: datos, historial de estados, documentos
│       │   │   ├── solicitud-detalle.html        ← Secciones: info ciudadano, historial, documentos adjuntos
│       │   │   ├── solicitud-detalle.scss        ← Estilos del detalle
│       │   │   └── solicitud-detalle.spec.ts     ← Pruebas unitarias
│       │   │
│       │   ├── funcionarios/                     ← Gestión de funcionarios (ruta: /admin/funcionarios)
│       │   │   ├── funcionarios.ts               ← CRUD completo: crear, editar, activar/desactivar funcionarios
│       │   │   ├── funcionarios.html             ← Tabla de funcionarios con modal de creación/edición
│       │   │   └── funcionarios.scss             ← Estilos
│       │   │
│       │   ├── usuarios/                         ← Gestión de usuarios del sistema (ruta: /admin/usuarios)
│       │   │   ├── usuarios.ts                   ← Administración de cuentas, cambio de roles, reseteo de contraseñas
│       │   │   ├── usuarios.html                 ← Lista de usuarios con acciones de gestión
│       │   │   └── usuarios.scss                 ← Estilos
│       │   │
│       │   ├── reportes/                         ← Generación de reportes (ruta: /admin/reportes)
│       │   │   ├── reportes.ts                   ← Filtros por período/estado, exportación PDF y Excel
│       │   │   ├── reportes.html                 ← Formulario de filtros, botones de exportación
│       │   │   └── reportes.scss                 ← Estilos
│       │   │
│       │   └── auditoria/                        ← Log de auditoría (ruta: /admin/auditoria)
│       │       ├── auditoria.ts                  ← Tabla del log inmutable con filtros por usuario/fecha/acción
│       │       ├── auditoria.html                ← Tabla de eventos de auditoría paginada
│       │       └── auditoria.scss                ← Estilos
│       │
│       ├── tics/                                 ← Módulo del ANALISTA TICS (ruta base: /tics)
│       │   ├── dashboard/                        ← Solicitudes pendientes de validación (ruta: /tics/dashboard)
│       │   │   ├── dashboard.ts                  ← Lista solicitudes en estado EN_REVISION_TICS, acción validar/rechazar
│       │   │   ├── dashboard.html                ← Cards de solicitudes pendientes con botones de acción
│       │   │   ├── dashboard.scss                ← Estilos
│       │   │   └── dashboard.spec.ts             ← Pruebas unitarias
│       │   │
│       │   ├── historial/                        ← Solicitudes ya atendidas (ruta: /tics/historial)
│       │   │   ├── historial.ts                  ← Tabla de solicitudes validadas/rechazadas por el TICS
│       │   │   ├── historial.html                ← Lista con estado y fecha de acción
│       │   │   └── historial.scss                ← Estilos
│       │   │
│       │   └── reportes/                         ← Estadísticas del TICS (ruta: /tics/reportes)
│       │       ├── reportes.ts                   ← Reportes de solicitudes gestionadas por el analista TICS
│       │       ├── reportes.html                 ← Vista de reportes con exportación
│       │       └── reportes.scss                 ← Estilos
│       │
│       ├── jefe/                                 ← Módulo del JEFE INMEDIATO (ruta base: /jefe)
│       │   ├── dashboard/                        ← Solicitudes para revisión del jefe (ruta: /jefe/dashboard)
│       │   │   ├── dashboard.ts                  ← Solicitudes en EN_REVISION_JEFE, acción aprobar/rechazar
│       │   │   ├── dashboard.html                ← Cards de solicitudes con detalle y formulario de decisión
│       │   │   ├── dashboard.scss                ← Estilos
│       │   │   └── dashboard.spec.ts             ← Pruebas unitarias
│       │   │
│       │   ├── historial/                        ← Historial del jefe (ruta: /jefe/historial)
│       │   │   ├── historial.ts                  ← Solicitudes aprobadas/rechazadas por el jefe
│       │   │   ├── historial.html                ← Lista con estado y comentarios del jefe
│       │   │   └── historial.scss                ← Estilos
│       │   │
│       │   └── reportes/                         ← Reportes del jefe (ruta: /jefe/reportes)
│       │       ├── reportes.ts                   ← Reportes de solicitudes bajo responsabilidad del jefe
│       │       ├── reportes.html                 ← Vista de reportes
│       │       └── reportes.scss                 ← Estilos
│       │
│       ├── autoridad/                            ← Módulo de la MÁXIMA AUTORIDAD (ruta base: /autoridad)
│       │   ├── dashboard/                        ← Solicitudes para autorización final (ruta: /autoridad/dashboard)
│       │   │   ├── dashboard.ts                  ← Solicitudes en EN_REVISION_AUTORIDAD, decisión final
│       │   │   ├── dashboard.html                ← Vista ejecutiva con resumen de solicitud y botones de decisión
│       │   │   ├── dashboard.scss                ← Estilos
│       │   │   └── dashboard.spec.ts             ← Pruebas unitarias
│       │   │
│       │   ├── historial/                        ← Historial de la autoridad (ruta: /autoridad/historial)
│       │   │   ├── historial.ts                  ← Solicitudes autorizadas/negadas por la autoridad
│       │   │   ├── historial.html                ← Lista de decisiones tomadas
│       │   │   └── historial.scss                ← Estilos
│       │   │
│       │   └── reportes/                         ← Reportes ejecutivos (ruta: /autoridad/reportes)
│       │       ├── reportes.ts                   ← Reportes de nivel ejecutivo para la máxima autoridad
│       │       ├── reportes.html                 ← Vista de reportes ejecutivos con gráficos
│       │       └── reportes.scss                 ← Estilos
│       │
│       ├── public/                               ← Módulo PÚBLICO (sin autenticación)
│       │   ├── solicitud-publica/                ← Formulario ciudadano (ruta: /public/solicitud)
│       │   │   ├── solicitud-publica.ts          ← Formulario reactivo: nombre, cédula, email, descripción, archivos adjuntos
│       │   │   ├── solicitud-publica.html        ← Formulario multi-paso con validaciones en tiempo real
│       │   │   ├── solicitud-publica.scss        ← Estilos del formulario público
│       │   │   └── solicitud-publica.spec.ts     ← Pruebas unitarias
│       │   │
│       │   └── seguimiento-solicitud/            ← Rastreo ciudadano (ruta: /public/seguimiento)
│       │       ├── seguimiento-solicitud.ts      ← Consulta por código único, muestra historial de estados
│       │       ├── seguimiento-solicitud.html    ← Buscador + línea de tiempo del estado de la solicitud
│       │       ├── seguimiento-solicitud.scss    ← Estilos del rastreador
│       │       └── seguimiento-solicitud.spec.ts ← Pruebas unitarias
│       │
│       ├── pages/                                ← Páginas genéricas de la aplicación
│       │   ├── inicio/                           ← Página de bienvenida (ruta: /)
│       │   │   ├── inicio.ts                     ← Landing page con opciones: ingresar solicitud, seguimiento, login
│       │   │   ├── inicio.html                   ← Vista de inicio con logo INAMHI y accesos directos
│       │   │   ├── inicio.scss                   ← Estilos de la página de inicio
│       │   │   └── inicio.spec.ts                ← Pruebas unitarias
│       │   │
│       │   └── seleccionar-proceso/              ← Selector de proceso (ruta: /seleccionar-proceso)
│       │       ├── seleccionar-proceso.ts        ← Pantalla de selección entre los diferentes procesos disponibles
│       │       ├── seleccionar-proceso.html      ← Cards de selección de proceso para el ciudadano
│       │       ├── seleccionar-proceso.scss      ← Estilos
│       │       └── seleccionar-proceso.spec.ts   ← Pruebas unitarias
│       │
│       ├── services/                             ← Servicios Angular (capa de comunicación con la API)
│       │   ├── auth.service.ts                   ← Login, logout, almacenamiento JWT, obtener usuario actual, verificar sesión
│       │   ├── solicitud-publica.service.ts      ← HTTP calls para crear solicitud pública y consultar seguimiento
│       │   ├── solicitudes-admin.service.ts      ← HTTP calls para gestión administrativa de solicitudes (CRUD, PDF)
│       │   └── firma-electronica.service.ts      ← HTTP calls para preparar PDF, subir firmado, validar firma
│       │
│       ├── guards/                               ← Guardas de rutas Angular
│       │   ├── role-guard.ts                     ← Verifica JWT + rol antes de activar una ruta; redirige si no aplica
│       │   └── role-guard.spec.ts                ← Pruebas unitarias del guard
│       │
│       ├── interceptors/                         ← Interceptores HTTP de Angular
│       │   └── http-error.interceptor.ts         ← Adjunta Bearer token a todas las peticiones; captura 401/403 y redirige al login
│       │
│       └── shared/                               ← Componentes compartidos reutilizables
│           └── pdf-viewer/                       ← Componente visor de PDF embebido
│               ├── pdf-viewer.ts                 ← Renderiza PDF inline en el navegador (usa URL blob)
│               ├── pdf-viewer.html               ← Template con <iframe> o <embed> para mostrar PDF
│               └── pdf-viewer.scss               ← Estilos del visor
│
├── backend/                                      ← Código fuente del BACKEND (Flask/Python)
│   ├── app.py                                    ← Aplicación Flask principal: registra blueprints, configura CORS, headers de seguridad, middleware
│   ├── config.py                                 ← Carga centralizada de todas las variables de entorno desde .env
│   ├── wsgi.py                                   ← Punto de entrada WSGI para Gunicorn en producción
│   ├── gunicorn.conf.py                          ← Config de Gunicorn: workers, bind, timeout, logging
│   ├── requirements.txt                          ← Dependencias Python (37 librerías con versiones exactas)
│   ├── firma_electronica_tablas.sql              ← Script SQL: crea tablas firmas_digitales, auditoria_firmas, versiones_documento
│   ├── .env                                      ← Variables de entorno sensibles (BD, JWT, SMTP, CORS) — NO en git
│   │
│   ├── blueprints/                               ← Módulos de la API Flask (Blueprint pattern)
│   │   ├── __init__.py                           ← Inicializador del paquete Python
│   │   ├── auth_bp.py                            ← Endpoints de autenticación: /api/auth/login, logout, /me, cambiar-password
│   │   ├── public_bp.py                          ← Endpoints públicos: crear solicitud, seguimiento, preparar/subir firma ciudadano
│   │   ├── admin_solicitudes_bp.py               ← Endpoints admin: CRUD solicitudes, usuarios, funcionarios, reportes, auditoría
│   │   └── admin_firma_bp.py                     ← Endpoints de firma digital: preparar PDF, subir firmado, validar, estado
│   │
│   ├── utils/                                    ← Utilidades reutilizables del backend
│   │   ├── __init__.py                           ← Inicializador del paquete Python
│   │   ├── db.py                                 ← Conexión MySQL: pool de conexiones, función get_connection(), manejo de errores
│   │   ├── auth_utils.py                         ← Funciones JWT: generar/verificar token, decorador @require_role(), hash bcrypt
│   │   ├── audit.py                              ← Función registrar_auditoria(): escribe en auditoria_firmas, captura IP/timestamp
│   │   ├── helpers.py                            ← Validaciones generales: email, cédula ecuatoriana, sanitización de texto
│   │   ├── limiter.py                            ← Instancia Flask-Limiter configurada con límites por IP
│   │   ├── logger.py                             ← Configuración de logging: niveles, formato, rotación de logs
│   │   └── user_utils.py                         ← Funciones de usuarios: obtener usuario por ID, verificar existencia, activar/desactivar
│   │
│   ├── static/                                   ← Archivos estáticos servidos por Flask
│   │   └── img/                                  ← Imágenes usadas en la generación de PDFs
│   │       ├── logo_inamhi.png                   ← Logo oficial INAMHI para encabezado de PDFs
│   │       └── inamhi-logo-LETRA-AZUL.png        ← Versión alternativa del logo (fondo claro)
│   │
│   ├── uploads/                                  ← Almacenamiento de archivos subidos (excluido del git)
│   │   ├── documentos/                           ← Documentos originales adjuntados por ciudadanos al crear solicitud
│   │   ├── firmados/                             ← PDFs con firma digital PAdES aplicada por funcionarios
│   │   ├── escaneados/                           ← Documentos físicos escaneados subidos por funcionarios
│   │   └── temp_certs/                           ← Archivos de certificado temporales durante procesamiento de firma
│   │
│   └── logs/                                     ← Logs del sistema (excluido del git en producción)
│       └── app.log                               ← Log principal: errores, peticiones, operaciones críticas, firma digital
│
├── deploy/                                       ← Scripts y configuración de despliegue en producción
│   ├── deploy.sh                                 ← Script Bash: instalación automatizada completa en servidor Linux
│   │                                             ←   (nginx, python, venv, pip, ng build, systemd, permisos)
│   ├── build-and-upload.ps1                      ← Script PowerShell: compila frontend en Windows y lo sube al servidor via SCP/SSH
│   ├── nginx.conf                                ← Configuración Nginx: proxy /api/* a Flask, SPA fallback para Angular Router
│   ├── inamhi-backend.service                    ← Unidad systemd: define el servicio del backend (restart, usuario, WorkingDirectory)
│   ├── unique_constraints.sql                    ← SQL adicional: constraints únicos en BD para integridad referencial
│   └── .env.example                              ← Plantilla documentada de todas las variables de entorno requeridas
│
├── public/                                       ← Activos estáticos del frontend (copiados al build)
│   ├── favicon.ico                               ← Ícono de la pestaña del navegador
│   ├── logo_inamhi.png                           ← Logo INAMHI en PNG
│   ├── logo_inamhi.svg                           ← Logo INAMHI en SVG (escalable)
│   ├── inamhi-logo-LETRA-AZUL.png                ← Variante del logo con letras azules
│   └── estrella.png                              ← Asset gráfico adicional para la UI
│
├── dist/                                         ← [GENERADO] Build de producción Angular (ng build --configuration production)
│   └── ...                                       ← No se edita manualmente; se genera con npm run build
│
├── .angular/                                     ← [GENERADO] Cache interno de Angular CLI (no editar)
│   └── cache/                                    ← Caché de compilación incremental y dependencias Vite
│
├── node_modules/                                 ← [GENERADO] Dependencias Node.js instaladas con npm install
│
├── .vscode/                                      ← Configuración del editor VS Code (compartida con el equipo)
│   ├── settings.json                             ← Configuración del editor: formateo, extensiones recomendadas
│   ├── extensions.json                           ← Extensiones recomendadas para el proyecto (Angular, Python, etc.)
│   ├── launch.json                               ← Configuración de depuración (debug Angular + Flask)
│   ├── tasks.json                                ← Tareas automáticas de VS Code (compilar, ejecutar)
│   └── mcp.json                                  ← Configuración MCP para herramientas de IA en VS Code
│
├── .claude/                                      ← Configuración de Claude Code (asistente IA)
│   └── settings.local.json                       ← Permisos y configuración local de Claude Code
│
├── src/environments/                             ← Archivos de entorno Angular (ver dentro de src/)
│
├── package.json                                  ← Dependencias Node.js, scripts npm (start, build, test)
├── package-lock.json                             ← Lockfile de versiones exactas de dependencias npm
├── angular.json                                  ← Configuración Angular CLI: proyecto, build, serve, test, estilos globales
├── tsconfig.json                                 ← Configuración TypeScript base: strict mode, paths, target ES2022
├── tsconfig.app.json                             ← Configuración TypeScript para el build de la app
├── tsconfig.spec.json                            ← Configuración TypeScript para las pruebas unitarias
├── .editorconfig                                 ← Configuración de formato de código (indentación, charset, CRLF/LF)
├── .prettierrc                                   ← Configuración de Prettier: comillas simples, punto y coma, ancho de línea
├── .gitignore                                    ← Archivos excluidos del repositorio: .env, node_modules, dist, uploads, __pycache__
├── README.md                                     ← Documentación básica: instrucciones de instalación y comandos
├── INFORME_TECNICO.md                            ← Informe técnico detallado del sistema
└── PROMPT_INFORME_TECNICO.md                     ← Este archivo (prompt para IA)
```

---

## DESCRIPCIÓN DETALLADA POR CAPA

### CAPA FRONTEND — Convenciones de archivos Angular

Cada componente Angular sigue la convención de 3 archivos:
- `nombre.ts` → Lógica TypeScript (clase del componente, inyección de servicios, ciclo de vida)
- `nombre.html` → Template HTML con directivas Angular (*ngIf, *ngFor, [(ngModel)], (click), etc.)
- `nombre.scss` → Estilos SCSS específicos del componente (encapsulados)
- `nombre.spec.ts` → Pruebas unitarias con Vitest + jsdom (no todos los componentes tienen prueba)

### CAPA BACKEND — Organización Flask Blueprint

Cada Blueprint agrupa endpoints relacionados:
- `auth_bp.py` → Rutas de autenticación, sin protección de rol (login es público)
- `public_bp.py` → Rutas sin autenticación: solicitudes públicas y firma ciudadana
- `admin_solicitudes_bp.py` → Rutas protegidas por rol: admin, jefe, TICS, autoridad
- `admin_firma_bp.py` → Rutas de firma digital protegidas por rol específico

### CAPA UTILS — Reutilización del backend

- `db.py` → Toda la capa de datos pasa por aquí (patrón Repository simplificado)
- `auth_utils.py` → Único lugar donde se manipulan JWT y contraseñas
- `audit.py` → Garantiza que el log sea consistente desde cualquier blueprint
- `helpers.py` → Validaciones de dominio ecuatoriano (cédula de identidad, RUC, etc.)

---

## TECNOLOGÍAS UTILIZADAS

### Frontend

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

### Backend

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
| python-dotenv | 1.2.2 | Carga de variables de entorno desde .env |
| lxml | 6.1.1 | Procesamiento XML/HTML |
| requests | 2.34.2 | Cliente HTTP para servicios externos |

### Infraestructura

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Nginx | Estable | Proxy inverso y servidor de archivos estáticos |
| MySQL | 8.0+ | Motor de base de datos relacional |
| systemd | — | Gestión del servicio backend en Linux |
| Linux (Ubuntu/Debian) | — | Sistema operativo del servidor |

---

## MÓDULOS FUNCIONALES

### Módulo Público (sin autenticación)
- Formulario de solicitud de información para ciudadanos
- Seguimiento del estado de solicitud por código único
- Descarga de documentos de respuesta entregados

### Módulo de Autenticación
- Login con JWT, redirección según rol
- Interceptor HTTP automático en Angular (http-error.interceptor.ts)
- Cierre de sesión seguro

### Módulo Administrador (/admin/*)
- Dashboard con métricas globales
- Gestión completa de todas las solicitudes
- Gestión de usuarios y funcionarios (CRUD)
- Reportes en PDF y Excel
- Log completo de auditoría con filtros

### Módulo Analista TICS (/tics/*)
- Validación técnica de documentos de cada solicitud
- Historial de solicitudes atendidas
- Reportes de gestión propios

### Módulo Jefe Inmediato (/jefe/*)
- Revisión y aprobación de solicitudes previamente validadas por TICS
- Historial y reportes

### Módulo Máxima Autoridad (/autoridad/*)
- Decisión final de autorización o negación
- Historial y reportes ejecutivos

---

## ROLES Y CONTROL DE ACCESO (RBAC)

| Rol | ID en sistema | Descripción |
|-----|---------------|-------------|
| Administrador | administrador | Acceso total: usuarios, solicitudes, reportes, auditoría |
| Analista TICS | analista_tics | Validación técnica, primera revisión de documentos |
| Jefe Inmediato | jefe_inmediato | Aprobación intermedia del contenido |
| Máxima Autoridad | maxima_autoridad | Decisión final: autorizar o negar |
| Ciudadano | (público) | Sin autenticación — acceso solo a secciones públicas |

- **En Angular:** `role-guard.ts` intercepta navegación y verifica JWT + claim de rol
- **En Flask:** decorador `@require_role()` en `auth_utils.py` protege cada endpoint

---

## FLUJO DE TRABAJO (ESTADOS DE SOLICITUD)

```
[Ciudadano envía]
       ↓
   RECIBIDA
       ↓ [Analista TICS revisa]
EN_REVISION_TICS ──→ RECHAZADA_TICS (con motivo)
       ↓ [TICS valida]
EN_REVISION_JEFE ──→ RECHAZADA_JEFE (con motivo)
       ↓ [Jefe aprueba]
EN_REVISION_AUTORIDAD ──→ NEGADA_AUTORIDAD (con motivo)
       ↓ [Autoridad autoriza]
EN_FIRMA_DIGITAL
       ↓ [Funcionario firma y sube PDF]
    FIRMADA
       ↓ [Sistema notifica al ciudadano]
   ENTREGADA
```

Notificaciones por email al ciudadano en: RECIBIDA, cambios de estado, ENTREGADA.

---

## BASE DE DATOS — TABLAS CLAVE

### firmas_digitales
Registro de cada firma electrónica aplicada a un documento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK AUTO | Identificador único |
| solicitud_codigo | VARCHAR | Código de la solicitud asociada |
| version_documento | INT | Versión del documento firmado |
| certificado_info | TEXT JSON | CN, serie del certificado, emisor, validez |
| hash_documento_antes | VARCHAR(64) | Hash SHA-256 antes de firmar |
| hash_documento_despues | VARCHAR(64) | Hash SHA-256 después de firmar |
| algoritmo_hash | VARCHAR | SHA-256 |
| timestamp_firma | DATETIME | Fecha y hora exacta de la firma |
| ip_cliente | VARCHAR | IP del firmante |
| estado_validacion | ENUM | valida / invalida / pendiente |
| ruta_archivo_firmado | VARCHAR | Ruta física del PDF firmado |

### auditoria_firmas (LOG INMUTABLE)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK AUTO | Identificador único |
| accion | VARCHAR | FIRMA_APLICADA, VALIDACION, RECHAZO, etc. |
| solicitud_codigo | VARCHAR | Solicitud afectada |
| usuario_id | INT | Quién realizó la acción |
| detalles | TEXT JSON | Información adicional de la operación |
| ip_origen | VARCHAR | IP desde donde se realizó |
| timestamp | DATETIME | Cuándo ocurrió |

### versiones_documento (NUNCA SOBREESCRIBE)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK AUTO | Identificador único |
| solicitud_codigo | VARCHAR | Código de solicitud |
| numero_version | INT | Versión incremental (1, 2, 3...) |
| tipo_documento | ENUM | original / firmado / corregido |
| ruta_archivo | VARCHAR | Ruta física del archivo |
| hash_sha256 | VARCHAR(64) | Hash de integridad |
| creado_por | INT | ID del usuario creador |
| fecha_creacion | DATETIME | Timestamp de creación |
| activo | BOOLEAN | Si esta versión es la vigente |

Otras tablas: usuarios, solicitudes, documentos, estados_solicitud, notificaciones, roles

---

## API REST — ENDPOINTS PRINCIPALES

### Públicos (sin autenticación)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/public/solicitudes | Crear nueva solicitud de información |
| GET | /api/public/solicitudes/seguimiento/<codigo> | Consultar estado |
| GET | /api/public/solicitudes/<codigo>/documentos | Obtener documentos de respuesta |
| POST | /api/public/electronico/preparar | Preparar documento para firma |
| POST | /api/public/electronico/<codigo>/subir-firmado | Subir PDF firmado |

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Iniciar sesión, retorna JWT |
| POST | /api/auth/logout | Cerrar sesión |
| GET | /api/auth/me | Perfil del usuario autenticado |
| POST | /api/auth/cambiar-password | Cambiar contraseña |

### Administrativos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/admin/solicitudes | Listar con filtros |
| GET | /api/admin/solicitudes/<id> | Detalle |
| GET | /api/admin/solicitudes/<id>/pdf | Descargar PDF |
| GET | /api/admin/usuarios | Listar usuarios |
| POST | /api/admin/usuarios | Crear usuario |
| PUT | /api/admin/usuarios/<id> | Actualizar |
| DELETE | /api/admin/usuarios/<id> | Desactivar |
| GET | /api/admin/reportes | Generar reporte |
| GET | /api/admin/auditoria | Consultar log |

### Por Rol
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/tics/solicitudes | Pendientes TICS |
| POST | /api/tics/solicitudes/<id>/validar | Validar/rechazar |
| GET | /api/jefe/solicitudes | Pendientes jefe |
| POST | /api/jefe/solicitudes/<id>/aprobar | Aprobar/rechazar |
| GET | /api/autoridad/solicitudes | Pendientes autoridad |
| POST | /api/autoridad/solicitudes/<id>/autorizar | Autorizar/denegar |

### Firma Digital
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/admin/firma/preparar/<codigo> | Preparar PDF para firma |
| POST | /api/admin/firma/subir/<codigo> | Subir PDF firmado |
| GET | /api/admin/firma/validar/<codigo> | Validar firma criptográfica |
| GET | /api/admin/firma/estado/<codigo> | Estado actual de la firma |

---

## SEGURIDAD

### JWT (PyJWT 2.12.1)
- Algoritmo: HS256 (HMAC-SHA256)
- Clave: 64 caracteres hexadecimales en .env
- Expiración: 8 horas
- Claims: sub (user ID), rol, exp, iat
- Header en peticiones: `Authorization: Bearer <token>`

### Contraseñas — bcrypt
- bcrypt.hashpw() con bcrypt.gensalt()
- 12 rondas de trabajo
- Nunca se almacena contraseña en texto plano

### CORS
- Flask-CORS con lista blanca de orígenes en CORS_ORIGINS
- Solo los orígenes configurados pueden hacer peticiones

### Rate Limiting — Flask-Limiter
- Límites por IP
- Protección reforzada en /api/auth/login
- Respuesta 429 Too Many Requests al superar límite

### Headers HTTP de Seguridad
| Header | Valor | Propósito |
|--------|-------|---------|
| X-Frame-Options | DENY | Previene clickjacking |
| X-Content-Type-Options | nosniff | Previene MIME sniffing |
| X-XSS-Protection | 1; mode=block | Protección XSS |
| Strict-Transport-Security | max-age=31536000 | Fuerza HTTPS |
| Content-Security-Policy | configurado | Previene inyección |

---

## FIRMA DIGITAL — pyHanko (PAdES)

PAdES = PDF Advanced Electronic Signatures (ETSI EN 319 102)
Compatible con Ley de Comercio Electrónico, Firmas y Mensajes de Datos — Ecuador.

### Flujo completo:
```
1. Backend genera PDF con ReportLab (datos solicitud + QR + logo INAMHI)
2. Backend retorna PDF listo para firmar al frontend
3. Funcionario descarga PDF y aplica su certificado digital personal (token USB)
4. Funcionario sube PDF firmado al sistema
5. Backend valida con pyHanko:
   - Cadena X.509 del certificado
   - Vigencia del certificado al momento de la firma
   - Hash SHA-256 antes y después de la firma
   - Que el documento no fue alterado post-firma
6. Resultado guardado en firmas_digitales y auditoria_firmas
7. PDF almacenado en uploads/firmados/ con nueva versión en versiones_documento
```

### Datos del certificado almacenados:
- CN (Common Name): nombre del firmante
- Número de serie del certificado
- Emisor (CA)
- Fecha inicio y fin de validez
- Estado: valida / invalida / pendiente

---

## VARIABLES DE ENTORNO (backend/.env)

### Base de datos
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| DB_HOST | Servidor MySQL | localhost |
| DB_PORT | Puerto | 3306 |
| DB_USER | Usuario BD | inamhi_user |
| DB_PASSWORD | Contraseña BD | [segura] |
| DB_NAME | Nombre BD | inamhi_liberacion_web |

### Seguridad
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| JWT_SECRET_KEY | Clave firma JWT | [64 chars hex] |
| JWT_EXPIRATION_HOURS | Duración sesión | 8 |

### Servidor
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| APP_URL | URL pública backend | http://10.0.153.69:5050 |
| BACKEND_HOST | IP de escucha | 0.0.0.0 |
| BACKEND_PORT | Puerto Flask | 5050 |
| CORS_ORIGINS | Orígenes permitidos | http://10.0.153.69 |

### Email SMTP
| Variable | Descripción |
|----------|-------------|
| SMTP_HOST | Servidor correo saliente |
| SMTP_PORT | Puerto SMTP (25/465/587) |
| SMTP_USER | Cuenta de envío |
| SMTP_PASSWORD | Contraseña cuenta |
| SMTP_FROM | Remitente visible |

### PDF
| Variable | Descripción |
|----------|-------------|
| LOGO_PDF | Nombre del archivo de logo para documentos |

---

## DESPLIEGUE E INFRAESTRUCTURA

### Servidor de producción
- IP: 10.0.153.69
- Puerto público: 80
- Puerto Flask interno: 5050
- Puerto MySQL: 3306 (solo local)
- SO: Linux Ubuntu/Debian
- Servidor web: Nginx (proxy inverso)
- WSGI: Gunicorn
- Proceso: systemd (restart automático)

### Configuración Nginx
```
GET /api/* → proxy_pass http://127.0.0.1:5050   (Flask)
GET /*      → root /var/www/inamhi/frontend      (Angular SPA)
try_files $uri $uri/ /index.html                 (SPA routing)
```

### Scripts de despliegue
| Script | Plataforma | Propósito |
|--------|-----------|---------|
| deploy/deploy.sh | Linux Bash | Instalación completa automatizada |
| deploy/build-and-upload.ps1 | Windows PowerShell | Build frontend y upload al servidor |

### Proceso de instalación (deploy.sh)
1. Instalar nginx, python3, libmysqlclient-dev, build-essential
2. Crear entorno virtual Python
3. pip install -r requirements.txt
4. ng build --configuration production
5. Copiar dist/ a /var/www/inamhi/frontend
6. Configurar nginx.conf
7. Configurar y habilitar servicio systemd
8. Iniciar servicios

---

## INSTRUCCIONES PARA EL INFORME

Genera un informe técnico formal con las siguientes características:

**FORMATO:**
- Portada con nombre del sistema, institución, fecha, versión, autor
- Tabla de contenidos numerada
- Secciones y subsecciones numeradas (1., 1.1, 1.1.1)
- Tablas para todos los datos comparativos y listados
- Diagramas ASCII de arquitectura y flujos
- Lenguaje técnico formal en español
- Tono institucional — redacción en tercera persona

**SECCIONES OBLIGATORIAS (mínimo 10 páginas):**
1. Introducción y antecedentes institucionales
2. Marco legal (LOTAIP, Ley de Comercio Electrónico Ecuador)
3. Objetivo general y objetivos específicos
4. Alcance del sistema (dentro y fuera del alcance)
5. Arquitectura del sistema (diagrama ASCII + descripción de cada componente)
6. Estructura del proyecto (árbol de directorios con descripción de CADA carpeta y archivo)
7. Módulos funcionales — uno por subsección con pantallas que tiene
8. Tecnologías utilizadas — tablas con versión y justificación técnica de cada elección
9. Modelo de base de datos — tablas con campos y descripción
10. API REST documentada — tabla de todos los endpoints por categoría
11. Seguridad del sistema — subsección por mecanismo (JWT, bcrypt, CORS, rate limiting, headers)
12. Firma digital PAdES — descripción técnica completa del proceso paso a paso
13. Control de acceso y roles (RBAC) — tabla de roles y permisos
14. Auditoría e integridad documental — principios y operaciones auditadas
15. Flujo de trabajo completo — diagrama de estados y descripción de cada transición
16. Generación de documentos PDF y reportes
17. Despliegue e infraestructura — servidor, nginx, systemd
18. Variables de configuración — tablas completas
19. Consideraciones y recomendaciones técnicas (HTTPS, backups, escalabilidad)
20. Conclusiones
21. Anexo A: Árbol completo de directorios con descripción
22. Anexo B: Tabla de dependencias completa

**ESTILO:**
- Cada sección inicia con un párrafo introductorio explicativo
- Usa tablas donde corresponda, no listas de puntos simples
- Menciona el marco legal ecuatoriano (LOTAIP) en contexto
- Destaca pyHanko/PAdES como diferenciador técnico del sistema
- La sección de estructura del proyecto debe describir cada carpeta y su propósito
- Incluye recomendaciones: HTTPS/TLS, backups automáticos MySQL, rotación de logs, token revocation
- Extensión mínima equivalente a 10-12 páginas A4
