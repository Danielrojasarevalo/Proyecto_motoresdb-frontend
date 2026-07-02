import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedoresService } from '../services/proveedores.service';
import { Proveedor } from '../models/proveedor.model';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html'
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  loading = true;
  guardando = false;
  error: string | null = null;
  mostrarFormulario = false;
  modoEdicion = false;

  formulario: Proveedor = this.nuevoFormulario();

  constructor(
    private proveedoresService: ProveedoresService,
    private modalService: ModalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarProveedores();
    } else {
      this.loading = false;
    }
  }

  nuevoFormulario(): Proveedor {
    return { nombre: '', email: '', telefono: '', direccion: '', estado: 'activo' };
  }

  cargarProveedores(): void {
    this.loading = true;
    this.proveedoresService.listarProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar proveedores:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirFormulario(): void {
    this.formulario = this.nuevoFormulario();
    this.modoEdicion = false;
    this.error = null;
    this.mostrarFormulario = true;
  }

  editarProveedor(proveedor: Proveedor): void {
    this.formulario = { ...proveedor };
    this.modoEdicion = true;
    this.error = null;
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.formulario = this.nuevoFormulario();
    this.modoEdicion = false;
    this.error = null;
  }

  guardarProveedor(): void {
    if (!this.formulario.nombre?.trim()) {
      this.error = 'El nombre del proveedor es obligatorio.';
      return;
    }
    if (!this.formulario.email?.trim()) {
      this.error = 'El email es obligatorio.';
      return;
    }

    this.guardando = true;
    this.error = null;

    const op = this.modoEdicion && this.formulario.id
      ? this.proveedoresService.actualizarProveedor(this.formulario.id, this.formulario)
      : this.proveedoresService.crearProveedor(this.formulario);

    op.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.formulario = this.nuevoFormulario();
        this.modoEdicion = false;
        this.cargarProveedores();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.error = 'Error al guardar el proveedor. Intenta nuevamente.';
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  async eliminarProveedor(id: number): Promise<void> {
    const confirmar = await this.modalService.confirm(
      '¿Eliminar este proveedor? Esta accion no se puede deshacer.',
      'Confirmar eliminacion',
      'Eliminar',
      'Cancelar'
    );
    if (!confirmar) return;
    this.proveedoresService.eliminarProveedor(id).subscribe({
      next: () => {
        this.proveedores = this.proveedores.filter(p => p.id !== id);
        this.cdr.markForCheck();
        this.cargarProveedores();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Error al eliminar el proveedor.';
        this.modalService.alert(msg, 'Error', 'error');
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  getBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'activo': 'bg-emerald-100 text-emerald-700',
      'inactivo': 'bg-gray-100 text-gray-700',
      'pendiente': 'bg-amber-100 text-amber-700'
    };
    return clases[estado] || 'bg-gray-100 text-gray-700';
  }
}
