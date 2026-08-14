import { computed, Injectable, signal } from '@angular/core';

import { ApiService } from './api.service';
import { SessionService } from './session.service';

export interface NotificationItem {
  id_notificacion: number;
  titulo?: string;
  mensaje: string;
  fecha_notificacion?: string;
  estado?: string;
  id_usuario?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly notifications = signal<NotificationItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly visibleNotifications = computed(() => {
    const user = this.session.user();
    const rows = this.notifications();

    if (!user) {
      return [];
    }

    if (this.session.canAccess('admin')) {
      return rows;
    }

    return rows.filter((notification) => !notification.id_usuario || notification.id_usuario === user.id_usuario);
  });

  readonly unreadCount = computed(() => this.visibleNotifications().filter((notification) => this.isUnread(notification)).length);

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
  ) {}

  load(): void {
    if (!this.session.user()) {
      this.notifications.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.api.list<NotificationItem>('/notificaciones').subscribe({
      next: (notifications) => {
        this.notifications.set(
          notifications.sort(
            (a, b) =>
              new Date(b.fecha_notificacion ?? '').getTime() - new Date(a.fecha_notificacion ?? '').getTime() ||
              b.id_notificacion - a.id_notificacion,
          ),
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las notificaciones.');
        this.notifications.set([]);
        this.loading.set(false);
      },
    });
  }

  isUnread(notification: NotificationItem): boolean {
    return this.normalize(notification.estado ?? '') !== 'leida';
  }

  markAsRead(notification: NotificationItem): void {
    if (!this.isUnread(notification)) {
      return;
    }

    this.api.update<NotificationItem>('/notificaciones', notification.id_notificacion, { estado: 'Leida' }).subscribe({
      next: () => this.load(),
      error: () => this.error.set('No se pudo marcar la notificacion como leida.'),
    });
  }

  markAllAsRead(): void {
    for (const notification of this.visibleNotifications().filter((item) => this.isUnread(item))) {
      this.markAsRead(notification);
    }
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
