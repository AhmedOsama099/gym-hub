import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { CanActivateFn, Router, ActivatedRouteSnapshot } from "@angular/router";
import { AuthService } from "../../features/auth/services/auth.service";
import { map, of } from "rxjs";

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  // تجاوز الفحص أثناء رندرة السيرفر (SSR)
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // قراءة الأدوار المسموح بها والمحددة داخل بيانات المسار (route.data)
  const expectedRoles = (route.data["roles"] as string[]) || [];

  // 1. إذا كان المستخدم موجوداً مسبقاً في الذاكرة
  const currentUser = authService.currentUser();
  if (currentUser) {
    return checkRole(currentUser.role, expectedRoles, router);
  }

  // 2. إذا كانت الذاكرة فارغة، نتحقق أولاً عبر getProfile
  return authService.getProfile().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(["/login"]);
      }
      return checkRole(user.role, expectedRoles, router);
    }),
  );
};

// دالة مساعدة لمطابقة الدور وتحديد التوجيه عند الرفض
function checkRole(userRole: string, expectedRoles: string[], router: Router) {
  if (expectedRoles.length === 0 || expectedRoles.includes(userRole)) {
    return true;
  }

  // إذا كان دوره غير مصرح له، نوجهه للـ dashboard الافتراضية
  return router.createUrlTree(["/dashboard"]);
}
