# PROMPT COMPLETO — INFORME TÉCNICO INAMHI
# Copia TODO este contenido y pégalo en cualquier IA

---

Eres un redactor técnico especializado en sistemas de información institucionales.
Genera un INFORME TÉCNICO COMPLETO, PROFESIONAL Y FORMAL en español, equivalente
a mínimo 12 páginas A4, sobre el siguiente sistema de software. Usa tablas,
secciones numeradas, diagramas ASCII y lenguaje técnico formal en tercera persona.

---

## 1. DATOS DEL SISTEMA

- **Nombre:** Sistema de Gestión de Solicitudes de Liberación de Información
- **Institución:** Instituto Nacional de Meteorología e Hidrología del Ecuador (INAMHI)
- **Tipo:** Aplicación web institucional full-stack
- **Fecha:** junio 2026 | **Versión:** 1.0 mejorada
- **Clasificación:** Uso interno institucional

---

## 2. PROPÓSITO

Digitaliza y automatiza el proceso de recepción, revisión, aprobación y entrega
de documentos en respuesta a solicitudes ciudadanas de acceso a la información
pública, en cumplimiento de la **LOTAIP** (Ley Orgánica de Transparencia y
Acceso a la Información Pública del Ecuador) y la Ley de Comercio Electrónico,
Firmas y Mensajes de Datos.

---

## 3. ARQUITECTURA

Arquitectura de 3 capas desacopladas en un servidor Linux único:

```
INTERNET / RED INTERNA
         │ HTTP :80
    ┌────▼─────┐
    │  NGINX   │  Proxy inverso — 10.0.153.76
    └──┬────┬──┘
       │    │
  ┌────▼─┐ ┌▼──────────────┐
  │Angular│ │  Flask API    │
  │ SPA  │ │  :5050/api/*  │
  │/dist │ │  Gunicorn WSGI│
  └──────┘ └──────┬────────┘
                  │ TCP 3306
           ┌──────▼────────┐
           │   MySQL 8.0+  │
           │inamhi_liberac │
           │  ion_web      │
           └───────────────┘
```

