import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { NotificationService } from '../../core/notification.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

interface Product {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  stock?: number;
  precio_costo?: number;
  precio_venta?: number;
  estado_producto?: boolean;
  id_categoria?: number;
  id_establecimiento?: number;
  fecha_vencimiento?: string;
  fecha_preparacion?: string;
  hora_limite_consumo?: string;
}

interface Order {
  id_pedido: number;
  fecha_pedido?: string;
  estado_pedido: string;
  total: number;
  direccion_entrega?: string;
  metodo_pago?: string;
  id_usuario?: number;
  id_establecimiento?: number;
}

interface OrderDetail {
  id_detalle_pedido: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Category {
  id_categoria: number;
  nombre: string;
}

interface Establishment {
  id_establecimiento: number;
  nombre: string;
  tipo?: string;
  ciudad?: string;
  id_usuario?: number;
}

interface ProductForm {
  nombre: string;
  descripcion: string;
  precio_costo: number;
  precio_venta: number;
  stock: number;
  id_categoria: number;
  id_establecimiento: number | null;
  fecha_vencimiento: string;
  hora_limite_consumo: string;
}

interface ProductEditForm {
  nombre: string;
  descripcion: string;
  precio_costo: number;
  precio_venta: number;
}

interface MetricCard {
  label: string;
  value: string | number;
  helper: string;
  icon: string;
  tone: 'green' | 'orange' | 'yellow' | 'red';
}

@Component({
  selector: 'app-establishment-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './establishment-home.html',
  styleUrl: './establishment-home.css',
  host: {
    '(document:keydown.escape)': 'closeOpenDetails()',
  },
})
export class EstablishmentHome implements OnInit {
  private readonly toast = inject(ToastService);
  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly details = signal<OrderDetail[]>([]);
  readonly selectedOrder = signal<Order | null>(null);
  readonly selectedProduct = signal<Product | null>(null);
  readonly editingProduct = signal<Product | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly currentEstablishment = signal<Establishment | null>(null);
  readonly selectedOrderStatus = signal('Activos');
  readonly message = signal('');
  readonly error = signal('');
  readonly saving = signal(false);
  readonly savingEdit = signal(false);

  readonly productForm = signal<ProductForm>({
    nombre: '',
    descripcion: '',
    precio_costo: 0,
    precio_venta: 0,
    stock: 1,
    id_categoria: 1,
    id_establecimiento: null,
    fecha_vencimiento: '',
    hora_limite_consumo: '',
  });

  readonly productEditForm = signal<ProductEditForm>({
    nombre: '',
    descripcion: '',
    precio_costo: 0,
    precio_venta: 0,
  });

  readonly myProducts = computed(() => {
    const establishmentId = this.currentEstablishment()?.id_establecimiento;

    if (!establishmentId) {
      return [];
    }

    return this.products().filter((product) => product.id_establecimiento === establishmentId);
  });

  readonly myOrders = computed(() => {
    const establishmentId = this.currentEstablishment()?.id_establecimiento;

    if (!establishmentId) {
      return [];
    }

    return this.orders().filter((order) => order.id_establecimiento === establishmentId);
  });

  readonly activeProducts = computed(() =>
    this.myProducts().filter((product) => product.estado_producto !== false),
  );

