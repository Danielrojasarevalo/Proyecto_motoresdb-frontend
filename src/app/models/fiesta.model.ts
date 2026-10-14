export type EstadoFiesta = 'pendiente' | 'confirmada' | 'realizada' | 'cancelada';

export interface ReservaFiesta {
  id?: number;
  nombre_cliente: string;
  telefono?: string | null;
  tipo_evento?: string | null;
  fecha: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  numero_personas?: number | null;
  precio: number | string;
  abono: number | string;
  saldo?: string;
  descripcion?: string | null;
  estado: EstadoFiesta;
  estado_display?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}
