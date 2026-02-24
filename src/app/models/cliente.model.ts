export interface Cliente {
  id?: number;
  nombre: string;
  tipo_cliente: 'cooperativa' | 'finca' | 'empresa' | 'particular';
  email: string;
  telefono: string;
  direccion: string;
  nit: string;
  fecha_registro?: string;
  fecha_actualizacion?: string;
}
