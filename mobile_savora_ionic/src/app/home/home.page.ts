import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Geolocation } from '@capacitor/geolocation';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonToolbar,
} from '@ionic/angular/standalone';
import * as L from 'leaflet';

type Product = {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio_venta: number;
  stock: number;
};

type Store = {
  id_establecimiento: number;
  nombre: string;
  tipo: string;
  direccion?: string;
  descripcion?: string;
  latitud: number | null;
  longitud: number | null;
  distancia_km: number | null;
  productos: Product[];
};

type CartItem = {
  product: Product;
  store: Store;
  quantity: number;
};

type LoginResponse = {
  id_usuario: number;
  nombre: string;
  correo: string;
  id_rol?: number;
  nombre_rol?: string;
  access_token: string;
  token_type: string;
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonInput,
    IonToolbar,
  ],
})
export class HomePage implements AfterViewInit, OnDestroy {
  private readonly defaultLocation = { lat: 4.710989, lng: -74.072092 };
  private map?: L.Map;
  private userMarker?: L.Marker;
  private storeLayer = L.layerGroup();
  private refreshTimers: ReturnType<typeof setTimeout>[] = [];

  apiBaseUrl = localStorage.getItem('savora_api_url') || 'http://127.0.0.1:8000';
  search = '';
  loadingLocation = true;
  apiError = '';
  userLocation = this.defaultLocation;
  stores: Store[] = [];
  activeStore?: Store;
  activeTab: 'inicio' | 'mapa' | 'ofertas' | 'bolsa' | 'perfil' = 'inicio';
  cartItems: CartItem[] = [];
  checkoutMessage = '';
  checkoutError = '';
  loginCorreo = localStorage.getItem('savora_last_email') || '';
  loginContrasena = '';
  showLoginPassword = false;
  loginLoading = false;
  loginError = '';
  currentUser: LoginResponse | null = this.loadStoredUser();

  fallbackOffers = [
    {
      name: 'Combo desayuno',
      store: 'Panaderia La Espiga',
      price: '$7.500',
      before: '$13.000',
      tag: 'Hoy',
      image: 'assets/productos/combo-desayuno.png',
    },
    {
      name: 'Bowl casero',
      store: 'Sabor Casero',
      price: '$10.000',
      before: '$18.000',
      tag: 'Cerca',
      image: 'assets/productos/bowl-casero.png',
    },
  ];

