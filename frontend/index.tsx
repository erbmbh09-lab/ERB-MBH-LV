

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeArAe from '@angular/common/locales/ar-AE';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './src/app.routes';

import { AppComponent } from './src/app.component';

registerLocaleData(localeArAe);

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(routes, withHashLocation()),
    { provide: LOCALE_ID, useValue: 'ar-AE' },
  ],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.