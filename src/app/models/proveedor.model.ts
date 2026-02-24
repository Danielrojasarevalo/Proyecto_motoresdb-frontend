export interface Proveedor {
  id?: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  estado: 'activo' | 'inactivo' | 'pendiente';
  fecha_registro?: string;
  fecha_actualizacion?: string;
}