  readonly lowStock = computed(() =>
    this.myProducts()
      .filter((product) => Number(product.stock ?? 0) <= 20)
      .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0)),
  );

  readonly expiryAlerts = computed(() =>
    this.myProducts()
      .filter((product) => {
        const days = this.daysUntil(product.fecha_vencimiento);
        return days >= 0 && days <= 7;
      })
      .sort((a, b) => this.daysUntil(a.fecha_vencimiento) - this.daysUntil(b.fecha_vencimiento)),
  );

  readonly pendingOrders = computed(() =>
    this.myOrders().filter((order) => {
      const status = this.normalizeStatus(order.estado_pedido);
      const selected = this.normalizeStatus(this.selectedOrderStatus());

      if (selected === 'activos') {
        return !['entregado', 'cancelado'].includes(status);
      }

      return status === selected;
    }),
  );

  readonly todaySales = computed(() =>
    this.myOrders()
      .filter((order) => this.isToday(order.fecha_pedido))
      .reduce((sum, order) => sum + Number(order.total ?? 0), 0),
  );

  readonly potentialSavings = computed(() =>
    this.myProducts().reduce((sum, product) => {
      const costo = Number(product.precio_costo ?? 0);
      const venta = Number(product.precio_venta ?? 0);
      const stock = Number(product.stock ?? 0);
      return sum + Math.max(costo - venta, 0) * stock;
    }, 0),
  );

  readonly metricCards = computed<MetricCard[]>(() => [
    {
      label: 'Productos activos',
      value: this.activeProducts().length,
      helper: 'Publicados para clientes',
      icon: 'fa-solid fa-basket-shopping',
      tone: 'green',
    },
    {
      label: 'Pedidos activos',
      value: this.pendingOrders().length,
      helper: 'Reservas por preparar',
      icon: 'fa-solid fa-receipt',
      tone: 'orange',
    },
    {
      label: 'Stock bajo',
      value: this.lowStock().length,
      helper: 'Necesitan revisión',
      icon: 'fa-solid fa-triangle-exclamation',
      tone: this.lowStock().length ? 'red' : 'green',
    },
    {
      label: 'Próximos a vencer',
      value: this.expiryAlerts().length,
      helper: 'Vencen en 7 días',
      icon: 'fa-solid fa-clock',
      tone: this.expiryAlerts().length ? 'yellow' : 'green',
    },
    {
      label: 'Ventas de hoy',
      value: this.formatMoney(this.todaySales()),
      helper: 'Pedidos registrados hoy',
      icon: 'fa-solid fa-chart-line',
      tone: 'green',
    },
    {
      label: 'Ahorro publicado',
      value: this.formatMoney(this.potentialSavings()),
      helper: 'Diferencia estimada',
      icon: 'fa-solid fa-leaf',
      tone: 'orange',
    },
  ]);

  readonly orderStatusFilters = [
    'Activos',
    'Pendiente',
    'Preparando',
    'Listo para entregar',
    'En camino',
    'Entregado',
    'Cancelado',
  ];

  constructor(
    private readonly api: ApiService,
    readonly notifications: NotificationService,
    readonly session: SessionService,
    private readonly router: Router,
    private readonly location: Location,
  ) {}

  get user() {
    return this.session.user;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.notifications.load();

    this.api.list<Establishment>('/establecimientos').subscribe({
      next: (establishments) => {
        const userId = this.session.user()?.id_usuario;
        const establishment = establishments.find((item) => item.id_usuario === userId) ?? null;

        this.currentEstablishment.set(establishment);

        if (establishment) {
          this.productForm.update((form) => ({
            ...form,
            id_establecimiento: establishment.id_establecimiento,
          }));
        }
      },
      error: () => this.error.set('No se pudo cargar el establecimiento asociado.'),
    });

    this.api.list<Product>('/productos').subscribe({
      next: (products) => this.products.set(products),
      error: () => this.error.set('No se pudieron cargar los productos. Revisa que FastAPI esté corriendo.'),
    });

    this.api.list<Order>('/pedidos').subscribe({
      next: (orders) => this.orders.set(orders),
      error: () => this.error.set('No se pudieron cargar los pedidos. Revisa que FastAPI esté corriendo.'),
    });

    this.api.list<OrderDetail>('/detalle-pedido').subscribe({
      next: (details) => this.details.set(details),
      error: () => this.error.set('No se pudo cargar el detalle de pedidos.'),
    });

    this.api.list<Category>('/categorias').subscribe({
      next: (categories) => {
        this.categories.set(categories);

        if (categories.length) {
          this.productForm.update((form) => ({
            ...form,
            id_categoria: categories[0].id_categoria,
          }));
        }
      },
      error: () => this.error.set('No se pudieron cargar las categorías.'),
    });
  }

  orderItems(orderId: number): OrderDetail[] {
    return this.details().filter((detail) => detail.id_pedido === orderId);
  }

  selectedOrderItems(): OrderDetail[] {
    const order = this.selectedOrder();
    return order ? this.orderItems(order.id_pedido) : [];
  }

  productName(productId: number): string {
    return this.products().find((product) => product.id_producto === productId)?.nombre ?? `Producto #${productId}`;
  }

  categoryName(categoryId?: number): string {
    return this.categories().find((category) => category.id_categoria === categoryId)?.nombre ?? 'Sin categoría';
  }

  updateForm(field: keyof ProductForm, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    const numericFields: Array<keyof ProductForm> = [
      'precio_costo',
      'precio_venta',
      'stock',
      'id_categoria',
      'id_establecimiento',
    ];

    const value = numericFields.includes(field) ? Number(input.value) : input.value;

    this.productForm.update((form) => ({
      ...form,
      [field]: value,
    }));
  }

  updateEditForm(field: keyof ProductEditForm, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = field === 'nombre' || field === 'descripcion' ? input.value : Number(input.value);

    this.productEditForm.update((form) => ({
      ...form,
      [field]: value,
    }));
  }

  setOrderStatus(status: string): void {
    this.selectedOrderStatus.set(status);
  }

  createProduct(): void {
    const form = this.productForm();

    if (!form.id_establecimiento) {
      this.error.set('No se encontró un establecimiento asociado a tu usuario.');
      return;
    }

    if (!form.nombre.trim()) {
      this.error.set('Escribe el nombre del producto.');
      return;
    }

    if (form.descripcion.trim().length < 20) {
      this.error.set('Escribe una descripción del plato de al menos 20 caracteres.');
      return;
    }

    if (form.precio_venta <= 0 || form.stock <= 0) {
      this.error.set('El precio de venta y el stock deben ser mayores que cero.');
      return;
    }

    const payload: Record<string, unknown> = {
      ...form,
      estado_producto: true,
      fecha_preparacion: new Date().toISOString().slice(0, 10),
    };

    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    this.api.create<Product>('/productos', payload).subscribe({
      next: () => {
        this.message.set('Producto publicado correctamente.');
        this.toast.success(`${form.nombre} ya está disponible para los clientes.`, 'Producto publicado');
        this.saving.set(false);

        this.productForm.update((current) => ({
          ...current,
          nombre: '',
          descripcion: '',
          precio_costo: 0,
          precio_venta: 0,
          stock: 1,
          fecha_vencimiento: '',
          hora_limite_consumo: '',
        }));

        this.loadData();
      },
      error: (response) => {
        const message = response?.error?.detail ?? 'No se pudo crear el producto.';
        this.error.set(message);
        this.toast.error(message);
        this.saving.set(false);
      },
    });
  }

  toggleProduct(product: Product): void {
    const nextState = product.estado_producto === false;
    const action = nextState ? 'activar' : 'pausar';
    const confirmed = window.confirm(`¿Confirmas ${action} el producto ${product.nombre}?`);

    if (!confirmed) {
      return;
    }

    this.api.update<Product>('/productos', product.id_producto, { estado_producto: nextState }).subscribe({
      next: () => {
        this.message.set(`Producto ${product.nombre} ${nextState ? 'activado' : 'pausado'} correctamente.`);
        this.toast.success(
          `${product.nombre} quedó ${nextState ? 'activo' : 'pausado'}.`,
          'Estado actualizado',
        );
        this.loadData();
      },
      error: () => {
        const message = 'No se pudo actualizar el producto.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  updateOrderStatus(order: Order, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const estado_pedido = select.value;

    const confirmed = window.confirm(
      `¿Confirmas cambiar el pedido #${order.id_pedido} de ${order.estado_pedido} a ${estado_pedido}?`,
    );

    if (!confirmed) {
      select.value = order.estado_pedido;
      return;
    }

    this.api.update<Order>('/pedidos', order.id_pedido, { estado_pedido }).subscribe({
      next: () => {
        this.message.set(`Pedido #${order.id_pedido} actualizado a ${estado_pedido}.`);
        this.toast.success(`El pedido #${order.id_pedido} cambió a ${estado_pedido}.`, 'Pedido actualizado');
        this.selectedOrderStatus.set(estado_pedido);
        this.closeOrderDetail();
        this.notifications.load();
        this.loadData();
      },
      error: () => {
        const message = 'No se pudo actualizar el pedido.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  openOrderDetail(order: Order): void {
    this.selectedOrder.set(order);
  }

  closeOrderDetail(): void {
    this.selectedOrder.set(null);
  }

  openProductDetail(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeProductDetail(): void {
    this.selectedProduct.set(null);
  }

  openProductEdit(product: Product): void {
    this.closeProductDetail();
    this.error.set('');
    this.message.set('');
    this.editingProduct.set(product);
    this.productEditForm.set({
      nombre: product.nombre,
      descripcion: product.descripcion ?? '',
      precio_costo: Number(product.precio_costo ?? 0),
      precio_venta: Number(product.precio_venta ?? 0),
    });
  }

  closeProductEdit(): void {
    if (!this.savingEdit()) {
      this.editingProduct.set(null);
    }
  }

  saveProductEdit(): void {
    const product = this.editingProduct();
    const form = this.productEditForm();

    if (!product) {
      return;
    }

    if (!form.nombre.trim()) {
      this.error.set('Escribe el nombre del producto.');
      return;
    }

    if (form.descripcion.trim().length < 20) {
      this.error.set('Escribe una descripción del plato de al menos 20 caracteres.');
      return;
    }

    if (form.precio_costo < 0 || form.precio_venta <= 0) {
      this.error.set('El precio normal no puede ser negativo y el precio de oferta debe ser mayor que cero.');
      return;
    }

    this.savingEdit.set(true);
    this.error.set('');
    this.message.set('');

    this.api.update<Product>('/productos', product.id_producto, {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio_costo: form.precio_costo,
      precio_venta: form.precio_venta,
    }).subscribe({
      next: (updatedProduct) => {
        this.products.update((products) =>
          products.map((item) => item.id_producto === updatedProduct.id_producto ? updatedProduct : item),
        );
        this.message.set(`Producto ${updatedProduct.nombre} actualizado correctamente.`);
        this.toast.success(
          `Los cambios de ${updatedProduct.nombre} fueron guardados.`,
          'Producto actualizado',
        );
        this.savingEdit.set(false);
        this.editingProduct.set(null);
      },
      error: (response) => {
        const message = response?.error?.detail ?? 'No se pudo actualizar el producto.';
        this.error.set(message);
        this.toast.error(message);
        this.savingEdit.set(false);
      },
    });
  }

  closeOpenDetails(): void {
    this.closeOrderDetail();
    this.closeProductDetail();
    this.closeProductEdit();
  }

  productImage(product: Product): string {
    const name = product.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

    const images: Record<string, string> = {
      'hamburguesa-clasica': '/productos/hamburguesa.png',
      'papas-fritas': '/productos/papas.png',
      cheesecake: '/productos/cheescake.png',
      'jugo-de-naranja': '/productos/jugo-naranja.png',
      'limonada-natural': '/productos/limonada-natural.png',
      'cafe-americano': '/productos/cafe-americano.png',
      cappuccino: '/productos/capuccino.png',
      capuccino: '/productos/capuccino.png',
      'sandwich-mixto': '/productos/sadwich-mixto.png',
      brownie: '/productos/brownie.png',
      'pan-integral': '/productos/Pan-Integral.png',
    };

    return images[name] || '/landing/carrito.png';
  }

  daysUntil(dateValue?: string): number {
    if (!dateValue) {
      return 999;
    }

    const today = new Date();
    const target = new Date(dateValue);

    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  }

  expiryText(product: Product): string {
    const days = this.daysUntil(product.fecha_vencimiento);

    if (days === 999) {
      return 'Sin fecha de vencimiento';
    }

    if (days < 0) {
      return `Venció hace ${Math.abs(days)} día(s)`;
    }

    if (days === 0) {
      return 'Vence hoy';
    }

    return `Vence en ${days} día(s)`;
  }

  statusClass(status?: string): string {
    return this.normalizeStatus(status).replace(/\s+/g, '-');
  }

  formatMoney(value: number): string {
    return value.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/login');
  }

  private isToday(dateValue?: string): boolean {
    if (!dateValue) {
      return false;
    }

    const today = new Date();
    const date = new Date(dateValue);

    return today.toDateString() === date.toDateString();
  }

  private normalizeStatus(status?: string): string {
    return String(status ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
