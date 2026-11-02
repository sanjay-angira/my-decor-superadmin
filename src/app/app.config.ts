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
      50: 'var(--vr-primary-scale-50)',
      100: 'var(--vr-primary-scale-100)',
      200: 'var(--vr-primary-scale-200)',
      300: 'var(--vr-primary-scale-300)',
      400: 'var(--vr-primary-scale-400)',
      500: 'var(--vr-primary-scale-500)',
      600: 'var(--vr-primary-scale-600)',
      700: 'var(--vr-primary-scale-700)',
      800: 'var(--vr-primary-scale-800)',
      900: 'var(--vr-primary-scale-900)',
      950: 'var(--vr-primary-scale-950)',
      color: 'light-dark(var(--vr-primary-scale-600), var(--vr-primary-scale-300))',
      contrastColor: 'light-dark(var(--vr-white), var(--vr-black))',
      hoverColor: 'light-dark(var(--vr-primary-scale-700), var(--vr-primary-scale-200))',
      activeColor: 'light-dark(var(--vr-primary-scale-800), var(--vr-primary-scale-100))',
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
