import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { EstadisticasDashboard } from '../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fadeIn">
      @if (loading) {
        <div class="col-span-full text-center py-8">
          <p class="text-slate-600">⏳ Cargando estadísticas...</p>
        </div>
      } @else if (error) {
        <div class="col-span-full text-center py-8">
          <p class="text-red-600">❌ {{ error }}</p>
          <button (click)="cargarDatos()" class="mt-2 text-slate-600 hover:text-slate-800">Reintentar</button>
        </div>
      } @else {
        <div class="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-sky-50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <p class="text-xs uppercase tracking-widest text-slate-600">Stock total</p>
          <p class="mt-2 text-2xl font-bold">{{ stats.stock_total }} unidades</p>
          <p class="text-xs text-slate-500">Total en inventario</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-sky-50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <p class="text-xs uppercase tracking-widest text-slate-600">Bajo stock</p>
          <p class="mt-2 text-2xl font-bold text-red-600">{{ stats.productos_bajo_stock }} productos</p>
          <p class="text-xs text-slate-500">Requieren atención</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-sky-50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <p class="text-xs uppercase tracking-widest text-slate-600">Entradas</p>
          <p class="mt-2 text-2xl font-bold">+{{ stats.entradas_recientes }}</p>
          <p class="text-xs text-slate-500">Últimos 7 días</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-sky-50 p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <p class="text-xs uppercase tracking-widest text-slate-600">Ventas</p>
          <p class="mt-2 text-2xl font-bold">{{ formatearPrecio(stats.ventas_mes) || 'N/A' }}</p>
          <p class="text-xs text-slate-500">Facturación mensual</p>
        </div>
      }
    </section>
  `
})
export class DashboardComponent implements OnInit {
  stats: EstadisticasDashboard = {
    stock_total: 0,
    productos_bajo_stock: 0,
    entradas_recientes: 0,
    ventas_mes: '0',
    productos_criticos: []
  };

  loading = true;
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatos();
    } else {
      this.loading = false;
    }
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.stats = data;
        console.log('✅ Estadísticas cargadas:', data);
        this.loading = false;
      },
      error: (err) => {
        console.warn('⚠️ Error al cargar estadísticas:', err);
        this.stats = {
          stock_total: 0,
          productos_bajo_stock: 0,
          entradas_recientes: 0,
          ventas_mes: '0',
          productos_criticos: []
        };
        this.error = null;
        this.loading = false;
      }
    });
  }

  formatearPrecio(precio: string | number): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return num.toLocaleString('es-CO');
  }
}
