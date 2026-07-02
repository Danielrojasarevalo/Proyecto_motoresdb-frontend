import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (modal.state().open) {
      <div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/30 p-4" (click)="onBackdropClick()">
        <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" (click)="$event.stopPropagation()">
          <div class="mb-3 flex items-center gap-2 text-gray-800">
            <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm">{{ icon() }}</span>
            <h3 class="text-lg font-semibold">{{ modal.state().title }}</h3>
          </div>

          <p class="mb-5 text-sm leading-6 text-gray-700">{{ modal.state().message }}</p>

          <div class="flex items-center justify-end gap-2">
            @if (modal.state().showCancel) {
              <button
                type="button"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                (click)="modal.cancel()"
              >
                {{ modal.state().cancelText }}
              </button>
            }
            <button
              type="button"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              (click)="modal.accept()"
            >
              {{ modal.state().confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AppModalComponent {
  constructor(public modal: ModalService) {}

  icon(): string {
    const type = this.modal.state().type;
    if (type === 'success') return '✓';
    if (type === 'warning') return '!';
    if (type === 'error') return 'x';
    if (type === 'confirm') return '?';
    return 'i';
  }

  onBackdropClick(): void {
    if (this.modal.state().showCancel) {
      this.modal.cancel();
      return;
    }
    this.modal.accept();
  }
}