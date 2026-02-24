import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = `${environment.apiUrl}/productos/`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos los productos
   * @param filtros - Filtros opcionales (categoria, proveedor, estado, search, ordering)
   */
  listarProductos(filtros?: any): Observable<Producto[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Producto>>(this.apiUrl, { params }).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene un producto por ID
   */
  obtenerProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}${id}/`);
  }

  /**
   * Crea un nuevo producto
   */
  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  /**
   * Actualiza un producto completo
   */
  actualizarProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}${id}/`, producto);
  }

  /**
   * Actualiza parcialmente un producto
   */
  actualizarParcial(id: number, datos: Partial<Producto>): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}${id}/`, datos);
  }

  /**
   * Elimina un producto
   */
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  /**
   * Obtiene productos con bajo stock
   */
  productosBarStock(): Observable<Producto[]> {
    return this.http.get<PaginatedResponse<Producto>>(`${this.apiUrl}bajo_stock/`).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene productos disponibles
   */
  productosDisponibles(): Observable<Producto[]> {
    return this.http.get<PaginatedResponse<Producto>>(`${this.apiUrl}disponibles/`).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Actualiza el stock de un producto manualmente
   */
  actualizarStock(id: number, stock: number): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}${id}/actualizar_stock/`, {
      stock_actual: stock
    });
  }
}
