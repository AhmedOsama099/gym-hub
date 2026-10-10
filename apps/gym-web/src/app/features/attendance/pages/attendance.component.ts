import { Component, inject, OnInit, signal } from "@angular/core";
import { AttendanceService } from "../services/attendance.service";
import { NotificationService } from "../../../core/notification.service";
import { UpperCasePipe, DatePipe, DecimalPipe } from "@angular/common";

@Component({
  selector: "app-attendance",
  imports: [UpperCasePipe, DatePipe, DecimalPipe],
  standalone: true,
  templateUrl: "./attendance.component.html",
  styleUrl: "./attendance.component.css",
})
export class AttendancePageComponent implements OnInit {
  constructor() {}

  private readonly attendanceService = inject(AttendanceService);
  private readonly notificationService = inject(NotificationService);

  checkInValue = signal<string>("");
  isCard = signal<boolean>(false);

  readonly checkInLoading = this.attendanceService.checkInLoading;
  readonly lastCheckIn = this.attendanceService.lastCheckIn;
  readonly loading = this.attendanceService.loading;
  readonly todayLogs = this.attendanceService.todayLogs;

  getCheckInValue(value: string) {
    this.checkInValue.set(value);
  }

  ngOnInit(): void {
    this.attendanceService.loadTodayAttendance().subscribe({
      error: (err) => {
        this.notificationService.error(err.message);
      },
    });
  }

  onCheckInVerify() {
    const identifier = this.checkInValue();
    if (!identifier) {
      this.notificationService.error("Please enter the phone number or id");
      return;
    }
    this.attendanceService.checkIn(identifier).subscribe({
      next: (res) => {
        this.isCard.set(true);
        this.attendanceService.loadTodayAttendance();
        this.checkInValue.set("");
        this.notificationService.success(res.message);
      },
      error: (err) => {
        this.notificationService.error(err.error.message);
      },
    });
  }

  onClearInput() {
    this.checkInValue.set("");
  }

  onHideCard() {
    this.isCard.set(false);
    this.checkInValue.set("");
  }

  getRemainingDays(endData: string) {
    if (!endData) return 0;
    const today = new Date();
    const endDate = new Date(endData);
    const diff = endDate.getTime() - today.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  getValidUntilDate() {
    return new Date(
      this.lastCheckIn()?.plan?.endDate || "",
    ).toLocaleDateString();
  }
}
