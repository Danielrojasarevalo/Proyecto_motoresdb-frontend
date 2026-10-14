import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ReservaFiesta } from '../models/fiesta.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class FiestasService {
  private apiUrl = `${environment.apiUrl}/fiestas/`;

  constructor(private http: HttpClient) {}

  /**
   * Lista las reservas de fiestas
   * @param filtros - Filtros opcionales (estado, search, ordering)
   */
  listarFiestas(filtros?: any): Observable<ReservaFiesta[]> {
    let params = new HttpParams().set('page_size', '1000');
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<ReservaFiesta>>(this.apiUrl, { params }).pipe(
      map(response => response.results || [])
    );
  }

  crearFiesta(fiesta: ReservaFiesta): Observable<ReservaFiesta> {
    return this.http.post<ReservaFiesta>(this.apiUrl, fiesta);
  }

  actualizarFiesta(id: number, fiesta: ReservaFiesta): Observable<ReservaFiesta> {
    return this.http.put<ReservaFiesta>(`${this.apiUrl}${id}/`, fiesta);
  }

  actualizarParcial(id: number, datos: Partial<ReservaFiesta>): Observable<ReservaFiesta> {
    return this.http.patch<ReservaFiesta>(`${this.apiUrl}${id}/`, datos);
  }

  eliminarFiesta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }
}
