import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-offer-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    AdminFormShellComponent,
    ImageUploadComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class OfferFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);

  readonly uploadPath = UPLOAD_PATHS.offers;

  readonly form = this.fb.nonNullable.group({
    offerName: ['', [Validators.required, Validators.minLength(2)]],
    desktopImage: [''],
    tabletImage: [''],
    mobileImage: [''],
    discountType: ['percentage' as 'percentage' | 'fixed', Validators.required],
    discountValue: [0, Validators.required],
    timeBased: [false],
    startDateTime: [null as Date | null],
    endDateTime: [null as Date | null],
    isActive: [true],
  });

  ngOnInit(): void {
    this.form.controls.timeBased.valueChanges.subscribe(() => {
      this.updateDateValidators();
    });

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) {
      this.updateDateValidators();
      return;
    }
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.form.patchValue({
        offerName: String(data.offerName ?? ''),
        desktopImage: String(data.desktopImage ?? ''),
        tabletImage: String(data.tabletImage ?? ''),
        mobileImage: String(data.mobileImage ?? ''),
        discountType: (data.discountType ?? 'percentage') as 'percentage' | 'fixed',
        discountValue: Number(data.discountValue ?? 0),
        timeBased: Boolean(data.timeBased ?? false),
        startDateTime: this.parseDate(data.startDateTime ?? data.startDate),
        endDateTime: this.parseDate(data.endDateTime ?? data.endDate),
        isActive: Boolean(data.isActive ?? true),
      });
      this.updateDateValidators();
    });
  }

  private parseDate(value: unknown): Date | null {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private updateDateValidators(): void {
    const validator = this.form.controls.timeBased.value ? Validators.required : null;
    this.form.controls.startDateTime.setValidators(validator);
    this.form.controls.endDateTime.setValidators(validator);
    this.form.controls.startDateTime.updateValueAndValidity({ emitEvent: false });
    this.form.controls.endDateTime.updateValueAndValidity({ emitEvent: false });
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
        offerName: v.offerName,
        desktopImage: v.desktopImage || null,
        tabletImage: v.tabletImage || null,
        mobileImage: v.mobileImage || null,
        discountType: v.discountType,
        discountValue: Number(v.discountValue),
        timeBased: v.timeBased,
        isActive: v.isActive,
        ...(v.timeBased
          ? {
              startDate: v.startDateTime!.toISOString(),
              endDate: v.endDateTime!.toISOString(),
            }
          : {}),
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
