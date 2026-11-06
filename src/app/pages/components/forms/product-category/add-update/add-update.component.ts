import { Component, inject, input, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { QuillEditorComponent } from '../../shared/quill-editor.component';
import { normalizeIds, stripHtml } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-category-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    StepperModule,
    ToggleSwitchModule,
    AdminFormShellComponent,
    ImageUploadComponent,
    QuillEditorComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class CategoryFormComponent implements OnInit {
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

  readonly paths = UPLOAD_PATHS.categories;
  readonly shortDescMax = 500;
  readonly metaTitleMax = 70;
  readonly metaDescMax = 320;

  readonly form = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    shortDescription: ['', [Validators.required, Validators.maxLength(this.shortDescMax)]],
    description: ['', [this.quillRequired]],
    parentId: [null as number | null],
    offerIds: [[] as number[]],
    isActive: [true],
    showOnHomePage: [false],
    useAsHeroBanner: [false],
    image: [''],
    desktopBanner: [''],
    tabletBanner: [''],
    mobileBanner: [''],
    video: [''],
    seo: this.fb.nonNullable.group({
      metaTitle: ['', [Validators.required, Validators.maxLength(this.metaTitleMax)]],
      metaDescription: ['', [Validators.required, Validators.maxLength(this.metaDescMax)]],
      metaKeywords: [''],
      canonicalUrl: [''],
      focusKeyword: [''],
      secondaryKeywords: [''],
      robotsIndex: [true],
      robotsFollow: [true],
      metaRobots: [''],
      ogTitle: [''],
      ogDescription: [''],
      ogImage: [''],
      twitterCard: [''],
      twitterTitle: [''],
      twitterDescription: [''],
      twitterImage: [''],
      schemaType: ['CollectionPage'],
    }),
  });

  ngOnInit(): void {
    this.options.categories().subscribe((rows) => this.categories.set(rows));
    this.options.offers().subscribe((rows) => this.offers.set(rows));

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      const seo = data.seo ?? {};
      const parentIdRaw = data.parentId ?? data.parent?.id;
      this.form.patchValue({
        categoryName: String(data.categoryName ?? ''),
        shortDescription: String(data.shortDescription ?? ''),
        description: String(data.description ?? ''),
        parentId: parentIdRaw != null && parentIdRaw !== '' ? Number(parentIdRaw) : null,
        offerIds: normalizeIds(data.offerIds ?? data.categoryOffers),
        isActive: Boolean(data.isActive ?? true),
        showOnHomePage: Boolean(data.showOnHomePage ?? false),
        useAsHeroBanner: Boolean(data.useAsHeroBanner ?? false),
        image: String(data.image ?? data.desktopBanner ?? ''),
        desktopBanner: String(data.desktopBanner ?? data.desktopImage ?? data.image ?? ''),
        tabletBanner: String(data.tabletBanner ?? data.tabletImage ?? ''),
        mobileBanner: String(data.mobileBanner ?? ''),
        video: String(data.video ?? ''),
        seo: {
          metaTitle: String(seo.metaTitle ?? data.metaTitle ?? ''),
          metaDescription: String(seo.metaDescription ?? data.metaDescription ?? ''),
          metaKeywords: String(seo.metaKeywords ?? data.metaKeywords ?? ''),
          canonicalUrl: String(seo.canonicalUrl ?? ''),
          focusKeyword: String(seo.focusKeyword ?? ''),
          secondaryKeywords: Array.isArray(seo.secondaryKeywords)
            ? seo.secondaryKeywords.join(', ')
            : String(seo.secondaryKeywords ?? ''),
          robotsIndex: Boolean(seo.robotsIndex ?? true),
          robotsFollow: Boolean(seo.robotsFollow ?? true),
          metaRobots: String(seo.metaRobots ?? ''),
          ogTitle: String(seo.ogTitle ?? ''),
          ogDescription: String(seo.ogDescription ?? ''),
          ogImage: String(seo.ogImage ?? ''),
          twitterCard: String(seo.twitterCard ?? ''),
          twitterTitle: String(seo.twitterTitle ?? ''),
          twitterDescription: String(seo.twitterDescription ?? ''),
          twitterImage: String(seo.twitterImage ?? ''),
          schemaType: String(seo.schemaType ?? 'CollectionPage'),
        },
      });
    });
  }

  shortDescLength(): number {
    return this.form.controls.shortDescription.value.length;
  }

  metaTitleLength(): number {
    return this.form.controls.seo.controls.metaTitle.value.length;
  }

  metaDescLength(): number {
    return this.form.controls.seo.controls.metaDescription.value.length;
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return (
        this.form.controls.categoryName.valid &&
        this.form.controls.shortDescription.valid &&
        this.form.controls.description.valid
      );
    }
    if (step === 3) {
      return this.form.controls.seo.valid;
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
        categoryName: v.categoryName,
        shortDescription: v.shortDescription,
        description: v.description,
        parentId: v.parentId ? Number(v.parentId) : null,
        offerIds: v.offerIds,
        isActive: v.isActive,
        showOnHomePage: v.showOnHomePage,
        useAsHeroBanner: v.useAsHeroBanner,
        image: v.image || null,
        desktopBanner: v.desktopBanner || null,
        tabletBanner: v.tabletBanner || null,
        mobileBanner: v.mobileBanner || null,
        video: v.video || null,
        seo: {
          ...v.seo,
          secondaryKeywords: v.seo.secondaryKeywords
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean),
        },
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

  private quillRequired(control: AbstractControl): ValidationErrors | null {
    return stripHtml(String(control.value || '')) ? null : { required: true };
  }
}
