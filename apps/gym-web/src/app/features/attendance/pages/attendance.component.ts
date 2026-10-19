import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AttendanceService } from '../services/attendance.service';
import { NotificationService } from '../../../core/notification.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
})
export class AttendanceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(AttendanceService);
  private readonly notify = inject(NotificationService);

  @ViewChild('identifierInput') identifierInputRef!: ElementRef<HTMLInputElement>;

  // استهلاك الـ Signals من السيرفيس
  readonly todayLogs = this.attendanceService.todayLogs;
  readonly totalToday = this.attendanceService.totalToday;
  readonly loading = this.attendanceService.loading;
  readonly checkInLoading = this.attendanceService.checkInLoading;
  readonly lastCheckIn = this.attendanceService.lastCheckIn;

  // إشارة لحفظ رسالة الخطأ الأخيرة لو كان الدخول مرفوضاً (لعرض بانر أحمر)
  readonly rejectionError = signal<string | null>(null);

  checkInForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadTodayData();
  }

  private initForm(): void {
    this.checkInForm = this.fb.group({
      identifier: ['', [Validators.required]],
    });
  }

  loadTodayData(): void {
    this.attendanceService.loadTodayAttendance().subscribe({
      error: () => this.notify.error("Failed to load today's attendance logs"),
    });
  }

  submitCheckIn(): void {
    if (this.checkInForm.invalid || this.checkInLoading()) {
      return;
    }

    const identifier = this.checkInForm.value.identifier.trim();
    if (!identifier) return;

    // تصفير أخطاء الرفض السابقة قبل الفحص الجديد
    this.rejectionError.set(null);

    this.attendanceService.checkIn(identifier).subscribe({
      next: (res) => {
        this.notify.success(res.message || 'Check-in verified!');
        this.checkInForm.reset();
        this.focusInput();
      },
      error: (err) => {
        const errorMsg =
          err.error?.message || 'Access denied or subscription invalid';
        const formattedMsg = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg;
        
        // عرض الخطأ في البانر وأيضاً عبر التنبيه
        this.rejectionError.set(formattedMsg);
        this.attendanceService.clearLastCheckIn();
        this.notify.error(formattedMsg);
        this.focusInput();
      },
    });
  }

  clearSearchInput(): void {
    this.checkInForm.reset();
    this.rejectionError.set(null);
    this.attendanceService.clearLastCheckIn();
    this.focusInput();
  }

  closeBanner(): void {
    this.rejectionError.set(null);
    this.attendanceService.clearLastCheckIn();
  }

  private focusInput(): void {
    setTimeout(() => {
      this.identifierInputRef?.nativeElement?.focus();
    }, 50);
  }
}