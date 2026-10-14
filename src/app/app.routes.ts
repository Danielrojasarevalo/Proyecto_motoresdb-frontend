import { Routes } from '@angular/router';
import { ProductosComponent } from './components/productos.component';
import { StockComponent } from './components/stock.component';
import { FacturacionComponent } from './components/facturacion.component';
import { ProveedoresComponent } from './components/proveedores.component';
import { ReportesComponent } from './components/reportes.component';
import { VentaComponent } from './components/ventas.component';
import { CategoriasComponent } from './components/categorias.component';
import { ClientesComponent } from './components/clientes.component';
import { ManualComponent } from './components/manual.component';
import { DashboardComponent } from './components/dashboard.component';
import { LoginComponent } from './components/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'productos', component: ProductosComponent, canActivate: [AuthGuard] },
  { path: 'categorias', component: CategoriasComponent, canActivate: [AuthGuard] },
  { path: 'stock', component: StockComponent, canActivate: [AuthGuard] },
  { path: 'venta', component: VentaComponent, canActivate: [AuthGuard] },
  { path: 'facturacion', component: FacturacionComponent, canActivate: [AuthGuard] },
  { path: 'reportes', component: ReportesComponent, canActivate: [AuthGuard] },
  { path: 'proveedores', component: ProveedoresComponent, canActivate: [AuthGuard] },
  { path: 'clientes', component: ClientesComponent, canActivate: [AuthGuard] },
  { path: 'manual', component: ManualComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
