import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";

// Angular Material Modules
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { AuthLayoutComponent } from "../../components/auth-layout.component";
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AuthService } from "../../services/auth.service";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
  selector: "gym-login",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AuthLayoutComponent,
  ],
  templateUrl: "./login.html",
  styleUrls: ["./login.css"],
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: [
      "",
      [Validators.required, Validators.minLength(6), Validators.maxLength(30)],
    ],
  });

  get emailControl() {
    return this.loginForm.controls.email;
  }

  get passwordControl() {
    return this.loginForm.controls.password;
  }

  togglePasswordVisibility(event: MouseEvent) {
    event.stopPropagation();
    this.hidePassword.update((val) => !val);
  }

  onSubmit() {
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        const returnUrl = this.route.snapshot.queryParams["returnUrl"];

        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (response.user.role === "ADMIN") {
          this.router.navigate(["/admin"]);
        } else {
          this.router.navigate(["/"]);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set("Invalid email or password.");
        } else if (err.error?.message) {
          this.errorMessage.set(
            Array.isArray(err.error.message)
              ? err.error.message[0]
              : err.error.message,
          );
        } else {
          this.errorMessage.set(
            "Server is unreachable. Please try again later.",
          );
        }
      },
    });
  }
}
