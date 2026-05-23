import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { IonicModule } from '@ionic/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    // Esto inicializa Ionic con diseño tipo Android (Material Design) para todos
    importProvidersFrom(IonicModule.forRoot({ mode: 'md' })),
  ],
};
