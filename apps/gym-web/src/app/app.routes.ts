import { Route } from "@angular/router";
import { authGuard } from "./features/auth/guards/auth-guard";

export const appRoutes: Route[] = [
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/pages/login/login").then((m) => m.LoginComponent),
  },
  {
    path: "register",
    loadComponent: () =>
      import("./features/auth/pages/register/register").then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: "forgot-password",
    loadComponent: () =>
      import("./features/auth/pages/forgot-password/forgot-password").then(
        (m) => m.ForgotPasswordComponent,
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
