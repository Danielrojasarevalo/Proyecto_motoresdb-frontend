import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturasService } from '../services/facturas.service';
import { ClientesService } from '../services/clientes.service';
import { ProductosService } from '../services/productos.service';
import { Factura, DetalleFactura } from '../models/factura.model';
import { Cliente } from '../models/cliente.model';
import { Producto } from '../models/producto.model';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.component.html'
})
export class FacturacionComponent implements OnInit {
  facturas: Factura[] = [];
  clientes: Cliente[] = [];
  productos: Producto[] = [];
  loading = true;
  guardando = false;
  error: string | null = null;
  mostrarFormulario = false;
  facturaEditando: Factura | null = null;

  formulario: Factura = this.nuevoFormulario();
  detalles: DetalleFactura[] = [];

  constructor(
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private productosService: ProductosService,
    private modalService: ModalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarFacturas();
      this.cargarClientes();
      this.cargarProductos();
    } else {
      this.loading = false;
    }
  }

  nuevoFormulario(): Factura {
    const hoy = new Date().toISOString().split('T')[0];
    return {
      numero_factura: 'FAC-' + Date.now().toString().slice(-6),
      cliente: 0,
      fecha_emision: hoy,
      impuestos: '19',
      estado: 'pendiente'
    };
  }

  cargarFacturas(): void {
    this.loading = true;
    this.facturasService.listarFacturas().subscribe({
      next: (data) => { this.facturas = data; this.loading = false; this.cdr.markForCheck(); },
      error: (err) => { console.error(err); this.loading = false; this.cdr.markForCheck(); }
    });
  }

  cargarClientes(): void {
    this.clientesService.listarClientes().subscribe({
      next: (data) => { this.clientes = data; this.cdr.markForCheck(); },
      error: (err) => { console.error(err); this.cdr.markForCheck(); }
    });
  }

  cargarProductos(): void {
    this.productosService.listarProductos().subscribe({
      next: (data) => { this.productos = data; this.cdr.markForCheck(); },
      error: (err) => { console.error(err); this.cdr.markForCheck(); }
    });
  }

  abrirFormulario(): void {
    this.formulario = this.nuevoFormulario();
    this.detalles = [this.nuevoDetalle()];
    this.facturaEditando = null;
    this.error = null;
    this.mostrarFormulario = true;
  }

  editarFactura(factura: Factura): void {
    this.facturaEditando = factura;
    this.formulario = { ...factura };
    this.detalles = factura.detalles ? [...factura.detalles] : [this.nuevoDetalle()];
    this.error = null;
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.facturaEditando = null;
    this.error = null;
  }

  nuevoDetalle(): DetalleFactura {
    return { producto: 0, cantidad: 1, precio_unitario: '0', descuento: '0' };
  }

  onProductoChange(detalle: DetalleFactura): void {
    const productoId = Number(detalle.producto);
    const prod = this.productos.find(p => p.id === productoId);
    if (prod) {
      // Usar precio_venta si existe, si no precio_unitario como fallback
      detalle.precio_unitario = prod.precio_venta || prod.precio_unitario?.toString() || '0';
    }
  }

  agregarDetalle(): void {
    this.detalles.push(this.nuevoDetalle());
  }

  quitarDetalle(i: number): void {
    if (this.detalles.length > 1) this.detalles.splice(i, 1);
  }

  calcularSubtotal(): number {
    return this.detalles.reduce((sum, d) => {
      const precio = parseFloat(d.precio_unitario) || 0;
      const descuento = parseFloat(d.descuento) || 0;
      return sum + (precio * d.cantidad * (1 - descuento / 100));
    }, 0);
  }

  calcularTotal(): number {
    const sub = this.calcularSubtotal();
    const imp = parseFloat(this.formulario.impuestos) || 0;
    return sub * (1 + imp / 100);
  }

  guardarFactura(): void {
    if (!this.formulario.cliente || this.formulario.cliente === 0) {
      this.error = 'Debe seleccionar un cliente.'; return;
    }
    if (!this.formulario.numero_factura?.trim()) {
      this.error = 'El número de factura es obligatorio.'; return;
    }

    this.guardando = true;
    this.error = null;

    // Edición: actualizar campos editables
    if (this.facturaEditando?.id) {
      const estadoAnterior = this.facturaEditando.estado;
      const nuevoEstado = this.formulario.estado;

      const cambios: Partial<Factura> = {
        observaciones: this.formulario.observaciones,
        fecha_vencimiento: this.formulario.fecha_vencimiento,
        cliente: this.formulario.cliente,
      };

      // Si el estado cambió, usar el endpoint cambiar_estado para que el backend descuente inventario
      const guardar$ = estadoAnterior !== nuevoEstado
        ? this.facturasService.cambiarEstado(this.facturaEditando.id, nuevoEstado!)
        : this.facturasService.actualizarParcial(this.facturaEditando.id, cambios);

      guardar$.subscribe({
        next: () => {
          // Si también hay otros cambios además del estado, aplicarlos aparte
          if (estadoAnterior !== nuevoEstado && (cambios.observaciones !== undefined || cambios.fecha_vencimiento || cambios.cliente)) {
            this.facturasService.actualizarParcial(this.facturaEditando!.id!, cambios).subscribe();
          }
          this.guardando = false;
          this.mostrarFormulario = false;
          this.facturaEditando = null;
          this.cargarFacturas();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.guardando = false;
          this.error = err?.error?.error || 'Error al actualizar la factura.';
          console.error('❌ Error:', err);
          this.cdr.markForCheck();
        }
      });
      return;
    }

    // Crear nueva factura
    const detallesValidos = this.detalles.filter(d => d.producto && d.producto !== 0);
    if (detallesValidos.length === 0) {
      this.error = 'Debe agregar al menos un producto.'; this.guardando = false; return;
    }
    const subtotal = this.calcularSubtotal();
    const porcentajeImp = parseFloat(this.formulario.impuestos) || 0;
    const impuestosEnPesos = (subtotal * porcentajeImp / 100).toFixed(2);
    const factura: Factura = { ...this.formulario, impuestos: impuestosEnPesos, detalles: detallesValidos };
    this.facturasService.crearFactura(factura).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.cargarFacturas();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.error = err?.error?.error || 'Error al crear la factura. Verifica los datos.';
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  async eliminarFactura(id: number): Promise<void> {
    const confirmar = await this.modalService.confirm(
      '¿Eliminar esta factura?',
      'Confirmar eliminacion',
      'Eliminar',
      'Cancelar'
    );
    if (!confirmar) return;
    this.facturasService.eliminarFactura(id).subscribe({
      next: () => {
        this.facturas = this.facturas.filter(f => f.id !== id);
        this.cdr.markForCheck();
        this.cargarFacturas();
      },
      error: (err) => {
        this.modalService.alert('Error al eliminar.', 'Error', 'error');
        console.error(err);
        this.cdr.markForCheck();
      }
    });
  }

  get totalVentas(): string {
    const total = this.facturas.reduce((sum, f) => {
      const valor = typeof f.total === 'string' ? parseFloat(f.total) : (f.total || 0);
      return sum + valor;
    }, 0);
    return total.toString();
  }

  get facturasPendientes(): number {
    return this.facturas.filter(f => f.estado === 'pendiente').length;
  }

  get facturasPagadas(): number {
    return this.facturas.filter(f => f.estado === 'pagada').length;
  }

  formatearPrecio(precio: string | number): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-CO');
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  getBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'pendiente': 'bg-amber-100 text-amber-700',
      'pagada': 'bg-emerald-100 text-emerald-700',
      'cancelada': 'bg-red-100 text-red-700',
      'vencida': 'bg-gray-100 text-gray-700'
    };
    return clases[estado] || 'bg-gray-100 text-gray-700';
  }

  descargarPDF(factura: Factura): void {
    const generarPDF = async (f: Factura) => {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const margen = 15;
      const ancho = doc.internal.pageSize.getWidth();
      let y = margen;

      // === HEADER VILLAMAR ===
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, ancho, 32, 'F');
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 32, ancho, 3, 'F');

      // Icono circular con iniciales VM
      doc.setFillColor(59, 130, 246);
      doc.circle(margen + 11, 16, 11, 'F');
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.6);
      doc.circle(margen + 11, 16, 11, 'S');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('VM', margen + 11, 18.5, { align: 'center' });

      // Nombre y subtítulo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('VillaMar Inventarios', margen + 26, 13);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Inventario para Tienda VillaMar', margen + 26, 21);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURA DE VENTA', ancho - margen, 19, { align: 'right' });
      y = 43;

      // Número de factura y chip de estado
      doc.setTextColor(21, 128, 61);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(f.numero_factura || '', margen, y);

      const estado = f.estado || 'pendiente';
      const estadoColores: Record<string, [number, number, number]> = {
        'pagada':    [22, 163, 74],
        'pendiente': [202, 138, 4],
        'cancelada': [220, 38, 38],
        'vencida':   [107, 114, 128],
      };
      const [cr, cg, cb] = estadoColores[estado] || [107, 114, 128];
      const label = estado.toUpperCase();
      const chipW = label.length * 2.2 + 7;
      doc.setFillColor(cr, cg, cb);
      doc.roundedRect(ancho - margen - chipW, y - 6, chipW, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(label, ancho - margen - chipW / 2, y - 0.5, { align: 'center' });
      y += 8;

      // Línea separadora
      doc.setDrawColor(134, 239, 172);
      doc.setLineWidth(0.4);
      doc.line(margen, y, ancho - margen, y);
      y += 7;

      // Datos cliente / fechas
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE', margen, y);
      doc.text('FECHA EMISIÓN', 90, y);
      if (f.fecha_vencimiento) doc.text('VENCIMIENTO', 140, y);
      y += 5;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(f.cliente_nombre || String(f.cliente), margen, y);
      doc.text(this.formatearFecha(f.fecha_emision), 90, y);
      if (f.fecha_vencimiento) doc.text(this.formatearFecha(f.fecha_vencimiento), 140, y);
      y += 12;

      // Cabecera tabla
      doc.setFillColor(240, 253, 244);
      doc.rect(margen, y - 5, ancho - margen * 2, 10, 'F');
      doc.setDrawColor(134, 239, 172);
      doc.setLineWidth(0.3);
      doc.rect(margen, y - 5, ancho - margen * 2, 10, 'S');
      doc.setTextColor(21, 128, 61);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCTO', margen + 2, y);
      doc.text('CANT.', 110, y, { align: 'right' });
      doc.text('P. UNIT.', 140, y, { align: 'right' });
      doc.text('DESC.', 160, y, { align: 'right' });
      doc.text('SUBTOTAL', ancho - margen, y, { align: 'right' });
      y += 7;

      // Filas de productos
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      const detalles = f.detalles || [];
      for (let i = 0; i < detalles.length; i++) {
        const d = detalles[i];
        if (i % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margen, y - 4, ancho - margen * 2, 7, 'F');
        }
        const precio = parseFloat(d.precio_unitario) || 0;
        const desc = parseFloat(d.descuento) || 0;
        const sub = precio * d.cantidad * (1 - desc / 100);
        doc.text(d.producto_nombre || String(d.producto), margen + 2, y);
        doc.text(String(d.cantidad), 110, y, { align: 'right' });
        doc.text('$' + this.formatearPrecio(precio), 140, y, { align: 'right' });
        doc.text(desc > 0 ? desc + '%' : '-', 160, y, { align: 'right' });
        doc.text('$' + this.formatearPrecio(sub), ancho - margen, y, { align: 'right' });
        y += 7;
      }

      y += 3;
      doc.setDrawColor(134, 239, 172);
      doc.line(margen, y, ancho - margen, y);
      y += 7;

      // Caja de totales
      const subtotalNum = typeof f.subtotal === 'string' ? parseFloat(f.subtotal) : (f.subtotal || 0);
      const impuestosNum = typeof f.impuestos === 'string' ? parseFloat(f.impuestos) : (f.impuestos || 0);
      const totalNum = typeof f.total === 'string' ? parseFloat(f.total) : (f.total || 0);

      doc.setFillColor(240, 253, 244);
      doc.roundedRect(100, y - 3, ancho - 100 - margen, 32, 3, 3, 'F');
      doc.setDrawColor(134, 239, 172);
      doc.roundedRect(100, y - 3, ancho - 100 - margen, 32, 3, 3, 'S');

      doc.setTextColor(75, 85, 99);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 140, y + 3, { align: 'right' });
      doc.text('$' + this.formatearPrecio(subtotalNum), ancho - margen - 2, y + 3, { align: 'right' });
      y += 9;
      doc.text('Impuestos (IVA):', 140, y + 3, { align: 'right' });
      doc.text('$' + this.formatearPrecio(impuestosNum), ancho - margen - 2, y + 3, { align: 'right' });
      y += 9;
      doc.setDrawColor(134, 239, 172);
      doc.line(103, y + 1, ancho - margen - 2, y + 1);
      y += 5;
      doc.setTextColor(21, 128, 61);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', 140, y, { align: 'right' });
      doc.text('$' + this.formatearPrecio(totalNum), ancho - margen - 2, y, { align: 'right' });
      y += 16;

      // Observaciones
      if (f.observaciones) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margen, y - 3, ancho - margen * 2, 12, 2, 2, 'F');
        doc.text('Observaciones: ' + f.observaciones, margen + 3, y + 3);
      }

      // Pie de página
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 279, ancho, 18, 'F');
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 277, ancho, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'VillaMar Inventarios    Sistema de Inventario para Tienda VillaMar    ' + new Date().toLocaleDateString('es-CO'),
        ancho / 2, 290, { align: 'center' }
      );

      doc.save((f.numero_factura || 'factura') + '.pdf');
    };

    // Si ya tiene detalles y subtotal, generar directo; si no, cargar la factura completa
    if (factura.detalles && factura.detalles.length > 0) {
      generarPDF(factura);
    } else if (factura.id) {
      this.facturasService.obtenerFactura(factura.id).subscribe({
        next: (f) => generarPDF(f),
        error: () => generarPDF(factura) // fallback con datos parciales
      });
    } else {
      generarPDF(factura);
    }
  }
}
