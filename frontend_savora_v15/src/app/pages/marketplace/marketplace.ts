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
  precio_venta?: number;
  stock?: number;
  estado_producto?: boolean;
  id_categoria?: number;
  id_establecimiento?: number;
  imagen_url?: string;
}

interface Order {
  id_pedido: number;
  fecha_pedido?: string;
  estado_pedido: string;
  total: number;
  direccion_entrega?: string;
  metodo_pago?: string;
  id_usuario?: number;
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

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-marketplace',
  imports: [CommonModule, RouterLink],
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.css',
  host: {
    '(document:keydown.escape)': 'closeOpenDetails()',
  },
})
export class Marketplace implements OnInit {
  private readonly toast = inject(ToastService);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly details = signal<OrderDetail[]>([]);
  readonly selectedOrder = signal<Order | null>(null);
  readonly selectedProduct = signal<Product | null>(null);
  readonly cart = signal<CartItem[]>([]);
  readonly selectedCategory = signal<number | null>(null);
  readonly selectedOrderStatus = signal('Todos');
  readonly query = signal('');
  readonly address = signal('');
  readonly paymentMethod = signal('Efectivo');
  readonly checkoutMessage = signal('');
  readonly checkoutError = signal('');
  readonly checkingOut = signal(false);

  readonly availableProducts = computed(() =>
    this.products().filter((product) => product.estado_producto !== false && Number(product.stock ?? 0) > 0),
  );

