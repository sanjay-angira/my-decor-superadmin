import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UploadService } from '../../../../core/services/upload.service';

@Component({
  selector: 'app-multi-image-upload',
  imports: [ButtonModule, ProgressSpinnerModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiImageUploadComponent),
      multi: true,
    },
  ],
  templateUrl: './multi-image-upload.component.html',
  styleUrl: './multi-image-upload.component.scss',
})
export class MultiImageUploadComponent implements ControlValueAccessor {
  private readonly upload = inject(UploadService);

  readonly label = input('Images');
  readonly path = input.required<string>();
  readonly required = input(false);
  readonly uploading = signal(false);
  readonly uploadError = signal('');

  urls: string[] = [];
  private onChange: (v: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string[] | null): void {
    this.urls = Array.isArray(value) ? [...value] : [];
  }
  registerOnChange(fn: (v: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  remove(index: number): void {
    this.urls = this.urls.filter((_, i) => i !== index);
    this.onChange(this.urls);
    this.onTouched();
  }

  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    this.uploading.set(true);
    this.uploadError.set('');
    let remaining = files.length;
    files.forEach((file) => {
      this.upload.upload(file, this.path()).subscribe({
        next: (res: any) => {
          const url = res?.data?.Location || res?.Location || res?.data?.url || '';
          if (url) {
            this.urls = [...this.urls, url];
            this.onChange(this.urls);
          } else {
            this.uploadError.set('Upload succeeded but no URL was returned.');
          }
          remaining -= 1;
          if (remaining <= 0) this.uploading.set(false);
        },
        error: (error: unknown) => {
          remaining -= 1;
          if (remaining <= 0) this.uploading.set(false);
          const message =
            error &&
            typeof error === 'object' &&
            'error' in error &&
            error.error &&
            typeof error.error === 'object' &&
            'message' in error.error
              ? String(error.error.message)
              : 'Some uploads failed';
          this.uploadError.set(message);
        },
      });
    });
    this.onTouched();
  }
}
