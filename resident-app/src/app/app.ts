import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { apiBaseUrl } from './app.config';
import { registerPlugin } from '@capacitor/core';

const Nfc = registerPlugin<any>('Nfc');

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly toastController = inject(ToastController);

  protected readonly isLoading = signal(false);
  protected readonly isActivating = signal(false);
  protected readonly isRecovering = signal(false);
  protected readonly isBindingDevice = signal(false);
  protected readonly mode = signal<'activate' | 'recover'>('activate');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly accessToken = signal<string | null>(localStorage.getItem('resident_token'));
  protected readonly deviceToken = signal<string | null>(localStorage.getItem('resident_device_token'));
  protected readonly profile = signal<any | null>(null);
  protected readonly credentials = signal<any[]>([]);
  protected readonly smartphoneCredential = signal<any | null>(null);

  protected readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

  protected readonly activationForm = this.fb.nonNullable.group({
    activationCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  protected readonly recoveryForm = this.fb.nonNullable.group({
    recoveryCode: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
  });

  public ngOnInit(): void {
    if (this.accessToken()) {
      void this.loadProfile();
    }
    const token = this.deviceToken();
    if (token) {
      void this.syncNfcToken(token);
    }
  }

  private async syncNfcToken(token: string): Promise<void> {
    try {
      await Nfc.setDeviceToken({ token });
    } catch (e) {
      console.warn('NFC plugin not available', e);
    }
  }

  protected setMode(mode: 'activate' | 'recover'): void {
    this.mode.set(mode);
    this.errorMessage.set(null);
  }

  protected setModeFromSegment(value: string | number | undefined): void {
    if (value === 'activate' || value === 'recover') {
      this.setMode(value);
    }
  }

  protected async activate(): Promise<void> {
    if (this.activationForm.invalid) {
      this.activationForm.markAllAsTouched();
      return;
    }

    this.isActivating.set(true);
    this.errorMessage.set(null);

    const { activationCode } = this.activationForm.getRawValue();

    this.http.post<{ accessToken: string }>(`${apiBaseUrl}/auth/activate`, { activationCode }).subscribe({
      next: async ({ accessToken }) => {
        localStorage.setItem('resident_token', accessToken);
        this.accessToken.set(accessToken);
        this.isActivating.set(false);
        await this.presentToast('Cuenta activada');
        void this.loadProfile();
      },
      error: async (error) => {
        this.isActivating.set(false);
        this.errorMessage.set(error?.error?.message ?? 'No se pudo activar la cuenta.');
      },
    });
  }

  protected async recover(): Promise<void> {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    this.isRecovering.set(true);
    this.errorMessage.set(null);

    const { recoveryCode } = this.recoveryForm.getRawValue();

    this.http.post<{ accessToken: string }>(`${apiBaseUrl}/auth/recover`, { recoveryCode }).subscribe({
      next: async ({ accessToken }) => {
        localStorage.setItem('resident_token', accessToken);
        this.accessToken.set(accessToken);
        this.isRecovering.set(false);
        await this.presentToast('Cuenta recuperada');
        void this.loadProfile();
      },
      error: async (error) => {
        this.isRecovering.set(false);
        this.errorMessage.set(error?.error?.message ?? 'No se pudo recuperar la cuenta.');
      },
    });
  }

  protected async loadProfile(): Promise<void> {
    const token = this.accessToken();

    if (!token) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.get<{ user: any; credentials: any[]; smartphoneCredential: any | null }>(`${apiBaseUrl}/resident/me`, { headers }).subscribe({
      next: ({ user, credentials, smartphoneCredential }) => {
        this.profile.set(user);
        this.credentials.set(credentials);
        this.smartphoneCredential.set(smartphoneCredential);
        this.isLoading.set(false);

        if (!this.deviceToken() && !smartphoneCredential) {
          void this.bindThisPhone();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo cargar tu perfil.');
      },
    });
  }

  protected logout(): void {
    localStorage.removeItem('resident_token');
    this.accessToken.set(null);
    this.profile.set(null);
    this.credentials.set([]);
  }

  protected async bindThisPhone(): Promise<void> {
    const token = this.accessToken();

    if (!token) {
      return;
    }

    this.isBindingDevice.set(true);
    this.errorMessage.set(null);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.post<{ deviceToken: string }>(`${apiBaseUrl}/resident/device-token/rotate`, {}, { headers }).subscribe({
      next: async ({ deviceToken }) => {
        localStorage.setItem('resident_device_token', deviceToken);
        this.deviceToken.set(deviceToken);
        void this.syncNfcToken(deviceToken);
        this.isBindingDevice.set(false);
        await this.presentToast('Teléfono vinculado');
        void this.loadProfile();
      },
      error: async (error) => {
        this.isBindingDevice.set(false);
        this.errorMessage.set(error?.error?.message ?? 'No se pudo vincular el teléfono.');
      },
    });
  }

  protected readonly isOpeningDoor = signal(false);

  protected async openRemoteDoor(): Promise<void> {
    const token = this.accessToken();
    if (!token) return;

    this.isOpeningDoor.set(true);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.post<{ autorizado: boolean; mensaje: string }>(`${apiBaseUrl}/access/remote-open`, { puntoAccesoId: 'garita_principal' }, { headers }).subscribe({
      next: async (response) => {
        this.isOpeningDoor.set(false);
        if (response.autorizado) {
          await this.presentToast('✅ ' + response.mensaje);
        } else {
          await this.presentToast('❌ ' + response.mensaje);
        }
      },
      error: async (error) => {
        this.isOpeningDoor.set(false);
        await this.presentToast('Error al abrir la puerta.');
      }
    });
  }

  protected async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1200,
      position: 'bottom',
      color: 'dark',
    });

    await toast.present();
  }
}
