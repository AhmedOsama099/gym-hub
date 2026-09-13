import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "gym-auth-layout",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="min-h-screen w-full flex bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-black"
    >
      <!-- Visual Banner (Desktop Only) -->
      <aside
        class="hidden lg:relative lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden border-r border-zinc-800/80"
      >
        <img
          src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1600&auto=format&fit=crop"
          alt="Gym Barbell Weights"
          class="absolute inset-0 h-full w-full object-cover object-center filter grayscale contrast-125 brightness-40"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"
        ></div>

        <!-- Top Branding -->
        <header class="relative z-10 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-black font-black text-xl shadow-lg shadow-amber-500/20"
          >
            G
          </div>
          <div>
            <span class="text-lg font-bold tracking-wider text-white"
              >GYM OPERATIONS</span
            >
            <span
              class="block text-xs font-medium text-amber-400 tracking-widest uppercase"
              >Hub Enterprise</span
            >
          </div>
        </header>

        <!-- Brand Footer Proposition -->
        <footer class="relative z-10 max-w-md space-y-4">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-zinc-300 backdrop-blur-md"
          >
            <span
              class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
            ></span>
            High-Performance Operations
          </div>
          <h2
            class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Precision, Power & Facility Management.
          </h2>
          <p class="text-sm text-zinc-400 leading-relaxed">
            Industrial-grade tools engineered for gym floor efficiency,
            recurring subscriptions, and member retention.
          </p>
        </footer>
      </aside>

      <!-- Dynamic Form Slot -->
      <main
        class="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 sm:px-12"
      >
        <div class="w-full max-w-md space-y-8">
          <!-- Mobile Brand Header -->
          <div class="flex flex-col items-center text-center lg:hidden mb-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-black font-black text-2xl shadow-xl shadow-amber-500/20 mb-2"
            >
              G
            </div>
            <h1 class="text-xl font-bold tracking-wider text-white">
              GYM OPERATIONS HUB
            </h1>
          </div>

          <ng-content></ng-content>
        </div>
      </main>
    </div>
  `,
})
export class AuthLayoutComponent {}
