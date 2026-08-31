import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import config from 'devextreme/core/config';
import { AppComponent } from './app/app.component';
import { licenseKey } from './devextreme-license';
import { routes } from './app/app.routes';

config({ licenseKey });

bootstrapApplication(AppComponent, {
  providers: [provideZoneChangeDetection(), provideRouter(routes)],
}).catch((err) => console.error(err));
