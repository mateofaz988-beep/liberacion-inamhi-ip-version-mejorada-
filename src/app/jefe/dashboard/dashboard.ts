import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, UsuarioLogin } from '../../services/auth.service';
import {
  SolicitudAdmin,
  SolicitudesAdminService
} from '../../services/solicitudes-admin.service';

@Component({
  selector: 'app-jefe-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {

  solicitudes: SolicitudAdmin[] = [];
  busqueda = '';

  cargando = false;
  error = '';

  usuario: UsuarioLogin | null = null;

  pendientesCount = 0;
  ultimaActualizacion: Date | null = null;
  hayNuevasSolicitudes = false;

  private prevPendientes = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private solicitudesService: SolicitudesAdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarSolicitudes();
    interval(30_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarSolicitudes(true));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.title = 'INAMHI';
  }

  cargarSolicitudes(silencioso = false): void {
    if (!silencioso) this.cargando = true;
    this.error = '';

    this.solicitudesService.listarMisSolicitudes(this.busqueda.trim()).subscribe({
      next: (response) => {
        this.cargando = false;
        this.solicitudes = response.solicitudes || [];

        this.pendientesCount = this.solicitudes.filter(
          s => s.estado === 'pendiente_jefe_inmediato'
        ).length;

        this.ultimaActualizacion = new Date();

        if (silencioso && this.prevPendientes > 0 && this.pendientesCount > this.prevPendientes) {
          this.hayNuevasSolicitudes = true;
          setTimeout(() => { this.hayNuevasSolicitudes = false; }, 6000);
        }
        this.prevPendientes = this.pendientesCount;

        document.title = this.pendientesCount > 0
          ? `(${this.pendientesCount}) INAMHI — Jefe inmediato`
          : 'INAMHI — Jefe inmediato';
      },
      error: (err) => {
        this.cargando = false;

        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        if (!silencioso) {
          this.error = err.error?.mensaje || 'No se pudieron cargar las solicitudes asignadas.';
        }
      }
    });
  }

  buscar(): void {
    this.cargarSolicitudes();
  }

  limpiar(): void {
    this.busqueda = '';
    this.cargarSolicitudes();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

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
}