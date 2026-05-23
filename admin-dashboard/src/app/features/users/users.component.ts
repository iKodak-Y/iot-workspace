import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsersService } from '../../core/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden font-sans">
      <!-- Ambient Glows -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <!-- Header -->
        <div class="md:flex md:items-center md:justify-between mb-8">
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
              Gestión de Residentes
            </h1>
            <p class="mt-1 text-sm text-slate-400">
              Administra la información y el acceso de los residentes y personal.
            </p>
          </div>
        </div>

        <!-- Error Message Alert -->
        <div *ngIf="errorMessage()" class="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-2xl text-sm text-red-400 flex items-center gap-2">
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Top Section: Form -->
        <div class="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 mb-8 shadow-2xl">
          <h2 class="text-lg font-medium text-white mb-4">Registrar Nuevo Residente</h2>
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:items-start">
            
            <div class="flex-1">
              <label for="nombreCompleto" class="block text-sm font-medium text-slate-400 mb-1">Nombre Completo</label>
              <input type="text" id="nombreCompleto" formControlName="nombreCompleto" 
                     class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-600 outline-none"
                     placeholder="Ej. Juan Pérez">
              <div *ngIf="userForm.get('nombreCompleto')?.invalid && userForm.get('nombreCompleto')?.touched" class="mt-1 text-xs text-rose-400">
                El nombre es obligatorio.
              </div>
            </div>

            <div class="flex-1">
              <label for="bloqueVilla" class="block text-sm font-medium text-slate-400 mb-1">Bloque / Villa</label>
              <input type="text" id="bloqueVilla" formControlName="bloqueVilla"
                     class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-600 outline-none"
                     placeholder="Ej. Villa 12, Manzana B">
              <div *ngIf="userForm.get('bloqueVilla')?.invalid && userForm.get('bloqueVilla')?.touched" class="mt-1 text-xs text-rose-400">
                El bloque o villa es obligatorio.
              </div>
            </div>

            <div class="sm:self-end sm:pb-0 sm:mt-0 mt-4 pt-6">
              <button type="submit" [disabled]="userForm.invalid || isSubmitting()"
                      class="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed">
                <svg *ngIf="isSubmitting()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span *ngIf="!isSubmitting()">Registrar</span>
                <span *ngIf="isSubmitting()">Procesando...</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Bottom Section: Table -->
        <div class="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-800/60">
              <thead class="bg-slate-950/40">
                <tr>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Bloque / Villa</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha de Registro</th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40 bg-slate-900/10">
                <tr *ngFor="let user of users()" class="hover:bg-slate-800/20 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                    {{ user.nombre_completo }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {{ user.bloque_villa }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                      {{ user.rol }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {{ user.created_at | date:'dd/MM/yyyy' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button (click)="openCredentialModal(user)" class="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors">
                      Asignar Tarjeta
                    </button>
                  </td>
                </tr>

                <!-- Loading State -->
                <tr *ngIf="isLoading()">
                  <td colspan="4" class="px-6 py-12 text-center">
                    <div class="flex items-center justify-center gap-3 text-slate-400 text-sm">
                      <svg class="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Empty State -->
                <tr *ngIf="!isLoading() && users().length === 0">
                  <td colspan="4" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <svg class="h-10 w-10 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p class="text-sm text-slate-400 font-medium">No hay usuarios registrados</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- Modal Overlay -->
      <div *ngIf="isModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
          <h3 class="text-lg font-medium text-white mb-4">
            Asignar Tarjeta a {{ selectedUser()?.nombre_completo }}
          </h3>
          <form [formGroup]="credentialForm" (ngSubmit)="onAssignCredential()" class="space-y-4">
            <div>
              <label for="uidHex" class="block text-sm font-medium text-slate-400 mb-1">UID (Hexadecimal)</label>
              <input type="text" id="uidHex" formControlName="uidHex" autofocus
                     class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                     placeholder="Escanee la tarjeta o digite el UID">
              <div *ngIf="credentialForm.get('uidHex')?.invalid && credentialForm.get('uidHex')?.touched" class="mt-1 text-xs text-rose-400">
                El UID es obligatorio.
              </div>
            </div>
            
            <div>
              <label for="tipo" class="block text-sm font-medium text-slate-400 mb-1">Tipo de Credencial</label>
              <select id="tipo" formControlName="tipo"
                      class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors">
                <option value="tag_fisico">Tag Físico (RFID/NFC)</option>
                <option value="smartphone_nfc">Smartphone NFC</option>
              </select>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button" (click)="closeModal()" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" [disabled]="credentialForm.invalid || isAssigning()"
                      class="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed">
                <svg *ngIf="isAssigning()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span *ngIf="!isAssigning()">Vincular Credencial</span>
                <span *ngIf="isAssigning()">Asignando...</span>
              </button>
            </div>
          </form>
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

  readonly userForm = this.fb.group({
    nombreCompleto: ['', Validators.required],
    bloqueVilla: ['', Validators.required],
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
        bloqueVilla: this.userForm.value.bloqueVilla!,
        rol: 'residente', // Hardcoded as per instructions
      };

      this.usersService.createUser(payload).subscribe({
        next: () => {
          this.userForm.reset();
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

  openCredentialModal(user: any): void {
    this.selectedUser.set(user);
    this.credentialForm.reset({ tipo: 'tag_fisico' });
    this.isModalOpen.set(true);
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
}
