import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, tap, of, map } from "rxjs";
import {
  IAuthUser,
  ILoginRequest,
  ILoginResponse,
} from "@gym-hub/data-access-models";
import { API_URL } from "../../../core/tokens/api.token";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);
  private readonly endpoint = `${this.apiUrl}/auth`;

  private currentUserSignal = signal<IAuthUser | null>(null);
  private isInitialCheckDone = false;

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === "ADMIN");

  login(credentials: ILoginRequest): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponse>(`${this.endpoint}/login`, credentials, {
        withCredentials: true, // ضروري لإرسال واستقبال الـ HttpOnly Cookies
      })
      .pipe(
        tap((response) => {
          this.currentUserSignal.set(response.user);
          this.isInitialCheckDone = true;
        }),
      );
  }

  logout(): Observable<{ message?: string }> {
    return this.http
      .post<{ message?: string }>(
        `${this.endpoint}/logout`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap(() => {
          this.currentUserSignal.set(null);
        }),
      );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.endpoint}/forgot-password`,
      { email },
    );
  }

  resetPassword(
    token: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.endpoint}/reset-password`,
      {
        token,
        newPassword,
      },
    );
  }

  getProfile(): Observable<IAuthUser | null> {
    // إذا فحصنا من قبل والمستخدم غير موجود، نرجع null فوراً دون طلب الـ API مجدداً
    if (this.isInitialCheckDone && !this.currentUserSignal()) {
      return of(null);
    }

    return this.http
      .get<{ message: string; user: IAuthUser }>(`${this.endpoint}/me`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.user),
        tap((user) => {
          this.currentUserSignal.set(user);
        }),
        catchError(() => {
          this.currentUserSignal.set(null);
          return of(null);
        }),
      );
  }

  setUser(user: IAuthUser | null) {
    this.currentUserSignal.set(user);
  }

  clearSession(): void {
    this.currentUserSignal.set(null);
  }
}
