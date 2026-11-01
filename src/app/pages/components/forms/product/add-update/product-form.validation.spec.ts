import '@angular/compiler';
import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { jsonObjectValidator, trimmedMinimumLength } from './product-form.validation';

describe('product form validators', () => {
  it('requires trimmed text to meet the configured minimum length', () => {
    const validate = trimmedMinimumLength(2);

    expect(validate(new FormControl('  '))).toEqual({
      minlength: { requiredLength: 2, actualLength: 0 },
    });
    expect(validate(new FormControl(' a '))).toEqual({
      minlength: { requiredLength: 2, actualLength: 1 },
    });
    expect(validate(new FormControl(' ab '))).toBeNull();
  });

  it('accepts empty optional schema data and JSON objects', () => {
    expect(jsonObjectValidator(new FormControl(''))).toBeNull();
    expect(jsonObjectValidator(new FormControl('{"@type":"Product"}'))).toBeNull();
  });

  it('rejects malformed JSON and JSON values that are not objects', () => {
    for (const value of ['{', '[]', 'null', '"text"', '42']) {
      expect(jsonObjectValidator(new FormControl(value))).toEqual({
        jsonObject: true,
      });
    }
  });
});
