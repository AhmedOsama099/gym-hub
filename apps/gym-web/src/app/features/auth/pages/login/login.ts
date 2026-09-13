import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

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
  // Signal للتحكم في إظهار وإخفاء كلمة المرور
  hidePassword = signal(true);

  togglePasswordVisibility(event: MouseEvent) {
    event.stopPropagation();
    this.hidePassword.update((val) => !val);
  }

  private fb = inject(NonNullableFormBuilder);

  loginForm = this.fb.group({
    email: ["", Validators.required],
    password: ["", Validators.required],
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    console.log(this.loginForm.value);
  }
}
