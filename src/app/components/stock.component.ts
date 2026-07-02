import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientosService } from '../services/movimientos.service';
import { ProductosService } from '../services/productos.service';
import { ProveedoresService } from '../services/proveedores.service';
import { Movimiento } from '../models/movimiento.model';
import { Producto } from '../models/producto.model';
import { Proveedor } from '../models/proveedor.model';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.component.html'
})
export class StockComponent implements OnInit {
  movimientosRecientes: Movimiento[] = [];
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  productoSeleccionado: Producto | null = null;
  
  loading = true;
  guardando = false;
  
  nuevoMovimiento: any = {
    producto: 0,
    tipo_movimiento: 'entrada',
    cantidad: 0,
    fecha_movimiento: new Date().toISOString().split('T')[0],
    proveedor: 0,
    referencia: '',
    observaciones: '',
    usuario_responsable: 'Sistema'
  };

  constructor(
    private movimientosService: MovimientosService,
    private productosService: ProductosService,
    private proveedoresService: ProveedoresService,
    private modalService: ModalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatos();
    } else {
      this.loading = false;
    }
  }

  cargarDatos(): void {
    this.cargarMovimientos();
    this.cargarProductos();
    this.cargarProveedores();
  }

  cargarMovimientos(): void {
    this.loading = true;
    this.movimientosService.movimientosRecientes().subscribe({
      next: (data) => {
        this.movimientosRecientes = Array.isArray(data) ? data : [];
        this.loading = false;
        console.log('✅ Movimientos cargados:', this.movimientosRecientes);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar movimientos:', err);
        this.movimientosRecientes = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargarProductos(): void {
    this.productosService.listarProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : [];
        console.log('✅ Productos cargados:', this.productos);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar productos:', err);
        this.productos = [];
        this.cdr.markForCheck();
      }
    });
  }

  cargarProveedores(): void {
    this.proveedoresService.listarProveedores().subscribe({
      next: (data) => {
        this.proveedores = Array.isArray(data) ? data : [];
        console.log('✅ Proveedores cargados:', this.proveedores);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar proveedores:', err);
        this.proveedores = [];
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarProducto(productoId: number): void {
    this.productoSeleccionado = this.productos.find(p => p.id === productoId) || null;
  }

  async registrarMovimiento(): Promise<void> {
    // Validaciones
    if (this.nuevoMovimiento.producto === 0) {
      this.modalService.alert('Por favor selecciona un producto', 'Campos requeridos', 'warning');
      return;
    }

    if (this.nuevoMovimiento.cantidad <= 0) {
      this.modalService.alert('La cantidad debe ser mayor a 0', 'Validacion', 'warning');
      return;
    }

    // Validar si hay stock suficiente para salidas
    if (this.nuevoMovimiento.tipo_movimiento === 'salida' && this.productoSeleccionado) {
      if (this.nuevoMovimiento.cantidad > this.productoSeleccionado.stock_actual) {
        const confirmar = await this.modalService.confirm(
          `La cantidad excede el stock actual (${this.productoSeleccionado.stock_actual}). ¿Deseas continuar?`,
          'Advertencia de stock',
          'Continuar',
          'Cancelar'
        );
        if (!confirmar) {
          return;
        }
      }
    }

    this.guardando = true;

    const movimiento: Movimiento = {
      producto: this.nuevoMovimiento.producto,
      tipo_movimiento: this.nuevoMovimiento.tipo_movimiento,
      cantidad: this.nuevoMovimiento.cantidad,
      fecha_movimiento: this.nuevoMovimiento.fecha_movimiento,
      proveedor: this.nuevoMovimiento.proveedor || undefined,
      referencia: this.nuevoMovimiento.referencia || undefined,
      observaciones: this.nuevoMovimiento.observaciones || undefined,
      usuario_responsable: this.nuevoMovimiento.usuario_responsable
    };

    this.movimientosService.crearMovimiento(movimiento).subscribe({
      next: (data) => {
        console.log('✅ Movimiento registrado:', data);
        this.modalService.alert('Movimiento registrado exitosamente', 'Operacion exitosa', 'success');
        
        // Recargar datos
        this.cargarMovimientos();
        this.cargarProductos();
        
        // Limpiar formulario
        this.nuevoMovimiento = {
          producto: 0,
          tipo_movimiento: 'entrada',
          cantidad: 0,
          fecha_movimiento: new Date().toISOString().split('T')[0],
          proveedor: 0,
          referencia: '',
          observaciones: '',
          usuario_responsable: 'Sistema'
        };
        this.productoSeleccionado = null;
        this.guardando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.modalService.alert('Error al registrar el movimiento. Verifica los datos e intenta nuevamente.', 'Error', 'error');
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
