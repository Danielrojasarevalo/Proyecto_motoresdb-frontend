import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AppModalComponent } from './components/app-modal.component';
import { ProductosService } from './services/productos.service';
import { AuthService } from './services/auth.service';
import { Producto } from './models/producto.model';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App implements OnInit {
  productos: Producto[] = [];

  constructor(
    private productosService: ProductosService,
    public router: Router,
    public auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarProductos();
    }
  }

  cargarProductos(): void {
    this.productosService.listarProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : [];
        console.log('✅ Productos cargados:', this.productos);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('⚠️ No se pudieron cargar los productos:', err);
        this.productos = [];
        this.cdr.markForCheck();
      }
    });
  }

  isActive(route: string): boolean {
    const current = this.router.url.split('?')[0].replace(/\/$/, '');
    if (route === 'dashboard' && (current === '' || current === '/')) {
      return true;
    }
    return current === '/' + route || current.startsWith('/' + route + '/');
  }

  get porcentajeStockSaludable(): number {
    if (!this.productos || !Array.isArray(this.productos) || this.productos.length === 0) return 0;
    const stockActualTotal = this.productos.reduce((s, p) => s + (p.stock_actual || 0), 0);
    const stockMaxTotal = this.productos.reduce((s, p) => s + (p.stock_maximo || 0), 0);
    if (stockMaxTotal === 0) return 0;
    return Math.min(100, Math.round((stockActualTotal / stockMaxTotal) * 100));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
