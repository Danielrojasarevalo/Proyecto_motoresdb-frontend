import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { FacturasService } from '../services/facturas.service';
import { EstadisticasDashboard } from '../models/dashboard.model';
import { Factura } from '../models/factura.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

    @if (!loading) {
      <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 animate-fadeIn">
        <!-- Productos que se están acabando -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs uppercase tracking-widest text-slate-600">⚠️ Productos por agotarse</p>
            <a routerLink="/stock" class="text-xs font-semibold text-sky-700 hover:text-sky-900">Ir a stock →</a>
          </div>
          @if (!stats.productos_criticos.length) {
            <p class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">✅ No hay productos en estado crítico.</p>
          } @else {
            <ul class="space-y-2">
              @for (p of stats.productos_criticos; track p.id) {
                <li class="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-sm">
                  <span class="font-medium text-slate-800">{{ p.nombre }}</span>
                  <span class="text-red-600 font-semibold">{{ p.stock_actual }} / mín. {{ p.stock_minimo }}</span>
                </li>
              }
            </ul>
          }
        </div>

        <!-- Últimas facturas -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs uppercase tracking-widest text-slate-600">🧾 Últimas facturas</p>
            <a routerLink="/facturacion" class="text-xs font-semibold text-sky-700 hover:text-sky-900">Ver todas →</a>
          </div>
          @if (!ultimasFacturas.length) {
            <p class="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Todavía no hay facturas registradas.</p>
          } @else {
            <ul class="space-y-2">
              @for (f of ultimasFacturas; track f.id) {
                <li class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <div class="min-w-0">
                    <p class="font-medium text-slate-800">{{ f.numero_factura }}</p>
                    <p class="truncate text-xs text-slate-500">{{ f.cliente_nombre }} · {{ f.fecha_emision }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-slate-900">\${{ formatearPrecio(f.total || 0) }}</p>
                    <span class="rounded-full px-2 text-xs font-semibold"
                      [class.bg-emerald-100]="f.estado === 'pagada'" [class.text-emerald-700]="f.estado === 'pagada'"
                      [class.bg-amber-100]="f.estado === 'pendiente'" [class.text-amber-700]="f.estado === 'pendiente'"
                      [class.bg-red-100]="f.estado === 'cancelada' || f.estado === 'vencida'" [class.text-red-700]="f.estado === 'cancelada' || f.estado === 'vencida'"
                    >{{ f.estado }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </section>
    }
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

  ultimasFacturas: Factura[] = [];

  loading = true;
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private facturasService: FacturasService,
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
    this.loading = true;
    this.error = null;

    this.facturasService.listarFacturas().subscribe({
      next: (facturas) => {
        this.ultimasFacturas = facturas.slice(0, 5);
        this.cdr.markForCheck();
      },
      error: (err) => console.warn('⚠️ Error al cargar últimas facturas:', err)
    });

    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.stats = data;
        console.log('✅ Estadísticas cargadas:', data);
        this.loading = false;
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      }
    });
  }

  formatearPrecio(precio: string | number): string {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return num.toLocaleString('es-CO');
  }
}