**Reglas de Nginx:**
- `GET /api/*` → `proxy_pass http://127.0.0.1:5050` (Flask backend)
- `GET /uploads/*` → archivos subidos, servidos directamente por Nginx
- `GET /static/*` → archivos estáticos backend (logos PDF)
- `GET /*` → `root /var/www/inamhi/frontend` + `try_files $uri /index.html` (SPA Angular)
- Headers de seguridad: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`
- Compresión gzip activada para JS, CSS, JSON
- `client_max_body_size 20M` (archivos PDF grandes)
- `proxy_read_timeout 120s` (firma digital tarda en procesarse)

---

## 4. ESTRUCTURA COMPLETA DEL PROYECTO — ARCHIVO POR ARCHIVO

A continuación se documenta CADA carpeta y CADA archivo del repositorio con su
propósito exacto, basado en el código real.

```
liberacion-inamhi-ip-version-mejorada-/
│
│  ARCHIVOS RAÍZ
│  ─────────────────────────────────────────────────────────────
├── package.json              Scripts npm: start, build, test. Dependencias Node.js del frontend.
├── package-lock.json         Lockfile exacto de versiones npm (no editar manualmente).
├── angular.json              Configuración Angular CLI: nombre del proyecto
│                             "sistema-liberacion-web", directorio de salida dist/,
│                             estilos globales src/styles.scss, activos de public/.
├── tsconfig.json             TypeScript base: target ES2022, strict:true, moduleResolution bundler.
├── tsconfig.app.json         TypeScript para build de la app (extiende tsconfig.json).
├── tsconfig.spec.json        TypeScript para pruebas unitarias con Vitest.
├── .editorconfig             Convenciones de formato: UTF-8, LF, indentación 2 espacios.
├── .prettierrc               Prettier: comillas simples, punto y coma true, ancho 100 chars.
├── .gitignore                Excluye: .env, node_modules/, dist/, uploads/, __pycache__/,
│                             backend/logs/, *.pyc, .angular/cache/.
├── README.md                 Instrucciones básicas de instalación Angular y comandos npm.
├── INFORME_TECNICO.md        Informe técnico detallado del sistema (este documento).
│
│  FRONTEND — Angular 21.2 SPA
│  ─────────────────────────────────────────────────────────────
├── public/                   Activos estáticos copiados al raíz del build de producción.
│   ├── favicon.ico           Ícono de pestaña del navegador (logo INAMHI pequeño).
│   ├── logo_inamhi.png       Logo INAMHI en formato PNG (usado en la UI).
│   ├── logo_inamhi.svg       Logo INAMHI vectorial SVG (escalable sin pérdida de calidad).
│   ├── inamhi-logo-LETRA-AZUL.png  Variante del logo con tipografía azul.
│   └── estrella.png          Asset gráfico decorativo para la UI de inicio.
│
└── src/                      Código fuente Angular completo.
    ├── index.html            HTML raíz: <app-root> donde Angular monta la SPA.
    │                         Incluye meta charset, viewport y referencia a favicon.
    ├── main.ts               Punto de entrada: llama bootstrapApplication(App, appConfig).
    │                         Arranca la aplicación Angular standalone sin NgModule.
    ├── styles.scss           Estilos globales: importa Bootstrap 5.3.8 y Bootstrap Icons.
    │                         Define variables CSS globales y reset de estilos.
    │
    ├── environments/         Configuración por entorno (development / production).
    │   ├── environment.ts    DEV: { production: false, apiUrl: 'http://localhost:5050/api' }
    │   └── environment.prod.ts  PROD: { production: true, apiUrl: 'http://10.0.153.76/api' }
    │                         Angular CLI sustituye automáticamente el archivo según el build.
    │
    └── app/                  Módulo raíz de la aplicación Angular (standalone).
        │
        ├── app.ts            AppComponent: componente raíz minimal, solo contiene <router-outlet>.
        ├── app.html          Template: <router-outlet> — renderiza el componente de la ruta activa.
        ├── app.scss          Estilos mínimos del componente raíz (height: 100%).
        ├── app.spec.ts       Prueba unitaria: verifica que AppComponent se crea correctamente.
        │
        ├── app.config.ts     Configuración global de la aplicación Angular:
        │                       - provideBrowserGlobalErrorListeners()
        │                       - provideZoneChangeDetection({ eventCoalescing: true })
        │                       - provideRouter(routes)
        │                       - provideHttpClient(withInterceptors([httpErrorInterceptor]))
        │                     El interceptor httpErrorInterceptor se registra aquí para
        │                     todas las peticiones HTTP de la app.
        │
        ├── app.routes.ts     Define TODAS las rutas de la aplicación (30 rutas totales):
        │                     PÚBLICAS (sin guard):
        │                       ''                     → Inicio (landing page)
        │                       'auth/login'           → Login
        │                       'seleccionar-proceso'  → Selector de proceso
        │                       'public/solicitud'     → Formulario solicitud ciudadana
        │                       'public/seguimiento'   → Rastreo por código
        │                     ADMIN (guard: roles=['administrador']):
        │                       'admin/dashboard'
        │                       'admin/solicitudes'
        │                       'admin/solicitudes/:id'
        │                       'admin/solicitud-detalle/:id'
        │                       'admin/usuarios'
        │                       'admin/funcionarios'
        │                       'admin/reportes'
        │                       'admin/auditoria'
        │                     JEFE INMEDIATO (guard: roles=['jefe_inmediato']):
        │                       'jefe/dashboard'
        │                       'jefe/historial'
        │                       'jefe/reportes'
        │                       'jefe/solicitud-detalle/:id'
        │                       'jefe/solicitudes/:id'
        │                     MÁXIMA AUTORIDAD (guard: roles=['maxima_autoridad']):
        │                       'autoridad/dashboard'
        │                       'autoridad/historial'
        │                       'autoridad/reportes'
        │                       'autoridad/solicitud-detalle/:id'
        │                       'autoridad/solicitudes/:id'
        │                     ANALISTA TICS (guard: roles=['analista_tics']):
        │                       'tics/dashboard'
        │                       'tics/historial'
        │                       'tics/reportes'
        │                       'tics/solicitud-detalle/:id'
        │                       'tics/solicitudes/:id'
        │                     CATCH-ALL: '**' → redirectTo: '' (página de inicio)
        │
        ├── guards/           Guardas de navegación Angular.
        │   ├── role-guard.ts   Función roleGuard (CanActivateFn):
        │   │                   1. Llama authService.isAuthenticated() — verifica JWT en localStorage
        │   │                      y que no esté expirado. Si no autenticado → navega a /auth/login.
        │   │                   2. Lee route.data['roles'] (array de roles permitidos).
        │   │                   3. Llama authService.tieneRol(rolesPermitidos) → compara rol del JWT.
        │   │                   4. Si rol no coincide → navega al dashboard del rol actual
        │   │                      (authService.getRutaDashboardPorRol()).
        │   └── role-guard.spec.ts  Pruebas unitarias del guard.
        │
        ├── interceptors/     Interceptores HTTP de Angular.
        │   └── http-error.interceptor.ts  httpErrorInterceptor (HttpInterceptorFn):
        │                     Captura errores HTTP y actúa según código:
        │                       401 → auth.logout() + navega a /auth/login
        │                       403 → navega a /auth/login
        │                       429 → console.warn (rate limiting)
        │                       0   → console.error (sin conexión)
        │                       5xx → console.error con status y mensaje
        │                     IMPORTANTE: no adjunta el token (eso lo hace cada servicio
        │                     con getHeaders() para evitar enviar token a dominios externos).
        │
        ├── services/         Capa de comunicación con la API REST del backend.
        │   │
        │   ├── auth.service.ts          AuthService — maneja toda la sesión de usuario:
        │   │                            CONSTANTES DE STORAGE:
        │   │                              TOKEN_KEY  = 'auth_token_liberacion_web'
        │   │                              USUARIO_KEY = 'usuario_liberacion_web'
        │   │                              ROL_KEY    = 'rol_liberacion_web'
        │   │                            INTERFACES: LoginRequest, UsuarioLogin (id, nombres,
        │   │                              apellidos, cedula, correo, usuario, cargo,
        │   │                              area_unidad, dependencia, telefono_ext, rol),
        │   │                              LoginResponse (estado, mensaje, token, usuario)
        │   │                            MÉTODOS:
        │   │                              login(credentials) → POST /api/auth/login
        │   │                                guarda token, usuario y rol en localStorage
        │   │                              logout() → elimina las 3 claves de localStorage
        │   │                              getToken() → string | null
        │   │                              getUsuario() → UsuarioLogin | null (parsea JSON)
        │   │                              getRol() → string | null
        │   │                              isTokenExpired() → decodifica JWT base64, verifica exp
        │   │                              isAuthenticated() → token + usuario + rol + no expirado
        │   │                              isAdmin(), isJefeInmediato(), isMaximaAutoridad(), isTics()
        │   │                              tieneRol(rolesPermitidos[]) → boolean
        │   │                              getRutaDashboardPorRol() → '/admin/dashboard' |
        │   │                                '/jefe/dashboard' | '/autoridad/dashboard' |
        │   │                                '/tics/dashboard' | '/auth/login'
        │   │                              getNombreRol() → nombre legible del rol
        │   │
        │   ├── solicitud-publica.service.ts  SolicitudPublicaService — endpoints públicos:
        │   │                            INTERFACES:
        │   │                              SolicitudPublicaRequest: nombres_completos, cedula,
        │   │                                correo_institucional, telefono_ext, dependencia,
        │   │                                area_unidad, cargo, fecha_solicitud,
        │   │                                tipo_usuario ('funcionario_inamhi'|'externo'),
        │   │                                nombre_usuario_externo, direccion_ip,
        │   │                                tiempo_vigencia_acceso,
        │   │                                justificacion_necesidad_institucional,
        │   │                                paginas_web (PaginaWebSolicitud[])
        │   │                              SolicitudPublicaResponse: estado, mensaje, solicitud
        │   │                                (id, codigo_solicitud, estado, etapa_actual,
        │   │                                nombres_completos, correo_institucional)
        │   │                              SeguimientoResponse: estado, solicitud completo,
        │   │                                paginas_web[]
        │   │                            MÉTODOS:
        │   │                              registrarSolicitud(data) → POST /api/public/solicitudes
        │   │                              consultarSeguimiento(codigo) →
        │   │                                GET /api/public/solicitudes/seguimiento/{codigo}
        │   │
        │   ├── solicitudes-admin.service.ts  SolicitudesAdminService — gestión administrativa:
        │   │                            INTERFACES clave:
        │   │                              SolicitudAdmin: id, codigo_solicitud, nombres_completos,
        │   │                                cedula, correo_institucional, telefono_ext,
        │   │                                dependencia, area_unidad, cargo, fecha_solicitud,
        │   │                                tipo_usuario, nombre_usuario_externo, direccion_ip,
        │   │                                tiempo_vigencia_acceso, justificacion, estado,
        │   │                                etapa_actual, bloqueada, total_paginas,
        │   │                                documento_actual_id, requiere_firma, firma_actual_validada
        │   │                              DocumentoSolicitud: id, solicitud_id, etapa, rol_firmante,
        │   │                                usuario_id, tipo_documento, nombre_archivo, ruta_archivo,
        │   │                                mime_type, firmado, firma_validada, observacion
        │   │                              FlujoSolicitudResponse: estado, mensaje, correo_enviado,
        │   │                                error_correo, solicitud (estado_anterior, estado_actual,
        │   │                                etapa_actual, motivo, documento_firmado)
        │   │                            MÉTODOS (todos con Bearer token en header):
        │   │                              listarSolicitudes(estado, q) →
        │   │                                GET /api/admin/solicitudes?estado=&q=
        │   │                              listarMisSolicitudes(q, estado) →
        │   │                                GET /api/mis-solicitudes?q=&estado=
        │   │                              obtenerSolicitudPorId(id) →
        │   │                                GET /api/admin/solicitudes/{id}
        │   │                              aprobarSolicitud(id) →
        │   │                                PUT /api/admin/solicitudes/{id}/aprobar
        │   │                              rechazarSolicitud(id, motivo) →
        │   │                                PUT /api/admin/solicitudes/{id}/rechazar
        │   │                              descargarPdfSolicitud(id) →
        │   │                                GET /api/admin/solicitudes/{id}/pdf → Blob
        │   │                              descargarDocumentoFirmadoActual(id) →
        │   │                                GET /api/admin/solicitudes/{id}/documento-actual → Blob
        │   │                              subirPdfFirmadoElectronico(solicitudId, archivo) →
        │   │                                POST /api/admin/solicitudes/{id}/documentos
        │   │                                Content-Type: application/octet-stream
        │   │                              subirDocumentoFirmado(solicitudId, archivo, tipo, obs) →
        │   │                                POST /api/admin/solicitudes/{id}/documentos
        │   │                              subirImagenFirmaAutomatica(solicitudId, imagenFirma) →
        │   │                                POST /api/admin/solicitudes/{id}/firma-electronica
        │   │                                FormData con campo 'firma' (PNG/JPG)
        │   │                              listarSolicitudesManuales(estado, q) →
        │   │                                GET /api/admin/manuales?estado=&q=
        │   │                              descargarDocumentoManualFirmado(uuid) →
        │   │                                GET /api/admin/manuales/{uuid}/descargar-firmado → Blob
        │   │                              descargarBlob(blob, nombreArchivo, mimeType) →
        │   │                                crea URL blob, crea <a> temporal y hace click() para
        │   │                                disparar descarga en el navegador
        │   │
        │   └── firma-electronica.service.ts  FirmaElectronicaService — proceso de firma digital:
        │                            INTERFACES:
        │                              InformacionCertificado: subject_cn, subject_o, issuer_cn,
        │                                numero_serie, fecha_emision, fecha_expiracion,
        │                                vigente, dias_restantes
        │                              FirmaDigitalResultado: id, modo ('pyhanko'|'firmaec'),
        │                                nombre_pdf, hash_sha256, validacion,
        │                                certificado (subject_cn, issuer_cn, numero_serie, vigente)
        │                              FirmaRegistrada: id, rol_firmante, etapa, modo_firma,
        │                                subject_cn, issuer_cn, numero_serie, nombre_pdf_firmado,
        │                                hash_sha256_despues, firma_valida, resultado_validacion,
        │                                observacion, created_at, nombres, apellidos
        │                              VersionDocumento: id, version, etapa, rol_firmante,
        │                                tipo, nombre_archivo, hash_sha256, tamano_bytes,
        │                                es_version_actual, created_at
        │                              VerificacionPublicaResponse: solicitud (codigo, solicitante,
        │                                estado, etapa, fecha_registro), firmantes[], total_firmas,
        │                                version_actual, url_verificacion
        │                            MÉTODOS:
        │                              validarCertificado(solicitudId, certificado, password) →
        │                                POST /api/admin/solicitudes/{id}/validar-certificado
        │                                FormData: certificado (.p12/.pfx), password
        │                              firmarConPyhanko(solicitudId, certificado, password, obs) →
        │                                POST /api/admin/solicitudes/{id}/firmar-pyhanko
        │                                FormData: certificado, password, observacion
        │                                El backend firma criptográficamente el PDF con pyHanko
        │                              obtenerHistorialFirmas(solicitudId) →
        │                                GET /api/admin/solicitudes/{id}/firmas
        │                                Retorna firmas[] y versiones[] de la solicitud
        │                              verificarDocumentoPublico(codigo) →
        │                                GET /api/public/verificar/{codigo} (sin token)
        │                              descargarVersion(solicitudId, versionId) →
        │                                GET /api/admin/solicitudes/{id}/versiones/{vid}/descargar → Blob
        │
        ├── shared/           Componentes Angular reutilizables en múltiples módulos.
        │   └── pdf-viewer/   Visor de PDF embebido (componente standalone).
        │       ├── pdf-viewer.ts    Renderiza un PDF dentro de la página usando <iframe>
        │       │                    o <embed> con una URL blob generada desde el archivo.
        │       ├── pdf-viewer.html  Template con el elemento de visualización embebida.
        │       └── pdf-viewer.scss  Estilos: ancho 100%, altura configurable, borde.
        │
        ├── pages/            Páginas genéricas no asociadas a un rol específico.
        │   ├── inicio/       Landing page del sistema (ruta: '').
        │   │   ├── inicio.ts    Muestra opciones: ingresar solicitud, seguimiento, login.
        │   │   ├── inicio.html  Cards con accesos directos, logo INAMHI, descripción.
        │   │   ├── inicio.scss  Estilos de la página de bienvenida.
        │   │   └── inicio.spec.ts  Prueba unitaria.
        │   └── seleccionar-proceso/  Pantalla de selección de proceso (ruta: 'seleccionar-proceso').
        │       ├── seleccionar-proceso.ts    Muestra los procesos disponibles al ciudadano.
        │       ├── seleccionar-proceso.html  Cards de selección de proceso.
        │       ├── seleccionar-proceso.scss  Estilos.
        │       └── seleccionar-proceso.spec.ts  Prueba unitaria.
        │
        ├── auth/             Módulo de autenticación.
        │   └── login/        Componente de login (ruta: 'auth/login').
        │       ├── login.ts     Formulario reactivo de login. Llama AuthService.login().
        │       │                Si respuesta ok: navega al dashboard según rol del JWT.
        │       │                Maneja errores 401 (credenciales inválidas).
        │       ├── login.html   Formulario con campos usuario y contraseña, botón submit,
        │       │                mensaje de error, logo INAMHI.
        │       ├── login.scss   Estilos del formulario centrado en pantalla.
        │       └── login.spec.ts  Prueba unitaria.
        │
        ├── public/           Módulo de acceso público (sin autenticación requerida).
        │   ├── solicitud-publica/   Formulario ciudadano (ruta: 'public/solicitud').
        │   │   ├── solicitud-publica.ts   Formulario reactivo con campos:
        │   │   │                          nombres_completos, cedula, correo_institucional,
        │   │   │                          telefono_ext, dependencia, area_unidad, cargo,
        │   │   │                          fecha_solicitud, tipo_usuario (funcionario/externo),
        │   │   │                          nombre_usuario_externo, direccion_ip,
        │   │   │                          tiempo_vigencia_acceso,
        │   │   │                          justificacion_necesidad_institucional,
        │   │   │                          paginas_web[] (URL + descripción).
        │   │   │                          Llama SolicitudPublicaService.registrarSolicitud().
        │   │   │                          Al éxito: muestra código de seguimiento generado.
        │   │   ├── solicitud-publica.html  Formulario multi-campo con validaciones en tiempo real.
        │   │   ├── solicitud-publica.scss  Estilos del formulario público.
        │   │   └── solicitud-publica.spec.ts  Prueba unitaria.
        │   │
        │   └── seguimiento-solicitud/  Rastreo ciudadano (ruta: 'public/seguimiento').
        │       ├── seguimiento-solicitud.ts   Campo de entrada para código de solicitud.
        │       │                              Llama SolicitudPublicaService.consultarSeguimiento().
        │       │                              Muestra: datos del solicitante, estado actual,
        │       │                              historial de etapas como línea de tiempo.
        │       ├── seguimiento-solicitud.html  Buscador + línea de tiempo visual de estados.
        │       ├── seguimiento-solicitud.scss  Estilos del rastreador.
        │       └── seguimiento-solicitud.spec.ts  Prueba unitaria.
        │
        ├── admin/            Módulo del ADMINISTRADOR (todas las rutas requieren rol 'administrador').
        │   ├── dashboard/    Panel principal del administrador (ruta: 'admin/dashboard').
        │   │   ├── dashboard.ts     Carga métricas globales: total solicitudes, por estado,
        │   │   │                    tendencias. Usa SolicitudesAdminService.listarSolicitudes().
        │   │   ├── dashboard.html   Cards de KPIs con conteos y gráficos de barras.
        │   │   ├── dashboard.scss   Estilos del dashboard.
        │   │   └── dashboard.spec.ts  Prueba unitaria.
        │   │
        │   ├── solicitudes/  Listado completo de solicitudes (ruta: 'admin/solicitudes').
        │   │   ├── solicitudes.ts    Tabla con filtros por estado y búsqueda por texto (q=).
        │   │   │                     Paginación. Acciones: ver detalle, descargar PDF.
        │   │   │                     Usa SolicitudesAdminService.listarSolicitudes().
        │   │   ├── solicitudes.html  Tabla con columnas: código, solicitante, estado, fecha, acciones.
        │   │   └── solicitudes.scss  Estilos de la tabla.
        │   │
        │   ├── solicitud-detalle/  Vista detallada de solicitud (ruta: 'admin/solicitudes/:id').
        │   │   ├── solicitud-detalle.ts   Carga todos los datos de la solicitud (id del param).
        │   │   │                          Muestra datos del ciudadano, páginas web solicitadas,
        │   │   │                          documentos adjuntos, historial de estados.
        │   │   │                          Botones de acción según estado: aprobar, rechazar,
        │   │   │                          subir PDF firmado, descargar PDF, validar certificado.
        │   │   │                          Usa SolicitudesAdminService y FirmaElectronicaService.
        │   │   ├── solicitud-detalle.html  Layout en secciones: info, documentos, firma, historial.
        │   │   ├── solicitud-detalle.scss  Estilos del detalle.
        │   │   └── solicitud-detalle.spec.ts  Prueba unitaria.
        │   │                          NOTA: Este componente es compartido por los módulos jefe/,
        │   │                          autoridad/ y tics/ — cada uno accede con su propio prefijo
        │   │                          de ruta (jefe/solicitudes/:id, etc.).
        │   │
        │   ├── funcionarios/  Gestión de funcionarios (ruta: 'admin/funcionarios').
        │   │   ├── funcionarios.ts    CRUD de cuentas de funcionarios: crear, editar,
        │   │   │                      activar/desactivar. Asignación de roles.
        │   │   ├── funcionarios.html  Tabla de funcionarios con modal de creación/edición.
        │   │   └── funcionarios.scss  Estilos.
        │   │
        │   ├── usuarios/     Gestión de cuentas del sistema (ruta: 'admin/usuarios').
        │   │   ├── usuarios.ts    Administración de usuarios: crear, editar, desactivar.
        │   │   │                  Reseteo de contraseñas. Visualización de último acceso.
        │   │   ├── usuarios.html  Lista de usuarios con roles y estado (activo/inactivo).
        │   │   └── usuarios.scss  Estilos.
        │   │
        │   ├── reportes/     Generación de reportes (ruta: 'admin/reportes').
        │   │   ├── reportes.ts    Filtros: período (fecha inicio/fin), estado, tipo.
        │   │   │                  Exportación a PDF (jsPDF + AutoTable) y Excel (XLSX).
        │   │   ├── reportes.html  Formulario de filtros, tabla de resultados, botones de exportación.
        │   │   └── reportes.scss  Estilos.
        │   │
        │   └── auditoria/    Log de auditoría (ruta: 'admin/auditoria').
        │       ├── auditoria.ts    Tabla del log inmutable con filtros: usuario, fecha, módulo, acción.
        │       │                   Muestra: quién, qué acción, en qué módulo, desde qué IP, cuándo.
        │       ├── auditoria.html  Tabla paginada del log con columnas de auditoría.
        │       └── auditoria.scss  Estilos.
        │
        ├── jefe/             Módulo del JEFE INMEDIATO (rol: 'jefe_inmediato').
        │   ├── dashboard/    Solicitudes pendientes de revisión del jefe (ruta: 'jefe/dashboard').
        │   │   ├── dashboard.ts    Lista solicitudes en estado EN_REVISION_JEFE.
        │   │   │                   Acciones: aprobar (llama aprobarSolicitud()), rechazar con motivo.
        │   │   │                   Puede ver detalle navegando a jefe/solicitudes/:id.
        │   │   ├── dashboard.html  Cards o tabla de solicitudes pendientes.
        │   │   ├── dashboard.scss  Estilos.
        │   │   └── dashboard.spec.ts  Prueba unitaria.
        │   ├── historial/    Solicitudes ya atendidas por el jefe (ruta: 'jefe/historial').
        │   │   ├── historial.ts    Lista de solicitudes aprobadas/rechazadas por el jefe.
        │   │   ├── historial.html  Tabla con estado final y fecha de decisión.
        │   │   └── historial.scss  Estilos.
        │   └── reportes/     Estadísticas del jefe (ruta: 'jefe/reportes').
        │       ├── reportes.ts    Reportes de solicitudes gestionadas por el jefe inmediato.
        │       ├── reportes.html  Vista de reportes con exportación.
        │       └── reportes.scss  Estilos.
        │
        ├── autoridad/        Módulo de la MÁXIMA AUTORIDAD (rol: 'maxima_autoridad').
        │   ├── dashboard/    Solicitudes para decisión final (ruta: 'autoridad/dashboard').
        │   │   ├── dashboard.ts    Lista solicitudes EN_REVISION_AUTORIDAD.
        │   │   │                   Autorizar (aprobarSolicitud) o negar con motivo.
        │   │   ├── dashboard.html  Vista ejecutiva con resumen de cada solicitud.
        │   │   ├── dashboard.scss  Estilos.
        │   │   └── dashboard.spec.ts  Prueba unitaria.
        │   ├── historial/    Historial de la autoridad (ruta: 'autoridad/historial').
        │   │   ├── historial.ts    Decisiones tomadas por la autoridad.
        │   │   ├── historial.html  Lista de solicitudes autorizadas/negadas.
        │   │   └── historial.scss  Estilos.
        │   └── reportes/     Reportes ejecutivos (ruta: 'autoridad/reportes').
        │       ├── reportes.ts    Reportes de nivel ejecutivo.
        │       ├── reportes.html  Vista de reportes ejecutivos.
        │       └── reportes.scss  Estilos.
        │
        └── tics/             Módulo del ANALISTA TICS (rol: 'analista_tics').
            ├── dashboard/    Solicitudes pendientes de validación técnica (ruta: 'tics/dashboard').
            │   ├── dashboard.ts    Lista solicitudes EN_REVISION_TICS.
            │   │                   Validar (aprobarValidacionTics) o rechazar técnicamente.
            │   │                   También gestiona carga de certificado y firma digital.
            │   ├── dashboard.html  Cards de solicitudes con botones de acción técnica.
            │   ├── dashboard.scss  Estilos.
            │   └── dashboard.spec.ts  Prueba unitaria.
            ├── historial/    Historial del analista TICS (ruta: 'tics/historial').
            │   ├── historial.ts    Solicitudes validadas/rechazadas por el TICS.
            │   ├── historial.html  Tabla de historial.
            │   └── historial.scss  Estilos.
            └── reportes/     Estadísticas del TICS (ruta: 'tics/reportes').
                ├── reportes.ts    Reportes de solicitudes gestionadas técnicamente.
                ├── reportes.html  Vista de reportes.
                └── reportes.scss  Estilos.

