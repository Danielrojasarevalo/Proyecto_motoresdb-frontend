import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../services/productos.service';
import { ClientesService } from '../services/clientes.service';
import { FacturasService } from '../services/facturas.service';
import { ModalService } from '../services/modal.service';
import { Producto } from '../models/producto.model';
import { Cliente } from '../models/cliente.model';
import { Factura, DetalleFactura } from '../models/factura.model';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html'
})
export class VentaComponent implements OnInit {
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  searchTerm = '';
  cantidades: Record<string, number> = {};
  loading = true;
  guardando = false;
  clienteConsumidorId: number | null = null;
  pedido: { producto: Producto; cantidad: number }[] = [];
  readonly porcentajeIva = 19;

  key(id: number | string | undefined): string {
    return id != null ? String(id) : '';
  }

  valorNumero(valor: string | number | undefined): number {
    if (valor == null || valor === '') return 0;
    return typeof valor === 'number' ? valor : parseFloat(valor.toString().replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
  }

  constructor(
    private productosService: ProductosService,
    private clientesService: ClientesService,
    private facturasService: FacturasService,
    private modalService: ModalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarProductos();
      this.prepararClienteConsumidorFinal();
    } else {
      this.loading = false;
    }
  }

  cargarProductos(): void {
    this.loading = true;
    this.productosService.listarProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.filteredProductos = data;
        this.cantidades = this.productos.reduce((acc, producto) => {
          if (producto.id != null) acc[String(producto.id)] = 1;
          return acc;
        }, {} as Record<string, number>);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar productos:', err);
        this.modalService.alert('No se pudieron cargar los productos.', 'Error', 'error');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  aplicarFiltro(): void {
    const filtro = this.searchTerm.trim().toLowerCase();
    if (!filtro) {
      this.filteredProductos = [...this.productos];
      return;
    }

    this.filteredProductos = this.productos.filter((producto) => {
      const nombre = producto.nombre?.toLowerCase() || '';
      const descripcion = producto.descripcion?.toLowerCase() || '';
      const codigo = producto.codigo_producto?.toLowerCase() || '';
      return nombre.includes(filtro) || descripcion.includes(filtro) || codigo.includes(filtro);
    });
  }

  prepararClienteConsumidorFinal(): void {
    this.clientesService.listarClientes().subscribe({
      next: (clientes) => {
        const clienteExistente = clientes.find((cliente) =>
          cliente.nombre?.toLowerCase().trim() === 'consumidor final'
        );
        if (clienteExistente?.id) {
          this.clienteConsumidorId = clienteExistente.id;
        } else {
          this.crearClienteConsumidorFinal();
        }
      },
      error: (err) => {
        console.warn('⚠️ No se pudo revisar cliente Consumidor final:', err);
        this.crearClienteConsumidorFinal();
      }
    });
  }

  crearClienteConsumidorFinal(): void {
    const cliente: Cliente = {
      nombre: 'Consumidor final',
      tipo_cliente: 'particular',
      email: 'consumidor.final@villamar.com',
      telefono: '0000000000',
      direccion: 'Venta rápida',
      nit: 'C/F'
    };

    this.clientesService.crearCliente(cliente).subscribe({
      next: (nuevoCliente) => {
        this.clienteConsumidorId = nuevoCliente.id || null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al crear cliente Consumidor final:', err);
        this.modalService.alert('No se pudo preparar el cliente Consumidor final.', 'Error', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  ventaRapida(producto: Producto): void {
    if (!producto.id) {
      this.modalService.alert('Producto inválido.', 'Error', 'error');
      return;
    }
    const cantidad = Number(this.cantidades[String(producto.id)] ?? 1);
    if (cantidad <= 0) {
      this.modalService.alert('Debe ingresar una cantidad válida.', 'Error', 'error');
      return;
    }
    if (producto.stock_actual != null && cantidad > producto.stock_actual) {
      this.modalService.alert(`No hay suficiente stock. Máximo disponible: ${producto.stock_actual}`, 'Error', 'error');
      return;
    }
    if (!this.clienteConsumidorId) {
      this.modalService.alert('No existe el cliente Consumidor final. Intenta de nuevo más tarde.', 'Error', 'error');
      return;
    }

    this.guardando = true;

    const precio = this.precioProducto(producto);
    const detalle: DetalleFactura = {
      producto: producto.id,
      cantidad,
      precio_unitario: producto.precio_venta || producto.precio_unitario,
      descuento: '0'
    };

    const factura: Factura = {
      numero_factura: `VEN-${Date.now().toString().slice(-6)}`,
      cliente: this.clienteConsumidorId,
      fecha_emision: new Date().toISOString().split('T')[0],
      // El IVA se envía en pesos, igual que en Facturación
      impuestos: this.calcularIva(precio * cantidad).toFixed(2),
      estado: 'pagada',
      detalles: [detalle]
    };

    this.facturasService.crearFactura(factura).subscribe({
      next: (created) => {
        this.guardando = false;
        this.modalService.alert(
          `Factura rápida ${created.numero_factura} creada para Consumidor final (${cantidad} unidad${cantidad > 1 ? 'es' : ''}).`,
          'Venta exitosa',
          'success'
        );
        this.cargarProductos();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al crear factura rápida:', err);
        this.modalService.alert(
          'No se pudo crear la factura rápida. Verifica el stock o intenta nuevamente.',
          'Error',
          'error'
        );
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ===== Pedido con varios productos =====

  precioProducto(producto: Producto): number {
    return this.valorNumero(producto.precio_venta || producto.precio_unitario);
  }

  calcularIva(subtotal: number): number {
    return subtotal * this.porcentajeIva / 100;
  }

  cantidadEnPedido(productoId: number | undefined): number {
    return this.pedido.find((item) => item.producto.id === productoId)?.cantidad ?? 0;
  }

  agregarAlPedido(producto: Producto): void {
    if (!producto.id) {
      this.modalService.alert('Producto inválido.', 'Error', 'error');
      return;
    }
    const cantidad = Number(this.cantidades[String(producto.id)] ?? 1);
    if (cantidad <= 0) {
      this.modalService.alert('Debe ingresar una cantidad válida.', 'Error', 'error');
      return;
    }
    const nuevaCantidad = this.cantidadEnPedido(producto.id) + cantidad;
    if (producto.stock_actual != null && nuevaCantidad > producto.stock_actual) {
      this.modalService.alert(`No hay suficiente stock. Máximo disponible: ${producto.stock_actual}`, 'Error', 'error');
      return;
    }

    const existente = this.pedido.find((item) => item.producto.id === producto.id);
    if (existente) {
      existente.cantidad = nuevaCantidad;
    } else {
      this.pedido.push({ producto, cantidad });
    }
    this.cdr.markForCheck();
  }

  cambiarCantidadPedido(index: number, cantidad: number): void {
    const item = this.pedido[index];
    if (!item) return;
    const valor = Math.floor(Number(cantidad) || 0);
    if (valor <= 0) {
      this.quitarDelPedido(index);
      return;
    }
    item.cantidad = Math.min(valor, item.producto.stock_actual ?? valor);
  }

  quitarDelPedido(index: number): void {
    this.pedido.splice(index, 1);
  }

  vaciarPedido(): void {
    this.pedido = [];
  }

  get subtotalPedido(): number {
    return this.pedido.reduce((total, item) => total + this.precioProducto(item.producto) * item.cantidad, 0);
  }

  get ivaPedido(): number {
    return this.calcularIva(this.subtotalPedido);
  }

  get totalPedido(): number {
    return this.subtotalPedido + this.ivaPedido;
  }

  registrarPedido(): void {
    if (!this.pedido.length) {
      this.modalService.alert('Agrega al menos un producto al pedido.', 'Pedido vacío', 'warning');
      return;
    }
    if (!this.clienteConsumidorId) {
      this.modalService.alert('No existe el cliente Consumidor final. Intenta de nuevo más tarde.', 'Error', 'error');
      return;
    }

    this.guardando = true;

    const detalles: DetalleFactura[] = this.pedido.map((item) => ({
      producto: item.producto.id!,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio_venta || item.producto.precio_unitario,
      descuento: '0'
    }));

    const factura: Factura = {
      numero_factura: `PED-${Date.now().toString().slice(-6)}`,
      cliente: this.clienteConsumidorId,
      fecha_emision: new Date().toISOString().split('T')[0],
      impuestos: this.ivaPedido.toFixed(2),
      estado: 'pagada',
      observaciones: 'Pedido de tienda',
      detalles
    };

    this.facturasService.crearFactura(factura).subscribe({
      next: (created) => {
        this.guardando = false;
        const unidades = this.pedido.reduce((total, item) => total + item.cantidad, 0);
        this.modalService.alert(
          `Pedido registrado con la factura ${created.numero_factura} (${this.pedido.length} producto${this.pedido.length > 1 ? 's' : ''}, ${unidades} unidad${unidades > 1 ? 'es' : ''}). Puedes verla en Facturación.`,
          'Pedido exitoso',
          'success'
        );
        this.vaciarPedido();
        this.cargarProductos();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al registrar pedido:', err);
        this.modalService.alert(
          'No se pudo registrar el pedido. Verifica el stock o intenta nuevamente.',
          'Error',
          'error'
        );
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatearPrecio(valor: string | number): string {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    return isNaN(numero) ? '0' : numero.toLocaleString('es-CO');
  }
}
