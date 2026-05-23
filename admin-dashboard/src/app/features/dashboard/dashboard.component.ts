import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

interface AccessLog {
  id: number;
  uid_leido: string;
  autorizado: boolean;
  motivo: string;
  fecha_hora: string;
  punto_acceso_id?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden font-sans">
      <!-- Ambient Glows -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>



      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <!-- Dashboard Header -->
        <div class="md:flex md:items-center md:justify-between mb-8">
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
              Historial de Accesos
            </h1>
            <p class="mt-1 text-sm text-slate-400">
              Registro de validaciones de tarjetas RFID y accesos de usuarios en tiempo real.
            </p>
          </div>
          <div class="mt-4 flex md:mt-0 md:ml-4 gap-3">
            <button
              (click)="fetchLogs()"
              [disabled]="isLoading()"
              class="inline-flex items-center px-4 py-2 border border-slate-800 rounded-xl shadow-sm text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-805 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <svg class="h-4 w-4 mr-2" [class.animate-spin]="isLoading()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
              </svg>
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <!-- Error Message Alert -->
        <div *ngIf="errorMessage()" class="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-2xl text-sm text-red-400 flex items-center gap-2">
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Table Container -->
        <div class="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-800/60">
              <thead class="bg-slate-950/40">
                <tr>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">UID Leído</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Autorizado</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Motivo</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40 bg-slate-900/10">
                <!-- Log List Rows -->
                <tr *ngFor="let log of logs()" class="hover:bg-slate-800/20 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-300">
                    {{ log.uid_leido }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      *ngIf="log.autorizado"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400"></span>
                      Sí
                    </span>
                    <span
                      *ngIf="!log.autorizado"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    >
                      <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-400"></span>
                      No
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {{ log.motivo }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {{ log.fecha_hora | date:'dd/MM/yyyy HH:mm:ss' }}
                  </td>
                </tr>

                <!-- Empty State -->
                <tr *ngIf="logs().length === 0 && !isLoading()">
                  <td colspan="4" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <svg class="h-10 w-10 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <p class="text-sm text-slate-400 font-medium">No hay registros de acceso disponibles</p>
                      <p class="text-xs text-slate-500 mt-1">El historial aparecerá a medida que se realicen validaciones.</p>
                    </div>
                  </td>
                </tr>

                <!-- Loading State -->
                <tr *ngIf="isLoading() && logs().length === 0">
                  <td colspan="4" class="px-6 py-12">
                    <div class="flex items-center justify-center gap-3 text-slate-400 text-sm">
                      <svg class="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Cargando registros del servidor...</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private socket!: Socket;

  readonly logs = signal<AccessLog[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchLogs();
    this.socket = io('http://localhost:3000');
    this.socket.on('nuevo-acceso', (newLog: AccessLog) => {
      this.logs.update(currentLogs => [newLog, ...currentLogs]);
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Obtiene los registros de acceso del backend.
   */
  fetchLogs(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<AccessLog[]>('http://localhost:3000/api/access/logs').subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener el historial de accesos:', err);
        this.errorMessage.set('No se pudo establecer conexión con el servidor o el usuario no está autorizado.');
        this.isLoading.set(false);
      },
    });
  }

}