BACKEND — Flask 3.1 Python
─────────────────────────────────────────────────────────────────

backend/
│
├── app.py                    Aplicación Flask principal (archivo más grande del proyecto).
│                             IMPORTACIONES: Flask, fitz (PyMuPDF), ReportLab (SimpleDocTemplate,
│                               Paragraph, Table, Image, Spacer, TableStyle), mysql.connector,
│                               jwt, bcrypt, CORS, pyHanko (signers, fields, IncrementalPdfFileWriter,
│                               PdfFileReader, validate_pdf_signature, QRStampStyle), qrcode.
│                             INICIALIZACIÓN:
│                               - Crea app Flask
│                               - Configura Flask-CORS con CORS_ORIGINS
│                               - Registra blueprints: auth_bp, public_bp, admin_solicitudes_bp,
│                                 admin_firma_bp
│                               - Configura limiter (Flask-Limiter)
│                               - Inicializa pool de conexiones DB (init_db)
│                               - Agrega headers de seguridad a todas las respuestas
│                             FUNCIONES INTERNAS (no en blueprints):
│                               - Generación de PDFs con ReportLab: encabezado INAMHI,
│                                 tablas de datos, código QR de verificación
│                               - Envío de emails SMTP (smtplib nativo)
│                               - Lógica de firma digital con pyHanko
│
├── config.py                 Carga centralizada de configuración desde .env con python-dotenv.
│                             VARIABLES EXPORTADAS:
│                               BASE_DIR: directorio base del backend
│                               DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
│                               DB_POOL_SIZE (default 10 conexiones)
│                               JWT_SECRET_KEY: valida que no sea vacío ni el valor por defecto
│                                 inseguro — si es inseguro emite warnings.warn() y genera uno
│                                 aleatorio con secrets.token_hex(64)
│                               JWT_EXPIRATION_HOURS (default 8)
│                               BACKEND_HOST (default 127.0.0.1), BACKEND_PORT (default 5050)
│                               APP_URL (URL pública del backend)
│                               SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
│                               UPLOAD_FOLDER, DOCUMENTOS_FOLDER, FIRMADOS_FOLDER,
│                                 ESCANEADOS_FOLDER, TEMP_CERTS_FOLDER
│                               LOGO_INAMHI_PATH: ruta al logo PNG para PDFs
│                               CORS_ORIGINS: lista de orígenes permitidos (split por coma)
│
├── wsgi.py                   Punto de entrada WSGI para Gunicorn:
│                               from app import app
│                               if __name__ == '__main__': app.run()
│                             Gunicorn importa wsgi:app al arrancar.
│
├── gunicorn.conf.py          Configuración de Gunicorn para producción:
│                               bind = '127.0.0.1:5050' (solo local, Nginx hace proxy)
│                               workers = cpu_count() * 2 + 1 (fórmula estándar)
│                               worker_class = 'sync'
│                               threads = 2 por worker
│                               timeout = 120s (firma digital requiere tiempo)
│                               keepalive = 5s
│                               accesslog = 'logs/access.log'
│                               errorlog = 'logs/error.log'
│                               loglevel = 'info'
│                               capture_output = True
│                               preload_app = True (carga la app una vez, workers hacen fork)
│
├── requirements.txt          37 dependencias Python con versiones exactas. Incluye:
│                             Flask 3.1.3, Gunicorn 23.0.0, Flask-CORS 6.0.2,
│                             Flask-Limiter 4.1.1, mysql-connector-python 9.7.0,
│                             PyJWT 2.12.1, bcrypt 5.0.0, pyHanko 0.35.1,
│                             PyMuPDF 1.26.7, reportlab 4.5.0, cryptography 48.0.0,
│                             qrcode 8.2, Pillow 12.2.0, python-dotenv 1.2.2,
│                             lxml 6.1.1, requests 2.34.2
│
├── firma_electronica_tablas.sql  Script SQL: crea 3 tablas del módulo de firma digital.
│                             (Ver sección de Base de Datos para detalle completo.)
│
├── .env                      Variables de entorno sensibles — EXCLUIDO DEL GIT.
│                             (Ver sección de Variables de Entorno para detalle.)
│
├── blueprints/               Módulos de la API Flask separados por responsabilidad.
│   ├── __init__.py           Inicializador Python vacío (hace de blueprints un paquete).
│   │
│   ├── auth_bp.py            Blueprint de autenticación — prefijo /api/auth:
│   │                           POST /api/auth/login:
│   │                             Recibe {usuario, password}. Llama user_utils.obtener_usuario_por_username().
│   │                             Si existe: verifica password con auth_utils.verificar_password() (bcrypt).
│   │                             Si ok: llama user_utils.actualizar_ultimo_acceso().
│   │                             Genera JWT con auth_utils.generar_token() (HS256, expira en 8h,
│   │                             claims: id, usuario, correo, rol, exp).
│   │                             Registra auditoría de login.
│   │                             Responde {estado, mensaje, token, usuario}.
│   │                           GET /api/auth/me (token_requerido):
│   │                             Retorna datos del usuario del payload del JWT.
│   │                           POST /api/auth/logout (token_requerido):
│   │                             Registra auditoría de logout. (JWT es stateless, no hay
│   │                             invalidación servidor — el cliente elimina el token.)
│   │
│   ├── public_bp.py          Blueprint de rutas públicas — prefijo /api/public:
│   │                           POST /api/public/solicitudes:
│   │                             Recibe datos del ciudadano. Valida: nombres (solo letras/espacios),
│   │                             cedula (10 dígitos), correo (formato válido), fecha (YYYY-MM-DD),
│   │                             URL de páginas web (esquema http/https + netloc).
│   │                             Genera codigo_solicitud UUID único.
│   │                             Inserta en BD. Envía email de confirmación al ciudadano.
│   │                             Responde con codigo_solicitud para seguimiento.
│   │                           GET /api/public/solicitudes/seguimiento/{codigo}:
│   │                             Busca solicitud por codigo_solicitud.
│   │                             Retorna datos completos + paginas_web[] asociadas.
│   │                           GET /api/public/verificar/{codigo}:
│   │                             Verificación pública de autenticidad de documento.
│   │                             Retorna firmantes[], version_actual, url_verificacion.
│   │
│   ├── admin_solicitudes_bp.py  Blueprint administrativo — prefijo /api/admin:
│   │                           Todos los endpoints requieren @token_requerido.
│   │                           Los de rol específico también requieren @roles_permitidos().
│   │                           GESTIÓN DE SOLICITUDES:
│   │                           GET /api/admin/solicitudes (administrador):
│   │                             Lista todas las solicitudes. Filtros opcionales: estado=, q= (búsqueda).
│   │                           GET /api/admin/solicitudes/{id}:
│   │                             Detalle completo: datos solicitud + paginas_web[] + documentos[].
│   │                           GET /api/admin/solicitudes/{id}/pdf:
│   │                             Genera PDF con ReportLab: encabezado INAMHI, tabla de datos,
│   │                             páginas web solicitadas, código QR de verificación.
│   │                             Retorna archivo PDF como blob.
│   │                           PUT /api/admin/solicitudes/{id}/aprobar:
│   │                             Avanza el estado según el rol del firmante:
│   │                               analista_tics: RECIBIDA → EN_REVISION_JEFE
│   │                               jefe_inmediato: EN_REVISION_JEFE → EN_REVISION_AUTORIDAD
│   │                               maxima_autoridad: EN_REVISION_AUTORIDAD → EN_FIRMA_DIGITAL
│   │                             Registra auditoría. Envía email al ciudadano notificando avance.
│   │                           PUT /api/admin/solicitudes/{id}/rechazar:
│   │                             Recibe {motivo}. Cambia estado a RECHAZADA_{ROL}.
│   │                             Registra auditoría. Envía email al ciudadano con motivo.
│   │                           POST /api/admin/solicitudes/{id}/documentos:
│   │                             Recibe archivo binario (Content-Type: application/octet-stream).
│   │                             Params query: tipo_documento, nombre_archivo, observacion.
│   │                             Guarda en uploads/documentos/ o uploads/firmados/ según tipo.
│   │                             Calcula hash SHA-256 del archivo. Registra en BD.
│   │                           GET /api/admin/solicitudes/{id}/documento-actual:
│   │                             Retorna el último documento firmado como blob para descarga.
│   │                           GET /api/admin/solicitudes/{id}/firmas:
│   │                             Historial completo de firmas y versiones de una solicitud.
│   │                           GET /api/admin/solicitudes/{id}/versiones/{vid}/descargar:
│   │                             Descarga una versión específica del documento.
│   │                           POST /api/admin/solicitudes/{id}/firma-electronica:
│   │                             Recibe imagen PNG/JPG de firma. Backend inserta la imagen
│   │                             visualmente dentro del PDF usando PyMuPDF.
│   │                           GESTIÓN DE USUARIOS (administrador):
│   │                           GET /api/admin/usuarios: Lista todos los usuarios.
│   │                           POST /api/admin/usuarios: Crea usuario con hash bcrypt de contraseña.
│   │                           PUT /api/admin/usuarios/{id}: Actualiza datos de usuario.
│   │                           DELETE /api/admin/usuarios/{id}: Desactiva usuario (no elimina).
│   │                           GET /api/admin/auditoria: Log de auditoría con filtros.
│   │                           GET /api/admin/reportes: Genera reporte por período y estado.
│   │                           RUTAS DE ROL ESPECÍFICO:
│   │                           GET /api/mis-solicitudes (cualquier rol autenticado):
│   │                             Solicitudes asignadas al rol del usuario actual.
│   │
│   └── admin_firma_bp.py     Blueprint de firma digital — prefijo /api/admin:
│                               POST /api/admin/solicitudes/{id}/validar-certificado:
│                                 Recibe FormData: certificado (.p12/.pfx), password.
│                                 Carga el PKCS12 con cryptography.hazmat.
│                                 Extrae y retorna info del certificado: subject_cn, subject_o,
│                                 issuer_cn, numero_serie, fecha_emision, fecha_expiracion,
│                                 vigente (bool), dias_restantes.
│                               POST /api/admin/solicitudes/{id}/firmar-pyhanko:
│                                 Recibe FormData: certificado (.p12/.pfx), password, observacion.
│                                 Flujo completo de firma digital:
│                                   1. Carga el PKCS12 (clave privada + cadena de certificados)
│                                   2. Obtiene el PDF actual de la solicitud
│                                   3. Calcula hash SHA-256 antes de firmar
│                                   4. Crea SimpleSigner de pyHanko con la clave del certificado
│                                   5. Aplica firma PAdES con IncrementalPdfFileWriter
│                                   6. Calcula hash SHA-256 después de firmar
│                                   7. Guarda PDF firmado en uploads/firmados/
│                                   8. Registra en firmas_digitales y auditoria_firmas
│                                   9. Crea nueva versión en versiones_documento
│                                   10. Si es autoridad: avanza estado a FIRMADA
│
├── utils/                    Utilidades reutilizables del backend.
│   ├── __init__.py           Inicializador Python vacío.
│   │
│   ├── db.py                 Gestión de conexiones MySQL con pool:
│   │                           _pool: MySQLConnectionPool | None (singleton)
│   │                           _init_pool(): crea pool con parámetros de config.py
│   │                             pool_name='inamhi_pool', pool_size=DB_POOL_SIZE,
│   │                             charset='utf8mb4', collation='utf8mb4_unicode_ci',
│   │                             autocommit=False
│   │                           get_db_connection(): obtiene conexión del pool.
│   │                             Si pool es None lo inicializa. Si falla: loguea error,
│   │                             resetea _pool a None, retorna None.
│   │                           init_db(app): inicializa el pool al arrancar Flask,
│   │                             verifica conectividad, loguea resultado.
│   │
│   ├── auth_utils.py         Funciones de seguridad JWT y contraseñas:
│   │                           crear_hash_password(password) → bcrypt.hashpw con gensalt()
│   │                           verificar_password(plano, hash) → bcrypt.checkpw con try/except
│   │                           generar_token(usuario_dict) → JWT HS256 con claims:
│   │                             id, usuario, correo, rol, exp (utcnow + EXPIRATION_HOURS)
│   │                           decodificar_token(token) → dict | None
│   │                             Captura ExpiredSignatureError e InvalidTokenError → None
│   │                           token_requerido (decorador):
│   │                             - Permite OPTIONS sin token (preflight CORS)
│   │                             - Valida header Authorization: Bearer {token}
│   │                             - Decodifica token, guarda payload en request.usuario_actual
│   │                             - Retorna 401 si falta o es inválido
│   │                           roles_permitidos(*roles) (decorador de fábrica):
│   │                             - Lee request.usuario_actual (puesto por token_requerido)
│   │                             - Verifica que usuario_actual['rol'] esté en roles
│   │                             - Retorna 403 con rol_actual y roles_permitidos si no aplica
│   │
│   ├── audit.py              Registro de auditoría en BD:
│   │                           registrar_auditoria(usuario_id, solicitud_id, modulo,
│   │                             accion, descripcion, datos_anteriores, datos_nuevos):
│   │                             INSERT INTO auditoria (usuario_id, solicitud_id, modulo,
│   │                               accion, descripcion, datos_anteriores, datos_nuevos, ip_origen)
│   │                             datos_anteriores y datos_nuevos se serializan como JSON.
│   │                             ip_origen obtenida de helpers.obtener_ip_cliente().
│   │                             Usa get_db_connection(), cierra cursor y conexión en finally.
│   │
│   ├── helpers.py            Validaciones de dominio y utilidades:
│   │                           limpiar_texto(valor) → str.strip() con manejo de None
│   │                           normalizar_espacios(texto) → re.sub(r'\s+', ' ', ...)
│   │                           validar_solo_letras_espacios(texto) → regex [a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]
│   │                           validar_correo_general(correo) → regex [^@\s]+@[^@\s]+\.[^@\s]+
│   │                           validar_cedula_formato(cedula) → regex ^\d{10}$
│   │                           validar_telefono_10_digitos(tel) → regex ^\d{10}$
│   │                           validar_ipv4(ip) → ipaddress.IPv4Address() try/except
│   │                           validar_url(url) → urlparse: scheme in (http,https) + netloc
│   │                           validar_fecha(fecha) → strptime(fecha, '%Y-%m-%d') try/except
│   │                           convertir_fecha(fecha) → datetime.date
│   │                           obtener_ip_cliente() → X-Forwarded-For (primer IP) o remote_addr
│   │                           validar_ruta_segura(ruta, carpeta_base) → previene path traversal
│   │                             con os.path.abspath; retorna ruta absoluta o None si insegura
│   │
│   ├── limiter.py            Instancia Flask-Limiter:
│   │                           limiter = Limiter(key_func=get_remote_address,
│   │                             default_limits=[], storage_uri='memory://')
│   │                           Limitación por IP del cliente.
│   │                           Se usa en blueprints con @limiter.limit('X per minute').
│   │
│   ├── logger.py             Configuración del logger 'inamhi':
│   │                           Nivel: DEBUG (captura todo)
│   │                           Formato: "YYYY-MM-DD HH:MM:SS [LEVEL] name — mensaje"
│   │                           Handlers:
│   │                             StreamHandler (consola): nivel INFO
│   │                             RotatingFileHandler (archivo): nivel DEBUG,
│   │                               maxBytes=5MB, backupCount=3, encoding=utf-8
│   │                               Archivo: backend/logs/app.log
│   │
│   └── user_utils.py         Funciones de acceso a usuarios en BD:
│                               SQL_BASE: JOIN usuarios + roles para obtener nombre del rol
│                               obtener_usuario_por_username(username):
│                                 SELECT con WHERE u.usuario = %s LIMIT 1
│                                 Retorna dict con todos los campos del usuario + rol nombre
│                               obtener_usuario_por_id(usuario_id):
│                                 SELECT con campos adicionales: ultimo_acceso, created_at, updated_at
│                               actualizar_ultimo_acceso(usuario_id):
│                                 UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = %s
│                               Todos usan get_db_connection(), cursor(dictionary=True),
│                               cierre en finally.
│
├── static/                   Archivos estáticos servidos por Flask y Nginx.
│   └── img/
│       ├── logo_inamhi.png              Logo principal usado en encabezado de PDFs generados.
│       └── inamhi-logo-LETRA-AZUL.png  Versión alternativa del logo (fondo claro).
│
├── uploads/                  Almacenamiento de archivos subidos por usuarios.
│   ├── documentos/           Documentos originales adjuntados por ciudadanos al crear solicitud.
│   ├── firmados/             PDFs con firma digital PAdES aplicada por funcionarios con pyHanko.
│   ├── escaneados/           Documentos físicos escaneados subidos por funcionarios al sistema.
│   └── temp_certs/           Archivos .p12/.pfx temporales durante procesamiento de firma digital.
│                             Se eliminan después del proceso para no acumular certificados.
│
└── logs/
    └── app.log               Log principal del sistema. Rotación automática: 5MB × 3 backups.
                              Contiene: errores de BD, peticiones HTTP, operaciones de firma,
                              validaciones fallidas, inicialización de pools.

