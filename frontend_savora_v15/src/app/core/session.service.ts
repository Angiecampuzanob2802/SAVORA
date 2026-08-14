import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ApiService } from './api.service';
import { ToastService } from './toast.service';

export type UserRole =
  | 'Administrador'
  | 'Establecimiento'
  | 'Cliente'
  | 'Usuario Logistico';

export interface SessionUser {
  id_usuario: number;
  nombre: string;
  correo: string;
  id_rol?: number;
  nombre_rol?: UserRole | string;
  access_token?: string;
  token_type?: string;
}

@Injectable({
  providedIn: 'root',
})
/** Mantiene la sesión local, normaliza roles y decide la navegación permitida. */
export class SessionService {
  readonly user = signal<SessionUser | null>(this.readStoredUser());
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  login(correo: string, contrasena: string): Observable<SessionUser> {
    return this.api.post<SessionUser>('/auth/login', { correo, contrasena }).pipe(
      tap((user) => {
        this.saveUser(user);
        this.toast.success(`Bienvenido, ${user.nombre}.`, 'Inicio de sesión exitoso');
      }),
    );
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('savora_user');
    }

    this.user.set(null);
    this.toast.info('Tu sesión se cerró correctamente.', 'Sesión finalizada');
  }

  updateCurrentUser(data: Partial<SessionUser>): void {
    const current = this.user();

    if (!current) {
      return;
    }

    this.saveUser({ ...current, ...data });
  }

  get token(): string | null {
    return this.user()?.access_token ?? null;
  }

  get role(): string {
    return this.normalizeRole(this.user()?.nombre_rol ?? '');
  }

  hasRole(allowedRoles: string[]): boolean {
    return allowedRoles.some(
      (allowedRole) => this.role === this.normalizeRole(allowedRole),
    );
  }

  /** Comprueba si el rol actual puede acceder al panel solicitado. */
  canAccess(route: 'admin' | 'cliente' | 'establecimiento' | 'logistica'): boolean {
    const routeRoles: Record<typeof route, string[]> = {
      admin: ['Administrador'],
      establecimiento: ['Establecimiento', 'Administrador'],
      cliente: ['Cliente', 'Administrador'],
      logistica: ['Usuario Logistico', 'Administrador'],
    };

    return this.hasRole(routeRoles[route]);
  }

  /** Devuelve la pantalla inicial correspondiente al rol autenticado. */
  redirectPathForRole(): string {
    if (this.hasRole(['Administrador'])) {
      return '/admin';
    }

    if (this.hasRole(['Establecimiento'])) {
      return '/establecimiento';
    }

    if (this.hasRole(['Usuario Logistico'])) {
      return '/logistica';
    }

    return '/cliente';
  }

  roleLabel(): string {
    if (this.hasRole(['Administrador'])) {
      return 'Administrador';
    }

    if (this.hasRole(['Establecimiento'])) {
      return 'Aliado';
    }

    if (this.hasRole(['Usuario Logistico'])) {
      return 'Logística';
    }

    return 'Cliente';
  }

  private saveUser(user: SessionUser): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('savora_user', JSON.stringify(user));
    }

    this.user.set(user);
  }

  private readStoredUser(): SessionUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem('savora_user');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      localStorage.removeItem('savora_user');
      return null;
    }
  }

  private normalizeRole(role: string): string {
    return role
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
