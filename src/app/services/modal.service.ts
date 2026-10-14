import { Injectable, signal } from '@angular/core';

export type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface ModalState {
  open: boolean;
  title: string;
  message: string;
  type: ModalType;
  confirmText: string;
  cancelText: string;
  showCancel: boolean;
}

export interface ToastState {
  open: boolean;
  title: string;
  message: string;
  type: ModalType;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly initialState: ModalState = {
    open: false,
    title: 'Aviso',
    message: '',
    type: 'info',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    showCancel: false
  };

  private readonly _state = signal<ModalState>(this.initialState);
  readonly state = this._state.asReadonly();

  private readonly _toast = signal<ToastState | null>(null);
  readonly toast = this._toast.asReadonly();

  private pendingResolver: ((accepted: boolean) => void) | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  alert(message: string, title = 'Aviso', type: ModalType = 'info', duration = 4000): void {
    this.showToast({
      title,
      message,
      type,
      duration,
      open: true
    });
  }

  confirm(message: string, title = 'Confirmar', confirmText = 'Aceptar', cancelText = 'Cancelar'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.pendingResolver = resolve;
      this.show({
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
        showCancel: true
      });
    });
  }

  dismissToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this._toast.set(null);
  }

  accept(): void {
    this.close(true);
  }

  cancel(): void {
    this.close(false);
  }

  private show(config: Partial<ModalState>): void {
    this._state.set({
      ...this.initialState,
      ...config,
      open: true
    });
  }

  private showToast(config: ToastState): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this._toast.set(config);
    this.toastTimeout = setTimeout(() => this.dismissToast(), config.duration);
  }

  private close(accepted: boolean): void {
    this._state.set(this.initialState);
    if (this.pendingResolver) {
      this.pendingResolver(accepted);
      this.pendingResolver = null;
    }
  }
}