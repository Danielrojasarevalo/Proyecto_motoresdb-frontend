import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../services/categorias.service';
import { Categoria } from '../models/categoria.model';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html'
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  loading = true;
  guardando = false;
  error: string | null = null;
  modoEdicion = false;

  nuevaCategoria: Partial<Categoria> = {
    nombre: '',
    descripcion: ''
  };

  constructor(
    private categoriasService: CategoriasService,
    private modalService: ModalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🏗️ CategoriasComponent constructor llamado');
    console.log('🌐 Platform:', isPlatformBrowser(this.platformId) ? 'Browser' : 'Server');
  }

  ngOnInit(): void {
    console.log('🚀 CategoriasComponent ngOnInit llamado');
    // Solo cargar datos en el navegador, no en SSR
    if (isPlatformBrowser(this.platformId)) {
      this.cargarCategorias();
    } else {
      console.log('⏭️ Saltando carga en SSR, se cargará en el browser');
      this.loading = false; // No mostrar loading en SSR
    }
  }

  cargarCategorias(): void {
    this.loading = true;
    this.error = null;
    
    console.log('🚀 Iniciando carga de categorías...');
    console.log('🔗 URL del servicio:', this.categoriasService);
    
    // Timeout de seguridad
    const timeoutId = setTimeout(() => {
      if (this.loading) {
        console.warn('⏱️ Timeout: La petición tardó más de 10 segundos');
        this.loading = false;
        this.error = 'La petición está tardando demasiado. Verifica que el backend esté corriendo.';
      }
    }, 10000);
    
    this.categoriasService.listarCategorias().subscribe({
      next: (data) => {
        clearTimeout(timeoutId);
        console.log('📂 Respuesta de categorías:', data);
        console.log('📂 Tipo:', typeof data);
        console.log('📂 Es array?:', Array.isArray(data));
        
        if (Array.isArray(data)) {
          this.categorias = data;
          console.log('✅ Categorías asignadas:', this.categorias.length);
          this.categorias.forEach((cat, index) => {
            console.log(`📂 Categoría ${index}:`, cat);
          });
        } else {
          console.warn('⚠️ Respuesta no es array');
          this.categorias = [];
        }
        
        this.loading = false;
        console.log('✅ Loading ahora es:', this.loading);
        console.log('✅ Categorías finales:', this.categorias);
        this.cdr.markForCheck();
      },
      error: (err) => {
        clearTimeout(timeoutId);
        this.error = 'Error al cargar categorías. Verifica la conexión con el servidor.';
        this.categorias = [];
        this.loading = false;
        console.error('❌ Error completo:', err);
        console.error('❌ Error response:', err.error);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error message:', err.message);
        this.cdr.markForCheck();
      }
    });
  }

  guardarCategoria(): void {
    if (!this.nuevaCategoria.nombre?.trim()) {
      this.modalService.alert('El nombre de la categoria es obligatorio', 'Campos requeridos', 'warning');
      return;
    }

    this.guardando = true;
    this.error = null;

    const operacion = this.modoEdicion && this.nuevaCategoria.id
      ? this.categoriasService.actualizarCategoria(this.nuevaCategoria.id, this.nuevaCategoria as Categoria)
      : this.categoriasService.crearCategoria(this.nuevaCategoria as Categoria);

    operacion.subscribe({
      next: () => {
        console.log(`✅ Categoría ${this.modoEdicion ? 'actualizada' : 'creada'} exitosamente`);
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarCategorias();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = `Error al ${this.modoEdicion ? 'actualizar' : 'crear'} la categoría`;
        this.guardando = false;
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  editarCategoria(categoria: Categoria): void {
    this.nuevaCategoria = { ...categoria };
    this.modoEdicion = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async eliminarCategoria(id: number): Promise<void> {
    const confirmar = await this.modalService.confirm(
      '¿Estas seguro de eliminar esta categoria? Esta accion no se puede deshacer.',
      'Confirmar eliminacion',
      'Eliminar',
      'Cancelar'
    );
    if (!confirmar) {
      return;
    }

    this.categoriasService.eliminarCategoria(id).subscribe({
      next: () => {
        console.log('✅ Categoría eliminada');
        this.categorias = this.categorias.filter(c => c.id !== id);
        this.cdr.markForCheck();
        this.cargarCategorias();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Error al eliminar la categoría. Puede estar en uso por algunos productos.';
        this.modalService.alert(msg, 'Error', 'error');
        console.error('❌ Error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  limpiarFormulario(): void {
    this.nuevaCategoria = {
      nombre: '',
      descripcion: ''
    };
    this.modoEdicion = false;
    this.error = null;
  }
}
