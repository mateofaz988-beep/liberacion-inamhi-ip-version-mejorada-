import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.scss'
})
export class PdfViewerComponent implements OnChanges {

  @Input() url = '';
  @Input() titulo = 'Documento';
  @Output() cerrar = new EventEmitter<void>();

  urlSegura: SafeResourceUrl = '';
  cargando = true;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    this.cargando = true;
    this.urlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  onIframeLoad(): void {
    this.cargando = false;
  }

  descargar(): void {
    const a = document.createElement('a');
    a.href = this.url;
    a.download = `${this.titulo}.pdf`;
    a.target = '_blank';
    a.click();
  }

  cerrarVisor(): void {
    this.cerrar.emit();
  }
}
