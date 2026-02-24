import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../services/productos.service';
import { CategoriasService } from '../services/categorias.service';
import { ProveedoresService } from '../services/proveedores.service';
import { Producto } from '../models/producto.model';
import { Categoria } from '../models/categoria.model';
import { Proveedor } from '../models/proveedor.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];
  
  loading = true;
  error: string | null = null;
  guardando = false;
  
  mostrarFormulario = false;
  productoEditando: Producto | null = null;
  searchTerm = '';
  
  formulario: Producto = this.resetFormulario();

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private proveedoresService: ProveedoresService,
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
    this.cargarProductos();
    this.cargarCategorias();
    this.cargarProveedores();
  }

  cargarProductos(): void {
    this.loading = true;
    this.error = null;
    
    this.productosService.listarProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : [];
        this.productosFiltrados = Array.isArray(data) ? data : [];
        this.loading = false;
        console.log('✅ Productos cargados:', this.productos);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar productos. Verifica la conexión con el servidor.';
        this.productos = [];
        this.productosFiltrados = [];
        this.loading = false;
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  cargarCategorias(): void {
    this.categoriasService.listarCategorias().subscribe({
      next: (data) => {
        console.log('📦 Respuesta cruda de categorías:', data);
        console.log('📦 Tipo de dato:', typeof data);
        console.log('📦 Es array?:', Array.isArray(data));
        
        if (Array.isArray(data)) {
          this.categorias = data;
          console.log('✅ Categorías cargadas:', this.categorias.length, 'categorías');
          if (this.categorias.length > 0) {
            console.log('📋 Primera categoría:', this.categorias[0]);
          }
        } else {
          console.warn('⚠️ La respuesta no es un array');
          this.categorias = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar categorías:', err);
        this.categorias = [];
        this.cdr.markForCheck();
      }
    });
  }

  cargarProveedores(): void {
    this.proveedoresService.listarProveedores().subscribe({
      next: (data) => {
        console.log('🏢 Respuesta cruda de proveedores:', data);
        
        if (Array.isArray(data)) {
          this.proveedores = data;
          console.log('✅ Proveedores cargados:', this.proveedores.length, 'proveedores');
          if (this.proveedores.length > 0) {
            console.log('📋 Primer proveedor:', this.proveedores[0]);
          }
        } else {
          console.warn('⚠️ La respuesta de proveedores no es un array');
          this.proveedores = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar proveedores:', err);
        this.proveedores = [];
        this.cdr.markForCheck();
      }
    });
  }

  filtrarProductos(): void {
    if (!this.searchTerm.trim()) {
      this.productosFiltrados = this.productos;
      return;
    }
    
    const termino = this.searchTerm.toLowerCase();
    this.productosFiltrados = this.productos.filter(p => 
      p.nombre.toLowerCase().includes(termino) ||
      p.codigo_producto?.toLowerCase().includes(termino) ||
      p.categoria_nombre?.toLowerCase().includes(termino) ||
      p.proveedor_nombre?.toLowerCase().includes(termino)
    );
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
    this.productoEditando = null;
    this.formulario = this.resetFormulario();
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.productoEditando = null;
    this.formulario = this.resetFormulario();
  }

  editarProducto(producto: Producto): void {
    // El listado usa ProductoListSerializer que no incluye categoria ID,
    // proveedor ID, stock_minimo, stock_maximo, descripcion.
    // Hay que cargar el detalle completo antes de abrir el formulario.
    this.productosService.obtenerProducto(producto.id!).subscribe({
      next: (detalle) => {
        this.productoEditando = detalle;
        this.formulario = { ...detalle };
        this.mostrarFormulario = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error al cargar detalle del producto:', err);
        // Fallback: usar los datos parciales del listado
        this.productoEditando = producto;
        this.formulario = { ...producto };
        this.mostrarFormulario = true;
        this.cdr.markForCheck();
      }
    });
  }

  guardarProducto(): void {
    // Validaciones
    if (!this.formulario.nombre || this.formulario.categoria === 0 || this.formulario.proveedor === 0) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (this.formulario.stock_actual < 0 || this.formulario.stock_minimo < 0 || this.formulario.stock_maximo < 0) {
      alert('Los valores de stock no pueden ser negativos');
      return;
    }

    if (this.formulario.stock_minimo > this.formulario.stock_maximo) {
      alert('El stock mínimo no puede ser mayor al stock máximo');
      return;
    }

    this.guardando = true;

    const operacion = this.productoEditando 
      ? this.productosService.actualizarProducto(this.productoEditando.id!, this.formulario)
      : this.productosService.crearProducto(this.formulario);

    operacion.subscribe({
      next: (data) => {
        console.log('✅ Producto guardado:', data);
        alert(`Producto ${this.productoEditando ? 'actualizado' : 'creado'} exitosamente`);
        this.cerrarFormulario();
        this.cargarProductos();
        this.guardando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('Error al guardar el producto. Verifica los datos e intenta nuevamente.');
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    if (!confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
      return;
    }

    this.productosService.eliminarProducto(producto.id!).subscribe({
      next: () => {
        console.log('✅ Producto eliminado');
        this.productos = this.productos.filter(p => p.id !== producto.id);
        this.productosFiltrados = this.productosFiltrados.filter(p => p.id !== producto.id);
        this.cdr.markForCheck();
        this.cargarProductos();
      },
      error: (err) => {
        console.error('❌ Error al eliminar:', err);
        let mensaje = 'Error al eliminar el producto.';
        if (err.status === 409 || err.status === 400) {
          mensaje = 'No se puede eliminar este producto porque tiene movimientos o facturas asociadas.';
        } else if (err.error?.detail) {
          mensaje = err.error.detail;
        } else if (err.error?.message) {
          mensaje = err.error.message;
        } else if (typeof err.error === 'string') {
          mensaje = err.error;
        }
        alert(mensaje);
        this.cdr.markForCheck();
      }
    });
  }

  resetFormulario(): Producto {
    return {
      nombre: '',
      categoria: 0,
      proveedor: 0,
      stock_actual: 0,
      stock_minimo: 0,
      stock_maximo: 0,
      precio_unitario: '0',
      precio_venta: '0',
      unidad_medida: 'kg',
      descripcion: '',
      codigo_producto: ''
    };
  }

  formatearPrecio(precio: string | number): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return num.toLocaleString('es-CO');
  }

  getBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'disponible': 'bg-emerald-100 text-emerald-700',
      'bajo_stock': 'bg-amber-100 text-amber-700',
      'critico': 'bg-red-100 text-red-700',
      'agotado': 'bg-gray-100 text-gray-700'
    };
    return clases[estado] || 'bg-gray-100 text-gray-700';
  }
}
