import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ConfirmationService, MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const DecorPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f5f5f5',
      100: '#e5e5e5',
      200: '#d4d4d4',
      300: '#bdbdbd',
      400: '#9e9e9e',
      500: '#757575',
      600: '#424242',
      700: '#303030',
      800: '#212121',
      900: '#141414',
      950: '#000000',
      color: 'light-dark({primary.600}, {primary.300})',
      contrastColor: 'light-dark(#ffffff, {surface.900})',
      hoverColor: 'light-dark({primary.700}, {primary.200})',
      activeColor: 'light-dark({primary.800}, {primary.100})',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    MessageService,
    ConfirmationService,
    providePrimeNG({
      ripple: true,
      theme: {
        preset: DecorPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
        },
      },
    }),
  ],
};
