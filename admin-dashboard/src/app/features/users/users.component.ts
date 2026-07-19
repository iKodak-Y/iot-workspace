import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsersService } from '../../core/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-black text-slate-100 relative overflow-x-hidden font-sans pb-12">

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <!-- Header -->
        <div class="mb-10">
          <h1 class="text-3xl font-bold tracking-tight text-white">
            Gestión de Residentes
          </h1>
          <p class="mt-2 text-sm text-[#8E8E93]">
            Administra la información y el acceso de los residentes y personal.
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

        <!-- Alerts -->
        <div *ngIf="activationInfo() as codes" class="mb-8 p-6 bg-[#1C1C1E] border-l-4 border-emerald-500 rounded-2xl shadow-xl">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-white mb-1">Nuevos códigos generados</h3>
              <p class="text-sm text-[#8E8E93] leading-relaxed">El código temporal (6 dígitos) activa la cuenta por primera vez. El de recuperación (8 dígitos) sirve si el usuario cambia de teléfono o cierra sesión.</p>
            </div>
            <div class="flex flex-col gap-3 min-w-[280px]">
              <div class="flex items-center justify-between gap-3 p-3 bg-[#09090b] rounded-xl border border-[#27272a]">
                <span class="font-mono text-lg text-emerald-400 tracking-[0.2em] font-medium">{{ codes.activationCode }}</span>
                <button type="button" (click)="copyCode(codes.activationCode)" class="text-xs font-semibold text-[#8E8E93] hover:text-white uppercase tracking-wider transition-colors">Copiar</button>
              </div>
              <div class="flex items-center justify-between gap-3 p-3 bg-[#09090b] rounded-xl border border-[#27272a]">
                <span class="font-mono text-lg text-amber-400 tracking-[0.2em] font-medium">{{ codes.recoveryCode }}</span>
                <button type="button" (click)="copyCode(codes.recoveryCode)" class="text-xs font-semibold text-[#8E8E93] hover:text-white uppercase tracking-wider transition-colors">Copiar</button>
              </div>
              <button type="button" (click)="activationInfo.set(null)" class="mt-2 text-sm text-[#0A84FF] hover:text-[#409cff] font-medium transition-colors text-right">Descartar mensaje</button>
            </div>
          </div>
        </div>

        <div *ngIf="recoveryInfo() as recovery" class="mb-8 p-6 bg-[#1C1C1E] border-l-4 border-amber-500 rounded-2xl shadow-xl">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-white mb-1">Código de recuperación</h3>
              <p class="text-sm text-[#8E8E93] leading-relaxed">Solo muéstralo cuando el residente lo pida. Si cambió de teléfono o sospechas exposición, reemítelo desde aquí.</p>
              <p class="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#27272a] text-slate-300">Usuario: {{ recovery.user.nombreCompleto }}</p>
            </div>
            <div class="flex flex-col gap-3 min-w-[280px]">
              <div class="flex items-center justify-between gap-3 p-3 bg-[#09090b] rounded-xl border border-[#27272a]">
                <span class="font-mono text-lg text-amber-400 tracking-[0.2em] font-medium">{{ recovery.recoveryCode }}</span>
                <button type="button" (click)="copyCode(recovery.recoveryCode)" class="text-xs font-semibold text-[#8E8E93] hover:text-white uppercase tracking-wider transition-colors">Copiar</button>
              </div>
              <div class="flex justify-between items-center mt-2">
                <button type="button" (click)="refreshRecoveryCode(recovery.user.id)" [disabled]="isRefreshingRecovery()" class="text-sm text-[#0A84FF] hover:text-[#409cff] font-medium transition-colors disabled:opacity-50">
                  <span *ngIf="!isRefreshingRecovery()">Reemitir código</span>
                  <span *ngIf="isRefreshingRecovery()">Procesando...</span>
                </button>
                <button type="button" (click)="recoveryInfo.set(null)" class="text-sm text-[#8E8E93] hover:text-white transition-colors">Cerrar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Section: Form -->
        <div class="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-6 md:p-8 mb-10 shadow-xl">
          <h2 class="text-xl font-semibold text-white mb-6">Registrar Nuevo Residente</h2>
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="flex flex-col md:flex-row gap-5 items-start">
            
            <div class="flex-1 w-full">
              <label for="nombreCompleto" class="block text-sm font-medium text-[#8E8E93] mb-2">Nombre Completo</label>
              <input type="text" id="nombreCompleto" formControlName="nombreCompleto" 
                     class="w-full bg-[#09090b] border border-[#2C2C2E] rounded-xl px-4 py-3 text-[15px] text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-[#636366] outline-none"
                     placeholder="Ej. Juan Pérez">
              <div *ngIf="userForm.get('nombreCompleto')?.invalid && userForm.get('nombreCompleto')?.touched" class="mt-2 text-xs text-rose-400">Requerido</div>
            </div>

            <div class="flex-1 w-full grid grid-cols-2 gap-4">
              <div>
                <label for="bloque" class="block text-sm font-medium text-[#8E8E93] mb-2">Bloque</label>
                <input type="text" id="bloque" formControlName="bloque"
                       class="w-full bg-[#09090b] border border-[#2C2C2E] rounded-xl px-4 py-3 text-[15px] text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-[#636366] outline-none"
                       placeholder="Ej. 1">
                <div *ngIf="userForm.get('bloque')?.invalid && userForm.get('bloque')?.touched" class="mt-2 text-xs text-rose-400">Requerido</div>
              </div>

              <div>
                <label for="villa" class="block text-sm font-medium text-[#8E8E93] mb-2">Villa</label>
                <input type="text" id="villa" formControlName="villa"
                       class="w-full bg-[#09090b] border border-[#2C2C2E] rounded-xl px-4 py-3 text-[15px] text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-[#636366] outline-none"
                       placeholder="Ej. 14">
                <div *ngIf="userForm.get('villa')?.invalid && userForm.get('villa')?.touched" class="mt-2 text-xs text-rose-400">Requerido</div>
              </div>
            </div>

            <div class="w-full md:w-auto md:self-end pt-2">
              <button type="submit" [disabled]="userForm.invalid || isSubmitting()"
                      class="w-full md:w-auto inline-flex justify-center items-center px-8 py-3 rounded-xl text-[15px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed">
                <span *ngIf="!isSubmitting()">Registrar</span>
                <span *ngIf="isSubmitting()">...</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Bottom Section: Table -->
        <div class="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl shadow-xl overflow-hidden">
          <div class="overflow-x-auto">
            <!-- Replacing full table with a more structured list view -->
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#2C2C2E] bg-[#18181b]">
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Residente</th>
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider hidden sm:table-cell">Unidad</th>
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Estado</th>
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider hidden md:table-cell">Dispositivo</th>
                  <th class="px-6 py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#2C2C2E]">
                <tr *ngFor="let user of users()" class="hover:bg-[#27272a]/40 transition-colors group">
                  <!-- Col 1: Name and Date -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-sm mr-4 border border-[#3A3A3C]">
                        {{ user.nombre_completo.charAt(0) | uppercase }}
                      </div>
                      <div>
                        <div class="text-[15px] font-semibold text-white">{{ user.nombre_completo }}</div>
                        <div class="text-xs text-[#8E8E93] mt-0.5">Registrado el {{ user.created_at | date:'dd/MM/yyyy' }}</div>
                      </div>
                    </div>
                  </td>
                  
                  <!-- Col 2: Unit (Hidden on very small screens) -->
                  <td class="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div class="text-[14px] text-slate-300 font-medium">{{ user.bloque_villa }}</div>
                    <div class="text-xs text-[#8E8E93] mt-0.5 capitalize">{{ user.rol }}</div>
                  </td>

                  <!-- Col 3: Status Badge -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span *ngIf="user.estado" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></span>
                      Activo
                    </span>
                    <span *ngIf="!user.estado" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#2C2C2E] text-[#8E8E93] border border-[#3A3A3C]">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#8E8E93] mr-2"></span>
                      Suspendido
                    </span>
                  </td>

                  <!-- Col 4: Device Status (Hidden on med screens) -->
                  <td class="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div class="flex items-center gap-2">
                      <svg *ngIf="user.has_smartphone_credential" class="w-4 h-4 text-[#8E8E93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke-width="2"></rect><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2"></line>
                      </svg>
                      <span class="text-sm text-slate-300" *ngIf="user.has_smartphone_credential && user.smartphone_credential_active">Vinculado</span>
                      <span class="text-sm text-amber-400" *ngIf="user.has_smartphone_credential && !user.smartphone_credential_active">Inactivo</span>
                      <span class="text-sm text-[#636366]" *ngIf="!user.has_smartphone_credential">Solo física</span>
                    </div>
                  </td>

                  <!-- Col 5: Actions (Icon buttons to save space) -->
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end gap-1 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity">
                      
                      <!-- Toggle Status -->
                      <button (click)="onToggleStatus(user)" class="p-2 rounded-lg hover:bg-[#2C2C2E] text-[#8E8E93] hover:text-white transition-colors" [title]="user.estado ? 'Suspender' : 'Activar'">
                        <svg *ngIf="user.estado" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        <svg *ngIf="!user.estado" class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      
                      <!-- Assign Credential -->
                      <button (click)="openCredentialModal(user)" class="p-2 rounded-lg hover:bg-[#2C2C2E] text-[#8E8E93] hover:text-emerald-400 transition-colors" title="Asignar Credencial">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" /></svg>
                      </button>

                      <!-- View Credentials -->
                      <button (click)="openViewCredentialsModal(user)" class="p-2 rounded-lg hover:bg-[#2C2C2E] text-[#8E8E93] hover:text-white transition-colors" title="Ver Tarjetas">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      </button>

                      <!-- Recovery Code -->
                      <button (click)="openRecoveryModal(user)" class="p-2 rounded-lg hover:bg-[#2C2C2E] text-[#8E8E93] hover:text-amber-400 transition-colors" title="Código de Recuperación">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </button>

                    </div>
                  </td>
                </tr>

                <!-- Loading State -->
                <tr *ngIf="isLoading()">
                  <td colspan="5" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center justify-center gap-4">
                      <div class="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                      <span class="text-[#8E8E93] font-medium">Cargando residentes...</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Empty State -->
                <tr *ngIf="!isLoading() && users().length === 0">
                  <td colspan="5" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <div class="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mb-4">
                        <svg class="h-8 w-8 text-[#8E8E93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p class="text-[15px] text-white font-medium">No hay residentes registrados</p>
                      <p class="text-sm text-[#8E8E93] mt-1">Registra al primer residente usando el formulario de arriba.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- Modal Overlay: Assign Credential -->
      <div *ngIf="isModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div class="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-8 w-full max-w-md shadow-2xl relative transform transition-all">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-white">Vincular Llave</h3>
            <button (click)="closeModal()" class="text-[#8E8E93] hover:text-white transition-colors bg-[#2C2C2E] rounded-full p-1.5">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <p class="text-sm text-[#8E8E93] mb-6">Añadiendo llave para <span class="text-white font-medium">{{ selectedUser()?.nombre_completo }}</span></p>

          <form [formGroup]="credentialForm" (ngSubmit)="onAssignCredential()" class="space-y-5">
            <div>
              <label for="uidHex" class="block text-sm font-medium text-[#8E8E93] mb-2">UID (Hexadecimal)</label>
              <input type="text" id="uidHex" formControlName="uidHex" autofocus
                     class="w-full bg-[#09090b] border border-[#2C2C2E] rounded-xl px-4 py-3 text-[15px] text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                     placeholder="Ej. A1 B2 C3 D4">
            </div>
            
            <div>
              <label for="tipo" class="block text-sm font-medium text-[#8E8E93] mb-2">Tipo de Llave</label>
              <select id="tipo" formControlName="tipo"
                      class="w-full bg-[#09090b] border border-[#2C2C2E] rounded-xl px-4 py-3 text-[15px] text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors appearance-none">
                <option value="tag_fisico">Tarjeta o Llavero Físico</option>
                <option value="smartphone_nfc">Teléfono (NFC)</option>
              </select>
            </div>

            <div class="mt-8 pt-4 border-t border-[#2C2C2E]">
              <button type="submit" [disabled]="credentialForm.invalid || isAssigning()"
                      class="w-full inline-flex justify-center items-center px-6 py-3.5 rounded-xl text-[15px] font-semibold text-black bg-white hover:bg-slate-200 focus:outline-none disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed">
                <span *ngIf="!isAssigning()">Vincular y Guardar</span>
                <span *ngIf="isAssigning()">Procesando...</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Overlay: View Credentials -->
      <div *ngIf="isViewCredentialsModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div class="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-8 w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-white">Llaves Vinculadas</h3>
            <button (click)="closeViewCredentialsModal()" class="text-[#8E8E93] hover:text-white transition-colors bg-[#2C2C2E] rounded-full p-1.5">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <p class="text-sm text-[#8E8E93] mb-6">Llaves asignadas a <span class="text-white font-medium">{{ selectedUser()?.nombre_completo }}</span></p>

          <div *ngIf="isLoadingCredentials()" class="flex justify-center py-10">
            <div class="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>

          <div *ngIf="!isLoadingCredentials() && userCredentials().length === 0" class="text-center py-10">
            <p class="text-[15px] text-[#8E8E93]">No hay llaves registradas</p>
          </div>

          <div *ngIf="!isLoadingCredentials() && userCredentials().length > 0" class="space-y-3">
            <div *ngFor="let cred of userCredentials()" class="flex items-center justify-between bg-[#09090b] p-4 rounded-2xl border border-[#2C2C2E]">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center border border-[#27272a]">
                  <svg *ngIf="cred.tipo === 'tag_fisico'" class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  <svg *ngIf="cred.tipo === 'smartphone_nfc'" class="w-5 h-5 text-[#0A84FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke-width="1.5"></rect><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2"></line></svg>
                </div>
                <div>
                  <p class="font-mono text-[15px] font-medium text-white">{{ cred.uid_hex }}</p>
                  <p class="text-xs text-[#8E8E93] mt-0.5">{{ cred.tipo === 'tag_fisico' ? 'Tarjeta Física' : 'Smartphone' }} • {{ cred.created_at | date:'dd MMM' }}</p>
                </div>
              </div>
              <button (click)="deleteCredential(cred.id)" [disabled]="isDeletingCredential() === cred.id"
                      class="text-rose-500 hover:text-rose-400 p-2 rounded-xl hover:bg-[#2C2C2E] transition-colors disabled:opacity-50 cursor-pointer" title="Remover llave">
                <svg *ngIf="isDeletingCredential() !== cred.id" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                <div *ngIf="isDeletingCredential() === cred.id" class="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedUser = signal<any>(null);
  readonly isModalOpen = signal(false);
  readonly isAssigning = signal(false);
  readonly activationInfo = signal<{ activationCode: string; recoveryCode: string } | null>(null);
  readonly recoveryInfo = signal<{ user: { id: string; nombreCompleto: string }; recoveryCode: string } | null>(null);
  readonly isRefreshingRecovery = signal(false);

  readonly isViewCredentialsModalOpen = signal(false);
  readonly userCredentials = signal<any[]>([]);
  readonly isLoadingCredentials = signal(false);
  readonly isDeletingCredential = signal<string | null>(null);

  protected copyCode(code: string): void {
    void navigator.clipboard.writeText(code);
  }

  readonly userForm = this.fb.group({
    nombreCompleto: ['', Validators.required],
    bloque: ['', Validators.required],
    villa: ['', Validators.required],
  });

  readonly credentialForm = this.fb.group({
    uidHex: ['', Validators.required],
    tipo: ['tag_fisico', Validators.required]
  });

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.usersService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.errorMessage.set('Error al obtener la lista de usuarios.');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);

      const payload = {
        nombreCompleto: this.userForm.value.nombreCompleto!,
        bloqueVilla: `Bloque ${this.userForm.value.bloque} - Villa ${this.userForm.value.villa}`,
        rol: 'residente', // Hardcoded as per instructions
      };

      this.usersService.createUser(payload).subscribe({
        next: (response) => {
          this.userForm.reset();
          this.activationInfo.set({
            activationCode: response.activationCode,
            recoveryCode: response.recoveryCode,
          });
          this.fetchUsers(); // Refresh the table
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Error creating user:', err);
          this.errorMessage.set('Error al crear el usuario. Por favor, inténtelo de nuevo.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  onToggleStatus(user: any): void {
    const newStatus = !user.estado;
    this.usersService.toggleUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.fetchUsers();
      },
      error: (err) => {
        console.error('Error toggling user status:', err);
        this.errorMessage.set('Error al cambiar el estado del usuario.');
      }
    });
  }

  openCredentialModal(user: any): void {
    this.selectedUser.set(user);
    this.credentialForm.reset({ tipo: 'tag_fisico' });
    this.isModalOpen.set(true);
  }

  openRecoveryModal(user: any): void {
    this.errorMessage.set(null);
    this.usersService.getRecoveryCode(user.id).subscribe({
      next: (response) => {
        this.recoveryInfo.set(response);
      },
      error: (err) => {
        console.error('Error fetching recovery code:', err);
        this.errorMessage.set(err.error?.message || 'Error al obtener el código de recuperación.');
      }
    });
  }

  refreshRecoveryCode(userId: string): void {
    this.isRefreshingRecovery.set(true);
    this.errorMessage.set(null);

    this.usersService.rotateRecoveryCode(userId).subscribe({
      next: (response) => {
        this.recoveryInfo.set(response);
        this.isRefreshingRecovery.set(false);
      },
      error: (err) => {
        console.error('Error rotating recovery code:', err);
        this.errorMessage.set(err.error?.message || 'Error al regenerar el código de recuperación.');
        this.isRefreshingRecovery.set(false);
      }
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedUser.set(null);
  }

  onAssignCredential(): void {
    if (this.credentialForm.valid && this.selectedUser()) {
      this.isAssigning.set(true);
      this.errorMessage.set(null);

      const { uidHex, tipo } = this.credentialForm.value;
      const usuarioId = this.selectedUser().id;

      this.usersService.assignCredential(usuarioId, uidHex!, tipo!).subscribe({
        next: () => {
          console.log('Credencial asignada con éxito');
          this.closeModal();
          this.isAssigning.set(false);
        },
        error: (err) => {
          console.error('Error assigning credential:', err);
          this.errorMessage.set(err.error?.message || 'Error al asignar la credencial.');
          this.closeModal();
          this.isAssigning.set(false);
        }
      });
    } else {
      this.credentialForm.markAllAsTouched();
    }
  }

  openViewCredentialsModal(user: any): void {
    this.selectedUser.set(user);
    this.isViewCredentialsModalOpen.set(true);
    this.fetchUserCredentials(user.id);
  }

  closeViewCredentialsModal(): void {
    this.isViewCredentialsModalOpen.set(false);
    this.selectedUser.set(null);
    this.userCredentials.set([]);
  }

  fetchUserCredentials(userId: string): void {
    this.isLoadingCredentials.set(true);
    this.usersService.getUserCredentials(userId).subscribe({
      next: (creds) => {
        this.userCredentials.set(creds);
        this.isLoadingCredentials.set(false);
      },
      error: (err) => {
        console.error('Error fetching credentials:', err);
        this.errorMessage.set('Error al cargar tarjetas.');
        this.isLoadingCredentials.set(false);
      }
    });
  }

  deleteCredential(id: string): void {
    if (confirm('¿Está seguro de que desea desvincular esta tarjeta?')) {
      this.isDeletingCredential.set(id);
      this.usersService.deleteCredential(id).subscribe({
        next: () => {
          this.fetchUserCredentials(this.selectedUser().id);
          this.fetchUsers(); // Refresh main table stats
          this.isDeletingCredential.set(null);
        },
        error: (err) => {
          console.error('Error deleting credential:', err);
          this.errorMessage.set('Error al desvincular la tarjeta.');
          this.isDeletingCredential.set(null);
        }
      });
    }
  }
}
