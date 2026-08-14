import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

interface LandingMetric {
  value: string;
  label: string;
}

interface LandingCard {
  icon: string;
  label: string;
  title: string;
  text: string;
}

interface LandingProduct {
  name: string;
  store: string;
  price: string;
  oldPrice: string;
  tag: string;
  image: string;
  remaining: string;
}

interface LandingAlly {
  icon: string;
  label: string;
  title: string;
  text: string;
  stat: string;
}

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  readonly mobileAppUrl = 'http://localhost:8100';

  readonly metrics: LandingMetric[] = [
    { value: '40%', label: 'ahorro estimado' },
    { value: '4', label: 'roles conectados' },
    { value: '24h', label: 'gestion diaria' },
  ];

  readonly impacts: LandingCard[] = [
    {
      icon: 'fa-solid fa-leaf',
      label: '01',
      title: 'Menos desperdicio',
      text: 'Productos proximos a vencer con mejor salida.',
    },
    {
      icon: 'fa-solid fa-piggy-bank',
      label: '02',
      title: 'Mas ahorro',
      text: 'Ofertas utiles para clientes, familias y cuidadores.',
    },
    {
      icon: 'fa-solid fa-chart-line',
      label: '03',
      title: 'Mejor control',
      text: 'Inventario, pedidos y entregas conectados.',
    },
  ];

  readonly steps: LandingCard[] = [
    {
      icon: 'fa-solid fa-magnifying-glass-location',
      label: 'Explora',
      title: 'Encuentra ofertas cercanas',
      text: 'Filtra productos por categoria, negocio, precio y disponibilidad antes de que se venzan.',
    },
    {
      icon: 'fa-solid fa-basket-shopping',
      label: 'Reserva',
      title: 'Aparta tu pedido',
      text: 'Agrega al carrito, confirma el metodo de pago y elige entrega o recogida programada.',
    },
    {
      icon: 'fa-solid fa-truck-fast',
      label: 'Aprovecha',
      title: 'Recibe y ahorra',
      text: 'Disfruta alimentos en buen estado mientras apoyas negocios locales y reduces desperdicio.',
    },
  ];

  readonly products: LandingProduct[] = [
    {
      name: 'Cappuccino',
      store: 'Cafe Verde Natural',
      price: '$5.000',
      oldPrice: '$8.000',
      tag: 'Bebida',
      image: '/productos/capuccino.png',
      remaining: 'Quedan 5',
    },
    {
      name: 'Cheesecake',
      store: 'Panaderia La Espiga',
      price: '$10.000',
      oldPrice: '$16.000',
      tag: 'Postre',
      image: '/productos/cheescake.png',
      remaining: 'Quedan 3',
    },
    {
      name: 'Sandwich mixto',
      store: 'Restaurante Sabor Casero',
      price: '$8.000',
      oldPrice: '$13.000',
      tag: 'Comida',
      image: '/productos/sadwich-mixto.png',
      remaining: 'Quedan 7',
    },
    {
      name: 'Jugo de naranja',
      store: 'Fruteria La Canasta',
      price: '$6.000',
      oldPrice: '$9.000',
      tag: 'Bebida',
      image: '/productos/jugo-naranja.png',
      remaining: 'Quedan 9',
    },
    {
      name: 'Papas fritas',
      store: 'Mercado Central',
      price: '$5.500',
      oldPrice: '$8.500',
      tag: 'Snack',
      image: '/productos/papas.png',
      remaining: 'Quedan 4',
    },
  ];

  readonly allies: LandingAlly[] = [
    {
      icon: 'fa-solid fa-utensils',
      label: 'Restaurantes',
      title: 'Convierte excedentes en ventas',
      text: 'Publica platos del dia, controla horarios limite y mueve inventario con promociones.',
      stat: 'Pedidos listos',
    },
    {
      icon: 'fa-solid fa-bread-slice',
      label: 'Panaderias',
      title: 'Vende packs antes del cierre',
      text: 'Agrupa panes, postres y bebidas con descuentos visibles para clientes cercanos.',
      stat: 'Packs activos',
    },
    {
      icon: 'fa-solid fa-store',
      label: 'Supermercados',
      title: 'Gestiona vencimientos con orden',
      text: 'Identifica productos proximos a vencer y crea oportunidades antes de perder stock.',
      stat: 'Stock controlado',
    },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const sectionId = window.location.hash.replace('#', '');

    if (sectionId) {
      setTimeout(() => this.scrollToSection(sectionId), 120);
    }
  }

  scrollToSection(sectionId: string, event?: Event): void {
    event?.preventDefault();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = document.getElementById(sectionId);

    if (!target) {
      return;
    }

    window.history.replaceState(null, '', `#${sectionId}`);
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
