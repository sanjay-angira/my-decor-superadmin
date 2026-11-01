import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormOptionsService, type SelectOption } from '../shared/form-options.service';
import { generateSlug } from '../shared/form-utils';

@Component({
  selector: 'app-add-tag-dialog',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule],
  templateUrl: './add-tag-dialog.component.html',
  styleUrl: './add-tag-dialog.component.scss',
})
export class AddTagDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly options = inject(FormOptionsService);

  readonly visible = input(false);
  readonly existingNames = input<string[]>([]);
  readonly visibleChange = output<boolean>();
  readonly created = output<SelectOption>();
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    tagName: ['', [Validators.required, Validators.minLength(2)]],
  });

  cancel(): void {
    this.onVisibleChange(false);
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.form.reset();
      this.error.set('');
    }
    this.visibleChange.emit(visible);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tagName = this.form.controls.tagName.value.trim();
    const exists = this.existingNames().some(
      (name) => name.toLowerCase() === tagName.toLowerCase(),
    );
    if (exists) {
      this.error.set('This tag already exists');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.options.createProductTag(tagName).subscribe({
      next: (res) => {
        const created = (res as { data?: Record<string, unknown> })?.data ?? res;
        const id = Number((created as { id?: number })?.id);
        if (!id) {
          this.saving.set(false);
          this.error.set('Tag was created but no id was returned');
          return;
        }
        this.saving.set(false);
        this.created.emit({
          label: String((created as { tagName?: string })?.tagName ?? tagName),
          value: id,
        });
        this.onVisibleChange(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to add tag');
      },
    });
  }

  slugPreview(): string {
    return generateSlug(this.form.controls.tagName.value);
  }
}
