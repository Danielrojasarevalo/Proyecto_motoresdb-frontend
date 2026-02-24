import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Proveedor } from '../models/proveedor.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = `${environment.apiUrl}/proveedores/`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos los proveedores
   * @param filtros - Filtros opcionales (estado, search, ordering)
   */
  listarProveedores(filtros?: any): Observable<Proveedor[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Proveedor>>(this.apiUrl, { params }).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene un proveedor por ID
   */
  obtenerProveedor(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}${id}/`);
  }

  /**
   * Crea un nuevo proveedor
   */
  crearProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  /**
   * Actualiza un proveedor completo
   */
  actualizarProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}${id}/`, proveedor);
  }

  /**
   * Actualiza parcialmente un proveedor
   */
  actualizarParcial(id: number, datos: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.apiUrl}${id}/`, datos);
  }

  /**
   * Elimina un proveedor
   */
  eliminarProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  /**
   * Obtiene solo los proveedores activos
   */
  proveedoresActivos(): Observable<Proveedor[]> {
    return this.http.get<PaginatedResponse<Proveedor>>(`${this.apiUrl}activos/`).pipe(
      map(response => response.results || [])
    );
  }
}
