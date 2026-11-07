import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

export type EditCategoryDialogData = {
  categoryName: string;
  categoryIcon?: string;
  existingCategories: string[];
};

@Component({
  selector: 'app-edit-category-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './edit-category-dialog.component.html',
  styleUrl: './edit-category-dialog.component.scss',
})
export class EditCategoryDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(DynamicDialogRef);
  readonly data: EditCategoryDialogData = inject(DynamicDialogConfig).data;

  readonly form = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required, this.uniqueCategoryValidator.bind(this)]],
    categoryIcon: ['folder'],
  });

  ngOnInit(): void {
    const iconValue = this.data?.categoryIcon?.trim().replace(/^mat:/i, '') || 'folder';
    this.form.patchValue({
      categoryName: this.data?.categoryName || '',
      categoryIcon: iconValue,
    });
  }

  uniqueCategoryValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value || '').trim();
    if (!value || value === this.data?.categoryName) {
      return null;
    }
    if (this.data?.existingCategories?.includes(value)) {
      return { categoryExists: true };
    }
    return null;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const categoryName = this.form.controls.categoryName.value.trim();
    const iconRaw = this.form.controls.categoryIcon.value.trim() || 'folder';
    const currentIcon = this.data?.categoryIcon?.trim().replace(/^mat:/i, '') || 'folder';
    const categoryIcon = `mat:${iconRaw}`;
    const nameUnchanged = categoryName === this.data.categoryName;
    const iconUnchanged = iconRaw === currentIcon;

    if (!categoryName || (nameUnchanged && iconUnchanged)) {
      this.dialogRef.close();
      return;
    }

    this.dialogRef.close({ categoryName, categoryIcon });
  }
}
