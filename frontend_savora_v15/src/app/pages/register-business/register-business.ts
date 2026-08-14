import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

interface BusinessRequest extends Record<string, unknown> {
  nombre_propietario: string;
  correo: string;
  celular: string;
  nombre_establecimiento: string;
  tipo_negocio: string;
  ciudad: string;
  direccion: string;
  mensaje: string;
}

@Component({
  selector: 'app-register-business',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register-business.html',
  styleUrl: './register-business.css',
})
export class RegisterBusiness {
  private readonly toast = inject(ToastService);
  readonly sent = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  submitRequest(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    const payload: BusinessRequest = {
      nombre_propietario: String(data.get('nombre_propietario') ?? '').trim(),
      correo: String(data.get('correo') ?? '').trim(),
      celular: String(data.get('celular') ?? '').trim(),
      nombre_establecimiento: String(data.get('nombre_establecimiento') ?? '').trim(),
      tipo_negocio: String(data.get('tipo_negocio') ?? '').trim(),
      ciudad: String(data.get('ciudad') ?? '').trim(),
      direccion: String(data.get('direccion') ?? '').trim(),
      mensaje: String(data.get('mensaje') ?? '').trim(),
    };

    if (!payload.nombre_propietario || !payload.correo || !payload.nombre_establecimiento) {
      this.error.set('Completa nombre, correo y nombre del establecimiento.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.api.create('/solicitudes-negocio', payload).subscribe({
      next: () => {
        this.sent.set(true);
        this.loading.set(false);
        form.reset();
        this.toast.success(
          'Recibimos la solicitud de tu establecimiento. Te avisaremos cuando sea revisada.',
          'Solicitud enviada',
        );

        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 3000);
      },
      error: (response) => {
        this.loading.set(false);
        const detail = response?.error?.detail;
        const message = detail || 'No se pudo enviar la solicitud. Revisa la conexión con el backend.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }
}