DESPLIEGUE
─────────────────────────────────────────────────────────────────

deploy/
├── deploy.sh                 Script Bash de instalación completa en Linux:
│                               1. apt-get: nginx, python3, python3-venv, python3-pip,
│                                  libmysqlclient-dev, build-essential
│                               2. Crea /var/www/inamhi/{frontend,backend,venv}
│                               3. Copia archivos del backend
│                               4. python3 -m venv venv && pip install -r requirements.txt
│                               5. ng build --configuration production
│                               6. Copia dist/ a /var/www/inamhi/frontend/
│                               7. Copia nginx.conf a /etc/nginx/sites-available/inamhi
│                               8. ln -s para habilitar el sitio en Nginx
│                               9. Copia inamhi-backend.service a /etc/systemd/system/
│                               10. systemctl enable --now inamhi-backend nginx
│
├── build-and-upload.ps1      Script PowerShell para desarrolladores Windows:
│                               Compila el frontend (ng build --configuration production)
│                               Sube el dist/ al servidor Linux vía SCP/SSH.
│
├── nginx.conf                Configuración Nginx de producción:
│                               server_name 10.0.153.76; listen 80;
│                               root /var/www/inamhi/frontend;
│                               location / → try_files (SPA fallback a index.html)
│                               location /api/ → proxy_pass :5050, timeout 120s, max 20MB
│                               location /uploads/ → alias al directorio de uploads backend
│                               location /static/ → alias al directorio static backend
│                               Headers: X-Frame-Options SAMEORIGIN, nosniff, XSS-Protection
│                               gzip on para text/css, JS, JSON, XML
│
├── inamhi-backend.service    Unidad systemd para el backend Flask:
│                               Description: INAMHI Liberación Web — Backend Flask
│                               After: network.target mysql.service
│                               Wants: mysql.service (espera a que MySQL esté listo)
│                               Type: notify
│                               User/Group: www-data (sin privilegios root)
│                               WorkingDirectory: /var/www/inamhi/backend
│                               EnvironmentFile: /var/www/inamhi/backend/.env
│                               ExecStart: gunicorn --config gunicorn.conf.py wsgi:app
│                               ExecReload: kill -s HUP (recarga sin downtime)
│                               Restart: on-failure, RestartSec: 5s
│                               PrivateTmp: true (aislamiento de /tmp)
│
├── unique_constraints.sql    SQL adicional: ALTER TABLE para agregar constraints UNIQUE
│                             en campos clave (como codigo_solicitud) para garantizar
│                             integridad referencial y evitar duplicados.
│
└── .env.example              Plantilla documentada de todas las variables de entorno.
                              Cada variable tiene comentario explicativo.
                              Sirve de guía para configurar el .env real en producción.

