import { inject } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map } from "rxjs";

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. إذا كان المستخدم مسجلاً بالفعل في الذاكرة (Signal)
  if (authService.isAuthenticated()) {
    return true;
  }

  return authService.getProfile().pipe(
    map((user) => {
      if (user) {
        return true;
      }
      return router.createUrlTree(["/login"], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
