  import { HttpClient } from '@angular/common/http';
  import { inject, Injectable } from '@angular/core';
  import { catchError, Observable, throwError } from 'rxjs';

  import { ToastService } from './toast.service';
  
  @Injectable({
    providedIn: 'root',
  })
  /** Centraliza las solicitudes HTTP y la reacción ante errores de sesión. */
  export class ApiService {
    private readonly baseUrl = 'http://127.0.0.1:8000';
    private readonly http = inject(HttpClient);
    private readonly toast = inject(ToastService);
  
    list<T>(endpoint: string): Observable<T[]> {
      return this.http.get<T[]>(`${this.baseUrl}${endpoint}/`, this.authOptions()).pipe(this.handleAuthError(endpoint));
    }
  
    get<T>(endpoint: string, id: number): Observable<T> {
      return this.http.get<T>(`${this.baseUrl}${endpoint}/${id}`, this.authOptions()).pipe(this.handleAuthError(endpoint));
    }
  
    post<T>(endpoint: string, payload: Record<string, unknown>): Observable<T> {
      return this.http.post<T>(`${this.baseUrl}${endpoint}`, payload, this.authOptions()).pipe(this.handleAuthError(endpoint));
    }
  
    create<T>(endpoint: string, payload: Record<string, unknown>): Observable<T> {
      return this.http.post<T>(`${this.baseUrl}${endpoint}/`, payload, this.authOptions()).pipe(this.handleAuthError(endpoint));
    }
  
    update<T>(endpoint: string, id: number, payload: Record<string, unknown>): Observable<T> {
      return this.http.put<T>(`${this.baseUrl}${endpoint}/${id}`, payload, this.authOptions()).pipe(this.handleAuthError(endpoint));
    }
  
    put<T>(endpoint: string, payload: Record<string, unknown> = {}): Observable<T> {
      return this.http.put<T>(`${this.baseUrl}${endpoint}`, payload, this.authOptions()).pipe(this.handleAuthError(endpoint));
    }
  
    delete(endpoint: string, id: number): Observable<{ mensaje: string }> {
      return this.http
        .delete<{ mensaje: string }>(`${this.baseUrl}${endpoint}/${id}`, this.authOptions())
        .pipe(this.handleAuthError(endpoint));
    }
  
    private authOptions(): { headers?: { Authorization: string } } {
      if (typeof localStorage === 'undefined') {
        return {};
      }
  
      const raw = localStorage.getItem('savora_user');
  
      if (!raw) {
        return {};
      }
  
      try {
        const user = JSON.parse(raw) as { access_token?: string };
        return user.access_token ? { headers: { Authorization: `Bearer ${user.access_token}` } } : {};
      } catch {
        return {};
      }
    }
  
    private handleAuthError<T>(endpoint: string): (source: Observable<T>) => Observable<T> {
      return (source: Observable<T>) =>
        source.pipe(
          catchError((error) => {
            if (error?.status === 401 && endpoint !== '/auth/login' && typeof localStorage !== 'undefined') {
              localStorage.removeItem('savora_user');
              this.toast.warning('Tu sesión expiró. Ingresa nuevamente para continuar.', 'Sesión finalizada');
              if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login?expired=1';
              }
            }

            if (error?.status === 0) {
              this.toast.error('No pudimos conectar con el servidor. Verifica que FastAPI esté activo.');
            } else if (error?.status >= 500) {
              this.toast.error('El servidor presentó un error inesperado. Intenta nuevamente.');
            }
  
            return throwError(() => error);
          }),
        );
    }
  }
