import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, finalize, catchError, throwError } from "rxjs";
import { API_URL } from "../../../core/tokens/api.token";
import {
  ICheckInRequest,
  ICheckInResponse,
  ICheckInResultData,
  ITodayAttendanceItem,
  ITodayAttendanceResponse,
} from "../models/attendance.models";

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/attendance`;

  // 1. Signals الخاصة بالحالة
  private readonly todayLogsSignal = signal<ITodayAttendanceItem[]>([]);
  private readonly totalTodaySignal = signal<number>(0);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly checkInLoadingSignal = signal<boolean>(false);
  private readonly lastCheckInSignal = signal<ICheckInResultData | null>(null);

  // 2. كشف الـ Signals كـ Readonly للـ Components
  readonly todayLogs = this.todayLogsSignal.asReadonly();
  readonly totalToday = this.totalTodaySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly checkInLoading = this.checkInLoadingSignal.asReadonly();
  readonly lastCheckIn = this.lastCheckInSignal.asReadonly();

  /**
   * جلب سجلات حضور اليوم الحالي وتحديث الـ Signals
   */
  loadTodayAttendance(): Observable<ITodayAttendanceResponse> {
    this.loadingSignal.set(true);

    return this.http
      .get<ITodayAttendanceResponse>(`${this.endpoint}/today`, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.todayLogsSignal.set(res.logs);
          this.totalTodaySignal.set(res.totalToday);
        }),
        finalize(() => {
          this.loadingSignal.set(false);
        }),
      );
  }

  /**
   * تسجيل حضور عضو وإدراجه فوراً في أول قائمة اليوم
   */
  checkIn(identifier: string): Observable<ICheckInResponse> {
    this.checkInLoadingSignal.set(true);

    const payload: ICheckInRequest = { identifier };

    return this.http
      .post<ICheckInResponse>(`${this.endpoint}/check-in`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          const result = res.data;
          this.lastCheckInSignal.set(result);

          // إعداد السجل الجديد لإضافته لحظياً في أعلى جدول اليوم
          const newLogItem: ITodayAttendanceItem = {
            id: result.attendanceId,
            checkInAt: result.checkInAt,
            member: {
              id: result.member.id,
              firstName: result.member.firstName,
              lastName: result.member.lastName,
              phoneNumber: result.member.phoneNumber,
              currentPlan: result.plan.name,
            },
          };

          this.todayLogsSignal.update((logs) => [newLogItem, ...logs]);
          this.totalTodaySignal.update((count) => count + 1);
        }),
        finalize(() => {
          this.checkInLoadingSignal.set(false);
        }),
      );
  }

  /**
   * مسح بطاقة آخر عضو تم تسجيله (عند الحاجة لتفريغ الشاشة)
   */
  clearLastCheckIn(): void {
    this.lastCheckInSignal.set(null);
  }
}
