import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

interface AccessLog {
  id: number;
  uid_leido: string;
  autorizado: boolean;
  motivo: string;
  fecha_hora: string;
  punto_acceso_id?: number;
  nombre_completo?: string;
  bloque_villa?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-black text-slate-100 relative overflow-x-hidden font-sans pb-12">

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <!-- Dashboard Header -->
        <div class="mb-10">
          <h1 class="text-3xl font-bold tracking-tight text-white">
            Historial de Accesos
          </h1>
          <p class="mt-2 text-sm text-[#8E8E93]">
            Registro de validaciones de tarjetas RFID y accesos de usuarios en tiempo real.
          </p>
        </div>

        <!-- Error Message Alert -->
        <div *ngIf="errorMessage()" class="mb-8 p-4 bg-[#1C1C1E] border border-rose-900/50 rounded-2xl text-sm text-rose-400 flex items-center gap-3 shadow-lg">
          <div class="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
            <svg class="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Table Container -->
        <div class="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#2C2C2E] bg-[#18181b]">
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Residente / Unidad</th>
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Estado</th>
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Detalles del Acceso</th>
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider text-right">Fecha / Hora</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#2C2C2E]">
                <!-- Log List Rows -->
                <tr *ngFor="let log of logs()" class="hover:bg-[#27272a]/40 transition-colors">
                  <!-- Col 1: Name and Unit -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4 border border-[#3A3A3C]"
                           [ngClass]="log.nombre_completo !== 'Tag Desconocido' ? 'bg-gradient-to-tr from-emerald-600 to-emerald-800' : 'bg-gradient-to-tr from-slate-700 to-slate-800'">
                        {{ log.nombre_completo !== 'Tag Desconocido' ? (log.nombre_completo!.charAt(0) | uppercase) : '?' }}
                      </div>
                      <div>
                        <div class="text-[15px] font-semibold text-white" [ngClass]="{'text-[#8E8E93] italic': log.nombre_completo === 'Tag Desconocido'}">
                          {{ log.nombre_completo }}
                        </div>
                        <div class="text-xs text-[#8E8E93] mt-0.5">{{ log.bloque_villa }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Col 2: Status -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span *ngIf="log.autorizado" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span class="w-1.5 h-1.5 mr-2 rounded-full bg-emerald-400"></span>
                      Autorizado
                    </span>
                    <span *ngIf="!log.autorizado" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <span class="w-1.5 h-1.5 mr-2 rounded-full bg-rose-400"></span>
                      Denegado
                    </span>
                  </td>

                  <!-- Col 3: Details -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-[14px] text-slate-200">{{ log.motivo }}</div>
                    <div class="text-xs text-[#8E8E93] font-mono mt-0.5">UID: {{ log.uid_leido }}</div>
                  </td>

                  <!-- Col 4: Time -->
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="text-[14px] text-white">{{ log.fecha_hora | date:'HH:mm:ss' }}</div>
                    <div class="text-xs text-[#8E8E93] mt-0.5">{{ log.fecha_hora | date:'dd/MM/yyyy' }}</div>
                  </td>
                </tr>

                <!-- Loading State -->
                <tr *ngIf="isLoading() && logs().length === 0">
                  <td colspan="4" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center justify-center gap-4">
                      <div class="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                      <span class="text-[#8E8E93] font-medium">Cargando registros...</span>
                    </div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr *ngIf="logs().length === 0 && !isLoading()">
                  <td colspan="4" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <div class="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mb-4">
                        <svg class="h-8 w-8 text-[#8E8E93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <p class="text-[15px] text-white font-medium">No hay registros de acceso disponibles</p>
                      <p class="text-sm text-[#8E8E93] mt-1">El historial aparecerá en tiempo real a medida que ocurran.</p>
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
    this.socket = io(environment.socketUrl);
    this.socket.on('nuevo-acceso', (newLog: AccessLog) => {
      newLog.nombre_completo = newLog.nombre_completo || 'Tag Desconocido';
      newLog.bloque_villa = newLog.bloque_villa || 'N/A';
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

    this.http.get<AccessLog[]>(`${environment.apiUrl}/access/logs`).subscribe({
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
