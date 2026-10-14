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
  public labels: string[] = [];
  public entradas: number[] = [];
  public salidas: number[] = [];
  public ingresados: number[] = [];
  public pendientes: number[] = [];

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

    const maxMovimiento = Math.max(...entradas, ...salidas, 10);
    const maxFacturacion = Math.max(...ingresados, ...pendientes, 100);

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
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: Math.ceil(maxMovimiento * 1.2),
            ticks: { stepSize: Math.ceil(Math.max(maxMovimiento / 5, 1)) }
          }
        }
      }
    });

    // Gráfica 2 — facturación pagada vs pendiente
    this.labels = labels;
    this.entradas = entradas;
    this.salidas = salidas;
    this.ingresados = ingresados;
    this.pendientes = pendientes;

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
            suggestedMax: Math.ceil(maxFacturacion * 1.2),
            ticks: {
              callback: (v: any) => '$' + Number(v).toLocaleString('es-CO'),
              stepSize: Math.ceil(Math.max(maxFacturacion / 5, 1))
            }
          }
        }
      }
    });
  }

  async descargarReportePDF(): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });
    const margen = 14;
    const canvas1 = document.getElementById('chartMovimientos') as HTMLCanvasElement | null;
    const canvas2 = document.getElementById('chartFacturas') as HTMLCanvasElement | null;

    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('VillaMar Inventarios · Reportes', margen, 15);
    doc.setFontSize(9);
    doc.text('Descarga de gráficos y datos clave', margen, 21);

    let y = 30;
    if (canvas1) {
      const imageData1 = canvas1.toDataURL('image/png');
      doc.addImage(imageData1, 'PNG', margen, y, 125, 70);
    }
    if (canvas2) {
      const imageData2 = canvas2.toDataURL('image/png');
      doc.addImage(imageData2, 'PNG', 145, y, 125, 70);
    }

    y += 78;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text('Meses', margen, y + 6);
    doc.setFontSize(8);
    doc.text('Este PDF descarga ambas gráficas con la misma estética de la aplicación.', margen, y + 12);

    doc.save('reportes-villamar.pdf');
  }

  descargarReporteExcel(): void {
    const rows = [
      ['Mes', 'Entradas (uds.)', 'Salidas (uds.)', 'Pagadas ($)', 'Pendientes ($)']
    ];
    let totalEntradas = 0;
    let totalSalidas = 0;
    let totalPagadas = 0;
    let totalPendientes = 0;

    for (let i = 0; i < this.labels.length; i++) {
      const entrada = Number(this.entradas[i] ?? 0);
      const salida = Number(this.salidas[i] ?? 0);
      const pagada = Number(this.ingresados[i] ?? 0);
      const pendiente = Number(this.pendientes[i] ?? 0);
      totalEntradas += entrada;
      totalSalidas += salida;
      totalPagadas += pagada;
      totalPendientes += pendiente;
      rows.push([
        this.labels[i],
        entrada.toLocaleString('es-CO'),
        salida.toLocaleString('es-CO'),
        pagada.toLocaleString('es-CO'),
        pendiente.toLocaleString('es-CO')
      ]);
    }

    rows.push([
      'Total',
      totalEntradas.toLocaleString('es-CO'),
      totalSalidas.toLocaleString('es-CO'),
      totalPagadas.toLocaleString('es-CO'),
      totalPendientes.toLocaleString('es-CO')
    ]);

    const htmlRows = rows
      .map((row, index) => {
        const cells = row
          .map(cell => `<td style="border:1px solid #ccc;padding:8px;vertical-align:middle;">${cell}</td>`)
          .join('');
        const rowStyle = index === 0 ? 'background:#0ea5e9;color:#ffffff;font-weight:700;' : index === rows.length - 1 ? 'background:#f8fafc;font-weight:700;' : '';
        return `<tr style="${rowStyle}">${cells}</tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><style>
      table { border-collapse:collapse; font-family:Arial, sans-serif; width:100%; }
      th, td { border:1px solid #ccc; padding:8px; }
      th { background:#0ea5e9; color:#fff; font-weight:700; }
      .summary { background:#f8fafc; font-weight:700; }
    </style></head><body>
      <h2>Reportes VillaMar</h2>
      <p>Datos descargados el ${new Date().toLocaleDateString('es-CO')}.</p>
      <table>${htmlRows}</table>
    </body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reportes-villamar-${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  fmt(valor: any): string {
    const n = parseFloat(valor) || 0;
    return n.toLocaleString('es-CO');
  }
}
