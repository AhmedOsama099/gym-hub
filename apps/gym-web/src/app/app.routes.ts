import { Route } from "@angular/router";
import { authGuard } from "./features/auth/guards/auth-guard";
import { guestGuard } from "./core/guards/guest.guard";

export const appRoutes: Route[] = [
  {
    path: "login",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/auth/pages/login/login").then((m) => m.LoginComponent),
  },
  {
    path: "register",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/auth/pages/register/register").then(
        (m) => m.RegisterComponent,
      ),
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
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
];
