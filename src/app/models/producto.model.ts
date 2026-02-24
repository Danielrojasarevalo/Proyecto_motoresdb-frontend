export interface Producto {
  id?: number;
  nombre: string;
  categoria: number;
  categoria_nombre?: string;
  proveedor: number;
  proveedor_nombre?: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  precio_unitario: string;
  precio_venta?: string;
  unidad_medida: string;
  estado?: 'disponible' | 'bajo_stock' | 'critico' | 'agotado';
  estado_display?: string;
  descripcion?: string;
  codigo_producto?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}