ARCHIVOS DE CONFIGURACIÓN DEL ENTORNO DE DESARROLLO
─────────────────────────────────────────────────────────────────

.vscode/
├── settings.json             Configuración VS Code del proyecto: formateo automático,
│                             extensiones asociadas a tipos de archivo.
├── extensions.json           Extensiones recomendadas: Angular Language Service,
│                             Python, Pylance, ESLint, Prettier.
├── launch.json               Configuración de debug: Angular (ng serve) y Flask (python app.py).
├── tasks.json                Tareas: compilar Angular, iniciar backend.
└── mcp.json                  Configuración MCP para herramientas de IA en VS Code.

.angular/cache/               Cache interno de Angular CLI (Vite + TypeScript incremental).
                              Se regenera automáticamente — no se edita ni versiona.
```

---

## 5. TECNOLOGÍAS UTILIZADAS

### Frontend

| Tecnología | Versión | Justificación técnica |
|-----------|---------|----------------------|
| Angular | 21.2.0 | Framework SPA con arquitectura standalone (sin NgModules), tipado fuerte con TypeScript |
| TypeScript | 5.9.2 | Strict mode: detecta errores en tiempo de compilación, mejora mantenibilidad |
| SCSS | — | Preprocesador CSS: variables, anidamiento, mixins para consistencia visual |
| Bootstrap | 5.3.8 | Framework CSS responsivo estable, amplia documentación institucional |
| Bootstrap Icons | 1.13.1 | Íconos vectoriales coherentes con Bootstrap sin dependencias externas |
| RxJS | 7.8.0 | Programación reactiva: manejo de peticiones HTTP asíncronas con observables |
| jsPDF + AutoTable | 4.2.1 + 5.0.7 | Generación de reportes PDF directamente en el navegador sin servidor |
| XLSX | 0.18.5 | Exportación de reportes a Excel (.xlsx) sin servidor |
| FileSaver.js | 2.0.5 | API de descarga de archivos blob compatible con todos los navegadores |
| SweetAlert2 | 11.26.24 | Modales de confirmación y alerta con UX profesional |
| Vitest + jsdom | 4.0.8 + 28.0.0 | Pruebas unitarias rápidas con DOM virtual |

### Backend

| Tecnología | Versión | Justificación técnica |
|-----------|---------|----------------------|
| Python 3 | 3.x | Ecosistema robusto para procesamiento de PDFs y criptografía |
| Flask | 3.1.3 | Framework minimalista REST API, fácil de modularizar con Blueprints |
| Gunicorn | 23.0.0 | WSGI estándar de producción, soporte multi-worker, integración systemd |
| Flask-CORS | 6.0.2 | Control granular de CORS para SPA Angular en dominio separado |
| Flask-Limiter | 4.1.1 | Rate limiting por IP para proteger endpoints críticos |
| mysql-connector-python | 9.7.0 | Conector oficial MySQL con soporte de pool de conexiones nativo |
| PyJWT | 2.12.1 | Implementación estándar JWT para autenticación stateless |
| bcrypt | 5.0.0 | Hash de contraseñas con salt adaptativo, resistente a ataques de fuerza bruta |
| pyHanko | 0.35.1 | Única librería Python con soporte completo PAdES y validación de cadena X.509 |
| PyMuPDF (fitz) | 1.26.7 | Lectura y manipulación de PDFs existentes, inserción de imágenes de firma |
| ReportLab | 4.5.0 | Generación programática de PDFs con control total del layout |
| cryptography | 48.0.0 | Carga de certificados PKCS12 (.p12/.pfx), extracción de metadatos X.509 |
| qrcode | 8.2 | Generación de QR de verificación embebido en PDFs |
| Pillow | 12.2.0 | Procesamiento de imágenes de firma para inserción en PDFs |
| python-dotenv | 1.2.2 | Carga de .env sin modificar variables de entorno del sistema |
| lxml | 6.1.1 | Procesamiento XML/HTML para generación de contenido estructurado |
| requests | 2.34.2 | Cliente HTTP para consumo de servicios externos si se requiere |

### Infraestructura

| Tecnología | Uso |
|-----------|-----|
| Nginx | Proxy inverso, servidor de archivos estáticos, compresión gzip, headers de seguridad |
| MySQL 8.0+ | BD relacional con InnoDB (transacciones ACID), charset utf8mb4 |
| systemd | Gestión del proceso backend: restart automático, arranque con el sistema |
| Linux (Ubuntu/Debian) | SO del servidor de producción |

---

## 6. BASE DE DATOS

### Base de datos: `inamhi_liberacion_web`
Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci

### Tabla: `firmas_digitales`
Registro de cada firma criptográfica aplicada a un PDF.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT PK | Identificador único |
| solicitud_id | INT NOT NULL | Referencia a la solicitud |
| documento_id | INT NULL | Documento firmado asociado |
| usuario_id | INT NULL | Funcionario que realizó la firma |
| rol_firmante | VARCHAR(50) | Rol del firmante (analista_tics, jefe_inmediato, maxima_autoridad) |
| etapa | VARCHAR(50) | Etapa del flujo en que se firmó |
| modo_firma | ENUM('pyhanko','firmaec') | Modo de firma usado |
| subject_cn | VARCHAR(255) | Nombre común del titular del certificado |
| subject_o | VARCHAR(255) | Organización del titular |
| issuer_cn | VARCHAR(255) | Nombre de la entidad certificadora |
| numero_serie | VARCHAR(255) | Número de serie único del certificado |
| fecha_emision | DATE | Inicio de vigencia del certificado |
| fecha_expiracion | DATE | Fin de vigencia del certificado |
| nombre_pdf_entrada | VARCHAR(255) | Nombre del PDF antes de firmar |
| nombre_pdf_firmado | VARCHAR(255) | Nombre del PDF después de firmar |
| ruta_pdf_firmado | VARCHAR(512) | Ruta física del PDF firmado en el servidor |
| hash_sha256_antes | VARCHAR(64) | Hash SHA-256 del PDF original |
| hash_sha256_despues | VARCHAR(64) | Hash SHA-256 del PDF firmado |
| firma_valida | TINYINT(1) | 1=firma válida, 0=inválida |
| resultado_validacion | TEXT | Texto del resultado de validación pyHanko |
| observacion | VARCHAR(1000) | Nota del firmante (opcional) |
| ip_cliente | VARCHAR(45) | IP desde donde se realizó la firma |
| created_at | DATETIME DEFAULT NOW | Timestamp de creación |
| updated_at | DATETIME ON UPDATE NOW | Timestamp de última modificación |

Índices: solicitud_id, usuario_id, etapa, modo_firma

### Tabla: `auditoria_firmas` — LOG INMUTABLE
Registro completo e inmodificable de cada operación de firma.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT PK | Identificador único |
| solicitud_id | INT NOT NULL | Solicitud afectada |
| firma_id | INT NULL | Firma asociada (si aplica) |
| usuario_id | INT NULL | Usuario que realizó la operación |
| rol | VARCHAR(50) | Rol del usuario en el momento |
| ip_cliente | VARCHAR(45) | IP de origen |
| accion | VARCHAR(100) | Tipo de acción (FIRMA_APLICADA, VALIDACION, RECHAZO, etc.) |
| subject_cn | VARCHAR(255) | Nombre del titular del certificado usado |
| numero_serie | VARCHAR(255) | Serie del certificado usado |
| issuer_cn | VARCHAR(255) | Emisor del certificado |
| hash_sha256_antes | VARCHAR(64) | Hash antes de la operación |
| hash_sha256_despues | VARCHAR(64) | Hash después de la operación |
| resultado | ENUM('exito','error','rechazado') | Resultado de la operación |
| detalle | TEXT | Detalles técnicos del resultado |
| observacion | VARCHAR(1000) | Observación adicional |
| fecha | DATE | Fecha de la operación |
| hora | TIME | Hora de la operación |
| created_at | DATETIME DEFAULT NOW | Timestamp inmutable |

Índices: solicitud_id, usuario_id, accion, resultado, fecha

### Tabla: `versiones_documento` — NUNCA SOBREESCRIBE
Versionamiento completo de cada PDF del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT PK | Identificador único |
| solicitud_id | INT NOT NULL | Solicitud propietaria |
| firma_id | INT NULL | Firma que generó esta versión |
| usuario_id | INT NULL | Usuario creador |
| version | INT DEFAULT 1 | Número de versión incremental |
| etapa | VARCHAR(50) | Etapa del flujo en que se creó |
| rol_firmante | VARCHAR(50) NULL | Rol que generó el documento |
| tipo | VARCHAR(50) | Tipo: original / pdf_firmado_electronico / escaneado |
| nombre_archivo | VARCHAR(255) | Nombre del archivo |
| ruta_archivo | VARCHAR(512) | Ruta física en el servidor |
| hash_sha256 | VARCHAR(64) NULL | Hash SHA-256 de integridad |
| tamano_bytes | INT NULL | Tamaño del archivo en bytes |
| es_version_actual | TINYINT(1) DEFAULT 0 | 1 = versión vigente |
| created_at | DATETIME DEFAULT NOW | Timestamp de creación (inmutable) |

Índices: solicitud_id, version, es_version_actual

### Tabla: `auditoria` — AUDITORÍA GENERAL
Log de todas las operaciones del sistema (no solo firma).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT PK | Identificador único |
| usuario_id | INT | Usuario que realizó la acción |
| solicitud_id | INT NULL | Solicitud afectada |
| modulo | VARCHAR | Módulo del sistema (auth, solicitudes, firma, etc.) |
| accion | VARCHAR | Tipo de acción |
| descripcion | TEXT | Descripción legible de la acción |
| datos_anteriores | JSON NULL | Estado antes del cambio |
| datos_nuevos | JSON NULL | Estado después del cambio |
| ip_origen | VARCHAR(45) | IP del cliente |
| created_at | DATETIME DEFAULT NOW | Timestamp inmutable |

---

## 7. SEGURIDAD

### 7.1 Autenticación JWT

```
Cliente                     Backend
  │ POST /api/auth/login       │
  │ {usuario, password}        │
  │ ─────────────────────────► │
  │                            │ bcrypt.checkpw(password, hash_bd)
  │                            │ jwt.encode({id,usuario,correo,rol,exp}, SECRET, HS256)
  │ ◄───────────────────────── │
  │ {token, usuario}           │
  │                            │
  │ GET /api/admin/solicitudes │
  │ Authorization: Bearer tok  │
  │ ─────────────────────────► │
  │                            │ jwt.decode(tok, SECRET, ['HS256'])
  │                            │ verificar rol en payload
  │ ◄───────────────────────── │
  │ {solicitudes: [...]}       │
