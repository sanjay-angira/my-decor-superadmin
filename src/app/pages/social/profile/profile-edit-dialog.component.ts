import { Component, inject, signal } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-profile-edit-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
  ],
  template: `
    <div class="dlg">
      <div class="dlg-head">
        <div class="dlg-title">
          <span class="dlg-icon"><i class="pi pi-user-edit" aria-hidden="true"></i></span>
          <h2>Update Profile</h2>
        </div>
        <button pButton [text]="true" [rounded]="true" type="button" class="close-btn" (click)="close()" aria-label="Close">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="dlg-content">
          @if (error()) {
            <div class="banner error">{{ error() }}</div>
          }

          <label class="prime-form-field full">
            <span>First Name *</span>
            <input pInputText formControlName="firstName" autocomplete="given-name" />
            @if (form.controls.firstName.hasError('required') && form.controls.firstName.touched) {
              <span class="field-error">First name is required</span>
            }
          </label>

          <label class="prime-form-field full">
            <span>Last Name</span>
            <input pInputText formControlName="lastName" autocomplete="family-name" />
          </label>

          <label class="prime-form-field full">
            <span>Phone</span>
            <input pInputText formControlName="phoneNumber" autocomplete="tel" />
          </label>
        </div>

        <div class="dlg-actions">
          <button pButton [text]="true" type="button" class="cancel-btn" (click)="close()">Cancel</button>
          <button pButton type="submit" class="submit-btn" [disabled]="saving()">
            @if (saving()) {
              <i class="pi pi-spin pi-spinner" aria-label="Saving"></i>
            } @else {
              Submit
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .dlg {
        --dlg-primary: var(--vr-primary);
        background: var(--vr-card);
      }
      .dlg-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0;
        padding: 0 12px 0 20px;
        height: 64px;
        background: var(--dlg-primary);
        color: var(--vr-white);
      }
      .dlg-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dlg-icon {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 999px;
        background: var(--vr-white-18);
      }
      .dlg-icon i {
        font-size: 18px;
      }
      .dlg-head h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      .close-btn {
        color: var(--vr-white) !important;
      }
      .dlg-content {
        display: grid;
        gap: 14px;
        padding: 24px;
        min-width: min(520px, 86vw);
      }
      .full {
        width: 100%;
      }
      .prime-form-field {
        display: grid;
        gap: 6px;
        color: var(--vr-text-secondary);
        font-size: 13px;
      }
      .prime-form-field input {
        width: 100%;
      }
      .field-error {
        color: var(--vr-danger-text);
      }
      .banner.error {
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--vr-danger-soft);
        border: 1px solid var(--vr-danger-border);
        color: var(--vr-danger-text);
        font-size: 13px;
      }
      .dlg-actions {
        display: flex;
        justify-content: flex-end;
        padding: 8px 24px 24px;
        gap: 8px;
      }
      .cancel-btn {
        color: var(--dlg-primary) !important;
        font-weight: 500;
      }
      .submit-btn {
        min-width: 110px;
        height: 40px;
        border-radius: 999px;
        background: var(--dlg-primary);
        color: var(--vr-white);
        font-weight: 600;
      }
      .submit-btn:disabled {
        opacity: 0.7;
      }
    `,
  ],
})
export class ProfileEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly dialogRef = inject(DynamicDialogRef);
  readonly data = inject(DynamicDialogConfig).data;

  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    firstName: [this.data?.firstName || '', Validators.required],
    lastName: [this.data?.lastName || ''],
    phoneNumber: [this.data?.phoneNumber || ''],
  });

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.data?.id) return;
    this.saving.set(true);
    this.error.set('');
    const payload = this.form.getRawValue();
    this.api.put(`/users/${this.data.id}`, payload).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        const user = res?.data ?? { ...this.data, ...payload };
        this.dialogRef.close({ message: 'User Updated Successfully', user });
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Update failed. Please try again.');
      },
    });
  }
}