  constructor(private readonly http: HttpClient) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ensureMapReady();
      this.loadLocationAndStores();
    }, 180);
  }

  ngOnDestroy(): void {
    this.refreshTimers.forEach((timer) => clearTimeout(timer));
    this.map?.remove();
  }

  get filteredStores(): Store[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.stores;
    }

    return this.stores.filter((store) => {
      const productMatch = store.productos.some((product) =>
        `${product.nombre} ${product.descripcion || ''}`.toLowerCase().includes(term),
      );

      return `${store.nombre} ${store.tipo} ${store.descripcion || ''}`.toLowerCase().includes(term) || productMatch;
    });
  }

  get visibleOffers(): Product[] {
    return this.filteredStores
      .reduce<Product[]>((products, store) => [...products, ...store.productos.slice(0, 2)], [])
      .slice(0, 4);
  }

  get activeProducts(): Product[] {
    return this.activeStore?.productos ?? [];
  }

  get cartCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  get cartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.product.precio_venta * item.quantity, 0);
  }

  get cartStoreName(): string {
    return this.cartItems[0]?.store.nombre ?? 'Sin tienda seleccionada';
  }

  async loadLocationAndStores(): Promise<void> {
    this.loadingLocation = true;
    this.apiError = '';

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
      });
      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch {
      this.userLocation = this.defaultLocation;
    }

    this.centerUser();
    this.loadStores();
  }

  loadStores(): void {
    const url = `${this.apiBaseUrl}/public/mapa/tiendas?lat=${this.userLocation.lat}&lng=${this.userLocation.lng}`;

    this.http.get<Store[]>(url).subscribe({
      next: (stores) => {
        this.stores = stores.filter((store) => this.hasCoordinates(store));
        this.activeStore = this.stores[0];
        this.ensureMapReady();
        this.renderStoreMarkers();
        this.fitMapToStores();
        this.loadingLocation = false;
        this.refreshMap();
      },
      error: () => {
        this.apiError = 'No se pudo conectar con la API. Revisa que FastAPI este corriendo y que la base tenga coordenadas.';
        this.loadingLocation = false;
      },
    });
  }

  selectStore(store: Store): void {
    this.activeStore = store;
    this.activeTab = 'mapa';
    this.ensureMapReady();

    setTimeout(() => {
      if (this.hasCoordinates(store)) {
        this.map?.setView([store.latitud, store.longitud], 15, { animate: true });
        this.refreshMap();
      }
    }, 120);
  }

  showStoreProducts(store = this.activeStore): void {
    if (!store) {
      return;
    }

    this.selectStore(store);
    this.activeTab = 'ofertas';
  }

  setTab(tab: 'inicio' | 'mapa' | 'ofertas' | 'bolsa' | 'perfil'): void {
    this.activeTab = tab;

    if (tab === 'inicio' || tab === 'mapa') {
      setTimeout(() => {
        this.ensureMapReady();
        this.renderStoreMarkers();
        this.refreshMap();
      }, 120);
    }
  }

  addToCart(product: Product, store = this.activeStore): void {
    if (!store || product.stock <= 0) {
      return;
    }

    const otherStoreItem = this.cartItems.find((item) => item.store.id_establecimiento !== store.id_establecimiento);
    if (otherStoreItem) {
      this.checkoutError = 'La bolsa solo puede tener productos de una misma tienda. Vaciala para comprar en otra tienda.';
      this.checkoutMessage = '';
      this.activeTab = 'bolsa';
      return;
    }

    const item = this.cartItems.find((cartItem) => cartItem.product.id_producto === product.id_producto);

    if (item) {
      if (item.quantity < product.stock) {
        item.quantity += 1;
      }
    } else {
      this.cartItems.push({ product, store, quantity: 1 });
    }

    this.checkoutError = '';
    this.checkoutMessage = `${product.nombre} agregado a la bolsa.`;
  }

  removeFromCart(product: Product): void {
    const item = this.cartItems.find((cartItem) => cartItem.product.id_producto === product.id_producto);

    if (!item) {
      return;
    }

    item.quantity -= 1;
    if (item.quantity <= 0) {
      this.cartItems = this.cartItems.filter((cartItem) => cartItem.product.id_producto !== product.id_producto);
    }
  }

  quantityFor(product: Product): number {
    return this.cartItems.find((item) => item.product.id_producto === product.id_producto)?.quantity ?? 0;
  }

  clearCart(): void {
    this.cartItems = [];
    this.checkoutMessage = '';
    this.checkoutError = '';
  }

  toggleLoginPassword(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  confirmCart(): void {
    if (!this.cartItems.length) {
      this.checkoutError = 'Agrega al menos un producto antes de confirmar.';
      this.checkoutMessage = '';
      return;
    }

    const token = localStorage.getItem('savora_token') || localStorage.getItem('access_token') || localStorage.getItem('token');

    if (!token) {
      this.checkoutError = 'La bolsa ya esta lista. Falta conectar el inicio de sesion para crear el pedido en la API.';
      this.checkoutMessage = '';
      return;
    }

    const payload = {
      metodo_pago: 'Efectivo',
      direccion_entrega: 'Retiro en tienda',
      items: this.cartItems.map((item) => ({
        id_producto: item.product.id_producto,
        cantidad: item.quantity,
      })),
    };

    this.http
      .post<{ id_pedido: number; mensaje: string }>(`${this.apiBaseUrl}/checkout/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (response) => {
          this.clearCart();
          this.checkoutMessage = `${response.mensaje}. Pedido #${response.id_pedido}`;
          this.checkoutError = '';
          this.loadStores();
        },
        error: () => {
          this.checkoutError = 'No se pudo confirmar el pedido. Revisa la sesion o el stock disponible.';
          this.checkoutMessage = '';
        },
      });
  }

  login(): void {
    this.loginError = '';
    this.checkoutMessage = '';
    this.checkoutError = '';

    const correo = this.loginCorreo.trim();
    const contrasena = this.loginContrasena.trim();

    if (!correo || !contrasena) {
      this.loginError = 'Escribe correo y contrasena.';
      return;
    }

    this.loginLoading = true;

    this.http
      .post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, {
        correo,
        contrasena,
      })
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.loginLoading = false;
          this.loginContrasena = '';
          this.loginError = '';
          localStorage.setItem('savora_token', user.access_token);
          localStorage.setItem('savora_user', JSON.stringify(user));
          localStorage.setItem('savora_last_email', user.correo);
          this.checkoutMessage = `Bienvenido, ${user.nombre}.`;
        },
        error: () => {
          this.loginLoading = false;
          this.loginError = 'Correo o contrasena incorrectos.';
        },
      });
  }

  logout(): void {
    this.currentUser = null;
    this.loginContrasena = '';
    this.checkoutMessage = 'Sesion cerrada.';
    this.checkoutError = '';
    localStorage.removeItem('savora_token');
    localStorage.removeItem('savora_user');
  }

  private loadStoredUser(): LoginResponse | null {
    const storedUser = localStorage.getItem('savora_user');

    if (!storedUser || !localStorage.getItem('savora_token')) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as LoginResponse;
    } catch {
      localStorage.removeItem('savora_user');
      localStorage.removeItem('savora_token');
      return null;
    }
  }

  formatDistance(store: Store): string {
    if (store.distancia_km === null) {
      return 'Distancia pendiente';
    }

    if (store.distancia_km < 1) {
      return `${Math.round(store.distancia_km * 1000)} m`;
    }

    return `${store.distancia_km.toFixed(1)} km`;
  }

  productImage(product: Product): string {
    const name = product.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

    const images: Record<string, string> = {
      'hamburguesa-clasica': 'assets/productos/hamburguesa.png',
      'papas-fritas': 'assets/productos/papas.png',
      cheesecake: 'assets/productos/cheescake.png',
      'jugo-de-naranja': 'assets/productos/jugo-naranja.png',
      'limonada-natural': 'assets/productos/limonada-natural.png',
      'cafe-americano': 'assets/productos/cafe-americano.png',
      cappuccino: 'assets/productos/capuccino.png',
      capuccino: 'assets/productos/capuccino.png',
      'sandwich-mixto': 'assets/productos/sadwich-mixto.png',
      brownie: 'assets/productos/brownie.png',
      'combo-desayuno': 'assets/productos/combo-desayuno.png',
      'bowl-casero': 'assets/productos/bowl-casero.png',
      'pan-integral': 'assets/productos/Pan-Integral.png',
    };

    return this.resolveProductImage(product.imagen_url) || images[name] || 'assets/productos/hamburguesa.png';
  }

  storeImage(store: Store): string {
    const name = store.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

    const type = (store.tipo || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const images: Record<string, string> = {
      'hotel-mirador': 'assets/lugares/hotel-mirador.png',
      sumhec: 'assets/lugares/fruteria.png',
      'supermercado-mercaldia': 'assets/lugares/supermercado.png',
      'olla-de-aurelio': 'assets/lugares/olla-aurelio.png',
      'restaurante-sabor-casero': 'assets/lugares/restaurante.png',
      'panaderia-la-espiga': 'assets/lugares/panaderia-espiga.png',
    };

    if (images[name]) {
      return images[name];
    }

    if (type.includes('hotel')) {
      return 'assets/lugares/hotel-mirador.png';
    }

    if (type.includes('fruter')) {
      return 'assets/lugares/fruteria.png';
    }

    if (type.includes('supermercado')) {
      return 'assets/lugares/supermercado.png';
    }

    if (type.includes('restaurante')) {
      return 'assets/lugares/restaurante.png';
    }

    if (type.includes('panader')) {
      return 'assets/lugares/panaderia-espiga.png';
    }

    return 'assets/landing/carrito.png';
  }

  private resolveProductImage(imageUrl?: string): string | null {
    if (!imageUrl) {
      return null;
    }

    const cleanUrl = imageUrl.trim();

    if (!cleanUrl) {
      return null;
    }

    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('assets/')) {
      return cleanUrl;
    }

    if (cleanUrl.startsWith('/productos/')) {
      return `assets${cleanUrl}`;
    }

    if (cleanUrl.startsWith('productos/')) {
      return `assets/${cleanUrl}`;
    }

    return cleanUrl;
  }

  private initMap(): void {
    const mapContainer = document.getElementById('savora-map');

    if (!mapContainer) {
      return;
    }

    if (this.map && this.map.getContainer() === mapContainer) {
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.userMarker = undefined;
      this.storeLayer = L.layerGroup();
    }

    this.map = L.map(mapContainer, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    }).setView([this.userLocation.lat, this.userLocation.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(this.map);

    this.storeLayer.addTo(this.map);
    this.centerUser();
    this.refreshMap();
  }

  private ensureMapReady(): void {
    this.initMap();
    this.refreshMap();
  }

  private refreshMap(): void {
    if (!this.map) {
      return;
    }

    this.refreshTimers.forEach((timer) => clearTimeout(timer));
    this.refreshTimers = [80, 320, 760].map((delay) =>
      setTimeout(() => this.map?.invalidateSize({ animate: true }), delay),
    );
  }

  private centerUser(): void {
    if (!this.map) {
      return;
    }

    const userIcon = L.divIcon({
      className: 'savora-user-marker',
      html: '<span>Tu</span>',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (this.userMarker) {
      this.userMarker.setLatLng([this.userLocation.lat, this.userLocation.lng]);
    } else {
      this.userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon }).addTo(this.map);
    }

    this.map.setView([this.userLocation.lat, this.userLocation.lng], 14);
  }

  private renderStoreMarkers(): void {
    this.storeLayer.clearLayers();

    for (const store of this.filteredStores) {
      if (!this.hasCoordinates(store)) {
        continue;
      }

      const marker = L.marker([store.latitud, store.longitud], {
        icon: L.divIcon({
          className: 'savora-store-marker',
          html: '<span><img src="assets/landing/carrito.png" alt="Tienda SAVORA"></span>',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      });

      marker.on('click', () => this.selectStore(store));
      marker.addTo(this.storeLayer);
    }
  }

  private fitMapToStores(): void {
    if (!this.map) {
      return;
    }

    const points = this.stores
      .filter((store) => this.hasCoordinates(store))
      .map((store) => [store.latitud, store.longitud] as [number, number]);

    if (points.length > 1) {
      this.map.fitBounds(L.latLngBounds(points), {
        animate: true,
        maxZoom: 14,
        padding: [28, 28],
      });
      return;
    }

    if (points.length === 1) {
      this.map.setView(points[0], 14, { animate: true });
      return;
    }

    this.centerUser();
  }

  private hasCoordinates(store: Store): store is Store & { latitud: number; longitud: number } {
    if (store.latitud === null || store.longitud === null) {
      return false;
    }

    const latitude = Number(store.latitud);
    const longitude = Number(store.longitud);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      && latitude >= -90 && latitude <= 90
      && longitude >= -180 && longitude <= 180;
  }
}
