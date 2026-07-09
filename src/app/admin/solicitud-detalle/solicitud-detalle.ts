import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import Swal from 'sweetalert2';

import { PdfViewerComponent } from '../../shared/pdf-viewer/pdf-viewer';
import { AuthService } from '../../services/auth.service';
import {
  DocumentoSolicitud,
  PaginaWebAdmin,
  RolFirmante,
  SolicitudAdmin,
  SolicitudesAdminService
} from '../../services/solicitudes-admin.service';
import {
  FirmaElectronicaService,
  InformacionCertificado,
  FirmaRegistrada,
  VersionDocumento
} from '../../services/firma-electronica.service';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-solicitud-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    PdfViewerComponent
  ],
  templateUrl: './solicitud-detalle.html',
  styleUrl: './solicitud-detalle.scss'
})
export class SolicitudDetalle implements OnInit {

  readonly API_BASE = environment.apiUrl;

  solicitud: SolicitudAdmin | null = null;
  paginasWeb: PaginaWebAdmin[] = [];
  documentos: DocumentoSolicitud[] = [];

  cargando = false;
  procesando = false;
  procesandoRechazo = false;

  error = '';
  mensajeOk = '';
  motivoRechazo = '';

  documentoFirmadoCargado = false;

  // =====================================================
  // MODALES
  // =====================================================

  mostrarModalRechazo = false;

  mostrarVisorPdf = false;
  urlVisorPdf = '';
  tituloVisorPdf = '';

  seccionDatosVisible = false;
  seccionJustificacionVisible = false;

  // =====================================================
  // MODAL FIRMA DIGITAL CON CERTIFICADO (.p12/.pfx)
  // =====================================================

  mostrarModalFirmaDigital = false;

  // pyHanko
  certificadoSeleccionado: File | null = null;
  nombreCertificado = '';
  passwordCertificado = '';
  mostrarPassword = false;
  capsLockActivo = false;
  observacionFirma = '';
  validandoCertificado = false;
  firmandoConCertificado = false;
  infoCertificado: InformacionCertificado | null = null;
  certificadoValidado = false;
  errorCertificado = '';

  // Estado post-firma
  firmaExitosa = false;
  resultadoFirma: any = null;
  pasoFirma: 1 | 2 | 3 = 1;

