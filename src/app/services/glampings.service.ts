import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Glamping, GlampingImagen } from '../models/glamping.model';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class GlampingsService {
  private apiUrl = `${environment.apiUrl}/glampings/`;

  constructor(private http: HttpClient) {}

  listarGlampings(): Observable<Glamping[]> {
    const params = new HttpParams().set('page_size', '1000');
    return this.http.get<PaginatedResponse<Glamping>>(this.apiUrl, { params }).pipe(
      map(response => response.results || [])
    );
  }

  crearGlamping(glamping: Glamping): Observable<Glamping> {
    return this.http.post<Glamping>(this.apiUrl, glamping);
  }

  /**
   * Actualiza el glamping; la lista de precios enviada reemplaza a la anterior
   */
  actualizarGlamping(id: number, glamping: Glamping): Observable<Glamping> {
    return this.http.put<Glamping>(`${this.apiUrl}${id}/`, glamping);
  }

  eliminarGlamping(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  /**
   * Sube una o varias imágenes al glamping
   */
  subirImagenes(id: number, archivos: File[]): Observable<GlampingImagen[]> {
    const formData = new FormData();
    archivos.forEach(archivo => formData.append('imagenes', archivo));
    return this.http.post<GlampingImagen[]>(`${this.apiUrl}${id}/imagenes/`, formData);
  }

  eliminarImagen(glampingId: number, imagenId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${glampingId}/imagenes/${imagenId}/`);
  }
}
