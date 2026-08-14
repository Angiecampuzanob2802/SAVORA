import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { NotificationService } from '../../core/notification.service';
import { RESOURCE_CONFIGS, ResourceConfig, ResourceField } from '../../core/resources';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

type Row = Record<string, unknown>;
type LookupMap = Record<string, Row[]>;
type DashboardCardTone = 'green' | 'orange' | 'yellow' | 'red';

interface DashboardCard {
  label: string;
  value: number | string;
  tone: DashboardCardTone;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly toast = inject(ToastService);
  readonly resources = RESOURCE_CONFIGS;
  readonly selected = signal<ResourceConfig>(this.resources[0]);
  readonly rows = signal<Row[]>([]);
  readonly lookups = signal<LookupMap>({});
  readonly searchTerm = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly allPedidos = signal<Row[]>([]);
  readonly allProductos = signal<Row[]>([]);
  readonly allEntregas = signal<Row[]>([]);
  readonly allPromociones = signal<Row[]>([]);
  readonly allDetalles = signal<Row[]>([]);

  readonly reportFilter = signal('mes');
  readonly editing = signal<Row | null>(null);
  readonly editorOpen = signal(false);
  readonly form = signal<FormGroup>(this.buildForm(this.resources[0]));

  readonly filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.rows();
    }

    return this.rows().filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(term)),
    );
  });

  readonly dashboardCards = computed<DashboardCard[]>(() => {
    const productos = this.allProductos();
    const pedidos = this.filteredPedidosReport();
    const entregas = this.filteredEntregasReport();
    const promociones = this.allPromociones();

    const ventasDia = this.allPedidos()
      .filter((pedido) => this.isToday(String(pedido['fecha_pedido'] ?? '')))
      .reduce((sum, pedido) => sum + Number(pedido['total'] ?? 0), 0);

    return [
      {
        label: 'Productos activos',
        value: productos.filter((producto) => producto['estado_producto'] !== false).length,
        tone: 'green',
        icon: 'fa-solid fa-box-open',
      },
      {
        label: 'Próximos a vencer',
        value: this.productosProximosVencer().length,
        tone: 'orange',
        icon: 'fa-solid fa-hourglass-half',
      },
      {
        label: 'Stock bajo',
        value: this.productosCriticos().length,
        tone: 'red',
        icon: 'fa-solid fa-triangle-exclamation',
      },
      {
        label: 'Pedidos pendientes',
        value: pedidos.filter((pedido) => String(pedido['estado_pedido']).toLowerCase() === 'pendiente').length,
        tone: 'yellow',
        icon: 'fa-solid fa-bag-shopping',
      },
      {
        label: 'Ventas del día',
        value: `$${ventasDia.toLocaleString('es-CO')}`,
        tone: 'green',
        icon: 'fa-solid fa-chart-line',
      },
      {
        label: 'Promociones activas',
        value: promociones.filter((promocion) => promocion['estado'] !== false).length,
        tone: 'orange',
        icon: 'fa-solid fa-tags',
      },
      {
        label: 'Desperdicio evitado',
        value: `${this.allDetalles().reduce((sum, detalle) => sum + Number(detalle['cantidad'] ?? 0), 0)} und.`,
        tone: 'green',
        icon: 'fa-solid fa-leaf',
      },
      {
        label: 'Entregas pendientes',
        value: entregas.filter((entrega) =>
          !['Entregada', 'Cancelada'].includes(String(entrega['estado_entrega'] ?? '')),
        ).length,
        tone: 'yellow',
        icon: 'fa-solid fa-truck-fast',
      },
    ];
  });

  readonly productosProximosVencer = computed(() =>
    this.allProductos()
      .filter((producto) => {
        const fecha = String(producto['fecha_vencimiento'] ?? '');

        if (!fecha) {
          return false;
        }

        const diff = this.daysUntil(fecha);
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) =>
        this.daysUntil(String(a['fecha_vencimiento'])) - this.daysUntil(String(b['fecha_vencimiento'])),
      ),
  );

  readonly alertasPromocion = computed(() =>
    this.productosProximosVencer().slice(0, 6),
  );

  readonly reportRanges = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Semana', value: 'semana' },
    { label: 'Mes', value: 'mes' },
    { label: 'Todo', value: 'todo' },
  ];

  readonly pedidosPorEstado = computed(() => this.countBy(this.filteredPedidosReport(), 'estado_pedido'));
  readonly entregasPorEstado = computed(() => this.countBy(this.filteredEntregasReport(), 'estado_entrega'));

  readonly productosMasVendidos = computed(() => {
    const productNames = new Map(
      this.allProductos().map((producto) => [Number(producto['id_producto']), String(producto['nombre'])]),
    );

    const totals = new Map<number, { nombre: string; cantidad: number; total: number }>();

    for (const detail of this.allDetalles()) {
      const productId = Number(detail['id_producto']);
      const current = totals.get(productId) ?? {
        nombre: productNames.get(productId) ?? `Producto #${productId}`,
        cantidad: 0,
        total: 0,
      };

      current.cantidad += Number(detail['cantidad'] ?? 0);
      current.total += Number(detail['subtotal'] ?? 0);
      totals.set(productId, current);
    }

    return Array.from(totals.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  });

  readonly productosCriticos = computed(() =>
    this.allProductos()
      .filter((producto) => Number(producto['stock'] ?? 0) <= 20)
      .sort((a, b) => Number(a['stock'] ?? 0) - Number(b['stock'] ?? 0))
      .slice(0, 8),
  );

  constructor(
    private readonly api: ApiService,
    readonly notifications: NotificationService,
    readonly session: SessionService,
    private readonly router: Router,
    private readonly location: Location,
  ) {}

  ngOnInit(): void {
    this.notifications.load();
    this.load();
    this.loadLookups();
    this.loadOperationalStats();
  }

  selectResource(resource: ResourceConfig): void {
    this.selected.set(resource);
    this.searchTerm.set('');
    this.editing.set(null);
    this.editorOpen.set(false);
    this.form.set(this.buildForm(resource));
    this.load();
    this.loadLookups(resource);
    this.loadOperationalStats();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.list<Row>(this.selected().endpoint).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con la API. Revisa que FastAPI este corriendo.');
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  loadLookups(resource = this.selected()): void {
    const nextLookups: LookupMap = {};

    for (const field of resource.fields) {
      if (!field.optionsEndpoint || nextLookups[field.key]) {
        continue;
      }

      this.api.list<Row>(field.optionsEndpoint).subscribe({
        next: (rows) => {
          this.lookups.update((current) => ({ ...current, [field.key]: rows }));
        },
      });
    }

    this.lookups.set(nextLookups);
  }

  loadOperationalStats(): void {
    this.api.list<Row>('/pedidos').subscribe({ next: (rows) => this.allPedidos.set(rows) });
    this.api.list<Row>('/productos').subscribe({ next: (rows) => this.allProductos.set(rows) });
    this.api.list<Row>('/entregas').subscribe({ next: (rows) => this.allEntregas.set(rows) });
    this.api.list<Row>('/promociones').subscribe({ next: (rows) => this.allPromociones.set(rows) });
    this.api.list<Row>('/detalle-pedido').subscribe({ next: (rows) => this.allDetalles.set(rows) });
  }

  save(): void {
    this.applyCreateValidators();

    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return;
    }

    const resource = this.selected();
    const payload = this.cleanPayload(this.form().getRawValue());
    const current = this.editing();

    const request = current
      ? this.api.update<Row>(resource.endpoint, Number(current[resource.idKey]), payload)
      : this.api.create<Row>(resource.endpoint, payload);

    request.subscribe({
      next: () => {
        const message = current ? 'Registro actualizado.' : 'Registro creado.';
        this.message.set(message);
        this.toast.success(message);
        this.cancelEdit();
        this.notifications.load();
        this.load();
        this.loadOperationalStats();
      },
      error: () => {
        const message = 'No se pudo guardar. Verifica los datos y la conexión.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  openCreate(): void {
    this.message.set('');
    this.error.set('');
    this.editing.set(null);
    this.form.set(this.buildForm(this.selected()));
    this.loadLookups();
    this.editorOpen.set(true);
  }

  edit(row: Row): void {
    this.message.set('');
    this.error.set('');
    this.editing.set(row);
    this.loadLookups();
    this.form().patchValue(row);
    this.editorOpen.set(true);
  }

  remove(row: Row): void {
    const resource = this.selected();
    const id = Number(row[resource.idKey]);

    if (!confirm(`Deseas eliminar el registro ${id} de ${resource.title}?`)) {
      return;
    }

    this.api.delete(resource.endpoint, id).subscribe({
      next: () => {
        this.message.set('Registro eliminado.');
        this.toast.success('El registro fue eliminado correctamente.', 'Registro eliminado');
        this.notifications.load();
        this.load();
        this.loadOperationalStats();
      },
      error: () => {
        const message = 'No se pudo eliminar el registro.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  isBusinessRequestResource(): boolean {
    return this.selected().name === 'solicitudes-negocio';
  }

  businessRequestApproved(row: Row): boolean {
    return this.normalizeText(row['estado_solicitud']).includes('aprob');
  }

  canApproveBusinessRequest(row: Row): boolean {
    return this.isBusinessRequestResource() && !this.businessRequestApproved(row);
  }

  approveBusinessRequest(row: Row): void {
    const id = Number(row['id_solicitud']);

    if (!id) {
      this.error.set('No se encontro la solicitud para aprobar.');
      return;
    }

    this.api.put<Row>(`/solicitudes-negocio/${id}/aprobar`).subscribe({
      next: (response) => {
        const correo = String(response['correo'] ?? row['correo'] ?? '');
        const password = String(response['contrasena_temporal'] ?? '123456');

        this.message.set(`Solicitud aprobada. Usuario creado: ${correo} / clave temporal: ${password}`);
        this.toast.success(`La solicitud de ${correo} fue aprobada y la cuenta quedó creada.`, 'Solicitud aprobada');
        this.load();
        this.loadOperationalStats();
      },
      error: (response) => {
        const detail = response?.error?.detail;
        const message = detail || 'No se pudo aprobar la solicitud.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.editorOpen.set(false);
    this.form.set(this.buildForm(this.selected()));
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  setReportFilter(value: string): void {
    this.reportFilter.set(value);
  }

  exportCurrentCsv(): void {
    this.downloadCsv(`${this.selected().name}.csv`, this.filteredRows());
  }

  exportCsv(name: string, rows: Row[]): void {
    this.downloadCsv(`${name}.csv`, rows);
  }

  fieldInputType(field: ResourceField): string {
    if (field.type === 'boolean') {
      return 'checkbox';
    }

    return field.type;
  }

  optionLabel(option: Row, field: ResourceField): string {
    const labelKey = field.optionLabel ?? field.optionValue ?? '';
    const valueKey = field.optionValue ?? '';
    const label = option[labelKey] ?? option[valueKey] ?? '';

    return String(label);
  }

  optionValue(option: Row, field: ResourceField): unknown {
    return option[field.optionValue ?? 'id'];
  }

  displayValue(value: unknown): string {
    if (value === true) {
      return 'Activo';
    }

    if (value === false) {
      return 'Inactivo';
    }

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  valueAsString(value: unknown): string {
    return String(value ?? '');
  }

  quickAction(resourceName: string): void {
    const resource = this.resources.find((item) => item.name === resourceName);

    if (!resource) {
      return;
    }

    this.selectResource(resource);
    this.openCreate();
  }

  daysUntil(dateValue: string): number {
    const today = new Date();
    const target = new Date(dateValue);

    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  }

  private buildForm(resource: ResourceConfig): FormGroup {
    const controls: Record<string, FormControl> = {};

    for (const field of resource.fields) {
      controls[field.key] = new FormControl(
        this.defaultValueFor(field),
        field.required || field.createRequired ? Validators.required : [],
      );
    }

    return new FormGroup(controls);
  }

  private cleanPayload(payload: Row): Row {
    const cleaned: Row = {};

    for (const field of this.selected().fields) {
      const value = payload[field.key];

      if (value === '' || value === null || value === undefined) {
        continue;
      }

      cleaned[field.key] = field.type === 'number' ? Number(value) : value;
    }

    return cleaned;
  }

  private applyCreateValidators(): void {
    const isEditing = Boolean(this.editing());

    for (const field of this.selected().fields) {
      if (!field.createRequired) {
        continue;
      }

      const control = this.form().get(field.key);

      if (!control) {
        continue;
      }

      control.setValidators(isEditing ? [] : [Validators.required]);
      control.updateValueAndValidity();
    }
  }

  private defaultValueFor(field: ResourceField): unknown {
    if (field.type === 'boolean') {
      return field.key === 'estado' || field.key === 'estado_producto';
    }

    if (field.type === 'date' && field.key === 'fecha_registro') {
      return new Date().toISOString().slice(0, 10);
    }

    return '';
  }

  private filteredPedidosReport(): Row[] {
    return this.filterRowsByDate(this.allPedidos(), 'fecha_pedido');
  }

  private filteredEntregasReport(): Row[] {
    return this.filterRowsByDate(this.allEntregas(), 'fecha_programada', 'fecha_entrega');
  }

  private filterRowsByDate(rows: Row[], primaryDateKey: string, fallbackDateKey?: string): Row[] {
    const filter = this.reportFilter();

    if (filter === 'todo') {
      return rows;
    }

    const today = new Date();
    const start = new Date(today);

    if (filter === 'hoy') {
      start.setHours(0, 0, 0, 0);
    }

    if (filter === 'semana') {
      start.setDate(today.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }

    if (filter === 'mes') {
      start.setMonth(today.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
    }

    return rows.filter((row) => {
      const rawDate = row[primaryDateKey] || (fallbackDateKey ? row[fallbackDateKey] : null);

      if (!rawDate) {
        return false;
      }

      const date = new Date(String(rawDate));
      return date >= start && date <= today;
    });
  }

  private countBy(rows: Row[], key: string): Array<{ label: string; value: number }> {
    const counts = new Map<string, number>();

    for (const row of rows) {
      const label = String(row[key] ?? 'Sin estado');
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
  }

  private downloadCsv(filename: string, rows: Row[]): void {
    if (!rows.length) {
      this.message.set('No hay datos para exportar.');
      return;
    }

    const columns = Array.from(
      rows.reduce((keys, row) => {
        Object.keys(row).forEach((key) => keys.add(key));
        return keys;
      }, new Set<string>()),
    );

    const separator = ';';
    const csvRows = [
      columns.join(separator),
      ...rows.map((row) => columns.map((column) => this.csvValue(row[column])).join(separator)),
    ];

    const blob = new Blob([`\ufeff${csvRows.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  private csvValue(value: unknown): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  private isToday(dateValue: string): boolean {
    if (!dateValue) {
      return false;
    }

    const today = new Date();
    const date = new Date(dateValue);

    return today.toDateString() === date.toDateString();
  }

  private normalizeText(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/login');
  }

  goBack(): void {
    this.location.back();
  }
}
