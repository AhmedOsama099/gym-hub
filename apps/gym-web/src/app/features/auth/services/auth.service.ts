import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import {
  IAuthUser,
  ILoginRequest,
  ILoginResponse,
} from "@gym-hub/data-access-models";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = "http://localhost:3000/api/auth";

  // حالة المستخدم الحالية عبر Signals
  private currentUserSignal = signal<IAuthUser | null>(null);

  // Read-only signals للاستخدام في الواجهات
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === "ADMIN");

  login(credentials: ILoginRequest): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponse>(`${this.baseUrl}/login`, credentials, {
        withCredentials: true, // ضروري لإرسال واستقبال الـ HttpOnly Cookies
      })
      .pipe(
        tap((response) => {
          this.currentUserSignal.set(response.user);
        }),
      );
  }

  logount(): Observable<{ message?: string }> {
    return this.http
      .post<{ message?: string }>(
        `${this.baseUrl}/logout`,
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

  setUser(user: IAuthUser | null) {
    this.currentUserSignal.set(user);
  }
}
