import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly credentialsUrl = `${environment.apiUrl}/credentials`;

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

  getRecoveryCode(userId: string) {
    return this.http.get<{ user: any; recoveryCode: string }>(`${this.apiUrl}/${userId}/recovery-code`, this.getHeaders());
  }

  rotateRecoveryCode(userId: string) {
    return this.http.post<{ user: any; recoveryCode: string }>(`${this.apiUrl}/${userId}/recovery-code/rotate`, {}, this.getHeaders());
  }

  createUser(data: { nombreCompleto: string; bloqueVilla: string; rol: string }) {
    return this.http.post<{ user: any; activationCode: string; recoveryCode: string; activationCodeExpiresAt: string }>(this.apiUrl, data, this.getHeaders());
  }

  assignCredential(usuarioId: string, uidHex: string, tipo: string) {
    return this.http.post<any>(this.credentialsUrl, { usuarioId, uidHex, tipo }, this.getHeaders());
  }

  toggleUserStatus(id: string, estado: boolean) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { estado }, this.getHeaders());
  }

  getUserCredentials(userId: string) {
    return this.http.get<any[]>(`${this.credentialsUrl}/user/${userId}`, this.getHeaders());
  }

  deleteCredential(id: string) {
    return this.http.delete<any>(`${this.credentialsUrl}/${id}`, this.getHeaders());
  }
}