```

- **Algoritmo:** HS256 (HMAC-SHA256)
- **Expiración:** 8 horas (JWT_EXPIRATION_HOURS)
- **Claims del payload:** id, usuario, correo, rol, exp
- **Validación en backend:** decorador `@token_requerido` en cada endpoint protegido
- **Validación en frontend:** `AuthService.isTokenExpired()` decodifica base64 del payload y compara `exp * 1000 < Date.now()`

### 7.2 Contraseñas

- `bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())` — hash con salt aleatorio
- `bcrypt.checkpw(plano.encode(), hash.encode())` — verificación con manejo de excepciones
- **Nunca se almacena la contraseña en texto plano**
- La clave JWT se valida al arrancar el sistema (config.py emite `warnings.warn` si es insegura)

### 7.3 Protección de rutas

Backend — decoradores apilados:
```python
@blueprint.route('/admin/solicitudes')
@token_requerido          # verifica JWT → 401 si falla
@roles_permitidos('administrador')  # verifica rol → 403 si no coincide
def listar_solicitudes():
    ...
```

Frontend — roleGuard funcional:
```
1. authService.isAuthenticated() → false → /auth/login
2. route.data['roles'] definidos → authService.tieneRol() → false → dashboard del rol actual
```

### 7.4 Rate Limiting

- `limiter = Limiter(key_func=get_remote_address, storage_uri='memory://')`
- Aplicado con `@limiter.limit('X per minute')` en endpoints sensibles
- `429 Too Many Requests` capturado por el interceptor Angular con `console.warn`

### 7.5 Seguridad de archivos

- `validar_ruta_segura(ruta, carpeta_base)` en helpers.py previene **path traversal**
- Archivos nombrados con `werkzeug.utils.secure_filename`
- Extensiones de archivo validadas antes de aceptar upload

### 7.6 Headers HTTP

Nginx agrega en todas las respuestas:
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

---

## 8. FIRMA DIGITAL — pyHanko PAdES

**PAdES** = PDF Advanced Electronic Signatures (ETSI EN 319 102).
Compatible con la **Ley de Comercio Electrónico, Firmas y Mensajes de Datos** de Ecuador.

### Flujo técnico completo

```
FRONTEND                           BACKEND
    │                                 │
    │ POST /validar-certificado        │
    │ FormData: {cert.p12, password}   │
    │ ─────────────────────────────►  │
    │                                 │ pkcs12.load_key_and_certificates(data, password)
    │                                 │ extrae: subject_cn, issuer_cn, serie, vigencia
    │ ◄─────────────────────────────  │
    │ {subject_cn, dias_restantes...} │
    │                                 │
    │ POST /firmar-pyhanko             │
    │ FormData: {cert.p12, password,  │
    │            observacion}         │
    │ ─────────────────────────────►  │
    │                                 │ 1. pkcs12.load_key_and_certificates()
    │                                 │ 2. Obtiene PDF actual de la solicitud
    │                                 │ 3. hashlib.sha256(pdf_bytes) → hash_antes
    │                                 │ 4. SimpleSigner.load_pkcs12(cert_data, password)
    │                                 │ 5. IncrementalPdfFileWriter(pdf_stream)
    │                                 │ 6. sign_pdf(writer, PdfSignatureMetadata(
    │                                 │      field_name='Signature', reason='Autorización',
    │                                 │      location='INAMHI Ecuador'))
    │                                 │ 7. hashlib.sha256(pdf_firmado) → hash_despues
    │                                 │ 8. guarda en uploads/firmados/
    │                                 │ 9. INSERT INTO firmas_digitales
    │                                 │ 10. INSERT INTO auditoria_firmas
    │                                 │ 11. INSERT INTO versiones_documento (es_version_actual=1)
    │                                 │     UPDATE versiones anteriores (es_version_actual=0)
    │ ◄─────────────────────────────  │
    │ {firma: {id, hash_sha256,       │
    │  certificado: {cn,serie,valida}}}│
