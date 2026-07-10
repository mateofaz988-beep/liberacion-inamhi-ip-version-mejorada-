import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../../services/auth.service';

export interface AuditoriaRegistro {
  id: number;
  usuario_id: number | null;
  solicitud_id: number | null;
  usuario?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  codigo_solicitud?: string | null;
  modulo: string;
  accion: string;
  descripcion: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  ip_origen: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CambioAuditoria {
  campo: string;
  anterior: string;
  nuevo: string;
  cambioReal: boolean;
}

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.scss'
})
export class Auditoria implements OnInit {

  private readonly API_BASE = environment.apiUrl;
  private readonly API_URL = `${this.API_BASE}/admin/auditoria`;

  registros: AuditoriaRegistro[] = [];
  registrosFiltrados: AuditoriaRegistro[] = [];

  cargando = false;
  error = '';

  textoBusqueda = '';
  filtroModulo = '';
  filtroAccion = '';
  fechaDesde = '';
  fechaHasta = '';

  totalRegistros = 0;
  totalSolicitudes = 0;
  totalUsuarios = 0;
  totalDocumentos = 0;
  totalSistema = 0;

  // Estos valores deben coincidir exactamente con los `modulo=`/`accion=` que
  // registra el backend en registrar_auditoria() (backend/app.py). Antes esta
  // lista tenía valores que el backend nunca genera (auth, usuarios, login,
  // etc.), por lo que filtrar por ellos siempre daba "sin resultados" aunque
  // sí hubiera registros — el filtro nunca podía coincidir con nada real.
  modulos = [
    { valor: '', texto: 'Todos los módulos' },
    { valor: 'solicitud_publica', texto: 'Solicitud pública' },
    { valor: 'firmaec_publico', texto: 'Firma electrónica (público)' },
    { valor: 'firmaec_jefe', texto: 'Firma electrónica (jefe)' },
    { valor: 'flujo_manual', texto: 'Flujo manual' },
    { valor: 'flujo_solicitud', texto: 'Flujo de solicitud' },
    { valor: 'documentos', texto: 'Documentos' },
    { valor: 'firma_digital', texto: 'Firma digital (pyHanko)' },
    { valor: 'correo', texto: 'Correo' }
  ];

  acciones = [
    { valor: '', texto: 'Todas las acciones' },
    { valor: 'crear_solicitud', texto: 'Crear solicitud' },
    { valor: 'preparar_solicitud_firmaec', texto: 'Preparar solicitud FirmaEC' },
    { valor: 'subir_pdf_firmado_solicitante', texto: 'Subir PDF firmado (solicitante)' },
    { valor: 'subir_pdf_firmado_jefe', texto: 'Subir PDF firmado (jefe)' },
    { valor: 'registrar_descarga_manual', texto: 'Registrar descarga manual' },
    { valor: 'subir_documento_manual_finalizado', texto: 'Subir documento manual finalizado' },
    { valor: 'descargar_documento_manual_firmado', texto: 'Descargar documento manual firmado' },
    { valor: 'generar_pdf_firmado_electronico', texto: 'Generar PDF firmado electrónico' },
    { valor: 'subir_documento_firmado', texto: 'Subir documento firmado' },
    { valor: 'aprobar_solicitud', texto: 'Aprobar solicitud' },
    { valor: 'firmar_pdf_pyhanko', texto: 'Firmar PDF (pyHanko)' },
    { valor: 'enviar_correo_finalizacion', texto: 'Enviar correo de finalización' },
    { valor: 'error_correo_finalizacion', texto: 'Error al enviar correo de finalización' }
  ];

  registroSeleccionado: AuditoriaRegistro | null = null;
  mostrarModalDetalle = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarAuditoria();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token_liberacion_web') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  cargarAuditoria(): void {
    this.cargando = true;
    this.error = '';

