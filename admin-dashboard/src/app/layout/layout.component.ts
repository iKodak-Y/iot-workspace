import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-screen overflow-hidden flex bg-black text-slate-100 font-sans">
      
      <!-- Sidebar -->
      <aside class="w-64 shrink-0 bg-[#09090b] border-r border-[#27272a] flex flex-col z-20">
        <!-- Brand Logo/Name -->
        <div class="h-20 flex items-center px-6 border-b border-[#27272a]">
          <div class="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mr-3">
            <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span class="font-bold text-xl tracking-tight text-white">Residencial</span>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-4 py-8 space-y-3">
          <a routerLink="/dashboard" routerLinkActive="bg-[#18181b] text-emerald-400 shadow-sm border-emerald-500/30" 
             class="flex items-center px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-[#18181b] transition-all border border-transparent">
            <svg class="mr-3 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </a>

          <a routerLink="/users" routerLinkActive="bg-[#18181b] text-emerald-400 shadow-sm border-emerald-500/30" 
             class="flex items-center px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-[#18181b] transition-all border border-transparent">
            <svg class="mr-3 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Residentes
          </a>
        </nav>

        <!-- Bottom Action: Logout -->
        <div class="p-6">
          <button (click)="logout()" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#18181b] hover:bg-[#27272a] text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Container -->
      <div class="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-black">
        <div class="flex-1 relative z-10 overflow-y-auto">
          <router-outlet></router-outlet>
        </div>
      </div>

    </div>
  `
})
export class LayoutComponent {
  private readonly router = inject(Router);

  logout(): void {
    localStorage.removeItem('iot_token');
    this.router.navigate(['/login']);
  }
}
