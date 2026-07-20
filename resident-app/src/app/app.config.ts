import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { IonicModule } from '@ionic/angular';

import { environment } from '../environments/environment';

export const apiBaseUrl = environment.apiUrl;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([])),
    // Esto inicializa Ionic con diseño tipo Android (Material Design) para todos
    importProvidersFrom(IonicModule.forRoot({ mode: 'md' })),
  ],
};
