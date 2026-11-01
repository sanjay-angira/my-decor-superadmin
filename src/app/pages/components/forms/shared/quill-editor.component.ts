import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill';

@Component({
  selector: 'app-quill-editor',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuillEditorComponent),
      multi: true,
    },
  ],
  templateUrl: './quill-editor.component.html',
  styleUrl: './quill-editor.component.scss'
})
export class QuillEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editor', { static: true }) editorRef!: ElementRef<HTMLDivElement>;

  readonly label = input('Content');
  readonly required = input(false);
  readonly minHeight = input('150px');

  readonly focused = signal(false);

  private quill?: Quill;
  private pending = '';
  private disabled = false;
  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  private readonly toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ header: 1 }, { header: 2 }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ];

  ngAfterViewInit(): void {
    this.quill = new Quill(this.editorRef.nativeElement, {
      theme: 'snow',
      modules: { toolbar: this.toolbar },
    });

    if (this.minHeight()) {
      this.quill.root.style.minHeight = this.minHeight();
    }

    if (this.pending) {
      this.quill.root.innerHTML = this.pending;
    }

    this.quill.enable(!this.disabled);

    this.quill.on('text-change', () => {
      const html = this.quill?.root.innerHTML || '';
      const normalized = html === '<p><br></p>' ? '' : html;
      this.onChange(normalized);
    });
  }

  ngOnDestroy(): void {
    this.quill = undefined;
  }

  onFocusIn(): void {
    this.focused.set(true);
  }

  onFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget;
    const nextTarget = event.relatedTarget;
    if (wrapper instanceof HTMLElement && nextTarget instanceof Node && wrapper.contains(nextTarget)) {
      return;
    }

    this.focused.set(false);
    this.onTouched();
  }

  writeValue(value: string | null): void {
    const html = value || '';
    this.pending = html;
    if (this.quill && this.quill.root.innerHTML !== html) {
      this.quill.root.innerHTML = html || '';
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.quill?.enable(!isDisabled);
  }
}
