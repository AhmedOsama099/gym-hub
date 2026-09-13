import { Route } from "@angular/router";

export const appRoutes: Route[] = [
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/pages/login/login").then((m) => m.LoginComponent),
  },
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
];
