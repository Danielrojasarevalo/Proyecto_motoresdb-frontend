import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Factura } from '../models/factura.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class FacturasService {
  private apiUrl = `${environment.apiUrl}/facturas/`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas las facturas
   * @param filtros - Filtros opcionales (estado, cliente, search, ordering)
   */
  listarFacturas(filtros?: any): Observable<Factura[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Factura>>(this.apiUrl, { params }).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene una factura por ID con sus detalles
   */
  obtenerFactura(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}${id}/`);
  }

  /**
   * Crea una nueva factura con sus detalles
   * IMPORTANTE: Genera automáticamente movimientos de salida por cada detalle
   */
  crearFactura(factura: Factura): Observable<Factura> {
    return this.http.post<Factura>(this.apiUrl, factura);
  }

  /**
   * Actualiza una factura completa
   */
  actualizarFactura(id: number, factura: Factura): Observable<Factura> {
    return this.http.put<Factura>(`${this.apiUrl}${id}/`, factura);
  }

  /**
   * Actualiza parcialmente una factura
   */
  actualizarParcial(id: number, datos: Partial<Factura>): Observable<Factura> {
    return this.http.patch<Factura>(`${this.apiUrl}${id}/`, datos);
  }

  /**
   * Elimina una factura
   */
  eliminarFactura(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  /**
   * Obtiene solo facturas pendientes
   */
  facturasPendientes(): Observable<Factura[]> {
    return this.http.get<PaginatedResponse<Factura>>(`${this.apiUrl}pendientes/`).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene solo facturas pagadas
   */
  facturasPagadas(): Observable<Factura[]> {
    return this.http.get<PaginatedResponse<Factura>>(`${this.apiUrl}pagadas/`).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Cambia el estado de una factura
   * Estados válidos: pendiente, pagada, cancelada, vencida
   */
  cambiarEstado(id: number, estado: string): Observable<Factura> {
    return this.http.post<Factura>(`${this.apiUrl}${id}/cambiar_estado/`, {
      estado: estado
    });
  }
}
