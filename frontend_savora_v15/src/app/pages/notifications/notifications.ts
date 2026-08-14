import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { NotificationItem, NotificationService } from '../../core/notification.service';
import { SessionService } from '../../core/session.service';

type NotificationFilter = 'todas' | 'no-leidas' | 'leidas';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  readonly filter = signal<NotificationFilter>('todas');

  readonly filteredNotifications = computed(() => {
    const filter = this.filter();
    const items = this.notifications.visibleNotifications();

    if (filter === 'no-leidas') {
      return items.filter((item) => this.notifications.isUnread(item));
    }

    if (filter === 'leidas') {
      return items.filter((item) => !this.notifications.isUnread(item));
    }

    return items;
  });

  readonly readCount = computed(
    () => this.notifications.visibleNotifications().filter((item) => !this.notifications.isUnread(item)).length,
  );

  readonly totalCount = computed(() => this.notifications.visibleNotifications().length);

  readonly latestNotification = computed(() => this.notifications.visibleNotifications()[0] ?? null);

  readonly filterCards = computed(() => [
    {
      key: 'todas' as NotificationFilter,
      label: 'Todas',
      value: this.totalCount(),
      detail: 'Historial completo',
    },
    {
      key: 'no-leidas' as NotificationFilter,
      label: 'No leidas',
      value: this.notifications.unreadCount(),
      detail: 'Requieren revision',
    },
    {
      key: 'leidas' as NotificationFilter,
      label: 'Leidas',
      value: this.readCount(),
      detail: 'Ya revisadas',
    },
  ]);

  constructor(
    readonly notifications: NotificationService,
    readonly session: SessionService,
    private readonly router: Router,
    private readonly location: Location,
  ) {}

  ngOnInit(): void {
    if (!this.session.user()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.notifications.load();
  }

  setFilter(filter: NotificationFilter): void {
    this.filter.set(filter);
  }

  markAsRead(notification: NotificationItem): void {
    this.notifications.markAsRead(notification);
  }

  markAllAsRead(): void {
    this.notifications.markAllAsRead();
    this.filter.set('todas');
  }

  notificationTone(notification: NotificationItem): string {
    const text = `${notification.titulo ?? ''} ${notification.mensaje ?? ''}`.toLowerCase();

    if (text.includes('pedido')) {
      return 'order';
    }

    if (text.includes('entrega')) {
      return 'delivery';
    }

    if (text.includes('stock') || text.includes('vencer') || text.includes('promocion')) {
      return 'alert';
    }

    return 'general';
  }

  notificationIcon(notification: NotificationItem): string {
    const tone = this.notificationTone(notification);

    if (tone === 'order') {
      return 'PD';
    }

    if (tone === 'delivery') {
      return 'EN';
    }

    if (tone === 'alert') {
      return 'AL';
    }

    return 'AV';
  }

  goToPrimaryRoute(): void {
    this.router.navigateByUrl(this.session.redirectPathForRole());
  }

  logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/login');
  }

  goBack(): void {
    this.location.back();
  }
}
