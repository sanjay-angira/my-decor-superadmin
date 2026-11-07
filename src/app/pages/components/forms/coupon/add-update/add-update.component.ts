import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { normalizeIds, toDateInput } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-coupon-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    StepperModule,
    ToggleSwitchModule,
    AdminFormShellComponent,
    ImageUploadComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class CouponFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);
  private usersLoaded = false;

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly users = signal<SelectOption[]>([]);

  readonly uploadPath = UPLOAD_PATHS.coupons;

  readonly form = this.fb.nonNullable.group({
    couponCode: ['', [Validators.required, Validators.minLength(2)]],
    image: [''],
    discountType: ['percentage' as 'percentage' | 'fixed', Validators.required],
    discountValue: [0, Validators.required],
    timeBased: [false],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    isActive: [true],
    isUserSpecific: [false],
    userIds: [[] as number[]],
  });

  ngOnInit(): void {
    this.form.controls.isUserSpecific.valueChanges.subscribe((enabled) => {
      if (enabled) this.ensureUsersLoaded();
    });
    this.form.controls.timeBased.valueChanges.subscribe(() => this.updateDateValidators());
    this.updateDateValidators();

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      const isUserSpecific = Boolean(data.isUserSpecific ?? false);
      if (isUserSpecific) this.ensureUsersLoaded();
      this.form.patchValue({
        couponCode: String(data.couponCode ?? ''),
        image: String(data.image ?? ''),
        discountType: (data.discountType ?? 'percentage') as 'percentage' | 'fixed',
        discountValue: Number(data.discountValue ?? 0),
        timeBased: Boolean(data.timeBased ?? true),
        startDate: this.parseDate(data.startDate),
        endDate: this.parseDate(data.endDate),
        isActive: Boolean(data.isActive ?? true),
        isUserSpecific,
        userIds: normalizeIds(data.userIds ?? data.users),
      });
      this.updateDateValidators();
    });
  }

  private ensureUsersLoaded(): void {
    if (this.usersLoaded) return;
    this.usersLoaded = true;
    this.options.users().subscribe((rows) => this.users.set(rows));
  }

  private parseDate(value: unknown): Date | null {
    const dateInput = toDateInput(value);
    if (!dateInput) return null;
    const [year, month, day] = dateInput.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private formatDate(value: Date | null): string {
    if (!value) return '';
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private updateDateValidators(): void {
    const validator = this.form.controls.timeBased.value ? Validators.required : null;
    this.form.controls.startDate.setValidators(validator);
    this.form.controls.endDate.setValidators(validator);
    this.form.controls.startDate.updateValueAndValidity({ emitEvent: false });
    this.form.controls.endDate.updateValueAndValidity({ emitEvent: false });
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return this.form.controls.couponCode.valid &&
        this.form.controls.discountType.valid &&
        this.form.controls.discountValue.valid &&
        (!this.form.controls.timeBased.value || (
          this.form.controls.startDate.valid && this.form.controls.endDate.valid
        ));
    }

    if (step === 3) {
      return this.form.controls.startDate.valid && this.form.controls.endDate.valid;
    }

    return true;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set('');
    this.crud
      .save(this.module(), this.recordId(), {
        couponCode: v.couponCode.trim(),
        image: v.image || null,
        discountType: v.discountType,
        discountValue: Number(v.discountValue),
        timeBased: v.timeBased,
        ...(v.timeBased
          ? {
              startDate: this.formatDate(v.startDate),
              endDate: this.formatDate(v.endDate),
            }
          : {}),
        isActive: v.isActive,
        isUserSpecific: v.isUserSpecific,
        ...(v.isUserSpecific ? { userIds: v.userIds } : {}),
      })
      .subscribe((res) => {
        this.saving.set(false);
        if (!res.success) {
          this.submitError.set(res.message);
          return;
        }
        this.crud.redirectToList(this.module());
      });
  }
}
