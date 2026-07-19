import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { IonicModule } from '@ionic/angular';

export const apiBaseUrl = 'http://192.168.1.4:3000/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([])),
    // Esto inicializa Ionic con diseño tipo Android (Material Design) para todos
    importProvidersFrom(IonicModule.forRoot({ mode: 'md' })),
  ],
};
