import { Routes } from '@angular/router';
import { ProductosComponent } from './components/productos.component';
import { StockComponent } from './components/stock.component';
import { FacturacionComponent } from './components/facturacion.component';
import { ProveedoresComponent } from './components/proveedores.component';
import { ReportesComponent } from './components/reportes.component';
import { CategoriasComponent } from './components/categorias.component';
import { ClientesComponent } from './components/clientes.component';
import { ManualComponent } from './components/manual.component';
import { DashboardComponent } from './components/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'categorias', component: CategoriasComponent },
  { path: 'stock', component: StockComponent },
  { path: 'facturacion', component: FacturacionComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: 'proveedores', component: ProveedoresComponent },
  { path: 'clientes', component: ClientesComponent },
  { path: 'manual', component: ManualComponent },
  { path: '**', redirectTo: '/dashboard' }
];
