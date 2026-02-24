export interface DetalleFactura {
  id?: number;
  producto: number;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: string;
  subtotal?: string;
  descuento: string;
}

export interface Factura {
  id?: number;
  numero_factura: string;
  cliente: number;
  cliente_nombre?: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  subtotal?: string;
  impuestos: string;
  total?: string;
  estado: 'pendiente' | 'pagada' | 'cancelada' | 'vencida';
  observaciones?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  detalles?: DetalleFactura[];
}
