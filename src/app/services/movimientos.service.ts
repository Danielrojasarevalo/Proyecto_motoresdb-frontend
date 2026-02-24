import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Movimiento } from '../models/movimiento.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  private apiUrl = `${environment.apiUrl}/movimientos/`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos los movimientos
   * @param filtros - Filtros opcionales (tipo_movimiento, producto, proveedor, search, ordering)
   */
  listarMovimientos(filtros?: any): Observable<Movimiento[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Movimiento>>(this.apiUrl, { params }).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene un movimiento por ID
   */
  obtenerMovimiento(id: number): Observable<Movimiento> {
    return this.http.get<Movimiento>(`${this.apiUrl}${id}/`);
  }

  /**
   * Crea un nuevo movimiento
   * IMPORTANTE: Actualiza automáticamente el stock del producto
   */
  crearMovimiento(movimiento: Movimiento): Observable<Movimiento> {
    return this.http.post<Movimiento>(this.apiUrl, movimiento);
  }

  /**
   * Actualiza un movimiento completo
   */
  actualizarMovimiento(id: number, movimiento: Movimiento): Observable<Movimiento> {
    return this.http.put<Movimiento>(`${this.apiUrl}${id}/`, movimiento);
  }

  /**
   * Actualiza parcialmente un movimiento
   */
  actualizarParcial(id: number, datos: Partial<Movimiento>): Observable<Movimiento> {
    return this.http.patch<Movimiento>(`${this.apiUrl}${id}/`, datos);
  }

  /**
   * Elimina un movimiento
   */
  eliminarMovimiento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  /**
   * Obtiene movimientos recientes (últimos 7 días)
   */
  movimientosRecientes(): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.apiUrl}recientes/`);
  }

  /**
   * Obtiene solo movimientos de entrada
   */
  soloEntradas(): Observable<Movimiento[]> {
    return this.http.get<PaginatedResponse<Movimiento>>(`${this.apiUrl}entradas/`).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene solo movimientos de salida
   */
  soloSalidas(): Observable<Movimiento[]> {
    return this.http.get<PaginatedResponse<Movimiento>>(`${this.apiUrl}salidas/`).pipe(
      map(response => response.results || [])
    );
  }
}
