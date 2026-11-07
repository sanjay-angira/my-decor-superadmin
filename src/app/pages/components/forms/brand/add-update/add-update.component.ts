import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { StepperModule } from 'primeng/stepper';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { normalizeIds } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-brand-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    StepperModule,
    ToggleSwitchModule,
    RouterLink,
    AdminFormShellComponent,
    ImageUploadComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class BrandFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly categories = signal<SelectOption[]>([]);
  readonly offers = signal<SelectOption[]>([]);
  readonly paths = UPLOAD_PATHS.brands;

  readonly metaTitleMax = 160;
  readonly metaDescMax = 300;

  readonly form = this.fb.nonNullable.group({
    brandName: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
    shortDescription: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    website: ['', Validators.pattern(/^https?:\/\/.+/i)],
    categoryIds: [[] as number[]],
    offerIds: [[] as number[]],
    metaTitle: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(this.metaTitleMax)]],
    metaDescription: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(this.metaDescMax)]],
    metaKeywords: [''],
    logo: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    this.options.categories().subscribe((rows) => this.categories.set(rows));
    this.options.offers().subscribe((rows) => this.offers.set(rows));

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.form.patchValue({
        brandName: String(data.brandName ?? ''),
        shortDescription: String(data.shortDescription ?? ''),
        website: String(data.website ?? ''),
        description: String(data.description ?? ''),
        metaTitle: String(data.metaTitle ?? ''),
        metaDescription: String(data.metaDescription ?? ''),
        metaKeywords: String(data.metaKeywords ?? ''),
        logo: String(data.logo ?? ''),
        categoryIds: normalizeIds(data.categoryIds ?? data.categories),
        offerIds: normalizeIds(data.offerIds ?? data.brandOffers ?? data.offers),
        isActive: data.isActive !== false,
      });
    });
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return (
        this.form.controls.brandName.valid &&
        this.form.controls.shortDescription.valid &&
        this.form.controls.description.valid &&
        this.form.controls.website.valid
      );
    }
    if (step === 3) {
      return (
        this.form.controls.metaTitle.valid &&
        this.form.controls.metaDescription.valid
      );
    }
    return true;
  }

  metaTitleLength(): number {
    return this.form.controls.metaTitle.value.length;
  }

  metaDescLength(): number {
    return this.form.controls.metaDescription.value.length;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const emptyToNull = (value: string) => value.trim() || null;
    this.saving.set(true);
    this.submitError.set('');
    this.crud
      .save(this.module(), this.recordId(), {
        brandName: v.brandName.trim(),
        shortDescription: v.shortDescription.trim(),
        website: emptyToNull(v.website),
        description: emptyToNull(v.description),
        metaTitle: v.metaTitle.trim(),
        metaDescription: v.metaDescription.trim(),
        metaKeywords: emptyToNull(v.metaKeywords),
        logo: emptyToNull(v.logo),
        categoryIds: v.categoryIds,
        offerIds: v.offerIds,
        isActive: v.isActive,
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
