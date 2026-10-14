export interface GlampingPrecio {
  id?: number;
  concepto: string;
  precio: number | string;
}

export interface GlampingImagen {
  id: number;
  imagen: string;
  fecha_subida?: string;
}

export interface Glamping {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  capacidad?: number | null;
  activo: boolean;
  precios: GlampingPrecio[];
  imagenes?: GlampingImagen[];
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}
