import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

// Angular Material Modules
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";

// Services & Models
import { MembersService } from "../../services/members.service";
import { PlansService } from "../../../plans/services/plans.service";
import {
  GenderType,
  ICreateMemberRequest,
  IMember,
  SubscriptionStatus,
} from "../../models/member.models";
import { NotificationService } from "../../../../core/notification.service";

@Component({
  selector: "app-members-list",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: "./members-list.component.html",
  styleUrls: ["./members-list.component.css"],
})
export class MembersListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly membersService = inject(MembersService);
  private readonly plansService = inject(PlansService);
  private readonly notify = inject(NotificationService);

  @ViewChild("memberDialog") memberDialogTemplate!: TemplateRef<unknown>;
  private dialogRef: MatDialogRef<unknown> | null = null;

  // --- Enums متاحة للـ Template ---
  readonly GenderType = GenderType;
  readonly SubscriptionStatus = SubscriptionStatus;

  // --- الـ Signals الخاصة بالفلترة والبيانات ---
  readonly members = this.membersService.members;
  readonly loading = this.membersService.loading;
  readonly availablePlans = this.plansService.plans; // لقراءة الباقات للـ Dropdown

  readonly searchQuery = signal<string>("");
  readonly selectedStatus = signal<string>("ALL");
  readonly selectedPlan = signal<string>("ALL");
  readonly isSubmitting = signal<boolean>(false);

  // --- Computed Signals للحسابات والإحصائيات التلقائية ---
  readonly filteredMembers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const plan = this.selectedPlan();

    return this.members().filter((member) => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const phone = member.phoneNumber || "";
      const email = (member.email || "").toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        phone.includes(query) ||
        email.includes(query);

      const activeSub = member.subscriptions?.[0];
      const matchesStatus =
        status === "ALL" || (activeSub && activeSub.status === status);

      const matchesPlan =
        plan === "ALL" || (activeSub && activeSub.plan?.name === plan);

      return matchesSearch && matchesStatus && matchesPlan;
    });
  });

  readonly stats = computed(() => {
    const all = this.members();
    let active = 0;
    let expired = 0;
    let expiringSoon = 0;
    const now = new Date().getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    for (const m of all) {
      const sub = m.subscriptions?.[0];
      if (!sub) continue;

      if (sub.status === SubscriptionStatus.ACTIVE) {
        active++;
        const end = new Date(sub.endDate).getTime();
        if (end - now > 0 && end - now <= sevenDaysInMs) {
          expiringSoon++;
        }
      } else if (sub.status === SubscriptionStatus.EXPIRED) {
        expired++;
      }
    }

    return {
      total: all.length,
      active,
      expiringSoon,
      expired,
    };
  });

  // --- الـ Reactive Form لإنشاء عضو جديد ---
  memberForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
  }

  private initForm(): void {
    this.memberForm = this.fb.group({
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      phoneNumber: [
        "",
        [Validators.required, Validators.pattern(/^[0-9+ ]{9,15}$/)],
      ],
      email: ["", [Validators.email]],
      gender: [GenderType.MALE, [Validators.required]],
      dateOfBirth: [null, [Validators.required]],
      planId: ["", [Validators.required]],
      startDate: [new Date()],
    });
  }

  loadInitialData(): void {
    this.membersService.loadMembers().subscribe({
      error: () => this.notify.error("Failed to load gym members"),
    });
    this.plansService.loadPlans().subscribe({
      error: () => this.notify.error("Failed to load subscription plans"),
    });
  }

  // --- إدارة نافذة الإضافة (Dialog) ---
  openCreateModal(): void {
    this.memberForm.reset({
      gender: GenderType.MALE,
      startDate: new Date(),
    });

    this.dialogRef = this.dialog.open(this.memberDialogTemplate, {
      panelClass: "gym-custom-dialog",
      width: "600px",
      disableClose: true,
    });
  }

  closeCreateModal(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  submitMember(): void {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.memberForm.getRawValue();

    const payload: ICreateMemberRequest = {
      firstName: formVal.firstName.trim(),
      lastName: formVal.lastName.trim(),
      phoneNumber: formVal.phoneNumber.trim(),
      email: formVal.email ? formVal.email.trim() : undefined,
      gender: formVal.gender,
      dateOfBirth: new Date(formVal.dateOfBirth).toISOString(),
      planId: formVal.planId,
      startDate: formVal.startDate
        ? new Date(formVal.startDate).toISOString()
        : undefined,
    };

    this.membersService.createMember(payload).subscribe({
      next: () => {
        this.notify.success("Member and subscription created successfully!");
        this.isSubmitting.set(false);
        this.closeCreateModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || "Failed to save member";
        this.notify.error(Array.isArray(msg) ? msg[0] : msg);
      },
    });
  }

  // دوال سريعة لأحداث الفلترة
  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
  }

  onPlanChange(planName: string): void {
    this.selectedPlan.set(planName);
  }
}
