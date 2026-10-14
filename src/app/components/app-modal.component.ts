import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (modal.state().open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" (click)="onBackdropClick()">
        <div class="w-full max-w-lg overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]" (click)="$event.stopPropagation()">
          <div class="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-5 text-white">
            <div class="flex items-center gap-3">
              <span class="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/15 text-xl font-bold">{{ icon() }}</span>
              <div>
                <p class="text-sm uppercase tracking-[0.2em] text-sky-100">{{ modal.state().type.toUpperCase() }}</p>
                <h3 class="text-2xl font-semibold">{{ modal.state().title }}</h3>
              </div>
            </div>
          </div>

          <div class="p-6">
            <p class="mb-6 text-sm leading-7 text-slate-700">{{ modal.state().message }}</p>
            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              @if (modal.state().showCancel) {
                <button
                  type="button"
                  class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  (click)="modal.cancel()"
                >
                  {{ modal.state().cancelText }}
                </button>
              }
              <button
                type="button"
                class="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
                (click)="modal.accept()"
              >
                {{ modal.state().confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (modal.toast()) {
      <div class="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
        <div class="rounded-3xl border p-4 shadow-2xl ring-1 ring-slate-200 transition-transform duration-300"
             [class.bg-emerald-50]="modal.toast()?.type === 'success'"
             [class.border-emerald-200]="modal.toast()?.type === 'success'"
             [class.bg-amber-50]="modal.toast()?.type === 'warning'"
             [class.border-amber-200]="modal.toast()?.type === 'warning'"
             [class.bg-red-50]="modal.toast()?.type === 'error'"
             [class.border-red-200]="modal.toast()?.type === 'error'"
             [class.bg-sky-50]="modal.toast()?.type === 'info'"
             [class.border-sky-200]="modal.toast()?.type === 'info'">
          <div class="flex items-start gap-3">
            <span class="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-white text-lg font-bold text-slate-900 shadow-sm">
              {{ icon(modal.toast()?.type) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-900">{{ modal.toast()?.title }}</p>
              <p class="mt-1 text-sm leading-6 text-slate-700">{{ modal.toast()?.message }}</p>
            </div>
            <button type="button" class="text-slate-500 transition hover:text-slate-800" (click)="modal.dismissToast()">✕</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AppModalComponent {
  constructor(public modal: ModalService) {}

  icon(typeOverride?: string): string {
    const type = typeOverride ?? this.modal.state().type;
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