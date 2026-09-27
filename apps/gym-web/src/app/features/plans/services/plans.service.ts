import { effect, inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  IPlan,
  IPlansResponse,
  IUpsertPlan,
  IUpsertPlanResponse,
} from "../models/plans.models";
import { finalize, Observable, tap } from "rxjs";
import { API_URL } from "../../../core/tokens/api.token";

@Injectable({
  providedIn: "root",
})
export class PlansService {
  private apiUrl = inject(API_URL);
  private http = inject(HttpClient);
  private readonly endpoint = `${this.apiUrl}/plans`;

  // Signals State
  private readonly plansSignal = signal<IPlan[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public Readonly Signals
  readonly plans = this.plansSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadPlans(): Observable<IPlansResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .get<IPlansResponse>(this.endpoint, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (res) => this.plansSignal.set(res.plans || []),
          error: (err) => {
            const message = Array.isArray(err.error?.message)
              ? err.error.message[0]
              : err.error?.message || err.message || "Failed to load plans";
            this.errorSignal.set(message);
          },
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  createPlan(dto: IUpsertPlan): Observable<IUpsertPlanResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<IUpsertPlanResponse>(this.endpoint, dto, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (res) =>
            this.plansSignal.update((plans) => [res.plan, ...plans]),
          error: (err) => {
            const message = Array.isArray(err.error?.message)
              ? err.error.message[0]
              : err.error?.message || err.message || "Failed to create plan";
            this.errorSignal.set(message);
          },
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  updatePlan(id: string, dto: IUpsertPlan): Observable<IUpsertPlanResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .patch<IUpsertPlanResponse>(`${this.endpoint}/${id}`, dto, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (res) => {
            const idx = this.plansSignal().findIndex((p) => p.id === id);

            if (idx === -1) {
              this.errorSignal.set("Plan not found in cache, reloading...");
            }

            this.plansSignal.update((current) =>
              current.map((item) => (item.id === id ? res.plan : item)),
            );
          },
          error: (err) => {
            const message = Array.isArray(err.error?.message)
              ? err.error.message[0]
              : err.error?.message || err.message || "Failed to update plan";
            this.errorSignal.set(message);
          },
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  deletePlan(id: string): Observable<{
    message: string;
  }> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .delete<{ message: string }>(`${this.endpoint}/${id}`, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (_res) => {
            const idx = this.plansSignal().findIndex((p) => p.id === id);

            if (idx === -1) {
              this.errorSignal.set("Plan not found in cache, reloading...");
            }

            this.plansSignal.update((current) =>
              current.filter((item) => item.id !== id),
            );
          },
          error: (err) => {
            const message = Array.isArray(err.error?.message)
              ? err.error.message[0]
              : err.error?.message || err.message || "Failed to delete plan";
            this.errorSignal.set(message);
          },
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
  }
}
