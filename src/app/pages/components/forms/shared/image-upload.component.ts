import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UploadService } from '../../../../core/services/upload.service';

@Component({
  selector: 'app-image-upload',
  imports: [ButtonModule, ProgressSpinnerModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUploadComponent),
      multi: true,
    },
  ],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
})
export class ImageUploadComponent implements ControlValueAccessor {
  private readonly upload = inject(UploadService);

  readonly label = input('Image');
  readonly path = input.required<string>();
  readonly required = input(false);
  readonly accept = input('image/*');
  /** When set, backend converts upload to WebP (banner/blog/category). */
  readonly imageType = input<string | undefined>(undefined);

  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly value = signal('');
  readonly previewError = signal(false);
  disabled = false;

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value || '');
    this.previewError.set(false);
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  isVideo(): boolean {
    return /\.(mp4|webm|mov)(\?|$)/i.test(this.value()) || this.accept().includes('video');
  }

  onPreviewError(): void {
    this.previewError.set(true);
  }

  clear(): void {
    this.value.set('');
    this.previewError.set(false);
    this.uploadError.set('');
    this.onChange('');
    this.onTouched();
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.disabled) return;
    this.uploading.set(true);
    this.uploadError.set('');
    this.upload.upload(file, this.path(), this.imageType()).subscribe({
      next: (res: any) => {
        const url = res?.data?.Location || res?.Location || res?.data?.url || '';
        this.value.set(url);
        this.previewError.set(false);
        this.onChange(url);
        this.onTouched();
        this.uploading.set(false);
        if (!url) this.uploadError.set('Upload succeeded but no URL was returned.');
      },
      error: (err: unknown) => {
        this.uploading.set(false);
        const message =
          err &&
          typeof err === 'object' &&
          'error' in err &&
          err.error &&
          typeof err.error === 'object' &&
          'message' in err.error
            ? String(err.error.message)
            : 'Upload failed';
        this.uploadError.set(message);
      },
    });
  }
}
