import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";

// Angular Material Modules
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { AuthLayoutComponent } from "../../components/auth-layout.component";

@Component({
  selector: "gym-login",
  standalone: true,
  imports: [
    CommonModule,
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
}
