import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { AdminToastService } from '../../../../core/services/admin-toast.service';
import { FormOptionsService, type SelectOption } from '../../forms/shared/form-options.service';
import { generateSlug, normalizeIds } from '../../forms/shared/form-utils';

const SECTION_TYPES = [
  { label: 'Hero Banner', value: 'hero_banner' },
  { label: 'Newsletter', value: 'news_letter' },
  { label: 'Product Slider', value: 'product_slider' },
  { label: 'Category Slider', value: 'category_slider' },
  { label: 'Blog Section', value: 'blog_section' },
  { label: 'Offer Banner', value: 'offer_section' },
  { label: 'FAQ Section', value: 'faq_section' },
  { label: 'Review Section', value: 'review_section' },
  { label: 'Custom', value: 'custom' },
];

const CUSTOM_SECTIONS = [
  { label: 'Why Choose Vrindavan Rasa', value: 'why_choose' },
  { label: 'Recently Viewed Products', value: 'recently_viewed' },
];

@Component({
  selector: 'app-website-layout-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    ProgressSpinnerModule,
    SelectModule,
    ToggleSwitchModule,
  ],
  template: `
    <div class="vr-page">
      <div class="vr-page-header-band">
        <div class="vr-title-card">
          <div class="vr-title-left">
            <h1>{{ isEdit() ? 'Modify' : 'Add' }} section</h1>
            <div class="vr-breadcrumbs">
              <a routerLink="/admin/website-layout">
                <i class="pi pi-home"></i>
              </a>
              <span class="dot"></span>
              <a routerLink="/admin/website-layout">Website layout</a>
              <span class="dot"></span>
              <span>{{ isEdit() ? 'Modify' : 'Add' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="vr-page-content vr-form-content">
        <div class="vr-card vr-form-body">
          @if (loading()) {
            <div class="center"><p-progress-spinner [style]="{ width: '36px', height: '36px' }" /></div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="vr-form">
              <label class="prime-form-field">
                <span>Section title</span>
                <input pInputText formControlName="title" />
              </label>
              <label class="prime-form-field">
                <span>Slug</span>
                <input pInputText formControlName="slug" />
              </label>
              <label class="prime-form-field">
                <span>Type</span>
                <p-select [options]="types" optionLabel="label" optionValue="value" formControlName="type" />
              </label>
              @if (form.value.type === 'custom') {
                <label class="prime-form-field">
                  <span>Custom section</span>
                  <p-select [options]="customSections" optionLabel="label" optionValue="value" formControlName="customSection" />
                </label>
              }
              @if (form.value.type === 'hero_banner') {
                <label class="prime-form-field">
                  <span>Banner effect</span>
                  <p-select
                    [options]="[{ label: 'Fade', value: 'fade' }, { label: 'Slide', value: 'slide' }]"
                    optionLabel="label"
                    optionValue="value"
                    formControlName="bannerEffect"
                  />
                </label>
              } @else if (form.value.type !== 'custom') {
                <label class="prime-form-field">
                  <span>Display style</span>
                  <p-select
                    [options]="[
                      { label: 'Grid', value: 'grid' },
                      { label: 'Carousel', value: 'carousel' },
                      { label: 'List', value: 'list' }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    formControlName="displayStyle"
                  />
                </label>
              }
              <label class="prime-form-field">
                <span>Max products</span>
                <input pInputText type="number" formControlName="maxProducts" />
              </label>
              <label class="prime-form-field">
                <span>Eyebrow label</span>
                <input pInputText formControlName="subHeading" />
              </label>
              <label class="prime-form-field">
                <span>Heading</span>
                <input pInputText formControlName="heading" />
              </label>
              <label class="prime-form-field">
                <span>Accent word</span>
                <input pInputText formControlName="headingAccent" />
              </label>
              <label class="prime-form-field full">
                <span>Description</span>
                <textarea pInputText rows="3" formControlName="description"></textarea>
              </label>
              <label class="prime-form-field full">
                <span>Products</span>
                <p-multiselect [options]="products()" optionLabel="label" optionValue="value" formControlName="productIds" display="chip" />
              </label>
              <label class="prime-form-field full">
                <span>Categories</span>
                <p-multiselect [options]="categories()" optionLabel="label" optionValue="value" formControlName="categoryIds" display="chip" />
              </label>
              <label class="prime-form-field full">
                <span>Offers</span>
                <p-multiselect [options]="offers()" optionLabel="label" optionValue="value" formControlName="offerIds" display="chip" />
              </label>
              <label class="prime-form-field full">
                <span>Blogs</span>
                <p-multiselect [options]="blogs()" optionLabel="label" optionValue="value" formControlName="blogIds" display="chip" />
              </label>
              <label class="prime-form-field full">
                <span>FAQs</span>
                <p-multiselect [options]="faqs()" optionLabel="label" optionValue="value" formControlName="faqIds" display="chip" />
              </label>
              <label class="prime-form-field full">
                <span>Banners</span>
                <p-multiselect [options]="banners()" optionLabel="label" optionValue="value" formControlName="bannerIds" display="chip" />
              </label>
              <label class="prime-form-field full">
                <span>Reviews</span>
                <p-multiselect [options]="reviews()" optionLabel="label" optionValue="value" formControlName="reviewIds" display="chip" />
              </label>
              <label class="prime-form-toggle">
                <p-toggleswitch formControlName="status" />
                <span>Active</span>
              </label>

              <div class="actions">
                <button pButton type="submit" [disabled]="saving()">
                  {{ isEdit() ? 'Update section' : 'Create section' }}
                </button>
                <a pButton [outlined]="true" routerLink="/admin/website-layout">Cancel</a>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .center {
        display: grid;
        place-items: center;
        padding: 32px;
      }
    `,
  ],
})
export class WebsiteLayoutFormComponent {
  private readonly api = inject(ApiService);
  private readonly options = inject(FormOptionsService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(AdminToastService);

  readonly types = SECTION_TYPES;
  readonly customSections = CUSTOM_SECTIONS;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly products = signal<SelectOption[]>([]);
  readonly categories = signal<SelectOption[]>([]);
  readonly offers = signal<SelectOption[]>([]);
  readonly blogs = signal<SelectOption[]>([]);
  readonly faqs = signal<SelectOption[]>([]);
  readonly banners = signal<SelectOption[]>([]);
  readonly reviews = signal<SelectOption[]>([]);
  private id: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    slug: ['', Validators.required],
    type: ['product_slider', Validators.required],
    customSection: [''],
    status: [true],
    displayStyle: ['grid'],
    bannerEffect: ['fade'],
    maxProducts: [8],
    heading: [''],
    headingAccent: [''],
    subHeading: [''],
    description: [''],
    productIds: [[] as number[]],
    categoryIds: [[] as number[]],
    blogIds: [[] as number[]],
    offerIds: [[] as number[]],
    faqIds: [[] as number[]],
    bannerIds: [[] as number[]],
    reviewIds: [[] as number[]],
    position: [1],
  });

  constructor() {
    forkJoin({
      products: this.options.products(),
      categories: this.options.categories(),
      offers: this.options.offers(),
      blogs: this.options.blogs(),
      faqs: this.options.faqs(),
      banners: this.options.banners(),
      reviews: this.options.reviews(),
    }).subscribe((opts) => {
      this.products.set(opts.products);
      this.categories.set(opts.categories);
      this.offers.set(opts.offers);
      this.blogs.set(opts.blogs);
      this.faqs.set(opts.faqs);
      this.banners.set(opts.banners);
      this.reviews.set(opts.reviews);
    });

    this.form.controls.title.valueChanges.pipe(takeUntilDestroyed()).subscribe((title) => {
      if (!this.isEdit()) {
        this.form.controls.slug.setValue(generateSlug(title), { emitEvent: false });
      }
    });

    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.id = params.get('id');
      this.isEdit.set(!!this.id);
      if (!this.id) return;
      this.loading.set(true);
      this.api.get(`/cms-sections/${this.id}`).subscribe({
        next: (res) => {
          const section = res?.data ?? res;
          const data = section?.data ?? {};
          this.form.patchValue({
            title: section?.title || '',
            slug: section?.slug || generateSlug(section?.title || ''),
            type: section?.type || 'product_slider',
            customSection: String(data.customSection ?? data.sectionName ?? ''),
            status: Boolean(section?.status),
            displayStyle: String(data.displayStyle ?? 'grid'),
            bannerEffect: String(data.bannerEffect ?? 'fade') === 'slide' ? 'slide' : 'fade',
            maxProducts: Number(data.maxProducts ?? 8),
            heading: String(data.heading ?? ''),
            headingAccent: String(data.headingAccent ?? ''),
            subHeading: String(data.subHeading ?? ''),
            description: String(data.description ?? ''),
            productIds: normalizeIds(section?.products),
            categoryIds: normalizeIds(section?.categories),
            blogIds: normalizeIds(section?.blogs),
            offerIds: normalizeIds(section?.offers),
            faqIds: normalizeIds(section?.faqs),
            bannerIds: normalizeIds(section?.banners),
            reviewIds: normalizeIds(section?.reviews),
            position: section?.position ?? 1,
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      title: value.title,
      slug: value.slug.trim() || generateSlug(value.title),
      type: value.type,
      position: value.position,
      status: value.status,
      data: {
        displayStyle: value.displayStyle,
        bannerEffect: value.type === 'hero_banner' ? value.bannerEffect : undefined,
        maxProducts: value.maxProducts,
        heading: value.heading,
        headingAccent: value.headingAccent,
        subHeading: value.subHeading,
        description: value.description,
        ...(value.type === 'custom' && value.customSection
          ? { customSection: value.customSection }
          : {}),
      },
      productIds: value.productIds,
      categoryIds: value.categoryIds,
      blogIds: value.blogIds,
      offerIds: value.offerIds,
      faqIds: value.faqIds,
      bannerIds: value.bannerIds,
      reviewIds: value.reviewIds,
    };
    this.saving.set(true);
    const req = this.isEdit()
      ? this.api.put(`/cms-sections/${this.id}`, payload)
      : this.api.post('/cms-sections', payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Saved', 'OK', { duration: 2500 });
        this.router.navigateByUrl('/admin/website-layout');
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err?.error?.message || 'Save failed', 'Dismiss', { duration: 3500 });
      },
    });
  }
}
