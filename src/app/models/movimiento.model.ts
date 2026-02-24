export interface Movimiento {
  id?: number;
  producto: number;
  producto_nombre?: string;
  tipo_movimiento: 'entrada' | 'salida';
  cantidad: number;
  fecha_movimiento: string;
  proveedor?: number;
  proveedor_nombre?: string;
  referencia?: string;
  observaciones?: string;
  usuario_responsable?: string;
  fecha_registro?: string;
}
