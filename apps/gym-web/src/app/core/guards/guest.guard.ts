import { inject, PLATFORM_ID } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../../features/auth/services/auth.service";
import { map } from "rxjs";
import { isPlatformBrowser } from "@angular/common";

export const guestGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isAuthenticated()) {
    return router.createUrlTree(["/dashboard"]);
  }

  return authService.getProfile().pipe(
    map((user) => {
      if (user) {
        return router.createUrlTree(["/dashboard"]);
      }
      return true;
    }),
  );
};