    this.http.get<any>(
      this.API_URL,
      {
        headers: this.getHeaders()
      }
    ).subscribe({
      next: (response) => {
        this.cargando = false;
        this.registros = response.auditoria || response.registros || [];
        this.aplicarFiltros();
      },
      error: (err) => {
        this.cargando = false;

        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        this.error = err.error?.mensaje || 'No se pudo cargar la auditoría del sistema.';
      }
    });
  }

  aplicarFiltros(): void {
    const busqueda = this.textoBusqueda.trim().toLowerCase();

    this.registrosFiltrados = this.registros.filter((registro) => {
      const coincideModulo = this.filtroModulo
        ? registro.modulo === this.filtroModulo
        : true;

      const coincideAccion = this.filtroAccion
        ? registro.accion === this.filtroAccion
        : true;

      const coincideBusqueda = busqueda
        ? this.obtenerTextoBusqueda(registro).includes(busqueda)
        : true;

      const coincideFecha = this.validarRangoFecha(registro.created_at);

      return coincideModulo && coincideAccion && coincideBusqueda && coincideFecha;
    });

    this.calcularResumen();
  }

  obtenerTextoBusqueda(registro: AuditoriaRegistro): string {
    return `
      ${registro.id}
      ${registro.usuario_id || ''}
      ${registro.solicitud_id || ''}
      ${registro.usuario || ''}
      ${registro.nombres || ''}
      ${registro.apellidos || ''}
      ${registro.codigo_solicitud || ''}
      ${registro.modulo || ''}
      ${registro.accion || ''}
      ${registro.descripcion || ''}
      ${registro.ip_origen || ''}
      ${registro.created_at || ''}
    `.toLowerCase();
  }

  validarRangoFecha(fechaRegistro: string): boolean {
    if (!this.fechaDesde && !this.fechaHasta) {
      return true;
    }

    const fecha = this.normalizarFecha(fechaRegistro);

    if (!fecha) {
      return true;
    }

    if (this.fechaDesde && fecha < this.fechaDesde) {
      return false;
    }

    if (this.fechaHasta && fecha > this.fechaHasta) {
      return false;
    }

    return true;
  }

  normalizarFecha(fecha: string): string {
    if (!fecha) {
      return '';
    }

    return String(fecha).slice(0, 10);
  }

  calcularResumen(): void {
    this.totalRegistros = this.registrosFiltrados.length;

    this.totalSolicitudes = this.registrosFiltrados.filter((registro) =>
      registro.modulo === 'solicitud_publica' ||
      registro.modulo === 'flujo_solicitud' ||
      registro.modulo === 'flujo_manual'
    ).length;

    this.totalUsuarios = this.registrosFiltrados.filter((registro) =>
      registro.modulo === 'usuarios'
    ).length;

    this.totalDocumentos = this.registrosFiltrados.filter((registro) =>
      registro.modulo === 'documentos' ||
      registro.modulo === 'firmaec_publico' ||
      registro.modulo === 'firmaec_jefe' ||
      registro.modulo === 'firma_digital'
    ).length;

    this.totalSistema = this.registrosFiltrados.filter((registro) =>
      registro.modulo === 'correo'
    ).length;
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.filtroModulo = '';
    this.filtroAccion = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.aplicarFiltros();
  }

  abrirDetalle(registro: AuditoriaRegistro): void {
    this.registroSeleccionado = registro;
    this.mostrarModalDetalle = true;
  }

  cerrarDetalle(): void {
    this.registroSeleccionado = null;
    this.mostrarModalDetalle = false;
  }

  exportarCsv(): void {
    if (this.registrosFiltrados.length === 0) {
      Swal.fire({
        title: 'Sin datos',
        text: 'No existen registros para exportar.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d97706'
      });
      return;
    }

    const encabezados = [
      'ID',
      'Usuario ID',
      'Usuario',
      'Solicitud ID',
      'Código solicitud',
      'Módulo',
      'Acción',
      'Descripción',
      'IP origen',
      'Fecha'
    ];

    const filas = this.registrosFiltrados.map((registro) => [
      String(registro.id),
      String(registro.usuario_id || ''),
      this.getUsuarioTexto(registro),
      String(registro.solicitud_id || ''),
      String(registro.codigo_solicitud || ''),
      this.getModuloTexto(registro.modulo),
      this.getAccionTexto(registro.accion),
      registro.descripcion || '',
      registro.ip_origen || '',
      registro.created_at || ''
    ]);

    const contenido = [
      encabezados,
      ...filas
    ]
      .map((fila) => fila.map((valor) => this.escaparCsv(valor)).join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + contenido], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    const fechaActual = new Date().toISOString().slice(0, 10);

    enlace.href = url;
    enlace.download = `auditoria-inamhi-${fechaActual}.csv`;
    enlace.click();

    window.URL.revokeObjectURL(url);
  }

  escaparCsv(valor: string): string {
    const texto = String(valor || '').replace(/"/g, '""');
    return `"${texto}"`;
  }

  imprimirAuditoria(): void {
    window.print();
  }

  getUsuarioTexto(registro: AuditoriaRegistro): string {
    const nombres = `${registro.nombres || ''} ${registro.apellidos || ''}`.trim();

    if (nombres) {
      return nombres;
    }

    if (registro.usuario) {
      return registro.usuario;
    }

    if (registro.usuario_id) {
      return `Usuario ID ${registro.usuario_id}`;
    }

    return 'Sistema / Público';
  }

  getModuloTexto(modulo: string): string {
    const modulos: Record<string, string> = {
      solicitud_publica: 'Solicitud pública',
      firmaec_publico: 'Firma electrónica (público)',
      firmaec_jefe: 'Firma electrónica (jefe)',
      flujo_manual: 'Flujo manual',
      flujo_solicitud: 'Flujo de solicitud',
      documentos: 'Documentos',
      firma_digital: 'Firma digital (pyHanko)',
      correo: 'Correo'
    };

    return modulos[modulo] || this.formatearTexto(modulo);
  }

  getAccionTexto(accion: string): string {
    const acciones: Record<string, string> = {
      crear_solicitud: 'Crear solicitud',
      preparar_solicitud_firmaec: 'Preparar solicitud FirmaEC',
      subir_pdf_firmado_solicitante: 'Subir PDF firmado (solicitante)',
      subir_pdf_firmado_jefe: 'Subir PDF firmado (jefe)',
      registrar_descarga_manual: 'Registrar descarga manual',
      subir_documento_manual_finalizado: 'Subir documento manual finalizado',
      descargar_documento_manual_firmado: 'Descargar documento manual firmado',
      generar_pdf_firmado_electronico: 'Generar PDF firmado electrónico',
      subir_documento_firmado: 'Subir documento firmado',
      aprobar_solicitud: 'Aprobar solicitud',
      firmar_pdf_pyhanko: 'Firmar PDF (pyHanko)',
      enviar_correo_finalizacion: 'Enviar correo de finalización',
      error_correo_finalizacion: 'Error al enviar correo de finalización'
    };

    return acciones[accion] || this.formatearTexto(accion);
  }

  getModuloClase(modulo: string): string {
    const clases: Record<string, string> = {
      solicitud_publica: 'solicitudes',
      firmaec_publico: 'documentos',
      firmaec_jefe: 'documentos',
      flujo_manual: 'solicitudes',
      flujo_solicitud: 'solicitudes',
      documentos: 'documentos',
      firma_digital: 'documentos',
      correo: 'sistema'
    };

    return clases[modulo] || 'normal';
  }

  getAccionClase(accion: string): string {
    if (!accion) {
      return 'normal';
    }

    if (accion.includes('aprobar')) {
      return 'aprobar';
    }

    if (accion.includes('rechazar')) {
      return 'rechazar';
    }

    if (accion.includes('crear') || accion.includes('subir')) {
      return 'crear';
    }

    if (accion.includes('actualizar') || accion.includes('cambiar')) {
      return 'actualizar';
    }

    if (accion.includes('eliminar')) {
      return 'eliminar';
    }

    if (accion.includes('login')) {
      return 'login';
    }

    return 'normal';
  }

  // =====================================================
  // FORMATEO PROFESIONAL DEL DETALLE DE AUDITORÍA
  // =====================================================

  formatearTexto(valor: string | null | undefined): string {
    if (!valor) {
      return 'No registrado';
    }

    return String(valor)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letra => letra.toUpperCase());
  }

  formatearValor(valor: any): string {
    if (valor === null || valor === undefined || valor === '') {
      return 'No registrado';
    }

    if (typeof valor === 'boolean') {
      return valor ? 'Sí' : 'No';
    }

    if (typeof valor === 'number') {
      return String(valor);
    }

    if (typeof valor === 'object') {
      return JSON.stringify(valor);
    }

    return String(valor).replace(/_/g, ' ');
  }

  private convertirJson(valor: any): Record<string, any> {
    if (!valor) {
      return {};
    }

    if (typeof valor === 'object') {
      return valor;
    }

    try {
      return JSON.parse(valor);
    } catch {
      return {};
    }
  }

  obtenerCambiosAuditoria(registro: AuditoriaRegistro | null): CambioAuditoria[] {
    if (!registro) {
      return [];
    }

    const anteriores = this.convertirJson(registro.datos_anteriores);
    const nuevos = this.convertirJson(registro.datos_nuevos);

    const campos = Array.from(
      new Set([
        ...Object.keys(anteriores),
        ...Object.keys(nuevos)
      ])
    );

    return campos.map((campo) => {
      const anterior = this.formatearValor(anteriores[campo]);
      const nuevo = this.formatearValor(nuevos[campo]);

      return {
        campo: this.formatearTexto(campo),
        anterior,
        nuevo,
        cambioReal: anterior !== nuevo
      };
    });
  }

  tieneCambiosAuditoria(registro: AuditoriaRegistro | null): boolean {
    return this.obtenerCambiosAuditoria(registro).length > 0;
  }

  getFechaTexto(registro: AuditoriaRegistro | null): string {
    return registro?.created_at || 'No registrada';
  }

  getIpTexto(registro: AuditoriaRegistro | null): string {
    return registro?.ip_origen || 'No registrada';
  }

  getSolicitudTexto(registro: AuditoriaRegistro | null): string {
    if (!registro) {
      return 'No aplica';
    }

    return registro.codigo_solicitud || `Solicitud ID ${registro.solicitud_id || 'No aplica'}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}