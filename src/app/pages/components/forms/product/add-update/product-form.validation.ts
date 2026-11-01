import { type ValidatorFn } from '@angular/forms';

export const jsonObjectValidator: ValidatorFn = (control) => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? null
      : { jsonObject: true };
  } catch {
    return { jsonObject: true };
  }
};

export const trimmedMinimumLength =
  (minimum: number): ValidatorFn =>
  (control) => {
    const value = String(control.value ?? '').trim();
    return value.length >= minimum
      ? null
      : { minlength: { requiredLength: minimum, actualLength: value.length } };
  };
