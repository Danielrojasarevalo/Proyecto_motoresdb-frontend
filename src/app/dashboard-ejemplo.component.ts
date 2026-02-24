import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './services/dashboard.service';
import { ProductosService } from './services/productos.service';
import { MovimientosService } from './services/movimientos.service';
import { EstadisticasDashboard } from './models/dashboard.model';
import { Producto } from './models/producto.model';
import { Movimiento } from './models/movimiento.model';

@Component({
  selector: 'app-dashboard-ejemplo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header>
        <h1>Dashboard - Caficultura Verde 💚☕</h1>
        <p>Sistema de Inventario de Abonos</p>
      </header>

      @if (loading) {
        <div class="loading">
          <p>⏳ Cargando datos del sistema...</p>
        </div>
      }

      @if (error) {
        <div class="error-message">
          <p>❌ {{ error }}</p>
          <button (click)="recargarDatos()">🔄 Reintentar</button>
        </div>
      }

      @if (!loading && !error) {
        <!-- Tarjetas de Estadísticas -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <h3>Stock Total</h3>
              <p class="stat-value">{{ stats.stock_total }}</p>
              <span class="stat-label">unidades</span>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <h3>Productos Bajo Stock</h3>
              <p class="stat-value">{{ stats.productos_bajo_stock }}</p>
              <span class="stat-label">productos</span>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">📥</div>
            <div class="stat-info">
              <h3>Entradas Recientes</h3>
              <p class="stat-value">{{ stats.entradas_recientes }}</p>
              <span class="stat-label">últimos 7 días</span>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <h3>Ventas del Mes</h3>
              <p class="stat-value">\${{ formatearPrecio(stats.ventas_mes) }}</p>
              <span class="stat-label">COP</span>
            </div>
          </div>
        </section>

        <!-- Productos Críticos -->
        <section class="productos-criticos">
          <h2>🚨 Productos Críticos (Bajo Stock)</h2>
          
          @if (stats.productos_criticos && stats.productos_criticos.length > 0) {
            <div class="productos-grid">
              @for (producto of stats.productos_criticos; track producto.id) {
                <div class="producto-critico-card">
                  <div class="producto-header">
                    <h4>{{ producto.nombre }}</h4>
                    <span class="badge-critico">CRÍTICO</span>
                  </div>
                  <div class="producto-stock">
                    <div class="stock-info">
                      <span>Stock actual:</span>
                      <strong>{{ producto.stock_actual }}</strong>
                    </div>
                    <div class="stock-info">
                      <span>Stock mínimo:</span>
                      <strong>{{ producto.stock_minimo }}</strong>
                    </div>
                  </div>
                  <div class="stock-bar">
                    <div class="stock-fill" 
                         [style.width.%]="(producto.stock_actual / producto.stock_minimo) * 100"
                         [class.critico]="producto.stock_actual < producto.stock_minimo">
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="no-data">✅ No hay productos críticos en este momento</p>
          }
        </section>

        <!-- Productos con Bajo Stock -->
        <section class="productos-bajo-stock">
          <h2>📉 Todos los Productos con Bajo Stock</h2>
          
          @if (productosBajoStock.length > 0) {
            <div class="tabla-container">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  @for (producto of productosBajoStock; track producto.id) {
                    <tr>
                      <td><strong>{{ producto.nombre }}</strong></td>
                      <td>{{ producto.categoria_nombre }}</td>
                      <td>{{ producto.proveedor_nombre }}</td>
                      <td>{{ producto.stock_actual }} {{ producto.unidad_medida }}</td>
                      <td>
                        <span [class]="'badge badge-' + producto.estado">
                          {{ producto.estado_display }}
                        </span>
                      </td>
                      <td>\${{ formatearPrecio(producto.precio_unitario) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="no-data">✅ Todos los productos tienen stock adecuado</p>
          }
        </section>

        <!-- Movimientos Recientes -->
        <section class="movimientos-recientes">
          <h2>📊 Movimientos Recientes (Últimos 7 días)</h2>
          
          @if (movimientosRecientes.length > 0) {
            <div class="movimientos-lista">
              @for (movimiento of movimientosRecientes; track movimiento.id) {
                <div class="movimiento-card" [class.entrada]="movimiento.tipo_movimiento === 'entrada'"
                     [class.salida]="movimiento.tipo_movimiento === 'salida'">
                  <div class="movimiento-icono">
                    {{ movimiento.tipo_movimiento === 'entrada' ? '📥' : '📤' }}
                  </div>
                  <div class="movimiento-info">
                    <h4>{{ movimiento.producto_nombre }}</h4>
                    <p class="movimiento-detalle">
                      <span class="tipo">{{ movimiento.tipo_movimiento.toUpperCase() }}</span>
                      <span class="cantidad">{{ movimiento.cantidad }} unidades</span>
                      @if (movimiento.proveedor_nombre) {
                        <span class="proveedor">Proveedor: {{ movimiento.proveedor_nombre }}</span>
                      }
                    </p>
                    <p class="movimiento-fecha">{{ formatearFecha(movimiento.fecha_movimiento) }}</p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="no-data">No hay movimientos recientes</p>
          }
        </section>
      }

      <footer>
        <p>© 2026 DANIEL ROJAS AREVALO - Caficultura Verde 💚</p>
        <button (click)="recargarDatos()" class="btn-reload">🔄 Actualizar Datos</button>
      </footer>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #2d5016 0%, #4a7c2f 100%);
      color: white;
      border-radius: 10px;
    }

    header h1 {
      margin: 0;
      font-size: 2.5rem;
    }

    header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }

    .loading, .error-message {
      text-align: center;
      padding: 40px;
      background: #f5f5f5;
      border-radius: 10px;
      margin: 20px 0;
    }

    .error-message {
      background: #fee;
      border: 1px solid #fcc;
    }

    .error-message button {
      margin-top: 10px;
      padding: 10px 20px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      gap: 15px;
      align-items: center;
      border-left: 4px solid #2d5016;
    }

    .stat-card.warning {
      border-left-color: #ff9800;
      background: #fff8f0;
    }

    .stat-card.info {
      border-left-color: #2196f3;
      background: #f0f8ff;
    }

    .stat-card.success {
      border-left-color: #4caf50;
      background: #f0fff0;
    }

    .stat-icon {
      font-size: 3rem;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      margin: 5px 0;
      color: #2d5016;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
    }

    section {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    section h2 {
      margin-top: 0;
      color: #2d5016;
      border-bottom: 2px solid #4a7c2f;
      padding-bottom: 10px;
    }

    .productos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .producto-critico-card {
      background: #fff5f5;
      border: 2px solid #ff5252;
      border-radius: 8px;
      padding: 15px;
    }

    .producto-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .badge-critico {
      background: #ff5252;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
    }

    .producto-stock {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }

    .stock-bar {
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 10px;
    }

    .stock-fill {
      height: 100%;
      background: #4caf50;
      transition: width 0.3s;
    }

    .stock-fill.critico {
      background: #ff5252;
    }

    .tabla-container {
      overflow-x: auto;
      margin-top: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
      color: #2d5016;
    }

    tr:hover {
      background: #f9f9f9;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge-disponible {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-bajo_stock {
      background: #fff3e0;
      color: #ef6c00;
    }

    .badge-critico {
      background: #ffebee;
      color: #c62828;
    }

    .badge-agotado {
      background: #f5f5f5;
      color: #424242;
    }

    .movimientos-lista {
      display: grid;
      gap: 15px;
      margin-top: 20px;
    }

    .movimiento-card {
      display: flex;
      gap: 15px;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
      background: #f0f8ff;
    }

    .movimiento-card.entrada {
      border-left-color: #4caf50;
      background: #f0fff0;
    }

    .movimiento-card.salida {
      border-left-color: #ff9800;
      background: #fff8f0;
    }

    .movimiento-icono {
      font-size: 2rem;
    }

    .movimiento-info {
      flex: 1;
    }

    .movimiento-info h4 {
      margin: 0 0 8px 0;
      color: #2d5016;
    }

    .movimiento-detalle {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin: 5px 0;
      font-size: 0.9rem;
    }

    .movimiento-detalle .tipo {
      font-weight: 600;
      text-transform: uppercase;
      color: #2d5016;
    }

    .movimiento-fecha {
      font-size: 0.85rem;
      color: #666;
      margin: 5px 0 0 0;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 1.1rem;
    }

    footer {
      text-align: center;
      padding: 20px;
      margin-top: 30px;
      border-top: 2px solid #e0e0e0;
    }

    .btn-reload {
      margin-top: 10px;
      padding: 10px 20px;
      background: #2d5016;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-reload:hover {
      background: #4a7c2f;
    }
  `]
})
export class DashboardEjemploComponent implements OnInit {
  stats: EstadisticasDashboard = {
    stock_total: 0,
    productos_bajo_stock: 0,
    entradas_recientes: 0,
    ventas_mes: '0',
    productos_criticos: []
  };
  
  productosBajoStock: Producto[] = [];
  movimientosRecientes: Movimiento[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private productosService: ProductosService,
    private movimientosService: MovimientosService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    // Cargar estadísticas del dashboard
    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.stats = data;
        console.log('✅ Estadísticas cargadas:', data);
      },
      error: (err) => {
        this.error = 'Error al cargar las estadísticas del dashboard';
        console.error('❌ Error estadísticas:', err);
        this.loading = false;
      }
    });

    // Cargar productos con bajo stock
    this.productosService.productosBarStock().subscribe({
      next: (data) => {
        this.productosBajoStock = data;
        console.log('✅ Productos bajo stock:', data);
      },
      error: (err) => {
        console.error('❌ Error productos bajo stock:', err);
      }
    });

    // Cargar movimientos recientes
    this.movimientosService.movimientosRecientes().subscribe({
      next: (data) => {
        this.movimientosRecientes = data;
        this.loading = false;
        console.log('✅ Movimientos recientes:', data);
      },
      error: (err) => {
        this.error = 'Error al cargar los movimientos recientes';
        console.error('❌ Error movimientos:', err);
        this.loading = false;
      }
    });
  }

  recargarDatos(): void {
    this.cargarDatos();
  }

  formatearPrecio(precio: string | number): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return num.toLocaleString('es-CO');
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
