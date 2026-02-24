export interface ProductoCritico {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface EstadisticasDashboard {
  stock_total: number;
  productos_bajo_stock: number;
  entradas_recientes: number;
  ventas_mes: string;
  productos_criticos: ProductoCritico[];
}

export interface ResumenFinanciero {
  ventas: string;
  costos: string;
  utilidad: string;
}
