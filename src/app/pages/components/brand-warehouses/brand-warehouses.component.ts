import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

type WarehouseStatus =
  | 'PENDING'
  | 'REGISTERED'
  | 'FAILED'
  | 'RECONCILIATION_REQUIRED';

interface Warehouse {
  id: number;
  brandId: number;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  registeredName: string;
  returnAddress: string;
  returnPin: string;
  returnCity: string;
  returnState: string;
  returnCountry: string;
  registrationStatus: WarehouseStatus;
  registrationError: string | null;
  delhiveryWarehouseName: string | null;
  registeredAt: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

interface WarehouseField {
  key: string;
  label: string;
  type?: string;
  pattern?: string;
  maxLength: number;
}

const warehouseFields: WarehouseField[] = [
  { key: 'name', label: 'Warehouse name', maxLength: 120 },
  { key: 'contactName', label: 'Contact name', maxLength: 120 },
  { key: 'email', label: 'Email', type: 'email', maxLength: 254 },
  { key: 'phone', label: 'Indian mobile number', pattern: '[6-9][0-9]{9}', maxLength: 10 },
  { key: 'addressLine1', label: 'Address line 1', maxLength: 255 },
  { key: 'addressLine2', label: 'Address line 2', maxLength: 255 },
  { key: 'city', label: 'City', maxLength: 100 },
  { key: 'state', label: 'State', maxLength: 100 },
  { key: 'country', label: 'Country', maxLength: 100 },
  { key: 'pincode', label: 'PIN code', pattern: '[0-9]{6}', maxLength: 6 },
  { key: 'registeredName', label: 'Registered account name', maxLength: 150 },
  { key: 'returnAddress', label: 'Return address', maxLength: 500 },
  { key: 'returnPin', label: 'Return PIN code', pattern: '[0-9]{6}', maxLength: 6 },
  { key: 'returnCity', label: 'Return city', maxLength: 100 },
  { key: 'returnState', label: 'Return state', maxLength: 100 },
  { key: 'returnCountry', label: 'Return country', maxLength: 100 },
] as const;

const providerManagedFields = new Set([
  'name',
  'email',
  'phone',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'country',
  'pincode',
  'registeredName',
  'returnAddress',
  'returnPin',
  'returnCity',
  'returnState',
  'returnCountry',
]);

@Component({
  selector: 'app-brand-warehouses',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  templateUrl: './brand-warehouses.component.html',
  styleUrl: './brand-warehouses.component.scss',
})
export class BrandWarehousesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly fields = warehouseFields;
  readonly brandId = signal(0);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly actionBusy = signal(false);
  readonly editing = signal<Warehouse | null>(null);
  readonly error = signal('');
  readonly notice = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    contactName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    addressLine1: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    addressLine2: [''],
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
    isDefault: [false],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('brandId'));
    if (!Number.isInteger(id) || id <= 0) {
      this.loading.set(false);
      this.error.set('Invalid brand identifier.');
      return;
    }
    this.brandId.set(id);
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.api
      .get(`/admin/brands/${this.brandId()}/warehouses`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ApiResponse<Warehouse[]>) => {
          if (response.success === false) {
            this.error.set(response.message || 'Could not load warehouses.');
          } else {
            this.warehouses.set(Array.isArray(response.data) ? response.data : []);
            this.error.set('');
          }
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.errorMessage(error));
          this.loading.set(false);
        },
      });
  }

  startEdit(warehouse: Warehouse): void {
    this.editing.set(warehouse);
    this.form.reset({
      name: warehouse.name,
      contactName: warehouse.contactName,
      email: warehouse.email,
      phone: warehouse.phone,
      addressLine1: warehouse.addressLine1,
      addressLine2: warehouse.addressLine2 ?? '',
      city: warehouse.city,
      state: warehouse.state,
      country: warehouse.country,
      pincode: warehouse.pincode,
      registeredName: warehouse.registeredName,
      returnAddress: warehouse.returnAddress,
      returnPin: warehouse.returnPin,
      returnCity: warehouse.returnCity,
      returnState: warehouse.returnState,
      returnCountry: warehouse.returnCountry,
      isDefault: warehouse.isDefault,
      isActive: warehouse.isActive,
    });
    this.setProviderFieldsDisabled(warehouse.registrationStatus === 'REGISTERED');
    this.error.set('');
    this.notice.set('');
  }

  resetForm(): void {
    this.editing.set(null);
    this.form.reset({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      registeredName: '',
      returnAddress: '',
      returnPin: '',
      returnCity: '',
      returnState: '',
      returnCountry: 'India',
      isDefault: false,
      isActive: true,
    });
    this.setProviderFieldsDisabled(false);
    this.error.set('');
    this.notice.set('');
  }

  submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    const editing = this.editing();
    const values = this.form.getRawValue();
    const request = editing
      ? this.api.patch(`/admin/warehouses/${editing.id}`, values)
      : this.api.post(`/admin/brands/${this.brandId()}/warehouses`, values);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: ApiResponse<Warehouse>) => {
        if (response.success === false) {
          this.error.set(response.message || 'Could not save warehouse.');
        } else {
          this.notice.set(
            editing
              ? 'Warehouse details updated.'
              : response.data?.registrationStatus === 'REGISTERED'
                ? 'Warehouse registered with Delhivery.'
                : 'Warehouse was saved. Check its registration status below.',
          );
          this.resetForm();
        }
        this.saving.set(false);
        this.loadWarehouses();
      },
      error: (error: unknown) => {
        this.error.set(this.errorMessage(error));
        this.saving.set(false);
        this.loadWarehouses();
      },
    });
  }

  runAction(warehouse: Warehouse, action: 'default' | 'status' | 'sync'): void {
    if (this.actionBusy()) return;
    this.actionBusy.set(true);
    this.error.set('');
    this.notice.set('');
    let request;
    if (action === 'default') {
      request = this.api.patch(`/admin/warehouses/${warehouse.id}/default`, {});
    } else if (action === 'status') {
      request = this.api.patch(`/admin/warehouses/${warehouse.id}/status`, {
        isActive: !warehouse.isActive,
      });
    } else {
      request = this.api.post(`/admin/warehouses/${warehouse.id}/sync-delhivery`, {});
    }
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: ApiResponse<Warehouse>) => {
        if (response.success === false) {
          this.error.set(response.message || 'The warehouse action failed.');
        } else {
          this.notice.set(
            action === 'default'
              ? 'Default warehouse updated.'
              : action === 'status'
                ? 'Warehouse status updated.'
                : 'Delhivery registration completed.',
          );
        }
        this.actionBusy.set(false);
        this.loadWarehouses();
      },
      error: (error: unknown) => {
        this.error.set(this.errorMessage(error));
        this.actionBusy.set(false);
        this.loadWarehouses();
      },
    });
  }

  canRetry(warehouse: Warehouse): boolean {
    return warehouse.registrationStatus === 'FAILED';
  }

  private setProviderFieldsDisabled(disabled: boolean): void {
    for (const key of providerManagedFields) {
      const control = this.form.get(key);
      if (disabled) control?.disable({ emitEvent: false });
      else control?.enable({ emitEvent: false });
    }
  }

  private errorMessage(error: unknown): string {
    if (
      error &&
      typeof error === 'object' &&
      'error' in error &&
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error
    ) {
      const message = error.error.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join(', ');
    }
    return 'The request could not be completed.';
  }
}
