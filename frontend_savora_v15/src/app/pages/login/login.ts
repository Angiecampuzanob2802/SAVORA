import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

type LoginMode = 'login' | 'reset' | 'google';

interface AuthMessageResponse {
  mensaje: string;
}

interface PasswordResetPayload extends Record<string, unknown> {
  correo: string;
  nueva_contrasena: string;
}

interface GoogleCheckPayload extends Record<string, unknown> {
  correo: string;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly toast = inject(ToastService);
  readonly mode = signal<LoginMode>('login');
  readonly error = signal('');
  readonly success = signal('');
  readonly loading = signal(false);

  readonly form = new FormGroup({
    correo: new FormControl('', [Validators.required, Validators.email]),
    contrasena: new FormControl('', [Validators.required]),
  });

  readonly resetForm = new FormGroup({
    correo: new FormControl('', [Validators.required, Validators.email]),
    nueva_contrasena: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmar_contrasena: new FormControl('', [Validators.required]),
  });

  readonly googleForm = new FormGroup({
    correo: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('expired') === '1') {
      this.error.set('Tu sesión expiró. Ingresa nuevamente.');
    }
  }

  switchMode(mode: LoginMode): void {
    this.mode.set(mode);
    this.error.set('');
    this.success.set('');

    if (mode === 'reset') {
      const correo = this.form.controls.correo.value ?? '';
      this.resetForm.patchValue({ correo });
    }

    if (mode === 'google') {
      const correo = this.form.controls.correo.value ?? '';
      this.googleForm.patchValue({ correo });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa correo y contraseña.');
      return;
    }

    const { correo, contrasena } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.session.login(correo ?? '', contrasena ?? '').subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(this.session.redirectPathForRole());
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Correo o contraseña incorrectos.');
        this.toast.error('Revisa el correo y la contraseña e intenta nuevamente.', 'Acceso rechazado');
      },
    });
  }

  submitReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      this.error.set('Completa el correo y escribe una contraseña de mínimo 6 caracteres.');
      return;
    }

    const { correo, nueva_contrasena, confirmar_contrasena } = this.resetForm.getRawValue();

    if (nueva_contrasena !== confirmar_contrasena) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    const payload: PasswordResetPayload = {
      correo: correo ?? '',
      nueva_contrasena: nueva_contrasena ?? '',
    };

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.post<AuthMessageResponse>('/auth/reset-password', payload).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.success.set(response.mensaje);
        this.form.patchValue({ correo: payload.correo, contrasena: '' });
        this.switchMode('login');
        this.success.set('Contraseña actualizada. Ahora puedes iniciar sesión.');
        this.toast.success('La contraseña fue actualizada. Ya puedes iniciar sesión.');
      },
      error: (response) => {
        this.loading.set(false);
        const message = response?.error?.detail ?? 'No se pudo actualizar la contraseña.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  submitGoogleEmail(): void {
    if (this.googleForm.invalid) {
      this.googleForm.markAllAsTouched();
      this.error.set('Escribe un correo válido para continuar.');
      return;
    }

    const correo = this.googleForm.controls.correo.value ?? '';
    const payload: GoogleCheckPayload = { correo };

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.post<AuthMessageResponse>('/auth/google-check', payload).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.form.patchValue({ correo, contrasena: '' });
        this.switchMode('login');
        this.success.set(response.mensaje);
        this.toast.success(response.mensaje, 'Correo verificado');
      },
      error: (response) => {
        this.loading.set(false);
        const message = response?.error?.detail ?? 'No encontramos un usuario con ese correo.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }
}
