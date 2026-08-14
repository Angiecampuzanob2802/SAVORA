import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 0;

  success(message: string, title = 'Operación exitosa'): void {
    this.show({ type: 'success', title, message, duration: 4500 });
  }

  error(message: string, title = 'No fue posible completar la acción'): void {
    this.show({ type: 'error', title, message, duration: 6500 });
  }

  warning(message: string, title = 'Atención'): void {
    this.show({ type: 'warning', title, message, duration: 5500 });
  }

  info(message: string, title = 'Información'): void {
    this.show({ type: 'info', title, message, duration: 4500 });
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  private show(toast: Omit<ToastMessage, 'id'>): void {
    const duplicated = this.messages().some(
      (message) => message.type === toast.type && message.title === toast.title && message.message === toast.message,
    );

    if (duplicated) {
      return;
    }

    const id = ++this.nextId;
    this.messages.update((messages) => [...messages.slice(-3), { ...toast, id }]);

    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(id), toast.duration);
    }
  }
}
