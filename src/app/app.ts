import { Component, signal, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Servicios
import { DashboardService } from './services/dashboard.service';
import { ProductosService } from './services/productos.service';

// Modelos
import { EstadisticasDashboard } from './models/dashboard.model';
import { Producto } from './models/producto.model';

// Componentes
import { ProductosComponent } from './components/productos.component';
import { StockComponent } from './components/stock.component';
import { FacturacionComponent } from './components/facturacion.component';
import { ProveedoresComponent } from './components/proveedores.component';
import { ReportesComponent } from './components/reportes.component';
import { CategoriasComponent } from './components/categorias.component';
import { ClientesComponent } from './components/clientes.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, 
    FormsModule,
    ProductosComponent,
    StockComponent,
    FacturacionComponent,
    ProveedoresComponent,
    ReportesComponent,
    CategoriasComponent,
    ClientesComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App implements OnInit {
  activeSection = signal<'dashboard' | 'productos' | 'categorias' | 'stock' | 'facturacion' | 'reportes' | 'proveedores' | 'clientes'>('dashboard');

  // Datos del Dashboard
  stats: EstadisticasDashboard = {
    stock_total: 0,
    productos_bajo_stock: 0,
    entradas_recientes: 0,
    ventas_mes: '0',
    productos_criticos: []
  };

  // Datos para el sidebar
  productos: Producto[] = [];
  stockSalidas = 0;

  // Estados de carga
  loading = true;
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private productosService: ProductosService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatos();
    } else {
      // En SSR, solo marcamos como cargado sin hacer peticiones
      this.loading = false;
    }
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    // Intentar cargar estadísticas (opcional, no bloquea la UI)
    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.stats = data;
        console.log('✅ Estadísticas cargadas:', data);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('⚠️ No se pudieron cargar las estadísticas (backend posiblemente desconectado):', err);
        // Usar datos por defecto si falla
        this.stats = {
          stock_total: 0,
          productos_bajo_stock: 0,
          entradas_recientes: 0,
          ventas_mes: '0',
          productos_criticos: []
        };
        this.cdr.markForCheck();
      }
    });

    // Intentar cargar productos (opcional, no bloquea la UI)
    this.productosService.listarProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : [];
        console.log('✅ Productos cargados para dashboard:', this.productos);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('⚠️ No se pudieron cargar los productos (backend posiblemente desconectado):', err);
        this.productos = [];
        this.cdr.markForCheck();
      }
    });

    // Cargar total de salidas para calcular % stock real
    // (Se calcula en porcentajeStockSaludable con datos de productos)

    // Permitir que la UI se cargue inmediatamente, incluso si el backend no responde
    setTimeout(() => {
      this.loading = false;
      console.log('✅ Interfaz lista. Los datos se cargarán cuando el backend esté disponible.');
      this.cdr.markForCheck();
    }, 500);
  }

  setSection(section: 'dashboard' | 'productos' | 'categorias' | 'stock' | 'facturacion' | 'reportes' | 'proveedores' | 'clientes') {
    this.activeSection.set(section);
    if (section === 'dashboard') {
      this.cargarDatos();
    }
  }

  // Formatear precio
  formatearPrecio(precio: string | number): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return num.toLocaleString('es-CO');
  }

  // Calcular porcentaje de stock saludable basado en stock actual vs stock máximo total
  get porcentajeStockSaludable(): number {
    if (!this.productos || !Array.isArray(this.productos) || this.productos.length === 0) return 0;
    const stockActualTotal = this.productos.reduce((s, p) => s + (p.stock_actual || 0), 0);
    const stockMaxTotal = this.productos.reduce((s, p) => s + (p.stock_maximo || 0), 0);
    if (stockMaxTotal === 0) return 0;
    return Math.min(100, Math.round((stockActualTotal / stockMaxTotal) * 100));
  }
}
