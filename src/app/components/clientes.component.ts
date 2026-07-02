import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../services/clientes.service';
import { Cliente } from '../models/cliente.model';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  loading = true;
  guardando = false;
  error: string | null = null;
  mostrarFormulario = false;
  modoEdicion = false;

  formulario: Cliente = this.nuevoFormulario();

  constructor(
    private clientesService: ClientesService,
    private modalService: ModalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarClientes();
    } else {
      this.loading = false;
    }
  }

  nuevoFormulario(): Cliente {
    return { nombre: '', tipo_cliente: 'particular', email: '', telefono: '', direccion: '', nit: '' };
  }

  cargarClientes(): void {
    this.loading = true;
    this.error = null;
    this.clientesService.listarClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar clientes:', err);
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

  editarCliente(cliente: Cliente): void {
    this.formulario = { ...cliente };
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

  guardarCliente(): void {
    if (!this.formulario.nombre?.trim()) {
      this.error = 'El nombre es obligatorio.';
      return;
    }
    if (!this.formulario.email?.trim()) {
      this.error = 'El email es obligatorio.';
      return;
    }

    this.guardando = true;
    this.error = null;

    const op = this.modoEdicion && this.formulario.id
      ? this.clientesService.actualizarCliente(this.formulario.id, this.formulario)
      : this.clientesService.crearCliente(this.formulario);

    op.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.formulario = this.nuevoFormulario();
        this.modoEdicion = false;
        this.cargarClientes();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.error = 'Error al guardar el cliente. Verifica los datos.';
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  async eliminarCliente(id: number): Promise<void> {
    const confirmar = await this.modalService.confirm(
      '¿Eliminar este cliente? Esta accion no se puede deshacer.',
      'Confirmar eliminacion',
      'Eliminar',
      'Cancelar'
    );
    if (!confirmar) return;
    this.clientesService.eliminarCliente(id).subscribe({
      next: () => {
        this.clientes = this.clientes.filter(c => c.id !== id);
        this.cdr.markForCheck();
        this.cargarClientes();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Error al eliminar el cliente.';
        this.modalService.alert(msg, 'Error', 'error');
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  getBadgeClass(tipo: string): string {
    const clases: { [key: string]: string } = {
      'cooperativa': 'bg-blue-100 text-blue-700',
      'finca': 'bg-emerald-100 text-emerald-700',
      'empresa': 'bg-purple-100 text-purple-700',
      'particular': 'bg-amber-100 text-amber-700'
    };
    return clases[tipo] || 'bg-gray-100 text-gray-700';
  }
}
