import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, finalize, catchError, throwError } from "rxjs";
import { API_URL } from "../../../core/tokens/api.token";
import {
  IMember,
  ICreateMemberRequest,
  IUpdateMemberRequest,
  IRenewSubscriptionRequest,
} from "../models/member.models";

@Injectable({
  providedIn: "root",
})
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private readonly endpoint = `${this.apiUrl}/members`;

  // 1. إدارة الحالة الداخلية (State Signals)
  private readonly membersSignal = signal<IMember[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // 2. الكشف للقراءة فقط للـ Components
  readonly members = this.membersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /**
   * جلب قائمة الأعضاء من الخادم وتحديث الـ Signal
   */
  loadMembers(): Observable<IMember[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .get<IMember[]>(this.endpoint, {
        withCredentials: true,
      })
      .pipe(
        tap((members) => {
          this.membersSignal.set(members);
        }),
        catchError((err) => {
          const errorMessage =
            err.error?.message || "Failed to load gym members list";
          this.errorSignal.set(errorMessage);
          return throwError(() => err);
        }),
        finalize(() => {
          this.loadingSignal.set(false);
        }),
      );
  }

  /**
   * إضافة عضو جديد وإدراجه مباشرة في مقدمة قائمة الأعضاء بالـ UI
   */
  createMember(payload: ICreateMemberRequest): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<{ message: string; data: any }>(this.endpoint, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          const createdUser = response.data.user;
          const createdSub = response.data.subscription;

          // تجهيز العضو ليطابق شكل IMember وإضافته للـ Signal فوراً
          const newMember: IMember = {
            id: createdUser.id,
            firstName: createdUser.firstName,
            lastName: createdUser.lastName,
            phoneNumber: createdUser.phoneNumber,
            email: createdUser.email,
            gender: createdUser.gender,
            dateOfBirth: createdUser.dateOfBirth,
            createdAt: createdUser.createdAt,
            subscriptions: createdSub ? [createdSub] : [],
          };

          this.membersSignal.update((current) => [newMember, ...current]);
        }),
        catchError((err) => {
          const errorMessage =
            err.error?.message || "Failed to register the new member";
          this.errorSignal.set(errorMessage);
          return throwError(() => err);
        }),
        finalize(() => {
          this.loadingSignal.set(false);
        }),
      );
  }

  updateMember(id: string, payload: IUpdateMemberRequest): Observable<any> {
    this.loadingSignal.set(true);
    return this.http
      .patch<{ message: string; data: any }>(
        `${this.endpoint}/${id}`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((res) => {
          const updated = res.data;
          this.membersSignal.update((list) =>
            list.map((m) =>
              m.id === id
                ? {
                    ...m,
                    ...updated,
                    subscriptions: m.subscriptions, // الحفاظ على اشتراكاته القائمة
                  }
                : m,
            ),
          );
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  deleteMember(id: string): Observable<any> {
    this.loadingSignal.set(true);
    return this.http
      .delete(`${this.endpoint}/${id}`, { withCredentials: true })
      .pipe(
        tap(() => {
          this.membersSignal.update((list) => list.filter((m) => m.id !== id));
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  renewSubscription(
    id: string,
    payload: IRenewSubscriptionRequest,
  ): Observable<any> {
    this.loadingSignal.set(true);
    return this.http
      .post<{ message: string; data: any }>(
        `${this.endpoint}/${id}/renew`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((res) => {
          const newSub = res.data;
          this.membersSignal.update((list) =>
            list.map((m) =>
              m.id === id
                ? {
                    ...m,
                    subscriptions: [newSub, ...(m.subscriptions || [])],
                  }
                : m,
            ),
          );
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }
}
