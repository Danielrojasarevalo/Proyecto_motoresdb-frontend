import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Cliente } from '../models/cliente.model';
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
export class ClientesService {
  private apiUrl = `${environment.apiUrl}/clientes/`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos los clientes
   * @param filtros - Filtros opcionales (tipo_cliente, search, ordering)
   */
  listarClientes(filtros?: any): Observable<Cliente[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Cliente>>(this.apiUrl, { params }).pipe(
      map(response => response.results || [])
    );
  }

  /**
   * Obtiene un cliente por ID
   */
  obtenerCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}${id}/`);
  }

  /**
   * Crea un nuevo cliente
   */
  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  /**
   * Actualiza un cliente completo
   */
  actualizarCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}${id}/`, cliente);
  }

  /**
   * Actualiza parcialmente un cliente
   */
  actualizarParcial(id: number, datos: Partial<Cliente>): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.apiUrl}${id}/`, datos);
  }

  /**
   * Elimina un cliente
   */
  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  /**
   * Obtiene todas las facturas de un cliente
   */
  facturasCliente(id: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}${id}/facturas/`);
  }
}
