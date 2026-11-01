import { Component, inject, signal } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LoginService } from '../../../core/services/login.service';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile-password-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
  ],
  template: `
    <div class="dlg">
      <div class="dlg-head">
        <div class="dlg-title">
          <span class="dlg-icon"><i class="pi pi-lock" aria-hidden="true"></i></span>
          <h2>Change Password</h2>
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
            <span>Old Password *</span>
            <span class="password-field">
              <input pInputText formControlName="oldPassword" [type]="hideOld() ? 'password' : 'text'" autocomplete="current-password" />
              <button pButton [text]="true" [rounded]="true" type="button" [title]="hideOld() ? 'Show password' : 'Hide password'" (click)="hideOld.set(!hideOld())">
                <i [class]="hideOld() ? 'pi pi-eye' : 'pi pi-eye-slash'" aria-hidden="true"></i>
              </button>
            </span>
            @if (form.controls.oldPassword.hasError('required') && form.controls.oldPassword.touched) {
              <span class="field-error">Old password is required</span>
            }
          </label>

          <label class="prime-form-field full">
            <span>New Password *</span>
            <span class="password-field">
              <input pInputText formControlName="password" [type]="hideNew() ? 'password' : 'text'" autocomplete="new-password" />
              <button pButton [text]="true" [rounded]="true" type="button" [title]="hideNew() ? 'Show password' : 'Hide password'" (click)="hideNew.set(!hideNew())">
                <i [class]="hideNew() ? 'pi pi-eye' : 'pi pi-eye-slash'" aria-hidden="true"></i>
              </button>
            </span>
            @if (form.controls.password.hasError('required') && form.controls.password.touched) {
              <span class="field-error">New password is required</span>
            }
            @if (form.controls.password.hasError('minlength') && form.controls.password.touched) {
              <span class="field-error">Minimum 6 characters</span>
            }
          </label>

          <label class="prime-form-field full">
            <span>Confirm Password *</span>
            <span class="password-field">
              <input pInputText formControlName="confirmPassword" [type]="hideConfirm() ? 'password' : 'text'" autocomplete="new-password" />
              <button pButton [text]="true" [rounded]="true" type="button" [title]="hideConfirm() ? 'Show password' : 'Hide password'" (click)="hideConfirm.set(!hideConfirm())">
                <i [class]="hideConfirm() ? 'pi pi-eye' : 'pi pi-eye-slash'" aria-hidden="true"></i>
              </button>
            </span>
            @if (
              form.hasError('passwordMismatch') &&
              (form.controls.confirmPassword.touched || form.controls.confirmPassword.dirty)
            ) {
              <span class="field-error">Passwords do not match</span>
            }
          </label>

          <p class="hint">Use at least 6 characters. Avoid reusing your current password.</p>
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
        color: #fff;
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
        background: rgba(255, 255, 255, 0.18);
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
        color: #fff !important;
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
      .password-field {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .password-field input {
        flex: 1;
        min-width: 0;
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
      .hint {
        margin: 0;
        font-size: 12px;
        color: var(--vr-text-muted);
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
        color: #fff;
        font-weight: 600;
      }
      .submit-btn:disabled {
        opacity: 0.7;
      }
    `,
  ],
})
export class ProfilePasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly login = inject(LoginService);
  private readonly dialogRef = inject(DynamicDialogRef);
  readonly data = inject(DynamicDialogConfig, { optional: true })?.data;

  readonly saving = signal(false);
  readonly error = signal('');
  readonly hideOld = signal(true);
  readonly hideNew = signal(true);
  readonly hideConfirm = signal(true);

  readonly form = this.fb.nonNullable.group(
    {
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchPasswords }
  );

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid) return;
    const { oldPassword, password } = this.form.getRawValue();
    this.saving.set(true);
    this.login.changePassword({ oldPassword, newPassword: password }).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this.dialogRef.close({ message: res?.message || 'Password changed successfully' });
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Change password failed. Please try again.');
      },
    });
  }
}
