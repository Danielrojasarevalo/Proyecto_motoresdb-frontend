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

  private pendingResolver: ((accepted: boolean) => void) | null = null;

  alert(message: string, title = 'Aviso', type: ModalType = 'info'): void {
    this.show({
      title,
      message,
      type,
      confirmText: 'Aceptar',
      showCancel: false
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

  private close(accepted: boolean): void {
    this._state.set(this.initialState);
    if (this.pendingResolver) {
      this.pendingResolver(accepted);
      this.pendingResolver = null;
    }
  }
}