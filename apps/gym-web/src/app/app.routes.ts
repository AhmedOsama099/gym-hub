import { Route } from "@angular/router";
import { authGuard } from "./features/auth/guards/auth-guard";
import { guestGuard } from "./core/guards/guest.guard";
import { roleGuard } from "./core/guards/role.guard";

export const appRoutes: Route[] = [
  {
    path: "login",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/auth/pages/login/login").then((m) => m.LoginComponent),
  },
  {
    path: "forgot-password",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/auth/pages/forgot-password/forgot-password").then(
        (m) => m.ForgotPasswordComponent,
      ),
  },

  {
    path: "reset-password",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/auth/pages/reset-password/reset-password").then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: "dashboard",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/dashboard/dashboard").then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: "plans",
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: "ADMIN" },
    loadComponent: () =>
      import("./features/plans/pages/plans/plans.component").then(
        (m) => m.PlansComponent,
      ),
  },
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
];
