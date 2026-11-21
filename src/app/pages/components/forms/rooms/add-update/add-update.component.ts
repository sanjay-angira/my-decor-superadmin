import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { generateSlug, normalizeIds } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-room-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    ToggleSwitchModule,
    RouterLink,
    AdminFormShellComponent,
    ImageUploadComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class RoomFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);
  private slugManuallyDirty = false;

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly products = signal<SelectOption[]>([]);
  readonly imagePath = UPLOAD_PATHS.rooms;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.required, Validators.maxLength(255)]],
    image: [''],
    mobileImage: [''],
    isActive: [true],
    showOnHomePage: [false],
    sortOrder: [0, [Validators.min(0)]],
    productIds: [[] as number[]],
  });

  ngOnInit(): void {
    this.options.products().subscribe((products) => this.products.set(products));

    this.form.controls.name.valueChanges.subscribe((name) => {
      if (!this.isEdit() && !this.slugManuallyDirty) {
        this.form.controls.slug.setValue(generateSlug(name), { emitEvent: false });
      }
    });

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.slugManuallyDirty = true;
      this.form.patchValue({
        name: String(data.name ?? ''),
        slug: String(data.slug ?? ''),
        image: String(data.image ?? ''),
        mobileImage: String(data.mobileImage ?? ''),
        isActive: Boolean(data.isActive ?? true),
        showOnHomePage: Boolean(data.showOnHomePage ?? false),
        sortOrder: Number(data.sortOrder ?? 0),
        productIds: normalizeIds(data.productIds ?? data.products),
      });
    });
  }

  markSlugDirty(): void {
    this.slugManuallyDirty = true;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set('');
    this.crud
      .save(this.module(), this.recordId(), {
        name: value.name.trim(),
        slug: value.slug.trim(),
        image: value.image || null,
        mobileImage: value.mobileImage || null,
        isActive: value.isActive,
        showOnHomePage: value.showOnHomePage,
        sortOrder: Number(value.sortOrder),
        productIds: value.productIds,
      })
      .subscribe((result) => {
        this.saving.set(false);
        if (!result.success) {
          this.submitError.set(result.message);
          return;
        }
        this.crud.redirectToList(this.module());
      });
  }
}
