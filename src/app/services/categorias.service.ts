import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Categoria } from '../models/categoria.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private apiUrl = `${environment.apiUrl}/categorias/`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas las categorías
   * @param filtros - Filtros opcionales (search, ordering)
   */
  listarCategorias(filtros?: any): Observable<Categoria[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Categoria>>(this.apiUrl, { params }).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene una categoría por ID
   */
  obtenerCategoria(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}${id}/`);
  }

  /**
   * Crea una nueva categoría
   */
  crearCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoria);
  }

  /**
   * Actualiza una categoría completa
   */
  actualizarCategoria(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}${id}/`, categoria);
  }

  /**
   * Actualiza parcialmente una categoría
   */
  actualizarParcial(id: number, datos: Partial<Categoria>): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.apiUrl}${id}/`, datos);
  }

  /**
   * Elimina una categoría
   */
  eliminarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }
}
