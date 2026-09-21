import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ICreatePlan, IPlan } from "../models/plans.models";
import { finalize, Observable, tap } from "rxjs";
import { API_URL } from "../../../core/tokens/api.token";

@Injectable({
  providedIn: "root",
})
export class PlansService {
  constructor() {}

  private apiUrl = inject(API_URL);
  private http = inject(HttpClient);
  private readonly endpoint = `${this.apiUrl}/plans`;

  // Signals State
  private readonly plansSignal = signal<IPlan[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public Readonly Signals للمكونات
  readonly plans = this.plansSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadPlans(): Observable<IPlan[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<IPlan[]>(this.endpoint).pipe(
      tap({
        next: (data) => this.plansSignal.set(data),
        error: (err) =>
          this.errorSignal.set(err.message || "Failed to load plans"),
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  createPlan(dto: ICreatePlan): Observable<IPlan> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<IPlan>(this.endpoint, dto).pipe(
      tap({
        next: (data) => this.plansSignal.update((plans) => [...plans, data]),
        error: (err) =>
          this.errorSignal.set(err.message || "Failed to create plan"),
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }
}
