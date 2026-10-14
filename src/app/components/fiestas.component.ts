import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiestasService } from '../services/fiestas.service';
import { ReservaFiesta, EstadoFiesta } from '../models/fiesta.model';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-fiestas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fiestas.component.html'
})
export class FiestasComponent implements OnInit {
  fiestas: ReservaFiesta[] = [];
  loading = true;
  guardando = false;
  error: string | null = null;
  modoEdicion = false;
  filtroEstado: '' | EstadoFiesta = '';
  mostrarPasadas = false;

  estados: { valor: EstadoFiesta; etiqueta: string }[] = [
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'confirmada', etiqueta: 'Confirmada' },
    { valor: 'realizada', etiqueta: 'Realizada' },
    { valor: 'cancelada', etiqueta: 'Cancelada' }
  ];

  nuevaFiesta: Partial<ReservaFiesta> = this.fiestaVacia();

  constructor(
    private fiestasService: FiestasService,
    private modalService: ModalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Solo cargar datos en el navegador, no en SSR
    if (isPlatformBrowser(this.platformId)) {
      this.cargarFiestas();
    } else {
      this.loading = false;
    }
  }

  private fiestaVacia(): Partial<ReservaFiesta> {
    return {
      nombre_cliente: '',
      telefono: '',
      tipo_evento: '',
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      numero_personas: null,
      precio: '',
      abono: 0,
      descripcion: '',
      estado: 'pendiente'
    };
  }

  private hoy(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  get fiestasFiltradas(): ReservaFiesta[] {
    const hoy = this.hoy();
    return this.fiestas.filter(f =>
      (!this.filtroEstado || f.estado === this.filtroEstado) &&
      (this.mostrarPasadas || f.fecha >= hoy)
    );
  }

  get totalPorCobrar(): number {
    return this.fiestasFiltradas
      .filter(f => f.estado !== 'cancelada')
      .reduce((total, f) => total + Number(f.saldo || 0), 0);
  }

  get totalFiestas(): number {
    return this.fiestasFiltradas
      .filter(f => f.estado !== 'cancelada')
      .reduce((total, f) => total + Number(f.precio || 0), 0);
  }

  cargarFiestas(): void {
    this.loading = true;
    this.error = null;

    this.fiestasService.listarFiestas().subscribe({
      next: (data) => {
        this.fiestas = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar las fiestas. Verifica la conexión con el servidor.';
        this.fiestas = [];
        this.loading = false;
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  guardarFiesta(): void {
    const f = this.nuevaFiesta;
    if (!f.nombre_cliente?.trim() || !f.fecha || f.precio === '' || f.precio === null || f.precio === undefined) {
      this.modalService.alert('Nombre del cliente, fecha y precio son obligatorios', 'Campos requeridos', 'warning');
      return;
    }
    if (Number(f.abono || 0) > Number(f.precio)) {
      this.modalService.alert('El abono no puede ser mayor que el precio', 'Revisa los valores', 'warning');
      return;
    }

    // El backend espera null en los campos opcionales vacíos
    const datos = {
      ...f,
      hora_inicio: f.hora_inicio || null,
      hora_fin: f.hora_fin || null,
      numero_personas: f.numero_personas || null,
      abono: f.abono || 0
    } as ReservaFiesta;

    this.guardando = true;
    this.error = null;

    const operacion = this.modoEdicion && f.id
      ? this.fiestasService.actualizarFiesta(f.id, datos)
      : this.fiestasService.crearFiesta(datos);

    operacion.subscribe({
      next: () => {
        this.modalService.alert(
          `Fiesta ${this.modoEdicion ? 'actualizada' : 'agendada'} correctamente`, 'Listo', 'success'
        );
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarFiestas();
        this.cdr.markForCheck();
      },
      error: (err) => {
        const detalle = err?.error ? Object.values(err.error).flat().join(' ') : '';
        this.error = `Error al ${this.modoEdicion ? 'actualizar' : 'agendar'} la fiesta. ${detalle}`;
        this.guardando = false;
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  editarFiesta(fiesta: ReservaFiesta): void {
    this.nuevaFiesta = {
      ...fiesta,
      hora_inicio: fiesta.hora_inicio?.slice(0, 5) || '',
      hora_fin: fiesta.hora_fin?.slice(0, 5) || ''
    };
    this.modoEdicion = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cambiarEstado(fiesta: ReservaFiesta, estado: EstadoFiesta): void {
    if (!fiesta.id) return;
    this.fiestasService.actualizarParcial(fiesta.id, { estado }).subscribe({
      next: (actualizada) => {
        Object.assign(fiesta, actualizada);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.modalService.alert('No se pudo cambiar el estado', 'Error', 'error');
        console.error('❌ Error:', err);
      }
    });
  }

  async eliminarFiesta(id: number): Promise<void> {
    const confirmar = await this.modalService.confirm(
      '¿Estas seguro de eliminar esta fiesta? Esta accion no se puede deshacer.',
      'Confirmar eliminacion',
      'Eliminar',
      'Cancelar'
    );
    if (!confirmar) {
      return;
    }

    this.fiestasService.eliminarFiesta(id).subscribe({
      next: () => {
        this.fiestas = this.fiestas.filter(f => f.id !== id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.modalService.alert('Error al eliminar la fiesta', 'Error', 'error');
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  claseEstado(estado: EstadoFiesta): string {
    switch (estado) {
      case 'confirmada': return 'bg-emerald-100 text-emerald-700';
      case 'realizada': return 'bg-slate-200 text-slate-700';
      case 'cancelada': return 'bg-rose-100 text-rose-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  }

  formatearPrecio(valor: string | number | null | undefined): string {
    const numero = Number(valor);
    return isNaN(numero) ? '0' : numero.toLocaleString('es-CO');
  }

  formatearFecha(fecha: string): string {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  limpiarFormulario(): void {
    this.nuevaFiesta = this.fiestaVacia();
    this.modoEdicion = false;
    this.error = null;
  }
}
