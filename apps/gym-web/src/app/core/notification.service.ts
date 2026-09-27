import { inject, Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 3500,
    horizontalPosition: "center",
    verticalPosition: "bottom",
  };

  success(message: string): void {
    this.snackBar.open(message, "Close", {
      ...this.defaultConfig,
      panelClass: ["snackbar-success"],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, "Close", {
      ...this.defaultConfig,
      duration: 5000,
      panelClass: ["snackbar-error"],
    });
  }

  info(message: string): void {
    this.snackBar.open(message, "Close", {
      ...this.defaultConfig,
      panelClass: ["snackbar-info"],
    });
  }
}
