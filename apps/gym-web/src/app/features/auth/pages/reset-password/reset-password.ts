import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-reset-password",
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./reset-password.html",
  styleUrl: "./reset-password.css",
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isLoading = signal(false);
  feedbackMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.authService.forgotPassword(this.form.getRawValue().email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.feedbackMessage.set(res.message);
        this.form.reset();
      },
      error: () => {
        this.isLoading.set(false);
        this.feedbackMessage.set("حدث خطأ غير متوقع، يرجى المحاولة لاحقاً");
      },
    });
  }
}
