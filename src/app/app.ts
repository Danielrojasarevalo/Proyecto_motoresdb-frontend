import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
  activeSection = signal<'dashboard' | 'productos' | 'stock' | 'facturacion' | 'reportes' | 'proveedores'>('dashboard');

  setSection(section: 'dashboard' | 'productos' | 'stock' | 'facturacion' | 'reportes' | 'proveedores') {
    this.activeSection.set(section);
  }
}
