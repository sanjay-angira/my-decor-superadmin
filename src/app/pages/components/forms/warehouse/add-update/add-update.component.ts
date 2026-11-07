import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { ApiService } from '../../../../../core/services/api.service';

type WarehouseRecord = {
  id: number;
  registrationStatus: string;
  registrationError?: string | null;
  isActive: boolean;
  isDefault: boolean;
};

@Component({
  selector: 'app-warehouse-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    AdminFormShellComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class WarehouseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly api = inject(ApiService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly retrying = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly retryError = signal('');
  readonly registrationStatus = signal('');
  readonly registrationError = signal('');
  readonly isEdit = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    contactName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    addressLine1: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    addressLine2: ['', Validators.maxLength(255)],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    country: ['India', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    registeredName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    returnAddress: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    returnPin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    returnCity: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    returnState: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    returnCountry: ['India', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    isActive: [true],
    isDefault: [false],
  });

  ngOnInit(): void {
    const id = this.recordId();
    this.isEdit.set(Boolean(id));
    if (!id) return;

    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;

      this.registrationStatus.set(String(data.registrationStatus ?? ''));
      this.registrationError.set(String(data.registrationError ?? ''));
      this.form.patchValue({
        name: String(data.name ?? ''),
        contactName: String(data.contactName ?? ''),
        email: String(data.email ?? ''),
        phone: String(data.phone ?? ''),
        addressLine1: String(data.addressLine1 ?? ''),
        addressLine2: String(data.addressLine2 ?? ''),
        city: String(data.city ?? ''),
        state: String(data.state ?? ''),
        country: String(data.country ?? 'India'),
        pincode: String(data.pincode ?? ''),
        registeredName: String(data.registeredName ?? ''),
        returnAddress: String(data.returnAddress ?? ''),
        returnPin: String(data.returnPin ?? ''),
        returnCity: String(data.returnCity ?? ''),
        returnState: String(data.returnState ?? ''),
        returnCountry: String(data.returnCountry ?? 'India'),
        isActive: Boolean(data.isActive ?? true),
        isDefault: Boolean(data.isDefault ?? false),
      });
    });
  }

  get providerFieldsLocked(): boolean {
    return ['PENDING', 'REGISTERED'].includes(this.registrationStatus());
  }

  get canRetryRegistration(): boolean {
    return Boolean(this.recordId()) &&
      this.registrationStatus() === 'FAILED';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.recordId();
    const values = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set('');
    const request = id
      ? this.api.patch(`/admin/warehouses/${id}`, values)
      : this.api.post('/admin/warehouses', values);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.crud.redirectToList(this.module());
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.submitError.set(this.errorMessage(error, 'Could not save warehouse.'));
      },
    });
  }

  retryRegistration(): void {
    const id = this.recordId();
    if (!id || !this.canRetryRegistration || this.retrying()) return;

    this.retrying.set(true);
    this.retryError.set('');
    this.api.post(`/admin/warehouses/${id}/sync-delhivery`).subscribe({
      next: (response) => {
        this.retrying.set(false);
        const warehouse = response?.data as WarehouseRecord | undefined;
        if (warehouse) {
          this.registrationStatus.set(warehouse.registrationStatus);
          this.registrationError.set(warehouse.registrationError ?? '');
        }
        this.loadWarehouse(id);
      },
      error: (error: unknown) => {
        this.retrying.set(false);
        this.retryError.set(this.errorMessage(error, 'Warehouse registration retry failed.'));
        this.loadWarehouse(id);
      },
    });
  }

  private loadWarehouse(id: string): void {
    this.api.get(`/admin/warehouses/${id}`).subscribe({
      next: (response) => {
        const warehouse = response?.data as WarehouseRecord | undefined;
        if (!warehouse) return;
        this.registrationStatus.set(warehouse.registrationStatus);
        this.registrationError.set(warehouse.registrationError ?? '');
      },
      error: (error: unknown) => {
        this.retryError.set(this.errorMessage(error, 'Could not refresh warehouse status.'));
      },
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback;
    const response = 'error' in error ? error.error : null;
    const message = response && typeof response === 'object' && 'message' in response
      ? response.message
      : 'message' in error
        ? error.message
        : null;
    return Array.isArray(message) ? message.join(' ') : String(message || fallback);
  }
}