```

### Verificación pública

```
GET /api/public/verificar/{codigo}  (sin autenticación)
  → retorna firmantes[], version_actual, url_verificacion
  → ciudadano puede verificar autenticidad del documento recibido
```

---

## 9. FLUJO DE ESTADOS DE SOLICITUD

```
[Ciudadano envía formulario]
           │
        RECIBIDA
     email automático al ciudadano con código de seguimiento
           │
           ▼ [Analista TICS revisa documentos técnicos]
    EN_REVISION_TICS ──────────────────────────────► RECHAZADA_TICS
           │ (valida)                                  (con motivo)
           ▼ [email al ciudadano: avance]
    EN_REVISION_JEFE ──────────────────────────────► RECHAZADA_JEFE
           │ (aprueba)                                 (con motivo)
           ▼ [email al ciudadano: avance]
  EN_REVISION_AUTORIDAD ─────────────────────────► NEGADA_AUTORIDAD
           │ (autoriza)                                (con motivo)
           ▼ [email al ciudadano: avance]
    EN_FIRMA_DIGITAL
           │ [funcionario carga certificado .p12 y firma con pyHanko]
           ▼
        FIRMADA
           │ [sistema registra en versiones_documento y auditoria_firmas]
           ▼ [email al ciudadano: documento disponible]
       ENTREGADA
