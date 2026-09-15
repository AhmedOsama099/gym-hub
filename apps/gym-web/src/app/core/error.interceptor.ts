import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../features/auth/services/auth.service";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCheck =
        req.url.includes("/auth/login") || req.url.includes("/auth/me");

      if (error.status === 401 && !isAuthCheck) {
        authService.clearSession();
        const currentUrl = router.url;
        router.navigate(["/login"], {
          queryParams: currentUrl !== "/login" ? { returnUrl: currentUrl } : {},
        });
      }

      return throwError(() => error);
    }),
  );
};
