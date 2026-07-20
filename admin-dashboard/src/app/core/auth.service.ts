import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface LoginResponse {
  accessToken: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Realiza el inicio de sesión del usuario.
   * @param correo Correo electrónico del usuario.
   * @param password Contraseña del usuario.
   */
  login(correo: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { correo, password }).pipe(
      tap((response) => {
        if (response && response.accessToken) {
          localStorage.setItem('iot_token', response.accessToken);
          this.router.navigate(['/dashboard']);
        }
      }),
      catchError((error) => {
        console.error('Error durante el inicio de sesión:', error);
        return throwError(() => new Error('Error de autenticación. Por favor, verifique sus credenciales e intente de nuevo.'));
      })
    );
  }
}
