import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { appRoutes } from "./app.routes";
import { API_URL } from "./core/tokens/api.token";
import { environment } from "../environments/environment";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    {
      provide: API_URL,
      useValue: environment.apiUrl,
    },
  ],
};
