import {
  Component,
  OnInit,
  inject,
  signal,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatTableModule } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { PlansService } from "../../services/plans.service";

interface PlanTypeOption {
  label: string;
  value: "STANDARD" | "PREMIUM" | "VIP";
}

@Component({
  selector: "app-plans",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./plans.component.html",
  styleUrls: ["./plans.component.css"],
})
export class PlansComponent implements OnInit {
  protected readonly plansService = inject(PlansService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  @ViewChild("planDialog") planDialogTemplate!: TemplateRef<unknown>;

  private dialogRef: MatDialogRef<unknown> | null = null;
  readonly isSubmitting = signal<boolean>(false);

  readonly displayedColumns: string[] = [
    "name",
    "type",
    "duration",
    "price",
    "description",
  ];

  readonly planTypes: PlanTypeOption[] = [
    { label: "Standard", value: "STANDARD" },
    { label: "Premium", value: "PREMIUM" },
    { label: "VIP", value: "VIP" },
  ];

  planForm: FormGroup = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(3)]],
    type: ["STANDARD", [Validators.required]],
    duration: [1, [Validators.required, Validators.min(1)]],
    price: [null, [Validators.required, Validators.min(1)]],
    description: [""],
  });

  ngOnInit(): void {
    this.plansService.loadPlans().subscribe();
  }

  openCreateDialog(): void {
    this.planForm.reset({
      name: "",
      type: "STANDARD",
      duration: 1,
      price: null,
      description: "",
    });

    this.dialogRef = this.dialog.open(this.planDialogTemplate, {
      panelClass: "gym-custom-dialog",
      width: "540px",
      disableClose: true,
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  submitPlan(): void {
    if (this.planForm.invalid || this.isSubmitting()) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValues = this.planForm.value;

    this.plansService
      .createPlan({
        name: formValues.name,
        type: formValues.type,
        duration: Number(formValues.duration),
        price: Number(formValues.price),
        description: formValues.description || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeDialog();
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
