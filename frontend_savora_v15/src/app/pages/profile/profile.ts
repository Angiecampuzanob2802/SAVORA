import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { NotificationService } from '../../core/notification.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono?: string;
  direccion?: string;
  fecha_registro?: string;
  estado?: boolean;
  id_rol?: number;
}

interface ProfileCard {
  label: string;
  value: string;
  tone: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly toast = inject(ToastService);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly profile = signal<Usuario | null>(null);
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    telefono: new FormControl(''),
    direccion: new FormControl(''),
    contrasena: new FormControl(''),
  });

  readonly roleLabel = computed(() => this.session.roleLabel());

  readonly profileCompletion = computed(() => {
    const profile = this.profile();

    if (!profile) {
      return 0;
    }

    const values = [profile.nombre, profile.correo, profile.telefono, profile.direccion];
    const completed = values.filter((value) => Boolean(String(value ?? '').trim())).length;

    return Math.round((completed / values.length) * 100);
  });

  readonly profileCards = computed<ProfileCard[]>(() => {
    const user = this.session.user();
    const profile = this.profile();

    return [
      {
        label: 'Rol activo',
        value: this.roleLabel(),
        tone: 'green',
      },
      {
        label: 'Perfil completo',
        value: `${this.profileCompletion()}%`,
        tone: 'orange',
      },
      {
        label: 'Notificaciones',
        value: `${this.notifications.unreadCount()}`,
        tone: 'yellow',
      },
      {
        label: 'Estado',
        value: profile?.estado === false ? 'Inactivo' : 'Activo',
        tone: profile?.estado === false ? 'red' : 'green',
      },
      {
        label: 'Correo',
        value: user?.correo ?? profile?.correo ?? 'Sin correo',
        tone: 'soft',
      },
      {
        label: 'Usuario',
        value: user ? `#${user.id_usuario}` : '-',
        tone: 'soft',
      },
    ];
  });

  constructor(
    private readonly api: ApiService,
    readonly notifications: NotificationService,
    readonly session: SessionService,
    private readonly router: Router,
    private readonly location: Location,
  ) {}

  ngOnInit(): void {
    this.notifications.load();
    this.loadProfile();
  }

  loadProfile(): void {
    const user = this.session.user();

    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.error.set('');

    this.api.get<Usuario>('/usuarios', user.id_usuario).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form.patchValue({
          nombre: profile.nombre,
          telefono: profile.telefono ?? '',
          direccion: profile.direccion ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu perfil. Revisa que el backend este activo.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const user = this.session.user();

    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa el nombre para guardar tu perfil.');
      return;
    }

    const value = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      nombre: value.nombre ?? '',
      telefono: value.telefono ?? '',
      direccion: value.direccion ?? '',
    };

    if (value.contrasena?.trim()) {
      payload['contrasena'] = value.contrasena;
    }

    this.loading.set(true);
    this.message.set('');
    this.error.set('');

    this.api.update<Usuario>('/usuarios', user.id_usuario, payload).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.session.updateCurrentUser({
          nombre: profile.nombre,
        });
        this.form.patchValue({ contrasena: '' });
        this.showPassword.set(false);
        this.message.set('Perfil actualizado correctamente.');
        this.toast.success('Tus datos personales fueron guardados.', 'Perfil actualizado');
        this.loading.set(false);
      },
      error: (response) => {
        const message = response?.error?.detail ?? 'No se pudo actualizar el perfil.';
        this.error.set(message);
        this.toast.error(message);
        this.loading.set(false);
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update((current) => !current);
  }

  initials(): string {
    const name = this.form.controls.nombre.value || this.session.user()?.nombre || 'SAVORA';
    const parts = name.trim().split(/\s+/).filter(Boolean);

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  primaryRouteLabel(): string {
    if (this.session.canAccess('admin')) {
      return 'Ir al panel';
    }

    if (this.session.canAccess('establecimiento')) {
      return 'Ir a mi negocio';
    }

    if (this.session.canAccess('logistica')) {
      return 'Ir a logística';
    }

    return 'Ir a tienda';
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