  // historial de firmas
  firmasRegistradas: FirmaRegistrada[] = [];
  versionesDocumento: VersionDocumento[] = [];
  cargandoFirmas = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private solicitudesService: SolicitudesAdminService,
    private firmaService: FirmaElectronicaService
  ) {}

  ngOnInit(): void {
    this.cargarDetalle();
  }

  // =====================================================
  // CONTROL LOCAL DE DOCUMENTO FIRMADO
  // =====================================================

  private getClaveDocumentoLocal(estadoOpcional?: string): string {
    const solicitudId = this.solicitud?.id || Number(this.route.snapshot.paramMap.get('id'));
    const estado = estadoOpcional || this.solicitud?.estado || 'sin_estado';

    return `documento_firmado_${solicitudId}_${estado}`;
  }

  private guardarDocumentoFirmadoLocal(estadoOpcional?: string): void {
    localStorage.setItem(this.getClaveDocumentoLocal(estadoOpcional), 'true');
  }

  private existeDocumentoFirmadoLocal(estadoOpcional?: string): boolean {
    return localStorage.getItem(this.getClaveDocumentoLocal(estadoOpcional)) === 'true';
  }

  private limpiarDocumentoFirmadoLocal(estadoOpcional?: string): void {
    localStorage.removeItem(this.getClaveDocumentoLocal(estadoOpcional));
  }

  // =====================================================
  // CARGA DE DETALLE
  // =====================================================

  cargarDetalle(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || Number.isNaN(id)) {
      this.mostrarError('ID inválido', 'ID de solicitud inválido.');
      return;
    }

    const documentoFirmadoLocalActual = this.documentoFirmadoCargado;

    this.cargando = true;
    this.error = '';
    this.mensajeOk = '';

    this.solicitudesService.obtenerSolicitudPorId(id).subscribe({
      next: (response) => {
        this.cargando = false;

        this.solicitud = response.solicitud;
        this.paginasWeb = response.paginas_web || [];
        this.documentos = response.documentos || [];

        const existeDocumentoFirmado = this.documentos.some((documento) => {
          return (
            documento.firmado === true ||
            documento.firmado === 1 ||
            documento.firma_validada === true ||
            documento.firma_validada === 1 ||
            documento.tipo_documento === 'pdf_firmado_manual' ||
            documento.tipo_documento === 'pdf_firmado_electronico' ||
            documento.tipo_documento === 'pdf_tics' ||
            documento.tipo_documento === 'pdf_final'
          );
        });

        const existeDocumentoLocal = this.existeDocumentoFirmadoLocal();

        this.documentoFirmadoCargado =
          response.documento_firmado_cargado === true ||
          this.solicitud?.firma_actual_validada === true ||
          this.solicitud?.firma_actual_validada === 1 ||
          !!this.solicitud?.documento_actual_id ||
          existeDocumentoFirmado ||
          documentoFirmadoLocalActual ||
          existeDocumentoLocal;

        if (!this.esAdmin()) {
          this.cargarHistorialFirmas();
        }
      },
      error: (err: any) => {
        this.cargando = false;

        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        if (err.status === 403) {
          this.mostrarError(
            'Acceso denegado',
            err.error?.mensaje || 'No tiene permisos para ver el detalle de esta solicitud.'
          );
          return;
        }

        this.mostrarError(
          'No se pudo cargar',
          err.error?.mensaje || 'No se pudo cargar el detalle de la solicitud.'
        );
      }
    });
  }

  // =====================================================
  // MENÚ DINÁMICO POR ROL
  // =====================================================

  esAdmin(): boolean {
    return this.authService.isAdmin();
  }

  esJefe(): boolean {
    return this.authService.isJefeInmediato();
  }

  esAutoridad(): boolean {
    return this.authService.isMaximaAutoridad();
  }

  esTics(): boolean {
    return this.authService.isTics();
  }

  getRolFirmanteActual(): RolFirmante {
    const estado = this.solicitud?.estado || '';
    if (estado === 'pendiente_jefe_inmediato') return 'jefe_inmediato';
    if (estado === 'pendiente_maxima_autoridad') return 'maxima_autoridad';
    return 'analista_tics';
  }

  getTituloRol(): string {
    if (this.esAdmin()) {
      return 'Revisión administrativa';
    }

    if (this.esJefe()) {
      return 'Jefe inmediato';
    }

    if (this.esAutoridad()) {
      return 'Máxima autoridad';
    }

    if (this.esTics()) {
      return 'Panel técnico';
    }

    return 'Sistema institucional';
  }

  getIconoRol(): string {
    if (this.esAdmin()) {
      return 'bi bi-search';
    }

    if (this.esJefe()) {
      return 'bi bi-person-check-fill';
    }

    if (this.esAutoridad()) {
      return 'bi bi-shield-check';
    }

    if (this.esTics()) {
      return 'bi bi-cpu-fill';
    }

    return 'bi bi-building-fill';
  }

  getRutaVolver(): string {
    if (this.esAdmin()) {
      return '/admin/dashboard';
    }

    if (this.esJefe()) {
      return '/jefe/dashboard';
    }

    if (this.esAutoridad()) {
      return '/autoridad/dashboard';
    }

    if (this.esTics()) {
      return '/tics/dashboard';
    }

    return '/';
  }

  estaFinalizada(): boolean {
    return this.solicitud?.estado === 'finalizada';
  }

  // El jefe ha subido su propio documento firmado (rol_firmante = 'jefe_inmediato')
  get jefeHaSubidoDocumento(): boolean {
    return this.documentos.some(d => d.rol_firmante === 'jefe_inmediato');
  }

  // La autoridad ha subido su propio documento firmado
  get autoridadHaSubidoDocumento(): boolean {
    return this.documentos.some(d => d.rol_firmante === 'maxima_autoridad');
  }

  // TICS ha subido al menos un documento firmado
  get ticsHaSubidoDocumento(): boolean {
    return this.documentos.some(d => d.rol_firmante === 'analista_tics');
  }

  // =====================================================
  // DESCARGA DEL PDF GENERADO
  // =====================================================

  descargarPdf(): void {
    if (!this.solicitud) {
      return;
    }

    this.procesando = true;
    this.error = '';
    this.mensajeOk = '';

    this.solicitudesService.descargarPdfSolicitud(this.solicitud.id).subscribe({
      next: (blob: Blob) => {
        this.procesando = false;

        const nombreArchivo = `${this.solicitud?.codigo_solicitud || 'solicitud-inamhi'}.pdf`;
        this.solicitudesService.descargarBlob(blob, nombreArchivo);

        Swal.fire({
          title: 'PDF descargado',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#1d4ed8',
          background: '#ffffff',
          color: '#0f172a'
        });
      },
      error: (err: any) => {
        this.procesando = false;

        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        if (err.status === 403) {
          this.mostrarError(
            'Acceso denegado',
            err.error?.mensaje || 'No tiene permisos para descargar este PDF.'
          );
          return;
        }

        this.mostrarError(
          'No se pudo descargar',
          'No se pudo generar o descargar el PDF de la solicitud.'
        );
      }
    });
  }

  // =====================================================
  // DESCARGA DEL ÚLTIMO PDF FIRMADO ACTUAL
  // =====================================================

  descargarDocumentoFirmadoActual(): void {
    if (!this.solicitud) {
      return;
    }

    this.procesando = true;
    this.error = '';
    this.mensajeOk = '';

    this.solicitudesService.descargarDocumentoFirmadoActual(this.solicitud.id).subscribe({
      next: (blob: Blob) => {
        this.procesando = false;

        const nombreArchivo =
          `${this.solicitud?.codigo_solicitud || 'solicitud'}_documento_firmado_actual.pdf`;

        this.solicitudesService.descargarBlob(blob, nombreArchivo);

        Swal.fire({
          title: 'Documento descargado',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#15803d',
          background: '#ffffff',
          color: '#0f172a'
        });
      },
      error: (err: any) => {
        this.procesando = false;

        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        if (err.status === 403) {
          this.mostrarError(
            'Acceso denegado',
            err.error?.mensaje || 'No tiene permisos para descargar este documento.'
          );
          return;
        }

        Swal.fire({
          title: 'Sin PDF firmado',
          text: err.error?.mensaje || 'No hay documento firmado disponible.',
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d97706',
          background: '#ffffff',
          color: '#0f172a'
        });
      }
    });
  }

  abrirVisorPdf(url: string, titulo: string): void {
    this.urlVisorPdf = url;
    this.tituloVisorPdf = titulo;
    this.mostrarVisorPdf = true;
  }

  cerrarVisorPdf(): void {
    this.mostrarVisorPdf = false;
    this.urlVisorPdf = '';
    this.tituloVisorPdf = '';
  }

  verDocumentoActual(): void {
    if (!this.solicitud) return;
    this.procesando = true;

    this.solicitudesService.descargarDocumentoFirmadoActual(this.solicitud.id).subscribe({
      next: (blob: Blob) => {
        this.procesando = false;
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        window.open(blobUrl, '_blank');
      },
      error: (err: any) => {
        this.procesando = false;
        if (err.status === 401) { this.authService.logout(); this.router.navigate(['/auth/login']); return; }
        this.mostrarError('No se pudo cargar', 'No se pudo cargar el documento para visualizarlo.');
      }
    });
  }

  // =====================================================
  // APROBACIÓN GENERAL JEFE / AUTORIDAD
  // =====================================================

  async confirmarAprobacion(): Promise<void> {
    if (this.esAdmin()) {
      this.mostrarError(
        'Acción no permitida',
        'El administrador no puede aprobar solicitudes.'
      );
      return;
    }

    if (!this.solicitud) {
      return;
    }

    if (!this.documentoFirmadoCargado) {
      Swal.fire({
        title: 'PDF firmado requerido',
        text: 'Firme el PDF con su certificado digital antes de aprobar.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d97706',
        background: '#ffffff',
        color: '#0f172a'
      });

      return;
    }

    const resultado = await Swal.fire({
      html: `
        <div style="text-align:center;padding:8px 0">
          <img src="/inamhi-logo-LETRA-AZUL.png" alt="INAMHI" style="height:80px;width:auto;display:block;margin:0 auto 16px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.12));">
          <p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 4px;">¿Confirmar aprobación?</p>
          <p style="font-size:13px;color:#64748b;margin:0;">${this.solicitud.codigo_solicitud}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      background: '#ffffff',
      color: '#0f172a'
    });

    if (resultado.isConfirmed) {
      this.aprobar('general');
    }
  }

  // =====================================================
  // TICS: APROBAR (valida + finaliza en un solo paso)
  // =====================================================

  async confirmarAprobacionTics(): Promise<void> {
    if (!this.solicitud || this.esAdmin()) {
      return;
    }

    if (!this.puedeAprobarValidacionTics()) {
      this.mostrarError(
        'Acción no disponible',
        'Estado incorrecto o falta el PDF firmado.'
      );
      return;
    }

    const resultado = await Swal.fire({
      html: `
        <div style="text-align:center;padding:8px 0">
          <img src="/inamhi-logo-LETRA-AZUL.png" alt="INAMHI" style="height:80px;width:auto;display:block;margin:0 auto 16px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.12));">
          <p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 4px;">¿Aprobar y finalizar TICS?</p>
          <p style="font-size:13px;color:#64748b;margin:0;">${this.solicitud.codigo_solicitud}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      background: '#ffffff',
      color: '#0f172a'
    });

    if (resultado.isConfirmed) {
      this.aprobarTicsCompleto();
    }
  }

  // =====================================================
  // TICS: FINALIZAR (fallback si el estado quedó en pendiente_ejecucion_tics)
  // =====================================================

  async confirmarFinalizacionTics(): Promise<void> {
    if (!this.solicitud || this.esAdmin() || !this.puedeFinalizarTics()) {
      return;
    }

    const resultado = await Swal.fire({
      html: `
        <div style="text-align:center;padding:8px 0">
          <img src="/inamhi-logo-LETRA-AZUL.png" alt="INAMHI" style="height:80px;width:auto;display:block;margin:0 auto 16px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.12));">
          <p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 4px;">¿Finalizar proceso TICS?</p>
          <p style="font-size:13px;color:#64748b;margin:0;">${this.solicitud.codigo_solicitud}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      background: '#ffffff',
      color: '#0f172a'
    });

    if (resultado.isConfirmed) {
      this.aprobar('finalizacion_tics');
    }
  }

  // =====================================================
  // TICS: APROBAR EN DOS PASOS ENCADENADOS
  // Paso 1: pendiente_tics → pendiente_ejecucion_tics
  // Paso 2: pendiente_ejecucion_tics → finalizada + correo
  // =====================================================

  aprobarTicsCompleto(): void {
    if (!this.solicitud) {
      return;
    }

    const solicitudId = this.solicitud.id;

    this.procesando = true;
    this.error = '';
    this.mensajeOk = '';

    // Paso 1: validar
    this.solicitudesService.aprobarSolicitud(solicitudId).subscribe({
      next: () => {
        // Paso 2: finalizar
        this.solicitudesService.aprobarSolicitud(solicitudId).subscribe({
          next: (response) => {
            this.procesando = false;

            const correoEnviado = response?.correo_enviado === true;
            const correoDestino = response?.solicitud?.correo_destino
              || this.solicitud?.correo_institucional || '';
            const errorCorreo = response?.error_correo;

            Swal.fire({
              title: 'TICS finalizado',
              html: `
                <div style="text-align:center">
                  <p style="margin:0 0 10px;font-size:13px;color:#64748b;">
                    <strong style="color:#0f172a;">${this.solicitud?.codigo_solicitud}</strong> completada.
                  </p>
                  ${correoEnviado
                    ? `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0;text-align:left;">
                        <i class="bi bi-envelope-check-fill" style="color:#16a34a;font-size:18px;flex-shrink:0;"></i>
                        <span style="color:#166534;font-size:13px;">Notificado a <strong>${correoDestino}</strong></span>
                      </div>`
                    : `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:#fefce8;border:1px solid #fde047;text-align:left;">
                        <i class="bi bi-exclamation-triangle-fill" style="color:#ca8a04;font-size:18px;flex-shrink:0;"></i>
                        <span style="color:#854d0e;font-size:13px;">${errorCorreo || 'Correo no enviado.'}</span>
                      </div>`
                  }
                </div>
              `,
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#15803d',
              background: '#ffffff',
              color: '#0f172a'
            }).then(() => {
              this.cargarDetalle();
            });
          },
          error: (err: any) => {
            this.procesando = false;

            if (err.status === 401) {
              this.authService.logout();
              this.router.navigate(['/auth/login']);
              return;
            }

            this.mostrarError(
              'Error al finalizar',
              err.error?.mensaje || 'Validación aprobada, use "Finalizar" para completar el proceso.'
            );
            this.cargarDetalle();
          }
        });
      },
      error: (err: any) => {
        this.procesando = false;

        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        this.mostrarError(
          'No se pudo aprobar',
          err.error?.mensaje || 'No se pudo aprobar la validación TICS.'
        );
      }
    });
  }

  // =====================================================
  // APROBAR / AVANZAR FLUJO
  // =====================================================

  aprobar(tipoAccion: 'general' | 'finalizacion_tics' = 'general'): void {
    if (this.esAdmin()) {
      this.mostrarError(
        'Acción no permitida',
        'El administrador no puede avanzar el flujo.'
      );
      return;
    }

    if (!this.solicitud) {
      return;
    }

    const estadoAntes = this.solicitud.estado;

    this.procesando = true;
    this.error = '';
    this.mensajeOk = '';

    this.solicitudesService.aprobarSolicitud(this.solicitud.id).subscribe({
      next: (response) => {
        this.procesando = false;

        const estadoNuevo = response?.solicitud?.estado_actual || '';
        const etapaNueva = response?.solicitud?.etapa_actual || '';

        if (estadoNuevo && this.solicitud) {
          this.solicitud.estado = estadoNuevo;
        }

        if (etapaNueva && this.solicitud) {
          this.solicitud.etapa_actual = etapaNueva;
        }

        if (
          estadoAntes === 'pendiente_tics' &&
          estadoNuevo === 'pendiente_ejecucion_tics'
        ) {
          this.documentoFirmadoCargado = true;
          this.guardarDocumentoFirmadoLocal('pendiente_ejecucion_tics');
        }

        if (estadoNuevo === 'finalizada') {
          this.documentoFirmadoCargado = false;
          this.limpiarDocumentoFirmadoLocal('pendiente_tics');
          this.limpiarDocumentoFirmadoLocal('pendiente_ejecucion_tics');
          this.limpiarDocumentoFirmadoLocal('finalizada');
        }

        if (tipoAccion === 'finalizacion_tics') {
          const correoEnviado = response?.correo_enviado === true;
          const correoDestino  = response?.solicitud?.correo_destino || this.solicitud?.correo_institucional || '';
          const errorCorreo    = response?.error_correo;

          Swal.fire({
            title: 'TICS finalizado',
            html: `
              <div style="text-align:center">
                <p style="margin:0 0 10px;font-size:13px;color:#64748b;">
                  <strong style="color:#0f172a;">${this.solicitud?.codigo_solicitud}</strong> completada.
                </p>
                ${correoEnviado
                  ? `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0;text-align:left;">
                      <i class="bi bi-envelope-check-fill" style="color:#16a34a;font-size:18px;flex-shrink:0;"></i>
                      <span style="color:#166534;font-size:13px;">Notificado a <strong>${correoDestino}</strong></span>
                    </div>`
                  : `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:#fefce8;border:1px solid #fde047;text-align:left;">
                      <i class="bi bi-exclamation-triangle-fill" style="color:#ca8a04;font-size:18px;flex-shrink:0;"></i>
                      <span style="color:#854d0e;font-size:13px;">${errorCorreo || 'Correo no enviado.'}</span>
                    </div>`
                }
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#15803d',
            background: '#ffffff',
            color: '#0f172a'
          }).then(() => {
            this.cargarDetalle();
          });
          return;
        }

        Swal.fire({
          title: 'Solicitud aprobada',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#1d4ed8',
          background: '#ffffff',
          color: '#0f172a'
        }).then(() => {
          this.cargarDetalle();
        });
      },
      error: (err: any) => {
        this.procesando = false;

        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        if (err.status === 403) {
          this.mostrarError(
            'Acceso denegado',
            err.error?.mensaje || 'No tiene permisos para aprobar o finalizar esta solicitud.'
          );
          return;
        }

        this.mostrarError(
          'No se pudo procesar la acción',
          err.error?.mensaje || 'No se pudo aprobar o finalizar la solicitud.'
        );
      }
    });
  }

  // =====================================================
  // RECHAZO
  // =====================================================

  abrirModalRechazo(): void {
    if (this.esAdmin()) {
      this.mostrarError(
        'Acción no permitida',
        'El administrador no rechaza solicitudes. Solo revisa el proceso.'
      );
      return;
    }

    this.error = '';
    this.mensajeOk = '';
    this.motivoRechazo = '';
    this.mostrarModalRechazo = true;
  }

  cerrarModalRechazo(): void {
    this.mostrarModalRechazo = false;
    this.motivoRechazo = '';
  }

  rechazar(): void {
    if (this.esAdmin()) {
      this.mostrarError(
        'Acción no permitida',
        'El administrador no puede rechazar solicitudes.'
      );
      return;
    }

    if (!this.solicitud) {
      return;
    }

    const motivo = this.motivoRechazo.trim().replace(/\s+/g, ' ');

    if (!motivo) {
      this.mostrarError('Motivo requerido', 'Debe ingresar el motivo del rechazo.');
      return;
    }

    if (motivo.length < 10) {
      this.mostrarError('Motivo muy corto', 'El motivo del rechazo debe tener mínimo 10 caracteres.');
      return;
    }

    if (motivo.length > 1000) {
      this.mostrarError('Motivo demasiado largo', 'El motivo del rechazo no puede superar 1000 caracteres.');
      return;
    }

    this.procesando = true;
    this.procesandoRechazo = true;
    this.error = '';
    this.mensajeOk = '';

    this.solicitudesService.rechazarSolicitud(this.solicitud.id, motivo).subscribe({
      next: (response) => {
        this.procesando = false;
        this.procesandoRechazo = false;
        this.mostrarModalRechazo = false;
        this.motivoRechazo = '';
        this.documentoFirmadoCargado = false;

        const correoEnviado = response?.correo_enviado === true;

        Swal.fire({
          title: 'Solicitud rechazada',
          text: correoEnviado ? 'Solicitante notificado por correo.' : undefined,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#1d4ed8',
          background: '#ffffff',
          color: '#0f172a'
        }).then(() => {
          this.cargarDetalle();
        });
      },
      error: (err: any) => {
        this.procesando = false;
        this.procesandoRechazo = false;

        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        if (err.status === 403) {
          this.mostrarError(
            'Acceso denegado',
            err.error?.mensaje || 'No tiene permisos para rechazar esta solicitud.'
          );
          return;
        }

        this.mostrarError(
          'No se pudo rechazar',
          err.error?.mensaje || 'No se pudo rechazar la solicitud.'
        );
      }
    });
  }

  // =====================================================
  // PERMISOS DE ACCIONES
  // =====================================================

  puedeAprobar(): boolean {
    if (!this.solicitud || this.esAdmin()) {
      return false;
    }

    const estado = this.solicitud.estado;

    if (estado === 'pendiente_jefe_inmediato') {
      return this.jefeHaSubidoDocumento;
    }

    if (estado === 'pendiente_maxima_autoridad') {
      return this.autoridadHaSubidoDocumento;
    }

    return false;
  }

  puedeAprobarValidacionTics(): boolean {
    if (!this.solicitud) {
      return false;
    }

    return this.solicitud.estado === 'pendiente_tics' && this.ticsHaSubidoDocumento;
  }

  puedeFinalizarTics(): boolean {
    if (!this.solicitud) {
      return false;
    }

    return this.solicitud.estado === 'pendiente_ejecucion_tics';
  }

  puedeRechazar(): boolean {
    if (!this.solicitud || this.esAdmin()) {
      return false;
    }

    const estado = this.solicitud.estado;
    return ['pendiente_jefe_inmediato', 'pendiente_maxima_autoridad', 'pendiente_tics'].includes(estado);
  }

  getTextoBotonAprobar(): string {
    if (!this.solicitud) {
      return 'Aprobar';
    }

    if (this.esAdmin()) {
      return 'Solo revisión';
    }

    const textos: Record<string, string> = {
      pendiente_jefe_inmediato: 'Aprobar como jefe inmediato',
      pendiente_maxima_autoridad: 'Aprobar como máxima autoridad'
    };

    return textos[this.solicitud.estado] || 'Aprobar solicitud';
  }

  // =====================================================
  // TRACK BY
  // =====================================================

  trackByPagina(_index: number, pagina: PaginaWebAdmin): number {
    return pagina.id;
  }

  trackByDocumento(_index: number, documento: DocumentoSolicitud): number {
    return documento.id;
  }

  // =====================================================
  // TEXTOS DE ESTADOS Y ETAPAS
  // =====================================================

  getEstadoTexto(estado: string): string {
    const estados: Record<string, string> = {
      pendiente_firma_solicitante: 'Pendiente firma solicitante',
      pendiente_jefe_inmediato: 'Pendiente jefe inmediato',
      rechazada_jefe_inmediato: 'Rechazada jefe inmediato',
      pendiente_maxima_autoridad: 'Pendiente máxima autoridad',
      rechazada_maxima_autoridad: 'Rechazada máxima autoridad',
      pendiente_tics: 'Pendiente TICS',
      rechazada_tics: 'Rechazada TICS',
      pendiente_ejecucion_tics: 'Pendiente ejecución TICS',
      finalizada: 'Finalizada',
      anulada: 'Anulada'
    };

    return estados[estado] || estado;
  }

  getEtapaTexto(etapa: string): string {
    const etapas: Record<string, string> = {
      registro_publico: 'Registro público',
      firma_solicitante: 'Firma del solicitante',
      jefe_inmediato: 'Jefe inmediato',
      maxima_autoridad: 'Máxima autoridad',
      tics: 'Validación TICS',
      ejecucion_tics: 'Ejecución TICS',
      finalizado: 'Finalizado',
      proceso_manual: 'Proceso manual'
    };

    return etapas[etapa] || etapa || 'No registrada';
  }

  getEstadoClase(estado: string): string {
    if (!estado) {
      return 'normal';
    }

    if (estado.includes('rechazada')) {
      return 'rechazada';
    }

    if (estado === 'finalizada') {
      return 'finalizada';
    }

    if (estado.includes('pendiente')) {
      return 'pendiente';
    }

    return 'normal';
  }

  // =====================================================
  // MENSAJES Y SESIÓN
  // =====================================================

  private mostrarError(titulo: string, mensaje: string): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc2626',
      background: '#ffffff',
      color: '#0f172a'
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // =====================================================
  // MODAL FIRMA DIGITAL CON CERTIFICADO
  // =====================================================

  abrirModalFirmaDigital(): void {
    if (this.esAdmin()) {
      this.mostrarError('Acción no permitida', 'El administrador solo puede revisar documentos.');
      return;
    }
    if (!this.solicitud) return;
    if (this.estaFinalizada()) {
      this.mostrarError('Proceso finalizado', 'Esta solicitud ya fue finalizada.');
      return;
    }

    this.certificadoSeleccionado = null;
    this.nombreCertificado = '';
    this.passwordCertificado = '';
    this.mostrarPassword = false;
    this.observacionFirma = '';
    this.infoCertificado = null;
    this.certificadoValidado = false;
    this.errorCertificado = '';
    this.firmaExitosa = false;
    this.resultadoFirma = null;
    this.pasoFirma = 1;

    this.mostrarModalFirmaDigital = true;
    this.cargarHistorialFirmas();
  }

  cerrarModalFirmaDigital(): void {
    if (this.firmandoConCertificado || this.procesando) return;
    this.mostrarModalFirmaDigital = false;
    this.certificadoSeleccionado = null;
    this.nombreCertificado = '';
    this.passwordCertificado = '';
    this.mostrarPassword = false;
    this.infoCertificado = null;
    this.certificadoValidado = false;
    this.errorCertificado = '';
    this.firmaExitosa = false;
    this.resultadoFirma = null;
    this.pasoFirma = 1;
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  detectarCapsLock(event: KeyboardEvent): void {
    this.capsLockActivo = event.getModifierState('CapsLock');
  }

  // =====================================================
  // SELECCIÓN DEL CERTIFICADO
  // =====================================================

  seleccionarCertificado(event: Event): void {
    this.errorCertificado = '';
    this.infoCertificado = null;
    this.certificadoValidado = false;

    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    const nombre = archivo.name.toLowerCase();

    if (!nombre.endsWith('.p12') && !nombre.endsWith('.pfx')) {
      this.errorCertificado = 'Solo se aceptan archivos .p12 o .pfx.';
      input.value = '';
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      this.errorCertificado = 'El certificado no puede superar 5 MB.';
      input.value = '';
      return;
    }

    this.certificadoSeleccionado = archivo;
    this.nombreCertificado = archivo.name;
    this.pasoFirma = 2;
  }

  // =====================================================
  // VALIDAR CERTIFICADO ANTES DE FIRMAR
  // =====================================================

  validarCertificado(): void {
    if (!this.certificadoSeleccionado) {
      this.errorCertificado = 'Seleccione un certificado .p12 o .pfx.';
      return;
    }
    if (!this.passwordCertificado.trim()) {
      this.errorCertificado = 'Ingrese la contraseña del certificado.';
      return;
    }
    if (!this.solicitud?.id) return;

    this.validandoCertificado = true;
    this.errorCertificado = '';
    this.infoCertificado = null;
    this.certificadoValidado = false;

    this.firmaService.validarCertificado(
      this.solicitud.id,
      this.certificadoSeleccionado,
      this.passwordCertificado
    ).subscribe({
      next: (response) => {
        this.validandoCertificado = false;
        if (response.estado === 'ok' && response.info) {
          this.infoCertificado = response.info;
          this.certificadoValidado = true;
        } else {
          this.errorCertificado = response.mensaje || 'Error al validar el certificado.';
        }
      },
      error: (err: any) => {
        this.validandoCertificado = false;
        if (err.status === 401) { this.authService.logout(); this.router.navigate(['/auth/login']); return; }
        this.errorCertificado = err.error?.mensaje || 'No se pudo validar el certificado.';
      }
    });
  }

  // =====================================================
  // FIRMAR CON CERTIFICADO DIGITAL (pyHanko)
  // =====================================================

  firmarConCertificado(): void {
    if (!this.certificadoSeleccionado) {
      this.errorCertificado = 'Seleccione un certificado .p12 o .pfx.';
      this.pasoFirma = 1;
      return;
    }
    if (!this.passwordCertificado.trim()) {
      this.errorCertificado = 'Ingrese la contraseña del certificado.';
      this.pasoFirma = 2;
      return;
    }
    if (!this.solicitud?.id) return;

    this.firmandoConCertificado = true;
    this.pasoFirma = 3;
    this.errorCertificado = '';

    this.firmaService.firmarConPyhanko(
      this.solicitud.id,
      this.certificadoSeleccionado,
      this.passwordCertificado,
      this.observacionFirma
    ).subscribe({
      next: (response) => {
        this.firmandoConCertificado = false;

        if (response.estado !== 'ok') {
          this.errorCertificado = this._parsearErrorFirma(response.mensaje || '');
          this.pasoFirma = 2;
          return;
        }

        this.documentoFirmadoCargado = true;
        this.guardarDocumentoFirmadoLocal();
        this.firmaExitosa = true;
        this.resultadoFirma = response.firma;
        this.cargarHistorialFirmas();
        this.cargarDetalle();
      },
      error: (err: any) => {
        this.firmandoConCertificado = false;
        this.pasoFirma = 2;
        if (err.status === 401) { this.authService.logout(); this.router.navigate(['/auth/login']); return; }
        if (err.status === 409) {
          this.firmaExitosa = true;
          this.errorCertificado = '';
          return;
        }
        this.errorCertificado = this._parsearErrorFirma(
          err.error?.mensaje || err.error?.error || 'Error al firmar el documento.'
        );
      }
    });
  }

  private _parsearErrorFirma(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes('password') || m.includes('contraseña') || m.includes('passphrase') || m.includes('mac verify'))
      return 'Contraseña incorrecta. Verifique la contraseña de su certificado .p12 e intente de nuevo.';
    if (m.includes('expir') || m.includes('venc'))
      return 'El certificado digital está expirado. Obtenga un certificado vigente.';
    if (m.includes('no válido') || m.includes('invalid') || m.includes('no es un'))
      return 'El archivo seleccionado no es un certificado digital válido (.p12/.pfx).';
    if (m.includes('no tiene permisos') || m.includes('le corresponde al rol'))
      return 'No tiene permisos para firmar en esta etapa del proceso. Esta firma le corresponde a otro rol.';
    if (m.includes('etapa') || m.includes('no puede firmar'))
      return 'No puede firmar en la etapa actual del proceso. Verifique que le corresponde este paso.';
    if (m.includes('ya existe') || m.includes('ya firmó'))
      return 'Ya existe una firma registrada para su rol en esta solicitud.';
    if (m.includes('bloqueada'))
      return 'La solicitud está bloqueada. Contacte al administrador.';
    return msg || 'No se pudo aplicar la firma. Intente nuevamente.';
  }

  verPdfFirmadoTrasExito(): void {
    if (!this.solicitud?.id) return;
    this.procesando = true;
    this.solicitudesService.descargarDocumentoFirmadoActual(this.solicitud.id).subscribe({
      next: (blob) => {
        this.procesando = false;
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        this.cerrarModalFirmaDigital();
        this.abrirVisorPdf(blobUrl, `${this.solicitud?.codigo_solicitud} — firmado.pdf`);
      },
      error: () => {
        this.procesando = false;
        this.cerrarModalFirmaDigital();
        this.verDocumentoActual();
      }
    });
  }

  // =====================================================
  // CARGAR HISTORIAL DE FIRMAS
  // =====================================================

  cargarHistorialFirmas(): void {
    if (!this.solicitud?.id) return;
    this.cargandoFirmas = true;

    this.firmaService.obtenerHistorialFirmas(this.solicitud.id).subscribe({
      next: (response) => {
        this.cargandoFirmas = false;
        if (response.estado === 'ok') {
          this.firmasRegistradas = response.firmas;
          this.versionesDocumento = response.versiones;
        }
      },
      error: () => {
        this.cargandoFirmas = false;
      }
    });
  }

  // =====================================================
  // HELPERS PARA LA VISTA
  // =====================================================

  get yaFirmoEsteRol(): boolean {
    if (!this.solicitud) return false;
    const rolFirmante = this.getRolFirmanteActual();
    return this.firmasRegistradas.some(f => f.rol_firmante === rolFirmante);
  }

  getRolTexto(rol: string): string {
    const roles: Record<string, string> = {
      jefe_inmediato: 'Jefe inmediato',
      maxima_autoridad: 'Máxima autoridad',
      analista_tics: 'Analista TICS',
      solicitante: 'Solicitante'
    };
    return roles[rol] || rol;
  }

  getMiRolTexto(): string {
    return this.getRolTexto(this.authService.getRol() || '');
  }

  getModoFirmaTexto(modo: string): string {
    return modo === 'pyhanko' ? 'Firma digital (pyHanko)' : 'FirmaEC';
  }

  descargarVersionDocumento(versionId: number): void {
    if (!this.solicitud?.id) return;
    this.firmaService.descargarVersion(this.solicitud.id, versionId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `version_${versionId}_${this.solicitud?.codigo_solicitud}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.mostrarError('Error', 'No se pudo descargar la versión del documento.');
      }
    });
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'No registrada';
    const soloFecha = fecha.split(/[\sT]/)[0];
    const partes = soloFecha.split('-');
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  calcularVigencia(fecha: string | null | undefined): string {
    if (!fecha) return 'No registrada';
    const soloFecha = fecha.split(/[\sT]/)[0];
    const vigencia = new Date(`${soloFecha}T00:00:00`);
    if (isNaN(vigencia.getTime())) return fecha;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (vigencia < hoy) {
      const [y, m, d] = soloFecha.split('-');
      return `Venció el ${d}/${m}/${y}`;
    }
    if (vigencia.getTime() === hoy.getTime()) return 'Vence hoy';

    let meses =
      (vigencia.getFullYear() - hoy.getFullYear()) * 12 +
      (vigencia.getMonth() - hoy.getMonth());

    const temp = new Date(hoy);
    temp.setMonth(temp.getMonth() + meses);
    let dias = Math.round((vigencia.getTime() - temp.getTime()) / 86_400_000);

    if (dias < 0) {
      meses--;
      temp.setMonth(temp.getMonth() - 1);
      dias = Math.round((vigencia.getTime() - temp.getTime()) / 86_400_000);
    }

    const partes: string[] = [];
    if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
    if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
    return partes.length > 0 ? partes.join(' y ') + ' restantes' : 'Vence hoy';
  }
}