  readonly filteredProducts = computed(() => {
    const term = this.normalizeText(this.query());
    const category = this.selectedCategory();

    return this.availableProducts()
      .filter((product) => {
        const searchable = this.normalizeText(`${product.nombre} ${product.descripcion ?? ''}`);
        const matchesTerm = !term || searchable.includes(term);
        const matchesCategory = !category || product.id_categoria === category;
        return matchesTerm && matchesCategory;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  readonly cartTotal = computed(() =>
    this.cart().reduce((total, item) => total + Number(item.product.precio_venta ?? 0) * item.quantity, 0),
  );

  readonly cartCount = computed(() => this.cart().reduce((total, item) => total + item.quantity, 0));

  readonly cartEstablishments = computed(() => {
    const ids = this.cart()
      .map((item) => item.product.id_establecimiento)
      .filter((id): id is number => typeof id === 'number');

    return Array.from(new Set(ids));
  });

  readonly myOrders = computed(() => {
    const userId = this.session.user()?.id_usuario;
    const status = this.selectedOrderStatus().toLowerCase();

    return this.orders()
      .filter((order) => !userId || order.id_usuario === userId)
      .filter((order) => status === 'todos' || order.estado_pedido.toLowerCase() === status)
      .sort((a, b) => Number(b.id_pedido) - Number(a.id_pedido));
  });

  readonly orderStatuses = computed(() => {
    const statuses = new Set(this.orders().map((order) => order.estado_pedido).filter(Boolean));
    return ['Todos', ...Array.from(statuses)];
  });

  readonly selectedCategoryLabel = computed(() => {
    const categoryId = this.selectedCategory();

    if (!categoryId) {
      return 'Todas las categorias';
    }

    return this.categories().find((category) => category.id_categoria === categoryId)?.nombre ?? 'Categoria';
  });

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
    this.notifications.load();
    this.api.list<Product>('/productos').subscribe((products) => this.products.set(products));
    this.api.list<Category>('/categorias').subscribe((categories) => this.categories.set(categories));
    this.api.list<Order>('/pedidos').subscribe((orders) => this.orders.set(orders));
    this.api.list<OrderDetail>('/detalle-pedido').subscribe((details) => this.details.set(details));
  }

  setCategory(id: number | null): void {
    this.selectedCategory.set(id);
  }

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setOrderStatus(status: string): void {
    this.selectedOrderStatus.set(status);
  }

  addToCart(product: Product): void {
    if ((product.stock ?? 0) <= 0) {
      this.checkoutError.set('Este producto no tiene stock disponible.');
      this.scrollToCart();
      return;
    }

    const currentEstablishment = this.cartEstablishments()[0];

    if (currentEstablishment && product.id_establecimiento && currentEstablishment !== product.id_establecimiento) {
      this.checkoutError.set('Tu pedido solo puede incluir productos de un mismo establecimiento.');
      this.scrollToCart();
      return;
    }

    this.checkoutError.set('');
    this.checkoutMessage.set('');

    this.cart.update((items) => {
      const existing = items.find((item) => item.product.id_producto === product.id_producto);

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + 1, product.stock ?? existing.quantity + 1);
        return items.map((item) =>
          item.product.id_producto === product.id_producto ? { ...item, quantity: nextQuantity } : item,
        );
      }

      return [...items, { product, quantity: 1 }];
    });

    this.checkoutMessage.set(`${product.nombre} agregado al carrito.`);
    this.toast.info(`${product.nombre} fue agregado al carrito.`, 'Producto agregado');
  }

  changeQuantity(productId: number, delta: number): void {
    this.cart.update((items) =>
      items
        .map((item) => {
          if (item.product.id_producto !== productId) {
            return item;
          }

          const quantity = Math.max(0, Math.min(item.quantity + delta, item.product.stock ?? item.quantity));
          return { ...item, quantity };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  removeFromCart(productId: number): void {
    this.cart.update((items) => items.filter((item) => item.product.id_producto !== productId));
  }

  clearCart(): void {
    this.cart.set([]);
    this.checkoutMessage.set('Carrito vaciado correctamente.');
    this.checkoutError.set('');
    this.toast.info('El carrito quedó vacío.', 'Carrito actualizado');
  }

  updateAddress(event: Event): void {
    this.address.set((event.target as HTMLInputElement).value);
  }

  updatePaymentMethod(event: Event): void {
    this.paymentMethod.set((event.target as HTMLSelectElement).value);
  }

  checkout(): void {
    if (!this.cart().length) {
      this.checkoutError.set('Agrega al menos un producto al carrito.');
      return;
    }

    if (this.cartEstablishments().length > 1) {
      this.checkoutError.set('Tu pedido solo puede incluir productos de un mismo establecimiento.');
      return;
    }

    if (!this.address().trim()) {
      this.checkoutError.set('Ingresa una direccion de entrega.');
      return;
    }

    this.checkingOut.set(true);
    this.checkoutError.set('');
    this.checkoutMessage.set('');

    this.api
      .create<{ id_pedido: number; total: number; mensaje: string }>('/checkout', {
        direccion_entrega: this.address(),
        metodo_pago: this.paymentMethod(),
        items: this.cart().map((item) => ({
          id_producto: item.product.id_producto,
          cantidad: item.quantity,
        })),
      })
      .subscribe({
        next: (response) => {
          this.checkoutMessage.set(`Pedido #${response.id_pedido} creado correctamente.`);
          this.toast.success(
            `El pedido #${response.id_pedido} fue confirmado por COP ${Number(response.total).toLocaleString('es-CO')}.`,
            'Reserva confirmada',
          );
          this.cart.set([]);
          this.address.set('');
          this.checkingOut.set(false);
          this.notifications.load();
          this.loadData();
        },
        error: (error) => {
          const message = error?.error?.detail ?? 'No se pudo crear el pedido.';
          this.checkoutError.set(message);
          this.toast.error(message);
          this.checkingOut.set(false);
        },
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

  categoryName(product: Product): string {
    return this.categories().find((category) => category.id_categoria === product.id_categoria)?.nombre ?? 'Oferta';
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

  closeOpenDetails(): void {
    this.closeOrderDetail();
    this.closeProductDetail();
  }

  productImage(product: Product): string {
    const name = this.normalizeText(product.nombre).replace(/\s+/g, '-');

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
      'sadwich-mixto': '/productos/sadwich-mixto.png',
      brownie: '/productos/brownie.png',
      'pan-integral': '/productos/Pan-Integral.png',
    };

    return product.imagen_url || images[name] || '/productos/default-product.png';
  }

  cartQuantity(productId: number): number {
    return this.cart().find((item) => item.product.id_producto === productId)?.quantity ?? 0;
  }

  isInCart(productId: number): boolean {
    return this.cartQuantity(productId) > 0;
  }

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/login');
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private scrollToCart(): void {
    document.getElementById('carrito')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
