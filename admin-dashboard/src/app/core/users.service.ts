import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/users';
  private readonly credentialsUrl = 'http://localhost:3000/api/credentials';

  private getHeaders() {
    const token = localStorage.getItem('iot_token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  getUsers() {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders());
  }

  createUser(data: { nombreCompleto: string; bloqueVilla: string; rol: string }) {
    return this.http.post<any>(this.apiUrl, data, this.getHeaders());
  }

  assignCredential(usuarioId: string, uidHex: string, tipo: string) {
    return this.http.post<any>(this.credentialsUrl, { usuarioId, uidHex, tipo }, this.getHeaders());
  }
}
