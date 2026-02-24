import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EstadisticasDashboard, ResumenFinanciero } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard/`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene estadísticas generales del dashboard
   * Incluye: stock total, productos bajo stock, entradas recientes,
   * ventas del mes y productos críticos
   */
  obtenerEstadisticas(): Observable<EstadisticasDashboard> {
    return this.http.get<EstadisticasDashboard>(`${this.apiUrl}stats/`);
  }

  /**
   * Obtiene resumen financiero del mes actual
   * Incluye: ventas, costos y utilidad
   */
  obtenerResumenMes(): Observable<ResumenFinanciero> {
    return this.http.get<ResumenFinanciero>(`${this.apiUrl}resumen_mes/`);
  }
}
