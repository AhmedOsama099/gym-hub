import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { AuthService } from "../auth/services/auth.service";

@Component({
  selector: "gym-dashboard",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-zinc-950 text-white p-8">
      <div class="max-w-4xl mx-auto space-y-6">
        <header
          class="flex items-center justify-between border-b border-zinc-800 pb-4"
        >
          <div>
            <h1 class="text-2xl font-bold text-amber-400">
              Gym Hub Operations
            </h1>
            <p class="text-zinc-400 text-sm">
              Welcome back, {{ user()?.firstName }} {{ user()?.lastName }}
            </p>
          </div>
          <button
            mat-stroked-button
            (click)="onLogout()"
            class="!border-zinc-700 !text-zinc-300 hover:!bg-zinc-900"
          >
            <mat-icon class="mr-1">logout</mat-icon> Sign Out
          </button>
        </header>

        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-zinc-200 mb-2">Session Info</h2>
          <p class="text-sm text-zinc-400">
            Email: <span class="text-zinc-200">{{ user()?.email }}</span>
          </p>
          <p class="text-sm text-zinc-400">
            Role:
            <span class="text-amber-400 font-bold">{{ user()?.role }}</span>
          </p>
        </div>
        <button
          (click)="goToPlans()"
          class="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
        >
          Go to plans
        </button>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(["/login"]);
      },
      error: () => {
        this.authService.clearSession();
        this.router.navigate(["/login"]);
      },
    });
  }

  goToPlans() {
    this.router.navigate(["/plans"]);
  }
}
