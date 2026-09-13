import { Route } from "@angular/router";

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
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
];
