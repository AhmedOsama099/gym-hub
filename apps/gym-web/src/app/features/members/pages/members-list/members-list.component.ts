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

import { MembersService } from "../../services/members.service";
import { PlansService } from "../../../plans/services/plans.service";
import {
  GenderType,
  ICreateMemberRequest,
  IMember,
  IUpdateMemberRequest,
  IRenewSubscriptionRequest,
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
  @ViewChild("renewDialog") renewDialogTemplate!: TemplateRef<unknown>;
  @ViewChild("deleteConfirmDialog")
  deleteConfirmDialogTemplate!: TemplateRef<unknown>;

  private dialogRef: MatDialogRef<unknown> | null = null;

  readonly GenderType = GenderType;
  readonly SubscriptionStatus = SubscriptionStatus;

  readonly members = this.membersService.members;
  readonly loading = this.membersService.loading;
  readonly availablePlans = this.plansService.plans;

  readonly searchQuery = signal<string>("");
  readonly selectedStatus = signal<string>("ALL");
  readonly selectedPlan = signal<string>("ALL");
  readonly isSubmitting = signal<boolean>(false);

  // إدارة وضع الإضافة أو التعديل
  readonly isEditMode = signal<boolean>(false);
  readonly selectedMember = signal<IMember | null>(null);

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

    return { total: all.length, active, expiringSoon, expired };
  });

  memberForm!: FormGroup;
  renewForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadInitialData();
  }

  private initForms(): void {
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

    this.renewForm = this.fb.group({
      planId: ["", [Validators.required]],
      startDate: [new Date()],
    });
  }

  loadInitialData(): void {
    this.membersService.loadMembers().subscribe();
    this.plansService.loadPlans().subscribe();
  }

  // --- Modal: إضافة وتعديل العضو ---
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedMember.set(null);
    this.memberForm.reset({
      gender: GenderType.MALE,
      startDate: new Date(),
    });
    this.memberForm.get("planId")?.setValidators([Validators.required]);
    this.memberForm.get("planId")?.updateValueAndValidity();

    this.openDialog(this.memberDialogTemplate);
  }

  openEditModal(member: IMember): void {
    this.isEditMode.set(true);
    this.selectedMember.set(member);

    // في وضع التعديل لا نلزم الباقة لأنها تعديل بيانات شخصية
    this.memberForm.get("planId")?.clearValidators();
    this.memberForm.get("planId")?.updateValueAndValidity();

    this.memberForm.patchValue({
      firstName: member.firstName,
      lastName: member.lastName,
      phoneNumber: member.phoneNumber,
      email: member.email || "",
      gender: member.gender || GenderType.MALE,
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
    });

    this.openDialog(this.memberDialogTemplate);
  }

  submitMember(): void {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.memberForm.getRawValue();

    if (this.isEditMode()) {
      const memberId = this.selectedMember()!.id;
      const updatePayload: IUpdateMemberRequest = {
        firstName: formVal.firstName.trim(),
        lastName: formVal.lastName.trim(),
        phoneNumber: formVal.phoneNumber.trim(),
        email: formVal.email ? formVal.email.trim() : undefined,
        gender: formVal.gender,
        dateOfBirth: new Date(formVal.dateOfBirth).toISOString(),
      };

      this.membersService.updateMember(memberId, updatePayload).subscribe({
        next: () => {
          this.notify.success("Member profile updated successfully!");
          this.closeDialog();
        },
        error: (err) => this.handleError(err, "Failed to update member"),
      });
    } else {
      const createPayload: ICreateMemberRequest = {
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

      this.membersService.createMember(createPayload).subscribe({
        next: () => {
          this.notify.success("Member registered successfully!");
          this.closeDialog();
        },
        error: (err) => this.handleError(err, "Failed to create member"),
      });
    }
  }

  // --- Modal: تجديد الاشتراك ---
  openRenewModal(member: IMember): void {
    this.selectedMember.set(member);
    this.renewForm.reset({
      planId: member.subscriptions?.[0]?.plan ? "" : "",
      startDate: new Date(),
    });
    this.openDialog(this.renewDialogTemplate);
  }

  submitRenewal(): void {
    if (this.renewForm.invalid) {
      this.renewForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const memberId = this.selectedMember()!.id;
    const formVal = this.renewForm.getRawValue();

    const payload: IRenewSubscriptionRequest = {
      planId: formVal.planId,
      startDate: formVal.startDate
        ? new Date(formVal.startDate).toISOString()
        : undefined,
    };

    this.membersService.renewSubscription(memberId, payload).subscribe({
      next: () => {
        this.notify.success("Subscription renewed successfully!");
        this.closeDialog();
      },
      error: (err) => this.handleError(err, "Failed to renew subscription"),
    });
  }

  // --- Modal: تأكيد الحذف ---
  openDeleteModal(member: IMember): void {
    this.selectedMember.set(member);
    this.dialogRef = this.dialog.open(this.deleteConfirmDialogTemplate, {
      panelClass: "gym-custom-dialog",
      width: "450px", // عرض متطابق مع محتوى الحذف
      disableClose: true,
    });
  }

  confirmDelete(): void {
    const member = this.selectedMember();
    if (!member) return;

    this.isSubmitting.set(true);
    this.membersService.deleteMember(member.id).subscribe({
      next: () => {
        this.notify.success(
          `Member "${member.firstName}" deleted successfully`,
        );
        this.closeDialog();
      },
      error: (err) => this.handleError(err, "Failed to delete member"),
    });
  }

  private openDialog(template: TemplateRef<unknown>): void {
    this.dialogRef = this.dialog.open(template, {
      panelClass: "gym-custom-dialog",
      width: "580px",
      disableClose: true,
    });
  }

  closeDialog(): void {
    this.isSubmitting.set(false);
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  private handleError(err: any, fallback: string): void {
    this.isSubmitting.set(false);
    const msg = err.error?.message || fallback;
    this.notify.error(Array.isArray(msg) ? msg[0] : msg);
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
  }

  onPlanChange(planName: string): void {
    this.selectedPlan.set(planName);
  }
}
