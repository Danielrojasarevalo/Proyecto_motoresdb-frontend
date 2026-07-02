import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manual.component.html',
  styles: [`
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
    }
  `]
})
export class ManualComponent {
  descargarPDF(): void {
    window.print();
  }
}
