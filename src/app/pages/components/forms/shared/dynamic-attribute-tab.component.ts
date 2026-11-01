import { Component, input } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { QuillEditorComponent } from './quill-editor.component';
import type { FormConfigAttributeGroup } from './form-options.service';

@Component({
  selector: 'app-dynamic-attribute-tab',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    RadioButtonModule,
    SelectModule,
    QuillEditorComponent,
  ],
  templateUrl: './dynamic-attribute-tab.component.html',
  styleUrl: './dynamic-attribute-tab.component.scss',
})
export class DynamicAttributeTabComponent {
  readonly groups = input<FormConfigAttributeGroup[]>([]);
  readonly form = input.required<FormArray>();

  valuesForGroup(groupId: number): FormGroup[] {
    return this.form().controls.filter(
      (ctrl) => Number(ctrl.get('groupId')?.value) === groupId,
    ) as FormGroup[];
  }

  isChoiceAttribute(ctrl: AbstractControl): boolean {
    const displayType = String(ctrl.get('displayType')?.value || '');
    const options = (ctrl.get('options')?.value || []) as Array<{ id: number }>;
    return (
      options.length > 0 &&
      (displayType === 'dropdown' ||
        displayType === 'radio' ||
        displayType === 'swatch' ||
        displayType === 'image')
    );
  }

  isRichtext(ctrl: AbstractControl): boolean {
    return String(ctrl.get('displayType')?.value || '') === 'richtext';
  }

  isNumberInput(ctrl: AbstractControl): boolean {
    return (
      Boolean(String(ctrl.get('unit')?.value || '').trim()) &&
      !this.isChoiceAttribute(ctrl) &&
      !this.isRichtext(ctrl)
    );
  }
}