```

**Transiciones de estado:** manejadas por `PUT /api/admin/solicitudes/{id}/aprobar`
El backend determina el nuevo estado según el rol del JWT (`request.usuario_actual['rol']`).

---

## 10. API REST — TABLA COMPLETA DE ENDPOINTS

### Públicos (sin autenticación)

| Método | Ruta | Body / Params | Respuesta |
|--------|------|---------------|-----------|
| POST | /api/public/solicitudes | JSON con todos los datos del ciudadano | {estado, codigo_solicitud} |
| GET | /api/public/solicitudes/seguimiento/{codigo} | — | {solicitud completa, paginas_web[]} |
| GET | /api/public/verificar/{codigo} | — | {firmantes[], version_actual, url_verificacion} |

### Autenticación

| Método | Ruta | Auth | Body | Respuesta |
|--------|------|------|------|-----------|
| POST | /api/auth/login | No | {usuario, password} | {token, usuario} |
| GET | /api/auth/me | JWT | — | {usuario del payload} |
| POST | /api/auth/logout | JWT | — | {estado: ok} |

### Solicitudes (token requerido)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | /api/admin/solicitudes | administrador | Lista con filtros estado= y q= |
| GET | /api/admin/solicitudes/{id} | administrador | Detalle + docs + paginas_web |
| GET | /api/admin/solicitudes/{id}/pdf | administrador | Genera y retorna PDF como blob |
| PUT | /api/admin/solicitudes/{id}/aprobar | cualquier rol | Avanza estado según rol del JWT |
| PUT | /api/admin/solicitudes/{id}/rechazar | cualquier rol | {motivo} → estado RECHAZADA |
| GET | /api/admin/solicitudes/{id}/documento-actual | cualquier rol | PDF firmado actual como blob |
| POST | /api/admin/solicitudes/{id}/documentos | cualquier rol | Sube PDF (octet-stream) |
| POST | /api/admin/solicitudes/{id}/firma-electronica | cualquier rol | Sube imagen PNG/JPG de firma |
| GET | /api/admin/solicitudes/{id}/firmas | cualquier rol | Historial firmas y versiones |
| GET | /api/admin/solicitudes/{id}/versiones/{vid}/descargar | cualquier rol | Versión específica blob |
| GET | /api/mis-solicitudes | cualquier rol | Solicitudes asignadas al rol actual |

### Firma Digital (token requerido)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/admin/solicitudes/{id}/validar-certificado | FormData: cert, password → info cert |
| POST | /api/admin/solicitudes/{id}/firmar-pyhanko | FormData: cert, password, obs → firma PDF |

### Usuarios y Admin (solo administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/admin/usuarios | Lista usuarios del sistema |
| POST | /api/admin/usuarios | Crea usuario (hash bcrypt de contraseña) |
| PUT | /api/admin/usuarios/{id} | Actualiza usuario |
| DELETE | /api/admin/usuarios/{id} | Desactiva usuario |
| GET | /api/admin/auditoria | Log de auditoría con filtros |
| GET | /api/admin/reportes | Reportes por período y estado |
| GET | /api/admin/manuales | Lista solicitudes manuales |
| GET | /api/admin/manuales/{uuid}/descargar-firmado | PDF firmado manual blob |

---

## 11. VARIABLES DE ENTORNO (backend/.env)

| Variable | Default | Descripción |
|----------|---------|-------------|
| DB_HOST | localhost | Servidor MySQL |
| DB_PORT | 3306 | Puerto MySQL |
| DB_USER | root | Usuario de la base de datos |
| DB_PASSWORD | — | Contraseña (obligatoria en producción) |
| DB_NAME | inamhi_liberacion_web | Nombre de la base de datos |
| DB_POOL_SIZE | 10 | Tamaño del pool de conexiones |
| JWT_SECRET_KEY | — | Clave de firma JWT (64 chars hex recomendado). Si está vacía, config.py genera una aleatoria y emite advertencia |
| JWT_EXPIRATION_HOURS | 8 | Horas de validez del token de sesión |
| BACKEND_HOST | 127.0.0.1 | IP de escucha de Flask |
| BACKEND_PORT | 5050 | Puerto de Flask |
| APP_URL | http://127.0.0.1:5050 | URL pública del backend (usada en QR de documentos) |
| CORS_ORIGINS | localhost:4300 | Orígenes permitidos, separados por comas |
| SMTP_HOST | — | Servidor SMTP para correos |
| SMTP_PORT | 587 | Puerto SMTP |
| SMTP_USER | — | Cuenta de envío de correos |
| SMTP_PASSWORD | — | Contraseña de la cuenta SMTP |
| SMTP_FROM | = SMTP_USER | Dirección del remitente visible en el correo |
| LOGO_PDF | logo_inamhi.png | Nombre del logo en backend/static/img/ |

---

## 12. DESPLIEGUE E INFRAESTRUCTURA

### Servidor de producción

| Parámetro | Valor |
|-----------|-------|
| IP del servidor | 10.0.153.76 |
| Puerto público (Nginx) | 80 |
| Puerto Flask interno | 5050 (solo localhost) |
| Puerto MySQL | 3306 (solo localhost) |
| Usuario del servicio | www-data |
| Frontend en disco | /var/www/inamhi/frontend/ |
| Backend en disco | /var/www/inamhi/backend/ |
| Entorno virtual Python | /var/www/inamhi/venv/ |

### Gunicorn workers

`workers = cpu_count() * 2 + 1`
Con 2 CPUs: 5 workers. Cada worker tiene 2 threads. Timeout 120s.
`preload_app = True` → la app se carga una vez y los workers hacen fork (ahorro de memoria).

### Servicio systemd

```
systemctl status inamhi-backend
systemctl restart inamhi-backend
journalctl -u inamhi-backend -f    # logs en tiempo real
```

---

## INSTRUCCIONES PARA GENERAR EL INFORME

Con toda la información anterior, genera un informe técnico formal con:

**ESTRUCTURA OBLIGATORIA:**
1. Portada (institución, nombre sistema, versión, fecha, autor)
2. Tabla de contenidos numerada
3. Introducción y antecedentes institucionales
4. Marco legal (LOTAIP, Ley de Comercio Electrónico Ecuador)
5. Objetivos general y específicos
6. Alcance (dentro y fuera del alcance)
7. Arquitectura del sistema (diagrama ASCII + descripción de cada componente)
8. Estructura completa del proyecto — árbol de directorios con descripción de CADA archivo y PARA QUÉ SIRVE
9. Módulos funcionales — subsección por módulo con descripción de cada pantalla
10. Tecnologías utilizadas — tabla con versión y justificación de cada elección
11. Modelo de base de datos — diagrama de tablas con todos los campos
12. API REST completa — tabla de endpoints por categoría
13. Seguridad del sistema — subsección por mecanismo (JWT, bcrypt, CORS, rate limiting, path traversal, headers)
14. Firma digital PAdES — descripción técnica del proceso paso a paso con código
15. Control de acceso RBAC — tabla de roles, rutas, decoradores
16. Auditoría e integridad — principios, operaciones auditadas, versionamiento
17. Flujo de trabajo — diagrama de estados con descripción de cada transición
18. Variables de configuración — tabla completa con defaults y descripción
19. Despliegue e infraestructura — servidor, Nginx, Gunicorn, systemd
20. Consideraciones y recomendaciones (HTTPS/TLS, backups MySQL, rotación logs, revocación de tokens)
21. Conclusiones
22. Anexo A: Árbol completo de directorios con descripción de cada archivo
23. Anexo B: Tabla completa de dependencias Python y Node.js

**FORMATO:**
- Secciones numeradas (1., 1.1, 1.1.1)
- Usa tablas para todos los listados — no listas de puntos
- Lenguaje técnico formal en tercera persona
- Párrafo introductorio al inicio de cada sección principal
- Extensión: mínimo 12 páginas A4 equivalentes
- La sección de estructura del proyecto debe documentar CADA ARCHIVO individualmente
