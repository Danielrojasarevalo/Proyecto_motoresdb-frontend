import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GlampingsService } from '../services/glampings.service';
import { Glamping, GlampingImagen, GlampingPrecio } from '../models/glamping.model';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-glampings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './glampings.component.html'
})
export class GlampingsComponent implements OnInit {
  glampings: Glamping[] = [];
  loading = true;
  guardando = false;
  error: string | null = null;
  modoEdicion = false;

  nuevoGlamping: Glamping = this.glampingVacio();
  // Imágenes nuevas elegidas en el formulario (se suben al guardar)
  archivosNuevos: { archivo: File; vistaPrevia: string }[] = [];
  imagenAmpliada: string | null = null;

  constructor(
    private glampingsService: GlampingsService,
    private modalService: ModalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Solo cargar datos en el navegador, no en SSR
    if (isPlatformBrowser(this.platformId)) {
      this.cargarGlampings();
    } else {
      this.loading = false;
    }
  }

  private glampingVacio(): Glamping {
    return {
      nombre: '',
      descripcion: '',
      capacidad: null,
      activo: true,
      precios: [{ concepto: '', precio: '' }],
      imagenes: []
    };
  }

  cargarGlampings(): void {
    this.loading = true;
    this.error = null;

    this.glampingsService.listarGlampings().subscribe({
      next: (data) => {
        this.glampings = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar los glampings. Verifica la conexión con el servidor.';
        this.glampings = [];
        this.loading = false;
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  agregarPrecio(): void {
    this.nuevoGlamping.precios.push({ concepto: '', precio: '' });
  }

  quitarPrecio(index: number): void {
    this.nuevoGlamping.precios.splice(index, 1);
  }

  seleccionarImagenes(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivos = Array.from(input.files || []);
    archivos
      .filter(archivo => archivo.type.startsWith('image/'))
      .forEach(archivo => {
        this.archivosNuevos.push({ archivo, vistaPrevia: URL.createObjectURL(archivo) });
      });
    // Permite volver a elegir el mismo archivo
    input.value = '';
  }

  quitarArchivoNuevo(index: number): void {
    URL.revokeObjectURL(this.archivosNuevos[index].vistaPrevia);
    this.archivosNuevos.splice(index, 1);
  }

  async eliminarImagenGuardada(imagen: GlampingImagen): Promise<void> {
    if (!this.nuevoGlamping.id) return;
    const confirmar = await this.modalService.confirm(
      '¿Eliminar esta imagen del glamping?', 'Confirmar eliminacion', 'Eliminar', 'Cancelar'
    );
    if (!confirmar) return;

    const glampingId = this.nuevoGlamping.id;
    this.glampingsService.eliminarImagen(glampingId, imagen.id).subscribe({
      next: () => {
        this.nuevoGlamping.imagenes = (this.nuevoGlamping.imagenes || []).filter(i => i.id !== imagen.id);
        const enLista = this.glampings.find(g => g.id === glampingId);
        if (enLista) {
          enLista.imagenes = (enLista.imagenes || []).filter(i => i.id !== imagen.id);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.modalService.alert('No se pudo eliminar la imagen', 'Error', 'error');
        console.error('❌ Error:', err);
      }
    });
  }

  guardarGlamping(): void {
    if (!this.nuevoGlamping.nombre?.trim()) {
      this.modalService.alert('El nombre del glamping es obligatorio', 'Campos requeridos', 'warning');
      return;
    }

    // Solo se envían los precios que tengan concepto y valor
    const precios: GlampingPrecio[] = this.nuevoGlamping.precios
      .filter(p => p.concepto?.trim() && p.precio !== '' && p.precio !== null && p.precio !== undefined)
      .map(p => ({ concepto: p.concepto.trim(), precio: p.precio }));

    if (precios.length === 0) {
      this.modalService.alert('Agrega al menos un precio (concepto y valor)', 'Campos requeridos', 'warning');
      return;
    }

    const datos: Glamping = {
      nombre: this.nuevoGlamping.nombre,
      descripcion: this.nuevoGlamping.descripcion,
      capacidad: this.nuevoGlamping.capacidad || null,
      activo: this.nuevoGlamping.activo,
      precios
    };

    this.guardando = true;
    this.error = null;

    const operacion = this.modoEdicion && this.nuevoGlamping.id
      ? this.glampingsService.actualizarGlamping(this.nuevoGlamping.id, datos)
      : this.glampingsService.crearGlamping(datos);

    const archivos = this.archivosNuevos.map(a => a.archivo);
    operacion.pipe(
      switchMap((guardado): Observable<unknown> =>
        archivos.length && guardado.id
          ? this.glampingsService.subirImagenes(guardado.id, archivos)
          : of(null)
      )
    ).subscribe({
      next: () => {
        this.modalService.alert(
          `Glamping ${this.modoEdicion ? 'actualizado' : 'creado'} correctamente`, 'Listo', 'success'
        );
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarGlampings();
        this.cdr.markForCheck();
      },
      error: (err) => {
        const detalle = err?.error ? JSON.stringify(err.error) : '';
        this.error = `Error al guardar el glamping. ${detalle}`;
        this.guardando = false;
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  editarGlamping(glamping: Glamping): void {
    this.limpiarFormulario();
    this.nuevoGlamping = {
      ...glamping,
      precios: glamping.precios.length
        ? glamping.precios.map(p => ({ ...p }))
        : [{ concepto: '', precio: '' }],
      imagenes: [...(glamping.imagenes || [])]
    };
    this.modoEdicion = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async eliminarGlamping(id: number): Promise<void> {
    const confirmar = await this.modalService.confirm(
      '¿Estas seguro de eliminar este glamping con sus precios e imágenes? Esta accion no se puede deshacer.',
      'Confirmar eliminacion',
      'Eliminar',
      'Cancelar'
    );
    if (!confirmar) {
      return;
    }

    this.glampingsService.eliminarGlamping(id).subscribe({
      next: () => {
        this.glampings = this.glampings.filter(g => g.id !== id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.modalService.alert('Error al eliminar el glamping', 'Error', 'error');
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  formatearPrecio(valor: string | number | null | undefined): string {
    const numero = Number(valor);
    return isNaN(numero) ? '0' : numero.toLocaleString('es-CO');
  }

  limpiarFormulario(): void {
    this.archivosNuevos.forEach(a => URL.revokeObjectURL(a.vistaPrevia));
    this.archivosNuevos = [];
    this.nuevoGlamping = this.glampingVacio();
    this.modoEdicion = false;
    this.error = null;
  }
}
