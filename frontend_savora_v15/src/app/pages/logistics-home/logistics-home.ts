import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { NotificationService } from '../../core/notification.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

interface Delivery {
  id_entrega: number;
  fecha_entrega?: string;
  hora_entrega?: string;
  fecha_programada?: string;
  estado_entrega?: string;
  direccion_entrega?: string;
  observaciones?: string;
  id_pedido?: number;
}

interface Order {
  id_pedido: number;
  estado_pedido: string;
  direccion_entrega?: string;
  total: number;
  metodo_pago?: string;
}

interface OrderDetail {
  id_detalle_pedido: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  subtotal: number;
}

interface Product {
  id_producto: number;
  nombre: string;
}

interface DeliveryForm {
  id_pedido: number;
  fecha_programada: string;
  estado_entrega: string;
  direccion_entrega: string;
  observaciones: string;
}

interface StatCard {
  label: string;
  value: string | number;
  note: string;
  tone: string;
  icon: string;
}

@Component({
  selector: 'app-logistics-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './logistics-home.html',
  styleUrl: './logistics-home.css',
})
export class LogisticsHome implements OnInit {
  private readonly toast = inject(ToastService);
  readonly deliveries = signal<Delivery[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly details = signal<OrderDetail[]>([]);
  readonly products = signal<Product[]>([]);
  readonly selectedDelivery = signal<Delivery | null>(null);
  readonly selectedDeliveryStatus = signal('Activas');
  readonly message = signal('');
  readonly error = signal('');
  readonly deliveryForm = signal<DeliveryForm>({
    id_pedido: 0,
    fecha_programada: new Date().toISOString().slice(0, 10),
    estado_entrega: 'Programada',
    direccion_entrega: '',
    observaciones: '',
  });

  readonly deliveryStatusFilters = ['Activas', 'Programada', 'En camino', 'Entregada', 'Cancelada'];

  readonly activeDeliveries = computed(() =>
    this.deliveries().filter((delivery) => {
      const selected = this.selectedDeliveryStatus().toLowerCase();
      const status = this.normalize(delivery.estado_entrega || 'Programada');

      if (selected === 'activas') {
        return !['entregada', 'cancelada'].includes(status);
      }

      return status === selected;
    }),
  );

  readonly readyOrders = computed(() =>
    this.orders().filter((order) => this.normalize(order.estado_pedido) === 'listo para entregar'),
  );

  readonly inRouteDeliveries = computed(() =>
    this.deliveries().filter((delivery) => this.normalize(delivery.estado_entrega || '') === 'en camino'),
  );

  readonly deliveredToday = computed(() =>
    this.deliveries().filter(
      (delivery) =>
        this.normalize(delivery.estado_entrega || '') === 'entregada' &&
        this.isToday(delivery.fecha_entrega || delivery.fecha_programada || ''),
    ),
  );

  readonly scheduledToday = computed(() =>
    this.deliveries().filter((delivery) => this.isToday(delivery.fecha_programada || '')),
  );

  readonly selectedOrder = computed(() =>
    this.orders().find((order) => order.id_pedido === this.deliveryForm().id_pedido),
  );

  readonly statCards = computed<StatCard[]>(() => [
    {
      label: 'Entregas activas',
      value: this.deliveries().filter((delivery) => {
        const status = this.normalize(delivery.estado_entrega || 'Programada');
        return !['entregada', 'cancelada'].includes(status);
      }).length,
      note: 'Programadas o en camino',
      tone: 'green',
      icon: '01',
    },
    {
      label: 'Pedidos listos',
      value: this.readyOrders().length,
      note: 'Disponibles para programar',
      tone: 'orange',
      icon: '02',
    },
    {
      label: 'En camino',
      value: this.inRouteDeliveries().length,
      note: 'Seguimiento inmediato',
      tone: 'blue',
      icon: '03',
    },
    {
      label: 'Entregadas hoy',
      value: this.deliveredToday().length,
      note: 'Cierre operativo del dia',
      tone: 'yellow',
      icon: '04',
    },
  ]);

  constructor(
    private readonly api: ApiService,
    readonly notifications: NotificationService,
    readonly session: SessionService,
    private readonly router: Router,
    private readonly location: Location,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.message.set('');
    this.error.set('');
    this.notifications.load();

    this.api.list<Delivery>('/entregas').subscribe({
      next: (deliveries) => this.deliveries.set(deliveries),
      error: () => this.error.set('No se pudieron cargar las entregas. Revisa que el backend este activo.'),
    });

    this.api.list<Order>('/pedidos').subscribe({
      next: (orders) => {
        this.orders.set(orders);
        const firstReady = orders.find((order) => this.normalize(order.estado_pedido) === 'listo para entregar');
        const first = firstReady ?? orders[0];

        if (first && this.deliveryForm().id_pedido === 0) {
          this.deliveryForm.update((form) => ({
            ...form,
            id_pedido: first.id_pedido,
            direccion_entrega: first.direccion_entrega ?? '',
          }));
        }
      },
      error: () => this.error.set('No se pudieron cargar los pedidos.'),
    });

    this.api.list<OrderDetail>('/detalle-pedido').subscribe({
      next: (details) => this.details.set(details),
      error: () => this.error.set('No se pudo cargar el detalle de pedidos.'),
    });

    this.api.list<Product>('/productos').subscribe({
      next: (products) => this.products.set(products),
      error: () => this.error.set('No se pudieron cargar los productos.'),
    });
  }

  updateForm(field: keyof DeliveryForm, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    this.deliveryForm.update((form) => ({
      ...form,
      [field]: field === 'id_pedido' ? Number(input.value) : input.value,
    }));
  }

  fillAddressFromOrder(): void {
    const order = this.orders().find((item) => item.id_pedido === this.deliveryForm().id_pedido);

    if (order) {
      this.deliveryForm.update((form) => ({ ...form, direccion_entrega: order.direccion_entrega ?? '' }));
    }
  }

  setDeliveryStatus(status: string): void {
    this.selectedDeliveryStatus.set(status);
  }

  selectOrder(order: Order): void {
    this.deliveryForm.update((form) => ({
      ...form,
      id_pedido: order.id_pedido,
      direccion_entrega: order.direccion_entrega ?? '',
    }));
    this.scrollTo('programar-entrega');
  }

  selectNextReadyOrder(): void {
    const order = this.readyOrders()[0];

    if (!order) {
      this.error.set('No hay pedidos con estado Listo para entregar.');
      return;
    }

    this.selectOrder(order);
  }

  createDelivery(): void {
    const form = this.deliveryForm();

    if (!form.id_pedido) {
      this.error.set('Selecciona un pedido antes de programar la entrega.');
      return;
    }

    if (!form.direccion_entrega.trim()) {
      this.error.set('Agrega la direccion de entrega.');
      return;
    }

    this.message.set('');
    this.error.set('');

    this.api.create<Delivery>('/entregas', { ...form }).subscribe({
      next: () => {
        this.message.set('Entrega programada correctamente. El pedido asociado paso a Listo para entregar.');
        this.toast.success('La entrega fue programada y quedó disponible para seguimiento.', 'Entrega programada');
        this.deliveryForm.update((current) => ({
          ...current,
          estado_entrega: 'Programada',
          observaciones: '',
        }));
        this.loadData();
        this.scrollTo('entregas-activas');
      },
      error: (response) => {
        const message = response?.error?.detail ?? 'No se pudo programar la entrega.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  updateDeliveryStatus(delivery: Delivery, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const estado_entrega = select.value;
    const payload: Record<string, unknown> = { estado_entrega };
    const estadoActual = delivery.estado_entrega || 'Programada';
    const order = this.orderFor(delivery.id_pedido);

    const confirmed =
      typeof window === 'undefined' ||
      window.confirm(`Confirmas cambiar la entrega #${delivery.id_entrega} de ${estadoActual} a ${estado_entrega}?`);

    if (!confirmed) {
      select.value = estadoActual;
      return;
    }

    if (estado_entrega === 'Entregada') {
      payload['fecha_entrega'] = new Date().toISOString().slice(0, 10);
    }

    this.api.update<Delivery>('/entregas', delivery.id_entrega, payload).subscribe({
      next: () => {
        const pedidoMensaje = order
          ? ` El pedido #${order.id_pedido} quedo como ${this.orderStatusFromDelivery(estado_entrega)}.`
          : '';
        this.message.set(
          `Entrega #${delivery.id_entrega} actualizada a ${estado_entrega}.${pedidoMensaje} Se envio la notificacion.`,
        );
        this.toast.success(
          `La entrega #${delivery.id_entrega} cambió a ${estado_entrega}.`,
          'Entrega actualizada',
        );
        this.selectedDeliveryStatus.set(estado_entrega);
        this.closeDeliveryDetail();
        this.notifications.load();
        this.loadData();
      },
      error: () => {
        const message = 'No se pudo actualizar la entrega.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  orderFor(idPedido?: number): Order | undefined {
    return this.orders().find((order) => order.id_pedido === idPedido);
  }

  orderItems(orderId?: number): OrderDetail[] {
    if (!orderId) {
      return [];
    }

    return this.details().filter((detail) => detail.id_pedido === orderId);
  }

  productName(productId: number): string {
    return this.products().find((product) => product.id_producto === productId)?.nombre ?? `Producto #${productId}`;
  }

  openDeliveryDetail(delivery: Delivery): void {
    this.selectedDelivery.set(delivery);
  }

  closeDeliveryDetail(): void {
    this.selectedDelivery.set(null);
  }

  deliveryTone(status?: string): string {
    const normalized = this.normalize(status || 'Programada');

    if (normalized === 'entregada') {
      return 'done';
    }

    if (normalized === 'cancelada') {
      return 'danger';
    }

    if (normalized === 'en camino') {
      return 'route';
    }

    return 'pending';
  }

  scrollTo(sectionId: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/login');
  }

  private isToday(dateValue: string): boolean {
    if (!dateValue) {
      return false;
    }

    const today = new Date();
    const date = new Date(dateValue);

    return today.toDateString() === date.toDateString();
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private orderStatusFromDelivery(status: string): string {
    if (status === 'Programada') {
      return 'Listo para entregar';
    }

    if (status === 'Entregada') {
      return 'Entregado';
    }

    if (status === 'Cancelada') {
      return 'Cancelado';
    }

    return status;
  }
}
