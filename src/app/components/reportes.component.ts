import { Component, Input, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MovimientosService } from '../services/movimientos.service';
import { FacturasService } from '../services/facturas.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  @Input() stats: any;

  loading = true;
  error: string | null = null;
  resumen: any = null;
  statsData: any = null;

  constructor(
    private movimientosService: MovimientosService,
    private facturasService: FacturasService,
    private dashboardService: DashboardService,
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
    forkJoin({
      stats: this.dashboardService.obtenerEstadisticas(),
      resumen: this.dashboardService.obtenerResumenMes(),
      movimientos: this.movimientosService.listarMovimientos({ page_size: 500 }),
      facturas: this.facturasService.listarFacturas()
    }).subscribe({
      next: ({ stats, resumen, movimientos, facturas }) => {
        this.statsData = stats;
        this.resumen = resumen;
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.renderCharts(movimientos, facturas), 150);
      },
      error: (err) => {
        console.error('❌ Error en reportes:', err);
        this.error = 'Error al cargar datos de reportes.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Genera las etiquetas y claves ISO de los últimos N meses */
  private calcularMeses(n = 6): { labels: string[], keys: string[] } {
    const labels: string[] = [];
    const keys: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      labels.push(d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }));
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return { labels, keys };
  }

  async renderCharts(movimientos: any[], facturas: any[]): Promise<void> {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const { labels, keys } = this.calcularMeses(6);

    // --- Movimientos por mes ---
    const entradas = keys.map(k =>
      movimientos
        .filter(m => m.tipo_movimiento === 'entrada' && (m.fecha_movimiento || '').startsWith(k))
        .reduce((s: number, m: any) => s + (m.cantidad || 0), 0)
    );
    const salidas = keys.map(k =>
      movimientos
        .filter(m => m.tipo_movimiento === 'salida' && (m.fecha_movimiento || '').startsWith(k))
        .reduce((s: number, m: any) => s + (m.cantidad || 0), 0)
    );

    // --- Facturación por mes ---
    const ingresados = keys.map(k =>
      facturas
        .filter(f => f.estado === 'pagada' && (f.fecha_emision || '').startsWith(k))
        .reduce((s: number, f: any) => s + parseFloat(f.total || '0'), 0)
    );
    const pendientes = keys.map(k =>
      facturas
        .filter(f => f.estado === 'pendiente' && (f.fecha_emision || '').startsWith(k))
        .reduce((s: number, f: any) => s + parseFloat(f.total || '0'), 0)
    );

    // Limpiar instancias previas si existen
    const c1 = document.getElementById('chartMovimientos') as HTMLCanvasElement | null;
    const c2 = document.getElementById('chartFacturas') as HTMLCanvasElement | null;
    if (!c1 || !c2) return;

    // Destruir chart previo si el canvas ya tiene uno
    const existing1 = Chart.getChart(c1);
    const existing2 = Chart.getChart(c2);
    if (existing1) existing1.destroy();
    if (existing2) existing2.destroy();

    // Gráfica 1 — entradas vs salidas
    new Chart(c1, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Entradas (uds.)',
            data: entradas,
            backgroundColor: 'rgba(34, 197, 94, 0.75)',
            borderColor: 'rgb(22, 163, 74)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Salidas (uds.)',
            data: salidas,
            backgroundColor: 'rgba(239, 68, 68, 0.70)',
            borderColor: 'rgb(220, 38, 38)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, max: 1000, ticks: { stepSize: 1 } } }
      }
    });

    // Gráfica 2 — facturación pagada vs pendiente
    new Chart(c2, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pagadas ($)',
            data: ingresados,
            backgroundColor: 'rgba(34, 197, 94, 0.75)',
            borderColor: 'rgb(22, 163, 74)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Pendientes ($)',
            data: pendientes,
            backgroundColor: 'rgba(251, 191, 36, 0.75)',
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            max: 40000000,
            ticks: {
              callback: (v: any) => '$' + Number(v).toLocaleString('es-CO')
            }
          }
        }
      }
    });
  }

  fmt(valor: any): string {
    const n = parseFloat(valor) || 0;
    return n.toLocaleString('es-CO');
  }
}
