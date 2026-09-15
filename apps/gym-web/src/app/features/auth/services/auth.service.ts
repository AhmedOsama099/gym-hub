import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, tap, of } from "rxjs";
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

  setUser(user: IAuthUser | null) {
    this.currentUserSignal.set(user);
  }

  getProfile(): Observable<IAuthUser | null> {
    return this.http
      .get<IAuthUser>(`${this.endpoint}/me`, {
        withCredentials: true,
      })
      .pipe(
        tap((user) => this.setUser(user)),
        catchError(() => {
          this.setUser(null);
          return of(null);
        }),
      );
  }
}
